import {
  GameMatchResultValidationError,
  getGameMatchResultConfig,
  normalizeGameMatchResultPayload,
} from '../../../shared/gameMatchResults.js';

describe('game match result helpers', () => {
  it('syncs battle royale points into the main score when structured stats are provided', () => {
    const result = normalizeGameMatchResultPayload({
      game: 'Fortnite',
      status: 'finished',
      gameResult: {
        roundLabel: 'Lobby 1',
        sideA: { placement: 1, kills: 8, points: 25 },
        sideB: { placement: 4, kills: 5, points: 17 },
      },
    });

    expect(result.scoreA).toBe(25);
    expect(result.scoreB).toBe(17);
    expect(result.gameResult.kind).toBe('battle_royale');
    expect(result.gameResult.sideA.placement).toBe(1);
  });

  it('rejects fighting results that do not reach the configured FT target', () => {
    expect(() =>
      normalizeGameMatchResultPayload({
        game: 'Street Fighter 6',
        seriesType: 'FT2',
        scoreA: 1,
        scoreB: 0,
        status: 'finished',
      })
    ).toThrow(GameMatchResultValidationError);
  });

  it('returns the expected preset for cod mobile rotation matches', () => {
    const config = getGameMatchResultConfig('COD Mobile', 'BO5');

    expect(config.kind).toBe('mode_rotation');
    expect(config.supportsMode).toBe(true);
    expect(config.supportsMap).toBe(true);
  });
});
