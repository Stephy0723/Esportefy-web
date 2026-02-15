import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import postRoutes from './routes/posts.js';
import { connectDB } from './config/db.js';



const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: "*" } // Ajusta al puerto de tu React
});

connectDB()
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Servir archivos estáticos

// Middleware para inyectar socket.io en las peticiones
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Rutas
app.use('/api/posts', postRoutes);
app.get('/', (req, res) => {
    res.send('🎮 Esportefy API está funcionando correctamente');
});

const PORT = 5010;
httpServer.listen(PORT, () => {
    console.log(`🎮 Esportefy API corriendo en http://localhost:${PORT}`);
});