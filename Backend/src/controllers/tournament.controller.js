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
        const sponsorsWithLogos = Array.isArray(sponsors)
            ? sponsors.map((s, idx) => {
                const fileIndex = Number.isInteger(s?.logoIndex) ? s.logoIndex : idx;
                return {
                    ...s,
                    logoUrl: sponsorLogoFiles[fileIndex]?.path || s.logoUrl || ''
                };
            })
            : [];

        const newTournament = new Tournament({
            ...data,
            tournamentId,
            prizesByRank: parseField(data.prizesByRank),
            sponsors: sponsorsWithLogos,
            staff: parseField(data.staff),
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
            data?.prizesByRank?.first,
            data?.prizesByRank?.second,
            data?.prizesByRank?.third
        ];
        const hasNegative = prizeValues.some(v => Number(v) < 0);
        if (hasNegative) {
            return res.status(400).json({ message: 'Los premios no pueden ser negativos' });
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
            prizesByRank: parseField(data.prizesByRank),
            staff: parseField(data.staff)
        };

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

        const alreadyRegistered = (tournament.registrations || []).some(r => String(r.captain) === String(req.userId));
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Ya registraste un equipo en este torneo' });
        }

        let registrationPayload = null;
        if (teamId) {
            const team = await Team.findById(teamId);
            if (!team) return res.status(404).json({ message: 'Equipo no encontrado' });
            if (String(team.captain) !== String(req.userId)) {
                return res.status(403).json({ message: 'Solo el capitán puede inscribir al equipo' });
            }
            if (String(team.game) !== String(tournament.game)) {
                return res.status(400).json({ message: 'El juego del equipo no coincide con el torneo' });
            }
            const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
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
            if (requiresRiot) {
                const missing = starters.slice(0, expected).find(p => {
                    if (p?.user) return !riotMap.get(String(p.user));
                    return !p?.gameId;
                });
                if (missing) {
                    return res.status(400).json({ message: 'Todos los titulares deben tener Riot vinculado' });
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
                    starters: starters.map(p => ({
                        nickname: p?.nickname || '',
                        gameId: p?.gameId || '',
                        region: p?.region || '',
                        role: p?.role || '',
                        riotId: p?.user ? (riotMap.get(String(p.user)) || '') : ''
                    })),
                    subs: Array.isArray(team.roster?.subs) ? team.roster.subs.map(p => ({
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
