const UNIVERSITY_POINTS = {
  participation: 25,
  sizeMultipliers: [
    { label: '2-3 equipos', minTeams: 2, maxTeams: 3, multiplier: 1 },
    { label: '4-7 equipos', minTeams: 4, maxTeams: 7, multiplier: 1.05 },
    { label: '8-15 equipos', minTeams: 8, maxTeams: 15, multiplier: 1.12 },
    { label: '16-31 equipos', minTeams: 16, maxTeams: 31, multiplier: 1.2 },
    { label: '32+ equipos', minTeams: 32, maxTeams: null, multiplier: 1.3 }
  ],
  formats: {
    single_elimination: {
      label: 'Eliminación directa',
      placementSource: 'bracket',
      matchWin: 12,
      championBonus: 60,
      finalistBonus: 30,
      semifinalBonus: 15,
      placementNote: 'Los bonus de campeón, finalista y semifinal salen del bracket final.'
    },
    double_elimination: {
      label: 'Doble eliminación',
      placementSource: 'bracket',
      matchWin: 10,
      championBonus: 60,
      finalistBonus: 30,
      semifinalBonus: 15,
      placementNote: 'Las victorias valen menos porque el formato genera más partidas por equipo.'
    },
    swiss: {
      label: 'Suizo',
      placementSource: 'table',
      matchWin: 9,
      championBonus: 30,
      finalistBonus: 18,
      semifinalBonus: 10,
      placementNote: 'Los bonus salen de la tabla final: 1ro, 2do y Top 4 por victorias/derrotas.'
    },
    round_robin: {
      label: 'Round Robin',
      placementSource: 'table',
      matchWin: 8,
      championBonus: 24,
      finalistBonus: 14,
      semifinalBonus: 8,
      placementNote: 'Los bonus salen de la tabla final: 1ro, 2do y Top 4 por victorias/derrotas.'
    }
  }
};

const DEFAULT_FORMAT_KEY = 'single_elimination';

const normalizeText = (value = '', max = 120) => String(value || '').trim().slice(0, max);
const getTeamIdString = (value = null) => (value ? String(value) : '');
const isFinishedMatch = (match = null) =>
  Boolean(match && String(match.status || '').trim().toLowerCase() === 'finished' && match.winnerTeamId);

const normalizeTournamentFormat = (value = '') => {
  const raw = normalizeText(value, 80)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!raw) return DEFAULT_FORMAT_KEY;
  if (raw === 'single_elimination' || raw.includes('eliminacion directa') || raw.includes('single elimination')) {
    return 'single_elimination';
  }
  if (raw === 'double_elimination' || raw.includes('doble eliminacion') || raw.includes('double elimination')) {
    return 'double_elimination';
  }
  if (raw === 'swiss' || raw.includes('suizo')) {
    return 'swiss';
  }
  if (raw === 'round_robin' || raw.includes('round robin') || raw.includes('todos contra todos')) {
    return 'round_robin';
  }
  return DEFAULT_FORMAT_KEY;
};

const getPointsForFormat = (tournament = {}) => {
  const formatKey = normalizeTournamentFormat(tournament?.bracket?.format || tournament?.format || '');
  return {
    formatKey,
    ...UNIVERSITY_POINTS.formats[formatKey]
  };
};

const getTournamentSizeTier = (teamsCount = 0) =>
  UNIVERSITY_POINTS.sizeMultipliers.find((tier) =>
    Number(teamsCount) >= Number(tier.minTeams) &&
    (tier.maxTeams == null || Number(teamsCount) <= Number(tier.maxTeams))
  ) || UNIVERSITY_POINTS.sizeMultipliers[0];

const scalePoints = (value, multiplier = 1) => Math.round(Number(value || 0) * Number(multiplier || 1));

const ensureStanding = (map, universityId = '') => {
  const key = normalizeText(universityId, 60).toLowerCase();
  if (!key) return null;
  if (!map.has(key)) {
    map.set(key, {
      universityId: key,
      points: 0,
      tournamentsPlayed: 0,
      matchWins: 0,
      championships: 0,
      finals: 0,
      semifinals: 0
    });
  }
  return map.get(key);
};

const buildTeamPerformanceMap = (rounds = []) => {
  const teamStats = new Map();

  const ensureTeamStats = (teamId) => {
    const key = getTeamIdString(teamId);
    if (!key) return null;
    if (!teamStats.has(key)) {
      teamStats.set(key, {
        teamId: key,
        wins: 0,
        losses: 0,
        finishedMatches: 0
      });
    }
    return teamStats.get(key);
  };

  for (const round of Array.isArray(rounds) ? rounds : []) {
    for (const match of Array.isArray(round?.matches) ? round.matches : []) {
      if (!isFinishedMatch(match)) continue;

      const teamAId = getTeamIdString(match?.teamA?.teamId);
      const teamBId = getTeamIdString(match?.teamB?.teamId);
      const winnerId = getTeamIdString(match?.winnerTeamId);
      const loserId = [teamAId, teamBId].find((teamId) => teamId && teamId !== winnerId) || '';

      const winnerStats = ensureTeamStats(winnerId);
      if (winnerStats) {
        winnerStats.wins += 1;
        winnerStats.finishedMatches += 1;
      }

      const loserStats = ensureTeamStats(loserId);
      if (loserStats) {
        loserStats.losses += 1;
        loserStats.finishedMatches += 1;
      }
    }
  }

  return teamStats;
};

const getBracketPlacementTeams = (tournament = {}) => {
  const rounds = Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [];
  const finishedRounds = rounds
    .map((round) => ({
      round: Number(round?.round || 0),
      matches: Array.isArray(round?.matches) ? round.matches.filter(isFinishedMatch) : []
    }))
    .filter((round) => round.round > 0 && round.matches.length > 0)
    .sort((a, b) => a.round - b.round);

  if (!finishedRounds.length) {
    return {
      championTeamId: '',
      finalistTeamId: '',
      semifinalistTeamIds: []
    };
  }

  const finalRound = finishedRounds[finishedRounds.length - 1];
  const finalMatch = finalRound.matches[0];
  const championTeamId = getTeamIdString(finalMatch?.winnerTeamId);

  const finalTeamAId = getTeamIdString(finalMatch?.teamA?.teamId);
  const finalTeamBId = getTeamIdString(finalMatch?.teamB?.teamId);
  const finalistTeamId = championTeamId
    ? [finalTeamAId, finalTeamBId].find((teamId) => teamId && teamId !== championTeamId) || ''
    : '';

  const semifinalistTeamIds = [];
  const semifinalRound = finishedRounds.length > 1 ? finishedRounds[finishedRounds.length - 2] : null;
  if (semifinalRound) {
    for (const match of semifinalRound.matches) {
      const teamAId = getTeamIdString(match?.teamA?.teamId);
      const teamBId = getTeamIdString(match?.teamB?.teamId);
      const winnerId = getTeamIdString(match?.winnerTeamId);
      const loserId = [teamAId, teamBId].find((teamId) => teamId && teamId !== winnerId);
      if (loserId && loserId !== finalistTeamId && loserId !== championTeamId) {
        semifinalistTeamIds.push(loserId);
      }
    }
  }

  return {
    championTeamId,
    finalistTeamId,
    semifinalistTeamIds: Array.from(new Set(semifinalistTeamIds))
  };
};

const getTablePlacementTeams = (tournament = {}) => {
  const teamStats = buildTeamPerformanceMap(tournament?.bracket?.rounds || []);
  const sortedTeams = Array.from(teamStats.values()).sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.finishedMatches !== a.finishedMatches) return b.finishedMatches - a.finishedMatches;
    return a.teamId.localeCompare(b.teamId);
  });

  return {
    championTeamId: sortedTeams[0]?.teamId || '',
    finalistTeamId: sortedTeams[1]?.teamId || '',
    semifinalistTeamIds: sortedTeams.slice(2, 4).map((entry) => entry.teamId).filter(Boolean)
  };
};

const getPlacementTeams = (tournament = {}) => {
  const { placementSource } = getPointsForFormat(tournament);
  if (placementSource === 'table') {
    return getTablePlacementTeams(tournament);
  }
  return getBracketPlacementTeams(tournament);
};

export const calculateUniversityStandings = (tournaments = []) => {
  const standingsMap = new Map();

  for (const tournament of tournaments) {
    const pointsConfig = getPointsForFormat(tournament);
    const approvedRegistrations = Array.isArray(tournament?.registrations)
      ? tournament.registrations.filter((registration) => String(registration?.status || 'approved') === 'approved')
      : [];
    const sizeTier = getTournamentSizeTier(approvedRegistrations.length);

    const teamToUniversity = new Map();

    for (const registration of approvedRegistrations) {
      const universityId = normalizeText(registration?.teamMeta?.university?.universityId, 60).toLowerCase();
      const teamId = getTeamIdString(registration?.teamId);
      if (!universityId || !teamId) continue;

      teamToUniversity.set(teamId, universityId);

      const standing = ensureStanding(standingsMap, universityId);
      if (!standing) continue;
      standing.points += scalePoints(UNIVERSITY_POINTS.participation, sizeTier.multiplier);
      standing.tournamentsPlayed += 1;
    }

    const rounds = Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [];
    for (const round of rounds) {
      const matches = Array.isArray(round?.matches) ? round.matches : [];
      for (const match of matches) {
        if (!isFinishedMatch(match)) continue;
        const winnerTeamId = getTeamIdString(match?.winnerTeamId);
        const winnerUniversityId = teamToUniversity.get(winnerTeamId);
        if (!winnerUniversityId) continue;
        const standing = ensureStanding(standingsMap, winnerUniversityId);
        if (!standing) continue;
        standing.points += scalePoints(pointsConfig.matchWin, sizeTier.multiplier);
        standing.matchWins += 1;
      }
    }

    const placements = getPlacementTeams(tournament);
    if (placements.championTeamId) {
      const championUniversityId = teamToUniversity.get(placements.championTeamId);
      const finalistUniversityId = teamToUniversity.get(placements.finalistTeamId);

      if (championUniversityId) {
        const standing = ensureStanding(standingsMap, championUniversityId);
        if (standing) {
          standing.points += scalePoints(pointsConfig.championBonus, sizeTier.multiplier);
          standing.championships += 1;
          standing.finals += 1;
        }
      }

      if (finalistUniversityId) {
        const standing = ensureStanding(standingsMap, finalistUniversityId);
        if (standing) {
          standing.points += scalePoints(pointsConfig.finalistBonus, sizeTier.multiplier);
          standing.finals += 1;
        }
      }

      for (const teamId of placements.semifinalistTeamIds) {
        const universityId = teamToUniversity.get(teamId);
        if (!universityId) continue;
        const standing = ensureStanding(standingsMap, universityId);
        if (!standing) continue;
        standing.points += scalePoints(pointsConfig.semifinalBonus, sizeTier.multiplier);
        standing.semifinals += 1;
      }
    }
  }

  return Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.championships !== a.championships) return b.championships - a.championships;
    if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
    return a.universityId.localeCompare(b.universityId);
  });
};

export const getUniversityPointsConfig = () => ({
  participation: UNIVERSITY_POINTS.participation,
  sizeMultipliers: UNIVERSITY_POINTS.sizeMultipliers.map((tier) => ({ ...tier })),
  formats: { ...UNIVERSITY_POINTS.formats }
});
