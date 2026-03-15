// Backend/src/routes/auth.routes.js

import { Router } from 'express';
import {
  register,
  checkPhoneAvailability,
  checkUsernameAvailability,
  login,
  logout,
  getProfile,
  getProfileOverview,
  getUserCard,
  getFriends,
  getSocialOverview,
  searchUsers,
  toggleFollow,
  forgotPassword,
  resetPassword,
  updateProfile,
  applyOrganizer,
  applyRole,
  verifyOrganizerAction,
  adminGetRoleApplications,
  adminReviewRoleApplication,
  adminListUsers,
  adminBanUser,
  adminSendNotification,
  createSupportTicket,
  adminGetSupportTickets,
  adminRespondSupportTicket,
  upload,
  organizerDocumentUpload,
  roleDocumentUpload
} from '../controllers/auth.controller.js';

import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

import {
  discordAuthStart,
  discordCallback,
  unlinkDiscord
} from '../controllers/discord.controller.js';
import {
  epicAuthCallback,
  epicAuthStart,
  steamAuthFinalize,
  steamAuthStart,
  unlinkEpic,
  unlinkSteam
} from '../controllers/platformOAuth.controller.js';

import {
  initRiotLink,
  confirmRiotLink,
  unlinkRiotAccount,
  syncRiotNow,
  validateRiotId,
  riotStatus,
  startValorantRso,
  valorantRsoCallback,
  valorantRsoStatus
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
const rlCheckUsername = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'check-username' });
const rlForgot = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'forgot' });
const rlReset = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'reset' });
const rlRiot = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 6, keyPrefix: 'riot' });
const rlMlbbValidate = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'mlbb-validate' });
const rlMlbbLink = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 20, keyPrefix: 'mlbb-link' });
const rlMlbbStatus = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 400, keyPrefix: 'mlbb-status' });
const rlMlbbReview = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 60, keyPrefix: 'mlbb-review' });
const rlMlbbOps = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 60, keyPrefix: 'mlbb-ops' });
const rlDiscord = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8, keyPrefix: 'discord-oauth' });
const rlPlatformOAuth = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 8, keyPrefix: 'platform-oauth' });
const rlProfile = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 120, keyPrefix: 'profile-read' });
const rlSocialSearch = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 90, keyPrefix: 'social-search' });
const rlFollowStrict = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 40, keyPrefix: 'social-follow' });

/* =========================
   DISCORD
========================= */
router.post('/discord/start', verifyToken, rlDiscord, discordAuthStart);
router.get('/discord/callback', discordCallback);
router.delete('/discord', verifyToken, unlinkDiscord);

/* =========================
   STEAM / EPIC
========================= */
router.post('/steam/start', verifyToken, rlPlatformOAuth, steamAuthStart);
router.post('/steam/finalize', verifyToken, rlPlatformOAuth, steamAuthFinalize);
router.delete('/steam', verifyToken, unlinkSteam);
router.post('/epic/start', verifyToken, rlPlatformOAuth, epicAuthStart);
router.get('/epic/callback', epicAuthCallback);
router.delete('/epic', verifyToken, unlinkEpic);

/* =========================
   AUTH
========================= */
router.post('/register', rlRegister, register);
router.get('/check-phone', rlCheckPhone, checkPhoneAvailability);
router.get('/check-username', rlCheckUsername, checkUsernameAvailability);
router.post('/login', rlLogin, login);
router.post('/logout', logout);
router.get('/profile', verifyToken, rlProfile, getProfile);
router.get('/profile/overview', verifyToken, rlProfile, getProfileOverview);
router.get('/user-card/:userId', verifyToken, rlProfile, getUserCard);
router.get('/friends', verifyToken, rlProfile, getFriends);
router.get('/social', verifyToken, rlProfile, getSocialOverview);
router.get('/users/search', verifyToken, rlSocialSearch, searchUsers);
router.post('/follow/:userId', verifyToken, rlFollowStrict, toggleFollow);
router.put('/update-profile', verifyToken, upload.single('avatarFile'), updateProfile);
router.post('/forgot-password', rlForgot, forgotPassword);
router.post('/reset-password/:token', rlReset, resetPassword);
router.post('/apply-organizer', verifyToken, organizerDocumentUpload.single('document'), applyOrganizer);
router.post('/apply-role', verifyToken, roleDocumentUpload.single('document'), applyRole);
router.patch('/organizer/:userId/approve', verifyToken, verifyOrganizerAction);

// ── Admin Panel ──
router.get('/admin/role-applications', verifyToken, adminGetRoleApplications);
router.patch('/admin/role-applications/:userId', verifyToken, adminReviewRoleApplication);
router.get('/admin/users', verifyToken, adminListUsers);
router.patch('/admin/users/:userId/ban', verifyToken, adminBanUser);
router.post('/admin/send-notification', verifyToken, adminSendNotification);

// ── Support Tickets ──
router.post('/support/ticket', verifyToken, createSupportTicket);
router.get('/admin/support-tickets', verifyToken, adminGetSupportTickets);
router.patch('/admin/support-tickets/:ticketId', verifyToken, adminRespondSupportTicket);

/* =========================
   RIOT
========================= */
router.post('/riot/link/init', verifyToken, rlRiot, initRiotLink);
router.post('/riot/link/confirm', verifyToken, rlRiot, confirmRiotLink);
router.post('/riot/valorant/start', verifyToken, rlRiot, startValorantRso);
router.delete('/riot', verifyToken, unlinkRiotAccount);
router.get('/riot/status', verifyToken, rlRiot, riotStatus);
router.get('/riot/valorant/status', verifyToken, rlRiot, valorantRsoStatus);
router.get('/riot/valorant/callback', valorantRsoCallback);

// (Opcional) sync manual
router.post('/riot/sync', verifyToken, rlRiot, syncRiotNow);
router.post('/riot/validate', verifyToken, rlRiot, validateRiotId);

/* =========================
   MOBILE LEGENDS
========================= */
router.post('/mlbb/validate', verifyToken, rlMlbbValidate, validateMlbbId);
router.post('/mlbb/link', verifyToken, rlMlbbLink, linkMlbbAccount);
router.delete('/mlbb', verifyToken, rlMlbbLink, unlinkMlbbAccount);
router.get('/mlbb/status', verifyToken, rlMlbbStatus, mlbbStatus);
router.get('/mlbb/review/pending', verifyToken, rlMlbbReview, listPendingMlbbReviews);
router.patch('/mlbb/review/:userId', verifyToken, rlMlbbReview, reviewMlbbLink);
router.get('/mlbb/ops/status', verifyToken, rlMlbbOps, mlbbOpsStatus);
router.post('/mlbb/ops/process', verifyToken, rlMlbbOps, processMlbbOpsQueue);

export default router;
