import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead, toggleNotificationSaved, toggleNotificationArchived } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const rlNotifications = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 60, keyPrefix: 'notifications' });

router.get('/', verifyToken, rlNotifications, getNotifications);
router.patch('/:id/read', verifyToken, rlNotifications, markNotificationRead);
router.patch('/read-all', verifyToken, rlNotifications, markAllNotificationsRead);
router.patch('/:id/save', verifyToken, rlNotifications, toggleNotificationSaved);
router.patch('/:id/archive', verifyToken, rlNotifications, toggleNotificationArchived);

export default router;
