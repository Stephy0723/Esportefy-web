import { getSupportedGame } from '../../../shared/supportedGames.js';
import {
  fetchTrackerProfile,
  getTrackerGameConfig,
  normalizeTrackerProfile
} from '../services/tracker.service.js';

/**
 * Obtiene las estadísticas de un jugador para un juego específico desde la API de Tracker Network.
 */
export const getStats = async (req, res) => {
  const { game, platformUserIdentifier } = req.params;
  const identifier = String(platformUserIdentifier || '').trim();

  const supportedGame = getSupportedGame(game);
  if (!supportedGame) {
    return res.status(400).json({ message: `El juego '${game}' no es soportado.` });
  }

  if (!identifier) {
    return res.status(400).json({ message: 'Debes indicar el identificador del jugador.' });
  }

  if ((supportedGame.id === 'valorant' || supportedGame.id === 'lol') && !identifier.includes('#')) {
    return res.status(400).json({
      message: 'Para Riot usa el formato completo Nombre#Tag.'
    });
  }

  const gameConfig = getTrackerGameConfig(supportedGame.id);
  if (!gameConfig) {
    return res.status(400).json({ message: `El juego '${game}' no es soportado.` });
  }

  if (!gameConfig.trackerSupported) {
    return res.status(501).json(normalizeTrackerProfile(supportedGame.id, null, identifier));
  }

  try {
    console.log(`[Tracker] Solicitando stats para '${identifier}' en '${supportedGame.id}'.`);
    const rawStats = await fetchTrackerProfile(supportedGame.id, identifier);
    const payload = normalizeTrackerProfile(supportedGame.id, rawStats, identifier);
    return res.status(200).json(payload);
  } catch (error) {
    const statusCode = Number(error?.response?.status || error?.status || 500);
    const trackerMessage =
      error?.response?.data?.message
      || error?.message
      || `Ocurrio un error al obtener los stats para '${identifier}'.`;

    if (error?.code === 'TRACKER_API_KEY_MISSING') {
      return res.status(503).json({ message: 'La integracion de Tracker no esta configurada en el backend.' });
    }

    if (statusCode === 404) {
      return res.status(404).json({
        message: `No se encontraron stats para '${identifier}'. Verifica el identificador del perfil.`
      });
    }

    return res.status(statusCode).json({ message: trackerMessage });
  }
};
