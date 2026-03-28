import { normalizeTournamentFormat } from './tournamentCatalog.js';

const clone = (value) => {
  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch {
      // Mongoose docs/subdocs can throw DataCloneError here.
    }
  }
  return JSON.parse(JSON.stringify(value));
};

const toKey = (value = '') => String(value || '').trim().toLowerCase();

const shuffle = (items = []) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
};

const nextPowerOfTwo = (value = 0) => {
  const size = Number(value) || 0;
  if (size <= 1) return 1;
  return 2 ** Math.ceil(Math.log2(size));
};

const buildRegistrationRefId = (registration = {}) => (
  String(registration?._id || registration?.teamId || registration?.teamName || '').trim()
);

const createParticipantFromRegistration = (registration = {}, seed = 0) => ({
  refId: buildRegistrationRefId(registration),
  teamId: registration?.teamId ? String(registration.teamId) : '',
  registrationId: registration?._id ? String(registration._id) : '',
  teamName: String(registration?.teamName || '').trim(),
  logoUrl: String(registration?.logoUrl || '').trim(),
  seed,
  isBye: false,
  isPlaceholder: false,
});

const createByeParticipant = (seed = 0) => ({
  refId: `bye-${seed}`,
  teamId: '',
  registrationId: '',
  teamName: '',
  logoUrl: '',
  seed,
  isBye: true,
  isPlaceholder: false,
});

const createPlaceholderParticipant = () => ({
  refId: '',
  teamId: '',
  registrationId: '',
  teamName: '',
  logoUrl: '',
  seed: 0,
  isBye: false,
  isPlaceholder: true,
});

const isRealParticipant = (participant = {}) =>
  Boolean(participant?.refId && participant?.teamName && !participant?.isBye && !participant?.isPlaceholder);

const normalizeCustomOrder = (participants = [], customOrder = []) => {
  const participantByKeys = new Map();
  participants.forEach((participant) => {
    const keys = [
      participant.refId,
      participant.registrationId,
      participant.teamId,
      participant.teamName,
    ];
    keys.forEach((key) => {
      const normalized = toKey(key);
      if (normalized) participantByKeys.set(normalized, participant);
    });
  });

  const seen = new Set();
  const ordered = [];
  customOrder.forEach((item) => {
    const participant = participantByKeys.get(toKey(item));
    if (!participant || seen.has(participant.refId)) return;
    ordered.push(participant);
    seen.add(participant.refId);
  });

  participants.forEach((participant) => {
    if (seen.has(participant.refId)) return;
    ordered.push(participant);
    seen.add(participant.refId);
  });

  return ordered;
};

const prepareParticipants = ({
  registrations = [],
  seedingMode = 'random',
  customOrder = [],
}) => {
  const baseParticipants = registrations.map((registration, index) =>
    createParticipantFromRegistration(registration, index + 1)
  );

  const ordered = toKey(seedingMode) === 'custom'
    ? normalizeCustomOrder(baseParticipants, customOrder)
    : shuffle(baseParticipants);

  return ordered.map((participant, index) => ({
    ...participant,
    seed: index + 1,
  }));
};

const markReadyRounds = (rounds = []) =>
  rounds.map((round) => ({
    ...round,
    matches: (round.matches || []).map((match) => {
      if (match.status !== 'pending') return match;
      if (isRealParticipant(match.teamA) && isRealParticipant(match.teamB)) {
        return { ...match, status: 'ready' };
      }
      return match;
    }),
  }));

const findMatch = (bracket = {}, matchId = '') => {
  const rounds = Array.isArray(bracket?.rounds) ? bracket.rounds : [];
  for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
    const matches = Array.isArray(rounds[roundIndex]?.matches) ? rounds[roundIndex].matches : [];
    for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
      if (String(matches[matchIndex]?.matchId || '') === String(matchId || '')) {
        return { roundIndex, matchIndex, match: matches[matchIndex] };
      }
    }
  }
  return null;
};

const assignParticipantToMatch = (bracket, matchId, slot, participant) => {
  const located = findMatch(bracket, matchId);
  if (!located) return;
  const targetMatch = bracket.rounds[located.roundIndex].matches[located.matchIndex];
  if (slot === 'A') targetMatch.teamA = clone(participant);
  if (slot === 'B') targetMatch.teamB = clone(participant);
  if (isRealParticipant(targetMatch.teamA) && isRealParticipant(targetMatch.teamB) && targetMatch.status === 'pending') {
    targetMatch.status = 'ready';
  }
};

const resolveByeMatches = (bracket = {}) => {
  let changed = true;
  while (changed) {
    changed = false;
    (bracket.rounds || []).forEach((round) => {
      (round.matches || []).forEach((match) => {
        if (match.status !== 'pending' && match.status !== 'ready') return;

        const participantA = match.teamA || createPlaceholderParticipant();
        const participantB = match.teamB || createPlaceholderParticipant();
        const realA = isRealParticipant(participantA);
        const realB = isRealParticipant(participantB);
        const byeA = participantA?.isBye === true;
        const byeB = participantB?.isBye === true;

        if ((realA && byeB) || (realB && byeA)) {
          const winner = realA ? participantA : participantB;
          match.status = 'walkover';
          match.confirmationStatus = 'resolved';
          match.winnerRefId = winner.refId;
          match.winnerTeamId = winner.teamId || null;
          match.scoreA = realA ? 1 : 0;
          match.scoreB = realB ? 1 : 0;
          if (match.nextMatchId && match.nextSlot) {
            assignParticipantToMatch(bracket, match.nextMatchId, match.nextSlot, winner);
          }
          changed = true;
        }
      });
    });
  }
  return bracket;
};

const buildSingleEliminationBracket = (participants = [], format = 'single_elimination', seedingMode = 'random') => {
  const bracketSize = nextPowerOfTwo(participants.length);
  const paddedParticipants = [...participants];
  while (paddedParticipants.length < bracketSize) {
    paddedParticipants.push(createByeParticipant(paddedParticipants.length + 1));
  }

  const totalRounds = Math.max(1, Math.log2(bracketSize));
  const rounds = [];

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const matchCount = Math.max(1, bracketSize / (2 ** (roundIndex + 1)));
    const roundName = totalRounds === 1
      ? 'Final'
      : roundIndex === totalRounds - 1
        ? 'Final'
        : roundIndex === totalRounds - 2
          ? 'Semifinal'
          : roundIndex === totalRounds - 3
            ? 'Cuartos'
            : `Ronda ${roundIndex + 1}`;

    rounds.push({
      round: roundIndex + 1,
      name: roundName,
      matches: Array.from({ length: matchCount }, (_, matchIndex) => ({
        matchId: `R${roundIndex + 1}-M${matchIndex + 1}`,
        teamA: roundIndex === 0 ? clone(paddedParticipants[matchIndex * 2]) : createPlaceholderParticipant(),
        teamB: roundIndex === 0 ? clone(paddedParticipants[(matchIndex * 2) + 1]) : createPlaceholderParticipant(),
        winnerRefId: '',
        winnerTeamId: null,
        scoreA: null,
        scoreB: null,
        status: 'pending',
        confirmationStatus: 'unconfirmed',
        resultSubmissions: [],
        resolvedBy: null,
        resolvedAt: null,
        nextMatchId: '',
        nextSlot: '',
        loserNextMatchId: '',
        loserNextSlot: '',
      })),
    });
  }

  for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex += 1) {
    const matches = rounds[roundIndex].matches;
    matches.forEach((match, matchIndex) => {
      const nextMatch = rounds[roundIndex + 1].matches[Math.floor(matchIndex / 2)];
      if (!nextMatch) return;
      match.nextMatchId = nextMatch.matchId;
      match.nextSlot = matchIndex % 2 === 0 ? 'A' : 'B';
    });
  }

  return resolveByeMatches({
    format,
    seedingMode,
    size: participants.length,
    isProvisional: false,
    generatedAt: new Date().toISOString(),
    rounds: markReadyRounds(rounds),
  });
};

const buildRoundRobinBracket = (participants = [], format = 'round_robin', seedingMode = 'random') => {
  const entries = [...participants];
  if (entries.length % 2 !== 0) {
    entries.push(createByeParticipant(entries.length + 1));
  }

  const rounds = [];
  const rotation = [...entries];
  const totalRounds = Math.max(1, rotation.length - 1);

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const matches = [];
    for (let slot = 0; slot < rotation.length / 2; slot += 1) {
      const participantA = rotation[slot];
      const participantB = rotation[rotation.length - 1 - slot];
      if (participantA?.isBye || participantB?.isBye) continue;

      matches.push({
        matchId: `R${roundIndex + 1}-M${matches.length + 1}`,
        teamA: clone(participantA),
        teamB: clone(participantB),
        winnerRefId: '',
        winnerTeamId: null,
        scoreA: null,
        scoreB: null,
        status: 'ready',
        confirmationStatus: 'unconfirmed',
        resultSubmissions: [],
        resolvedBy: null,
        resolvedAt: null,
        nextMatchId: '',
        nextSlot: '',
        loserNextMatchId: '',
        loserNextSlot: '',
      });
    }

    rounds.push({
      round: roundIndex + 1,
      name: `Jornada ${roundIndex + 1}`,
      matches,
    });

    const fixed = rotation[0];
    const moved = rotation.pop();
    rotation.splice(1, 0, moved);
    rotation[0] = fixed;
  }

  return {
    format,
    seedingMode,
    size: participants.length,
    isProvisional: false,
    generatedAt: new Date().toISOString(),
    rounds,
  };
};

const computePointsStandings = (participants = [], rounds = []) => {
  const table = new Map();
  participants.forEach((participant) => {
    if (!participant?.refId) return;
    table.set(participant.refId, {
      refId: participant.refId,
      teamName: participant.teamName,
      teamId: participant.teamId || '',
      points: 0,
      buchholz: 0,
    });
  });

  const opponentRefs = new Map();
  const addOpponent = (source, opponent) => {
    if (!source || !opponent) return;
    if (!opponentRefs.has(source)) opponentRefs.set(source, new Set());
    opponentRefs.get(source).add(opponent);
  };

  rounds.forEach((round) => {
    (round.matches || []).forEach((match) => {
      if (match.status !== 'finished') return;
      const refA = String(match?.teamA?.refId || '').trim();
      const refB = String(match?.teamB?.refId || '').trim();
      if (!table.has(refA) || !table.has(refB)) return;

      const entryA = table.get(refA);
      const entryB = table.get(refB);
      const scoreA = Number(match.scoreA ?? 0);
      const scoreB = Number(match.scoreB ?? 0);

      addOpponent(refA, refB);
      addOpponent(refB, refA);

      if (scoreA > scoreB) {
        entryA.points += 3;
      } else if (scoreB > scoreA) {
        entryB.points += 3;
      } else {
        entryA.points += 1;
        entryB.points += 1;
      }
    });
  });

  [...table.values()].forEach((entry) => {
    const opponents = [...(opponentRefs.get(entry.refId) || [])];
    entry.buchholz = opponents.reduce((total, refId) => total + (table.get(refId)?.points || 0), 0);
  });

  return [...table.values()].sort((left, right) => {
    if (right.points !== left.points) return right.points - left.points;
    if (right.buchholz !== left.buchholz) return right.buchholz - left.buchholz;
    return left.teamName.localeCompare(right.teamName);
  });
};

const createSwissRoundMatches = (participants = [], previousRounds = [], roundIndex = 0) => {
  const standings = computePointsStandings(participants, previousRounds);
  const previousPairs = new Set();

  previousRounds.forEach((round) => {
    (round.matches || []).forEach((match) => {
      const refA = String(match?.teamA?.refId || '').trim();
      const refB = String(match?.teamB?.refId || '').trim();
      if (!refA || !refB) return;
      previousPairs.add([refA, refB].sort().join('::'));
    });
  });

  const queue = standings.map((entry) =>
    participants.find((participant) => participant.refId === entry.refId)
  ).filter(Boolean);

  const matches = [];
  while (queue.length > 1) {
    const participantA = queue.shift();
    let opponentIndex = queue.findIndex((participant) => !previousPairs.has([participantA.refId, participant.refId].sort().join('::')));
    if (opponentIndex < 0) opponentIndex = 0;
    const participantB = queue.splice(opponentIndex, 1)[0];
    matches.push({
      matchId: `R${roundIndex + 1}-M${matches.length + 1}`,
      teamA: clone(participantA),
      teamB: clone(participantB),
      winnerRefId: '',
      winnerTeamId: null,
      scoreA: null,
      scoreB: null,
      status: 'ready',
      confirmationStatus: 'unconfirmed',
      resultSubmissions: [],
      resolvedBy: null,
      resolvedAt: null,
      nextMatchId: '',
      nextSlot: '',
      loserNextMatchId: '',
      loserNextSlot: '',
    });
  }

  return matches;
};

const buildSwissBracket = (participants = [], format = 'swiss', seedingMode = 'random') => {
  const roundCount = Math.max(1, Math.ceil(Math.log2(Math.max(2, participants.length))));
  const rounds = [
    {
      round: 1,
      name: 'Ronda 1',
      matches: createSwissRoundMatches(participants, [], 0),
    },
  ];

  for (let roundIndex = 1; roundIndex < roundCount; roundIndex += 1) {
    rounds.push({
      round: roundIndex + 1,
      name: `Ronda ${roundIndex + 1}`,
      matches: [],
    });
  }

  return {
    format,
    seedingMode,
    size: participants.length,
    isProvisional: false,
    generatedAt: new Date().toISOString(),
    rounds,
  };
};

export const buildTournamentBracket = ({
  format = 'single_elimination',
  registrations = [],
  seedingMode = 'random',
  customOrder = [],
}) => {
  const normalizedFormat = normalizeTournamentFormat(format, 'single_elimination');
  const approvedRegistrations = (Array.isArray(registrations) ? registrations : [])
    .filter((registration) => String(registration?.status || 'approved') === 'approved');

  const participants = prepareParticipants({
    registrations: approvedRegistrations,
    seedingMode,
    customOrder,
  });

  if (normalizedFormat === 'single_elimination' || normalizedFormat === 'double_elimination') {
    return buildSingleEliminationBracket(participants, normalizedFormat, seedingMode);
  }
  if (normalizedFormat === 'round_robin') {
    return buildRoundRobinBracket(participants, normalizedFormat, seedingMode);
  }
  if (normalizedFormat === 'swiss') {
    return buildSwissBracket(participants, normalizedFormat, seedingMode);
  }

  return buildSingleEliminationBracket(participants, 'single_elimination', seedingMode);
};

export const getBracketParticipants = (bracket = {}) => {
  const map = new Map();
  (bracket.rounds || []).forEach((round) => {
    (round.matches || []).forEach((match) => {
      [match.teamA, match.teamB].forEach((participant) => {
        if (!isRealParticipant(participant)) return;
        if (!map.has(participant.refId)) {
          map.set(participant.refId, clone(participant));
        }
      });
    });
  });
  return [...map.values()];
};

export const isBracketComplete = (bracket = {}) =>
  (bracket.rounds || []).length > 0 && (bracket.rounds || []).every((round) =>
    Array.isArray(round?.matches) && round.matches.length > 0 &&
    (round.matches || []).every((match) =>
      ['finished', 'walkover'].includes(String(match?.status || '').toLowerCase())
    )
  );

export const resolveBracketMatch = ({
  bracket,
  matchId,
  winnerRefId,
  scoreA = null,
  scoreB = null,
  resolvedBy = null,
  resolvedAt = new Date().toISOString(),
}) => {
  const nextBracket = clone(bracket || {});
  const located = findMatch(nextBracket, matchId);
  if (!located) {
    return { bracket: nextBracket, match: null, advanced: false, completed: isBracketComplete(nextBracket) };
  }

  const match = nextBracket.rounds[located.roundIndex].matches[located.matchIndex];
  const teamARefId = String(match?.teamA?.refId || '');
  const teamBRefId = String(match?.teamB?.refId || '');
  const safeWinnerRefId = String(winnerRefId || '');
  const winner = teamARefId === safeWinnerRefId ? match.teamA : match.teamB;

  let normalizedScoreA = scoreA;
  let normalizedScoreB = scoreB;
  if (normalizedScoreA === null || normalizedScoreB === null) {
    normalizedScoreA = teamARefId === safeWinnerRefId ? 1 : 0;
    normalizedScoreB = teamBRefId === safeWinnerRefId ? 1 : 0;
  }

  match.winnerRefId = safeWinnerRefId;
  match.winnerTeamId = winner?.teamId || null;
  match.scoreA = Number(normalizedScoreA);
  match.scoreB = Number(normalizedScoreB);
  match.status = 'finished';
  match.confirmationStatus = 'resolved';
  match.resolvedBy = resolvedBy || null;
  match.resolvedAt = resolvedAt;

  let advanced = false;
  if (match.nextMatchId && match.nextSlot && winner?.refId) {
    assignParticipantToMatch(nextBracket, match.nextMatchId, match.nextSlot, winner);
    advanced = true;
  }

  const bracketFormat = normalizeTournamentFormat(nextBracket?.format || 'single_elimination', 'single_elimination');
  if (bracketFormat === 'swiss') {
    const currentRound = nextBracket.rounds[located.roundIndex];
    const currentRoundComplete = (currentRound?.matches || []).every((item) =>
      ['finished', 'walkover'].includes(String(item?.status || '').toLowerCase())
    );
    const nextRound = nextBracket.rounds[located.roundIndex + 1];
    if (currentRoundComplete && nextRound && (!nextRound.matches || nextRound.matches.length === 0)) {
      nextRound.matches = createSwissRoundMatches(
        getBracketParticipants(nextBracket),
        nextBracket.rounds.slice(0, located.roundIndex + 1),
        located.roundIndex + 1,
      );
      advanced = true;
    }
  }

  return {
    bracket: {
      ...nextBracket,
      rounds: markReadyRounds(nextBracket.rounds || []),
    },
    match,
    advanced,
    completed: isBracketComplete({
      ...nextBracket,
      rounds: markReadyRounds(nextBracket.rounds || []),
    }),
  };
};
