import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import { recordAdminAudit } from '../services/auditLogger.js';
import { isUniversityGameAllowed } from '../config/universityCatalog.js';

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
const MLBB_GAMES = new Set([
    'Mobile Legends',
    'Mobile Legends: Bang Bang',
    'MLBB'
]);
import fs from 'fs';

const parseBooleanEnv = (value, fallback = false) => {
    const raw = String(value ?? '').trim().toLowerCase();
    if (!raw) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
    if (['0', 'false', 'no', 'off'].includes(raw)) return false;
    return fallback;
};

const parsePositiveIntEnv = (value, fallback) => {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return parsed;
};

const MLBB_BETA_MODE = parseBooleanEnv(process.env.MLBB_BETA_MODE, true);
const MLBB_MIN_APPROVED_TEAMS = parsePositiveIntEnv(process.env.MLBB_MIN_APPROVED_TEAMS, 2);
const MLBB_REQUIRE_LINKED_STARTERS = parseBooleanEnv(process.env.MLBB_REQUIRE_LINKED_STARTERS, true);
const MLBB_REQUIRE_LINKED_PLAYERS = parseBooleanEnv(process.env.MLBB_REQUIRE_LINKED_PLAYERS, true);
const MLBB_ALLOWED_FORMATS = new Set([
    'single_elimination',
    'double_elimination',
    'swiss',
    'round_robin'
]);
const MLBB_BANNED_TERMS = [
    'apuesta',
    'apuestas',
    'bet',
    'bets',
    'betting',
    'wager',
    'wagering',
    'gambling',
    'casino',
    'odds',
    'parlay',
    'cuota',
    'cuotas'
];
const normalizeUniversityText = (value = '') => String(value || '').trim();
const isUniversityOnlyTournament = (tournament = {}) => tournament?.eligibility?.universityOnly === true;

const normalizeText = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const normalizeTournamentFormat = (value = '') => {
    const raw = normalizeText(value).trim();
    if (!raw) return '';
    if (raw === 'single_elimination' || raw.includes('eliminacion directa') || raw.includes('single elimination')) {
        return 'single_elimination';
    }
    if (raw === 'double_elimination' || raw.includes('doble eliminacion') || raw.includes('double elimination')) {
        return 'double_elimination';
    }
    if (raw === 'swiss' || raw.includes('suizo')) {
        return 'swiss';
    }
    if (raw === 'round_robin' || raw.includes('round robin')) {
        return 'round_robin';
    }
    return raw;
};

const normalizeEntryFee = (value = '') => normalizeText(value).trim();
const normalizeTournamentSearchQuery = (value = '') =>
    String(value || '')
        .trim()
        .replace(/^#/, '')
        .replace(/^(TOR-)\s*/i, '')
        .replace(/^(TOR-)\s*/i, '')
        .replace(/^TOR[-_\s]*/i, '')
        .trim();

const findBannedMlbbTerm = (text = '') => {
    const normalized = normalizeText(text);
    for (const term of MLBB_BANNED_TERMS) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(normalized)) return term;
    }
    return '';
};

const normalizeMlbbIdentity = (value = '') => String(value || '').trim();

const isValidMlbbId = (value = '') => /^\d{5,15}$/.test(normalizeMlbbIdentity(value));
const isValidMlbbZone = (value = '') => /^\d{3,6}$/.test(normalizeMlbbIdentity(value));
const isFilledRosterEntry = (player) => Boolean(
    player && (player.user || player.nickname || player.gameId || player.region || player.role)
);

const getMlbbStarters = (registration) =>
    Array.isArray(registration?.roster?.starters)
        ? registration.roster.starters.filter(isFilledRosterEntry)
        : [];
const getMlbbSubs = (registration) =>
    Array.isArray(registration?.roster?.subs)
        ? registration.roster.subs.filter(isFilledRosterEntry)
        : [];
const getMlbbRosterPlayers = (registration) => [
    ...getMlbbStarters(registration),
    ...getMlbbSubs(registration)
];

const getApprovedRegistrations = (tournament) =>
    (Array.isArray(tournament?.registrations) ? tournament.registrations : [])
        .filter((r) => String(r?.status || 'approved') === 'approved');

const validateMlbbRegistrationRoster = (registration) => {
    const starters = getMlbbStarters(registration);
    if (!starters.length) {
        return { ok: false, message: `El equipo ${registration?.teamName || 'sin nombre'} no tiene titulares definidos.` };
    }
    const invalidStarter = starters.find((p) => !isValidMlbbId(p?.gameId) || !isValidMlbbZone(p?.region));
    if (invalidStarter) {
        return {
            ok: false,
            message: `El equipo ${registration?.teamName || 'sin nombre'} tiene titulares sin User ID + Zone ID válidos.`
        };
    }
    const invalidSub = getMlbbSubs(registration).find((p) => !isValidMlbbId(p?.gameId) || !isValidMlbbZone(p?.region));
    if (invalidSub) {
        return {
            ok: false,
            message: `El equipo ${registration?.teamName || 'sin nombre'} tiene suplentes sin User ID + Zone ID válidos.`
        };
    }
    return { ok: true };
};

const findDuplicateMlbbIdentity = (registrations = []) => {
    const seen = new Map();
    for (const reg of registrations) {
        const teamName = reg?.teamName || 'Equipo';
        const regId = String(reg?._id || '');
        const players = getMlbbRosterPlayers(reg);
        for (const p of players) {
            const key = `${normalizeMlbbIdentity(p?.gameId)}::${normalizeMlbbIdentity(p?.region)}`;
            if (!isValidMlbbId(p?.gameId) || !isValidMlbbZone(p?.region)) continue;
            if (seen.has(key) && seen.get(key).regId !== regId) {
                const first = seen.get(key);
                return {
                    found: true,
                    message: `User ID + Zone ID duplicado entre "${first.teamName}" y "${teamName}".`
                };
            }
            seen.set(key, { regId, teamName });
        }
    }
    return { found: false, message: '' };
};

const buildMlbbUserIdentityMap = async (registrations = []) => {
    const userIds = new Set();
    for (const reg of registrations) {
        const players = getMlbbRosterPlayers(reg);
        for (const p of players) {
            if (p?.user) userIds.add(String(p.user));
        }
    }

    if (!userIds.size) return new Map();

    const users = await User.find({ _id: { $in: [...userIds] } }).select('connections.mlbb');
    return new Map(
        users.map((u) => {
            const status = String(
                u?.connections?.mlbb?.verificationStatus
                || (u?.connections?.mlbb?.verified ? 'verified' : 'unlinked')
            );
            return [
                String(u._id),
                {
                    status,
                    playerId: normalizeMlbbIdentity(u?.connections?.mlbb?.playerId),
                    zoneId: normalizeMlbbIdentity(u?.connections?.mlbb?.zoneId)
                }
            ];
        })
    );
};

const getMlbbIdentityBindingIssues = (
    registrations = [],
    identityMap = new Map(),
    options = {}
) => {
    const strictLinkedPlayers = options.strictLinkedPlayers !== undefined
        ? options.strictLinkedPlayers === true
        : MLBB_REQUIRE_LINKED_PLAYERS;
    const issues = [];
    for (const reg of registrations) {
        const teamName = reg?.teamName || 'Equipo';
        const players = getMlbbRosterPlayers(reg);
        for (const p of players) {
            const slotLabel = getMlbbStarters(reg).includes(p) ? 'titular' : 'suplente';
            if (!p?.user) {
                if (strictLinkedPlayers) {
                    issues.push(`El ${slotLabel} "${p?.nickname || 'N/A'}" de "${teamName}" no está vinculado a un usuario de Esportefy.`);
                }
                continue;
            }
            const linked = identityMap.get(String(p.user));
            if (!linked || linked.status !== 'verified') {
                issues.push(`El ${slotLabel} "${p?.nickname || 'N/A'}" de "${teamName}" no tiene cuenta MLBB verificada.`);
                continue;
            }
            const pid = normalizeMlbbIdentity(p?.gameId);
            const zid = normalizeMlbbIdentity(p?.region);
            if (pid !== linked.playerId || zid !== linked.zoneId) {
                issues.push(`El ${slotLabel} "${p?.nickname || 'N/A'}" de "${teamName}" no coincide con su cuenta MLBB vinculada.`);
            }
        }
    }
    return issues;
};

const getMlbbComplianceIssues = ({
    title = '',
    description = '',
    prizeDetails = '',
    entryFee = '',
    format = '',
    contact = {},
    legalCompliance = {}
}) => {
    const issues = [];

    const normalizedFormat = normalizeTournamentFormat(format);
    if (!MLBB_ALLOWED_FORMATS.has(normalizedFormat)) {
        issues.push('Formato no permitido para MLBB. Usa eliminación directa, doble eliminación, suizo o round robin.');
    }

    if (MLBB_BETA_MODE) {
        const normalizedEntryFee = normalizeEntryFee(entryFee);
        if (!['gratis', 'free', '0', '0.0', '0.00'].includes(normalizedEntryFee)) {
            issues.push('En modo beta MLBB solo se permiten torneos gratuitos (entry fee = Gratis).');
        }
    }

    const banned = findBannedMlbbTerm([title, description, prizeDetails].join(' '));
    if (banned) {
        issues.push(`Texto no permitido para cumplimiento MLBB: "${banned}".`);
    }

    if (!String(contact?.email || '').trim()) {
        issues.push('Debes definir un correo de contacto para el torneo MLBB.');
    }

    if (!String(legalCompliance?.claimsContact || '').trim()) {
        issues.push('Debes definir un canal de reclamos legales para el torneo MLBB.');
    }

    if (!String(legalCompliance?.jurisdiction || '').trim() || !String(legalCompliance?.governingLaw || '').trim()) {
        issues.push('Debes completar jurisdicción y normativa aplicable para torneos MLBB.');
    }

    if (legalCompliance?.rulesAccepted !== true || legalCompliance?.privacyAccepted !== true || legalCompliance?.organizerDeclaration !== true) {
        issues.push('Debes aceptar reglas, privacidad y declaración de organizador para torneos MLBB.');
    }

    return issues;
};

const validateUniversityTournamentTeam = async (team) => {
    if (!team?.university?.isUniversityTeam || !normalizeUniversityText(team?.university?.universityId)) {
        return {
            ok: false,
            message: 'Este torneo solo acepta equipos universitarios verificados.'
        };
    }

    const rosterPlayers = []
        .concat(Array.isArray(team?.roster?.starters) ? team.roster.starters.filter(isFilledRosterEntry) : [])
        .concat(Array.isArray(team?.roster?.subs) ? team.roster.subs.filter(isFilledRosterEntry) : []);

    if (!rosterPlayers.length) {
        return { ok: false, message: 'El equipo universitario no tiene roster válido.' };
    }

    for (const player of rosterPlayers) {
        if (!player?.user) {
            return {
                ok: false,
                message: 'En torneos universitarios todos los jugadores del roster deben ser usuarios verificados de Esportefy.'
            };
        }
    }

    const userIds = [...new Set(rosterPlayers.map((player) => String(player.user)).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('university');
    const userMap = new Map(users.map((user) => [String(user._id), user.university || {}]));
    const expectedUniversityId = normalizeUniversityText(team.university.universityId);

    for (const player of rosterPlayers) {
        const university = userMap.get(String(player.user)) || {};
        if (!university?.verified || normalizeUniversityText(university?.universityId) !== expectedUniversityId) {
            return {
                ok: false,
                message: 'Todos los jugadores del equipo deben tener la misma universidad verificada para competir en torneos universitarios.'
            };
        }
    }

    return { ok: true };
};

const ACTIVE_DAYS = 30;

const canManageTournament = async (tournament, userId) => {
    if (!tournament || !userId) return false;
    const isOwner = String(tournament.organizer) === String(userId);
    if (isOwner) return true;
    const user = await User.findById(userId).select('isAdmin');
    return user?.isAdmin === true;
};

const toPublicTournament = (tournamentDoc) => {
    const t = tournamentDoc?.toObject ? tournamentDoc.toObject() : tournamentDoc;
    if (!t) return null;
    const ps = t.publicSettings || {};

    const out = {
        tournamentId: t.tournamentId,
        title: t.title,
        game: t.game,
        status: t.status,
        bannerImage: t.bannerImage || '',
        description: t.description || '',
        modality: t.modality || '',
        format: t.format || '',
        date: t.date || null,
        time: t.time || '',
        timezone: t.timezone || '',
        slots: {
            current: Number(t.currentSlots || 0),
            max: Number(t.maxSlots || 0)
        },
        customMessage: ps.customMessage || '',
        visibility: ps.visibility || 'public',
        publicSettings: {
            showPrize: ps.showPrize !== false,
            showSponsors: ps.showSponsors !== false,
            showRules: ps.showRules !== false,
            showSchedule: ps.showSchedule !== false,
            showContact: ps.showContact !== false,
            showTeams: ps.showTeams === true,
            showBracket: ps.showBracket !== false
        }
    };

    if (ps.showPrize !== false) {
        out.prizeMode = t.prizeMode || 'none';
        out.prizeDetails = t.prizeDetails || '';
        out.prizePool = t.prizePool || '';
        out.currency = t.currency || 'USD';
        out.prizesByRank = t.prizesByRank || {};
    }
    if (ps.showSchedule !== false) {
        out.registrationWindow = t.registrationWindow || {};
        out.checkInWindow = t.checkInWindow || {};
    }
    if (ps.showSponsors !== false) {
        out.sponsors = Array.isArray(t.sponsors)
            ? t.sponsors.map((s) => ({
                name: s?.name || '',
                link: s?.link || '',
                tier: s?.tier || '',
                logoUrl: s?.logoUrl || ''
            }))
            : [];
    }
    if (ps.showContact !== false) {
        out.contact = t.contact || {};
        out.broadcast = t.broadcast || {};
    }
    if (ps.showRules !== false) {
        out.rulesPdf = t.rulesPdf || '';
    }
    if (ps.showTeams === true) {
        out.registrations = Array.isArray(t.registrations)
            ? t.registrations.map((r) => ({
                _id: r?._id,
                teamName: r?.teamName || '',
                logoUrl: r?.logoUrl || '',
                status: r?.status || 'approved',
                registeredAt: r?.registeredAt || null
            }))
            : [];
    }
    if (ps.showBracket !== false) {
        out.bracket = t.bracket || null;
    }

    return out;
};

const pushNotificationMany = async (userIds, payload) => {
    const ids = Array.isArray(userIds) ? [...new Set(userIds.filter(Boolean).map(String))] : [];
    if (!ids.length) return;
    await User.updateMany(
        { _id: { $in: ids } },
        { $push: { notifications: payload } }
    );
};

const getInterestedUsers = async (game, excludeIds = []) => {
    const keys = [String(game || ''), String(game || '').toLowerCase()].filter(Boolean);
    const since = new Date(Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000);
    const users = await User.find({
        selectedGames: { $in: keys },
        updatedAt: { $gte: since },
        _id: { $nin: excludeIds }
    }).select('_id');
    return users.map((u) => String(u._id));
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
        const data = req.body;
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
        const parsedPrizesByRank = parseField(data.prizesByRank) || {};
        const parsedStaff = parseField(data.staff) || {};
        const parsedRegistrationWindow = parseField(data.registrationWindow) || {};
        const parsedCheckInWindow = parseField(data.checkInWindow) || {};
        const parsedEligibility = parseField(data.eligibility) || {};
        const parsedContact = parseField(data.contact) || {};
        const parsedBroadcast = parseField(data.broadcast) || {};
        const parsedMatchConfig = parseField(data.matchConfig) || {};
        const parsedLegalCompliance = parseField(data.legalCompliance) || {};

        const normalizeDateValue = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const normalizeStringArray = (value) => {
            if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
            if (typeof value === 'string') {
                return value.split(',').map((v) => v.trim()).filter(Boolean);
            }
            return [];
        };
        const sponsorsWithLogos = Array.isArray(sponsors)
            ? sponsors.map((s, idx) => {
                const fileIndex = Number.isInteger(s?.logoIndex) ? s.logoIndex : idx;
                return {
                    ...s,
                    logoUrl: sponsorLogoFiles[fileIndex]?.path || s.logoUrl || ''
                };
            })
            : [];
        const wantsUniversityOnly = parsedEligibility.universityOnly === true || String(parsedEligibility.universityOnly || '').trim().toLowerCase() === 'true';
        if (wantsUniversityOnly && !isUniversityGameAllowed(data.game)) {
            return res.status(400).json({
                message: 'Los torneos universitarios solo pueden crearse para juegos de Riot o Mobile Legends.'
            });
        }

        const newTournament = new Tournament({
            ...data,
            tournamentId,
            prizesByRank: parsedPrizesByRank,
            sponsors: sponsorsWithLogos,
            staff: parsedStaff,
            timezone: data.timezone || 'America/Santo_Domingo',
            registrationWindow: {
                start: normalizeDateValue(parsedRegistrationWindow.start),
                end: normalizeDateValue(parsedRegistrationWindow.end)
            },
            checkInWindow: {
                start: normalizeDateValue(parsedCheckInWindow.start),
                end: normalizeDateValue(parsedCheckInWindow.end)
            },
            eligibility: {
                minAge: Number(parsedEligibility.minAge) > 0 ? Number(parsedEligibility.minAge) : 13,
                allowedCountries: normalizeStringArray(parsedEligibility.allowedCountries),
                notes: parsedEligibility.notes || '',
                universityOnly: wantsUniversityOnly
            },
            contact: {
                email: parsedContact.email || '',
                phone: parsedContact.phone || '',
                discordInvite: parsedContact.discordInvite || ''
            },
            broadcast: {
                streamUrl: parsedBroadcast.streamUrl || '',
                streamLanguage: parsedBroadcast.streamLanguage || 'es'
            },
            matchConfig: {
                seriesType: parsedMatchConfig.seriesType || 'BO3',
                mapPool: normalizeStringArray(parsedMatchConfig.mapPool),
                patchVersion: parsedMatchConfig.patchVersion || ''
            },
            legalCompliance: {
                jurisdiction: parsedLegalCompliance.jurisdiction || '',
                governingLaw: parsedLegalCompliance.governingLaw || '',
                claimsContact: parsedLegalCompliance.claimsContact || '',
                rulesAccepted: parsedLegalCompliance.rulesAccepted === true,
                privacyAccepted: parsedLegalCompliance.privacyAccepted === true,
                organizerDeclaration: parsedLegalCompliance.organizerDeclaration === true
            },
            bannerImage: bannerPath,
            rulesPdf: pdfPath,
            organizer: req.userId,

            status: 'open',
            registrationClosed: false,
            currentSlots: 0
        });

        if (!data.date || new Date(data.date) < new Date()) {
            return res.status(400).json({ message: 'La fecha del torneo no es válida' });
        }

        if (!data.time || !String(data.time).trim()) {
            return res.status(400).json({ message: 'La hora del torneo es requerida' });
        }

        if (!data.maxSlots || data.maxSlots < 2) {
            return res.status(400).json({ message: 'El torneo debe tener al menos 2 cupos' });
        }

        const prizeValues = [
            parsedPrizesByRank?.first,
            parsedPrizesByRank?.second,
            parsedPrizesByRank?.third
        ];
        const hasNegative = prizeValues.some(v => Number(v) < 0);
        if (hasNegative) {
            return res.status(400).json({ message: 'Los premios no pueden ser negativos' });
        }

        const eventDate = data.date ? new Date(data.date) : null;
        const regStart = normalizeDateValue(parsedRegistrationWindow.start);
        const regEnd = normalizeDateValue(parsedRegistrationWindow.end);
        const checkStart = normalizeDateValue(parsedCheckInWindow.start);
        const checkEnd = normalizeDateValue(parsedCheckInWindow.end);

        if (regStart && regEnd && regEnd < regStart) {
            return res.status(400).json({ message: 'La ventana de inscripción es inválida' });
        }
        if (regEnd && eventDate && regEnd > eventDate) {
            return res.status(400).json({ message: 'El cierre de inscripción no puede superar la fecha del torneo' });
        }
        if (checkStart && checkEnd && checkEnd < checkStart) {
            return res.status(400).json({ message: 'La ventana de check-in es inválida' });
        }
        if (checkStart && eventDate && checkStart > eventDate) {
            return res.status(400).json({ message: 'El check-in debe iniciar antes del torneo' });
        }
        if (!String(parsedLegalCompliance.jurisdiction || '').trim() || !String(parsedLegalCompliance.governingLaw || '').trim()) {
            return res.status(400).json({ message: 'Debes definir jurisdicción y normativa aplicable del torneo' });
        }
        if (!parsedLegalCompliance.rulesAccepted || !parsedLegalCompliance.privacyAccepted || !parsedLegalCompliance.organizerDeclaration) {
            return res.status(400).json({ message: 'Debes aceptar los términos, privacidad y declaración de organizador' });
        }

        if (MLBB_GAMES.has(String(data.game || '').trim())) {
            const mlbbIssues = getMlbbComplianceIssues({
                title: data.title,
                description: data.description,
                prizeDetails: data.prizeDetails,
                entryFee: data.entryFee,
                format: data.format,
                contact: parsedContact,
                legalCompliance: parsedLegalCompliance
            });
            if (mlbbIssues.length) {
                return res.status(400).json({
                    message: mlbbIssues[0],
                    complianceIssues: mlbbIssues
                });
            }
        }


        const savedTournament = await newTournament.save();

        // Notificar usuarios interesados (juego seleccionado) y activos
        const interestedIds = await getInterestedUsers(savedTournament.game, [req.userId]);
        await pushNotificationMany(interestedIds, {
            type: 'tournament',
            category: 'tournament',
            title: 'Nuevo torneo disponible',
            source: savedTournament.title || 'Torneo',
            message: `Nuevo torneo de ${savedTournament.game}: ${savedTournament.title}`,
            status: 'unread',
            meta: { tournamentId: savedTournament.tournamentId, action: 'created' },
            visuals: { icon: 'bx-trophy', color: '#facc15', glow: true }
        });

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
        const parsedPrizesByRank = parseField(data.prizesByRank);
        const parsedStaff = parseField(data.staff);
        const parsedRegistrationWindow = parseField(data.registrationWindow);
        const parsedCheckInWindow = parseField(data.checkInWindow);
        const parsedEligibility = parseField(data.eligibility);
        const parsedContact = parseField(data.contact);
        const parsedBroadcast = parseField(data.broadcast);
        const parsedMatchConfig = parseField(data.matchConfig);
        const parsedLegalCompliance = parseField(data.legalCompliance);

        const normalizeDateValue = (value) => {
            if (!value) return null;
            const parsed = new Date(value);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
        };

        const normalizeStringArray = (value) => {
            if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
            if (typeof value === 'string') {
                return value.split(',').map((v) => v.trim()).filter(Boolean);
            }
            return [];
        };
        const sponsorsWithLogos = Array.isArray(sponsors)
            ? sponsors.map((s, idx) => {
                const fileIndex = Number.isInteger(s?.logoIndex) ? s.logoIndex : idx;
                return {
                    ...s,
                    logoUrl: sponsorLogoFiles[fileIndex]?.path || s.logoUrl || ''
                };
            })
            : undefined;

        if (data.date && new Date(data.date) < new Date()) {
            return res.status(400).json({ message: 'La fecha del torneo no es válida' });
        }

        if (data.time !== undefined && !String(data.time).trim()) {
            return res.status(400).json({ message: 'La hora del torneo es requerida' });
        }

        if (data.maxSlots && Number(data.maxSlots) < Number(tournament.currentSlots)) {
            return res.status(400).json({ message: 'Los cupos no pueden ser menores a los inscritos' });
        }

        const update = {
            ...data,
            prizesByRank: parsedPrizesByRank,
            staff: parsedStaff
        };

        if (data.timezone) {
            update.timezone = data.timezone;
        }
        if (parsedRegistrationWindow) {
            update.registrationWindow = {
                start: normalizeDateValue(parsedRegistrationWindow.start),
                end: normalizeDateValue(parsedRegistrationWindow.end)
            };
        }
        if (parsedCheckInWindow) {
            update.checkInWindow = {
                start: normalizeDateValue(parsedCheckInWindow.start),
                end: normalizeDateValue(parsedCheckInWindow.end)
            };
        }
        if (parsedEligibility) {
            update.eligibility = {
                minAge: Number(parsedEligibility.minAge) > 0 ? Number(parsedEligibility.minAge) : 13,
                allowedCountries: normalizeStringArray(parsedEligibility.allowedCountries),
                notes: parsedEligibility.notes || '',
                universityOnly: parsedEligibility.universityOnly === true || String(parsedEligibility.universityOnly || '').trim().toLowerCase() === 'true'
            };
        }
        const targetUniversityOnly = (update.eligibility || tournament.eligibility || {}).universityOnly === true;
        const targetUniversityGame = String(update.game || tournament.game || '').trim();
        if (targetUniversityOnly && !isUniversityGameAllowed(targetUniversityGame)) {
            return res.status(400).json({
                message: 'Los torneos universitarios solo pueden competir en juegos de Riot o Mobile Legends.'
            });
        }
        if (parsedContact) {
            update.contact = {
                email: parsedContact.email || '',
                phone: parsedContact.phone || '',
                discordInvite: parsedContact.discordInvite || ''
            };
        }
        if (parsedBroadcast) {
            update.broadcast = {
                streamUrl: parsedBroadcast.streamUrl || '',
                streamLanguage: parsedBroadcast.streamLanguage || 'es'
            };
        }
        if (parsedMatchConfig) {
            update.matchConfig = {
                seriesType: parsedMatchConfig.seriesType || 'BO3',
                mapPool: normalizeStringArray(parsedMatchConfig.mapPool),
                patchVersion: parsedMatchConfig.patchVersion || ''
            };
        }
        if (parsedLegalCompliance) {
            update.legalCompliance = {
                jurisdiction: parsedLegalCompliance.jurisdiction || '',
                governingLaw: parsedLegalCompliance.governingLaw || '',
                claimsContact: parsedLegalCompliance.claimsContact || '',
                rulesAccepted: parsedLegalCompliance.rulesAccepted === true,
                privacyAccepted: parsedLegalCompliance.privacyAccepted === true,
                organizerDeclaration: parsedLegalCompliance.organizerDeclaration === true
            };
        }

        const targetDate = data.date ? new Date(data.date) : tournament.date;
        const targetRegWindow = update.registrationWindow || tournament.registrationWindow || {};
        const targetCheckWindow = update.checkInWindow || tournament.checkInWindow || {};
        const regStart = normalizeDateValue(targetRegWindow.start);
        const regEnd = normalizeDateValue(targetRegWindow.end);
        const checkStart = normalizeDateValue(targetCheckWindow.start);
        const checkEnd = normalizeDateValue(targetCheckWindow.end);

        if (regStart && regEnd && regEnd < regStart) {
            return res.status(400).json({ message: 'La ventana de inscripción es inválida' });
        }
        if (regEnd && targetDate && regEnd > targetDate) {
            return res.status(400).json({ message: 'El cierre de inscripción no puede superar la fecha del torneo' });
        }
        if (checkStart && checkEnd && checkEnd < checkStart) {
            return res.status(400).json({ message: 'La ventana de check-in es inválida' });
        }
        if (checkStart && targetDate && checkStart > targetDate) {
            return res.status(400).json({ message: 'El check-in debe iniciar antes del torneo' });
        }
        const targetLegalCompliance = update.legalCompliance || tournament.legalCompliance || {};
        if (!String(targetLegalCompliance.jurisdiction || '').trim() || !String(targetLegalCompliance.governingLaw || '').trim()) {
            return res.status(400).json({ message: 'Debes definir jurisdicción y normativa aplicable del torneo' });
        }
        const targetGame = String(update.game || tournament.game || '').trim();
        const targetContact = update.contact || tournament.contact || {};
        const targetEntryFee = update.entryFee !== undefined ? update.entryFee : tournament.entryFee;
        const targetFormat = update.format !== undefined ? update.format : tournament.format;
        const targetDescription = update.description !== undefined ? update.description : tournament.description;
        const targetTitle = update.title !== undefined ? update.title : tournament.title;
        const targetPrizeDetails = update.prizeDetails !== undefined ? update.prizeDetails : tournament.prizeDetails;

        if (MLBB_GAMES.has(targetGame)) {
            const mlbbIssues = getMlbbComplianceIssues({
                title: targetTitle,
                description: targetDescription,
                prizeDetails: targetPrizeDetails,
                entryFee: targetEntryFee,
                format: targetFormat,
                contact: targetContact,
                legalCompliance: targetLegalCompliance
            });
            if (mlbbIssues.length) {
                return res.status(400).json({
                    message: mlbbIssues[0],
                    complianceIssues: mlbbIssues
                });
            }
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

export const getManageableTournaments = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('isAdmin');
        const filter = user?.isAdmin
            ? {}
            : { organizer: req.userId };

        const tournaments = await Tournament.find(filter)
            .sort({ createdAt: -1 })
            .select('tournamentId title game status date organizer publicSettings');

        return res.status(200).json(tournaments);
    } catch (error) {
        console.error('Error al obtener torneos gestionables:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const searchPublicTournaments = async (req, res) => {
    try {
        const q = String(req.query?.q || '').trim();
        const normalizedQ = normalizeTournamentSearchQuery(q);
        const baseQuery = {
            status: { $ne: 'draft' },
            'publicSettings.visibility': { $in: ['public', null] }
        };

        if (q) {
            baseQuery.$or = [
                { tournamentId: { $regex: q, $options: 'i' } },
                ...(normalizedQ && normalizedQ !== q ? [{ tournamentId: { $regex: normalizedQ, $options: 'i' } }] : []),
                { title: { $regex: q, $options: 'i' } }
            ];
        }

        const docs = await Tournament.find(baseQuery)
            .sort({ date: 1, createdAt: -1 })
            .limit(50);

        const items = docs.map((t) => {
            const pub = toPublicTournament(t);
            return {
                tournamentId: pub.tournamentId,
                title: pub.title,
                game: pub.game,
                status: pub.status,
                date: pub.date,
                time: pub.time,
                bannerImage: pub.bannerImage
            };
        });

        return res.status(200).json(items);
    } catch (error) {
        console.error('Error en búsqueda pública de torneos:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const getPublicTournamentByCode = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: 'Torneo no encontrado' });
        }

        const visibility = tournament?.publicSettings?.visibility || 'public';
        if (visibility === 'private') {
            return res.status(403).json({ message: 'Este torneo no es público' });
        }

        return res.status(200).json(toPublicTournament(tournament));
    } catch (error) {
        console.error('Error obteniendo torneo público:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const updateTournamentPublicSettings = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: 'Torneo no encontrado' });
        }

        const allowed = await canManageTournament(tournament, req.userId);
        if (!allowed) {
            return res.status(403).json({ message: 'No tienes permisos para editar este torneo' });
        }

        const body = req.body || {};
        const incoming = body.publicSettings || body;
        const visibility = ['public', 'unlisted', 'private'].includes(incoming.visibility)
            ? incoming.visibility
            : (tournament.publicSettings?.visibility || 'public');

        tournament.publicSettings = {
            visibility,
            showPrize: incoming.showPrize !== undefined ? incoming.showPrize === true : (tournament.publicSettings?.showPrize !== false),
            showSponsors: incoming.showSponsors !== undefined ? incoming.showSponsors === true : (tournament.publicSettings?.showSponsors !== false),
            showRules: incoming.showRules !== undefined ? incoming.showRules === true : (tournament.publicSettings?.showRules !== false),
            showSchedule: incoming.showSchedule !== undefined ? incoming.showSchedule === true : (tournament.publicSettings?.showSchedule !== false),
            showContact: incoming.showContact !== undefined ? incoming.showContact === true : (tournament.publicSettings?.showContact !== false),
            showTeams: incoming.showTeams !== undefined ? incoming.showTeams === true : (tournament.publicSettings?.showTeams === true),
            showBracket: incoming.showBracket !== undefined ? incoming.showBracket === true : (tournament.publicSettings?.showBracket !== false),
            customMessage: String(incoming.customMessage || '').trim()
        };

        await tournament.save();
        return res.status(200).json({ message: 'Configuración pública actualizada', publicSettings: tournament.publicSettings });
    } catch (error) {
        console.error('Error actualizando configuración pública:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

export const updateTournamentBracket = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: 'Torneo no encontrado' });
        }

        const allowed = await canManageTournament(tournament, req.userId);
        if (!allowed) {
            return res.status(403).json({ message: 'No tienes permisos para editar este torneo' });
        }

        const bracket = req.body?.bracket ?? req.body;
        if (!bracket || typeof bracket !== 'object') {
            return res.status(400).json({ message: 'Bracket inválido' });
        }

        tournament.bracket = bracket;
        await tournament.save();
        return res.status(200).json({ message: 'Bracket actualizado', bracket: tournament.bracket });
    } catch (error) {
        console.error('Error actualizando bracket:', error);
        return res.status(500).json({ message: 'Error interno del servidor', error: error.message });
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

        const requester = await User.findById(req.userId).select('isAdmin connections.riot connections.mlbb gameProfiles.lol');
        if (!requester) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const requesterIsAdmin = requester.isAdmin === true;
        const requiresRiot = tournament.riotRequirements?.required === true || RIOT_GAMES.has(tournament.game);
        const requiresMlbb = MLBB_GAMES.has(String(tournament.game || '').trim());
        // Requisitos Riot (si aplica)
        if (requiresRiot) {
            if (!requester?.connections?.riot?.verified) {
                return res.status(400).json({ message: 'Debes vincular tu cuenta Riot para inscribirte' });
            }
            const minTier = tournament.riotRequirements?.minTier;
            const maxTier = tournament.riotRequirements?.maxTier;
            if (minTier || maxTier) {
                const tierOrder = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
                const userTier = requester?.gameProfiles?.lol?.rank?.tier;
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
        if (requiresMlbb) {
            const status = String(
                requester?.connections?.mlbb?.verificationStatus
                || (requester?.connections?.mlbb?.verified ? 'verified' : 'unlinked')
            );
            if (status !== 'verified') {
                return res.status(400).json({ message: 'Debes verificar tu cuenta MLBB para inscribirte' });
            }
        }

        const alreadyRegistered = (tournament.registrations || []).some(r => String(r.captain) === String(req.userId));
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Ya registraste un equipo en este torneo' });
        }

        if (!teamId && requiresMlbb) {
            return res.status(400).json({
                message: 'Para torneos MLBB debes inscribir un equipo existente (no registro manual).'
            });
        }
        if (!teamId && isUniversityOnlyTournament(tournament)) {
            return res.status(400).json({
                message: 'Para torneos universitarios debes inscribir un equipo universitario existente.'
            });
        }

        let registrationPayload = null;
        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });
            if (String(team.captain) !== String(req.userId) && !requesterIsAdmin) {
                return res.status(403).json({ message: 'Solo el capitán o un admin puede inscribir al equipo' });
            }
            if (String(team.game) !== String(tournament.game)) {
                return res.status(400).json({ message: 'El juego del equipo no coincide con el torneo' });
            }
            if (isUniversityOnlyTournament(tournament)) {
                const universityTeamCheck = await validateUniversityTournamentTeam(team);
                if (!universityTeamCheck.ok) {
                    return res.status(400).json({ message: universityTeamCheck.message });
                }
            }
            const starters = Array.isArray(team.roster?.starters)
                ? team.roster.starters.filter(isFilledRosterEntry)
                : [];
            const expected = team.maxMembers || starters.length;
            const complete = expected > 0
                && starters.length >= expected
                && starters.slice(0, expected).every(p => p && p.nickname);
            if (!complete) {
                return res.status(400).json({ message: 'El equipo no está completo' });
            }

            // Validar roles según juego (solo titulares)
            const allowedRoles = ROLE_NAMES[tournament.game] || ROLE_NAMES[team.game] || [];
            if (allowedRoles.length > 0) {
                const invalidRole = starters.slice(0, expected).find(p => p?.role && !allowedRoles.includes(p.role));
                if (invalidRole) {
                    return res.status(400).json({ message: `Rol inválido para ${tournament.game}: ${invalidRole.role}` });
                }
                const missingRole = starters.slice(0, expected).find(p => !p?.role);
                if (missingRole) {
                    return res.status(400).json({ message: `Todos los titulares deben tener rol para ${tournament.game}` });
                }
            }

            const users = starters.concat(team.roster?.subs || []).filter(p => p?.user).map(p => p.user);
            const riotUsers = users.length
                ? await User.find({ _id: { $in: users } }).select('connections.riot')
                : [];
            const riotMap = new Map(
                riotUsers.map(u => [String(u._id), u.connections?.riot?.verified ? `${u.connections.riot.gameName}#${u.connections.riot.tagLine}` : ''])
            );
            const mlbbUsers = users.length
                ? await User.find({ _id: { $in: users } }).select('connections.mlbb')
                : [];
            const mlbbMap = new Map(
                mlbbUsers.map((u) => {
                    const status = String(
                        u?.connections?.mlbb?.verificationStatus
                        || (u?.connections?.mlbb?.verified ? 'verified' : 'unlinked')
                    );
                    return [
                        String(u._id),
                        {
                            status,
                            playerId: normalizeMlbbIdentity(u?.connections?.mlbb?.playerId),
                            zoneId: normalizeMlbbIdentity(u?.connections?.mlbb?.zoneId)
                        }
                    ];
                })
            );
            if (requiresRiot) {
                const missing = starters.slice(0, expected).find(p => {
                    if (p?.user) return !riotMap.get(String(p.user));
                    return !p?.gameId;
                });
                if (missing) {
                    return res.status(400).json({ message: 'Todos los titulares deben tener Riot vinculado' });
                }
            }
            if (requiresMlbb) {
                const mlbbRosterPlayers = starters
                    .slice(0, expected)
                    .concat(Array.isArray(team.roster?.subs) ? team.roster.subs.filter(isFilledRosterEntry) : []);
                if (MLBB_REQUIRE_LINKED_STARTERS) {
                    const missingLinkedStarter = starters.slice(0, expected).find((p) => !p?.user);
                    if (missingLinkedStarter) {
                        return res.status(400).json({
                            message: 'Modo estricto MLBB: todos los titulares deben estar vinculados a usuarios reales de Esportefy.'
                        });
                    }
                }
                if (MLBB_REQUIRE_LINKED_PLAYERS) {
                    const missingLinkedPlayer = mlbbRosterPlayers.find((p) => !p?.user);
                    if (missingLinkedPlayer) {
                        return res.status(400).json({
                            message: 'En torneos MLBB todos los jugadores del roster deben ser usuarios vinculados de Esportefy.'
                        });
                    }
                }
                const missing = mlbbRosterPlayers.find(p => {
                    if (p?.user) {
                        const linked = mlbbMap.get(String(p.user));
                        return !linked || linked.status !== 'verified';
                    }
                    return !p?.gameId || !p?.region;
                });
                if (missing) {
                    return res.status(400).json({ message: 'Todos los jugadores del roster MLBB deben tener cuenta verificada y User ID + Zone ID válidos.' });
                }
                const mismatch = mlbbRosterPlayers.find((p) => {
                    if (!p?.user) return false;
                    const linked = mlbbMap.get(String(p.user));
                    if (!linked || linked.status !== 'verified') return false;
                    return normalizeMlbbIdentity(p?.gameId) !== linked.playerId
                        || normalizeMlbbIdentity(p?.region) !== linked.zoneId;
                });
                if (mismatch) {
                    return res.status(400).json({ message: 'Hay jugadores del roster cuyo User ID + Zone ID no coincide con su cuenta MLBB vinculada.' });
                }
            }

            const rosterUsers = starters
                .concat(team.roster?.subs || [])
                .concat(team.roster?.coach ? [team.roster.coach] : [])
                .map((p) => p?.user)
                .filter(Boolean)
                .map((id) => String(id));

            registrationPayload = {
                teamId: team._id,
                teamName: team.name,
                logoUrl: team.logo || '',
                captain: team.captain,
                teamMeta: {
                    category: team.category || '',
                    teamCountry: team.teamCountry || '',
                    teamLevel: team.teamLevel || '',
                    coach: team.roster?.coach?.nickname || '',
                    university: {
                        isUniversityTeam: team?.university?.isUniversityTeam === true,
                        universityId: team?.university?.universityId || '',
                        universityTag: team?.university?.universityTag || '',
                        universityName: team?.university?.universityName || '',
                        region: team?.university?.region || '',
                        campus: team?.university?.campus || ''
                    }
                },
                roster: {
                    starters: starters.map(p => ({
                        user: p?.user || null,
                        nickname: p?.nickname || '',
                        gameId: p?.gameId || '',
                        region: p?.region || '',
                        role: p?.role || '',
                        riotId: p?.user ? (riotMap.get(String(p.user)) || '') : ''
                    })),
                    subs: Array.isArray(team.roster?.subs) ? team.roster.subs.filter(isFilledRosterEntry).map(p => ({
                        user: p?.user || null,
                        nickname: p?.nickname || '',
                        gameId: p?.gameId || '',
                        region: p?.region || '',
                        role: p?.role || '',
                        riotId: p?.user ? (riotMap.get(String(p.user)) || '') : ''
                    })) : []
                },
                status: 'approved'
            };

            // Notificar a todos los integrantes del equipo
            await pushNotificationMany(rosterUsers, {
                type: 'tournament',
                category: 'tournament',
                title: 'Equipo inscrito',
                source: tournament.title || 'Torneo',
                message: `Tu equipo ${team.name} fue inscrito en ${tournament.title}.`,
                status: 'unread',
                meta: { tournamentId: tournament.tournamentId, teamId: team._id, action: 'registered' },
                visuals: { icon: 'bx-trophy', color: '#facc15', glow: true }
            });
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

        if (requiresMlbb) {
            const rosterCheck = validateMlbbRegistrationRoster(registrationPayload);
            if (!rosterCheck.ok) {
                return res.status(400).json({ message: rosterCheck.message });
            }

            const candidateApproved = [
                ...getApprovedRegistrations(tournament),
                { ...registrationPayload, status: 'approved' }
            ];
            const duplicateCheck = findDuplicateMlbbIdentity(candidateApproved);
            if (duplicateCheck.found) {
                return res.status(400).json({ message: duplicateCheck.message });
            }
            const identityMap = await buildMlbbUserIdentityMap(candidateApproved);
            const bindingIssues = getMlbbIdentityBindingIssues(candidateApproved, identityMap);
            if (bindingIssues.length) {
                return res.status(400).json({ message: bindingIssues[0] });
            }
        }

        tournament.registrations = tournament.registrations || [];
        tournament.registrations.push(registrationPayload);

        tournament.currentSlots = Math.min((tournament.currentSlots || 0) + 1, tournament.maxSlots);
        await tournament.save();

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
        const isOwner = String(tournament.organizer) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para gestionar inscripciones' });
        }

        const reg = (tournament.registrations || []).id(registrationId);
        if (!reg) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }

        const isMlbbTournament = MLBB_GAMES.has(String(tournament.game || '').trim());
        const universityOnly = isUniversityOnlyTournament(tournament);
        if (status === 'approved' && universityOnly) {
            if (!reg?.teamId) {
                return res.status(400).json({ message: 'Los torneos universitarios solo aceptan equipos universitarios existentes.' });
            }
            const team = await Team.findById(reg.teamId);
            const universityTeamCheck = await validateUniversityTournamentTeam(team);
            if (!universityTeamCheck.ok) {
                return res.status(400).json({ message: universityTeamCheck.message });
            }
        }
        if (status === 'approved' && isMlbbTournament) {
            const rosterCheck = validateMlbbRegistrationRoster(reg);
            if (!rosterCheck.ok) {
                return res.status(400).json({ message: rosterCheck.message });
            }
            const otherApproved = (tournament.registrations || []).filter((r) =>
                String(r?._id) !== String(registrationId) && String(r?.status || 'approved') === 'approved'
            );
            const candidateApproved = [...otherApproved, { ...reg.toObject(), status: 'approved' }];
            const duplicateCheck = findDuplicateMlbbIdentity(candidateApproved);
            if (duplicateCheck.found) {
                return res.status(400).json({ message: duplicateCheck.message });
            }
            const identityMap = await buildMlbbUserIdentityMap(candidateApproved);
            const bindingIssues = getMlbbIdentityBindingIssues(candidateApproved, identityMap);
            if (bindingIssues.length) {
                return res.status(400).json({ message: bindingIssues[0] });
            }
        }

        const team = reg?.teamId ? await Team.findById(reg.teamId) : null;
        const rosterUsers = team
            ? (Array.isArray(team.roster?.starters) ? team.roster.starters : [])
                .concat(Array.isArray(team.roster?.subs) ? team.roster.subs : [])
                .concat(team.roster?.coach ? [team.roster.coach] : [])
                .map((p) => p?.user)
                .filter(Boolean)
                .map((id) => String(id))
            : [];

        if (status === 'rejected') {
            tournament.registrations = (tournament.registrations || []).filter(r => String(r._id) !== String(registrationId));
            tournament.currentSlots = Math.max((tournament.currentSlots || 0) - 1, 0);

            await pushNotificationMany(rosterUsers, {
                type: 'tournament',
                category: 'tournament',
                title: 'Inscripción rechazada',
                source: tournament.title || 'Torneo',
                message: `Tu equipo fue rechazado en ${tournament.title}.`,
                status: 'unread',
                meta: { tournamentId: tournament.tournamentId, teamId: reg?.teamId, action: 'rejected' },
                visuals: { icon: 'bx-x-circle', color: '#ff6b6b', glow: false }
            });
        } else {
            reg.status = status;
            await pushNotificationMany(rosterUsers, {
                type: 'tournament',
                category: 'tournament',
                title: 'Inscripción aprobada',
                source: tournament.title || 'Torneo',
                message: `Tu equipo fue aprobado en ${tournament.title}.`,
                status: 'unread',
                meta: { tournamentId: tournament.tournamentId, teamId: reg?.teamId, action: 'approved' },
                visuals: { icon: 'bx-check-circle', color: '#34d399', glow: true }
            });
        }
        await tournament.save();

        await recordAdminAudit({
            actorUserId: req.userId,
            action: status === 'approved' ? 'tournament.registration.approve' : 'tournament.registration.reject',
            entityType: 'tournament_registration',
            entityId: String(registrationId),
            meta: {
                tournamentId: tournament.tournamentId,
                teamId: reg?.teamId ? String(reg.teamId) : '',
                registrationStatus: status,
                game: tournament.game
            },
            req
        });

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
        const isOwner = String(tournament.organizer) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para eliminar equipos' });
        }

        const before = (tournament.registrations || []).length;
        const reg = (tournament.registrations || []).id(registrationId);
        tournament.registrations = (tournament.registrations || []).filter(r => String(r._id) !== String(registrationId));
        if (tournament.registrations.length === before) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        const team = reg?.teamId ? await Team.findById(reg.teamId) : null;
        const rosterUsers = team
            ? (Array.isArray(team.roster?.starters) ? team.roster.starters : [])
                .concat(Array.isArray(team.roster?.subs) ? team.roster.subs : [])
                .concat(team.roster?.coach ? [team.roster.coach] : [])
                .map((p) => p?.user)
                .filter(Boolean)
                .map((id) => String(id))
            : [];
        await pushNotificationMany(rosterUsers, {
            type: 'tournament',
            category: 'tournament',
            title: 'Equipo removido',
            source: tournament.title || 'Torneo',
            message: `Tu equipo fue removido de ${tournament.title}.`,
            status: 'unread',
            meta: { tournamentId: tournament.tournamentId, teamId: reg?.teamId, action: 'removed' },
            visuals: { icon: 'bx-error-circle', color: '#f97316', glow: false }
        });
        tournament.currentSlots = Math.max((tournament.currentSlots || 0) - 1, 0);
        await tournament.save();

        await recordAdminAudit({
            actorUserId: req.userId,
            action: 'tournament.registration.remove',
            entityType: 'tournament_registration',
            entityId: String(registrationId),
            meta: {
                tournamentId: tournament.tournamentId,
                teamId: reg?.teamId ? String(reg.teamId) : '',
                game: tournament.game
            },
            req
        });

        return res.status(200).json({ message: 'Equipo removido' });
    } catch (error) {
        console.error("Error al eliminar inscripción:", error);
        return res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};

export const getTournamentCompliance = async (req, res) => {
    try {
        const { code } = req.params;
        const tournament = await Tournament.findOne({ tournamentId: code.toUpperCase() });
        if (!tournament) {
            return res.status(404).json({ message: "No se encontró ningún torneo con ese código" });
        }

        const allowed = await canManageTournament(tournament, req.userId);
        if (!allowed) {
            return res.status(403).json({ message: 'No tienes permisos para ver cumplimiento de este torneo' });
        }

        const game = String(tournament.game || '').trim();
        const isMlbbTournament = MLBB_GAMES.has(game);
        const checks = [];

        if (isMlbbTournament) {
            const policyIssues = getMlbbComplianceIssues({
                title: tournament.title,
                description: tournament.description,
                prizeDetails: tournament.prizeDetails,
                entryFee: tournament.entryFee,
                format: tournament.format,
                contact: tournament.contact,
                legalCompliance: tournament.legalCompliance
            });
            checks.push({
                id: 'policy',
                label: 'Reglas legales y de publicación MLBB',
                ok: policyIssues.length === 0,
                detail: policyIssues.length ? policyIssues.join(' | ') : 'Sin observaciones'
            });

            const approved = getApprovedRegistrations(tournament);
            checks.push({
                id: 'approvedTeams',
                label: `Equipos aprobados (mínimo ${MLBB_MIN_APPROVED_TEAMS})`,
                ok: approved.length >= MLBB_MIN_APPROVED_TEAMS,
                detail: `${approved.length} aprobados`
            });

            const rosterIssues = approved
                .map((reg) => validateMlbbRegistrationRoster(reg))
                .filter((r) => !r.ok)
                .map((r) => r.message);
            checks.push({
                id: 'mlbbRoster',
                label: 'Titulares con User ID + Zone ID válidos',
                ok: rosterIssues.length === 0,
                detail: rosterIssues.length ? rosterIssues.join(' | ') : 'Todos los titulares válidos'
            });

            const duplicateCheck = findDuplicateMlbbIdentity(approved);
            checks.push({
                id: 'duplicates',
                label: 'Sin duplicados de User ID + Zone ID',
                ok: !duplicateCheck.found,
                detail: duplicateCheck.found ? duplicateCheck.message : 'No hay duplicados'
            });

            const identityMap = await buildMlbbUserIdentityMap(approved);
            const bindingIssues = getMlbbIdentityBindingIssues(approved, identityMap);
            checks.push({
                id: 'identityBinding',
                label: MLBB_REQUIRE_LINKED_PLAYERS
                    ? 'Jugadores del roster vinculados + User ID/Zone coinciden con cuenta MLBB'
                    : MLBB_REQUIRE_LINKED_STARTERS
                        ? 'Titulares vinculados + User ID/Zone coinciden con cuenta MLBB'
                        : 'User ID + Zone ID coincide con cuenta vinculada',
                ok: bindingIssues.length === 0,
                detail: bindingIssues.length ? bindingIssues.join(' | ') : 'Sin inconsistencias de identidad'
            });
        } else {
            checks.push({
                id: 'scope',
                label: 'Cumplimiento MLBB',
                ok: true,
                detail: 'Este torneo no es de Mobile Legends'
            });
        }

        if (isUniversityOnlyTournament(tournament)) {
            const approved = getApprovedRegistrations(tournament);
            const universityIssues = [];
            for (const reg of approved) {
                if (!reg?.teamId) {
                    universityIssues.push(`"${reg?.teamName || 'Equipo'}" no está ligado a un equipo universitario real.`);
                    continue;
                }
                const team = await Team.findById(reg.teamId).select('university roster');
                const result = await validateUniversityTournamentTeam(team);
                if (!result.ok) {
                    universityIssues.push(`"${reg?.teamName || 'Equipo'}": ${result.message}`);
                }
            }
            checks.push({
                id: 'universityEligibility',
                label: 'Elegibilidad universitaria',
                ok: universityIssues.length === 0,
                detail: universityIssues.length ? universityIssues.join(' | ') : 'Todos los equipos aprobados cumplen con universidad verificada'
            });
        } else {
            checks.push({
                id: 'universityScope',
                label: 'Elegibilidad universitaria',
                ok: true,
                detail: 'Este torneo no está restringido a equipos universitarios'
            });
        }

        return res.status(200).json({
            tournamentId: tournament.tournamentId,
            game,
            isMlbbTournament,
            mode: {
                mlbbBetaMode: MLBB_BETA_MODE,
                minApprovedTeams: MLBB_MIN_APPROVED_TEAMS,
                requireLinkedStarters: MLBB_REQUIRE_LINKED_STARTERS,
                requireLinkedPlayers: MLBB_REQUIRE_LINKED_PLAYERS
            },
            checks
        });
    } catch (error) {
        console.error("Error obteniendo cumplimiento de torneo:", error);
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
        const isOwner = String(tournament.organizer) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'No tienes permisos para cambiar el estado' });
        }

        switch (action) {
            case 'open':
                tournament.status = 'open';
                tournament.registrationClosed = false;
                break;
            case 'close':
                tournament.registrationClosed = true;
                break;
            case 'cancel':
                tournament.status = 'cancelled';
                tournament.registrationClosed = true;
                break;
            case 'start':
                if (MLBB_GAMES.has(String(tournament.game || '').trim())) {
                    const approved = getApprovedRegistrations(tournament);
                    if (approved.length < MLBB_MIN_APPROVED_TEAMS) {
                        return res.status(400).json({
                            message: `Para iniciar un torneo MLBB necesitas al menos ${MLBB_MIN_APPROVED_TEAMS} equipos aprobados.`,
                            minApprovedTeams: MLBB_MIN_APPROVED_TEAMS
                        });
                    }
                    for (const registration of approved) {
                        const rosterCheck = validateMlbbRegistrationRoster(registration);
                        if (!rosterCheck.ok) {
                            return res.status(400).json({ message: rosterCheck.message });
                        }
                    }
                    const duplicateCheck = findDuplicateMlbbIdentity(approved);
                    if (duplicateCheck.found) {
                        return res.status(400).json({ message: duplicateCheck.message });
                    }
                    const identityMap = await buildMlbbUserIdentityMap(approved);
                    const bindingIssues = getMlbbIdentityBindingIssues(approved, identityMap);
                    if (bindingIssues.length) {
                        return res.status(400).json({ message: bindingIssues[0] });
                    }
                }
                tournament.status = 'ongoing';
                tournament.registrationClosed = true;
                break;
            case 'finish':
                tournament.status = 'finished';
                break;
            default:
                return res.status(400).json({ message: 'Acción inválida' });
        }

        await tournament.save();

        await recordAdminAudit({
            actorUserId: req.userId,
            action: `tournament.status.${String(action || '').toLowerCase()}`,
            entityType: 'tournament',
            entityId: String(tournament._id),
            meta: {
                tournamentId: tournament.tournamentId,
                game: tournament.game,
                status: tournament.status,
                registrationClosed: Boolean(tournament.registrationClosed)
            },
            req
        });

        const registeredCaptains = (tournament.registrations || [])
            .map((r) => r.captain)
            .filter(Boolean)
            .map((id) => String(id));

        if (action === 'open') {
            const interestedIds = await getInterestedUsers(tournament.game, [req.userId]);
            const targets = Array.from(new Set([...interestedIds, ...registeredCaptains]));
            await pushNotificationMany(targets, {
                type: 'tournament',
                category: 'tournament',
                title: 'Inscripciones abiertas',
                source: tournament.title || 'Torneo',
                message: `Las inscripciones para ${tournament.title} están abiertas.`,
                status: 'unread',
                meta: { tournamentId: tournament.tournamentId, action: 'open' },
                visuals: { icon: 'bx-door-open', color: '#8EDB15', glow: true }
            });
        }

        if (action === 'close' || action === 'cancel' || action === 'start' || action === 'finish') {
            const titleMap = {
                close: 'Inscripciones cerradas',
                cancel: 'Torneo cancelado',
                start: 'Torneo en curso',
                finish: 'Torneo finalizado'
            };
            const messageMap = {
                close: `Las inscripciones para ${tournament.title} se han cerrado.`,
                cancel: `El torneo ${tournament.title} fue cancelado.`,
                start: `El torneo ${tournament.title} ha iniciado.`,
                finish: `El torneo ${tournament.title} ha finalizado.`
            };
            await pushNotificationMany(registeredCaptains, {
                type: 'tournament',
                category: 'tournament',
                title: titleMap[action] || 'Actualización de torneo',
                source: tournament.title || 'Torneo',
                message: messageMap[action] || `Actualización en ${tournament.title}`,
                status: 'unread',
                meta: { tournamentId: tournament.tournamentId, action },
                visuals: { icon: action === 'close' ? 'bx-lock-alt' : action === 'cancel' ? 'bx-x-circle' : action === 'start' ? 'bx-play' : 'bx-flag', color: '#f97316', glow: false }
            });
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
