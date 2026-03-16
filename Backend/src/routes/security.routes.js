import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import {
  changePassword,
  generate2FASecret,
  verify2FASetup,
  disable2FA,
  regenerateBackupCodes,
  verify2FALogin,
  get2FAStatus,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
  getActivityLog,
  deleteAccount,
} from '../controllers/security.controller.js';

const router = Router();

const rlSensitive = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'sec-sensitive' });
const rlRead = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30, keyPrefix: 'sec-read' });
const rl2FALogin = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'sec-2fa-login' });

// Password
router.post('/change-password', verifyToken, rlSensitive, changePassword);

// 2FA
router.get('/2fa/status', verifyToken, rlRead, get2FAStatus);
router.post('/2fa/generate', verifyToken, rlSensitive, generate2FASecret);
router.post('/2fa/verify-setup', verifyToken, rlSensitive, verify2FASetup);
router.post('/2fa/disable', verifyToken, rlSensitive, disable2FA);
router.post('/2fa/verify-login', rl2FALogin, verify2FALogin);
router.post('/backup-codes/regenerate', verifyToken, rlSensitive, regenerateBackupCodes);

// Sessions
router.get('/sessions', verifyToken, rlRead, listSessions);
router.delete('/sessions/:sessionId', verifyToken, rlSensitive, revokeSession);
router.delete('/sessions', verifyToken, rlSensitive, revokeAllOtherSessions);

// Activity Log
router.get('/activity-log', verifyToken, rlRead, getActivityLog);

// Delete Account
router.delete('/account', verifyToken, rlSensitive, deleteAccount);

export default router;
