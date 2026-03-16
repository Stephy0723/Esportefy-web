import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import {
  getNews,
  getNewsById,
  createNews,
  deleteNews,
} from '../controllers/news.controller.js';

const router = Router();

const rlRead  = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 200, keyPrefix: 'news-read' });
const rlWrite = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30,  keyPrefix: 'news-write' });

// Public — anyone can read news
router.get('/',    rlRead, getNews);
router.get('/:id', rlRead, getNewsById);

// Protected — must be logged in to create/delete
router.post('/',       verifyToken, rlWrite, createNews);
router.delete('/:id',  verifyToken, rlWrite, deleteNews);

export default router;
