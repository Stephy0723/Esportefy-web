import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import './UniversityPage.scss';

/* ═══════════════════════════════════════════════════════════
   UNIVERSITY DATA — Prioridad: RD → Caribe → LATAM → América
   ═══════════════════════════════════════════════════════════ */

const REGIONS = [
  { id: 'rd', name: 'República Dominicana', flag: '🇩🇴', short: 'RD' },
  { id: 'caribe', name: 'El Caribe', flag: '🌴', short: 'Caribe' },
  { id: 'latam', name: 'Latinoamérica', flag: '🌎', short: 'LATAM' },
  { id: 'americas', name: 'América', flag: '🗽', short: 'América' },
];

const ALL_UNIVERSITIES = [
  // ═══ REPÚBLICA DOMINICANA ═══
  {
    id: 'uasd', tag: 'UASD', name: 'Universidad Autónoma de Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1538, joinedEsportefy: '2024',
    points: 1540, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UASD&backgroundColor=0033a0',
    bio: 'La universidad más antigua de América, fundada en 1538 como Universidad Santo Tomás de Aquino. Es la institución de educación superior más grande de República Dominicana con más de 200,000 estudiantes activos.',
    games: ['Valorant', 'League of Legends', 'FIFA', 'NBA 2K'],
    offers: ['Becas deportivas de esports', 'Centro de entrenamiento gaming', 'Torneos interuniversitarios', 'Club oficial de esports'],
    teams: [
      { name: 'UASD Titans', game: 'Valorant', members: 5, rank: 'Diamond+' },
      { name: 'UASD Legends', game: 'League of Legends', members: 5, rank: 'Platinum+' },
      { name: 'UASD FC', game: 'FIFA', members: 3, rank: 'Elite' },
    ],
  },
  {
    id: 'pucmm', tag: 'PUCMM', name: 'Pontificia Universidad Católica Madre y Maestra',
    region: 'rd', city: 'Santiago', founded: 1962, joinedEsportefy: '2024',
    points: 1420, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PUCMM&backgroundColor=0033a0',
    bio: 'Fundada en 1962, es considerada una de las mejores universidades privadas del Caribe. Pionera en programas de tecnología y negocios en República Dominicana, con campus en Santiago y Santo Domingo.',
    games: ['Valorant', 'League of Legends', 'Counter-Strike 2'],
    offers: ['Becas por mérito deportivo', 'Laboratorio de esports', 'Streaming studio', 'Programa de coaching'],
    teams: [
      { name: 'PUCMM Wolves', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'PUCMM Storm', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'intec', tag: 'INTEC', name: 'Instituto Tecnológico de Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1972, joinedEsportefy: '2024',
    points: 1280, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=INTEC&backgroundColor=d31145',
    bio: 'Centro de excelencia en ingeniería y tecnología desde 1972. Reconocida por su rigor académico y enfoque en innovación. Lidera la formación tecnológica en el país.',
    games: ['Valorant', 'League of Legends', 'Rocket League'],
    offers: ['Becas tecnológicas gaming', 'Hackathons + Gaming events', 'Club de desarrollo de videojuegos'],
    teams: [
      { name: 'INTEC Bees', game: 'Valorant', members: 5, rank: 'Diamond' },
      { name: 'INTEC Code', game: 'Rocket League', members: 3, rank: 'Champion' },
    ],
  },
  {
    id: 'unibe', tag: 'UNIBE', name: 'Universidad Iberoamericana',
    region: 'rd', city: 'Santo Domingo', founded: 1982, joinedEsportefy: '2024',
    points: 1150, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNIBE&backgroundColor=cc0000',
    bio: 'Universidad de élite fundada en 1982, conocida por sus programas de medicina, derecho y negocios. Infraestructura de primer nivel con fuerte inversión en tecnología y deportes electrónicos.',
    games: ['Valorant', 'FIFA', 'Fortnite'],
    offers: ['Gaming lounge premium', 'Torneos exclusivos', 'Mentorías con pros', 'Becas de rendimiento'],
    teams: [
      { name: 'UNIBE Red', game: 'Valorant', members: 5, rank: 'Ascendant' },
      { name: 'UNIBE United', game: 'FIFA', members: 2, rank: 'Elite' },
    ],
  },
  {
    id: 'itla', tag: 'ITLA', name: 'Instituto Tecnológico de Las Américas',
    region: 'rd', city: 'Santo Domingo Este', founded: 2000, joinedEsportefy: '2024',
    points: 1090, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITLA&backgroundColor=0052FF',
    bio: 'Fundado en el año 2000, es el principal centro tecnológico del gobierno dominicano. Especializado en software, multimedia, redes y mecatrónica. Cuna de desarrolladores y gamers profesionales.',
    games: ['Valorant', 'League of Legends', 'Counter-Strike 2', 'Fortnite'],
    offers: ['Arena de esports dedicada', 'Programa de desarrollo gaming', 'Becas 100% por esports', 'Club de game dev'],
    teams: [
      { name: 'ITLA Nexus', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'ITLA Binary', game: 'Counter-Strike 2', members: 5, rank: 'Global Elite' },
      { name: 'ITLA Devs', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'unapec', tag: 'UNAPEC', name: 'Universidad APEC',
    region: 'rd', city: 'Santo Domingo', founded: 1965, joinedEsportefy: '2025',
    points: 1020, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=APEC&backgroundColor=002d62',
    bio: 'Fundada en 1965 por la Acción Pro Educación y Cultura. Líder en negocios, tecnología y comunicación. Su comunidad estudiantil es una de las más activas en esports del país.',
    games: ['Valorant', 'FIFA', 'NBA 2K'],
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
    games: ['Valorant', 'League of Legends'],
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
    games: ['Valorant', 'FIFA'],
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
    games: ['Valorant', 'Fortnite'],
    offers: ['Torneos online', 'Comunidad gaming virtual'],
    teams: [],
  },
  {
    id: 'ucne', tag: 'UCNE', name: 'Universidad Católica Nordestana',
    region: 'rd', city: 'San Fco. de Macorís', founded: 1978, joinedEsportefy: '2025',
    points: 820, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCNE&backgroundColor=0033a0',
    bio: 'Fundada en 1978 en San Francisco de Macorís. Principal centro universitario de la región nordeste del país con fuerte identidad comunitaria.',
    games: ['Valorant', 'FIFA'],
    offers: ['Torneos locales', 'Espacio gaming'],
    teams: [],
  },
  {
    id: 'isfodosu', tag: 'ISFODOSU', name: 'Instituto Superior de Formación Docente Salomé Ureña',
    region: 'rd', city: 'Santo Domingo', founded: 2003, joinedEsportefy: '2025',
    points: 790, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ISFO&backgroundColor=0033a0',
    bio: 'Institución estatal dedicada a la formación de docentes desde 2003. Con múltiples recintos a nivel nacional, promueve el uso de la tecnología en la educación.',
    games: ['League of Legends', 'Valorant'],
    offers: ['Club de esports educativo'],
    teams: [],
  },
  {
    id: 'itsc', tag: 'ITSC', name: 'Instituto Técnico Superior Comunitario',
    region: 'rd', city: 'San Pedro de Macorís', founded: 2012, joinedEsportefy: '2025',
    points: 740, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITSC&backgroundColor=0052FF',
    bio: 'Centro técnico fundado en 2012 en San Pedro de Macorís. Enfocado en formación técnica y tecnológica accesible para comunidades de la región este.',
    games: ['Valorant'],
    offers: ['Torneos comunitarios'],
    teams: [],
  },
  {
    id: 'ucateci', tag: 'UCATECI', name: 'Universidad Católica del Cibao',
    region: 'rd', city: 'La Vega', founded: 1983, joinedEsportefy: '2025',
    points: 710, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCATECI&backgroundColor=0033a0',
    bio: 'Fundada en 1983 en La Vega. Institución católica con fuerte presencia en la región del Cibao, comprometida con el desarrollo integral de sus estudiantes.',
    games: ['Valorant', 'FIFA'],
    offers: ['Eventos gaming semestrales'],
    teams: [],
  },
  {
    id: 'uniremhos', tag: 'UNIREMHOS', name: 'Universidad Eugenio María de Hostos',
    region: 'rd', city: 'Santo Domingo', founded: 1981, joinedEsportefy: '2025',
    points: 680, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=REMHOS&backgroundColor=0033a0',
    bio: 'Fundada en 1981, nombrada en honor al educador puertorriqueño Eugenio María de Hostos. Ofrece programas de salud, negocios y humanidades.',
    games: ['Valorant'],
    offers: ['Club gaming estudiantil'],
    teams: [],
  },
  {
    id: 'unicaribe', tag: 'UNICARIBE', name: 'Universidad del Caribe',
    region: 'rd', city: 'Santo Domingo', founded: 1995, joinedEsportefy: '2025',
    points: 650, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UC&backgroundColor=0033a0',
    bio: 'Institución fundada en 1995 con enfoque en accesibilidad educativa. Ofrece programas vespertinos y sabatinos para estudiantes trabajadores.',
    games: ['Valorant', 'FIFA'],
    offers: ['Torneos nocturnos'],
    teams: [],
  },
  {
    id: 'oym', tag: 'O&M', name: 'Universidad Organización y Método',
    region: 'rd', city: 'Santo Domingo', founded: 1966, joinedEsportefy: '2025',
    points: 620, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=OM&backgroundColor=000000',
    bio: 'Una de las universidades más populares de RD, fundada en 1966. Conocida por sus programas accesibles y su gran comunidad estudiantil en todo el país.',
    games: ['Valorant', 'NBA 2K'],
    offers: ['Liga interna de esports'],
    teams: [],
  },
  {
    id: 'uce', tag: 'UCE', name: 'Universidad Central del Este',
    region: 'rd', city: 'San Pedro de Macorís', founded: 1970, joinedEsportefy: '2025',
    points: 590, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCE&backgroundColor=009b3a',
    bio: 'Fundada en 1970 en San Pedro de Macorís, ciudad de los ingenios azucareros. Reconocida por su facultad de medicina y sus programas internacionales.',
    games: ['Valorant'],
    offers: ['Gaming zone estudiantil'],
    teams: [],
  },
  {
    id: 'ufhec', tag: 'UFHEC', name: 'Universidad Federico Henríquez y Carvajal',
    region: 'rd', city: 'Santo Domingo', founded: 2003, joinedEsportefy: '2025',
    points: 560, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UFHEC&backgroundColor=0033a0',
    bio: 'Institución joven fundada en 2003 con visión moderna. Promueve la innovación y la integración tecnológica en todos sus programas académicos.',
    games: ['Valorant'],
    offers: ['Eventos de integración gaming'],
    teams: [],
  },
  {
    id: 'ucsd', tag: 'UCSD', name: 'Universidad Católica Santo Domingo',
    region: 'rd', city: 'Santo Domingo', founded: 1982, joinedEsportefy: '2025',
    points: 530, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCSD&backgroundColor=0033a0',
    bio: 'Universidad católica fundada en 1982 por la Arquidiócesis de Santo Domingo. Combina formación humanística con programas técnicos modernos.',
    games: ['Valorant', 'FIFA'],
    offers: ['Club de gaming'],
    teams: [],
  },
  {
    id: 'loyola', tag: 'LOYOLA', name: 'Instituto Politécnico Loyola',
    region: 'rd', city: 'San Cristóbal', founded: 1952, joinedEsportefy: '2025',
    points: 500, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=IPL&backgroundColor=0033a0',
    bio: 'El más antiguo politécnico del país, fundado en 1952 por los Padres Jesuitas en San Cristóbal. Formación técnica de excelencia con valores humanísticos.',
    games: ['Valorant'],
    offers: ['Espacio gaming técnico'],
    teams: [],
  },

  // ═══ CARIBE ═══
  {
    id: 'uwi', tag: 'UWI', name: 'University of the West Indies',
    region: 'caribe', city: 'Kingston, Jamaica', founded: 1948, joinedEsportefy: '2025',
    points: 1380, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UWI&backgroundColor=6b2fa0',
    bio: 'La principal universidad del Caribe anglófono, fundada en 1948. Con campus en Jamaica, Trinidad y Barbados, es el centro académico más importante de la región caribeña.',
    games: ['Valorant', 'League of Legends', 'Call of Duty'],
    offers: ['Caribbean Esports League', 'Becas de rendimiento', 'Gaming center multi-campus'],
    teams: [
      { name: 'UWI Tridents', game: 'Valorant', members: 5, rank: 'Diamond' },
      { name: 'UWI Caribs', game: 'League of Legends', members: 5, rank: 'Platinum' },
    ],
  },
  {
    id: 'upr', tag: 'UPR', name: 'Universidad de Puerto Rico',
    region: 'caribe', city: 'San Juan, PR', founded: 1903, joinedEsportefy: '2025',
    points: 1340, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UPR&backgroundColor=009b3a',
    bio: 'Principal sistema universitario público de Puerto Rico desde 1903. Con 11 campus por toda la isla, lidera la escena de esports universitarios en el Caribe hispano.',
    games: ['Valorant', 'League of Legends', 'Super Smash Bros', 'Rocket League'],
    offers: ['Puerto Rico University League', 'Becas deportivas', 'Arena gaming Río Piedras', 'Programa coaching'],
    teams: [
      { name: 'UPR Gallos', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'UPR Smash', game: 'Super Smash Bros', members: 8, rank: 'Regional Top 10' },
    ],
  },
  {
    id: 'uniq', tag: 'UniQ', name: 'Université Quisqueya',
    region: 'caribe', city: 'Puerto Príncipe, Haití', founded: 1988, joinedEsportefy: '2025',
    points: 920, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UniQ&backgroundColor=00209f',
    bio: 'Universidad privada líder de Haití fundada en 1988. A pesar de los desafíos del país, mantiene una comunidad gaming activa y resiliente.',
    games: ['Valorant', 'FIFA'],
    offers: ['Torneos comunitarios', 'Club de esports'],
    teams: [
      { name: 'UniQ Phoenix', game: 'Valorant', members: 5, rank: 'Gold' },
    ],
  },
  {
    id: 'utt', tag: 'UTT', name: 'University of Trinidad and Tobago',
    region: 'caribe', city: 'Puerto España, T&T', founded: 2004, joinedEsportefy: '2025',
    points: 880, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UTT&backgroundColor=ce1126',
    bio: 'Universidad tecnológica fundada en 2004. Enfocada en innovación y desarrollo caribeño. Su programa de gaming está en crecimiento acelerado.',
    games: ['Valorant', 'Fortnite'],
    offers: ['Tech & Gaming program', 'Eventos intercampus'],
    teams: [],
  },
  {
    id: 'uh', tag: 'UH', name: 'Universidad de La Habana',
    region: 'caribe', city: 'La Habana, Cuba', founded: 1728, joinedEsportefy: '2025',
    points: 1100, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UH&backgroundColor=002a8f',
    bio: 'Fundada en 1728, es una de las universidades más antiguas de América. A pesar de las limitaciones de conectividad, su comunidad gaming crece con determinación.',
    games: ['League of Legends', 'FIFA'],
    offers: ['LAN parties universitarias', 'Club de estrategia'],
    teams: [
      { name: 'UH Havana', game: 'League of Legends', members: 5, rank: 'Gold' },
    ],
  },

  // ═══ LATINOAMÉRICA ═══
  {
    id: 'unam', tag: 'UNAM', name: 'Universidad Nacional Autónoma de México',
    region: 'latam', city: 'CDMX, México', founded: 1551, joinedEsportefy: '2025',
    points: 1900, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNAM&backgroundColor=003366',
    bio: 'La universidad más grande de Latinoamérica, fundada en 1551. Su campus es Patrimonio de la Humanidad. Lidera los esports universitarios en México con equipos profesionales.',
    games: ['Valorant', 'League of Legends', 'Counter-Strike 2', 'Rocket League', 'FIFA'],
    offers: ['Arena UNAM Esports', 'Becas deportivas completas', 'Liga UNAM Gaming', 'Programa de streaming', 'Bootcamps profesionales'],
    teams: [
      { name: 'UNAM Pumas Esports', game: 'Valorant', members: 5, rank: 'Radiant' },
      { name: 'UNAM Azul y Oro', game: 'League of Legends', members: 5, rank: 'Challenger' },
      { name: 'UNAM CS', game: 'Counter-Strike 2', members: 5, rank: 'Level 10 FACEIT' },
    ],
  },
  {
    id: 'tec', tag: 'ITESM', name: 'Tecnológico de Monterrey',
    region: 'latam', city: 'Monterrey, México', founded: 1943, joinedEsportefy: '2025',
    points: 1820, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=TEC&backgroundColor=003366',
    bio: 'Fundado en 1943, es una de las universidades privadas más prestigiosas de América Latina. Con 26 campus en México, lidera la innovación en esports universitarios.',
    games: ['Valorant', 'League of Legends', 'Rocket League', 'Overwatch 2'],
    offers: ['Tec Esports Arena', 'Becas de alto rendimiento', 'Liga inter-campus', 'Certificación en esports management'],
    teams: [
      { name: 'Borregos Esports', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'TEC Gaming', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'usp', tag: 'USP', name: 'Universidade de São Paulo',
    region: 'latam', city: 'São Paulo, Brasil', founded: 1934, joinedEsportefy: '2025',
    points: 1750, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=USP&backgroundColor=004b23',
    bio: 'La mayor universidad de Brasil y una de las mejores de Latinoamérica, fundada en 1934. Brasil es potencia mundial en esports y USP lidera la escena universitaria.',
    games: ['Valorant', 'League of Legends', 'Counter-Strike 2', 'Free Fire'],
    offers: ['USP Esports Lab', 'Liga Universitária Brasileira', 'Becas deportivas', 'Game development program'],
    teams: [
      { name: 'USP Esports', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'USP CBLOL Academy', game: 'League of Legends', members: 5, rank: 'Master' },
    ],
  },
  {
    id: 'uba', tag: 'UBA', name: 'Universidad de Buenos Aires',
    region: 'latam', city: 'Buenos Aires, Argentina', founded: 1821, joinedEsportefy: '2025',
    points: 1680, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UBA&backgroundColor=0066cc',
    bio: 'Fundada en 1821, es la universidad más importante de Argentina y una de las top de Sudamérica. Argentina tiene una cultura gaming enorme y UBA es su epicentro universitario.',
    games: ['Counter-Strike 2', 'Valorant', 'League of Legends', 'FIFA'],
    offers: ['Liga UBA Gaming', 'Becas de rendimiento', 'Bootcamps', 'Co-working gaming'],
    teams: [
      { name: 'UBA Gaming', game: 'Counter-Strike 2', members: 5, rank: 'Level 10 FACEIT' },
      { name: 'UBA Esports', game: 'Valorant', members: 5, rank: 'Ascendant' },
    ],
  },
  {
    id: 'puc', tag: 'PUC', name: 'Pontificia Universidad Católica de Chile',
    region: 'latam', city: 'Santiago, Chile', founded: 1888, joinedEsportefy: '2025',
    points: 1600, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PUC&backgroundColor=003087',
    bio: 'Fundada en 1888, es la mejor universidad de Chile y una de las top 100 del mundo. Su programa de esports integra academia con competición profesional.',
    games: ['Valorant', 'League of Legends', 'StarCraft 2'],
    offers: ['PUC Esports Center', 'Becas deportivas', 'Liga chilena universitaria'],
    teams: [
      { name: 'PUC Cruzados GG', game: 'Valorant', members: 5, rank: 'Immortal' },
    ],
  },
  {
    id: 'uandes', tag: 'UNIANDES', name: 'Universidad de los Andes',
    region: 'latam', city: 'Bogotá, Colombia', founded: 1948, joinedEsportefy: '2025',
    points: 1550, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ANDES&backgroundColor=fcd116',
    bio: 'Universidad de élite colombiana fundada en 1948. Colombia es uno de los mercados de esports más grandes de LATAM y Uniandes lidera la escena universitaria.',
    games: ['Valorant', 'League of Legends', 'Fortnite', 'FIFA'],
    offers: ['Uniandes Gaming Hub', 'Liga Colombiana Universitaria', 'Becas esports', 'Incubadora gaming'],
    teams: [
      { name: 'Uniandes Esports', game: 'Valorant', members: 5, rank: 'Diamond' },
      { name: 'Uniandes LoL', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
  {
    id: 'usm', tag: 'USM', name: 'Universidad Técnica Federico Santa María',
    region: 'latam', city: 'Valparaíso, Chile', founded: 1926, joinedEsportefy: '2025',
    points: 1200, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=USM&backgroundColor=c8102e',
    bio: 'La mejor universidad técnica de Chile, fundada en 1926. Reconocida por su excelencia en ingeniería. Su comunidad gaming es muy activa.',
    games: ['Valorant', 'League of Legends', 'Rocket League'],
    offers: ['Gaming room USM', 'Liga interna', 'Eventos LAN'],
    teams: [
      { name: 'USM Sansanos', game: 'Valorant', members: 5, rank: 'Ascendant' },
    ],
  },
  {
    id: 'espol', tag: 'ESPOL', name: 'Escuela Politécnica del Litoral',
    region: 'latam', city: 'Guayaquil, Ecuador', founded: 1958, joinedEsportefy: '2025',
    points: 1100, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ESPOL&backgroundColor=005baa',
    bio: 'Principal universidad técnica de Ecuador, fundada en 1958 en Guayaquil. Ecuador tiene una escena gaming creciente y ESPOL es su punta de lanza universitaria.',
    games: ['Valorant', 'Fortnite', 'FIFA'],
    offers: ['ESPOL Gaming Club', 'Torneos internos'],
    teams: [
      { name: 'ESPOL Esports', game: 'Valorant', members: 5, rank: 'Platinum' },
    ],
  },

  // ═══ AMÉRICA (USA / CANADÁ) ═══
  {
    id: 'mit', tag: 'MIT', name: 'Massachusetts Institute of Technology',
    region: 'americas', city: 'Cambridge, USA', founded: 1861, joinedEsportefy: '2025',
    points: 2100, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=MIT&backgroundColor=a31f34',
    bio: 'La institución tecnológica más prestigiosa del mundo, fundada en 1861. Su programa de esports combina competición de élite con investigación en gaming y AI.',
    games: ['Valorant', 'League of Legends', 'Overwatch 2', 'Rocket League', 'Super Smash Bros'],
    offers: ['MIT Gaming Lab', 'Research in esports analytics', 'Full esports scholarships', 'AI coaching tools', 'Professional streaming setup'],
    teams: [
      { name: 'MIT Engineers', game: 'Valorant', members: 5, rank: 'Radiant' },
      { name: 'MIT LoL', game: 'League of Legends', members: 5, rank: 'Challenger' },
      { name: 'MIT Rockets', game: 'Rocket League', members: 3, rank: 'Grand Champion' },
    ],
  },
  {
    id: 'uci', tag: 'UCI', name: 'University of California, Irvine',
    region: 'americas', city: 'Irvine, USA', founded: 1965, joinedEsportefy: '2025',
    points: 2050, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCI&backgroundColor=0064a4',
    bio: 'Pionera absoluta en esports universitarios en EE.UU. Fue la primera universidad en ofrecer becas de esports y tiene un arena dedicada de $5.5M. Fundada en 1965.',
    games: ['League of Legends', 'Valorant', 'Overwatch 2', 'Rocket League', 'Counter-Strike 2'],
    offers: ['UCI Esports Arena (5,500 sq ft)', 'Full-ride esports scholarships', 'Esports management degree', 'Professional coaching staff', 'Content creation studio'],
    teams: [
      { name: 'UCI Anteaters LoL', game: 'League of Legends', members: 5, rank: 'Challenger' },
      { name: 'UCI Valorant', game: 'Valorant', members: 5, rank: 'Radiant' },
      { name: 'UCI OW', game: 'Overwatch 2', members: 6, rank: 'Top 500' },
    ],
  },
  {
    id: 'ubc', tag: 'UBC', name: 'University of British Columbia',
    region: 'americas', city: 'Vancouver, Canadá', founded: 1908, joinedEsportefy: '2025',
    points: 1950, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UBC&backgroundColor=002145',
    bio: 'Una de las mejores universidades de Canadá, fundada en 1908. Su programa de esports es uno de los más completos del país con múltiples equipos competitivos.',
    games: ['Valorant', 'League of Legends', 'Dota 2', 'Overwatch 2'],
    offers: ['UBC Esports Lounge', 'Varsity esports program', 'Scholarships', 'Industry networking'],
    teams: [
      { name: 'UBC Thunderbirds', game: 'Valorant', members: 5, rank: 'Immortal' },
      { name: 'UBC LoL', game: 'League of Legends', members: 5, rank: 'Master' },
    ],
  },
  {
    id: 'rmu', tag: 'RMU', name: 'Robert Morris University',
    region: 'americas', city: 'Pittsburgh, USA', founded: 1921, joinedEsportefy: '2025',
    points: 1900, verified: true,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=RMU&backgroundColor=003366',
    bio: 'La PRIMERA universidad en EE.UU. en ofrecer becas de esports (2014). Fundada en 1921, RMU es un ícono histórico de los esports universitarios en Norteamérica.',
    games: ['League of Legends', 'Valorant', 'Counter-Strike 2', 'Overwatch 2', 'Hearthstone'],
    offers: ['Pioneer esports program (est. 2014)', 'Full athletic scholarships', 'Dedicated esports facility', 'Professional coaching', 'Career placement in gaming industry'],
    teams: [
      { name: 'RMU Eagles LoL', game: 'League of Legends', members: 5, rank: 'Master' },
      { name: 'RMU Eagles VAL', game: 'Valorant', members: 5, rank: 'Immortal' },
    ],
  },
  {
    id: 'utaus', tag: 'UT Austin', name: 'University of Texas at Austin',
    region: 'americas', city: 'Austin, USA', founded: 1883, joinedEsportefy: '2025',
    points: 1850, verified: false,
    logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UT&backgroundColor=bf5700',
    bio: 'Una de las universidades públicas más grandes de EE.UU., fundada en 1883. Ubicada en Austin, capital mundial del gaming y la tech. Su escena de esports está en expansión.',
    games: ['Valorant', 'League of Legends', 'Rocket League', 'Super Smash Bros'],
    offers: ['UT Esports Club', 'Gaming events at GDC', 'LAN tournaments', 'Community gaming nights'],
    teams: [
      { name: 'Texas Esports', game: 'Valorant', members: 5, rank: 'Ascendant' },
      { name: 'Longhorn Gaming', game: 'League of Legends', members: 5, rank: 'Diamond' },
    ],
  },
];

const TOURNAMENTS_BY_REGION = {
  rd: [
    { id: 1, game: 'Valorant', title: 'Copa Quisqueya', date: '27 Feb', format: '5vs5', prize: 'RD$ 50,000', status: 'open', color: 'green' },
    { id: 2, game: 'League of Legends', title: 'Battle of the Gods RD', date: '15 Mar', format: '5vs5', prize: 'RD$ 75,000', status: 'open', color: 'gold' },
    { id: 3, game: 'NBA 2K / FIFA', title: 'Clásico Universitario', date: 'Hoy', format: '1vs1', prize: 'RD$ 25,000', status: 'live', color: 'danger' },
    { id: 4, game: 'Fortnite', title: 'Tríos Universitarios RD', date: '5 Mar', format: '3vs3', prize: 'RD$ 30,000', status: 'open', color: 'green' },
  ],
  caribe: [
    { id: 5, game: 'Valorant', title: 'Caribbean Clash', date: '10 Mar', format: '5vs5', prize: '$1,500 USD', status: 'open', color: 'green' },
    { id: 6, game: 'League of Legends', title: 'Island Cup', date: '22 Mar', format: '5vs5', prize: '$2,000 USD', status: 'upcoming', color: 'muted' },
  ],
  latam: [
    { id: 7, game: 'Valorant', title: 'Copa LATAM Universitaria', date: '1 Abr', format: '5vs5', prize: '$5,000 USD', status: 'upcoming', color: 'gold' },
    { id: 8, game: 'Counter-Strike 2', title: 'CS University League', date: '15 Abr', format: '5vs5', prize: '$3,000 USD', status: 'upcoming', color: 'muted' },
  ],
  americas: [
    { id: 9, game: 'Valorant', title: 'Americas Uni Championship', date: '1 May', format: '5vs5', prize: '$10,000 USD', status: 'upcoming', color: 'green' },
    { id: 10, game: 'League of Legends', title: 'Collegiate LoL Open', date: '20 May', format: '5vs5', prize: '$8,000 USD', status: 'upcoming', color: 'gold' },
  ],
};

const CAMPUS_CITIES = {
  rd: [
    'Santo Domingo (D.N. / Prov.)', 'Santiago de los Caballeros', 'San Francisco de Macorís',
    'La Romana', 'Punta Cana / Higüey', 'San Pedro de Macorís', 'La Vega', 'Puerto Plata', 'Moca', 'Baní',
  ],
  caribe: ['Kingston, Jamaica', 'San Juan, PR', 'La Habana, Cuba', 'Puerto Príncipe, Haití', 'Puerto España, T&T'],
  latam: ['CDMX, México', 'Monterrey, México', 'São Paulo, Brasil', 'Buenos Aires, Argentina', 'Santiago, Chile', 'Bogotá, Colombia', 'Guayaquil, Ecuador', 'Lima, Perú'],
  americas: ['Boston, USA', 'Irvine, USA', 'Austin, USA', 'Pittsburgh, USA', 'Vancouver, Canadá', 'Toronto, Canadá'],
};

const STATUS_LABELS = {
  live: 'EN VIVO',
  open: 'INSCRIPCIONES ABIERTAS',
  upcoming: 'PRÓXIMAMENTE',
};

const EMPTY_UNIVERSITY_STATUS = {
  universityId: '',
  universityTag: '',
  universityName: '',
  region: '',
  city: '',
  campus: '',
  studentId: '',
  program: '',
  academicLevel: '',
  institutionalEmail: '',
  verificationSource: 'none',
  verificationStatus: 'unlinked',
  verified: false,
  tenantId: '',
  appliedAt: null,
  verifiedAt: null,
  reviewedAt: null,
  reviewedBy: null,
  rejectReason: ''
};

const UNIVERSITY_STATUS_META = {
  unlinked: {
    tone: 'neutral',
    title: 'Sin verificación universitaria',
    text: 'Aún no has enviado una postulación institucional.'
  },
  pending: {
    tone: 'pending',
    title: 'Postulación en revisión',
    text: 'Tu solicitud universitaria fue enviada y está pendiente de validación.'
  },
  verified: {
    tone: 'verified',
    title: 'Cuenta universitaria verificada',
    text: 'Tu cuenta ya está aprobada para competir como estudiante universitario.'
  },
  rejected: {
    tone: 'rejected',
    title: 'Postulación rechazada',
    text: 'Puedes corregir los datos y volver a enviar la solicitud.'
  }
};

const STUDENT_ID_REGEX = /^[A-Za-z0-9][A-Za-z0-9._/-]{3,31}$/;
const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com'
]);
const ALLOWED_ACADEMIC_LEVELS = new Set(['1', '2', '3', '4', 'egresado', 'maestria']);

const getEmailDomain = (value) => {
  const email = String(value || '').trim().toLowerCase();
  const atIndex = email.lastIndexOf('@');
  return atIndex === -1 ? '' : email.slice(atIndex + 1);
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const UniversityPage = () => {
  const token = useMemo(() => localStorage.getItem('token') || sessionStorage.getItem('token') || '', []);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeRegion, setActiveRegion] = useState('rd');
  const [activeTab, setActiveTab] = useState('universidades');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUni, setSelectedUni] = useState(null);      // Vista detalle
  const [enrollModal, setEnrollModal] = useState(false);      // Modal postulación
  const [enrollUni, setEnrollUni] = useState(null);
  const [enrollStep, setEnrollStep] = useState(1);
  const [formData, setFormData] = useState({ matricula: '', carrera: '', campus: '', customCampus: '', nivel: '', institutionalEmail: '' });
  const [myUniversityStatus, setMyUniversityStatus] = useState(EMPTY_UNIVERSITY_STATUS);
  const [statusLoading, setStatusLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [adminApplications, setAdminApplications] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [reviewLoadingId, setReviewLoadingId] = useState('');
  const [rejectDrafts, setRejectDrafts] = useState({});
  const [adminFilters, setAdminFilters] = useState({ status: 'pending', region: '' });

  const regionUnis = useMemo(() => {
    return ALL_UNIVERSITIES
      .filter(u => u.region === activeRegion)
      .filter(u =>
        !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.points - a.points);
  }, [activeRegion, searchQuery]);

  const regionTournaments = TOURNAMENTS_BY_REGION[activeRegion] || [];
  const currentRegion = REGIONS.find(r => r.id === activeRegion);
  const campusCities = CAMPUS_CITIES[activeRegion] || [];

  const stats = useMemo(() => {
    const unis = ALL_UNIVERSITIES.filter(u => u.region === activeRegion);
    return {
      total: unis.length,
      verified: unis.filter(u => u.verified).length,
      teams: unis.reduce((sum, u) => sum + u.teams.length, 0),
      tournaments: regionTournaments.length,
    };
  }, [activeRegion, regionTournaments.length]);

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(res.data || null);
    } catch (error) {
      console.error('Error cargando perfil en University:', error);
    }
  };

  const loadMyUniversityStatus = async () => {
    if (!token) {
      setStatusLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/university/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nextStatus = res.data?.university || EMPTY_UNIVERSITY_STATUS;
      setMyUniversityStatus(nextStatus);
      setFormData((prev) => ({
        ...prev,
        institutionalEmail: prev.institutionalEmail || nextStatus.institutionalEmail || res.data?.microsoftConnection?.email || res.data?.userEmail || ''
      }));
    } catch (error) {
      console.error('Error cargando estado universitario:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || 'No se pudo cargar tu estado universitario.'
      });
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadMyUniversityStatus();
  }, [token]);

  const loadAdminApplications = async () => {
    if (!token || !currentUser?.isAdmin) return;
    setAdminLoading(true);
    try {
      const params = new URLSearchParams();
      if (adminFilters.status) params.set('status', adminFilters.status);
      if (adminFilters.region) params.set('region', adminFilters.region);

      const res = await axios.get(`${API_URL}/api/university/applications${params.toString() ? `?${params}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminApplications(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error cargando postulaciones universitarias:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || 'No se pudo cargar la cola de postulaciones universitarias.'
      });
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.isAdmin) {
      loadAdminApplications();
    }
  }, [activeTab, currentUser?.isAdmin, adminFilters.status, adminFilters.region]);

  const currentUniversityState = myUniversityStatus?.verificationStatus || 'unlinked';
  const currentUniversityMeta = UNIVERSITY_STATUS_META[currentUniversityState] || UNIVERSITY_STATUS_META.unlinked;
  const selectedUniMatchesCurrent = Boolean(selectedUni && myUniversityStatus?.universityId === selectedUni.id);
  const selectedUniLocked = selectedUniMatchesCurrent && ['pending', 'verified'].includes(currentUniversityState);

  const handleReviewApplication = async (application, decision) => {
    if (!token || !currentUser?.isAdmin || !application?._id) return;

    const rejectReason = String(rejectDrafts[application._id] || '').trim();
    if (decision === 'rejected' && !rejectReason) {
      setStatusNotice({
        type: 'error',
        text: 'Debes indicar el motivo del rechazo antes de rechazar una postulación.'
      });
      return;
    }

    setReviewLoadingId(application._id);
    setStatusNotice(null);
    try {
      await axios.patch(`${API_URL}/api/university/applications/${application._id}/review`, {
        decision,
        rejectReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRejectDrafts((prev) => {
        const next = { ...prev };
        delete next[application._id];
        return next;
      });
      setStatusNotice({
        type: 'success',
        text: decision === 'approved'
          ? 'Postulación universitaria aprobada.'
          : 'Postulación universitaria rechazada.'
      });
      await loadAdminApplications();
    } catch (error) {
      console.error('Error revisando postulación universitaria:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || 'No se pudo revisar la postulación universitaria.'
      });
    } finally {
      setReviewLoadingId('');
    }
  };

  const renderUniversityStatusBanner = () => {
    if (!statusNotice && currentUniversityState === 'unlinked' && !statusLoading) return null;

    return (
      <div className="up-status-stack">
        {statusNotice && (
          <div className={`up-status-banner up-status-banner--${statusNotice.type}`}>
            <i className={`bx ${statusNotice.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}`}></i>
            <div>
              <strong>{statusNotice.type === 'success' ? 'University' : 'Atención'}</strong>
              <span>{statusNotice.text}</span>
            </div>
          </div>
        )}

        {statusLoading ? (
          <div className="up-status-banner up-status-banner--neutral">
            <i className="bx bx-loader-alt"></i>
            <div>
              <strong>University</strong>
              <span>Cargando tu estado institucional...</span>
            </div>
          </div>
        ) : currentUniversityState !== 'unlinked' ? (
          <div className={`up-status-banner up-status-banner--${currentUniversityMeta.tone}`}>
            <i className={`bx ${
              currentUniversityState === 'verified'
                ? 'bx-badge-check'
                : currentUniversityState === 'pending'
                  ? 'bx-time-five'
                  : 'bx-x-circle'
            }`}></i>
            <div>
              <strong>{currentUniversityMeta.title}</strong>
              <span>
                {myUniversityStatus.universityName ? `${myUniversityStatus.universityName}. ` : ''}
                {currentUniversityMeta.text}
                {currentUniversityState === 'rejected' && myUniversityStatus.rejectReason ? ` Motivo: ${myUniversityStatus.rejectReason}` : ''}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  // Enroll handlers
  const openEnroll = (uni) => {
    setStatusNotice(null);
    setFieldErrors({});
    setEnrollUni(uni);
    setEnrollStep(1);
    setEnrollModal(true);
    setFormData((prev) => ({
      ...prev,
      institutionalEmail: prev.institutionalEmail || myUniversityStatus?.institutionalEmail || ''
    }));
  };

  const validateEnrollForm = () => {
    const nextErrors = {};
    const normalizedStudentId = String(formData.matricula || '').trim();
    const normalizedProgram = String(formData.carrera || '').trim();
    const selectedCampus = formData.campus === 'otro'
      ? String(formData.customCampus || '').trim()
      : String(formData.campus || '').trim();
    const normalizedEmail = String(formData.institutionalEmail || '').trim().toLowerCase();

    if (!STUDENT_ID_REGEX.test(normalizedStudentId)) {
      nextErrors.matricula = 'Usa entre 4 y 32 caracteres. Solo letras, números, ".", "_", "/" o "-".';
    }

    if (normalizedProgram.length < 3) {
      nextErrors.carrera = 'La carrera debe tener al menos 3 caracteres.';
    }

    if (selectedCampus.length < 3) {
      nextErrors.campus = 'Indica un campus válido.';
    }

    if (!ALLOWED_ACADEMIC_LEVELS.has(String(formData.nivel || '').trim())) {
      nextErrors.nivel = 'Selecciona un nivel académico válido.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.institutionalEmail = 'Ingresa un correo institucional válido.';
    } else if (PUBLIC_EMAIL_DOMAINS.has(getEmailDomain(normalizedEmail))) {
      nextErrors.institutionalEmail = 'Usa un correo institucional, no uno personal.';
    }

    setFieldErrors(nextErrors);
    return {
      isValid: Object.keys(nextErrors).length === 0,
      normalizedCampus: selectedCampus
    };
  };

  const handleSubmitEnroll = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatusNotice({ type: 'error', text: 'Debes iniciar sesión para postularte a una universidad.' });
      return;
    }
    if (!enrollUni) return;

    const { isValid, normalizedCampus } = validateEnrollForm();
    if (!isValid) return;

    setSubmitLoading(true);
    setStatusNotice(null);

    try {
      await axios.post(`${API_URL}/api/university/applications`, {
        universityId: enrollUni.id,
        universityTag: enrollUni.tag,
        universityName: enrollUni.name,
        region: enrollUni.region,
        city: enrollUni.city,
        campus: normalizedCampus,
        studentId: formData.matricula,
        program: formData.carrera,
        academicLevel: formData.nivel,
        institutionalEmail: formData.institutionalEmail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEnrollModal(false);
      setFieldErrors({});
      setFormData({ matricula: '', carrera: '', campus: '', customCampus: '', nivel: '', institutionalEmail: '' });
      setStatusNotice({
        type: 'success',
        text: 'Tu postulación universitaria fue enviada. Ahora queda pendiente de validación.'
      });
      await loadMyUniversityStatus();
    } catch (error) {
      console.error('Error enviando postulación:', error);
      setStatusNotice({
        type: 'error',
        text: error?.response?.data?.message || 'No se pudo enviar la postulación universitaria.'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ─── VISTA DETALLE DE UNIVERSIDAD ─── */
  if (selectedUni) {
    return (
      <div className="up">
        {/* Back button */}
        <button className="up-back" onClick={() => setSelectedUni(null)}>
          <i className='bx bx-arrow-back'></i>
          <span>Volver a universidades</span>
        </button>

        {/* Hero de universidad */}
        <div className="up-detail-hero">
          <div className="up-detail-hero__gradient"></div>
          <div className="up-detail-hero__content">
            <div className="up-detail-hero__logo">
              <img src={selectedUni.logo} alt={selectedUni.tag} />
            </div>
            <div className="up-detail-hero__info">
              <span className="up-eyebrow">
                {selectedUni.verified && <><i className='bx bxs-badge-check'></i> VERIFICADA</>}
                {!selectedUni.verified && 'PENDIENTE VERIFICACIÓN'}
              </span>
              <h1>{selectedUni.tag}</h1>
              <h2>{selectedUni.name}</h2>
              <div className="up-detail-hero__meta">
                <span><i className='bx bx-map'></i> {selectedUni.city}</span>
                <span><i className='bx bx-calendar'></i> Fundada en {selectedUni.founded}</span>
                <span><i className='bx bx-log-in-circle'></i> En Esportefy desde {selectedUni.joinedEsportefy}</span>
              </div>
            </div>
            <div className="up-detail-hero__actions">
              <div className="up-detail-hero__score">
                <span className="up-detail-hero__score-val">{selectedUni.points.toLocaleString()}</span>
                <small>PUNTOS</small>
              </div>
              <button
                className="up-btn up-btn--primary"
                type="button"
                onClick={() => openEnroll(selectedUni)}
                disabled={selectedUniLocked || submitLoading}
              >
                <i className='bx bx-right-top-arrow-circle'></i>{' '}
                {selectedUniMatchesCurrent && currentUniversityState === 'pending'
                  ? 'EN REVISIÓN'
                  : selectedUniMatchesCurrent && currentUniversityState === 'verified'
                    ? 'VERIFICADA'
                    : 'POSTULARME'}
              </button>
            </div>
          </div>
        </div>

        {renderUniversityStatusBanner()}

        {/* Grid de contenido */}
        <div className="up-detail-grid">

          {/* Biografía */}
          <div className="up-surface up-detail-bio">
            <div className="up-surface__head">
              <i className='bx bx-book-open'></i>
              <div>
                <span className="up-eyebrow">HISTORIA</span>
                <h3>Biografía</h3>
              </div>
            </div>
            <p className="up-detail-bio__text">{selectedUni.bio}</p>
            <div className="up-detail-bio__stats">
              <div className="up-detail-bio__stat">
                <span>{selectedUni.founded}</span>
                <small>Fundación</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.joinedEsportefy}</span>
                <small>En Esportefy</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.teams.length}</span>
                <small>Equipos</small>
              </div>
              <div className="up-detail-bio__stat">
                <span>{selectedUni.games.length}</span>
                <small>Juegos</small>
              </div>
            </div>
          </div>

          {/* Juegos que patrocina */}
          <div className="up-surface up-detail-games">
            <div className="up-surface__head">
              <i className='bx bx-joystick'></i>
              <div>
                <span className="up-eyebrow">COMPETICIÓN</span>
                <h3>Juegos que patrocina</h3>
              </div>
            </div>
            <div className="up-detail-games__grid">
              {selectedUni.games.map(g => (
                <div key={g} className="up-detail-games__item">
                  <i className='bx bxs-zap'></i>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lo que ofrece */}
          <div className="up-surface up-detail-offers">
            <div className="up-surface__head">
              <i className='bx bx-gift'></i>
              <div>
                <span className="up-eyebrow">BENEFICIOS</span>
                <h3>Qué ofrece</h3>
              </div>
            </div>
            <ul className="up-detail-offers__list">
              {selectedUni.offers.map((o, i) => (
                <li key={i}>
                  <i className='bx bx-check-circle'></i>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Equipos */}
          <div className="up-surface up-detail-teams">
            <div className="up-surface__head">
              <i className='bx bx-group'></i>
              <div>
                <span className="up-eyebrow">ROSTER</span>
                <h3>Equipos activos</h3>
              </div>
            </div>
            {selectedUni.teams.length === 0 ? (
              <div className="up-empty up-empty--sm">
                <i className='bx bx-user-plus'></i>
                <p>Aún no hay equipos registrados. ¡Sé el primero!</p>
              </div>
            ) : (
              <div className="up-detail-teams__list">
                {selectedUni.teams.map((t, i) => (
                  <div key={i} className="up-detail-teams__card">
                    <div className="up-detail-teams__card-icon">
                      <i className='bx bxs-zap'></i>
                    </div>
                    <div className="up-detail-teams__card-info">
                      <strong>{t.name}</strong>
                      <span>{t.game}</span>
                    </div>
                    <div className="up-detail-teams__card-meta">
                      <div className="up-detail-teams__card-badge">{t.rank}</div>
                      <small>{t.members} jugadores</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal de postulación (shared) */}
        {enrollModal && renderEnrollModal()}
      </div>
    );
  }

  /* ─── Render del modal de postulación ─── */
  function renderEnrollModal() {
    const uni = enrollUni;
    if (!uni) return null;
    return (
      <div className="up-overlay" onClick={() => setEnrollModal(false)}>
        <div className="up-modal" onClick={e => e.stopPropagation()}>
          <button className="up-modal__close" onClick={() => setEnrollModal(false)}>
            <i className='bx bx-x'></i>
          </button>

          {enrollStep === 1 && (
            <>
              <div className="up-modal__head">
                <h3>POSTULACIÓN</h3>
                <p>Confirma tu universidad</p>
              </div>
              <div className="up-modal__uni-preview">
                <img src={uni.logo} alt={uni.tag} />
                <div>
                  <strong>{uni.tag}</strong>
                  <span>{uni.name}</span>
                  <span className="up-modal__uni-city">{uni.city}</span>
                </div>
              </div>
              <button className="up-btn up-btn--primary up-btn--full" onClick={() => setEnrollStep(2)}>
                CONTINUAR <i className='bx bx-right-arrow-alt'></i>
              </button>
            </>
          )}

          {enrollStep === 2 && (
            <form onSubmit={handleSubmitEnroll}>
              <div className="up-modal__form-top">
                <button type="button" className="up-btn up-btn--ghost" onClick={() => setEnrollStep(1)}>
                  <i className='bx bx-left-arrow-alt'></i> Volver
                </button>
                <div className="up-modal__badge">
                  <img src={uni.logo} alt="" />
                  <span>{uni.tag}</span>
                </div>
              </div>
              <h3 className="up-modal__form-title">DATOS DE ESTUDIANTE</h3>
              <div className="up-field">
                <label>Matrícula / ID Estudiantil</label>
                <input
                  className={fieldErrors.matricula ? 'up-field__input--error' : ''}
                  type="text"
                  placeholder="Ej: 2023-0145"
                  required
                  value={formData.matricula}
                  onChange={e => {
                    setFormData({ ...formData, matricula: e.target.value });
                    if (fieldErrors.matricula) setFieldErrors((prev) => ({ ...prev, matricula: '' }));
                  }}
                />
                {fieldErrors.matricula && <small className="up-field__error">{fieldErrors.matricula}</small>}
              </div>
              <div className="up-field">
                <label>Correo institucional</label>
                <input
                  className={fieldErrors.institutionalEmail ? 'up-field__input--error' : ''}
                  type="email"
                  placeholder="tu-correo@universidad.edu"
                  required
                  value={formData.institutionalEmail}
                  onChange={e => {
                    setFormData({ ...formData, institutionalEmail: e.target.value });
                    if (fieldErrors.institutionalEmail) setFieldErrors((prev) => ({ ...prev, institutionalEmail: '' }));
                  }}
                />
                {fieldErrors.institutionalEmail && <small className="up-field__error">{fieldErrors.institutionalEmail}</small>}
              </div>
              <div className="up-field">
                <label>Carrera</label>
                <input
                  className={fieldErrors.carrera ? 'up-field__input--error' : ''}
                  type="text"
                  placeholder="Ingeniería, Diseño, etc."
                  required
                  value={formData.carrera}
                  onChange={e => {
                    setFormData({ ...formData, carrera: e.target.value });
                    if (fieldErrors.carrera) setFieldErrors((prev) => ({ ...prev, carrera: '' }));
                  }}
                />
                {fieldErrors.carrera && <small className="up-field__error">{fieldErrors.carrera}</small>}
              </div>
              <div className="up-field">
                <label>Ciudad del campus</label>
                <select
                  className={fieldErrors.campus ? 'up-field__input--error' : ''}
                  required
                  value={formData.campus}
                  onChange={e => {
                    setFormData({ ...formData, campus: e.target.value });
                    if (fieldErrors.campus) setFieldErrors((prev) => ({ ...prev, campus: '' }));
                  }}
                >
                  <option value="" disabled>Selecciona</option>
                  {campusCities.map((c, i) => <option key={i} value={c}>{c}</option>)}
                  <option value="otro">Otro</option>
                </select>
                {formData.campus === 'otro' && (
                  <input
                    className={fieldErrors.campus ? 'up-field__input--error' : ''}
                    type="text"
                    placeholder="Escribe el campus"
                    required
                    value={formData.customCampus}
                    onChange={e => {
                      setFormData({ ...formData, customCampus: e.target.value });
                      if (fieldErrors.campus) setFieldErrors((prev) => ({ ...prev, campus: '' }));
                    }}
                  />
                )}
                {fieldErrors.campus && <small className="up-field__error">{fieldErrors.campus}</small>}
              </div>
              <div className="up-field">
                <label>Nivel académico</label>
                <select
                  className={fieldErrors.nivel ? 'up-field__input--error' : ''}
                  required
                  value={formData.nivel}
                  onChange={e => {
                    setFormData({ ...formData, nivel: e.target.value });
                    if (fieldErrors.nivel) setFieldErrors((prev) => ({ ...prev, nivel: '' }));
                  }}
                >
                  <option value="" disabled>Seleccionar</option>
                  <option value="1">1er Año (Freshman)</option>
                  <option value="2">2do Año (Sophomore)</option>
                  <option value="3">3er Año (Junior)</option>
                  <option value="4">4to Año+ (Senior)</option>
                  <option value="egresado">Egresado</option>
                  <option value="maestria">Postgrado / Maestría</option>
                </select>
                {fieldErrors.nivel && <small className="up-field__error">{fieldErrors.nivel}</small>}
              </div>
              <button type="submit" className="up-btn up-btn--primary up-btn--full" disabled={submitLoading}>
                {submitLoading ? 'ENVIANDO...' : 'CONFIRMAR POSTULACIÓN'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  /* ─── VISTA PRINCIPAL (Listado) ─── */
  return (
    <div className="up">

      {/* ═══ HEADER ═══ */}
      <header className="up-header">
        <div className="up-header__left">
          <span className="up-eyebrow"><i className='bx bxs-graduation'></i> UNIVERSITY SERIES</span>
          <h1 className="up-header__title">
            Universidades <span className="up-glow-text">Partner</span>
          </h1>
          <p className="up-header__desc">
            Instituciones que impulsan los esports universitarios. Compite, consigue becas y forma parte del ecosistema competitivo más grande de las Américas.
          </p>
        </div>
        <div className="up-header__right">
          <div className="up-header__stats">
            <div className="up-header__stat">
              <span>{stats.total}</span>
              <small>UNIVERSIDADES</small>
            </div>
            <div className="up-header__stat-sep"></div>
            <div className="up-header__stat">
              <span>{stats.verified}</span>
              <small>VERIFICADAS</small>
            </div>
            <div className="up-header__stat-sep"></div>
            <div className="up-header__stat">
              <span>{stats.teams}</span>
              <small>EQUIPOS</small>
            </div>
          </div>
        </div>
      </header>

      {renderUniversityStatusBanner()}

      {/* ═══ REGIONES ═══ */}
      <div className="up-regions">
        {REGIONS.map(r => (
          <button
            key={r.id}
            className={`up-regions__btn ${activeRegion === r.id ? 'up-regions__btn--active' : ''}`}
            onClick={() => { setActiveRegion(r.id); setSearchQuery(''); }}
          >
            <span className="up-regions__flag">{r.flag}</span>
            <span className="up-regions__name">{r.short}</span>
            <span className="up-regions__count">{ALL_UNIVERSITIES.filter(u => u.region === r.id).length}</span>
          </button>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <div className="up-tabs">
        <button className={`up-tabs__btn ${activeTab === 'universidades' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('universidades')}>
          <i className='bx bx-buildings'></i> Universidades
        </button>
        <button className={`up-tabs__btn ${activeTab === 'torneos' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('torneos')}>
          <i className='bx bx-trophy'></i> Torneos
        </button>
        <button className={`up-tabs__btn ${activeTab === 'rankings' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('rankings')}>
          <i className='bx bx-bar-chart-alt-2'></i> Rankings
        </button>
        {currentUser?.isAdmin && (
          <button className={`up-tabs__btn ${activeTab === 'admin' ? 'up-tabs__btn--active' : ''}`} onClick={() => setActiveTab('admin')}>
            <i className='bx bx-check-shield'></i> Validaciones
          </button>
        )}
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="up-content">

        {/* TAB: UNIVERSIDADES (cards clicables) */}
        {activeTab === 'universidades' && (
          <>
            <div className="up-search">
              <i className='bx bx-search'></i>
              <input
                type="text"
                placeholder={`Buscar en ${currentRegion.name}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="up-search__clear" onClick={() => setSearchQuery('')}>
                  <i className='bx bx-x'></i>
                </button>
              )}
            </div>
            <div className="up-uni-grid">
              {regionUnis.length === 0 ? (
                <div className="up-empty">
                  <i className='bx bx-search-alt-2'></i>
                  <h3>Sin resultados</h3>
                  <p>No se encontraron universidades.</p>
                </div>
              ) : (
                regionUnis.map(uni => (
                  <div key={uni.id} className="up-uni-card" onClick={() => setSelectedUni(uni)}>
                    <div className="up-uni-card__top">
                      <div className="up-uni-card__logo">
                        <img src={uni.logo} alt={uni.tag} />
                      </div>
                      <div className="up-uni-card__score">
                        <span>{uni.points.toLocaleString()}</span>
                        <small>PTS</small>
                      </div>
                    </div>
                    <div className="up-uni-card__body">
                      <div className="up-uni-card__name-row">
                        <h4>{uni.tag}</h4>
                        {uni.verified && <i className='bx bxs-badge-check up-verified'></i>}
                      </div>
                      <p className="up-uni-card__fullname">{uni.name}</p>
                      <span className="up-uni-card__city"><i className='bx bx-map'></i> {uni.city}</span>
                    </div>
                    <div className="up-uni-card__footer">
                      <div className="up-uni-card__games">
                        {uni.games.slice(0, 3).map(g => (
                          <span key={g} className="up-tag">{g}</span>
                        ))}
                        {uni.games.length > 3 && <span className="up-tag up-tag--more">+{uni.games.length - 3}</span>}
                      </div>
                      <div className="up-uni-card__teams-count">
                        <i className='bx bx-group'></i> {uni.teams.length}
                      </div>
                    </div>
                    <div className="up-uni-card__hover-hint">
                      <span>Ver detalles</span> <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* TAB: TORNEOS */}
        {activeTab === 'torneos' && (
          <div className="up-tournaments">
            {regionTournaments.length === 0 ? (
              <div className="up-empty">
                <i className='bx bx-trophy'></i>
                <h3>Próximamente</h3>
                <p>Los torneos de {currentRegion.name} se anunciarán pronto.</p>
              </div>
            ) : (
              regionTournaments.map(t => (
                <div key={t.id} className={`up-tournament-card up-tournament-card--${t.color}`}>
                  <div className={`up-tournament-card__status up-tournament-card__status--${t.status}`}>
                    {t.status === 'live' && <span className="up-pulse"></span>}
                    {STATUS_LABELS[t.status]}
                  </div>
                  <div className="up-tournament-card__body">
                    <div className="up-tournament-card__icon">
                      <i className='bx bxs-zap'></i>
                    </div>
                    <div className="up-tournament-card__info">
                      <span className="up-eyebrow">{t.game}</span>
                      <h4>{t.title}</h4>
                      <div className="up-tournament-card__meta">
                        <span><i className='bx bx-calendar-event'></i> {t.date}</span>
                        <span><i className='bx bx-group'></i> {t.format}</span>
                      </div>
                    </div>
                  </div>
                  <div className="up-tournament-card__right">
                    <div className="up-tournament-card__prize">
                      <small>PRIZE POOL</small>
                      <strong>{t.prize}</strong>
                    </div>
                    <button className="up-btn up-btn--icon">
                      <i className='bx bx-chevron-right'></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: RANKINGS */}
        {activeTab === 'rankings' && (
          <div className="up-rankings">
            <div className="up-rankings__head">
              <span className="up-rankings__col up-rankings__col--pos">#</span>
              <span className="up-rankings__col up-rankings__col--uni">UNIVERSIDAD</span>
              <span className="up-rankings__col up-rankings__col--city">CIUDAD</span>
              <span className="up-rankings__col up-rankings__col--teams">EQUIPOS</span>
              <span className="up-rankings__col up-rankings__col--pts">PUNTOS</span>
            </div>
            {regionUnis.map((uni, idx) => (
              <div key={uni.id} className={`up-rankings__row ${idx < 3 ? `up-rankings__row--top${idx + 1}` : ''}`} onClick={() => setSelectedUni(uni)}>
                <span className={`up-rankings__pos up-rankings__pos--${idx + 1}`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </span>
                <div className="up-rankings__uni">
                  <div className="up-rankings__logo">
                    <img src={uni.logo} alt={uni.tag} />
                  </div>
                  <div className="up-rankings__uni-info">
                    <div className="up-rankings__uni-name">
                      <strong>{uni.tag}</strong>
                      {uni.verified && <i className='bx bxs-badge-check up-verified'></i>}
                    </div>
                    <small>{uni.name}</small>
                  </div>
                </div>
                <span className="up-rankings__city">{uni.city}</span>
                <span className="up-rankings__teams">{uni.teams.length}</span>
                <div className="up-rankings__pts">
                  <span>{uni.points.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'admin' && currentUser?.isAdmin && (
          <div className="up-admin">
            <div className="up-admin__toolbar">
              <div>
                <span className="up-eyebrow">ADMIN</span>
                <h3>Validación universitaria</h3>
              </div>
              <div className="up-admin__filters">
                <select
                  value={adminFilters.status}
                  onChange={(e) => setAdminFilters((prev) => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pending">Pendientes</option>
                  <option value="approved">Aprobadas</option>
                  <option value="rejected">Rechazadas</option>
                  <option value="">Todas</option>
                </select>
                <select
                  value={adminFilters.region}
                  onChange={(e) => setAdminFilters((prev) => ({ ...prev, region: e.target.value }))}
                >
                  <option value="">Todas las regiones</option>
                  {REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {adminLoading ? (
              <div className="up-empty">
                <i className='bx bx-loader-alt'></i>
                <h3>Cargando cola</h3>
                <p>Obteniendo postulaciones universitarias...</p>
              </div>
            ) : adminApplications.length === 0 ? (
              <div className="up-empty">
                <i className='bx bx-check-shield'></i>
                <h3>Sin postulaciones</h3>
                <p>No hay postulaciones para los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="up-admin__grid">
                {adminApplications.map((application) => {
                  const isReviewing = reviewLoadingId === application._id;
                  const isRejected = application.status === 'rejected';
                  const isApproved = application.status === 'approved';
                  return (
                    <div key={application._id} className={`up-admin-card up-admin-card--${application.status}`}>
                      <div className="up-admin-card__top">
                        <div>
                          <span className="up-eyebrow">{application.universityTag}</span>
                          <h4>{application.universityName}</h4>
                        </div>
                        <span className={`up-admin-card__status up-admin-card__status--${application.status}`}>
                          {application.status}
                        </span>
                      </div>

                      <div className="up-admin-card__user">
                        <strong>{application.user?.fullName || 'Usuario'}</strong>
                        <span>@{application.user?.username || 'sin-usuario'}</span>
                        <span>{application.user?.email || 'sin correo'}</span>
                      </div>

                      <div className="up-admin-card__meta">
                        <span><i className='bx bx-id-card'></i>{application.studentId}</span>
                        <span><i className='bx bx-book'></i>{application.program}</span>
                        <span><i className='bx bx-buildings'></i>{application.campus}</span>
                        <span><i className='bx bx-layer'></i>{application.academicLevel}</span>
                        <span><i className='bx bx-envelope'></i>{application.institutionalEmail}</span>
                        <span><i className='bx bx-world'></i>{application.region}</span>
                        <span><i className='bx bx-shield'></i>{application.verificationSource}</span>
                      </div>

                      {isRejected && application.rejectReason && (
                        <div className="up-admin-card__reason">
                          <strong>Motivo previo</strong>
                          <p>{application.rejectReason}</p>
                        </div>
                      )}

                      {!isApproved && (
                        <>
                          <textarea
                            className="up-admin-card__textarea"
                            placeholder="Motivo de rechazo (requerido solo si rechazas)"
                            value={rejectDrafts[application._id] || ''}
                            onChange={(e) => setRejectDrafts((prev) => ({ ...prev, [application._id]: e.target.value }))}
                          />
                          <div className="up-admin-card__actions">
                            <button
                              type="button"
                              className="up-btn up-btn--primary"
                              disabled={isReviewing}
                              onClick={() => handleReviewApplication(application, 'approved')}
                            >
                              {isReviewing ? 'PROCESANDO...' : 'APROBAR'}
                            </button>
                            <button
                              type="button"
                              className="up-btn up-btn--ghost up-btn--danger"
                              disabled={isReviewing}
                              onClick={() => handleReviewApplication(application, 'rejected')}
                            >
                              {isReviewing ? 'PROCESANDO...' : 'RECHAZAR'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ MODAL POSTULACIÓN ═══ */}
      {enrollModal && renderEnrollModal()}
    </div>
  );
};

export default UniversityPage;
