// Backend/src/controllers/auth.controller.js

import User from "../models/User.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import CommunityPost from "../models/CommunityPost.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { filterSupportedGameNames, isSupportedGameName, SUPPORTED_GAME_NAMES } from '../../../shared/supportedGames.js';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
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
        sameSite: AUTH_COOKIE_SAME_SITE,
        maxAge: ttlMs,
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,20}$/;
const SOCIAL_LINK_KEYS = ['twitch', 'youtube', 'twitter', 'instagram', 'tiktok'];
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

const isValidNonNegativeNumberString = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;
const isValidObjectIdLike = (value = '') => /^[a-fA-F0-9]{24}$/.test(String(value));
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizeUserCodeLookup = (value = '') => String(value)
    .toUpperCase()
    .replace(/USER[\s_-]*ID/g, '')
    .replace(/USR[\s_-]*/g, '')
    .replace(/[^\d]/g, '')
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

const mapFriendPreview = (candidate) => {
    const mainGame = Array.isArray(candidate?.selectedGames) && candidate.selectedGames.length > 0
        ? candidate.selectedGames[0]
        : 'Jugador';

    return {
        id: String(candidate?._id || ''),
        name: candidate?.fullName || candidate?.username || 'Jugador',
        avatar: candidate?.avatar || '',
        status: candidate?.status || 'offline',
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
        const country = String(payload.country || '').trim();
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

        // 2. Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Crear usuario con whitelist explícita para evitar mass-assignment
        const user = await User.create({
            fullName,
            phone,
            gender: payload.gender,
            country,
            birthDate,
            selectedGames: filterSupportedGameNames(normalizeStringArray(payload.selectedGames)),
            experience: normalizeStringArray(payload.experience),
            platforms: normalizeStringArray(payload.platforms),
            goals: normalizeStringArray(payload.goals),
            username,
            email,
            password: hashedPassword,
            checkTerms: true
        });

        // Opcional: No devolver la contraseña en la respuesta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json(userResponse);

    } catch (error) {
        console.error("Error en Registro:", error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;
        const normalizedEmail = String(email || '').trim().toLowerCase();

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

        // 3. Generar Token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET,
            { expiresIn: sessionTtlSeconds }
        );
        const csrfToken = generateCsrfToken();

        res.cookie(AUTH_COOKIE_NAME, token, buildAuthCookieOptions(sessionTtlMs));
        res.cookie(CSRF_COOKIE_NAME, csrfToken, buildCsrfCookieOptions(sessionTtlMs));

        res.status(200).json({ 
            session: true,
            token,
            rememberMe: useRememberSession,
            expiresInSeconds: sessionTtlSeconds,
            user: {
                id: user._id,
                userName: user.username,
                username: user.username
            }
        });

    } catch (error) {
        console.error("Error en Login:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

export const logout = (req, res) => {
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
            .select('-password -resetPasswordToken -resetPasswordExpires -__v -connections.riot.pendingLink')
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

        if (!user.userCode) {
            await user.save();
        }
        const payload = user.toObject();
        payload.selectedGames = filterSupportedGameNames(payload.selectedGames);
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
                .select('username fullName avatar status selectedGames country experience connections.riot isOrganizer teams followers following selectedTagId selectedFrameId userCode privacy.showPublicUserCode')
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
            fullName: target?.fullName || '',
            avatar: target?.avatar || '',
            status: target?.status || 'offline',
            selectedGames: Array.isArray(target?.selectedGames) ? target.selectedGames : [],
            country: target?.country || '',
            experience: Array.isArray(target?.experience) ? target.experience : [],
            isOrganizer: Boolean(target?.isOrganizer),
            selectedTagId: target?.selectedTagId || null,
            selectedFrameId: target?.selectedFrameId || null,
            userCode: extractVisibleUserCode(target),
            connections: {
                riot: {
                    verified: Boolean(target?.connections?.riot?.verified),
                    gameName: target?.connections?.riot?.gameName || '',
                    tagLine: target?.connections?.riot?.tagLine || ''
                }
            },
            teams: Array.isArray(target?.teams)
                ? target.teams.filter((team) => isSupportedGameName(team?.game))
                : [],
            followers: toIdArray(target?.followers),
            following: toIdArray(target?.following),
            isFollowing
        });
    } catch (error) {
        console.error('Error en getUserCard:', error);
        return res.status(500).json({ message: 'Error al cargar la tarjeta de usuario.' });
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
            .select('username fullName avatar status selectedGames userCode privacy.showPublicUserCode')
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
                .select('username fullName avatar status selectedGames userCode privacy.showPublicUserCode')
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
            .select('username fullName avatar status selectedGames userCode privacy.showPublicUserCode')
            .sort({ status: 1, username: 1 })
            .limit(limit)
            .lean();

        return res.status(200).json({
            users: users.map((entry) => mapSocialPreview(entry, followingSet))
        });
    } catch (error) {
        console.error('Error en searchUsers:', error);
        return res.status(500).json({ message: 'Error al buscar usuarios.' });
    }
};

export const getProfileOverview = async (req, res) => {
    try {
        const userDoc = await User.findById(req.userId)
            .select('username fullName avatar status selectedGames university connections notifications createdAt followers following userCode privacy.showPublicUserCode');
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
                .select('username fullName avatar status selectedGames userCode privacy.showPublicUserCode')
                .lean()
            : [];

        const followingIds = toIdArray(user?.following);
        const followerSet = new Set(toIdArray(user?.followers));
        const mutualFriendIds = followingIds.filter((id) => followerSet.has(id) && id !== userIdStr);

        const mutualFriendUsers = mutualFriendIds.length > 0
            ? await User.find({ _id: { $in: mutualFriendIds } })
                .select('username fullName avatar status selectedGames userCode privacy.showPublicUserCode')
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

        return res.status(200).json({
            stats: {
                matches: matchesPlayed,
                wins: matchesWon,
                winRate,
                tournaments: tournamentsJoined,
                tournamentsWon,
                mvps: 0,
                teams: teams.length,
                ongoing: tournamentsOngoing
            },
            achievements,
            friends,
            activity,
            wallComments,
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
    from: 'Esportefy Team <no-reply@esportefy.com>',
    subject: `${token} es tu código de recuperación`,
    html: `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9f9f9; padding: 50px 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #eeeeee; overflow: hidden;">
            
            <div style="padding: 30px; text-align: center;">
                <h1 style="color: #000; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">
                    ESPORTEFY<span style="color: #00ff00;">.</span>
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
                    © ${new Date().getFullYear()} Esportefy Platform. Todos los derechos reservados.
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

        await user.save();
        res.status(200).json({ message: "Contraseña actualizada correctamente." });

    } catch (error) {
        return res.status(500).json({ message: "Error al actualizar la contraseña" });
    }
};

// 3. Actualizar perfil
export const updateProfile = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId).select('avatar socialLinks privacy');
        if (!currentUser) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        // Solo permitimos actualizar campos seguros del perfil
        const allowedFields = [
            'avatar', 'bio', 'fullName', 'phone', 'gender', 'country', 'birthDate',
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

        // 2.2 Normalización de strings
        if (updateData.fullName !== undefined) {
            updateData.fullName = normalizeProfileText(updateData.fullName, { max: 80 });
        }
        if (updateData.bio !== undefined) {
            updateData.bio = normalizeProfileText(updateData.bio, { max: 300, trim: false });
        }
        if (updateData.country !== undefined) {
            updateData.country = normalizeProfileText(updateData.country, { max: 60 });
        }
        if (updateData.gender !== undefined) {
            updateData.gender = normalizeProfileText(updateData.gender, { max: 20 });
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
        if (updateData.birthDate !== undefined && updateData.birthDate !== '') {
            const dt = new Date(updateData.birthDate);
            if (Number.isNaN(dt.getTime())) {
                return res.status(400).json({ message: 'Fecha de nacimiento inválida.' });
            }
            const now = Date.now();
            const minAgeMs = 13 * 365 * 24 * 60 * 60 * 1000;
            if (dt.getTime() > now || now - dt.getTime() < minAgeMs) {
                return res.status(400).json({ message: 'Debes tener al menos 13 años.' });
            }
            updateData.birthDate = dt;
        }

        // 2.3 Normalización de booleanos
        if (updateData.lookingForTeam !== undefined) {
            updateData.lookingForTeam = normalizeBoolean(updateData.lookingForTeam, false);
        }
        if (updateData.isProfileHidden !== undefined) {
            updateData.isProfileHidden = normalizeBoolean(updateData.isProfileHidden, false);
        }

        const rawShowPublicUserCode = req.body.showPublicUserCode
            ?? req.body['privacy.showPublicUserCode']
            ?? req.body['privacy[showPublicUserCode]'];
        if (rawShowPublicUserCode !== undefined) {
            const currentPrivacy = currentUser.privacy?.toObject
                ? currentUser.privacy.toObject()
                : (currentUser.privacy || {});
            updateData.privacy = {
                ...currentPrivacy,
                showPublicUserCode: normalizeBoolean(rawShowPublicUserCode, true)
            };
        }

        // 2.4 Validaciones de formato
        if (updateData.fullName !== undefined && updateData.fullName.length < 2) {
            return res.status(400).json({ message: 'El nombre completo debe tener al menos 2 caracteres.' });
        }
        if (updateData.username !== undefined && !USERNAME_REGEX.test(updateData.username)) {
            return res.status(400).json({ message: 'El nickname debe tener 3-20 caracteres y solo letras, números, . _ -' });
        }
        if (updateData.email !== undefined && !EMAIL_REGEX.test(updateData.email)) {
            return res.status(400).json({ message: 'Correo inválido.' });
        }
        if (updateData.phone !== undefined && !isValidNonNegativeNumberString(updateData.phone)) {
            return res.status(400).json({ message: 'El teléfono debe contener solo números y no puede ser negativo.' });
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


        // 3. No permitir arrays vacíos inválidos
        if (updateData.selectedGames && updateData.selectedGames.length === 0) delete updateData.selectedGames;

        // 4. Actualizar usuario
        const updatedUser = await User.findByIdAndUpdate(
            req.userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -resetPasswordToken -resetPasswordExpires -__v -connections.riot.pendingLink');

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
    const { fullName, idNumber, orgName,eventType, 
        website, experienceYears,maxSize, tools, description } = req.body;
    const file = req.file;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        const mailOptions = {
            from: `"Esportefy Admin" <${process.env.EMAIL_USER}>`,
            to: 'steliantsoft@gmail.com',
            subject: `🚨 Solicitud de Organizador: ${orgName}`,
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #000; color: #fff; padding: 30px; border: 1px solid #8EDB15; border-radius: 10px;">
                    <h2 style="color: #8EDB15; text-align: center;">Nueva Solicitud de Verificación</h2>
                    <hr style="border: 0.5px solid #333;" />
                    <p><strong>Candidato:</strong> ${fullName}</p>
                    <p><strong>Identificación:</strong> ${idNumber}</p>
                    <p><strong>Organización:</strong> ${orgName}</p>
                    <p><strong>Tipo de Eventos:</strong> ${eventType}</p>
                    <p><strong>Sitio Web:</strong> ${website || 'N/A'}</p>
                    <p><strong>Experiencia:</strong> ${experienceYears}</p>
                    <p><strong>Tamaño de Torneos:</strong> ${maxSize}</p>
                    <p><strong>Herramientas:</strong> ${tools}</p>
                    <p style="background: #111; padding: 15px; border-radius: 5px;">${description}</p>
                    <p style="font-size: 12px; color: #666; margin-top: 20px; text-align: center;">
                        Revisar y aprobar desde el panel administrativo autenticado.
                    </p>
                </div>
            `,
            attachments: file ? [{ filename: file.originalname, path: file.path }] : []
        };

        await transporter.sendMail(mailOptions);
        if (file) fs.unlink(file.path, () => {});

        res.status(200).json({ message: "Solicitud enviada." });
    } catch (error) {
        if (file) fs.unlink(file.path, () => {});
        res.status(500).json({ message: "Error en el servidor." });
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
            { isOrganizer: true },
            { new: true }
        ).select('_id isOrganizer');

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
