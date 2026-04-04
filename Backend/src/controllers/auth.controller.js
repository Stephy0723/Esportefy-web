// Backend/src/controllers/auth.controller.js

import User from '../models/User.js';
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import CommunityPost from "../models/CommunityPost.js";
import Community from "../models/Community.js";
import SupportTicket from "../models/SupportTicket.js";
import buildProfileProgression from "../services/profileProgression.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";
import { verifySync } from 'otplib';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { filterSupportedGameNames, isSupportedGameName, SUPPORTED_GAME_NAMES } from '../../../shared/supportedGames.js';
import { normalizeCompetitiveProfilesPayload } from '../../../shared/gameCompetitiveProfiles.js';
import { normalizeCountryName } from '../../../shared/countries.js';
import {
    normalizeExperienceValues,
    normalizeGenderValue,
    normalizeGoalValues,
    normalizeLanguageValues,
    normalizePlatformValues
} from '../../../shared/profileCatalog.js';
import { normalizeCommunityGameIds } from '../utils/communityGames.js';
import { recordAdminAudit } from '../services/auditLogger.js';
import { recordActivity } from '../services/activityLogger.js';
import Session from '../models/Session.js';
import { sendRoleApplicationMail } from '../services/roleMailService.js';

const parseDeviceLabel = (ua = '') => {
    const s = String(ua);
    let browser = 'Navegador';
    if (s.includes('Chrome') && !s.includes('Edg')) browser = 'Chrome';
    else if (s.includes('Firefox')) browser = 'Firefox';
    else if (s.includes('Safari') && !s.includes('Chrome')) browser = 'Safari';
    else if (s.includes('Edg')) browser = 'Edge';
    let os = '';
    if (s.includes('Windows')) os = 'Windows';
    else if (s.includes('Mac')) os = 'macOS';
    else if (s.includes('Linux')) os = 'Linux';
    else if (s.includes('Android')) os = 'Android';
    else if (s.includes('iPhone') || s.includes('iPad')) os = 'iOS';
    return os ? `${browser} en ${os}` : browser;
};

const isStringField = (value) => typeof value === 'string';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_DOCUMENT_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_DOCUMENT_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const MIN_AUTH_TTL_MS = 60 * 1000;
const DEFAULT_AUTH_TOKEN_TTL_RAW = process.env.AUTH_TOKEN_TTL || '30d';
const DEFAULT_AUTH_TOKEN_REMEMBER_TTL_RAW = process.env.AUTH_TOKEN_REMEMBER_TTL || '90d';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const normalizeSameSite = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'strict' || normalized === 'lax' || normalized === 'none') {
        return normalized;
    }
    return '';
};

const parseDurationMs = (value, fallbackMs) => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.max(MIN_AUTH_TTL_MS, Math.floor(value));
    }

    const raw = String(value || '').trim().toLowerCase();
    const match = raw.match(/^(\d+)(ms|s|m|h|d)?$/);
    if (!match) return fallbackMs;

    const amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return fallbackMs;

    const unit = match[2] || 'ms';
    const unitMs = unit === 'd'
        ? 24 * 60 * 60 * 1000
        : unit === 'h'
            ? 60 * 60 * 1000
            : unit === 'm'
                ? 60 * 1000
                : unit === 's'
                    ? 1000
                    : 1;

    return Math.max(MIN_AUTH_TTL_MS, Math.floor(amount * unitMs));
};

const AUTH_TOKEN_TTL_MS = parseDurationMs(DEFAULT_AUTH_TOKEN_TTL_RAW, 30 * 24 * 60 * 60 * 1000);
const AUTH_TOKEN_REMEMBER_TTL_MS = parseDurationMs(DEFAULT_AUTH_TOKEN_REMEMBER_TTL_RAW, 90 * 24 * 60 * 60 * 1000);

const envSecure = process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === 'true'
    : IS_PRODUCTION;
const envSameSite = normalizeSameSite(process.env.AUTH_COOKIE_SAME_SITE) || (envSecure ? 'none' : 'lax');
const AUTH_COOKIE_SECURE = envSameSite === 'none' ? true : envSecure;
const AUTH_COOKIE_SAME_SITE = envSameSite;

const buildAuthCookieOptions = (ttlMs = AUTH_TOKEN_TTL_MS) => {
    const options = {
        httpOnly: true,
        secure: AUTH_COOKIE_SECURE,
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: ttlMs,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const buildCsrfCookieOptions = (ttlMs = AUTH_TOKEN_TTL_MS) => {
    const options = {
        httpOnly: false,
        secure: AUTH_COOKIE_SECURE,
        sameSite: 'lax',
        maxAge: ttlMs,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
const FRONTEND_URL = String(process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');

const createMailTransporter = () => {
    const user = String(process.env.EMAIL_USER || '').trim();
    const pass = String(process.env.EMAIL_PASS || '').trim();

    if (!user || !pass) return null;

    return nodemailer.createTransport({
        service: 'Gmail',
        auth: { user, pass }
    });
};

const escapeHtml = (value = '') => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEmailVerificationLink = (token) => {
    const url = new URL('/verify-email', FRONTEND_URL);
    url.searchParams.set('token', token);
    return url.toString();
};

const issueEmailVerificationToken = (user) => {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    user.emailVerificationLastSentAt = new Date();

    return plainToken;
};

const sendVerificationMailToUserLegacy = async (user, plainToken) => {
    const transporter = createMailTransporter();
    if (!transporter) {
        throw new Error('SMTP_NOT_CONFIGURED');
    }

    const verificationLink = buildEmailVerificationLink(plainToken);
    const fullName = escapeHtml(user?.fullName || user?.username || 'Jugador');

    await transporter.sendMail({
        to: user.email,
        from: 'GlitchGang Team <no-reply@glitchgang.net>',
        subject: 'Verifica tu correo en GLITCH GANG',
        html: `
        <div style="font-family: Helvetica, Arial, sans-serif; background:#f7f8fa; padding:40px 16px;">
            <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:16px; overflow:hidden;">
                <div style="padding:32px 32px 12px 32px; text-align:center;">
                    <h1 style="margin:0; font-size:24px; color:#111827;">Verifica tu correo</h1>
                    <p style="margin:12px 0 0 0; color:#6b7280; font-size:15px;">Confirma que esta cuenta te pertenece para reforzar la seguridad.</p>
                </div>
                <div style="padding:12px 32px 32px 32px;">
                    <p style="color:#111827; font-size:15px; line-height:1.6;">Hola <strong>${fullName}</strong>,</p>
                    <p style="color:#374151; font-size:15px; line-height:1.6;">Haz clic en el siguiente botón para verificar tu correo en GLITCH GANG. Este enlace expira en 24 horas.</p>
                    <div style="text-align:center; margin:28px 0;">
                        <a href="${verificationLink}" style="display:inline-block; background:#111827; color:#ffffff; text-decoration:none; padding:14px 22px; border-radius:10px; font-weight:700;">Verificar correo</a>
                    </div>
                    <p style="color:#6b7280; font-size:13px; line-height:1.6;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break:break-all; color:#2563eb; font-size:13px;">${verificationLink}</p>
                </div>
            </div>
        </div>
        `
    });
};

const sendVerificationMailToUser = async (user, plainToken) => {
    const transporter = createMailTransporter();
    if (!transporter) {
        throw new Error('SMTP_NOT_CONFIGURED');
    }

    const verificationLink = buildEmailVerificationLink(plainToken);
    const fullName = escapeHtml(user?.fullName || user?.username || 'Jugador');

    await transporter.sendMail({
        to: user.email,
        from: 'GlitchGang Team <no-reply@glitchgang.net>',
        subject: 'Verifica tu correo en GLITCH GANG',
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 50px 0;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">
                
                <div style="padding: 30px; text-align: center;">
                    <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                        GLITCHGANG<span style="color: #00ff00;">.</span>
                    </h1>
                    <p style="color: #666; font-size: 14px; margin-top: 10px;">VERIFICACION DE CORREO</p>
                </div>

                <div style="padding: 0 40px 40px 40px; text-align: center;">
                    <p style="color: #333; font-size: 16px; line-height: 1.5;">
                        Hola, <strong>${fullName}</strong>. Confirma tu correo para reforzar la seguridad de tu cuenta. Este enlace expirara en 24 horas.
                    </p>

                    <div style="margin: 30px 0;">
                        <a href="${verificationLink}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; border-radius: 8px; padding: 14px 24px; font-size: 15px; font-weight: bold;">
                            VERIFICAR CORREO
                        </a>
                    </div>

                    <div style="margin: 30px 0; background-color: #f4f4f4; border-radius: 8px; padding: 20px; border: 1px dashed #cccccc;">
                        <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #000; word-break: break-all;">
                            ${verificationLink}
                        </span>
                    </div>

                    <p style="color: #999; font-size: 12px;">
                        Si no solicitaste esta verificacion, puedes ignorar este correo de forma segura.
                    </p>
                </div>

                <div style="background-color: #000; padding: 15px; text-align: center;">
                    <p style="color: #fff; font-size: 11px; margin: 0; opacity: 0.7;">
                        Â© ${new Date().getFullYear()} GlitchGang Platform. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
        `
    });
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/avatars/';

        // 1. PRIMERO: Verificar y crear la carpeta
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("Carpeta de avatares creada con éxito.");
            }
        } catch (err) {
            console.error("Error al crear la carpeta:", err);
        }

        // 2. SEGUNDO: Pasar el control a Multer
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Nombre único: ID-Timestamp.ext
        const ext = path.extname(file.originalname).toLowerCase();
        // Usamos req.userId (que viene del middleware verifyToken)
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const validMime = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype);
        const validExt = ALLOWED_IMAGE_EXTENSIONS.has(ext);
        if (!validMime || !validExt) {
            return cb(new Error('Archivo inválido. Solo se permiten imágenes JPG, PNG o WEBP.'));
        }
        return cb(null, true);
    }
});

const organizerDocumentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/organizer-documents/';

        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log('Carpeta de documentos creada con exito.');
            }
        } catch (err) {
            console.error('Error al crear la carpeta de documentos:', err);
        }

        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const organizerDocumentUpload = multer({
    storage: organizerDocumentStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const validMime = ALLOWED_DOCUMENT_MIME_TYPES.has(file.mimetype);
        const validExt = ALLOWED_DOCUMENT_EXTENSIONS.has(ext);
        if (!validMime || !validExt) {
            return cb(new Error('Archivo invalido. Solo se permiten documentos PDF o imagenes JPG, PNG y WEBP.'));
        }
        return cb(null, true);
    }
});

export const roleDocumentUpload = organizerDocumentUpload;

const normalizeStringArray = (value) => {
    if (Array.isArray(value)) {
        return value.map((v) => String(v || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return [];
};

const normalizeProfileText = (value, { max = 120, trim = true } = {}) => {
    const raw = String(value ?? '');
    const next = trim ? raw.trim() : raw;
    return next.slice(0, max);
};

const normalizeBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    const raw = String(value ?? '').trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'sí', 'on'].includes(raw)) return true;
    if (['false', '0', 'no', 'off'].includes(raw)) return false;
    return fallback;
};

const cleanupUploadedFile = (file) => {
    if (file?.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, () => {});
    }
};

const parseRoleApplicationData = (body = {}) => {
    let nestedData = {};

    if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
        nestedData = body.data;
    } else if (typeof body?.data === 'string') {
        try {
            const parsed = JSON.parse(body.data);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                nestedData = parsed;
            }
        } catch {
            nestedData = {};
        }
    }

    const directData = { ...body };
    delete directData.role;
    delete directData.data;

    return { ...nestedData, ...directData };
};

const formatRoleApplicationLabel = (key) => {
    const knownLabels = {
        fullName: 'Nombre Legal Completo',
        idNumber: 'Cedula / DNI / Pasaporte / ID',
        documentFilename: 'Documento adjunto',
        mainPlatform: 'Plataforma principal',
        channelUrl: 'URL del canal / perfil',
        followers: 'Seguidores / suscriptores',
        contentType: 'Tipo de contenido',
        games: 'Juegos',
        description: 'Descripcion',
        experienceYears: 'Experiencia',
        specialization: 'Especializacion',
        tools: 'Herramientas',
        portfolio: 'Portfolio / trabajos',
        languages: 'Idiomas',
        experience: 'Nivel de experiencia',
        castingStyle: 'Estilo de casting',
        sampleUrl: 'Muestra / clip',
        platform: 'Plataforma',
        game: 'Juego principal',
        rank: 'Rango / elo',
        coachingType: 'Tipo de coaching',
        availability: 'Disponibilidad',
        companyName: 'Empresa / marca',
        website: 'Sitio web',
        industry: 'Industria',
        sponsorType: 'Tipo de patrocinio',
        budget: 'Presupuesto',
        interests: 'Intereses'
    };

    if (knownLabels[key]) return knownLabels[key];

    return String(key || '')
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/^./, (char) => char.toUpperCase());
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,20}$/;
const SOCIAL_LINK_KEYS = ['twitch', 'youtube', 'twitter', 'instagram', 'tiktok'];
const GAMING_CONNECTION_KEYS = ['discord', 'riotId', 'steam', 'epic', 'playstation', 'xbox', 'nintendo'];
const PROFILE_ONLINE_STATUSES = new Set(['online', 'gaming', 'tournament', 'streaming', 'searching']);
const PROFILE_STATUS_PRIORITY = {
    online: 0,
    gaming: 1,
    tournament: 2,
    streaming: 3,
    searching: 4,
    afk: 5,
    dnd: 6,
    offline: 7
};

const formatMonthYear = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-DO', { month: 'short', year: 'numeric' });
};

const formatCommunityRoleLabel = (role = '') => {
    const normalized = String(role || '').trim().toLowerCase();
    if (normalized === 'owner') return 'Propietario';
    if (normalized === 'admin') return 'Admin';
    if (normalized === 'moderator') return 'Moderador';
    return 'Miembro';
};

const isValidNonNegativeNumberString = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;
const isValidObjectIdLike = (value = '') => /^[a-fA-F0-9]{24}$/.test(String(value));
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeUserCodeLookup = (value = '') => String(value)
    .toUpperCase()
    .trim();
const toIdArray = (value) => (
    Array.isArray(value)
        ? value.map((entry) => String(entry || '').trim()).filter(Boolean)
        : []
);
const toObjectIdArray = (value) => Array.from(new Set(toIdArray(value)));
const extractVisibleUserCode = (candidate) => {
    const isVisible = candidate?.privacy?.showPublicUserCode !== false;
    if (!isVisible) return '';
    const code = String(candidate?.userCode || '').trim();
    return code;
};

const extractVisibleStatus = (candidate) => {
    const isVisible = candidate?.privacy?.showOnlineStatus !== false;
    if (!isVisible) return 'offline';
    return String(candidate?.status || 'offline').trim() || 'offline';
};

const extractPublicRiotHandle = (candidate) => {
    const isVisible = candidate?.privacy?.showPublicRiotHandle === true;
    if (!isVisible || candidate?.connections?.riot?.verified !== true) return '';
    const valorantLinked = candidate?.connections?.riot?.products?.valorant?.linked === true;
    const valorantConsented = candidate?.connections?.riot?.products?.valorant?.consentGranted === true;
    if (valorantLinked && !valorantConsented) return '';

    const gameName = String(candidate?.connections?.riot?.gameName || '').trim();
    const tagLine = String(candidate?.connections?.riot?.tagLine || '').trim();
    if (!gameName || !tagLine) return '';
    return `${gameName}#${tagLine}`;
};

const getPublicRiotProducts = (riot = {}) => {
    const baseVerified = Boolean(riot?.verified && riot?.puuid);
    const baseLinkedAt = riot?.linkedAt || null;

    return {
        lol: {
            linked: Boolean(riot?.products?.lol?.linked || baseVerified),
            linkedAt: riot?.products?.lol?.linkedAt || baseLinkedAt || null,
            lastVerifiedAt: riot?.products?.lol?.lastVerifiedAt || baseLinkedAt || null
        },
        valorant: {
            linked: Boolean(riot?.products?.valorant?.linked),
            linkedAt: riot?.products?.valorant?.linkedAt || null,
            consentRequired: riot?.products?.valorant?.consentRequired !== false,
            consentGranted: Boolean(riot?.products?.valorant?.consentGranted),
            consentedAt: riot?.products?.valorant?.consentedAt || null
        }
    };
};

const buildPublicRiotConnection = (candidate) => {
    const publicHandle = extractPublicRiotHandle(candidate);
    return {
        verified: Boolean(candidate?.connections?.riot?.verified),
        publicHandle,
        publicHandleVisible: Boolean(publicHandle),
        products: getPublicRiotProducts(candidate?.connections?.riot)
    };
};

const buildPublicLinkedConnections = (candidate) => ({
    riot: buildPublicRiotConnection(candidate),
    discord: {
        linked: Boolean(candidate?.connections?.discord?.verified)
    },
    steam: {
        linked: Boolean(candidate?.connections?.steam?.verified)
    },
    epic: {
        linked: Boolean(candidate?.connections?.epic?.verified)
    },
    mlbb: {
        linked: Boolean(candidate?.connections?.mlbb?.verified)
    }
});

const mapFriendPreview = (candidate) => {
    const mainGame = Array.isArray(candidate?.selectedGames) && candidate.selectedGames.length > 0
        ? candidate.selectedGames[0]
        : 'Jugador';

    return {
        id: String(candidate?._id || ''),
        name: candidate?.fullName || candidate?.username || 'Jugador',
        avatar: candidate?.avatar || '',
        status: extractVisibleStatus(candidate),
        rank: mainGame,
        userCode: extractVisibleUserCode(candidate)
    };
};

const mapSocialPreview = (candidate, followingSet = new Set()) => {
    const base = mapFriendPreview(candidate);
    const id = String(candidate?._id || '');
    return {
        ...base,
        username: candidate?.username || '',
        isFollowing: followingSet.has(id)
    };
};

export const checkPhoneAvailability = async (req, res) => {
    try {
        const rawPhone = String(req.query.phone || '').trim();
        const excludeUserId = String(req.query.excludeUserId || '').trim();

        if (!rawPhone) {
            return res.status(400).json({ available: false, message: 'El teléfono es obligatorio' });
        }

        if (!isValidNonNegativeNumberString(rawPhone)) {
            return res.status(400).json({ available: false, message: 'El teléfono debe contener solo números y no puede ser negativo' });
        }

        const query = { phone: rawPhone };
        if (excludeUserId) {
            if (!isValidObjectIdLike(excludeUserId)) {
                return res.status(400).json({ available: false, message: 'ID de usuario inválido para exclusión' });
            }
            query._id = { $ne: excludeUserId };
        }

        const existingUser = await User.findOne(query).select('_id');
        return res.status(200).json({ available: !existingUser });
    } catch (error) {
        console.error('Error verificando teléfono:', error);
        return res.status(500).json({ available: false, message: 'Error verificando disponibilidad del teléfono' });
    }
};

export const checkUsernameAvailability = async (req, res) => {
    try {
        const rawUsername = String(req.query.username || '').trim();
        const excludeUserId = String(req.query.excludeUserId || '').trim();

        if (!rawUsername) {
            return res.status(400).json({ available: false, message: 'El GamerTag es obligatorio' });
        }

        if (!USERNAME_REGEX.test(rawUsername)) {
            return res.status(400).json({ available: false, message: 'El GamerTag debe tener entre 3 y 20 caracteres válidos.' });
        }

        const query = {
            username: { $regex: `^${escapeRegex(rawUsername)}$`, $options: 'i' }
        };

        if (excludeUserId) {
            if (!isValidObjectIdLike(excludeUserId)) {
                return res.status(400).json({ available: false, message: 'ID de usuario inválido para exclusión' });
            }
            query._id = { $ne: excludeUserId };
        }

        const existingUser = await User.findOne(query).select('_id');
        return res.status(200).json({ available: !existingUser });
    } catch (error) {
        console.error('Error verificando GamerTag:', error);
        return res.status(500).json({ available: false, message: 'Error verificando disponibilidad del GamerTag' });
    }
};

export const register = async (req, res) => {
    try {
        const payload = req.body || {};
        const username = String(payload.username || payload.userName || '').trim();
        const email = String(payload.email || '').trim().toLowerCase();
        const password = String(payload.password || '');
        const confirmPassword = String(payload.confirmPassword || '');
        const fullName = String(payload.fullName || '').trim();
        const phone = String(payload.phone || '').trim();
        const country = normalizeCountryName(String(payload.country || '').trim(), { allowCustom: false });
        const birthDate = payload.birthDate;
        const checkTerms = payload.checkTerms === true;

        if (!fullName || !phone || !country || !birthDate || !username || !email || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios para registro.' });
        }

        if (!checkTerms) {
            return res.status(400).json({ message: 'Debes aceptar términos y condiciones.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Correo inválido.' });
        }

        if (!isValidNonNegativeNumberString(phone)) {
            return res.status(400).json({ message: 'El teléfono debe contener solo números y no puede ser negativo.' });
        }

        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ message: 'El GamerTag debe tener entre 3 y 20 caracteres válidos.' });
        }

        // 1. Validaciones básicas antes de tocar la DB
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }
        const phoneExists = await User.findOne({ phone });
        if (phoneExists) {
            return res.status(400).json({ message: 'El teléfono ya está registrado' });
        }
        const usernameExists = await User.findOne({
            username: { $regex: `^${escapeRegex(username)}$`, $options: 'i' }
        });
        if (usernameExists) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Las contraseñas no coinciden' });
        }

        // 2. Referral code processing
        const inputReferralCode = String(payload.referralCode || '').trim().toUpperCase();
        let referredByUser = null;
        if (inputReferralCode) {
            referredByUser = await User.findOne({ referralCode: inputReferralCode }).select('_id').lean();
        }

        // 3. Hashear contraseña
        const selectedGames = filterSupportedGameNames(normalizeStringArray(payload.selectedGames));
        const communityGameSubscriptions = normalizeCommunityGameIds([
            ...selectedGames,
            payload.pendingGameJoinId
        ]);
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generate unique referral code for new user
        const generateRefCode = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = 'GG-';
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
            return code;
        };
        let newReferralCode = generateRefCode();
        while (await User.exists({ referralCode: newReferralCode })) {
            newReferralCode = generateRefCode();
        }

        // 5. Crear usuario con whitelist explícita para evitar mass-assignment
        const user = await User.create({
            fullName,
            phone,
            gender: normalizeGenderValue(payload.gender),
            country,
            birthDate,
            countrySetAt: new Date(),
            birthDateSetAt: new Date(),
            selectedGames,
            communityGameSubscriptions,
            experience: normalizeExperienceValues(payload.experience),
            platforms: normalizePlatformValues(payload.platforms),
            goals: normalizeGoalValues(payload.goals),
            username,
            email,
            password: hashedPassword,
            checkTerms: true,
            referralCode: newReferralCode,
            referredBy: referredByUser?._id || null
        });

        let emailVerificationSent = false;
        try {
            const verificationToken = issueEmailVerificationToken(user);
            await sendVerificationMailToUser(user, verificationToken);
            emailVerificationSent = true;
        } catch (mailError) {
            if (mailError?.message !== 'SMTP_NOT_CONFIGURED') {
                console.error('No se pudo enviar correo de verificacion al registrar:', mailError);
            } else {
                console.warn('SMTP no configurado, se omite correo de verificacion en registro');
            }
        }

        // Welcome notification
        user.notifications.push({
            type: 'success',
            category: 'system',
            title: 'Bienvenido a GLITCH GANG',
            source: 'Sistema',
            message: `Hola ${fullName}! Tu cuenta ha sido creada exitosamente. Explora torneos, unete a equipos y conecta con la comunidad esports.`,
            status: 'unread',
            visuals: { icon: 'bx-party', color: '#8EDB15', glow: true },
            createdAt: new Date()
        });
        await user.save();

        // Opcional: No devolver la contraseña en la respuesta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            ...userResponse,
            emailVerification: {
                sent: emailVerificationSent,
                message: emailVerificationSent
                    ? 'Revisa tu correo para verificar tu cuenta.'
                    : 'Tu cuenta fue creada, pero no pudimos enviar el email de verificación. Puedes reenviar desde Configuración.'
            }
        });

    } catch (error) {
        console.error("Error en Registro:", error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

export const login = async (req, res) => {
    try {
        const body = req.body;

        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            return res.status(400).json({ message: 'Payload inválido' });
        }

        const { email, password, rememberMe } = body;

        if (!isStringField(email) || !isStringField(password)) {
            return res.status(400).json({ message: 'Correo y contraseña deben ser texto válido' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
        }

        // 1. Buscar usuario
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 2. Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: 'Configuración de autenticación incompleta' });
        }

        const useRememberSession = normalizeBoolean(rememberMe, false);
        const sessionTtlMs = useRememberSession ? AUTH_TOKEN_REMEMBER_TTL_MS : AUTH_TOKEN_TTL_MS;
        const sessionTtlSeconds = Math.max(60, Math.floor(sessionTtlMs / 1000));

        // 3. Check if 2FA is enabled
        if (user.twoFactorEnabled) {
            const twoFactorCode = String(body.twoFactorCode || body.twoFactorToken || '').trim();
            
            // If no code provided, ask for it
            if (!twoFactorCode) {
                return res.status(200).json({
                    requiresTwoFactor: true,
                    userId: user._id,
                    message: 'Se requiere factor de seguridad (2FA).'
                });
            }

            // Verify the code
            const isValid = verifySync({ token: twoFactorCode, secret: user.twoFactorSecret })?.valid;
            if (!isValid) {
                return res.status(401).json({ message: 'Código de seguridad incorrecto.' });
            }
            // If valid, proceed to session generation
        }

        // 4. Generate Token with jti for session tracking
        const jti = crypto.randomUUID();
        const authToken = jwt.sign(
            { id: user._id, jti },
            process.env.JWT_SECRET,
            { expiresIn: sessionTtlSeconds }
        );
        const csrfToken = generateCsrfToken();

        // Create session record
        const ua = req.headers?.['user-agent'] || '';
        const deviceLabel = parseDeviceLabel(ua);
        await Session.create({
            userId: user._id,
            jti,
            userAgent: ua,
            ip: req.ip || '',
            deviceLabel,
            expiresAt: new Date(Date.now() + sessionTtlMs),
        });

        await recordActivity({ userId: user._id, event: 'login', req });

        res.cookie(AUTH_COOKIE_NAME, authToken, buildAuthCookieOptions(sessionTtlMs));
        res.cookie(CSRF_COOKIE_NAME, csrfToken, buildCsrfCookieOptions(sessionTtlMs));

        res.status(200).json({
            session: true,
            token: authToken,
            rememberMe: useRememberSession,
            expiresInSeconds: sessionTtlSeconds,
            user: {
                id: user._id,
                userName: user.username,
                username: user.username,
                email: user.email,
                emailVerified: Boolean(user.emailVerified)
            }
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const logout = async (req, res) => {
    // Revoke session if jti is present
    if (req.sessionJti) {
        await Session.updateOne({ jti: req.sessionJti }, { revokedAt: new Date() }).catch(() => {});
        recordActivity({ userId: req.userId, event: 'logout', req }).catch(() => {});
    }
    const clearOptions = { ...buildAuthCookieOptions() };
    delete clearOptions.maxAge;
    clearOptions.expires = new Date(0);
    const clearCsrfOptions = { ...buildCsrfCookieOptions() };
    delete clearCsrfOptions.maxAge;
    clearCsrfOptions.expires = new Date(0);
    res.clearCookie(AUTH_COOKIE_NAME, clearOptions);
    res.clearCookie(CSRF_COOKIE_NAME, clearCsrfOptions);
    return res.status(200).json({ message: 'Sesión cerrada' });
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -__v -connections.riot.pendingLink')
            .populate(
                'teams',
                [
                    'name',
                    'logo',
                    'game',
                    'teamCode',
                    'teamCountry',
                    'teamLevel',
                    'maxMembers',
                    'maxSubstitutes',
                    'captain',
                    'university',
                    'roster.starters.user',
                    'roster.starters.role',
                    'roster.subs.user',
                    'roster.subs.role',
                    'roster.coach.user',
                    'roster.coach.role'
                ].join(' ')
            );
        
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        let needsSave = false;
        if (!user.userCode) needsSave = true;
        if (!user.referralCode) {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = 'GG-';
            for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
            user.referralCode = code;
            needsSave = true;
        }
        if (needsSave) await user.save();
        const payload = user.toObject();
        payload.selectedGames = filterSupportedGameNames(payload.selectedGames);
        payload.competitiveProfiles = normalizeCompetitiveProfilesPayload(
            payload.competitiveProfiles,
            payload.selectedGames
        );
        payload.teams = Array.isArray(payload.teams)
            ? payload.teams.filter((team) => isSupportedGameName(team?.game))
            : [];
        res.status(200).json(payload);

    } catch (error) {
        console.error("Error en getProfile:", error);
        res.status(500).json({ message: "Error al obtener el perfil" });
    }
};

export const getUserCard = async (req, res) => {
    try {
        const targetUserId = String(req.params?.userId || '').trim();
        if (!isValidObjectIdLike(targetUserId)) {
            return res.status(400).json({ message: 'Usuario inválido.' });
        }

        const [viewer, target] = await Promise.all([
            User.findById(req.userId).select('following').lean(),
            User.findById(targetUserId)
                .select('username avatar status selectedGames country experience connections.riot connections.discord.verified connections.steam.verified connections.epic.verified connections.mlbb.verified isOrganizer teams selectedTagId selectedFrameId userCode university.universityName university.verified university.verifiedAt privacy.showOnlineStatus privacy.showPublicUserCode privacy.showPublicRiotHandle')
                .populate('teams', 'name logo game teamCode')
                .lean()
        ]);

        if (!target) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const viewerFollowing = new Set(toIdArray(viewer?.following));
        const isFollowing = viewerFollowing.has(String(target?._id || ''));

        return res.status(200).json({
            id: String(target?._id || ''),
            username: target?.username || 'Jugador',
            avatar: target?.avatar || '',
            status: extractVisibleStatus(target),
            selectedGames: Array.isArray(target?.selectedGames) ? target.selectedGames : [],
            country: target?.country || '',
            experience: Array.isArray(target?.experience) ? target.experience : [],
            isOrganizer: Boolean(target?.isOrganizer),
            selectedTagId: target?.selectedTagId || null,
            selectedFrameId: target?.selectedFrameId || null,
            userCode: extractVisibleUserCode(target),
            university: {
                verified: Boolean(target?.university?.verified),
                universityName: target?.university?.verified ? String(target?.university?.universityName || '') : '',
                verifiedAt: target?.university?.verified ? target?.university?.verifiedAt || null : null
            },
            connections: buildPublicLinkedConnections(target),
            teams: Array.isArray(target?.teams)
                ? target.teams.filter((team) => isSupportedGameName(team?.game))
                : [],
            isFollowing
        });
    } catch (error) {
        console.error('Error en getUserCard:', error);
        return res.status(500).json({ message: 'Error al cargar la tarjeta de usuario.' });
    }
};

export const getPublicProfile = async (req, res) => {
    try {
        const param = String(req.params?.userIdOrCode || req.params?.userId || '').trim();
        if (!param) {
            return res.status(400).json({ message: 'Usuario inválido.' });
        }

        const viewerIdStr = String(req.userId);

        const isObjectId = isValidObjectIdLike(param);
        const query = isObjectId ? { _id: param } : { userCode: param };

        const target = await User.findOne(query)
            .select('username fullName avatar bio status country selectedGames experience preferredRoles languages socialLinks gamingConnections competitiveProfiles lookingForTeam selectedFrameId selectedBgId selectedTagId userCode university connections.riot connections.discord.verified connections.steam.verified connections.epic connections.mlbb.verified isOrganizer roles createdAt followers following privacy.showOnlineStatus privacy.showPublicUserCode privacy.showPublicRiotHandle')
            .lean();

        if (!target) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const targetUserId = String(target._id);

        const viewer = await User.findById(req.userId).select('following friends').lean();
        const viewerFollowing = new Set(toIdArray(viewer?.following));
        const isFollowing = viewerFollowing.has(String(target._id));

        const targetFollowingIds = toIdArray(target.following);
        const targetFollowerSet = new Set(toIdArray(target.followers));
        const isMutual = viewerFollowing.has(String(target._id)) && targetFollowerSet.has(viewerIdStr);

        const teams = await Team.find({
            game: { $in: SUPPORTED_GAME_NAMES },
            $or: [
                { captain: targetUserId },
                { 'roster.starters.user': targetUserId },
                { 'roster.subs.user': targetUserId },
                { 'roster.coach.user': targetUserId }
            ]
        })
            .select('name logo game teamCode captain roster createdAt slogan teamCountry category teamLevel')
            .lean();

        const teamIds = teams.map(t => t._id);
        const teamIdSet = new Set(teamIds.map(id => String(id)));
        const captainTeams = teams.filter(t => String(t?.captain || '') === String(targetUserId)).length;

        const tournaments = teamIds.length
            ? await Tournament.find({ 'registrations.teamId': { $in: teamIds } })
                .select('title game status date registrations.teamId registrations.status bracket.rounds.round bracket.rounds.matches.teamA.teamId bracket.rounds.matches.teamB.teamId bracket.rounds.matches.winnerTeamId bracket.rounds.matches.status')
                .lean()
            : [];

        let matchesPlayed = 0, matchesWon = 0, tournamentsJoined = 0, tournamentsWon = 0;

        tournaments.forEach(tournament => {
            const registrations = Array.isArray(tournament?.registrations) ? tournament.registrations : [];
            const joined = registrations.some(reg => teamIdSet.has(String(reg?.teamId || '')) && String(reg?.status || '').toLowerCase() !== 'rejected');
            if (joined) tournamentsJoined += 1;

            const rounds = Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [];
            rounds.forEach(round => {
                const matches = Array.isArray(round?.matches) ? round.matches : [];
                matches.forEach(match => {
                    if (String(match?.status || '').toLowerCase() !== 'finished') return;
                    const tA = String(match?.teamA?.teamId || '');
                    const tB = String(match?.teamB?.teamId || '');
                    if (!teamIdSet.has(tA) && !teamIdSet.has(tB)) return;
                    matchesPlayed += 1;
                    if (teamIdSet.has(String(match?.winnerTeamId || ''))) matchesWon += 1;
                });
            });

            if (String(tournament?.status || '').toLowerCase() === 'finished' && rounds.length > 0) {
                const sorted = [...rounds].sort((a, b) => Number(a?.round || 0) - Number(b?.round || 0));
                const finalMatches = Array.isArray(sorted[sorted.length - 1]?.matches) ? sorted[sorted.length - 1].matches : [];
                const champion = finalMatches.find(m => m?.winnerTeamId);
                if (champion && teamIdSet.has(String(champion.winnerTeamId))) tournamentsWon += 1;
            }
        });

        const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

        const communitiesDocs = await Community.find({
            isActive: true,
            $or: [{ createdBy: targetUserId }, { 'members.user': targetUserId }]
        })
            .sort({ createdAt: -1 })
            .limit(8)
            .select('name shortUrl membersCount mainGames media.avatarUrl createdAt createdBy members.user members.role')
            .lean();

        const communities = communitiesDocs.map(community => {
            const members = Array.isArray(community?.members) ? community.members : [];
            const isOwner = String(community?.createdBy || '') === String(targetUserId);
            const memberEntry = members.find(e => String(e?.user || '') === String(targetUserId));
            return {
                id: String(community?._id || ''),
                name: community?.name || 'Comunidad',
                shortUrl: community?.shortUrl || '',
                image: community?.media?.avatarUrl || '',
                members: Number(community?.membersCount || members.length || 0),
                role: formatCommunityRoleLabel(isOwner ? 'owner' : memberEntry?.role || 'member')
            };
        });

        const mutualFriendIds = targetFollowingIds.filter(id => targetFollowerSet.has(id) && id !== String(targetUserId));
        const mutualFriendUsers = mutualFriendIds.length > 0
            ? await User.find({ _id: { $in: mutualFriendIds } })
                .select('username avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
                .limit(24)
                .lean()
            : [];
        const friends = mutualFriendUsers.map(f => mapFriendPreview(f))
            .sort((a, b) => {
                const pa = PROFILE_STATUS_PRIORITY[String(a.status || '').toLowerCase()] ?? 99;
                const pb = PROFILE_STATUS_PRIORITY[String(b.status || '').toLowerCase()] ?? 99;
                return pa !== pb ? pa - pb : String(a.name).localeCompare(String(b.name), 'es');
            });

        const recognitions = [];
        if (tournamentsWon > 0) recognitions.push({ id: 'recognition-tournament-winner', name: tournamentsWon > 1 ? `${tournamentsWon} títulos logrados` : 'Campeón de torneo', event: 'Competencia oficial', type: 'gold' });
        if (target?.university?.verified) recognitions.push({ id: 'recognition-university-verified', name: 'Estudiante verificado', event: target?.university?.universityName || 'Universidad', type: 'silver' });
        if (captainTeams > 0) recognitions.push({ id: 'recognition-team-leader', name: captainTeams > 1 ? `Lidera ${captainTeams} equipos` : 'Líder de equipo', event: 'Gestión competitiva', type: 'gold' });
        if (winRate >= 60 && matchesPlayed >= 5) recognitions.push({ id: 'recognition-winrate', name: `Win rate ${winRate}%`, event: `${matchesWon} victorias oficiales`, type: 'silver' });

        const achievements = [];
        if (captainTeams > 0) achievements.push({ id: 'team-captain', name: 'Capitán de equipo', icon: '👑', tournament: 'Gestión de equipos', date: formatMonthYear(target?.createdAt), verified: true });
        if (tournamentsJoined > 0) achievements.push({ id: 'tournament-competitor', name: 'Competidor activo', icon: '🎮', tournament: `${tournamentsJoined} torneos`, date: formatMonthYear(Date.now()), verified: true });
        if (tournamentsWon > 0) achievements.push({ id: 'tournament-winner', name: 'Campeón de torneo', icon: '🏆', tournament: `${tournamentsWon} título(s)`, date: formatMonthYear(Date.now()), verified: true });
        if (target?.university?.verified) achievements.push({ id: 'university-verified', name: 'Verificación universitaria', icon: '🎓', tournament: target?.university?.universityName || 'Universidad', date: formatMonthYear(target?.university?.verifiedAt), verified: true });

        const teamsPublic = teams.filter(t => isSupportedGameName(t?.game)).map(t => ({
            _id: String(t._id),
            name: t.name,
            logo: t.logo || '',
            game: t.game,
            teamCode: t.teamCode || '',
            slogan: t.slogan || '',
            teamCountry: t.teamCountry || '',
            category: t.category || '',
            teamLevel: t.teamLevel || '',
            memberCount: (t.roster?.starters?.length || 0) + (t.roster?.subs?.length || 0) + (t.roster?.coach ? 1 : 0),
            isCaptain: String(t?.captain || '') === String(targetUserId)
        }));

        return res.status(200).json({
            id: String(target._id),
            username: target.username || 'Jugador',
            fullName: target.fullName || '',
            avatar: target.avatar || '',
            bio: target.bio || '',
            status: extractVisibleStatus(target),
            country: target.country || '',
            selectedGames: Array.isArray(target.selectedGames) ? target.selectedGames : [],
            experience: Array.isArray(target.experience) ? target.experience : [],
            preferredRoles: Array.isArray(target.preferredRoles) ? target.preferredRoles : [],
            languages: Array.isArray(target.languages) ? target.languages : [],
            socialLinks: target.socialLinks || {},
            gamingConnections: target.gamingConnections || {},
            competitiveProfiles: normalizeCompetitiveProfilesPayload(
                target.competitiveProfiles,
                target.selectedGames
            ),
            lookingForTeam: Boolean(target.lookingForTeam),
            isOrganizer: Boolean(target.isOrganizer),
            roles: target.roles || {},
            selectedTagId: target.selectedTagId || null,
            selectedFrameId: target.selectedFrameId || null,
            selectedBgId: target.selectedBgId || null,
            userCode: extractVisibleUserCode(target),
            university: {
                verified: Boolean(target?.university?.verified),
                universityName: target?.university?.verified ? String(target?.university?.universityName || '') : ''
            },
            connections: buildPublicLinkedConnections(target),
            createdAt: target.createdAt,
            followersCount: Array.isArray(target.followers) ? target.followers.length : 0,
            followingCount: Array.isArray(target.following) ? target.following.length : 0,
            isFollowing,
            isMutual,
            stats: { matches: matchesPlayed, wins: matchesWon, winRate, tournaments: tournamentsJoined, tournamentsWon, teams: teams.length },
            teams: teamsPublic,
            communities,
            friends,
            achievements,
            recognitions
        });
    } catch (error) {
        console.error('Error en getPublicProfile:', error);
        return res.status(500).json({ message: 'Error al cargar el perfil público.' });
    }
};

// ── Apply referral code (post-registration) ──
export const applyReferralCode = async (req, res) => {
    try {
        const code = String(req.body?.code || '').trim().toUpperCase();
        if (!code) return res.status(400).json({ message: 'Código requerido.' });

        const user = await User.findById(req.userId).select('referredBy referralCode');
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
        if (user.referredBy) return res.status(400).json({ message: 'Ya tienes un código de referido aplicado.' });
        if (user.referralCode === code) return res.status(400).json({ message: 'No puedes usar tu propio código.' });

        const referrer = await User.findOne({ referralCode: code }).select('_id');
        if (!referrer) return res.status(404).json({ message: 'Código no válido.' });

        user.referredBy = referrer._id;
        await user.save();
        await User.updateOne({ _id: referrer._id }, { $inc: { referralCount: 1 } });

        res.json({ message: 'Código aplicado correctamente.' });
    } catch (error) {
        console.error('Error applying referral:', error);
        res.status(500).json({ message: 'Error al aplicar el código.' });
    }
};

export const toggleFollow = async (req, res) => {
    try {
        const targetUserId = String(req.params?.userId || '').trim();
        if (!isValidObjectIdLike(targetUserId)) {
            return res.status(400).json({ message: 'Usuario inválido.' });
        }
        if (String(req.userId) === targetUserId) {
            return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
        }

        const [viewer, target] = await Promise.all([
            User.findById(req.userId).select('fullName username following'),
            User.findById(targetUserId).select('fullName username followers notifications')
        ]);

        if (!viewer || !target) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const viewerFollowing = new Set(toIdArray(viewer.following));
        const targetFollowers = new Set(toIdArray(target.followers));

        const alreadyFollowing = viewerFollowing.has(targetUserId);
        if (alreadyFollowing) {
            viewerFollowing.delete(targetUserId);
            targetFollowers.delete(String(viewer._id));

            target.notifications = Array.isArray(target.notifications) ? target.notifications : [];
            target.notifications.unshift({
                type: 'social',
                category: 'social',
                title: 'Dejó de seguirte',
                source: viewer.fullName || viewer.username || 'Jugador',
                message: `${viewer.fullName || viewer.username || 'Un usuario'} dejó de seguirte.`,
                status: 'unread',
                createdAt: new Date(),
                visuals: { icon: 'bx-user-minus', color: '#ff4d4d', glow: false },
                meta: {
                    userId: String(viewer._id),
                    action: 'unfollow'
                }
            });

            if (target.notifications.length > 80) {
                target.notifications = target.notifications.slice(0, 80);
            }
        } else {
            viewerFollowing.add(targetUserId);
            targetFollowers.add(String(viewer._id));

            target.notifications = Array.isArray(target.notifications) ? target.notifications : [];
            target.notifications.unshift({
                type: 'social',
                category: 'social',
                title: 'Nuevo seguidor',
                source: viewer.fullName || viewer.username || 'Jugador',
                message: `${viewer.fullName || viewer.username || 'Un usuario'} empezó a seguirte.`,
                status: 'unread',
                createdAt: new Date(),
                meta: {
                    userId: String(viewer._id),
                    action: 'follow'
                }
            });

            if (target.notifications.length > 80) {
                target.notifications = target.notifications.slice(0, 80);
            }
        }

        viewer.following = toObjectIdArray(Array.from(viewerFollowing));
        target.followers = toObjectIdArray(Array.from(targetFollowers));

        await Promise.all([viewer.save(), target.save()]);

        return res.status(200).json({
            followed: !alreadyFollowing,
            followersCount: target.followers.length,
            followingCount: viewer.following.length,
            message: alreadyFollowing ? 'Dejaste de seguir al usuario.' : 'Ahora sigues a este usuario.'
        });
    } catch (error) {
        console.error('Error en toggleFollow:', error);
        return res.status(500).json({ message: 'Error al procesar seguimiento.' });
    }
};

export const getFriends = async (req, res) => {
    try {
        const viewer = await User.findById(req.userId).select('followers following').lean();
        if (!viewer) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const followingIds = toIdArray(viewer.following);
        const followerSet = new Set(toIdArray(viewer.followers));
        const mutualIds = followingIds.filter((id) => followerSet.has(id) && id !== String(req.userId));

        if (mutualIds.length === 0) {
            return res.status(200).json({ friends: [] });
        }

        const friendUsers = await User.find({ _id: { $in: mutualIds } })
            .select('username fullName avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
            .lean();

        const friends = friendUsers
            .map(mapFriendPreview)
            .sort((a, b) => {
                const pa = PROFILE_STATUS_PRIORITY[String(a.status || '').toLowerCase()] ?? 99;
                const pb = PROFILE_STATUS_PRIORITY[String(b.status || '').toLowerCase()] ?? 99;
                if (pa !== pb) return pa - pb;
                return String(a.name).localeCompare(String(b.name), 'es');
            });

        return res.status(200).json({ friends });
    } catch (error) {
        console.error('Error en getFriends:', error);
        return res.status(500).json({ message: 'Error al cargar amigos.' });
    }
};

export const getSocialOverview = async (req, res) => {
    try {
        const viewer = await User.findById(req.userId).select('followers following').lean();
        if (!viewer) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const viewerId = String(req.userId);
        const followingIds = toIdArray(viewer.following).filter((id) => id !== viewerId);
        const followerIds = toIdArray(viewer.followers).filter((id) => id !== viewerId);
        const followingSet = new Set(followingIds);
        const friendIds = followerIds.filter((id) => followingSet.has(id));

        const userIdsToFetch = Array.from(new Set([...followingIds, ...followerIds]));
        const users = userIdsToFetch.length > 0
            ? await User.find({ _id: { $in: userIdsToFetch } })
                .select('username fullName avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
                .lean()
            : [];

        const userMap = new Map(users.map((entry) => [String(entry?._id || ''), entry]));
        const sortByStatusThenName = (a, b) => {
            const pa = PROFILE_STATUS_PRIORITY[String(a.status || '').toLowerCase()] ?? 99;
            const pb = PROFILE_STATUS_PRIORITY[String(b.status || '').toLowerCase()] ?? 99;
            if (pa !== pb) return pa - pb;
            return String(a.name).localeCompare(String(b.name), 'es');
        };

        const following = followingIds
            .map((id) => userMap.get(id))
            .filter(Boolean)
            .map((entry) => mapSocialPreview(entry, followingSet))
            .sort(sortByStatusThenName);

        const followers = followerIds
            .map((id) => userMap.get(id))
            .filter(Boolean)
            .map((entry) => mapSocialPreview(entry, followingSet))
            .sort(sortByStatusThenName);

        const friends = friendIds
            .map((id) => userMap.get(id))
            .filter(Boolean)
            .map((entry) => mapSocialPreview(entry, followingSet))
            .sort(sortByStatusThenName);

        return res.status(200).json({
            friends,
            followers,
            following,
            counts: {
                friends: friends.length,
                followers: followers.length,
                following: following.length
            }
        });
    } catch (error) {
        console.error('Error en getSocialOverview:', error);
        return res.status(500).json({ message: 'Error al cargar estado social.' });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const query = String(req.query?.q || '').trim();
        const requestedLimit = Number.parseInt(String(req.query?.limit || '12'), 10);
        const limit = Number.isFinite(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 25)
            : 12;

        if (query.length < 2) {
            return res.status(200).json({ users: [] });
        }

        const viewer = await User.findById(req.userId).select('following').lean();
        if (!viewer) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const followingSet = new Set(toIdArray(viewer.following));
        const q = escapeRegex(query);
        const codeQuery = normalizeUserCodeLookup(query);
        const orFilters = [
            { username: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } }
        ];
        if (isValidObjectIdLike(query)) {
            orFilters.push({ _id: query });
        }
        if (codeQuery.length >= 2) {
            orFilters.push({
                $and: [
                    { userCode: codeQuery },
                    { 'privacy.showPublicUserCode': { $ne: false } }
                ]
            });
            orFilters.push({
                $and: [
                    {
                        $expr: {
                            $regexMatch: {
                                input: { $toString: { $ifNull: ['$userCode', ''] } },
                                regex: `^${escapeRegex(codeQuery)}`
                            }
                        }
                    },
                    { 'privacy.showPublicUserCode': { $ne: false } }
                ]
            });
        }

        const users = await User.find({
            _id: { $ne: req.userId },
            isProfileHidden: { $ne: true },
            $or: orFilters
        })
            .select('username fullName avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
            .limit(limit)
            .lean();

        const visibleUsers = users
            .map((entry) => mapSocialPreview(entry, followingSet))
            .sort((a, b) => {
                const pa = PROFILE_STATUS_PRIORITY[String(a.status || '').toLowerCase()] ?? 99;
                const pb = PROFILE_STATUS_PRIORITY[String(b.status || '').toLowerCase()] ?? 99;
                if (pa !== pb) return pa - pb;
                return String(a.name).localeCompare(String(b.name), 'es');
            });

        return res.status(200).json({
            users: visibleUsers
        });
    } catch (error) {
        console.error('Error en searchUsers:', error);
        return res.status(500).json({ message: 'Error al buscar usuarios.' });
    }
};

export const getProfileOverview = async (req, res) => {
    try {
        const userDoc = await User.findById(req.userId)
            .select('username fullName avatar bio status country phone birthDate selectedGames preferredRoles languages socialLinks gamingConnections lookingForTeam selectedFrameId selectedBgId selectedTagId university connections notifications createdAt followers following userCode privacy.showPublicUserCode');
        if (!userDoc) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (!userDoc.userCode) {
            await userDoc.save();
        }
        const user = userDoc.toObject();

        const userIdStr = String(req.userId);
        const teams = await Team.find({
            game: { $in: SUPPORTED_GAME_NAMES },
            $or: [
                { captain: req.userId },
                { 'roster.starters.user': req.userId },
                { 'roster.subs.user': req.userId },
                { 'roster.coach.user': req.userId }
            ]
        })
            .select('name logo game teamCode captain roster createdAt')
            .lean();

        const teamIds = teams.map((team) => team._id);
        const teamIdSet = new Set(teamIds.map((id) => String(id)));
        const captainTeams = teams.filter((team) => String(team?.captain || '') === userIdStr).length;

        const tournaments = teamIds.length
            ? await Tournament.find({ 'registrations.teamId': { $in: teamIds } })
                .select('title game status date createdAt registrations.teamId registrations.status registrations.registeredAt bracket.rounds.round bracket.rounds.matches.teamA.teamId bracket.rounds.matches.teamB.teamId bracket.rounds.matches.winnerTeamId bracket.rounds.matches.status')
                .lean()
            : [];

        let matchesPlayed = 0;
        let matchesWon = 0;
        let tournamentsJoined = 0;
        let tournamentsWon = 0;
        let tournamentsOngoing = 0;

        tournaments.forEach((tournament) => {
            const registrations = Array.isArray(tournament?.registrations) ? tournament.registrations : [];
            const ownRegistrations = registrations.filter((reg) => teamIdSet.has(String(reg?.teamId || '')));
            const joinedThisTournament = ownRegistrations.some(
                (reg) => String(reg?.status || '').toLowerCase() !== 'rejected'
            );

            if (joinedThisTournament) {
                tournamentsJoined += 1;
                if (String(tournament?.status || '').toLowerCase() === 'ongoing') {
                    tournamentsOngoing += 1;
                }
            }

            const rounds = Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [];
            rounds.forEach((round) => {
                const matches = Array.isArray(round?.matches) ? round.matches : [];
                matches.forEach((match) => {
                    if (String(match?.status || '').toLowerCase() !== 'finished') return;
                    const teamAId = String(match?.teamA?.teamId || '');
                    const teamBId = String(match?.teamB?.teamId || '');
                    const involvesMyTeams = teamIdSet.has(teamAId) || teamIdSet.has(teamBId);
                    if (!involvesMyTeams) return;

                    matchesPlayed += 1;
                    const winnerId = String(match?.winnerTeamId || '');
                    if (teamIdSet.has(winnerId)) matchesWon += 1;
                });
            });

            if (String(tournament?.status || '').toLowerCase() === 'finished' && rounds.length > 0) {
                const sortedRounds = [...rounds].sort(
                    (a, b) => Number(a?.round || 0) - Number(b?.round || 0)
                );
                const finalRound = sortedRounds[sortedRounds.length - 1];
                const finalMatches = Array.isArray(finalRound?.matches) ? finalRound.matches : [];
                const championMatch = finalMatches.find((match) => match?.winnerTeamId);
                const championTeamId = String(championMatch?.winnerTeamId || '');
                if (championTeamId && teamIdSet.has(championTeamId)) {
                    tournamentsWon += 1;
                }
            }
        });

        const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;

        const teammateIds = new Set();
        const addTeammateId = (candidate) => {
            const id = String(candidate || '').trim();
            if (!id || id === userIdStr) return;
            teammateIds.add(id);
        };

        teams.forEach((team) => {
            addTeammateId(team?.captain);
            const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
            const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
            const coach = team?.roster?.coach || null;
            starters.forEach((slot) => addTeammateId(slot?.user));
            subs.forEach((slot) => addTeammateId(slot?.user));
            if (coach?.user) addTeammateId(coach.user);
        });

        const teammateUsers = teammateIds.size > 0
            ? await User.find({ _id: { $in: Array.from(teammateIds) } })
                .select('username fullName avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
                .lean()
            : [];

        const followingIds = toIdArray(user?.following);
        const followerSet = new Set(toIdArray(user?.followers));
        const mutualFriendIds = followingIds.filter((id) => followerSet.has(id) && id !== userIdStr);

        const mutualFriendUsers = mutualFriendIds.length > 0
            ? await User.find({ _id: { $in: mutualFriendIds } })
                .select('username fullName avatar status selectedGames userCode privacy.showOnlineStatus privacy.showPublicUserCode')
                .lean()
            : [];

        const friendMap = new Map();
        mutualFriendUsers.forEach((friendUser) => {
            const id = String(friendUser?._id || '');
            if (!id) return;
            friendMap.set(id, mapFriendPreview(friendUser));
        });
        teammateUsers.forEach((teammate) => {
            const id = String(teammate?._id || '');
            if (!id || friendMap.has(id)) return;
            friendMap.set(id, mapFriendPreview(teammate));
        });

        const friends = Array.from(friendMap.values())
            .sort((a, b) => {
                const pa = PROFILE_STATUS_PRIORITY[String(a.status || '').toLowerCase()] ?? 99;
                const pb = PROFILE_STATUS_PRIORITY[String(b.status || '').toLowerCase()] ?? 99;
                if (pa !== pb) return pa - pb;
                return String(a.name).localeCompare(String(b.name), 'es');
            })
            .slice(0, 24);

        const ownPosts = await CommunityPost.find({ author: req.userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('text likes comments createdAt')
            .lean();

        const wallComments = ownPosts.map((post) => {
            const likes = Array.isArray(post?.likes) ? post.likes : [];
            const comments = Array.isArray(post?.comments) ? post.comments : [];
            return {
                id: `post-${String(post?._id || '')}`,
                user: {
                    name: user?.username || user?.fullName || 'Tú',
                    avatar: user?.avatar || ''
                },
                text: String(post?.text || '').slice(0, 600),
                time: post?.createdAt || new Date(),
                likes: likes.length,
                liked: likes.some((likedUserId) => String(likedUserId) === userIdStr),
                commentsCount: comments.length
            };
        });

        const likesReceived = ownPosts.reduce((acc, post) => {
            const likes = Array.isArray(post?.likes) ? post.likes.length : 0;
            return acc + likes;
        }, 0);
        const commentsReceived = ownPosts.reduce((acc, post) => {
            const comments = Array.isArray(post?.comments) ? post.comments.length : 0;
            return acc + comments;
        }, 0);

        const notifications = Array.isArray(user?.notifications)
            ? [...user.notifications]
            : [];
        notifications.sort(
            (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        );

        const mapActivityType = (category = '') => {
            const normalized = String(category || '').toLowerCase();
            if (normalized === 'tournament') return 'win';
            if (normalized === 'team') return 'team';
            if (normalized === 'social') return 'achievement';
            return 'rank';
        };

        let activity = notifications.slice(0, 8).map((note, index) => ({
            id: String(note?._id || `note-${index}`),
            type: mapActivityType(note?.category),
            title: note?.title || 'Actividad',
            text: note?.message || '',
            source: note?.source || 'Sistema',
            createdAt: note?.createdAt || new Date()
        }));

        if (activity.length === 0) {
            activity = [
                ...teams.slice(0, 3).map((team, index) => ({
                    id: `team-${String(team?._id || index)}`,
                    type: 'team',
                    title: 'Equipo activo',
                    text: `Participas en ${team?.name || 'un equipo'}.`,
                    source: 'Equipos',
                    createdAt: team?.createdAt || new Date()
                })),
                ...tournaments.slice(0, 3).map((tournament, index) => ({
                    id: `tour-${String(tournament?._id || index)}`,
                    type: 'win',
                    title: tournament?.title || 'Torneo',
                    text: `Actividad en torneo ${tournament?.game || 'eSports'}.`,
                    source: 'Torneos',
                    createdAt: tournament?.date || tournament?.createdAt || new Date()
                }))
            ].slice(0, 8);
        }

        const communitiesDocs = await Community.find({
            isActive: true,
            $or: [{ createdBy: req.userId }, { 'members.user': req.userId }]
        })
            .sort({ createdAt: -1 })
            .limit(8)
            .select('name shortUrl membersCount mainGames media.avatarUrl createdAt createdBy members.user members.role')
            .lean();

        const communities = communitiesDocs.map((community) => {
            const members = Array.isArray(community?.members) ? community.members : [];
            const isOwner = String(community?.createdBy || '') === userIdStr;
            const memberEntry = members.find(
                (entry) => String(entry?.user || '') === userIdStr
            );

            return {
                id: String(community?._id || ''),
                name: community?.name || 'Comunidad',
                shortUrl: community?.shortUrl || '',
                image: community?.media?.avatarUrl || '',
                members: Number(community?.membersCount || members.length || 0),
                role: formatCommunityRoleLabel(isOwner ? 'owner' : memberEntry?.role || 'member'),
                mainGame: Array.isArray(community?.mainGames) ? community.mainGames[0] || '' : '',
                createdAt: community?.createdAt || null
            };
        });

        const progression = buildProfileProgression({
            user,
            teamsCount: teams.length,
            captainTeams,
            mutualFriendsCount: mutualFriendUsers.length,
            communitiesCount: communities.length,
            postsCount: ownPosts.length,
            likesReceived,
            commentsReceived,
            tournamentsJoined,
            tournamentsWon,
            matchesPlayed,
            matchesWon
        });

        const progressionAchievements = progression.achievements
            .filter((achievement) => achievement.unlocked)
            .slice(0, 8)
            .map((achievement) => ({
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                iconClass: achievement.iconClass,
                tournament: achievement.description,
                date: achievement.progressLabel,
                subtitle: achievement.category === 'competitive'
                    ? 'Competitivo'
                    : achievement.category === 'team'
                        ? 'Equipos'
                        : achievement.category === 'community'
                            ? 'Comunidad'
                            : achievement.category === 'social'
                                ? 'Social'
                                : 'Perfil',
                meta: achievement.progressLabel,
                verified: true
            }));
        const achievements = [];
        if (captainTeams > 0) {
            achievements.push({
                id: 'team-captain',
                name: 'Capitán de equipo',
                icon: '👑',
                tournament: 'Gestión de equipos',
                game: 'General',
                date: formatMonthYear(user?.createdAt || Date.now()),
                verified: true
            });
        }
        if (tournamentsJoined > 0) {
            achievements.push({
                id: 'tournament-competitor',
                name: 'Competidor activo',
                icon: '🎮',
                tournament: `${tournamentsJoined} torneos`,
                game: 'eSports',
                date: formatMonthYear(Date.now()),
                verified: true
            });
        }
        if (tournamentsWon > 0) {
            achievements.push({
                id: 'tournament-winner',
                name: 'Campeón de torneo',
                icon: '🏆',
                tournament: `${tournamentsWon} título(s)`,
                game: 'eSports',
                date: formatMonthYear(Date.now()),
                verified: true
            });
        }
        if (user?.university?.verified) {
            achievements.push({
                id: 'university-verified',
                name: 'Verificación universitaria',
                icon: '🎓',
                tournament: user?.university?.universityName || 'Universidad',
                game: 'Academia',
                date: formatMonthYear(user?.university?.verifiedAt || Date.now()),
                verified: true
            });
        }
        if (user?.connections?.riot?.verified || user?.connections?.mlbb?.verified) {
            achievements.push({
                id: 'account-linked',
                name: 'Cuenta de juego validada',
                icon: '✅',
                tournament: 'Integración de cuenta',
                game: user?.connections?.riot?.verified ? 'Riot' : 'MLBB',
                date: formatMonthYear(Date.now()),
                verified: true
            });
        }
        if (matchesWon >= 10) {
            achievements.push({
                id: 'match-winner-10',
                name: 'Racha competitiva',
                icon: '🔥',
                tournament: `${matchesWon} victorias`,
                game: 'Partidas oficiales',
                date: formatMonthYear(Date.now()),
                verified: false
            });
        }

        const visibleAchievements = progressionAchievements;
        const recognitions = [];
        if (tournamentsWon > 0) {
            recognitions.push({
                id: 'recognition-tournament-winner',
                name: tournamentsWon > 1 ? `${tournamentsWon} títulos logrados` : 'Campeón de torneo',
                event: tournamentsWon > 1 ? 'Historial competitivo' : 'Competencia oficial',
                type: 'gold'
            });
        }
        if (user?.university?.verified) {
            recognitions.push({
                id: 'recognition-university-verified',
                name: 'Estudiante verificado',
                event: user?.university?.universityName || 'Universidad confirmada',
                type: 'silver'
            });
        }
        if (user?.connections?.riot?.verified || user?.connections?.mlbb?.verified) {
            recognitions.push({
                id: 'recognition-account-verified',
                name: 'Cuenta de juego verificada',
                event: user?.connections?.riot?.verified ? 'Riot Games' : 'Mobile Legends',
                type: 'bronze'
            });
        }
        if (captainTeams > 0) {
            recognitions.push({
                id: 'recognition-team-leader',
                name: captainTeams > 1 ? `Lidera ${captainTeams} equipos` : 'Líder de equipo',
                event: 'Gestión competitiva',
                type: 'gold'
            });
        }
        if (winRate >= 60 && matchesPlayed >= 5) {
            recognitions.push({
                id: 'recognition-winrate',
                name: `Win rate ${winRate}%`,
                event: `${matchesWon} victorias oficiales`,
                type: 'silver'
            });
        }
        if (communities.length > 0) {
            recognitions.push({
                id: 'recognition-community',
                name: communities.length > 1 ? `${communities.length} comunidades activas` : 'Miembro de comunidad',
                event: 'Presencia social',
                type: 'bronze'
            });
        }

        return res.status(200).json({
            stats: {
                matches: matchesPlayed,
                wins: matchesWon,
                winRate,
                points: progression.totalPoints,
                tournaments: tournamentsJoined,
                tournamentsWon,
                mvps: 0,
                teams: teams.length,
                ongoing: tournamentsOngoing
            },
            achievements: visibleAchievements,
            recognitions,
            friends,
            communities,
            activity,
            wallComments,
            progression,
            flags: {
                hasVerifiedGameAccount: Boolean(user?.connections?.riot?.verified || user?.connections?.mlbb?.verified),
                hasUniversityVerification: Boolean(user?.university?.verified),
                hasOnlineTeammates: friends.some((friend) => PROFILE_ONLINE_STATUSES.has(friend.status))
            }
        });
    } catch (error) {
        console.error('Error en getProfileOverview:', error);
        return res.status(500).json({ message: 'Error al obtener resumen del perfil' });
    }
};

// 1. Solicitar recuperación (Envío de correo)
export const sendVerificationEmail = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('email fullName username emailVerified emailVerificationLastSentAt emailVerificationToken emailVerificationExpires notifications');
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        if (user.emailVerified) {
            return res.status(200).json({ message: 'Tu correo ya esta verificado.', alreadyVerified: true });
        }

        const lastSentAt = user.emailVerificationLastSentAt ? new Date(user.emailVerificationLastSentAt).getTime() : 0;
        const waitMs = EMAIL_VERIFICATION_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt);
        if (waitMs > 0) {
            return res.status(429).json({
                message: `Espera ${Math.ceil(waitMs / 1000)} segundos antes de reenviar el correo.`,
                retryAfterSeconds: Math.ceil(waitMs / 1000)
            });
        }

        const verificationToken = issueEmailVerificationToken(user);
        await sendVerificationMailToUser(user, verificationToken);

        user.notifications.unshift({
            type: 'info',
            category: 'security',
            title: 'Correo de verificacion enviado',
            source: 'Seguridad',
            message: 'Te enviamos un enlace para verificar tu correo electronico.',
            status: 'unread',
            visuals: { icon: 'bx-envelope', color: '#3b82f6', glow: false },
            createdAt: new Date()
        });

        await user.save();
        await recordActivity({ userId: user._id, event: 'email_verification_sent', req });

        return res.status(200).json({ message: 'Te enviamos un correo con el enlace para verificar tu cuenta.' });
    } catch (error) {
        if (error?.message === 'SMTP_NOT_CONFIGURED') {
            return res.status(500).json({ message: 'El envio de correos no esta disponible ahora mismo.' });
        }
        console.error('Error enviando correo de verificacion:', error);
        return res.status(500).json({ message: 'No se pudo enviar el correo de verificacion.' });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const plainToken = String(req.body?.token || req.query?.token || '').trim();
        if (!plainToken) {
            return res.status(400).json({ message: 'Token de verificacion invalido.' });
        }

        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
        const user = await User.findOne({
            emailVerificationToken: tokenHash,
            emailVerificationExpires: { $gt: new Date() }
        }).select('email emailVerified emailVerifiedAt emailVerificationToken emailVerificationExpires notifications');

        if (!user) {
            return res.status(400).json({ message: 'El enlace de verificacion no es valido o ya expiro.' });
        }

        if (!user.emailVerified) {
            user.emailVerified = true;
            user.emailVerifiedAt = new Date();
            user.emailVerificationToken = undefined;
            user.emailVerificationExpires = undefined;
            user.notifications.unshift({
                type: 'success',
                category: 'security',
                title: 'Correo verificado',
                source: 'Seguridad',
                message: 'Tu correo electronico ya fue verificado correctamente.',
                status: 'unread',
                visuals: { icon: 'bx-badge-check', color: '#22c55e', glow: true },
                createdAt: new Date()
            });
            await user.save();
            await recordActivity({ userId: user._id, event: 'email_verified', req });
        }

        return res.status(200).json({
            message: 'Correo verificado correctamente.',
            emailVerified: true
        });
    } catch (error) {
        console.error('Error verificando correo:', error);
        return res.status(500).json({ message: 'No se pudo verificar el correo.' });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
        const genericResponse = { message: "Si el correo existe, enviaremos instrucciones para recuperar la cuenta." };

        if (!normalizedEmail) {
            return res.status(200).json(genericResponse);
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(200).json(genericResponse);
        }

        // Código de 6 dígitos criptográficamente más robusto
        const token = crypto.randomInt(100000, 1000000).toString();
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Guardamos hash (nunca el código en texto plano)
        user.resetPasswordToken = tokenHash;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutos
        await user.save();

        // Configurar el transporte de correo (Ejemplo con Gmail)
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER, // Tu correo
                pass: process.env.EMAIL_PASS  // Tu contraseña de aplicación
            }
        });

        const mailOptions = {
    to: user.email,
    from: 'GlitchGang Team <no-reply@glitchgang.net>',
    subject: `${token} es tu código de recuperación`,
    html: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 50px 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">
            
            <div style="padding: 30px; text-align: center;">
                <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                    GLITCHGANG<span style="color: #00ff00;">.</span>
                </h1>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">RECUPERACIÓN DE CUENTA</p>
            </div>

            <div style="padding: 0 40px 40px 40px; text-align: center;">
                <p style="color: #333; font-size: 16px; line-height: 1.5;">
                    Hola, <strong>${user.fullName}</strong>. Usa el siguiente código para restablecer tu contraseña. Este código expirará en 15 minutos.
                </p>

                <div style="margin: 30px 0; background-color: #f4f4f4; border-radius: 8px; padding: 20px; border: 1px dashed #cccccc;">
                    <span style="font-family: monospace; font-size: 36px; font-weight: bold; color: #000; letter-spacing: 5px;">
                        ${token}
                    </span>
                </div>

                <p style="color: #999; font-size: 12px;">
                    Si no solicitaste este cambio, puedes ignorar este correo de forma segura. Alguien pudo haber escrito tu dirección por error.
                </p>
            </div>

            <div style="background-color: #000; padding: 15px; text-align: center;">
                <p style="color: #fff; font-size: 11px; margin: 0; opacity: 0.7;">
                    © ${new Date().getFullYear()} GlitchGang Platform. Todos los derechos reservados.
                </p>
            </div>
        </div>
    </div>
    `
}

await transporter.sendMail(mailOptions);
        return res.status(200).json(genericResponse);

    } catch (error) {
        return res.status(500).json({ message: "Error al procesar la recuperación de contraseña" });
    }
};

// 2. Restablecer contraseña (Guardar nueva pass)
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        const plainToken = String(token || '').trim();

        if (!plainToken || !password) {
            return res.status(400).json({ message: "Solicitud inválida." });
        }

        if (String(password).length < 8) {
            return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres." });
        }

        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: tokenHash,
            resetPasswordExpires: { $gt: Date.now() } // Verifica que no haya expirado
        });

        if (!user) {
            return res.status(400).json({ message: "El token es inválido o ha expirado." });
        }

        // Hashear la nueva contraseña
        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        // Notification: password reset
        user.notifications.unshift({
            type: 'info',
            category: 'system',
            title: 'Contrasena restablecida',
            source: 'Seguridad',
            message: 'Tu contrasena fue actualizada exitosamente. Si no realizaste este cambio, contacta soporte inmediatamente.',
            status: 'unread',
            visuals: { icon: 'bx-lock-open-alt', color: '#f59e0b', glow: true },
            createdAt: new Date()
        });

        await user.save();
        res.status(200).json({ message: "Contraseña actualizada correctamente." });

    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar la contraseña" });
    }
};

// 3. Actualizar perfil
export const updateProfile = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId).select('avatar socialLinks gamingConnections competitiveProfiles selectedGames privacy countrySetAt birthDateSetAt lastNameChangeAt fullName country birthDate');
        if (!currentUser) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // ⚠️ RESTRICTION: Country & BirthDate can only be set ONCE (at registration)
        // Cannot be changed after creation
        if (req.body.country !== undefined && currentUser.countrySetAt) {
            return res.status(403).json({
                message: 'No puedes cambiar el país después de creada tu cuenta. Esta información es permanente.',
                restriction: 'country_locked'
            });
        }
        if (req.body.birthDate !== undefined && currentUser.birthDateSetAt) {
            return res.status(403).json({
                message: 'No puedes cambiar tu fecha de nacimiento después de creada tu cuenta. Esta información es permanente.',
                restriction: 'birthdate_locked'
            });
        }

        // ⚠️ RESTRICTION: Name changes are throttled - can only change every 3 weeks (21 days)
        if (req.body.fullName !== undefined && req.body.fullName !== currentUser.fullName) {
            const now = new Date();
            const lastChange = currentUser.lastNameChangeAt;
            if (lastChange) {
                const threeWeeksMs = 21 * 24 * 60 * 60 * 1000;
                const timeSinceLastChange = now - new Date(lastChange);
                if (timeSinceLastChange < threeWeeksMs) {
                    const nextChangeDate = new Date(new Date(lastChange).getTime() + threeWeeksMs);
                    return res.status(429).json({
                        message: `Solo puedes cambiar tu nombre una vez cada 3 semanas. Próximo cambio disponible: ${nextChangeDate.toLocaleDateString()}`,
                        restriction: 'name_throttle',
                        nextAvailableAt: nextChangeDate.toISOString()
                    });
                }
            }
        }

        // Solo permitimos actualizar campos seguros del perfil
        const allowedFields = [
            'avatar', 'bio', 'fullName', 'phone', 'gender',
            // country y birthDate NO SON permitidos (bloqueados arriba)
            'selectedGames', 'platforms', 'experience', 'goals',
            'username', 'email', 'status', 'selectedFrameId', 'selectedBgId', 'selectedTagId',
            'languages', 'preferredRoles', 'lookingForTeam', 'isProfileHidden'
        ];
        let updateData = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // 1. Manejo de la imagen (Multer)
        if (req.file) {
            updateData.avatar = `/uploads/avatars/${req.file.filename}`;
            const previousAvatar = String(currentUser.avatar || '').trim();
            if (previousAvatar.startsWith('/uploads/avatars/')) {
                const previousPath = path.resolve(process.cwd(), `.${previousAvatar}`);
                fs.unlink(previousPath, () => {});
            }
        }

        // 2. Limpieza de Arrays de Texto (Juegos, Metas, etc.)
        const arrayFields = ['selectedGames', 'platforms', 'experience', 'goals', 'languages', 'preferredRoles'];
        arrayFields.forEach(field => {
            if (updateData[field] !== undefined) {
                updateData[field] = normalizeStringArray(updateData[field]);
            }
        });
        if (updateData.selectedGames !== undefined) {
            updateData.selectedGames = filterSupportedGameNames(updateData.selectedGames);
        }
        if (updateData.platforms !== undefined) {
            updateData.platforms = normalizePlatformValues(updateData.platforms);
        }
        if (updateData.experience !== undefined) {
            updateData.experience = normalizeExperienceValues(updateData.experience);
        }
        if (updateData.goals !== undefined) {
            updateData.goals = normalizeGoalValues(updateData.goals);
        }
        if (updateData.languages !== undefined) {
            updateData.languages = normalizeLanguageValues(updateData.languages);
        }

        // 2.1 Social links (JSON, dot notation o bracket notation)
        const parsedSocialLinks = {};
        let socialLinksFromBody = {};
        if (req.body.socialLinks !== undefined) {
            if (typeof req.body.socialLinks === 'string') {
                try {
                    socialLinksFromBody = JSON.parse(req.body.socialLinks);
                } catch (_) {
                    socialLinksFromBody = {};
                }
            } else if (typeof req.body.socialLinks === 'object' && req.body.socialLinks !== null) {
                socialLinksFromBody = req.body.socialLinks;
            }
        }
        SOCIAL_LINK_KEYS.forEach((key) => {
            const explicit = req.body[`socialLinks.${key}`] ?? req.body[`socialLinks[${key}]`];
            const incoming = explicit !== undefined ? explicit : socialLinksFromBody[key];
            if (incoming !== undefined) {
                parsedSocialLinks[key] = normalizeProfileText(incoming, { max: 120 });
            }
        });
        if (Object.keys(parsedSocialLinks).length > 0) {
            updateData.socialLinks = {
                ...(currentUser.socialLinks?.toObject ? currentUser.socialLinks.toObject() : (currentUser.socialLinks || {})),
                ...parsedSocialLinks
            };
        }

        const parsedGamingConnections = {};
        let gamingConnectionsFromBody = {};
        if (req.body.gamingConnections !== undefined) {
            if (typeof req.body.gamingConnections === 'string') {
                try {
                    gamingConnectionsFromBody = JSON.parse(req.body.gamingConnections);
                } catch (_) {
                    gamingConnectionsFromBody = {};
                }
            } else if (typeof req.body.gamingConnections === 'object' && req.body.gamingConnections !== null) {
                gamingConnectionsFromBody = req.body.gamingConnections;
            }
        }
        GAMING_CONNECTION_KEYS.forEach((key) => {
            const explicit = req.body[`gamingConnections.${key}`] ?? req.body[`gamingConnections[${key}]`];
            const incoming = explicit !== undefined ? explicit : gamingConnectionsFromBody[key];
            if (incoming !== undefined) {
                parsedGamingConnections[key] = normalizeProfileText(incoming, { max: 80 });
            }
        });
        if (Object.keys(parsedGamingConnections).length > 0) {
            updateData.gamingConnections = {
                ...(currentUser.gamingConnections?.toObject ? currentUser.gamingConnections.toObject() : (currentUser.gamingConnections || {})),
                ...parsedGamingConnections
            };
        }

        let competitiveProfilesFromBody;
        if (req.body.competitiveProfiles !== undefined) {
            if (typeof req.body.competitiveProfiles === 'string') {
                try {
                    competitiveProfilesFromBody = JSON.parse(req.body.competitiveProfiles);
                } catch (_) {
                    competitiveProfilesFromBody = {};
                }
            } else if (typeof req.body.competitiveProfiles === 'object' && req.body.competitiveProfiles !== null) {
                competitiveProfilesFromBody = req.body.competitiveProfiles;
            }
        }

        const nextSelectedGames = updateData.selectedGames !== undefined
            ? updateData.selectedGames
            : (Array.isArray(currentUser.selectedGames) ? currentUser.selectedGames : []);

        if (competitiveProfilesFromBody !== undefined) {
            updateData.competitiveProfiles = normalizeCompetitiveProfilesPayload(
                competitiveProfilesFromBody,
                nextSelectedGames
            );
        } else if (updateData.selectedGames !== undefined) {
            updateData.competitiveProfiles = normalizeCompetitiveProfilesPayload(
                currentUser.competitiveProfiles,
                nextSelectedGames
            );
        }

        // 2.2 Normalización de strings
        if (updateData.fullName !== undefined) {
            updateData.fullName = normalizeProfileText(updateData.fullName, { max: 80 });
            // If name is being changed, update the lastNameChangeAt timestamp
            if (updateData.fullName !== currentUser.fullName) {
                updateData.lastNameChangeAt = new Date();
            }
        }
        if (updateData.bio !== undefined) {
            updateData.bio = normalizeProfileText(updateData.bio, { max: 300, trim: false });
        }
        if (updateData.country !== undefined) {
            updateData.country = normalizeCountryName(
                normalizeProfileText(updateData.country, { max: 60 }),
                { allowCustom: false }
            );
        }
        if (updateData.gender !== undefined) {
            updateData.gender = normalizeGenderValue(
                normalizeProfileText(updateData.gender, { max: 20 })
            );
        }
        if (updateData.phone !== undefined) {
            updateData.phone = String(updateData.phone).replace(/[^\d]/g, '');
        }
        if (updateData.username !== undefined) {
            updateData.username = normalizeProfileText(updateData.username, { max: 20 });
        }
        if (updateData.email !== undefined) {
            updateData.email = normalizeProfileText(updateData.email, { max: 120 }).toLowerCase();
        }

        // 2.5 Unicidad al editar
        if (updateData.username !== undefined) {
            const exists = await User.findOne({
                _id: { $ne: req.userId },
                username: { $regex: `^${updateData.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
            }).select('_id');
            if (exists) return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        if (updateData.email !== undefined) {
            const exists = await User.findOne({
                _id: { $ne: req.userId },
                email: updateData.email
            }).select('_id');
            if (exists) return res.status(409).json({ message: 'El correo ya está registrado.' });
        }
        if (updateData.phone !== undefined) {
            const exists = await User.findOne({
                _id: { $ne: req.userId },
                phone: updateData.phone
            }).select('_id');
            if (exists) return res.status(409).json({ message: 'El teléfono ya está registrado.' });
        }

        // 2.5 Normalización de campos simples
        const allowedSimpleFields = ['status', 'selectedFrameId', 'selectedBgId', 'selectedTagId'];

        allowedSimpleFields.forEach(field => {
            if (updateData[field] === "" || updateData[field] === undefined) {
                delete updateData[field];
            }
        });


        // 2.6 Validate frame selection — must be unlocked (admins bypass)
        if (updateData.selectedFrameId) {
            const currentUser = await User.findById(req.userId).select('isAdmin unlockedFrames');
            if (!currentUser?.isAdmin) {
                const unlocked = currentUser?.unlockedFrames || [];
                // 'none' and default common frames are always available
                const defaultFrames = ['none', 'neon-storm', 'celestial-dream', 'nature-bloom', 'cloud-nine'];
                if (!defaultFrames.includes(updateData.selectedFrameId) && !unlocked.includes(updateData.selectedFrameId)) {
                    return res.status(403).json({ message: 'No has desbloqueado este marco.' });
                }
            }
        }

        // 3. Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -__v -connections.riot.pendingLink');

        res.status(200).json(updatedUser);

    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'campo';
            if (field === 'email') return res.status(409).json({ message: 'El correo ya está registrado.' });
            if (field === 'username') return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
            if (field === 'phone') return res.status(409).json({ message: 'El teléfono ya está registrado.' });
            return res.status(409).json({ message: `Valor duplicado en ${field}.` });
        }
        console.error("DETALLE DEL ERROR:", error);
        res.status(500).json({ message: "Error al actualizar el perfil" });
    }
};

// 4. Solicitar ser Organizador
export const applyOrganizer = async (req, res) => {
    const { fullName, idNumber, orgName, eventType,
        website, experienceYears, maxSize, tools, description } = req.body;
    const file = req.file;
    const applicationData = {
        fullName,
        idNumber,
        orgName,
        eventType,
        website,
        experienceYears,
        maxSize,
        tools,
        description,
        documentFilename: file?.originalname || ''
    };

    if (!file) {
        return res.status(400).json({ message: 'Debes adjuntar una foto de tu documento de identidad.' });
    }

    try {
        const user = await User.findById(req.userId).select('username email avatar isOrganizer roles roleApplications');
        if (!user) {
            cleanupUploadedFile(file);
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        const currentApp = user.roleApplications?.organizer;
        if (currentApp?.status === 'pending') {
            cleanupUploadedFile(file);
            return res.status(400).json({ message: 'Ya tienes una solicitud pendiente para organizador.' });
        }

        if (user.isOrganizer || user.roles?.includes('organizer') || currentApp?.status === 'approved') {
            cleanupUploadedFile(file);
            return res.status(400).json({ message: 'Ya tienes el rol de organizador aprobado.' });
        }

        user.set('roleApplications.organizer.status', 'pending');
        user.set('roleApplications.organizer.appliedAt', new Date());
        user.set('roleApplications.organizer.reviewedAt', null);
        user.set('roleApplications.organizer.data', applicationData);
        await user.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: `"GlitchGang Admin" <${process.env.EMAIL_USER}>`,
            to: 'steliantsoft@gmail.com',
            replyTo: user.email,
            subject: `Solicitud de Organizador: ${orgName || user.username}`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 30px; border: 1px solid #8EDB15; border-radius: 10px;">
                    <h2 style="color: #8EDB15; text-align: center;">Nueva Solicitud de Verificacion</h2>
                    <hr style="border: 0.5px solid #333;" />
                    <p><strong>Usuario:</strong> ${user.username}</p>
                    <p><strong>Correo:</strong> ${user.email}</p>
                    <p><strong>Candidato:</strong> ${fullName}</p>
                    <p><strong>Identificacion:</strong> ${idNumber}</p>
                    <p><strong>Organizacion:</strong> ${orgName}</p>
                    <p><strong>Tipo de Eventos:</strong> ${eventType}</p>
                    <p><strong>Sitio Web:</strong> ${website || 'N/A'}</p>
                    <p><strong>Experiencia:</strong> ${experienceYears}</p>
                    <p><strong>Tamano de Torneos:</strong> ${maxSize}</p>
                    <p><strong>Herramientas:</strong> ${tools}</p>
                    <p style="background: #111; padding: 15px; border-radius: 5px;">${description}</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">
                        Esta solicitud fue enviada desde el formulario de roles y queda pendiente de confirmacion administrativa.
                    </p>
                </div>
            `,
            attachments: file ? [{ filename: file.originalname, path: file.path }] : []
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.warn('Email de notificacion fallo (la solicitud se guardo igual):', emailError?.message || emailError);
        }

        // Also create a SupportTicket so it shows in the admin panel
        try {
            const dataEntries = Object.entries(applicationData)
                .filter(([, val]) => val)
                .map(([key, val]) => `${formatRoleApplicationLabel(key)}: ${val}`)
                .join('\n');

            await SupportTicket.create({
                userId: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || '',
                type: 'question',
                subject: `Solicitud de Organizador: ${orgName || user.username}`,
                message: `Solicitud de Organizador\n\n${dataEntries}`,
                data: { ...applicationData, role: 'organizer', applicationType: 'role-application' }
            });
        } catch (ticketErr) {
            console.warn('No se pudo crear ticket para solicitud de organizador:', ticketErr?.message);
        }

        cleanupUploadedFile(file);

        res.status(200).json({ message: "Solicitud enviada." });
    } catch (error) {
        cleanupUploadedFile(file);
        console.error('Error en applyOrganizer:', error);
        res.status(500).json({ message: "Error en el servidor." });
    }
};

// ── Solicitud de Rol genérico ──
export const applyRole = async (req, res) => {
    const { role } = req.body;
    const file = req.file;
    const validRoles = ['content-creator', 'coach', 'caster', 'sponsor', 'analyst'];
    const data = parseRoleApplicationData(req.body);
    const applicationData = {
        ...data,
        documentFilename: file?.originalname || ''
    };

    if (!file) {
        return res.status(400).json({ message: 'Debes adjuntar una foto de tu documento de identidad.' });
    }

    if (!validRoles.includes(role)) {
        cleanupUploadedFile(file);
        return res.status(400).json({ message: 'Rol inválido.' });
    }

    try {
        const user = await User.findById(req.userId);
        if (!user) {
            cleanupUploadedFile(file);
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Check if already applied or approved
        const currentApp = user.roleApplications?.[role];
        if (currentApp?.status === 'pending') {
            cleanupUploadedFile(file);
            return res.status(400).json({ message: 'Ya tienes una solicitud pendiente para este rol.' });
        }
        if (currentApp?.status === 'approved' || user.roles?.includes(role)) {
            cleanupUploadedFile(file);
            return res.status(400).json({ message: 'Ya tienes este rol aprobado.' });
        }

        // Save application
        user.set(`roleApplications.${role}.status`, 'pending');
        user.set(`roleApplications.${role}.appliedAt`, new Date());
        user.set(`roleApplications.${role}.reviewedAt`, null);
        user.set(`roleApplications.${role}.data`, applicationData);
        await user.save();

        // Send notification email
        const roleLabels = {
            'content-creator': 'Creador de Contenido',
            coach: 'Coach / Entrenador',
            caster: 'Caster / Comentarista',
            sponsor: 'Sponsor / Patrocinador',
            analyst: 'Analista'
        };

        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
            });

            const dataEntries = Object.entries(applicationData || {})
                .map(([key, val]) => `<p><strong>${formatRoleApplicationLabel(key)}:</strong> ${val || 'N/A'}</p>`)
                .join('');

            await transporter.sendMail({
                from: `"GlitchGang Admin" <${process.env.EMAIL_USER}>`,
                to: 'steliantsoft@gmail.com',
                replyTo: user.email,
                subject: `Nueva Solicitud de Rol: ${roleLabels[role] || role} — ${user.username}`,
                html: `
                    <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 30px; border: 1px solid #8EDB15; border-radius: 10px;">
                        <h2 style="color: #8EDB15; text-align: center;">Solicitud de ${roleLabels[role] || role}</h2>
                        <hr style="border: 0.5px solid #333;" />
                        <p><strong>Usuario:</strong> ${user.username} (${user.email})</p>
                        <p><strong>Rol solicitado:</strong> ${roleLabels[role] || role}</p>
                        <p><strong>Estado:</strong> Pendiente de confirmacion administrativa.</p>
                        ${dataEntries}
                    </div>
                `,
                attachments: [{ filename: file.originalname, path: file.path }]
            });
        } catch (emailErr) {
            console.warn('Email de notificacion fallo (la solicitud se guardo igual):', emailErr?.message || emailErr);
        }

        // Also create a SupportTicket so it shows in the admin panel
        try {
            const roleLabels = {
                'content-creator': 'Creador de Contenido',
                coach: 'Coach / Entrenador',
                caster: 'Caster / Comentarista',
                sponsor: 'Sponsor / Patrocinador',
                analyst: 'Analista'
            };
            const dataEntries = Object.entries(applicationData || {})
                .filter(([, val]) => val)
                .map(([key, val]) => `${formatRoleApplicationLabel(key)}: ${val}`)
                .join('\n');

            await SupportTicket.create({
                userId: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar || '',
                type: 'question',
                subject: `Solicitud de Rol: ${roleLabels[role] || role}`,
                message: `Solicitud de ${roleLabels[role] || role}\n\n${dataEntries}`,
                data: { ...applicationData, role, applicationType: 'role-application' }
            });
        } catch (ticketErr) {
            console.warn('No se pudo crear ticket de soporte para solicitud de rol:', ticketErr?.message);
        }

        cleanupUploadedFile(file);
        res.status(200).json({ message: 'Solicitud enviada correctamente.' });
    } catch (error) {
        cleanupUploadedFile(file);
        console.error('Error en applyRole:', error);
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

// 5. Verificar solicitud de Organizador
export const verifyOrganizerAction = async (req, res) => {
    try {
        const { userId } = req.params;
        const { action = 'approve' } = req.body || {};

        const adminUser = await User.findById(req.userId).select('isAdmin');
        if (!adminUser?.isAdmin) {
            return res.status(403).json({ message: 'No autorizado. Solo administradores pueden realizar esta acción.' });
        }

        if (action !== 'approve') {
            return res.status(400).json({ message: 'Acción inválida. Solo se permite approve.' });
        }

        const target = await User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    isOrganizer: true,
                    'roleApplications.organizer.status': 'approved',
                    'roleApplications.organizer.reviewedAt': new Date()
                },
                $addToSet: { roles: 'organizer' },
                $push: {
                    notifications: {
                        $each: [{
                            type: 'success',
                            category: 'system',
                            title: 'Rol Aprobado: Organizador',
                            source: 'Admin',
                            message: 'Felicidades! Tu solicitud de Organizador ha sido aprobada. Ya puedes crear y gestionar torneos en la plataforma.',
                            status: 'unread',
                            visuals: { icon: 'bx-check-shield', color: '#10b981', glow: true },
                            createdAt: new Date()
                        }],
                        $position: 0
                    }
                }
            },
            { new: true }
        ).select('_id isOrganizer roles roleApplications.organizer.status');

        if (!target) {
            return res.status(404).json({ message: 'Usuario objetivo no encontrado.' });
        }

        return res.status(200).json({
            message: 'Usuario aprobado como organizador.',
            user: target
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error procesando la acción.' });
    }
};

// ══════════════════════════════════════
//  ADMIN PANEL ENDPOINTS
// ══════════════════════════════════════

const ensureAdminUser = async (reqUserId) => {
    const admin = await User.findById(reqUserId).select('isAdmin');
    return Boolean(admin?.isAdmin);
};

// List all pending role applications
export const adminGetRoleApplications = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const statusFilter = req.query.status || 'pending';
        const roleFilter = req.query.role || '';

        const allRoles = ['organizer', 'content-creator', 'coach', 'caster', 'sponsor', 'analyst'];
        const rolesToSearch = roleFilter && allRoles.includes(roleFilter) ? [roleFilter] : allRoles;

        const orConditions = rolesToSearch.map(r => ({
            [`roleApplications.${r}.status`]: statusFilter
        }));

        const users = await User.find({ $or: orConditions })
            .select('username email fullName avatar roles isOrganizer roleApplications createdAt')
            .sort({ createdAt: -1 })
            .limit(200)
            .lean();

        const applications = [];
        for (const user of users) {
            for (const role of rolesToSearch) {
                const app = user.roleApplications?.[role];
                if (app?.status === statusFilter) {
                    applications.push({
                        userId: user._id,
                        username: user.username,
                        email: user.email,
                        fullName: user.fullName,
                        avatar: user.avatar,
                        role,
                        status: app.status,
                        appliedAt: app.appliedAt,
                        reviewedAt: app.reviewedAt,
                        data: app.data || {}
                    });
                }
            }
        }

        applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
        res.json({ total: applications.length, items: applications });
    } catch (error) {
        console.error('Error en adminGetRoleApplications:', error);
        res.status(500).json({ message: 'Error al obtener solicitudes.' });
    }
};

// Approve or reject a role application
export const adminReviewRoleApplication = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { userId } = req.params;
        const { role, action, reason } = req.body;
        const allRoles = ['organizer', 'content-creator', 'coach', 'caster', 'sponsor', 'analyst'];

        if (!allRoles.includes(role)) {
            return res.status(400).json({ message: 'Rol invalido.' });
        }
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Accion invalida. Usa approve o reject.' });
        }

        const target = await User.findById(userId);
        if (!target) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const currentApp = target.roleApplications?.[role];
        if (!currentApp || currentApp.status !== 'pending') {
            return res.status(400).json({ message: 'No hay solicitud pendiente para este rol.' });
        }

        const roleLabels = {
            organizer: 'Organizador', 'content-creator': 'Creador de Contenido',
            coach: 'Coach', caster: 'Caster', sponsor: 'Sponsor', analyst: 'Analista'
        };

        if (action === 'approve') {
            target.set(`roleApplications.${role}.status`, 'approved');
            target.set(`roleApplications.${role}.reviewedAt`, new Date());
            if (!target.roles.includes(role)) target.roles.push(role);
            if (role === 'organizer') target.isOrganizer = true;

            target.notifications.unshift({
                type: 'success',
                category: 'system',
                title: `Rol Aprobado: ${roleLabels[role] || role}`,
                source: 'Admin',
                message: `Felicidades! Tu solicitud de ${roleLabels[role] || role} ha sido aprobada. Ya puedes disfrutar de los beneficios de tu nuevo rol.`,
                status: 'unread',
                visuals: { icon: 'bx-check-shield', color: '#10b981', glow: true },
                createdAt: new Date()
            });
        } else {
            target.set(`roleApplications.${role}.status`, 'rejected');
            target.set(`roleApplications.${role}.reviewedAt`, new Date());
            if (reason) target.set(`roleApplications.${role}.data.rejectReason`, reason);

            target.notifications.unshift({
                type: 'warning',
                category: 'system',
                title: `Solicitud de ${roleLabels[role] || role} rechazada`,
                source: 'Admin',
                message: reason
                    ? `Tu solicitud de ${roleLabels[role] || role} fue rechazada. Razon: ${reason}`
                    : `Tu solicitud de ${roleLabels[role] || role} fue rechazada. Puedes volver a aplicar corrigiendo los datos.`,
                status: 'unread',
                visuals: { icon: 'bx-x-circle', color: '#ef4444', glow: false },
                createdAt: new Date()
            });
        }

        await target.save();

        await recordAdminAudit({
            actorUserId: req.userId,
            action: `role-${action}`,
            entityType: 'user',
            entityId: userId,
            meta: { role, reason: reason || '' },
            req
        });

        res.json({
            message: action === 'approve'
                ? `Rol ${role} aprobado para ${target.username}.`
                : `Solicitud de ${role} rechazada para ${target.username}.`,
            user: { _id: target._id, username: target.username, roles: target.roles }
        });
    } catch (error) {
        console.error('Error en adminReviewRoleApplication:', error);
        res.status(500).json({ message: 'Error al procesar la solicitud.' });
    }
};

// List users with search/filter (admin)
export const adminListUsers = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const rawLimit = Number(req.query.limit);
        const rawPage = Number(req.query.page);
        const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.trunc(rawLimit))) : 20;
        const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
        const skip = (page - 1) * limit;
        const search = String(req.query.search || '').trim();

        const filter = {};
        if (search) {
            filter.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { fullName: { $regex: search, $options: 'i' } },
                { userCode: { $regex: search, $options: 'i' } }
            ];
        }
        if (req.query.banned === 'true') filter.isBanned = true;

        const country = String(req.query.country || '').trim();
        if (country) {
            filter.country = { $regex: `^${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
        }

        const game = String(req.query.game || '').trim();
        if (game) {
            filter.selectedGames = game;
        }

        const role = String(req.query.role || '').trim();
        if (role) {
            filter.roles = role;
        }

        const platform = String(req.query.platform || '').trim();
        if (platform) {
            filter.platforms = platform;
        }

        const experience = String(req.query.experience || '').trim();
        if (experience) {
            filter.experience = experience;
        }

        const status = String(req.query.status || '').trim();
        if (status) {
            filter.status = status;
        }

        const gender = String(req.query.gender || '').trim();
        if (gender) {
            filter.gender = gender;
        }

        // Sort
        const sortOptions = { createdAt: -1 };
        const sortField = String(req.query.sort || '').trim();
        if (sortField === 'username') { sortOptions.username = 1; delete sortOptions.createdAt; }
        else if (sortField === 'country') { sortOptions.country = 1; delete sortOptions.createdAt; }
        else if (sortField === 'oldest') { sortOptions.createdAt = 1; }

        const [total, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select('username email fullName avatar roles selectedGames isOrganizer isAdmin isBanned banReason createdAt status userCode country phone gender birthDate platforms experience goals connections gameProfiles socialLinks twoFactorEnabled bannedAt')
                .sort(sortOptions)
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        res.json({ total, page, limit, items: users });
    } catch (error) {
        console.error('Error en adminListUsers:', error);
        res.status(500).json({ message: 'Error al listar usuarios.' });
    }
};

// Get single user detail (admin)
export const adminGetUserDetail = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const identifier = String(req.params.userId || '').trim();
        if (!identifier) {
            return res.status(400).json({ message: 'ID o código de usuario requerido.' });
        }

        const excludeFields = '-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires -twoFactorSecret -twoFactorBackupCodes';
        let user = null;

        // Try by MongoDB _id first
        if (/^[0-9a-fA-F]{24}$/.test(identifier)) {
            user = await User.findById(identifier).select(excludeFields).lean();
        }

        // Fallback: try by userCode (case-insensitive)
        if (!user) {
            user = await User.findOne({ userCode: { $regex: `^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } }).select(excludeFields).lean();
        }

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error en adminGetUserDetail:', error);
        res.status(500).json({ message: 'Error al obtener usuario.' });
    }
};

// Ban / unban user
export const adminBanUser = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { userId } = req.params;
        const { action, reason } = req.body;

        if (!['ban', 'unban'].includes(action)) {
            return res.status(400).json({ message: 'Accion invalida. Usa ban o unban.' });
        }

        if (userId === req.userId) {
            return res.status(400).json({ message: 'No puedes banearte a ti mismo.' });
        }

        const target = await User.findById(userId);
        if (!target) return res.status(404).json({ message: 'Usuario no encontrado.' });

        if (target.isAdmin) {
            return res.status(400).json({ message: 'No puedes banear a otro administrador.' });
        }

        if (action === 'ban') {
            target.isBanned = true;
            target.banReason = reason || 'Violacion de normas de la comunidad';
            target.bannedAt = new Date();

            target.notifications.unshift({
                type: 'error',
                category: 'system',
                title: 'Cuenta suspendida',
                source: 'Admin',
                message: `Tu cuenta ha sido suspendida. Razon: ${reason || 'Violacion de normas de la comunidad'}. Si crees que esto es un error, contacta soporte.`,
                status: 'unread',
                visuals: { icon: 'bx-block', color: '#ef4444', glow: true },
                createdAt: new Date()
            });
        } else {
            target.isBanned = false;
            target.banReason = '';
            target.bannedAt = null;

            target.notifications.unshift({
                type: 'success',
                category: 'system',
                title: 'Cuenta reactivada',
                source: 'Admin',
                message: 'Tu cuenta ha sido reactivada. Ya puedes acceder a todas las funciones de la plataforma. Bienvenido de vuelta!',
                status: 'unread',
                visuals: { icon: 'bx-check-circle', color: '#10b981', glow: true },
                createdAt: new Date()
            });
        }

        await target.save();

        await recordAdminAudit({
            actorUserId: req.userId,
            action: `user-${action}`,
            entityType: 'user',
            entityId: userId,
            meta: { reason: reason || '', username: target.username },
            req
        });

        res.json({
            message: action === 'ban'
                ? `Usuario ${target.username} baneado.`
                : `Usuario ${target.username} desbaneado.`,
            user: { _id: target._id, username: target.username, isBanned: target.isBanned }
        });
    } catch (error) {
        console.error('Error en adminBanUser:', error);
        res.status(500).json({ message: 'Error al procesar el baneo.' });
    }
};

// Send notification to one user or all users
export const adminSendNotification = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { userId, title, message, category } = req.body;
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'El mensaje es obligatorio.' });
        }

        const notification = {
            type: 'info',
            category: category || 'admin',
            title: title || 'Mensaje de Administracion',
            source: 'Admin',
            message: message.trim(),
            status: 'unread',
            visuals: { icon: 'bx-shield-quarter', color: '#a855f7', glow: true },
            createdAt: new Date()
        };

        let updatedCount = 0;

        if (userId === 'all') {
            // Broadcast to all users
            const result = await User.updateMany(
                {},
                { $push: { notifications: { $each: [notification], $position: 0 } } }
            );
            updatedCount = result.modifiedCount || 0;
        } else {
            // Send to a specific user
            const target = await User.findById(userId);
            if (!target) return res.status(404).json({ message: 'Usuario no encontrado.' });
            target.notifications.unshift(notification);
            await target.save();
            updatedCount = 1;
        }

        await recordAdminAudit({
            actorUserId: req.userId,
            action: userId === 'all' ? 'broadcast-notification' : 'send-notification',
            entityType: 'notification',
            entityId: userId,
            meta: { title: notification.title, recipients: updatedCount },
            req
        });

        res.json({ message: `Notificacion enviada a ${updatedCount} usuario(s).`, count: updatedCount });
    } catch (error) {
        console.error('Error en adminSendNotification:', error);
        res.status(500).json({ message: 'Error al enviar la notificacion.' });
    }
};

// ══════════════════════════════════════
// SUPPORT TICKETS
// ══════════════════════════════════════

// User creates a support ticket
export const createSupportTicket = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

        const { type, message, subject, data } = req.body;
        const validTypes = ['bug', 'suggestion', 'question', 'achievement'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ message: 'Tipo de ticket invalido.' });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'El mensaje es obligatorio.' });
        }

        const typeLabels = { bug: 'Reporte de Bug', suggestion: 'Sugerencia', question: 'Consulta', achievement: 'Logro' };

        const ticket = await SupportTicket.create({
            userId: req.userId,
            username: user.username,
            email: user.email,
            avatar: user.avatar || '',
            type,
            subject: subject || '',
            message: message.trim(),
            data: data || {}
        });

        // Confirmation notification to user
        user.notifications.unshift({
            type: 'info',
            category: 'support',
            title: `${typeLabels[type] || 'Mensaje'} enviado`,
            source: 'Soporte',
            message: `Tu ${(typeLabels[type] || 'mensaje').toLowerCase()} fue recibido. Nuestro equipo lo revisara y te responderemos pronto.`,
            status: 'unread',
            visuals: { icon: 'bx-envelope', color: '#6366f1', glow: false },
            createdAt: new Date()
        });
        await user.save();

        res.status(201).json({ message: 'Ticket creado exitosamente.', ticket: { _id: ticket._id, type: ticket.type, status: ticket.status } });
    } catch (error) {
        console.error('Error en createSupportTicket:', error);
        res.status(500).json({ message: 'Error al crear el ticket.' });
    }
};

// Admin lists support tickets
export const adminGetSupportTickets = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const rawLimit = Number(req.query.limit);
        const rawPage = Number(req.query.page);
        const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.trunc(rawLimit))) : 20;
        const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;
        const skip = (page - 1) * limit;

        const filter = {};
        const status = String(req.query.status || '').trim();
        if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            filter.status = status;
        }
        const type = String(req.query.type || '').trim();
        if (type && ['bug', 'suggestion', 'question', 'achievement'].includes(type)) {
            filter.type = type;
        }

        const [total, items] = await Promise.all([
            SupportTicket.countDocuments(filter),
            SupportTicket.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean()
        ]);

        res.json({ total, page, limit, items });
    } catch (error) {
        console.error('Error en adminGetSupportTickets:', error);
        res.status(500).json({ message: 'Error al listar tickets.' });
    }
};

// Admin responds to a support ticket
export const adminRespondSupportTicket = async (req, res) => {
    try {
        if (!(await ensureAdminUser(req.userId))) {
            return res.status(403).json({ message: 'No autorizado.' });
        }

        const { ticketId } = req.params;
        const { response, status } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado.' });

        if (response && response.trim()) {
            ticket.adminResponse = response.trim();
            ticket.respondedBy = req.userId;
            ticket.respondedAt = new Date();
        }

        if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            ticket.status = status;
        }

        await ticket.save();

        // Send notification to the user
        if (response && response.trim()) {
            const typeLabels = { bug: 'Reporte de Bug', suggestion: 'Sugerencia', question: 'Consulta', achievement: 'Logro' };
            await User.findByIdAndUpdate(ticket.userId, {
                $push: {
                    notifications: {
                        $each: [{
                            type: 'info',
                            category: 'support',
                            title: `Respuesta a tu ${typeLabels[ticket.type] || 'ticket'}`,
                            source: 'Soporte',
                            message: response.trim(),
                            status: 'unread',
                            visuals: { icon: 'bx-support', color: '#6366f1', glow: true },
                            createdAt: new Date()
                        }],
                        $position: 0
                    }
                }
            });
        }

        await recordAdminAudit({
            actorUserId: req.userId,
            action: response ? 'ticket-respond' : 'ticket-status-change',
            entityType: 'support-ticket',
            entityId: ticketId,
            meta: {
                ticketType: ticket.type,
                newStatus: ticket.status,
                username: ticket.username,
                hasResponse: !!response
            },
            req
        });

        res.json({ message: 'Ticket actualizado.', ticket });
    } catch (error) {
        console.error('Error en adminRespondSupportTicket:', error);
        res.status(500).json({ message: 'Error al responder el ticket.' });
    }
};
