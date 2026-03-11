# Auth + Perfil P0 Checklist

## 1) Sesion unificada (frontend)
- Todas las lecturas de token usan `getAuthToken()` desde `frontend/src/utils/authSession.js`.
- Axios global (`frontend/src/main.jsx`) agrega `Bearer` automaticamente cuando existe token.
- `withCredentials=true` queda activo para flujo cookie HttpOnly.
- Manejo global 401/403:
  - limpia storage de sesion,
  - dispara `user-update`,
  - redirige a `/login` si la ruta no es publica.

## 2) Smoke de Auth (backend)
- Script: `Backend/scripts/e2e/auth-session-smoke.js`
- Comando: `npm --prefix Backend run test:e2e:auth`
- Cubre:
  - login normal,
  - refresh de sesion (profile por cookie 2 veces),
  - logout,
  - login con remember me,
  - validacion de mayor `Max-Age` en cookie para remember me.

## 3) Upload/avatar en local y VPS
- Resolver de media usa `VITE_MEDIA_URL` (fallback a `VITE_API_URL`):
  - archivo: `frontend/src/utils/media.js`
  - variables: `frontend/.env.example`

### Variables recomendadas
- Frontend local:
  - `VITE_API_URL=http://localhost:4000`
  - `VITE_MEDIA_URL=http://localhost:4000`
- Frontend VPS:
  - `VITE_API_URL=https://tu-backend-dominio.com`
  - `VITE_MEDIA_URL=https://tu-backend-dominio.com`

## 4) CORS para `/uploads`
- Backend usa CORS global antes de `app.use('/uploads', express.static(...))`.
- Asegura que `Backend/.env` incluya todos los orígenes frontend en:
  - `CORS_ORIGINS=http://localhost:5173,https://tu-frontend.com`
