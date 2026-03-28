import BannerLol from '../assets/banner/BannerLol.jpg';
import BannerValo from '../assets/banner/BannerValo.jpg';
import BannerMlbb from '../assets/banner/BannerMlbb.jpg';
import WarzoneCover from '../assets/gameImages/CallofDutyWarzone.png';
import FortniteCover from '../assets/gameImages/fortnite.png';
import FifaCover from '../assets/gameImages/Fifa.png';
import RocketCover from '../assets/gameImages/RocketLeague.png';
import SmashCover from '../assets/gameImages/sf6.png';

const supportedGamesDetailedData = {
  lol: {
    id: 'lol',
    name: 'League of Legends',
    banner: BannerLol,
    developer: 'Riot Games',
    history:
      'League of Legends es el MOBA competitivo central de GLITCH GANG. Su ecosistema combina estrategia por líneas, control de objetivos y juego coordinado de alto nivel.',
    tags: ['MOBA', 'PC', 'Competitivo', 'E-Sports', 'Estrategia'],
    category: 'MOBA',
    color: '#4B69FF',
    organizers: [
      { name: 'Riot Games', motto: 'Escena competitiva oficial global' },
      { name: 'LVP', motto: 'Circuitos regionales para talento emergente' },
      { name: 'GLITCH GANG', motto: 'Comunidad y torneos para nuevos equipos' },
    ],
    sponsors: [{ name: 'Red Bull' }, { name: 'Mastercard' }, { name: 'Secretlab' }],
    userCommunities: [
      { name: 'LoL Dominicano', members: '15k' },
      { name: 'Summoners Rift LATAM', members: '82k' },
      { name: 'GLITCH GANG LoL Hub', members: '9k' },
    ],
    tournaments: [
      { title: 'LoL Open Series', prize: '$1,500', date: 'Proximamente' },
      { title: 'Clasificatoria Universitaria LoL', prize: 'Circuito nacional', date: 'Abril 2026' },
    ],
  },
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    banner: BannerValo,
    developer: 'Riot Games',
    history:
      'Valorant es el shooter tactico soportado por GLITCH GANG. Mezcla precision, utilidad y lectura de rondas dentro de un ecosistema competitivo estructurado.',
    tags: ['FPS', 'PC', 'Shooter', 'Tactico', 'Competitivo'],
    category: 'FPS',
    color: '#FF4655',
    organizers: [
      { name: 'Riot Games', motto: 'Valorant Champions Tour' },
      { name: 'LVP', motto: 'Circuitos regionales y clasificatorias' },
      { name: 'GLITCH GANG', motto: 'Torneos abiertos y comunidad local' },
    ],
    sponsors: [{ name: 'Prime Gaming' }, { name: 'ZOWIE' }, { name: 'Red Bull' }],
    userCommunities: [
      { name: 'Valorant LATAM', members: '95k' },
      { name: 'Radiant Hub', members: '37k' },
      { name: 'GLITCH GANG Valorant DR', members: '11k' },
    ],
    tournaments: [
      { title: 'Valorant Caribe Cup', prize: '$2,000', date: 'Proximamente' },
      { title: 'Valorant Open Tour', prize: '$1,200', date: 'Abril 2026' },
    ],
  },
  mlbb: {
    id: 'mlbb',
    name: 'Mobile Legends',
    banner: BannerMlbb,
    developer: 'Moonton',
    history:
      'Mobile Legends es el MOBA movil soportado por GLITCH GANG para equipos, torneos y vinculacion interna de cuenta. La plataforma trabaja con User ID + Zone ID para sincronizacion operativa.',
    tags: ['MOBA', 'Mobile', 'Competitivo', 'E-Sports', '5v5'],
    category: 'MOBA',
    color: '#00D2FF',
    organizers: [
      { name: 'Moonton', motto: 'Escena competitiva oficial de MLBB' },
      { name: 'MPL', motto: 'Circuito regional de Mobile Legends' },
      { name: 'GLITCH GANG', motto: 'Eventos y clasificatorias comunitarias' },
    ],
    sponsors: [{ name: 'Samsung' }, { name: 'TikTok' }, { name: 'Red Bull' }],
    userCommunities: [
      { name: 'MLBB LATAM', members: '88k' },
      { name: 'Bang Bang Academy', members: '24k' },
      { name: 'GLITCH GANG MLBB RD', members: '13k' },
    ],
    tournaments: [
      { title: 'MLBB Squad Clash', prize: '$1,000', date: 'Proximamente' },
      { title: 'Invitacional Regional MLBB', prize: '$2,500', date: 'Abril 2026' },
    ],
  },
  warzone: {
    id: 'warzone',
    name: 'Warzone',
    banner: WarzoneCover,
    developer: 'Activision',
    history:
      'Warzone entra a GLITCH GANG como juego battle royale con soporte interno para perfiles competitivos, rosters, resultados de torneos y evidencias administrativas.',
    tags: ['Battle Royale', 'FPS', 'Cross-Platform', 'Competitivo'],
    category: 'BR',
    color: '#4CAF50',
    organizers: [
      { name: 'Activision', motto: 'Ecosistema oficial de Call of Duty' },
      { name: 'Organizadores terceros', motto: 'Copas comunitarias y scrims competitivos' },
      { name: 'GLITCH GANG', motto: 'Historial competitivo interno para squads y duos' },
    ],
    sponsors: [{ name: 'Monster Energy' }, { name: 'SCUF' }, { name: 'ASTRO' }],
    userCommunities: [
      { name: 'Warzone RD', members: '10k' },
      { name: 'Warzone Caribe', members: '16k' },
      { name: 'GLITCH GANG WZ Hub', members: '4k' },
    ],
    tournaments: [
      { title: 'Warzone Squad Clash', prize: '$1,200', date: 'Proximamente' },
      { title: 'Warzone Resurgence Open', prize: '$800', date: 'Abril 2026' },
    ],
  },
  fortnite: {
    id: 'fortnite',
    name: 'Fortnite',
    banner: FortniteCover,
    developer: 'Epic Games',
    history:
      'Fortnite entra a GLITCH GANG con soporte mixto: identidad externa cuando aporte valor y un historial competitivo interno para torneos, rosters y evidencias dentro de la plataforma.',
    tags: ['Battle Royale', 'Cross-Platform', 'Competitivo', 'Squads'],
    category: 'BR',
    color: '#22C55E',
    organizers: [
      { name: 'Epic Games', motto: 'Escena global y eventos oficiales' },
      { name: 'Organizadores terceros', motto: 'Copas comunitarias y circuitos abiertos' },
      { name: 'GLITCH GANG', motto: 'Historial competitivo interno y validacion admin' },
    ],
    sponsors: [{ name: 'Red Bull' }, { name: 'Logitech G' }, { name: 'HyperX' }],
    userCommunities: [
      { name: 'Fortnite Caribe', members: '28k' },
      { name: 'FN Competitive LATAM', members: '61k' },
      { name: 'GLITCH GANG Fortnite Hub', members: '8k' },
    ],
    tournaments: [
      { title: 'Fortnite Squad Clash', prize: '$1,500', date: 'Proximamente' },
      { title: 'Fortnite University Open', prize: 'Circuito interno', date: 'Abril 2026' },
    ],
  },
  rocket: {
    id: 'rocket',
    name: 'Rocket League',
    banner: RocketCover,
    developer: 'Psyonix / Epic Games',
    history:
      'Rocket League se gestiona en GLITCH GANG con enfoque mixto: identidad externa cuando aplique y record competitivo propio para equipos, resultados y evidencias verificadas.',
    tags: ['Sports', 'Cars', '3v3', 'Competitivo'],
    category: 'Sports',
    color: '#0088FF',
    organizers: [
      { name: 'Psyonix', motto: 'Rocket League Championship Series' },
      { name: 'Organizadores terceros', motto: 'Copas comunitarias y clasificatorias abiertas' },
      { name: 'GLITCH GANG', motto: 'Torneos y rosters con validacion interna' },
    ],
    sponsors: [{ name: 'Mobil 1' }, { name: 'Secretlab' }, { name: 'Red Bull' }],
    userCommunities: [
      { name: 'Rocket League LATAM', members: '22k' },
      { name: 'RL Caribe', members: '7k' },
      { name: 'GLITCH GANG RL Arena', members: '5k' },
    ],
    tournaments: [
      { title: 'Rocket League Open 3v3', prize: '$1,000', date: 'Proximamente' },
      { title: 'RL Community Cup', prize: '$750', date: 'Abril 2026' },
    ],
  },
  fifa: {
    id: 'fifa',
    name: 'EA FC / FIFA',
    banner: FifaCover,
    developer: 'EA Sports',
    history:
      'EA FC / FIFA opera en GLITCH GANG como sistema propio: perfiles, equipos, logros y resultados de torneos se validan dentro de la plataforma sin depender de una API competitiva oficial.',
    tags: ['Sports', '1v1', 'Console', 'Competitivo'],
    category: 'Sports',
    color: '#22C55E',
    organizers: [
      { name: 'EA Sports', motto: 'Escena oficial y contenido competitivo' },
      { name: 'FIFAe', motto: 'Circuitos y competiciones institucionales' },
      { name: 'GLITCH GANG', motto: 'Historial interno y validacion administrativa' },
    ],
    sponsors: [{ name: 'PlayStation' }, { name: 'EA Sports' }, { name: 'AOC' }],
    userCommunities: [
      { name: 'FC Dominicano', members: '12k' },
      { name: 'FIFA Caribbean Hub', members: '9k' },
      { name: 'GLITCH GANG FC Arena', members: '4k' },
    ],
    tournaments: [
      { title: 'EA FC 1v1 Series', prize: '$500', date: 'Proximamente' },
      { title: 'Copa Universitaria FC', prize: 'Circuito interno', date: 'Abril 2026' },
    ],
  },
  smash: {
    id: 'smash',
    name: 'Smash Bros',
    banner: SmashCover,
    developer: 'Nintendo',
    history:
      'Smash Bros se maneja en GLITCH GANG como sistema propio: tags, rosters, resultados, logros y evidencias competitivas viven dentro de la plataforma y se validan por admins y organizadores.',
    tags: ['Fighting', 'Platform Fighter', '1v1', 'Competitivo'],
    category: 'Fighting',
    color: '#F59E0B',
    organizers: [
      { name: 'Nintendo', motto: 'Franquicia insignia de platform fighters' },
      { name: 'TOs comunitarios', motto: 'Majors, locals y brackets abiertos' },
      { name: 'GLITCH GANG', motto: 'Record competitivo propio y validado' },
    ],
    sponsors: [{ name: 'Nintendo' }, { name: 'Red Bull' }, { name: 'Hit Box' }],
    userCommunities: [
      { name: 'Smash RD', members: '6k' },
      { name: 'Caribbean Smash Hub', members: '4k' },
      { name: 'GLITCH GANG Smash', members: '3k' },
    ],
    tournaments: [
      { title: 'Smash Bros Open Bracket', prize: '$400', date: 'Proximamente' },
      { title: 'FGC University Clash', prize: 'Circuito interno', date: 'Abril 2026' },
    ],
  },
};

supportedGamesDetailedData['League of Legends'] = supportedGamesDetailedData.lol;
supportedGamesDetailedData['LoL'] = supportedGamesDetailedData.lol;
supportedGamesDetailedData['Valorant'] = supportedGamesDetailedData.valorant;
supportedGamesDetailedData['Mobile Legends'] = supportedGamesDetailedData.mlbb;
supportedGamesDetailedData['Mobile Legends: Bang Bang'] = supportedGamesDetailedData.mlbb;
supportedGamesDetailedData.MLBB = supportedGamesDetailedData.mlbb;
supportedGamesDetailedData['Warzone'] = supportedGamesDetailedData.warzone;
supportedGamesDetailedData['Call of Duty Warzone'] = supportedGamesDetailedData.warzone;
supportedGamesDetailedData['Fortnite'] = supportedGamesDetailedData.fortnite;
supportedGamesDetailedData['Rocket League'] = supportedGamesDetailedData.rocket;
supportedGamesDetailedData['EA FC / FIFA'] = supportedGamesDetailedData.fifa;
supportedGamesDetailedData['FIFA'] = supportedGamesDetailedData.fifa;
supportedGamesDetailedData['Smash Bros'] = supportedGamesDetailedData.smash;
supportedGamesDetailedData['Super Smash Bros'] = supportedGamesDetailedData.smash;
supportedGamesDetailedData['Super Smash Bros. Ultimate'] = supportedGamesDetailedData.smash;

export { supportedGamesDetailedData };
