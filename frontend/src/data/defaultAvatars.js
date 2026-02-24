/* ═══════════════════════════════════════════════════
   DEFAULT AVATARS — 5 static profile pictures
   For users who don't want to upload a photo
   Uses DiceBear API (free, no auth, SVG avatars)
   ═══════════════════════════════════════════════════ */

export const DEFAULT_AVATARS = [
  {
    id: 'avatar-warrior',
    name: 'Guerrero',
    src: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=warrior&backgroundColor=1a1a2e',
  },
  {
    id: 'avatar-mage',
    name: 'Hechicero',
    src: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=wizard&backgroundColor=2d1b4e',
  },
  {
    id: 'avatar-rogue',
    name: 'Pícaro',
    src: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=rogue&backgroundColor=0a1a0a',
  },
  {
    id: 'avatar-hunter',
    name: 'Cazador',
    src: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=hunter&backgroundColor=0d0221',
  },
  {
    id: 'avatar-tank',
    name: 'Tanque',
    src: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=titan&backgroundColor=1a0000',
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
