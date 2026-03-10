export const ESPORTS_ORGANISMS = {
  iesf: {
    slug: 'iesf',
    shortName: 'IESF',
    fullName: 'International Esports Federation',
    founded: 2008,
    headquarters: 'Busan, Corea del Sur',
    officialSite: 'https://iesf.org',
    logo: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=300&auto=format&fit=crop',
    whatIs:
      'La IESF es una federacion internacional que impulsa la estandarizacion del ecosistema competitivo y organiza campeonatos mundiales con representacion por paises.',
    objective:
      'Promover la integridad competitiva, el desarrollo federado y la participacion sostenible de atletas y selecciones nacionales.',
    roleInAmerica:
      'En America, la IESF ha fortalecido procesos de clasificacion regional, visibilidad de selecciones y profesionalizacion institucional de federaciones emergentes.',
    structure: {
      affiliates: 'Federaciones nacionales afiliadas en mas de 100 paises',
      competitionType: 'Competiciones por naciones y circuitos de clasificatorias regionales',
      divisions: 'Categorias abiertas con participacion masculina y femenina segun disciplina'
    },
    tournaments: [
      { year: 2024, city: 'Riyadh', games: 'Valorant, League of Legends, MLBB', champion: 'Kazajistan (Valorant)', countries: 100 },
      { year: 2023, city: 'Iasi', games: 'Valorant, League of Legends, MLBB', champion: 'Rumania (Valorant)', countries: 110 },
      { year: 2022, city: 'Bali', games: 'League of Legends, MLBB', champion: 'Indonesia (selecciones destacadas)', countries: 100 }
    ],
    impactAmerica: {
      participation: 'Mayor presencia de selecciones de LATAM y Caribe en clasificatorias oficiales.',
      bestResults: 'Top finishes recurrentes en fighting games, eFootball y titulos tacticos.',
      qualifiers: 'Clasificatorias regionales con cupos directos al mundial por disciplina.'
    },
    related: ['geg', 'pan-american-esports', 'game-changers']
  },
  gef: {
    slug: 'gef',
    shortName: 'GEF',
    fullName: 'Global Esports Federation',
    founded: 2019,
    headquarters: 'Singapur',
    officialSite: 'https://globalesports.org',
    logo: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=300&auto=format&fit=crop',
    whatIs:
      'La GEF es una organizacion internacional centrada en conectar ecosistemas nacionales y acelerar el crecimiento institucional del esports.',
    objective:
      'Unificar actores, impulsar estandares de gobernanza y ampliar el acceso competitivo global.',
    roleInAmerica:
      'Ha impulsado marcos de colaboracion para eventos continentales, alianzas y programas de desarrollo.',
    structure: {
      affiliates: 'Red global de federaciones y asociaciones colaboradoras',
      competitionType: 'Eventos multideporte y plataformas de cooperacion internacional',
      divisions: 'Programas abiertos con enfoque inclusivo por disciplina'
    },
    tournaments: [
      { year: 2023, city: 'Riyadh', games: 'League of Legends, Valorant, MLBB', champion: 'Delegaciones multiregion', countries: 55 },
      { year: 2022, city: 'Istanbul', games: 'League of Legends, MLBB', champion: 'Representaciones nacionales destacadas', countries: 60 },
      { year: 2021, city: 'Singapore (virtual/hibrido)', games: 'Titulos multigame', champion: 'Evento inaugural consolidado', countries: 50 }
    ],
    impactAmerica: {
      participation: 'Mayor integracion de actores latinoamericanos en foros y eventos globales.',
      bestResults: 'Crecimiento sostenido en asistencia, delegaciones y alianzas regionales.',
      qualifiers: 'Iniciativas de clasificatorias y programas de desarrollo para nuevas federaciones.'
    },
    related: ['iesf', 'geg', 'pan-american-esports']
  },
  geg: {
    slug: 'geg',
    shortName: 'GEG',
    fullName: 'Global Esports Games',
    founded: 2021,
    headquarters: 'Circuito internacional de sedes',
    officialSite: 'https://globalesports.org/events/global-esports-games',
    logo: 'https://images.unsplash.com/photo-1542751371-6533d19f9b94?q=80&w=300&auto=format&fit=crop',
    whatIs:
      'GEG es la competencia internacional insignia asociada a la GEF, con formato por naciones y enfoque multijuego.',
    objective:
      'Consolidar un evento internacional anual que visibilice el alto rendimiento competitivo por seleccion nacional.',
    roleInAmerica:
      'Ofrece a delegaciones americanas una plataforma de alto nivel para medirse frente a otras regiones.',
    structure: {
      affiliates: 'Delegaciones y federaciones participantes invitadas',
      competitionType: 'Evento internacional por naciones',
      divisions: 'Disciplinas principales con formatos abiertos y mixtos segun reglamento'
    },
    tournaments: [
      { year: 2023, city: 'Riyadh', games: 'League of Legends, Valorant, MLBB', champion: 'Campeones por disciplina', countries: 50 },
      { year: 2022, city: 'Istanbul', games: 'League of Legends, MLBB', champion: 'Campeones por disciplina', countries: 60 },
      { year: 2021, city: 'Singapore', games: 'Titulos multigame', champion: 'Campeones por disciplina', countries: 40 }
    ],
    impactAmerica: {
      participation: 'Delegaciones americanas con presencia regular en cuadros principales.',
      bestResults: 'Rendimientos consistentes en juegos tacticos, football sim y mobile.',
      qualifiers: 'Rutas de clasificacion y seleccion nacional definidas por cada federacion.'
    },
    related: ['gef', 'iesf', 'game-changers']
  },
  fifae: {
    slug: 'fifae',
    shortName: 'FIFAe',
    fullName: 'FIFAe (ecosistema oficial de esports de FIFA)',
    founded: 2019,
    headquarters: 'Zurich, Suiza',
    officialSite: 'https://www.fifa.gg',
    logo: 'https://images.unsplash.com/photo-1522778526097-ce0a22ceb253?q=80&w=300&auto=format&fit=crop',
    whatIs:
      'FIFAe es la plataforma oficial de FIFA para competencias de football esports, con circuitos y mundiales en distintas disciplinas.',
    objective:
      'Expandir la escena competitiva de football esports con estandares profesionales y alcance global.',
    roleInAmerica:
      'Las regiones americanas participan activamente en clasificatorias y fases finales de torneos oficiales.',
    structure: {
      affiliates: 'Asociaciones miembro y partners competitivos',
      competitionType: 'Mundiales y circuitos oficiales de football esports',
      divisions: 'Competiciones por titulo y formato (individual/equipos)'
    },
    tournaments: [
      { year: 2024, city: 'Riyadh', games: 'Valorant y MLBB', champion: 'Campeones por titulo', countries: 20 },
      { year: 2023, city: 'Riyadh', games: 'League of Legends y Valorant', champion: 'Campeones por titulo', countries: 18 },
      { year: 2022, city: 'Copenhague', games: 'FIFAe Nations y Clubs', champion: 'Campeones por categoria', countries: 24 }
    ],
    impactAmerica: {
      participation: 'Seleccionados americanos con clasificaciones recurrentes al mundial.',
      bestResults: 'Resultados competitivos fuertes en eventos de football sim.',
      qualifiers: 'Clasificatorias regionales por federaciones y asociaciones participantes.'
    },
    related: ['iesf', 'geg', 'pan-american-esports']
  }
};

export const ORGANISM_PATHS = {
  IESF: '/organismos/iesf',
  GEF: '/organismos/gef',
  GEG: '/organismos/geg',
  'Global Esports Games': '/organismos/geg',
  FIFAe: '/organismos/fifae'
};
