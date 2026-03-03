import { getUniversityAllowedDomains } from './universityVerificationRules.js';

const UNIVERSITY_ALLOWED_GAME_NAMES = [
  'Valorant',
  'League of Legends',
  'Mobile Legends',
  'Mobile Legends: Bang Bang',
  'MLBB'
];
const normalizeGameName = (value = '') => String(value || '').trim().toLowerCase();
const UNIVERSITY_ALLOWED_GAMES_SET = new Set(UNIVERSITY_ALLOWED_GAME_NAMES.map(normalizeGameName));
const sanitizeUniversityGames = (games = []) =>
  Array.from(new Set(
    (Array.isArray(games) ? games : [])
      .map((game) => String(game || '').trim())
      .filter(Boolean)
      .filter((game) => UNIVERSITY_ALLOWED_GAMES_SET.has(normalizeGameName(game)))
  ));
const sanitizeUniversityTeams = (teams = []) =>
  (Array.isArray(teams) ? teams : []).filter((team) =>
    UNIVERSITY_ALLOWED_GAMES_SET.has(normalizeGameName(team?.game))
  );

const UNIVERSITY_CAMPUSES_BY_ID = {
  uasd: [
    'Santo Domingo',
    'Santiago de los Caballeros',
    'San Francisco de Macorís',
    'La Romana',
    'Puerto Plata',
    'San Juan de la Maguana',
    'Barahona',
    'Bonao',
    'Hato Mayor',
    'Higüey',
    'Mao',
    'Nagua',
    'Neyba',
    'San Cristóbal'
  ],
  pucmm: [
    'Santiago de los Caballeros',
    'Santo Domingo'
  ],
  intec: ['Santo Domingo'],
  unibe: ['Santo Domingo'],
  itla: ['Santo Domingo Este'],
  unapec: ['Santo Domingo'],
  unphu: ['Santo Domingo'],
  utesa: [
    'Santiago de los Caballeros',
    'Santo Domingo',
    'Puerto Plata',
    'Moca',
    'Dajabón',
    'Mao'
  ],
  uapa: [
    'Santiago de los Caballeros',
    'Santo Domingo'
  ],
  ucne: ['San Francisco de Macorís'],
  isfodosu: [
    'Santo Domingo',
    'Santiago de los Caballeros',
    'San Juan de la Maguana',
    'San Pedro de Macorís',
    'San Francisco de Macorís'
  ],
  itsc: ['Santo Domingo Este'],
  ucateci: ['La Vega'],
  uniremhos: ['Santo Domingo'],
  unicaribe: ['Santo Domingo'],
  oym: [
    'Santo Domingo',
    'Santiago de los Caballeros',
    'Puerto Plata',
    'La Romana',
    'Moca',
    'San Francisco de Macorís'
  ],
  uce: ['San Pedro de Macorís'],
  ufhec: [
    'Santo Domingo',
    'Baní',
    'La Romana',
    'Moca'
  ],
  ucsd: ['Santo Domingo'],
  loyola: ['San Cristóbal']
};

const UNIVERSITY_PROGRAMS_BY_ID = {
  uasd: [
    'Ingenieria en Sistemas',
    'Ingenieria Industrial',
    'Ingenieria Civil',
    'Arquitectura',
    'Medicina',
    'Administracion de Empresas',
    'Contabilidad',
    'Derecho'
  ],
  pucmm: [
    'Administracion de Empresas',
    'Administracion Hotelera',
    'Arquitectura',
    'Comunicacion Social',
    'Derecho',
    'Diseno e Interiorismo',
    'Ecologia y Gestion Ambiental',
    'Economia',
    'Educacion',
    'Estomatologia',
    'Filosofia',
    'Gestion Financiera',
    'Ingenieria Civil',
    'Ingenieria Electromecanica',
    'Ingenieria Electronica',
    'Ingenieria Industrial',
    'Ingenieria en Sistemas y Computacion',
    'Ingenieria Mecatronica',
    'Ingenieria Telematica',
    'Medicina',
    'Mercadotecnia',
    'Nutricion y Dietetica',
    'Psicologia',
    'Terapia Fisica'
  ],
  intec: [
    'Ingenieria Civil',
    'Ingenieria de Software',
    'Ingenieria Electrica',
    'Ingenieria Electronica y de Comunicaciones',
    'Ingenieria Industrial',
    'Ingenieria Mecanica',
    'Ingenieria Mecatronica',
    'Ingenieria en Ciberseguridad',
    'Ingenieria en Sistemas',
    'Administracion y Gestion de Negocios',
    'Contabilidad y Auditoria Empresarial',
    'Economia',
    'Mercadeo y Negocios Electronicos',
    'Negocios Internacionales',
    'Diseno Industrial',
    'Ciencia de Datos',
    'Ciberseguridad',
    'Biotecnologia',
    'Doctor en Medicina',
    'Doctor en Odontologia',
    'Cine y Comunicacion Audiovisual',
    'Medios Digitales y Comunicacion Social',
    'Psicologia'
  ],
  unibe: [
    'Direccion y Gestion Empresarial',
    'Direccion y Gestion del Turismo',
    'Arquitectura',
    'Comunicacion',
    'Diseno',
    'Ingenieria Civil',
    'Ingenieria en Tecnologias Computacionales',
    'Derecho',
    'Medicina',
    'Odontologia',
    'Psicologia',
    'Educacion Inicial'
  ],
  itla: [
    'Desarrollo de Software',
    'Redes de Informacion',
    'Ciberseguridad',
    'Multimedia',
    'Mecatronica',
    'Analitica y Ciencia de Datos'
  ],
  unapec: [
    'Administracion de Empresas',
    'Administracion Turistica y Hotelera',
    'Contabilidad',
    'Comunicacion Digital',
    'Derecho',
    'Negocios Internacionales',
    'Diseno Grafico',
    'Diseno de Interiores',
    'Economia y Ciencia de Datos',
    'Finanzas',
    'Gastronomia y Artes Culinarias',
    'Gestion de Operaciones y Logistica',
    'Ingenieria de Sistemas de Computacion',
    'Ingenieria de Software',
    'Ingenieria Industrial',
    'Ingenieria Electrica',
    'Ingenieria Electronica',
    'Mercadeo',
    'Periodismo Contemporaneo',
    'Psicologia Organizacional',
    'Publicidad'
  ],
  unphu: [
    'Arquitectura y Urbanismo',
    'Diseno de Interiores',
    'Ingenieria Civil',
    'Ingenieria Industrial',
    'Ingenieria Quimica',
    'Ingenieria en Sistemas',
    'Medicina Veterinaria',
    'Medicina',
    'Odontologia',
    'Administracion de Empresas',
    'Administracion de Mercados',
    'Contabilidad y Auditoria',
    'Derecho',
    'Psicologia'
  ],
  utesa: [
    'Ingenieria en Sistemas',
    'Medicina',
    'Odontologia',
    'Administracion de Empresas',
    'Contabilidad',
    'Derecho'
  ],
  uapa: [
    'Ingenieria en Software',
    'Administracion de Empresas',
    'Contabilidad',
    'Mercadeo',
    'Psicologia',
    'Derecho'
  ],
  ucne: [
    'Medicina',
    'Odontologia',
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Derecho'
  ],
  isfodosu: [
    'Licenciatura en Educacion Primaria',
    'Licenciatura en Educacion Secundaria',
    'Lengua Espanola y Literatura',
    'Matematica',
    'Ciencias Sociales',
    'Biologia Orientada a la Educacion'
  ],
  itsc: [
    'Desarrollo de Software',
    'Soporte Tecnico',
    'Administracion de Redes',
    'Diseno Digital',
    'Logistica',
    'Mecatronica'
  ],
  ucateci: [
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Derecho',
    'Mercadeo',
    'Arquitectura'
  ],
  uniremhos: [
    'Medicina',
    'Odontologia',
    'Administracion de Empresas',
    'Mercadeo',
    'Psicologia',
    'Derecho'
  ],
  unicaribe: [
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Mercadeo',
    'Derecho',
    'Psicologia'
  ],
  oym: [
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Mercadeo',
    'Derecho',
    'Psicologia'
  ],
  uce: [
    'Medicina',
    'Odontologia',
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Derecho'
  ],
  ufhec: [
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Contabilidad',
    'Mercadeo',
    'Derecho',
    'Arquitectura'
  ],
  ucsd: [
    'Ingenieria en Sistemas',
    'Administracion de Empresas',
    'Mercadeo',
    'Derecho',
    'Psicologia',
    'Educacion'
  ],
  loyola: [
    'Ingenieria en Redes',
    'Ingenieria Industrial',
    'Desarrollo de Software',
    'Mecatronica',
    'Electromecanica',
    'Agronomia'
  ]
};

const sanitizeUniversityPrograms = (universityId = '') =>
  Array.from(new Set(
    (UNIVERSITY_PROGRAMS_BY_ID[String(universityId || '').trim().toLowerCase()] || [])
      .map((program) => String(program || '').trim())
      .filter(Boolean)
  ));

const sanitizeUniversityCampuses = (universityId = '', fallbackCity = '') => {
  const normalizedFallback = String(fallbackCity || '').trim();
  const values = UNIVERSITY_CAMPUSES_BY_ID[String(universityId || '').trim().toLowerCase()] || [];
  const items = values.length > 0 ? values : (normalizedFallback ? [normalizedFallback] : []);
  return Array.from(new Set(items.map((campus) => String(campus || '').trim()).filter(Boolean)));
};

export const UNIVERSITY_CATALOG_RD = [
  // ═══ REPÚBLICA DOMINICANA ═══
  {
    id: 'uasd', tag: 'UASD', name: 'Universidad Autónoma de Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1538, joinedEsportefy: '2024',
    points: 1540, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UASD&backgroundColor=0033a0',
    bio: 'La universidad más antigua de América, fundada en 1538 como Universidad Santo Tomás de Aquino. Es la institución de educación superior más grande de República Dominicana con más de 200,000 estudiantes activos.',
    games: ['Valorant', 'League of Legends', 'Wild Rift', 'Teamfight Tactics'],
    offers: ['Becas deportivas de esports', 'Centro de entrenamiento gaming', 'Torneos interuniversitarios', 'Club oficial de esports'],
    teams: [
      { name: 'UASD Titans', game: 'Valorant', members: 5, rank: 'Diamond+' },
      { name: 'UASD Legends', game: 'League of Legends', members: 5, rank: 'Platinum+' },
      { name: 'UASD Rift', game: 'Wild Rift', members: 5, rank: 'Emerald+' },
    ],
  },
  {
    id: 'pucmm', tag: 'PUCMM', name: 'Pontificia Universidad Católica Madre y Maestra',
    region: 'rd', city: 'Santiago', founded: 1962, joinedEsportefy: '2024',
    points: 1420, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PUCMM&backgroundColor=0033a0',
    bio: 'Fundada en 1962, es considerada una de las mejores universidades privadas del Caribe. Pionera en programas de tecnología y negocios en República Dominicana, con campus en Santiago y Santo Domingo.',
    games: ['Valorant', 'League of Legends', 'Teamfight Tactics', 'Mobile Legends'],
    offers: ['Becas por mérito deportivo', 'Laboratorio de esports', 'Streaming studio', 'Programa de coaching'],
    teams: [
      { name: 'PUCMM Wolves', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'PUCMM Storm', game: 'League of Legends', members: 5, rank: 'Diamond' },
      { name: 'PUCMM Phoenix', game: 'Mobile Legends', members: 5, rank: 'Mythic' },
    ],
  },
  {
    id: 'intec', tag: 'INTEC', name: 'Instituto Tecnológico de Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1972, joinedEsportefy: '2024',
    points: 1280, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=INTEC&backgroundColor=d31145',
    bio: 'Centro de excelencia en ingeniería y tecnología desde 1972. Reconocida por su rigor académico y enfoque en innovación. Lidera la formación tecnológica en el país.',
    games: ['Valorant', 'Wild Rift', 'Teamfight Tactics'],
    offers: ['Becas tecnológicas gaming', 'Hackathons + Gaming events', 'Club de desarrollo de videojuegos'],
    teams: [
      { name: 'INTEC Bees', game: 'Valorant', members: 5, rank: 'Diamond' },
      { name: 'INTEC Code', game: 'Teamfight Tactics', members: 3, rank: 'Master' },
    ],
  },
  {
    id: 'unibe', tag: 'UNIBE', name: 'Universidad Iberoamericana',
    region: 'rd', city: 'Santo Domingo', founded: 1982, joinedEsportefy: '2024',
    points: 1150, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNIBE&backgroundColor=cc0000',
    bio: 'Universidad de élite fundada en 1982, conocida por sus programas de medicina, derecho y negocios. Infraestructura de primer nivel con fuerte inversión en tecnología y deportes electrónicos.',
    games: ['Valorant', 'Mobile Legends', 'Teamfight Tactics'],
    offers: ['Gaming lounge premium', 'Torneos exclusivos', 'Mentorías con pros', 'Becas de rendimiento'],
    teams: [
      { name: 'UNIBE Red', game: 'Valorant', members: 5, rank: 'Ascendant' },
      { name: 'UNIBE Royale', game: 'Mobile Legends', members: 5, rank: 'Mythic Honor' },
    ],
  },
  {
    id: 'itla', tag: 'ITLA', name: 'Instituto Tecnológico de Las Américas',
    region: 'rd', city: 'Santo Domingo Este', founded: 2000, joinedEsportefy: '2024',
    points: 1090, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITLA&backgroundColor=0052FF',
    bio: 'Fundado en el año 2000, es el principal centro tecnológico del gobierno dominicano. Especializado en software, multimedia, redes y mecatrónica. Cuna de desarrolladores y gamers profesionales.',
    games: ['Valorant', 'League of Legends', 'Wild Rift', 'Mobile Legends'],
    offers: ['Arena de esports dedicada', 'Programa de desarrollo gaming', 'Becas 100% por esports', 'Club de game dev'],
    teams: [
      { name: 'ITLA Nexus', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'ITLA Binary', game: 'Mobile Legends', members: 5, rank: 'Mythic Glory' },
      { name: 'ITLA Devs', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'unapec', tag: 'UNAPEC', name: 'Universidad APEC',
    region: 'rd', city: 'Santo Domingo', founded: 1965, joinedEsportefy: '2025',
    points: 1020, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=APEC&backgroundColor=002d62',
    bio: 'Fundada en 1965 por la Acción Pro Educación y Cultura. Líder en negocios, tecnología y comunicación. Su comunidad estudiantil es una de las más activas en esports del país.',
    games: ['Valorant', 'Mobile Legends', 'Teamfight Tactics'],
    offers: ['Torneos semestrales', 'Club de esports oficial', 'Streaming room'],
    teams: [
      { name: 'APEC Eagles', game: 'Valorant', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'unphu', tag: 'UNPHU', name: 'Universidad Nacional Pedro Henríquez Ureña',
    region: 'rd', city: 'Santo Domingo', founded: 1966, joinedEsportefy: '2025',
    points: 980, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNPHU&backgroundColor=006837',
    bio: 'Institución fundada en 1966, reconocida por sus programas de arquitectura, ingeniería y ciencias de la salud. Campus extenso con áreas deportivas y espacios de innovación.',
    games: ['Valorant', 'League of Legends', 'Legends of Runeterra'],
    offers: ['Centro de alto rendimiento', 'Becas deportivas', 'Gaming events'],
    teams: [
      { name: 'UNPHU Green', game: 'Valorant', members: 5, rank: 'Platinum' },
    ],
  },
  {
    id: 'utesa', tag: 'UTESA', name: 'Universidad Tecnológica de Santiago',
    region: 'rd', city: 'Santiago', founded: 1974, joinedEsportefy: '2025',
    points: 940, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UTESA&backgroundColor=009b3a',
    bio: 'Fundada en 1974 en Santiago de los Caballeros. Una de las universidades con mayor matrícula del país, con múltiples extensiones a nivel nacional.',
    games: ['Valorant', 'Mobile Legends'],
    offers: ['Torneos regionales', 'Club gaming'],
    teams: [
      { name: 'UTESA Warriors', game: 'Valorant', members: 5, rank: 'Gold' },
    ],
  },
  {
    id: 'uapa', tag: 'UAPA', name: 'Universidad Abierta para Adultos',
    region: 'rd', city: 'Santiago', founded: 1991, joinedEsportefy: '2025',
    points: 870, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UAPA&backgroundColor=fdb813',
    bio: 'Pionera en educación a distancia en RD desde 1991. Su modelo flexible atrae a una comunidad gaming diversa que compite desde múltiples ciudades.',
    games: ['Valorant', 'Wild Rift'],
    offers: ['Torneos online', 'Comunidad gaming virtual'],
    teams: [],
  },
  {
    id: 'ucne', tag: 'UCNE', name: 'Universidad Católica Nordestana',
    region: 'rd', city: 'San Fco. de Macorís', founded: 1978, joinedEsportefy: '2025',
    points: 820, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCNE&backgroundColor=0033a0',
    bio: 'Fundada en 1978 en San Francisco de Macorís. Principal centro universitario de la región nordeste del país con fuerte identidad comunitaria.',
    games: ['Valorant', 'Mobile Legends'],
    offers: ['Torneos locales', 'Espacio gaming'],
    teams: [],
  },
  {
    id: 'isfodosu', tag: 'ISFODOSU', name: 'Instituto Superior de Formación Docente Salomé Ureña',
    region: 'rd', city: 'Santo Domingo', founded: 2003, joinedEsportefy: '2025',
    points: 790, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ISFO&backgroundColor=0033a0',
    bio: 'Institución estatal dedicada a la formación de docentes desde 2003. Con múltiples recintos a nivel nacional, promueve el uso de la tecnología en la educación.',
    games: ['League of Legends', 'Valorant', 'Teamfight Tactics'],
    offers: ['Club de esports educativo'],
    teams: [],
  },
  {
    id: 'itsc', tag: 'ITSC', name: 'Instituto Técnico Superior Comunitario',
    region: 'rd', city: 'San Pedro de Macorís', founded: 2012, joinedEsportefy: '2025',
    points: 740, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITSC&backgroundColor=0052FF',
    bio: 'Centro técnico fundado en 2012 en San Pedro de Macorís. Enfocado en formación técnica y tecnológica accesible para comunidades de la región este.',
    games: ['Valorant', 'Mobile Legends'],
    offers: ['Torneos comunitarios'],
    teams: [],
  },
  {
    id: 'ucateci', tag: 'UCATECI', name: 'Universidad Católica del Cibao',
    region: 'rd', city: 'La Vega', founded: 1983, joinedEsportefy: '2025',
    points: 710, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCATECI&backgroundColor=0033a0',
    bio: 'Fundada en 1983 en La Vega. Institución católica con fuerte presencia en la región del Cibao, comprometida con el desarrollo integral de sus estudiantes.',
    games: ['Valorant', 'Wild Rift'],
    offers: ['Eventos gaming semestrales'],
    teams: [],
  },
  {
    id: 'uniremhos', tag: 'UNIREMHOS', name: 'Universidad Eugenio María de Hostos',
    region: 'rd', city: 'Santo Domingo', founded: 1981, joinedEsportefy: '2025',
    points: 680, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=REMHOS&backgroundColor=0033a0',
    bio: 'Fundada en 1981, nombrada en honor al educador puertorriqueño Eugenio María de Hostos. Ofrece programas de salud, negocios y humanidades.',
    games: ['Valorant', 'Legends of Runeterra'],
    offers: ['Club gaming estudiantil'],
    teams: [],
  },
  {
    id: 'unicaribe', tag: 'UNICARIBE', name: 'Universidad del Caribe',
    region: 'rd', city: 'Santo Domingo', founded: 1995, joinedEsportefy: '2025',
    points: 650, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UC&backgroundColor=0033a0',
    bio: 'Institución fundada en 1995 con enfoque en accesibilidad educativa. Ofrece programas vespertinos y sabatinos para estudiantes trabajadores.',
    games: ['Valorant', 'Mobile Legends'],
    offers: ['Torneos nocturnos'],
    teams: [],
  },
  {
    id: 'oym', tag: 'O&M', name: 'Universidad Organización y Método',
    region: 'rd', city: 'Santo Domingo', founded: 1966, joinedEsportefy: '2025',
    points: 620, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=OM&backgroundColor=000000',
    bio: 'Una de las universidades más populares de RD, fundada en 1966. Conocida por sus programas accesibles y su gran comunidad estudiantil en todo el país.',
    games: ['Valorant', 'Teamfight Tactics'],
    offers: ['Liga interna de esports'],
    teams: [],
  },
  {
    id: 'uce', tag: 'UCE', name: 'Universidad Central del Este',
    region: 'rd', city: 'San Pedro de Macorís', founded: 1970, joinedEsportefy: '2025',
    points: 590, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCE&backgroundColor=009b3a',
    bio: 'Fundada en 1970 en San Pedro de Macorís, ciudad de los ingenios azucareros. Reconocida por su facultad de medicina y sus programas internacionales.',
    games: ['Valorant', 'Wild Rift'],
    offers: ['Gaming zone estudiantil'],
    teams: [],
  },
  {
    id: 'ufhec', tag: 'UFHEC', name: 'Universidad Federico Henríquez y Carvajal',
    region: 'rd', city: 'Santo Domingo', founded: 2003, joinedEsportefy: '2025',
    points: 560, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UFHEC&backgroundColor=0033a0',
    bio: 'Institución joven fundada en 2003 con visión moderna. Promueve la innovación y la integración tecnológica en todos sus programas académicos.',
    games: ['Valorant', 'Mobile Legends'],
    offers: ['Eventos de integración gaming'],
    teams: [],
  },
  {
    id: 'ucsd', tag: 'UCSD', name: 'Universidad Católica Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1982, joinedEsportefy: '2025',
    points: 530, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCSD&backgroundColor=0033a0',
    bio: 'Universidad católica fundada en 1982 por la Arquidiócesis de Santo Domingo. Combina formación humanística con programas técnicos modernos.',
    games: ['Valorant', 'Teamfight Tactics'],
    offers: ['Club de gaming'],
    teams: [],
  },
  {
    id: 'loyola', tag: 'LOYOLA', name: 'Instituto Politécnico Loyola',
    region: 'rd', city: 'San Cristóbal', founded: 1952, joinedEsportefy: '2025',
    points: 500, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=IPL&backgroundColor=0033a0',
    bio: 'El más antiguo politécnico del país, fundado en 1952 por los Padres Jesuitas en San Cristóbal. Formación técnica de excelencia con valores humanísticos.',
    games: ['Valorant', 'Wild Rift', 'Teamfight Tactics'],
    offers: ['Espacio gaming técnico'],
    teams: [],
  },
];

export const getUniversityCatalogByRegion = (region = 'rd') => {
  const normalizedRegion = String(region || 'rd').trim().toLowerCase();
  if (normalizedRegion !== 'rd') return [];

  return UNIVERSITY_CATALOG_RD.map((item) => ({
    ...item,
    games: sanitizeUniversityGames(item.games),
    teams: sanitizeUniversityTeams(item.teams),
    programs: sanitizeUniversityPrograms(item.id),
    campuses: sanitizeUniversityCampuses(item.id, item.city),
    allowedDomains: getUniversityAllowedDomains(item.id)
  }));
};

export const getUniversityCatalogItem = (universityId = '') => {
  const normalizedId = String(universityId || '').trim().toLowerCase();
  if (!normalizedId) return null;

  const found = UNIVERSITY_CATALOG_RD.find((item) => String(item.id || '').trim().toLowerCase() === normalizedId);
  return found ? {
    ...found,
    games: sanitizeUniversityGames(found.games),
    teams: sanitizeUniversityTeams(found.teams),
    programs: sanitizeUniversityPrograms(found.id),
    campuses: sanitizeUniversityCampuses(found.id, found.city),
    allowedDomains: getUniversityAllowedDomains(found.id)
  } : null;
};

export const UNIVERSITY_ALLOWED_GAMES = [...UNIVERSITY_ALLOWED_GAME_NAMES];
export const isUniversityGameAllowed = (game = '') => UNIVERSITY_ALLOWED_GAMES_SET.has(normalizeGameName(game));
