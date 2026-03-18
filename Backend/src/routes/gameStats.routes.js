import { Router } from 'express';
import { verifyToken, requireAdmin } from '../middlewares/auth.middleware.js';
import { getAdminUserGameStats } from '../controllers/gameStats.controller.js';

const router = Router();

router.get('/admin/users/:userId', verifyToken, requireAdmin, getAdminUserGameStats);

export default router;
