import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead, toggleNotificationSaved, toggleNotificationArchived, deleteNotification, clearAllNotifications, sendTestAllNotifications } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const rlNotifications = createRateLimiter({ windowMs: 1 * 60 * 1000, max: 500, keyPrefix: 'notifications' });

router.get('/', verifyToken, rlNotifications, getNotifications);
router.post('/test-all', verifyToken, rlNotifications, sendTestAllNotifications);
router.patch('/read-all', verifyToken, rlNotifications, markAllNotificationsRead);
router.delete('/clear-all', verifyToken, rlNotifications, clearAllNotifications);
router.patch('/:id/read', verifyToken, rlNotifications, markNotificationRead);
router.patch('/:id/save', verifyToken, rlNotifications, toggleNotificationSaved);
router.patch('/:id/archive', verifyToken, rlNotifications, toggleNotificationArchived);
router.delete('/:id', verifyToken, rlNotifications, deleteNotification);

export default router;
