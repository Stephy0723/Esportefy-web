import { Router } from 'express';
import { createTournament, getTournaments,getTournamentById,deleteTournament,registerToTournament } from '../controllers/tournament.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getTournaments); // Público
router.get('/:id', getTournamentById); // Público
router.post('/create', verifyToken, createTournament); // Protegido
router.delete('/delete/:id', verifyToken, deleteTournament); // Protegido
router.post('/register', verifyToken, registerToTournament); // Protegido

export default router;
