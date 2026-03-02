# Deploy Templates

Plantillas base para publicar la URL de revision de Riot o una beta controlada de MLBB.

## Archivos

- `deploy/nginx/esportefy-review.conf`
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
  - `/var/www/esportefy/frontend/dist`
  - `/var/www/esportefy/Backend`

Si vas a subir MLBB beta en vez de Riot review, usa:

- `beta.tudominio.com` para frontend
- `api.tudominio.com` para backend

## Flujo recomendado en VPS

1. Clonar repo en `/var/www/esportefy`
2. Instalar dependencias backend y frontend
3. Crear `.env` real para backend
4. Build frontend
5. Levantar backend con PM2
6. Activar config Nginx
7. Generar certificados SSL con Let's Encrypt

## Comandos tipicos

```bash
cd /var/www/esportefy
git pull origin main

cd Backend
npm install

cd ../frontend
npm install
npm run build

pm2 start /var/www/esportefy/deploy/pm2/backend-ecosystem.config.cjs
pm2 save
```

Luego:

```bash
sudo cp /var/www/esportefy/deploy/nginx/esportefy-review.conf /etc/nginx/sites-available/esportefy-review.conf
sudo ln -s /etc/nginx/sites-available/esportefy-review.conf /etc/nginx/sites-enabled/esportefy-review.conf
sudo nginx -t
sudo systemctl reload nginx
```
