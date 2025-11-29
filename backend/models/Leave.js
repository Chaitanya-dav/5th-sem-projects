import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employee: {
    type: String,
    ref: 'Employee',
    required: true
  },
  leaveType: {
    type: String,
    enum: ['vacation', 'sick', 'personal', 'maternity', 'paternity', 'wfh'],
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  comments: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    fileUrl: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  emergencyContact: String
}, {
  timestamps: true
});

// Virtual for calculating leave duration
leaveSchema.virtual('duration').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const timeDiff = end.getTime() - start.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
});

// Index for efficient queries
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });

export default mongoose.model('Leave', leaveSchema);