# University Microsoft Entra Manual Checklist

Checklist manual para probar el flujo `Microsoft Entra` del modulo `University`.

Alcance actual:

- solo universidades `Republica Dominicana` habilitadas en la app
- solo dominios institucionales oficiales configurados por universidad
- `Microsoft Entra organizations`, no cuentas personales
- autoaprobacion solo si:
  - el correo institucional de la postulacion coincide exactamente con la cuenta conectada
  - el dominio pasa la allowlist
  - si configuraste `tenantIds`, tambien debe pasar esa allowlist

## Precondiciones

- Backend corriendo
- Frontend corriendo
- Variables configuradas en `Backend/.env`:
  - `MICROSOFT_TENANT_AUTHORITY=organizations`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_REDIRECT_URI`
  - `UNIVERSITY_AUTO_APPROVE_EMAIL_MATCH=true`
- App registrada en `Microsoft Entra`
- Redirect URI configurado:
  - `http://localhost:4000/api/university/microsoft/callback`

## Endpoints utiles

- `GET /api/university/me`
- `POST /api/university/microsoft/connect`
- `GET /api/university/microsoft/callback`
- `GET /api/university/microsoft/status`
- `DELETE /api/university/microsoft`

## Caso 1: conectar cuenta institucional valida

Pasos:
1. Enviar una postulacion `pending`
2. Pulsar `Conectar cuenta universitaria`
3. Iniciar sesion con una cuenta Entra institucional valida de la universidad seleccionada

Esperado:
- vuelve a `/university`
- aparece mensaje `linked` o `approved`
- `GET /api/university/microsoft/status` devuelve:
  - `verified: true`
  - `email`
  - `tenantId`

## Caso 2: autoaprobacion por match exacto

Pasos:
1. Postular con correo institucional exacto
2. Conectar Microsoft usando exactamente ese mismo correo

Esperado:
- la postulacion queda `approved`
- `GET /api/university/me` devuelve `verificationStatus=verified`
- el usuario ya no queda en cola admin

## Caso 3: cuenta institucional valida pero correo distinto

Ejemplo:
- postulacion: `nombre@oymas.edu.do`
- Microsoft: `otro@oym.edu.do`

Si ambos dominios son oficiales de la misma universidad:

Esperado:
- la cuenta se conecta
- no autoaprueba
- la postulacion sigue `pending`
- la UI muestra advertencia de revision manual

## Caso 4: cuenta de otra universidad

Ejemplo:
- postulacion para `UASD`
- cuenta Microsoft `usuario@intec.edu.do`

Esperado:
- redireccion con error
- mensaje indicando que la cuenta conectada no usa un dominio institucional oficial de esa universidad

## Caso 5: cuenta Microsoft personal

Ejemplo:
- `hotmail.com`
- `outlook.com`
- `live.com`

Esperado:
- redireccion con error
- mensaje indicando que debe ser cuenta universitaria Microsoft, no personal

## Caso 6: universidad sin dominio configurado

Solo aplica si agregas una universidad sin allowlist.

Esperado:
- `POST /api/university/microsoft/connect` responde `400` o `503` segun configuracion
- mensaje indicando que la universidad todavia no tiene dominios institucionales configurados

## Caso 7: desconectar cuenta institucional

Pasos:
1. Tener cuenta Microsoft/Entra conectada en `pending` o `rejected`
2. Pulsar `Desconectar`

Esperado:
- `DELETE /api/university/microsoft` responde `200`
- `GET /api/university/microsoft/status` devuelve:
  - `verified: false`
  - `email: ''`
  - `tenantId: ''`
- la postulacion queda en modo `manual` si antes estaba como `microsoft`

## Caso 8: bloquear desconexion si ya fue aprobada por Microsoft

Pasos:
1. Tener usuario `verified` con `verificationSource=microsoft`
2. Pulsar `Desconectar`

Esperado:
- backend responde `409`
- mensaje indicando que necesita revision administrativa para desvincular esa cuenta

## Verificacion minima al terminar

- [ ] `connect` abre Microsoft correctamente
- [ ] cuenta institucional valida conecta
- [ ] cuenta personal se rechaza
- [ ] cuenta de otra universidad se rechaza
- [ ] match exacto autoaprueba
- [ ] mismatch exacto queda en manual
- [ ] `status` devuelve datos coherentes
- [ ] `unlink` funciona en `pending/rejected`
- [ ] `unlink` no rompe el estado universitario
- [ ] `unlink` se bloquea si el usuario ya quedo `verified` por Microsoft
