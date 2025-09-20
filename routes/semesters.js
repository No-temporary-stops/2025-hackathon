const express = require('express');
const { body, validationResult } = require('express-validator');
const Semester = require('../models/Semester');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new semester (admin/teacher only)
router.post('/create', auth, [
  body('name').trim().notEmpty().withMessage('學期名稱為必填項目'),
  body('startDate').isISO8601().withMessage('請輸入有效的開始日期'),
  body('endDate').isISO8601().withMessage('請輸入有效的結束日期'),
  body('schoolYear').trim().notEmpty().withMessage('學年度為必填項目')
], async (req, res) => {
  try {
    // Only teachers can create semesters
    if (req.userRole !== 'teacher') {
      return res.status(403).json({ message: '只有老師可以創建學期' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, startDate, endDate, schoolYear, description } = req.body;

    // Check if dates are valid
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: '結束日期必須晚於開始日期' });
    }

    const semester = new Semester({
      name,
      startDate,
      endDate,
      schoolYear,
      description: description || '',
      participants: [{
        user: req.userId,
        role: 'teacher'
      }]
    });

    await semester.save();

    res.status(201).json({
      message: '學期創建成功',
      semester
    });
  } catch (error) {
    console.error('Create semester error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get all semesters for current user
router.get('/my-semesters', auth, async (req, res) => {
  try {
    const { includeArchived = false } = req.query;
    
    let query = {
      'participants.user': req.userId
    };

    // If not including archived, only show active semesters
    if (!includeArchived) {
      const now = new Date();
      query = {
        ...query,
        startDate: { $lte: now },
        endDate: { $gte: now },
        isActive: true
      };
    }

    const semesters = await Semester.find(query)
      .populate('participants.user', 'name email avatar role')
      .sort({ startDate: -1 });

    // Add priority information based on semester status
    const semestersWithPriority = semesters.map(semester => {
      const isCurrentlyActive = semester.isCurrentlyActive();
      return {
        ...semester.toObject(),
        isCurrentlyActive,
        priority: isCurrentlyActive ? 'high' : 'low'
      };
    });

    res.json({ semesters: semestersWithPriority });
  } catch (error) {
    console.error('Get my semesters error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get active semesters only
router.get('/active', auth, async (req, res) => {
  try {
    const now = new Date();
    const activeSemesters = await Semester.find({
      'participants.user': req.userId,
      startDate: { $lte: now },
      endDate: { $gte: now },
      isActive: true
    })
    .populate('participants.user', 'name email avatar role')
    .sort({ startDate: -1 });

    res.json({ semesters: activeSemesters });
  } catch (error) {
    console.error('Get active semesters error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get archived semesters
router.get('/archived', auth, async (req, res) => {
  try {
    const now = new Date();
    const archivedSemesters = await Semester.find({
      'participants.user': req.userId,
      $or: [
        { endDate: { $lt: now } },
        { isActive: false }
      ]
    })
    .populate('participants.user', 'name email avatar role')
    .sort({ endDate: -1 });

    res.json({ semesters: archivedSemesters });
  } catch (error) {
    console.error('Get archived semesters error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Add participant to semester
router.post('/:semesterId/add-participant', auth, [
  body('userId').notEmpty().withMessage('用戶ID為必填項目'),
  body('role').isIn(['teacher', 'parent', 'student']).withMessage('角色必須是老師、家長或學生'),
  body('studentId').if(body('role').not().equals('teacher')).notEmpty().withMessage('學生或家長需要提供學號')
], async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { userId, role, studentId } = req.body;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Check if current user is a teacher in this semester
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: '只有老師可以添加參與者' });
    }

    // Check if user is already a participant
    const existingParticipant = semester.participants.find(
      p => p.user.toString() === userId
    );

    if (existingParticipant) {
      return res.status(400).json({ message: '用戶已經是此學期的參與者' });
    }

    // Add new participant
    semester.participants.push({
      user: userId,
      role,
      studentId: role !== 'teacher' ? studentId : undefined
    });

    await semester.save();

    // Populate the new participant
    await semester.populate('participants.user', 'name email avatar role');

    res.json({
      message: '參與者添加成功',
      semester
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Remove participant from semester
router.delete('/:semesterId/remove-participant/:userId', auth, async (req, res) => {
  try {
    const { semesterId, userId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Check if current user is a teacher in this semester
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: '只有老師可以移除參與者' });
    }

    // Remove participant
    semester.participants = semester.participants.filter(
      p => p.user.toString() !== userId
    );

    await semester.save();

    res.json({ message: '參與者移除成功' });
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Archive semester
router.put('/:semesterId/archive', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Check if current user is a teacher in this semester
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: '只有老師可以封存學期' });
    }

    semester.isActive = false;
    await semester.save();

    res.json({ message: '學期已封存' });
  } catch (error) {
    console.error('Archive semester error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get semester details
router.get('/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    const semester = await Semester.findById(semesterId)
      .populate('participants.user', 'name email avatar role')
      .populate('classes.teacher', 'name email avatar');

    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    // Check if current user is a participant
    const isParticipant = semester.participants.some(
      p => p.user._id.toString() === req.userId
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    res.json({ semester });
  } catch (error) {
    console.error('Get semester details error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
