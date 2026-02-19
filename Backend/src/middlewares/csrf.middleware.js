const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const CSRF_HEADER_NAME = (process.env.CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_HEADER_ALT = 'x-xsrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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

export const verifyCsrf = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const cookies = parseCookies(req.headers?.cookie || '');
    const authCookie = cookies[AUTH_COOKIE_NAME];
    if (!authCookie) return next();

    const csrfCookie = cookies[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers?.[CSRF_HEADER_NAME] || req.headers?.[CSRF_HEADER_ALT];

    if (!csrfCookie || !csrfHeader || String(csrfCookie) !== String(csrfHeader)) {
        return res.status(403).json({ message: 'CSRF token inválido o ausente' });
    }

    return next();
};
