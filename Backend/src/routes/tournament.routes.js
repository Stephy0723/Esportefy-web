import { Router } from 'express';
import {
  createTournament,
  getTournaments,
  getTournamentByCode,
  updateTournament,
  deleteTournament,
  registerTeam,
  updateRegistrationStatus,
  updateTournamentStatus,
  removeRegistration,
  getManageableTournaments,
  searchPublicTournaments,
  getPublicTournamentByCode,
  updateTournamentPublicSettings,
  updateTournamentBracket,
  getTournamentCompliance
} from '../controllers/tournament.controller.js';
import { uploadTournamentFiles } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const rlRegister = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: 'tournament-register' });
const rlManage = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'tournament-manage' });
const rlCreate = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'tournament-create' });

router.get('/', getTournaments);
router.get('/public/search', searchPublicTournaments);
router.get('/public/:code', getPublicTournamentByCode);

router.get('/manage/mine', verifyToken, rlManage, getManageableTournaments);
router.post('/', verifyToken, rlCreate, uploadTournamentFiles, createTournament);
router.get('/:code', getTournamentByCode);
router.put('/:code', verifyToken, rlManage, uploadTournamentFiles, updateTournament);
router.patch('/:code/public-settings', verifyToken, rlManage, updateTournamentPublicSettings);
router.patch('/:code/bracket', verifyToken, rlManage, updateTournamentBracket);
router.get('/:code/compliance', verifyToken, rlManage, getTournamentCompliance);
router.delete('/:code', verifyToken, rlManage, deleteTournament);
router.post('/:code/register', verifyToken, rlRegister, registerTeam);
router.patch('/:code/registrations/:registrationId', verifyToken, rlManage, updateRegistrationStatus);
router.delete('/:code/registrations/:registrationId', verifyToken, rlManage, removeRegistration);
router.patch('/:code/status', verifyToken, rlManage, updateTournamentStatus);

export default router;
