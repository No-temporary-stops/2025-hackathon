const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'homework', 'announcement', 'question', 'event'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  replies: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    }
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create text index for search functionality
discussionSchema.index({ title: 'text', content: 'text', tags: 'text' });
discussionSchema.index({ semester: 1, lastActivity: -1 });

// Update last activity when a reply is added
discussionSchema.methods.addReply = function(author, content) {
  this.replies.push({
    author,
    content,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

// Increment view count
discussionSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Discussion', discussionSchema);
