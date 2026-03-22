import express, { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import {
  getNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  deleteAllNews,
} from '../controllers/news.controller.js';

const router = Router();

const rlRead  = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 200, keyPrefix: 'news-read' });
const rlWrite = createRateLimiter({ windowMs: 5 * 60 * 1000, max: 30,  keyPrefix: 'news-write' });

// Higher body limit for news (images are base64)
const jsonLarge = express.json({ limit: '10mb' });

// Public — anyone can read news
router.get('/',    rlRead, getNews);
router.get('/:id', rlRead, getNewsById);

// Protected — admin only to create/update/delete
router.post('/',          jsonLarge, verifyToken, rlWrite, createNews);
router.put('/:id',        jsonLarge, verifyToken, rlWrite, updateNews);
router.delete('/all',     verifyToken, rlWrite, deleteAllNews);
router.delete('/:id',     verifyToken, rlWrite, deleteNews);

export default router;
