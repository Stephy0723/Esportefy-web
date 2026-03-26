const TEAM_BASE_RATING = 1000;
const PLAYER_BASE_RATING = 1000;
const DEFAULT_FORMAT_KEY = 'single_elimination';

const POINTS = {
  participation: 12,
  sizeMultipliers: [
    { minTeams: 2, maxTeams: 3, multiplier: 1 },
    { minTeams: 4, maxTeams: 7, multiplier: 1.05 },
    { minTeams: 8, maxTeams: 15, multiplier: 1.12 },
    { minTeams: 16, maxTeams: 31, multiplier: 1.2 },
    { minTeams: 32, maxTeams: null, multiplier: 1.3 }
  ],
  formats: {
    single_elimination: { matchWin: 16, championBonus: 64, finalistBonus: 30, semifinalBonus: 16 },
    double_elimination: { matchWin: 14, championBonus: 64, finalistBonus: 30, semifinalBonus: 16 },
    swiss: { matchWin: 11, championBonus: 40, finalistBonus: 22, semifinalBonus: 12 },
    round_robin: { matchWin: 10, championBonus: 34, finalistBonus: 18, semifinalBonus: 10 }
  }
};

const COUNTRY_CODES = {
  'republica dominicana': 'DO',
  'dominican republic': 'DO',
  'estados unidos': 'US',
  'united states': 'US',
  mexico: 'MX',
  colombia: 'CO',
  venezuela: 'VE',
  argentina: 'AR',
  brasil: 'BR',
  'costa rica': 'CR',
  chile: 'CL',
  peru: 'PE',
  panama: 'PA'
};

const ROLE_LABELS = {
  player: 'Jugador',
  organizer: 'Organizador',
  'content-creator': 'Creador',
  coach: 'Coach',
  caster: 'Caster',
  sponsor: 'Sponsor',
  analyst: 'Analista'
};

const TEAM_COLORS = ['#8EDB15', '#06b6d4', '#3b82f6', '#f59e0b', '#ef4444', '#22c55e', '#a855f7', '#ec4899'];

const norm = (value = '', max = 160) => String(value || '').trim().slice(0, max);
const idOf = (value = null) => (value ? String(value) : '');
const toDate = (value = null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const toIso = (value = null) => {
  const date = toDate(value);
  return date ? date.toISOString() : '';
};
const clean = (value = '') => norm(value, 120).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const scale = (value = 0, multiplier = 1) => Math.round(Number(value || 0) * Number(multiplier || 1));

const getCountryCode = (country = '') => {
  const normalized = clean(country);
  if (!normalized) return 'DO';
  if (normalized.length === 2) return normalized.toUpperCase();
  return COUNTRY_CODES[normalized] || 'DO';
};

const getGameName = (value = '') => {
  const normalized = clean(value);
  if (!normalized) return 'Multigame';
  if (normalized.includes('league of legends') || normalized === 'lol') return 'LoL';
  if (normalized.includes('mobile legends') || normalized === 'mlbb') return 'MLBB';
  if (normalized.includes('ea sports fc')) return 'EA Sports FC';
  if (normalized.includes('street fighter')) return 'Street Fighter';
  if (normalized.includes('rocket league')) return 'Rocket League';
  if (normalized.includes('smash')) return 'Smash Bros';
  if (normalized.includes('free fire')) return 'Free Fire';
  if (normalized.includes('pubg')) return 'PUBG Mobile';
  if (normalized.includes('nba 2k')) return 'NBA 2K';
  if (normalized.includes('warzone')) return 'Warzone';
  if (normalized.includes('valorant')) return 'Valorant';
  if (normalized.includes('tekken')) return 'Tekken';
  if (normalized.includes('efootball')) return 'eFootball';
  return norm(value, 80);
};

const getMode = (tournament = {}) => {
  const raw = clean(`${tournament?.modality || ''} ${tournament?.format || ''}`);
  if (raw.includes('1v1') || raw.includes('solo')) return 'solo';
  if (raw.includes('2v2') || raw.includes('duo')) return 'duo';
  return 'team';
};

const getStatusKey = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'finished' || normalized === 'ongoing') return normalized;
  return 'upcoming';
};

const toUiStatus = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'finished') return 'completed';
  if (normalized === 'ongoing') return 'active';
  return 'upcoming';
};

const getFormatKey = (value = '') => {
  const raw = clean(value);
  if (!raw) return DEFAULT_FORMAT_KEY;
  if (raw === 'double_elimination' || raw.includes('double elimination') || raw.includes('doble eliminacion')) return 'double_elimination';
  if (raw === 'swiss' || raw.includes('suizo')) return 'swiss';
  if (raw === 'round_robin' || raw.includes('round robin') || raw.includes('todos contra todos')) return 'round_robin';
  return DEFAULT_FORMAT_KEY;
};

const getFormatPoints = (tournament = {}) => {
  const key = getFormatKey(tournament?.bracket?.format || tournament?.format || '');
  return { key, ...POINTS.formats[key] };
};

const getSizeTier = (teamsCount = 0) =>
  POINTS.sizeMultipliers.find((tier) => Number(teamsCount) >= tier.minTeams && (tier.maxTeams == null || Number(teamsCount) <= tier.maxTeams))
  || POINTS.sizeMultipliers[0];

const approved = (registration = {}) => String(registration?.status || 'approved').trim().toLowerCase() === 'approved';
const finished = (match = {}) => String(match?.status || '').trim().toLowerCase() === 'finished' && Boolean(match?.winnerTeamId);

const locationOf = (tournament = {}) => norm(tournament?.platform || tournament?.server || 'Online', 80) || 'Online';
const organizerOf = (organizer = null) => (organizer && typeof organizer === 'object' ? norm(organizer?.fullName || organizer?.username, 120) : '') || 'Glitch Gang';
const formatOf = (tournament = {}) => norm(tournament?.format || tournament?.bracket?.format || tournament?.modality || 'Bracket', 80) || 'Bracket';

const prizeOf = (...values) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
  }
  return 0;
};

const colorOf = (seed = '') => {
  const value = norm(seed, 160);
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash) + value.charCodeAt(index);
  return TEAM_COLORS[Math.abs(hash) % TEAM_COLORS.length];
};

const tagOf = (team = {}, fallbackName = '') => {
  if (team?.teamCode) return String(team.teamCode).slice(-4).toUpperCase();
  const initials = norm(team?.university?.universityTag || fallbackName, 24).split(/\s+/).filter(Boolean).map((chunk) => chunk[0]).join('').slice(0, 4).toUpperCase();
  return initials || 'GG';
};

const playerHandleOf = (user = {}) => {
  const social = user?.socialLinks || {};
  const handle = norm(social?.twitter || social?.instagram || social?.tiktok || social?.twitch || social?.youtube, 80);
  if (handle) return handle.startsWith('@') ? handle : `@${handle}`;
  return user?.username ? `@${user.username}` : '@glitchgang';
};

const verifiedPlayer = (user = {}) => Boolean(
  user?.connections?.riot?.verified
  || user?.connections?.mlbb?.verified
  || user?.connections?.discord?.verified
  || user?.connections?.steam?.verified
  || user?.connections?.epic?.verified
  || user?.university?.verified
);

const verifiedTeam = (team = {}) => Boolean(team?.university?.verifiedAt || team?.community || team?.sponsor);

const roleOf = (user = {}, fallback = 'Jugador') => {
  const preferred = Array.isArray(user?.preferredRoles) ? norm(user.preferredRoles[0], 40) : '';
  if (preferred) return preferred;
  const role = Array.isArray(user?.roles) ? user.roles.find((item) => item && item !== 'player') : '';
  return ROLE_LABELS[role] || fallback;
};

const regionOf = ({ user = {}, team = {}, registration = {} } = {}) =>
  norm(user?.university?.city || team?.university?.region || registration?.teamMeta?.university?.region || team?.teamCountry || user?.country || 'Global', 80) || 'Global';

const teamNameOf = ({ registration = {}, team = {}, side = {} } = {}) =>
  norm(registration?.teamName || team?.name || side?.teamName, 120) || 'Equipo';

const collectRoster = ({ registration = {}, team = {}, usersMap = new Map() } = {}) => {
  const items = [];
  const seen = new Set();
  const add = (candidate = {}, fallbackRole = 'Jugador') => {
    const userId = idOf(candidate?.user);
    if (!userId || seen.has(userId)) return;
    const user = usersMap.get(userId);
    if (!user) return;
    seen.add(userId);
    items.push({
      userId,
      user,
      displayName: norm(candidate?.nickname || user?.username || user?.fullName, 60) || 'Jugador',
      role: norm(candidate?.role, 40) || roleOf(user, fallbackRole)
    });
  };
  const addRoster = (roster = {}) => {
    (Array.isArray(roster?.starters) ? roster.starters : []).forEach((entry) => add(entry, 'Jugador'));
    (Array.isArray(roster?.subs) ? roster.subs : []).forEach((entry) => add(entry, 'Suplente'));
  };
  addRoster(registration?.roster);
  if (registration?.captain) add({ user: registration.captain, role: 'Capitan' }, 'Capitan');
  addRoster(team?.roster);
  if (team?.captain) add({ user: team.captain, role: 'Capitan' }, 'Capitan');
  return items;
};

const matchScoreOf = (match = {}) => {
  const a = Number.isFinite(match?.scoreA) ? Number(match.scoreA) : null;
  const b = Number.isFinite(match?.scoreB) ? Number(match.scoreB) : null;
  if (a != null && b != null) return `${a}-${b}`;
  return 'Resultado confirmado';
};

const getPlacements = (tournament = {}) => {
  const rounds = (Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [])
    .map((round) => ({
      round: Number(round?.round || 0),
      matches: (Array.isArray(round?.matches) ? round.matches : []).filter(finished)
    }))
    .filter((round) => round.round > 0 && round.matches.length > 0)
    .sort((a, b) => a.round - b.round);

  if (!rounds.length) return { championTeamId: '', finalistTeamId: '', semifinalistTeamIds: [] };

  if (getFormatKey(tournament?.bracket?.format || tournament?.format || '') === 'swiss' || getFormatKey(tournament?.bracket?.format || tournament?.format || '') === 'round_robin') {
    const table = new Map();
    const ensure = (teamId) => {
      const key = idOf(teamId);
      if (!key) return null;
      if (!table.has(key)) table.set(key, { teamId: key, wins: 0, losses: 0, matches: 0 });
      return table.get(key);
    };
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        const winnerId = idOf(match?.winnerTeamId);
        const teamAId = idOf(match?.teamA?.teamId);
        const teamBId = idOf(match?.teamB?.teamId);
        const loserId = [teamAId, teamBId].find((teamId) => teamId && teamId !== winnerId) || '';
        const winner = ensure(winnerId);
        const loser = ensure(loserId);
        if (winner) { winner.wins += 1; winner.matches += 1; }
        if (loser) { loser.losses += 1; loser.matches += 1; }
      });
    });
    const sorted = Array.from(table.values()).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      if (b.matches !== a.matches) return b.matches - a.matches;
      return a.teamId.localeCompare(b.teamId);
    });
    return {
      championTeamId: sorted[0]?.teamId || '',
      finalistTeamId: sorted[1]?.teamId || '',
      semifinalistTeamIds: sorted.slice(2, 4).map((entry) => entry.teamId).filter(Boolean)
    };
  }

  const finalRound = rounds[rounds.length - 1];
  const finalMatch = finalRound.matches[0];
  const championTeamId = idOf(finalMatch?.winnerTeamId);
  const finalistTeamId = [idOf(finalMatch?.teamA?.teamId), idOf(finalMatch?.teamB?.teamId)].find((teamId) => teamId && teamId !== championTeamId) || '';
  const semifinalRound = rounds.length > 1 ? rounds[rounds.length - 2] : null;
  const semifinalistTeamIds = semifinalRound
    ? semifinalRound.matches.map((match) => [idOf(match?.teamA?.teamId), idOf(match?.teamB?.teamId)].find((teamId) => teamId && teamId !== idOf(match?.winnerTeamId)) || '').filter(Boolean)
    : [];

  return { championTeamId, finalistTeamId, semifinalistTeamIds: Array.from(new Set(semifinalistTeamIds)) };
};

export const calculatePlatformRankings = ({ tournaments = [], teams = [], users = [] } = {}) => {
  const usersMap = new Map(users.map((user) => [idOf(user?._id), user]));
  const teamsMap = new Map(teams.map((team) => [idOf(team?._id), team]));
  const playerMap = new Map();
  const teamMap = new Map();
  const tournamentRosters = new Map();
  const tournamentNames = new Map();

  const ensureTeam = (teamId, context = {}) => {
    const key = idOf(teamId);
    if (!key) return null;
    const team = context.team || teamsMap.get(key) || {};
    const name = teamNameOf({ registration: context.registration, team, side: context.side });
    if (!teamMap.has(key)) {
      teamMap.set(key, {
        id: key,
        name,
        tag: tagOf(team, name),
        region: norm(team?.university?.region || team?.teamCountry || 'Global', 80) || 'Global',
        founded: toDate(team?.createdAt || context.date)?.getFullYear() || new Date().getFullYear(),
        games: new Set(),
        members: new Set(),
        points: 0,
        rating: TEAM_BASE_RATING,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        trophies: 0,
        verified: verifiedTeam(team),
        color: colorOf(name),
        achievements: [],
        _keys: new Set()
      });
    }
    const entry = teamMap.get(key);
    if (context.game) entry.games.add(context.game);
    return entry;
  };

  const ensurePlayer = (userId, context = {}) => {
    const key = idOf(userId);
    const user = context.user || usersMap.get(key);
    if (!key || !user) return null;
    if (!playerMap.has(key)) {
      playerMap.set(key, {
        id: key,
        player: norm(user?.username || user?.fullName, 60) || 'Jugador',
        realName: norm(user?.fullName || user?.username, 80) || 'Jugador',
        team: '',
        game: '',
        region: regionOf({ user, team: context.team, registration: context.registration }),
        country: getCountryCode(user?.country),
        points: 0,
        rating: PLAYER_BASE_RATING,
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        tournamentsPlayed: 0,
        tournamentsWon: 0,
        role: norm(context.role, 40) || roleOf(user),
        socialMedia: playerHandleOf(user),
        joinDate: toIso(user?.createdAt),
        bio: norm(user?.bio, 320),
        verified: verifiedPlayer(user),
        achievements: { solo: [], duo: [], team: [] },
        matchHistory: [],
        teamHistory: new Map(),
        _teamScores: new Map(),
        _gameScores: new Map(),
        _recent: [],
        _keys: new Set(),
        _counted: new Set()
      });
    }
    const entry = playerMap.get(key);
    if (context.teamName && context.date) {
      const date = toDate(context.date) || new Date();
      const history = entry.teamHistory.get(context.teamName) || { team: context.teamName, from: date, to: date };
      if (date < history.from) history.from = date;
      if (date > history.to) history.to = date;
      entry.teamHistory.set(context.teamName, history);
    }
    if (context.teamName) {
      const score = entry._teamScores.get(context.teamName) || { points: 0, lastAt: null };
      score.points += Number(context.score || 0);
      score.lastAt = toDate(context.date) || score.lastAt;
      entry._teamScores.set(context.teamName, score);
    }
    if (context.game) {
      const score = entry._gameScores.get(context.game) || { points: 0, lastAt: null };
      score.points += Number(context.score || 0);
      score.lastAt = toDate(context.date) || score.lastAt;
      entry._gameScores.set(context.game, score);
      if (!entry.game) entry.game = context.game;
    }
    return entry;
  };

  const addAch = (list, data, keySet) => {
    const key = `${data.name}|${data.date}|${data.place}|${data.team || ''}`;
    if (keySet.has(key)) return;
    keySet.add(key);
    list.push(data);
  };

  [...tournaments]
    .filter((tournament) => String(tournament?.status || '').trim().toLowerCase() !== 'cancelled')
    .sort((a, b) => (toDate(a?.date || a?.createdAt)?.getTime() || 0) - (toDate(b?.date || b?.createdAt)?.getTime() || 0))
    .forEach((tournament) => {
      const tournamentId = idOf(tournament?._id || tournament?.tournamentId);
      const date = toDate(tournament?.date || tournament?.createdAt) || new Date();
      const game = getGameName(tournament?.game);
      const statusKey = getStatusKey(tournament?.status);
      const formatPoints = getFormatPoints(tournament);
      const regs = (Array.isArray(tournament?.registrations) ? tournament.registrations : []).filter(approved);
      const sizeTier = getSizeTier(regs.length);
      const participationPoints = statusKey === 'upcoming' ? 0 : scale(POINTS.participation, sizeTier.multiplier);
      const rosters = new Map();
      const names = new Map();

      regs.forEach((registration) => {
        const teamId = idOf(registration?.teamId);
        if (!teamId) return;
        const team = teamsMap.get(teamId) || {};
        const teamEntry = ensureTeam(teamId, { team, registration, date, game });
        if (!teamEntry) return;
        if (participationPoints) teamEntry.points += participationPoints;
        names.set(teamId, teamEntry.name);
        const roster = collectRoster({ registration, team, usersMap });
        rosters.set(teamId, roster);
        roster.forEach((slot) => {
          teamEntry.members.add(slot.userId);
          const player = ensurePlayer(slot.userId, { user: slot.user, team, registration, teamName: teamEntry.name, game, date, score: participationPoints, role: slot.role });
          if (!player) return;
          if (!player._counted.has(tournamentId) && statusKey !== 'upcoming') {
            player._counted.add(tournamentId);
            player.tournamentsPlayed += 1;
            player.points += participationPoints;
          }
        });
      });

      tournamentRosters.set(tournamentId, rosters);
      tournamentNames.set(tournamentId, names);
      const rounds = [...(Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [])].sort((a, b) => Number(a?.round || 0) - Number(b?.round || 0));
      const maxRound = rounds.reduce((maxValue, round) => Math.max(maxValue, Number(round?.round || 0)), 1);

      rounds.forEach((round) => {
        const stageFactor = 1 + ((Number(round?.round || 0) / maxRound) * 0.12);
        const teamK = Math.round(24 * sizeTier.multiplier * stageFactor);
        const playerK = Math.round(18 * sizeTier.multiplier * stageFactor);

        (Array.isArray(round?.matches) ? round.matches : []).filter(finished).forEach((match) => {
          const teamAId = idOf(match?.teamA?.teamId);
          const teamBId = idOf(match?.teamB?.teamId);
          const winnerId = idOf(match?.winnerTeamId);
          const loserId = [teamAId, teamBId].find((teamId) => teamId && teamId !== winnerId) || '';
          if (!teamAId || !teamBId || !winnerId || !loserId) return;

          const teamA = ensureTeam(teamAId, { team: teamsMap.get(teamAId), side: match?.teamA, date, game });
          const teamB = ensureTeam(teamBId, { team: teamsMap.get(teamBId), side: match?.teamB, date, game });
          if (!teamA || !teamB) return;

          const expectedA = 1 / (1 + Math.pow(10, (teamB.rating - teamA.rating) / 400));
          const deltaTeamA = Math.round(teamK * ((winnerId === teamAId ? 1 : 0) - expectedA));
          const deltaTeamB = -deltaTeamA;

          teamA.rating += deltaTeamA;
          teamB.rating += deltaTeamB;
          teamA.matchesPlayed += 1;
          teamB.matchesPlayed += 1;
          teamA[winnerId === teamAId ? 'wins' : 'losses'] += 1;
          teamB[winnerId === teamBId ? 'wins' : 'losses'] += 1;
          if (winnerId === teamAId) teamA.points += scale(formatPoints.matchWin, sizeTier.multiplier);
          if (winnerId === teamBId) teamB.points += scale(formatPoints.matchWin, sizeTier.multiplier);

          const applyMatchToPlayers = (roster = [], ownTeam, opponentTeam, didWin, delta) => {
            roster.forEach((slot) => {
              const player = ensurePlayer(slot.userId, { user: slot.user, team: teamsMap.get(ownTeam.id), teamName: ownTeam.name, game, date, score: didWin ? scale(formatPoints.matchWin, sizeTier.multiplier) : 0, role: slot.role });
              if (!player) return;
              player.rating += delta;
              player.matchesPlayed += 1;
              player[didWin ? 'wins' : 'losses'] += 1;
              if (didWin) player.points += scale(formatPoints.matchWin, sizeTier.multiplier);
              player._recent.unshift({ result: didWin ? 'win' : 'loss', date });
              player.matchHistory.unshift({
                date: toIso(date),
                opponent: opponentTeam.name,
                opponentTeam: opponentTeam.name,
                result: didWin ? 'win' : 'loss',
                score: matchScoreOf(match),
                tournament: norm(tournament?.title, 120) || 'Torneo',
                mode: getMode(tournament)
              });
            });
          };

          applyMatchToPlayers(rosters.get(teamAId) || [], teamA, teamB, winnerId === teamAId, Math.round(playerK * ((winnerId === teamAId ? 1 : 0) - expectedA)));
          applyMatchToPlayers(rosters.get(teamBId) || [], teamB, teamA, winnerId === teamBId, Math.round(playerK * ((winnerId === teamBId ? 1 : 0) - (1 - expectedA))));
        });
      });

      if (String(tournament?.status || '').trim().toLowerCase() === 'finished') {
        const placementBonus = new Map([
          [1, scale(formatPoints.championBonus, sizeTier.multiplier)],
          [2, scale(formatPoints.finalistBonus, sizeTier.multiplier)],
          [3, scale(formatPoints.semifinalBonus, sizeTier.multiplier)]
        ]);
        const mode = getMode(tournament);
        const applyPlacement = (teamId, place) => {
          const teamEntry = ensureTeam(teamId, { team: teamsMap.get(teamId), date, game });
          if (!teamEntry) return;
          const bonus = placementBonus.get(place) || 0;
          if (bonus) teamEntry.points += bonus;
          if (place === 1) teamEntry.trophies += 1;
          addAch(teamEntry.achievements, { name: norm(tournament?.title, 120) || 'Torneo', date: toIso(date), place }, teamEntry._keys);

          const roster = rosters.get(teamId) || [];
          const rosterNames = roster.map((slot) => slot.displayName);
          roster.forEach((slot) => {
            const player = ensurePlayer(slot.userId, { user: slot.user, team: teamsMap.get(teamId), teamName: teamEntry.name, game, date, score: bonus, role: slot.role });
            if (!player) return;
            if (bonus) player.points += bonus;
            if (place === 1) player.tournamentsWon += 1;
            const base = { name: norm(tournament?.title, 120) || 'Torneo', date: toIso(date), place };
            if (mode === 'solo') addAch(player.achievements.solo, base, player._keys);
            else if (mode === 'duo') addAch(player.achievements.duo, { ...base, partner: rosterNames.find((name) => name !== slot.displayName) || '' }, player._keys);
            else addAch(player.achievements.team, { ...base, team: teamEntry.name, roster: rosterNames }, player._keys);
          });
        };

        const placements = getPlacements(tournament);
        if (placements.championTeamId) applyPlacement(placements.championTeamId, 1);
        if (placements.finalistTeamId) applyPlacement(placements.finalistTeamId, 2);
        placements.semifinalistTeamIds.forEach((teamId) => applyPlacement(teamId, 3));
      }
    });

  const sortRecent = (a, b) => (toDate(b?.date)?.getTime() || 0) - (toDate(a?.date)?.getTime() || 0);
  const getTrend = (recent = []) => {
    const sample = recent.slice(0, 5);
    const wins = sample.filter((item) => item.result === 'win').length;
    const losses = sample.filter((item) => item.result === 'loss').length;
    return wins === losses ? 0 : (wins > losses ? 1 : -1);
  };
  const getStreak = (recent = []) => {
    if (!recent.length) return 0;
    const first = recent[0].result;
    let total = 0;
    for (const item of recent) { if (item.result !== first) break; total += 1; }
    return first === 'win' ? total : -total;
  };

  const players = Array.from(playerMap.values()).map((player) => {
    const teamName = [...player._teamScores.entries()].sort((a, b) => (b[1].points - a[1].points) || ((b[1].lastAt?.getTime?.() || 0) - (a[1].lastAt?.getTime?.() || 0)))[0]?.[0] || 'Free Agent';
    const game = [...player._gameScores.entries()].sort((a, b) => (b[1].points - a[1].points) || ((b[1].lastAt?.getTime?.() || 0) - (a[1].lastAt?.getTime?.() || 0)))[0]?.[0] || player.game || 'Multigame';
    const recent = [...player._recent].sort(sortRecent);
    return {
      id: player.id,
      player: player.player,
      realName: player.realName,
      team: teamName,
      game,
      region: player.region || 'Global',
      country: (player.country || 'DO').toUpperCase(),
      points: Math.round(player.points || 0),
      rating: Math.round(player.rating || PLAYER_BASE_RATING),
      wins: Number(player.wins || 0),
      losses: Number(player.losses || 0),
      matchesPlayed: Number(player.matchesPlayed || 0),
      tournamentsPlayed: Number(player.tournamentsPlayed || 0),
      tournamentsWon: Number(player.tournamentsWon || 0),
      winRate: player.matchesPlayed ? Math.round((player.wins / player.matchesPlayed) * 100) : 0,
      lastActivity: toIso(recent[0]?.date),
      trend: getTrend(recent),
      streak: getStreak(recent),
      role: player.role || 'Jugador',
      socialMedia: player.socialMedia,
      joinDate: player.joinDate,
      bio: player.bio,
      verified: Boolean(player.verified),
      teamHistory: Array.from(player.teamHistory.values()).sort((a, b) => b.to.getTime() - a.to.getTime()).map((entry) => ({ team: entry.team, from: String(entry.from.getFullYear()), to: entry.team === teamName ? 'Presente' : String(entry.to.getFullYear()) })),
      achievements: {
        solo: [...player.achievements.solo].sort(sortRecent),
        duo: [...player.achievements.duo].sort(sortRecent),
        team: [...player.achievements.team].sort(sortRecent)
      },
      matchHistory: [...player.matchHistory].sort(sortRecent).slice(0, 20)
    };
  }).filter((player) => player.tournamentsPlayed > 0 || player.matchesPlayed > 0).sort((a, b) => (b.rating - a.rating) || (b.points - a.points) || (b.tournamentsWon - a.tournamentsWon) || (b.winRate - a.winRate) || a.player.localeCompare(b.player));

  const teamsData = Array.from(teamMap.values()).map((team) => ({
    id: team.id,
    name: team.name,
    tag: team.tag,
    region: team.region || 'Global',
    founded: Number(team.founded) || new Date().getFullYear(),
    games: Array.from(team.games).sort((a, b) => a.localeCompare(b)),
    players: team.members.size,
    trophies: Number(team.trophies || 0),
    points: Math.round(team.points || 0),
    rating: Math.round(team.rating || TEAM_BASE_RATING),
    winRate: team.matchesPlayed ? Math.round((team.wins / team.matchesPlayed) * 100) : 0,
    logo: '',
    color: team.color,
    verified: Boolean(team.verified),
    achievements: [...team.achievements].sort(sortRecent),
    matchesPlayed: Number(team.matchesPlayed || 0),
    wins: Number(team.wins || 0),
    losses: Number(team.losses || 0)
  })).filter((team) => team.matchesPlayed > 0 || team.points > 0).sort((a, b) => (b.rating - a.rating) || (b.points - a.points) || (b.trophies - a.trophies) || (b.winRate - a.winRate) || a.name.localeCompare(b.name));

  const tournamentsData = [...tournaments].filter((tournament) => String(tournament?.status || '').trim().toLowerCase() !== 'cancelled').sort((a, b) => (toDate(b?.date || b?.createdAt)?.getTime() || 0) - (toDate(a?.date || a?.createdAt)?.getTime() || 0)).map((tournament) => {
    const tournamentId = idOf(tournament?._id || tournament?.tournamentId);
    const placements = String(tournament?.status || '').trim().toLowerCase() === 'finished' ? getPlacements(tournament) : { championTeamId: '', finalistTeamId: '' };
    const names = tournamentNames.get(tournamentId) || new Map();
    return {
      id: idOf(tournament?.tournamentId || tournament?._id),
      name: norm(tournament?.title, 120) || 'Torneo',
      game: getGameName(tournament?.game),
      status: toUiStatus(tournament?.status),
      startDate: toIso(tournament?.date || tournament?.createdAt),
      endDate: toIso(tournament?.date || tournament?.createdAt),
      prize: prizeOf(tournament?.prizePool, tournament?.prizesByRank?.first, tournament?.prizesByRank?.second, tournament?.prizesByRank?.third),
      currency: norm(tournament?.currency, 8) || 'USD',
      teams: Number(tournament?.maxSlots || 0) || 0,
      registeredTeams: (Array.isArray(tournament?.registrations) ? tournament.registrations : []).filter(approved).length,
      location: locationOf(tournament),
      organizer: organizerOf(tournament?.organizer),
      format: formatOf(tournament),
      champion: norm(names.get(placements?.championTeamId) || teamsMap.get(idOf(placements?.championTeamId))?.name, 120),
      runnerUp: norm(names.get(placements?.finalistTeamId) || teamsMap.get(idOf(placements?.finalistTeamId))?.name, 120),
      featured: Boolean(prizeOf(tournament?.prizePool) > 0 || String(tournament?.status || '').trim().toLowerCase() === 'finished')
    };
  });

  const games = Array.from(new Set([...players.map((player) => player.game), ...teamsData.flatMap((team) => team.games), ...tournamentsData.map((tournament) => tournament.game)])).filter(Boolean).sort((a, b) => a.localeCompare(b));
  const regions = Array.from(new Set([...players.map((player) => player.region), ...teamsData.map((team) => team.region)])).filter(Boolean).sort((a, b) => a.localeCompare(b));

  return {
    players,
    teams: teamsData,
    tournaments: tournamentsData,
    filters: { games: ['Todos', ...games], regions: ['Todas', ...regions] },
    meta: {
      generatedAt: new Date().toISOString(),
      totalPlayers: players.length,
      totalTeams: teamsData.length,
      activeTournaments: tournamentsData.filter((tournament) => tournament.status === 'active').length,
      completedTournaments: tournamentsData.filter((tournament) => tournament.status === 'completed').length
    }
  };
};

export const getPlatformRankingConfig = () => ({
  baseRatings: { team: TEAM_BASE_RATING, player: PLAYER_BASE_RATING },
  points: {
    participation: POINTS.participation,
    sizeMultipliers: POINTS.sizeMultipliers.map((item) => ({ ...item })),
    formats: { ...POINTS.formats }
  }
});
