import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useLang } from '../../context/LanguageContext';
import './StatsPage.css';
import StatsDisplay from './StatsDisplay';
import './StatsDisplay.css';
import TrackerNetworkStats from '../../components/Stats/TrackerNetworkStats';
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
  const { t } = useLang();
  const games = Array.isArray(user?.selectedGames) ? user.selectedGames.slice(0, 3) : [];

  return (
    <button
      type="button"
      className={`stats-user-card ${selected ? 'stats-user-card--selected' : ''}`}
      onClick={() => onSelect(user)}
    >
      <img
        src={resolveMediaUrl(user?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=101318&color=7cff6b`}
        alt={user?.username || t('statsPlayerFallback')}
        className="stats-user-card__avatar"
      />

      <div className="stats-user-card__body">
        <div className="stats-user-card__top">
          <strong>{user?.username || t('statsPlayerFallback')}</strong>
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
            <span className="stats-user-card__game stats-user-card__game--muted">{t('statsNoPublicGames')}</span>
          )}
        </div>
      </div>
    </button>
  );
};

function StatsPage() {
  const { t } = useLang();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Tracker Network States
  const [trackerGame, setTrackerGame] = useState('lol');
  const [trackerIdentifier, setTrackerIdentifier] = useState('');
  const [showTrackerStats, setShowTrackerStats] = useState(false);

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
        <h1>{t('statsAdminTitle')}</h1>
        <p>{t('statsAdminDesc')}</p>
      </header>

      <div className="stats-page-summary">
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">{t('statsLabelAccess')}</span>
          <strong>{t('statsAdminOnly')}</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">{t('statsLabelSelectedProfile')}</span>
          <strong>{selectedUser?.username || t('none')}</strong>
        </div>
        <div className="stats-page-summary__item">
          <span className="stats-page-summary__label">{t('statsLabelCoverage')}</span>
          <strong>LoL, VALORANT y MLBB</strong>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="stats-search-form stats-search-form--admin">
        <div className="form-group form-group--wide">
          <label htmlFor="user-search-input">{t('statsSearchUser')}</label>
          <input
            id="user-search-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t('statsSearchPlaceholder')}
          />
          <div className="stats-input-helper">{t('statsSearchHelper')}</div>
        </div>

        <button type="submit" disabled={searchLoading}>
          {searchLoading ? t('statsSearching') : t('statsSearchBtn')}
        </button>
      </form>

      <section className="stats-user-picker">
        <div className="stats-user-picker__header">
          <h2>{t('statsUsers')}</h2>
          <span>{searchResults.length > 0 ? `${searchResults.length} ${t('statsResults')}` : t('statsNoResults')}</span>
        </div>

        {searchLoading ? (
          <div className="stats-loading">{t('statsSearchingUsers')}</div>
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
          <div className="stats-empty-state">{t('statsNoUsers')}</div>
        )}
      </section>

      {selectedUser ? (
        <div className="stats-selected-banner">
          <span className="stats-selected-banner__label">{t('statsAnalyzing')}</span>
          <strong>{selectedUser.username}</strong>
          {selectedUser.email ? <span className="stats-selected-banner__meta">{selectedUser.email}</span> : null}
        </div>
      ) : null}

      {error ? <div className="stats-error-message">{error}</div> : null}

      {statsLoading ? <div className="stats-loading">{t('statsLoadingProfile')}</div> : null}

      {!statsLoading && !stats && !error ? (
        <div className="stats-empty-state">{t('statsSelectUser')}</div>
      ) : null}

      {stats ? (
        <>
          <StatsDisplay stats={stats} />
          
          <section className="stats-tracker-network-section">
            <div className="stats-tracker-network-header">
              <h2>{t('statsLiveTrackerTitle')}</h2>
              <p>{t('statsLiveTrackerDesc')}</p>
            </div>

            <div className="stats-tracker-network-controls">
              <div className="form-group">
                <label htmlFor="tracker-game-select">{t('statsGameLabel')}</label>
                <select
                  id="tracker-game-select"
                  value={trackerGame}
                  onChange={(e) => setTrackerGame(e.target.value)}
                >
                  <option value="lol">League of Legends</option>
                  <option value="valorant">Valorant</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tracker-identifier-input">
                  {trackerGame === 'lol' ? 'Summoner Name' : 'Game Name'}
                </label>
                <input
                  id="tracker-identifier-input"
                  type="text"
                  value={trackerIdentifier}
                  onChange={(e) => setTrackerIdentifier(e.target.value)}
                  placeholder={trackerGame === 'lol' ? 'Ej: Faker' : 'Ej: PlayerName#NA1'}
                />
              </div>

              <button
                type="button"
                onClick={() => setShowTrackerStats(!showTrackerStats)}
                disabled={!trackerIdentifier}
              >
                {showTrackerStats ? t('statsHide') : t('statsLoad')} {t('statsTrackerStats')}
              </button>
            </div>

            {showTrackerStats && trackerIdentifier ? (
              <div className="stats-tracker-network-display">
                <TrackerNetworkStats
                  game={trackerGame}
                  identifier={trackerIdentifier}
                />
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}

export default StatsPage;
