import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications, sendTestNotifications } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);
router.patch('/read-all', verifyToken, markAllNotificationsRead);
router.delete('/clear-all', verifyToken, clearAllNotifications);
router.delete('/:id', verifyToken, deleteNotification);
router.post('/test-all', verifyToken, sendTestNotifications);

export default router;
