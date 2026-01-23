// Importamos los banners desde tu nueva carpeta assets/banner
import BannerLol from '../assets/banner/BannerLol.jpg';
import BannerValo from '../assets/banner/BannerValorant.jpg';
import BannerDota from '../assets/banner/BannerDota.jpg';
import BannerMlbb from '../assets/banner/BannerMlbb.jpg';
import BannerWildRift from '../assets/banner/BannerWild.jpg';
import BannerFifa from '../assets/banner/BannerFifa.jpg';
import BannerFortnite from '../assets/banner/BannerFornite.jpg';
import BannerHok from '../assets/banner/BannerHok.jpg';
import BannerHearthstone from '../assets/banner/BannerHearthstone.jpg';
import BannerFreefire from '../assets/banner/BannerFreefire.jpg';
import BannerOverwatch from '../assets/banner/BannerOverwatch.jpg';
import BannerPubg from '../assets/banner/BannerPubg.jpg';
import BannerRainbowSix from '../assets/banner/BannerRainbowSix.jpg';
import BannerRocketLeague from '../assets/banner/BannerRocketLeague.jpg';   
import BannerSmash from '../assets/banner/BannerSmash.jpg';
import BannerCsgo from '../assets/banner/BannerCsgo.jpg';   
import BannerApex from '../assets/banner/BannerApex.jpg';
import BannerCod from '../assets/banner/BannerCod.jpg';   
import BannerTft from '../assets/banner/BannerTft.jpg';
import BannerClashRoyale from '../assets/banner/BannerClash.jpg';
import BannerStarCraft from '../assets/banner/BannerStarCraft.jpg';
import BannerStreetFighter6 from '../assets/banner/BannerSf6.jpg';
import BannerTekken8 from '../assets/banner/BannerTekken8.jpg'; 
import BannerRuneterra from '../assets/banner/BannerLoR.jpg';
import BannerNba2k14 from '../assets/banner/BannerNba2k14.jpg';


export const gamesDetailedData = {
lol: {
        id: 'lol',
        name: 'League of Legends',
        developer: 'Riot Games',
        history: 'League of Legends es un juego de estrategia por equipos en el que dos equipos de cinco campeones se enfrentan para ver quién destruye antes la base del otro. Elige entre un plantel de más de 140 campeones para realizar jugadas épicas, asegurar asesinatos y destruir torretas mientras avanzas hacia la victoria.',
        tags: ['MOBA', 'PC', 'Competitivo', 'E-Sports', 'Estrategia'],
        
        // Estos arrays crecerán solos cuando se conecte la DB
        activeTournaments: [
            { title: 'Worlds 2024', prize: 'Copa del Invocador', date: 'Octubre 2024' },
            { title: 'MSI Invitational', prize: '$250,000 USD', date: 'Mayo 2024' }
        ],
        organizers: [
            { name: 'LVP', motto: 'Liga de Videojuegos Profesional', region: 'España/Latam' },
            { name: 'Riot Games Official', motto: 'Desarrollador y Organizador Global', region: 'Global' },
            { name: 'Tu Nombre Aquí', motto: 'Nueva Organizadora Independiente', region: 'Dominicana' } // Ejemplo de lo que pides
        ],
        sponsors: [
            { name: 'Red Bull' },
            { name: 'Mastercard' },
            { name: 'Alienware' }
        ],
        userCommunities: [
            { name: 'Comunidad Oficial', members: '1M+' },
            { name: 'LoL Dominicano', members: '15k' },
            { name: 'Summoners Rift LATAM', members: '500k' }
        ]
},     
valorant: {
    id: 'valorant',
    name: 'VALORANT',
    banner: BannerValo,
    developer: 'Riot Games',
    history: 'Precisión táctica y habilidades sobrenaturales. Valorant ha redefinido el shooter táctico combinando un gunplay letal con agentes únicos. En este campo de batalla, la creatividad es tan importante como la puntería; cada disparo cuenta y cada agente es una pieza clave para la victoria en un ecosistema donde la estrategia individual y el trabajo en equipo dictan el éxito.',
    tags: ['FPS', 'Táctico', 'Habilidades', 'PC'],

    // Organizadores (Sidebar Derecha)
    organizers: [
        { name: 'VCT', motto: 'El pináculo competitivo: Champions Tour' },
        { name: 'Riot Games', motto: 'Innovando en la experiencia competitiva global' },
        { name: 'LVP', motto: 'La liga referente para la región hispana' }
    ],

    // Patrocinadores (Columna Izquierda - Estilo Tabla)
    sponsors: [
        { name: 'Prime Gaming' },
        { name: 'ZOWIE' },
        { name: 'Red Bull' },
        { name: 'Secretlab' }
    ],

    // Comunidades (Sidebar Derecha)
    userCommunities: [
        { name: 'Valo Tactics', members: '95k' },
        { name: 'Radiant Hub', members: '60k' },
        { name: 'Agentes Latam', members: '45k' },
        { name: 'Protocolo Radiant', members: '12k' }
    ],

    // Torneos
    tournaments: [
        { title: 'Masters Challenge', prize: '$3,500' },
        { title: 'Valorant Open Tour', prize: '$5,000' }
    ]
},
dota2: {
    id: 'dota2',
    name: 'DOTA 2',
    banner: BannerDota,
    developer: 'Valve',
    history: 'La profundidad estratégica definitiva. Dota 2 es el santuario de los veteranos, donde cada partida es una batalla de ingenio y reflejos. Como sucesor del mod que definió el género, Valve ha elevado la complejidad a un arte competitivo, manteniendo un ecosistema donde la estrategia, el control de mapa y el trabajo en equipo deciden el destino de los Ancestros.',
    tags: ['MOBA', 'Hardcore', 'PC', 'E-Sports'],
    
    // Organizadores (Sidebar Derecha)
    organizers: [
        { name: 'PGL', motto: 'Líderes mundiales en producción de eSports' },
        { name: 'Valve', motto: 'Creadores del ecosistema competitivo original' },
        { name: 'ESL One', motto: 'Donde las leyendas de Dota cobran vida' }
    ],
    
    // Patrocinadores (Columna Izquierda - Estilo Tabla)
    sponsors: [
        { name: 'SteelSeries' },
        { name: 'NVIDIA' },
        { name: 'Monster Energy' },
        { name: 'Secretlab' }
    ],
    
    // Comunidades (Sidebar Derecha)
    userCommunities: [
        { name: 'Dota Pro Latam', members: '125k' },
        { name: 'Ancient Guild', members: '42k' },
        { name: 'Turbo Masters', members: '89k' },
        { name: 'The Ancient Apparition Society', members: '15k' }
    ],
    
    // Torneos (Para secciones futuras)
    tournaments: [
        { title: 'The Minor Open', prize: '$10,000' },
        { title: 'The International Qualifiers', prize: 'Invitación Pro' }
    ]
},
mlbb: {
    id: 'mlbb',
    name: 'MOBILE LEGENDS',
    banner: BannerMlbb, // Asegúrate de que apunte a la imagen de la reina dorada
    developer: 'Moonton',
    history: 'La batalla épica por la Tierra del Amanecer en la palma de tu mano. Mobile Legends: Bang Bang ha redefinido el género MOBA para dispositivos móviles, combinando una acción frenética con una profundidad estratégica asombrosa. Con un ecosistema social vibrante y una escena competitiva que mueve millones, es el santuario donde los héroes ascienden a la leyenda en enfrentamientos de 5 contra 5 llenos de adrenalina.',
    tags: ['MOBA Móvil', 'Social', 'Acción', 'E-Sports'],

    // Organizadores (Sidebar Derecha)
    organizers: [
        { name: 'MPL', motto: 'La liga profesional más grande del sudeste asiático' },
        { name: 'Moonton', motto: 'Pioneros en el entretenimiento competitivo móvil' },
        { name: 'M5 World Championship', motto: 'Donde las regiones luchan por la gloria global' }
    ],

    // Patrocinadores (Columna Izquierda - Estilo Tabla)
    sponsors: [
        { name: 'Samsung' },
        { name: 'TikTok' },
        { name: 'Red Bull' },
        { name: 'Grab' }
    ],

    // Comunidades (Sidebar Derecha)
    userCommunities: [
        { name: 'MLBB Squads Latam', members: '150k' },
        { name: 'Legendary Hub', members: '85k' },
        { name: 'Mobile Pros Global', members: '210k' },
        { name: 'Bang Bang Academy', members: '30k' }
    ],

    // Torneos
    tournaments: [
        { title: 'Squad Clash', prize: '$2,000' },
        { title: 'Invitacional Regional', prize: '$5,000' }
    ]
},
wildrift: {
    id: 'wildrift',
    name: 'WILD RIFT',
    banner: BannerWildRift, // Asegúrate de que apunte a la imagen del lobo azul (image_343a05.png)
    developer: 'Riot Games',
    history: 'La experiencia definitiva de League of Legends reconstruida desde cero para la nueva generación de jugadores móviles. Wild Rift combina la profundidad táctica de los campeones de Runaterra con un control de doble stick fluido y frenético. Domina la grieta con precisión gélida en una atmósfera rediseñada donde la magia arcana y la estrategia competitiva se encuentran en la palma de tu mano.',
    tags: ['MOBA', 'Mobile', 'Competitivo', 'Riot Games'],

    // Organizadores (Sidebar Derecha)
    organizers: [
        { name: 'Riot Games', motto: 'Redefiniendo el futuro de los eSports móviles' },
        { name: 'Icon Series', motto: 'Donde las leyendas regionales emergen' },
        { name: 'WBR', motto: 'La élite de Wild Rift en Latinoamérica' }
    ],

    // Patrocinadores (Columna Izquierda - Estilo Tabla)
    sponsors: [
        { name: 'Coca-Cola' },
        { name: 'OPPO' },
        { name: 'Prime Gaming' },
        { name: 'Mastercard' }
    ],

    // Comunidades (Sidebar Derecha)
    userCommunities: [
        { name: 'Wild Rift Latam', members: '140k' },
        { name: 'Radiant Protocol', members: '25k' },
        { name: 'Rift Masters', members: '67k' },
        { name: 'Support Mains Society', members: '18k' }
    ],

    // Torneos
    tournaments: [
        { title: 'The Horizon Cup', prize: '$500,000' },
        { title: 'Wild Circuit', prize: '$5,000' }
    ]
},
fifa: {
        id: 'fifa', name: 'FC 25 (FIFA)', banner: BannerFifa,
        history: 'El simulador de fútbol más icónico del mundo. Domina el campo con un realismo sin precedentes y lleva a tu club a la gloria en la escena competitiva global.',
        tags: ['Deportes', 'Simulación', 'Fútbol'],
        organizers: [{ name: 'EA Sports', motto: 'It\'s in the game' }],
        sponsors: [{ name: 'Adidas' }, { name: 'PlayStation' }],
        userCommunities: [{ name: 'FIFA Ultimate Community', members: '200k' }]
},
fortnite: {
        id: 'fortnite', name: 'FORTNITE', banner: BannerFortnite,
        history: 'Más que un Battle Royale: un fenómeno cultural. Construye, lucha y sobrevive en un mapa en constante evolución lleno de eventos épicos.',
        tags: ['Battle Royale', 'Construcción', 'Multiplataforma'],
        organizers: [{ name: 'Epic Games', motto: 'Competencia para todos' }],
        sponsors: [{ name: 'Intel' }, { name: 'Logitech' }],
        userCommunities: [{ name: 'Fortnite Latam Pros', members: '150k' }]
},
hok: {
        id: 'hok', name: 'HONOR OF KINGS', banner: BannerHok,
        history: 'El MOBA móvil más jugado del planeta llega al mercado global con héroes legendarios y una profundidad estratégica inigualable.',
        tags: ['MOBA', 'Móvil', 'E-Sports'],
        organizers: [{ name: 'Level Infinite', motto: 'Estrategia sin límites' }],
        sponsors: [{ name: 'Honor' }, { name: 'Qualcomm' }],
        userCommunities: [{ name: 'HoK Global Hub', members: '300k' }]
},
hearthstone: {
        id: 'hearthstone', name: 'HEARTHSTONE', banner: BannerHearthstone,
        history: 'Engañosamente simple e increíblemente divertido. El juego de cartas estratégico donde la astucia es tu mejor arma en la taberna.',
        tags: ['Cartas', 'Estrategia', 'Warcraft'],
        organizers: [{ name: 'Blizzard', motto: 'Cada carta cuenta' }],
        sponsors: [{ name: 'SteelSeries' }],
        userCommunities: [{ name: 'Taberna Pro', members: '45k' }]
},
freefire: {
        id: 'freefire', name: 'FREE FIRE', banner: BannerFreefire,
        history: 'Supervivencia al límite en partidas rápidas de 10 minutos. Sé el último hombre en pie en el Battle Royale más popular para móviles.',
        tags: ['Battle Royale', 'Móvil', 'Acción'],
        organizers: [{ name: 'Garena', motto: 'Booyah!' }],
        sponsors: [{ name: 'Free Fire World' }, { name: 'KFC' }],
        userCommunities: [{ name: 'Garena Masters', members: '500k' }]
},
overwatch: {
        id: 'overwatch', name: 'OVERWATCH 2', banner: BannerOverwatch,
        history: 'Un shooter por equipos vibrante donde cada héroe trae una habilidad única al campo de batalla. El mundo siempre necesita héroes.',
        tags: ['Hero Shooter', 'Equipo', 'FPS'],
        organizers: [{ name: 'Overwatch League', motto: 'La unión hace la fuerza' }],
        sponsors: [{ name: 'HP Omen' }, { name: 'Coca-Cola' }],
        userCommunities: [{ name: 'Heroes Hub', members: '90k' }]
},
pubg: {
        id: 'pubg', name: 'PUBG BATTLEGROUNDS', banner: BannerPubg,
        history: 'El Battle Royale original. Sobrevive al caos en mapas realistas donde la posición y el equipamiento lo son todo.',
        tags: ['Realismo', 'Battle Royale', 'Táctico'],
        organizers: [{ name: 'Krafton', motto: 'Winner Winner Chicken Dinner' }],
        sponsors: [{ name: 'AORUS' }],
        userCommunities: [{ name: 'Survivor Squads', members: '110k' }]
},
rainbowsix: {
        id: 'rainbowsix', name: 'RAINBOW SIX SIEGE', banner: BannerRainbowSix,
        history: 'Asedio y defensa táctica extrema. En Siege, la destrucción del entorno es tu mayor aliada para sorprender al enemigo.',
        tags: ['Táctico', 'Destrucción', 'FPS'],
        organizers: [{ name: 'Ubisoft', motto: 'Operación Éxito' }],
        sponsors: [{ name: 'Corsair' }],
        userCommunities: [{ name: 'Siege Tactics Latam', members: '55k' }]
},
rocketleague: {
        id: 'rocketleague', name: 'ROCKET LEAGUE', banner: BannerRocketLeague,
        history: 'Fútbol con autos propulsados por cohetes. Un híbrido de alta potencia que desafía las leyes de la física.',
        tags: ['Deportes', 'Autos', 'Física'],
        organizers: [{ name: 'Psyonix', motto: 'Goles de otro planeta' }],
        sponsors: [{ name: 'Mobil 1' }, { name: 'Nissan' }],
        userCommunities: [{ name: 'Rocket Pros', members: '80k' }]
},
smash: {
        id: 'smash', name: 'SMASH BROS', banner: BannerSmash,
        history: 'El crossover de lucha definitivo. Saca a tus rivales del escenario con los personajes más icónicos de la historia del videojuego.',
        tags: ['Lucha', 'Crossover', 'Nintendo'],
        organizers: [{ name: 'Nintendo', motto: '¡A luchar!' }],
        sponsors: [{ name: 'Panda Global' }],
        userCommunities: [{ name: 'Smash Ultimate Hub', members: '120k' }]
},
csgo: {
        id: 'csgo',
        name: 'COUNTER-STRIKE: GO', // Forzamos el nombre aquí
        banner: BannerCsgo,
        history: 'El legendario shooter táctico de precisión. Aunque la industria ha migrado a CS2, aquí celebramos el legado competitivo de Global Offensive.',
        tags: ['FPS', 'Clásico', 'E-Sports'],
        organizers: [{ name: 'Valve', motto: 'Definiendo los eSports' }],
        sponsors: [{ name: 'Intel' }, { name: 'Zowie' }],
        userCommunities: [{ name: 'CS:GO Veterans', members: '500k' }]
},
apex: {
        id: 'apex', name: 'APEX LEGENDS', banner: BannerApex,
        history: 'Movimiento fluido y combate frenético. Domina las habilidades de tu Leyenda en el Battle Royale más dinámico del mercado.',
        tags: ['Movimiento', 'Battle Royale', 'Leyendas'],
        organizers: [{ name: 'Respawn', motto: 'Gloria en el Cañón' }],
        sponsors: [{ name: 'Monster Energy' }],
        userCommunities: [{ name: 'Apex Predators', members: '130k' }]
},
cod: {
        id: 'cod', name: 'CALL OF DUTY', banner: BannerCod,
        history: 'Acción bélica de primer nivel. Desde el multijugador clásico hasta Warzone, la experiencia definitiva de combate en primera persona.',
        tags: ['FPS', 'Bélico', 'Acción'],
        organizers: [{ name: 'Activision', motto: 'Misión cumplida' }],
        sponsors: [{ name: 'Mountain Dew' }],
        userCommunities: [{ name: 'Warzone Squads', members: '400k' }]
},
tft: {
        id: 'tft',
        name: 'TEAMFIGHT TACTICS',
        banner: BannerTft,
        developer: 'Riot Games',
        history: 'El juego de estrategia de tablero definitivo. Recluta, despliega y mejora a los campeones de League of Legends en una batalla por la supervivencia. En TFT, tu ingenio es tu mejor arma para construir la composición perfecta y dominar la Convergencia.',
        tags: ['Estrategia', 'Auto-battler', 'PC/Mobile'],
        organizers: [
            { name: 'Riot Games', motto: 'Estrategia competitiva a nivel global' },
            { name: 'Tactician’s Cup', motto: 'El camino hacia el campeonato mundial' }
        ],
        sponsors: [{ name: 'Amazon Prime' }, { name: 'Mastercard' }],
        userCommunities: [
            { name: 'TFT Latam', members: '95k' },
            { name: 'Competitive Tacticians', members: '40k' }
        ]
},
starcraft: {
    id: 'starcraft',
    name: 'STARCRAFT II',
    banner: BannerStarCraft, // Asegúrate de importar la imagen arriba
    developer: 'Blizzard Entertainment',
    history: 'El rey de la estrategia en tiempo real. En el sector Koprulu, tres razas únicas (Terran, Zerg y Protoss) luchan por la supervivencia galáctica. Un eSport legendario que exige una coordinación perfecta y una toma de decisiones en fracciones de segundo.',
    tags: ['RTS', 'Estrategia', 'PC', 'E-Sports'],
    organizers: [
        { name: 'ESL Pro Tour', motto: 'La cima de la estrategia mundial' },
        { name: 'Blizzard', motto: 'Estrategia épica' }
    ],
    sponsors: [{ name: 'Intel' }, { name: 'Shopify' }],
    userCommunities: [
        { name: 'StarCraft Latam', members: '35k' },
        { name: 'Team Liquid Hub', members: '120k' }
    ]
},
clashroyale: {
    id: 'clashroyale',
    name: 'CLASH ROYALE',
    banner: BannerClashRoyale, // Asegúrate de importar la imagen arriba
    developer: 'Supercell',
    history: '¡Entra en la arena! De los creadores de Clash of Clans, llega un juego multijugador en tiempo real protagonizado por tus personajes favoritos de Clash. Despliega tus tropas, hechizos y defensas para derribar las torres del Rey enemigo en duelos estratégicos de ritmo frenético.',
    tags: ['Estrategia', 'Cartas', 'Móvil', 'Real-Time'],
    organizers: [
        { name: 'CRL (Clash Royale League)', motto: 'La competencia oficial de Supercell' },
        { name: 'Queso Cup', motto: 'Impulsando el talento hispano' }
    ],
    sponsors: [{ name: 'Supercell' }, { name: 'Samsung' }],
    userCommunities: [
        { name: 'Royale Latam', members: '180k' },
        { name: 'Clan de Maestros', members: '45k' }
    ]
},
tekken8: {
    id: 'tekken8',
    name: 'TEKKEN 8',
    banner: BannerTekken8, // Asegúrate de importar tu imagen arriba
    developer: 'Bandai Namco',
    history: 'La saga del Puño de Hierro evoluciona con Tekken 8. Con el nuevo sistema "Heat", el juego recompensa la agresividad y el espectáculo visual. La lucha fratricida de la familia Mishima alcanza niveles cinematográficos nunca antes vistos en el género de lucha 3D.',
    tags: ['Lucha 3D', 'Competitivo', 'Arcade'],
    organizers: [
        { name: 'Bandai Namco', motto: 'Tekken World Tour' },
        { name: 'EVO', motto: 'Where Champions are Born' }
    ],
    sponsors: [{ name: 'Razer' }, { name: 'Red Bull' }],
    userCommunities: [
        { name: 'Tekken España/Latam', members: '45k' },
        { name: 'Mishima Dojo', members: '12k' }
    ]
},
streetfighter6: {
    id: 'streetfighter6',
    name: 'STREET FIGHTER 6',
    banner: BannerStreetFighter6, // Asegúrate de importar tu imagen arriba
    developer: 'Capcom',
    history: 'Street Fighter 6 redefine el género con el sistema Drive, ofreciendo una profundidad estratégica sin precedentes. Con una estética urbana vibrante y el World Tour, es la entrega más accesible y completa de la franquicia más icónica de la lucha.',
    tags: ['Lucha 2D', 'E-Sports', 'Combates'],
    organizers: [
        { name: 'Capcom', motto: 'Capcom Cup' },
        { name: 'Combo Breaker', motto: 'The Fighting Game Community' }
    ],
    sponsors: [{ name: 'Lexar' }, { name: 'Chipotle' }],
    userCommunities: [
        { name: 'FGC Hispana', members: '60k' },
        { name: 'Street Fighter Universe', members: '150k' }
    ]
},
runeterra: {
    id: 'runeterra',
    name: 'LEGENDS OF RUNETERRA',
    banner: BannerRuneterra, 
    developer: 'Riot Games',
    history: 'Legends of Runeterra es el juego de cartas estratégico de Riot Games donde el éxito se basa en la habilidad y la creatividad. En el mundo de Runeterra, puedes combinar campeones y aliados de regiones icónicas para construir el mazo definitivo y superar a tus rivales en duelos dinámicos.',
    tags: ['Cartas', 'Estrategia', 'PC/Mobile'],
    organizers: [
        { name: 'Riot Games', motto: 'Estrategia de cartas a nivel competitivo' },
        { name: 'Legends Cup', motto: 'El camino hacia la gloria de Runeterra' }
    ],
    sponsors: [{ name: 'Logitech G' }, { name: 'Secretlab' }],
    userCommunities: [
        { name: 'LoR Latam', members: '50k' },
        { name: 'Path of Champions Global', members: '35k' }
    ]
},
nba2k14: {
    id: 'nba2k14',
    name: 'NBA 2K14',
    banner: BannerNba2k14, 
    developer: 'Visual Concepts / 2K Sports',
    history: 'Considerado por muchos como uno de los mejores simuladores de baloncesto de la historia. Con LeBron James en la portada y la introducción del modo "Path to Greatness", NBA 2K14 marcó el inicio de una nueva era gráfica y jugable en las consolas, manteniendo una comunidad de fans activa hasta el día de hoy gracias a sus mecánicas fluidas.',
    tags: ['Deportes', 'Simulación', 'Clásico'],
    organizers: [
        { name: '2K Sports', motto: 'Basketball is Life' },
        { name: 'Retro League Global', motto: 'Manteniendo vivos los clásicos' }
    ],
    sponsors: [{ name: 'Nike' }, { name: 'Gatorade' }],
    userCommunities: [
        { name: 'NBA 2K Veterans', members: '25k' },
        { name: 'Modding Society 2K', members: '15k' }
    ]
}


};



