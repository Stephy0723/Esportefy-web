# MLBB Beta Compliance Checklist

Esta lista cubre lo mínimo para operar torneos de Mobile Legends en beta sin depender de APIs no oficiales.

## 1) Variables de entorno

Backend (`Backend/.env`):

- `MLBB_VERIFICATION_MODE=manual` para revisión humana, o `auto` para alto volumen.
- `MLBB_REVIEW_EMAIL=tu-correo@dominio.com` para solicitudes pendientes si usas `manual`.
- `MLBB_LINK_COOLDOWN_SECONDS=90` para evitar spam de solicitudes repetidas.
- `MLBB_EMAIL_QUEUE_ENABLED=true` para activar cola de correos MLBB si usas `manual`.
- `MLBB_EMAIL_QUEUE_POLL_MS=5000` para frecuencia del worker.
- `MLBB_EMAIL_QUEUE_BATCH_SIZE=20` para procesar lotes por ciclo.
- `MLBB_EMAIL_QUEUE_MAX_ATTEMPTS=5` para reintentos de entrega.
- `MLBB_BETA_MODE=true` para forzar reglas legales de beta.
- `MLBB_MIN_APPROVED_TEAMS=2` para impedir inicio sin base competitiva mínima.
- `MLBB_REQUIRE_LINKED_STARTERS=true` para exigir titulares vinculados a usuarios reales.

Frontend (`frontend/.env`):

- `VITE_MLBB_BETA_MODE=true` para aplicar guardrails en formularios.

## 2) Reglas de cumplimiento aplicadas

- Registro de cuenta MLBB por `User ID + Zone ID`.
- Duplicados bloqueados entre usuarios (`pending/verified`).
- Revisión admin para aprobar/rechazar solicitudes si `manual`.
- Vinculación inmediata con estado `verified` si `auto`.
- Cola persistente para envío de correos de revisión MLBB solo si `manual`.
- Bitácora de auditoría admin para revisiones MLBB y cambios críticos de torneo.
- En equipos MLBB, si un jugador está vinculado por usuario, su `User ID + Zone ID`
  debe coincidir con su cuenta MLBB verificada.
- En modo estricto, no se permiten titulares manuales sin `user` vinculado.
- Torneos MLBB en beta: solo `entryFee=Gratis`.
- Formatos permitidos: eliminación directa, doble eliminación, suizo o round robin.
- Bloqueo de términos de apuesta/gambling en contenido del torneo.
- Requiere `jurisdiction`, `governingLaw`, `claimsContact` y checkboxes legales activos.
- Inicio de torneo MLBB bloqueado si:
  - no hay mínimo de equipos aprobados,
  - faltan `User ID + Zone ID` en titulares,
  - hay `User ID + Zone ID` duplicados entre equipos aprobados,
  - o hay inconsistencias entre IDs del roster y cuentas vinculadas.

## 3) Flujo operativo recomendado

1. Jugador conecta MLBB en `Ajustes > Conexiones`.
2. Si `manual`, admin revisa en `Ajustes > Revisión MLBB`.
3. Capitán crea equipo MLBB con IDs válidos.
4. Equipo se registra en torneo MLBB.
5. Admin valida cumplimiento desde:
   - `GET /api/tournaments/:code/compliance`
   - o panel de administración del torneo.
6. Monitorea operación MLBB desde:
   - `GET /api/auth/mlbb/ops/status` (admin)
   - `POST /api/auth/mlbb/ops/process` (admin, trigger manual)
7. Solo iniciar torneo cuando todos los checks estén en `ok`.

## 4) Notas legales y de marca

- GlitchGang no debe declarar afiliación oficial con Moonton.
- Evitar uso de logos oficiales no autorizados.
- Evitar apuestas, cuotas, gambling o flujos fuera de política.
- Mantener contacto legal y de soporte visible para participantes.
