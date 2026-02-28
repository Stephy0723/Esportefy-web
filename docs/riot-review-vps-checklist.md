# Riot Review VPS Checklist

Fecha: 2026-02-28
Proyecto: Esportefy

Checklist operativo para publicar una URL de revision estable antes de enviar la solicitud de Riot.

## 1) Objetivo de la URL de revision

La URL de revision debe permitir que Riot:
- abra la plataforma desde HTTPS,
- vea las paginas legales,
- pruebe el flujo de vinculacion Riot,
- pruebe las restricciones de integridad en torneos Riot,
- valide que el producto no aparenta afiliacion oficial.

No debe operar como beta publica abierta si todavia depende de development key.

## 2) Estructura recomendada

- Frontend: `https://review.tudominio.com`
- Backend/API: `https://api.tudominio.com`

Si usas una sola IP publica, coloca un dominio encima antes de enviar la solicitud.

## 3) Requisitos minimos del VPS

- Ubuntu/Debian actualizado
- Node.js LTS instalado
- MongoDB accesible desde backend
- Nginx o Caddy
- Certificados SSL validos
- PM2 o systemd para mantener procesos vivos

## 4) Variables de entorno backend

Minimo:

```env
NODE_ENV=production
PORT=4000
MONGO_URI=tu_mongo_uri
JWT_SECRET=tu_jwt_secret
RIOT_API_KEY=tu_riot_api_key
RIOT_KEY_MODE=development
ALLOW_RIOT_DEV_KEY_IN_PROD=false
RIOT_REVIEW_MODE=true
RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS=20
CLIENT_URL=https://review.tudominio.com
```

## 5) Variables de entorno frontend

Minimo:

```env
VITE_API_URL=https://api.tudominio.com
VITE_RIOT_REVIEW_MODE=true
VITE_RIOT_MIN_ACTIVE_PARTICIPANTS=20
```

## 6) Reverse proxy

Backend no debe quedar expuesto directamente al navegador por IP y puerto si puedes evitarlo.

Ejemplo de flujo:
- Nginx recibe `https://review.tudominio.com` y sirve `frontend/dist`
- Nginx recibe `https://api.tudominio.com` y hace proxy a `localhost:4000`

## 7) SSL

Obligatorio antes de submit:
- certificado valido,
- redireccion de HTTP a HTTPS,
- sin mixed content en frontend.

## 7.1) Verificacion del sitio (`riot.txt`)

Riot puede pedir verificacion del dominio antes o durante la revision.

Deja previsto esto:
- un archivo `riot.txt` en la raiz publica del frontend,
- accesible como `https://review.tudominio.com/riot.txt`,
- con el contenido exacto que Riot te entregue en el portal o por correo.

No inventes ese contenido. Riot te da el token/cadena exacta.

## 8) CORS

No dejes `*`.

Permite solo:
- `https://review.tudominio.com`
- cualquier otro dominio tuyo estrictamente necesario

## 9) Seguridad de la key

- Riot API key solo en backend
- nunca en frontend
- nunca en Git
- nunca visible en respuestas del API

Si todavia usas development key:
- no abras la review URL al publico general,
- no promociones la plataforma como producto abierto,
- usala solo como entorno de evaluacion.

## 10) Legal visible

Antes de enviar:
- `Terms`
- `Privacy`
- `Organizer Terms`
- disclaimer de no afiliacion Riot visible en footer o area publica

## 11) Flujo que Riot debe poder probar

1. Abrir la home
2. Ver footer legal/disclaimer
3. Iniciar sesion con cuenta demo
4. Ir a Settings y revisar la integracion Riot
5. Vincular cuenta Riot
6. Confirmar que una cuenta Riot no puede duplicarse en otro usuario
7. Revisar torneo Riot
8. Validar restricciones de:
   - formato tradicional
   - registro gratuito
   - minimo de participantes
   - bloqueo de Riot IDs duplicados

## 12) Cuenta demo

Prepara:
- email demo
- password demo
- instrucciones de 5 pasos maximo

## 13) Verificacion final antes de submit

- URL publica responde por HTTPS
- `riot.txt` listo para publicar si Riot lo solicita
- frontend carga sin errores
- backend responde sin 403/404 inesperados
- disclaimer Riot visible publicamente
- branding Riot no ambiguo
- paginas legales accesibles
- flujo Riot testeable
- logs del backend disponibles por si Riot reporta error

## 14) Despues del deploy

Ejecuta:

```bash
git pull origin main
npm install
npm --prefix frontend install
npm --prefix frontend run build
pm2 restart esportefy-api
pm2 restart esportefy-web
```

Adapta los nombres de procesos a tu VPS.
