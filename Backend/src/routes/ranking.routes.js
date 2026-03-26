import { Router } from 'express';
import { getPlatformRankings } from '../controllers/ranking.controller.js';

const router = Router();

router.get('/platform', getPlatformRankings);

export default router;
