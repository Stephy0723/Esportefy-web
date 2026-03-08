# Riot Submit Runbook (Sin Dominio)

Fecha: 2026-03-08  
Proyecto: Esportefy

Este runbook cierra todo lo que se puede completar **antes** de tener dominio final/HTTPS público.

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
- flujo de vinculación Riot
- rechazo por torneo Riot no gratuito (en review mode)
- rechazo por duplicado Riot ID
- rechazo por mínimo de participantes activos

## 4) Lo único pendiente por dominio

No enviar a Riot hasta tener esto:

- URL pública estable por HTTPS
- API por dominio (sin exponer IP directa para revisión)
- `riot.txt` preparado/publicable si Riot lo pide

Checklist de salida a VPS:

- `docs/riot-review-vps-checklist.md`

## 5) Datos para Developer Portal

Campos obligatorios:
- `Product Name`: Esportefy
- `Product URL`: URL review HTTPS
- `Product Game Focus`: League of Legends (y producto separado si luego agregas otro)
- `Are you organizing tournaments?`: Yes

En `Product Description` describe:
- que el API key vive solo en backend
- que el flujo Riot usa vinculación de cuenta + controles anti-duplicado
- que torneos Riot usan reglas tradicionales y controles de integridad
- que no existe afiliación oficial con Riot Games

## 6) Definición de Done (pre-dominio)

Se considera “cerrado” cuando:
- scripts E2E P0 pasan en local
- checklist manual está completo con evidencias
- env de review está versionado en ejemplos
- solo falta cambiar URL final en VPS + submit en portal
