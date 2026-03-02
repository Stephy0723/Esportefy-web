import mongoose from 'mongoose';

const AdminAuditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ip: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AdminAuditLog', AdminAuditLogSchema);
