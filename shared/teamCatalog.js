import { COUNTRY_OPTIONS, normalizeCountryName } from './countries.js';
import { LANGUAGE_OPTIONS } from './profileCatalog.js';

const normalizeLookupKey = (value = '') =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[()]/g, '')
    .replace(/[-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const TEAM_GENDER_OPTIONS = Object.freeze([
  { id: 'Mixto', label: 'Mixto (Cualquiera)' },
  { id: 'Masculino', label: 'Masculino' },
  { id: 'Femenino', label: 'Femenino' }
]);

export const TEAM_LEVEL_OPTIONS = Object.freeze([
  { id: 'Casual', label: 'Casual / Fun' },
  { id: 'Amateur', label: 'Amateur (Torneos Menores)' },
  { id: 'Universitario', label: 'Universitario (Institucional)' },
  { id: 'Semi-Pro', label: 'Semi-Pro (Ligas)' },
  { id: 'Profesional', label: 'Profesional (Tier 1)' },
  { id: 'Leyenda', label: 'Leyenda (Elite)' }
]);

export const TEAM_LANGUAGE_OPTIONS = Object.freeze(
  LANGUAGE_OPTIONS.map(({ id, label }) => ({ id, label }))
);

export const TEAM_COUNTRY_OPTIONS = Object.freeze([...COUNTRY_OPTIONS, 'Internacional']);

const buildAllowedMap = (options = []) => {
  const map = new Map();
  options.forEach((option) => {
    map.set(normalizeLookupKey(option.id), option.id);
  });
  return map;
};

const GENDER_MAP = buildAllowedMap(TEAM_GENDER_OPTIONS);
const LEVEL_MAP = buildAllowedMap(TEAM_LEVEL_OPTIONS);
const LANGUAGE_MAP = buildAllowedMap(TEAM_LANGUAGE_OPTIONS);

const TEAM_COUNTRY_ALIASES = new Map([
  ['internacional', 'Internacional'],
  ['international', 'Internacional'],
  ['global', 'Internacional'],
  ['worldwide', 'Internacional']
]);

const LEVEL_ALIASES = new Map([
  ['leyenda elite', 'Leyenda'],
  ['semi pro', 'Semi-Pro'],
  ['universitario institucional', 'Universitario']
]);

const LANGUAGE_ALIASES = new Map([
  ['espanol', 'Español'],
  ['spanish', 'Español'],
  ['ingles', 'English'],
  ['portugues', 'Português'],
  ['portuguese', 'Português'],
  ['frances', 'Français'],
  ['french', 'Français']
]);

const normalizeFromMap = (value, map, aliases = null, fallback = '') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const lookupKey = normalizeLookupKey(raw);
  if (aliases?.has(lookupKey)) return aliases.get(lookupKey);

  const canonical = map.get(lookupKey);
  return canonical || fallback;
};

export const normalizeTeamGender = (value, fallback = 'Mixto') =>
  normalizeFromMap(value, GENDER_MAP, null, fallback);

export const normalizeTeamLevel = (value, fallback = '') =>
  normalizeFromMap(value, LEVEL_MAP, LEVEL_ALIASES, fallback);

export const normalizeTeamLanguage = (value, fallback = '') => {
  const canonical = normalizeFromMap(value, LANGUAGE_MAP, LANGUAGE_ALIASES, '');
  if (canonical) return canonical;
  const raw = String(value || '').trim();
  return raw || fallback;
};

export const normalizeTeamCountry = (value, { allowCustom = true } = {}) => {
  const canonicalCountry = normalizeCountryName(value, { allowCustom: false });
  if (canonicalCountry) return canonicalCountry;

  const raw = String(value || '').trim();
  if (!raw) return '';

  const aliasCountry = TEAM_COUNTRY_ALIASES.get(normalizeLookupKey(raw));
  if (aliasCountry) return aliasCountry;

  return allowCustom ? raw : '';
};
