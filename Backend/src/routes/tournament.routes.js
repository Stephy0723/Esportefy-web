import { Router } from 'express';
import { createTournament, getTournaments,getTournamentByCode } from '../controllers/tournament.controller.js';
import { uploadTournamentFiles } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getTournaments); // Público
router.post('/', verifyToken, uploadTournamentFiles, createTournament); // Protegido
router.get('/:code', getTournamentByCode); // Público
export default router;
