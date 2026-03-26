const normalizeText = (value = '') => String(value || '').trim();

export const UNIVERSITY_REGION_OPTIONS = Object.freeze([
  { id: 'rd', name: 'República Dominicana', flag: '🇩🇴', short: 'RD' },
  { id: 'caribe', name: 'El Caribe', flag: '🌴', short: 'Caribe' },
  { id: 'latam', name: 'Latinoamérica', flag: '🌎', short: 'LATAM' },
  { id: 'americas', name: 'América', flag: '🗽', short: 'América' }
]);

export const UNIVERSITY_ENABLED_REGION = 'rd';

export const UNIVERSITY_ALLOWED_GAME_NAMES = Object.freeze([
  'Valorant',
  'League of Legends',
  'Mobile Legends',
  'Mobile Legends: Bang Bang',
  'MLBB'
]);

export const PUBLIC_EMAIL_DOMAIN_LIST = Object.freeze([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com'
]);

export const PUBLIC_EMAIL_DOMAINS = new Set(PUBLIC_EMAIL_DOMAIN_LIST);

export const ACADEMIC_LEVEL_OPTIONS = Object.freeze([
  { value: '1', label: '1er año' },
  { value: '2', label: '2do año' },
  { value: '3', label: '3er año' },
  { value: '4', label: '4to año' },
  { value: 'egresado', label: 'Egresado' },
  { value: 'maestria', label: 'Maestría' }
]);

export const ALLOWED_ACADEMIC_LEVELS = new Set(
  ACADEMIC_LEVEL_OPTIONS.map((option) => option.value)
);

export const normalizeUniversityGameName = (value = '') =>
  normalizeText(value).toLowerCase();

const UNIVERSITY_ALLOWED_GAMES_SET = new Set(
  UNIVERSITY_ALLOWED_GAME_NAMES.map((game) => normalizeUniversityGameName(game))
);

export const isUniversityAllowedGame = (game = '') =>
  UNIVERSITY_ALLOWED_GAMES_SET.has(normalizeUniversityGameName(game));

export const getEmailDomain = (value = '') => {
  const email = normalizeText(value).toLowerCase();
  const atIndex = email.lastIndexOf('@');
  return atIndex === -1 ? '' : email.slice(atIndex + 1);
};
