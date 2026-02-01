import { Router } from 'express';
import { createTournament, getTournaments, getTournamentByCode, updateTournament, deleteTournament, registerTeam, updateRegistrationStatus, updateTournamentStatus, removeRegistration } from '../controllers/tournament.controller.js';
import { uploadTournamentFiles } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getTournaments); // Público
router.post('/', verifyToken, uploadTournamentFiles, createTournament); // Protegido
router.get('/:code', getTournamentByCode); // Público
router.put('/:code', verifyToken, uploadTournamentFiles, updateTournament); // Protegido (owner/admin)
router.delete('/:code', verifyToken, deleteTournament); // Protegido (owner/admin)
router.post('/:code/register', verifyToken, registerTeam); // Inscripción de equipos
router.patch('/:code/registrations/:registrationId', verifyToken, updateRegistrationStatus); // Aprobar/Rechazar
router.delete('/:code/registrations/:registrationId', verifyToken, removeRegistration); // Quitar equipo inscrito
router.patch('/:code/status', verifyToken, updateTournamentStatus); // Estado del torneo
export default router;
