import { normalizeSupportedGameId } from './supportedGames.js';

const normalizeToken = (value = '') =>
  String(value || '')
    .trim()
    .toLowerCase();

const normalizeTextValue = (value = '', max = 60) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, max);

const normalizeSelectValue = (value = '', options = []) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = (Array.isArray(options) ? options : []).find(
    (option) => normalizeToken(option) === normalizeToken(raw)
  );
  return match || '';
};

const MANUAL_COMPETITIVE_PROFILE_SPECS = {
  fortnite: {
    title: 'Fortnite',
    badge: 'Battle Royale',
    fields: [
      { key: 'epicHandle', label: 'Epic / IGN', placeholder: 'Tu handle competitivo', max: 40 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'Console', 'Crossplay'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'BR', 'EU', 'MENA', 'Global'] },
      { key: 'input', label: 'Input', type: 'select', options: ['Controller', 'Keyboard & Mouse'] },
      { key: 'roleFocus', label: 'Rol principal', type: 'select', options: ['IGL', 'Fragger', 'Support', 'Flex'] },
    ],
  },
  warzone: {
    title: 'Warzone',
    badge: 'Battle Royale',
    fields: [
      { key: 'activisionId', label: 'Activision ID', placeholder: 'Tu ID competitivo', max: 40 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'Console', 'Crossplay'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'BR', 'EU', 'MENA', 'Global'] },
      { key: 'roleFocus', label: 'Rol principal', type: 'select', options: ['IGL', 'Fragger', 'Support', 'Flex'] },
    ],
  },
  rocket: {
    title: 'Rocket League',
    badge: 'Sports',
    fields: [
      { key: 'epicHandle', label: 'Epic / RL tag', placeholder: 'Tu tag competitivo', max: 40 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'Console', 'Crossplay'] },
      { key: 'region', label: 'Region', type: 'select', options: ['SAM', 'NA', 'EU', 'MENA', 'OCE'] },
      { key: 'roleFocus', label: 'Rol principal', type: 'select', options: ['Striker', 'Support', 'Flex'] },
      { key: 'mainCar', label: 'Carro main', placeholder: 'Octane, Fennec, etc.', max: 32 },
    ],
  },
  fifa: {
    title: 'EA FC / FIFA',
    badge: 'Sports',
    fields: [
      { key: 'eaId', label: 'EA ID / tag', placeholder: 'Tu ID competitivo', max: 40 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PlayStation', 'Xbox', 'PC', 'Console'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'MENA', 'Global'] },
      { key: 'favoriteClub', label: 'Club / seleccion', placeholder: 'Tu club o seleccion principal', max: 40 },
    ],
  },
  smash: {
    title: 'Smash Bros',
    badge: 'Fighting',
    fields: [
      { key: 'tag', label: 'Tag competitivo', placeholder: 'Tu gamer tag', max: 32 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['Switch', 'Console'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'BR', 'Global'] },
      { key: 'mainCharacter', label: 'Main', placeholder: 'Tu personaje main', max: 32 },
      { key: 'secondaryCharacter', label: 'Secondary', placeholder: 'Tu secondary', max: 32 },
      { key: 'input', label: 'Control', type: 'select', options: ['GC Controller', 'Pro Controller', 'Joy-Con', 'Other'] },
    ],
  },
  brawlhalla: {
    title: 'Brawlhalla',
    badge: 'Fighting',
    fields: [
      { key: 'tag', label: 'Tag competitivo', placeholder: 'Tu gamer tag', max: 32 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'BR', 'SEA', 'Global'] },
      { key: 'mainLegend', label: 'Main legend', placeholder: 'Tu leyenda main', max: 32 },
      { key: 'secondaryLegend', label: 'Secondary legend', placeholder: 'Tu leyenda secondary', max: 32 },
      { key: 'input', label: 'Input', type: 'select', options: ['Controller', 'Keyboard'] },
    ],
  },
  sf6: {
    title: 'Street Fighter 6',
    badge: 'Fighting',
    fields: [
      { key: 'cfnId', label: 'CFN / tag', placeholder: 'Tu nombre competitivo', max: 32 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'PlayStation', 'Xbox'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'JP', 'Global'] },
      { key: 'mainCharacter', label: 'Main', placeholder: 'Tu personaje main', max: 32 },
      { key: 'secondaryCharacter', label: 'Secondary', placeholder: 'Tu secondary', max: 32 },
      { key: 'controlType', label: 'Control', type: 'select', options: ['Classic', 'Modern', 'Dynamic'] },
    ],
  },
  tekken: {
    title: 'Tekken 8',
    badge: 'Fighting',
    fields: [
      { key: 'tag', label: 'Tag competitivo', placeholder: 'Tu nombre competitivo', max: 32 },
      { key: 'platform', label: 'Plataforma', type: 'select', options: ['PC', 'PlayStation', 'Xbox'] },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'JP', 'KR', 'Global'] },
      { key: 'mainCharacter', label: 'Main', placeholder: 'Tu personaje main', max: 32 },
      { key: 'secondaryCharacter', label: 'Secondary', placeholder: 'Tu secondary', max: 32 },
      { key: 'controlType', label: 'Control', type: 'select', options: ['Pad', 'Arcade Stick', 'Leverless', 'Keyboard'] },
    ],
  },
  freefire: {
    title: 'Free Fire',
    badge: 'Battle Royale',
    fields: [
      { key: 'ign', label: 'IGN', placeholder: 'Tu nickname competitivo', max: 32 },
      { key: 'playerId', label: 'Player ID', placeholder: 'Tu UID', max: 24 },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'BR', 'NA', 'EU', 'SEA'] },
      { key: 'device', label: 'Dispositivo', type: 'select', options: ['Mobile', 'Tablet', 'Emulator'] },
      { key: 'clanTag', label: 'Clan tag', placeholder: 'Sigla del clan', max: 20 },
    ],
  },
  pubg: {
    title: 'PUBG Mobile',
    badge: 'Battle Royale',
    fields: [
      { key: 'ign', label: 'IGN', placeholder: 'Tu nickname competitivo', max: 32 },
      { key: 'playerId', label: 'Player ID', placeholder: 'Tu UID', max: 24 },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'MENA', 'SEA'] },
      { key: 'device', label: 'Dispositivo', type: 'select', options: ['Mobile', 'Tablet', 'Emulator'] },
      { key: 'clanTag', label: 'Clan tag', placeholder: 'Sigla del clan', max: 20 },
    ],
  },
  codm: {
    title: 'COD Mobile',
    badge: 'FPS',
    fields: [
      { key: 'ign', label: 'IGN', placeholder: 'Tu nickname competitivo', max: 32 },
      { key: 'playerId', label: 'Player ID', placeholder: 'UID / Open ID', max: 24 },
      { key: 'region', label: 'Region', type: 'select', options: ['LATAM', 'NA', 'EU', 'SEA', 'Global'] },
      { key: 'device', label: 'Dispositivo', type: 'select', options: ['Mobile', 'Tablet', 'Emulator'] },
      { key: 'roleFocus', label: 'Rol principal', type: 'select', options: ['Slayer', 'Objective', 'Anchor', 'Flex', 'Support'] },
      { key: 'clanTag', label: 'Clan tag', placeholder: 'Sigla del clan', max: 20 },
    ],
  },
};

const cloneSpec = (spec = {}) => ({
  ...spec,
  fields: Array.isArray(spec.fields)
    ? spec.fields.map((field) => ({
        ...field,
        options: Array.isArray(field.options) ? [...field.options] : undefined,
      }))
    : [],
});

const normalizeSingleCompetitiveProfile = (gameValue = '', payload = {}) => {
  const spec = GAME_COMPETITIVE_PROFILE_SPECS[normalizeSupportedGameId(gameValue)];
  if (!spec || !payload || typeof payload !== 'object') return {};

  const normalized = {};
  spec.fields.forEach((field) => {
    const raw = payload[field.key];
    const value = field.type === 'select'
      ? normalizeSelectValue(raw, field.options)
      : normalizeTextValue(raw, field.max || 60);
    if (value) normalized[field.key] = value;
  });
  return normalized;
};

export const COMPETITIVE_PROFILE_GAME_IDS = Object.freeze(Object.keys(MANUAL_COMPETITIVE_PROFILE_SPECS));

export const GAME_COMPETITIVE_PROFILE_SPECS = Object.freeze(MANUAL_COMPETITIVE_PROFILE_SPECS);

export const getCompetitiveProfileSpec = (gameValue = '') => {
  const id = normalizeSupportedGameId(gameValue);
  const spec = GAME_COMPETITIVE_PROFILE_SPECS[id];
  return spec ? cloneSpec(spec) : null;
};

export const hasCompetitiveProfileSpec = (gameValue = '') =>
  Boolean(getCompetitiveProfileSpec(gameValue));

export const getCompetitiveProfileGameIds = (games = []) => {
  const list = Array.isArray(games) ? games : [games];
  const seen = new Set();
  const ids = [];

  list.forEach((game) => {
    const id = normalizeSupportedGameId(game);
    if (!id || seen.has(id) || !GAME_COMPETITIVE_PROFILE_SPECS[id]) return;
    seen.add(id);
    ids.push(id);
  });

  return ids;
};

export const normalizeCompetitiveProfilesPayload = (payload = {}, selectedGames = []) => {
  const source = payload && typeof payload === 'object' ? payload : {};
  const normalizedSource = {};

  Object.entries(source).forEach(([key, value]) => {
    const id = normalizeSupportedGameId(key);
    if (!id || !GAME_COMPETITIVE_PROFILE_SPECS[id]) return;
    normalizedSource[id] = value;
  });

  const allowedIds = getCompetitiveProfileGameIds(selectedGames);
  const targetIds = allowedIds.length > 0 ? allowedIds : Object.keys(normalizedSource);
  const normalized = {};

  targetIds.forEach((id) => {
    const profile = normalizeSingleCompetitiveProfile(id, normalizedSource[id]);
    if (Object.keys(profile).length > 0) {
      normalized[id] = profile;
    }
  });

  return normalized;
};

export const getCompetitiveProfileEntries = (gameValue = '', payload = {}, options = {}) => {
  const { limit = 0 } = options;
  const spec = getCompetitiveProfileSpec(gameValue);
  if (!spec) return [];

  const normalized = normalizeSingleCompetitiveProfile(gameValue, payload);
  const entries = spec.fields
    .filter((field) => normalized[field.key])
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: normalized[field.key],
    }));

  return limit > 0 ? entries.slice(0, limit) : entries;
};
