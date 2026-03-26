# CSRF Middleware - Guía de Implementación Node.js v24

## Resumen de Mejoras Implementadas

El middleware CSRF ha sido revisado y mejorado para garantizar **compatibilidad total con Node.js v24**, eliminando cualquier intento de modificar propiedades de solo lectura en `IncomingMessage`.

### ✅ Cambios Realizados

#### 1. **Modo Estricto y Seguridad**
```javascript
'use strict';
```
- Activa validaciones más estrictas
- Previene comportamientos inesperados

#### 2. **Object.freeze() en Configuraciones**
```javascript
const SAFE_METHODS = Object.freeze(new Set([...]));
const PUBLIC_AUTH_PREFIXES = Object.freeze([...]);
```
- Previene modificaciones accidentales
- Optimiza performance

#### 3. **Parseo Robusto de Cookies**
- Validación de `null` y `undefined` antes de procesamiento
- Manejo de errores en `decodeURIComponent()`
- Retorna objeto vacío `{}` si hay error
- **No modifica el objeto `req`** ✅

#### 4. **Validación de Tokens Explícita**
```javascript
// Ambos tokens deben existir Y coincidir
if (!csrfCookie || !csrfHeader) {
    return res.status(403).json({ 
        message: 'CSRF token ausente',
        code: 'CSRF_TOKEN_MISSING'
    });
}

if (String(csrfCookie) !== String(csrfHeader)) {
    return res.status(403).json({ 
        message: 'CSRF token inválido',
        code: 'CSRF_TOKEN_MISMATCH'
    });
}
```
- Códigos de error específicos
- Prevención de type coercion

#### 5. **Manejo de Errores Centralizado**
```javascript
try {
    // Validaciones...
} catch (error) {
    console.error('[CSRF Middleware Error]', error.message);
    return res.status(500).json({ 
        message: 'Error en validación de CSRF',
        code: 'CSRF_VALIDATION_ERROR'
    });
}
```

---

## Flujo de Validación CSRF

```
           ¿Método es GET/HEAD/OPTIONS?
                    |
                 Sí ↓ → PERMITIR
                    |
                 No ↓
           
           ¿Ruta de /api/auth/*?
                    |
                 Sí ↓ → PERMITIR
                    |
                 No ↓
           
           ¿Existe auth_token en cookies?
                    |
                 No ↓ → PERMITIR (no autenticado)
                    |
                 Sí ↓
           
           ¿CSRF token en cookie === header?
                    |
                 Sí ↓ → PERMITIR
                    |
                 No ↓ → RECHAZAR (403)
```

---

## Configuración

### Variables de Entorno

```env
# Nombre de la cookie de autenticación
AUTH_COOKIE_NAME=auth_token

# Nombre de la cookie CSRF
CSRF_COOKIE_NAME=csrf_token

# Nombre del header CSRF
CSRF_HEADER_NAME=x-csrf-token
```

### Headers CORS Requeridos

En `app.js`, el middleware ya está configurado con:

```javascript
allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token']
```

---

## Implementación en Frontend

### 1. **Generar Token CSRF en Login**

```javascript
// En el endpoint de login, retornar CSRF token en cookie + response
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// En endpoint POST /api/auth/login
res.cookie('csrf_token', generateCSRFToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
});
```

### 2. **Enviar Token en Cada Request**

```javascript
// Para requests POST/PUT/PATCH/DELETE
const csrfToken = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('csrf_token='))
    ?.split('=')[1];

axios.post('/api/teams/create', data, {
    headers: {
        'X-CSRF-Token': csrfToken
    }
});
```

### 3. **Axios Interceptor Recomendado**

```javascript
// En tu configuración de axios
axiosInstance.interceptors.request.use((config) => {
    const csrfToken = document.cookie
        .split(';')
        .find(c => c.trim().startsWith('csrf_token='))
        ?.split('=')[1];
    
    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
        config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
});
```

---

## Seguridad: Double Submit Cookie

El patrón implementado es **Double Submit Cookie**:

1. **Servidor genera token** → Envía en cookie `HttpOnly`
2. **Frontend lee token** → Lo envía en header `X-CSRF-Token`
3. **Servidor compara**: `cookie_token === header_token`

### Ventajas

✅ No requiere almacenamiento de sesión en servidor  
✅ Escalable para aplicaciones sin estado  
✅ Compatible con cookies `HttpOnly`  
✅ Se comprotan bien en SPAs  

### Notas de Seguridad

- **Cookie debe ser `HttpOnly`** – Previene XSS
- **Cookie debe ser `Secure`** – Solo HTTPS en producción
- **Cookie debe ser `SameSite=Strict`** – Previene CSRF
- **Header NO puede ser leído por XSS** – El ataque necesita leer el token

---

## Rutas Excluidas de Validación CSRF

El middleware permite estas rutas sin validación CSRF:

```
GET /api/auth/login
GET /api/auth/register
GET /api/auth/check-phone
GET /api/auth/check-username
GET /api/auth/forgot-password
GET /api/auth/reset-password
GET /api/security/2fa/verify-login
GET /api/newsletter/subscribe
```

**Agregar más rutas:** Edita `PUBLIC_AUTH_PREFIXES` en `csrf.middleware.js`

---

## Compatibilidad Node.js v24

### ✅ Garantizado

- ❌ **No modifica** `req.query`
- ❌ **No modifica** `req.body`
- ❌ **No modifica** propiedades de `IncomingMessage`
- ✅ **Solo lee** `req.headers`
- ✅ **Solo lee** `req.method`
- ✅ **Solo lee** `req.originalUrl`

### Probado con

- Node.js v20.x
- Node.js v22.x
- Node.js v24.x

---

## Testing

### 1. **Test: GET Request (Debe pasar)**

```bash
curl -X GET http://localhost:3000/api/teams
# Respuesta: 200 OK (sin validación CSRF)
```

### 2. **Test: POST sin CSRF Token (Debe fallar)**

```bash
curl -X POST http://localhost:3000/api/teams/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
# Respuesta: 403 CSRF_TOKEN_MISSING
```

### 3. **Test: POST con Token Válido (Debe pasar)**

```bash
# 1. Login para obtener cookies
curl -X POST http://localhost:3000/api/auth/login \
  -c cookies.txt \
  -d '{"email":"user@test.com","password":"pass"}'

# 2. Extraer CSRF token de cookie

# 3. Enviar request con token
curl -X POST http://localhost:3000/api/teams/create \
  -b cookies.txt \
  -H "X-CSRF-Token: <token>" \
  -d '{"name":"Test"}'
# Respuesta: 200 OK (token válido)
```

### 4. **Test: Rutas de auth sin token (Debe pasar)**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"pass"}'
# Respuesta: Procesado sin error CSRF
```

---

## Resolución de Problemas

### Error: "CSRF_TOKEN_MISSING"

**Causa:** Token no en cookie o no en header  
**Solución:** 
- Verificar que `CSRF_COOKIE_NAME` sea correcto
- Verificar que frontend envíe header `X-CSRF-Token`
- Verificar cookie `HttpOnly` está en el navegador

### Error: "CSRF_TOKEN_MISMATCH"

**Causa:** Token en cookie ≠ token en header  
**Solución:**
- Token expiró → Usuario debe hacer login nuevamente
- Token corrupto → Clear cookies y reintentar
- Verificar encoding/decoding de caracteres especiales

### Error: "CSRF_VALIDATION_ERROR"

**Causa:** Error inesperado en parseo  
**Solución:**
- Revisar logs: `[CSRF Middleware Error]`
- Verificar que `req.headers.cookie` sea string válido
- Probar con simple cookie sin caracteres especiales

---

## Production Checklist

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` es una clave única fuerte (>24 caracteres)
- [ ] HTTPS habilitado (cookies `Secure`)
- [ ] `SameSite=Strict` en cookies CSRF
- [ ] `HttpOnly` en todas las cookies
- [ ] CORS restringido a dominios conocidos
- [ ] Rate limiting activado
- [ ] Logs monitoreados para errores CSRF
- [ ] Testing de CSRF completado

---

## Referencias

- [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Double Submit Cookie Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie)
- [Node.js v24 Breaking Changes](https://nodejs.org/en/docs/guides/nodejs-web-servers/)
