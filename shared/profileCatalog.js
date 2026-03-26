const normalizeLookupKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const GENDER_OPTIONS = Object.freeze([
  { id: 'Masculino', label: 'Masculino' },
  { id: 'Femenino', label: 'Femenino' },
  { id: 'Otro', label: 'Otro' }
]);

export const PLATFORM_OPTIONS = Object.freeze([
  { id: 'pc', name: 'PC', icon: 'bx-laptop' },
  { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
  { id: 'console', name: 'Consola', icon: 'bx-joystick' }
]);

export const GOAL_OPTIONS = Object.freeze([
  { id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' },
  { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' },
  { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }
]);

export const EXPERIENCE_LEVELS = Object.freeze([
  { id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' },
  { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' },
  { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }
]);

export const LANGUAGE_OPTIONS = Object.freeze([
  { id: 'Español', label: 'Español', flag: '🇪🇸' },
  { id: 'English', label: 'English', flag: '🇺🇸' },
  { id: 'Português', label: 'Português', flag: '🇧🇷' },
  { id: 'Français', label: 'Français', flag: '🇫🇷' },
  { id: 'Deutsch', label: 'Deutsch', flag: '🇩🇪' },
  { id: 'Italiano', label: 'Italiano', flag: '🇮🇹' }
]);

const buildAllowedMap = (options = []) => {
  const map = new Map();
  options.forEach((option) => {
    map.set(normalizeLookupKey(option.id), option.id);
  });
  return map;
};

const GENDER_MAP = buildAllowedMap(GENDER_OPTIONS);
const PLATFORM_MAP = buildAllowedMap(PLATFORM_OPTIONS);
const GOAL_MAP = buildAllowedMap(GOAL_OPTIONS);
const EXPERIENCE_MAP = buildAllowedMap(EXPERIENCE_LEVELS);
const LANGUAGE_MAP = buildAllowedMap(LANGUAGE_OPTIONS);

const normalizeFromMap = (value, map, fallback = '') => {
  const normalized = map.get(normalizeLookupKey(value));
  return normalized || fallback;
};

const normalizeArrayFromMap = (value, map) => {
  const list = Array.isArray(value) ? value : value == null || value === '' ? [] : [value];
  const seen = new Set();
  const normalized = [];

  list.forEach((entry) => {
    const canonical = normalizeFromMap(entry, map);
    if (!canonical || seen.has(canonical)) return;
    seen.add(canonical);
    normalized.push(canonical);
  });

  return normalized;
};

export const normalizeGenderValue = (value, fallback = 'Otro') =>
  normalizeFromMap(value, GENDER_MAP, fallback);

export const normalizePlatformValues = (value) =>
  normalizeArrayFromMap(value, PLATFORM_MAP);

export const normalizeGoalValues = (value) =>
  normalizeArrayFromMap(value, GOAL_MAP);

export const normalizeExperienceValues = (value) =>
  normalizeArrayFromMap(value, EXPERIENCE_MAP);

export const normalizeLanguageValues = (value) =>
  normalizeArrayFromMap(value, LANGUAGE_MAP);
