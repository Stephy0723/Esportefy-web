import { getSupportedGame } from './supportedGames.js';

const BATTLE_ROYALE_GAME_IDS = new Set(['fortnite', 'warzone', 'freefire', 'pubg']);
const FIGHTING_GAME_IDS = new Set(['smash', 'brawlhalla', 'sf6', 'tekken']);
const ROTATION_GAME_IDS = new Set(['codm']);

const normalizeText = (value = '', maxLength = 160) =>
  String(value || '')
    .trim()
    .slice(0, maxLength);

const parseNullableNumber = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseNullableInteger = (value) => {
  const parsed = parseNullableNumber(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.trunc(parsed);
};

const compactObject = (value = {}) => Object.fromEntries(
  Object.entries(value).filter(([, entry]) => {
    if (entry === null || entry === undefined || entry === '') return false;
    if (Array.isArray(entry)) return entry.length > 0;
    if (typeof entry === 'object') return Object.keys(entry).length > 0;
    return true;
  })
);

const hasAnyValue = (value = {}) =>
  Object.values(value || {}).some((entry) => entry !== null && entry !== undefined && entry !== '');

const normalizeBattleRoyaleSide = (value = {}) => {
  const placement = parseNullableInteger(value?.placement);
  const kills = parseNullableInteger(value?.kills);
  const points = parseNullableNumber(value?.points);

  return compactObject({
    placement: placement !== null && placement > 0 ? placement : null,
    kills: kills !== null && kills >= 0 ? kills : null,
    points: points !== null && points >= 0 ? points : null,
  });
};

export class GameMatchResultValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GameMatchResultValidationError';
  }
}

export const getSeriesWinTarget = (seriesType = '') => {
  const raw = String(seriesType || '').trim().toUpperCase();
  if (!raw) return null;

  if (/^FT\d+$/.test(raw)) {
    return Number.parseInt(raw.slice(2), 10) || null;
  }

  if (/^BO\d+$/.test(raw)) {
    const totalGames = Number.parseInt(raw.slice(2), 10);
    if (!Number.isFinite(totalGames) || totalGames <= 0) return null;
    return Math.floor(totalGames / 2) + 1;
  }

  return null;
};

export const getGameMatchResultConfig = (game = '', seriesType = '') => {
  const supportedGame = getSupportedGame(game);
  const gameId = supportedGame?.id || '';
  const targetWins = getSeriesWinTarget(seriesType);

  if (BATTLE_ROYALE_GAME_IDS.has(gameId)) {
    return {
      kind: 'battle_royale',
      scoreLabel: 'Puntos totales',
      scoreHint: 'Usa el score como puntos finales del lobby. Placement y kills quedan como detalle estructurado.',
      targetWins: null,
      supportsSummary: true,
      supportsNotes: true,
      supportsMap: true,
      supportsRoundLabel: true,
      supportsCharacters: false,
      supportsStage: false,
      supportsMode: false,
      supportsBattleRoyaleStats: true,
    };
  }

  if (FIGHTING_GAME_IDS.has(gameId)) {
    return {
      kind: 'fighting',
      scoreLabel: 'Games ganados',
      scoreHint: targetWins
        ? `Este set usa ${seriesType}. El ganador debe alcanzar ${targetWins} ${targetWins === 1 ? 'game' : 'games'}.`
        : 'Usa el score como games ganados en el set.',
      targetWins,
      supportsSummary: true,
      supportsNotes: true,
      supportsMap: false,
      supportsRoundLabel: false,
      supportsCharacters: true,
      supportsStage: true,
      supportsMode: false,
      supportsBattleRoyaleStats: false,
    };
  }

  if (ROTATION_GAME_IDS.has(gameId)) {
    return {
      kind: 'mode_rotation',
      scoreLabel: 'Mapas / puntos',
      scoreHint: 'Usa el score como resultado principal y deja modo, mapa y resumen competitivo como apoyo.',
      targetWins,
      supportsSummary: true,
      supportsNotes: true,
      supportsMap: true,
      supportsRoundLabel: false,
      supportsCharacters: false,
      supportsStage: false,
      supportsMode: true,
      supportsBattleRoyaleStats: false,
    };
  }

  return {
    kind: 'standard',
    scoreLabel: 'Score',
    scoreHint: 'Usa el score principal del match y agrega resumen o notas si quieres dejar contexto competitivo.',
    targetWins,
    supportsSummary: true,
    supportsNotes: true,
    supportsMap: true,
    supportsRoundLabel: false,
    supportsCharacters: false,
    supportsStage: false,
    supportsMode: false,
    supportsBattleRoyaleStats: false,
  };
};

export const normalizeGameMatchResultPayload = ({
  game = '',
  seriesType = '',
  scoreA = null,
  scoreB = null,
  gameResult = null,
  status = 'pending',
} = {}) => {
  const config = getGameMatchResultConfig(game, seriesType);
  const normalizedStatus = String(status || '').trim().toLowerCase();
  let normalizedScoreA = parseNullableNumber(scoreA);
  let normalizedScoreB = parseNullableNumber(scoreB);
  let normalizedGameResult = null;

  if (config.kind === 'battle_royale') {
    const sideA = normalizeBattleRoyaleSide(gameResult?.sideA);
    const sideB = normalizeBattleRoyaleSide(gameResult?.sideB);

    if (normalizedScoreA === null && Number.isFinite(sideA.points)) normalizedScoreA = sideA.points;
    if (normalizedScoreB === null && Number.isFinite(sideB.points)) normalizedScoreB = sideB.points;

    const payload = compactObject({
      kind: 'battle_royale',
      roundLabel: normalizeText(gameResult?.roundLabel, 60),
      map: normalizeText(gameResult?.map, 80),
      summary: normalizeText(gameResult?.summary, 180),
      notes: normalizeText(gameResult?.notes, 700),
      sideA: hasAnyValue(sideA) ? sideA : null,
      sideB: hasAnyValue(sideB) ? sideB : null,
    });

    normalizedGameResult = Object.keys(payload).length > 1 ? payload : null;

    if (normalizedStatus === 'finished') {
      if (normalizedScoreA === null || normalizedScoreB === null) {
        throw new GameMatchResultValidationError(
          'Los matches Battle Royale necesitan puntos totales para ambos lados antes de finalizar.'
        );
      }
    }
  } else if (config.kind === 'fighting') {
    const payload = compactObject({
      kind: 'fighting',
      stage: normalizeText(gameResult?.stage, 80),
      sideACharacter: normalizeText(gameResult?.sideACharacter, 80),
      sideBCharacter: normalizeText(gameResult?.sideBCharacter, 80),
      summary: normalizeText(gameResult?.summary, 180),
      notes: normalizeText(gameResult?.notes, 700),
    });

    normalizedGameResult = Object.keys(payload).length > 1 ? payload : null;

    if (normalizedStatus === 'finished') {
      if (normalizedScoreA === null || normalizedScoreB === null) {
        throw new GameMatchResultValidationError('Debes ingresar los games ganados de ambos lados antes de finalizar.');
      }
      if (normalizedScoreA === normalizedScoreB) {
        throw new GameMatchResultValidationError('Un set de fighting no puede cerrarse empatado si ya existe un ganador.');
      }
      if (config.targetWins && Math.max(normalizedScoreA, normalizedScoreB) < config.targetWins) {
        throw new GameMatchResultValidationError(
          `El score no alcanza el objetivo competitivo del set (${seriesType || 'serie configurada'}).`
        );
      }
    }
  } else if (config.kind === 'mode_rotation') {
    const payload = compactObject({
      kind: 'mode_rotation',
      mode: normalizeText(gameResult?.mode, 80),
      map: normalizeText(gameResult?.map, 80),
      summary: normalizeText(gameResult?.summary, 180),
      notes: normalizeText(gameResult?.notes, 700),
    });

    normalizedGameResult = Object.keys(payload).length > 1 ? payload : null;
  } else {
    const payload = compactObject({
      kind: 'standard',
      map: normalizeText(gameResult?.map, 80),
      summary: normalizeText(gameResult?.summary, 180),
      notes: normalizeText(gameResult?.notes, 700),
    });

    normalizedGameResult = Object.keys(payload).length > 1 ? payload : null;
  }

  if (
    normalizedScoreA !== null &&
    normalizedScoreB !== null &&
    normalizedScoreA === normalizedScoreB &&
    normalizedStatus === 'finished'
  ) {
    throw new GameMatchResultValidationError('El score no puede quedar empatado si el match ya tiene ganador definido.');
  }

  return {
    config,
    scoreA: normalizedScoreA,
    scoreB: normalizedScoreB,
    gameResult: normalizedGameResult,
  };
};
