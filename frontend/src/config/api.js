// ============================================
// CONFIGURACIÓN CENTRAL DE URLs DEL API
// ============================================
// Usa variables de entorno de Vite para producción.
// En desarrollo, usa localhost como fallback.
//
// Para producción/review, crea un archivo .env en /frontend:
//   VITE_API_URL=https://api.tu-dominio.com
//   VITE_MEDIA_URL=https://api.tu-dominio.com
//   VITE_CHAT_URL=https://chat.tu-dominio.com

const getBrowserOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
};

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://localhost:4000' : getBrowserOrigin();
const DEFAULT_CHAT_URL = import.meta.env.DEV ? 'http://localhost:5000' : getBrowserOrigin();

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
export const CHAT_URL = import.meta.env.VITE_CHAT_URL || DEFAULT_CHAT_URL;
export const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || API_URL;
