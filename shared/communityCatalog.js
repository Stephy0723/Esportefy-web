const normalizeLookupKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const createBooleanDefaults = (options = [], defaultValue = true) =>
  Object.freeze(
    Object.fromEntries(
      options.map((option) => [option.value || option.key, defaultValue])
    )
  );

export const COMMUNITY_GAME_DEFINITIONS = Object.freeze([
  { id: 'valorant', name: 'Valorant', category: 'FPS', color: '#ff4655', url: 'https://playvalorant.com', provider: 'riot' },
  { id: 'lol', name: 'League of Legends', category: 'MOBA', color: '#0ac8b9', url: 'https://www.leagueoflegends.com', provider: 'riot', aliases: ['lol'] },
  { id: 'cs2', name: 'CS2', category: 'FPS', color: '#de9b35', url: 'https://www.counter-strike.net', aliases: ['counter strike 2', 'counter strike2', 'counterstrike 2'] },
  { id: 'fortnite', name: 'Fortnite', category: 'BR', color: '#22c55e', url: 'https://www.fortnite.com' },
  { id: 'warzone', name: 'Warzone', category: 'BR', color: '#4caf50', url: 'https://www.callofduty.com/warzone' },
  { id: 'ow2', name: 'Overwatch 2', category: 'FPS', color: '#f99e1a', url: 'https://overwatch.blizzard.com', aliases: ['overwatch'] },
  { id: 'dota2', name: 'Dota 2', category: 'MOBA', color: '#e33935', url: 'https://www.dota2.com' },
  { id: 'hs', name: 'Hearthstone', category: 'Strategy', color: '#22c55e', url: 'https://hearthstone.blizzard.com' },
  { id: 'lor', name: 'Legends of Runeterra', category: 'Strategy', color: '#16a34a', url: 'https://playruneterra.com', provider: 'riot', aliases: ['runeterra'] },
  { id: 'rl', name: 'Rocket League', category: 'Sports', color: '#0088ff', url: 'https://www.rocketleague.com', aliases: ['rocket'] },
  { id: 'fifa', name: 'EA FC / FIFA', category: 'Sports', color: '#22c55e', url: 'https://www.ea.com/games/ea-sports-fc/fc-25', aliases: ['ea fc', 'ea sports fc', 'fifa', 'fc 25'], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2669320/header.jpg' },
  { id: 'apex', name: 'Apex Legends', category: 'BR', color: '#cd3333', url: 'https://www.ea.com/games/apex-legends' },
  { id: 'pubgm', name: 'PUBG Mobile', category: 'BR', color: '#f2a93b', url: 'https://www.pubgmobile.com', aliases: ['pubg'] },
  { id: 'r6', name: 'Rainbow Six Siege', category: 'FPS', color: '#ff8c00', url: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege', aliases: ['rainbow six', 'r6s'] },
  { id: 'sf6', name: 'Street Fighter 6', category: 'Fighting', color: '#ff5e00', url: 'https://www.streetfighter.com/6' },
  { id: 'smash', name: 'Smash Bros', category: 'Fighting', color: '#facc15', url: 'https://www.smashbros.com', aliases: ['super smash bros', 'super smash bros ultimate', 'ssbu', 'smash'] },
  { id: 'tekken8', name: 'Tekken 8', category: 'Fighting', color: '#ffd700', url: 'https://www.bandainamcoent.com/games/tekken-8' },
  { id: 'mlbb', name: 'Mobile Legends', category: 'MOBA', color: '#00d2ff', url: 'https://www.mobilelegends.com', aliases: ['mobile legends bang bang', 'mobile legends: bang bang', 'mlbb'] },
  { id: 'ff', name: 'Free Fire', category: 'BR', color: '#ffaa00', url: 'https://ff.garena.com', aliases: ['freefire'] },
  { id: 'cr', name: 'Clash Royale', category: 'Strategy', color: '#3b82f6', url: 'https://supercell.com/en/games/clashroyale', aliases: ['clashroyale'] },
  { id: 'aov', name: 'Arena of Valor', category: 'MOBA', color: '#10b981', url: 'https://www.arenaofvalor.com' },
  { id: 'hok', name: 'Honor of Kings', category: 'MOBA', color: '#eab308', url: 'https://www.honorofkings.com' },
  { id: 'tft', name: 'TFT', category: 'Strategy', color: '#16a34a', url: 'https://teamfighttactics.leagueoflegends.com', provider: 'riot', aliases: ['teamfight tactics'] },
  { id: 'wildrift', name: 'Wild Rift', category: 'MOBA', color: '#22d3ee', url: 'https://wildrift.leagueoflegends.com', provider: 'riot' },
  { id: 'starcraft', name: 'StarCraft II', category: 'Strategy', color: '#1d4ed8', url: 'https://starcraft2.blizzard.com', aliases: ['starcraft 2', 'starcraft ii'] },
  { id: 'nba2k', name: 'NBA 2K24', category: 'Sports', color: '#f59e0b', url: 'https://nba.2k.com', aliases: ['nba2k24'] },
  { id: 'gta', name: 'GTA V', category: 'RPG', color: '#15803d', url: 'https://www.rockstargames.com/gta-v', aliases: ['gta 5', 'grand theft auto v'] },
  { id: 'genshin', name: 'Genshin Impact', category: 'RPG', color: '#14b8a6', url: 'https://genshin.hoyoverse.com' },
  { id: 'mariokart', name: 'Mario Kart', category: 'Sports', color: '#22c55e', url: 'https://mariokart.nintendo.com' },
  { id: 'halo', name: 'Halo Infinite', category: 'FPS', color: '#0ea5e9', url: 'https://www.halowaypoint.com/halo-infinite' },
  { id: 'amongus', name: 'Among Us', category: 'Social', color: '#16a34a', url: 'https://www.innersloth.com/games/among-us' },
  { id: 'fallguys', name: 'Fall Guys', category: 'Social', color: '#22c55e', url: 'https://www.fallguys.com' },
  { id: 'wuwa', name: 'Wuthering Waves', category: 'RPG', color: '#10b981', url: 'https://wutheringwaves.kurogames.com' },
  { id: 'marvel', name: 'Marvel Rivals', category: 'FPS', color: '#ef4444', url: 'https://www.marvelrivals.com', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2767030/header.jpg' },
  { id: 'xdefiant', name: 'XDefiant', category: 'FPS', color: '#f97316', url: 'https://www.ubisoft.com/en-us/game/xdefiant', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2434700/header.jpg' },
  { id: 'thefinals', name: 'The Finals', category: 'FPS', color: '#e11d48', url: 'https://www.reachthefinals.com', aliases: ['the finals'], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2073850/header.jpg' },
  { id: 'tarkov', name: 'Escape From Tarkov', category: 'FPS', color: '#84cc16', url: 'https://www.escapefromtarkov.com', aliases: ['escape from tarkov'], imageUrl: 'https://images.ctfassets.net/pvgyxhxq7n13/6PRfN5Bfc2fNqppM8oaYwN/0a1f092f8e8fd3e26d61f5f64f2f95de/eft_share.jpg' },
  { id: 'deadlock', name: 'Deadlock', category: 'MOBA', color: '#8b5cf6', url: 'https://store.steampowered.com/app/1422450/Deadlock', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1422450/header.jpg' },
  { id: 'eafc25', name: 'EA FC 25', category: 'Sports', color: '#22c55e', url: 'https://www.ea.com/games/ea-sports-fc/fc-25', aliases: ['fc 25'], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2669320/header.jpg' },
  { id: 'dbsz', name: 'Dragon Ball Sparking Zero', category: 'Fighting', color: '#f59e0b', url: 'https://en.bandainamcoent.eu/dragon-ball/dragon-ball-sparking-zero', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1790600/header.jpg' },
  { id: 'multiversus', name: 'MultiVersus', category: 'Fighting', color: '#3b82f6', url: 'https://multiversus.com', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1818750/header.jpg' },
  { id: 'palworld', name: 'Palworld', category: 'RPG', color: '#10b981', url: 'https://www.pocketpair.jp/palworld', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg' },
  { id: 'helldivers2', name: 'Helldivers 2', category: 'FPS', color: '#facc15', url: 'https://www.playstation.com/games/helldivers-2', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg' },
  { id: 'bg3', name: 'Baldur Gate 3', category: 'RPG', color: '#f59e0b', url: 'https://baldursgate3.game', aliases: ['baldurs gate 3', "baldur's gate 3", 'baldur s gate 3'], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg' },
  { id: 'codbo6', name: 'Call of Duty BO6', category: 'FPS', color: '#f97316', url: 'https://www.callofduty.com/blackops6', aliases: ['cod bo6', 'black ops 6'], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2933620/header.jpg' },
  { id: 'mk1', name: 'Mortal Kombat 1', category: 'Fighting', color: '#dc2626', url: 'https://www.mortalkombat.com', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1971870/header.jpg' },
  { id: 'eldenring', name: 'Elden Ring', category: 'RPG', color: '#d4a017', url: 'https://www.eldenring.jp', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg' },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', category: 'RPG', color: '#fbbf24', url: 'https://www.cyberpunk.net', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg' },
  { id: 'rdr2', name: 'Red Dead Redemption 2', category: 'RPG', color: '#b91c1c', url: 'https://www.rockstargames.com/reddeadredemption2', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg' },
  { id: 'mhwilds', name: 'Monster Hunter Wilds', category: 'RPG', color: '#059669', url: 'https://www.monsterhunter.com/wilds', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/2246340/header.jpg' },
  { id: 'hogwarts', name: 'Hogwarts Legacy', category: 'RPG', color: '#7c3aed', url: 'https://www.hogwartslegacy.com', imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/990080/header.jpg' },
  { id: 'nms', name: 'No Mans Sky', category: 'RPG', color: '#0891b2', url: 'https://www.nomanssky.com', aliases: ["no man's sky"], imageUrl: 'https://cdn.akamai.steamstatic.com/steam/apps/275850/header.jpg' }
]);

const GAME_BY_LOOKUP = new Map();

COMMUNITY_GAME_DEFINITIONS.forEach((game) => {
  [game.id, game.name, ...(game.aliases || [])].forEach((value) => {
    GAME_BY_LOOKUP.set(normalizeLookupKey(value), game);
  });
});

export const COMMUNITY_GAME_IDS = Object.freeze(
  COMMUNITY_GAME_DEFINITIONS.map((game) => game.id)
);

export const COMMUNITY_GAME_NAMES = Object.freeze(
  COMMUNITY_GAME_DEFINITIONS.map((game) => game.name)
);

export const COMMUNITY_RIOT_GAME_IDS = Object.freeze(
  COMMUNITY_GAME_DEFINITIONS.filter((game) => game.provider === 'riot').map((game) => game.id)
);

export const COMMUNITY_FEED_GAME_OPTIONS = Object.freeze(
  ['valorant', 'lol', 'mlbb', 'fortnite', 'cs2', 'wildrift']
    .map((gameId) => COMMUNITY_GAME_DEFINITIONS.find((game) => game.id === gameId))
    .filter(Boolean)
    .map((game) => ({
      id: game.id,
      name: game.name,
      color: game.color
    }))
);

export const COMMUNITY_FILTER_OPTIONS = Object.freeze([
  { label: 'Todos', value: 'all', icon: 'bx bx-grid-alt' },
  { label: 'FPS', value: 'FPS', icon: 'bx bx-target-lock' },
  { label: 'MOBA', value: 'MOBA', icon: 'bx bx-shield-quarter' },
  { label: 'Battle Royale', value: 'BR', icon: 'bx bx-crosshair' },
  { label: 'Fighting', value: 'Fighting', icon: 'bx bxs-hand' },
  { label: 'Estrategia', value: 'Strategy', icon: 'bx bx-chess' },
  { label: 'Deportes', value: 'Sports', icon: 'bx bx-football' },
  { label: 'RPG', value: 'RPG', icon: 'bx bx-map' },
  { label: 'Social', value: 'Social', icon: 'bx bx-group' }
]);

export const COMMUNITY_SOCIAL_FIELDS = Object.freeze([
  { key: 'website', label: 'Sitio web', iconClass: 'bx bx-link-external', placeholder: 'https://tucomunidad.gg' },
  { key: 'discord', label: 'Discord', iconClass: 'bx bxl-discord-alt', placeholder: 'https://discord.gg/tucomunidad' },
  { key: 'twitter', label: 'X / Twitter', iconClass: 'bx bxl-twitter', placeholder: 'https://x.com/tucomunidad' },
  { key: 'instagram', label: 'Instagram', iconClass: 'bx bxl-instagram', placeholder: 'https://instagram.com/tucomunidad' },
  { key: 'youtube', label: 'YouTube', iconClass: 'bx bxl-youtube', placeholder: 'https://youtube.com/@tucomunidad' },
  { key: 'twitch', label: 'Twitch', iconClass: 'bx bxl-twitch', placeholder: 'https://twitch.tv/tucomunidad' },
  { key: 'tiktok', label: 'TikTok', iconClass: 'bx bxl-tiktok', placeholder: 'https://tiktok.com/@tucomunidad' }
]);

export const COMMUNITY_SOCIAL_LINK_KEYS = Object.freeze(
  COMMUNITY_SOCIAL_FIELDS.map((field) => field.key)
);

export const COMMUNITY_SOCIAL_LINK_DEFAULTS = createBooleanDefaults(
  COMMUNITY_SOCIAL_FIELDS.map((field) => ({ value: field.key })),
  ''
);

export const COMMUNITY_CONTENT_CATEGORY_OPTIONS = Object.freeze([
  { value: 'noticias', label: 'Noticias' },
  { value: 'memes', label: 'Memes' },
  { value: 'opinion', label: 'Opinión' },
  { value: 'clips', label: 'Clips' },
  { value: 'fanart', label: 'Fanart' },
  { value: 'guias', label: 'Guías' }
]);

export const COMMUNITY_CONTENT_CATEGORY_KEYS = Object.freeze(
  COMMUNITY_CONTENT_CATEGORY_OPTIONS.map((option) => option.value)
);

export const COMMUNITY_CONTENT_CATEGORY_DEFAULTS = createBooleanDefaults(
  COMMUNITY_CONTENT_CATEGORY_OPTIONS
);

export const COMMUNITY_POST_TYPE_OPTIONS = Object.freeze([
  { value: 'texto', label: 'Texto' },
  { value: 'imagen', label: 'Imagen' },
  { value: 'video', label: 'Video' },
  { value: 'enlace', label: 'Enlace' },
  { value: 'encuestas', label: 'Encuestas' }
]);

export const COMMUNITY_POST_TYPE_KEYS = Object.freeze(
  COMMUNITY_POST_TYPE_OPTIONS.map((option) => option.value)
);

export const COMMUNITY_POST_TYPE_DEFAULTS = createBooleanDefaults(
  COMMUNITY_POST_TYPE_OPTIONS
);

export const COMMUNITY_ROLE_OPTIONS = Object.freeze([
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'user', label: 'Usuario' },
  { value: 'visitor', label: 'Visitante' }
]);

export const COMMUNITY_ROLE_KEYS = Object.freeze(
  COMMUNITY_ROLE_OPTIONS.map((option) => option.value)
);

export const COMMUNITY_ROLE_DEFAULTS = createBooleanDefaults(COMMUNITY_ROLE_OPTIONS);

export const COMMUNITY_MEMBER_ROLE_OPTIONS = Object.freeze([
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderador' },
  { value: 'member', label: 'Miembro' }
]);

export const COMMUNITY_MEMBER_ROLE_KEYS = Object.freeze(
  COMMUNITY_MEMBER_ROLE_OPTIONS.map((option) => option.value)
);

export const COMMUNITY_ROLE_ORDER = Object.freeze(
  COMMUNITY_MEMBER_ROLE_KEYS.map((role) => role)
);

export const COMMUNITY_MANAGEABLE_ROLE_KEYS = Object.freeze(['member', 'moderator', 'admin']);

export const COMMUNITY_MANAGEABLE_ROLE_OPTIONS = Object.freeze(
  COMMUNITY_MEMBER_ROLE_OPTIONS.filter((option) => COMMUNITY_MANAGEABLE_ROLE_KEYS.includes(option.value))
);

export const COMMUNITY_REPORT_REASON_OPTIONS = Object.freeze([
  { value: 'spam', label: 'Spam' },
  { value: 'hate', label: 'Odio o acoso' },
  { value: 'nsfw', label: 'Contenido inapropiado / NSFW' },
  { value: 'spoiler', label: 'Spoiler' }
]);

export const COMMUNITY_REPORT_REASON_KEYS = Object.freeze(
  COMMUNITY_REPORT_REASON_OPTIONS.map((option) => option.value)
);

export const COMMUNITY_REPORT_REASON_DEFAULTS = createBooleanDefaults(
  COMMUNITY_REPORT_REASON_OPTIONS
);

export const COMMUNITY_REGION_OPTIONS = Object.freeze([
  { value: 'LATAM', label: 'LATAM' },
  { value: 'NA', label: 'NA' },
  { value: 'Global', label: 'Global' }
]);

export const COMMUNITY_LANGUAGE_OPTIONS = Object.freeze([
  { value: 'Español', label: 'Español' },
  { value: 'Inglés', label: 'Inglés' }
]);

export const COMMUNITY_AUDIENCE_OPTIONS = Object.freeze([
  { value: 'Mixto', label: 'Mixto' },
  { value: 'Competitivo', label: 'Competitivo' },
  { value: 'Casual', label: 'Casual' }
]);

export const COMMUNITY_WHO_CAN_POST_OPTIONS = Object.freeze([
  { value: 'all', label: 'Todos' },
  { value: 'verified', label: 'Verificados' },
  { value: 'staff', label: 'Solo staff' }
]);

const COMMUNITY_MEMBER_ROLE_MAP = new Map(
  COMMUNITY_MEMBER_ROLE_OPTIONS.map((option) => [normalizeLookupKey(option.value), option.value])
);

const COMMUNITY_MEMBER_ROLE_ALIASES = new Map([
  ['mod', 'moderator'],
  ['moderador', 'moderator'],
  ['miembro', 'member'],
  ['propietario', 'owner']
]);

export const getCommunityGame = (value = '') =>
  GAME_BY_LOOKUP.get(normalizeLookupKey(value)) || null;

export const normalizeCommunityGameId = (value = '') =>
  getCommunityGame(value)?.id || '';

export const normalizeCommunityGameName = (value = '') =>
  getCommunityGame(value)?.name || '';

export const normalizeCommunityGameNames = (values = []) => {
  const list = Array.isArray(values) ? values : values == null || values === '' ? [] : [values];
  const seen = new Set();
  const normalized = [];

  list.forEach((value) => {
    const canonical = normalizeCommunityGameName(value);
    if (!canonical || seen.has(canonical)) return;
    seen.add(canonical);
    normalized.push(canonical);
  });

  return normalized;
};

export const getCommunityGameNameVariants = (value = '') => {
  const game = getCommunityGame(value);
  if (!game) return [String(value || '').trim()].filter(Boolean);

  return [...new Set([game.id, game.name, ...(game.aliases || [])])];
};

export const isRiotCommunityGame = (value = '') =>
  COMMUNITY_RIOT_GAME_IDS.includes(normalizeCommunityGameId(value));

export const normalizeCommunitySocialLinks = (socialLinks) => {
  const raw = socialLinks && typeof socialLinks === 'object' ? socialLinks : {};

  return COMMUNITY_SOCIAL_LINK_KEYS.reduce((acc, key) => {
    const value = String(raw[key] || '').trim();
    if (value) acc[key] = value;
    return acc;
  }, {});
};

export const normalizeCommunityMemberRole = (value = '', fallback = 'member') => {
  const lookupKey = normalizeLookupKey(value);
  if (!lookupKey) return fallback;
  return COMMUNITY_MEMBER_ROLE_ALIASES.get(lookupKey) || COMMUNITY_MEMBER_ROLE_MAP.get(lookupKey) || fallback;
};

export const getCommunityMemberRoleLabel = (value = '') => {
  const normalized = normalizeCommunityMemberRole(value, '');
  return COMMUNITY_MEMBER_ROLE_OPTIONS.find((option) => option.value === normalized)?.label || value || '';
};

export const sortCommunityMembersByRole = (members = []) => {
  if (!Array.isArray(members)) return [];

  return [...members].sort((a, b) => {
    const leftRole = normalizeCommunityMemberRole(a?.role, 'member');
    const rightRole = normalizeCommunityMemberRole(b?.role, 'member');
    const leftIndex = COMMUNITY_ROLE_ORDER.indexOf(leftRole);
    const rightIndex = COMMUNITY_ROLE_ORDER.indexOf(rightRole);
    const safeLeftIndex = leftIndex === -1 ? COMMUNITY_ROLE_ORDER.length : leftIndex;
    const safeRightIndex = rightIndex === -1 ? COMMUNITY_ROLE_ORDER.length : rightIndex;
    if (safeLeftIndex !== safeRightIndex) return safeLeftIndex - safeRightIndex;

    const leftName = String(a?.user?.username || a?.user?.fullName || '').toLowerCase();
    const rightName = String(b?.user?.username || b?.user?.fullName || '').toLowerCase();
    return leftName.localeCompare(rightName);
  });
};
