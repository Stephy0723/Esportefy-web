import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  completeUniversityMicrosoftConnect,
  getUniversityMicrosoftStatus,
  getUniversityCatalogDetail,
  getUniversityStandings,
  getMyUniversityStatus,
  listUniversityCatalog,
  listUniversityApplications,
  reviewUniversityApplication,
  startUniversityMicrosoftConnect,
  submitUniversityApplication,
  unlinkUniversityMicrosoftConnection
} from '../controllers/university.controller.js';

const router = Router();

router.get('/catalog', listUniversityCatalog);
router.get('/catalog/:id', getUniversityCatalogDetail);
router.get('/standings', getUniversityStandings);
router.get('/me', verifyToken, getMyUniversityStatus);
router.post('/applications', verifyToken, submitUniversityApplication);
router.get('/applications', verifyToken, listUniversityApplications);
router.patch('/applications/:id/review', verifyToken, reviewUniversityApplication);
router.post('/microsoft/connect', verifyToken, startUniversityMicrosoftConnect);
router.get('/microsoft/status', verifyToken, getUniversityMicrosoftStatus);
router.delete('/microsoft', verifyToken, unlinkUniversityMicrosoftConnection);
router.get('/microsoft/callback', completeUniversityMicrosoftConnect);

export default router;
