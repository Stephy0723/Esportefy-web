import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { NOTIF, pushNotification } from './notification.controller.js';

const ROLE_NAMES = {
    "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
    "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
    "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
    "Overwatch 2": ["Tank", "DPS", "Support"],
    "TFT": ["Tactician"],
    "FIFA / EA FC": ["Player"],
    "Free Fire": ["Rusher", "Support", "Sniper", "IGL"]
};

const RIOT_GAMES = new Set([
    'Valorant',
    'League of Legends',
    'Wild Rift',
    'Teamfight Tactics',
    'Legends of Runeterra'
]);
import fs from 'fs';

const isFreeEntryMode = (value = '') => String(value || '').trim().toLowerCase() === 'gratis';
const isRiotReviewMode = () => String(process.env.RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true';
const DEFAULT_RIOT_MIN_ACTIVE_PARTICIPANTS = 20;

const DIGITS_ONLY_REGEX = /^\d+$/;
const BRACKET_SEEDING_MODES = new Set(['random', 'custom']);
const BRACKET_FORMATS = new Set(['single_elimination', 'double_elimination', 'swiss', 'round_robin']);
const ROUND_NAME_BY_MATCHES = new Map([
    [1, 'Final'],
    [2, 'Semifinal'],
    [4, 'Cuartos de final'],
    [8, 'Octavos de final'],
    [16, 'Dieciseisavos']
]);
const BRACKET_FORMAT_ALIASES = new Map([
    ['single_elimination', 'single_elimination'],
    ['single elimination', 'single_elimination'],
    ['eliminación directa', 'single_elimination'],
    ['eliminacion directa', 'single_elimination'],
    ['eliminación simple', 'single_elimination'],
    ['eliminacion simple', 'single_elimination'],
    ['elim simple', 'single_elimination'],
    ['elim. simple', 'single_elimination'],
    ['double_elimination', 'double_elimination'],
    ['double elimination', 'double_elimination'],
    ['doble eliminación', 'double_elimination'],
    ['doble eliminacion', 'double_elimination'],
    ['swiss', 'swiss'],
    ['suizo', 'swiss'],
    ['suizo (swiss)', 'swiss'],
    ['round robin', 'round_robin'],
    ['round_robin', 'round_robin']
]);

const getRiotMinActiveParticipants = () => {
    const raw = Number(process.env.RIOT_TOURNAMENT_MIN_ACTIVE_PARTICIPANTS);
    if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
    return DEFAULT_RIOT_MIN_ACTIVE_PARTICIPANTS;
};

const parseTeamSizeFromModality = (modality = '') => {
    const raw = String(modality || '').trim().toLowerCase();
    const match = raw.match(/^(\d+)\s*v\s*(\d+)$/i);
    if (!match) return 1;

    const left = Number.parseInt(match[1], 10);
    const right = Number.parseInt(match[2], 10);
    if (!Number.isFinite(left) || left <= 0) return 1;
    if (!Number.isFinite(right) || right <= 0) return left;
    return Math.max(left, right);
};

const isRiotTournamentPolicyScope = (source = {}) => {
    const game = String(source?.game || '').trim();
    return RIOT_GAMES.has(game) || source?.riotRequirements?.required === true;
};

const requiresFreeEntryByPolicy = (source = {}) => isRiotReviewMode() || isRiotTournamentPolicyScope(source);

const getParticipantCapacityBySettings = ({ modality = '', maxSlots = 0 } = {}) => {
    const slots = Number(maxSlots) || 0;
    const teamSize = parseTeamSizeFromModality(modality);
    return Math.max(0, slots) * Math.max(1, teamSize);
};

const hasPlayerIdentity = (player = {}) => {
    return Boolean(
        String(player?.nickname || '').trim()
        || String(player?.riotId || '').trim()
        || String(player?.gameId || '').trim()
    );
};

const countActiveParticipantsInRegistration = (registration = {}, teamSize = 1) => {
    const starters = Array.isArray(registration?.roster?.starters) ? registration.roster.starters : [];
    const validStarters = starters.filter(hasPlayerIdentity);
    if (validStarters.length > 0) {
        return Math.min(validStarters.length, Math.max(1, teamSize));
    }
    return Math.max(1, teamSize);
};

const countTournamentActiveParticipants = (tournament = {}) => {
    const teamSize = parseTeamSizeFromModality(tournament?.modality);
    const approved = (tournament?.registrations || []).filter(isApprovedRegistration);
    return approved.reduce((sum, registration) => (
        sum + countActiveParticipantsInRegistration(registration, teamSize)
    ), 0);
};

const hasTraditionalTournamentBracket = (bracket = {}) => {
    const format = normalizeTournamentFormat(bracket?.format);
    if (!BRACKET_FORMATS.has(format)) return false;
    const rounds = Array.isArray(bracket?.rounds) ? bracket.rounds : [];
    if (!rounds.length) return false;
    return rounds.some((round) => Array.isArray(round?.matches) && round.matches.length > 0);
};

const isTournamentOwner = (tournament, userId) => {
    return String(tournament?.organizer?._id || tournament?.organizer || '') === String(userId || '');
};

const normalizeTournamentFormat = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw) return 'single_elimination';
    if (BRACKET_FORMATS.has(raw)) return raw;
    if (BRACKET_FORMAT_ALIASES.has(raw)) return BRACKET_FORMAT_ALIASES.get(raw);

    if (raw.includes('doble')) return 'double_elimination';
    if (raw.includes('swiss') || raw.includes('suizo')) return 'swiss';
    if (raw.includes('round robin') || raw.includes('round_robin')) return 'round_robin';
    if (raw.includes('elim') || raw.includes('single')) return 'single_elimination';

    return 'single_elimination';
};

const normalizeRiotId = (value = '') => String(value || '').trim().toLowerCase();

const getRegistrationRiotIds = (registration = {}) => {
    const starters = Array.isArray(registration?.roster?.starters) ? registration.roster.starters : [];
    const subs = Array.isArray(registration?.roster?.subs) ? registration.roster.subs : [];
    return [...starters, ...subs]
        .map((player) => normalizeRiotId(player?.riotId))
        .filter(Boolean);
};

const collectTournamentRiotIds = (registrations = []) => {
    const riotIds = new Set();
    for (const registration of registrations || []) {
        const status = String(registration?.status || 'approved').toLowerCase();
        if (status === 'rejected') continue;
        for (const riotId of getRegistrationRiotIds(registration)) {
            riotIds.add(riotId);
        }
    }
    return riotIds;
};

const findDuplicate = (values = []) => {
    const seen = new Set();
    for (const value of values || []) {
        const normalized = String(value || '');
        if (!normalized) continue;
        if (seen.has(normalized)) return normalized;
        seen.add(normalized);
    }
    return '';
};

const normalizePositiveInteger = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw || !DIGITS_ONLY_REGEX.test(raw)) return null;
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
};

const normalizeNonNegativeNumber = (value) => {
    const raw = String(value ?? '').trim().replace(',', '.');
    if (!raw) return null;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
};

const normalizeMoneyString = (value) => {
    const parsed = normalizeNonNegativeNumber(value);
    if (parsed === null) return '';
    return String(parsed);
};

const nextPowerOfTwo = (value) => {
    const n = Number(value) || 0;
    let p = 1;
    while (p < n) p *= 2;
    return p;
};

const shuffleArray = (input = []) => {
    const copy = [...input];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const isApprovedRegistration = (registration = {}) => {
    const status = String(registration?.status || 'approved').toLowerCase();
    return status === 'approved';
};

const toBracketEntry = (registration = {}) => {
    const registrationId = registration?._id ? String(registration._id) : '';
    const fallbackRef = registration?.teamId ? String(registration.teamId) : '';
    const refId = registrationId || fallbackRef;
    if (!refId) return null;

    return {
        refId,
        registrationId: registrationId || null,
        teamId: registration?.teamId ? String(registration.teamId) : null,
        teamName: String(registration?.teamName || 'Equipo').trim() || 'Equipo',
        logoUrl: registration?.logoUrl || '',
        isBye: false,
        isPlaceholder: false
    };
};

const makeByeEntry = (index) => ({
    refId: `BYE-${index}`,
    registrationId: null,
    teamId: null,
    teamName: 'BYE',
    logoUrl: '',
    isBye: true,
    isPlaceholder: false
});

const makePlaceholderEntry = (index) => ({
    refId: `BYE-SLOT-${index}`,
    registrationId: null,
    teamId: null,
    teamName: `Vacante ${index}`,
    logoUrl: '',
    isBye: false,
    isPlaceholder: true
});

const makeRoutedByeEntry = (sourceMatch = {}, routeType = 'winner') => ({
    refId: `BYE-${String(routeType || 'winner').toUpperCase()}-${String(sourceMatch?.matchId || 'M')}`,
    registrationId: null,
    teamId: null,
    teamName: 'BYE',
    logoUrl: '',
    isBye: true,
    isPlaceholder: false
});

const toParticipant = (entry, seed) => {
    const rawSeed = seed ?? entry?.seed;
    const normalizedSeed = Number(rawSeed);
    return {
        refId: entry?.refId || '',
        registrationId: entry?.registrationId || null,
        teamId: entry?.teamId || null,
        teamName: entry?.teamName || 'Equipo',
        logoUrl: entry?.logoUrl || '',
        seed: Number.isFinite(normalizedSeed) ? normalizedSeed : null,
        isBye: Boolean(entry?.isBye),
        isPlaceholder: Boolean(entry?.isPlaceholder)
    };
};

const isPlayableParticipant = (participant = null) => Boolean(
    participant
    && !participant.isBye
    && !participant.isPlaceholder
);

const isVacantParticipant = (participant = null) => {
    if (!participant) return true;
    if (participant.isPlaceholder) return true;
    const hasIdentity = Boolean(participant?.teamId || participant?.registrationId);
    return Boolean(participant.isBye && !hasIdentity);
};

const buildRoundName = (matchesCount, roundNumber) => {
    return ROUND_NAME_BY_MATCHES.get(matchesCount) || `Ronda ${roundNumber}`;
};

const createMatchSkeleton = ({
    matchId,
    nextMatchId = '',
    nextSlot = '',
    loserNextMatchId = '',
    loserNextSlot = ''
} = {}) => ({
    matchId: String(matchId || ''),
    teamA: null,
    teamB: null,
    winnerRefId: '',
    winnerTeamId: null,
    scoreA: null,
    scoreB: null,
    status: 'pending',
    confirmationStatus: 'unconfirmed',
    resultSubmissions: [],
    resolvedBy: null,
    resolvedAt: null,
    nextMatchId,
    nextSlot,
    loserNextMatchId,
    loserNextSlot
});

const setMatchStatus = (match) => {
    const a = match?.teamA || null;
    const b = match?.teamB || null;
    const aPlayable = isPlayableParticipant(a);
    const bPlayable = isPlayableParticipant(b);

    if (match?.status === 'finished' || match?.status === 'live') return;
    if (aPlayable && bPlayable) {
        match.status = 'ready';
        return;
    }
    if ((aPlayable && b?.isBye) || (bPlayable && a?.isBye)) {
        match.status = 'walkover';
        return;
    }
    match.status = 'pending';
};

const findMatchById = (rounds = [], matchId = '') => {
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
        const matchIndex = (rounds[roundIndex].matches || []).findIndex((m) => m.matchId === matchId);
        if (matchIndex >= 0) {
            return {
                roundIndex,
                matchIndex,
                match: rounds[roundIndex].matches[matchIndex]
            };
        }
    }
    return null;
};

const buildRoutedParticipant = (participant = null, currentSlot = null, fallback = null) => {
    const source = participant && participant.refId ? participant : fallback;
    if (!source || !source.refId) return null;

    const sourceSeed = Number(source?.seed);
    const currentSeed = Number(currentSlot?.seed);
    const normalizedSeed = Number.isFinite(sourceSeed)
        ? sourceSeed
        : (Number.isFinite(currentSeed) ? currentSeed : null);

    return {
        refId: source.refId,
        registrationId: source.registrationId || null,
        teamId: source.teamId || null,
        teamName: source.teamName || 'Equipo',
        logoUrl: source.logoUrl || '',
        seed: normalizedSeed,
        isBye: Boolean(source.isBye),
        isPlaceholder: Boolean(source.isPlaceholder)
    };
};

const placeParticipantByRoute = (rounds = [], sourceMatch = {}, participant = null, route = 'winner') => {
    const isLoserRoute = route === 'loser';
    const nextMatchId = isLoserRoute ? sourceMatch?.loserNextMatchId : sourceMatch?.nextMatchId;
    const nextSlot = isLoserRoute ? sourceMatch?.loserNextSlot : sourceMatch?.nextSlot;
    if (!nextMatchId || !nextSlot) return;

    const located = findMatchById(rounds, nextMatchId);
    if (!located?.match) return;

    const slotKey = nextSlot === 'B' ? 'teamB' : 'teamA';
    const current = located.match[slotKey];
    const sourceParticipant = (
        isLoserRoute && participant?.isPlaceholder
            ? null
            : participant
    );
    const routed = buildRoutedParticipant(
        sourceParticipant,
        current,
        isLoserRoute ? makeRoutedByeEntry(sourceMatch, 'loser') : null
    );
    if (!routed?.refId) return;

    if (current?.refId === routed.refId) {
        setMatchStatus(located.match);
        return;
    }
    if (current?.refId && !isVacantParticipant(current) && current.refId !== routed.refId) {
        return;
    }

    located.match[slotKey] = routed;
    setMatchStatus(located.match);
};

const placeWinnerInNextMatch = (rounds = [], sourceMatch = {}, winner = null) => {
    placeParticipantByRoute(rounds, sourceMatch, winner, 'winner');
};

const placeLoserInNextMatch = (rounds = [], sourceMatch = {}, loser = null) => {
    placeParticipantByRoute(rounds, sourceMatch, loser, 'loser');
};

const resolveAutoAdvance = (rounds = []) => {
    if (!Array.isArray(rounds) || rounds.length === 0) return;

    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
        const matches = rounds[roundIndex].matches || [];
        for (const match of matches) {
            setMatchStatus(match);

            const teamA = match.teamA;
            const teamB = match.teamB;
            const canA = isPlayableParticipant(teamA);
            const canB = isPlayableParticipant(teamB);

            if (canA && canB) continue;

            let winner = null;
            if (canA && teamB?.isBye) winner = teamA;
            if (canB && teamA?.isBye) winner = teamB;
            if (!winner) continue;
            const loser = winner === teamA ? teamB : teamA;

            match.winnerRefId = winner.refId;
            match.winnerTeamId = winner.teamId || null;
            match.status = 'walkover';
            match.confirmationStatus = 'resolved';
            match.scoreA = null;
            match.scoreB = null;
            placeWinnerInNextMatch(rounds, match, winner);
            placeLoserInNextMatch(rounds, match, loser);
        }
    }
};

const normalizeSeedingMode = (mode) => {
    const normalized = String(mode || 'random').toLowerCase();
    return BRACKET_SEEDING_MODES.has(normalized) ? normalized : 'random';
};

const applyCustomOrder = (entries = [], customOrder = [], { bracketSize = null, vacancyMode = 'bye' } = {}) => {
    const order = Array.isArray(customOrder)
        ? customOrder.map((id) => String(id || '')).filter(Boolean)
        : [];

    const entryMap = new Map(entries.map((entry) => [entry.refId, entry]));
    if (entryMap.size !== entries.length) {
        throw new Error('Hay equipos duplicados en las inscripciones y no se puede generar un orden personalizado');
    }

    const targetBracketSize = Number(bracketSize) > 0
        ? Number(bracketSize)
        : nextPowerOfTwo(Math.max(entries.length, 2));
    const isClassicOrder = order.length === entries.length;
    const isExpandedOrder = order.length === targetBracketSize;

    if (!isClassicOrder && !isExpandedOrder) {
        throw new Error('El orden personalizado no coincide con los cupos válidos del bracket');
    }

    const usedRefs = new Set();
    const usedVacancyRefs = new Set();
    const normalizedOrder = [];
    let vacancyCounter = 1;
    const vacancyFactory = vacancyMode === 'placeholder' ? makePlaceholderEntry : makeByeEntry;

    for (const refId of order) {
        if (entryMap.has(refId)) {
            if (usedRefs.has(refId)) {
                throw new Error('El orden personalizado contiene equipos repetidos');
            }
            usedRefs.add(refId);
            normalizedOrder.push(entryMap.get(refId));
            continue;
        }

        const isByeSlot = /^BYE-SLOT-\d+$/i.test(refId)
            || /^PREVIEW-SLOT-\d+$/i.test(refId)
            || /^PLACEHOLDER-SLOT-\d+$/i.test(refId);
        if (isExpandedOrder && isByeSlot) {
            if (usedVacancyRefs.has(refId)) {
                throw new Error('El orden personalizado contiene vacantes repetidas');
            }
            usedVacancyRefs.add(refId);
            normalizedOrder.push(vacancyFactory(vacancyCounter));
            vacancyCounter += 1;
            continue;
        }

        throw new Error('El orden personalizado contiene equipos inválidos');
    }

    if (usedRefs.size !== entries.length) {
        throw new Error('El orden personalizado debe incluir todos los equipos aprobados');
    }

    return normalizedOrder;
};

const buildBracketRounds = (entries = [], { fillEntryFactory = makeByeEntry, autoAdvanceByes = true } = {}) => {
    const size = nextPowerOfTwo(Math.max(entries.length, 2));
    const totalRounds = Math.log2(size);
    const seededEntries = [...entries];

    while (seededEntries.length < size) {
        seededEntries.push(fillEntryFactory(seededEntries.length + 1));
    }

    const rounds = [];
    for (let round = 1; round <= totalRounds; round += 1) {
        const matchesCount = size / (2 ** round);
        const matches = [];

        for (let matchNumber = 1; matchNumber <= matchesCount; matchNumber += 1) {
            const nextMatchId = round < totalRounds ? `R${round + 1}M${Math.ceil(matchNumber / 2)}` : '';
            const nextSlot = round < totalRounds ? (matchNumber % 2 === 1 ? 'A' : 'B') : '';
            matches.push(createMatchSkeleton({
                matchId: `R${round}M${matchNumber}`,
                nextMatchId,
                nextSlot
            }));
        }

        rounds.push({
            round,
            name: buildRoundName(matchesCount, round),
            matches
        });
    }

    const firstRound = rounds[0];
    if (firstRound) {
        for (let i = 0; i < seededEntries.length; i += 2) {
            const match = firstRound.matches[i / 2];
            match.teamA = toParticipant(seededEntries[i], i + 1);
            match.teamB = toParticipant(seededEntries[i + 1], i + 2);
            setMatchStatus(match);
        }
    }

    if (autoAdvanceByes) {
        resolveAutoAdvance(rounds);
    }
    return { rounds, size };
};

const hasVacantSlotsInFirstRound = (rounds = []) => {
    const firstRoundMatches = rounds?.[0]?.matches || [];
    return firstRoundMatches.some((match) => (
        isVacantParticipant(match?.teamA) || isVacantParticipant(match?.teamB)
    ));
};

const isEntryInBracket = (rounds = [], entry = {}) => {
    const entryRegId = String(entry?.registrationId || '');
    const entryTeamId = String(entry?.teamId || '');
    const entryRefId = String(entry?.refId || '');

    for (const round of rounds || []) {
        for (const match of round?.matches || []) {
            const participants = [match?.teamA, match?.teamB];
            for (const participant of participants) {
                const regId = String(participant?.registrationId || '');
                const teamId = String(participant?.teamId || '');
                const refId = String(participant?.refId || '');
                if (entryRegId && regId && entryRegId === regId) return true;
                if (entryTeamId && teamId && entryTeamId === teamId) return true;
                if (entryRefId && refId && entryRefId === refId) return true;
            }
        }
    }

    return false;
};

const placeEntryInRandomVacancy = (rounds = [], entry = {}) => {
    const firstRoundMatches = rounds?.[0]?.matches || [];
    const vacancySlots = [];

    firstRoundMatches.forEach((match) => {
        ['teamA', 'teamB'].forEach((slotKey) => {
            if (isVacantParticipant(match?.[slotKey])) {
                vacancySlots.push({ match, slotKey, seed: match?.[slotKey]?.seed ?? null });
            }
        });
    });

    if (!vacancySlots.length) return false;

    const randomSlot = vacancySlots[Math.floor(Math.random() * vacancySlots.length)];
    const seed = Number(randomSlot.seed);
    randomSlot.match[randomSlot.slotKey] = toParticipant(
        { ...entry, isBye: false, isPlaceholder: false },
        Number.isFinite(seed) ? seed : undefined
    );
    setMatchStatus(randomSlot.match);
    return true;
};

const getNextVacancyIndex = (rounds = [], vacancyMode = 'placeholder') => {
    const pattern = vacancyMode === 'bye' ? /^BYE-(\d+)$/i : /^BYE-SLOT-(\d+)$/i;
    let maxIndex = 0;

    for (const round of rounds || []) {
        for (const match of round?.matches || []) {
            const refs = [match?.teamA?.refId, match?.teamB?.refId];
            for (const refId of refs) {
                const found = String(refId || '').match(pattern);
                if (!found) continue;
                const index = Number.parseInt(found[1], 10);
                if (Number.isFinite(index) && index > maxIndex) {
                    maxIndex = index;
                }
            }
        }
    }

    return maxIndex + 1;
};

const resetMatchProgress = (match) => {
    if (!match || String(match.status || '') === 'finished') return;
    match.winnerRefId = '';
    match.winnerTeamId = null;
    match.scoreA = null;
    match.scoreB = null;
    match.confirmationStatus = 'unconfirmed';
    match.resultSubmissions = [];
    match.resolvedBy = null;
    match.resolvedAt = null;
    if (String(match.status || '') === 'live') {
        match.status = 'pending';
    }
};

const replaceEntryWithVacancy = (rounds = [], entry = {}, { vacancyMode = 'placeholder' } = {}) => {
    const firstRoundMatches = rounds?.[0]?.matches || [];
    const entryRegId = String(entry?.registrationId || '');
    const entryTeamId = String(entry?.teamId || '');
    const entryRefId = String(entry?.refId || '');

    if (!entryRegId && !entryTeamId && !entryRefId) return false;

    let vacancyIndex = getNextVacancyIndex(rounds, vacancyMode);
    const vacancyFactory = vacancyMode === 'bye' ? makeByeEntry : makePlaceholderEntry;
    let changed = false;

    for (const match of firstRoundMatches) {
        for (const slotKey of ['teamA', 'teamB']) {
            const participant = match?.[slotKey];
            if (!participant || participant.isBye || participant.isPlaceholder) continue;

            const regId = String(participant?.registrationId || '');
            const teamId = String(participant?.teamId || '');
            const refId = String(participant?.refId || '');
            const sameRegistration = entryRegId && regId && entryRegId === regId;
            const sameTeam = entryTeamId && teamId && entryTeamId === teamId;
            const sameRef = entryRefId && refId && entryRefId === refId;
            if (!sameRegistration && !sameTeam && !sameRef) continue;

            const seed = Number(participant?.seed);
            const vacancy = vacancyFactory(vacancyIndex);
            vacancyIndex += 1;
            match[slotKey] = toParticipant(vacancy, Number.isFinite(seed) ? seed : undefined);
            resetMatchProgress(match);
            setMatchStatus(match);
            changed = true;
        }
    }

    return changed;
};

const syncProvisionalBracketWithRegistrations = (tournament) => {
    if (!tournament?.bracket?.isProvisional) return false;
    if (normalizeTournamentFormat(tournament?.bracket?.format) !== 'single_elimination') return false;
    if (String(tournament?.status || '') !== 'open') return false;
    if (tournament?.registrationClosed) return false;
    if (!Array.isArray(tournament?.bracket?.rounds) || !tournament.bracket.rounds.length) return false;

    const approvedEntries = (tournament?.registrations || [])
        .filter(isApprovedRegistration)
        .map(toBracketEntry)
        .filter(Boolean);

    let changed = false;
    for (const entry of approvedEntries) {
        if (isEntryInBracket(tournament.bracket.rounds, entry)) continue;
        const inserted = placeEntryInRandomVacancy(tournament.bracket.rounds, entry);
        if (inserted) changed = true;
    }

    tournament.bracket.isProvisional = hasVacantSlotsInFirstRound(tournament.bracket.rounds);
    return changed;
};

const convertProvisionalBracketToLive = (rounds = []) => {
    if (!Array.isArray(rounds) || !rounds.length) return;

    let byeCounter = 1;
    for (const round of rounds) {
        for (const match of round?.matches || []) {
            ['teamA', 'teamB'].forEach((slotKey) => {
                const participant = match?.[slotKey];
                if (!participant?.isPlaceholder) return;
                const seed = Number(participant?.seed);
                match[slotKey] = toParticipant(
                    makeByeEntry(byeCounter),
                    Number.isFinite(seed) ? seed : undefined
                );
                byeCounter += 1;
            });

            if (match?.status !== 'finished') {
                match.winnerRefId = '';
                match.winnerTeamId = null;
                match.scoreA = null;
                match.scoreB = null;
                match.confirmationStatus = 'unconfirmed';
                match.resultSubmissions = [];
                match.resolvedBy = null;
                match.resolvedAt = null;
            }
            setMatchStatus(match);
        }
    }

    resolveAutoAdvance(rounds);
};

const buildOrderedEntriesForFormat = ({
    approvedEntries = [],
    seedingMode = 'random',
    customOrder = [],
    allowPartial = false,
    bracketSize = 2,
    vacancyMode = 'bye'
} = {}) => {
    const mode = normalizeSeedingMode(seedingMode);
    if (mode === 'custom') {
        return {
            mode,
            orderedEntries: applyCustomOrder(approvedEntries, customOrder, { bracketSize, vacancyMode })
        };
    }

    if (allowPartial) {
        const entriesWithVacancies = [...approvedEntries];
        let vacancyIndex = 1;
        const vacancyFactory = vacancyMode === 'placeholder' ? makePlaceholderEntry : makeByeEntry;
        while (entriesWithVacancies.length < bracketSize) {
            entriesWithVacancies.push(vacancyFactory(vacancyIndex));
            vacancyIndex += 1;
        }
        return {
            mode,
            orderedEntries: shuffleArray(entriesWithVacancies)
        };
    }

    return {
        mode,
        orderedEntries: shuffleArray(approvedEntries)
    };
};

const buildSingleEliminationBracket = ({
    approvedEntries = [],
    maxSlots = 2,
    seedingMode = 'random',
    customOrder = [],
    allowPartial = false
} = {}) => {
    const bracketSize = allowPartial
        ? nextPowerOfTwo(maxSlots)
        : nextPowerOfTwo(Math.max(approvedEntries.length, 2));
    const fillEntryFactory = allowPartial ? makePlaceholderEntry : makeByeEntry;
    const vacancyMode = allowPartial ? 'placeholder' : 'bye';
    const { mode, orderedEntries } = buildOrderedEntriesForFormat({
        approvedEntries,
        seedingMode,
        customOrder,
        allowPartial,
        bracketSize,
        vacancyMode
    });

    const { rounds, size } = buildBracketRounds(orderedEntries, {
        fillEntryFactory,
        autoAdvanceByes: !allowPartial
    });

    return {
        format: 'single_elimination',
        seedingMode: mode,
        size,
        isProvisional: allowPartial,
        generatedAt: new Date(),
        rounds
    };
};

const buildDoubleEliminationBracket = ({
    approvedEntries = [],
    maxSlots = 2,
    seedingMode = 'random',
    customOrder = [],
    allowPartial = false
} = {}) => {
    const bracketSize = allowPartial
        ? nextPowerOfTwo(maxSlots)
        : nextPowerOfTwo(Math.max(approvedEntries.length, 2));
    const fillEntryFactory = allowPartial ? makePlaceholderEntry : makeByeEntry;
    const vacancyMode = allowPartial ? 'placeholder' : 'bye';
    const { mode, orderedEntries } = buildOrderedEntriesForFormat({
        approvedEntries,
        seedingMode,
        customOrder,
        allowPartial,
        bracketSize,
        vacancyMode
    });

    const { rounds: upperRoundsRaw, size } = buildBracketRounds(orderedEntries, {
        fillEntryFactory,
        autoAdvanceByes: false
    });
    const upperRounds = upperRoundsRaw.map((round, idx) => ({
        ...round,
        name: `Upper ${idx + 1}`,
        bracketType: 'upper'
    }));

    const lowerRounds = [];
    const upperRoundCount = upperRounds.length;
    const lowerRoundCount = Math.max((upperRoundCount - 1) * 2, 0);
    const highestPlaceholderIndex = orderedEntries.reduce((maxIndex, entry) => {
        const found = String(entry?.refId || '').match(/^BYE-SLOT-(\d+)$/i);
        if (!found) return maxIndex;
        const numeric = Number.parseInt(found[1], 10);
        return Number.isFinite(numeric) ? Math.max(maxIndex, numeric) : maxIndex;
    }, 0);
    let placeholderIndex = highestPlaceholderIndex + 1;
    const makeLockedPlaceholderParticipant = () => toParticipant(makePlaceholderEntry(placeholderIndex++));

    for (let roundIndex = 0; roundIndex < lowerRoundCount; roundIndex += 1) {
        const lowerRoundNumber = roundIndex + 1;
        const stage = Math.ceil(lowerRoundNumber / 2);
        const matchesCount = Math.max(size / (2 ** (stage + 1)), 1);
        const matches = [];
        for (let matchNumber = 1; matchNumber <= matchesCount; matchNumber += 1) {
            const match = createMatchSkeleton({
                matchId: `LR${roundIndex + 1}M${matchNumber}`
            });
            match.teamA = makeLockedPlaceholderParticipant();
            match.teamB = makeLockedPlaceholderParticipant();
            setMatchStatus(match);
            matches.push(match);
        }
        lowerRounds.push({
            round: upperRounds.length + roundIndex + 1,
            name: `Lower ${roundIndex + 1}`,
            bracketType: 'lower',
            matches
        });
    }

    const grandFinalMatch = createMatchSkeleton({ matchId: 'GF-M1' });
    grandFinalMatch.teamA = makeLockedPlaceholderParticipant();
    grandFinalMatch.teamB = makeLockedPlaceholderParticipant();
    setMatchStatus(grandFinalMatch);

    const finalRound = {
        round: upperRounds.length + lowerRounds.length + 1,
        name: 'Gran Final',
        bracketType: 'final',
        matches: [grandFinalMatch]
    };

    // Winners path from upper bracket + losers drop to lower bracket
    for (let upperIndex = 0; upperIndex < upperRoundCount; upperIndex += 1) {
        const upperRoundNumber = upperIndex + 1;
        const matches = upperRounds[upperIndex]?.matches || [];
        for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
            const matchNumber = matchIndex + 1;
            const match = matches[matchIndex];

            if (upperRoundNumber === upperRoundCount) {
                match.nextMatchId = 'GF-M1';
                match.nextSlot = 'A';
            }

            if (lowerRoundCount === 0) {
                match.loserNextMatchId = 'GF-M1';
                match.loserNextSlot = 'B';
                continue;
            }

            if (upperRoundNumber === 1) {
                match.loserNextMatchId = `LR1M${Math.ceil(matchNumber / 2)}`;
                match.loserNextSlot = matchNumber % 2 === 1 ? 'A' : 'B';
                continue;
            }

            const targetLowerRound = Math.min((upperRoundNumber * 2) - 2, lowerRoundCount);
            if (targetLowerRound > 0) {
                match.loserNextMatchId = `LR${targetLowerRound}M${matchNumber}`;
                match.loserNextSlot = 'B';
            }
        }
    }

    // Winners path inside lower bracket and to grand final
    for (let lowerIndex = 0; lowerIndex < lowerRoundCount; lowerIndex += 1) {
        const lowerRoundNumber = lowerIndex + 1;
        const matches = lowerRounds[lowerIndex]?.matches || [];
        for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
            const matchNumber = matchIndex + 1;
            const match = matches[matchIndex];

            if (lowerRoundNumber === lowerRoundCount) {
                match.nextMatchId = 'GF-M1';
                match.nextSlot = 'B';
                continue;
            }

            if (lowerRoundNumber % 2 === 1) {
                match.nextMatchId = `LR${lowerRoundNumber + 1}M${matchNumber}`;
                match.nextSlot = 'A';
            } else {
                match.nextMatchId = `LR${lowerRoundNumber + 1}M${Math.ceil(matchNumber / 2)}`;
                match.nextSlot = matchNumber % 2 === 1 ? 'A' : 'B';
            }
        }
    }

    return {
        format: 'double_elimination',
        seedingMode: mode,
        size,
        isProvisional: false,
        generatedAt: new Date(),
        rounds: [...upperRounds, ...lowerRounds, finalRound]
    };
};

const buildRoundRobinBracket = ({
    approvedEntries = [],
    maxSlots = 2,
    seedingMode = 'random',
    customOrder = [],
    allowPartial = false
} = {}) => {
    const bracketSize = allowPartial ? Math.max(maxSlots, 2) : Math.max(approvedEntries.length, 2);
    const vacancyMode = allowPartial ? 'placeholder' : 'bye';
    const { mode, orderedEntries } = buildOrderedEntriesForFormat({
        approvedEntries,
        seedingMode,
        customOrder,
        allowPartial,
        bracketSize,
        vacancyMode
    });

    const participants = [...orderedEntries];
    if (participants.length % 2 !== 0) {
        participants.push(makeByeEntry(participants.length + 1));
    }

    const rounds = [];
    const totalRounds = Math.max(participants.length - 1, 1);
    let rotation = [...participants];

    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
        const matches = [];
        const half = rotation.length / 2;
        for (let pairIndex = 0; pairIndex < half; pairIndex += 1) {
            const left = rotation[pairIndex];
            const right = rotation[rotation.length - 1 - pairIndex];
            if ((left?.isBye && right?.isBye) || !left || !right) continue;

            const match = createMatchSkeleton({
                matchId: `RR-R${roundIndex + 1}M${pairIndex + 1}`
            });
            match.teamA = toParticipant(left, pairIndex * 2 + 1);
            match.teamB = toParticipant(right, pairIndex * 2 + 2);
            setMatchStatus(match);

            if (!(left?.isBye || right?.isBye)) {
                matches.push(match);
            }
        }

        if (matches.length) {
            rounds.push({
                round: roundIndex + 1,
                name: `Jornada ${roundIndex + 1}`,
                bracketType: 'round_robin',
                matches
            });
        }

        const fixed = rotation[0];
        const rest = rotation.slice(1);
        const last = rest.pop();
        rotation = [fixed, last, ...rest];
    }

    return {
        format: 'round_robin',
        seedingMode: mode,
        size: Math.max(orderedEntries.length, 2),
        isProvisional: false,
        generatedAt: new Date(),
        rounds
    };
};

const buildSwissBracket = ({
    approvedEntries = [],
    maxSlots = 2,
    seedingMode = 'random',
    customOrder = [],
    allowPartial = false
} = {}) => {
    const bracketSize = allowPartial ? Math.max(maxSlots, 2) : Math.max(approvedEntries.length, 2);
    const vacancyMode = allowPartial ? 'placeholder' : 'bye';
    const { mode, orderedEntries } = buildOrderedEntriesForFormat({
        approvedEntries,
        seedingMode,
        customOrder,
        allowPartial,
        bracketSize,
        vacancyMode
    });

    const participants = [...orderedEntries];
    if (participants.length % 2 !== 0) {
        participants.push(makeByeEntry(participants.length + 1));
    }
    const roundsCount = Math.max(Math.ceil(Math.log2(Math.max(participants.length, 2))), 3);
    const rounds = [];

    for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
        const shift = participants.length ? (roundIndex % participants.length) : 0;
        const rotated = participants.length
            ? [...participants.slice(shift), ...participants.slice(0, shift)]
            : [];
        const matches = [];
        for (let pairIndex = 0; pairIndex < rotated.length; pairIndex += 2) {
            const teamA = rotated[pairIndex];
            const teamB = rotated[pairIndex + 1];
            if (!teamA || !teamB) continue;
            if (teamA?.isBye && teamB?.isBye) continue;

            const match = createMatchSkeleton({
                matchId: `SR${roundIndex + 1}M${Math.floor(pairIndex / 2) + 1}`
            });
            match.teamA = toParticipant(teamA, pairIndex + 1);
            match.teamB = toParticipant(teamB, pairIndex + 2);
            setMatchStatus(match);

            if (!(teamA?.isBye || teamB?.isBye)) {
                matches.push(match);
            }
        }

        if (matches.length) {
            rounds.push({
                round: roundIndex + 1,
                name: `Ronda Suiza ${roundIndex + 1}`,
                bracketType: 'swiss',
                matches
            });
        }
    }

    return {
        format: 'swiss',
        seedingMode: mode,
        size: Math.max(orderedEntries.length, 2),
        isProvisional: false,
        generatedAt: new Date(),
        rounds
    };
};

const buildBracketFromTournament = (tournament, { seedingMode = 'random', customOrder = [], allowPartial = false } = {}) => {
    const approvedEntries = (tournament?.registrations || [])
        .filter(isApprovedRegistration)
        .map(toBracketEntry)
        .filter(Boolean);

    if (!allowPartial && approvedEntries.length < 2) {
        throw new Error('Se requieren al menos 2 equipos aprobados para generar el bracket');
    }

    const maxSlots = Math.max(Number(tournament?.maxSlots) || 0, 2);
    const formatKey = normalizeTournamentFormat(tournament?.format || tournament?.bracket?.format);

    switch (formatKey) {
        case 'double_elimination':
            return buildDoubleEliminationBracket({
                approvedEntries,
                maxSlots,
                seedingMode,
                customOrder,
                allowPartial
            });
        case 'round_robin':
            return buildRoundRobinBracket({
                approvedEntries,
                maxSlots,
                seedingMode,
                customOrder,
                allowPartial
            });
        case 'swiss':
            return buildSwissBracket({
                approvedEntries,
                maxSlots,
                seedingMode,
                customOrder,
                allowPartial
            });
        case 'single_elimination':
        default:
            return buildSingleEliminationBracket({
                approvedEntries,
                maxSlots,
                seedingMode,
                customOrder,
                allowPartial
            });
    }
};

const isValidScoreInput = (value) => value === null || value === undefined || value === '' || DIGITS_ONLY_REGEX.test(String(value).trim());

const normalizeScoreInput = (value, label) => {
    if (value === null || value === undefined || value === '') return null;
    if (!isValidScoreInput(value)) {
        throw new Error(`${label} debe ser un número entero no negativo`);
    }
    return Number.parseInt(String(value).trim(), 10);
};

const findRegistrationByParticipant = (participant = {}, registrations = []) => {
    const registrationId = String(participant?.registrationId || '');
    const teamId = String(participant?.teamId || '');

    return (registrations || []).find((registration) => {
        const regId = String(registration?._id || '');
        const regTeamId = String(registration?.teamId || '');
        if (registrationId && regId && regId === registrationId) return true;
        if (teamId && regTeamId && regTeamId === teamId) return true;
        return false;
    }) || null;
};

const getUserSideInMatch = (match = {}, registrations = [], userId = '') => {
    const targetUserId = String(userId || '');
    if (!targetUserId) return '';

    const sides = [
        ['A', match.teamA],
        ['B', match.teamB]
    ];

    for (const [side, participant] of sides) {
        if (!participant || participant.isBye || participant.isPlaceholder) continue;
        const registration = findRegistrationByParticipant(participant, registrations);
        const captainId = String(registration?.captain?._id || registration?.captain || '');
        if (captainId && captainId === targetUserId) {
            return side;
        }
    }

    return '';
};

const getParticipantByRefId = (match = {}, winnerRefId = '') => {
    const ref = String(winnerRefId || '');
    if (!ref) return null;
    if (String(match?.teamA?.refId || '') === ref) return match.teamA;
    if (String(match?.teamB?.refId || '') === ref) return match.teamB;
    return null;
};

const getLoserByWinnerRefId = (match = {}, winnerRefId = '') => {
    const ref = String(winnerRefId || '');
    if (!ref) return null;
    if (String(match?.teamA?.refId || '') === ref) return match?.teamB || null;
    if (String(match?.teamB?.refId || '') === ref) return match?.teamA || null;
    return null;
};

const upsertResultSubmission = (match, payload) => {
    const submissions = Array.isArray(match.resultSubmissions) ? [...match.resultSubmissions] : [];
    const side = payload?.side;
    const idx = submissions.findIndex((entry) => String(entry?.side || '') === String(side || ''));
    const nextEntry = {
        side,
        winnerRefId: payload?.winnerRefId || '',
        scoreA: payload?.scoreA ?? null,
        scoreB: payload?.scoreB ?? null,
        submittedBy: payload?.submittedBy || null,
        submittedAt: new Date()
    };
    if (idx >= 0) submissions[idx] = nextEntry;
    else submissions.push(nextEntry);
    match.resultSubmissions = submissions;
};

const getSubmissionBySide = (match = {}, side) => {
    const list = Array.isArray(match?.resultSubmissions) ? match.resultSubmissions : [];
    return list.find((entry) => String(entry?.side || '') === String(side || '')) || null;
};

const hasAgreedSubmissions = (match = {}) => {
    const submissionA = getSubmissionBySide(match, 'A');
    const submissionB = getSubmissionBySide(match, 'B');
    if (!submissionA || !submissionB) return { agreed: false, disputed: false };

    const sameWinner = String(submissionA.winnerRefId || '') === String(submissionB.winnerRefId || '');
    const sameScores = Number(submissionA.scoreA ?? -1) === Number(submissionB.scoreA ?? -1)
        && Number(submissionA.scoreB ?? -1) === Number(submissionB.scoreB ?? -1);

    if (sameWinner && sameScores) {
        return {
            agreed: true,
            disputed: false,
            winnerRefId: submissionA.winnerRefId,
            scoreA: submissionA.scoreA ?? null,
            scoreB: submissionA.scoreB ?? null
        };
    }

    return { agreed: false, disputed: true };
};

const finalizeMatchAndAdvance = ({
    tournament,
    match,
    winnerRefId,
    scoreA = null,
    scoreB = null,
    confirmationStatus = 'agreed',
    resolvedBy = null
}) => {
    const winner = getParticipantByRefId(match, winnerRefId);
    if (!winner || winner.isBye || winner.isPlaceholder) {
        throw new Error('Ganador inválido para este match');
    }

    match.winnerRefId = winner.refId;
    match.winnerTeamId = winner.teamId || null;
    match.scoreA = scoreA;
    match.scoreB = scoreB;
    match.status = 'finished';
    match.confirmationStatus = confirmationStatus;
    if (resolvedBy) {
        match.resolvedBy = resolvedBy;
        match.resolvedAt = new Date();
    }

    const formatKey = normalizeTournamentFormat(tournament?.bracket?.format);
    if (formatKey === 'single_elimination' || formatKey === 'double_elimination') {
        placeWinnerInNextMatch(tournament?.bracket?.rounds || [], match, winner);
        if (formatKey === 'double_elimination') {
            const loser = getLoserByWinnerRefId(match, winner.refId);
            placeLoserInNextMatch(tournament?.bracket?.rounds || [], match, loser);
        }
        resolveAutoAdvance(tournament?.bracket?.rounds || []);
    }

    const rounds = Array.isArray(tournament?.bracket?.rounds) ? tournament.bracket.rounds : [];
    if (formatKey === 'single_elimination') {
        const finalRound = rounds[rounds.length - 1];
        const finalMatch = finalRound?.matches?.[0];
        if (finalMatch?.winnerRefId && ['finished', 'walkover'].includes(String(finalMatch.status || ''))) {
            tournament.status = 'finished';
            tournament.registrationClosed = true;
        }
        return;
    }

    const pendingMatches = rounds.some((round) =>
        (round?.matches || []).some((current) => !['finished', 'walkover'].includes(String(current?.status || '')))
    );
    if (!pendingMatches) {
        tournament.status = 'finished';
        tournament.registrationClosed = true;
    }
};

// Función auxiliar para generar el código TOR-123456
const generateUniqueTournamentId = async () => {
    let isUnique = false;
    let generatedId = '';

    while (!isUnique) {
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        generatedId = `TOR-${randomDigits}`;

        // Verificamos en la base de datos si ya existe
        const existing = await Tournament.findOne({ tournamentId: generatedId });
        if (!existing) {
            isUnique = true;
        }
    }
    return generatedId;
};

export const createTournament = async (req, res) => {
    try {
        const data = req.body || {};
        const normalizedTournamentFormat = normalizeTournamentFormat(data?.format);
        const organizer = await User.findById(req.userId).select('isOrganizer');
        if (!organizer || organizer.isOrganizer !== true) {
            return res.status(403).json({ message: 'Solo organizadores verificados pueden crear torneos' });
        }

        // --- GENERACIÓN DEL ID ÚNICO ---
        const tournamentId = await generateUniqueTournamentId();

        // Procesar rutas de archivos subidos
        const bannerPath = req.files?.bannerFile ? req.files.bannerFile[0].path : '';
        const pdfPath = req.files?.rulesPdf ? req.files.rulesPdf[0].path : '';
        const sponsorLogoFiles = req.files?.sponsorLogos || [];

        // Función auxiliar para parsear datos que vienen como String desde FormData
        const parseField = (field) => {
            if (typeof field === 'string') {
                try { return JSON.parse(field); } catch (e) { return field; }
            }
            return field;
        };

        const rawSponsors = data.sponsors ?? data.sponsorsData;
        const sponsors = parseField(rawSponsors) || [];
        const parsedPrizesByRankRaw = parseField(data.prizesByRank) || {};
        const parsedStaffRaw = parseField(data.staff) || {};
        const normalizedTitle = String(data.title || '').trim();
        const normalizedDescription = String(data.description || '').trim();
        const normalizedGame = String(data.game || '').trim();
        const normalizedGender = String(data.gender || '').trim();
        const normalizedModality = String(data.modality || '').trim();
        const normalizedDate = String(data.date || '').trim();
        const normalizedTime = String(data.time || '').trim();
        const normalizedEntryFee = String(data.entryFee || '').trim() || 'Gratis';
        const normalizedCurrency = String(data.currency || 'USD').trim() || 'USD';
        const normalizedServer = String(data.server || '').trim();
        const normalizedPlatform = String(data.platform || 'PC').trim() || 'PC';
        const normalizedMaxSlots = normalizePositiveInteger(data.maxSlots);
        const normalizedPrizePoolRaw = String(data.prizePool ?? '').trim();
        const normalizedPrizePool = normalizeMoneyString(data.prizePool);

        const normalizedPrizesByRank = {
            first: normalizeMoneyString(parsedPrizesByRankRaw?.first),
            second: normalizeMoneyString(parsedPrizesByRankRaw?.second),
            third: normalizeMoneyString(parsedPrizesByRankRaw?.third)
        };

        const normalizedStaff = {
            moderators: Array.isArray(parsedStaffRaw?.moderators)
                ? parsedStaffRaw.moderators.map((v) => String(v || '').trim()).filter(Boolean)
                : [],
            casters: Array.isArray(parsedStaffRaw?.casters)
                ? parsedStaffRaw.casters.map((v) => String(v || '').trim()).filter(Boolean)
                : []
        };

        if (!normalizedTitle || !normalizedDescription || !normalizedGame || !normalizedGender || !normalizedModality || !normalizedServer) {
            return res.status(400).json({ message: 'Faltan campos obligatorios del torneo' });
        }

        const tournamentDate = new Date(`${normalizedDate}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (!normalizedDate || Number.isNaN(tournamentDate.getTime()) || tournamentDate < today) {
            return res.status(400).json({ message: 'La fecha del torneo no es válida' });
        }

        if (!normalizedTime) {
            return res.status(400).json({ message: 'La hora del torneo es requerida' });
        }

        if (!Number.isFinite(normalizedMaxSlots) || normalizedMaxSlots < 2) {
            return res.status(400).json({ message: 'El torneo debe tener al menos 2 cupos' });
        }

        if (normalizedPrizePoolRaw && normalizeNonNegativeNumber(data.prizePool) === null) {
            return res.status(400).json({ message: 'El monto total del torneo debe ser un número válido no negativo' });
        }

        const prizeFields = ['first', 'second', 'third'];
        for (const field of prizeFields) {
            const rawValue = String(parsedPrizesByRankRaw?.[field] ?? '').trim();
            if (rawValue && normalizeNonNegativeNumber(parsedPrizesByRankRaw?.[field]) === null) {
                return res.status(400).json({ message: `El premio de ${field} lugar debe ser un número válido no negativo` });
            }
        }

        const distributedPrizeTotal = [normalizedPrizesByRank.first, normalizedPrizesByRank.second, normalizedPrizesByRank.third]
            .reduce((acc, current) => acc + (Number(current) || 0), 0);
        if (normalizedPrizePool !== '' && distributedPrizeTotal > Number(normalizedPrizePool)) {
            return res.status(400).json({ message: 'La suma de premios por ranking no puede superar el monto total del torneo' });
        }

        const sponsorsWithLogos = Array.isArray(sponsors)
            ? sponsors.map((s, idx) => {
                const fileIndex = Number.isInteger(s?.logoIndex) ? s.logoIndex : idx;
                return {
                    ...s,
                    name: String(s?.name || '').trim(),
                    link: String(s?.link || '').trim(),
                    tier: String(s?.tier || 'Partner').trim() || 'Partner',
                    logoUrl: sponsorLogoFiles[fileIndex]?.path || s.logoUrl || ''
                };
            })
            : [];

        const tournamentScope = {
            game: normalizedGame,
            riotRequirements: data.riotRequirements
        };
        const requiresRiotPolicies = isRiotTournamentPolicyScope(tournamentScope);
        const requiresFreeEntry = requiresFreeEntryByPolicy(tournamentScope);
        if (requiresFreeEntry && !isFreeEntryMode(normalizedEntryFee)) {
            return res.status(400).json({
                message: isRiotReviewMode()
                    ? 'RIOT_REVIEW_MODE activo: todos los torneos deben usar registro gratuito'
                    : 'Para torneos de Riot el registro debe ser gratuito (sin pago, invitación o contraseña)'
            });
        }
        if (requiresRiotPolicies) {
            const participantCapacity = getParticipantCapacityBySettings({
                modality: normalizedModality,
                maxSlots: normalizedMaxSlots
            });
            const minParticipants = getRiotMinActiveParticipants();
            if (participantCapacity < minParticipants) {
                return res.status(400).json({
                    message: `Torneos Riot requieren capacidad mínima para ${minParticipants} participantes activos. Ajusta modalidad/cupos.`
                });
            }
        }

        const newTournament = new Tournament({
            ...data,
            title: normalizedTitle,
            description: normalizedDescription,
            game: normalizedGame,
            gender: normalizedGender,
            modality: normalizedModality,
            date: tournamentDate,
            time: normalizedTime,
            entryFee: normalizedEntryFee,
            maxSlots: normalizedMaxSlots,
            prizePool: normalizedPrizePool,
            prizesByRank: normalizedPrizesByRank,
            currency: normalizedCurrency,
            server: normalizedServer,
            platform: normalizedPlatform,
            format: normalizedTournamentFormat,
            tournamentId,
            sponsors: sponsorsWithLogos,
            staff: normalizedStaff,
            bannerImage: bannerPath,
            rulesPdf: pdfPath,
            organizer: req.userId,

            status: 'open',
            registrationClosed: false,
            currentSlots: 0
        });

        const savedTournament = await newTournament.save();
        res.status(201).json(savedTournament);

    } catch (error) {
        console.error("Error al crear el torneo:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

export const updateTournament = async (req, res) => {
    try {
        const { code } = req.params;
        const data = req.body || {};

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = String(tournament.organizer) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para editar este torneo' });
        }

        // Archivos nuevos (si vienen)
        const bannerPath = req.files?.bannerFile ? req.files.bannerFile[0].path : '';
        const pdfPath = req.files?.rulesPdf ? req.files.rulesPdf[0].path : '';
        const sponsorLogoFiles = req.files?.sponsorLogos || [];

        const parseField = (field) => {
            if (typeof field === 'string') {
                try { return JSON.parse(field); } catch (e) { return field; }
            }
            return field;
        };

        const rawSponsors = data.sponsors ?? data.sponsorsData;
        const sponsors = parseField(rawSponsors) || [];
        const parsedPrizesByRankRaw = parseField(data.prizesByRank);
        const parsedStaffRaw = parseField(data.staff);
        const sponsorsWithLogos = Array.isArray(sponsors)
            ? sponsors.map((s, idx) => {
                const fileIndex = Number.isInteger(s?.logoIndex) ? s.logoIndex : idx;
                return {
                    ...s,
                    name: String(s?.name || '').trim(),
                    link: String(s?.link || '').trim(),
                    tier: String(s?.tier || 'Partner').trim() || 'Partner',
                    logoUrl: sponsorLogoFiles[fileIndex]?.path || s.logoUrl || ''
                };
            })
            : undefined;

        let normalizedDateForUpdate = null;
        if (data.date !== undefined) {
            const normalizedDate = String(data.date || '').trim();
            const requestedDate = new Date(`${normalizedDate}T00:00:00`);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!normalizedDate || Number.isNaN(requestedDate.getTime()) || requestedDate < today) {
                return res.status(400).json({ message: 'La fecha del torneo no es válida' });
            }
            normalizedDateForUpdate = requestedDate;
        }

        if (data.time !== undefined) {
            const normalizedTime = String(data.time || '').trim();
            if (!normalizedTime) {
                return res.status(400).json({ message: 'La hora del torneo es requerida' });
            }
        }
        if (data.title !== undefined && !String(data.title || '').trim()) {
            return res.status(400).json({ message: 'El título del torneo es requerido' });
        }
        if (data.game !== undefined && !String(data.game || '').trim()) {
            return res.status(400).json({ message: 'El juego del torneo es requerido' });
        }
        if (data.gender !== undefined && !String(data.gender || '').trim()) {
            return res.status(400).json({ message: 'La categoría de género es requerida' });
        }
        if (data.modality !== undefined && !String(data.modality || '').trim()) {
            return res.status(400).json({ message: 'La modalidad del torneo es requerida' });
        }
        if (data.description !== undefined && !String(data.description || '').trim()) {
            return res.status(400).json({ message: 'La descripcion del torneo es requerida' });
        }
        if (data.server !== undefined && !String(data.server || '').trim()) {
            return res.status(400).json({ message: 'La region/servidor es requerida' });
        }

        let normalizedMaxSlotsForUpdate = null;
        if (data.maxSlots !== undefined) {
            normalizedMaxSlotsForUpdate = normalizePositiveInteger(data.maxSlots);
            if (!Number.isFinite(normalizedMaxSlotsForUpdate) || normalizedMaxSlotsForUpdate < 2) {
                return res.status(400).json({ message: 'El torneo debe tener al menos 2 cupos' });
            }
            if (normalizedMaxSlotsForUpdate < Number(tournament.currentSlots)) {
                return res.status(400).json({ message: 'Los cupos no pueden ser menores a los inscritos' });
            }
        }

        if (data.prizePool !== undefined) {
            const rawPrizePool = String(data.prizePool ?? '').trim();
            if (rawPrizePool && normalizeNonNegativeNumber(data.prizePool) === null) {
                return res.status(400).json({ message: 'El monto total del torneo debe ser un número válido no negativo' });
            }
        }

        let normalizedPrizesByRankForUpdate = null;
        if (data.prizesByRank !== undefined) {
            const source = parsedPrizesByRankRaw && typeof parsedPrizesByRankRaw === 'object'
                ? parsedPrizesByRankRaw
                : {};
            const prizeFields = ['first', 'second', 'third'];
            for (const field of prizeFields) {
                const rawValue = String(source?.[field] ?? '').trim();
                if (rawValue && normalizeNonNegativeNumber(source?.[field]) === null) {
                    return res.status(400).json({ message: `El premio de ${field} lugar debe ser un número válido no negativo` });
                }
            }

            normalizedPrizesByRankForUpdate = {
                first: normalizeMoneyString(source?.first),
                second: normalizeMoneyString(source?.second),
                third: normalizeMoneyString(source?.third)
            };
        }

        const effectivePrizePool = data.prizePool !== undefined
            ? normalizeMoneyString(data.prizePool)
            : normalizeMoneyString(tournament.prizePool);
        const effectivePrizesByRank = normalizedPrizesByRankForUpdate || {
            first: normalizeMoneyString(tournament?.prizesByRank?.first),
            second: normalizeMoneyString(tournament?.prizesByRank?.second),
            third: normalizeMoneyString(tournament?.prizesByRank?.third)
        };
        const distributedPrizeTotal = [
            effectivePrizesByRank.first,
            effectivePrizesByRank.second,
            effectivePrizesByRank.third
        ].reduce((acc, current) => acc + (Number(current) || 0), 0);
        if (effectivePrizePool !== '' && distributedPrizeTotal > Number(effectivePrizePool)) {
            return res.status(400).json({ message: 'La suma de premios por ranking no puede superar el monto total del torneo' });
        }

        const effectiveGame = String(data.game !== undefined ? data.game : tournament.game || '').trim();
        const effectiveEntryFee = data.entryFee !== undefined
            ? (String(data.entryFee || '').trim() || 'Gratis')
            : (String(tournament.entryFee || '').trim() || 'Gratis');
        const effectiveRiotRequirements = data.riotRequirements !== undefined
            ? data.riotRequirements
            : tournament.riotRequirements;
        const tournamentScope = {
            game: effectiveGame,
            riotRequirements: effectiveRiotRequirements
        };
        const requiresRiotPolicies = isRiotTournamentPolicyScope(tournamentScope);
        const requiresFreeEntry = requiresFreeEntryByPolicy(tournamentScope);
        if (requiresFreeEntry && !isFreeEntryMode(effectiveEntryFee)) {
            return res.status(400).json({
                message: isRiotReviewMode()
                    ? 'RIOT_REVIEW_MODE activo: todos los torneos deben usar registro gratuito'
                    : 'Para torneos de Riot el registro debe ser gratuito (sin pago, invitación o contraseña)'
            });
        }
        if (requiresRiotPolicies) {
            const effectiveModality = data.modality !== undefined
                ? String(data.modality || '').trim()
                : String(tournament.modality || '').trim();
            const effectiveMaxSlots = data.maxSlots !== undefined
                ? normalizedMaxSlotsForUpdate
                : tournament.maxSlots;
            const participantCapacity = getParticipantCapacityBySettings({
                modality: effectiveModality,
                maxSlots: effectiveMaxSlots
            });
            const minParticipants = getRiotMinActiveParticipants();
            if (participantCapacity < minParticipants) {
                return res.status(400).json({
                    message: `Torneos Riot requieren capacidad mínima para ${minParticipants} participantes activos. Ajusta modalidad/cupos.`
                });
            }
        }

        const update = {
            ...data,
            prizesByRank: parseField(data.prizesByRank),
            staff: parseField(data.staff)
        };
        if (Object.prototype.hasOwnProperty.call(data, 'format')) {
            update.format = normalizeTournamentFormat(data?.format);
        }
        if (data.title !== undefined) update.title = String(data.title || '').trim();
        if (data.description !== undefined) update.description = String(data.description || '').trim();
        if (data.game !== undefined) update.game = effectiveGame;
        if (data.gender !== undefined) update.gender = String(data.gender || '').trim();
        if (data.modality !== undefined) update.modality = String(data.modality || '').trim();
        if (data.entryFee !== undefined) update.entryFee = effectiveEntryFee;
        if (data.currency !== undefined) update.currency = String(data.currency || 'USD').trim() || 'USD';
        if (data.server !== undefined) update.server = String(data.server || '').trim();
        if (data.platform !== undefined) update.platform = String(data.platform || 'PC').trim() || 'PC';
        if (data.prizePool !== undefined) update.prizePool = normalizeMoneyString(data.prizePool);
        if (normalizedPrizesByRankForUpdate !== null) update.prizesByRank = normalizedPrizesByRankForUpdate;
        if (normalizedMaxSlotsForUpdate !== null) update.maxSlots = normalizedMaxSlotsForUpdate;
        if (normalizedDateForUpdate !== null) update.date = normalizedDateForUpdate;
        if (data.time !== undefined) update.time = String(data.time || '').trim();
        if (data.staff !== undefined) {
            const source = parsedStaffRaw && typeof parsedStaffRaw === 'object' ? parsedStaffRaw : {};
            update.staff = {
                moderators: Array.isArray(source?.moderators)
                    ? source.moderators.map((v) => String(v || '').trim()).filter(Boolean)
                    : [],
                casters: Array.isArray(source?.casters)
                    ? source.casters.map((v) => String(v || '').trim()).filter(Boolean)
                    : []
            };
        }

        if (sponsorsWithLogos !== undefined) update.sponsors = sponsorsWithLogos;
        if (bannerPath) update.bannerImage = bannerPath;
        if (pdfPath) update.rulesPdf = pdfPath;

        Object.assign(tournament, update);
        const saved = await tournament.save();
        return res.status(200).json(saved);

    } catch (error) {
        console.error("Error al actualizar el torneo:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find({
            status: { $ne: 'draft' }
        })
            .populate('organizer', 'username email');

        res.status(200).json(tournaments);
    } catch (error) {
        console.error("Error al obtener torneos:", error);
        res.status(500).json({
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Buscar torneo por su ID único (TOR-XXXXXX)
export const getTournamentByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() })
            .populate('organizer', 'username avatar');

        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        res.status(200).json(tournament);
    } catch (error) {
        res.status(500).json({ message: "Error en la búsqueda", error: error.message });
    }
};

export const getTournamentBracket = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() })
            .select('tournamentId title status registrationClosed bracket registrations');

        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        return res.status(200).json({
            tournamentId: tournament.tournamentId,
            title: tournament.title,
            status: tournament.status,
            registrationClosed: tournament.registrationClosed,
            bracket: tournament.bracket || null,
            registrations: tournament.registrations || []
        });
    } catch (error) {
        return res.status(500).json({ message: "Error al obtener el bracket", error: error.message });
    }
};

export const generateTournamentBracket = async (req, res) => {
    try {
        const { code } = req.params;
        const { seedingMode = 'random', customOrder = [], previewOnly = false } = req.body || {};
        const shouldPreviewOnly = previewOnly === true || String(previewOnly).toLowerCase() === 'true';

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = isTournamentOwner(tournament, req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para generar el bracket' });
        }

        if (tournament.status === 'cancelled' || tournament.status === 'finished' || tournament.status === 'ongoing') {
            return res.status(400).json({ message: 'No se puede generar bracket para un torneo en curso, finalizado o cancelado' });
        }

        const allowPartial = tournament.status === 'open' && tournament.registrationClosed !== true;
        const requiresRiotPolicies = isRiotTournamentPolicyScope(tournament);
        if (requiresRiotPolicies && allowPartial && String(seedingMode).toLowerCase() === 'custom') {
            return res.status(400).json({
                message: 'Para torneos Riot con inscripciones abiertas, el seeding debe ser aleatorio hasta cerrar registros'
            });
        }
        const bracket = buildBracketFromTournament(tournament, { seedingMode, customOrder, allowPartial });
        if (requiresRiotPolicies && !hasTraditionalTournamentBracket(bracket)) {
            return res.status(400).json({
                message: 'El bracket del torneo Riot debe ser tradicional (eliminación, suizo o round robin) con cruces directos'
            });
        }
        if (shouldPreviewOnly) {
            return res.status(200).json({
                message: 'Vista previa de bracket generada',
                bracket
            });
        }

        tournament.bracket = bracket;
        if (!allowPartial) {
            tournament.registrationClosed = true;
        }

        await tournament.save();
        return res.status(200).json({
            message: 'Bracket generado correctamente',
            bracket: tournament.bracket
        });
    } catch (error) {
        const message = typeof error?.message === 'string' ? error.message : 'No se pudo generar el bracket';
        return res.status(400).json({ message });
    }
};

export const submitTournamentMatchResult = async (req, res) => {
    try {
        const { code, matchId } = req.params;
        const { winnerRefId, scoreA, scoreB } = req.body || {};

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        if (tournament.status !== 'ongoing') {
            return res.status(400).json({ message: 'Solo se pueden reportar resultados cuando el torneo está en curso' });
        }

        if (!Array.isArray(tournament?.bracket?.rounds) || tournament.bracket.rounds.length === 0) {
            return res.status(400).json({ message: 'Aún no hay bracket generado para este torneo' });
        }

        const located = findMatchById(tournament.bracket.rounds, matchId);
        if (!located?.match) {
            return res.status(404).json({ message: 'Match no encontrado' });
        }

        const match = located.match;
        if (['finished', 'walkover'].includes(String(match.status || ''))) {
            return res.status(400).json({ message: 'Este match ya está cerrado' });
        }

        const side = getUserSideInMatch(match, tournament.registrations || [], req.userId);
        if (!side) {
            return res.status(403).json({ message: 'Solo los capitanes de los equipos del match pueden reportar resultado' });
        }

        const winner = getParticipantByRefId(match, winnerRefId);
        if (!winner || winner.isBye || winner.isPlaceholder) {
            return res.status(400).json({ message: 'Ganador inválido para este match' });
        }

        const hasAnyScore = scoreA !== undefined || scoreB !== undefined;
        if (hasAnyScore && (scoreA === undefined || scoreB === undefined)) {
            return res.status(400).json({ message: 'Debes enviar scoreA y scoreB juntos' });
        }
        const parsedScoreA = normalizeScoreInput(scoreA, 'scoreA');
        const parsedScoreB = normalizeScoreInput(scoreB, 'scoreB');

        upsertResultSubmission(match, {
            side,
            winnerRefId: String(winnerRefId || ''),
            scoreA: parsedScoreA,
            scoreB: parsedScoreB,
            submittedBy: req.userId
        });

        const agreement = hasAgreedSubmissions(match);
        if (agreement.agreed) {
            const agreedWinner = getParticipantByRefId(match, agreement.winnerRefId);
            match.confirmationStatus = 'agreed';
            match.winnerRefId = String(agreement.winnerRefId || '');
            match.winnerTeamId = agreedWinner?.teamId || null;
            match.scoreA = agreement.scoreA ?? null;
            match.scoreB = agreement.scoreB ?? null;
            setMatchStatus(match);
        } else if (agreement.disputed) {
            match.confirmationStatus = 'disputed';
            match.winnerRefId = '';
            match.winnerTeamId = null;
            match.scoreA = null;
            match.scoreB = null;
            setMatchStatus(match);
        } else {
            match.confirmationStatus = 'unconfirmed';
            match.winnerRefId = String(winnerRefId || '');
            match.winnerTeamId = winner?.teamId || null;
            match.scoreA = parsedScoreA;
            match.scoreB = parsedScoreB;
            setMatchStatus(match);
        }

        await tournament.save();
        return res.status(200).json({
            message: agreement.agreed
                ? 'Resultado confirmado por ambos equipos. Falta validación de organizador/admin para avanzar'
                : agreement.disputed
                    ? 'Resultado en disputa. Requiere intervención de organizador/admin'
                    : 'Resultado reportado. Falta confirmación del rival',
            match,
            bracket: tournament.bracket,
            tournamentStatus: tournament.status
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al reportar resultado', error: error.message });
    }
};

export const resolveTournamentMatchResult = async (req, res) => {
    try {
        const { code, matchId } = req.params;
        const { winnerRefId, scoreA, scoreB } = req.body || {};

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = isTournamentOwner(tournament, req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para resolver resultados' });
        }

        if (tournament.status !== 'ongoing') {
            return res.status(400).json({ message: 'Solo se pueden resolver resultados cuando el torneo está en curso' });
        }

        if (!Array.isArray(tournament?.bracket?.rounds) || tournament.bracket.rounds.length === 0) {
            return res.status(400).json({ message: 'Aún no hay bracket generado para este torneo' });
        }

        const located = findMatchById(tournament.bracket.rounds, matchId);
        if (!located?.match) {
            return res.status(404).json({ message: 'Match no encontrado' });
        }

        const match = located.match;
        if (['finished', 'walkover'].includes(String(match.status || ''))) {
            return res.status(400).json({ message: 'Este match ya está cerrado' });
        }

        const targetWinnerRefId = String(winnerRefId || match.winnerRefId || '');
        if (!targetWinnerRefId) {
            return res.status(400).json({ message: 'Debes indicar el ganador a validar' });
        }

        const winner = getParticipantByRefId(match, targetWinnerRefId);
        if (!winner || winner.isBye || winner.isPlaceholder) {
            return res.status(400).json({ message: 'Ganador inválido para este match' });
        }

        const parsedScoreA = normalizeScoreInput(scoreA, 'scoreA');
        const parsedScoreB = normalizeScoreInput(scoreB, 'scoreB');

        finalizeMatchAndAdvance({
            tournament,
            match,
            winnerRefId: targetWinnerRefId,
            scoreA: parsedScoreA,
            scoreB: parsedScoreB,
            confirmationStatus: 'resolved',
            resolvedBy: req.userId
        });

        await tournament.save();
        return res.status(200).json({
            message: 'Resultado resuelto y cuadro actualizado',
            match,
            bracket: tournament.bracket,
            tournamentStatus: tournament.status
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al resolver resultado', error: error.message });
    }
};

export const deleteTournament = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = String(tournament.organizer) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar este torneo' });
        }

        const safeUnlink = (filePath) => {
            if (!filePath || !filePath.startsWith('uploads/')) return;
            fs.unlink(filePath, () => {});
        };

        safeUnlink(tournament.bannerImage);
        safeUnlink(tournament.rulesPdf);
        if (Array.isArray(tournament.sponsors)) {
            tournament.sponsors.forEach((s) => safeUnlink(s?.logoUrl));
        }

        await Tournament.deleteOne({ _id: tournament._id });
        return res.status(200).json({ message: 'Torneo eliminado' });

    } catch (error) {
        console.error("Error al eliminar el torneo:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const registerTeam = async (req, res) => {
    try {
        const { code } = req.params;
        const { teamId, teamName, logoUrl, roster } = req.body || {};

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        if (tournament.status !== 'open' || tournament.registrationClosed) {
            return res.status(400).json({ message: 'Las inscripciones están cerradas' });
        }

        if (tournament.date && new Date(tournament.date) < new Date()) {
            return res.status(400).json({ message: 'El torneo ya inició o expiró' });
        }

        if (tournament.currentSlots >= tournament.maxSlots) {
            return res.status(400).json({ message: 'No hay cupos disponibles' });
        }

        const requiresRiot = tournament.riotRequirements?.required === true || RIOT_GAMES.has(tournament.game);
        const requiresFreeEntry = isRiotReviewMode() || requiresRiot;
        if (requiresFreeEntry && !isFreeEntryMode(tournament.entryFee)) {
            return res.status(400).json({
                message: isRiotReviewMode()
                    ? 'RIOT_REVIEW_MODE activo: solo se permiten torneos con inscripción gratuita'
                    : 'Este torneo Riot no es elegible: las inscripciones deben ser gratuitas'
            });
        }
        // Requisitos Riot (si aplica)
        if (requiresRiot) {
            const user = await User.findById(req.userId).select('connections.riot gameProfiles.lol');
            if (!user?.connections?.riot?.verified) {
                return res.status(400).json({ message: 'Debes vincular tu cuenta Riot para inscribirte' });
            }
            const minTier = tournament.riotRequirements?.minTier;
            const maxTier = tournament.riotRequirements?.maxTier;
            if (minTier || maxTier) {
                const tierOrder = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
                const userTier = user?.gameProfiles?.lol?.rank?.tier;
                if (!userTier) {
                    return res.status(400).json({ message: 'No se encontró tu rango Riot (LoL). Sin rango no puedes inscribirte.' });
                }
                const idx = (t) => tierOrder.indexOf(String(t || '').toUpperCase());
                const userIdx = idx(userTier);
                const minIdx = minTier ? idx(minTier) : null;
                const maxIdx = maxTier ? idx(maxTier) : null;
                if (userIdx < 0) {
                    return res.status(400).json({ message: 'Rango Riot inválido' });
                }
                if (minIdx !== null && userIdx < minIdx) {
                    return res.status(400).json({ message: `Rango mínimo requerido: ${minTier}` });
                }
                if (maxIdx !== null && userIdx > maxIdx) {
                    return res.status(400).json({ message: `Rango máximo permitido: ${maxTier}` });
                }
            }
        }

        const registrations = Array.isArray(tournament.registrations) ? tournament.registrations : [];
        const alreadyRegistered = registrations.some((registration) => (
            String(registration?.captain || '') === String(req.userId)
            && String(registration?.status || 'approved').toLowerCase() !== 'rejected'
        ));
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Ya registraste un equipo en este torneo' });
        }
        const incomingTeamId = String(teamId || '').trim();
        if (incomingTeamId) {
            const teamAlreadyRegistered = registrations.some((registration) => (
                String(registration?.teamId || '') === incomingTeamId
                && String(registration?.status || 'approved').toLowerCase() !== 'rejected'
            ));
            if (teamAlreadyRegistered) {
                return res.status(400).json({ message: 'Ese equipo ya está inscrito en este torneo' });
            }
        }

        if (requiresRiot && !incomingTeamId) {
            return res.status(400).json({
                message: 'Para torneos con requisito Riot debes inscribir un equipo oficial de la plataforma'
            });
        }

        let registrationPayload = null;
        if (incomingTeamId) {
            const team = await Team.findById(incomingTeamId);
            if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });
            if (String(team.captain) !== String(req.userId)) {
                return res.status(403).json({ message: 'Solo el capitán puede inscribir al equipo' });
            }
            if (team.game !== tournament.game) {
                return res.status(400).json({ message: 'El juego del equipo no coincide con el torneo' });
            }
            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
            const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
            const coach = team?.roster?.coach && typeof team.roster.coach === 'object' ? [team.roster.coach] : [];
            const expected = team.maxMembers || starters.length;
            const complete = expected > 0 && starters.length >= expected && starters.slice(0, expected).every(p => p && p.nickname);
            if (!complete) {
                return res.status(400).json({ message: 'El equipo no está completo' });
            }
            const startersForTournament = starters.slice(0, expected);

            // Validar roles según juego (solo titulares)
            const allowedRoles = ROLE_NAMES[tournament.game] || ROLE_NAMES[team.game] || [];
            if (allowedRoles.length > 0) {
                const invalidRole = startersForTournament.find(p => p?.role && !allowedRoles.includes(p.role));
                if (invalidRole) {
                    return res.status(400).json({ message: `Rol inválido para ${tournament.game}: ${invalidRole.role}` });
                }
                const missingRole = startersForTournament.find(p => !p?.role);
                if (missingRole) {
                    return res.status(400).json({ message: `Todos los titulares deben tener rol para ${tournament.game}` });
                }
            }

            const rosterUsers = [...startersForTournament, ...subs, ...coach]
                .filter((player) => player?.user)
                .map((player) => String(player.user));
            const duplicateRosterUser = findDuplicate(rosterUsers);
            if (duplicateRosterUser) {
                return res.status(400).json({ message: 'Hay jugadores repetidos en el roster del equipo' });
            }

            const users = [...new Set(rosterUsers)];
            const riotUsers = users.length
                ? await User.find({ _id: { $in: users } }).select('connections.riot')
                : [];
            const riotMap = new Map(
                riotUsers.map(u => [String(u._id), u.connections?.riot?.verified ? `${u.connections.riot.gameName}#${u.connections.riot.tagLine}` : ''])
            );
            if (requiresRiot) {
                const missing = startersForTournament.find((player) => (
                    !player?.user || !riotMap.get(String(player.user))
                ));
                if (missing) {
                    return res.status(400).json({ message: 'Todos los titulares deben tener Riot vinculado' });
                }
                const starterRiotIds = startersForTournament
                    .map((player) => normalizeRiotId(riotMap.get(String(player?.user || ''))))
                    .filter(Boolean);
                const duplicateStarterRiot = findDuplicate(starterRiotIds);
                if (duplicateStarterRiot) {
                    return res.status(400).json({ message: 'Hay Riot IDs repetidos en los titulares del equipo' });
                }
            }

            registrationPayload = {
                teamId: team._id,
                teamName: team.name,
                logoUrl: team.logo || '',
                captain: team.captain,
                teamMeta: {
                    category: team.category || '',
                    teamCountry: team.teamCountry || '',
                    teamLevel: team.teamLevel || '',
                    coach: team.roster?.coach?.nickname || ''
                },
                roster: {
                    starters: startersForTournament.map(p => ({
                        nickname: p?.nickname || '',
                        gameId: p?.gameId || '',
                        region: p?.region || '',
                        role: p?.role || '',
                        riotId: p?.user ? (riotMap.get(String(p.user)) || '') : ''
                    })),
                    subs: subs.map(p => ({
                        nickname: p?.nickname || '',
                        gameId: p?.gameId || '',
                        region: p?.region || '',
                        role: p?.role || '',
                        riotId: p?.user ? (riotMap.get(String(p.user)) || '') : ''
                    }))
                },
                status: 'approved'
            };
        } else {
            if (!teamName || !String(teamName).trim()) {
                return res.status(400).json({ message: 'Nombre de equipo requerido' });
            }
            const starters = Array.isArray(roster?.starters) ? roster.starters.filter(Boolean) : [];
            const subs = Array.isArray(roster?.subs) ? roster.subs.filter(Boolean) : [];
            registrationPayload = {
                teamName: String(teamName).trim(),
                logoUrl: logoUrl || '',
                captain: req.userId,
                roster: {
                    starters: starters.map(n => ({ nickname: n })),
                    subs: subs.map(n => ({ nickname: n }))
                },
                status: 'approved'
            };
        }

        if (requiresRiot) {
            const incomingRiotIds = getRegistrationRiotIds(registrationPayload);
            const duplicateInPayload = findDuplicate(incomingRiotIds);
            if (duplicateInPayload) {
                return res.status(400).json({ message: 'Hay Riot IDs repetidos en la inscripción del equipo' });
            }

            const existingRiotIds = collectTournamentRiotIds(registrations);
            const conflictRiotId = incomingRiotIds.find((riotId) => existingRiotIds.has(riotId));
            if (conflictRiotId) {
                return res.status(400).json({
                    message: 'Uno o más Riot IDs de este equipo ya están inscritos en el torneo'
                });
            }
        }

        tournament.registrations = tournament.registrations || [];
        tournament.registrations.push(registrationPayload);

        tournament.currentSlots = Math.min((tournament.currentSlots || 0) + 1, tournament.maxSlots);
        syncProvisionalBracketWithRegistrations(tournament);
        await tournament.save();

        // Notify the captain
        await pushNotification(req.userId, NOTIF.tournamentRegistered(tournament.name || tournament.tournamentId));

        return res.status(200).json({ message: 'Equipo registrado', tournamentId: tournament.tournamentId });

    } catch (error) {
        console.error("Error al registrar equipo:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const updateRegistrationStatus = async (req, res) => {
    try {
        const { code, registrationId } = req.params;
        const { status } = req.body || {};

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = isTournamentOwner(tournament, req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para gestionar inscripciones' });
        }

        const reg = (tournament.registrations || []).id(registrationId);
        if (!reg) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const previousStatus = String(reg?.status || 'approved').toLowerCase();

        if (status === 'rejected') {
            if (previousStatus === 'approved' && tournament?.bracket?.isProvisional) {
                const bracketEntry = toBracketEntry(reg);
                if (bracketEntry) {
                    replaceEntryWithVacancy(tournament.bracket.rounds, bracketEntry, { vacancyMode: 'placeholder' });
                    tournament.bracket.isProvisional = hasVacantSlotsInFirstRound(tournament.bracket.rounds);
                }
            }
            // Notify captain before removing
            if (reg.captain) {
                await pushNotification(reg.captain, NOTIF.tournamentRejected(tournament.name || tournament.tournamentId));
            }
            tournament.registrations = (tournament.registrations || []).filter(r => String(r._id) !== String(registrationId));
            tournament.currentSlots = Math.max((tournament.currentSlots || 0) - 1, 0);
        } else {
            reg.status = status;
            syncProvisionalBracketWithRegistrations(tournament);
            if (reg.captain) {
                await pushNotification(reg.captain, NOTIF.tournamentApproved(tournament.name || tournament.tournamentId));
            }
        }
        await tournament.save();

        return res.status(200).json({ message: 'Estado actualizado', status });

    } catch (error) {
        console.error("Error al actualizar registro:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const removeRegistration = async (req, res) => {
    try {
        const { code, registrationId } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = isTournamentOwner(tournament, req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar equipos' });
        }

        const before = (tournament.registrations || []).length;
        const removedReg = (tournament.registrations || []).find(r => String(r._id) === String(registrationId));
        tournament.registrations = (tournament.registrations || []).filter(r => String(r._id) !== String(registrationId));
        if (tournament.registrations.length === before) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        // Notify the removed team captain
        if (removedReg?.captain) {
            await pushNotification(removedReg.captain, NOTIF.tournamentRemoved(tournament.name || tournament.tournamentId));
        }
        if (String(removedReg?.status || 'approved').toLowerCase() === 'approved' && tournament?.bracket?.isProvisional) {
            const bracketEntry = toBracketEntry(removedReg);
            if (bracketEntry) {
                replaceEntryWithVacancy(tournament.bracket.rounds, bracketEntry, { vacancyMode: 'placeholder' });
                tournament.bracket.isProvisional = hasVacantSlotsInFirstRound(tournament.bracket.rounds);
            }
        }
        tournament.currentSlots = Math.max((tournament.currentSlots || 0) - 1, 0);
        syncProvisionalBracketWithRegistrations(tournament);
        await tournament.save();
        return res.status(200).json({ message: 'Equipo removido' });
    } catch (error) {
        console.error("Error al eliminar inscripción:", error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const updateTournamentStatus = async (req, res) => {
    try {
        const { code } = req.params;
        const { action } = req.body || {};

        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const user = await User.findById(req.userId).select('isAdmin');
        const isOwner = isTournamentOwner(tournament, req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para cambiar el estado' });
        }

        const currentStatus = String(tournament.status || '').toLowerCase();

        switch (action) {
            case 'open':
                if (['ongoing', 'finished', 'cancelled'].includes(currentStatus)) {
                    return res.status(400).json({ message: 'No se puede reabrir un torneo en curso, finalizado o cancelado' });
                }
                tournament.status = 'open';
                tournament.registrationClosed = false;
                break;
            case 'close':
                if (currentStatus !== 'open') {
                    return res.status(400).json({ message: 'Solo puedes cerrar inscripciones cuando el torneo está abierto' });
                }
                tournament.registrationClosed = true;
                break;
            case 'cancel':
                if (currentStatus === 'finished') {
                    return res.status(400).json({ message: 'No se puede cancelar un torneo finalizado' });
                }
                tournament.status = 'cancelled';
                tournament.registrationClosed = true;
                break;
            case 'start':
                if (currentStatus !== 'open') {
                    return res.status(400).json({ message: 'Solo puedes iniciar un torneo que esté abierto' });
                }
                if (!Array.isArray(tournament?.bracket?.rounds) || tournament.bracket.rounds.length === 0) {
                    return res.status(400).json({ message: 'Debes generar el bracket antes de iniciar el torneo' });
                }
                if (isRiotTournamentPolicyScope(tournament) && !hasTraditionalTournamentBracket(tournament.bracket)) {
                    return res.status(400).json({
                        message: 'Torneos Riot deben avanzar por cruces directos en bracket tradicional'
                    });
                }
                {
                    const approvedCount = (tournament.registrations || []).filter(isApprovedRegistration).length;
                    if (approvedCount < 2) {
                        return res.status(400).json({ message: 'Se requieren al menos 2 equipos aprobados para iniciar el torneo' });
                    }
                }
                if (isRiotTournamentPolicyScope(tournament)) {
                    const activeParticipants = countTournamentActiveParticipants(tournament);
                    const minParticipants = getRiotMinActiveParticipants();
                    if (activeParticipants < minParticipants) {
                        return res.status(400).json({
                            message: `Torneos Riot requieren mínimo ${minParticipants} participantes activos para iniciar (actual: ${activeParticipants}).`
                        });
                    }
                }
                if (
                    tournament?.bracket?.isProvisional
                    && normalizeTournamentFormat(tournament?.bracket?.format) === 'single_elimination'
                ) {
                    convertProvisionalBracketToLive(tournament.bracket.rounds);
                    tournament.bracket.isProvisional = false;
                }
                tournament.status = 'ongoing';
                tournament.registrationClosed = true;
                break;
            case 'finish':
                if (currentStatus !== 'ongoing') {
                    return res.status(400).json({ message: 'Solo puedes finalizar un torneo que esté en curso' });
                }
                tournament.status = 'finished';
                tournament.registrationClosed = true;
                break;
            default:
                return res.status(400).json({ message: 'Acción inválida' });
        }

        await tournament.save();

        // Notify all registered captains on key status changes
        const tName = tournament.name || tournament.tournamentId;
        const captains = (tournament.registrations || []).map(r => r.captain).filter(Boolean);
        const notifMap = { start: NOTIF.tournamentStarting, cancel: NOTIF.tournamentCancelled, finish: NOTIF.tournamentFinished };
        if (notifMap[action]) {
            for (const captainId of captains) {
                await pushNotification(captainId, notifMap[action](tName));
            }
        }

        return res.status(200).json({
            message: 'Estado actualizado',
            status: tournament.status,
            registrationClosed: tournament.registrationClosed
        });

    } catch (error) {
        console.error("Error al cambiar estado:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};
