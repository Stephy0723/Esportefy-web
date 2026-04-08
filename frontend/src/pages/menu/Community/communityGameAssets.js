import FortniteImg from '../../../assets/comunidad/Fortnite.jpg';
import CS2Img from '../../../assets/comunidad/CS2.jpg';
import CRImg from '../../../assets/comunidad/CR.jpg';
import AOVImg from '../../../assets/comunidad/AOV.jpg';
import HoKImg from '../../../assets/comunidad/HoK_V.jpg';
import FFImg from '../../../assets/comunidad/FF.jpg';
import BrawlhallaImg from '../../../assets/comunidad/Brawlhalla.jpg';
import CODMImg from '../../../assets/comunidad/CODM.jpg';
import Dota2Img from '../../../assets/comunidad/Dota2.jpeg';
import HSImg from '../../../assets/comunidad/HS.webp';
import LoLImg from '../../../assets/comunidad/LoL.jpg';
import LoRImg from '../../../assets/comunidad/LoR.jpg';
import MLBBImg from '../../../assets/comunidad/MLBB.jpg';
import NBA2K24Img from '../../../assets/comunidad/NBA2K24.jpg';
import OW2Img from '../../../assets/comunidad/OW2.jpeg';
import PUBGMImg from '../../../assets/comunidad/PUBGM.jpg';
import R6SImg from '../../../assets/comunidad/R6S.jpg';
import RLImg from '../../../assets/comunidad/RL.jpg';
import SC2Img from '../../../assets/comunidad/SC2.jpg';
import SF6Img from '../../../assets/comunidad/sf6.png';
import SmashImg from '../../../assets/comunidad/Smash.jpg';
import Tekken8Img from '../../../assets/comunidad/Tekken8.jpg';
import TFTImg from '../../../assets/comunidad/TFT.webp';
import ValorantImg from '../../../assets/comunidad/valorant.jpg';
import WarzoneImg from '../../../assets/comunidad/Warzone.jpg';
import WildRiftImg from '../../../assets/comunidad/WildRift.jpeg';
import ApexImg from '../../../assets/comunidad/Apex.jpg';
import AmongUsImg from '../../../assets/comunidad/amongus.jpg';
import FallGuysImg from '../../../assets/comunidad/Fallguy.jpg';
import GenshinImg from '../../../assets/comunidad/genshin.jpg';
import GTAImg from '../../../assets/comunidad/Gta.jpg';
import HaloImg from '../../../assets/comunidad/halo.jpg';
import MarioKartImg from '../../../assets/comunidad/MarioKart.jpg';
import WuwaImg from '../../../assets/comunidad/Wuwa.jpg';

const COMMUNITY_GAME_ASSET_MAP = {
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
  fifa: '',
  apex: ApexImg,
  pubg: PUBGMImg,
  r6: R6SImg,
  sf6: SF6Img,
  smash: SmashImg,
  tekken: Tekken8Img,
  brawlhalla: BrawlhallaImg,
  mlbb: MLBBImg,
  freefire: FFImg,
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

export const getCommunityGameAsset = (gameId = '') =>
  COMMUNITY_GAME_ASSET_MAP[String(gameId || '').trim().toLowerCase()] || '';

export const decorateCommunityGame = (game = {}) => {
  const id = String(game?.id || '').trim().toLowerCase();
  const localImage = getCommunityGameAsset(id);
  const image = localImage || game?.imageUrl || '';

  return {
    ...game,
    img: image,
    image,
    cover: image
  };
};

export const decorateCommunityGames = (games = []) =>
  (Array.isArray(games) ? games : []).map(decorateCommunityGame);
