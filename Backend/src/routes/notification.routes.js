import { Router } from 'express';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);
router.patch('/read-all', verifyToken, markAllNotificationsRead);

export default router;
