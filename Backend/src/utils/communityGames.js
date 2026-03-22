const normalizeToken = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const COMMUNITY_GAME_IDS = new Set([
  'valorant',
  'lol',
  'cs2',
  'fortnite',
  'warzone',
  'ow2',
  'dota2',
  'hs',
  'lor',
  'rl',
  'apex',
  'pubgm',
  'r6',
  'sf6',
  'tekken8',
  'mlbb',
  'ff',
  'cr',
  'aov',
  'hok',
  'tft',
  'wildrift',
  'starcraft',
  'nba2k',
  'gta',
  'genshin',
  'mariokart',
  'halo',
  'amongus',
  'fallguys',
  'wuwa',
  'marvel',
  'xdefiant',
  'thefinals',
  'tarkov',
  'deadlock',
  'eafc25',
  'dbsz',
  'multiversus',
  'palworld',
  'helldivers2',
  'bg3',
  'codbo6',
  'mk1',
  'eldenring',
  'cyberpunk',
  'rdr2',
  'mhwilds',
  'hogwarts',
  'nms'
]);

const COMMUNITY_GAME_ALIASES = new Map([
  ['league of legends', 'lol'],
  ['counter strike 2', 'cs2'],
  ['counter strike2', 'cs2'],
  ['counterstrike 2', 'cs2'],
  ['overwatch', 'ow2'],
  ['overwatch 2', 'ow2'],
  ['hearthstone', 'hs'],
  ['legends of runeterra', 'lor'],
  ['runeterra', 'lor'],
  ['rocket league', 'rl'],
  ['rocket', 'rl'],
  ['apex legends', 'apex'],
  ['pubg mobile', 'pubgm'],
  ['pubg', 'pubgm'],
  ['rainbow six siege', 'r6'],
  ['rainbow six', 'r6'],
  ['r6s', 'r6'],
  ['street fighter 6', 'sf6'],
  ['tekken 8', 'tekken8'],
  ['mobile legends', 'mlbb'],
  ['mobile legends bang bang', 'mlbb'],
  ['free fire', 'ff'],
  ['freefire', 'ff'],
  ['clash royale', 'cr'],
  ['clashroyale', 'cr'],
  ['arena of valor', 'aov'],
  ['honor of kings', 'hok'],
  ['wild rift', 'wildrift'],
  ['starcraft 2', 'starcraft'],
  ['starcraft ii', 'starcraft'],
  ['nba 2k24', 'nba2k'],
  ['nba2k24', 'nba2k'],
  ['gta v', 'gta'],
  ['gta 5', 'gta'],
  ['grand theft auto v', 'gta'],
  ['genshin impact', 'genshin'],
  ['mario kart', 'mariokart'],
  ['halo infinite', 'halo'],
  ['among us', 'amongus'],
  ['fall guys', 'fallguys'],
  ['wuthering waves', 'wuwa'],
  ['marvel rivals', 'marvel'],
  ['the finals', 'thefinals'],
  ['escape from tarkov', 'tarkov'],
  ['ea fc 25', 'eafc25'],
  ['fc 25', 'eafc25'],
  ['dragon ball sparking zero', 'dbsz'],
  ['helldivers 2', 'helldivers2'],
  ['baldurs gate 3', 'bg3'],
  ["baldur s gate 3", 'bg3'],
  ['call of duty bo6', 'codbo6'],
  ['cod bo6', 'codbo6'],
  ['black ops 6', 'codbo6'],
  ['mortal kombat 1', 'mk1'],
  ['elden ring', 'eldenring'],
  ['cyberpunk 2077', 'cyberpunk'],
  ['red dead redemption 2', 'rdr2'],
  ['monster hunter wilds', 'mhwilds'],
  ['hogwarts legacy', 'hogwarts'],
  ['no mans sky', 'nms']
]);

export const normalizeCommunityGameId = (value = '') => {
  const normalized = normalizeToken(value);
  if (!normalized) return '';
  if (COMMUNITY_GAME_IDS.has(normalized)) return normalized;
  return COMMUNITY_GAME_ALIASES.get(normalized) || '';
};

export const normalizeCommunityGameIds = (values = []) => {
  const list = Array.isArray(values) ? values : [values];
  const seen = new Set();
  const normalized = [];

  list.forEach((value) => {
    const gameId = normalizeCommunityGameId(value);
    if (!gameId || seen.has(gameId)) return;
    seen.add(gameId);
    normalized.push(gameId);
  });

  return normalized;
};

export const isCommunityGameId = (value = '') => Boolean(normalizeCommunityGameId(value));

// Build reverse map: gameId → Set of all alias strings that resolve to it
const GAME_NAME_VARIANTS_MAP = (() => {
  const map = new Map();
  for (const id of COMMUNITY_GAME_IDS) {
    map.set(id, new Set([id]));
  }
  for (const [alias, id] of COMMUNITY_GAME_ALIASES) {
    if (!map.has(id)) map.set(id, new Set([id]));
    map.get(id).add(alias);
  }
  return map;
})();

/**
 * Returns all known name variants for a gameId (e.g. 'lol' → ['lol', 'league of legends']).
 * Useful for querying DB collections that may store the game under any variant.
 */
export const getGameNameVariants = (gameId = '') => {
  const normalized = normalizeCommunityGameId(gameId);
  if (!normalized) return [String(gameId || '').trim()].filter(Boolean);
  const variants = GAME_NAME_VARIANTS_MAP.get(normalized);
  return variants ? Array.from(variants) : [normalized];
};
