/* ═══════════════════════════════════════════════════
   DEFAULT AVATARS — GlitchGang Identity System
   Premium esports avatar collection with tier system
   Uses DiceBear 9.x API for high-quality SVG avatars
   ═══════════════════════════════════════════════════ */

// ── Avatar tiers ──
export const AVATAR_TIERS = {
  basic:     { label: 'Gratis',      color: '#9ca3af', unlock: 'default',          unlockLabel: 'Disponible para todos' },
  pro:       { label: 'Pro',         color: '#3b82f6', unlock: 'matches:10',       unlockLabel: 'Juega 10 partidas' },
  premium:   { label: 'Premium',     color: '#a855f7', unlock: 'referrals:5',      unlockLabel: 'Invita 5 amigos' },
  legendary: { label: 'Legendario',  color: '#f59e0b', unlock: 'tournament_win:3', unlockLabel: 'Gana 3 torneos' },
};

// ── Categories ──
export const AVATAR_CATEGORIES = [
  { id: 'all',       name: 'Todos',       icon: 'bx bx-grid-alt' },
  { id: 'mech',      name: 'Mechs',       icon: 'bx bx-bot' },
  { id: 'agents',    name: 'Agentes',     icon: 'bx bx-user-pin' },
  { id: 'masks',     name: 'Mascaras',    icon: 'bx bx-mask' },
  { id: 'beasts',    name: 'Bestias',     icon: 'bx bx-ghost' },
  { id: 'glyphs',    name: 'Glifos',      icon: 'bx bx-shape-circle' },
];

// DiceBear v9 base
const DB = (style, seed, extras = '') =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundColor=transparent${extras}`;

export const DEFAULT_AVATARS = [
  // ═══════════════════════════════════════════════════
  //  MECHS — Robots futuristas de combate
  //  Estilo: bottts-neutral (limpio, geométrico, pro)
  // ═══════════════════════════════════════════════════
  {
    id: 'mech-alpha',
    name: 'Alpha-7',
    category: 'mech',
    tier: 'basic',
    src: DB('bottts-neutral', 'gg-alpha-7'),
    desc: 'Unidad de combate de primera generación. Confiable y letal.',
  },
  {
    id: 'mech-beta',
    name: 'Beta-X',
    category: 'mech',
    tier: 'basic',
    src: DB('bottts-neutral', 'gg-beta-x'),
    desc: 'Prototipo táctico con IA adaptativa.',
  },
  {
    id: 'mech-gamma',
    name: 'Gamma-9',
    category: 'mech',
    tier: 'basic',
    src: DB('bottts-neutral', 'gg-gamma-9-unit'),
    desc: 'Unidad de reconocimiento de alta velocidad.',
  },
  {
    id: 'mech-delta',
    name: 'Delta-V',
    category: 'mech',
    tier: 'basic',
    src: DB('bottts-neutral', 'gg-delta-v-force'),
    desc: 'Blindaje pesado para la primera línea.',
  },
  {
    id: 'mech-omega',
    name: 'Omega',
    category: 'mech',
    tier: 'pro',
    src: DB('bottts-neutral', 'gg-omega-final'),
    desc: 'El último modelo. Superioridad tecnológica absoluta.',
  },
  {
    id: 'mech-cyber',
    name: 'Cyber-K',
    category: 'mech',
    tier: 'pro',
    src: DB('bottts-neutral', 'gg-cyber-knight'),
    desc: 'Caballero cibernético con escudo de plasma.',
  },
  {
    id: 'mech-sentinel',
    name: 'Sentinel',
    category: 'mech',
    tier: 'pro',
    src: DB('bottts-neutral', 'gg-sentinel-watch'),
    desc: 'Vigilante autónomo. Nunca duerme.',
  },
  {
    id: 'mech-titan',
    name: 'Titan MK-II',
    category: 'mech',
    tier: 'premium',
    src: DB('bottts-neutral', 'gg-titan-mk2'),
    desc: 'Coloso de guerra mejorado con reactor de fusión.',
  },
  {
    id: 'mech-specter',
    name: 'Specter',
    category: 'mech',
    tier: 'premium',
    src: DB('bottts-neutral', 'gg-specter-ghost'),
    desc: 'Invisible para radares. Solo ves su rastro.',
  },
  {
    id: 'mech-zero',
    name: 'Zero',
    category: 'mech',
    tier: 'legendary',
    src: DB('bottts-neutral', 'gg-zero-origin'),
    desc: 'El primero de su clase. Origen de todos los Mechs.',
  },

  // ═══════════════════════════════════════════════════
  //  AGENTES — Personajes humanos estilo gamer
  //  Estilo: notionists-neutral (rostros expresivos)
  // ═══════════════════════════════════════════════════
  {
    id: 'agent-shadow',
    name: 'Shadow',
    category: 'agents',
    tier: 'basic',
    src: DB('notionists-neutral', 'gg-shadow-ops'),
    desc: 'Operativo encubierto. Nadie lo ve venir.',
  },
  {
    id: 'agent-blaze',
    name: 'Blaze',
    category: 'agents',
    tier: 'basic',
    src: DB('notionists-neutral', 'gg-blaze-fire'),
    desc: 'Especialista en asalto. Fuego cruzado es su zona de confort.',
  },
  {
    id: 'agent-nova',
    name: 'Nova',
    category: 'agents',
    tier: 'basic',
    src: DB('notionists-neutral', 'gg-nova-star'),
    desc: 'Francotiradora estelar con precisión milimétrica.',
  },
  {
    id: 'agent-phantom',
    name: 'Phantom',
    category: 'agents',
    tier: 'basic',
    src: DB('notionists-neutral', 'gg-phantom-ghost'),
    desc: 'Infiltración fantasma. Entra, completa, desaparece.',
  },
  {
    id: 'agent-viper',
    name: 'Viper',
    category: 'agents',
    tier: 'pro',
    src: DB('notionists-neutral', 'gg-viper-venom'),
    desc: 'Especialista en trampas y control de zona.',
  },
  {
    id: 'agent-storm',
    name: 'Storm',
    category: 'agents',
    tier: 'pro',
    src: DB('notionists-neutral', 'gg-storm-thunder'),
    desc: 'Entrada agresiva. Donde hay caos, hay victoria.',
  },
  {
    id: 'agent-cipher',
    name: 'Cipher',
    category: 'agents',
    tier: 'pro',
    src: DB('notionists-neutral', 'gg-cipher-code'),
    desc: 'Hacker de campo. La información es su mejor arma.',
  },
  {
    id: 'agent-sakura',
    name: 'Sakura',
    category: 'agents',
    tier: 'premium',
    src: DB('notionists-neutral', 'gg-sakura-blade'),
    desc: 'Maestra del combate cuerpo a cuerpo. Gracia mortal.',
  },
  {
    id: 'agent-raven',
    name: 'Raven',
    category: 'agents',
    tier: 'premium',
    src: DB('notionists-neutral', 'gg-raven-dark'),
    desc: 'Estratega oscuro. Siempre tres pasos adelante.',
  },
  {
    id: 'agent-ace',
    name: 'Ace',
    category: 'agents',
    tier: 'legendary',
    src: DB('notionists-neutral', 'gg-ace-supreme'),
    desc: 'El mejor. Punto. Leyenda viviente del circuito.',
  },

  // ═══════════════════════════════════════════════════
  //  MASCARAS — Personajes misteriosos / enmascarados
  //  Estilo: adventurer-neutral (expresivos con personalidad)
  // ═══════════════════════════════════════════════════
  {
    id: 'mask-oni',
    name: 'Oni',
    category: 'masks',
    tier: 'basic',
    src: DB('adventurer-neutral', 'gg-oni-mask'),
    desc: 'Máscara del demonio japonés. Intimida sin hablar.',
  },
  {
    id: 'mask-kitsune',
    name: 'Kitsune',
    category: 'masks',
    tier: 'basic',
    src: DB('adventurer-neutral', 'gg-kitsune-fox'),
    desc: 'El zorro de nueve colas. Astucia pura.',
  },
  {
    id: 'mask-wraith',
    name: 'Wraith',
    category: 'masks',
    tier: 'basic',
    src: DB('adventurer-neutral', 'gg-wraith-void'),
    desc: 'Entidad del vacío. Ni vivo ni muerto.',
  },
  {
    id: 'mask-ronin',
    name: 'Ronin',
    category: 'masks',
    tier: 'pro',
    src: DB('adventurer-neutral', 'gg-ronin-samurai'),
    desc: 'Samurai sin amo. Solo sigue su propio código.',
  },
  {
    id: 'mask-reaper',
    name: 'Reaper',
    category: 'masks',
    tier: 'pro',
    src: DB('adventurer-neutral', 'gg-reaper-soul'),
    desc: 'Cosechador de almas. Cada kill cuenta.',
  },
  {
    id: 'mask-oracle',
    name: 'Oracle',
    category: 'masks',
    tier: 'pro',
    src: DB('adventurer-neutral', 'gg-oracle-sight'),
    desc: 'Visión más allá del mapa. Predice cada movimiento.',
  },
  {
    id: 'mask-void',
    name: 'Void',
    category: 'masks',
    tier: 'premium',
    src: DB('adventurer-neutral', 'gg-void-walker'),
    desc: 'Caminante del vacío. Trasciende las dimensiones.',
  },
  {
    id: 'mask-shogun',
    name: 'Shogun',
    category: 'masks',
    tier: 'premium',
    src: DB('adventurer-neutral', 'gg-shogun-war'),
    desc: 'General supremo. Su presencia cambia el campo de batalla.',
  },
  {
    id: 'mask-anubis',
    name: 'Anubis',
    category: 'masks',
    tier: 'legendary',
    src: DB('adventurer-neutral', 'gg-anubis-judge'),
    desc: 'Juez del inframundo. Solo aparece en los grandes torneos.',
  },
  {
    id: 'mask-hollow',
    name: 'Hollow King',
    category: 'masks',
    tier: 'legendary',
    src: DB('adventurer-neutral', 'gg-hollow-king'),
    desc: 'Rey sin rostro. Su corona es la victoria absoluta.',
  },

  // ═══════════════════════════════════════════════════
  //  BESTIAS — Animales estilizados cyberpunk
  //  Estilo: bottts (con seeds de animales para siluetas únicas)
  // ═══════════════════════════════════════════════════
  {
    id: 'beast-wolf',
    name: 'Fenrir',
    category: 'beasts',
    tier: 'basic',
    src: DB('bottts', 'gg-fenrir-wolf'),
    desc: 'Lobo cibernético. Lidera la manada digital.',
  },
  {
    id: 'beast-dragon',
    name: 'Wyvern',
    category: 'beasts',
    tier: 'basic',
    src: DB('bottts', 'gg-wyvern-fire'),
    desc: 'Dragón mecánico. Fuego de plasma.',
  },
  {
    id: 'beast-phoenix',
    name: 'Phoenix',
    category: 'beasts',
    tier: 'basic',
    src: DB('bottts', 'gg-phoenix-rise'),
    desc: 'Renace de cada derrota. Imposible de eliminar.',
  },
  {
    id: 'beast-tiger',
    name: 'Rajah',
    category: 'beasts',
    tier: 'pro',
    src: DB('bottts', 'gg-rajah-tiger'),
    desc: 'Tigre blindado. Velocidad y poder sin compromisos.',
  },
  {
    id: 'beast-lion',
    name: 'Regulus',
    category: 'beasts',
    tier: 'pro',
    src: DB('bottts', 'gg-regulus-lion'),
    desc: 'Rey de la jungla digital. Rugido que congela servidores.',
  },
  {
    id: 'beast-hawk',
    name: 'Raptor',
    category: 'beasts',
    tier: 'pro',
    src: DB('bottts', 'gg-raptor-hawk'),
    desc: 'Halcón de reconocimiento. Ve todo desde arriba.',
  },
  {
    id: 'beast-serpent',
    name: 'Hydra',
    category: 'beasts',
    tier: 'premium',
    src: DB('bottts', 'gg-hydra-serpent'),
    desc: 'Serpiente de múltiples cabezas. Corta una, surgen dos.',
  },
  {
    id: 'beast-kraken',
    name: 'Kraken',
    category: 'beasts',
    tier: 'premium',
    src: DB('bottts', 'gg-kraken-deep'),
    desc: 'Terror de las profundidades. Controla el mapa.',
  },
  {
    id: 'beast-leviathan',
    name: 'Leviathan',
    category: 'beasts',
    tier: 'legendary',
    src: DB('bottts', 'gg-leviathan-abyss'),
    desc: 'Criatura ancestral. Destruye todo a su paso.',
  },
  {
    id: 'beast-cerberus',
    name: 'Cerberus',
    category: 'beasts',
    tier: 'legendary',
    src: DB('bottts', 'gg-cerberus-gate'),
    desc: 'Guardián de tres cabezas. Nadie pasa.',
  },

  // ═══════════════════════════════════════════════════
  //  GLIFOS — Símbolos abstractos / energía digital
  //  Estilo: shapes (geométrico, limpio, icónico)
  // ═══════════════════════════════════════════════════
  {
    id: 'glyph-pulse',
    name: 'Pulse',
    category: 'glyphs',
    tier: 'basic',
    src: DB('shapes', 'gg-pulse-energy'),
    desc: 'Pulso de energía pura. Simple pero poderoso.',
  },
  {
    id: 'glyph-hexa',
    name: 'Hexa',
    category: 'glyphs',
    tier: 'basic',
    src: DB('shapes', 'gg-hexa-core'),
    desc: 'Núcleo hexagonal. Estabilidad geométrica.',
  },
  {
    id: 'glyph-flux',
    name: 'Flux',
    category: 'glyphs',
    tier: 'basic',
    src: DB('shapes', 'gg-flux-wave'),
    desc: 'Onda de flujo cuántico. En constante cambio.',
  },
  {
    id: 'glyph-cipher',
    name: 'Cipher',
    category: 'glyphs',
    tier: 'pro',
    src: DB('shapes', 'gg-cipher-rune'),
    desc: 'Runa encriptada. Solo los dignos la descifran.',
  },
  {
    id: 'glyph-prism',
    name: 'Prism',
    category: 'glyphs',
    tier: 'pro',
    src: DB('shapes', 'gg-prism-light'),
    desc: 'Prisma que descompone la luz en poder.',
  },
  {
    id: 'glyph-nexus',
    name: 'Nexus',
    category: 'glyphs',
    tier: 'pro',
    src: DB('shapes', 'gg-nexus-link'),
    desc: 'Punto de conexión entre dimensiones.',
  },
  {
    id: 'glyph-void',
    name: 'Null',
    category: 'glyphs',
    tier: 'premium',
    src: DB('shapes', 'gg-null-void'),
    desc: 'La ausencia de todo. Paradójicamente, lo contiene todo.',
  },
  {
    id: 'glyph-omega',
    name: 'Omega',
    category: 'glyphs',
    tier: 'premium',
    src: DB('shapes', 'gg-omega-end'),
    desc: 'El símbolo final. Donde todo termina y comienza.',
  },
  {
    id: 'glyph-singularity',
    name: 'Singularity',
    category: 'glyphs',
    tier: 'legendary',
    src: DB('shapes', 'gg-singularity-core'),
    desc: 'Punto de no retorno. Gravedad infinita.',
  },
  {
    id: 'glyph-genesis',
    name: 'Genesis',
    category: 'glyphs',
    tier: 'legendary',
    src: DB('shapes', 'gg-genesis-origin'),
    desc: 'El primer glifo. Origen de la red GlitchGang.',
  },
];

export const STATUS_LIST = [
  { id: 'online',     label: 'En Linea',        icon: 'bx-check-circle',   color: '#10b981', desc: 'Disponible para jugar' },
  { id: 'gaming',     label: 'Jugando',          icon: 'bx-joystick',       color: '#8b5cf6', desc: 'En partida ahora' },
  { id: 'tournament', label: 'En Torneo',        icon: 'bx-trophy',         color: '#fbbf24', desc: 'Compitiendo en torneo' },
  { id: 'streaming',  label: 'En Directo',       icon: 'bx-broadcast',      color: '#ef4444', desc: 'Transmitiendo en vivo' },
  { id: 'searching',  label: 'Buscando Equipo',  icon: 'bx-radar',          color: '#06b6d4', desc: 'Buscando compañeros' },
  { id: 'afk',        label: 'AFK',              icon: 'bx-moon',           color: '#f97316', desc: 'Lejos del teclado' },
  { id: 'dnd',        label: 'No Molestar',      icon: 'bx-block',          color: '#dc2626', desc: 'Sin notificaciones' },
  { id: 'offline',    label: 'Invisible',         icon: 'bx-hide',           color: '#6b7280', desc: 'Aparecer desconectado' },
];
