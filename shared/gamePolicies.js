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

const pluralize = (count, singular, plural) => {
  const safeCount = Number(count) || 0;
  return `${safeCount} ${safeCount === 1 ? singular : plural}`;
};

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
  brawlhalla: {
    teamSize: 1,
    maxSubs: 1,
    teamSummary: 'Roster ligero para duelistas 1v1 con foco en main legend, backup y lectura de matchups.',
    teamTips: [
      'Usa el suplente como segundo seed o backup para brackets largos.',
      'Define main legend y secondary antes de abrir reclutamiento.',
      'Si compiten crossplay, alinea input, ping y horario objetivo del roster.',
    ],
    teamStaffLabel: 'Coach / Corner',
    tournamentPlatforms: ['Crossplay', 'PC', 'Console', 'Mobile'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['1v1'],
    defaultModality: '1v1',
    tournamentSeries: ['FT2', 'FT3', 'BO5'],
    defaultSeries: 'FT2',
    tournamentSummary: 'Preset 1v1 para brackets rapidos con FT2 base y FT3/BO5 en etapas largas.',
    tournamentTips: [
      'Aclara stages legales, strike y side selection en el reglamento.',
      'Prioriza servidor LATAM o NA segun ping real del bracket.',
      'Pide screenshot del set solo cuando exista disputa o desync.',
    ],
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'SEA', label: 'Sudeste Asiatico (SEA)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Mammoth Fortress',
      'Small Brawlhaven',
      'Demon Island',
      'Apocalypse',
      'The Great Hall',
    ],
    tournamentColor: '#00bcd4',
    tournamentIcon: 'bx-joystick',
    tournamentCategory: 'Fighting',
  },
  sf6: {
    teamSize: 1,
    maxSubs: 1,
    teamSummary: 'Equipo 1v1 centrado en player principal, sparring y coaching de matchup.',
    teamTips: [
      'El suplente funciona como sparring o reemplazo para pools o finales.',
      'Publica el main character del titular si quieres scouting mas rapido.',
      'Coach / corner ayuda a revisar matchups, punishes y adaptaciones.',
    ],
    teamStaffLabel: 'Coach / Corner',
    tournamentPlatforms: ['Crossplay', 'PC', 'Console'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['1v1'],
    defaultModality: '1v1',
    tournamentSeries: ['FT2', 'FT3', 'BO5'],
    defaultSeries: 'FT2',
    tournamentSummary: 'Bracket 1v1 pensado para online o local con FT2 como base competitiva.',
    tournamentTips: [
      'Deja claro si semifinales y final suben a FT3 o BO5.',
      'Si el evento es local, usa LOCAL y fija side o station rules desde el inicio.',
      'Training Room o escenario neutro debe quedar definido antes de publicar.',
    ],
    tournamentServers: [
      { value: 'LOCAL', label: 'Presencial / Local' },
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'JP', label: 'Japon (JP)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Training Room',
      'Genbu Temple',
      'Carrier Byron Taylor',
      'Bathers Beach',
      'Metro City Downtown',
    ],
    tournamentColor: '#ff5e00',
    tournamentIcon: 'bx-boxing',
    tournamentCategory: 'Fighting',
  },
  tekken: {
    teamSize: 1,
    maxSubs: 1,
    teamSummary: 'Roster 1v1 para duelo directo con player titular, backup y soporte de coaching.',
    teamTips: [
      'El suplente sirve como reserva o second player para eventos largos.',
      'Mantener un coach / corner acelera adaptacion de matchup y stage control.',
      'Usa tryouts cortos porque el roster competitivo suele ser compacto.',
    ],
    teamStaffLabel: 'Coach / Corner',
    tournamentPlatforms: ['Crossplay', 'PC', 'Console'],
    defaultPlatform: 'Crossplay',
    tournamentModalities: ['1v1'],
    defaultModality: '1v1',
    tournamentSeries: ['FT2', 'FT3', 'BO5'],
    defaultSeries: 'FT2',
    tournamentSummary: 'Bracket 1v1 para online o local con sets rapidos y finals mas largas.',
    tournamentTips: [
      'Aclara stage select, rematch rules y side pick en el reglamento.',
      'Usa FT2 para pools y FT3 o BO5 para top cut si quieres mas lectura competitiva.',
      'Si es online, mantente en servidor regional para evitar rollback desigual.',
    ],
    tournamentServers: [
      { value: 'LOCAL', label: 'Presencial / Local' },
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'KR', label: 'Corea (KR)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Arena',
      'Urban Square',
      'Yakushima',
      'Coliseum of Fate',
      'Midnight Siege',
    ],
    tournamentColor: '#ffd700',
    tournamentIcon: 'bx-boxing',
    tournamentCategory: 'Fighting',
  },
  freefire: {
    teamSize: 4,
    maxSubs: 2,
    teamSummary: 'Squad mobile 4v4 pensado para IGL, entry pressure, scout y soporte de utility.',
    teamTips: [
      'Manten roles claros entre IGL, Fragger, Scout y Support para scrims y oficiales.',
      'Los suplentes sirven como quinto y sexto hombre para rotaciones y horarios.',
      'Confirma dispositivos, region y disponibilidad mobile antes de cerrar el roster.',
    ],
    teamStaffLabel: 'Staff / Analyst',
    tournamentPlatforms: ['Mobile'],
    defaultPlatform: 'Mobile',
    tournamentModalities: ['4v4'],
    defaultModality: '4v4',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentSummary: 'Preset mobile 4v4 con series BO3 y evidencia por lobby o sala privada.',
    tournamentTips: [
      'Define scoring por eliminaciones, rounds o placement antes de abrir registro.',
      'Bloquea map pool y staff de lobby para evitar cambios de ultima hora.',
      'Pide screenshots del resultado final si el torneo no usa API oficial.',
    ],
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'BR', label: 'Brasil (BR)' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'SEA', label: 'Sudeste Asiatico (SEA)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Bermuda',
      'Purgatory',
      'Kalahari',
      'Alpine',
      'Nexterra',
    ],
    tournamentColor: '#ffaa00',
    tournamentIcon: 'bx-target-lock',
    tournamentCategory: 'BR',
  },
  pubg: {
    teamSize: 4,
    maxSubs: 2,
    teamSummary: 'Squad mobile 4v4 para IGL, scout, fragger y support con foco en lobby play.',
    teamTips: [
      'Usa suplentes para cubrir horarios, fatigue y cambios de region.',
      'IGL y Scout deben quedar definidos antes del reclutamiento abierto.',
      'Verifica ping y estabilidad mobile de todos los titulares.',
    ],
    teamStaffLabel: 'Staff / Analyst',
    tournamentPlatforms: ['Mobile'],
    defaultPlatform: 'Mobile',
    tournamentModalities: ['4v4'],
    defaultModality: '4v4',
    tournamentSeries: ['BO1', 'BO3', 'BO5'],
    defaultSeries: 'BO3',
    tournamentSummary: 'Preset de squads mobile con BO3 y scoring por lobby definido por reglamento.',
    tournamentTips: [
      'Publica scoring de placement y kills si el evento usa custom rooms.',
      'Erangel, Miramar o Livik deben fijarse antes del check-in.',
      'Moderacion activa y evidencia visual son clave para disputas de lobby.',
    ],
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'MENA', label: 'MENA' },
      { value: 'SEA', label: 'Sudeste Asiatico (SEA)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Erangel',
      'Miramar',
      'Sanhok',
      'Vikendi',
      'Livik',
    ],
    tournamentColor: '#f2a93b',
    tournamentIcon: 'bx-target-lock',
    tournamentCategory: 'BR',
  },
  codm: {
    teamSize: 5,
    maxSubs: 2,
    teamSummary: 'Roster mobile 5v5 para slayers, objective players, anchor y flex con roles bien cerrados.',
    teamTips: [
      'Define slayer, objective, anchor, flex y support desde el primer dia.',
      'Los suplentes sirven para scrims, rotacion de modos y reemplazos por horario.',
      'Coach / analyst ayuda con veto, mode order y revision de minimap.',
    ],
    teamStaffLabel: 'Coach / Analyst',
    tournamentPlatforms: ['Mobile'],
    defaultPlatform: 'Mobile',
    tournamentModalities: ['5v5'],
    defaultModality: '5v5',
    tournamentSeries: ['BO3', 'BO5', 'BO7'],
    defaultSeries: 'BO5',
    tournamentSummary: 'Preset mobile 5v5 con BO5, rotacion de mapas y control fuerte del staff.',
    tournamentTips: [
      'Aclara el orden competitivo de modos y mapas antes de publicar.',
      'Usa BO5 para llaves principales y BO7 solo en finales o showmatches.',
      'Exige scoreboard o captura del resultado final cuando haya disputa.',
    ],
    tournamentServers: [
      { value: 'LATAM', label: 'LATAM' },
      { value: 'NA', label: 'Norteamerica (NA)' },
      { value: 'EU', label: 'Europa (EU)' },
      { value: 'SEA', label: 'Sudeste Asiatico (SEA)' },
      { value: 'GLOBAL', label: 'Global / Internacional' },
    ],
    tournamentMaps: [
      'Crossfire',
      'Firing Range',
      'Raid',
      'Standoff',
      'Summit',
    ],
    tournamentColor: '#ff7a00',
    tournamentIcon: 'bx-crosshair',
    tournamentCategory: 'FPS',
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
    teamSummary: String(override.teamSummary || '').trim(),
    teamTips: Object.freeze(cloneStringList(override.teamTips || [])),
    teamStaffLabel: String(override.teamStaffLabel || 'Staff / Coach').trim(),
    tournamentPlatforms: Object.freeze(tournamentPlatforms),
    defaultPlatform: tournamentPlatforms.includes(override.defaultPlatform) ? override.defaultPlatform : tournamentPlatforms[0] || 'PC',
    tournamentModalities: Object.freeze(tournamentModalities),
    defaultModality: tournamentModalities.includes(override.defaultModality) ? override.defaultModality : tournamentModalities[0] || '1v1',
    tournamentSeries: Object.freeze(tournamentSeries),
    defaultSeries: tournamentSeries.includes(override.defaultSeries) ? override.defaultSeries : tournamentSeries[0] || 'BO3',
    tournamentSummary: String(override.tournamentSummary || '').trim(),
    tournamentTips: Object.freeze(cloneStringList(override.tournamentTips || [])),
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
  teamTips: [...policy.teamTips],
  tournamentPlatforms: [...policy.tournamentPlatforms],
  tournamentModalities: [...policy.tournamentModalities],
  tournamentSeries: [...policy.tournamentSeries],
  tournamentTips: [...policy.tournamentTips],
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
    teamSummary: policy.teamSummary,
    teamTips: [...policy.teamTips],
    teamStaffLabel: policy.teamStaffLabel,
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

export const getGamePlaybook = (game = '') => {
  const policy = getGamePolicy(game);
  if (!policy) return null;

  const rosterLine = `${pluralize(policy.teamSize, 'titular', 'titulares')}${policy.maxSubs > 0 ? ` + ${pluralize(policy.maxSubs, 'suplente', 'suplentes')}` : ''}`;
  const defaultTeamSummary = `${rosterLine}. Roles activos: ${policy.roles.join(', ')}.`;
  const defaultTournamentSummary = `${policy.defaultModality} en ${policy.defaultPlatform} con ${policy.defaultSeries} como preset competitivo.`;

  return {
    id: policy.id,
    name: policy.name,
    rosterLine,
    roles: [...policy.roles],
    defaultPlatform: policy.defaultPlatform,
    defaultModality: policy.defaultModality,
    defaultSeries: policy.defaultSeries,
    servers: cloneOptionList(policy.tournamentServers),
    maps: [...policy.tournamentMaps],
    team: {
      summary: policy.teamSummary || defaultTeamSummary,
      tips: policy.teamTips.length ? [...policy.teamTips] : [`Roles activos: ${policy.roles.join(', ')}.`],
      staffLabel: policy.teamStaffLabel || 'Staff / Coach',
    },
    tournament: {
      summary: policy.tournamentSummary || defaultTournamentSummary,
      tips: policy.tournamentTips.length
        ? [...policy.tournamentTips]
        : [
            `Usa ${policy.defaultSeries} como serie base para ${policy.defaultModality}.`,
            `Mantente en ${policy.defaultPlatform} para sostener reglas consistentes.`,
          ],
    },
  };
};
