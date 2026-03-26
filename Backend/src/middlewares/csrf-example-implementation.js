// Ejemplo de Implementación CSRF Token en Login
// Coloca esto en tu auth.controller.js o auth.routes.js

import crypto from 'crypto';

/**
 * Genera un token CSRF seguro de 32 bytes
 * @returns {string} Token hexadecimal de 64 caracteres
 */
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Valida que una cookie CSRF sea un formato válido
 * @param {string} token - Token CSRF a validar
 * @returns {boolean} True si el token es válido
 */
const isValidCSRFToken = (token) => {
    // Debe ser string de 64 caracteres hexadecimales
    if (!token || typeof token !== 'string') return false;
    if (token.length !== 64) return false;
    return /^[a-f0-9]{64}$/i.test(token);
};

/**
 * Configuración de cookies CSRF
 * Compatible con Node.js v24
 */
const getCSRFCookieOptions = () => ({
    // HttpOnly: previene acceso desde JavaScript (protege contra XSS)
    httpOnly: true,
    
    // Secure: solo envía por HTTPS en producción
    secure: process.env.NODE_ENV === 'production',
    
    // SameSite: previene CSRF
    sameSite: 'strict',
    
    // Path: disponible en toda la aplicación
    path: '/',
    
    // MaxAge: 24 horas
    maxAge: 24 * 60 * 60 * 1000,
    
    // Domain: personalizar si es necesario
    // domain: '.example.com'
});

/**
 * EJEMPLO 1: Endpoint POST para Login
 * Genera y retorna CSRF token
 */
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validar credentials (tu lógica actual)
        const user = await User.findOne({ email });
        if (!user || !user.verifyPassword(password)) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // 2. Generar JWT token (tu lógica actual)
        const authToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 3. NUEVA: Generar CSRF token
        const csrfToken = generateCSRFToken();

        // 4. NUEVA: Setear cookies
        res.cookie('auth_token', authToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.cookie('csrf_token', csrfToken, getCSRFCookieOptions());

        // 5. Responder con datos del usuario (auth_token en cookie, no en response)
        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                username: user.username
            },
            // NOTA: No envíes tokens en el body si ya están en cookies HttpOnly
        });

    } catch (error) {
        console.error('[Login Error]', error.message);
        return res.status(500).json({ message: 'Error en login' });
    }
};

/**
 * EJEMPLO 2: Endpoint GET para Renovar CSRF Token
 * Si el token CSRF expira, el frontend puede pedir uno nuevo sin re-loginear
 */
export const refreshCSRFToken = async (req, res) => {
    try {
        // Solo accesible si hay auth_token válido
        const authCookie = req.cookies?.auth_token;
        if (!authCookie) {
            return res.status(401).json({ message: 'No autenticado' });
        }

        // Generar nuevo CSRF token
        const newCSRFToken = generateCSRFToken();
        
        // Setear cookie
        res.cookie('csrf_token', newCSRFToken, getCSRFCookieOptions());

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('[Refresh CSRF Error]', error.message);
        return res.status(500).json({ message: 'Error al renovar CSRF token' });
    }
};

/**
 * EJEMPLO 3: Endpoint POST para Logout
 * Limpia ambas cookies
 */
export const logoutUser = (req, res) => {
    // Limpiar cookies
    res.clearCookie('auth_token');
    res.clearCookie('csrf_token');

    return res.status(200).json({
        success: true,
        message: 'Logout exitoso'
    });
};

/**
 * EJEMPLO 4: Middleware para validar CSRF manualmente
 * Úsalo si necesitas validación adicional en una ruta específica
 */
export const validateCSRFManually = (req, res, next) => {
    try {
        const csrfToken = req.headers['x-csrf-token'];
        
        if (!csrfToken) {
            return res.status(403).json({ 
                message: 'CSRF token requerido',
                code: 'CSRF_MISSING'
            });
        }

        if (!isValidCSRFToken(csrfToken)) {
            return res.status(403).json({ 
                message: 'CSRF token inválido',
                code: 'CSRF_INVALID_FORMAT'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ 
            message: 'Error validando CSRF',
            code: 'CSRF_VALIDATION_ERROR'
        });
    }
};

/**
 * EJEMPLO 5: Ruta típica de Auth en Express
 */
export const setupAuthRoutes = (router) => {
    // POST /api/auth/login - Genera CSRF token
    router.post('/auth/login', loginUser);

    // GET /api/auth/refresh-csrf - Renueva CSRF token (excluido del validation)
    router.get('/auth/refresh-csrf', refreshCSRFToken);

    // POST /api/auth/logout - Limpia CSRF y auth tokens
    router.post('/auth/logout', logoutUser);

    return router;
};

// Agregar estas rutas en app.js:
// import { setupAuthRoutes } from './paths-a-este-archivo.js';
// setupAuthRoutes(authRouter);
