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

const getPlayableMatches = (bracket) =>
  (bracket?.rounds || []).flatMap((round) => round?.matches || []).filter((match) => {
    const status = String(match?.status || '').toLowerCase();
    return status === 'ready';
  });

const isBracketFinished = (bracket) =>
  (bracket?.rounds || []).length > 0
  && (bracket.rounds || []).every((round) =>
    Array.isArray(round?.matches)
    && round.matches.every((match) => ['finished', 'walkover'].includes(String(match?.status || '').toLowerCase()))
  );

const simulateBracketToCompletion = (initialBracket) => {
  let currentBracket = initialBracket;
  let safety = 0;

  while (!isBracketFinished(currentBracket) && safety < 100) {
    const playableMatches = getPlayableMatches(currentBracket);
    expect(playableMatches.length).toBeGreaterThan(0);

    playableMatches.forEach((match) => {
      const winnerRefId = String(match?.teamA?.refId || '');
      const result = resolveBracketMatch({
        bracket: currentBracket,
        matchId: match.matchId,
        winnerRefId,
        scoreA: 1,
        scoreB: 0,
      });
      currentBracket = result.bracket;
    });

    safety += 1;
  }

  expect(safety).toBeLessThan(100);
  expect(isBracketFinished(currentBracket)).toBe(true);
  return currentBracket;
};

describe('tournament full simulation helpers', () => {
  it.each([
    ['single_elimination', 8],
    ['swiss', 8],
    ['round_robin', 6],
  ])('simulates a complete %s tournament', (format, teamCount) => {
    const registrations = buildRegistrations(teamCount);
    const customOrder = registrations.map((registration) => registration._id);

    const bracket = buildTournamentBracket({
      format,
      registrations,
      seedingMode: 'custom',
      customOrder,
    });

    const completedBracket = simulateBracketToCompletion(bracket);
    expect(completedBracket.rounds.length).toBeGreaterThan(0);
  });
});
