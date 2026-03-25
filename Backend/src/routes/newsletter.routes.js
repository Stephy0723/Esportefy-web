import { Router } from 'express';
import { createRateLimiter } from '../middlewares/rateLimit.js';
import { subscribe, unsubscribe } from '../controllers/newsletter.controller.js';

const router = Router();

const rl = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'newsletter' });

router.post('/subscribe', rl, subscribe);
router.get('/unsubscribe', rl, unsubscribe);

// Debug: test SMTP connection (remove in production)
router.get('/test-smtp', async (req, res) => {
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.default.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.verify();
    res.json({ ok: true, message: 'SMTP connection OK', user: process.env.EMAIL_USER });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

export default router;
