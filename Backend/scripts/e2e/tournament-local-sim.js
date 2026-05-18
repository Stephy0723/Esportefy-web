import {
  buildTournamentBracket,
  resolveBracketMatch,
} from '../../../shared/tournamentBracket.js';

const FORMATS = [
  { format: 'single_elimination', teamCount: 8 },
  { format: 'swiss', teamCount: 8 },
  { format: 'round_robin', teamCount: 6 },
];

const buildRegistrations = (count) =>
  Array.from({ length: count }, (_, index) => ({
    _id: `reg-${index + 1}`,
    teamId: `team-${index + 1}`,
    teamName: `Equipo ${index + 1}`,
    logoUrl: '',
    status: 'approved',
  }));

const getPlayableMatches = (bracket) =>
  (bracket?.rounds || []).flatMap((round) => round?.matches || []).filter((match) =>
    String(match?.status || '').toLowerCase() === 'ready'
  );

const isBracketComplete = (bracket) =>
  (bracket?.rounds || []).length > 0
  && (bracket.rounds || []).every((round) =>
    Array.isArray(round?.matches)
    && round.matches.every((match) => ['finished', 'walkover'].includes(String(match?.status || '').toLowerCase()))
  );

const getWinnerName = (bracket) => {
  const rounds = bracket?.rounds || [];
  const lastRound = rounds[rounds.length - 1];
  const lastMatch = lastRound?.matches?.[0];
  const winnerRefId = String(lastMatch?.winnerRefId || '').trim();
  if (!winnerRefId) return '';
  if (String(lastMatch?.teamA?.refId || '') === winnerRefId) return lastMatch.teamA.teamName;
  if (String(lastMatch?.teamB?.refId || '') === winnerRefId) return lastMatch.teamB.teamName;
  return '';
};

const simulateFormat = ({ format, teamCount }) => {
  const registrations = buildRegistrations(teamCount);
  const bracket = buildTournamentBracket({
    format,
    registrations,
    seedingMode: 'custom',
    customOrder: registrations.map((registration) => registration._id),
  });

  let currentBracket = bracket;
  let resolvedMatches = 0;
  let safety = 0;

  while (!isBracketComplete(currentBracket) && safety < 100) {
    const playableMatches = getPlayableMatches(currentBracket);
    if (playableMatches.length === 0) {
      throw new Error(`No hay matches listos para resolver en formato ${format}`);
    }

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
      resolvedMatches += 1;
    });

    safety += 1;
  }

  if (!isBracketComplete(currentBracket)) {
    throw new Error(`La simulacion no pudo completar el formato ${format}`);
  }

  return {
    format,
    teamCount,
    rounds: currentBracket.rounds.length,
    resolvedMatches,
    champion: getWinnerName(currentBracket) || 'N/D',
  };
};

const run = async () => {
  const results = FORMATS.map(simulateFormat);
  results.forEach((result) => {
    console.log(
      `[tournament-local-sim] ${result.format}: ${result.teamCount} equipos, ${result.rounds} rondas, ${result.resolvedMatches} matches, campeon ${result.champion}`
    );
  });
  console.log('[tournament-local-sim] OK');
};

run().catch((error) => {
  console.error('[tournament-local-sim] FAILED');
  console.error(error?.message || error);
  process.exitCode = 1;
});
