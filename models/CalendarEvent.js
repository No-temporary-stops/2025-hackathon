const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['高', '中', '低'],
    default: '中'
  },
  type: {
    type: String,
    enum: ['todo', 'event'],
    default: 'todo'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  link: {
    type: String,
    default: ''
  },
  linkText: {
    type: String,
    default: ''
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 驗證結束時間必須晚於開始時間
calendarEventSchema.pre('save', function(next) {
  if (this.end <= this.start) {
    next(new Error('結束時間必須晚於開始時間'));
  } else {
    next();
  }
});

// 添加索引以提高查詢性能
calendarEventSchema.index({ createdBy: 1, start: 1 });
calendarEventSchema.index({ semester: 1, start: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
