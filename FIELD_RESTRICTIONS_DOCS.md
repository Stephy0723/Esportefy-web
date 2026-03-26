# Implementación de Restricciones de Campos en el Perfil de Usuario

## Resumen de Cambios

Se ha implementado un sistema de restricciones a nivel de campo en los perfiles de usuario para asegurar la integridad de datos y prevenir cambios no autorizados después del registro inicial.

### Campos Restringidos

#### 1. **País (Country)** - ❌ INMUTABLE PERMANENTE
- **Restricción**: Una vez establecido en el registro, **NUNCA puede ser cambiado**
- **Implementación Backend**:
  - Campo `countrySetAt` (Date) marca cuándo se estableció
  - `updateProfile` devuelve **HTTP 403 Forbidden** si se intenta cambiar
  - Mensaje: `"No puedes cambiar el país después de creada tu cuenta. Esta información es permanente."`
  
- **Implementación Frontend**:
  - Input `<select>` deshabilitado (`disabled={true}`) si `countrySetAt` existe
  - Icono de candado 🔒 junto a la etiqueta
  - Texto de ayuda: "Este dato no puede ser modificado (permanente)"
  - Color rojo (#FF6B6B) para indicar restricción permanente

#### 2. **Fecha de Nacimiento (BirthDate)** - ❌ INMUTABLE PERMANENTE
- **Restricción**: Una vez establecida en el registro, **NUNCA puede ser cambiada**
- **Implementación Backend**:
  - Campo `birthDateSetAt` (Date) marca cuándo se estableció
  - `updateProfile` devuelve **HTTP 403 Forbidden** si se intenta cambiar
  - Mensaje: `"No puedes cambiar tu fecha de nacimiento después de creada tu cuenta. Esta información es permanente."`
  
- **Implementación Frontend**:
  - Input `<input type="date">` deshabilitado (`disabled={true}`) si `birthDateSetAt` existe
  - Icono de candado 🔒 junto a la etiqueta
  - Texto de ayuda: "Este dato no puede ser modificado (permanente)"
  - Color rojo (#FF6B6B) para indicar restricción permanente

#### 3. **Nombre Completo (FullName)** - ⏳ THROTTLE DE 21 DÍAS
- **Restricción**: Puede ser cambiado, pero **máximo una vez cada 3 semanas (21 días)**
- **Implementación Backend**:
  - Campo `lastNameChangeAt` (Date) marca cuándo fue el último cambio
  - `updateProfile` devuelve **HTTP 429 Too Many Requests** si se intenta cambiar antes de 21 días
  - Respuesta incluye `nextAvailableAt` con la fecha exacta del próximo cambio permitido
  - Mensaje: `"Solo puedes cambiar tu nombre una vez cada 3 semanas. Próximo cambio disponible: [DATE]"`
  
- **Implementación Frontend**:
  - El input NO está deshabilitado, sigue siendo editable
  - Si `nextNameChangeDate` existe y está en el futuro, muestra advertencia
  - Icono de reloj ⏳ con el texto: "Próximo cambio disponible: [DATE]"
  - Color naranja (#FF9500) para indicar restricción temporal

## Esquema de la Base de Datos

```javascript
// Campos agregados a User Schema (modelo de MongoDB)
countrySetAt: { type: Date, default: null },      // Marca cuándo se estableció el país
birthDateSetAt: { type: Date, default: null },    // Marca cuándo se estableció la fecha de nacimiento
lastNameChangeAt: { type: Date, default: null }   // Marca el último cambio de nombre
```

## Flujo de Funcionamiento

### En el Registro (Register)
```javascript
1. Usuario proporciona: country, birthDate, fullName, etc.
2. Backend crea el usuario con:
   - countrySetAt: new Date()      // Se marca como establecido
   - birthDateSetAt: new Date()    // Se marca como establecido
   - lastNameChangeAt: null        // Aún no ha habido cambios
```

### En la Edición del Perfil (EditProfile)
```javascript
Frontend:
1. Carga el perfil del usuario
2. Detecta si countrySetAt y birthDateSetAt existen
3. Deshabilita visualmente los inputs correspondientes
4. Permite edición de otros campos

Backend:
1. Valida restricciones ANTES de actualizar
2. Si intenta cambiar country/birthDate con countrySetAt/birthDateSetAt: retorna 403
3. Si intenta cambiar fullName dentro de 21 días: retorna 429 con nextAvailableAt
4. De lo contrario: actualiza los campos y establece lastNameChangeAt si cambió el nombre
```

## Códigos HTTP Utilizados

| Código | Escenario | Significado |
|--------|-----------|------------|
| **403** | Intenta cambiar country o birthDate | **Forbidden** - Campo permanentemente bloqueado |
| **429** | Intenta cambiar nombre antes de 21 días | **Too Many Requests** - Límite de tasa (throttle) excedido |

## Implementación Frontend (EditProfile.jsx)

### Estados Agregados
```javascript
const [fieldRestrictions, setFieldRestrictions] = useState({
    countryLocked: false,           // true si countrySetAt existe
    birthDateLocked: false,         // true si birthDateSetAt existe
    nextNameChangeDate: null        // Date cuando se puede cambiar el nombre nuevamente
});
```

### Carga de Restricciones
```javascript
// Al cargar el perfil, se detectan las restricciones
setFieldRestrictions({
    countryLocked: Boolean(u.countrySetAt),
    birthDateLocked: Boolean(u.birthDateSetAt),
    nextNameChangeDate: u.lastNameChangeAt ? 
        new Date(new Date(u.lastNameChangeAt).getTime() + 21 * 24 * 60 * 60 * 1000) : null
});
```

### Manejo de Errores
```javascript
// En handleSubmit catch block:
if (status === 403) {
    if (data?.restriction === 'country_locked') {
        msg = 'Tu país no puede ser modificado. Esta información es permanente.';
    } else if (data?.restriction === 'birthdate_locked') {
        msg = 'Tu fecha de nacimiento no puede ser modificada. Esta información es permanente.';
    }
} else if (status === 429) {
    if (data?.restriction === 'name_throttle' && data?.nextAvailableAt) {
        const nextDate = new Date(data.nextAvailableAt);
        const formattedDate = nextDate.toLocaleDateString('es-ES', { ... });
        msg = `Solo puedes cambiar tu nombre una vez cada 3 semanas. Próximo cambio disponible: ${formattedDate}`;
    }
}
```

### Renderizado de Campos Restringidos
```jsx
{/* Campo País - BLOQUEADO */}
<div className="ep__field">
    <label>País {fieldRestrictions.countryLocked && <span>🔒</span>}</label>
    <select disabled={fieldRestrictions.countryLocked}>
        {/* opciones */}
    </select>
    {fieldRestrictions.countryLocked && (
        <span style={{ color: '#FF6B6B' }}>
            Este dato no puede ser modificado (permanente)
        </span>
    )}
</div>

{/* Campo Fecha de Nacimiento - BLOQUEADO */}
<div className="ep__field">
    <label>Fecha de Nacimiento {fieldRestrictions.birthDateLocked && <span>🔒</span>}</label>
    <input type="date" disabled={fieldRestrictions.birthDateLocked} />
    {fieldRestrictions.birthDateLocked && (
        <span style={{ color: '#FF6B6B' }}>
            Este dato no puede ser modificado (permanente)
        </span>
    )}
</div>

{/* Campo Nombre - THROTTLE */}
<div className="ep__field">
    <label>Nombre Completo</label>
    <input type="text" {...} />
    {fieldRestrictions.nextNameChangeDate && new Date() < fieldRestrictions.nextNameChangeDate && (
        <span style={{ color: '#FF9500' }}>
            ⏳ Próximo cambio disponible: {fecha_formateada}
        </span>
    )}
</div>
```

## Ciclo de Vida Completo - Ejemplo Práctico

### Escenario 1: Usuario Nuevo Registrándose
```
1. Usuario llena formulario de registro con:
   - Username: "GamerPro"
   - Email: "user@example.com"
   - País: "Colombia"
   - Fecha de Nacimiento: "1990-05-15"
   - Nombre Completo: "Juan García"

2. Backend crea usuario con:
   - countrySetAt: 2024-01-15T10:30:00Z  ✅ Establecido
   - birthDateSetAt: 2024-01-15T10:30:00Z ✅ Establecido
   - lastNameChangeAt: null               ⏳ Sin cambios aún
```

### Escenario 2: Usuario Intenta Editar Perfil Inmediatamente
```
1. Usuario abre EditProfile.jsx
2. Frontend detecta:
   - countryLocked: true  (porque countrySetAt existe)
   - birthDateLocked: true (porque birthDateSetAt existe)
   - nextNameChangeDate: null (puede cambiar nombre ahí)

3. Usuario ve:
   - Select de País: DESHABILITADO + 🔒 "Este dato no puede ser modificado"
   - Input de Fecha: DESHABILITADO + 🔒 "Este dato no puede ser modificado"
   - Input de Nombre: HABILITADO, puede cambiar

4. Usuario cambia nombre a "Juan G. García" y guarda
   - Backend actualiza: lastNameChangeAt = 2024-01-15T11:00:00Z
   - Respuesta: 200 OK con usuario actualizado
```

### Escenario 3: Usuario Intenta Cambiar Nombre Antes de 21 Días
```
1. Usuario había cambiado nombre el 2024-01-15 a las 11:00
2. Intenta cambiar nuevamente el 2024-01-20 (5 días después)

Backend calcula:
- nextAvailableAt = 2024-01-15 11:00:00 + 21 días = 2024-02-05 11:00:00
- Se verifica que hoy (2024-01-20) < nextAvailableAt
- Retorna HTTP 429 con nextAvailableAt en ISO format

Frontend recibe error:
- Status: 429
- Message: "Solo puedes cambiar tu nombre una vez cada 3 semanas"
- nextAvailableAt: "2024-02-05T11:00:00Z"

Frontend formatea la fecha y muestra:
"Próximo cambio disponible: 5 de febrero de 2024"
```

### Escenario 4: Usuario Intenta Cambiar Nombre Después de 21 Días
```
1. Usuario había cambiado nombre el 2024-01-15
2. Intenta cambiar nuevamente el 2024-02-06 (22 días después)

Backend calcula:
- nextAvailableAt = 2024-02-05 11:00:00
- Se verifica que hoy (2024-02-06) > nextAvailableAt ✅
- Se permite el cambio
- Retorna 200 OK
- Actualiza lastNameChangeAt = 2024-02-06
```

## Rutas y Endpoints Afectadas

### POST/PUT `/api/auth/register`
- **Cambios**: Ahora establece `countrySetAt` y `birthDateSetAt`
- **Métodos HTTP**: POST (línea ~510)
- **Respuesta**: Usuario creado con timestamps

### POST/PUT `/api/auth/update-profile`
- **Cambios**: Agrega validaciones de restricción
- **Métodos HTTP**: PUT (línea ~1660)
- **Respuestas**:
  - 200 OK: Perfil actualizado correctamente
  - 403: Campo permanentemente bloqueado (country o birthDate)
  - 429: Cambios de nombre limitados a una vez cada 21 días
  - 400/409: Errores de validación
  - 500: Error interno del servidor

## Archivos Modificados

### Backend
1. **`backend/src/models/User.js`**
   - Agregados: `countrySetAt`, `birthDateSetAt`, `lastNameChangeAt` (líneas 358-361)

2. **`backend/src/controllers/auth.controller.js`**
   - **Función `register`** (línea 497): Establece timestamps en creación
   - **Función `updateProfile`** (línea 1655): Valida restricciones

### Frontend
1. **`frontend/src/pages/menu/Profile/EditProfile.jsx`**
   - Estado: `fieldRestrictions` (línea ~265)
   - En `fetchProfile`: Carga restricciones (línea ~390)
   - En `handleSubmit`: Maneja errores 403 y 429 (línea ~725)
   - En `handleSubmit` data: Evita enviar fields bloqueados (línea ~615)
   - Renderizado: Inputs deshabilitados + warnings visuales (línea ~900+, ~925+, ~910+)

## Testing Recomendado

### Test 1: Crear Usuario Nuevo
```bash
POST /api/auth/register
Body:
{
  "username": "TestUser",
  "email": "test@example.com",
  "password": "Password123",
  "confirmPassword": "Password123",
  "fullName": "Test User",
  "phone": "5551234567",
  "country": "Colombia",
  "birthDate": "1990-01-01",
  "checkTerms": true
}

Expected: 201 Created
Check: countrySetAt y birthDateSetAt están establecidos en BD
```

### Test 2: Editar Perfil Inmediatamente
```bash
PUT /api/auth/update-profile
Body:
{
  "country": "Perú"  // Intenta cambiar
}

Expected: 403 Forbidden
Message: "No puedes cambiar el país después de creada tu cuenta..."
```

### Test 3: Cambiar Nombre Exitosamente
```bash
PUT /api/auth/update-profile
Body:
{
  "fullName": "Test User Updated"
}

Expected: 200 OK
Check: lastNameChangeAt está actualizado
```

### Test 4: Cambiar Nombre Antes de 21 Días
```bash
PUT /api/auth/update-profile
Body:
{
  "fullName": "Test Again"
}

Expected: 429 Too Many Requests
Response: {
  "message": "Solo puedes cambiar tu nombre una vez cada 3 semanas...",
  "restriction": "name_throttle",
  "nextAvailableAt": "ISO_DATE_STRING"
}
```

### Test 5: Cambiar Nombre Después de 21 Días
```bash
// Mock: Cambiar lastNameChangeAt en DB a hace 22 días
PUT /api/auth/update-profile
Body:
{
  "fullName": "Final Name"
}

Expected: 200 OK
Check: lastNameChangeAt está actualizado
```

## Consideraciones de Seguridad

1. **Backend es la verdad**: El frontend solo proporciona UX, el backend valida
2. **Timestamps inmutables**: Una vez `countrySetAt` está establecido, no se puede cambiar
3. **Throttle por servidor**: El cálculo de 21 días se hace en el servidor (zona horaria UTC)
4. **HTTP 429 estándar**: Usado para rate-limiting, apropiado para throttle de cambios
5. **Validación de masa**: `allowedFields` en backend previene mass-assignment

## Mensajes de UX

| Campo | Estado | Mensaje | Color | Icono |
|-------|--------|---------|-------|-------|
| País | Bloqueado | "Este dato no puede ser modificado (permanente)" | #FF6B6B | 🔒 |
| Fecha | Bloqueado | "Este dato no puede ser modificado (permanente)" | #FF6B6B | 🔒 |
| Nombre | Throttle | "Próximo cambio disponible: 05 de febrero de 2024" | #FF9500 | ⏳ |

## Notas para Desarrolladores Futuros

1. El cálculo de "21 días" se hace en milisegundos: `21 * 24 * 60 * 60 * 1000 = 1814400000`
2. Todas las fechas están en UTC (estándar de MongoDB)
3. El frontend formatea fechas según la localidad del usuario (`es-ES`)
4. Si necesitas cambiar el período de throttle, modifica ambos:
   - Backend: `auth.controller.js` línea ~1679
   - Frontend: `EditProfile.jsx` línea ~390
5. Los campos son unidireccionales: Country y BirthDate nunca vuelven a ser editable
