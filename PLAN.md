# Plan: Dashboard Fullscreen Immersive Redesign

## Resumen
Rediseñar el Dashboard de un layout bento-grid con widgets pequeños a una experiencia fullscreen inmersiva tipo "Player Career Hub" con scroll-snap vertical, donde cada sección ocupa 100vh.

## Archivos a modificar
1. `frontend/src/pages/menu/Dashboard/Dashboard.jsx` — Rewrite completo del render
2. `frontend/src/pages/menu/Dashboard/Dashboard.css` — Rewrite completo de estilos

## Archivos que NO se tocan
- Toda la lógica de datos (fetches, hooks, useMemo, estados) se mantiene intacta
- Componentes importados: AvatarCircle, PlayerTag, PageHud, charts
- Backend / API

---

## Arquitectura CSS

### Contenedor principal
- `.db` con `scroll-snap-type: y mandatory` y `overflow-y: auto; height: 100vh`
- Cada sección `.db__section` con `scroll-snap-align: start; min-height: 100vh`
- Navegación lateral con dots indicadores de sección activa

### Variables de color adicionales
- Reutilizar las existentes (`--primary`, `--bg-page`, `--bg-card`, etc.)
- Acentos: verde `#8EDB15`, azul neon `#00d2ff`, magenta `#ff4466`, dorado `#ffd700`

---

## Secciones (8 pantallas fullscreen)

### Sección 1 — HERO IDENTIDAD (100vh)
- Banner dinámico del usuario a pantalla completa con parallax suave
- Overlay gradient oscuro
- Avatar grande centrado (150px) con frame
- Username con PlayerTag grande (`fontTag="3rem"`)
- Saludo dinámico + hora/fecha como HUD sutil
- Bio corta debajo
- Botón "Editar perfil" discreto esquina inferior
- Sin métricas — solo identidad cinematográfica
- Animación fade-in al cargar

### Sección 2 — MÉTRICAS / COMMAND CENTER (100vh)
- Fondo oscuro con gradiente sutil
- Grid 3x2 de métricas con números enormes (4-5rem)
- AnimatedNumber count-up
- Cada métrica: icono, valor grande, label
- Métricas: Rango LoL, Juegos, Equipos, Torneos activos, Días activo, Perfil %
- Barra de progreso de perfil con glow
- Glow dinámico según tier en la métrica de rango
- Estilo tipo panel militar/centro de comando

### Sección 3 — RANK SHOWCASE (100vh)
- Si Riot vinculado:
  - Icono invocador grande centrado (160px) con glow animado
  - Tier name enorme con text-shadow
  - LP progress bar ancha
  - Nivel + Valorant secondary rank
  - Fondo con glow radial del color del tier
- Si NO vinculado:
  - CTA cinematográfica fullscreen con escudo animado
  - Mensaje motivacional + botón vincular

### Sección 4 — RENDIMIENTO / ANALYTICS (100vh)
- Dos charts grandes lado a lado
- Doughnut (géneros de juego) — grande, 400px
- Bar (torneos por estado) — grande
- Mucho espacio negativo
- Leyendas minimalistas
- Fondo sutilmente diferente

### Sección 5 — MIS EQUIPOS (100vh)
- Carousel horizontal de tarjetas de equipo
- Cada tarjeta: logo grande (120px), nombre, rol badge, miembros
- Hover: glow border + scale
- Navegación con flechas laterales
- Si no hay equipos: CTA con botones crear/buscar
- Pending requests banner si aplica

### Sección 6 — TORNEOS ACTIVOS (100vh)
- Lista premium vertical centrada (max-width 800px)
- Cada torneo: banner thumbnail, título, game, fecha, status badge
- Barra de slots ocupados
- Countdown timer animado
- Premio destacado en dorado
- Botón "Ver todos" al final

### Sección 7 — BIBLIOTECA DE JUEGOS (100vh)
- Grid de tiles grandes (aspect-ratio 16/9)
- Background de la sección cambia según juego en hover/activo
- Info overlay en hover: nombre, developer, tags
- Click cambia el featured game del hero
- Carousel dots si hay muchos juegos

### Sección 8 — CUENTA / PERFIL (100vh)
- Info de cuenta en layout limpio
- Grid 2x3 con iconos
- Discord, email, país, objetivos, experiencia, nombre
- Performance strip integrado
- Centro de mando (quick nav) como row de botones al fondo

---

## Navegación Lateral (Dot Nav)
- Columna fija derecha con 8 dots
- Dot activo = primario con glow
- Click en dot = scrollTo sección
- Labels en hover (tooltip)
- Se detecta sección activa con IntersectionObserver

---

## Animaciones (Framer Motion)
- Cada sección: `motion.section` con `initial={{ opacity: 0 }}` + `whileInView={{ opacity: 1 }}`
- Hero: fade-in + scale banner
- Métricas: stagger children (delay incremental)
- Rank: glow pulse continuo
- Equipos carousel: slide-in lateral
- Charts: fade-in delayed
- Transiciones suaves entre secciones via scroll-snap

---

## Responsive
- Desktop: experiencia fullscreen completa
- Tablet (≤1024px): secciones siguen siendo 100vh pero layouts internos se adaptan
- Mobile (≤768px): desactivar scroll-snap, volver a scroll normal con secciones de min-height auto, ocultar dot nav
- Mobile (≤480px): reducir tamaños de fuente y avatar

---

## Pasos de implementación
1. Reescribir `Dashboard.css` completamente con la nueva arquitectura fullscreen
2. Reescribir el return/render de `Dashboard.jsx` con las 8 secciones + dot nav
3. Agregar IntersectionObserver para dot nav activo
4. Mantener toda la lógica de datos sin cambios
5. Verificar que no se rompe ninguna importación
