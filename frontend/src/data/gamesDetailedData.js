// Importamos los banners desde tu nueva carpeta assets/banner
import BannerLol from '../assets/banner/BannerLol.jpg';
import BannerValo from '../assets/banner/BannerValo.jpg';
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
import BannerMk11 from '../assets/banner/BannerMk11.jpg';
import BannerMinecraft from '../assets/banner/BannerMinecraft.jpg';
import BannerRoblox from '../assets/banner/BannerRoblox.jpg';
import BannerGta from '../assets/banner/BannerGta.jpg';
import BannerGenshin from '../assets/banner/BannerGenshin.jpg';
import BannerCodm from '../assets/banner/BannerCodm.jpg';
import BannerMariokart from '../assets/banner/BannerMariokart.jpg';
import BannerMarvel from '../assets/banner/BannerMarvel.jpg';
import BannerHalo from '../assets/banner/BannerHalo.jpg';
import BannerAmongus from '../assets/banner/BannerAmongus.jpg';
import BannerFallguys from '../assets/banner/BannerFallguys.jpg';

export const gamesDetailedData = {
// =========================
// NUCLEO COMPETITIVO
// =========================
lol: {
    id: 'lol',
    name: 'League of Legends',
    banner: BannerLol,
    developer: 'Riot Games',
    history: 'League of Legends es un juego de estrategia por equipos en el que dos equipos de cinco campeones se enfrentan para ver quién destruye antes la base del otro. Elige entre un plantel de más de 140 campeones para realizar jugadas épicas, asegurar asesinatos y destruir torretas mientras avanzas hacia la victoria.',
    tags: ['MOBA', 'PC', 'Competitivo', 'E-Sports', 'Estrategia'],
    category: 'MOBA',
    color: '#4B69FF',
        
        // Estos arrays crecerán solos cuando se conecte la DB
        activeTournaments: [
            { title: 'Worlds 2024', prize: 'Copa del Invocador', date: 'Octubre 2024' },
            { title: 'MSI Invitational', prize: '$250,000 USD', date: 'Mayo 2024' }
        ],
        organizers: [
            { name: 'LVP', motto: 'Liga de Videojuegos Profesional', region: 'España/Latam' },
            { name: 'Circuito Global del Juego', motto: 'Escena competitiva internacional', region: 'Global' },
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
    category: 'Shooter',
    color: '#FF4655',

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
    category: 'MOBA',
    color: '#A2592C',
    
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
        category: 'MOBA Móvil',
        color: '#FFD700',
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
        category: 'MOBA Móvil',
        color: '#00BFFF',
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
// =========================
// JUEGOS POPULARES (MIX)
// =========================
fifa: {
            category: 'Deportes',
            color: '#1A8F2E',
        id: 'fifa', name: 'FC 25 (FIFA)', banner: BannerFifa,
        history: 'El simulador de fútbol más icónico del mundo. Domina el campo con un realismo sin precedentes y lleva a tu club a la gloria en la escena competitiva global.',
        tags: ['Deportes', 'Simulación', 'Fútbol'],
        organizers: [{ name: 'EA Sports', motto: 'It\'s in the game' }],
        sponsors: [{ name: 'Adidas' }, { name: 'PlayStation' }],
        userCommunities: [{ name: 'FIFA Ultimate Community', members: '200k' }]
},
fortnite: {
            category: 'Battle Royale',
            color: '#7C3AED',
        id: 'fortnite', name: 'FORTNITE', banner: BannerFortnite,
        history: 'Más que un Battle Royale: un fenómeno cultural. Construye, lucha y sobrevive en un mapa en constante evolución lleno de eventos épicos.',
        tags: ['Battle Royale', 'Construcción', 'Multiplataforma'],
        organizers: [{ name: 'Epic Games', motto: 'Competencia para todos' }],
        sponsors: [{ name: 'Intel' }, { name: 'Logitech' }],
        userCommunities: [{ name: 'Fortnite Latam Pros', members: '150k' }]
},
hok: {
            category: 'MOBA Móvil',
            color: '#FF4500',
        id: 'hok', name: 'HONOR OF KINGS', banner: BannerHok,
        history: 'El MOBA móvil más jugado del planeta llega al mercado global con héroes legendarios y una profundidad estratégica inigualable.',
        tags: ['MOBA', 'Móvil', 'E-Sports'],
        organizers: [{ name: 'Level Infinite', motto: 'Estrategia sin límites' }],
        sponsors: [{ name: 'Honor' }, { name: 'Qualcomm' }],
        userCommunities: [{ name: 'HoK Global Hub', members: '300k' }]
},
hearthstone: {
            category: 'Cartas',
            color: '#C49C48',
        id: 'hearthstone', name: 'HEARTHSTONE', banner: BannerHearthstone,
        history: 'Engañosamente simple e increíblemente divertido. El juego de cartas estratégico donde la astucia es tu mejor arma en la taberna.',
        tags: ['Cartas', 'Estrategia', 'Warcraft'],
        organizers: [{ name: 'Blizzard', motto: 'Cada carta cuenta' }],
        sponsors: [{ name: 'SteelSeries' }],
        userCommunities: [{ name: 'Taberna Pro', members: '45k' }]
},
freefire: {
            category: 'Battle Royale',
            color: '#FF6F00',
        id: 'freefire', name: 'FREE FIRE', banner: BannerFreefire,
        history: 'Supervivencia al límite en partidas rápidas de 10 minutos. Sé el último hombre en pie en el Battle Royale más popular para móviles.',
        tags: ['Battle Royale', 'Móvil', 'Acción'],
        organizers: [{ name: 'Garena', motto: 'Booyah!' }],
        sponsors: [{ name: 'Free Fire World' }, { name: 'KFC' }],
        userCommunities: [{ name: 'Garena Masters', members: '500k' }]
},
overwatch: {
            category: 'Hero Shooter',
            color: '#F99D1C',
        id: 'overwatch', name: 'OVERWATCH 2', banner: BannerOverwatch,
        history: 'Un shooter por equipos vibrante donde cada héroe trae una habilidad única al campo de batalla. El mundo siempre necesita héroes.',
        tags: ['Hero Shooter', 'Equipo', 'FPS'],
        organizers: [{ name: 'Overwatch League', motto: 'La unión hace la fuerza' }],
        sponsors: [{ name: 'HP Omen' }, { name: 'Coca-Cola' }],
        userCommunities: [{ name: 'Heroes Hub', members: '90k' }]
},
pubg: {
            category: 'Battle Royale',
            color: '#D7B600',
        id: 'pubg', name: 'PUBG BATTLEGROUNDS', banner: BannerPubg,
        history: 'El Battle Royale original. Sobrevive al caos en mapas realistas donde la posición y el equipamiento lo son todo.',
        tags: ['Realismo', 'Battle Royale', 'Táctico'],
        organizers: [{ name: 'Krafton', motto: 'Winner Winner Chicken Dinner' }],
        sponsors: [{ name: 'AORUS' }],
        userCommunities: [{ name: 'Survivor Squads', members: '110k' }]
},
rainbowsix: {
            category: 'Shooter Táctico',
            color: '#2E4053',
        id: 'rainbowsix', name: 'RAINBOW SIX SIEGE', banner: BannerRainbowSix,
        history: 'Asedio y defensa táctica extrema. En Siege, la destrucción del entorno es tu mayor aliada para sorprender al enemigo.',
        tags: ['Táctico', 'Destrucción', 'FPS'],
        organizers: [{ name: 'Ubisoft', motto: 'Operación Éxito' }],
        sponsors: [{ name: 'Corsair' }],
        userCommunities: [{ name: 'Siege Tactics Latam', members: '55k' }]
},
rocketleague: {
            category: 'Deportes',
            color: '#FF4C29',
        id: 'rocketleague', name: 'ROCKET LEAGUE', banner: BannerRocketLeague,
        history: 'Fútbol con autos propulsados por cohetes. Un híbrido de alta potencia que desafía las leyes de la física.',
        tags: ['Deportes', 'Autos', 'Física'],
        organizers: [{ name: 'Psyonix', motto: 'Goles de otro planeta' }],
        sponsors: [{ name: 'Mobil 1' }, { name: 'Nissan' }],
        userCommunities: [{ name: 'Rocket Pros', members: '80k' }]
},
smash: {
            category: 'Lucha',
            color: '#E4002B',
        id: 'smash', name: 'SMASH BROS', banner: BannerSmash,
        history: 'El crossover de lucha definitivo. Saca a tus rivales del escenario con los personajes más icónicos de la historia del videojuego.',
        tags: ['Lucha', 'Crossover', 'Nintendo'],
        organizers: [{ name: 'Nintendo', motto: '¡A luchar!' }],
        sponsors: [{ name: 'Panda Global' }],
        userCommunities: [{ name: 'Smash Ultimate Hub', members: '120k' }]
},
csgo: {
            category: 'Shooter',
            color: '#F2C744',
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
            category: 'Battle Royale',
            color: '#E43D30',
        id: 'apex', name: 'APEX LEGENDS', banner: BannerApex,
        history: 'Movimiento fluido y combate frenético. Domina las habilidades de tu Leyenda en el Battle Royale más dinámico del mercado.',
        tags: ['Movimiento', 'Battle Royale', 'Leyendas'],
        organizers: [{ name: 'Respawn', motto: 'Gloria en el Cañón' }],
        sponsors: [{ name: 'Monster Energy' }],
        userCommunities: [{ name: 'Apex Predators', members: '130k' }]
},
cod: {
            category: 'Shooter',
            color: '#363636',
        id: 'cod', name: 'CALL OF DUTY', banner: BannerCod,
        history: 'Acción bélica de primer nivel. Desde el multijugador clásico hasta Warzone, la experiencia definitiva de combate en primera persona.',
        tags: ['FPS', 'Bélico', 'Acción'],
        organizers: [{ name: 'Activision', motto: 'Misión cumplida' }],
        sponsors: [{ name: 'Mountain Dew' }],
        userCommunities: [{ name: 'Warzone Squads', members: '400k' }]
},
tft: {
            category: 'Estrategia',
            color: '#7ED6DF',
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
        category: 'RTS',
        color: '#1B263B',
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
        category: 'Cartas',
        color: '#F7B731',
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
        category: 'Lucha 3D',
        color: '#A83232',
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
        category: 'Lucha 2D',
        color: '#2C3E50',
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
        category: 'Cartas',
        color: '#6C3483',
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
        category: 'Deportes',
        color: '#2E86C1',
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
},

// =========================================
// 🎮 JUEGOS ADICIONALES (sin banner local)
// =========================
// JUEGOS EXTRA RPG/AVENTURA
// =========================
wuwa: {
    id: 'wuwa',
    name: 'Wuthering Waves',
    banner: 'https://static.wutheringwaves.com/assets/images/banner.jpg',
    developer: 'Kuro Games',
    history: 'WuWa es un RPG de acción de mundo abierto con exploración, combate dinámico y una narrativa profunda. Los jugadores recorren un mundo devastado por catástrofes, descubriendo secretos y luchando contra enemigos formidables.',
    tags: ['RPG', 'Mundo Abierto', 'Acción'],
    category: 'Mundo Abierto',
    color: '#8E44AD',
    organizers: [ { name: 'Kuro Games', motto: 'Explora, lucha, sobrevive' } ],
    sponsors: [ { name: 'Kuro Games' } ],
    userCommunities: [ { name: 'WuWa Latam', members: '50k' } ]
},
eldenring: {
    id: 'eldenring',
    name: 'Elden Ring',
    banner: 'https://cdn.akamai.steamstatic.com/steam/apps/1245620/header.jpg',
    developer: 'FromSoftware',
    history: 'Elden Ring redefine el género RPG de mundo abierto con una jugabilidad desafiante, exploración libre y una atmósfera épica. Los jugadores recorren las Tierras Intermedias enfrentando jefes legendarios y descubriendo secretos.',
    tags: ['RPG', 'Mundo Abierto', 'Desafío'],
    category: 'Mundo Abierto',
    color: '#D4AC0D',
    organizers: [ { name: 'Bandai Namco', motto: 'La aventura definitiva' } ],
    sponsors: [ { name: 'Bandai Namco' } ],
    userCommunities: [ { name: 'Elden Ring Latam', members: '80k' } ]
},
zelda: {
    id: 'zelda',
    name: 'Zelda: Breath of the Wild',
    banner: 'https://www.zelda.com/assets/images/botw/banner.jpg',
    developer: 'Nintendo',
    history: 'La saga Zelda alcanza su máxima expresión en Breath of the Wild, un mundo abierto lleno de aventuras, acertijos y libertad total. Explora Hyrule, resuelve misterios y enfréntate a Ganon.',
    tags: ['Aventura', 'Mundo Abierto', 'Puzzle'],
    category: 'Mundo Abierto',
    color: '#3498DB',
    organizers: [ { name: 'Nintendo', motto: 'La leyenda continúa' } ],
    sponsors: [ { name: 'Nintendo' } ],
    userCommunities: [ { name: 'Zelda Latam', members: '60k' } ]
},
rdr2: {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    banner: 'https://cdn.akamai.steamstatic.com/steam/apps/1174180/header.jpg',
    developer: 'Rockstar Games',
    history: 'RDR2 es una epopeya de mundo abierto ambientada en el salvaje oeste. Con una narrativa profunda, exploración y realismo, los jugadores viven la vida de un forajido en un mundo vasto y detallado.',
    tags: ['Aventura', 'Mundo Abierto', 'Western'],
    category: 'Mundo Abierto',
    color: '#C0392B',
    organizers: [ { name: 'Rockstar Games', motto: 'El oeste nunca muere' } ],
    sponsors: [ { name: 'Rockstar Games' } ],
    userCommunities: [ { name: 'RDR2 Latam', members: '40k' } ]
},
cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    banner: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    developer: 'CD Projekt Red',
    history: 'Cyberpunk 2077 ofrece un mundo abierto futurista lleno de acción, tecnología y narrativa profunda. Explora Night City, personaliza tu personaje y vive una historia de ciencia ficción.',
    tags: ['RPG', 'Mundo Abierto', 'Futurista'],
    category: 'Mundo Abierto',
    color: '#F7DC6F',
    organizers: [ { name: 'CD Projekt Red', motto: 'El futuro es ahora' } ],
    sponsors: [ { name: 'CD Projekt Red' } ],
    userCommunities: [ { name: 'Cyberpunk Latam', members: '30k' } ]
},
acvalhalla: {
    id: 'acvalhalla',
    name: 'Assassin’s Creed Valhalla',
    banner: 'https://cdn.akamai.steamstatic.com/steam/apps/2208920/header.jpg',
    developer: 'Ubisoft',
    history: 'AC Valhalla es un RPG de acción de mundo abierto ambientado en la era vikinga. Explora Inglaterra, lidera incursiones y vive la historia de Eivor, un guerrero vikingo.',
    tags: ['RPG', 'Mundo Abierto', 'Vikingos'],
    category: 'Mundo Abierto',
    color: '#16A085',
    organizers: [ { name: 'Ubisoft', motto: 'La era de los vikingos' } ],
    sponsors: [ { name: 'Ubisoft' } ],
    userCommunities: [ { name: 'Valhalla Latam', members: '25k' } ]
},
// =========================================
// =========================
// JUEGOS EXTRA CON BANNER LOCAL
// =========================
mk11: {
        category: 'Lucha',
        color: '#B71C1C',
    id: 'mk11',
    name: 'MORTAL KOMBAT 11',
    banner: BannerMk11,
    developer: 'NetherRealm Studios',
    history: 'La brutalidad hecha arte. Mortal Kombat 11 perfecciona la fórmula del kombate con un sistema de variaciones personalizable, Fatalities más viscerales que nunca y una historia que viaja a través del tiempo. El rey indiscutible del gore competitivo.',
    tags: ['Lucha', 'Gore', 'Competitivo'],
    organizers: [
        { name: 'Warner Bros Games', motto: 'Finish Him!' },
        { name: 'EVO', motto: 'La mayor competición de lucha del mundo' }
    ],
    sponsors: [{ name: 'Razer' }, { name: 'HyperX' }],
    userCommunities: [
        { name: 'Kombat Network', members: '75k' },
        { name: 'MK Latam', members: '30k' }
    ]
},
minecraft: {
        category: 'Sandbox',
        color: '#6AB04A',
    id: 'minecraft',
    name: 'MINECRAFT',
    banner: BannerMinecraft,
    developer: 'Mojang Studios',
    history: 'El fenómeno que redefinió la creatividad en los videojuegos. En un mundo infinito hecho de bloques, tu imaginación es el único límite. Desde humildes cabañas hasta ciudades enteras, Minecraft ha demostrado que la simplicidad puede engendrar una complejidad asombrosa.',
    tags: ['Sandbox', 'Survival', 'Creatividad'],
    organizers: [
        { name: 'Mojang', motto: 'Tu mundo, tus reglas' },
        { name: 'Minecraft Championship', motto: 'El evento comunitario más grande' }
    ],
    sponsors: [{ name: 'Microsoft' }, { name: 'Xbox' }],
    userCommunities: [
        { name: 'Minecraft Builders', members: '500k' },
        { name: 'Redstone Engineers', members: '120k' }
    ]
},
roblox: {
        category: 'Plataforma',
        color: '#F5B041',
    id: 'roblox',
    name: 'ROBLOX',
    banner: BannerRoblox,
    developer: 'Roblox Corporation',
    history: 'La plataforma donde los jugadores se convierten en creadores. Roblox ofrece millones de experiencias creadas por su comunidad, desde obbys desafiantes hasta simuladores complejos. Un universo social sin límites donde la próxima gran idea puede venir de cualquier jugador.',
    tags: ['Social', 'Plataforma', 'Creación'],
    organizers: [
        { name: 'Roblox Corp', motto: 'Imagining is just the beginning' },
        { name: 'RDC', motto: 'Roblox Developers Conference' }
    ],
    sponsors: [{ name: 'AWS' }],
    userCommunities: [
        { name: 'Roblox Devs Latam', members: '90k' },
        { name: 'Obby Masters', members: '45k' }
    ]
},
gta: {
        category: 'Mundo Abierto',
        color: '#34495E',
    id: 'gta',
    name: 'GTA V / GTA ONLINE',
    banner: BannerGta,
    developer: 'Rockstar Games',
    history: 'Los Santos, la ciudad donde todo es posible. GTA V y su componente multijugador GTA Online han creado un ecosistema criminal digital sin precedentes. Atracos, carreras, negocios y caos absoluto en el sandbox más ambicioso de la historia.',
    tags: ['Acción', 'Mundo Abierto', 'Multijugador'],
    organizers: [
        { name: 'Rockstar Games', motto: 'Welcome to Los Santos' }
    ],
    sponsors: [{ name: 'PlayStation' }, { name: 'Xbox' }],
    userCommunities: [
        { name: 'GTA RP Hispano', members: '200k' },
        { name: 'Los Santos Underground', members: '85k' }
    ]
},
genshin: {
        category: 'Mundo Abierto',
        color: '#A3E4D7',
    id: 'genshin',
    name: 'GENSHIN IMPACT',
    banner: BannerGenshin,
    developer: 'HoYoverse',
    history: 'Un RPG de acción de mundo abierto que ha cautivado al mundo con su belleza artística y su sistema de elementos. Explora Teyvat, un vasto mundo lleno de misterios, desbloquea personajes con habilidades elementales únicas y sumérgete en una historia épica de dioses y aventureros.',
    tags: ['RPG', 'Mundo Abierto', 'Gacha'],
    organizers: [
        { name: 'HoYoverse', motto: 'Tech Otakus Save the World' }
    ],
    sponsors: [{ name: 'Sony' }, { name: 'Epic Games Store' }],
    userCommunities: [
        { name: 'Genshin Latam', members: '300k' },
        { name: 'Teyvat Explorers', members: '150k' }
    ]
},
codm: {
        category: 'Shooter Móvil',
        color: '#212F3C',
    id: 'codm',
    name: 'CALL OF DUTY: MOBILE',
    banner: BannerCodm,
    developer: 'TiMi Studio Group / Activision',
    history: 'La experiencia Call of Duty completa en tu bolsillo. COD Mobile combina los mapas icónicos del multijugador clásico con un modo Battle Royale masivo, todo optimizado para controles táctiles con una fluidez sorprendente.',
    tags: ['FPS', 'Móvil', 'Battle Royale'],
    organizers: [
        { name: 'Activision', motto: 'La acción no espera' },
        { name: 'COD Mobile World Championship', motto: 'Competición global móvil' }
    ],
    sponsors: [{ name: 'Sony Xperia' }, { name: 'Qualcomm' }],
    userCommunities: [
        { name: 'CODM Latam Pro', members: '180k' },
        { name: 'Mobile Warriors', members: '65k' }
    ]
},
mariokart: {
        category: 'Carreras',
        color: '#F1C40F',
    id: 'mariokart',
    name: 'MARIO KART',
    banner: BannerMariokart,
    developer: 'Nintendo',
    history: 'El juego de carreras más divertido y caótico de todos los tiempos. Caparazones azules, plátanos traidores y atajos secretos: Mario Kart ha unido (y destruido) amistades durante décadas con su gameplay accesible pero increíblemente competitivo.',
    tags: ['Carreras', 'Party', 'Nintendo'],
    organizers: [
        { name: 'Nintendo', motto: 'Start your engines!' }
    ],
    sponsors: [{ name: 'Nintendo Switch' }],
    userCommunities: [
        { name: 'MK8 Deluxe Latam', members: '70k' },
        { name: 'Time Trial Masters', members: '25k' }
    ]
},
marvel: {
        category: 'Hero Shooter',
        color: '#C0392B',
    id: 'marvel',
    name: 'MARVEL RIVALS',
    banner: BannerMarvel,
    developer: 'NetEase Games',
    history: 'El universo Marvel entra en la arena de los hero shooters. Elige entre icónicos superhéroes y villanos, cada uno con habilidades únicas fieles al lore, y enfréntate en batallas por equipos dinámicas donde la sinergia entre personajes es la clave del triunfo.',
    tags: ['Hero Shooter', 'Equipo', 'PC'],
    organizers: [
        { name: 'NetEase', motto: 'Assemble!' },
        { name: 'Marvel Games', motto: 'Héroes sin límites' }
    ],
    sponsors: [{ name: 'Marvel Entertainment' }],
    userCommunities: [
        { name: 'Marvel Rivals Hub', members: '110k' },
        { name: 'Superhero Squads', members: '40k' }
    ]
},
halo: {
        category: 'Shooter',
        color: '#5D6D7E',
    id: 'halo',
    name: 'HALO INFINITE',
    banner: BannerHalo,
    developer: '343 Industries',
    history: 'El Jefe Maestro regresa en su aventura más ambiciosa. Halo Infinite combina un multijugador free-to-play frenético con una campaña de mundo abierto épica. El legado de una franquicia que definió los shooters en consola sigue más vivo que nunca.',
    tags: ['FPS', 'Sci-Fi', 'Consola'],
    organizers: [
        { name: '343 Industries', motto: 'The Legend Continues' },
        { name: 'HCS', motto: 'Halo Championship Series' }
    ],
    sponsors: [{ name: 'Xbox' }, { name: 'Monster Energy' }],
    userCommunities: [
        { name: 'Halo Community', members: '95k' },
        { name: 'Spartans Latam', members: '20k' }
    ]
},
amongus: {
        category: 'Social',
        color: '#E67E22',
    id: 'amongus',
    name: 'AMONG US',
    banner: BannerAmongus,
    developer: 'Innersloth',
    history: 'Engaño, paranoia y trabajo en equipo. Among Us transformó las noches de juegos con su premisa simple pero adictiva: descubre al impostor antes de que sea demasiado tarde. Un fenómeno social que demostró que no necesitas gráficos AAA para crear momentos inolvidables.',
    tags: ['Social', 'Deducción', 'Multijugador'],
    organizers: [
        { name: 'Innersloth', motto: 'Trust no one' }
    ],
    sponsors: [{ name: 'Epic Games' }],
    userCommunities: [
        { name: 'Among Us Latam', members: '250k' },
        { name: 'Impostors Club', members: '80k' }
    ]
},
fallguys: {
        category: 'Party',
        color: '#9B59B6',
    id: 'fallguys',
    name: 'FALL GUYS',
    banner: BannerFallguys,
    developer: 'Mediatonic',
    history: '¡La carrera de obstáculos más divertida del gaming! Fall Guys combina la caótica energía de un show de televisión japonés con personajes adorables en un Battle Royale donde sobrevivir es tan difícil como dejar de reír. Perfecto para sesiones casuales con amigos.',
    tags: ['Party', 'Battle Royale', 'Casual'],
    organizers: [
        { name: 'Mediatonic', motto: 'Stumble towards greatness' }
    ],
    sponsors: [{ name: 'Epic Games' }],
    userCommunities: [
        { name: 'Fall Guys Latam', members: '60k' },
        { name: 'Crown Hunters', members: '35k' }
    ]
},
palworld: {
        category: 'Mundo Abierto',
        color: '#27AE60',
    id: 'palworld',
    name: 'PALWORLD',
    banner: 'https://cdn.akamai.steamstatic.com/steam/apps/1623730/header.jpg',
    developer: 'Pocketpair',
    history: 'Supervivencia, crafting y criaturas en un mundo abierto. Palworld mezcla la captura de criaturas con mecánicas de construcción de bases y combate con armas de fuego, creando una experiencia única que ha cautivado a millones de jugadores desde su lanzamiento en acceso anticipado.',
    tags: ['Survival', 'Mundo Abierto', 'Criaturas'],
    organizers: [
        { name: 'Pocketpair', motto: 'Catch them all... differently' }
    ],
    sponsors: [{ name: 'Xbox Game Pass' }],
    userCommunities: [
        { name: 'Palworld Español', members: '140k' },
        { name: 'Pal Tamers', members: '55k' }
    ]
}

};

// =========================================
// 🔗 ALIAS: IDs de gamesList → claves de gamesDetailedData
// Para que lookups como gamesDetailedData['rocket'] funcionen
// =========================================
gamesDetailedData.cs2 = gamesDetailedData.csgo;
gamesDetailedData.r6 = gamesDetailedData.rainbowsix;
gamesDetailedData.r6s = gamesDetailedData.rainbowsix;
gamesDetailedData.warzone = gamesDetailedData.cod;
gamesDetailedData.pubgm = gamesDetailedData.pubg;
gamesDetailedData.lor = gamesDetailedData.runeterra;
gamesDetailedData.sf6 = gamesDetailedData.streetfighter6;
gamesDetailedData.rocket = gamesDetailedData.rocketleague;
gamesDetailedData.nba2k = gamesDetailedData.nba2k14;
gamesDetailedData.ow2 = gamesDetailedData.overwatch;
gamesDetailedData.wr = gamesDetailedData.wildrift;
gamesDetailedData.aov = gamesDetailedData.hok;
// Alias por nombre exacto (backend)
gamesDetailedData['Overwatch 2'] = gamesDetailedData.overwatch;
gamesDetailedData['League of Legends'] = gamesDetailedData.lol;
gamesDetailedData['Valorant'] = gamesDetailedData.valorant;
gamesDetailedData['Mobile Legends'] = gamesDetailedData.mlbb;
gamesDetailedData['TFT'] = gamesDetailedData.tft;
gamesDetailedData['FIFA / EA FC'] = gamesDetailedData.fifa;
gamesDetailedData['Free Fire'] = gamesDetailedData.freefire;
gamesDetailedData['Dota 2'] = gamesDetailedData.dota2;
gamesDetailedData['Wild Rift'] = gamesDetailedData.wildrift;
gamesDetailedData['Clash Royale'] = gamesDetailedData.clashroyale;
gamesDetailedData['StarCraft II'] = gamesDetailedData.starcraft;
gamesDetailedData['Hearthstone'] = gamesDetailedData.hearthstone;
gamesDetailedData['Legends of Runeterra'] = gamesDetailedData.runeterra;
gamesDetailedData['Street Fighter 6'] = gamesDetailedData.streetfighter6;
gamesDetailedData['Tekken 8'] = gamesDetailedData.tekken8;
gamesDetailedData['Rocket League'] = gamesDetailedData.rocketleague;
gamesDetailedData['NBA 2K14'] = gamesDetailedData.nba2k14;
gamesDetailedData['Honor of Kings'] = gamesDetailedData.hok;
gamesDetailedData['Apex Legends'] = gamesDetailedData.apex;
gamesDetailedData['PUBG BATTLEGROUNDS'] = gamesDetailedData.pubg;
gamesDetailedData['Rainbow Six Siege'] = gamesDetailedData.rainbowsix;
gamesDetailedData['CALL OF DUTY'] = gamesDetailedData.cod;
gamesDetailedData['SMASH BROS'] = gamesDetailedData.smash;
// Alias para IDs cortos usados por el backend
gamesDetailedData.rl = gamesDetailedData.rocketleague;
gamesDetailedData.ff = gamesDetailedData.freefire;
gamesDetailedData.d2 = gamesDetailedData.dota2;
gamesDetailedData.ml = gamesDetailedData.mlbb;
gamesDetailedData.fn = gamesDetailedData.fortnite;
gamesDetailedData.hs = gamesDetailedData.hearthstone;
gamesDetailedData.ow = gamesDetailedData.overwatch;
gamesDetailedData.cs = gamesDetailedData.csgo;
gamesDetailedData.sc = gamesDetailedData.starcraft;
gamesDetailedData.cr = gamesDetailedData.clashroyale;
gamesDetailedData.tk = gamesDetailedData.tekken8;
gamesDetailedData.sf = gamesDetailedData.streetfighter6;
gamesDetailedData.nba = gamesDetailedData.nba2k14;

// =========================================
// 🎮 JUEGOS ADICIONALES (sin banner local)
// =========================================
gamesDetailedData.mk11 = gamesDetailedData.mk11;
gamesDetailedData.minecraft = gamesDetailedData.minecraft;
gamesDetailedData.roblox = gamesDetailedData.roblox;
gamesDetailedData.gta = gamesDetailedData.gta;
gamesDetailedData.genshin = gamesDetailedData.genshin;
gamesDetailedData.codm = gamesDetailedData.codm;
gamesDetailedData.mariokart = gamesDetailedData.mariokart;
gamesDetailedData.marvel = gamesDetailedData.marvel;
gamesDetailedData.halo = gamesDetailedData.halo;
gamesDetailedData.amongus = gamesDetailedData.amongus;
gamesDetailedData.fallguys = gamesDetailedData.fallguys;
gamesDetailedData.palworld = gamesDetailedData.palworld;
