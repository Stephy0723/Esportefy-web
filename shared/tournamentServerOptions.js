import {
  DEFAULT_GAME_TOURNAMENT_SERVER_OPTIONS,
  GAME_POLICIES,
  getTournamentGameServerOptions,
} from './gamePolicies.js';

export const DEFAULT_TOURNAMENT_SERVER_OPTIONS = DEFAULT_GAME_TOURNAMENT_SERVER_OPTIONS.map((option) => ({
  ...option,
}));

export const TOURNAMENT_SERVER_OPTIONS_BY_GAME = Object.fromEntries(
  GAME_POLICIES.map((policy) => [policy.name, policy.tournamentServers.map((option) => ({ ...option }))])
);

const normalize = (value = '') => String(value || '').trim().toUpperCase();

export const getTournamentServerOptions = (game = '', includeValue = '') => {
  return getTournamentGameServerOptions(game, includeValue);
};

export const normalizeTournamentServer = (game = '', value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const options = getTournamentServerOptions(game);
  const match = options.find((option) => normalize(option.value) === normalize(raw));
  return match ? match.value : '';
};

export const isValidTournamentServer = (game = '', value = '') => {
  if (!String(value || '').trim()) return true;
  return Boolean(normalizeTournamentServer(game, value));
};
