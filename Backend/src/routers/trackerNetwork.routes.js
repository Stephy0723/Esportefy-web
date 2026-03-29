import express from 'express';
import {
    getPlayerStats,
    comparePlayerStats,
    getTeamStats,
    auditStatsAccess
} from '../controllers/trackerNetwork.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * RUTAS DE TRACKER NETWORK
 * Todas requieren autenticación
 */

/**
 * GET /stats/player/:game/:identifier
 * Obtiene stats de un jugador
 * - Usuarios normales: stats públicas
 * - Admins: stats detalladas
 *
 * Ejemplos:
 * GET /stats/player/lol/Faker
 * GET /stats/player/valorant/SomePlayer%23NA1
 */
router.get(
    '/player/:game/:identifier',
    verifyToken,
    getPlayerStats
);

/**
 * GET /stats/compare/:game
 * Compara stats de 2 jugadores
 * SOLO ADMIN
 *
 * Ejemplo:
 * GET /stats/compare/lol?players=Faker,T1%20Khan
 */
router.get(
    '/compare/:game',
    verifyToken,
    comparePlayerStats
);

/**
 * GET /stats/team/:teamId
 * Obtiene stats agregadas del equipo
 * - Usuarios: resumen público
 * - Admins: análisis detallado
 */
router.get(
    '/team/:teamId',
    verifyToken,
    getTeamStats
);

/**
 * POST /stats/audit
 * Registra acceso a stats detalladas
 * SOLO ADMIN - para auditoría
 */
router.post(
    '/audit',
    verifyToken,
    auditStatsAccess
);

export default router;
