import { Router } from 'express';
import { getNotifications, markNotificationRead } from '../controllers/notification.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, getNotifications);
router.patch('/:id/read', verifyToken, markNotificationRead);

export default router;
