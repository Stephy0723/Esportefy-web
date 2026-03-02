import AdminAuditLog from '../models/AdminAuditLog.js';

const extractIp = (req) => {
  if (!req) return '';
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return String(req.ip || req.socket?.remoteAddress || '');
};

export const recordAdminAudit = async ({
  actorUserId,
  action,
  entityType,
  entityId,
  meta = {},
  req
}) => {
  if (!actorUserId || !action || !entityType || !entityId) return;

  try {
    await AdminAuditLog.create({
      actorUserId,
      action,
      entityType,
      entityId: String(entityId),
      meta,
      ip: extractIp(req),
      userAgent: String(req?.headers?.['user-agent'] || '')
    });
  } catch (error) {
    // Audit logs must never break business flow.
    console.warn('No se pudo registrar auditoría admin:', error?.message || error);
  }
};
