// Archivo centralizado para los juegos de torneos con imágenes y datos clave
// Puedes agregar más campos según lo que requiera la tarjeta de torneo

import WildRiftImg from '../../assets/games/wildrift.jpg';
import WarzoneImg from '../../assets/games/warzone.jpg';
import ValorantImg from '../../assets/games/valorant.jpg';
import TFTImg from '../../assets/games/tft.jpg';
import Tekken8Img from '../../assets/games/tekken8.jpg';
import StarcraftImg from '../../assets/games/starcraft.jpg';
import SmiteImg from '../../assets/games/smite.jpg';
import SF6Img from '../../assets/games/sf6.jpg';
import RuneterraImg from '../../assets/games/runeterra.jpg';
import RocketImg from '../../assets/games/rocket.jpg';
import PubgImg from '../../assets/games/pubg.jpg';
import Overwatch2Img from '../../assets/games/Overwhat2.jpg';
import NBA2K24Img from '../../assets/games/nba2k24.jpg';
import MLBBImg from '../../assets/games/mlbb.jpg';
import LoLImg from '../../assets/games/lol.jpg';
import HoKImg from '../../assets/games/hok.jpg';
import HearthstoneImg from '../../assets/games/hearthstone.jpg';
import FreeFireImg from '../../assets/games/freefire.jpg';
import FortniteImg from '../../assets/games/fornite.jpg';
import FIFAImg from '../../assets/games/fifa.jpg';
import Dota2Img from '../../assets/games/dota2.jpg';
import CS2Img from '../../assets/games/cs2.jpg';
import ApexImg from '../../assets/games/apex.jpg';

// Puedes agregar más campos: color, icon, id, etc.
export const TOURNAMENT_GAMES = [
  {
    name: 'Mobile Legends',
    id: 'mlbb',
    img: MLBBImg,
    color: '#ffbf00',
    icon: 'bx-mobile-landscape',
    category: 'MOBA',
  },
  {
    name: 'League of Legends',
    id: 'lol',
    img: LoLImg,
    color: '#0ac8b9',
    icon: 'bx-world',
    category: 'MOBA',
  },
  {
    name: 'Valorant',
    id: 'valorant',
    img: ValorantImg,
    color: '#ff4655',
    icon: 'bx-crosshair',
    category: 'FPS',
  },
  {
    name: 'Wild Rift',
    id: 'wildrift',
    img: WildRiftImg,
    color: '#00c3ff',
    icon: 'bx-world',
    category: 'MOBA',
  },
  {
    name: 'TFT',
    id: 'tft',
    img: TFTImg,
    color: '#f5a623',
    icon: 'bx-chess',
    category: 'Auto Chess',
  },
  {
    name: 'Warzone',
    id: 'warzone',
    img: WarzoneImg,
    color: '#4caf50',
    icon: 'bx-target-lock',
    category: 'BR',
  },
  // ...agrega el resto de juegos siguiendo este formato
  // NOTA: Los siguientes juegos fueron removidos porque no existe la imagen en assets/games:
  // AmongUsImg, AOVImg, GenshinImg, MarioKartImg, R6SImg, SC2Img, WuwaImg
];

// Para obtener un juego por nombre o id:
export function getTournamentGameByName(name) {
  if (!name) return undefined;
  return TOURNAMENT_GAMES.find(g =>
    (g.name && g.name.toLowerCase() === String(name).toLowerCase()) ||
    (g.id && g.id === String(name).toLowerCase())
  );
}
