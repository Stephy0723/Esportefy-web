import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    username: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String, default: '' },

    type: {
      type: String,
      enum: ['bug', 'suggestion', 'question', 'achievement'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'resolved', 'closed'],
      default: 'open',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },

    subject: { type: String, default: '' },
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },

    adminResponse: { type: String, default: '' },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    respondedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ status: 1, type: 1 });

export default mongoose.model('SupportTicket', SupportTicketSchema);
