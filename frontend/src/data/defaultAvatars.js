/* ═══════════════════════════════════════════════════
   DEFAULT AVATARS — Organized by category
   Transparent backgrounds for all avatars
   Uses DiceBear API (free, no auth, SVG avatars)
   ═══════════════════════════════════════════════════ */

// Categorías de avatares para filtrado
export const AVATAR_CATEGORIES = [
  { id: 'all', name: 'Todos', icon: '🎯' },
  { id: 'robots', name: 'Robots', icon: '🤖' },
  { id: 'femenino', name: 'Femenino', icon: '👩' },
  { id: 'masculino', name: 'Masculino', icon: '👨' },
  { id: 'animales', name: 'Animales', icon: '🐾' },
  { id: 'objetos', name: 'Objetos', icon: '🎮' },
];

export const DEFAULT_AVATARS = [
  // ═══════════════════════════════════════════════════
  // 🤖 ROBOTS / TECH (bottts style)
  // ═══════════════════════════════════════════════════
  {
    id: 'avatar-bot-1',
    name: 'Alpha',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=alpha-bot&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-2',
    name: 'Beta',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=beta-bot&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-3',
    name: 'Gamma',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=gamma-bot&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-4',
    name: 'Delta',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=delta-bot&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-5',
    name: 'Omega',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=omega-bot&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-6',
    name: 'Cyber',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=cyber-punk&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-7',
    name: 'Mech',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=mech-warrior&backgroundColor=transparent',
  },
  {
    id: 'avatar-bot-8',
    name: 'Android',
    category: 'robots',
    src: 'https://api.dicebear.com/7.x/bottts/svg?seed=android-x&backgroundColor=transparent',
  },

  // ═══════════════════════════════════════════════════
  // 👩 FEMENINO (lorelei style)
  // ═══════════════════════════════════════════════════
  {
    id: 'avatar-fem-1',
    name: 'Sakura',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=sakura-gamer&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-2',
    name: 'Luna',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=luna-night&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-3',
    name: 'Aurora',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=aurora-light&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-4',
    name: 'Crystal',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=crystal-ice&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-5',
    name: 'Nova',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=nova-star&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-6',
    name: 'Violet',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=violet-shade&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-7',
    name: 'Ember',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ember-fire&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-8',
    name: 'Ivy',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=ivy-nature&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-9',
    name: 'Stella',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=stella-cosmos&backgroundColor=transparent',
  },
  {
    id: 'avatar-fem-10',
    name: 'Aria',
    category: 'femenino',
    src: 'https://api.dicebear.com/7.x/lorelei/svg?seed=aria-melody&backgroundColor=transparent',
  },

  // ═══════════════════════════════════════════════════
  // 👨 MASCULINO (personas style)
  // ═══════════════════════════════════════════════════
  {
    id: 'avatar-masc-1',
    name: 'Shadow',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=shadow-hunter&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-2',
    name: 'Blaze',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=blaze-fire&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-3',
    name: 'Storm',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=storm-lord&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-4',
    name: 'Phantom',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=phantom-ghost&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-5',
    name: 'Viper',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=viper-snake&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-6',
    name: 'Titan',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=titan-power&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-7',
    name: 'Ace',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=ace-pilot&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-8',
    name: 'Neo',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=neo-matrix&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-9',
    name: 'Raven',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=raven-dark&backgroundColor=transparent',
  },
  {
    id: 'avatar-masc-10',
    name: 'Cipher',
    category: 'masculino',
    src: 'https://api.dicebear.com/7.x/personas/svg?seed=cipher-code&backgroundColor=transparent',
  },

  // ═══════════════════════════════════════════════════
  // 🐾 ANIMALES (fun-emoji style)
  // ═══════════════════════════════════════════════════
  {
    id: 'avatar-animal-1',
    name: 'Lobo',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=wolf-alpha&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-2',
    name: 'Dragón',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=dragon-fire&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-3',
    name: 'Fénix',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=phoenix-bird&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-4',
    name: 'Tigre',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=tiger-wild&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-5',
    name: 'Búho',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=owl-night&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-6',
    name: 'León',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=lion-king&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-7',
    name: 'Zorro',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=fox-clever&backgroundColor=transparent',
  },
  {
    id: 'avatar-animal-8',
    name: 'Panda',
    category: 'animales',
    src: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=panda-chill&backgroundColor=transparent',
  },

  // ═══════════════════════════════════════════════════
  // 🎮 OBJETOS / GAMING (icons style)
  // ═══════════════════════════════════════════════════
  {
    id: 'avatar-obj-1',
    name: 'Espada',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=sword-blade&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-2',
    name: 'Escudo',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=shield-guard&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-3',
    name: 'Corona',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=crown-king&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-4',
    name: 'Rayo',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=lightning-bolt&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-5',
    name: 'Diamante',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=diamond-gem&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-6',
    name: 'Fuego',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=fire-flame&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-7',
    name: 'Estrella',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=star-bright&backgroundColor=transparent',
  },
  {
    id: 'avatar-obj-8',
    name: 'Cráneo',
    category: 'objetos',
    src: 'https://api.dicebear.com/7.x/icons/svg?seed=skull-death&backgroundColor=transparent',
  },
];

export const STATUS_LIST = [
  { id: 'online',     label: 'En Línea',        icon: 'bx-check-circle',   color: '#10b981', desc: 'Disponible para jugar' },
  { id: 'gaming',     label: 'Jugando',          icon: 'bx-joystick',       color: '#8b5cf6', desc: 'En partida ahora' },
  { id: 'tournament', label: 'En Torneo',        icon: 'bx-trophy',         color: '#fbbf24', desc: 'Compitiendo en torneo' },
  { id: 'streaming',  label: 'En Directo',       icon: 'bx-broadcast',      color: '#ef4444', desc: 'Transmitiendo en vivo' },
  { id: 'searching',  label: 'Buscando Equipo',  icon: 'bx-radar',          color: '#06b6d4', desc: 'Buscando compañeros' },
  { id: 'afk',        label: 'AFK',              icon: 'bx-moon',           color: '#f97316', desc: 'Lejos del teclado' },
  { id: 'dnd',        label: 'No Molestar',      icon: 'bx-block',          color: '#dc2626', desc: 'Sin notificaciones' },
  { id: 'offline',    label: 'Invisible',         icon: 'bx-hide',           color: '#6b7280', desc: 'Aparecer desconectado' },
];
