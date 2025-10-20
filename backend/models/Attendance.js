import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  clockIn: {
    type: String, // Store as "HH:MM" format
    required: true
  },
  clockOut: {
    type: String // Store as "HH:MM" format
  },
  totalHours: {
    type: Number,
    min: 0,
    max: 24
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'holiday', 'weekend'],
    default: 'present'
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    enum: ['office', 'remote', 'client_site'],
    default: 'office'
  },
  lateMinutes: {
    type: Number,
    default: 0
  },
  overtimeMinutes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Calculate total hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const [inHours, inMinutes] = this.clockIn.split(':').map(Number);
    const [outHours, outMinutes] = this.clockOut.split(':').map(Number);
    
    const totalMinutes = (outHours * 60 + outMinutes) - (inHours * 60 + inMinutes);
    this.totalHours = parseFloat((totalMinutes / 60).toFixed(2));
  }
  next();
});

export default mongoose.model('Attendance', attendanceSchema);