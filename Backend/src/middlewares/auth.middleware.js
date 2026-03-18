import jwt from 'jsonwebtoken';
import Session from '../models/Session.js';
import User from '../models/User.js';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';

const parseCookies = (cookieHeader = '') => {
    return String(cookieHeader)
        .split(';')
        .map((pair) => pair.trim())
        .filter(Boolean)
        .reduce((acc, pair) => {
            const idx = pair.indexOf('=');
            if (idx === -1) return acc;
            const key = pair.slice(0, idx).trim();
            const value = pair.slice(idx + 1).trim();
            try {
                acc[key] = decodeURIComponent(value);
            } catch (_) {
                acc[key] = value;
            }
            return acc;
        }, {});
};

const getTokenFromCookie = (req) => {
    const cookies = parseCookies(req.headers?.cookie || '');
    return cookies[AUTH_COOKIE_NAME] || null;
};

const getTokenFromAuthorizationHeader = (req) => {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    if (typeof authHeader !== 'string') return null;
    if (!authHeader.toLowerCase().startsWith('bearer ')) return null;
    const token = authHeader.slice(7).trim();
    return token || null;
};

const getToken = (req) => {
    return getTokenFromCookie(req) || getTokenFromAuthorizationHeader(req);
};

export const verifyToken = async (req, res, next) => {
    try {
        const token = getToken(req);

        if (!token) {
            return res.status(403).json({ message: "Acceso denegado. No se encontró token de sesión." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;

        // If token has a jti, verify session is not revoked
        if (decoded.jti) {
            req.sessionJti = decoded.jti;
            const session = await Session.findOne({ jti: decoded.jti }).lean();
            if (session && session.revokedAt) {
                return res.status(401).json({ message: "Sesión revocada. Inicia sesión nuevamente." });
            }
            // Update lastActiveAt (fire-and-forget)
            if (session) {
                Session.updateOne({ jti: decoded.jti }, { lastActiveAt: new Date() }).catch(() => {});
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};

export const requireAdmin = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: 'Sesión inválida. Inicia sesión nuevamente.' });
        }

        const user = await User.findById(req.userId).select('isAdmin').lean();
        if (!user?.isAdmin) {
            return res.status(403).json({ message: 'No autorizado. Solo administradores.' });
        }

        next();
    } catch (error) {
        return res.status(500).json({ message: 'No se pudo validar el rol de administrador.' });
    }
};
