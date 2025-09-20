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

    // Get all users in the semester
    const Semester = require('../models/Semester');
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Check if user is participant
    const isParticipant = semester.participants.some(
      p => p.user.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Get all semester participants except current user
    const participantIds = semester.participants
      .map(p => p.user)
      .filter(userId => userId.toString() !== currentUserId.toString());

    // Get all users who can chat
    const User = require('../models/User');
    const allUsers = await User.find({ _id: { $in: participantIds } })
      .select('name email avatar role studentId childName grade subjects')
      .sort({ role: 1, name: 1 });

    // Get existing conversations
    const existingConversations = await Message.aggregate([
      {
        $match: {
          semester: require('mongoose').Types.ObjectId(semesterId),
          $or: [
            { sender: require('mongoose').Types.ObjectId(currentUserId) },
            { recipient: require('mongoose').Types.ObjectId(currentUserId) }
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
      }
    ]);

    // Create conversation map from existing conversations
    const conversationMap = {};
    existingConversations.forEach(conv => {
      conversationMap[conv._id.toString()] = {
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt
        },
        unreadCount: conv.unreadCount
      };
    });

    // Build conversations array with all users
    const conversations = allUsers.map(user => {
      const existingConv = conversationMap[user._id.toString()];
      return {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        lastMessage: existingConv ? existingConv.lastMessage : {
          content: '開始對話',
          createdAt: new Date()
        },
        unreadCount: existingConv ? existingConv.unreadCount : 0
      };
    });

    // Sort: conversations with messages first, then by last message time or name
    conversations.sort((a, b) => {
      const hasMessageA = conversationMap[a.user._id.toString()] ? 1 : 0;
      const hasMessageB = conversationMap[b.user._id.toString()] ? 1 : 0;
      
      if (hasMessageA !== hasMessageB) {
        return hasMessageB - hasMessageA; // Users with messages first
      }
      
      if (hasMessageA && hasMessageB) {
        // Both have messages, sort by last message time
        return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
      }
      
      // Neither has messages, sort by name
      return a.user.name.localeCompare(b.user.name);
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
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
