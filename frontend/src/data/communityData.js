import FortniteImg from '../assets/comunidad/Fortnite.jpg';
import CS2Img from '../assets/comunidad/CS2.jpg';
import CRImg from '../assets/comunidad/CR.jpg';
import AOVImg from '../assets/comunidad/AOV.jpg';
import HoKImg from '../assets/comunidad/HoK_V.jpg';
import FFImg from '../assets/comunidad/FF.jpg';
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

export const COMMUNITY_GAMES = [
  { name: 'Valorant', id: 'valorant', img: ValorantImg, color: '#ff4655', cat: 'FPS', players: '35.2k' },
  { name: 'League of Legends', id: 'lol', img: LoLImg, color: '#0ac8b9', cat: 'MOBA', players: '48.1k' },
  { name: 'CS2', id: 'cs2', img: CS2Img, color: '#de9b35', cat: 'FPS', players: '29.7k' },
  { name: 'Fortnite', id: 'fortnite', img: FortniteImg, color: '#22c55e', cat: 'BR', players: '41.3k' },
  { name: 'Warzone', id: 'warzone', img: WarzoneImg, color: '#4caf50', cat: 'BR', players: '22.8k' },
  { name: 'Overwatch 2', id: 'ow2', img: OW2Img, color: '#f99e1a', cat: 'FPS', players: '18.5k' },
  { name: 'Dota 2', id: 'dota2', img: Dota2Img, color: '#e33935', cat: 'MOBA', players: '15.9k' },
  { name: 'Hearthstone', id: 'hs', img: HSImg, color: '#22c55e', cat: 'Strategy', players: '9.8k' },
  { name: 'Legends of Runeterra', id: 'lor', img: LoRImg, color: '#16a34a', cat: 'Strategy', players: '6.3k' },
  { name: 'Rocket League', id: 'rl', img: RLImg, color: '#0088ff', cat: 'Sports', players: '12.3k' },
  { name: 'Apex Legends', id: 'apex', img: ApexImg, color: '#cd3333', cat: 'BR', players: '19.4k' },
  { name: 'PUBG Mobile', id: 'pubgm', img: PUBGMImg, color: '#f2a93b', cat: 'BR', players: '14.1k' },
  { name: 'Rainbow Six Siege', id: 'r6', img: R6SImg, color: '#ff8c00', cat: 'FPS', players: '11.2k' },
  { name: 'Street Fighter 6', id: 'sf6', img: SF6Img, color: '#ff5e00', cat: 'Fighting', players: '8.7k' },
  { name: 'Tekken 8', id: 'tekken8', img: Tekken8Img, color: '#ffd700', cat: 'Fighting', players: '9.1k' },
  { name: 'Mobile Legends', id: 'mlbb', img: MLBBImg, color: '#00d2ff', cat: 'MOBA', players: '26.4k' },
  { name: 'Free Fire', id: 'ff', img: FFImg, color: '#ffaa00', cat: 'BR', players: '31.6k' },
  { name: 'Clash Royale', id: 'cr', img: CRImg, color: '#3b82f6', cat: 'Strategy', players: '10.5k' },
  { name: 'Arena of Valor', id: 'aov', img: AOVImg, color: '#10b981', cat: 'MOBA', players: '11.9k' },
  { name: 'Honor of Kings', id: 'hok', img: HoKImg, color: '#eab308', cat: 'MOBA', players: '45.2k' },
  { name: 'TFT', id: 'tft', img: TFTImg, color: '#16a34a', cat: 'Strategy', players: '7.8k' },
  { name: 'Wild Rift', id: 'wildrift', img: WildRiftImg, color: '#22d3ee', cat: 'MOBA', players: '16.9k' },
  { name: 'StarCraft II', id: 'starcraft', img: SC2Img, color: '#1d4ed8', cat: 'Strategy', players: '8.2k' },
  { name: 'NBA 2K24', id: 'nba2k', img: NBA2K24Img, color: '#f59e0b', cat: 'Sports', players: '10.2k' },
  { name: 'GTA V', id: 'gta', img: GTAImg, color: '#15803d', cat: 'RPG', players: '20.1k' },
  { name: 'Genshin Impact', id: 'genshin', img: GenshinImg, color: '#14b8a6', cat: 'RPG', players: '24.8k' },
  { name: 'Mario Kart', id: 'mariokart', img: MarioKartImg, color: '#22c55e', cat: 'Sports', players: '13.6k' },
  { name: 'Halo Infinite', id: 'halo', img: HaloImg, color: '#0ea5e9', cat: 'FPS', players: '9.7k' },
  { name: 'Among Us', id: 'amongus', img: AmongUsImg, color: '#16a34a', cat: 'Social', players: '7.5k' },
  { name: 'Fall Guys', id: 'fallguys', img: FallGuysImg, color: '#22c55e', cat: 'Social', players: '6.4k' },
  { name: 'Wuthering Waves', id: 'wuwa', img: WuwaImg, color: '#10b981', cat: 'RPG', players: '8.9k' }
];

export const COMMUNITY_FILTERS = [
  { label: 'Todos', value: 'all', icon: 'bx bx-grid-alt' },
  { label: 'FPS', value: 'FPS', icon: 'bx bx-target-lock' },
  { label: 'MOBA', value: 'MOBA', icon: 'bx bx-shield-quarter' },
  { label: 'Battle Royale', value: 'BR', icon: 'bx bx-crosshair' },
  { label: 'Fighting', value: 'Fighting', icon: 'bx bxs-hand' },
  { label: 'Estrategia', value: 'Strategy', icon: 'bx bx-chess' },
  { label: 'Deportes', value: 'Sports', icon: 'bx bx-football' },
  { label: 'RPG', value: 'RPG', icon: 'bx bx-map' },
  { label: 'Social', value: 'Social', icon: 'bx bx-group' }
];

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
  }
];

export const COMMUNITY_TRENDING_TOPICS = [
  { title: 'Nuevo agente Valorant', game: 'Valorant', color: '#ff4655', comments: 234 },
  { title: 'Worlds 2026 sedes', game: 'LoL', color: '#0ac8b9', comments: 189 },
  { title: 'CS2 Major Spring', game: 'CS2', color: '#de9b35', comments: 156 },
  { title: 'Season 4 Battle Pass', game: 'Fortnite', color: '#a35ddf', comments: 142 },
  { title: 'Ranked Split 2', game: 'Apex', color: '#cd3333', comments: 98 }
];
