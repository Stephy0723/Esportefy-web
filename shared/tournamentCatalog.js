const normalizeLookupKey = (value = '') =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const TOURNAMENT_FORMAT_OPTIONS = Object.freeze([
  { value: 'single_elimination', label: 'Eliminación Directa' },
  { value: 'double_elimination', label: 'Doble Eliminación' },
  { value: 'swiss', label: 'Suizo (Swiss)' },
  { value: 'round_robin', label: 'Round Robin' }
]);

export const TOURNAMENT_ALLOWED_FORMAT_VALUES = Object.freeze(
  TOURNAMENT_FORMAT_OPTIONS.map((option) => option.value)
);

export const TOURNAMENT_PLATFORM_OPTIONS = Object.freeze([
  { value: 'PC', label: 'PC' },
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Console', label: 'Consola' },
  { value: 'Crossplay', label: 'Crossplay' }
]);

export const TOURNAMENT_STAFF_ROLE_OPTIONS = Object.freeze([
  { value: 'admin', label: 'Administrador', desc: 'Control total del torneo', icon: 'bx-crown', color: '#ef4444' },
  { value: 'moderator', label: 'Moderador', desc: 'Gestión de equipos y reportes', icon: 'bx-shield', color: '#8EDB15' },
  { value: 'referee', label: 'Árbitro', desc: 'Supervisión de partidas', icon: 'bx-bullseye', color: '#f59e0b' },
  { value: 'caster', label: 'Caster', desc: 'Narrador del torneo', icon: 'bx-microphone', color: '#3b82f6' },
  { value: 'producer', label: 'Productor', desc: 'Producción de stream', icon: 'bx-camera-movie', color: '#a855f7' },
  { value: 'coach', label: 'Coach', desc: 'Apoyo competitivo del equipo', icon: 'bx-user-voice', color: '#14b8a6' },
  { value: 'analyst', label: 'Analista', desc: 'Análisis táctico y scouting', icon: 'bx-line-chart', color: '#f97316' },
  { value: 'content-creator', label: 'Creador de contenido', desc: 'Cobertura y clips del torneo', icon: 'bx-video-recording', color: '#ec4899' },
  { value: 'organizer', label: 'Organizador', desc: 'Coordinación general del evento', icon: 'bx-briefcase', color: '#64748b' }
]);

const TOURNAMENT_FORMAT_MAP = new Map(
  TOURNAMENT_FORMAT_OPTIONS.map((option) => [normalizeLookupKey(option.value), option.value])
);

const TOURNAMENT_PLATFORM_MAP = new Map(
  TOURNAMENT_PLATFORM_OPTIONS.map((option) => [normalizeLookupKey(option.value), option.value])
);

const TOURNAMENT_STAFF_ROLE_MAP = new Map(
  TOURNAMENT_STAFF_ROLE_OPTIONS.map((option) => [normalizeLookupKey(option.value), option.value])
);

const TOURNAMENT_FORMAT_ALIASES = new Map([
  ['eliminacion directa', 'single_elimination'],
  ['single elimination', 'single_elimination'],
  ['simple elimination', 'single_elimination'],
  ['doble eliminacion', 'double_elimination'],
  ['double elimination', 'double_elimination'],
  ['suizo', 'swiss'],
  ['sistema suizo', 'swiss'],
  ['round robin', 'round_robin'],
  ['todos contra todos', 'round_robin']
]);

const TOURNAMENT_PLATFORM_ALIASES = new Map([
  ['pc', 'PC'],
  ['mobile', 'Mobile'],
  ['console', 'Console'],
  ['consola', 'Console'],
  ['crossplay', 'Crossplay']
]);

const TOURNAMENT_STAFF_ROLE_ALIASES = new Map([
  ['mod', 'moderator'],
  ['moderador', 'moderator'],
  ['arbitro', 'referee'],
  ['analista', 'analyst'],
  ['creador de contenido', 'content-creator'],
  ['productor', 'producer'],
  ['organizador', 'organizer'],
  ['administrador', 'admin']
]);

const normalizeFromMap = (value, map, aliases = null, fallback = '') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const lookupKey = normalizeLookupKey(raw);
  if (aliases?.has(lookupKey)) return aliases.get(lookupKey);

  return map.get(lookupKey) || fallback;
};

export const normalizeTournamentFormat = (value, fallback = 'single_elimination') =>
  normalizeFromMap(value, TOURNAMENT_FORMAT_MAP, TOURNAMENT_FORMAT_ALIASES, fallback);

export const normalizeTournamentPlatform = (value, fallback = 'PC') =>
  normalizeFromMap(value, TOURNAMENT_PLATFORM_MAP, TOURNAMENT_PLATFORM_ALIASES, fallback);

export const normalizeTournamentStaffRole = (value, fallback = 'moderator') =>
  normalizeFromMap(value, TOURNAMENT_STAFF_ROLE_MAP, TOURNAMENT_STAFF_ROLE_ALIASES, fallback);

export const getTournamentFormatLabel = (value = '') => {
  const normalized = normalizeTournamentFormat(value, '');
  return TOURNAMENT_FORMAT_OPTIONS.find((option) => option.value === normalized)?.label || value || '';
};

const buildRoleSubset = (values) =>
  Object.freeze(TOURNAMENT_STAFF_ROLE_OPTIONS.filter((option) => values.includes(option.value)));

export const TOURNAMENT_CREATOR_STAFF_ROLE_OPTIONS = buildRoleSubset([
  'moderator',
  'caster',
  'coach',
  'analyst'
]);

export const TOURNAMENT_ADMIN_STAFF_ROLE_OPTIONS = buildRoleSubset([
  'admin',
  'moderator',
  'referee',
  'caster',
  'producer'
]);
