import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear carpeta si no existe
const uploadDir = 'uploads/tournaments';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const uploadTournamentFiles = multer({ 
    storage,
    limits: { fileSize: 30 * 1024 * 1024 }, // Límite 30MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype) return cb(null, true);
        cb(new Error("Error: Solo se permiten imágenes (JPG/PNG) y archivos PDF"));
    }
}).fields([
    { name: 'bannerFile', maxCount: 1 },
    { name: 'rulesPdf', maxCount: 1 },
    { name: 'sponsorLogos', maxCount: 10 }
]);
