import jwt from 'jsonwebtoken';

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

export const verifyToken = (req, res, next) => {
    try {
        const token = getTokenFromCookie(req);

        if (!token) {
            return res.status(403).json({ message: "Acceso denegado. No se encontró cookie de sesión." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
};
