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
  { name: 'Valorant', id: 'valorant', img: ValorantImg, color: '#ff4655', cat: 'FPS', players: '0', url: 'https://playvalorant.com' },
  { name: 'League of Legends', id: 'lol', img: LoLImg, color: '#0ac8b9', cat: 'MOBA', players: '0', url: 'https://www.leagueoflegends.com' },
  { name: 'CS2', id: 'cs2', img: CS2Img, color: '#de9b35', cat: 'FPS', players: '0', url: 'https://www.counter-strike.net' },
  { name: 'Fortnite', id: 'fortnite', img: FortniteImg, color: '#22c55e', cat: 'BR', players: '0', url: 'https://www.fortnite.com' },
  { name: 'Warzone', id: 'warzone', img: WarzoneImg, color: '#4caf50', cat: 'BR', players: '0', url: 'https://www.callofduty.com/warzone' },
  { name: 'Overwatch 2', id: 'ow2', img: OW2Img, color: '#f99e1a', cat: 'FPS', players: '0', url: 'https://overwatch.blizzard.com' },
  { name: 'Dota 2', id: 'dota2', img: Dota2Img, color: '#e33935', cat: 'MOBA', players: '0', url: 'https://www.dota2.com' },
  { name: 'Hearthstone', id: 'hs', img: HSImg, color: '#22c55e', cat: 'Strategy', players: '0', url: 'https://hearthstone.blizzard.com' },
  { name: 'Legends of Runeterra', id: 'lor', img: LoRImg, color: '#16a34a', cat: 'Strategy', players: '0', url: 'https://playruneterra.com' },
  { name: 'Rocket League', id: 'rl', img: RLImg, color: '#0088ff', cat: 'Sports', players: '0', url: 'https://www.rocketleague.com' },
  { name: 'Apex Legends', id: 'apex', img: ApexImg, color: '#cd3333', cat: 'BR', players: '0', url: 'https://www.ea.com/games/apex-legends' },
  { name: 'PUBG Mobile', id: 'pubgm', img: PUBGMImg, color: '#f2a93b', cat: 'BR', players: '0', url: 'https://www.pubgmobile.com' },
  { name: 'Rainbow Six Siege', id: 'r6', img: R6SImg, color: '#ff8c00', cat: 'FPS', players: '0', url: 'https://www.ubisoft.com/en-us/game/rainbow-six/siege' },
  { name: 'Street Fighter 6', id: 'sf6', img: SF6Img, color: '#ff5e00', cat: 'Fighting', players: '0', url: 'https://www.streetfighter.com/6' },
  { name: 'Tekken 8', id: 'tekken8', img: Tekken8Img, color: '#ffd700', cat: 'Fighting', players: '0', url: 'https://www.bandainamcoent.com/games/tekken-8' },
  { name: 'Mobile Legends', id: 'mlbb', img: MLBBImg, color: '#00d2ff', cat: 'MOBA', players: '0', url: 'https://www.mobilelegends.com' },
  { name: 'Free Fire', id: 'ff', img: FFImg, color: '#ffaa00', cat: 'BR', players: '0', url: 'https://ff.garena.com' },
  { name: 'Clash Royale', id: 'cr', img: CRImg, color: '#3b82f6', cat: 'Strategy', players: '0', url: 'https://supercell.com/en/games/clashroyale' },
  { name: 'Arena of Valor', id: 'aov', img: AOVImg, color: '#10b981', cat: 'MOBA', players: '0', url: 'https://www.arenaofvalor.com' },
  { name: 'Honor of Kings', id: 'hok', img: HoKImg, color: '#eab308', cat: 'MOBA', players: '0', url: 'https://www.honorofkings.com' },
  { name: 'TFT', id: 'tft', img: TFTImg, color: '#16a34a', cat: 'Strategy', players: '0', url: 'https://teamfighttactics.leagueoflegends.com' },
  { name: 'Wild Rift', id: 'wildrift', img: WildRiftImg, color: '#22d3ee', cat: 'MOBA', players: '0', url: 'https://wildrift.leagueoflegends.com' },
  { name: 'StarCraft II', id: 'starcraft', img: SC2Img, color: '#1d4ed8', cat: 'Strategy', players: '0', url: 'https://starcraft2.blizzard.com' },
  { name: 'NBA 2K24', id: 'nba2k', img: NBA2K24Img, color: '#f59e0b', cat: 'Sports', players: '0', url: 'https://nba.2k.com' },
  { name: 'GTA V', id: 'gta', img: GTAImg, color: '#15803d', cat: 'RPG', players: '0', url: 'https://www.rockstargames.com/gta-v' },
  { name: 'Genshin Impact', id: 'genshin', img: GenshinImg, color: '#14b8a6', cat: 'RPG', players: '0', url: 'https://genshin.hoyoverse.com' },
  { name: 'Mario Kart', id: 'mariokart', img: MarioKartImg, color: '#22c55e', cat: 'Sports', players: '0', url: 'https://mariokart.nintendo.com' },
  { name: 'Halo Infinite', id: 'halo', img: HaloImg, color: '#0ea5e9', cat: 'FPS', players: '0', url: 'https://www.halowaypoint.com/halo-infinite' },
  { name: 'Among Us', id: 'amongus', img: AmongUsImg, color: '#16a34a', cat: 'Social', players: '0', url: 'https://www.innersloth.com/games/among-us' },
  { name: 'Fall Guys', id: 'fallguys', img: FallGuysImg, color: '#22c55e', cat: 'Social', players: '0', url: 'https://www.fallguys.com' },
  { name: 'Wuthering Waves', id: 'wuwa', img: WuwaImg, color: '#10b981', cat: 'RPG', players: '0', url: 'https://wutheringwaves.kurogames.com' },
  { name: 'Marvel Rivals', id: 'marvel', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2767030/header.jpg', color: '#ef4444', cat: 'FPS', players: '0', url: 'https://www.marvelrivals.com' },
  { name: 'XDefiant', id: 'xdefiant', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2434700/header.jpg', color: '#f97316', cat: 'FPS', players: '0', url: 'https://www.ubisoft.com/en-us/game/xdefiant' },
  { name: 'The Finals', id: 'thefinals', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2073850/header.jpg', color: '#e11d48', cat: 'FPS', players: '0', url: 'https://www.reachthefinals.com' },
  { name: 'Escape From Tarkov', id: 'tarkov', img: 'https://images.ctfassets.net/pvgyxhxq7n13/6PRfN5Bfc2fNqppM8oaYwN/0a1f092f8e8fd3e26d61f5f64f2f95de/eft_share.jpg', color: '#84cc16', cat: 'FPS', players: '0', url: 'https://www.escapefromtarkov.com' },
  { name: 'Deadlock', id: 'deadlock', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1422450/header.jpg', color: '#8b5cf6', cat: 'MOBA', players: '0', url: 'https://store.steampowered.com/app/1422450/Deadlock' },
  { name: 'EA FC 25', id: 'eafc25', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2669320/header.jpg', color: '#22c55e', cat: 'Sports', players: '0', url: 'https://www.ea.com/games/ea-sports-fc/fc-25' },
  { name: 'Dragon Ball Sparking Zero', id: 'dbsz', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1790600/header.jpg', color: '#f59e0b', cat: 'Fighting', players: '0', url: 'https://en.bandainamcoent.eu/dragon-ball/dragon-ball-sparking-zero' },
  { name: 'MultiVersus', id: 'multiversus', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1818750/header.jpg', color: '#3b82f6', cat: 'Fighting', players: '0', url: 'https://multiversus.com' },
  { name: 'Palworld', id: 'palworld', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg', color: '#10b981', cat: 'RPG', players: '0', url: 'https://www.pocketpair.jp/palworld' },
  { name: 'Helldivers 2', id: 'helldivers2', img: 'https://cdn.akamai.steamstatic.com/steam/apps/553850/header.jpg', color: '#facc15', cat: 'FPS', players: '0', url: 'https://www.playstation.com/games/helldivers-2' },
  { name: 'Baldur Gate 3', id: 'bg3', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg', color: '#f59e0b', cat: 'RPG', players: '0', url: 'https://baldursgate3.game' },
  { name: 'Call of Duty BO6', id: 'codbo6', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2933620/header.jpg', color: '#f97316', cat: 'FPS', players: '0', url: 'https://www.callofduty.com/blackops6' },
  { name: 'Mortal Kombat 1', id: 'mk1', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1971870/header.jpg', color: '#dc2626', cat: 'Fighting', players: '0', url: 'https://www.mortalkombat.com' },
  { name: 'Elden Ring', id: 'eldenring', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg', color: '#d4a017', cat: 'RPG', players: '0', url: 'https://www.eldenring.jp' },
  { name: 'Cyberpunk 2077', id: 'cyberpunk', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg', color: '#fbbf24', cat: 'RPG', players: '0', url: 'https://www.cyberpunk.net' },
  { name: 'Red Dead Redemption 2', id: 'rdr2', img: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg', color: '#b91c1c', cat: 'RPG', players: '0', url: 'https://www.rockstargames.com/reddeadredemption2' },
  { name: 'Monster Hunter Wilds', id: 'mhwilds', img: 'https://cdn.akamai.steamstatic.com/steam/apps/2246340/header.jpg', color: '#059669', cat: 'RPG', players: '0', url: 'https://www.monsterhunter.com/wilds' },
  { name: 'Hogwarts Legacy', id: 'hogwarts', img: 'https://cdn.akamai.steamstatic.com/steam/apps/990080/header.jpg', color: '#7c3aed', cat: 'RPG', players: '0', url: 'https://www.hogwartslegacy.com' },
  { name: 'No Mans Sky', id: 'nms', img: 'https://cdn.akamai.steamstatic.com/steam/apps/275850/header.jpg', color: '#0891b2', cat: 'RPG', players: '0', url: 'https://www.nomanssky.com' }
];

export const COMMUNITY_GAME_TAXONOMY = {
  lol:        { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['fantasia', 'hero based'],         mechanics: ['lane', 'teamfight', 'objectives'] },
  valorant:   { genre: ['fps'],                   mode: ['5v5', 'round based'],         platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['tactical shooter', 'hero shooter'], mechanics: ['aim', 'ability', 'strategy'] },
  dota2:      { genre: ['moba'],                  mode: ['5v5'],                        platform: ['pc'],               competitive: ['competitivo', 'esports'], style: ['fantasia', 'hardcore'],           mechanics: ['strategy', 'itemization', 'lane'] },
  mlbb:       { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasia'],                       mechanics: ['teamplay', 'lane', 'rotation'] },
  wildrift:   { genre: ['moba'],                  mode: ['5v5', 'ranked'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['fantasia', 'hero based'],         mechanics: ['lane', 'teamfight'] },
  fortnite:   { genre: ['battle royale'],         mode: ['solo', 'squad'],             platform: ['cross platform'],   competitive: ['competitivo'],            style: ['casual', 'construccion'],         mechanics: ['building', 'shooting', 'survival'] },
  cs2:        { genre: ['fps'],                   mode: ['round based', 'bomb defusal'],platform: ['pc'],              competitive: ['competitivo', 'esports'], style: ['tactical shooter', 'realistic'],  mechanics: ['aim', 'strategy', 'economy'] },
  apex:       { genre: ['battle royale'],         mode: ['squad', 'ranked'],           platform: ['cross platform'],   competitive: ['competitivo'],            style: ['hero shooter', 'movement'],       mechanics: ['movement', 'abilities', 'revive'] },
  warzone:    { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['cross platform'],   competitive: ['competitivo'],            style: ['realistic', 'military'],          mechanics: ['shooting', 'survival', 'looting'] },
  pubgm:      { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo'],            style: ['realistic', 'survival'],          mechanics: ['shooting', 'looting', 'circle'] },
  rl:         { genre: ['sports'],                mode: ['3v3', '1v1'],                platform: ['cross platform'],   competitive: ['competitivo', 'esports'], style: ['soccer', 'arcade'],               mechanics: ['cars', 'physics', 'aerial'] },
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
  ff:         { genre: ['battle royale'],         mode: ['squad', 'solo'],             platform: ['mobile'],           competitive: ['competitivo', 'esports'], style: ['survival', 'mobile'],             mechanics: ['shooting', 'looting', 'circle'] },
  codbo6:     { genre: ['fps'],                   mode: ['6v6', 'competitive'],         platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['military', 'arcade'],             mechanics: ['aim', 'loadouts', 'killstreaks'] },
  mk1:        { genre: ['fighting'],              mode: ['1v1', 'ranked'],             platform: ['pc', 'console'],    competitive: ['competitivo', 'esports'], style: ['arcade', '2d fighter'],           mechanics: ['combo', 'fatality', 'kameo'] },
  eldenring:  { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['pc', 'console'],    competitive: [],                         style: ['dark fantasy', 'open world'],     mechanics: ['exploration', 'boss fights', 'builds'] },
  cyberpunk:  { genre: ['rpg', 'action rpg'],     mode: ['solo'],                       platform: ['pc', 'console'],    competitive: [],                         style: ['open world', 'cyberpunk'],        mechanics: ['shooting', 'hacking', 'choices'] },
  rdr2:       { genre: ['rpg', 'open world'],     mode: ['multiplayer', 'solo'],       platform: ['pc', 'console'],    competitive: [],                         style: ['western', 'open world'],          mechanics: ['shooting', 'hunting', 'story rich'] },
  mhwilds:    { genre: ['rpg', 'action rpg'],     mode: ['coop', 'solo'],              platform: ['pc', 'console'],    competitive: [],                         style: ['fantasy', 'open world'],          mechanics: ['weapons', 'hunting', 'crafting'] },
  hogwarts:   { genre: ['rpg', 'open world'],     mode: ['solo'],                       platform: ['pc', 'console'],    competitive: [],                         style: ['fantasy', 'open world'],          mechanics: ['magic', 'exploration', 'story rich'] },
  nms:        { genre: ['rpg', 'open world'],     mode: ['multiplayer', 'coop'],       platform: ['cross platform'],   competitive: [],                         style: ['sci-fi', 'survival'],             mechanics: ['exploration', 'crafting', 'building'] },
};

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
  }
];

export const COMMUNITY_TRENDING_TOPICS = [
  { title: 'Nuevo agente Valorant', game: 'Valorant', color: '#ff4655', comments: 234 },
  { title: 'Worlds 2026 sedes', game: 'LoL', color: '#0ac8b9', comments: 189 },
  { title: 'CS2 Major Spring', game: 'CS2', color: '#de9b35', comments: 156 },
  { title: 'Season 4 Battle Pass', game: 'Fortnite', color: '#a35ddf', comments: 142 },
  { title: 'Ranked Split 2', game: 'Apex', color: '#cd3333', comments: 98 }
];
