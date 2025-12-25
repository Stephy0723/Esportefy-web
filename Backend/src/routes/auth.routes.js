// Backend/src/routes/auth.routers.js

import {Router} from 'express';
import {register, login,getProfile,forgotPassword,resetPassword,updateProfile,applyOrganizer,verifyOrganizerAction,upload} from '../controllers/auth.controller.js'
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login,);
router.get('/profile', verifyToken, getProfile);
router.put('/update-profile', verifyToken, upload.single('avatarFile'), updateProfile);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post('/apply-organizer', verifyToken, upload.single('document'), applyOrganizer);
router.get('/verify-organizer/:userId/:action', verifyOrganizerAction);
export default router;