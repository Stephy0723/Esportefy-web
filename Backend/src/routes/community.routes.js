import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import {
  uploadCommunityAttachment,
  uploadCommunityAssets,
  getPosts,
  createPost,
  togglePostLike,
  addComment,
  toggleCommentLike,
  reportPost,
  toggleHidePost,
  deletePost,
  createCommunity,
  getMyCommunities,
  getCommunityByShortUrl,
  getCommunityAuditLogs,
  joinCommunity,
  leaveCommunity,
  removeCommunityMember,
  updateCommunityMemberRole,
  transferCommunityOwnership
} from '../controllers/community.controller.js';

const router = Router();

const rlRead = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 150, keyPrefix: 'community-read' });
const rlWrite = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 50, keyPrefix: 'community-write' });

router.get('/posts', verifyToken, rlRead, getPosts);
router.post('/posts', verifyToken, rlWrite, uploadCommunityAttachment.single('attachment'), createPost);
router.post('/posts/:postId/like', verifyToken, rlWrite, togglePostLike);
router.post('/posts/:postId/comments', verifyToken, rlWrite, uploadCommunityAttachment.single('attachment'), addComment);
router.post('/posts/:postId/comments/:commentId/like', verifyToken, rlWrite, toggleCommentLike);
router.post('/posts/:postId/report', verifyToken, rlWrite, reportPost);
router.post('/posts/:postId/hide', verifyToken, rlWrite, toggleHidePost);
router.delete('/posts/:postId', verifyToken, rlWrite, deletePost);
router.get('/communities/mine', verifyToken, rlRead, getMyCommunities);
router.post('/communities', verifyToken, rlWrite, uploadCommunityAssets, createCommunity);
router.post('/communities/:shortUrl/join', verifyToken, rlWrite, joinCommunity);
router.post('/communities/:shortUrl/leave', verifyToken, rlWrite, leaveCommunity);
router.delete('/communities/:shortUrl/members/:userId', verifyToken, rlWrite, removeCommunityMember);
router.patch('/communities/:shortUrl/members/:userId/role', verifyToken, rlWrite, updateCommunityMemberRole);
router.patch('/communities/:shortUrl/owner/transfer', verifyToken, rlWrite, transferCommunityOwnership);
router.get('/communities/:shortUrl/audit-logs', verifyToken, rlRead, getCommunityAuditLogs);
router.get('/communities/:shortUrl', verifyToken, rlRead, getCommunityByShortUrl);

export default router;
