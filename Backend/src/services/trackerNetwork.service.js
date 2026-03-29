import axios from 'axios';

/**
 * Servicio para integración con Tracker Network API
 * Obtiene estadísticas competitivas de jugadores
 */

const TRACKER_BASE_URL = 'https://api.tracker.gg/api/v2';
const TRACKER_API_KEY = process.env.TRACKER_NETWORK_API_KEY;

// Validar que tenemos API key
if (!TRACKER_API_KEY) {
    console.warn('[TrackerNetwork] TRACKER_NETWORK_API_KEY no configurada');
}

/**
 * Cliente HTTP para Tracker Network con retry logic
 */
const trackerClient = axios.create({
    baseURL: TRACKER_BASE_URL,
    headers: {
        'TRN-Api-Key': TRACKER_API_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

// Retry interceptor
trackerClient.interceptors.response.use(
    response => response,
    async error => {
        const config = error.config;
        if (!config || !config.retry) {
            config.retry = 0;
        }
        config.retry += 1;

        if (config.retry <= 3 && error.response?.status === 429) {
            await new Promise(resolve => setTimeout(resolve, 1000 * config.retry));
            return trackerClient(config);
        }

        return Promise.reject(error);
    }
);

/**
 * Obtiene stats de League of Legends
 */
export const getLeagueOfLegendsStats = async (summonerName, region = 'na1') => {
    try {
        const response = await trackerClient.get(`/lol/standard/v1/accounts/${region}/${encodeURIComponent(summonerName)}`);
        return response.data.data || null;
    } catch (error) {
        console.error(`[TrackerNetwork] Error obteniendo LoL stats para ${summonerName}:`, error.message);
        throw new Error('No se encontraron datos para este jugador en Tracker Network');
    }
};

/**
 * Obtiene stats de Valorant
 */
export const getValorantStats = async (gameName, tagLine, region = 'na') => {
    try {
        const response = await trackerClient.get(
            `/valorant/v2/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
        );
        return response.data.data || null;
    } catch (error) {
        console.error(`[TrackerNetwork] Error obteniendo Valorant stats:`, error.message);
        throw new Error('No se encontraron datos para este jugador en Tracker Network');
    }
};

/**
 * STATS SUPERFICIALES (para usuarios normales)
 * Datos básicos y públicos
 */
export const buildPublicStats = (trackerData, game = 'lol') => {
    if (!trackerData) return null;

    if (game.toLowerCase() === 'lol') {
        return {
            // Datos básicos visibles
            rank: {
                tier: trackerData.segments?.[0]?.stats?.tier?.displayValue || 'Unranked',
                lp: trackerData.segments?.[0]?.stats?.leaguePoints?.displayValue || 0,
                wins: trackerData.segments?.[0]?.stats?.wins?.displayValue || 0,
                losses: trackerData.segments?.[0]?.stats?.losses?.displayValue || 0,
            },
            winRate: calculateWinRate(
                trackerData.segments?.[0]?.stats?.wins?.value || 0,
                trackerData.segments?.[0]?.stats?.losses?.value || 0
            ),
            mainChampions: getTopChampions(trackerData.segments?.[1]?.stats, 3), // Top 3 campeones
            lastUpdated: trackerData.lastUpdated || null,
            platform: 'League of Legends'
        };
    }

    if (game.toLowerCase() === 'valorant') {
        return {
            rank: {
                rank: trackerData.segments?.[0]?.stats?.rank?.displayValue || 'Unknown',
                rr: trackerData.segments?.[0]?.stats?.rr?.displayValue || 0,
                wins: trackerData.segments?.[0]?.stats?.wins?.displayValue || 0,
                losses: trackerData.segments?.[0]?.stats?.losses?.displayValue || 0,
            },
            winRate: calculateWinRate(
                trackerData.segments?.[0]?.stats?.wins?.value || 0,
                trackerData.segments?.[0]?.stats?.losses?.value || 0
            ),
            mainAgents: getTopAgents(trackerData.segments?.[1]?.stats, 3),
            lastUpdated: trackerData.lastUpdated || null,
            platform: 'Valorant'
        };
    }

    return null;
};

/**
 * STATS DETALLADAS (solo para admins)
 * Incluye historial, tendencias, análisis profundo
 */
export const buildDetailedStats = (trackerData, game = 'lol') => {
    if (!trackerData) return null;

    const publicStats = buildPublicStats(trackerData, game);

    if (game.toLowerCase() === 'lol') {
        return {
            ...publicStats,
            // Detalles avanzados
            competitive: {
                tier: trackerData.segments?.[0]?.stats?.tier?.displayValue,
                division: trackerData.segments?.[0]?.stats?.division?.displayValue,
                leaguePoints: trackerData.segments?.[0]?.stats?.leaguePoints?.value,
                winRatePercentage: calculateWinRate(
                    trackerData.segments?.[0]?.stats?.wins?.value,
                    trackerData.segments?.[0]?.stats?.losses?.value,
                    true
                ),
                gamesPlayed: (trackerData.segments?.[0]?.stats?.wins?.value || 0) + 
                            (trackerData.segments?.[0]?.stats?.losses?.value || 0),
            },
            performance: {
                kda: trackerData.segments?.[1]?.stats?.kda?.displayValue || 'N/A',
                kdaRatio: calculateKDA(trackerData.segments?.[1]?.stats),
                killsPerGame: trackerData.segments?.[1]?.stats?.killsPerGame?.displayValue,
                deathsPerGame: trackerData.segments?.[1]?.stats?.deathsPerGame?.displayValue,
                assistsPerGame: trackerData.segments?.[1]?.stats?.assistsPerGame?.displayValue,
                csPerMinute: trackerData.segments?.[1]?.stats?.csPerMinute?.displayValue,
                goldPerMinute: trackerData.segments?.[1]?.stats?.goldPerMinute?.displayValue,
                damagePerMinute: trackerData.segments?.[1]?.stats?.damagePerMinute?.displayValue,
            },
            champions: {
                mostPlayed: getTopChampions(trackerData.segments?.[1]?.stats, 10),
                totalChampionsPlayed: countUniquePlayers(trackerData.segments?.[1]?.stats),
            },
            matches: {
                recentMatches: trackerData.segments?.[2]?.stats || [],
                matchHistory: trackerData.segments?.[2]?.metadata?.matchCount || 0,
            },
            trends: {
                lpTrend: calculateTrend(trackerData.segments?.[0]?.stats),
                winRateTrend: calculateWinRateTrend(trackerData),
                championMetaAlignment: analyzeMetaAlignment(trackerData),
            },
            // Meta y análisis
            roleDistribution: getRoleDistribution(trackerData.segments?.[1]?.stats),
            skillAssessment: assessSkillLevel(trackerData),
            lastUpdated: trackerData.lastUpdated,
            dataQuality: 'complete', // Indica que son datos completos
        };
    }

    if (game.toLowerCase() === 'valorant') {
        return {
            ...publicStats,
            // Detalles avanzados Valorant
            competitive: {
                rank: trackerData.segments?.[0]?.stats?.rank?.displayValue,
                rr: trackerData.segments?.[0]?.stats?.rr?.value,
                wins: trackerData.segments?.[0]?.stats?.wins?.value,
                losses: trackerData.segments?.[0]?.stats?.losses?.value,
                gamesPlayed: (trackerData.segments?.[0]?.stats?.wins?.value || 0) + 
                            (trackerData.segments?.[0]?.stats?.losses?.value || 0),
            },
            performance: {
                combatScore: trackerData.segments?.[1]?.stats?.combatScore?.displayValue,
                kda: trackerData.segments?.[1]?.stats?.kda?.displayValue,
                headshotPercentage: trackerData.segments?.[1]?.stats?.headshotPercentage?.displayValue,
                killsPerRound: trackerData.segments?.[1]?.stats?.killsPerRound?.displayValue,
                deathsPerRound: trackerData.segments?.[1]?.stats?.deathsPerRound?.displayValue,
                assistsPerRound: trackerData.segments?.[1]?.stats?.assistsPerRound?.displayValue,
            },
            agents: {
                mostPlayed: getTopAgents(trackerData.segments?.[1]?.stats, 10),
                totalAgentsPlayed: countUniquePlayers(trackerData.segments?.[1]?.stats),
            },
            maps: {
                mapStats: analyzeMapPerformance(trackerData.segments?.[1]?.stats),
            },
            trends: {
                rrTrend: calculateRRTrend(trackerData),
                winRateTrend: calculateWinRateTrend(trackerData),
                agentMetaAlignment: analyzeMetaAlignment(trackerData),
            },
            skillAssessment: assessSkillLevel(trackerData),
            lastUpdated: trackerData.lastUpdated,
            dataQuality: 'complete',
        };
    }

    return null;
};

/**
 * FUNCIONES AUXILIARES
 */

const calculateWinRate = (wins = 0, losses = 0, asPercentage = false) => {
    const total = wins + losses;
    if (total === 0) return asPercentage ? '0%' : 0;
    const rate = (wins / total) * 100;
    return asPercentage ? `${rate.toFixed(2)}%` : rate.toFixed(2);
};

const calculateKDA = (stats) => {
    const kills = stats?.kills?.value || 0;
    const deaths = stats?.deaths?.value || 1;
    const assists = stats?.assists?.value || 0;
    const kda = (kills + assists) / deaths;
    return kda.toFixed(2);
};

const getTopChampions = (champStats, limit = 3) => {
    if (!champStats?.champions) return [];
    return champStats.champions
        .sort((a, b) => (b.stats?.gamesPlayed?.value || 0) - (a.stats?.gamesPlayed?.value || 0))
        .slice(0, limit)
        .map(champ => ({
            name: champ.metadata?.name || 'Unknown',
            gamesPlayed: champ.stats?.gamesPlayed?.value || 0,
            winRate: calculateWinRate(champ.stats?.wins?.value, champ.stats?.losses?.value),
            mainRole: champ.stats?.role?.displayValue || 'Unknown'
        }));
};

const getTopAgents = (agentStats, limit = 3) => {
    if (!agentStats?.agents) return [];
    return agentStats.agents
        .sort((a, b) => (b.stats?.gamesPlayed?.value || 0) - (a.stats?.gamesPlayed?.value || 0))
        .slice(0, limit)
        .map(agent => ({
            name: agent.metadata?.name || 'Unknown',
            gamesPlayed: agent.stats?.gamesPlayed?.value || 0,
            winRate: calculateWinRate(agent.stats?.wins?.value, agent.stats?.losses?.value),
            icon: agent.metadata?.iconUrl || null
        }));
};

const countUniquePlayers = (stats) => {
    if (!stats?.champions && !stats?.agents) return 0;
    const collection = stats.champions || stats.agents || [];
    return collection.length;
};

const calculateTrend = (stats) => {
    if (!stats) return 'stable';
    const currentLP = stats.leaguePoints?.value || 0;
    const previousLP = stats.leaguePointsHistory?.slice(-10)[0] || 0;
    if (currentLP > previousLP) return 'rising';
    if (currentLP < previousLP) return 'falling';
    return 'stable';
};

const calculateWinRateTrend = (trackerData) => {
    // Analiza últimas 50 partidas vs 50 previas
    if (!trackerData.segments?.[2]) return 'stable';
    const allMatches = trackerData.segments[2].stats?.matchList || [];
    if (allMatches.length < 50) return 'stable';
    
    const recentWins = allMatches.slice(0, 25).filter(m => m.stats?.isWin).length;
    const previousWins = allMatches.slice(25, 50).filter(m => m.stats?.isWin).length;
    
    if (recentWins > previousWins) return 'rising';
    if (recentWins < previousWins) return 'falling';
    return 'stable';
};

const analyzeMetaAlignment = (trackerData) => {
    // Compara main champions/agents con meta actual
    return {
        alignment: 'unknown', // Integrar con meta actualizada
        recommendation: 'Revisar meta actual'
    };
};

const getRoleDistribution = (stats) => {
    if (!stats?.champions) return {};
    const distribution = {};
    stats.champions.forEach(champ => {
        const role = champ.stats?.role?.displayValue || 'Unknown';
        distribution[role] = (distribution[role] || 0) + 1;
    });
    return distribution;
};

const assessSkillLevel = (trackerData) => {
    const tier = trackerData.segments?.[0]?.stats?.tier?.displayValue || 'Unranked';
    const tierMap = {
        'Challenger': 'Pro/Elite',
        'Grandmaster': 'Pro/Elite',
        'Master': 'Advanced',
        'Diamond': 'Advanced',
        'Platinum': 'Intermediate',
        'Gold': 'Intermediate',
        'Silver': 'Beginner',
        'Bronze': 'Beginner',
        'Iron': 'Beginner',
        'Unranked': 'Unranked'
    };
    return tierMap[tier] || 'Unknown';
};

const analyzeMapPerformance = (stats) => {
    if (!stats?.maps) return [];
    return stats.maps
        .sort((a, b) => (b.stats?.gamesPlayed?.value || 0) - (a.stats?.gamesPlayed?.value || 0))
        .map(map => ({
            name: map.metadata?.name || 'Unknown',
            gamesPlayed: map.stats?.gamesPlayed?.value || 0,
            winRate: calculateWinRate(map.stats?.wins?.value, map.stats?.losses?.value),
            combatScore: map.stats?.combatScore?.displayValue
        }));
};

const calculateRRTrend = (trackerData) => {
    if (!trackerData.segments?.[0]) return 'stable';
    const currentRR = trackerData.segments[0].stats?.rr?.value || 0;
    // Necesitaría histórico de RR para hacer trend real
    return 'stable';
};

/**
 * Cache para reducir llamadas a API
 */
const statsCache = new Map();
const CACHE_TTL = 3600000; // 1 hora

export const getStatsWithCache = async (identifier, game = 'lol', forceRefresh = false) => {
    const cacheKey = `${game}:${identifier}`;

    if (!forceRefresh && statsCache.has(cacheKey)) {
        const cached = statsCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL) {
            return cached.data;
        }
    }

    let data;
    if (game.toLowerCase() === 'lol') {
        data = await getLeagueOfLegendsStats(identifier);
    } else if (game.toLowerCase() === 'valorant') {
        const [gameName, tagLine] = identifier.split('#');
        data = await getValorantStats(gameName, tagLine);
    }

    statsCache.set(cacheKey, {
        data,
        timestamp: Date.now()
    });

    return data;
};

export default {
    getLeagueOfLegendsStats,
    getValorantStats,
    buildPublicStats,
    buildDetailedStats,
    getStatsWithCache
};
