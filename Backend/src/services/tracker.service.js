import axios from 'axios';
import { getSupportedGame } from '../../../shared/supportedGames.js';

const TRACKER_API_BASE_URL = process.env.TRACKER_API_BASE_URL || 'https://public-api.tracker.gg/v2/';
const TRACKER_API_TIMEOUT_MS = Number.parseInt(process.env.TRACKER_API_TIMEOUT_MS || '15000', 10) || 15000;

export const TRACKER_GAME_CONFIG = {
  valorant: {
    id: 'valorant',
    name: 'Valorant',
    trackerSlug: 'valorant',
    platform: 'riot',
    trackerSupported: true,
    summaryLabel: 'Rango competitivo',
    notes: [
      'Tracker Network usa el Riot ID publico del jugador para exponer este perfil.'
    ]
  },
  lol: {
    id: 'lol',
    name: 'League of Legends',
    trackerSlug: 'lol',
    platform: 'riot',
    trackerSupported: true,
    summaryLabel: 'Rango principal',
    notes: [
      'En League of Legends, Tracker puede devolver menos stats segun la region y la actividad reciente.'
    ]
  },
  mlbb: {
    id: 'mlbb',
    name: 'Mobile Legends',
    trackerSlug: '',
    platform: 'mlbb',
    trackerSupported: false,
    unsupportedReason: 'Tracker Network no ofrece soporte publico para MLBB en la API v2.'
  }
};

const trackerApi = axios.create({
  baseURL: TRACKER_API_BASE_URL,
  timeout: TRACKER_API_TIMEOUT_MS
});

const createTrackerServiceError = (message, options = {}) => {
  const error = new Error(message);
  error.code = options.code || 'TRACKER_SERVICE_ERROR';
  error.status = Number(options.status || 500);
  return error;
};

const isFilledString = (value) => typeof value === 'string' && value.trim().length > 0;

const humanizeKey = (value = '') =>
  String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  if (Number.isInteger(value)) return value.toLocaleString('en-US');
  return value.toLocaleString('en-US', {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: 2
  });
};

const formatStatValue = (stat) => {
  if (stat == null) return '';
  if (isFilledString(stat)) return stat.trim();
  if (typeof stat === 'number') return formatNumber(stat);
  if (typeof stat === 'boolean') return stat ? 'Si' : 'No';
  if (typeof stat !== 'object') return '';

  if (isFilledString(stat.displayValue)) return stat.displayValue.trim();
  if (typeof stat.displayValue === 'number') return formatNumber(stat.displayValue);

  if (isFilledString(stat.metadata?.tierName)) return stat.metadata.tierName.trim();
  if (isFilledString(stat.metadata?.rankName)) return stat.metadata.rankName.trim();

  if (isFilledString(stat.value)) return stat.value.trim();
  if (typeof stat.value === 'number') return formatNumber(stat.value);
  if (typeof stat.value === 'boolean') return stat.value ? 'Si' : 'No';

  return '';
};

const getStatEntry = (stats = {}, keys = []) => {
  const candidates = Array.isArray(keys) ? keys : [keys];
  for (const key of candidates) {
    if (!key) continue;
    if (stats[key] != null) return stats[key];
  }
  return null;
};

const createCard = (label, value, options = {}) => {
  const parsedValue = formatStatValue(value);
  if (!isFilledString(parsedValue)) return null;

  return {
    label,
    value: parsedValue,
    highlight: options.highlight === true
  };
};

const buildCardsFromDefinitions = (stats = {}, definitions = []) =>
  definitions
    .map((definition) => {
      const rawValue = typeof definition.resolve === 'function'
        ? definition.resolve(stats)
        : getStatEntry(stats, definition.keys);
      return createCard(definition.label, rawValue, { highlight: definition.highlight });
    })
    .filter(Boolean);

const buildGenericCards = (stats = {}, options = {}) => {
  const limit = Number(options.limit || 6);
  const entries = Object.entries(stats || {});
  const cards = [];

  entries.some(([key, stat], index) => {
    const label = stat?.metadata?.name || humanizeKey(key);
    const card = createCard(label, stat, { highlight: options.highlightFirst === true && index === 0 });
    if (card) cards.push(card);
    return cards.length >= limit;
  });

  return cards;
};

const createSection = (id, title, cards = [], options = {}) => {
  const normalizedCards = Array.isArray(cards) ? cards.filter(Boolean) : [];
  if (normalizedCards.length === 0) return null;

  return {
    id,
    title,
    description: options.description || '',
    cards: normalizedCards
  };
};

const findSegment = (segments = [], predicate) => {
  const list = Array.isArray(segments) ? segments : [];
  return list.find((segment) => {
    try {
      return predicate(segment);
    } catch (_) {
      return false;
    }
  }) || null;
};

const findSegmentByType = (segments = [], types = []) => {
  const expected = new Set((Array.isArray(types) ? types : [types]).map((value) => String(value || '').toLowerCase()));
  return findSegment(segments, (segment) => expected.has(String(segment?.type || '').toLowerCase()));
};

const findSegmentByName = (segments = [], patterns = []) => {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return findSegment(segments, (segment) => {
    const name = String(segment?.metadata?.name || '').toLowerCase();
    return list.some((pattern) => pattern && pattern.test(name));
  });
};

const buildLeagueRank = (stats = {}) => {
  const rank = formatStatValue(getStatEntry(stats, ['rank', 'tier', 'currentRank']));
  const division = formatStatValue(getStatEntry(stats, ['division', 'rankDivision']));
  const lp = formatStatValue(getStatEntry(stats, ['lp', 'leaguePoints']));

  const parts = [];
  if (isFilledString(rank)) parts.push(rank);
  if (isFilledString(division) && !rank.toLowerCase().includes(division.toLowerCase())) {
    parts.push(division);
  }

  const base = parts.join(' ').trim();
  if (isFilledString(lp)) {
    return isFilledString(base) ? `${base} • ${lp}` : lp;
  }

  return base;
};

const buildTrackerProfileUrl = (config, platformUserIdentifier) =>
  `${config.trackerSlug}/standard/profile/${config.platform}/${encodeURIComponent(platformUserIdentifier)}`;

export const getTrackerGameConfig = (game = '') => {
  const supportedGame = getSupportedGame(game);
  if (!supportedGame) return null;
  return TRACKER_GAME_CONFIG[supportedGame.id] || null;
};

export const isTrackerGameSupported = (game = '') => Boolean(getTrackerGameConfig(game)?.trackerSupported);

export const fetchTrackerProfile = async (game = '', platformUserIdentifier = '') => {
  const gameConfig = getTrackerGameConfig(game);
  if (!gameConfig) {
    throw createTrackerServiceError(`El juego '${game}' no es soportado.`, {
      code: 'TRACKER_GAME_INVALID',
      status: 400
    });
  }

  if (!gameConfig.trackerSupported) {
    throw createTrackerServiceError(gameConfig.unsupportedReason, {
      code: 'TRACKER_GAME_UNSUPPORTED',
      status: 501
    });
  }

  const identifier = String(platformUserIdentifier || '').trim();
  if (!identifier) {
    throw createTrackerServiceError('Debes indicar el identificador del jugador.', {
      code: 'TRACKER_IDENTIFIER_REQUIRED',
      status: 400
    });
  }

  const apiPath = buildTrackerProfileUrl(gameConfig, identifier);
  const response = await trackerApi.get(apiPath);
  return response.data;
};

const normalizeValorantProfile = (rawPayload, gameConfig, identifier) => {
  const data = rawPayload?.data || {};
  const segments = Array.isArray(data?.segments) ? data.segments : [];
  const overviewSegment = findSegmentByType(segments, ['overview']) || segments[0] || null;
  const competitiveSegment =
    findSegmentByType(segments, ['competitive']) ||
    findSegmentByName(segments, [/competitive/i, /ranked/i]);

  const overviewStats = overviewSegment?.stats || {};
  const competitiveStats = competitiveSegment?.stats || {};

  const rankValue =
    formatStatValue(getStatEntry(competitiveStats, ['rank', 'tier', 'currentRank'])) ||
    formatStatValue(getStatEntry(overviewStats, ['rank', 'tier'])) ||
    'Sin rango visible';
  const rrValue = formatStatValue(getStatEntry(competitiveStats, ['rr', 'rankRating', 'rankedRating']));
  const headline = rrValue && !rankValue.toLowerCase().includes('rr')
    ? `${rankValue} • ${rrValue}`
    : rankValue;

  const sections = [
    createSection(
      'overview',
      'Resumen general',
      buildCardsFromDefinitions(overviewStats, [
        { label: 'K/D', keys: ['kDRatio', 'kdRatio'], highlight: true },
        { label: 'Win Rate', keys: ['matchesWinPct', 'winPercentage', 'winRate'] },
        { label: 'Headshot %', keys: ['headshotsPercentage', 'headshotPct'] },
        { label: 'Partidas', keys: ['matchesPlayed', 'matches'] },
        { label: 'Victorias', keys: ['matchesWon', 'wins'] },
        { label: 'Score/Ronda', keys: ['scorePerRound'] }
      ])
    ),
    createSection(
      'combat',
      'Rendimiento de combate',
      buildCardsFromDefinitions(overviewStats, [
        { label: 'Kills/Ronda', keys: ['killsPerRound'], highlight: true },
        { label: 'Daño/Ronda', keys: ['damagePerRound', 'damageRoundAverage'] },
        { label: 'KAST', keys: ['kast'] },
        { label: 'ACS', keys: ['scorePerRound', 'averageCombatScore'] },
        { label: 'HS totales', keys: ['headshots'] },
        { label: 'Kills', keys: ['kills'] }
      ])
    ),
    createSection(
      'competitive',
      'Competitivo',
      buildCardsFromDefinitions(competitiveStats, [
        { label: 'Rango', resolve: () => headline, highlight: true },
        { label: 'Victorias', keys: ['wins', 'matchesWon'] },
        { label: 'Derrotas', keys: ['losses', 'matchesLost'] },
        { label: 'Win Rate', keys: ['winPercentage', 'winRate'] },
        { label: 'Partidas rankeadas', keys: ['matchesPlayed', 'matches'] }
      ])
    )
  ].filter(Boolean);

  if (sections.length === 0) {
    const fallbackSection = createSection(
      'general',
      'Stats disponibles',
      buildGenericCards(overviewStats, { limit: 8, highlightFirst: true })
    );
    if (fallbackSection) sections.push(fallbackSection);
  }

  return {
    ok: true,
    game: {
      id: gameConfig.id,
      name: gameConfig.name,
      trackerSupported: true
    },
    identifier,
    profile: {
      handle: data?.platformInfo?.platformUserHandle || identifier,
      avatarUrl: data?.platformInfo?.avatarUrl || '',
      platform: data?.platformInfo?.platformSlug || gameConfig.platform,
      profileUrl: data?.platformInfo?.platformUserIdentifier || identifier
    },
    summary: {
      headline: {
        label: gameConfig.summaryLabel,
        value: headline
      },
      subtitle: 'Resumen competitivo y de rendimiento disponible en Tracker Network.'
    },
    sections,
    notes: [...gameConfig.notes],
    raw: rawPayload
  };
};

const normalizeLolProfile = (rawPayload, gameConfig, identifier) => {
  const data = rawPayload?.data || {};
  const segments = Array.isArray(data?.segments) ? data.segments : [];
  const soloSegment = findSegmentByName(segments, [/solo/i, /solo\/duo/i, /solo duo/i]);
  const flexSegment = findSegmentByName(segments, [/flex/i]);
  const overviewSegment =
    findSegmentByType(segments, ['overview']) ||
    findSegmentByName(segments, [/overview/i, /summary/i]) ||
    segments[0] ||
    null;

  const soloStats = soloSegment?.stats || {};
  const flexStats = flexSegment?.stats || {};
  const overviewStats = overviewSegment?.stats || {};

  const primaryRank = buildLeagueRank(soloStats) || buildLeagueRank(flexStats) || 'Sin rango visible';

  const sections = [
    createSection(
      'ranked-solo',
      'Ranked Solo/Duo',
      buildCardsFromDefinitions(soloStats, [
        { label: 'Rango', resolve: () => buildLeagueRank(soloStats), highlight: true },
        { label: 'Victorias', keys: ['wins'] },
        { label: 'Derrotas', keys: ['losses'] },
        { label: 'Win Rate', keys: ['winRate', 'winPercentage'] },
        { label: 'KDA', keys: ['kda'] },
        { label: 'Partidas', keys: ['matchesPlayed', 'matches'] }
      ])
    ),
    createSection(
      'ranked-flex',
      'Ranked Flex',
      buildCardsFromDefinitions(flexStats, [
        { label: 'Rango', resolve: () => buildLeagueRank(flexStats), highlight: true },
        { label: 'Victorias', keys: ['wins'] },
        { label: 'Derrotas', keys: ['losses'] },
        { label: 'Win Rate', keys: ['winRate', 'winPercentage'] },
        { label: 'KDA', keys: ['kda'] }
      ])
    ),
    createSection(
      'overview',
      'Resumen general',
      buildCardsFromDefinitions(overviewStats, [
        { label: 'Nivel', keys: ['level', 'summonerLevel'], highlight: true },
        { label: 'Partidas', keys: ['matchesPlayed', 'matches'] },
        { label: 'Victorias', keys: ['wins'] },
        { label: 'KDA', keys: ['kda'] },
        { label: 'Win Rate', keys: ['winRate', 'winPercentage'] },
        { label: 'CS/min', keys: ['csPerMinute'] }
      ])
    )
  ].filter(Boolean);

  if (sections.length === 0) {
    const fallbackSection = createSection(
      'general',
      'Stats disponibles',
      buildGenericCards(overviewStats, { limit: 8, highlightFirst: true })
    );
    if (fallbackSection) sections.push(fallbackSection);
  }

  return {
    ok: true,
    game: {
      id: gameConfig.id,
      name: gameConfig.name,
      trackerSupported: true
    },
    identifier,
    profile: {
      handle: data?.platformInfo?.platformUserHandle || identifier,
      avatarUrl: data?.platformInfo?.avatarUrl || '',
      platform: data?.platformInfo?.platformSlug || gameConfig.platform,
      profileUrl: data?.platformInfo?.platformUserIdentifier || identifier
    },
    summary: {
      headline: {
        label: gameConfig.summaryLabel,
        value: primaryRank
      },
      subtitle: 'Resumen de rango y actividad disponible desde Tracker Network.'
    },
    sections,
    notes: [...gameConfig.notes],
    raw: rawPayload
  };
};

export const normalizeTrackerProfile = (game = '', rawPayload = {}, platformUserIdentifier = '') => {
  const gameConfig = getTrackerGameConfig(game);
  if (!gameConfig) {
    throw createTrackerServiceError(`El juego '${game}' no es soportado.`, {
      code: 'TRACKER_GAME_INVALID',
      status: 400
    });
  }

  const identifier = String(platformUserIdentifier || '').trim();
  if (!gameConfig.trackerSupported) {
    return {
      ok: false,
      game: {
        id: gameConfig.id,
        name: gameConfig.name,
        trackerSupported: false
      },
      identifier,
      profile: null,
      summary: {
        headline: {
          label: 'Estado',
          value: 'No disponible'
        },
        subtitle: gameConfig.unsupportedReason
      },
      sections: [],
      notes: [gameConfig.unsupportedReason],
      raw: null
    };
  }

  if (gameConfig.id === 'valorant') {
    return normalizeValorantProfile(rawPayload, gameConfig, identifier);
  }

  if (gameConfig.id === 'lol') {
    return normalizeLolProfile(rawPayload, gameConfig, identifier);
  }

  return {
    ok: true,
    game: {
      id: gameConfig.id,
      name: gameConfig.name,
      trackerSupported: true
    },
    identifier,
    profile: {
      handle: rawPayload?.data?.platformInfo?.platformUserHandle || identifier,
      avatarUrl: rawPayload?.data?.platformInfo?.avatarUrl || '',
      platform: rawPayload?.data?.platformInfo?.platformSlug || gameConfig.platform,
      profileUrl: rawPayload?.data?.platformInfo?.platformUserIdentifier || identifier
    },
    summary: {
      headline: {
        label: 'Perfil',
        value: identifier
      },
      subtitle: 'Stats disponibles desde Tracker Network.'
    },
    sections: [],
    notes: [],
    raw: rawPayload
  };
};

trackerApi.interceptors.request.use((config) => {
  const apiKey = String(process.env.TRACKER_API_KEY || '').trim();
  if (!apiKey) {
    return Promise.reject(
      createTrackerServiceError('TRACKER_API_KEY no esta configurada en el backend.', {
        code: 'TRACKER_API_KEY_MISSING',
        status: 503
      })
    );
  }

  config.headers = config.headers || {};
  config.headers['TRN-Api-Key'] = apiKey;
  return config;
});

trackerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const endpoint = error?.config?.url || '';
    const message =
      error?.response?.data?.message
      || error?.message
      || 'Error desconocido consumiendo Tracker Network.';

    console.error(`[Tracker] ${status || 'ERROR'} ${endpoint}: ${message}`);
    return Promise.reject(error);
  }
);

export default trackerApi;
