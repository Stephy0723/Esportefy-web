import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LoaderCircle, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * Componente para mostrar estadísticas de Tracker Network
 * Maneja dos niveles de visualización: público y admin
 */

const TrackerNetworkStats = ({ playerIdentifier, game = 'lol', forceRefresh = false }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        fetchPlayerStats();
        // Check si el usuario es admin
        const userRole = localStorage.getItem('userRole');
        setIsAdmin(userRole === 'admin');
    }, [playerIdentifier, game, forceRefresh]);

    const fetchPlayerStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem('authToken');

            const response = await axios.get(
                `/api/stats/player/${game}/${encodeURIComponent(playerIdentifier)}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: forceRefresh ? { force: 'true' } : {}
                }
            );

            setStats(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al obtener estadísticas');
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoaderCircle className="animate-spin w-8 h-8" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-semibold text-red-900">Error</h3>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-gray-500">No se encontraron datos</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold">{playerIdentifier}</h2>
                        <p className="text-blue-100 mt-1">{stats.platform}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-100">Actualizado:</p>
                        <p className="text-xs">
                            {new Date(stats.lastUpdated).toLocaleDateString('es-ES')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Permiso Info */}
            {isAdmin && stats.permissionLevel === 'admin' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                        📊 Estás viendo datos administrativos (completos). Otros usuarios solo ven stats públicas.
                    </p>
                </div>
            )}

            {/* Rank Info - Visible para todos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Rango</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.rank.tier}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">LP/RR</p>
                    <p className="text-2xl font-bold">{stats.rank.lp}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Victorias</p>
                    <p className="text-2xl font-bold text-green-600">{stats.rank.wins}</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Derrotas</p>
                    <p className="text-2xl font-bold text-red-600">{stats.rank.losses}</p>
                </div>
            </div>

            {/* Winrate */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Tasa de Victoria</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-4xl font-bold text-blue-600">{stats.winRate}%</p>
                    </div>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600"
                            style={{ width: `${Math.min(stats.winRate, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Main Champions/Agents - Visible para todos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                    {game.toLowerCase() === 'lol' ? 'Campeones Principales' : 'Agentes Principales'}
                </h3>
                <div className="space-y-3">
                    {stats.mainChampions?.map((champ, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                                <p className="font-semibold">{champ.name}</p>
                                <p className="text-sm text-gray-600">
                                    {champ.gamesPlayed} juegos • Rol: {champ.mainRole}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-blue-600">{champ.winRate}%</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DATOS ADMIN - Solo si isAdmin y permissionLevel === 'admin' */}
            {isAdmin && stats.permissionLevel === 'admin' && (
                <>
                    {/* Performance Detallada */}
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4">🔒 Análisis de Performance (Admin)</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {stats.performance?.kda && (
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">KDA</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.performance.kda}</p>
                                </div>
                            )}
                            {stats.performance?.killsPerGame && (
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">Kills/Juego</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {stats.performance.killsPerGame}
                                    </p>
                                </div>
                            )}
                            {stats.performance?.deathsPerGame && (
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">Muertes/Juego</p>
                                    <p className="text-2xl font-bold">{stats.performance.deathsPerGame}</p>
                                </div>
                            )}
                            {stats.performance?.assistsPerGame && (
                                <div className="bg-green-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">Asistencias/Juego</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats.performance.assistsPerGame}
                                    </p>
                                </div>
                            )}
                            {stats.performance?.csPerMinute && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">CS/min</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {stats.performance.csPerMinute}
                                    </p>
                                </div>
                            )}
                            {stats.performance?.goldPerMinute && (
                                <div className="bg-yellow-50 rounded-lg p-4">
                                    <p className="text-gray-600 text-sm">Oro/min</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {stats.performance.goldPerMinute}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Todos los Campeones */}
                    {stats.champions?.mostPlayed && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">
                                🔒 Top 10 {game.toLowerCase() === 'lol' ? 'Campeones' : 'Agentes'} (Admin)
                            </h3>
                            <div className="space-y-2">
                                {stats.champions.mostPlayed.map((champ, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-2 text-sm">
                                        <span className="font-medium">{idx + 1}. {champ.name}</span>
                                        <span className="text-gray-600">
                                            {champ.gamesPlayed} games • {champ.winRate}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trends */}
                    {stats.trends && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4">🔒 Tendencias (Admin)</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <span className="font-medium">Tendencia de LP</span>
                                    <span className="flex items-center gap-2">
                                        {stats.trends.lpTrend === 'rising' && (
                                            <>
                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                                <span className="text-green-600 font-semibold">Subiendo</span>
                                            </>
                                        )}
                                        {stats.trends.lpTrend === 'falling' && (
                                            <>
                                                <TrendingDown className="w-5 h-5 text-red-600" />
                                                <span className="text-red-600 font-semibold">Bajando</span>
                                            </>
                                        )}
                                        {stats.trends.lpTrend === 'stable' && (
                                            <span className="text-gray-600">Estable</span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <span className="font-medium">Nivel de Habilidad</span>
                                    <span className="font-semibold text-blue-600">
                                        {stats.skillAssessment}
                                    </span>
                                </div>
                                {stats.competitive?.gamesPlayed && (
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <span className="font-medium">Juegos Jugados</span>
                                        <span className="font-semibold">{stats.competitive.gamesPlayed}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Refresh Button */}
            <button
                onClick={() => fetchPlayerStats()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
                Actualizar Datos
            </button>
        </div>
    );
};

export default TrackerNetworkStats;
