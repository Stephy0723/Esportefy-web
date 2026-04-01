import FortniteImg from '../assets/comunidad/Fortnite.jpg';
import CS2Img from '../assets/comunidad/CS2.jpg';
import CRImg from '../assets/comunidad/CR.jpg';
import AOVImg from '../assets/comunidad/AOV.jpg';
import HoKImg from '../assets/comunidad/HoK_V.jpg';
import FFImg from '../assets/comunidad/FF.jpg';
import BrawlhallaImg from '../assets/comunidad/Brawlhalla.jpg';
import CODMImg from '../assets/comunidad/CODM.jpg';
import Dota2Img from '../assets/comunidad/Dota2.jpeg';
import HSImg from '../assets/comunidad/HS.webp';
import LoLImg from '../assets/comunidad/LoL.jpg';
import LoRImg from '../assets/comunidad/LoR.jpg';
import MLBBImg from '../assets/comunidad/MLBB.jpg';
import NBA2K24Img from '../assets/comunidad/NBA2K24.jpg';
import OW2Img from '../assets/comunidad/OW2.jpeg';
import PUBGMImg from '../assets/comunidad/PUBGM.jpg';
import R6SImg from '../assets/comunidad/R6S.jpg';
import RLImg from '../assets/comunidad/RL.jpg';
import SC2Img from '../assets/comunidad/SC2.jpg';
import SF6Img from '../assets/comunidad/sf6.png';
import SmashImg from '../assets/comunidad/Smash.jpg';
import Tekken8Img from '../assets/comunidad/Tekken8.jpg';
import TFTImg from '../assets/comunidad/TFT.webp';
import ValorantImg from '../assets/comunidad/valorant.jpg';
import WarzoneImg from '../assets/comunidad/Warzone.jpg';
import WildRiftImg from '../assets/comunidad/WildRift.jpeg';
import ApexImg from '../assets/comunidad/Apex.jpg';
import AmongUsImg from '../assets/comunidad/amongus.jpg';
import FallGuysImg from '../assets/comunidad/Fallguy.jpg';
import GenshinImg from '../assets/comunidad/genshin.jpg';
import GTAImg from '../assets/comunidad/Gta.jpg';
import HaloImg from '../assets/comunidad/halo.jpg';
import MarioKartImg from '../assets/comunidad/MarioKart.jpg';
import WuwaImg from '../assets/comunidad/Wuwa.jpg';
import {
  COMMUNITY_FILTER_OPTIONS,
  COMMUNITY_GAME_DEFINITIONS,
  normalizeCommunityGameId as normalizeSharedCommunityGameId,
  normalizeCommunityGameName as normalizeSharedCommunityGameName
} from '../../../shared/communityCatalog.js';

const normalizeCommunityLookup = (value = '') =>
  String(value || '').trim().toLowerCase();

const LOCAL_COMMUNITY_GAME_IMAGES = {
  valorant: ValorantImg,
  lol: LoLImg,
  cs2: CS2Img,
  fortnite: FortniteImg,
  warzone: WarzoneImg,
  ow2: OW2Img,
  dota2: Dota2Img,
  hs: HSImg,
  lor: LoRImg,
  rl: RLImg,
  rocket: RLImg,
  apex: ApexImg,
  pubg: PUBGMImg,
  pubgm: PUBGMImg,
  r6: R6SImg,
  sf6: SF6Img,
  smash: SmashImg,
  tekken: Tekken8Img,
  tekken8: Tekken8Img,
  brawlhalla: BrawlhallaImg,
  mlbb: MLBBImg,
  freefire: FFImg,
  ff: FFImg,
  codm: CODMImg,
  cr: CRImg,
  aov: AOVImg,
  hok: HoKImg,
  tft: TFTImg,
  wildrift: WildRiftImg,
  starcraft: SC2Img,
  nba2k: NBA2K24Img,
  gta: GTAImg,
  genshin: GenshinImg,
  mariokart: MarioKartImg,
  halo: HaloImg,
  amongus: AmongUsImg,
  fallguys: FallGuysImg,
  wuwa: WuwaImg
};

export const COMMUNITY_GAMES = COMMUNITY_GAME_DEFINITIONS.map((game) => ({
  name: game.name,
  id: game.id,
  img: LOCAL_COMMUNITY_GAME_IMAGES[game.id] || game.imageUrl || '',
  color: game.color,
  cat: game.category,
  players: '0',
  url: game.url
}));

export const COMMUNITY_GAME_TAXONOMY = {
  lol:        { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['fantasia', 'hero based'],         mechanics: ['lane', 'teamfight', 'objectives'] },
  valorant:   { genre: ['fps'],                   mode: ['5v5', 'round based'],         platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['tactical shooter', 'hero shooter'], mechanics: ['aim', 'ability', 'strategy'] },
  dota2:      { genre: ['moba'],                  mode: ['5v5'],                        platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['fantasia', 'hardcore'],           mechanics: ['strategy', 'itemization', 'lane'] },
  mlbb:       { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasia'],                       mechanics: ['teamplay', 'lane', 'rotation'] },
  wildrift:   { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasia', 'hero based'],         mechanics: ['lane', 'teamfight'] },
  fortnite:   { genre: ['battle royale'],         mode: ['solo', 'squad'],             platform: ['cross platform'],   competitive: ['competitivo'],            style: ['casual', 'construccion'],         mechanics: ['building', 'shooting', 'survival'] },
  brawlhalla:{ genre: ['fighting'],              mode: ['1v1', '2v2'],                platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['platform fighter', 'arcade'],     mechanics: ['neutral', 'combo', 'ring out'] },
  cs2:        { genre: ['fps'],                   mode: ['round based', 'bomb defusal'],platform: ['pc'],              competitive: ['competitivo', 'esports'], style: ['tactical shooter', 'realistic'],  mechanics: ['aim', 'strategy', 'economy'] },
  apex:       { genre: ['battle royale'],         mode: ['squad', 'ranked'],           platform: ['cross platform'],   competitive: ['competitivo'],            style: ['hero shooter', 'movement'],       mechanics: ['movement', 'abilities', 'revive'] },
  warzone:    { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['cross platform'],   competitive: ['competitivo'],            style: ['realistic', 'military'],          mechanics: ['shooting', 'survival', 'looting'] },
  pubg:       { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo'],            style: ['realistic', 'survival'],          mechanics: ['shooting', 'looting', 'circle'] },
  pubgm:      { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo'],            style: ['realistic', 'survival'],          mechanics: ['shooting', 'looting', 'circle'] },
  rl:         { genre: ['sports'],                mode: ['3v3', '1v1'],                platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['soccer', 'arcade'],               mechanics: ['cars', 'physics', 'aerial'] },
  fifa:       { genre: ['sports'],                mode: ['1v1'],                       platform: ['console', 'pc'],    competitive: ['competitivo', 'esports'], style: ['football', 'simulation'],         mechanics: ['passing', 'dribbling', 'tactics'] },
  smash:      { genre: ['fighting'],              mode: ['1v1', '2v2'],                platform: ['nintendo'],         competitive: ['competitivo', 'esports'], style: ['platform fighter', 'arcade'],     mechanics: ['neutral', 'combo', 'edgeguard'] },
  tekken:     { genre: ['fighting'],              mode: ['1v1', 'ranked'],             platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['arcade', '3d fighter'],           mechanics: ['combo', 'mixup', 'pressure'] },
  tekken8:    { genre: ['fighting'],              mode: ['1v1', 'ranked'],             platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['arcade', '3d fighter'],           mechanics: ['combo', 'mixup', 'pressure'] },
  sf6:        { genre: ['fighting'],              mode: ['1v1', 'ranked'],             platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['arcade', '2d fighter'],           mechanics: ['combo', 'framedata', 'neutral'] },
  gta:        { genre: ['open world'],            mode: ['multiplayer', 'roleplay'],   platform: ['pc', 'console'],    competitive: [],                         style: ['roleplay', 'sandbox'],            mechanics: ['accion', 'libre', 'rp'] },
  genshin:    { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['cross platform'],   competitive: [],                         style: ['anime', 'fantasia'],              mechanics: ['gacha', 'open world', 'exploration'] },
  amongus:    { genre: ['social deduction'],      mode: ['multiplayer'],               platform: ['cross platform'],   competitive: ['casual'],                 style: ['party'],                          mechanics: ['impostor', 'debate', 'deduction'] },
  fallguys:   { genre: ['party'],                 mode: ['multiplayer'],               platform: ['cross platform'],   competitive: ['casual'],                 style: ['casual', 'colorido'],             mechanics: ['obstacle', 'platform', 'mini games'] },
  marvel:     { genre: ['fps'],                   mode: ['6v6', 'competitive'],         platform: ['pc'],               competitive: ['competitivo'],            style: ['hero shooter'],                   mechanics: ['teamplay', 'abilities', 'combo'] },
  xdefiant:   { genre: ['fps'],                   mode: ['6v6'],                        platform: ['pc', 'console'],    competitive: ['competitivo'],            style: ['arena shooter'],                  mechanics: ['factions', 'aim', 'abilities'] },
  thefinals:  { genre: ['fps'],                   mode: ['squad'],                      platform: ['cross platform'],   competitive: ['competitivo'],            style: ['arena shooter'],                  mechanics: ['destruction', 'cash out', 'teamplay'] },
  tarkov:     { genre: ['fps'],                   mode: ['squad', 'solo'],             platform: ['pc'],               competitive: ['hardcore'],               style: ['realistic', 'military'],          mechanics: ['survival', 'extraction', 'looting'] },
  deadlock:   { genre: ['moba'],                  mode: ['6v6'],                        platform: ['pc'],               competitive: ['competitivo'],            style: ['hero shooter', 'third person'],   mechanics: ['teamplay', 'objectives', 'shooter'] },
  eafc25:     { genre: ['sports'],                mode: ['1v1', 'ultimate team'],      platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['soccer', 'simulation'],           mechanics: ['dribble', 'tactics', 'passing'] },
  dbsz:       { genre: ['fighting'],              mode: ['1v1'],                        platform: ['pc', 'console'],    competitive: ['competitivo'],            style: ['anime', 'arena fighter'],         mechanics: ['combo', 'tag', 'sparking'] },
  multiversus: { genre: ['fighting'],             mode: ['2v2', '1v1'],               platform: ['cross platform'],   competitive: ['competitivo'],            style: ['platform fighter', 'crossover'],  mechanics: ['perks', 'combo', 'ring out'] },
  palworld:   { genre: ['rpg'],                   mode: ['multiplayer', 'coop'],       platform: ['pc', 'console'],    competitive: [],                         style: ['survival', 'open world'],         mechanics: ['creatures', 'crafting', 'building'] },
  helldivers2:{ genre: ['fps'],                   mode: ['coop', 'squad'],             platform: ['pc', 'console'],    competitive: [],                         style: ['sci-fi', 'military'],             mechanics: ['cooperation', 'extraction', 'strategy'] },
  bg3:        { genre: ['rpg'],                   mode: ['coop', 'solo'],              platform: ['pc', 'console'],    competitive: [],                         style: ['fantasy', 'dark'],                mechanics: ['turn based', 'story rich', 'choices'] },
  ow2:        { genre: ['fps'],                   mode: ['5v5', 'competitive'],         platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['hero shooter'],                   mechanics: ['teamplay', 'roles', 'ultimate'] },
  hs:         { genre: ['strategy', 'card game'], mode: ['1v1', 'ranked'],             platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['fantasy', 'collectible'],         mechanics: ['deck building', 'combos', 'rng'] },
  lor:        { genre: ['strategy', 'card game'], mode: ['1v1'],                        platform: ['pc', 'mobile'],     competitive: ['competitivo'],            style: ['fantasy'],                        mechanics: ['deck building', 'regions', 'keywords'] },
  tft:        { genre: ['strategy'],              mode: ['8 players'],                  platform: ['pc', 'mobile'],     competitive: ['competitivo'],            style: ['autobattler', 'fantasy'],         mechanics: ['draft', 'sinergias', 'economia'] },
  r6:         { genre: ['fps'],                   mode: ['5v5', 'round based'],         platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['tactical shooter', 'realistic'],  mechanics: ['destruction', 'gadgets', 'operators'] },
  aov:        { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasia'],                       mechanics: ['teamplay', 'lane', 'rotation'] },
  hok:        { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile', 'pc'],     competitive: ['competitivo', 'esports'], style: ['fantasy', 'fast paced'],          mechanics: ['teamplay', 'lane', 'skills'] },
  cr:         { genre: ['strategy'],              mode: ['1v1', '2v2'],                platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasy', 'tower defense'],       mechanics: ['deck building', 'elixir', 'towers'] },
  starcraft:  { genre: ['strategy'],              mode: ['1v1'],                        platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['sci-fi', 'rts'],                  mechanics: ['apm', 'micro', 'macro'] },
  nba2k:      { genre: ['sports'],                mode: ['competitive', 'myteam'],     platform: ['cross platform'],   competitive: ['competitivo'],            style: ['basketball', 'simulation'],       mechanics: ['dribble', 'shooting', 'defense'] },
  mariokart:  { genre: ['racing'],                mode: ['multiplayer', 'online'],     platform: ['nintendo'],         competitive: ['competitivo'],            style: ['party', 'kart'],                  mechanics: ['items', 'drifting', 'shortcuts'] },
  halo:       { genre: ['fps'],                   mode: ['competitive', 'squad'],      platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['sci-fi', 'arena shooter'],        mechanics: ['aim', 'teamplay', 'control'] },
  wuwa:       { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['pc', 'mobile'],     competitive: [],                         style: ['anime', 'fantasia'],              mechanics: ['gacha', 'open world', 'exploration'] },
  freefire:   { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['survival', 'mobile'],             mechanics: ['shooting', 'looting', 'circle'] },
  ff:         { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['survival', 'mobile'],             mechanics: ['shooting', 'looting', 'circle'] },
  codm:       { genre: ['fps'],                   mode: ['5v5', 'search and destroy'], platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['military', 'arcade'],             mechanics: ['aim', 'rotations', 'objective'] },
  codbo6:     { genre: ['fps'],                   mode: ['6v6', 'competitive'],         platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['military', 'arcade'],             mechanics: ['aim', 'loadouts', 'killstreaks'] },
  mk1:        { genre: ['fighting'],              mode: ['1v1', 'ranked'],             platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['arcade', '2d fighter'],           mechanics: ['combo', 'fatality', 'kameo'] },
  eldenring:  { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['pc', 'console'],    competitive: [],                         style: ['dark fantasy', 'open world'],     mechanics: ['exploration', 'boss fights', 'builds'] },
  cyberpunk:  { genre: ['rpg', 'action rpg'],     mode: ['solo'],                       platform: ['pc', 'console'],    competitive: [],                         style: ['open world', 'cyberpunk'],        mechanics: ['shooting', 'hacking', 'choices'] },
  rdr2:       { genre: ['rpg', 'open world'],     mode: ['multiplayer', 'solo'],       platform: ['pc', 'console'],    competitive: [],                         style: ['western', 'open world'],          mechanics: ['shooting', 'hunting', 'story rich'] },
  mhwilds:    { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['pc', 'console'],    competitive: [],                         style: ['fantasy', 'open world'],          mechanics: ['weapons', 'hunting', 'crafting'] },
  hogwarts:   { genre: ['rpg', 'open world'],     mode: ['solo'],                       platform: ['pc', 'console'],    competitive: [],                         style: ['fantasy', 'open world'],          mechanics: ['magic', 'exploration', 'story rich'] },
  nms:        { genre: ['rpg', 'open world'],     mode: ['multiplayer', 'coop'],       platform: ['cross platform'],   competitive: [],                         style: ['sci-fi', 'survival'],             mechanics: ['exploration', 'crafting', 'building'] },
};

export const COMMUNITY_FILTERS = COMMUNITY_FILTER_OPTIONS.map((option) => ({ ...option }));

export const COMMUNITY_LIST = [
  {
    id: 'val-latam',
    name: 'Valorant LATAM',
    slug: 'valorant-latam',
    description: 'La comunidad mas grande de Valorant en Latinoamerica. Torneos semanales, clips epicos y LFG para ranked.',
    members: 12847,
    online: 342,
    posts: 856,
    game: 'Valorant',
    img: ValorantImg,
    color: '#ff4655',
    tags: ['Torneos', 'Ranked', 'Clips'],
    featured: true,
    category: 'popular',
    createdAt: '2024-03-15'
  },
  {
    id: 'lol-esports',
    name: 'LoL Esports Hub',
    slug: 'lol-esports-hub',
    description: 'Todo sobre la escena competitiva de League of Legends. Analisis, pronosticos, LEC, LCS, Worlds y mas.',
    members: 8432,
    online: 189,
    posts: 1243,
    game: 'League of Legends',
    color: '#0ac8b9',
    img: LoLImg,
    tags: ['Esports', 'LEC', 'Worlds'],
    featured: true,
    category: 'popular',
    createdAt: '2024-01-20'
  },
  {
    id: 'cs2-hispano',
    name: 'CS2 Hispano',
    slug: 'cs2-hispano',
    description: 'Comunidad hispanohablante de CS2. Strats, lineups, trading de skins y partidas custom diarias.',
    members: 6721,
    online: 231,
    posts: 432,
    game: 'CS2',
    color: '#de9b35',
    img: CS2Img,
    tags: ['Strats', 'Skins', 'Customs'],
    featured: false,
    category: 'popular',
    createdAt: '2024-06-10'
  },
  {
    id: 'fortnite-creative',
    name: 'Fortnite Creativo',
    slug: 'fortnite-creativo',
    description: 'Mapas creativos, box fights, zone wars y todo el contenido creativo de Fortnite. Comparte tus creaciones.',
    members: 5134,
    online: 167,
    posts: 289,
    game: 'Fortnite',
    color: '#a35ddf',
    img: FortniteImg,
    tags: ['Creativo', 'BoxFight', 'Mapas'],
    featured: false,
    category: 'popular',
    createdAt: '2024-08-01'
  },
  {
    id: 'apex-ranked',
    name: 'Apex Ranked Grind',
    slug: 'apex-ranked-grind',
    description: 'Para los que buscan subir a Predator. LFG ranked, tips de rotacion, analisis de leyendas y mas.',
    members: 3245,
    online: 98,
    posts: 167,
    game: 'Apex Legends',
    color: '#cd3333',
    img: ApexImg,
    tags: ['Ranked', 'LFG', 'Tips'],
    featured: true,
    category: 'new',
    createdAt: '2025-11-20'
  },
  {
    id: 'tekken-dojo',
    name: 'Tekken Dojo',
    slug: 'tekken-dojo',
    description: 'Aprende combos, framedata y matchups. La academia de Tekken 8 para todos los niveles de juego.',
    members: 1876,
    online: 54,
    posts: 93,
    game: 'Tekken 8',
    color: '#ffd700',
    img: Tekken8Img,
    tags: ['Combos', 'Ranked', 'Guias'],
    featured: false,
    category: 'new',
    createdAt: '2026-01-05'
  },
  {
    id: 'ow2-meta',
    name: 'OW2 Meta Watch',
    slug: 'ow2-meta-watch',
    description: 'Seguimiento del meta de Overwatch 2. Tier lists, composiciones, OWL highlights y discusion competitiva.',
    members: 2190,
    online: 71,
    posts: 204,
    game: 'Overwatch 2',
    color: '#f99e1a',
    img: OW2Img,
    tags: ['Meta', 'OWL', 'Tier List'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-01'
  },
  {
    id: 'rl-freestyle',
    name: 'RL Freestyle Club',
    slug: 'rl-freestyle',
    description: 'Flip resets, ceiling shots y air dribbles. La comunidad de freestylers de Rocket League.',
    members: 1432,
    online: 42,
    posts: 78,
    game: 'Rocket League',
    color: '#0088ff',
    img: RLImg,
    tags: ['Freestyle', 'Clips', 'Montages'],
    featured: false,
    category: 'new',
    createdAt: '2026-01-28'
  },
  {
    id: 'genshin-latam',
    name: 'Genshin LATAM',
    slug: 'genshin-latam',
    description: 'Exploradores de Teyvat. Guias de personajes, builds, eventos y farmeo. Comunidad activa en español.',
    members: 9245,
    online: 278,
    posts: 1567,
    game: 'Genshin Impact',
    color: '#14b8a6',
    img: GenshinImg,
    tags: ['Builds', 'Guias', 'Lore'],
    featured: true,
    category: 'popular',
    createdAt: '2024-05-10'
  },
  {
    id: 'free-fire-pro',
    name: 'Free Fire Pro League',
    slug: 'ff-pro-league',
    description: 'La liga profesional de Free Fire. Clasificatorias, scrims y coaching para jugadores competitivos.',
    members: 7832,
    online: 312,
    posts: 923,
    game: 'Free Fire',
    color: '#ffaa00',
    img: FFImg,
    tags: ['Competitivo', 'Scrims', 'Pro'],
    featured: false,
    category: 'popular',
    createdAt: '2024-09-15'
  },
  {
    id: 'dota2-strats',
    name: 'Dota 2 Strategos',
    slug: 'dota2-strategos',
    description: 'Analisis de drafts, replays y discusion de meta. Para los que quieren mejorar su MMR.',
    members: 4567,
    online: 134,
    posts: 678,
    game: 'Dota 2',
    color: '#e33935',
    img: Dota2Img,
    tags: ['Drafts', 'Meta', 'MMR'],
    featured: false,
    category: 'popular',
    createdAt: '2024-04-20'
  },
  {
    id: 'mlbb-heroes',
    name: 'MLBB Heroes Hub',
    slug: 'mlbb-heroes',
    description: 'Todo sobre Mobile Legends. Tier lists, builds, rotaciones y torneos. La comunidad #1 en LATAM.',
    members: 11234,
    online: 456,
    posts: 2134,
    game: 'Mobile Legends',
    color: '#00d2ff',
    img: MLBBImg,
    tags: ['Tier List', 'Builds', 'Torneos'],
    featured: true,
    category: 'popular',
    createdAt: '2024-02-28'
  },
  {
    id: 'sf6-dojo',
    name: 'SF6 Fighting Dojo',
    slug: 'sf6-dojo',
    description: 'Frame data, combos y matchups de Street Fighter 6. Torneos semanales FT5 y coaching gratuito.',
    members: 2345,
    online: 87,
    posts: 345,
    game: 'Street Fighter 6',
    color: '#ff5e00',
    img: SF6Img,
    tags: ['Combos', 'Framedata', 'FT5'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-10'
  },
  {
    id: 'brawlhalla-hub',
    name: 'Brawlhalla Caribe Hub',
    slug: 'brawlhalla-caribe-hub',
    description: 'Comunidad activa de Brawlhalla con brackets semanales, 1v1, 2v2 y sparrings para mejorar neutral y confirms.',
    members: 1648,
    online: 63,
    posts: 142,
    game: 'Brawlhalla',
    color: '#00bcd4',
    img: BrawlhallaImg,
    tags: ['1v1', '2v2', 'Scrims'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-18'
  },
  {
    id: 'warzone-squads',
    name: 'Warzone Squad Finder',
    slug: 'warzone-squads',
    description: 'Encuentra tu squad perfecto para Warzone. LFG, estrategias de rotacion y loadouts meta.',
    members: 5678,
    online: 198,
    posts: 456,
    game: 'Warzone',
    color: '#4caf50',
    img: WarzoneImg,
    tags: ['LFG', 'Squads', 'Loadouts'],
    featured: false,
    category: 'new',
    createdAt: '2026-01-15'
  },
  {
    id: 'r6-tactico',
    name: 'R6 Tactico LATAM',
    slug: 'r6-tactico',
    description: 'Estrategias, callouts y lineups para Rainbow Six Siege. Scrims organizados y analisis de mapas.',
    members: 3456,
    online: 112,
    posts: 289,
    game: 'Rainbow Six Siege',
    color: '#ff8c00',
    img: R6SImg,
    tags: ['Strats', 'Callouts', 'Scrims'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-20'
  },
  {
    id: 'pubgm-ranked',
    name: 'PUBG Mobile Ranked LATAM',
    slug: 'pubgm-ranked-latam',
    description: 'Rotaciones, scrims privadas y squads competitivos para PUBG Mobile en LATAM.',
    members: 2983,
    online: 111,
    posts: 267,
    game: 'PUBG Mobile',
    color: '#f2a93b',
    img: PUBGMImg,
    tags: ['Scrims', 'Ranked', 'Squads'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-24'
  },
  {
    id: 'codm-competitive',
    name: 'COD Mobile Competitive',
    slug: 'codm-competitive',
    description: 'S&D, Hardpoint y rosters competitivos de COD Mobile con enfoque en torneos y scrims.',
    members: 3412,
    online: 127,
    posts: 311,
    game: 'COD Mobile',
    color: '#ff7a00',
    img: CODMImg,
    tags: ['S&D', 'Hardpoint', 'Scrims'],
    featured: false,
    category: 'new',
    createdAt: '2026-02-26'
  }
];

export const normalizeCommunityHubGameId = (value = '') =>
  normalizeSharedCommunityGameId(value) || normalizeCommunityLookup(value);

export const getCommunityGameEntry = (value = '') => {
  const canonicalId = normalizeCommunityHubGameId(value);
  if (!canonicalId) return null;

  return (
    COMMUNITY_GAMES.find((game) => game.id === canonicalId) ||
    COMMUNITY_GAMES.find(
      (game) =>
        normalizeCommunityLookup(game.id) === canonicalId ||
        normalizeCommunityLookup(game.name) === canonicalId
    ) ||
    null
  );
};

export const buildCommunityGamePreview = (value = '', fallback = {}) => {
  const canonicalId = normalizeCommunityHubGameId(value);
  const game = getCommunityGameEntry(value);

  if (game) return game;

  return {
    id: canonicalId || String(value || '').trim(),
    name: normalizeSharedCommunityGameName(value) || fallback.name || String(value || '').trim(),
    img: fallback.img || '',
    color: fallback.color || '',
    cat: fallback.cat || '',
    players: fallback.players || '0',
    url: fallback.url || '',
  };
};

export const getFallbackCommunitiesByGame = (value = '') => {
  const canonicalId = normalizeCommunityHubGameId(value);
  if (!canonicalId) return [];

  return COMMUNITY_LIST
    .filter((community) => normalizeCommunityHubGameId(community.game) === canonicalId)
    .map((community) => ({
      id: community.id,
      name: community.name,
      shortUrl: community.slug || community.id,
      description: community.description || '',
      membersCount: Number(community.members || 0),
      avatarUrl: community.img || '',
      bannerUrl: community.img || '',
      mainGames: [canonicalId],
      region: 'LATAM',
      isFallback: true,
    }));
};

export const COMMUNITY_TRENDING_TOPICS = [
  { title: 'Nuevo agente Valorant', game: 'Valorant', color: '#ff4655', comments: 234 },
  { title: 'Worlds 2026 sedes', game: 'LoL', color: '#0ac8b9', comments: 189 },
  { title: 'CS2 Major Spring', game: 'CS2', color: '#de9b35', comments: 156 },
  { title: 'Season 4 Battle Pass', game: 'Fortnite', color: '#a35ddf', comments: 142 },
  { title: 'Ranked Split 2', game: 'Apex', color: '#cd3333', comments: 98 }
];
