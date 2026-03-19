# Riot Submit Runbook (HTTPS Ready)

Fecha: 2026-03-08  
Proyecto: GlitchGang

Este runbook asume que GlitchGang ya tiene HTTPS y un VPS listos para una URL de review privada.

## 0) Rotacion de secretos antes del submit

Antes de exponer una URL review publica:

- genera un `JWT_SECRET` nuevo, largo y unico,
- rota cualquier `RIOT_API_KEY` usada en pruebas compartidas,
- rota credenciales de correo/OAuth si fueron expuestas en screenshots, chat o videos,
- verifica que el entorno review no use placeholders como `ponerunaclaveaqui`.

## 1) Configuración local de review

Backend:

```bash
cp Backend/.env.riot.review.example Backend/.env
```

Frontend:

```bash
cp frontend/.env.riot.review.example frontend/.env
```

Ajusta secretos reales en `Backend/.env`:
- `MONGO_URI`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `RIOT_API_KEY`

## 2) Validación automática (P0)

Desde `Backend/`:

```bash
npm install
npm run test:e2e:auth
npm run test:e2e:teams
npm run test:e2e:riot
```

Qué cubre `test:e2e:riot`:
- bloquea torneos Riot con `entryFee=Pago` en review mode
- bloquea capacidad menor al mínimo activo (`RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS`)
- bloquea `seedingMode=custom` con inscripción abierta
- bloquea Riot IDs duplicados entre registros del torneo

## 3) Validación manual (P0)

Ejecutar checklist:

- `docs/riot-manual-review-checklist.md`
- `docs/riot-compliance-checklist.md`

Evidencias mínimas:
- footer legal visible (disclaimer Riot)
- review landing publica accesible en `/review/riot`
- flujo de vinculación Riot
- rechazo por torneo Riot no gratuito (en review mode)
- rechazo por duplicado Riot ID
- rechazo por mínimo de participantes activos

## 4) Corte a VPS

Usa estas guías:

- `docs/riot-review-vps-checklist.md`
- `docs/riot-glitchgang-vps-cutover.md`

No enviar a Riot hasta tener:

- `https://glitchgang.net` respondiendo por HTTPS
- `https://api.glitchgang.net/healthz` respondiendo 200
- `riot.txt` preparado/publicable si Riot lo pide
- el review build protegido si todavía usa development key

## 5) Datos para Developer Portal

Campos obligatorios:
- `Product Name`: GlitchGang
- `Product URL`: URL review HTTPS
- `Product Game Focus`: League of Legends (y producto separado si luego agregas otro)
- `Are you organizing tournaments?`: Yes

En `Product Description` describe:
- el branding publico visible si difiere del nombre legal del producto,
- que el API key vive solo en backend
- que el flujo Riot usa vinculación de cuenta + controles anti-duplicado
- que la review publica tiene una ruta explicativa (`/review/riot`)
- que torneos Riot usan reglas tradicionales y controles de integridad
- que no existe afiliación oficial con Riot Games

## 6) Definición de Done (pre-dominio)

Se considera “cerrado” cuando:
- scripts E2E P0 pasan en local
- checklist manual está completo con evidencias
- env de review está versionado en ejemplos
- solo falta cambiar URL final en VPS + submit en portal
