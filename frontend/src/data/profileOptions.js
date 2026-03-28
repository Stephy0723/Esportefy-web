// src/data/profileOptions.js
import { getBackgroundUnlockByIndex, getUnlockLabel } from '../utils/backgroundUnlocks';

// ── Rarity config ──
export const RARITY_CONFIG = {
  common:    { label: 'Común',      color: '#9ca3af', glow: 'rgba(156,163,175,.35)' },
  rare:      { label: 'Raro',       color: '#3b82f6', glow: 'rgba(59,130,246,.40)' },
  epic:      { label: 'Épico',      color: '#a855f7', glow: 'rgba(168,85,247,.45)' },
  legendary: { label: 'Legendario', color: '#f59e0b', glow: 'rgba(245,158,11,.50)' },
  mythic:    { label: 'Mítico',     color: '#ef4444', glow: 'rgba(239,68,68,.55)' },
};

/**
 * unlock types:
 *  - 'default'              → available to everyone
 *  - 'referrals:N'          → N referrals
 *  - 'tournament_win:N'     → N tournament wins
 *  - 'tournament_play:N'    → N tournaments played
 *  - 'matches:N'            → N matches played
 *  - 'wins:N'               → N wins
 *  - 'teams:N'              → member of N teams
 *  - 'communities:N'        → joined N communities
 *  - 'friends:N'            → N friends
 *  - 'level:N'              → reach level N
 *  - 'streak:N'             → N win streak
 *  - 'role:X'               → have role X
 *  - 'founder'              → early adopter / founder
 *  - 'event:X'              → special event
 *  - 'admin_only'           → only via admin grant
 */

export const FRAMES = [
  // ═══════════════════════════════════════
  //  COMMON (15 frames) — easy to unlock
  // ═══════════════════════════════════════
  {
    id: 'none',
    name: 'Sin Marco',
    type: 'none',
    color: '#cccccc',
    rarity: 'common',
    unlock: 'default',
    unlockLabel: 'Disponible para todos',
    desc: 'Estilo clásico y limpio.',
  },
  {
    id: 'neon-storm',
    name: 'Neon Storm',
    type: 'css',
    color: '#00f2ff',
    rarity: 'common',
    unlock: 'default',
    unlockLabel: 'Disponible para todos',
    desc: 'Energía eléctrica vibrante.',
  },
  {
    id: 'celestial-dream',
    name: 'Celestial',
    type: 'css',
    color: '#ffc3a0',
    rarity: 'common',
    unlock: 'default',
    unlockLabel: 'Disponible para todos',
    desc: 'Suavidad etérea y nubes.',
  },
  {
    id: 'nature-bloom',
    name: 'Nature Bloom',
    type: 'css',
    color: '#50c878',
    rarity: 'common',
    unlock: 'default',
    unlockLabel: 'Disponible para todos',
    desc: 'Hojas y naturaleza viva.',
  },
  {
    id: 'cloud-nine',
    name: 'Cielo',
    type: 'css',
    color: '#89cff0',
    rarity: 'common',
    unlock: 'default',
    unlockLabel: 'Disponible para todos',
    desc: 'Esponjoso como una nube.',
  },
  {
    id: 'snow-angel',
    name: 'Snow Angel',
    type: 'css',
    color: '#a5f2f3',
    rarity: 'common',
    unlock: 'matches:1',
    unlockLabel: 'Juega 1 partida',
    desc: 'Copos de nieve cayendo suavemente.',
  },
  {
    id: 'petal-cascade',
    name: 'Rose Rain',
    type: 'css',
    color: '#ffb7c5',
    rarity: 'common',
    unlock: 'matches:3',
    unlockLabel: 'Juega 3 partidas',
    desc: 'Pétalos de rosa bailando al caer.',
  },
  {
    id: 'porcelain-doll',
    name: 'Porcelana',
    type: 'css',
    color: '#fff0f5',
    rarity: 'common',
    unlock: 'friends:3',
    unlockLabel: 'Agrega 3 amigos',
    desc: 'Delicado patrón floral blanco.',
  },
  {
    id: 'soft-mint',
    name: 'Menta Suave',
    type: 'css',
    color: '#98ffc4',
    rarity: 'common',
    unlock: 'friends:5',
    unlockLabel: 'Agrega 5 amigos',
    desc: 'Frescura mentolada y suave.',
  },
  {
    id: 'sunset-glow',
    name: 'Atardecer',
    type: 'css',
    color: '#ff7e5f',
    rarity: 'common',
    unlock: 'communities:1',
    unlockLabel: 'Únete a 1 comunidad',
    desc: 'Colores cálidos de atardecer.',
  },
  {
    id: 'copper-wire',
    name: 'Cobre',
    type: 'css',
    color: '#b87333',
    rarity: 'common',
    unlock: 'teams:1',
    unlockLabel: 'Únete a 1 equipo',
    desc: 'Brillo cobrizo industrial.',
  },
  {
    id: 'ocean-breeze',
    name: 'Brisa Marina',
    type: 'css',
    color: '#0077b6',
    rarity: 'common',
    unlock: 'wins:1',
    unlockLabel: 'Gana 1 partida',
    desc: 'Olas suaves del océano.',
  },
  {
    id: 'lavender-haze',
    name: 'Lavanda',
    type: 'css',
    color: '#b4a7d6',
    rarity: 'common',
    unlock: 'wins:3',
    unlockLabel: 'Gana 3 partidas',
    desc: 'Neblina púrpura relajante.',
  },
  {
    id: 'ember-spark',
    name: 'Chispa',
    type: 'css',
    color: '#ff6b35',
    rarity: 'common',
    unlock: 'referrals:1',
    unlockLabel: 'Invita 1 amigo',
    desc: 'Pequeñas chispas ardientes.',
  },
  {
    id: 'steel-basic',
    name: 'Acero',
    type: 'css',
    color: '#71797e',
    rarity: 'common',
    unlock: 'tournament_play:1',
    unlockLabel: 'Participa en 1 torneo',
    desc: 'Acabado de acero pulido.',
  },

  // ═══════════════════════════════════════
  //  RARE (12 frames) — moderate effort
  // ═══════════════════════════════════════
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    type: 'css',
    color: '#ffd700',
    rarity: 'rare',
    unlock: 'wins:10',
    unlockLabel: 'Gana 10 partidas',
    desc: 'Elegancia dorada nocturna.',
  },
  {
    id: 'prism-tech',
    name: 'Prism Tech',
    type: 'css',
    color: '#ff0055',
    rarity: 'rare',
    unlock: 'matches:15',
    unlockLabel: 'Juega 15 partidas',
    desc: 'Formas geométricas afiladas.',
  },
  {
    id: 'frozen-shard',
    name: 'Frozen',
    type: 'css',
    color: '#a5f2f3',
    rarity: 'rare',
    unlock: 'wins:15',
    unlockLabel: 'Gana 15 partidas',
    desc: 'Fragmentos de hielo afilados.',
  },
  {
    id: 'retro-arcade',
    name: '8-Bit',
    type: 'css',
    color: '#ff00ff',
    rarity: 'rare',
    unlock: 'matches:25',
    unlockLabel: 'Juega 25 partidas',
    desc: 'Estilo pixelado nostálgico.',
  },
  {
    id: 'fairy-dust-glam',
    name: 'Fairy',
    type: 'css',
    color: '#e6e6fa',
    rarity: 'rare',
    unlock: 'friends:15',
    unlockLabel: 'Agrega 15 amigos',
    desc: 'Polvo de hadas lavanda.',
  },
  {
    id: 'iron-guardian',
    name: 'Guardian',
    type: 'css',
    color: '#b0c4de',
    rarity: 'rare',
    unlock: 'tournament_play:3',
    unlockLabel: 'Participa en 3 torneos',
    desc: 'Armadura de acero forjado.',
  },
  {
    id: 'toxic-neon',
    name: 'Tóxico',
    type: 'css',
    color: '#39ff14',
    rarity: 'rare',
    unlock: 'referrals:5',
    unlockLabel: 'Invita 5 amigos',
    desc: 'Verde neón radioactivo.',
  },
  {
    id: 'cherry-blossom',
    name: 'Sakura',
    type: 'css',
    color: '#ffb7c5',
    rarity: 'rare',
    unlock: 'communities:3',
    unlockLabel: 'Únete a 3 comunidades',
    desc: 'Flores de cerezo japonesas.',
  },
  {
    id: 'thunderbolt',
    name: 'Rayo',
    type: 'css',
    color: '#ffd700',
    rarity: 'rare',
    unlock: 'streak:3',
    unlockLabel: 'Racha de 3 victorias',
    desc: 'Relámpagos electrificantes.',
  },
  {
    id: 'shadow-veil',
    name: 'Sombra',
    type: 'css',
    color: '#2d2d2d',
    rarity: 'rare',
    unlock: 'teams:2',
    unlockLabel: 'Únete a 2 equipos',
    desc: 'Velo de sombras misteriosas.',
  },
  {
    id: 'crystal-blue',
    name: 'Cristal',
    type: 'css',
    color: '#4fc3f7',
    rarity: 'rare',
    unlock: 'wins:25',
    unlockLabel: 'Gana 25 partidas',
    desc: 'Cristales azules brillantes.',
  },
  {
    id: 'plasma-ring',
    name: 'Plasma',
    type: 'css',
    color: '#e040fb',
    rarity: 'rare',
    unlock: 'tournament_win:1',
    unlockLabel: 'Gana 1 torneo',
    desc: 'Anillo de plasma pulsante.',
  },

  // ═══════════════════════════════════════
  //  EPIC (10 frames) — significant effort
  // ═══════════════════════════════════════
  {
    id: 'galactic-orbit',
    name: 'Galactic',
    type: 'css',
    color: '#9400d3',
    rarity: 'epic',
    unlock: 'wins:50',
    unlockLabel: 'Gana 50 partidas',
    desc: 'Anillos orbitales giratorios.',
  },
  {
    id: 'glitch-hazard',
    name: 'Glitch',
    type: 'css',
    color: '#39ff14',
    rarity: 'epic',
    unlock: 'tournament_win:3',
    unlockLabel: 'Gana 3 torneos',
    desc: 'Distorsión digital y ruido.',
  },
  {
    id: 'inferno-rage',
    name: 'Inferno',
    type: 'css',
    color: '#ff4500',
    rarity: 'epic',
    unlock: 'tournament_win:5',
    unlockLabel: 'Gana 5 torneos',
    desc: 'Llamas vivas y humo.',
  },
  {
    id: 'dragon-scale',
    name: 'Dragon',
    type: 'css',
    color: '#dc143c',
    rarity: 'epic',
    unlock: 'wins:75',
    unlockLabel: 'Gana 75 partidas',
    desc: 'Escamas de dragón legendario.',
  },
  {
    id: 'berserker-rage',
    name: 'Berserker',
    type: 'css',
    color: '#8b0000',
    rarity: 'epic',
    unlock: 'streak:5',
    unlockLabel: 'Racha de 5 victorias',
    desc: 'Furia de batalla incontenible.',
  },
  {
    id: 'ancient-rune',
    name: 'Runic',
    type: 'css',
    color: '#00ffff',
    rarity: 'epic',
    unlock: 'referrals:20',
    unlockLabel: 'Invita 20 amigos',
    desc: 'Piedra antigua con runas brillantes.',
  },
  {
    id: 'void-eclipse',
    name: 'Eclipse',
    type: 'css',
    color: '#1a1a2e',
    rarity: 'epic',
    unlock: 'tournament_play:10',
    unlockLabel: 'Participa en 10 torneos',
    desc: 'Oscuridad total del eclipse.',
  },
  {
    id: 'phoenix-aura',
    name: 'Fénix',
    type: 'css',
    color: '#ff6f00',
    rarity: 'epic',
    unlock: 'matches:100',
    unlockLabel: 'Juega 100 partidas',
    desc: 'Aura de fénix renaciente.',
  },
  {
    id: 'nebula-drift',
    name: 'Nebulosa',
    type: 'css',
    color: '#7b2ff7',
    rarity: 'epic',
    unlock: 'friends:50',
    unlockLabel: 'Agrega 50 amigos',
    desc: 'Gases cósmicos en movimiento.',
  },
  {
    id: 'samurai-honor',
    name: 'Samurai',
    type: 'css',
    color: '#c0392b',
    rarity: 'epic',
    unlock: 'role:organizer',
    unlockLabel: 'Rol de Organizador',
    desc: 'Honor del guerrero samurai.',
  },

  // ═══════════════════════════════════════
  //  LEGENDARY (8 frames) — elite achievements
  // ═══════════════════════════════════════
  {
    id: 'royal-crown',
    name: 'King',
    type: 'css',
    color: '#ffd700',
    rarity: 'legendary',
    unlock: 'tournament_win:10',
    unlockLabel: 'Gana 10 torneos',
    desc: 'Oro real y terciopelo azul.',
  },
  {
    id: 'celestial-throne',
    name: 'Trono Celestial',
    type: 'css',
    color: '#ffeaa7',
    rarity: 'legendary',
    unlock: 'wins:150',
    unlockLabel: 'Gana 150 partidas',
    desc: 'Trono dorado entre las estrellas.',
  },
  {
    id: 'supernova-burst',
    name: 'Supernova',
    type: 'css',
    color: '#ff006e',
    rarity: 'legendary',
    unlock: 'streak:10',
    unlockLabel: 'Racha de 10 victorias',
    desc: 'Explosión estelar devastadora.',
  },
  {
    id: 'dark-sovereign',
    name: 'Soberano Oscuro',
    type: 'css',
    color: '#4a0072',
    rarity: 'legendary',
    unlock: 'referrals:50',
    unlockLabel: 'Invita 50 amigos',
    desc: 'Poder absoluto de la oscuridad.',
  },
  {
    id: 'titan-forge',
    name: 'Titán',
    type: 'css',
    color: '#ff8c00',
    rarity: 'legendary',
    unlock: 'tournament_win:15',
    unlockLabel: 'Gana 15 torneos',
    desc: 'Forjado en la fragua de los titanes.',
  },
  {
    id: 'diamond-crown',
    name: 'Diamante',
    type: 'css',
    color: '#b9f2ff',
    rarity: 'legendary',
    unlock: 'matches:200',
    unlockLabel: 'Juega 200 partidas',
    desc: 'Corona de diamante puro.',
  },
  {
    id: 'war-legend',
    name: 'Leyenda de Guerra',
    type: 'css',
    color: '#c0392b',
    rarity: 'legendary',
    unlock: 'tournament_play:25',
    unlockLabel: 'Participa en 25 torneos',
    desc: 'Veterano de mil batallas.',
  },
  {
    id: 'eternal-flame',
    name: 'Llama Eterna',
    type: 'css',
    color: '#ff4500',
    rarity: 'legendary',
    unlock: 'wins:200',
    unlockLabel: 'Gana 200 partidas',
    desc: 'Fuego que nunca se apaga.',
  },

  // ═══════════════════════════════════════
  //  MYTHIC (5 frames) — ultra rare / unique
  // ═══════════════════════════════════════
  {
    id: 'glitchgang-og',
    name: 'GG Founder',
    type: 'css',
    color: '#ff00ff',
    rarity: 'mythic',
    unlock: 'founder',
    unlockLabel: 'Miembro fundador de GlitchGang',
    desc: 'Exclusivo para los fundadores originales.',
  },
  {
    id: 'champion-supreme',
    name: 'Campeón Supremo',
    type: 'css',
    color: '#ffd700',
    rarity: 'mythic',
    unlock: 'tournament_win:25',
    unlockLabel: 'Gana 25 torneos',
    desc: 'El campeón de campeones.',
  },
  {
    id: 'cosmic-emperor',
    name: 'Emperador Cósmico',
    type: 'css',
    color: '#e040fb',
    rarity: 'mythic',
    unlock: 'referrals:100',
    unlockLabel: 'Invita 100 amigos',
    desc: 'Gobernante del cosmos digital.',
  },
  {
    id: 'omega-glitch',
    name: 'Omega Glitch',
    type: 'css',
    color: '#39ff14',
    rarity: 'mythic',
    unlock: 'admin_only',
    unlockLabel: 'Otorgado por administrador',
    desc: 'El error definitivo del sistema.',
  },
  {
    id: 'oblivion-void',
    name: 'Oblivion',
    type: 'css',
    color: '#0d0d0d',
    rarity: 'mythic',
    unlock: 'admin_only',
    unlockLabel: 'Otorgado por administrador',
    desc: 'El vacío absoluto. Sin retorno.',
  },
];


// ... (El código de BACKGROUNDS déjalo como estaba arreglado) ...
const bannersGlob = import.meta.glob('../assets/bannerGamer/*.jpg', { eager: true, import: 'default' });

export const BACKGROUNDS = Object.entries(bannersGlob)
  .map(([path, src], index) => {
    const fileName = path.split('/').pop().replace('.jpg', '');
    const backgroundOrder = Math.max((parseInt(fileName || 0, 10) || 1) - 1, index);
    const unlock = getBackgroundUnlockByIndex(backgroundOrder);
    return {
      id: `bg-${fileName}`,
      name: `Fondo ${fileName}`,
      src,
      image: src,
      unlock,
      unlockLabel: getUnlockLabel(unlock)
    };
  })
  .sort((a, b) => {
    const numA = parseInt(a.id.replace('bg-', '') || 0);
    const numB = parseInt(b.id.replace('bg-', '') || 0);
    return numA - numB;
  });
