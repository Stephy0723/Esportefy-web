import axios from 'axios';
import User from '../models/User.js';

const CHAT_SERVICE_URL = (process.env.CHAT_SERVICE_URL || process.env.CHAT_URL || 'http://localhost:5001').replace(/\/+$/, '');

const clean = (value = '') => String(value || '').trim();
const toId = (value = null) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return clean(value?._id || value?.id || '');
  return clean(value);
};

const roleMapForTeam = (team = {}) => {
  const roles = new Map();
  const addRole = (userId, role) => {
    const key = toId(userId);
    if (!key) return;
    if (!roles.has(key) || roles.get(key) === 'Jugador') roles.set(key, clean(role) || 'Jugador');
  };

  addRole(team?.captain, 'Capitan');
  (Array.isArray(team?.roster?.starters) ? team.roster.starters : []).forEach((slot) => addRole(slot?.user, slot?.role || 'Titular'));
  (Array.isArray(team?.roster?.subs) ? team.roster.subs : []).forEach((slot) => addRole(slot?.user, slot?.role || 'Suplente'));
  if (team?.roster?.coach?.user) addRole(team.roster.coach.user, team?.roster?.coach?.role || 'Coach');

  return roles;
};

const photoMapForTeam = (team = {}) => {
  const photos = new Map();
  const addPhoto = (userId, photo) => {
    const key = toId(userId);
    const value = clean(photo);
    if (!key || !value || photos.has(key)) return;
    photos.set(key, value);
  };

  addPhoto(team?.captain?._id || team?.captain, team?.captain?.avatar);
  (Array.isArray(team?.roster?.starters) ? team.roster.starters : []).forEach((slot) => addPhoto(slot?.user, slot?.photo));
  (Array.isArray(team?.roster?.subs) ? team.roster.subs : []).forEach((slot) => addPhoto(slot?.user, slot?.photo));
  addPhoto(team?.roster?.coach?.user, team?.roster?.coach?.photo);

  return photos;
};

const collectParticipantIds = (team = {}) => Array.from(new Set([
  toId(team?.captain),
  ...(Array.isArray(team?.roster?.starters) ? team.roster.starters.map((slot) => toId(slot?.user)) : []),
  ...(Array.isArray(team?.roster?.subs) ? team.roster.subs.map((slot) => toId(slot?.user)) : []),
  toId(team?.roster?.coach?.user)
].filter(Boolean)));

export const syncTeamConversation = async (team = {}) => {
  const teamId = toId(team?._id || team?.id);
  if (!teamId) return null;

  const participantIds = collectParticipantIds(team);
  const roleMap = roleMapForTeam(team);
  const photoMap = photoMapForTeam(team);

  const users = participantIds.length
    ? await User.find({ _id: { $in: participantIds } })
      .select('_id username fullName avatar roles')
      .lean()
    : [];

  const usersMap = new Map(users.map((user) => [toId(user?._id), user]));
  const participantDetails = participantIds.map((userId) => {
    const user = usersMap.get(userId) || {};
    return {
      userId,
      username: clean(user?.username),
      fullName: clean(user?.fullName || user?.username || roleMap.get(userId) || 'Jugador'),
      avatar: clean(user?.avatar || photoMap.get(userId)),
      role: clean(roleMap.get(userId) || (Array.isArray(user?.roles) && user.roles[0]) || 'Jugador')
    };
  });

  const response = await axios.post(`${CHAT_SERVICE_URL}/conversations/ensure-team`, {
    teamId,
    title: clean(team?.name || 'Equipo'),
    image: clean(team?.logo),
    teamCode: clean(team?.teamCode),
    game: clean(team?.game),
    createdBy: toId(team?.captain),
    participants: participantIds,
    participantDetails
  }, {
    timeout: 5000
  });

  return response.data;
};

export const safeSyncTeamConversation = async (team = {}) => {
  try {
    // En desarrollo, solo log sin bloquear si chat-service no está disponible
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const result = await syncTeamConversation(team);
    return result;
  } catch (error) {
    // En desarrollo, solo warn. En producción, también.
    const isConnectionError = error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED');
    if (isConnectionError && process.env.NODE_ENV !== 'production') {
      console.info('[teamChatSync] Chat service not available (development mode) - team creation proceeds');
    } else {
      console.warn('[teamChatSync] sync failed:', error?.response?.data || error?.message || error);
    }
    return null;
  }
};

export const safeDeleteTeamConversation = async (teamId = '') => {
  const normalizedTeamId = toId(teamId);
  if (!normalizedTeamId) return false;

  try {
    await axios.delete(`${CHAT_SERVICE_URL}/conversations/team/${normalizedTeamId}`, {
      timeout: 5000
    });
    return true;
  } catch (error) {
    console.warn('[teamChatSync] delete failed:', error?.response?.data || error?.message || error);
    return false;
  }
};
