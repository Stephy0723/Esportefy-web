import { Router } from 'express';
import { createTournament, getTournaments } from '../controllers/tournament.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getTournaments); // Público
router.post('/create', verifyToken, createTournament); // Protegido

export default router;
