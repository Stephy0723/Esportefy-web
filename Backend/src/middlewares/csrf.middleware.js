'use strict';

import crypto from 'node:crypto';

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const CSRF_HEADER_NAME = (process.env.CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_HEADER_ALT = 'x-xsrf-token';
const SAFE_METHODS = Object.freeze(new Set(['GET', 'HEAD', 'OPTIONS']));
const PUBLIC_AUTH_PREFIXES = Object.freeze([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check-phone',
    '/api/auth/check-username',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/logout',
    '/api/security/2fa/verify-login',
    '/api/newsletter/subscribe'
]);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const AUTH_COOKIE_SECURE = process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === 'true'
    : IS_PRODUCTION;

const parseCookies = (cookieHeader = '') => {
    if (cookieHeader == null) return {};

    const headerStr = String(cookieHeader);
    if (!headerStr) return {};

    try {
        return headerStr
            .split(';')
            .map((pair) => pair.trim())
            .filter(Boolean)
            .reduce((acc, pair) => {
                const idx = pair.indexOf('=');
                if (idx === -1) return acc;

                const key = pair.slice(0, idx).trim();
                const value = pair.slice(idx + 1).trim();
                if (!key) return acc;

                try {
                    acc[key] = decodeURIComponent(value);
                } catch (_) {
                    acc[key] = value;
                }
                return acc;
            }, {});
    } catch (_) {
        return {};
    }
};

const buildCsrfCookieOptions = () => {
    const options = {
        httpOnly: false,
        secure: AUTH_COOKIE_SECURE,
        sameSite: 'lax',
        path: '/'
    };
    if (process.env.AUTH_COOKIE_DOMAIN) {
        options.domain = process.env.AUTH_COOKIE_DOMAIN;
    }
    return options;
};

const issueCsrfCookie = (res) => {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, buildCsrfCookieOptions());
    return token;
};

export const verifyCsrf = (req, res, next) => {
    try {
        const cookies = parseCookies(req.headers?.cookie || '');
        const authCookie = cookies[AUTH_COOKIE_NAME];
        const csrfCookie = cookies[CSRF_COOKIE_NAME];

        if (SAFE_METHODS.has(req.method)) {
            if (authCookie && !csrfCookie) {
                issueCsrfCookie(res);
                console.info(`[CSRF] Cookie regenerada en request segura: ${req.method} ${req.originalUrl || req.url || ''}`);
            }
            return next();
        }

        const requestPath = String(req.originalUrl || req.url || '').split('?')[0];
        if (PUBLIC_AUTH_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) {
            return next();
        }

        if (!authCookie) {
            return next();
        }

        const csrfHeader = req.headers?.[CSRF_HEADER_NAME] || req.headers?.[CSRF_HEADER_ALT];

        if (!csrfCookie || !csrfHeader) {
            if (!csrfCookie) {
                issueCsrfCookie(res);
                console.warn(`[CSRF] Falta cookie ${CSRF_COOKIE_NAME} en ${req.method} ${requestPath}`);
            }
            if (!csrfHeader) {
                console.warn(`[CSRF] Falta header ${CSRF_HEADER_NAME} en ${req.method} ${requestPath}`);
            }
            return res.status(403).json({
                message: 'CSRF token ausente',
                code: 'CSRF_TOKEN_MISSING'
            });
        }

        if (String(csrfCookie) !== String(csrfHeader)) {
            return res.status(403).json({
                message: 'CSRF token inválido',
                code: 'CSRF_TOKEN_MISMATCH'
            });
        }

        return next();
    } catch (error) {
        console.error('[CSRF Middleware Error]', error.message);
        return res.status(500).json({
            message: 'Error en validación de CSRF',
            code: 'CSRF_VALIDATION_ERROR'
        });
    }
};
