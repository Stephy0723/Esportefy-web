import {
  buildTournamentBracket,
  resolveBracketMatch,
} from '../../../shared/tournamentBracket.js';

const buildRegistrations = (count) =>
  Array.from({ length: count }, (_, index) => ({
    _id: `reg-${index + 1}`,
    teamId: `team-${index + 1}`,
    teamName: `Equipo ${index + 1}`,
    logoUrl: '',
    status: 'approved',
  }));

describe('tournament bracket helpers', () => {
  it('builds and advances a single elimination bracket', () => {
    const bracket = buildTournamentBracket({
      format: 'single_elimination',
      registrations: buildRegistrations(4),
      seedingMode: 'custom',
      customOrder: ['reg-1', 'reg-2', 'reg-3', 'reg-4'],
    });

    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0].matches).toHaveLength(2);
    expect(bracket.rounds[1].matches).toHaveLength(1);
    expect(bracket.rounds[0].matches[0].nextMatchId).toBe('R2-M1');

    const semifinalA = bracket.rounds[0].matches[0];
    const semifinalB = bracket.rounds[0].matches[1];

    const afterSemiA = resolveBracketMatch({
      bracket,
      matchId: semifinalA.matchId,
      winnerRefId: semifinalA.teamA.refId,
    });

    expect(afterSemiA.bracket.rounds[1].matches[0].teamA.teamName).toBe(semifinalA.teamA.teamName);
    expect(afterSemiA.completed).toBe(false);

    const afterSemiB = resolveBracketMatch({
      bracket: afterSemiA.bracket,
      matchId: semifinalB.matchId,
      winnerRefId: semifinalB.teamB.refId,
    });

    expect(afterSemiB.bracket.rounds[1].matches[0].teamB.teamName).toBe(semifinalB.teamB.teamName);
    expect(afterSemiB.bracket.rounds[1].matches[0].status).toBe('ready');

    const finalMatch = afterSemiB.bracket.rounds[1].matches[0];
    const afterFinal = resolveBracketMatch({
      bracket: afterSemiB.bracket,
      matchId: finalMatch.matchId,
      winnerRefId: finalMatch.teamA.refId,
    });

    expect(afterFinal.completed).toBe(true);
    expect(afterFinal.bracket.rounds[1].matches[0].winnerRefId).toBe(finalMatch.teamA.refId);
  });

  it('opens the next swiss round after resolving the current one', () => {
    const bracket = buildTournamentBracket({
      format: 'swiss',
      registrations: buildRegistrations(4),
      seedingMode: 'custom',
      customOrder: ['reg-1', 'reg-2', 'reg-3', 'reg-4'],
    });

    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0].matches).toHaveLength(2);
    expect(bracket.rounds[1].matches).toHaveLength(0);

    const first = bracket.rounds[0].matches[0];
    const second = bracket.rounds[0].matches[1];

    const afterFirst = resolveBracketMatch({
      bracket,
      matchId: first.matchId,
      winnerRefId: first.teamA.refId,
    });

    expect(afterFirst.bracket.rounds[1].matches).toHaveLength(0);

    const afterSecond = resolveBracketMatch({
      bracket: afterFirst.bracket,
      matchId: second.matchId,
      winnerRefId: second.teamB.refId,
    });

    expect(afterSecond.bracket.rounds[1].matches.length).toBeGreaterThan(0);
    expect(afterSecond.completed).toBe(false);
  });

  it('persists proof and structured gameResult when resolving a bracket match', () => {
    const bracket = buildTournamentBracket({
      format: 'single_elimination',
      registrations: buildRegistrations(2),
      seedingMode: 'custom',
      customOrder: ['reg-1', 'reg-2'],
    });

    const openingMatch = bracket.rounds[0].matches[0];
    const resolved = resolveBracketMatch({
      bracket,
      matchId: openingMatch.matchId,
      winnerRefId: openingMatch.teamA.refId,
      scoreA: 25,
      scoreB: 17,
      proofUrl: '/uploads/match-proofs/test-proof.png',
      gameResult: {
        kind: 'battle_royale',
        roundLabel: 'Lobby 1',
        sideA: { placement: 1, kills: 8, points: 25 },
        sideB: { placement: 4, kills: 5, points: 17 },
      },
    });

    expect(resolved.bracket.rounds[0].matches[0].proofUrl).toBe('/uploads/match-proofs/test-proof.png');
    expect(resolved.bracket.rounds[0].matches[0].gameResult).toEqual({
      kind: 'battle_royale',
      roundLabel: 'Lobby 1',
      sideA: { placement: 1, kills: 8, points: 25 },
      sideB: { placement: 4, kills: 5, points: 17 },
    });
  });
});
