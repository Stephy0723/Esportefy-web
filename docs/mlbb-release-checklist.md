# MLBB Release Checklist (P0 / P1)

Checklist operativo para cerrar beta MLBB antes de enfocarnos en brackets.

## P0 (bloqueante)

- [ ] API backend en línea y estable (`/api/auth/*`, `/api/tournaments/*`, `/api/teams/*`).
- [ ] `MLBB_VERIFICATION_MODE` definido (`manual` o `auto`) según estrategia.
- [ ] SMTP configurado:
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `MLBB_REVIEW_EMAIL`
- [ ] Cola MLBB activa:
  - `MLBB_EMAIL_QUEUE_ENABLED=true`
  - worker corriendo
  - `GET /api/auth/mlbb/ops/status` devuelve métricas
- [ ] Verificación MLBB end-to-end ejecutada:
  - `npm run test:e2e:mlbb` en `Backend`
- [ ] Carga base verificada (>=100 concurrencia):
  - `npm run test:load:mlbb` en `Backend`
- [ ] Auditoría admin disponible:
  - `GET /api/settings/admin/audit`
  - se registran acciones `mlbb.review.*` y `tournament.status.*`
- [ ] Mensaje legal/UI visible:
  - verificación MLBB es interna (no oficial de Moonton)
- [ ] Torneos MLBB cumplen:
  - gratis en beta
  - sin términos de apuestas/gambling
  - mínimos de aprobación antes de iniciar

## P1 (recomendado)

- [ ] Monitoreo de entrega SMTP (ratio delivered/failed por hora).
- [ ] Alertas operativas (errores de cola, backlog alto).
- [ ] Dominio final + HTTPS con certificado válido.
- [ ] Endurecer CORS y variables de producción.
- [ ] Runbook de incidentes (caída SMTP/Redis/Mongo).

## Comandos útiles

Desde `Backend/`:

```bash
npm run test:e2e:mlbb
```

```bash
npm run test:load:mlbb
```

Variables para E2E:

```bash
export API_BASE_URL=http://localhost:4000
export E2E_PLAYER_EMAIL=player@mail.com
export E2E_PLAYER_PASSWORD=tu_password
export E2E_ADMIN_EMAIL=admin@mail.com
export E2E_ADMIN_PASSWORD=tu_password
export E2E_MLBB_PLAYER_ID=123456789
export E2E_MLBB_ZONE_ID=1234
export E2E_MLBB_IGN=ProPlayer
```

Variables para carga:

```bash
export API_BASE_URL=http://localhost:4000
export LOAD_AUTH_TOKEN=<TOKEN_VALIDO>
export LOAD_PATH=/api/auth/mlbb/status
export LOAD_METHOD=GET
export LOAD_TOTAL_REQUESTS=500
export LOAD_CONCURRENCY=100
```

Estado operativo (admin token):

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:4000/api/auth/mlbb/ops/status
```

Procesar cola manual (admin token):

```bash
curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" \
  http://localhost:4000/api/auth/mlbb/ops/process
```

Ver auditoría (admin token):

```bash
curl -H "Authorization: Bearer <ADMIN_TOKEN>" \
  "http://localhost:4000/api/settings/admin/audit?limit=50&page=1"
```
