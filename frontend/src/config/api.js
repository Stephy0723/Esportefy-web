// ============================================
// CONFIGURACIÓN CENTRAL DE URLs DEL API
// ============================================
// Usa variables de entorno de Vite para producción.
// En desarrollo, usa localhost como fallback.
//
// Para producción, crea un archivo .env en /frontend:
//   VITE_API_URL=https://tu-backend.com
//   VITE_CHAT_URL=https://tu-chat-service.com

const DEFAULT_API_URL = import.meta.env.DEV ? 'http://localhost:4000' : 'http://76.13.97.163';
const DEFAULT_CHAT_URL = import.meta.env.DEV ? 'http://localhost:5000' : 'http://localhost:5000';

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;
export const CHAT_URL = import.meta.env.VITE_CHAT_URL || DEFAULT_CHAT_URL;
