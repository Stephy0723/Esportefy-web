import { API_URL, CHAT_URL } from './api';

export const SERVICE_STATUS_ENDPOINTS = {
  gameServers: `${API_URL}/api/health`,
  tournamentApi: `${API_URL}/api/tournaments/health`,
  matchmaking: `${API_URL}/api/health`,
  liveChat: `${CHAT_URL}/health`,
};
