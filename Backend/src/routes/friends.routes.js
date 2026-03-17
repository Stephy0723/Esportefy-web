import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from '../controllers/friends.controller.js';

const router = Router();

const rlRead  = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 100, keyPrefix: 'friends-read' });
const rlWrite = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30,  keyPrefix: 'friends-write' });

// List
router.get('/',         verifyToken, rlRead, getFriends);
router.get('/requests', verifyToken, rlRead, getFriendRequests);

// Actions
router.post('/request/:userId',       verifyToken, rlWrite, sendFriendRequest);
router.patch('/accept/:requesterId',   verifyToken, rlWrite, acceptFriendRequest);
router.patch('/reject/:requesterId',   verifyToken, rlWrite, rejectFriendRequest);
router.delete('/cancel/:targetId',     verifyToken, rlWrite, cancelFriendRequest);
router.delete('/:friendId',           verifyToken, rlWrite, removeFriend);

export default router;
