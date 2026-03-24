'use strict';

// Configuración de CSRF - Con fallbacks para compatibilidad Node.js v24
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || 'auth_token';
const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrf_token';
const CSRF_HEADER_NAME = (process.env.CSRF_HEADER_NAME || 'x-csrf-token').toLowerCase();
const CSRF_HEADER_ALT = 'x-xsrf-token';

// Métodos HTTP seguros (no requieren validación CSRF)
const SAFE_METHODS = Object.freeze(new Set(['GET', 'HEAD', 'OPTIONS']));

// Rutas públicas de autenticación (excluidas de validación CSRF)
const PUBLIC_AUTH_PREFIXES = Object.freeze([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/check-phone',
    '/api/auth/check-username',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/security/2fa/verify-login',
    '/api/newsletter/subscribe'
]);

/**
 * Parsea cookies desde el header sin modificar objetos del request
 * Compatible con Node.js v24 - No modifica propiedades de solo lectura
 * @param {string} cookieHeader - Header de cookies crudas
 * @returns {Object} Objeto con cookies parseadas
 */
const parseCookies = (cookieHeader = '') => {
    // Validar que sea string o undefined
    if (cookieHeader == null) return {};
    
    const headerStr = String(cookieHeader);
    if (!headerStr || headerStr.length === 0) return {};
    
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
                
                // Validar que la clave sea válida
                if (!key || key.length === 0) return acc;
                
                try {
                    acc[key] = decodeURIComponent(value);
                } catch (_) {
                    // Si falla decodeURIComponent, usar valor crudos
                    acc[key] = value;
                }
                return acc;
            }, {});
    } catch (_) {
        // En caso de error en el parseo, retornar objeto vacío
        return {};
    }
};

/**
 * Middleware CSRF con patrón Double Submit Cookie
 * Compara token en cookie con header x-csrf-token
 * 
 * Comportamiento:
 * - GET/HEAD/OPTIONS: Pasan sin validación (métodos seguros)
 * - Rutas /api/auth/*: Pasan sin validación (públicas)
 * - Sin auth_token: Pasan sin validación (no autenticado)
 * - Otros: Requieren csrf_token en cookie === x-csrf-token en header
 * 
 * @param {Object} req - Request object (no es modificado)
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const verifyCsrf = (req, res, next) => {
    try {
        // 1. Permitir métodos seguros sin validación CSRF
        if (SAFE_METHODS.has(req.method)) {
            return next();
        }

        // 2. Obtener ruta solicitada de forma segura
        const requestPath = String(req.originalUrl || req.url || '').split('?')[0];
        
        // 3. Excluir rutas de autenticación pública
        if (PUBLIC_AUTH_PREFIXES.some((prefix) => requestPath.startsWith(prefix))) {
            return next();
        }

        // 4. Parsear cookies desde header (sin modificar req)
        const cookies = parseCookies(req.headers?.cookie || '');
        
        // 5. Si no hay token de autenticación, permitir (usuario no autenticado)
        const authCookie = cookies[AUTH_COOKIE_NAME];
        if (!authCookie) {
            return next();
        }

        // 6. Validar CSRF token - Double Submit Cookie pattern
        const csrfCookie = cookies[CSRF_COOKIE_NAME];
        const csrfHeader = req.headers?.[CSRF_HEADER_NAME] || req.headers?.[CSRF_HEADER_ALT];

        // 7. Ambos tokens deben existir y coincidir exactamente
        if (!csrfCookie || !csrfHeader) {
            return res.status(403).json({ 
                message: 'CSRF token ausente',
                code: 'CSRF_TOKEN_MISSING'
            });
        }

        // 8. Comparar tokens como strings (seguro contra tipo coerción)
        if (String(csrfCookie) !== String(csrfHeader)) {
            return res.status(403).json({ 
                message: 'CSRF token inválido',
                code: 'CSRF_TOKEN_MISMATCH'
            });
        }

        // 9. Token válido, continuar
        return next();
    } catch (error) {
        // Fallar de forma segura en caso de error inesperado
        console.error('[CSRF Middleware Error]', error.message);
        return res.status(500).json({ 
            message: 'Error en validación de CSRF',
            code: 'CSRF_VALIDATION_ERROR'
        });
    }
};
