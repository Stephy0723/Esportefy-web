# Sistema de puntos y logros de perfil

## Objetivo

Agregar una capa de progreso al perfil del usuario para que:

- los puntos se ganen con acciones reales dentro de Esportefy,
- existan 20 logros desbloqueables con progreso visible,
- `Perfil` muestre el estado competitivo/social del usuario,
- `Editar Perfil` explique que acciones faltan para subir de nivel.

La fuente unica del sistema es `GET /api/auth/profile/overview`.

## Respuesta esperada

El `overview` ahora entrega:

- `stats.points`
- `progression.totalPoints`
- `progression.level`
- `progression.pointSources`
- `progression.achievements`
- `progression.highlights`

`Perfil` consume el resumen para mostrar puntos y nivel.

`Editar Perfil` consume el catalogo completo para pintar el tablero de progreso.

## Como se calculan los puntos

Los puntos se recalculan automaticamente a partir de acciones persistidas del usuario.
No se editan manualmente.

Fuentes principales:

1. Completar datos base del perfil.
2. Personalizar identidad visual.
3. Escribir bio.
4. Seleccionar juegos.
5. Configurar roles e idiomas.
6. Agregar redes sociales.
7. Vincular cuentas gaming y Discord.
8. Conseguir amistades mutuas.
9. Unirse a equipos.
10. Ser capitan de equipo.
11. Participar en comunidades.
12. Publicar contenido.
13. Recibir interaccion en publicaciones.
14. Participar en torneos.
15. Jugar partidas oficiales.
16. Ganar partidas oficiales.
17. Ganar titulos.
18. Verificacion universitaria.
19. Estado de busqueda de equipo.

## Niveles

Escalera actual:

- `0`: Rookie
- `350`: Aspirante
- `800`: Competidor
- `1400`: Estratega
- `2100`: Capitan
- `2900`: Elite
- `3800`: Campeon
- `4700`: Leyenda

## Catalogo de 20 logros

1. `Perfil completo`: completar 5 datos base.
2. `Firma gamer`: activar avatar, placa, fondo y marco.
3. `Voz propia`: publicar una bio de al menos 20 caracteres.
4. `Multijuego`: seleccionar 3 juegos.
5. `Comunicacion lista`: configurar 2 idiomas.
6. `Perfil social`: agregar 3 redes sociales.
7. `Discord listo`: vincular Discord.
8. `Cuenta competitiva`: verificar Riot o MLBB.
9. `Primer amigo`: lograr 1 amistad mutua.
10. `Red activa`: lograr 5 amistades mutuas.
11. `Primer equipo`: entrar a 1 equipo.
12. `Capitan nato`: liderar 1 equipo.
13. `Comunidad viva`: unirse a 1 comunidad.
14. `Creador activo`: publicar 3 posts.
15. `Reaccion del publico`: recibir 10 likes.
16. `Debut competitivo`: participar en 1 torneo.
17. `Circuito regular`: participar en 5 torneos.
18. `Guerrero oficial`: jugar 10 partidas oficiales.
19. `Primera corona`: ganar 1 torneo.
20. `Dinastia competitiva`: ganar 5 torneos.

## Archivos tocados

- `backend/src/services/profileProgression.js`
- `backend/src/controllers/auth.controller.js`
- `frontend/src/data/profileProgression.js`
- `frontend/src/pages/menu/Profile/Profile.jsx`
- `frontend/src/pages/menu/Profile/Profile.css`
- `frontend/src/pages/menu/Profile/EditProfile.jsx`
- `frontend/src/pages/menu/Profile/EditProfile.css`

## Notas

- Los puntos y logros viven en backend para evitar logica duplicada.
- `Perfil` solo pinta un resumen.
- `Editar Perfil` expone el detalle completo para orientar al usuario.
