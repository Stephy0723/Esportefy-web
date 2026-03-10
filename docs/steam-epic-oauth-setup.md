# Steam + Epic OAuth Pausados

Fecha: 2026-03-10

Guía de referencia para retomar estas integraciones cuando vuelvan a activarse.

Estado actual:

- `Steam`: pausado
- `Epic Games`: pausado por ahora hasta completar requisitos fiscales/legales del proveedor

## 1) Resumen técnico de cómo quedó implementado

Steam y Epic están fuera del flujo activo:

- no hay botones operativos en UI
- no hay rutas OAuth expuestas para uso normal
- ambos se muestran solo como integraciones pendientes/próximas

## 2) Variables que debes completar

Backend cuando se reactive:

```env
FRONTEND_URL=http://localhost:5173

STEAM_OAUTH_CLIENT_ID=
STEAM_OAUTH_SCOPE=
STEAM_WEB_API_KEY=
```

Frontend:

- no necesitas variables OAuth nuevas para Steam/Epic.
- solo debes tener bien definido `VITE_API_URL` para que el frontend apunte al backend correcto.
- si el backend sirve media en otro host, mantén también `VITE_MEDIA_URL`.

## 2.1) Qué debe coincidir sí o sí

Estas 4 piezas tienen que apuntar al mismo entorno:

1. `FRONTEND_URL` en backend
2. `CORS_ORIGINS` en backend
3. redirect registrado en Steam

Si una de esas piezas queda en `localhost` y otra en VPS, el flujo va a fallar aunque las credenciales sean correctas.

## 3) Steam: requisito importante

La implementación actual usa el flujo OAuth documentado por Steamworks.

Referencia oficial:
- Steamworks OAuth docs: <https://partner.steamgames.com/doc/webapi_overview/OAuth>

Punto clave de esa documentación:
- para usar OAuth, primero necesitas obtener un `Client ID` de Valve.
- el token vuelve en el fragment del redirect:
  - `#access_token=...&state=...`
- el `steamid` seguro se obtiene luego en servidor con:
  - `ISteamUserOAuth/GetTokenDetails`

## 4) Steam: qué debes hacer

1. Entrar al portal Steamworks / documentación de partner.
2. Solicitar o habilitar un `Client ID` OAuth con Valve.
3. Registrar como redirect URI exactamente:

```txt
http://localhost:5173/oauth/steam/callback
```

4. Si Valve te asigna scopes, colócalos en:

```env
STEAM_OAUTH_SCOPE=
```

5. Si quieres enriquecer perfil con nombre/avatar, agrega tu Web API key:

```env
STEAM_WEB_API_KEY=
```

Valores de ejemplo para producción:

```txt
FRONTEND_URL=https://app.tudominio.com
Steam redirect=https://app.tudominio.com/oauth/steam/callback
```

## 5) Steam: decisión si Valve no te da client_id

Si Valve no te entrega `STEAM_OAUTH_CLIENT_ID`, esta implementación no va a poder cerrar el login Steam.

En ese caso, el camino correcto sería:
- reemplazar Steam OAuth por `Sign in through Steam` usando OpenID.

Eso no es un detalle menor. Es un cambio de flujo. La ventaja es que OpenID de Steam es mucho más común para web pública.

## 6) Epic Games: estado actual

Epic queda congelado. No se expone en rutas activas ni en UI hasta retomarlo formalmente.

Cuando se reactive:
- se vuelve a habilitar en backend
- se vuelve a mostrar en `Settings` y `Dashboard`
- se completa el alta legal/fiscal correspondiente

## 8) URLs exactas que deben coincidir

Local:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:4000
Steam redirect: http://localhost:5173/oauth/steam/callback
```

Cuando pases a VPS:
- cambia `FRONTEND_URL`
- cambia `CORS_ORIGINS`
- vuelve a registrar el redirect de Steam con el dominio final

Ejemplo mínimo coherente en VPS:

```env
FRONTEND_URL=https://app.esportefy.com
CORS_ORIGINS=https://app.esportefy.com
```

## 9) Checklist de prueba

Steam:
- `STEAM_OAUTH_CLIENT_ID` colocado
- redirect registrado a `/oauth/steam/callback`
- click en `Settings > Conexiones > Steam`
- vuelve al callback frontend
- termina en `/settings` con estado `connected`

Prueba adicional obligatoria:
- desvincular Steam
- volver a vincular con la misma cuenta
- intentar vincular la misma cuenta en otro usuario y confirmar que el backend lo bloquea

## 10) Si algo falla

Errores típicos de Steam:
- `Configuración de Steam incompleta`
  - falta `STEAM_OAUTH_CLIENT_ID`
- callback sin `access_token`
  - redirect mal registrado o proveedor no devolvió fragment
- `Estado OAuth de Steam inválido o expirado`
  - login tardó demasiado o el `state` se perdió

## 11) Recomendación pragmática

Orden correcto:

1. Cierra `Steam` primero.
2. Si Valve no te entrega `client_id`, no pierdas tiempo forzando OAuth: cambiamos a OpenID.
3. Retoma `Epic Games` solo cuando ya puedas completar su parte fiscal/legal sin dejar la integración a medias.

## 12) Enlaces oficiales

- Steamworks OAuth: <https://partner.steamgames.com/doc/webapi_overview/OAuth>
