# Riot Manual Review Checklist

Fecha: 2026-02-28
Proyecto: Esportefy

Checklist manual para correr antes de enviar la solicitud en el Developer Portal.

## 1) Entorno de review

- [ ] Frontend accesible por `HTTPS`
- [ ] Backend accesible por dominio publico o proxy interno estable
- [ ] `RIOT_REVIEW_MODE=true`
- [ ] `ALLOW_RIOT_DEV_KEY_IN_PROD=false`
- [ ] `VITE_RIOT_REVIEW_MODE=true`
- [ ] Smoke automatizado ejecutado: `npm --prefix Backend run test:e2e:riot`
- [ ] Footer legal visible con disclaimer Riot
- [ ] Paginas legales accesibles:
  - [ ] `Terms`
  - [ ] `Privacy`
  - [ ] `Organizer Terms`

## 2) Cuenta demo

- [ ] Existe una cuenta demo funcional
- [ ] Credenciales guardadas en documento interno
- [ ] La cuenta demo puede iniciar sesion sin errores
- [ ] La cuenta demo puede abrir `Settings`
- [ ] La cuenta demo puede entrar a `Tournaments`

## 3) Riot linking

### Caso feliz
- [ ] Iniciar vinculacion Riot con un Riot ID valido
- [ ] Confirmar que el codigo de verificacion llega por correo
- [ ] Confirmar vinculacion correctamente
- [ ] Ver que el estado Riot queda marcado como `verified`

Resultado esperado:
- la cuenta Riot queda vinculada a un solo usuario
- no se expone la API key
- no hay error 403/404 inesperado

### Duplicado entre usuarios
- [ ] Intentar vincular la misma cuenta Riot en un segundo usuario

Resultado esperado:
- rechazo con mensaje de cuenta ya vinculada

### Formato invalido
- [ ] Intentar validar un Riot ID sin formato `GameName#TagLine`

Resultado esperado:
- rechazo con error de formato

## 4) Torneo Riot - creacion

### Pago no permitido
- [ ] Crear torneo Riot con `entryFee=Pago`

Resultado esperado:
- respuesta `400`
- mensaje indicando que Riot scope debe ser gratuito

### Menos del minimo permitido
- [ ] Crear torneo Riot con cupos/estructura que no permitan el minimo requerido

Resultado esperado:
- respuesta `400`
- mensaje relacionado con minimo de participantes

### Formato valido
- [ ] Crear torneo Riot con formato tradicional:
  - [ ] Eliminacion directa
  - [ ] Doble eliminacion
  - [ ] Swiss
  - [ ] Round Robin

Resultado esperado:
- se permite guardar

## 5) Integridad de roster

### Riot IDs duplicados en el mismo equipo
- [ ] Intentar registrar un roster con Riot IDs repetidos

Resultado esperado:
- respuesta `400`
- rechazo por duplicado

### Riot IDs faltantes donde son requeridos
- [ ] Intentar registrar equipo Riot sin IDs requeridos

Resultado esperado:
- rechazo por elegibilidad incompleta

## 6) Integridad de registro a torneo

### Registro duplicado entre equipos
- [ ] Intentar inscribir en el mismo torneo una identidad Riot ya usada por otra inscripcion

Resultado esperado:
- respuesta `400`
- rechazo por duplicado en el torneo

### Registro normal
- [ ] Inscribir un equipo Riot valido

Resultado esperado:
- registro exitoso
- equipo visible en participantes

## 7) Estado del torneo

### Iniciar sin minimo activo
- [ ] Intentar iniciar torneo Riot con menos de `20` participantes activos

Resultado esperado:
- respuesta `400`
- torneo no inicia

### Seeding custom mientras inscripcion abierta
- [ ] Intentar custom seeding mientras el torneo sigue abierto

Resultado esperado:
- rechazo

### Inicio valido
- [ ] Iniciar torneo Riot cumpliendo requisitos

Resultado esperado:
- cambio de estado exitoso

## 8) UI / legal / branding

- [ ] No hay logos oficiales de Riot en la app
- [ ] No aparece texto que implique partnership o aprobacion oficial
- [ ] El disclaimer Riot es visible sin iniciar sesion
- [ ] El producto no aparenta cliente oficial de Riot

## 9) Evidencia recomendada

Antes de enviar, deja guardado:
- [ ] capturas del footer legal
- [ ] captura de `Settings` con integracion Riot
- [ ] captura de rechazo por pago en torneo Riot
- [ ] captura de rechazo por duplicado Riot ID
- [ ] captura de rechazo por minimo de participantes
- [ ] video corto de `2-5` minutos con flujo completo

## 10) Decision de submit

Solo enviar si:
- [ ] todos los casos criticos pasan
- [ ] la URL review es estable
- [ ] la cuenta demo funciona
- [ ] el reviewer puede probar el flujo sin soporte manual constante
