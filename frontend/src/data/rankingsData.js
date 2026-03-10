export const PLAYERS_DATA = [
  {
    id: 1,
    player: 'DarkShadow',
    realName: 'Carlos Perez',
    team: 'Hispaniola Esports',
    game: 'MLBB',
    region: 'Santo Domingo',
    points: 12450,
    wins: 234,
    losses: 48,
    lastActivity: 'Hace 1h',
    trend: 3,
    streak: 12,
    role: 'Jungler',
    socialMedia: '@darkshadow_rd',
    joinDate: '2021-03-15',
    bio: 'Jugador profesional de MLBB desde 2020. Referente en la escena local.',
    achievements: {
      solo: [{ name: 'Top 1 Ranked Season 28', date: '2025-08-01', place: 1 }],
      duo: [{ name: 'Duo Championship RD', date: '2025-06-15', partner: 'ElCapoDRD', place: 1 }],
      team: [{ name: 'MLBB Championship 2025', date: '2025-12-15', team: 'Hispaniola Esports', place: 1 }],
    },
    matchHistory: [{ date: '2026-03-03', opponent: 'LaMentalidad', opponentTeam: 'Quisqueya Gaming', result: 'win', score: '3-1', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' }],
  },
  {
    id: 2,
    player: 'LaMentalidad',
    realName: 'Miguel Santana',
    team: 'Quisqueya Gaming',
    game: 'MLBB',
    region: 'Santiago',
    points: 11890,
    wins: 218,
    losses: 52,
    lastActivity: 'Hace 30m',
    trend: 1,
    streak: 8,
    role: 'Gold Laner',
    socialMedia: '@lamentalidadgg',
    joinDate: '2020-11-01',
    bio: 'Gold laner agresivo y capitan competitivo.',
    achievements: {
      solo: [{ name: 'Top 3 Ranked Season 28', date: '2025-08-01', place: 3 }],
      duo: [{ name: 'Duo Championship RD', date: '2025-06-15', partner: 'DragonRD', place: 3 }],
      team: [{ name: 'MLBB Championship 2025', date: '2025-12-15', team: 'Quisqueya Gaming', place: 2 }],
    },
    matchHistory: [{ date: '2026-03-03', opponent: 'DarkShadow', opponentTeam: 'Hispaniola Esports', result: 'loss', score: '1-3', tournament: 'Copa Nacional MLBB RD 2026', mode: 'team' }],
  },
  {
    id: 3,
    player: 'TigreCaribe',
    realName: 'Luis Vasquez',
    team: 'Caribes RD',
    game: 'MLBB',
    region: 'La Romana',
    points: 11420,
    wins: 205,
    losses: 61,
    lastActivity: 'Hace 2h',
    trend: 2,
    streak: 6,
    role: 'Roamer',
    socialMedia: '@tigrecaribe',
    joinDate: '2021-06-10',
    bio: 'Especialista en roaming y macro.',
    achievements: {
      solo: [],
      duo: [{ name: 'Duo Showdown RD', date: '2025-04-10', partner: 'YoSoyElPro', place: 1 }],
      team: [{ name: 'Copa Caribe MLBB', date: '2025-04-30', team: 'Caribes RD', place: 1 }],
    },
    matchHistory: [],
  },
  {
    id: 4,
    player: 'MenaVAL',
    realName: 'Andres Mena',
    team: 'Azucareros eSports',
    game: 'Valorant',
    region: 'Santo Domingo',
    points: 9850,
    wins: 156,
    losses: 48,
    lastActivity: 'Hace 1h',
    trend: 4,
    streak: 11,
    role: 'Duelist',
    socialMedia: '@menaval_rd',
    joinDate: '2021-06-01',
    bio: 'Duelista principal y referente competitivo de Valorant en RD.',
    achievements: {
      solo: [{ name: 'Top 10 LATAM Ranked', date: '2025-11-01', place: 8 }],
      duo: [{ name: 'Duo Ranked Challenge', date: '2025-05-15', partner: 'Samurai809', place: 1 }],
      team: [{ name: 'Valorant Open RD', date: '2025-08-30', team: 'Azucareros eSports', place: 1 }],
    },
    matchHistory: [{ date: '2026-02-28', opponent: 'CycloneRD', opponentTeam: 'Dominicana Clutch', result: 'win', score: '13-8', tournament: 'Valorant Caribe Cup', mode: 'team' }],
  },
  {
    id: 5,
    player: 'CycloneRD',
    realName: 'David Martinez',
    team: 'Dominicana Clutch',
    game: 'Valorant',
    region: 'Santiago',
    points: 9420,
    wins: 142,
    losses: 52,
    lastActivity: 'Hace 30m',
    trend: 2,
    streak: 8,
    role: 'Controller',
    socialMedia: '@cyclonerd',
    joinDate: '2022-03-10',
    bio: 'Controller estrategico y anchor confiable.',
    achievements: {
      solo: [],
      duo: [],
      team: [{ name: 'Valorant Open RD', date: '2025-08-30', team: 'Dominicana Clutch', place: 2 }],
    },
    matchHistory: [],
  },
  {
    id: 6,
    player: 'Samurai809',
    realName: 'Ricardo Guzman',
    team: 'Azucareros eSports',
    game: 'Valorant',
    region: 'Punta Cana',
    points: 9180,
    wins: 134,
    losses: 49,
    lastActivity: 'Hace 5h',
    trend: 1,
    streak: 5,
    role: 'Sentinel',
    socialMedia: '@samurai809',
    joinDate: '2021-08-15',
    bio: 'Sentinel disciplinado con enfoque en utility.',
    achievements: {
      solo: [],
      duo: [{ name: 'Duo Ranked Challenge', date: '2025-05-15', partner: 'MenaVAL', place: 1 }],
      team: [{ name: 'Valorant Open RD', date: '2025-08-30', team: 'Azucareros eSports', place: 1 }],
    },
    matchHistory: [],
  },
  {
    id: 7,
    player: 'CaciqueMid',
    realName: 'Daniel Polanco',
    team: 'Tainos Gaming',
    game: 'LoL',
    region: 'Santo Domingo',
    points: 9650,
    wins: 167,
    losses: 58,
    lastActivity: 'Hace 2h',
    trend: 3,
    streak: 9,
    role: 'Mid Laner',
    socialMedia: '@caciquemid',
    joinDate: '2020-04-01',
    bio: 'Mid laner de alto control de mapa y teamfight.',
    achievements: {
      solo: [{ name: 'Top 50 LATAM Challenger', date: '2025-10-01', place: 42 }],
      duo: [],
      team: [{ name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Tainos Gaming', place: 1 }],
    },
    matchHistory: [{ date: '2026-02-25', opponent: 'JungleKing', opponentTeam: 'Cibao Stars', result: 'win', score: '2-1', tournament: 'Liga LoL RD S1 2026', mode: 'team' }],
  },
  {
    id: 8,
    player: 'JungleKing',
    realName: 'Pedro Almonte',
    team: 'Cibao Stars',
    game: 'LoL',
    region: 'Santiago',
    points: 9280,
    wins: 154,
    losses: 62,
    lastActivity: 'Hace 4h',
    trend: 0,
    streak: 4,
    role: 'Jungler',
    socialMedia: '@jungleking_rd',
    joinDate: '2021-02-15',
    bio: 'Jungler agresivo con buen tempo de early game.',
    achievements: {
      solo: [],
      duo: [],
      team: [{ name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Cibao Stars', place: 2 }],
    },
    matchHistory: [],
  },
  {
    id: 9,
    player: 'CaribADC',
    realName: 'Jorge Reyes',
    team: 'Tainos Gaming',
    game: 'LoL',
    region: 'La Romana',
    points: 8970,
    wins: 145,
    losses: 64,
    lastActivity: 'Hace 6h',
    trend: -1,
    streak: 2,
    role: 'ADC',
    socialMedia: '@caribadc',
    joinDate: '2020-06-20',
    bio: 'ADC de teamfights largas y buen posicionamiento.',
    achievements: {
      solo: [],
      duo: [],
      team: [{ name: 'Liga LoL Dominicana 2025', date: '2025-09-15', team: 'Tainos Gaming', place: 1 }],
    },
    matchHistory: [],
  },
];

export const TEAMS_DATA = [
  { id: 1, name: 'Hispaniola Esports', tag: 'HISP', region: 'Santo Domingo', founded: 2021, games: ['MLBB', 'Valorant', 'LoL'], players: 18, trophies: 12, points: 45800, winRate: 78, logo: 'hispaniola', color: '#FF6B35' },
  { id: 2, name: 'Quisqueya Gaming', tag: 'QG', region: 'Santiago', founded: 2020, games: ['MLBB'], players: 10, trophies: 9, points: 42650, winRate: 74, logo: 'quisqueya', color: '#2E86AB' },
  { id: 3, name: 'Caribes RD', tag: 'CRD', region: 'La Romana', founded: 2022, games: ['MLBB', 'LoL'], players: 12, trophies: 6, points: 38900, winRate: 71, logo: 'caribes', color: '#00A86B' },
  { id: 4, name: 'Azucareros eSports', tag: 'AZU', region: 'San Pedro', founded: 2021, games: ['Valorant', 'LoL'], players: 10, trophies: 8, points: 37500, winRate: 73, logo: 'azucareros', color: '#FFD700' },
  { id: 5, name: 'Tainos Gaming', tag: 'TNG', region: 'Santo Domingo', founded: 2020, games: ['LoL', 'Valorant'], players: 11, trophies: 7, points: 35800, winRate: 69, logo: 'tainos', color: '#8B4513' },
  { id: 6, name: 'Platano Power', tag: 'PP', region: 'Santo Domingo', founded: 2023, games: ['MLBB'], players: 6, trophies: 3, points: 28900, winRate: 65, logo: 'platano', color: '#9ACD32' },
  { id: 7, name: 'Cibao Stars', tag: 'CBS', region: 'Santiago', founded: 2021, games: ['LoL', 'Valorant'], players: 9, trophies: 5, points: 27600, winRate: 64, logo: 'cibao', color: '#4169E1' },
  { id: 8, name: 'Dominicana Clutch', tag: 'DCL', region: 'Santo Domingo', founded: 2023, games: ['Valorant'], players: 5, trophies: 2, points: 22100, winRate: 68, logo: 'clutch', color: '#800080' },
];

export const TOURNAMENTS_DATA = [
  { id: 1, name: 'Copa Nacional MLBB RD 2026', game: 'MLBB', status: 'active', startDate: '2026-02-15', endDate: '2026-03-30', prize: 150000, currency: 'DOP', teams: 32, registeredTeams: 28, location: 'Santo Domingo', organizer: 'Esportefy RD', format: 'Double Elimination', featured: true },
  { id: 2, name: 'Valorant Caribe Cup', game: 'Valorant', status: 'upcoming', startDate: '2026-03-10', endDate: '2026-04-20', prize: 100000, currency: 'DOP', teams: 16, registeredTeams: 12, location: 'Santiago', organizer: 'Esportefy RD', format: 'Single Elimination', featured: true },
  { id: 3, name: 'Liga LoL RD S1 2026', game: 'LoL', status: 'active', startDate: '2026-02-01', endDate: '2026-04-10', prize: 120000, currency: 'DOP', teams: 12, registeredTeams: 10, location: 'Online', organizer: 'Esportefy RD', format: 'Round Robin', featured: false },
  { id: 4, name: 'MLBB Championship 2025', game: 'MLBB', status: 'completed', startDate: '2025-10-01', endDate: '2025-12-15', prize: 250000, currency: 'DOP', teams: 48, registeredTeams: 48, location: 'Santo Domingo', organizer: 'Moonton RD', format: 'Double Elimination', champion: 'Hispaniola Esports', runnerUp: 'Quisqueya Gaming' },
  { id: 5, name: 'Liga LoL Dominicana 2025', game: 'LoL', status: 'completed', startDate: '2025-06-01', endDate: '2025-09-15', prize: 180000, currency: 'DOP', teams: 12, registeredTeams: 12, location: 'Online', organizer: 'Riot Games', format: 'Double Round Robin', champion: 'Tainos Gaming', runnerUp: 'Cibao Stars' },
  { id: 6, name: 'Valorant Open RD', game: 'Valorant', status: 'completed', startDate: '2025-07-10', endDate: '2025-08-30', prize: 120000, currency: 'DOP', teams: 24, registeredTeams: 24, location: 'Santiago', organizer: 'Esportefy RD', format: 'Swiss + Playoffs', champion: 'Azucareros eSports', runnerUp: 'Dominicana Clutch' },
];

export const GAMES = ['Todos', 'MLBB', 'Valorant', 'LoL'];
export const REGIONS = ['Todas', 'Santo Domingo', 'Santiago', 'La Romana', 'San Pedro', 'Punta Cana'];
export const SEASONS = ['Temporada 1 2026', 'Pre-Season 2026', 'Temporada 2 2025'];
export const TOURNAMENT_STATUS = ['Todos', 'active', 'upcoming', 'completed'];

export const getWinRate = (wins, losses) => {
  const total = wins + losses;
  if (!total) return 0;
  return Math.round((wins / total) * 100);
};

export const formatPrize = (amount, currency = 'DOP') => {
  if (currency === 'DOP') {
    return `RD$${amount.toLocaleString()}`;
  }
  return `$${amount.toLocaleString()} USD`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const getStatusLabel = (status) => {
  switch (status) {
    case 'active':
      return 'En Curso';
    case 'upcoming':
      return 'Proximamente';
    case 'completed':
      return 'Finalizado';
    default:
      return status;
  }
};
