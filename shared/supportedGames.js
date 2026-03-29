const normalizeToken = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase();

const BASE_SUPPORTED_GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    short: 'Valorant',
    categories: ['FPS'],
    aliases: ['valorant'],
    roles: ['Duelist', 'Sentinel', 'Controller', 'Initiator', 'Flex'],
  },
  {
    id: 'lol',
    name: 'League of Legends',
    short: 'LoL',
    categories: ['MOBA'],
    aliases: ['league of legends', 'lol'],
    roles: ['Top', 'Jungle', 'Mid', 'ADC', 'Supp'],
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    short: 'MLBB',
    categories: ['MOBA'],
    aliases: ['mobile legends', 'mobile legends: bang bang', 'mobile legends bang bang', 'mlbb'],
    roles: ['EXP', 'Gold', 'Mid', 'Jungla', 'Roam'],
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    short: 'Fortnite',
    categories: ['BR'],
    aliases: ['fortnite'],
    roles: ['IGL', 'Fragger', 'Support', 'Flex'],
  },
  {
    id: 'warzone',
    name: 'Warzone',
    short: 'Warzone',
    categories: ['BR'],
    aliases: ['warzone', 'call of duty warzone', 'cod warzone'],
    roles: ['IGL', 'Fragger', 'Support', 'Flex'],
  },
  {
    id: 'rocket',
    name: 'Rocket League',
    short: 'RL',
    categories: ['Sports'],
    aliases: ['rocket league', 'rocket', 'rl'],
    roles: ['Striker', 'Support', 'Flex'],
  },
  {
    id: 'fifa',
    name: 'EA FC / FIFA',
    short: 'EA FC',
    categories: ['Sports'],
    aliases: ['ea fc', 'ea sports fc', 'fc 25', 'fifa', 'fifa 24', 'fifa 25'],
    roles: ['Player'],
  },
  {
    id: 'smash',
    name: 'Smash Bros',
    short: 'Smash',
    categories: ['Fighting'],
    aliases: ['smash', 'smash bros', 'super smash bros', 'super smash bros ultimate', 'ssbu'],
    roles: ['Player'],
  },
  {
    id: 'brawlhalla',
    name: 'Brawlhalla',
    short: 'Brawlhalla',
    categories: ['Fighting'],
    aliases: ['brawlhalla', 'brawl halla'],
    roles: ['Player'],
  },
  {
    id: 'sf6',
    name: 'Street Fighter 6',
    short: 'SF6',
    categories: ['Fighting'],
    aliases: ['street fighter 6', 'street fighter', 'sf6'],
    roles: ['Player'],
  },
  {
    id: 'tekken',
    name: 'Tekken 8',
    short: 'Tekken',
    categories: ['Fighting'],
    aliases: ['tekken 8', 'tekken', 'tk8'],
    roles: ['Player'],
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    short: 'Free Fire',
    categories: ['BR'],
    aliases: ['free fire', 'freefire', 'ff'],
    roles: ['IGL', 'Fragger', 'Scout', 'Support'],
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    short: 'PUBG',
    categories: ['BR'],
    aliases: ['pubg mobile', 'pubg', 'pubgm'],
    roles: ['IGL', 'Fragger', 'Scout', 'Support'],
  },
  {
    id: 'codm',
    name: 'COD Mobile',
    short: 'CODM',
    categories: ['FPS'],
    aliases: ['cod mobile', 'call of duty mobile', 'codm', 'call of duty: mobile'],
    roles: ['Slayer', 'Objective', 'Anchor', 'Flex', 'Support'],
  },
];

const aliasEntries = BASE_SUPPORTED_GAMES.flatMap((game) =>
  [game.id, game.name, ...(game.aliases || [])].map((alias) => [normalizeToken(alias), game])
);

const GAME_BY_ALIAS = new Map(aliasEntries);

export const SUPPORTED_GAMES = BASE_SUPPORTED_GAMES.map((game) => ({
  ...game,
  aliases: [...game.aliases],
  categories: [...game.categories],
  roles: [...game.roles],
}));

export const SUPPORTED_GAME_IDS = SUPPORTED_GAMES.map((game) => game.id);
export const SUPPORTED_GAME_NAMES = SUPPORTED_GAMES.map((game) => game.name);
export const SUPPORTED_GAME_SHORTS = SUPPORTED_GAMES.map((game) => game.short);
export const SUPPORTED_GAME_CATEGORIES = [...new Set(SUPPORTED_GAMES.flatMap((game) => game.categories))];
export const SUPPORTED_RIOT_GAME_NAMES = ['Valorant', 'League of Legends'];
export const SUPPORTED_RIOT_PRODUCT_IDS = ['valorant', 'lol'];
export const SUPPORTED_MLBB_GAME_NAMES = ['Mobile Legends', 'Mobile Legends: Bang Bang', 'MLBB'];
export const SUPPORTED_GAME_ROLE_TEMPLATES = Object.fromEntries(
  SUPPORTED_GAMES.map((game) => [game.name, [...game.roles]])
);

export const getSupportedGame = (value = '') => GAME_BY_ALIAS.get(normalizeToken(value)) || null;

export const normalizeSupportedGameName = (value = '') => getSupportedGame(value)?.name || '';

export const normalizeSupportedGameId = (value = '') => getSupportedGame(value)?.id || '';

export const isSupportedGameName = (value = '') => Boolean(normalizeSupportedGameName(value));

export const isSupportedGameId = (value = '') => Boolean(normalizeSupportedGameId(value));

export const isSupportedGame = (value = '') => isSupportedGameName(value) || isSupportedGameId(value);

export const isSupportedRiotGame = (value = '') =>
  SUPPORTED_RIOT_GAME_NAMES.includes(normalizeSupportedGameName(value));

export const getRiotProductId = (value = '') => {
  const normalizedGameId = normalizeSupportedGameId(value);
  return SUPPORTED_RIOT_PRODUCT_IDS.includes(normalizedGameId) ? normalizedGameId : '';
};

export const isSupportedRiotProductId = (value = '') =>
  SUPPORTED_RIOT_PRODUCT_IDS.includes(String(value || '').trim().toLowerCase());

export const isSupportedMlbbGame = (value = '') => normalizeSupportedGameId(value) === 'mlbb';

export const getSupportedGameRoles = (value = '') => {
  const canonicalName = normalizeSupportedGameName(value);
  return canonicalName ? [...(SUPPORTED_GAME_ROLE_TEMPLATES[canonicalName] || [])] : [];
};

export const filterSupportedGameNames = (values = []) => {
  const list = Array.isArray(values) ? values : [values];
  const seen = new Set();
  const normalized = [];

  list.forEach((value) => {
    const canonicalName = normalizeSupportedGameName(value);
    if (!canonicalName || seen.has(canonicalName)) return;
    seen.add(canonicalName);
    normalized.push(canonicalName);
  });

  return normalized;
};

export const filterSupportedGameObjects = (items = [], options = {}) => {
  const { idKey = 'id', nameKey = 'name', allowMissingName = false, allowMissingId = false } = options;

  return (Array.isArray(items) ? items : []).filter((item) => {
    const idValue = item?.[idKey];
    const nameValue = item?.[nameKey];

    const supportedById = allowMissingId && !idValue ? false : isSupportedGameId(idValue);
    const supportedByName = allowMissingName && !nameValue ? false : isSupportedGameName(nameValue);

    return supportedById || supportedByName;
  });
};

export const filterSupportedGameMap = (map = {}) => {
  const entries = Object.entries(map || {}).filter(([key]) => isSupportedGame(key) || isSupportedGameName(key));
  return Object.fromEntries(
    entries.map(([key, value]) => {
      const canonicalName = normalizeSupportedGameName(key) || key;
      return [canonicalName, value];
    })
  );
};
