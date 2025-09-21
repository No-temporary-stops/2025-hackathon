const express = require('express');
const { body, validationResult } = require('express-validator');
const CalendarEvent = require('../models/CalendarEvent');
const Semester = require('../models/Semester');
const auth = require('../middleware/auth');

const router = express.Router();

// 獲取用戶的日曆事件
router.get('/events', auth, async (req, res) => {
  try {
    const { semesterId, start, end } = req.query;
    
    let query = { user: req.userId };
    
    // 如果指定了學期，添加學期過濾
    if (semesterId) {
      query.semester = semesterId;
    }
    
    // 如果指定了日期範圍，添加日期過濾
    if (start && end) {
      query.start = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }
    
    const events = await CalendarEvent.find(query)
      .populate('semester', 'name schoolYear')
      .populate('createdBy', 'name avatar')
      .sort({ start: 1 });
    
    res.json({ events });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 創建新的日曆事件
router.post('/events', auth, [
  body('title').trim().notEmpty().withMessage('標題為必填項目'),
  body('start').isISO8601().withMessage('請輸入有效的開始時間'),
  body('end').isISO8601().withMessage('請輸入有效的結束時間'),
  body('priority').optional().isIn(['高', '中', '低']).withMessage('優先級必須是高、中或低'),
  body('type').optional().isIn(['todo', 'event']).withMessage('類型必須是待辦事項或活動'),
  body('semesterId').notEmpty().withMessage('學期為必填項目')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      title, 
      description, 
      start, 
      end, 
      priority, 
      type, 
      link, 
      linkText, 
      semesterId 
    } = req.body;

    // 驗證學期是否存在且用戶有權限
    const semester = await Semester.findOne({
      _id: semesterId,
      'participants.user': req.userId
    });

    if (!semester) {
      return res.status(403).json({ message: '您沒有權限在此學期創建事件' });
    }

    // 驗證時間
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (endDate <= startDate) {
      return res.status(400).json({ message: '結束時間必須晚於開始時間' });
    }

    // 創建事件
    const event = new CalendarEvent({
      title,
      description: description || '',
      start: startDate,
      end: endDate,
      priority: priority || '中',
      type: type || 'todo',
      link: link || '',
      linkText: linkText || '',
      semester: semesterId,
      user: req.userId,
      createdBy: req.userId
    });

    await event.save();
    
    // 填充相關數據
    await event.populate('semester', 'name schoolYear');
    await event.populate('createdBy', 'name avatar');

    res.status(201).json({
      message: '事件創建成功',
      event
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    if (error.message === '結束時間必須晚於開始時間') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
});

// 更新日曆事件
router.put('/events/:id', auth, [
  body('title').optional().trim().notEmpty().withMessage('標題不能為空'),
  body('start').optional().isISO8601().withMessage('請輸入有效的開始時間'),
  body('end').optional().isISO8601().withMessage('請輸入有效的結束時間'),
  body('priority').optional().isIn(['高', '中', '低']).withMessage('優先級必須是高、中或低'),
  body('type').optional().isIn(['todo', 'event']).withMessage('類型必須是待辦事項或活動')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    // 查找事件並驗證權限
    const event = await CalendarEvent.findOne({
      _id: id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: '事件不存在或您沒有權限修改' });
    }

    // 如果更新時間，需要驗證
    if (updateData.start || updateData.end) {
      const startDate = new Date(updateData.start || event.start);
      const endDate = new Date(updateData.end || event.end);
      
      if (endDate <= startDate) {
        return res.status(400).json({ message: '結束時間必須晚於開始時間' });
      }
    }

    // 更新事件
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('semester', 'name schoolYear')
    .populate('createdBy', 'name avatar');

    res.json({
      message: '事件更新成功',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Update calendar event error:', error);
    if (error.message === '結束時間必須晚於開始時間') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: '伺服器錯誤' });
    }
  }
});

// 刪除日曆事件
router.delete('/events/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findOne({
      _id: id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: '事件不存在或您沒有權限刪除' });
    }

    await CalendarEvent.findByIdAndDelete(id);

    res.json({ message: '事件刪除成功' });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 切換事件完成狀態
router.patch('/events/:id/toggle-complete', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const event = await CalendarEvent.findOne({
      _id: id,
      user: req.userId
    });

    if (!event) {
      return res.status(404).json({ message: '事件不存在或您沒有權限修改' });
    }

    event.isCompleted = !event.isCompleted;
    await event.save();

    await event.populate('semester', 'name schoolYear');
    await event.populate('createdBy', 'name avatar');

    res.json({
      message: '事件狀態更新成功',
      event
    });
  } catch (error) {
    console.error('Toggle complete error:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

module.exports = router;
