# Deploy Templates

Para la review real de Riot en este proyecto, usa primero:

- `docs/riot-glitchgang-vps-cutover.md`
- `docs/riot-review-vps-checklist.md`

Este archivo queda como referencia general de deploy.

Plantillas base para publicar la URL de revision de Riot o una beta controlada de MLBB.

## Archivos

- `deploy/nginx/glitchgang-review.conf`
  - Nginx para:
    - `review.tudominio.com` -> frontend estatico
    - `api.tudominio.com` -> backend Node en `127.0.0.1:4000`

- `deploy/pm2/backend-ecosystem.config.cjs`
  - Proceso PM2 para `Backend/server.js`

- `deploy/env/backend.review.env.example`
  - Variables backend para review de Riot.

- `deploy/env/frontend.review.env.example`
  - Variables frontend para review de Riot.

- `deploy/env/backend.mlbb-beta.env.example`
  - Variables backend para beta controlada de MLBB en `auto`.

- `deploy/env/frontend.mlbb-beta.env.example`
  - Variables frontend para beta controlada de MLBB.

## Ajustes obligatorios

Antes de usarlos, cambia:

- `review.tudominio.com`
- `api.tudominio.com`
- rutas:
  - `/var/www/glitchgang/frontend/dist`
  - `/var/www/glitchgang/Backend`

Si vas a subir MLBB beta en vez de Riot review, usa:

- `beta.tudominio.com` para frontend
- `api.tudominio.com` para backend

## Flujo recomendado en VPS

1. Clonar repo en `/var/www/glitchgang`
2. Instalar dependencias backend y frontend
3. Crear `.env` real para backend
4. Build frontend
5. Levantar backend con PM2
6. Activar config Nginx
7. Generar certificados SSL con Let's Encrypt

## Comandos tipicos

```bash
cd /var/www/glitchgang
git pull origin main

cd Backend
npm install

cd ../frontend
npm install
npm run build

pm2 start /var/www/glitchgang/deploy/pm2/backend-ecosystem.config.cjs
pm2 save
```

Luego:

```bash
sudo cp /var/www/glitchgang/deploy/nginx/glitchgang-review.conf /etc/nginx/sites-available/glitchgang-review.conf
sudo ln -s /etc/nginx/sites-available/glitchgang-review.conf /etc/nginx/sites-enabled/glitchgang-review.conf
sudo nginx -t
sudo systemctl reload nginx
```

## Checklist Exacto Antes De HTTPS

### 1. DNS

Crea estos registros:

- `A review.tudominio.com` -> IP publica del VPS
- `A api.tudominio.com` -> IP publica del VPS

Opcional si usas chat separado:

- `A chat.tudominio.com` -> IP publica del servicio de chat

Verifica propagacion:

```bash
dig +short review.tudominio.com
dig +short api.tudominio.com
```

### 2. Backend env real

Parte de `deploy/env/backend.review.env.example` y crea:

- `/var/www/glitchgang/Backend/.env`

Puntos criticos:

- `FRONTEND_URL=https://review.tudominio.com`
- `CORS_ORIGINS=https://review.tudominio.com`
- `AUTH_COOKIE_DOMAIN=.tudominio.com`
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=none`
- `RIOT_KEY_MODE=production`
- `RIOT_RSO_REDIRECT_URI=https://api.tudominio.com/api/auth/riot/valorant/callback`

No subas review publica con:

- `RIOT_KEY_MODE=development`

porque el backend la bloquea en entorno publico.

### 3. Frontend env real

Parte de `deploy/env/frontend.review.env.example` y crea:

- `/var/www/glitchgang/frontend/.env.production`

Minimo:

```env
VITE_API_URL=https://api.tudominio.com
VITE_CHAT_URL=https://chat.tudominio.com
VITE_MEDIA_URL=https://api.tudominio.com
VITE_CSRF_COOKIE_NAME=csrf_token
VITE_RIOT_REVIEW_MODE=true
VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20
```

### 4. Build y proceso backend

```bash
cd /var/www/glitchgang/Backend
npm install

cd /var/www/glitchgang/frontend
npm install
npm run build

pm2 start /var/www/glitchgang/deploy/pm2/backend-ecosystem.config.cjs
pm2 save
pm2 status
```

Smoke local del backend:

```bash
cd /var/www/glitchgang
npm --prefix Backend run test:e2e:riot
```

### 5. Nginx

Publica la plantilla:

```bash
sudo cp /var/www/glitchgang/deploy/nginx/glitchgang-review.conf /etc/nginx/sites-available/glitchgang-review.conf
sudo ln -s /etc/nginx/sites-available/glitchgang-review.conf /etc/nginx/sites-enabled/glitchgang-review.conf
sudo nginx -t
sudo systemctl reload nginx
```

Ajusta antes:

- `review.tudominio.com`
- `api.tudominio.com`
- `/var/www/glitchgang/frontend/dist`
- certificados en `/etc/letsencrypt/live/...`

### 6. SSL

Instala certificados cuando DNS ya apunte al VPS:

```bash
sudo certbot --nginx -d review.tudominio.com -d api.tudominio.com
```

Verifica renovacion:

```bash
sudo certbot renew --dry-run
```

### 7. Verificaciones tecnicas finales

Frontend:

```bash
curl -I https://review.tudominio.com
```

Backend:

```bash
curl -I https://api.tudominio.com/api/tournaments/public/search
```

CORS:

```bash
curl -I -H "Origin: https://review.tudominio.com" https://api.tudominio.com/api/tournaments/public/search
```

Assets:

- abre `https://review.tudominio.com`
- confirma que imagenes cargan desde `https://api.tudominio.com`

Cookies:

- login en `review.tudominio.com`
- confirma `auth_token` y `csrf_token`
- revisa que tengan `Secure`
- revisa que `SameSite=None`

### 8. Verificaciones Riot antes del submit

- `LoL link` funciona desde Settings
- `VALORANT` muestra el boton de Riot Sign On
- `VALORANT` no deja registrar equipos sin consentimiento RSO
- la vista publica del torneo `VALORANT` muestra:
  - `This competition is not affiliated with or sponsored by Riot Games, Inc. or VALORANT Esports.`
- `Terms` y `Privacy` cargan publicamente
- no quedan logos oficiales de Riot en UI activa
- cuando Riot entregue el token, publica `riot.txt` en la raiz del frontend

### 9. URL que debes probar manualmente

- `https://review.tudominio.com`
- `https://review.tudominio.com/settings`
- `https://review.tudominio.com/torneos/publicos`
- `https://api.tudominio.com/api/auth/riot/status`
- `https://api.tudominio.com/api/auth/riot/valorant/callback`

### 10. Estado minimo para pedir Production Key

Antes de enviar a Riot, deberias tener:

- `LoL` funcional extremo a extremo
- `VALORANT` con `RSO` configurado
- review URL publica por `HTTPS`
- disclaimer publico de `VALORANT`
- demo account
- dos submissions separadas:
  - `GlitchGang - League of Legends`
  - `GlitchGang - VALORANT`
