import mongoose from 'mongoose';

const EVENTS = [
  'login', 'login_failed', 'logout',
  'password_change', 'email_change',
  '2fa_enabled', '2fa_disabled', 'backup_code_used',
  'session_revoked', 'sessions_revoked_all',
  'account_deleted',
];

const activityLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: { type: String, required: true, enum: EVENTS },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export default mongoose.model('ActivityLog', activityLogSchema);
