import express from 'express';
import multer from 'multer';
import path from 'path';
import { getPosts, createPost, addComment } from '../controllers/feedController.js';

const router = express.Router();

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de crear esta carpeta
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.get('/', getPosts);
router.post('/', upload.single('image'), createPost);
router.post('/:postId/comments', addComment);

export default router;