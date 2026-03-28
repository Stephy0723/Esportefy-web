import {
  SUPPORTED_GAMES,
  getSupportedGame,
} from './supportedGames.js';

const TEAM_CATEGORY_LABELS = Object.freeze({
  FPS: 'FPS (Shooters)',
  MOBA: 'MOBA',
  BR: 'Battle Royale',
  Sports: 'Sports & Racing',
  Fighting: 'Fighting',
});

const PLATFORM_LABELS = Object.freeze({
  PC: 'PC',
  Mobile: 'Mobile',
  Console: 'Consola',
  Crossplay: 'Crossplay',
});

export const DEFAULT_GAME_TOURNAMENT_SERVER_OPTIONS = Object.freeze([
  { value: 'LATAM', label: 'LATAM' },
  { value: 'NA', label: 'Norteamerica (NA)' },
  { value: 'EU', label: 'Europa (EU)' },
  { value: 'BR', label: 'Brasil (BR)' },
  { value: 'ASIA', label: 'Asia' },
  { value: 'GLOBAL', label: 'Global / Internacional' },
]);

const DEFAULT_GAME_TOURNAMENT_SERIES = Object.freeze(['BO1', 'BO3', 'BO5']);

const cloneOptionList = (options = []) =>
  (Array.isArray(options) ? options : [])
    .map((option) => {
      const value = String(option?.value || option || '').trim();
      const label = String(option?.label || option?.value || option || '').trim();
      if (!value || !label) return null;
      return { value, label };
    })
    .filter(Boolean);

const cloneStringList = (values = []) =>
  (Array.isArray(values) ? values : [])
    .map((value) => String(value || '').trim())
    .filter(Boolean);

const normalizeChoice = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase();

const dedupeStringList = (values = []) => {
  const seen = new Set();
  const result = [];

  cloneStringList(values).forEach((value) => {
    const key = normalizeChoice(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(value);
  });

  return result;
};

const dedupeOptionList = (options = []) => {
  const seen = new Set();
  const result = [];

  cloneOptionList(options).forEach((option) => {
    const key = normalizeChoice(option.value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    result.push(option);
  });

  return result;
};

const GAME_POLICY_OVERRIDES = Object.freeze({
  valorant: {
    teamSize: 5,
    maxSubs: 2,
    tournamentPlatforms: ['PC'],
    defaultPlatform: 'PC',
    tournamentModalities: ['5v5'],
    defaultModality: '5v5',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'AP', label: 'Asia Pacifico (AP)' },
      { value: 'KR', label: 'Corea (KR)' },
    ],
    tournamentMaps: [
      'Ascent',
      'Bind',
      'Haven',
      'Split',
      'Icebox',
      'Lotus',
      'Sunset',
      'Breeze',
      'Fracture',
      'Pearl',
      'Abyss',
    ],
    tournamentColor: '#ff4655',
    tournamentIcon: 'bx-crosshair',
    tournamentCategory: 'FPS',
  },
  lol: {
    teamSize: 5,
    maxSubs: 2,
    tournamentPlatforms: ['PC'],
    defaultPlatform: 'PC',
    tournamentModalities: ['5v5'],
    defaultModality: '5v5',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'LAN', label: 'LATAM Norte (LAN)' },
      { value: 'LAS', label: 'LATAM Sur (LAS)' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'BR', label: 'Brasil (BR)' },
      { value: 'EUW', label: 'Europa Oeste (EUW)' },
      { value: 'EUNE', label: 'Europa Noreste (EUNE)' },
      { value: 'KR', label: 'Corea (KR)' },
      { value: 'JP', label: 'Japon (JP)' },
      { value: 'OCE', label: 'Oceania (OCE)' },
    ],
    tournamentMaps: ["Summoner's Rift", 'Howling Abyss'],
    tournamentColor: '#0ac8b9',
    tournamentIcon: 'bx-world',
    tournamentCategory: 'MOBA',
  },
  mlbb: {
    teamSize: 5,
    maxSubs: 3,
    tournamentPlatforms: ['Mobile'],
    defaultPlatform: 'Mobile',
    tournamentModalities: ['5v5'],
    defaultModality: '5v5',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'PH', label: 'Filipinas (PH)' },
      { value: 'ID', label: 'Indonesia (ID)' },
      { value: 'MYSG', label: 'Malaysia / Singapore (MYSG)' },
      { value: 'MENA', label: 'MENA' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: ['Land of Dawn'],
    tournamentColor: '#00d2ff',
    tournamentIcon: 'bx-mobile-landscape',
    tournamentCategory: 'MOBA',
  },
  fortnite: {
    teamSize: 4,
    maxSubs: 2,
    tournamentPlatforms: ['Crossplay', 'PC', 'Console'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['4v4'],
    defaultModality: '4v4',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'NAC', label: 'Norteamerica Central (NAC)' },
      { value: 'NAE', label: 'Norteamerica Este (NAE)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'BR', label: 'Brasil (BR)' },
      { value: 'OCE', label: 'Oceania (OCE)' },
      { value: 'ASIA', label: 'Asia' },
      { value: 'ME', label: 'Oriente Medio (ME)' },
    ],
    tournamentMaps: ['Battle Royale', 'Zero Build', 'Reload'],
    tournamentColor: '#22c55e',
    tournamentIcon: 'bx-target-lock',
    tournamentCategory: 'BR',
  },
  warzone: {
    teamSize: 4,
    maxSubs: 2,
    tournamentPlatforms: ['Crossplay', 'PC', 'Console'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['4v4'],
    defaultModality: '4v4',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'BR', label: 'Brasil (BR)' },
      { value: 'MENA', label: 'MENA' },
      { value: 'ASIA', label: 'Asia' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: ['Battle Royale', 'Resurgence', 'Private Lobby'],
    tournamentColor: '#4caf50',
    tournamentIcon: 'bx-target-lock',
    tournamentCategory: 'BR',
  },
  rocket: {
    teamSize: 3,
    maxSubs: 1,
    tournamentPlatforms: ['Crossplay', 'PC', 'Console'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['3v3'],
    defaultModality: '3v3',
    tournamentSeries: ['BO3', 'BO5', 'BO7'],
    defaultSeries: 'BO5',
    tournamentServers: [
      { value: 'USE', label: 'US East (USE)' },
      { value: 'USW', label: 'US West (USW)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'SAM', label: 'South America (SAM)' },
      { value: 'OCE', label: 'Oceania (OCE)' },
      { value: 'ASIA', label: 'Asia' },
      { value: 'ME', label: 'Oriente Medio (ME)' },
    ],
    tournamentMaps: [
      'DFH Stadium',
      'Champions Field',
      'Mannfield',
      'Utopia Coliseum',
      'Neo Tokyo',
    ],
    tournamentColor: '#0088ff',
    tournamentIcon: 'bx-football',
    tournamentCategory: 'Sports',
  },
  fifa: {
    teamSize: 1,
    maxSubs: 1,
    tournamentPlatforms: ['Console', 'PC', 'Crossplay'],
    defaultPlatform: 'Console',
    tournamentModalities: ['1v1'],
    defaultModality: '1v1',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [],
    tournamentColor: '#22c55e',
    tournamentIcon: 'bx-football',
    tournamentCategory: 'Sports',
  },
  smash: {
    teamSize: 1,
    maxSubs: 1,
    tournamentPlatforms: ['Console'],
    defaultPlatform: 'Console',
    tournamentModalities: ['1v1'],
    defaultModality: '1v1',
    tournamentSeries: ['FT2', 'FT3', 'BO5'],
    defaultSeries: 'FT2',
    tournamentServers: [
      { value: 'LOCAL', label: 'Presencial / Local' },
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Battlefield',
      'Final Destination',
      'Pokemon Stadium 2',
      'Smashville',
      'Hollow Bastion',
    ],
    tournamentColor: '#f59e0b',
    tournamentIcon: 'bx-joystick',
    tournamentCategory: 'Fighting',
  },
});

const INTERNAL_GAME_POLICIES = SUPPORTED_GAMES.map((game) => {
  const override = GAME_POLICY_OVERRIDES[game.id] || {};
  const tournamentPlatforms = dedupeStringList(override.tournamentPlatforms || ['PC']);
  const tournamentModalities = dedupeStringList(override.tournamentModalities || ['1v1']);
  const tournamentSeries = dedupeStringList(override.tournamentSeries || DEFAULT_GAME_TOURNAMENT_SERIES);
  const tournamentServers = dedupeOptionList(
    override.tournamentServers?.length ? override.tournamentServers : DEFAULT_GAME_TOURNAMENT_SERVER_OPTIONS
  );
  const tournamentMaps = dedupeStringList(override.tournamentMaps || []);

  return Object.freeze({
    id: game.id,
    name: game.name,
    short: game.short,
    categories: Object.freeze(cloneStringList(game.categories)),
    roles: Object.freeze(cloneStringList(game.roles)),
    teamCategory: override.teamCategory || TEAM_CATEGORY_LABELS[game.categories[0]] || game.categories[0] || 'General',
    teamSize: Number(override.teamSize) > 0 ? Number(override.teamSize) : 1,
    maxSubs: Number(override.maxSubs) >= 0 ? Number(override.maxSubs) : 0,
    leaderRole: String(override.leaderRole || game.roles[0] || '').trim(),
    tournamentPlatforms: Object.freeze(tournamentPlatforms),
    defaultPlatform: tournamentPlatforms.includes(override.defaultPlatform) ? override.defaultPlatform : tournamentPlatforms[0] || 'PC',
    tournamentModalities: Object.freeze(tournamentModalities),
    defaultModality: tournamentModalities.includes(override.defaultModality) ? override.defaultModality : tournamentModalities[0] || '1v1',
    tournamentSeries: Object.freeze(tournamentSeries),
    defaultSeries: tournamentSeries.includes(override.defaultSeries) ? override.defaultSeries : tournamentSeries[0] || 'BO3',
    tournamentServers: Object.freeze(tournamentServers),
    tournamentMaps: Object.freeze(tournamentMaps),
    tournamentColor: String(override.tournamentColor || '#8EDB15').trim(),
    tournamentIcon: String(override.tournamentIcon || 'bx-joystick').trim(),
    tournamentCategory: String(override.tournamentCategory || game.categories[0] || 'General').trim(),
  });
});

const GAME_POLICY_BY_ID = new Map(INTERNAL_GAME_POLICIES.map((policy) => [policy.id, policy]));

const clonePolicy = (policy) => ({
  ...policy,
  categories: [...policy.categories],
  roles: [...policy.roles],
  tournamentPlatforms: [...policy.tournamentPlatforms],
  tournamentModalities: [...policy.tournamentModalities],
  tournamentSeries: [...policy.tournamentSeries],
  tournamentServers: cloneOptionList(policy.tournamentServers),
  tournamentMaps: [...policy.tournamentMaps],
});

const withIncludedStringOption = (values = [], includeValue = '') => {
  const normalizedInclude = String(includeValue || '').trim();
  if (!normalizedInclude) return dedupeStringList(values);
  return dedupeStringList([normalizedInclude, ...values]);
};

const withIncludedObjectOption = (options = [], includeValue = '') => {
  const normalizedInclude = String(includeValue || '').trim();
  if (!normalizedInclude) return dedupeOptionList(options);

  const exists = options.some((option) => normalizeChoice(option.value) === normalizeChoice(normalizedInclude));
  if (exists) return dedupeOptionList(options);

  return dedupeOptionList([{ value: normalizedInclude, label: normalizedInclude }, ...options]);
};

const getPolicyOrNull = (value = '') => {
  const game = getSupportedGame(value);
  if (!game) return null;
  return GAME_POLICY_BY_ID.get(game.id) || null;
};

export const GAME_POLICIES = Object.freeze(INTERNAL_GAME_POLICIES.map(clonePolicy));

export const getGamePolicy = (value = '') => {
  const policy = getPolicyOrNull(value);
  return policy ? clonePolicy(policy) : null;
};

export const getAllGamePolicies = () => GAME_POLICIES.map(clonePolicy);

export const getTeamGameRules = (game = '') => {
  const policy = getGamePolicy(game);
  if (!policy) return null;

  return {
    teamCategory: policy.teamCategory,
    maxPlayers: policy.teamSize,
    maxSubs: policy.maxSubs,
    leaderRole: policy.leaderRole,
    roles: [...policy.roles],
  };
};

export const getTournamentGameDefaults = (game = '') => {
  const policy = getGamePolicy(game);
  if (!policy) {
    return {
      platform: 'PC',
      modality: '',
      seriesType: 'BO3',
      server: '',
      mapPool: [],
    };
  }

  return {
    platform: policy.defaultPlatform,
    modality: policy.defaultModality,
    seriesType: policy.defaultSeries,
    server: '',
    mapPool: [],
  };
};

export const getTournamentGamePlatformOptions = (game = '', includeValue = '') => {
  const policy = getGamePolicy(game);
  const values = withIncludedStringOption(policy?.tournamentPlatforms || ['PC'], includeValue);
  return values.map((value) => ({ value, label: PLATFORM_LABELS[value] || value }));
};

export const normalizeTournamentGamePlatform = (game = '', value = '') => {
  const raw = String(value || '').trim();
  const options = getTournamentGamePlatformOptions(game);
  const match = options.find((option) => normalizeChoice(option.value) === normalizeChoice(raw));
  if (match) return match.value;
  return raw && !game ? raw : getTournamentGameDefaults(game).platform;
};

export const isValidTournamentGamePlatform = (game = '', value = '') => {
  if (!String(value || '').trim()) return true;
  return Boolean(
    getTournamentGamePlatformOptions(game).find(
      (option) => normalizeChoice(option.value) === normalizeChoice(value)
    )
  );
};

export const getTournamentGameModalityOptions = (game = '', includeValue = '') =>
  withIncludedStringOption(getGamePolicy(game)?.tournamentModalities || [], includeValue).map((value) => ({
    value,
    label: value,
  }));

export const normalizeTournamentGameModality = (game = '', value = '') => {
  const raw = String(value || '').trim();
  const options = getTournamentGameModalityOptions(game);
  const match = options.find((option) => normalizeChoice(option.value) === normalizeChoice(raw));
  if (match) return match.value;
  return raw && !game ? raw : getTournamentGameDefaults(game).modality;
};

export const isValidTournamentGameModality = (game = '', value = '') => {
  if (!String(value || '').trim()) return true;
  return Boolean(
    getTournamentGameModalityOptions(game).find(
      (option) => normalizeChoice(option.value) === normalizeChoice(value)
    )
  );
};

export const getTournamentGameSeriesOptions = (game = '', includeValue = '') =>
  withIncludedStringOption(getGamePolicy(game)?.tournamentSeries || DEFAULT_GAME_TOURNAMENT_SERIES, includeValue).map(
    (value) => ({
      value,
      label: value,
    })
  );

export const normalizeTournamentGameSeries = (game = '', value = '') => {
  const raw = String(value || '').trim();
  const options = getTournamentGameSeriesOptions(game);
  const match = options.find((option) => normalizeChoice(option.value) === normalizeChoice(raw));
  if (match) return match.value;
  return raw && !game ? raw : getTournamentGameDefaults(game).seriesType;
};

export const isValidTournamentGameSeries = (game = '', value = '') => {
  if (!String(value || '').trim()) return true;
  return Boolean(
    getTournamentGameSeriesOptions(game).find(
      (option) => normalizeChoice(option.value) === normalizeChoice(value)
    )
  );
};

export const getTournamentGameServerOptions = (game = '', includeValue = '') => {
  const policy = getGamePolicy(game);
  const baseOptions = policy?.tournamentServers?.length
    ? policy.tournamentServers
    : cloneOptionList(DEFAULT_GAME_TOURNAMENT_SERVER_OPTIONS);
  return withIncludedObjectOption(baseOptions, includeValue);
};
