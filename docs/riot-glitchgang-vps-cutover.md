# Riot Review Cutover - glitchgang.net

Fecha: 2026-03-19  
Proyecto: GlitchGang

Este documento deja el deploy de review listo para VPS con el dominio real:

- Frontend: `https://glitchgang.net`
- API: `https://api.glitchgang.net`

## 1) Objetivo

Publicar una URL HTTPS estable para que Riot pueda:

- abrir la home,
- leer el disclaimer legal,
- abrir `https://glitchgang.net/review/riot`,
- probar el flujo de vinculacion Riot,
- validar restricciones de torneos Riot.

## 2) Importante mientras sigas con development key

Riot no permite consumo publico con personal/dev key.  
Si todavia no tienes Production Key:

- usa `ALLOW_RIOT_DEV_KEY_IN_PROD=true` solo en este review build,
- protege frontend y API con `basic auth` o allowlist/IP,
- no promociones la URL como beta publica,
- desactiva ese override cuando Riot te entregue la key de producción.

## 3) Backend env recomendado

Basado en `Backend/.env.riot.review.example`:

```env
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://glitchgang.net
CORS_ORIGINS=https://glitchgang.net
AUTH_COOKIE_DOMAIN=.glitchgang.net
AUTH_COOKIE_NAME=auth_token
CSRF_COOKIE_NAME=csrf_token
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
MONGO_URI=mongodb://127.0.0.1:27017/glitchgang
JWT_SECRET=usa-un-secreto-largo-y-unico
EMAIL_USER=ops@glitchgang.net
EMAIL_PASS=tu-app-password
RIOT_API_KEY=tu-riot-api-key
RIOT_KEY_MODE=development
ALLOW_RIOT_DEV_KEY_IN_PROD=true
RIOT_REVIEW_MODE=true
RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS=20
RIOT_TOURNAMENT_CALLBACK=https://api.glitchgang.net/api/riot/tournament/callback
```

## 4) Frontend env recomendado

Basado en `frontend/.env.riot.review.example`:

```env
VITE_API_URL=https://api.glitchgang.net
VITE_MEDIA_URL=https://api.glitchgang.net
VITE_CHAT_URL=https://chat.glitchgang.net
VITE_RIOT_REVIEW_MODE=true
VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20
VITE_MLBB_BETA_MODE=true
VITE_CSRF_COOKIE_NAME=csrf_token
```

## 5) Nginx

Usa como base:

- `deploy/nginx/glitchgang-review.conf`

La configuración ya contempla:

- `glitchgang.net`
- `www.glitchgang.net`
- `api.glitchgang.net`
- redirect a HTTPS
- comentario listo para `basic auth`

## 6) Certificados

```bash
sudo certbot --nginx -d glitchgang.net -d www.glitchgang.net -d api.glitchgang.net
sudo certbot renew --dry-run
```

## 7) Build y procesos

```bash
cd /var/www/glitchgang/Backend
npm install

cd /var/www/glitchgang/frontend
npm install
npm run build

pm2 start /var/www/glitchgang/deploy/pm2/backend-ecosystem.config.cjs
pm2 save
```

## 8) Verificación rápida

```bash
curl -I https://glitchgang.net
curl -I https://api.glitchgang.net/healthz
curl -I https://glitchgang.net/review/riot
```

## 9) Qué debe estar visible para Riot

- Home pública cargando por HTTPS
- Footer con disclaimer Riot
- `/review/riot`
- páginas legales
- Settings con flujo Riot
- restricciones Riot en torneos

## 10) Antes de enviar la solicitud

- `npm --prefix frontend run build`
- `npm --prefix Backend run test:e2e:riot`
- verificación manual de `docs/riot-manual-review-checklist.md`
- grabación corta o screenshots del flujo
- `riot.txt` listo para publicar si Riot lo pide
