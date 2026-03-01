import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
  getMyUniversityStatus,
  listUniversityApplications,
  reviewUniversityApplication,
  submitUniversityApplication
} from '../controllers/university.controller.js';

const router = Router();

router.get('/me', verifyToken, getMyUniversityStatus);
router.post('/applications', verifyToken, submitUniversityApplication);
router.get('/applications', verifyToken, listUniversityApplications);
router.patch('/applications/:id/review', verifyToken, reviewUniversityApplication);

export default router;
