import {
    buildPublicStats,
    buildDetailedStats,
    getStatsWithCache
} from '../services/trackerNetwork.service.js';

/**
 * Controlador para estadísticas de Tracker Network
 * Gestiona permisos de usuarios y admins
 */

/**
 * GET /stats/tracker/:game/:identifier
 * Obtiene stats con permisos basados en rol
 *
 * Params:
 * - game: 'lol' | 'valorant'
 * - identifier: Summoner name (LoL) o gameName#tagLine (Valorant)
 *
 * Query:
 * - ?force=true para ignorar cache
 */
export const getPlayerStats = async (req, res) => {
    try {
        const { game, identifier } = req.params;
        const { force } = req.query;
        const isAdmin = req.user?.isAdmin === true;
        const userId = req.user?._id;

        // Validar parámetros
        if (!game || !identifier) {
            return res.status(400).json({
                ok: false,
                message: 'Parámetros requeridos: game, identifier'
            });
        }

        if (!['lol', 'valorant'].includes(game.toLowerCase())) {
            return res.status(400).json({
                ok: false,
                message: 'Juego no soportado. Use: lol, valorant'
            });
        }

        // Traer datos del cache o API
        const trackerData = await getStatsWithCache(identifier, game, force === 'true');

        if (!trackerData) {
            return res.status(404).json({
                ok: false,
                message: `No se encontraron datos para ${identifier} en Tracker Network`
            });
        }

        // LÓGICA DE PERMISOS
        let stats;

        if (isAdmin) {
            // Admin: obtiene TODO
            stats = buildDetailedStats(trackerData, game);
            stats.permissionLevel = 'admin';
            stats.accessedBy = userId;
            stats.accessedAt = new Date();
        } else {
            // Usuario normal: solo datos públicos
            stats = buildPublicStats(trackerData, game);
            stats.permissionLevel = 'public';
        }

        return res.status(200).json({
            ok: true,
            game,
            identifier,
            data: stats
        });

    } catch (error) {
        console.error('[Stats Controller] Error:', error.message);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error al obtener estadísticas'
        });
    }
};

/**
 * GET /stats/tracker/compare/:game
 * Compara stats de 2 jugadores (solo admin)
 *
 * Query:
 * - ?players=player1,player2 (LoL)
 * - ?players=gameName1#tag1,gameName2#tag2 (Valorant)
 */
export const comparePlayerStats = async (req, res) => {
    try {
        const { game } = req.params;
        const { players } = req.query;
        const isAdmin = req.user?.isAdmin === true;

        // Solo admin puede comparar
        if (!isAdmin) {
            return res.status(403).json({
                ok: false,
                message: 'Solo administradores pueden comparar estadísticas detalladas'
            });
        }

        if (!players || !game) {
            return res.status(400).json({
                ok: false,
                message: 'Parámetros requeridos: game, players'
            });
        }

        const playerList = players.split(',').map(p => p.trim());

        if (playerList.length !== 2) {
            return res.status(400).json({
                ok: false,
                message: 'Debes proporcionar exactamente 2 jugadores'
            });
        }

        // Obtener stats de ambos
        const statsPromises = playerList.map(player =>
            getStatsWithCache(player, game, false)
                .then(data => buildDetailedStats(data, game))
                .catch(err => ({ error: err.message }))
        );

        const [stats1, stats2] = await Promise.all(statsPromises);

        if (!stats1 || stats1.error || !stats2 || stats2.error) {
            return res.status(404).json({
                ok: false,
                message: 'No se pudieron obtener datos para uno o ambos jugadores'
            });
        }

        // Comparación
        const comparison = {
            player1: {
                name: playerList[0],
                ...stats1
            },
            player2: {
                name: playerList[1],
                ...stats2
            },
            comparison: {
                tierDifference: compareTiers(stats1.competitive?.tier, stats2.competitive?.tier),
                winRateDifference: Math.abs(
                    parseFloat(stats1.winRate) - parseFloat(stats2.winRate)
                ).toFixed(2),
                performanceScore: {
                    player1: calculatePerformanceScore(stats1),
                    player2: calculatePerformanceScore(stats2)
                }
            }
        };

        return res.status(200).json({
            ok: true,
            game,
            data: comparison
        });

    } catch (error) {
        console.error('[Stats Compare] Error:', error.message);
        return res.status(500).json({
            ok: false,
            message: error.message || 'Error al comparar estadísticas'
        });
    }
};

/**
 * GET /stats/tracker/team/:teamId
 * Obtiene stats agregadas del equipo (solo admin ve detalles)
 */
export const getTeamStats = async (req, res) => {
    try {
        const { teamId } = req.params;
        const isAdmin = req.user?.isAdmin === true;

        // Aquí iría lógica para traer el equipo y sus miembros
        // Por ahora, ejemplo general

        return res.status(200).json({
            ok: true,
            message: 'Endpoint de team stats en construcción'
        });

    } catch (error) {
        console.error('[Team Stats] Error:', error.message);
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

/**
 * POST /stats/tracker/audit
 * Registra accesos a stats detalladas (admin only)
 */
export const auditStatsAccess = async (req, res) => {
    try {
        const { game, identifier, action } = req.body;
        const isAdmin = req.user?.isAdmin === true;

        if (!isAdmin) {
            return res.status(403).json({
                ok: false,
                message: 'No autorizado'
            });
        }

        // Log del acceso a admin stats
        console.log(`[StatsAudit] Admin ${req.user._id} accessed ${game} stats for ${identifier} - Action: ${action}`);

        return res.status(200).json({
            ok: true,
            message: 'Acceso registrado'
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: error.message
        });
    }
};

/**
 * FUNCIONES AUXILIARES
 */

const compareTiers = (tier1, tier2) => {
    const tierOrder = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Challenger'];
    const idx1 = tierOrder.indexOf(tier1) || -1;
    const idx2 = tierOrder.indexOf(tier2) || -1;

    if (idx1 === -1 || idx2 === -1) return 'N/A';

    const diff = idx1 - idx2;
    if (diff > 0) return `${tier1} es ${diff} tier(s) más alto`;
    if (diff < 0) return `${tier2} es ${Math.abs(diff)} tier(s) más alto`;
    return 'Mismo tier';
};

const calculatePerformanceScore = (stats) => {
    // Score 0-100 basado en múltiples factores
    if (!stats.competitive) return 0;

    let score = 0;

    // Winrate (0-40 puntos)
    const winRate = parseFloat(stats.winRate) || 0;
    score += Math.min(winRate * 0.4, 40);

    // KDA (0-30 puntos)
    const kda = parseFloat(stats.performance?.kdaRatio) || 0;
    score += Math.min((kda / 3) * 30, 30); // Asume que 3.0 KDA es excelente

    // Consistency (0-20 puntos)
    const gamesPlayed = stats.competitive?.gamesPlayed || 0;
    score += Math.min((gamesPlayed / 200) * 20, 20); // 200 games = máximo

    // Champ diversity (0-10 puntos)
    const champCount = stats.champions?.totalChampionsPlayed || 0;
    score += Math.min((champCount / 30) * 10, 10);

    return Math.round(score);
};

export default {
    getPlayerStats,
    comparePlayerStats,
    getTeamStats,
    auditStatsAccess
};
