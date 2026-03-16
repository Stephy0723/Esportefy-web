import ActivityLog from '../models/ActivityLog.js';

export const recordActivity = async ({ userId, event, meta = {}, req = null }) => {
  try {
    await ActivityLog.create({
      userId,
      event,
      meta,
      ip: req?.ip || req?.headers?.['x-forwarded-for'] || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (_) {
    // Fire-and-forget: never break business logic
  }
};
