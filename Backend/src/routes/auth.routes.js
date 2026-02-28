// Backend/src/routes/auth.routes.js

import { Router } from 'express';
import {
  register,
  checkPhoneAvailability,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  updateProfile,
  applyOrganizer,
  verifyOrganizerAction,
  upload
} from '../controllers/auth.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

import {
  discordAuthStart,
  discordCallback,
  unlinkDiscord
} from '../controllers/discord.controller.js';

import {
  initRiotLink,
  confirmRiotLink,
  unlinkRiotAccount,
  syncRiotNow,
  validateRiotId,
  riotStatus
} from '../controllers/riot.controller.js';
import {
  validateMlbbId,
  linkMlbbAccount,
  unlinkMlbbAccount,
  mlbbStatus,
  listPendingMlbbReviews,
  reviewMlbbLink,
  mlbbOpsStatus,
  processMlbbOpsQueue
} from '../controllers/mlbb.controller.js';

const router = Router();

const rlLogin = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'login' });
const rlRegister = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'register' });
const rlCheckPhone = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'check-phone' });
const rlForgot = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'forgot' });
const rlReset = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'reset' });
const rlRiot = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 6, keyPrefix: 'riot' });
const rlMlbb = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 12, keyPrefix: 'mlbb' });
const rlDiscord = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8, keyPrefix: 'discord-oauth' });

/* =========================
   DISCORD
========================= */
router.post('/discord/start', verifyToken, rlDiscord, discordAuthStart);
router.get('/discord/callback', discordCallback);
router.delete('/discord', verifyToken, unlinkDiscord);

/* =========================
   AUTH
========================= */
router.post('/register', rlRegister, register);
router.get('/check-phone', rlCheckPhone, checkPhoneAvailability);
router.post('/login', rlLogin, login);
router.post('/logout', logout);
router.get('/profile', verifyToken, getProfile);
router.put('/update-profile', verifyToken, upload.single('avatarFile'), updateProfile);
router.post('/forgot-password', rlForgot, forgotPassword);
router.post('/reset-password/:token', rlReset, resetPassword);
router.post('/apply-organizer', verifyToken, upload.single('document'), applyOrganizer);
router.patch('/organizer/:userId/approve', verifyToken, verifyOrganizerAction);

/* =========================
   RIOT
========================= */
router.post('/riot/link/init', verifyToken, rlRiot, initRiotLink);
router.post('/riot/link/confirm', verifyToken, rlRiot, confirmRiotLink);
router.delete('/riot', verifyToken, unlinkRiotAccount);
router.get('/riot/status', verifyToken, rlRiot, riotStatus);

// (Opcional) sync manual
router.post('/riot/sync', verifyToken, rlRiot, syncRiotNow);
router.post('/riot/validate', verifyToken, rlRiot, validateRiotId);

/* =========================
   MOBILE LEGENDS
========================= */
router.post('/mlbb/validate', verifyToken, rlMlbb, validateMlbbId);
router.post('/mlbb/link', verifyToken, rlMlbb, linkMlbbAccount);
router.delete('/mlbb', verifyToken, unlinkMlbbAccount);
router.get('/mlbb/status', verifyToken, rlMlbb, mlbbStatus);
router.get('/mlbb/review/pending', verifyToken, rlMlbb, listPendingMlbbReviews);
router.patch('/mlbb/review/:userId', verifyToken, rlMlbb, reviewMlbbLink);
router.get('/mlbb/ops/status', verifyToken, rlMlbb, mlbbOpsStatus);
router.post('/mlbb/ops/process', verifyToken, rlMlbb, processMlbbOpsQueue);

export default router;
