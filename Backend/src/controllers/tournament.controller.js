import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Team from '../models/Team.js';

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
                notes: parsedEligibility.notes || ''
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
            prizesByRank: parsedPrizesByRank,
            staff: parsedStaff
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
                notes: parsedEligibility.notes || ''
            };
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
        const baseQuery = {
            status: { $ne: 'draft' },
            'publicSettings.visibility': { $in: ['public', null] }
        };

        if (q) {
            baseQuery.$or = [
                { tournamentId: { $regex: q, $options: 'i' } },
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
            if (String(team.game) !== String(tournament.game)) {
                return res.status(400).json({ message: 'El juego del equipo no coincide con el torneo' });
            }
            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
            const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
            const coach = team?.roster?.coach && typeof team.roster.coach === 'object' ? [team.roster.coach] : [];
            const expected = team.maxMembers || starters.length;
            const complete = expected > 0
                && starters.length >= expected
                && starters.slice(0, expected).every(p => p && p.nickname);
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
                const missing = starters.slice(0, expected).find(p => {
                    if (p?.user) return !riotMap.get(String(p.user));
                    return !p?.gameId;
                });
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
