// Backend/src/routes/auth.routes.js

import { Router } from 'express';
import {
  register,
  login,
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
  discordAuth,
  discordCallback,
  unlinkDiscord
} from '../controllers/discord.controller.js';

import {
  initRiotLink,
  confirmRiotLink,
  unlinkRiotAccount,
  syncRiotNow,
  validateRiotId
} from '../controllers/riot.controller.js';

const router = Router();

const rlLogin = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'login' });
const rlRegister = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'register' });
const rlForgot = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'forgot' });
const rlReset = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'reset' });
const rlRiot = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 6, keyPrefix: 'riot' });

// 🔓 OAuth Discord (SIN verifyToaken)
/* =========================
   DISCORD
========================= */
router.get('/discord', discordAuth);
router.get('/discord/callback', discordCallback);
router.delete('/discord', verifyToken, unlinkDiscord);

/* =========================
   AUTH
========================= */
router.post('/register', rlRegister, register);
router.post('/login', rlLogin, login);
router.get('/profile', verifyToken, getProfile);
router.put('/update-profile', verifyToken, upload.single('avatarFile'), updateProfile);
router.post('/forgot-password', rlForgot, forgotPassword);
router.post('/reset-password/:token', rlReset, resetPassword);
router.post('/apply-organizer', verifyToken, upload.single('document'), applyOrganizer);
router.get('/verify-organizer/:userId/:action', verifyOrganizerAction);

/* =========================
   RIOT
========================= */
router.post('/riot/link/init', verifyToken, rlRiot, initRiotLink);
router.post('/riot/link/confirm', verifyToken, rlRiot, confirmRiotLink);
router.delete('/riot', verifyToken, unlinkRiotAccount);

// (Opcional) sync manual
router.post('/riot/sync', verifyToken, rlRiot, syncRiotNow);
router.post('/riot/validate', verifyToken, rlRiot, validateRiotId);

export default router;
