const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', [
  body('name').trim().notEmpty().withMessage('姓名為必填項目'),
  body('email').isEmail().normalizeEmail().withMessage('請輸入有效的電子郵件'),
  body('password').isLength({ min: 6 }).withMessage('密碼至少需要6個字符'),
  body('role').isIn(['teacher', 'parent', 'student']).withMessage('角色必須是老師、家長或學生'),
  body('studentId').if(body('role').equals('student')).notEmpty().withMessage('學生需要提供學號'),
  body('childName').if(body('role').equals('parent')).notEmpty().withMessage('家長需要提供子女姓名')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, studentId, childName, grade, subjects } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: '此電子郵件已被使用' });
    }

    // Create new user
    const userData = {
      name,
      email,
      password,
      role,
      ...(role === 'student' && { studentId, grade }),
      ...(role === 'parent' && { childName }),
      ...(role === 'teacher' && { subjects: subjects || [] })
    };

    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '註冊成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('請輸入有效的電子郵件'),
  body('password').notEmpty().withMessage('密碼為必填項目')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: '無效的登入憑證' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: '無效的登入憑證' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: '登入成功',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Update user profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('姓名不能為空'),
  body('email').optional().isEmail().normalizeEmail().withMessage('請輸入有效的電子郵件')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, avatar } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    res.json({ message: '個人資料更新成功', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
