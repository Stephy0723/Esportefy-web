# MLBB Beta VPS Checklist

Guia concreta para subir la beta MLBB al VPS sin abrirla todavia al publico general.

## Objetivo

Dejar un entorno remoto estable para:

- probar MLBB en `auto`,
- correr smoke tests contra URL real,
- validar frontend/backend/uploads/CORS,
- y abrir beta cuando el entorno ya este cerrado.

## 1) Subdominios recomendados

- `beta.tudominio.com` -> frontend
- `api.tudominio.com` -> backend

Si todavia no quieres abrirlo al publico:

- protege `beta.tudominio.com` con acceso controlado,
- o comparte la URL solo internamente.

## 2) Variables backend recomendadas para MLBB beta

Usa como base `deploy/env/backend.mlbb-beta.env.example`.

Criticas:

- `NODE_ENV=production`
- `PORT=4000`
- `FRONTEND_URL=https://beta.tudominio.com`
- `CORS_ORIGINS=https://beta.tudominio.com`
- `MONGO_URI=...`
- `JWT_SECRET=...`
- `MLBB_VERIFICATION_MODE=auto`
- `MLBB_EMAIL_QUEUE_ENABLED=false`
- `MLBB_BETA_MODE=true`
- `MLBB_MIN_APPROVED_TEAMS=2`
- `MLBB_REQUIRE_LINKED_STARTERS=true`

## 3) Variables frontend recomendadas

Usa como base `deploy/env/frontend.mlbb-beta.env.example`.

Criticas:

- `VITE_API_URL=https://api.tudominio.com`
- `VITE_MLBB_BETA_MODE=true`

## 4) Flujo de deploy

```bash
cd /var/www/glitchgang
git pull origin main

cd Backend
npm install

cd ../frontend
npm install
npm run build
```

Luego:

```bash
pm2 start /var/www/glitchgang/deploy/pm2/backend-ecosystem.config.cjs
pm2 save
```

Y activa Nginx con una config derivada de `deploy/nginx/glitchgang-review.conf`.

## 5) Verificaciones remotas obligatorias

### Backend

- `GET https://api.tudominio.com/api/auth/mlbb/status` responde correctamente autenticado.
- `POST https://api.tudominio.com/api/auth/login` devuelve token.
- `POST https://api.tudominio.com/api/auth/mlbb/validate` acepta `playerId + zoneId` validos.
- `POST https://api.tudominio.com/api/auth/mlbb/link` deja cuenta en `verified` cuando estas en `auto`.

### Frontend

- las imagenes cargan desde `/uploads`
- el login funciona
- la conexion MLBB funciona
- el formulario de crear equipo MLBB respeta las validaciones
- el registro en torneo MLBB funciona

### Produccion

- cookies y CORS no rompen login
- no hay rutas apuntando a `localhost`
- `VITE_API_URL` apunta al backend publico real

## 6) Smoke test minimo antes de abrir beta

1. Iniciar sesion con usuario de prueba.
2. Vincular cuenta MLBB.
3. Confirmar `verified` en estado MLBB.
4. Crear equipo MLBB.
5. Registrar el equipo en un torneo MLBB gratis.
6. Confirmar que un torneo invalido no puede iniciar.

## 7) No abrir beta publica hasta esto

- [ ] HTTPS activo
- [ ] backend estable en PM2/systemd
- [ ] frontend compilado con `VITE_API_URL` correcto
- [ ] smoke test remoto completo
- [ ] carga base ejecutada
- [ ] mensaje legal MLBB visible
- [ ] rollback simple definido

## 8) Rollback minimo

Si la beta falla:

1. desactiva acceso publico al frontend,
2. vuelve al build anterior,
3. reinicia backend con PM2,
4. revisa logs de backend y Nginx,
5. no reabras hasta repetir smoke test.
