# /test-ux — Auditoría UI/UX como usuario real

Actúa como un QA tester y diseñador UX experimentado que navega la aplicación por primera vez. Revisa TODO el código frontend simulando los flujos de un usuario real.

## Instrucciones

1. **Lee las rutas** en `App.jsx` para entender todos los flujos disponibles.
2. **Para cada página/componente principal**, revisa el código buscando:

### Errores de UI
- Textos hardcodeados o placeholder que quedaron ("Lorem ipsum", "TODO", "test")
- Imágenes rotas o URLs de placeholder
- Estilos inconsistentes (colores, tipografías, espaciados diferentes entre páginas)
- Elementos sin responsive design (sin media queries o clases responsive)
- Z-index conflicts (modales detrás de otros elementos)
- Overflow no controlado (textos que se salen de contenedores)
- Botones sin estados hover/active/disabled
- Formularios sin validación visual

### Errores de UX
- Links o botones que no llevan a ningún lado (`href="#"`, `onClick` vacío)
- Páginas sin estado vacío (listas sin mensaje "No hay datos")
- Falta de feedback al usuario (acciones sin loading, sin confirmación)
- Navegación confusa o inconsistente
- Formularios sin mensajes de error claros
- Acciones destructivas sin confirmación (eliminar sin modal)
- Falta de accesibilidad (imágenes sin alt, botones sin aria-label)
- Console.log olvidados en producción

### Consistencia
- Componentes duplicados que hacen lo mismo (Toast vs Toasts)
- Datos mock/hardcoded que deberían venir del backend
- Imports no utilizados
- Estados que nunca se actualizan

3. **Genera un reporte** organizado por severidad:
   - **Crítico**: Bloquea al usuario o causa crash
   - **Alto**: Funcionalidad rota o muy confusa
   - **Medio**: Inconsistencias visuales o UX mejorable
   - **Bajo**: Polish y mejoras menores

Incluye la ruta del archivo y línea exacta de cada issue.
