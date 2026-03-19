# University + Microsoft Entra Plan

Estado actual:
- `UniversityPage` ya puede enviar postulaciones reales al backend.
- El backend ya guarda estado universitario por usuario y cola de postulaciones.
- Todavia no hay login institucional Microsoft ni sincronizacion automatica de estudiantes.

Objetivo recomendado:
- Fase 1: verificar identidad institucional.
- Fase 2: aprobar estudiantes y admins universitarios.
- Fase 3: solo si una universidad lo pide, leer datos academicos extra desde Microsoft Graph Education.

## Arquitectura minima viable

1. Usuario entra con su cuenta GlitchGang.
2. Usuario envia postulacion universitaria:
   - universidad
   - student ID / matricula
   - campus
   - programa
   - nivel academico
   - correo institucional
3. Admin revisa y aprueba/rechaza.
4. Si luego se integra Microsoft:
   - el usuario conecta su cuenta institucional
   - el backend valida `tenantId`, `oid` y email institucional
   - la verificacion universitaria pasa de `manual` a `microsoft`

## Integracion Microsoft recomendada

Base:
- Microsoft Entra ID para login institucional
- Microsoft Graph para leer perfil minimo

Permisos iniciales recomendados:
- `openid`
- `profile`
- `email`
- `offline_access`
- `User.Read`

Solo si la universidad quiere datos educativos:
- evaluar Microsoft Graph Education APIs
- pedir admin consent institucional
- limitar el acceso a lo minimo necesario

Referencias oficiales:
- App registration: https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app
- Microsoft Graph auth overview: https://learn.microsoft.com/en-us/graph/auth/auth-concepts
- Education overview: https://learn.microsoft.com/en-us/graph/education-concept-overview
- Education permissions: https://learn.microsoft.com/en-us/graph/permissions-reference#education-permissions
- School Data Sync: https://learn.microsoft.com/en-us/schooldatasync/what-is-school-data-sync

## Legalidad minima antes de leer datos estudiantiles

No basta con que una universidad use Microsoft 365. Para leer o sincronizar datos estudiantiles necesitas:

1. Aprobacion institucional.
2. Acuerdo escrito sobre:
   - que datos se comparten
   - para que se usan
   - cuanto tiempo se retienen
   - como se borran
3. Politica de privacidad actualizada en GlitchGang.
4. Consentimiento claro del usuario cuando aplique.
5. Control de acceso interno y auditoria.

Si hay estudiantes de EE. UU., revisar FERPA antes de leer informacion educativa no publica:
- FERPA general guidance: https://studentprivacy.ed.gov/training/ferpa-general-guidance-student-education-records
- Directory information FAQ: https://studentprivacy.ed.gov/faq/what-directory-information

## Lo que no se debe hacer todavia

- No intentar sincronizar "todos los estudiantes" desde el inicio.
- No pedir mas scopes de los necesarios.
- No guardar datos academicos sensibles sin contrato institucional.
- No confiar en un correo universitario como prueba total si la universidad exige validacion mas fuerte.

## Siguiente implementacion tecnica

1. Agregar conexion Microsoft en frontend:
   - `msal-browser`
   - `msal-react`
2. Crear endpoints backend:
   - `POST /api/university/microsoft/verify`
   - `GET /api/university/microsoft/status`
   - `POST /api/university/microsoft/unlink`
3. Validar tokens e identidad institucional en backend.
4. Crear panel admin universitario para aprobar estudiantes.

## QA manual

Checklist operativo del modulo actual:
- `docs/university-manual-review-checklist.md`
- `docs/university-entra-manual-checklist.md`
