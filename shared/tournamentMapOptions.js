import { normalizeSupportedGameName } from './supportedGames.js';

const normalizeMapToken = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase();

const toOption = (value) => {
  const label = String(value || '').trim();
  return { value: label, label };
};

const dedupeOptions = (options = []) => {
  const seen = new Set();
  return options.filter((option) => {
    const key = normalizeMapToken(option?.value || option?.label);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const TOURNAMENT_MAP_OPTIONS_BY_GAME = {
  Valorant: [
    'Ascent',
    'Bind',
    'Haven',
    'Split',
    'Icebox',
    'Lotus',
    'Sunset',
    'Breeze',
    'Fracture',
    'Pearl',
    'Abyss'
  ],
  'League of Legends': [
    "Summoner's Rift",
    'Howling Abyss'
  ],
  'Mobile Legends': [
    'Land of Dawn'
  ]
};

export const getTournamentMapOptions = (game = '', includeValues = []) => {
  const canonicalGame = normalizeSupportedGameName(game) || String(game || '').trim();
  const baseOptions = (TOURNAMENT_MAP_OPTIONS_BY_GAME[canonicalGame] || []).map(toOption);
  const legacyOptions = (Array.isArray(includeValues) ? includeValues : [includeValues])
    .map(toOption);

  return dedupeOptions([...legacyOptions, ...baseOptions]);
};

export const normalizeTournamentMap = (game = '', value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const options = getTournamentMapOptions(game);
  const normalizedRaw = normalizeMapToken(raw);
  const match = options.find((option) => normalizeMapToken(option.value) === normalizedRaw);

  return match ? match.value : raw;
};

export const normalizeTournamentMapPool = (game = '', value = []) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const seen = new Set();
  const normalized = [];

  list.forEach((entry) => {
    const mapName = normalizeTournamentMap(game, entry);
    const key = normalizeMapToken(mapName);
    if (!key || seen.has(key)) return;
    seen.add(key);
    normalized.push(mapName);
  });

  return normalized;
};

export const hasTournamentMapOptions = (game = '') => getTournamentMapOptions(game).length > 0;
