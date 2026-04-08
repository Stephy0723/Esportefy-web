import {
  COMMUNITY_FILTER_OPTIONS,
  COMMUNITY_GAME_DEFINITIONS,
  normalizeCommunityGameId
} from '../../../shared/communityCatalog.js';

const COMPANY_BY_ID = Object.freeze({
  lol: 'Riot Games',
  valorant: 'Riot Games',
  dota2: 'Valve',
  mlbb: 'Moonton',
  wildrift: 'Riot Games',
  fortnite: 'Epic Games',
  cs2: 'Valve',
  apex: 'Respawn Entertainment',
  warzone: 'Activision',
  pubg: 'Tencent / Krafton',
  r6: 'Ubisoft',
  rl: 'Psyonix',
  fifa: 'EA Sports',
  smash: 'Nintendo',
  tekken: 'Bandai Namco',
  sf6: 'Capcom',
  brawlhalla: 'Blue Mammoth Games / Ubisoft',
  freefire: 'Garena',
  codm: 'Activision / TiMi Studio Group',
  cr: 'Supercell',
  aov: 'Tencent',
  hok: 'Tencent',
  tft: 'Riot Games',
  starcraft: 'Blizzard Entertainment',
  nba2k: '2K Sports',
  gta: 'Rockstar Games',
  genshin: 'HoYoverse',
  mariokart: 'Nintendo',
  halo: '343 Industries',
  amongus: 'Innersloth',
  fallguys: 'Mediatonic',
  wuwa: 'Kuro Games',
  hs: 'Blizzard Entertainment',
  lor: 'Riot Games',
  ow2: 'Blizzard Entertainment',
  marvel: 'NetEase Games',
  xdefiant: 'Ubisoft',
  thefinals: 'Embark Studios',
  tarkov: 'Battlestate Games',
  deadlock: 'Valve',
  eafc25: 'EA Sports',
  dbsz: 'Bandai Namco',
  multiversus: 'Player First Games',
  palworld: 'Pocketpair',
  helldivers2: 'Arrowhead Game Studios',
  bg3: 'Larian Studios',
  codbo6: 'Activision',
  mk1: 'NetherRealm',
  eldenring: 'FromSoftware',
  cyberpunk: 'CD Projekt Red',
  rdr2: 'Rockstar Games',
  mhwilds: 'Capcom',
  hogwarts: 'Avalanche Software',
  nms: 'Hello Games'
});

const BASE_TAXONOMY_BY_CATEGORY = Object.freeze({
  FPS: Object.freeze({
    genre: ['fps'],
    mode: ['competitive'],
    platform: ['pc'],
    competitive: ['competitivo'],
    style: ['shooter'],
    mechanics: ['aim', 'teamplay']
  }),
  MOBA: Object.freeze({
    genre: ['moba'],
    mode: ['5v5', 'ranked'],
    platform: ['pc'],
    competitive: ['competitivo', 'esports'],
    style: ['hero based'],
    mechanics: ['lane', 'teamfight', 'objectives']
  }),
  BR: Object.freeze({
    genre: ['battle royale'],
    mode: ['squad', 'solo'],
    platform: ['cross platform'],
    competitive: ['competitivo'],
    style: ['survival'],
    mechanics: ['looting', 'positioning', 'circle']
  }),
  Fighting: Object.freeze({
    genre: ['fighting'],
    mode: ['1v1', 'ranked'],
    platform: ['pc', 'console'],
    competitive: ['competitivo', 'esports'],
    style: ['arcade fighter'],
    mechanics: ['neutral', 'combo', 'matchup']
  }),
  Strategy: Object.freeze({
    genre: ['strategy'],
    mode: ['ranked'],
    platform: ['pc'],
    competitive: ['competitivo'],
    style: ['tactical'],
    mechanics: ['planning', 'economy', 'decision making']
  }),
  Sports: Object.freeze({
    genre: ['sports'],
    mode: ['competitive'],
    platform: ['cross platform'],
    competitive: ['competitivo'],
    style: ['simulation'],
    mechanics: ['execution', 'timing', 'teamplay']
  }),
  RPG: Object.freeze({
    genre: ['rpg'],
    mode: ['solo', 'coop'],
    platform: ['cross platform'],
    competitive: [],
    style: ['open world'],
    mechanics: ['progression', 'builds', 'exploration']
  }),
  Social: Object.freeze({
    genre: ['social'],
    mode: ['multiplayer'],
    platform: ['cross platform'],
    competitive: ['casual'],
    style: ['party'],
    mechanics: ['communication', 'deduction', 'coordination']
  })
});

const TAXONOMY_OVERRIDES = Object.freeze({
  valorant: { mode: ['5v5', 'round based'], style: ['tactical shooter', 'hero shooter'], mechanics: ['aim', 'utility', 'strategy'] },
  cs2: { mode: ['5v5', 'bomb defusal'], style: ['tactical shooter'], mechanics: ['aim', 'economy', 'map control'] },
  warzone: { platform: ['cross platform'], style: ['military', 'realistic'] },
  fortnite: { style: ['creative', 'building'], mechanics: ['building', 'movement', 'survival'] },
  pubg: { platform: ['mobile'], style: ['realistic', 'survival'] },
  r6: { mode: ['5v5', 'round based'], style: ['tactical shooter'], mechanics: ['destruction', 'gadgets', 'callouts'] },
  rl: { mode: ['3v3', '1v1'], style: ['arcade sports'], mechanics: ['physics', 'aerial', 'rotation'] },
  fifa: { mode: ['1v1'], platform: ['pc', 'console'], style: ['football', 'simulation'] },
  smash: { platform: ['nintendo'], style: ['platform fighter'], mechanics: ['edgeguard', 'neutral', 'combo'] },
  tekken: { style: ['3d fighter'], mechanics: ['combo', 'pressure', 'mixup'] },
  sf6: { style: ['2d fighter'], mechanics: ['neutral', 'framedata', 'combo'] },
  brawlhalla: { platform: ['cross platform'], style: ['platform fighter'], mechanics: ['reads', 'string', 'ring out'] },
  mlbb: { platform: ['mobile'], style: ['mobile moba'], mechanics: ['rotation', 'teamfight', 'lane'] },
  wildrift: { platform: ['mobile'], style: ['mobile moba'] },
  freefire: { platform: ['mobile'], style: ['mobile battle royale'] },
  codm: { platform: ['mobile'], mode: ['5v5', 'search and destroy'], style: ['military shooter'] },
  cr: { platform: ['mobile'], mode: ['1v1', '2v2'], genre: ['strategy', 'card game'], style: ['tower defense'], mechanics: ['deck building', 'elixir', 'timing'] },
  aov: { platform: ['mobile'] },
  hok: { platform: ['mobile', 'pc'], style: ['fast paced moba'] },
  tft: { genre: ['strategy'], mode: ['8 players'], platform: ['pc', 'mobile'], style: ['autobattler'], mechanics: ['draft', 'economy', 'synergies'] },
  lor: { genre: ['strategy', 'card game'], platform: ['pc', 'mobile'], mechanics: ['deck building', 'keywords', 'tempo'] },
  hs: { genre: ['strategy', 'card game'], platform: ['pc', 'mobile'], mechanics: ['deck building', 'combos', 'rng'] },
  starcraft: { genre: ['strategy'], mode: ['1v1'], platform: ['pc'], style: ['rts'], mechanics: ['apm', 'micro', 'macro'] },
  nba2k: { mode: ['competitive'], style: ['basketball', 'simulation'] },
  gta: { genre: ['open world'], mode: ['multiplayer', 'roleplay'], platform: ['pc', 'console'], style: ['sandbox'], mechanics: ['rp', 'driving', 'open world'] },
  genshin: { genre: ['rpg', 'action rpg'], style: ['anime', 'fantasy'], mechanics: ['exploration', 'builds', 'elements'] },
  mariokart: { genre: ['racing'], platform: ['nintendo'], style: ['kart'], mechanics: ['items', 'drifting', 'shortcuts'] },
  halo: { platform: ['pc', 'console'], style: ['arena shooter'], mechanics: ['aim', 'teamplay', 'map control'] },
  amongus: { genre: ['social deduction'], style: ['party'], mechanics: ['deduction', 'deception', 'communication'] },
  fallguys: { genre: ['party'], style: ['casual'], mechanics: ['obstacles', 'platforming', 'elimination'] },
  wuwa: { genre: ['rpg', 'action rpg'], platform: ['pc', 'mobile'], style: ['anime'], mechanics: ['exploration', 'combat', 'builds'] },
  marvel: { style: ['hero shooter'], mode: ['6v6'] },
  xdefiant: { mode: ['6v6'], style: ['arena shooter'], mechanics: ['factions', 'aim', 'tempo'] },
  thefinals: { mode: ['squad'], style: ['arena shooter'], mechanics: ['destruction', 'cashout', 'teamplay'] },
  tarkov: { mode: ['squad', 'solo'], platform: ['pc'], style: ['hardcore', 'extraction'], mechanics: ['looting', 'survival', 'gunplay'] },
  deadlock: { genre: ['moba', 'hero shooter'], mode: ['6v6'], platform: ['pc'], style: ['third person'], mechanics: ['lanes', 'abilities', 'shooting'] },
  eafc25: { mode: ['1v1'], platform: ['pc', 'console'], style: ['football', 'simulation'] },
  dbsz: { genre: ['fighting'], platform: ['pc', 'console'], style: ['anime fighter'], mechanics: ['combo', 'movement', 'pressure'] },
  multiversus: { genre: ['fighting'], platform: ['cross platform'], style: ['platform fighter'], mechanics: ['perks', 'ring out', 'teamplay'] },
  palworld: { genre: ['rpg'], mode: ['multiplayer', 'coop'], platform: ['pc', 'console'], style: ['survival', 'creature collection'], mechanics: ['crafting', 'building', 'exploration'] },
  helldivers2: { mode: ['coop', 'squad'], platform: ['pc', 'console'], style: ['sci-fi', 'military'], mechanics: ['coordination', 'loadouts', 'objectives'] },
  bg3: { genre: ['rpg'], mode: ['solo', 'coop'], platform: ['pc', 'console'], style: ['fantasy'], mechanics: ['choices', 'party', 'turn based'] },
  codbo6: { mode: ['6v6', 'competitive'], platform: ['pc', 'console'], style: ['military shooter'], mechanics: ['loadouts', 'aim', 'streaks'] },
  mk1: { genre: ['fighting'], platform: ['pc', 'console'], style: ['arcade fighter'], mechanics: ['combo', 'pressure', 'kameo'] },
  eldenring: { genre: ['rpg', 'action rpg'], mode: ['solo', 'coop'], platform: ['pc', 'console'], style: ['dark fantasy'], mechanics: ['builds', 'exploration', 'boss fights'] },
  cyberpunk: { genre: ['rpg', 'action rpg'], mode: ['solo'], platform: ['pc', 'console'], style: ['open world', 'cyberpunk'], mechanics: ['shooting', 'hacking', 'choices'] },
  rdr2: { genre: ['rpg', 'open world'], mode: ['solo', 'multiplayer'], platform: ['pc', 'console'], style: ['western'], mechanics: ['story', 'exploration', 'gunplay'] },
  mhwilds: { genre: ['rpg', 'action rpg'], mode: ['solo', 'coop'], platform: ['pc', 'console'], style: ['fantasy'], mechanics: ['hunting', 'crafting', 'builds'] },
  hogwarts: { genre: ['rpg', 'open world'], mode: ['solo'], platform: ['pc', 'console'], style: ['fantasy'], mechanics: ['magic', 'exploration', 'story'] },
  nms: { genre: ['rpg', 'open world'], mode: ['solo', 'multiplayer'], platform: ['cross platform'], style: ['sci-fi', 'survival'], mechanics: ['exploration', 'crafting', 'building'] }
});

const uniqueList = (...values) => [...new Set(values.flat().filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const inferCompany = (game) => {
  if (COMPANY_BY_ID[game.id]) return COMPANY_BY_ID[game.id];
  if (game.provider === 'riot') return 'Riot Games';
  return 'Studio independiente';
};

const buildTaxonomy = (game) => {
  const base = BASE_TAXONOMY_BY_CATEGORY[game.category] || BASE_TAXONOMY_BY_CATEGORY.FPS;
  const override = TAXONOMY_OVERRIDES[game.id] || {};

  return {
    genre: uniqueList(override.genre || base.genre || [String(game.category || '').toLowerCase()]),
    mode: uniqueList(override.mode || base.mode || []),
    platform: uniqueList(override.platform || base.platform || []),
    competitive: uniqueList(override.competitive || base.competitive || []),
    style: uniqueList(override.style || base.style || []),
    mechanics: uniqueList(override.mechanics || base.mechanics || [])
  };
};

const buildHistory = (game, taxonomy, company) => {
  const categoryLabel = String(game.category || 'gaming').trim();
  const primaryPlatform = taxonomy.platform?.[0] || 'cross platform';
  return `${game.name} forma parte del catalogo activo de GLITCH GANG con soporte para comunidad, equipos y torneos. Su enfoque principal combina ${categoryLabel} en ${primaryPlatform} con espacio para actividad competitiva y social dentro de la plataforma.`;
};

export const getCommunityGameFilterOptions = () =>
  COMMUNITY_FILTER_OPTIONS.map((option) => ({ ...option }));

export const getCommunityGameCatalogEntry = (value = '') => {
  const gameId = normalizeCommunityGameId(value);
  const game = COMMUNITY_GAME_DEFINITIONS.find((entry) => entry.id === gameId);
  if (!game) return null;

  const taxonomy = buildTaxonomy(game);
  const company = inferCompany(game);

  return {
    id: game.id,
    name: game.name,
    category: game.category,
    color: game.color,
    url: game.url || '',
    provider: game.provider || '',
    aliases: Array.isArray(game.aliases) ? [...game.aliases] : [],
    imageUrl: game.imageUrl || '',
    company,
    taxonomy,
    history: buildHistory(game, taxonomy, company)
  };
};

export const getCommunityGameCatalog = () =>
  COMMUNITY_GAME_DEFINITIONS.map((game) => getCommunityGameCatalogEntry(game.id)).filter(Boolean);
