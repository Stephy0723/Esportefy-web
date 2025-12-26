import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getSettings,
  updatePrivacy,
  updateConnections
} from '../controllers/settings.controller.js';

const router = Router();

router.get('/', verifyToken, getSettings);
router.put('/privacy', verifyToken, updatePrivacy);
router.put('/connections', verifyToken, updateConnections);

export default router;
