const cleanString = (value = '') => String(value || '').trim();

const stripPrefix = (value = '', prefix = '') => {
  const raw = cleanString(value).toUpperCase();
  return raw.replace(new RegExp(`^${prefix}-?`, 'i'), '').trim();
};

export const getPublicTeamCode = (team) => cleanString(team?.teamCode).toUpperCase();
export const getPublicTournamentCode = (tournament) => cleanString(tournament?.tournamentId).toUpperCase();

export const formatTeamPublicId = (team) => {
  const raw = getPublicTeamCode(team);
  if (!raw) return '';
  return `TEAM-${stripPrefix(raw, 'TEAM')}`;
};

export const formatTournamentPublicId = (tournament) => {
  const raw = getPublicTournamentCode(tournament);
  if (!raw) return '';
  return `TOR-${stripPrefix(raw, 'TOR')}`;
};

export const normalizePublicIdSearch = (value = '') =>
  cleanString(value)
    .toLowerCase()
    .replace(/^#/, '')
    .replace(/^(team-|tor-)\s*/i, '')
    .replace(/^(team-|tor-)\s*/i, '')
    .replace(/^(team|tor)[-_ ]/i, '')
    .replace(/\s+/g, '');

export const matchesTeamPublicId = (team, query = '') => {
  const normalizedQuery = normalizePublicIdSearch(query);
  const raw = getPublicTeamCode(team).toLowerCase();
  const stripped = stripPrefix(raw, 'team').toLowerCase().replace(/\s+/g, '');
  const literal = cleanString(query).toLowerCase().replace(/^#/, '');
  if (!literal) return false;
  return raw.includes(literal) || stripped.includes(normalizedQuery);
};

export const matchesTournamentPublicId = (tournament, query = '') => {
  const normalizedQuery = normalizePublicIdSearch(query);
  const raw = getPublicTournamentCode(tournament).toLowerCase();
  const stripped = stripPrefix(raw, 'tor').toLowerCase().replace(/\s+/g, '');
  const literal = cleanString(query).toLowerCase().replace(/^#/, '');
  if (!literal) return false;
  return raw.includes(literal) || stripped.includes(normalizedQuery);
};
