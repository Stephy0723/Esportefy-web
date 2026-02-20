// ============================================
// CONFIGURACIÓN CENTRAL DE URLs DEL API
// ============================================
// Usa variables de entorno de Vite para producción.
// En desarrollo, usa localhost como fallback.
//
// Para producción, crea un archivo .env en /frontend:
//   VITE_API_URL=https://tu-backend.com
//   VITE_CHAT_URL=https://tu-chat-service.com

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
export const CHAT_URL = import.meta.env.VITE_CHAT_URL || 'http://localhost:5000';
