const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const Semester = require('../models/Semester');
const auth = require('../middleware/auth');

const router = express.Router();

// Send a new message
router.post('/send', auth, [
  body('recipientId').notEmpty().withMessage('收件人為必填項目'),
  body('content').trim().notEmpty().withMessage('訊息內容不能為空'),
  body('semesterId').notEmpty().withMessage('學期為必填項目')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipientId, content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.userId;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: '收件人不存在' });
    }

    // Check if semester exists and is active
    const semester = await Semester.findById(req.body.semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Create new message
    const message = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
      messageType,
      attachments,
      semester: req.body.semesterId
    });

    await message.save();

    // Populate sender and recipient details
    await message.populate([
      { path: 'sender', select: 'name email avatar role' },
      { path: 'recipient', select: 'name email avatar role' }
    ]);

    res.status(201).json({
      message: '訊息發送成功',
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get conversation between two users in a specific semester
router.get('/conversation/:userId/:semesterId', auth, async (req, res) => {
  try {
    const { userId, semesterId } = req.params;
    const currentUserId = req.userId;

    // Check if semester exists
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Get messages between current user and target user in this semester
    const messages = await Message.find({
      semester: semesterId,
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .populate('sender', 'name email avatar role')
    .populate('recipient', 'name email avatar role')
    .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get all conversations for current user in a semester
router.get('/conversations/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const currentUserId = req.userId;

    // Get current user's role and classes
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const currentUserParticipant = semester.participants.find(
      p => p.user.toString() === currentUserId.toString()
    );
    
    if (!currentUserParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    const currentUserRole = currentUserParticipant.role;
    const currentUserStudentId = currentUserParticipant.studentId;

    let conversations = [];

    if (currentUserRole === 'teacher') {
      // For teachers: get conversations with students and parents from their classes
      const teacherClasses = semester.classes.filter(
        c => c.teacher.toString() === currentUserId.toString()
      );

      for (const classInfo of teacherClasses) {
        // Get students from this class
        const students = await User.find({
          _id: { $in: classInfo.students }
        }).select('_id name email avatar role');

        // Get parents of students from this class
        const parentParticipantIds = semester.participants
          .filter(p => p.role === 'parent' && 
                      classInfo.students.some(s => s.toString() === p.user.toString()))
          .map(p => p.user);

        const parents = await User.find({
          _id: { $in: parentParticipantIds }
        }).select('_id name email avatar role');

        // Get conversations for this class
        const classConversations = await Message.aggregate([
          {
            $match: {
              semester: require('mongoose').Types.ObjectId(semesterId),
              $or: [
                {
                  $and: [
                    { sender: require('mongoose').Types.ObjectId(currentUserId) },
                    { recipient: { $in: [...classInfo.students, ...parentParticipantIds] } }
                  ]
                },
                {
                  $and: [
                    { recipient: require('mongoose').Types.ObjectId(currentUserId) },
                    { sender: { $in: [...classInfo.students, ...parentParticipantIds] } }
                  ]
                }
              ]
            }
          },
          {
            $group: {
              _id: {
                $cond: [
                  { $eq: ['$sender', require('mongoose').Types.ObjectId(currentUserId)] },
                  '$recipient',
                  '$sender'
                ]
              },
              lastMessage: { $last: '$$ROOT' },
              unreadCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$recipient', require('mongoose').Types.ObjectId(currentUserId)] },
                        { $eq: ['$isRead', false] }
                      ]
                    },
                    1,
                    0
                  ]
                }
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: '$user'
          },
          {
            $project: {
              user: {
                _id: '$user._id',
                name: '$user.name',
                email: '$user.email',
                avatar: '$user.avatar',
                role: '$user.role'
              },
              lastMessage: 1,
              unreadCount: 1,
              className: classInfo.name
            }
          }
        ]);

        conversations.push(...classConversations);
      }
    } else {
      // For students and parents: get conversations with their class teacher
      let classTeachers = [];
      
      if (currentUserRole === 'student') {
        // Find classes where this student is enrolled
        const studentClasses = semester.classes.filter(c => 
          c.students.some(s => s.toString() === currentUserId.toString())
        );
        classTeachers = studentClasses.map(c => c.teacher);
      } else if (currentUserRole === 'parent') {
        // Find classes where this parent's child is enrolled
        const childClasses = semester.classes.filter(c => 
          c.students.some(s => {
            const studentParticipant = semester.participants.find(p => 
              p.user.toString() === s.toString() && p.studentId === currentUserStudentId
            );
            return studentParticipant;
          })
        );
        classTeachers = childClasses.map(c => c.teacher);
      }

      // Get conversations with class teachers
      conversations = await Message.aggregate([
        {
          $match: {
            semester: require('mongoose').Types.ObjectId(semesterId),
            $or: [
              {
                $and: [
                  { sender: require('mongoose').Types.ObjectId(currentUserId) },
                  { recipient: { $in: classTeachers } }
                ]
              },
              {
                $and: [
                  { recipient: require('mongoose').Types.ObjectId(currentUserId) },
                  { sender: { $in: classTeachers } }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', require('mongoose').Types.ObjectId(currentUserId)] },
                '$recipient',
                '$sender'
              ]
            },
            lastMessage: { $last: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', require('mongoose').Types.ObjectId(currentUserId)] },
                      { $eq: ['$isRead', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              avatar: '$user.avatar',
              role: '$user.role'
            },
            lastMessage: 1,
            unreadCount: 1
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);
    }

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get conversations grouped by class for teachers
router.get('/conversations-by-class/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const currentUserId = req.userId;

    // Get current user's role
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const currentUserParticipant = semester.participants.find(
      p => p.user.toString() === currentUserId.toString()
    );
    
    if (!currentUserParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    const currentUserRole = currentUserParticipant.role;

    if (currentUserRole !== 'teacher') {
      return res.status(403).json({ message: '只有老師可以查看班級分類對話' });
    }

    // Get teacher's classes
    const teacherClasses = semester.classes.filter(
      c => c.teacher.toString() === currentUserId.toString()
    );

    const classConversations = [];

    for (const classInfo of teacherClasses) {
      // Get students from this class
      const students = await User.find({
        _id: { $in: classInfo.students }
      }).select('_id name email avatar role');

      // Get parents of students from this class
      const parentParticipantIds = semester.participants
        .filter(p => p.role === 'parent' && 
                    classInfo.students.some(s => s.toString() === p.user.toString()))
        .map(p => p.user);

      const parents = await User.find({
        _id: { $in: parentParticipantIds }
      }).select('_id name email avatar role');

      // Get conversations for this class
      const conversations = await Message.aggregate([
        {
          $match: {
            semester: require('mongoose').Types.ObjectId(semesterId),
            $or: [
              {
                $and: [
                  { sender: require('mongoose').Types.ObjectId(currentUserId) },
                  { recipient: { $in: [...classInfo.students, ...parentParticipantIds] } }
                ]
              },
              {
                $and: [
                  { recipient: require('mongoose').Types.ObjectId(currentUserId) },
                  { sender: { $in: [...classInfo.students, ...parentParticipantIds] } }
                ]
              }
            ]
          }
        },
        {
          $group: {
            _id: {
              $cond: [
                { $eq: ['$sender', require('mongoose').Types.ObjectId(currentUserId)] },
                '$recipient',
                '$sender'
              ]
            },
            lastMessage: { $last: '$$ROOT' },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$recipient', require('mongoose').Types.ObjectId(currentUserId)] },
                      { $eq: ['$isRead', false] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            user: {
              _id: '$user._id',
              name: '$user.name',
              email: '$user.email',
              avatar: '$user.avatar',
              role: '$user.role'
            },
            lastMessage: 1,
            unreadCount: 1
          }
        },
        {
          $sort: { 'lastMessage.createdAt': -1 }
        }
      ]);

      classConversations.push({
        className: classInfo.name,
        classId: classInfo._id,
        students: students,
        parents: parents,
        conversations: conversations,
        totalUnread: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
      });
    }

    res.json({ classConversations });
  } catch (error) {
    console.error('Get conversations by class error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get recent messages for dashboard
router.get('/recent/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { limit = 5 } = req.query;
    const currentUserId = req.userId;

    // Get current user's role and classes
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const currentUserParticipant = semester.participants.find(
      p => p.user.toString() === currentUserId.toString()
    );
    
    if (!currentUserParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    const currentUserRole = currentUserParticipant.role;
    const currentUserStudentId = currentUserParticipant.studentId;

    let messages = [];

    if (currentUserRole === 'teacher') {
      // For teachers: get recent messages from their classes
      const teacherClasses = semester.classes.filter(
        c => c.teacher.toString() === currentUserId.toString()
      );

      const allClassStudents = [];
      const allClassParents = [];

      for (const classInfo of teacherClasses) {
        allClassStudents.push(...classInfo.students);
        
        // Get parents of students from this class
        const parentParticipantIds = semester.participants
          .filter(p => p.role === 'parent' && 
                      classInfo.students.some(s => s.toString() === p.user.toString()))
          .map(p => p.user);
        allClassParents.push(...parentParticipantIds);
      }

      messages = await Message.find({
        semester: semesterId,
        $or: [
          {
            $and: [
              { sender: { $in: [...allClassStudents, ...allClassParents] } },
              { recipient: currentUserId }
            ]
          },
          {
            $and: [
              { sender: currentUserId },
              { recipient: { $in: [...allClassStudents, ...allClassParents] } }
            ]
          }
        ]
      })
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    } else {
      // For students and parents: get recent messages with their class teachers
      let classTeachers = [];
      
      if (currentUserRole === 'student') {
        // Find classes where this student is enrolled
        const studentClasses = semester.classes.filter(c => 
          c.students.some(s => s.toString() === currentUserId.toString())
        );
        classTeachers = studentClasses.map(c => c.teacher);
      } else if (currentUserRole === 'parent') {
        // Find classes where this parent's child is enrolled
        const childClasses = semester.classes.filter(c => 
          c.students.some(s => {
            const studentParticipant = semester.participants.find(p => 
              p.user.toString() === s.toString() && p.studentId === currentUserStudentId
            );
            return studentParticipant;
          })
        );
        classTeachers = childClasses.map(c => c.teacher);
      }

      messages = await Message.find({
        semester: semesterId,
        $or: [
          {
            $and: [
              { sender: { $in: classTeachers } },
              { recipient: currentUserId }
            ]
          },
          {
            $and: [
              { sender: currentUserId },
              { recipient: { $in: classTeachers } }
            ]
          }
        ]
      })
      .populate('sender', 'name avatar role')
      .populate('recipient', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    }

    res.json({ messages });
  } catch (error) {
    console.error('Get recent messages error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Mark messages as read
router.put('/read/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: '訊息不存在' });
    }

    // Check if current user is the recipient
    if (message.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: '無權限執行此操作' });
    }

    await message.markAsRead();

    res.json({ message: '訊息已標記為已讀' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Mark all messages in a conversation as read
router.put('/read-conversation/:userId/:semesterId', auth, async (req, res) => {
  try {
    const { userId, semesterId } = req.params;
    const currentUserId = req.userId;

    await Message.updateMany(
      {
        sender: userId,
        recipient: currentUserId,
        semester: semesterId,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ message: '對話中的所有訊息已標記為已讀' });
  } catch (error) {
    console.error('Mark conversation as read error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const currentUserId = req.userId;
    const { semesterId } = req.query;

    const query = {
      recipient: currentUserId,
      isRead: false
    };

    if (semesterId) {
      query.semester = semesterId;
    }

    const unreadCount = await Message.countDocuments(query);

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
