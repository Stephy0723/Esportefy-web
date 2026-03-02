# University Manual Review Checklist

Checklist manual para cerrar el modulo `University` en el alcance actual:

- solo universidades `RD` visibles en la app
- solo correos institucionales oficiales de esas universidades
- verificacion semiautomatica con `Microsoft Entra organizations`
- autoaprobacion solo si el correo institucional de la postulacion coincide exactamente con la cuenta conectada y pasa la allowlist

## Precondiciones

- Backend corriendo en `http://localhost:4000`
- Frontend corriendo en `http://localhost:5173`
- Usuario normal creado e iniciado sesion
- Usuario admin creado e iniciado sesion
- Variables Microsoft configuradas si vas a probar el flujo Entra:
  - `MICROSOFT_TENANT_AUTHORITY`
  - `MICROSOFT_CLIENT_ID`
  - `MICROSOFT_CLIENT_SECRET`
  - `MICROSOFT_REDIRECT_URI`
- El usuario de prueba no debe estar ya verificado con otra universidad

## Universidades RD soportadas por allowlist

Ejemplos actuales:

- `uasd` -> `uasd.edu.do`
- `pucmm` -> `pucmm.edu.do`
- `intec` -> `intec.edu.do`
- `unibe` -> `unibe.edu.do`
- `itla` -> `itla.edu.do`
- `unapec` -> `unapec.edu.do`
- `unphu` -> `unphu.edu.do`
- `utesa` -> `utesa.edu`
- `uapa` -> `uapa.edu.do`
- `ucne` -> `ucne.edu`
- `isfodosu` -> `isfodosu.edu.do`
- `itsc` -> `itsc.edu.do`
- `ucateci` -> `ucateci.edu.do`
- `uniremhos` -> `uniremhos.edu.do`
- `unicaribe` -> `unicaribe.edu.do`
- `oym` -> `udoym.edu.do`, `oymas.edu.do`, `oym.edu.do`
- `uce` -> `uce.edu.do`, `aluce.edu.do`
- `ufhec` -> `ufhec.edu.do`
- `ucsd` -> `ucsd.edu.do`
- `loyola` -> `loyola.edu.do`

## Caso 1: postulación valida sin Microsoft

Objetivo:
- confirmar que una postulacion valida entra en estado `pending`

Pasos:
1. Abrir `Universidad`
2. Elegir una universidad RD del catalogo
3. Completar:
   - matricula valida
   - carrera valida
   - campus valido
   - nivel academico valido
   - correo institucional con dominio oficial de esa universidad
4. Enviar postulacion

Esperado:
- mensaje de exito
- estado del usuario cambia a `pending`
- en `Universidad` debe verse `Postulación en revisión`
- si el usuario es admin, la postulacion debe aparecer en `Validaciones`

## Caso 2: bloquear correo personal

Objetivo:
- confirmar que no se aceptan correos como Gmail/Hotmail

Pasos:
1. Elegir universidad RD
2. Intentar enviar con correo `gmail.com` o similar

Esperado:
- error en frontend
- si fuerzas el request, backend responde `400`

## Caso 3: bloquear dominio de otra universidad

Objetivo:
- confirmar que la universidad elegida y el correo deben coincidir

Ejemplo:
- elegir `UASD`
- enviar correo `usuario@intec.edu.do`

Esperado:
- error en frontend
- si fuerzas el request, backend responde `400`
- el mensaje debe mencionar que el correo no coincide con los dominios oficiales de la universidad seleccionada

## Caso 4: bloquear region fuera de RD

Objetivo:
- confirmar que el modulo no permite postulaciones fuera del alcance actual

Pasos:
1. Intentar forzar una postulacion con `region != rd`

Esperado:
- backend responde `400`
- mensaje indicando que la verificacion institucional solo esta habilitada para universidades de Republica Dominicana

## Caso 5: bloqueo por matricula invalida

Pasos:
1. Enviar matricula demasiado corta o con caracteres invalidos
   - ejemplo: `12`
   - ejemplo: `abc***`

Esperado:
- error visible en el campo
- backend tambien debe rechazar si el request se envia manualmente

## Caso 6: duplicado de matricula

Objetivo:
- impedir dos postulaciones activas con la misma matricula en la misma universidad

Pasos:
1. Usuario A envia postulacion valida para una universidad
2. Usuario B intenta enviar la misma `matricula` en la misma universidad

Esperado:
- backend responde `409`
- mensaje indicando que el ID estudiantil ya esta en uso

## Caso 7: duplicado de correo institucional

Objetivo:
- impedir que dos usuarios usen el mismo correo institucional activo en la misma universidad

Pasos:
1. Usuario A envia postulacion valida
2. Usuario B intenta enviar la misma cuenta institucional en la misma universidad

Esperado:
- backend responde `409`
- mensaje indicando que el correo institucional ya esta en uso

## Caso 8: conectar Microsoft/Entra con cuenta institucional valida

Objetivo:
- validar que el usuario pueda conectar una cuenta institucional de trabajo/escuela

Pasos:
1. Tener una postulacion `pending`
2. Pulsar `Conectar cuenta universitaria`
3. Iniciar sesion con una cuenta institucional real de la universidad

Esperado:
- vuelve a `/university`
- aparece estado `linked` o `approved`
- la cuenta Microsoft queda guardada en el usuario
- nunca debe aceptar una cuenta Microsoft personal

## Caso 9: autoaprobacion

Objetivo:
- validar el caso mas fuerte de semiautomatizacion

Precondiciones:
- `UNIVERSITY_AUTO_APPROVE_EMAIL_MATCH=true`
- el correo institucional de la postulacion coincide exactamente con la cuenta Microsoft conectada
- ambos correos estan dentro de la allowlist de la universidad

Pasos:
1. Enviar postulacion con correo institucional oficial
2. Conectar Microsoft con exactamente el mismo correo

Esperado:
- la respuesta vuelve con estado `approved`
- la postulacion queda `approved`
- `myUniversityStatus.verificationStatus = verified`
- el usuario ya no debe quedar en cola manual

## Caso 10: revision manual por mismatch exacto

Objetivo:
- aceptar identidad institucional valida, pero sin autoaprobar

Ejemplo:
- postulacion con `nombre.apellido@oymas.edu.do`
- Microsoft conectado con otra cuenta valida del mismo dominio o de otro dominio permitido de la misma universidad

Esperado:
- la cuenta Microsoft queda conectada
- la postulacion sigue `pending`
- se muestra advertencia de revision manual

## Caso 11: bloqueo de cuenta Microsoft personal

Pasos:
1. Intentar iniciar la conexion con una cuenta Outlook/Hotmail personal

Esperado:
- redireccion de error
- mensaje indicando que debe ser cuenta universitaria Microsoft, no una cuenta personal

## Caso 12: bloqueo de cuenta institucional de otra universidad

Objetivo:
- si la postulacion es para una universidad, la cuenta Microsoft conectada debe usar un dominio permitido para esa universidad

Ejemplo:
- postulacion para `PUCMM`
- Microsoft conectada con `usuario@uasd.edu.do`

Esperado:
- redireccion de error
- mensaje indicando que la cuenta conectada no usa un dominio institucional oficial de esa universidad

## Caso 13: aprobacion manual por admin

Pasos:
1. Iniciar sesion con un usuario admin
2. Abrir `Universidad`
3. Entrar a `Validaciones`
4. Filtrar por `pending`
5. Aprobar una postulacion

Esperado:
- la postulacion cambia a `approved`
- el usuario recibe estado `verified`
- el usuario ve su estado actualizado en `University`

## Caso 14: rechazo manual por admin

Pasos:
1. Iniciar sesion con un usuario admin
2. Abrir `Validaciones`
3. Rechazar una postulacion con motivo

Esperado:
- la postulacion cambia a `rejected`
- el motivo queda visible para el usuario
- el usuario puede corregir y reenviar

## Caso 15: usuario ya verificado intenta reenviar

Pasos:
1. Tener usuario ya `verified`
2. Intentar volver a postularse a otra universidad

Esperado:
- backend responde `409`
- mensaje indicando que la cuenta ya esta verificada con una universidad

## Estado esperado por escenario

- `unlinked`
  - usuario sin postulacion o sin conexion institucional
- `pending`
  - postulacion enviada, o cuenta Microsoft conectada sin autoaprobacion
- `verified`
  - aprobacion manual o autoaprobacion completa
- `rejected`
  - admin rechazo la postulacion con motivo

## Criterio de cierre del modulo University en este alcance

Puedes considerar este bloque cerrado si se cumple todo:

- [ ] Postulacion valida entra en `pending`
- [ ] Correos personales son rechazados
- [ ] Dominios de otra universidad son rechazados
- [ ] Solo universidades `RD` del catalogo pueden postular
- [ ] Duplicados de matricula y correo se bloquean
- [ ] Microsoft personal se rechaza
- [ ] Microsoft institucional valida conecta correctamente
- [ ] Autoaprobacion funciona en match exacto
- [ ] Mismatch exacto cae a revision manual
- [ ] Admin puede aprobar
- [ ] Admin puede rechazar con motivo
- [ ] El usuario ve su estado correcto despues de cada decision
