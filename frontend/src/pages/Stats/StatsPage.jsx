import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import './StatsPage.css';
import StatsDisplay from './StatsDisplay';
import './StatsDisplay.css';
import { API_URL } from '../../config/api';
import { getAuthToken } from '../../utils/authSession';
import { useAuth } from '../../context/AuthContext';
import { resolveMediaUrl } from '../../utils/media';

const SEARCH_LIMIT = 12;

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeUserPreview = (user = {}) => ({
  _id: String(user?._id || user?.id || ''),
  username: String(user?.username || 'Usuario').trim() || 'Usuario',
  fullName: String(user?.fullName || '').trim(),
  email: String(user?.email || '').trim(),
  avatar: String(user?.avatar || '').trim(),
  selectedGames: Array.isArray(user?.selectedGames) ? user.selectedGames : [],
  status: String(user?.status || '').trim(),
  isAdmin: user?.isAdmin === true
});

const StatsUserCard = ({ user, selected, onSelect }) => {
  const games = Array.isArray(user?.selectedGames) ? user.selectedGames.slice(0, 3) : [];

  return (
    <button
      type="button"
      className={`stats-user-card ${selected ? 'stats-user-card--selected' : ''}`}
      onClick={() => onSelect(user)}
    >
      <img
        src={resolveMediaUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=101318&color=7cff6b`}
        alt={user?.username || 'Usuario'}
        className="stats-user-card__avatar"
      />

      <div className="stats-user-card__body">
        <div className="stats-user-card__top">
          <strong>{user?.username || 'Usuario'}</strong>
          {user?.isAdmin ? <span className="stats-user-card__badge">Admin</span> : null}
        </div>

        {user?.fullName ? <div className="stats-user-card__meta">{user.fullName}</div> : null}
        {user?.email ? <div className="stats-user-card__meta">{user.email}</div> : null}

        <div className="stats-user-card__games">
          {games.length > 0 ? (
            games.map((game) => (
              <span key={`${user?._id}-${game}`} className="stats-user-card__game">
                {game}
              </span>
            ))
          ) : (
            <span className="stats-user-card__game stats-user-card__game--muted">Sin juegos públicos</span>
          )}
        </div>
      </div>
    </button>
  );
};

function StatsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async (search = '') => {
    setSearchLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/api/auth/admin/users`, {
        headers: getAuthHeaders(),
        params: {
          search: String(search || '').trim(),
          page: 1,
          limit: SEARCH_LIMIT
        }
      });

      const users = Array.isArray(response.data?.items)
        ? response.data.items.map(normalizeUserPreview).filter((entry) => entry._id)
        : [];

      setSearchResults(users);
      return users;
    } catch (requestError) {
      const nextMessage =
        requestError?.response?.data?.message
        || requestError?.message
        || 'No se pudo cargar la lista de usuarios.';
      setError(nextMessage);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (userId) => {
    if (!userId) return;

    setStatsLoading(true);
    setStats(null);
    setError('');

    try {
      const response = await axios.get(`${API_URL}/api/game-stats/admin/users/${encodeURIComponent(userId)}`, {
        headers: getAuthHeaders()
      });
      setStats(response.data);
    } catch (requestError) {
      const nextMessage =
        requestError?.response?.data?.message
        || requestError?.message
        || 'No se pudieron cargar las estadisticas internas del perfil.';
      setError(nextMessage);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const initialUser = normalizeUserPreview(user);
    setSelectedUser(initialUser);

    fetchUsers('').catch(() => {});
    if (initialUser?._id) {
      fetchStats(initialUser._id);
    }
  }, [fetchStats, fetchUsers, user]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await fetchUsers(searchTerm);
  };

  const handleSelectUser = (nextUser) => {
    const normalized = normalizeUserPreview(nextUser);
    setSelectedUser(normalized);
    fetchStats(normalized._id);
  };

  return (
    <div className="stats-page-container">
      <header className="stats-page-header">
        <h1>Centro Admin de Stats</h1>
        <p>
          Vista privada para administradores. Consulta el estado real de las cuentas conectadas,
          sincronizaciones y verificaciones internas de LoL, VALORANT y MLBB por usuario.
        </p>
      </header>

      <div className="stats-page-summary">
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Acceso</span>
          <strong>Solo administradores</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Perfil seleccionado</span>
          <strong>{selectedUser?.username || 'Ninguno'}</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">Cobertura actual</span>
          <strong>LoL, VALORANT y MLBB</strong>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="stats-search-form stats-search-form--admin">
        <div className="form-group form-group--wide">
          <label htmlFor="user-search-input">Buscar usuario</label>
          <input
            id="user-search-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Username, email o nombre real"
          />
          <div className="stats-input-helper">
            Esta vista usa el directorio admin de usuarios y luego carga el resumen interno del perfil seleccionado.
          </div>
        </div>

        <button type="submit" disabled={searchLoading}>
          {searchLoading ? 'Buscando...' : 'Buscar usuario'}
        </button>
      </form>

      <section className="stats-user-picker">
        <div className="stats-user-picker__header">
          <h2>Usuarios</h2>
          <span>{searchResults.length > 0 ? `${searchResults.length} resultados` : 'Sin resultados'}</span>
        </div>

        {searchLoading ? (
          <div className="stats-loading">Buscando usuarios...</div>
        ) : searchResults.length > 0 ? (
          <div className="stats-user-picker__grid">
            {searchResults.map((entry) => (
              <StatsUserCard
                key={entry._id}
                user={entry}
                selected={selectedUser?._id === entry._id}
                onSelect={handleSelectUser}
              />
            ))}
          </div>
        ) : (
          <div className="stats-empty-state">
            No hay usuarios para mostrar con ese filtro.
          </div>
        )}
      </section>

      {selectedUser ? (
        <div className="stats-selected-banner">
          <span className="stats-selected-banner__label">Analizando</span>
          <strong>{selectedUser.username}</strong>
          {selectedUser.email ? <span className="stats-selected-banner__meta">{selectedUser.email}</span> : null}
        </div>
      ) : null}

      {error ? <div className="stats-error-message">{error}</div> : null}

      {statsLoading ? <div className="stats-loading">Cargando datos internos del perfil...</div> : null}

      {!statsLoading && !stats && !error ? (
        <div className="stats-empty-state">
          Selecciona un usuario para ver su estado competitivo y de verificación dentro de la plataforma.
        </div>
      ) : null}

      {stats ? <StatsDisplay stats={stats} /> : null}
    </div>
  );
}

export default StatsPage;
