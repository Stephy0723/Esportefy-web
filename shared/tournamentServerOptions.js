export const DEFAULT_TOURNAMENT_SERVER_OPTIONS = [
  { value: 'LATAM', label: 'LATAM' },
  { value: 'NA', label: 'Norteamerica (NA)' },
  { value: 'EU', label: 'Europa (EU)' },
  { value: 'BR', label: 'Brasil (BR)' },
  { value: 'ASIA', label: 'Asia' },
  { value: 'GLOBAL', label: 'Global / Internacional' }
];

export const TOURNAMENT_SERVER_OPTIONS_BY_GAME = {
  Valorant: [
    { value: 'LATAM', label: 'LATAM' },
    { value: 'NA', label: 'Norteamerica (NA)' },
    { value: 'EU', label: 'Europa (EU)' },
    { value: 'AP', label: 'Asia Pacifico (AP)' },
    { value: 'KR', label: 'Corea (KR)' }
  ],
  'League of Legends': [
    { value: 'LAN', label: 'LATAM Norte (LAN)' },
    { value: 'LAS', label: 'LATAM Sur (LAS)' },
    { value: 'NA', label: 'Norteamerica (NA)' },
    { value: 'BR', label: 'Brasil (BR)' },
    { value: 'EUW', label: 'Europa Oeste (EUW)' },
    { value: 'EUNE', label: 'Europa Noreste (EUNE)' },
    { value: 'KR', label: 'Corea (KR)' },
    { value: 'JP', label: 'Japon (JP)' },
    { value: 'OCE', label: 'Oceania (OCE)' }
  ],
  'Mobile Legends': [
    { value: 'LATAM', label: 'LATAM' },
    { value: 'NA', label: 'Norteamerica (NA)' },
    { value: 'PH', label: 'Filipinas (PH)' },
    { value: 'ID', label: 'Indonesia (ID)' },
    { value: 'MYSG', label: 'Malaysia / Singapore (MYSG)' },
    { value: 'MENA', label: 'MENA' },
    { value: 'GLOBAL', label: 'Global / Internacional' }
  ]
};

const normalize = (value = '') => String(value || '').trim().toUpperCase();

export const getTournamentServerOptions = (game = '', includeValue = '') => {
  const gameKey = String(game || '').trim();
  const baseOptions = TOURNAMENT_SERVER_OPTIONS_BY_GAME[gameKey] || DEFAULT_TOURNAMENT_SERVER_OPTIONS;
  const current = normalize(includeValue);
  if (!current) return baseOptions;
  const exists = baseOptions.some((option) => normalize(option.value) === current);
  if (exists) return baseOptions;
  return [{ value: String(includeValue || '').trim(), label: String(includeValue || '').trim() }, ...baseOptions];
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
