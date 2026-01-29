import { Router } from 'express';
import { createTournament, getTournaments, getTournamentByCode, updateTournament, deleteTournament, registerTeam } from '../controllers/tournament.controller.js';
import { uploadTournamentFiles } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getTournaments); // Público
router.post('/', verifyToken, uploadTournamentFiles, createTournament); // Protegido
router.get('/:code', getTournamentByCode); // Público
router.put('/:code', verifyToken, uploadTournamentFiles, updateTournament); // Protegido (owner/admin)
router.delete('/:code', verifyToken, deleteTournament); // Protegido (owner/admin)
router.post('/:code/register', verifyToken, registerTeam); // Inscripción de equipos
export default router;
