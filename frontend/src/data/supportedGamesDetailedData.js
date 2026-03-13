import BannerLol from '../assets/banner/BannerLol.jpg';
import BannerValo from '../assets/banner/BannerValo.jpg';
import BannerMlbb from '../assets/banner/BannerMlbb.jpg';

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
};

supportedGamesDetailedData['League of Legends'] = supportedGamesDetailedData.lol;
supportedGamesDetailedData['LoL'] = supportedGamesDetailedData.lol;
supportedGamesDetailedData['Valorant'] = supportedGamesDetailedData.valorant;
supportedGamesDetailedData['Mobile Legends'] = supportedGamesDetailedData.mlbb;
supportedGamesDetailedData['Mobile Legends: Bang Bang'] = supportedGamesDetailedData.mlbb;
supportedGamesDetailedData.MLBB = supportedGamesDetailedData.mlbb;

export { supportedGamesDetailedData };
