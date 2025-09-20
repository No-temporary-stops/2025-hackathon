const express = require('express');
const { body, validationResult } = require('express-validator');
const Discussion = require('../models/Discussion');
const Semester = require('../models/Semester');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a new discussion
router.post('/create', auth, [
  body('title').trim().notEmpty().withMessage('討論串標題為必填項目'),
  body('content').trim().notEmpty().withMessage('討論串內容為必填項目'),
  body('semesterId').notEmpty().withMessage('學期為必填項目'),
  body('category').optional().isIn(['general', 'homework', 'announcement', 'question', 'event'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, semesterId, category = 'general', tags = [] } = req.body;

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

    // Create new discussion
    const discussion = new Discussion({
      title,
      content,
      author: req.userId,
      semester: semesterId,
      category,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean)
    });

    await discussion.save();

    // Populate author details
    await discussion.populate('author', 'name email avatar role');

    res.status(201).json({
      message: '討論串創建成功',
      discussion
    });
  } catch (error) {
    console.error('Create discussion error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get discussions for a semester
router.get('/semester/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { page = 1, limit = 10, category, search } = req.query;

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

    // Build query
    let query = { semester: semesterId };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Get discussions with pagination
    const discussions = await Discussion.find(query)
      .populate('author', 'name email avatar role')
      .sort({ isPinned: -1, lastActivity: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Discussion.countDocuments(query);

    res.json({
      discussions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get discussions error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Get discussion details
router.get('/:discussionId', auth, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId)
      .populate('author', 'name email avatar role')
      .populate('replies.author', 'name email avatar role');

    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if user is a participant in the semester
    const semester = await Semester.findById(discussion.semester);
    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Increment view count
    await discussion.incrementViews();

    res.json({ discussion });
  } catch (error) {
    console.error('Get discussion details error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Add reply to discussion
router.post('/:discussionId/reply', auth, [
  body('content').trim().notEmpty().withMessage('回覆內容不能為空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { discussionId } = req.params;
    const { content } = req.body;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if discussion is closed
    if (discussion.isClosed) {
      return res.status(400).json({ message: '此討論串已關閉' });
    }

    // Check if user is a participant in the semester
    const semester = await Semester.findById(discussion.semester);
    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    // Add reply
    await discussion.addReply(req.userId, content);

    // Get updated discussion with populated replies
    const updatedDiscussion = await Discussion.findById(discussionId)
      .populate('author', 'name email avatar role')
      .populate('replies.author', 'name email avatar role');

    res.json({
      message: '回覆添加成功',
      discussion: updatedDiscussion
    });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Search discussions
router.get('/search/:semesterId', auth, async (req, res) => {
  try {
    const { semesterId } = req.params;
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: '搜尋關鍵字至少需要2個字符' });
    }

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

    // Search discussions using text index
    const discussions = await Discussion.find(
      {
        semester: semesterId,
        $text: { $search: q }
      },
      { score: { $meta: 'textScore' } }
    )
    .populate('author', 'name email avatar role')
    .sort({ score: { $meta: 'textScore' }, lastActivity: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Discussion.countDocuments({
      semester: semesterId,
      $text: { $search: q }
    });

    res.json({
      discussions,
      searchQuery: q,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search discussions error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Pin/Unpin discussion (teacher only)
router.put('/:discussionId/pin', auth, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if user is a teacher in the semester
    const semester = await Semester.findById(discussion.semester);
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: '只有老師可以置頂討論串' });
    }

    discussion.isPinned = !discussion.isPinned;
    await discussion.save();

    res.json({
      message: discussion.isPinned ? '討論串已置頂' : '討論串已取消置頂',
      isPinned: discussion.isPinned
    });
  } catch (error) {
    console.error('Pin discussion error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Close/Open discussion (teacher only)
router.put('/:discussionId/close', auth, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if user is a teacher in the semester
    const semester = await Semester.findById(discussion.semester);
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isTeacher) {
      return res.status(403).json({ message: '只有老師可以關閉討論串' });
    }

    discussion.isClosed = !discussion.isClosed;
    await discussion.save();

    res.json({
      message: discussion.isClosed ? '討論串已關閉' : '討論串已重新開放',
      isClosed: discussion.isClosed
    });
  } catch (error) {
    console.error('Close discussion error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Increment view count
router.post('/:discussionId/view', auth, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if user is a participant in the semester
    const semester = await Semester.findById(discussion.semester);
    const isParticipant = semester.participants.some(
      p => p.user.toString() === req.userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: '您不是此學期的參與者' });
    }

    await discussion.incrementViews();

    res.json({ message: '瀏覽次數已更新' });
  } catch (error) {
    console.error('Increment view error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// Delete discussion (author or teacher only)
router.delete('/:discussionId', auth, async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ message: '討論串不存在' });
    }

    // Check if user is the author or a teacher in the semester
    const semester = await Semester.findById(discussion.semester);
    const isAuthor = discussion.author.toString() === req.userId;
    const isTeacher = semester.participants.some(
      p => p.user.toString() === req.userId.toString() && p.role === 'teacher'
    );

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: '您沒有權限刪除此討論串' });
    }

    await Discussion.findByIdAndDelete(discussionId);

    res.json({ message: '討論串已刪除' });
  } catch (error) {
    console.error('Delete discussion error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
