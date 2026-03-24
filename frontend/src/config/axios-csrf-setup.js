// Frontend: Configuración de CSRF Token Auto-Injection
// Coloca esto en src/config/axios.js o src/utils/api.js

import axios from 'axios';

/**
 * Extrae valor de una cookie por nombre
 * @param {string} name - Nombre de la cookie
 * @returns {string|null} Valor de la cookie o null
 */
const getCookie = (name) => {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            try {
                return decodeURIComponent(cookie.substring(nameEQ.length));
            } catch (_) {
                return cookie.substring(nameEQ.length);
            }
        }
    }
    
    return null;
};

/**
 * Headers HTTP que requieren validación CSRF
 */
const CSRF_REQUIRED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * URLs que NO requieren CSRF token
 */
const CSRF_EXCLUDED_URLS = [
    /^\/api\/auth\/login/,
    /^\/api\/auth\/register/,
    /^\/api\/auth\/check-phone/,
    /^\/api\/auth\/check-username/,
    /^\/api\/auth\/forgot-password/,
    /^\/api\/auth\/reset-password/,
    /^\/api\/security\/2fa\/verify-login/,
    /^\/api\/newsletter\/subscribe/
];

/**
 * Verifica si una URL requiere validación CSRF
 * @param {string} url - URL a verificar
 * @returns {boolean} True si requiere CSRF
 */
const requiresCSRF = (url) => {
    return !CSRF_EXCLUDED_URLS.some(pattern => pattern.test(url));
};

/**
 * Crea instancia de axios con interceptor CSRF automático
 */
export const createAxiosInstance = () => {
    const instance = axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
        timeout: 30000,
        withCredentials: true // Importante: permite enviar cookies
    });

    /**
     * Interceptor de REQUEST - Inyecta CSRF token automáticamente
     */
    instance.interceptors.request.use(
        (config) => {
            try {
                const method = (config.method || 'get').toUpperCase();

                // 1. Solo inyectar en métodos que modifican datos
                if (!CSRF_REQUIRED_METHODS.has(method)) {
                    return config;
                }

                // 2. No inyectar en URLs excluidas
                if (!requiresCSRF(config.url)) {
                    return config;
                }

                // 3. Obtener token de cookie
                const csrfToken = getCookie('csrf_token');

                // 4. Si no hay token, permitir request (será rechazada por backend)
                if (!csrfToken) {
                    console.warn(`[CSRF] Token no encontrado para ${method} ${config.url}`);
                    return config;
                }

                // 5. Inyectar token en header
                config.headers['X-CSRF-Token'] = csrfToken;

                return config;
            } catch (error) {
                console.error('[CSRF Interceptor Error]', error.message);
                return config;
            }
        },
        (error) => Promise.reject(error)
    );

    /**
     * Interceptor de RESPONSE - Maneja errores CSRF
     */
    instance.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 403) {
                const code = error.response?.data?.code;

                if (code === 'CSRF_TOKEN_MISSING') {
                    console.error('[CSRF] Token ausente. Usuario debe hacer login.');
                    // Redirigir a login
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                if (code === 'CSRF_TOKEN_MISMATCH') {
                    console.error('[CSRF] Token inválido. Renovando...');
                    // Intentar renovar token
                    return renewCSRFToken().then(() => {
                        // Reintentar request original
                        return instance.request(error.config);
                    }).catch(() => {
                        window.location.href = '/login';
                        return Promise.reject(error);
                    });
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

/**
 * Renueva el CSRF token sin hacer logout
 * Útil si el token expiró pero la sesión aún es válida
 */
export const renewCSRFToken = async () => {
    try {
        const instance = axios.create({
            baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
            withCredentials: true
        });

        const response = await instance.get('/api/auth/refresh-csrf');
        console.log('[CSRF] Token renovado correctamente');
        return response.data;
    } catch (error) {
        console.error('[CSRF Renew Error]', error.message);
        throw error;
    }
};

// Crear instancia predeterminada
export const apiClient = createAxiosInstance();

// Exportar para uso en componentes
export default apiClient;


// ============================================================
// ALTERNATIVA: Implementación sin librería de HTTP
// ============================================================

/**
 * Versión con Fetch API (sin axios)
 */
export const createFetchWithCSRF = () => {
    return async (url, options = {}) => {
        try {
            const method = (options.method || 'GET').toUpperCase();

            // Inyectar CSRF token en métodos que modifican
            if (CSRF_REQUIRED_METHODS.has(method) && requiresCSRF(url)) {
                const csrfToken = getCookie('csrf_token');
                
                if (!csrfToken) {
                    console.warn(`[CSRF] Token no encontrado para ${method} ${url}`);
                } else {
                    options.headers = options.headers || {};
                    options.headers['X-CSRF-Token'] = csrfToken;
                }
            }

            // Asegurar que se envíen cookies
            options.credentials = 'include';

            const response = await fetch(url, options);

            // Manejo de errores CSRF
            if (response.status === 403) {
                const data = await response.json();
                const code = data.code;

                if (code === 'CSRF_TOKEN_MISSING' || code === 'CSRF_TOKEN_MISMATCH') {
                    console.error(`[CSRF] ${data.message}`);
                    window.location.href = '/login';
                }
            }

            return response;
        } catch (error) {
            console.error('[Fetch CSRF Error]', error.message);
            throw error;
        }
    };
};


// ============================================================
// EJEMPLO DE USO EN COMPONENTES REACT/VUE
// ============================================================

/**
 * React Example - Hook personalizado
 */
export const useAPI = () => {
    return {
        post: (url, data) => apiClient.post(url, data),
        put: (url, data) => apiClient.put(url, data),
        patch: (url, data) => apiClient.patch(url, data),
        delete: (url) => apiClient.delete(url),
        get: (url) => apiClient.get(url)
    };
};

/**
 * Ejemplo de uso:
 * 
 * // En componente React
 * const api = useAPI();
 * 
 * const handleCreateTeam = async (teamData) => {
 *   try {
 *     // CSRF token inyectado automáticamente
 *     const response = await api.post('/api/teams/create', teamData);
 *     console.log('Team created:', response.data);
 *   } catch (error) {
 *     if (error.response?.status === 403) {
 *       console.error('CSRF error - user will be redirected to login');
 *     }
 *   }
 * };
 */
