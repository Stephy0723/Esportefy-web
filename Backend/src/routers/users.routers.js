import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getMe,
  updateProfile,
  deleteMe
} from '../controllers/users.controller.js';

const router = Router();

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateProfile);
router.delete('/me', authMiddleware, deleteMe);

export default router;
