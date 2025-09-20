const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  schoolYear: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: ''
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['teacher', 'parent', 'student'],
      required: true
    },
    studentId: {
      type: String,
      required: function() {
        return this.role === 'student' || this.role === 'parent';
      }
    }
  }],
  classes: [{
    name: {
      type: String,
      required: true
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }]
}, {
  timestamps: true
});

// Check if semester is currently active
semesterSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate && this.isActive;
};

// Get participants by role
semesterSchema.methods.getParticipantsByRole = function(role) {
  return this.participants.filter(participant => participant.role === role);
};

module.exports = mongoose.model('Semester', semesterSchema);
