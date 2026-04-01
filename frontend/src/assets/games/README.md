# Imágenes Unificadas de Juegos

## Estructura
Esta carpeta contiene **TODAS** las imágenes de juegos del sistema, consolidadas en un único lugar para evitar duplicados y facilitar el mantenimiento.

## Convención de Nombres
- **Formato**: `{game-id}.jpg` (minúsculas)
- **Ejemplos**: `lol.jpg`, `valorant.jpg`, `codm.jpg`, `fifa.jpg`
- El nombre del archivo debe coincidir exactamente con el `id` en `shared/communityCatalog.js`

## Game IDs Válidos
```
aov, apex, brawlhalla, codm, cr, cs2, dota2, fallguys, fifa, fortnite, freefire, 
genshin, gta, halo, hok, hs, lol, lor, mariokart, mlbb, nba2k, ow2, pubg, r6, 
rl, sf6, smash, starcraft, tekken, tft, valorant, warzone, wildrift, wuwa, 
amongus, bg3, codbo6, cyberpunk, dbsz, deadlock, eldenring, helldivers2, 
hogwarts, mk1, multiversus, mhwilds, nms, palworld, rdr2, tarkov, thefinals, 
xdefiant
```

## Referencias en el Código
- Las imágenes se cargan dinámicamente mediante `getGameImagePath(gameId)` en `communityData.js`
- Frontend: `/frontend/src/data/communityData.js`
- Backend: `/Backend/src/controllers/community.controller.js`

## Cómo Agregar una Nueva Imagen
1. Añadir la imagen con nombre: `{game-id}.jpg`
2. No es necesario actualizar imports en el código
3. El sistema cargará automáticamente por el game ID

## Limpieza
- Carpeta anterior `/assets/comunidad/` es DEPRECATED
- Carpeta anterior `/assets/gameImages/` es DEPRECATED
- Usa siempre `/assets/games/` para nuevas imágenes

---
**Última actualización**: Marzo 30, 2026
**Unificación completada**: ✅
