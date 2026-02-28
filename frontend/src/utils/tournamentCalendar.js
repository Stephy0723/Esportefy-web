import axios from 'axios';
import { API_URL } from '../config/api';
import { GAME_IMAGES } from '../data/gameImages';
import { formatTournamentPublicId } from './publicIds';
import { resolveMediaUrl } from './media';

export const LOCAL_TOURNAMENTS_KEY = 'esportefy_local_tournaments';

const GAME_CONFIG = {
  'Valorant': { color: '#ff4655', icon: 'bx-crosshair' },
  'CS:GO 2': { color: '#de9b35', icon: 'bx-target-lock' },
  'Call of Duty': { color: '#54b946', icon: 'bx-run' },
  'Warzone': { color: '#54b946', icon: 'bx-radar' },
  'Fortnite': { color: '#a349a4', icon: 'bx-building' },
  'Free Fire': { color: '#f39c12', icon: 'bx-flame' },
  'PUBG': { color: '#f1c40f', icon: 'bx-target-lock' },
  'Apex Legends': { color: '#e74c3c', icon: 'bx-shield-quarter' },
  'Overwatch 2': { color: '#f39c12', icon: 'bx-shield' },
  'Rainbow Six Siege': { color: '#3498db', icon: 'bx-window' },
  'League of Legends': { color: '#c1a05e', icon: 'bx-world' },
  'Dota 2': { color: '#e74c3c', icon: 'bx-map-alt' },
  'Mobile Legends': { color: '#ffbf00', icon: 'bx-mobile-landscape' },
  'Honor of Kings': { color: '#e6b333', icon: 'bx-crown' },
  'Smite': { color: '#f1c40f', icon: 'bx-bolt-circle' },
  'Wild Rift': { color: '#00a8ff', icon: 'bx-mobile' },
  'FIFA 24': { color: '#2ecc71', icon: 'bx-football' },
  'NBA 2K24': { color: '#e67e22', icon: 'bx-basketball' },
  'Rocket League': { color: '#0088ff', icon: 'bx-car' },
  'Street Fighter 6': { color: '#f39c12', icon: 'bx-walk' },
  'Tekken 8': { color: '#c0392b', icon: 'bx-angry' },
  'Clash Royale': { color: '#3498db', icon: 'bx-crown' },
  'Teamfight Tactics': { color: '#f1c40f', icon: 'bx-grid' },
  'Hearthstone': { color: '#f39c12', icon: 'bx-book' },
  'Legends of Runeterra': { color: '#3498db', icon: 'bx-book-open' },
  'StarCraft II': { color: '#00a8ff', icon: 'bx-planet' }
};

const asString = (value = '') => String(value || '').trim();

const normalizeDateKey = (value = '') => {
  const raw = asString(value);
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateKey = '') => {
  if (!dateKey) return '';
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateKey;
  return parsed.toLocaleDateString();
};

export const getTournamentGameColor = (game = '') =>
  GAME_CONFIG[asString(game)]?.color || '#8EDB15';

export const getTournamentGameIcon = (game = '') =>
  GAME_CONFIG[asString(game)]?.icon || 'bx-trophy';

const getTournamentBanner = (tournament = {}) => {
  const uploadedBanner = asString(tournament.bannerImage);
  if (uploadedBanner) {
    return resolveMediaUrl(uploadedBanner);
  }
  return GAME_IMAGES[tournament.game] || GAME_IMAGES.Default;
};

const getOrganizerName = (organizer) => {
  if (organizer && typeof organizer === 'object') {
    return organizer.username || organizer.name || 'Organizador';
  }
  return asString(organizer) || 'Organizador';
};

const getLocationLabel = (tournament = {}) =>
  asString(tournament.server) || asString(tournament.platform) || 'Online';

export const normalizeTournamentCalendarEntry = (tournament = {}) => {
  const dateKey = normalizeDateKey(tournament.dateRaw || tournament.date);
  if (!dateKey || !tournament.tournamentId) return null;
  const color = getTournamentGameColor(tournament.game);
  return {
    id: tournament._id || tournament.id || tournament.tournamentId,
    tournamentId: tournament.tournamentId,
    codeLabel: formatTournamentPublicId(tournament),
    title: asString(tournament.title) || 'Torneo sin título',
    game: asString(tournament.game) || 'Torneo',
    date: formatDateLabel(dateKey),
    dateKey,
    time: asString(tournament.time),
    desc: asString(tournament.description || tournament.desc) || 'Sin descripción disponible.',
    org: getOrganizerName(tournament.organizer),
    loc: getLocationLabel(tournament),
    prize: asString(tournament.prizePool || tournament.prize),
    format: asString(tournament.format),
    color,
    icon: getTournamentGameIcon(tournament.game),
    bannerImage: getTournamentBanner(tournament),
    category: 'TORNEO'
  };
};

export const getLocalTournamentCalendarEntries = () => {
  try {
    const raw = localStorage.getItem(LOCAL_TOURNAMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.map(normalizeTournamentCalendarEntry).filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

export const loadTournamentCalendarEntries = async () => {
  const localEntries = getLocalTournamentCalendarEntries();
  try {
    const res = await axios.get(`${API_URL}/api/tournaments`);
    const remoteEntries = Array.isArray(res.data)
      ? res.data.map(normalizeTournamentCalendarEntry).filter(Boolean)
      : [];
    const merged = new Map();
    [...localEntries, ...remoteEntries].forEach((entry) => {
      if (entry?.tournamentId) merged.set(entry.tournamentId, entry);
    });
    return Array.from(merged.values()).sort((a, b) => {
      const dateDiff = a.dateKey.localeCompare(b.dateKey);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
  } catch {
    return localEntries.sort((a, b) => {
      const dateDiff = a.dateKey.localeCompare(b.dateKey);
      if (dateDiff !== 0) return dateDiff;
      return a.time.localeCompare(b.time);
    });
  }
};
