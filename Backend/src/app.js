import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoSanitize from 'express-mongo-sanitize';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { startMlbbMailQueueWorker } from './services/mlbbMailQueue.js';
import { logger } from './middlewares/logger.js';
import { verifyCsrf } from './middlewares/csrf.middleware.js';

import authRoutes from './routes/auth.routes.js';
import teamRoutes from './routes/team.routes.js';
import tournamentRoutes from './routes/tournament.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import communityRoutes from './routes/community.routes.js';
import universityRoutes from './routes/university.routes.js';
import newsRoutes from './routes/news.routes.js';
import securityRoutes from './routes/security.routes.js';
import friendsRoutes from './routes/friends.routes.js';
import rankingRoutes from './routes/ranking.routes.js';
import newsletterRoutes from './routes/newsletter.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendEnvPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
} else {
  dotenv.config();
}

const PLACEHOLDER_SECRET_VALUES = new Set([
  '',
  'ponerunaclaveaqui',
  'cambia-esto-en-produccion',
  'cambia-esto-en-producción',
  'changeme',
  'change-me',
  'secret',
  'jwtsecret',
  'tu_jwt_secret',
  'tu-jwt-secret'
]);

const isPlaceholderSecret = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  if (PLACEHOLDER_SECRET_VALUES.has(normalized)) return true;
  return normalized.includes('cambia-esto') || normalized.includes('tu_jwt_secret');
};

const validateRuntimeSecrets = () => {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
  const jwtSecret = String(process.env.JWT_SECRET || '').trim();

  const isProtectedRuntime = nodeEnv === 'production' || frontendUrl.startsWith('https://');
  if (!isProtectedRuntime) return;

  if (isPlaceholderSecret(jwtSecret) || jwtSecret.length < 24) {
    throw new Error(
      'JWT_SECRET inseguro para review/produccion. Usa un secreto unico de al menos 24 caracteres antes de exponer la app.'
    );
  }
};

validateRuntimeSecrets();

export const dbReady = connectDB();

const app = express();
const uploadsDir = path.resolve(__dirname, '../uploads');
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
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token']
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
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  });
} catch (_) {
  console.warn('helmet no está instalado. Usando headers de seguridad manuales.');
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(securityMiddleware);
app.use(logger);
app.use(verifyCsrf);
app.use('/uploads', express.static(uploadsDir));

const buildHealthPayload = () => ({
  ok: true,
  service: 'glitchgang-api',
  nodeEnv: String(process.env.NODE_ENV || 'development'),
  frontendUrl: frontendOrigin,
  riotReviewMode: String(process.env.RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true',
  timestamp: new Date().toISOString()
});

app.get('/healthz', (req, res) => res.status(200).json(buildHealthPayload()));
app.get('/api/healthz', (req, res) => res.status(200).json(buildHealthPayload()));

app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/university', universityRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/rankings', rankingRoutes);

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
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(413).json({ message: 'Los datos del formulario son demasiado grandes (reduce imágenes del roster)' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Campo de archivo inesperado. Usa el campo "logo".' });
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
