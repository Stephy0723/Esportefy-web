import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import { logger } from './middlewares/logger.js';
import { verifyCsrf } from './middlewares/csrf.middleware.js';

import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import communityRoutes from './routes/community.routes.js';

dotenv.config();
connectDB();

const app = express();
const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

const defaultAllowedOrigins = ['http://localhost:5173', 'http://localhost:3000', frontendOrigin];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .filter((origin, index, arr) => arr.indexOf(origin) === index);

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requests server-to-server o herramientas sin Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-XSRF-Token']
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

const manualSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self';"
  );
  next();
};

let securityMiddleware = manualSecurityHeaders;
try {
  const { default: helmet } = await import('helmet');
  securityMiddleware = helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", frontendOrigin],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false
  });
} catch (_) {
  console.warn('helmet no está instalado. Usando headers de seguridad manuales.');
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(securityMiddleware);
app.use(logger);
app.use(verifyCsrf);
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes);

app.use((err, req, res, next) => {
  if (err?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origen no permitido por CORS' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload demasiado grande' });
  }
  if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Archivo demasiado grande' });
    }
    return res.status(400).json({ message: 'Error al procesar el archivo' });
  }
  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('archivo inválido')) {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
