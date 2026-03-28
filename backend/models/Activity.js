import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: [true, 'Activity action is required'],
      trim: true,
    },
    user: {
      type: String,
      default: 'CEO',
      trim: true,
    },
    type: {
      type: String,
      enum: ['general', 'announcement', 'policy', 'performance', 'attendance'],
      default: 'general',
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Activity', activitySchema);
