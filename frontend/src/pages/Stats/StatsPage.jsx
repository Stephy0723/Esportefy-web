import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StatsPage.css';
import StatsDisplay from './StatsDisplay';
import './StatsDisplay.css';
import { API_URL } from '../../config/api';
import { getAuthToken } from '../../utils/authSession';

const TRACKER_GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    trackerSupported: true,
    label: 'Riot ID',
    placeholder: 'Nombre#Tag',
    helper: 'Usa el Riot ID exacto del jugador para consultar su perfil en Tracker.'
  },
  {
    id: 'lol',
    name: 'League of Legends',
    trackerSupported: true,
    label: 'Riot ID',
    placeholder: 'Nombre#Tag',
    helper: 'League of Legends usa el mismo formato de Riot ID para esta integracion.'
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    trackerSupported: false,
    label: 'ID de jugador',
    placeholder: 'Player ID / Zone ID',
    helper: 'Tracker Network no ofrece soporte publico para MLBB en su API v2.'
  }
];

const EMPTY_LINKED_ACCOUNTS = {
  riotId: '',
  mlbbLabel: '',
  mlbbIgn: ''
};

const getGameConfig = (gameId) =>
  TRACKER_GAMES.find((entry) => entry.id === gameId) || TRACKER_GAMES[0];

const buildLinkedAccounts = (profile) => {
  const riot = profile?.connections?.riot || {};
  const mlbb = profile?.connections?.mlbb || {};

  const riotId =
    riot?.verified && riot?.gameName && riot?.tagLine
      ? `${riot.gameName}#${riot.tagLine}`
      : '';

  const mlbbLabel =
    mlbb?.verified && mlbb?.playerId && mlbb?.zoneId
      ? `${mlbb.playerId} / ${mlbb.zoneId}`
      : '';

  return {
    riotId,
    mlbbLabel,
    mlbbIgn: mlbb?.verified ? String(mlbb?.ign || '') : ''
  };
};

function StatsPage() {
  const [game, setGame] = useState(TRACKER_GAMES[0].id);
  const [playerIdentifier, setPlayerIdentifier] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedAccounts, setLinkedAccounts] = useState(EMPTY_LINKED_ACCOUNTS);
  const [linkedAccountsLoading, setLinkedAccountsLoading] = useState(true);

  const currentGame = getGameConfig(game);
  const canUseLinkedRiot = currentGame.trackerSupported && linkedAccounts.riotId;

  useEffect(() => {
    let ignore = false;

    const fetchLinkedAccounts = async () => {
      const token = getAuthToken();
      if (!token) {
        if (!ignore) setLinkedAccountsLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (ignore) return;

        const nextLinkedAccounts = buildLinkedAccounts(response.data);
        setLinkedAccounts(nextLinkedAccounts);

        if (nextLinkedAccounts.riotId) {
          setPlayerIdentifier((current) => current || nextLinkedAccounts.riotId);
        }
      } catch (fetchError) {
        if (!ignore) {
          console.error('No se pudieron cargar las cuentas vinculadas:', fetchError);
        }
      } finally {
        if (!ignore) setLinkedAccountsLoading(false);
      }
    };

    fetchLinkedAccounts();
    return () => {
      ignore = true;
    };
  }, []);

  const handleGameChange = (event) => {
    const nextGame = event.target.value;
    setGame(nextGame);
    setStats(null);
    setError('');

    const nextConfig = getGameConfig(nextGame);
    if (nextConfig.trackerSupported && linkedAccounts.riotId) {
      setPlayerIdentifier(linkedAccounts.riotId);
      return;
    }

    if (nextGame === 'mlbb' && linkedAccounts.mlbbLabel) {
      setPlayerIdentifier(linkedAccounts.mlbbLabel);
      return;
    }

    setPlayerIdentifier('');
  };

  const handleUseLinkedRiot = () => {
    if (!linkedAccounts.riotId) return;
    setPlayerIdentifier(linkedAccounts.riotId);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedIdentifier = String(playerIdentifier || '').trim();

    if (!currentGame.trackerSupported) {
      setStats(null);
      setError(currentGame.helper);
      return;
    }

    if (!trimmedIdentifier.includes('#')) {
      setStats(null);
      setError('Para Riot usa el formato completo Nombre#Tag.');
      return;
    }

    setLoading(true);
    setStats(null);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/tracker/${currentGame.id}/${encodeURIComponent(trimmedIdentifier)}`
      );
      setStats(response.data);
    } catch (requestError) {
      const errorMessage =
        requestError?.response?.data?.message
        || requestError?.message
        || 'Ocurrio un error al consultar Tracker Network.';
      setError(errorMessage);
      console.error('Error fetching stats:', requestError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stats-page-container">
      <header className="stats-page-header">
        <h1>Centro de Stats</h1>
        <p>
          Consulta el perfil competitivo real de nuestros juegos soportados y usa tu Riot ID
          vinculado cuando ya lo tengas conectado en Esportefy.
        </p>
      </header>

      <div className="stats-page-summary">
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Tracker activo</span>
          <strong>Valorant y LoL</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Catalogo actual</span>
          <strong>Valorant, LoL y MLBB</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Cuenta vinculada</span>
          <strong>{linkedAccounts.riotId || 'No detectada'}</strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stats-search-form">
        <div className="form-group">
          <label htmlFor="game-select">Juego</label>
          <select id="game-select" value={game} onChange={handleGameChange}>
            {TRACKER_GAMES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group form-group--wide">
          <label htmlFor="identifier-input">{currentGame.label}</label>
          <input
            id="identifier-input"
            type="text"
            value={playerIdentifier}
            onChange={(event) => setPlayerIdentifier(event.target.value)}
            placeholder={currentGame.placeholder}
            disabled={!currentGame.trackerSupported}
            required={currentGame.trackerSupported}
          />
          <div className="stats-input-helper">{currentGame.helper}</div>
        </div>

        <button type="submit" disabled={loading || !currentGame.trackerSupported}>
          {loading ? 'Consultando...' : 'Buscar perfil'}
        </button>
      </form>

      <div className="stats-linked-strip">
        {linkedAccountsLoading ? (
          <div className="stats-linked-strip__message">Detectando cuentas vinculadas...</div>
        ) : (
          <>
            {canUseLinkedRiot ? (
              <button
                type="button"
                className="stats-linked-strip__action"
                onClick={handleUseLinkedRiot}
              >
                Usar mi Riot vinculado: {linkedAccounts.riotId}
              </button>
            ) : (
              <div className="stats-linked-strip__message">
                No hay Riot ID vinculado disponible para autocompletar.
              </div>
            )}

            {linkedAccounts.mlbbLabel ? (
              <div className="stats-linked-strip__note">
                MLBB vinculado: {linkedAccounts.mlbbIgn || 'Jugador'} ({linkedAccounts.mlbbLabel})
              </div>
            ) : null}
          </>
        )}
      </div>

      {!currentGame.trackerSupported ? (
        <div className="stats-info-message">
          <strong>{currentGame.name}</strong> forma parte del producto, pero Tracker Network no lo
          soporta publicamente en su API v2. Para MLBB debes seguir usando la vinculacion interna y
          el perfil verificado dentro de Esportefy.
        </div>
      ) : null}

      {error ? <div className="stats-error-message">{error}</div> : null}

      {loading ? <div className="stats-loading">Cargando datos del jugador...</div> : null}

      {!loading && !stats && !error ? (
        <div className="stats-empty-state">
          Elige un juego, confirma el identificador y consulta el perfil para ver el resumen
          competitivo.
        </div>
      ) : null}

      {stats ? <StatsDisplay stats={stats} /> : null}
    </div>
  );
}

export default StatsPage;
