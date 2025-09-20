const express = require('express');
const User = require('../models/User');
const Semester = require('../models/Semester');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all users in a semester
router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { role } = req.query;

    // Check if semester exists and user is a participant
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Get participant user IDs
    const participantIds = semester.participants.map(p => p.user);

    // Build query
    let query = { _id: { $in: participantIds } };

    if (role) {
      query.role = role;
    }

    // Get users
    const users = await User.find(query)
      .select('name email avatar role studentId childName grade subjects')
      .sort({ role: 1, name: 1 });

    // Group users by role
    const usersByRole = users.reduce((acc, user) => {
      if (!acc[user.role]) {
        acc[user.role] = [];
      }
      acc[user.role].push(user);
      return acc;
    }, {});

    res.json({
      users,
      usersByRole,
      total: users.length
    });
  } catch (error) {
    console.error('Get semester users error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q, role, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: '搜尋關鍵字至少需要2個字符' });
    }

    // Build query
    let query = {
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { childName: { $regex: q, $options: 'i' } }
      ],
      isActive: true
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('name email avatar role studentId childName grade')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get user profile by ID
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get teachers in a semester
router.get('/teachers/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Check if semester exists and user is a participant
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Get teacher participant IDs
    const teacherIds = semester.participants
      .filter(p => p.role === 'teacher')
      .map(p => p.user);

    const teachers = await User.find({ _id: { $in: teacherIds } })
      .select('name email avatar subjects')
      .sort({ name: 1 });

    res.json({ teachers });
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get parents in a semester
router.get('/parents/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Check if semester exists and user is a participant
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Get parent participant IDs
    const parentIds = semester.participants
      .filter(p => p.role === 'parent')
      .map(p => p.user);

    const parents = await User.find({ _id: { $in: parentIds } })
      .select('name email avatar childName')
      .sort({ name: 1 });

    res.json({ parents });
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get students in a semester
router.get('/students/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;

    // Check if semester exists and user is a participant
    const semester = await Semester.findById(semesterId);
    if (!semester) {
      return res.status(404).json({ message: '學期不存在' });
    }

    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Get student participant IDs
    const studentIds = semester.participants
      .filter(p => p.role === 'student')
      .map(p => p.user);

    const students = await User.find({ _id: { $in: studentIds } })
      .select('name email avatar studentId grade')
      .sort({ studentId: 1 });

    res.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
