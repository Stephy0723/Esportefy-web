# Plan de Cierre Beta (7 dias)

Fecha base: 2026-03-06  
Objetivo: cerrar modulos trabajados y llegar a una beta estable, medible y publicable.

## Reglas del plan
- Prioridad absoluta a P0 (bloqueantes de beta).
- No abrir beta publica hasta completar Dia 6.
- Cada dia cierra con evidencia (smoke, logs, capturas o checklist marcado).

## Dia 1 - Auth + Sesion + Media (P0)

### Tareas
- Unificar manejo de sesion (`cookie + bearer`) en frontend.
- Manejo global de `401/403` para limpiar sesion y redirigir sin loops.
- Corregir carga de imagenes (`/uploads`) en perfil/equipos/torneos.
- Verificar CORS y cookies en local y staging.

### Criterio de salida
- Login, refresh y logout funcionan sin doble intento.
- No aparece `Token invalido o expirado` por desincronizacion de cliente.
- Imagenes dejan de salir con `?` en todos los modulos.

---

## Dia 2 - Amigos + Equipos (P0)

### Tareas
- Ejecutar smoke social completo.
- Validar invitaciones de equipo solo con seguimiento mutuo.
- Validar invitaciones por notificacion (no chat), aceptar/rechazar flujo.
- Validar reglas de slots/roles y restricciones de equipo universitario.

### Criterio de salida
- `Friends` estable: buscar/seguir/mutuo/ocultar ID.
- Invitar amigo a equipo solo si son mutuos.
- Crear/unirse/salir/eliminar equipo sin inconsistencias.

### Comandos
```bash
cd Backend
npm run test:e2e:social
```

---

## Dia 3 - Torneos + MLBB (P0)

### Tareas
- Smoke end-to-end de torneo (crear, registrar, aprobar, iniciar).
- Definir modo MLBB final para beta (`auto` recomendado).
- Ejecutar E2E y carga MLBB.
- Validar reglas legales MLBB en creacion de torneo.

### Criterio de salida
- Torneo inicia solo con condiciones validas.
- MLBB vincula/verifica sin friccion critica.
- Sin duplicados de `playerId + zoneId`.

### Comandos
```bash
cd Backend
npm run test:e2e:mlbb
npm run test:load:mlbb
```

---

## Dia 4 - University (P0)

### Tareas
- Cerrar flujo de postulacion y revision admin.
- Cerrar Microsoft Entra real (credenciales productivas correctas).
- Validar aprobacion/rechazo/revocacion.
- Validar conteos reales por universidad.

### Criterio de salida
- Estado universitario consistente (`unlinked/pending/verified/rejected`).
- Admin puede revisar todo desde panel.
- Usuario rechazado puede volver a postular.

### Comandos
```bash
cd Backend
npm run test:e2e:university
```

---

## Dia 5 - Riot Review Readiness (P0)

### Tareas
- Verificar legal/disclaimer Riot visible en entorno review.
- Verificar restricciones Riot en torneos (gratis/minimo/formato tradicional).
- Validar documento de app notes + compliance final.

### Criterio de salida
- Checklist Riot completo para submit.
- Flujo Riot demostrable de principio a fin.

---

## Dia 6 - Staging/VPS + Operacion (P0)

### Tareas
- Deploy staging limpio (frontend+backend+uploads).
- Validar HTTPS, CORS, cookies, rutas y endpoints criticos.
- Configurar monitoreo minimo (logs, errores 5xx, latencia basica).
- Definir rollback simple.

### Criterio de salida
- Smoke remoto completo sin errores bloqueantes.
- Rollback probado.

---

## Dia 7 - Go/No-Go + Lanzamiento Beta Controlada

### Tareas
- Repaso final de checklists P0.
- Dry run con cuentas reales de prueba.
- Congelar cambios de alto riesgo.
- Lanzar beta controlada (grupo cerrado).

### Criterio de salida
- Decision formal Go/No-Go con evidencia.
- Si Go: abrir acceso beta en ventana definida.

---

## Lista P0 global (no negociable)
- [ ] Auth/sesion estable en todo el frontend.
- [ ] Imagenes cargando correctamente en todos los modulos.
- [ ] Friends/Teams smoke completo.
- [ ] Tournament + MLBB smoke y carga base.
- [ ] University flow cerrado con admin review.
- [ ] Riot review checklist listo.
- [ ] Staging VPS estable con HTTPS.
- [ ] Rollback documentado y probado.

## Lista P1 (post-beta)
- Brackets avanzados.
- Tiempo real por sockets para social/equipos.
- Hardening extra de rate limits y alertas.
- Reporteria avanzada para universidades.
