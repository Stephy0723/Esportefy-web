import axios from 'axios';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';

const API_BASE_URL = API_URL;

const buildAuthConfig = () => {
  const token = getAuthToken();
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    : {};
};

const normalizeStats = (stats = {}) => ({
  gameId: String(stats?.gameId || '').trim().toLowerCase(),
  usersCount: Number(stats?.usersCount || 0),
  activeCount: Number(stats?.activeCount || 0),
  joined: Boolean(stats?.joined)
});

export const formatGameHubCount = (value = 0) => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '0';
  if (amount >= 1000000) {
    const compact = amount / 1000000;
    return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1)}M`;
  }
  if (amount >= 1000) {
    const compact = amount / 1000;
    return `${compact >= 10 ? compact.toFixed(0) : compact.toFixed(1)}k`;
  }
  return String(Math.floor(amount));
};

export const fetchGameHubStatsIndex = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/community/games/stats`, buildAuthConfig());
  const list = Array.isArray(response.data?.stats) ? response.data.stats : [];
  return list.reduce((acc, entry) => {
    const normalized = normalizeStats(entry);
    if (!normalized.gameId) return acc;
    acc[normalized.gameId] = normalized;
    return acc;
  }, {});
};

export const fetchGameHubStats = async (gameId) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/community/games/${encodeURIComponent(String(gameId || ''))}/stats`,
    buildAuthConfig()
  );
  return normalizeStats(response.data?.stats || {});
};

export const joinGameHub = async (gameId) => {
  const response = await axios.post(
    `${API_BASE_URL}/api/community/games/${encodeURIComponent(String(gameId || ''))}/join`,
    {},
    buildAuthConfig()
  );
  return {
    stats: normalizeStats(response.data?.stats || {}),
    alreadyJoined: Boolean(response.data?.alreadyJoined)
  };
};

export const fetchGameHubDetails = async (gameId) => {
  const response = await axios.get(
    `${API_BASE_URL}/api/community/games/${encodeURIComponent(String(gameId || ''))}/details`,
    buildAuthConfig()
  );
  const d = response.data || {};
  return {
    stats: normalizeStats(d.stats || {}),
    teams: Array.isArray(d.teams) ? d.teams : [],
    tournaments: Array.isArray(d.tournaments) ? d.tournaments : [],
    communities: Array.isArray(d.communities) ? d.communities : [],
    organizers: Array.isArray(d.organizers) ? d.organizers : [],
  };
};

export const getGameIdFromRoutePath = (pathname = '') => {
  const match = String(pathname || '').match(/^\/(?:game|games)\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : '';
};
