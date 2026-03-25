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
  getTournamentCompliance,
  getReports,
  createReport,
  updateReport,
  deleteReport,
  getStaff,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
  seedFakeTeams,
  uploadMatchProofHandler,
  searchStaffCandidates
} from '../controllers/tournament.controller.js';
import { uploadTournamentFiles, uploadMatchProof } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { createRateLimiter } from '../middlewares/rateLimit.js';

const router = Router();

const rlRegister = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10, keyPrefix: 'tournament-register' });
const rlManage = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 30, keyPrefix: 'tournament-manage' });
const rlCreate = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5, keyPrefix: 'tournament-create' });

router.get('/', getTournaments);
router.get('/public/search', searchPublicTournaments);
router.get('/public/:code', getPublicTournamentByCode);

router.get('/staff-search', verifyToken, searchStaffCandidates);
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

// Seed (dev/demo)
router.post('/:code/seed-teams', verifyToken, rlManage, seedFakeTeams);

// Match proof upload
router.post('/:code/match-proof', verifyToken, rlManage, uploadMatchProof, uploadMatchProofHandler);

// Reports
router.get('/:code/reports', verifyToken, rlManage, getReports);
router.post('/:code/reports', verifyToken, rlManage, createReport);
router.patch('/:code/reports/:reportId', verifyToken, rlManage, updateReport);
router.delete('/:code/reports/:reportId', verifyToken, rlManage, deleteReport);

// Staff
router.get('/:code/staff', getStaff);
router.post('/:code/staff', verifyToken, rlManage, addStaffMember);
router.patch('/:code/staff/:username', verifyToken, rlManage, updateStaffMember);
router.delete('/:code/staff/:username', verifyToken, rlManage, removeStaffMember);

export default router;
