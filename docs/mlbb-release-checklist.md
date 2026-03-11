# MLBB Release Checklist (P0 / P1)

Checklist operativo para cerrar beta MLBB antes de enfocarnos en brackets.

## Estrategia activa

- `auto`: recomendada para beta controlada y mayor volumen.
- `manual`: solo si vas a revisar solicitudes por correo/admin.

## P0 (bloqueante)

- [ ] API backend en línea y estable (`/api/auth/*`, `/api/tournaments/*`, `/api/teams/*`).
- [ ] `MLBB_VERIFICATION_MODE` definido y coherente con la operación:
  - `auto` para vinculación automática.
  - `manual` para revisión admin.
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
- [ ] Smoke test real en entorno parecido a producción:
  - conectar cuenta MLBB
  - crear equipo MLBB
  - registrar equipo en torneo MLBB
  - validar que el torneo no inicia si incumple reglas

## P0 adicional si usas `auto`

- [ ] `MLBB_EMAIL_QUEUE_ENABLED=false` o cola desactivada explícitamente.
- [ ] `GET /api/auth/mlbb/status` devuelve `verified` al terminar el flujo.
- [ ] Duplicados `playerId + zoneId` siguen bloqueados entre usuarios.

## P0 adicional si usas `manual`

- [ ] SMTP configurado:
  - `EMAIL_USER`
  - `EMAIL_PASS`
  - `MLBB_REVIEW_EMAIL`
- [ ] Cola MLBB activa:
  - `MLBB_EMAIL_QUEUE_ENABLED=true`
  - worker corriendo
  - `GET /api/auth/mlbb/ops/status` devuelve métricas
- [ ] Flujo admin de aprobación probado:
  - `GET /api/auth/mlbb/review/pending`
  - `PATCH /api/auth/mlbb/review/:userId`

## P1 (recomendado)

- [ ] Monitoreo de entrega SMTP si usas `manual`.
- [ ] Alertas operativas (errores de cola, backlog alto).
- [ ] Dominio final + HTTPS con certificado válido.
- [ ] Endurecer CORS y variables de producción.
- [ ] Runbook de incidentes (caída SMTP/Mongo/backend).
- [ ] Cuenta demo y credenciales controladas para smoke tests.

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
export E2E_MLBB_PLAYER_ID=123456789
export E2E_MLBB_ZONE_ID=1234
export E2E_MLBB_IGN=ProPlayer
```

Si ya tienes token JWT, puedes usar:

```bash
export E2E_PLAYER_TOKEN=<TOKEN_JUGADOR>
```

Solo si el flujo cae en `pending` (modo manual o riesgo), agrega credenciales/token admin:

```bash
export E2E_ADMIN_EMAIL=admin@mail.com
export E2E_ADMIN_PASSWORD=tu_password
# o:
export E2E_ADMIN_TOKEN=<TOKEN_ADMIN>
```

Variables para carga:

```bash
export API_BASE_URL=http://localhost:4000
export LOAD_AUTH_TOKEN=<TOKEN_VALIDO>
export LOAD_PATH=/api/auth/mlbb/status
export LOAD_METHOD=GET
export LOAD_TOTAL_REQUESTS=500
export LOAD_CONCURRENCY=100
export LOAD_MAX_FAILURE_RATE=0.05
```

Si no quieres pasar token manual, usa login:

```bash
export LOAD_EMAIL=player@mail.com
export LOAD_PASSWORD=tu_password
```

Si usas `auto`, puedes generar el token de carga con una cuenta de prueba local y luego correr:

```bash
cd Backend
LOAD_AUTH_TOKEN=<TOKEN_VALIDO> npm run test:load:mlbb
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
