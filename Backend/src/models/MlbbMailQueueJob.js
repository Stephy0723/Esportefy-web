import mongoose from 'mongoose';

const MlbbMailQueueJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['mlbb_review_request'],
      required: true,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {}
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'delivered', 'failed'],
      default: 'pending',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 5
    },
    nextAttemptAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    lockedAt: {
      type: Date,
      default: null
    },
    lockedBy: {
      type: String,
      default: ''
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    lastError: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

MlbbMailQueueJobSchema.index({ status: 1, nextAttemptAt: 1 });
MlbbMailQueueJobSchema.index({ status: 1, lockedAt: 1 });

export default mongoose.model('MlbbMailQueueJob', MlbbMailQueueJobSchema);
