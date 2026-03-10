import LoLImg from '../assets/comunidad/LoL.jpg';
import MLBBImg from '../assets/comunidad/MLBB.jpg';
import ValorantImg from '../assets/comunidad/valorant.jpg';

export const gamesList = [
  {
    id: 'lol',
    name: 'League of Legends',
    img: LoLImg,
    tags: ['MOBA', 'PC', 'Competitivo'],
    color: '#0AC8B9',
    desc: 'El MOBA tactico principal soportado por Esportefy.',
    members: '10M',
    active: '1.5M',
  },
  {
    id: 'valorant',
    name: 'Valorant',
    img: ValorantImg,
    tags: ['FPS', 'PC', 'Shooter'],
    color: '#FF4655',
    desc: 'Shooter tactico con agentes y ronda competitiva.',
    members: '8M',
    active: '1.1M',
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    img: MLBBImg,
    tags: ['MOBA', 'Mobile', 'Competitivo'],
    color: '#00D2FF',
    desc: 'MOBA movil soportado para equipos, torneos y vinculacion interna.',
    members: '12M',
    active: '1.8M',
  },
];
