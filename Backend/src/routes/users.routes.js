import { Router } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import{
    getProfile,
    updateProfile,
    deleteMe
} from '../controllers/users.controller.js';

const router = Router();

//Perfil

router.get('/me', verifyToken, getProfile);
router.put('/me', verifyToken, updateProfile);
router.delete('/me', verifyToken, deleteMe);

export default router;




