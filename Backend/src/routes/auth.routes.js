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

import {
  discordAuth,
  discordCallback,
  unlinkDiscord
} from '../controllers/discord.controller.js';

import {
  initRiotLink,
  confirmRiotLink,
  unlinkRiotAccount,
  syncRiotNow
} from '../controllers/riot.controller.js';

const router = Router();

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
router.post('/register', register);
router.post('/login', login);
router.get('/profile', verifyToken, getProfile);
router.put('/update-profile', verifyToken, upload.single('avatarFile'), updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/apply-organizer', verifyToken, upload.single('document'), applyOrganizer);
router.get('/verify-organizer/:userId/:action', verifyOrganizerAction);

/* =========================
   RIOT
========================= */
router.post('/riot/link/init', verifyToken, initRiotLink);
router.post('/riot/link/confirm', verifyToken, confirmRiotLink);
router.delete('/riot', verifyToken, unlinkRiotAccount);

// (Opcional) sync manual
router.post('/riot/sync', verifyToken, syncRiotNow);

export default router;
