import { Router } from 'express';
import * as trackerController from '../controllers/tracker.controller.js';

const router = Router();

/**
 * @swagger
 * /api/tracker/{game}/{platformUserIdentifier}:
 *   get:
 *     summary: Obtiene stats normalizados de un jugador desde Tracker Network
 *     description: |
 *       Recupera y normaliza las estadísticas de perfil para un jugador en un juego soportado.
 *       - Para Valorant y LoL, `platformUserIdentifier` debe ser el Riot ID completo (ej. `Nombre#Tag`).
 *       - MLBB forma parte del catalogo actual de la app, pero Tracker Network no lo soporta publicamente en la API v2.
 *       - El identificador debe ser URL-encoded por el cliente si contiene caracteres especiales.
 *     tags: [Tracker]
 *     parameters:
 *       - in: path
 *         name: game
 *         required: true
 *         schema:
 *           type: string
 *           enum: [valorant, lol, mlbb]
 *         description: El ID del juego soportado.
 *       - in: path
 *         name: platformUserIdentifier
 *         required: true
 *         schema:
 *           type: string
 *         description: El identificador del jugador en la plataforma (ej. RiotID#TagLine).
 *     responses:
 *       200:
 *         description: Perfil del jugador recuperado y normalizado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: El juego o el identificador no es valido.
 *       501:
 *         description: El juego existe en la app, pero Tracker Network no lo soporta publicamente.
 *       404:
 *         description: No se encontraron stats para el jugador.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/:game/:platformUserIdentifier', trackerController.getStats);

export default router;
