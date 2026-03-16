// src/utils/scoreDistribution.js
// Sistema de puntuación para el ranking de jugadores

/**
 * Calcula el puntaje total de un jugador basado en sus logros y títulos.
 *
 * - Títulos (primer lugar): 100 puntos
 * - Segundo lugar: 40 puntos
 * - Tercer lugar: 20 puntos
 * - Top 8: 5 puntos
 * - Participación: 1 punto (si no hay podio)
 *
 * Los títulos valen mucho más que la cantidad de participaciones.
 * @param {Object} player - Objeto de jugador (del array PLAYERS_DATA)
 * @returns {number} Puntaje total calculado
 */
export function calculatePlayerScore(player) {
  let score = 0;
  const allAchievements = [];
  if (player.achievements) {
    if (player.achievements.solo) allAchievements.push(...player.achievements.solo);
    if (player.achievements.team) allAchievements.push(...player.achievements.team);
    if (player.achievements.duo) allAchievements.push(...player.achievements.duo);
  } else if (player.achievements && Array.isArray(player.achievements)) {
    allAchievements.push(...player.achievements);
  }

  for (const ach of allAchievements) {
    if (ach.place === 1) score += 100;
    else if (ach.place === 2) score += 40;
    else if (ach.place === 3) score += 20;
    else if (typeof ach.place === 'number' && ach.place <= 8) score += 5;
    else score += 1;
  }
  return score;
}

/**
 * Descripción de la distribución de puntos para mostrar en el UI.
 */
export const SCORE_DISTRIBUTION_INFO = [
  { label: 'Título (1er lugar)', points: 100 },
  { label: '2do lugar', points: 40 },
  { label: '3er lugar', points: 20 },
  { label: 'Top 8', points: 5 },
  { label: 'Participación', points: 1 },
];
