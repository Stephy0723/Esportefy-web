import { Router } from 'express';
import {
  createTournament,
  getTournaments,
  getTournamentByCode,
  getTournamentBracket,
  generateTournamentBracket,
  submitTournamentMatchResult,
  resolveTournamentMatchResult,
  updateTournament,
  deleteTournament,
  registerTeam,
  updateRegistrationStatus,
  updateTournamentStatus,
  removeRegistration
} from '../controllers/tournament.controller.js';
import { uploadTournamentFiles } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const rlRegister = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: 'tournament-register' });
const rlManage = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'tournament-manage' });
const rlCreate = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'tournament-create' });

router.get('/', getTournaments); // Público
router.post('/', verifyToken, rlCreate, uploadTournamentFiles, createTournament); // Protegido
router.get('/:code', getTournamentByCode); // Público
router.get('/:code/bracket', getTournamentBracket); // Público
router.post('/:code/bracket/generate', verifyToken, rlManage, generateTournamentBracket); // Protegido (owner/admin)
router.post('/:code/bracket/matches/:matchId/submit', verifyToken, rlManage, submitTournamentMatchResult); // Capitanes reportan
router.patch('/:code/bracket/matches/:matchId/resolve', verifyToken, rlManage, resolveTournamentMatchResult); // Owner/Admin resuelven
router.put('/:code', verifyToken, rlManage, uploadTournamentFiles, updateTournament); // Protegido (owner/admin)
router.delete('/:code', verifyToken, rlManage, deleteTournament); // Protegido (owner/admin)
router.post('/:code/register', verifyToken, rlRegister, registerTeam); // Inscripción de equipos
router.patch('/:code/registrations/:registrationId', verifyToken, rlManage, updateRegistrationStatus); // Aprobar/Rechazar
router.delete('/:code/registrations/:registrationId', verifyToken, rlManage, removeRegistration); // Quitar equipo inscrito
router.patch('/:code/status', verifyToken, rlManage, updateTournamentStatus); // Estado del torneo
export default router;
