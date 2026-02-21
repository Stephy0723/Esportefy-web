// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import User from "../models/User.js";
import axios from 'axios';
import crypto from "crypto";
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/teams/';

        // 1. PRIMERO: Verificar y crear la carpeta
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("Carpeta de equipos creada con éxito.");
            }
        } catch (err) {
            console.error("Error al crear la carpeta:", err);
        }

        // 2. SEGUNDO: Pasar el control a Multer
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        // Nombre único: ID-Timestamp.ext
        const ext = path.extname(file.originalname).toLowerCase();
        // Usamos req.userId (que viene del middleware verifyToken)
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const upload = multer({ 
    storage,
    limits: { fileSize: 8 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const validMime = ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype);
        const validExt = ALLOWED_IMAGE_EXTENSIONS.has(ext);
        if (!validMime || !validExt) {
            return cb(new Error('Archivo inválido. Solo se permiten imágenes JPG, PNG o WEBP.'));
        }
        return cb(null, true);
    }
});

export const getTeamByInviteCode = async (req, res) => {
    try {
        const { code } = req.params;
        if (!code) return res.status(400).json({ message: "Código requerido" });
        const team = await Team.findOne({ inviteCode: String(code).toUpperCase() });
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        return res.status(200).json(team);
    } catch (error) {
        return res.status(500).json({ message: "Error al buscar equipo", error: error.message });
    }
};

export const createTeam = async (req, res) => {
    try {
        // Multer pone los textos en req.body y el archivo en req.file
        let { formData, roster } = req.body;

        // IMPORTANTE: Parsear si vienen como string
        const parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;
        const parsedRoster = typeof roster === 'string' ? JSON.parse(roster) : roster;

        const logoPath = req.file 
            ? `${req.protocol}://${req.get('host')}/uploads/teams/${req.file.filename}`
            : '/uploads/teams/default.png';

        const rosterData = parsedRoster || { starters: [], subs: [], coach: null };
        // Asegura que el capitán quede en el roster
        const captainPlayer = {
            user: req.userId,
            nickname: parsedFormData?.leaderIgn || parsedFormData?.name || 'Captain',
            gameId: parsedFormData?.leaderGameId || '',
            region: parsedFormData?.leaderRegion || '',
            email: '',
            role: parsedFormData?.leaderRole || ''
        };
        if (Array.isArray(rosterData.starters) && !rosterData.starters[0]) {
            rosterData.starters[0] = captainPlayer;
        }

        if (RIOT_GAMES.has(parsedFormData.game)) {
            if (process.env.RIOT_API_KEY) {
                const riotCheck = await validateRiotAccount(parsedFormData.leaderIgn, parsedFormData.leaderGameId);
                if (!riotCheck.ok) {
                    console.warn('[createTeam] Riot validation failed:', riotCheck.message);
                    return res.status(400).json({ message: riotCheck.message });
                }
                const riotUnique = await ensureRiotIdNotInOtherTeam(parsedFormData.game, parsedFormData.leaderIgn, parsedFormData.leaderGameId, null);
                if (!riotUnique.ok) {
                    console.warn('[createTeam] Riot ID already in team:', riotUnique.message);
                    return res.status(400).json({ message: riotUnique.message });
                }
            } else {
                console.warn('[createTeam] RIOT_API_KEY no configurada — Riot validation omitida (dev mode)');
            }
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(parsedFormData.game, req.userId, null);
        if (!uniqueCheck.ok) {
            console.warn('[createTeam] User already in team for this game:', uniqueCheck.message);
            return res.status(400).json({ message: uniqueCheck.message });
        }

        const newTeam = new Team({
            ...parsedFormData,
            logo: logoPath,
            roster: rosterData,
            captain: req.userId,
            inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase()
        });

        const savedTeam = await newTeam.save();
        
        // Actualizar al usuario para que vea su nuevo equipo
        await User.findByIdAndUpdate(req.userId, { $push: { teams: savedTeam._id } });

        res.status(201).json({
            message: "Equipo creado",
            inviteLink: `http://localhost:3000/teams?invite=${savedTeam.inviteCode}`
        });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

const userInRoster = (team, userId) => {
    const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
    const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
    const coach = team.roster?.coach;
    const all = [...starters, ...subs, coach].filter(Boolean);
    return all.some(p => String(p?.user) === String(userId));
};

const isSlotFilled = (p) => {
    if (!p) return false;
    return Boolean(p.user || p.nickname || p.email || p.gameId);
};

const applyRosterSlot = (team, slotType, slotIndex, player) => {
    if (!team.roster) team.roster = { starters: [], subs: [], coach: null };
    if (slotType === 'coach') {
        if (isSlotFilled(team.roster.coach)) return { ok: false, message: 'El slot de coach ya está ocupado' };
        team.roster.coach = { ...(team.roster.coach || {}), ...player };
        return { ok: true };
    }
    if (!['starters', 'subs'].includes(slotType)) {
        return { ok: false, message: 'Slot inválido' };
    }
    const list = Array.isArray(team.roster[slotType]) ? team.roster[slotType] : [];
    const idx = Number(slotIndex);
    if (Number.isNaN(idx) || idx < 0) return { ok: false, message: 'Índice inválido' };
    if (isSlotFilled(list[idx])) return { ok: false, message: 'Ese slot ya está ocupado' };
    list[idx] = { ...(list[idx] || {}), ...player };
    team.roster[slotType] = list;
    return { ok: true };
};

const ensureUserNotInOtherTeam = async (game, userId, currentTeamId) => {
    if (!userId) return { ok: true };
    const query = {
        game,
        _id: { $ne: currentTeamId },
        $or: [
            { captain: userId },
            { 'roster.starters.user': userId },
            { 'roster.subs.user': userId },
            { 'roster.coach.user': userId }
        ]
    };
    const exists = await Team.findOne(query).select('_id name');
    if (exists) {
        return { ok: false, message: `Ya perteneces a otro equipo (${exists.name}) de este juego` };
    }
    return { ok: true };
};

const ensureRiotIdNotInOtherTeam = async (game, nickname, gameId, currentTeamId) => {
    const gn = String(nickname || '').trim();
    const tl = String(gameId || '').trim();
    if (!gn || !tl) return { ok: true };
    const nickRegex = new RegExp(`^${gn.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i');
    const tagRegex = new RegExp(`^${tl.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}$`, 'i');
    const query = {
        game,
        _id: { $ne: currentTeamId },
        $or: [
            { 'roster.starters': { $elemMatch: { nickname: nickRegex, gameId: tagRegex } } },
            { 'roster.subs': { $elemMatch: { nickname: nickRegex, gameId: tagRegex } } },
            { 'roster.coach.nickname': nickRegex, 'roster.coach.gameId': tagRegex }
        ]
    };
    const exists = await Team.findOne(query).select('_id');
    if (exists) {
        return { ok: false, message: 'Este Riot ID ya pertenece a otro equipo de este juego' };
    }
    return { ok: true };
};

const findFirstEmptySlot = (team, slotType) => {
    const list = Array.isArray(team.roster?.[slotType]) ? team.roster[slotType] : [];
    const max = slotType === 'starters' ? Number(team.maxMembers) : Number(team.maxSubstitutes);
    if (Number.isFinite(max) && max > 0) {
        for (let i = 0; i < max; i += 1) {
            if (!isSlotFilled(list[i])) return i;
        }
        return -1;
    }
    for (let i = 0; i < list.length; i += 1) {
        if (!isSlotFilled(list[i])) return i;
    }
    return list.length;
};

const pushNotification = async (userId, payload) => {
    await User.findByIdAndUpdate(userId, { $push: { notifications: payload } });
};

const RIOT_GAMES = new Set([
    'Valorant',
    'League of Legends',
    'Wild Rift',
    'Teamfight Tactics',
    'Legends of Runeterra'
]);

const requireRiotLinked = async (userId) => {
    const user = await User.findById(userId).select('connections.riot');
    return Boolean(user?.connections?.riot?.verified);
};

const canJoinByGender = async (team, userId) => {
    if (!team?.teamGender || team.teamGender === 'Mixto') return { ok: true };
    const user = await User.findById(userId).select('gender');
    if (!user?.gender) return { ok: false, message: 'Género no registrado' };
    if (user.gender !== team.teamGender) {
        return { ok: false, message: `Equipo ${team.teamGender}: tu género no cumple` };
    }
    return { ok: true };
};
const validateRiotAccount = async (gameName, tagLine) => {
    if (!process.env.RIOT_API_KEY) {
        throw new Error('RIOT_API_KEY no configurada');
    }
    const gn = String(gameName || '').trim();
    const tl = String(tagLine || '').trim();
    if (!gn || !tl) {
        return { ok: false, message: 'Riot ID inválido' };
    }
    try {
        await axios.get(
            `https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gn)}/${encodeURIComponent(tl)}`,
            { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
        );
        return { ok: true };
    } catch (e) {
        return { ok: false, message: 'Riot ID no válido' };
    }
};

export const joinTeam = async (req, res) => {
    try {
        const { teamId, inviteCode, slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);

        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (RIOT_GAMES.has(team.game)) {
            const ok = await requireRiotLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes vincular tu cuenta Riot para unirte a este equipo" });
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, player?.nickname, player?.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (!inviteCode || inviteCode !== team.inviteCode) {
            return res.status(401).json({ message: "Código incorrecto" });
        }
        if (userInRoster(team, req.userId)) {
            return res.status(400).json({ message: "Ya estás en este equipo" });
        }
        if (!player?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }
        const playerPayload = { ...player, user: req.userId };
        const applied = applyRosterSlot(team, slotType, slotIndex, playerPayload);
        if (!applied.ok) return res.status(400).json({ message: applied.message });

        await team.save();
        await User.updateOne({ _id: req.userId }, { $addToSet: { teams: team._id } });
        await pushNotification(team.captain, {
            type: 'team',
            category: 'team',
            title: 'Nuevo miembro',
            source: team.name,
            message: `${playerPayload.nickname} se unió a tu equipo.`,
            status: 'unread',
            visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
        });
        res.status(200).json({ message: "Te has unido al equipo", team });
    } catch (error) {
        res.status(500).json({ message: "Error al unirse al equipo" });
    }
};

export const addMemberDirect = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "No tienes permisos para gestionar este equipo" });
        }

        if (!player?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }

        if (slotType === 'starters' && Number.isFinite(team.maxMembers) && Number(slotIndex) >= Number(team.maxMembers)) {
            return res.status(400).json({ message: "Slot fuera del límite de titulares" });
        }
        if (slotType === 'subs' && Number.isFinite(team.maxSubstitutes) && Number(slotIndex) >= Number(team.maxSubstitutes)) {
            return res.status(400).json({ message: "Slot fuera del límite de suplentes" });
        }

        if (RIOT_GAMES.has(team.game)) {
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, player?.nickname, player?.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }

        const applied = applyRosterSlot(team, slotType, slotIndex, { ...player, user: null });
        if (!applied.ok) return res.status(400).json({ message: applied.message });

        await team.save();
        return res.status(200).json({ message: "Jugador agregado", team });
    } catch (error) {
        return res.status(500).json({ message: "Error al agregar jugador", error: error.message });
    }
};

export const removeMemberFromRoster = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, userId } = req.body || {};
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "No tienes permisos para gestionar este equipo" });
        }

        const captainId = String(team.captain);
        if (userId && String(userId) === captainId) {
            return res.status(400).json({ message: "No puedes expulsar al capitán" });
        }

        if (slotType === 'coach') {
            if (team.roster?.coach && String(team.roster.coach.user) === captainId) {
                return res.status(400).json({ message: "No puedes expulsar al capitán" });
            }
            team.roster.coach = null;
        } else if (slotType === 'starters' || slotType === 'subs') {
            const list = Array.isArray(team.roster?.[slotType]) ? team.roster[slotType] : [];
            const idx = Number(slotIndex);
            if (Number.isNaN(idx) || idx < 0) return res.status(400).json({ message: "Índice inválido" });
            const current = list[idx];
            if (current && current.user && String(current.user) === captainId) {
                return res.status(400).json({ message: "No puedes expulsar al capitán" });
            }
            list[idx] = null;
            team.roster[slotType] = list;
        } else {
            return res.status(400).json({ message: "Slot inválido" });
        }

        await team.save();

        if (userId) {
            await User.updateOne({ _id: userId }, { $pull: { teams: teamId } });
            await pushNotification(userId, {
                type: 'team',
                category: 'team',
                title: 'Fuiste removido del equipo',
                source: team.name,
                message: `Has sido removido del equipo ${team.name}.`,
                status: 'unread',
                visuals: { icon: 'bx-error-circle', color: '#ff6b6b', glow: false }
            });
        }

        return res.status(200).json({ message: "Jugador removido", team });
    } catch (error) {
        return res.status(500).json({ message: "Error al remover jugador", error: error.message });
    }
};

export const requestJoinTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, player, inviteCode } = req.body;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        // Invite code verification
        if (!inviteCode || inviteCode !== team.inviteCode) {
            return res.status(401).json({ message: "Código de invitación incorrecto" });
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (RIOT_GAMES.has(team.game)) {
            const ok = await requireRiotLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes vincular tu cuenta Riot para solicitar ingreso" });
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, player?.nickname, player?.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (userInRoster(team, req.userId)) {
            return res.status(400).json({ message: "Ya estás en este equipo" });
        }

        // Check for existing pending request
        team.joinRequests = team.joinRequests || [];
        const alreadyPending = team.joinRequests.some(
            r => String(r.user) === String(req.userId) && r.status === 'pending'
        );
        if (alreadyPending) {
            return res.status(400).json({ message: "Ya tienes una solicitud pendiente en este equipo" });
        }

        if (!player?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }
        team.joinRequests.push({
            user: req.userId,
            slotType,
            slotIndex: Number(slotIndex) || 0,
            player: { ...player, user: req.userId },
            status: 'pending'
        });
        await team.save();

        // Build detailed message for captain
        const rolePart = player?.role ? ` | Rol: ${player.role}` : '';
        const regionPart = player?.region ? ` | Región: ${player.region}` : '';
        await pushNotification(team.captain, {
            type: 'team',
            category: 'team',
            title: 'Nueva solicitud de ingreso',
            source: team.name,
            message: `${player?.nickname || 'Un jugador'} quiere unirse a tu equipo.${rolePart}${regionPart}`,
            status: 'unread',
            meta: {
                teamId: team._id,
                requestId: team.joinRequests[team.joinRequests.length - 1]?._id,
                applicant: {
                    nickname: player?.nickname,
                    role: player?.role,
                    region: player?.region,
                    gameId: player?.gameId,
                    email: player?.email,
                    photo: player?.photo || ''
                }
            },
            visuals: { icon: 'bx-user-plus', color: '#4facfe', glow: true }
        });
        res.status(200).json({ message: "Solicitud enviada" });
    } catch (error) {
        console.error("Error en requestJoinTeam:", error);
        res.status(500).json({ message: "Error al solicitar ingreso" });
    }
};

export const handleJoinRequest = async (req, res) => {
    try {
        const { teamId, requestId } = req.params;
        const { action } = req.body || {};
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "Solo el capitán o un admin puede gestionar solicitudes" });
        }
        if (!Array.isArray(team.joinRequests)) team.joinRequests = [];
        const reqDoc = team.joinRequests.id(requestId);
        if (!reqDoc) return res.status(404).json({ message: "Solicitud no encontrada" });

        if (action === 'approve') {
            const uniqueCheck = await ensureUserNotInOtherTeam(team.game, reqDoc.user, team._id);
            if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
            if (RIOT_GAMES.has(team.game)) {
                const ok = await requireRiotLinked(reqDoc.user);
                if (!ok) return res.status(400).json({ message: "El jugador debe vincular su cuenta Riot" });
                const riotCheck = await validateRiotAccount(reqDoc.player?.nickname, reqDoc.player?.gameId);
                if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
                const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, reqDoc.player?.nickname, reqDoc.player?.gameId, team._id);
                if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
            }
            const genderCheck = await canJoinByGender(team, reqDoc.user);
            if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
            if (userInRoster(team, reqDoc.user)) {
                team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
                await team.save();
                return res.status(400).json({ message: "El jugador ya está en el equipo" });
            }
            let applied = applyRosterSlot(team, reqDoc.slotType, reqDoc.slotIndex, reqDoc.player || {});
            if (!applied.ok) {
                // Si el slot solicitado está ocupado, intenta el primero disponible
                if (applied.message === 'Ese slot ya está ocupado' && ['starters', 'subs'].includes(reqDoc.slotType)) {
                    const firstEmpty = findFirstEmptySlot(team, reqDoc.slotType);
                    if (firstEmpty === -1) {
                        return res.status(400).json({ message: 'No hay slots disponibles' });
                    }
                    applied = applyRosterSlot(team, reqDoc.slotType, firstEmpty, reqDoc.player || {});
                }
                if (!applied.ok) return res.status(400).json({ message: applied.message });
            }
            await User.updateOne({ _id: reqDoc.user }, { $addToSet: { teams: team._id } });
            team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
        await pushNotification(reqDoc.user, {
            type: 'team',
            category: 'team',
            title: 'Solicitud aprobada',
            source: team.name,
            message: `Tu solicitud para unirte a ${team.name} fue aprobada.`,
            status: 'unread',
            meta: { teamId: team._id, requestId: reqDoc._id, action: 'approve' },
            visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
        });
        } else if (action === 'reject') {
            // En rechazo solo eliminamos la solicitud
            team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
            await pushNotification(reqDoc.user, {
                type: 'team',
                category: 'team',
                title: 'Solicitud rechazada',
                source: team.name,
                message: `Tu solicitud para unirte a ${team.name} fue rechazada.`,
                status: 'unread',
                meta: { teamId: team._id, requestId: reqDoc._id, action: 'reject' },
                visuals: { icon: 'bx-error-circle', color: '#ff6b6b', glow: false }
            });
        } else {
            return res.status(400).json({ message: "Acción inválida" });
        }

        await team.save();
        res.status(200).json({ message: "Solicitud actualizada", team });
    } catch (error) {
        console.error("Error al gestionar solicitud:", error);
        res.status(500).json({ message: "Error al gestionar solicitud", error: error.message });
    }
};

export const getTeams = async (req, res) => {
    try {
        // 1. Buscamos todos los equipos
        // 2. Traemos la info del capitán (nombre y foto si tiene)
        const teams = await Team.find()
            .populate('captain', 'fullName avatar') 
            .sort({ createdAt: -1 }); // Los más nuevos primero

        /* NOTA: Si en tu modelo los miembros están dentro de 'roster.starters', 
           el populate se vería así:
           .populate('roster.starters')
        */
            
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ 
            message: "Error al obtener los equipos", 
            error: error.message 
        });
    }
};

export const leaveTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.userId; // Obtenido del token

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({ message: "Equipo no encontrado" });
        }

        // Verificar si el usuario es el capitán
        if (team.captain.toString() === userId) {
            return res.status(400).json({ 
                message: "Como capitán no puedes abandonar. Debes eliminar el equipo o transferir el mando." 
            });
        }

        const removeUserFromList = (list) => list.map(p => (String(p?.user) === String(userId) ? null : p)).filter(Boolean);
        if (Array.isArray(team.roster?.starters)) team.roster.starters = removeUserFromList(team.roster.starters);
        if (Array.isArray(team.roster?.subs)) team.roster.subs = removeUserFromList(team.roster.subs);
        if (team.roster?.coach && String(team.roster.coach.user) === String(userId)) team.roster.coach = null;

        await team.save();
        await User.updateOne({ _id: userId }, { $pull: { teams: teamId } });
        res.status(200).json({ message: "Has abandonado el equipo correctamente", team });
    } catch (error) {
        res.status(500).json({ message: "Error al abandonar el equipo", error: error.message });
    }
};

export const updateTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const data = req.body || {};
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "No tienes permisos para editar este equipo" });
        }

        const allowed = [
            'name','slogan','category','game','teamGender','teamCountry','teamLevel','teamLanguage'
        ];
        allowed.forEach((key) => {
            if (data[key] !== undefined) team[key] = data[key];
        });

        await team.save();
        res.status(200).json({ message: "Equipo actualizado", team });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar equipo", error: error.message });
    }
};

export const updateTeamLogo = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "No tienes permisos para editar este equipo" });
        }

        if (!req.file) return res.status(400).json({ message: "Logo requerido" });
        const logoPath = `${req.protocol}://${req.get('host')}/uploads/teams/${req.file.filename}`;
        team.logo = logoPath;
        await team.save();
        res.status(200).json({ message: "Logo actualizado", team });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar logo", error: error.message });
    }
};

export const deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });

        const user = await User.findById(req.userId).select('isAdmin');
        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = user?.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: "No tienes permisos para eliminar este equipo" });
        }

        await Team.deleteOne({ _id: teamId });
        await User.updateMany({ teams: teamId }, { $pull: { teams: teamId } });

        res.status(200).json({ message: "Equipo eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar equipo", error: error.message });
    }
};

// ─── Seed Demo Teams ─────────────────────────────────────────────────
export const seedDemoTeams = async (req, res) => {
    try {
        const buildCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

        const DEMO_TEAMS = [
            {
                name: 'Shadow Wolves',
                slogan: 'Cazamos en manada',
                category: 'FPS',
                game: 'Valorant',
                teamGender: 'Mixto',
                teamCountry: 'México',
                teamLevel: 'Profesional',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 2,
                roster: {
                    starters: [
                        { nickname: 'PhantomX', role: 'Duelist', gameId: 'PhantomX#LAN', region: 'LAN', email: 'phantom@demo.gg' },
                        { nickname: 'IronClaw', role: 'Sentinel', gameId: 'IronClaw#LAN', region: 'LAN', email: 'ironclaw@demo.gg' },
                        { nickname: 'NeonBlitz', role: 'Controller', gameId: 'NeonBlitz#LAN', region: 'LAN', email: 'neon@demo.gg' },
                        { nickname: 'FrostByte', role: 'Initiator', gameId: 'FrostByte#LAN', region: 'LAN', email: 'frost@demo.gg' },
                        { nickname: 'ZeroGrav', role: 'Flex', gameId: 'ZeroGrav#LAN', region: 'LAN', email: 'zero@demo.gg' },
                    ],
                    subs: [
                        { nickname: 'TwinFire', role: 'Duelist', gameId: 'TwinFire#LAN', region: 'LAN' },
                        { nickname: 'VoidWalker', role: 'Controller', gameId: 'VoidWalker#LAN', region: 'LAN' },
                    ],
                    coach: { nickname: 'CoachShadow', role: 'Head Coach', gameId: 'CoachShadow#LAN', region: 'LAN', email: 'coach@demo.gg' }
                }
            },
            {
                name: 'Nexus Legends',
                slogan: 'El nexo nunca cae',
                category: 'MOBA',
                game: 'League of Legends',
                teamGender: 'Mixto',
                teamCountry: 'Argentina',
                teamLevel: 'Semi-Pro',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 2,
                roster: {
                    starters: [
                        { nickname: 'KingTop', role: 'Top', gameId: 'KingTop#LAS', region: 'LAS', email: 'kingtop@demo.gg' },
                        { nickname: 'JungleKid', role: 'Jungle', gameId: 'JungleKid#LAS', region: 'LAS', email: 'jungle@demo.gg' },
                        { nickname: 'MidLord', role: 'Mid', gameId: 'MidLord#LAS', region: 'LAS' },
                        { nickname: 'ADCarry99', role: 'ADC', gameId: 'ADCarry99#LAS', region: 'LAS' },
                        { nickname: 'SuppGod', role: 'Supp', gameId: 'SuppGod#LAS', region: 'LAS' },
                    ],
                    subs: [
                        { nickname: 'BackupMid', role: 'Mid', gameId: 'BackupMid#LAS', region: 'LAS' },
                    ],
                    coach: null
                }
            },
            {
                name: 'Cyber Strikers',
                slogan: 'Headshots only',
                category: 'FPS',
                game: 'CS2',
                teamGender: 'Masculino',
                teamCountry: 'España',
                teamLevel: 'Amateur',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'AimGod', role: 'Entry', gameId: 'AimGod', region: 'EUW', email: 'aim@demo.gg' },
                        { nickname: 'ScopeKing', role: 'AWPer', gameId: 'ScopeKing', region: 'EUW' },
                        { nickname: 'Lurker7', role: 'Lurker', gameId: 'Lurker7', region: 'EUW' },
                        { nickname: 'FlashBang', role: 'Support', gameId: 'FlashBang', region: 'EUW' },
                    ],
                    subs: [],
                    coach: null
                }
            },
            {
                name: 'Royal Storm',
                slogan: 'Reinas del rift',
                category: 'MOBA',
                game: 'Wild Rift',
                teamGender: 'Femenino',
                teamCountry: 'Colombia',
                teamLevel: 'Universitario',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'QueenBaron', role: 'Baron', gameId: 'QueenBaron#LAN', region: 'LAN' },
                        { nickname: 'JungleStar', role: 'Jungle', gameId: 'JungleStar#LAN', region: 'LAN' },
                        { nickname: 'MidQueen', role: 'Mid', gameId: 'MidQueen#LAN', region: 'LAN' },
                        { nickname: 'DragonAce', role: 'Dragon', gameId: 'DragonAce#LAN', region: 'LAN' },
                        { nickname: 'HealBot', role: 'Supp', gameId: 'HealBot#LAN', region: 'LAN' },
                    ],
                    subs: [
                        { nickname: 'SubQueen', role: 'Mid', gameId: 'SubQueen#LAN', region: 'LAN' },
                    ],
                    coach: { nickname: 'CoachRoyal', role: 'Coach', region: 'LAN' }
                }
            },
            {
                name: 'Drop Zone Elite',
                slogan: 'Caemos primero, ganamos siempre',
                category: 'Battle Royale',
                game: 'Fortnite',
                teamGender: 'Mixto',
                teamCountry: 'Chile',
                teamLevel: 'Casual',
                teamLanguage: 'Español',
                maxMembers: 4,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'BuildMaster', role: 'Builder', gameId: 'BuildMaster', region: 'LATAM' },
                        { nickname: 'FragHunter', role: 'Fragger', gameId: 'FragHunter', region: 'LATAM' },
                        { nickname: 'ShotCaller', role: 'IGL', gameId: 'ShotCaller', region: 'LATAM' },
                    ],
                    subs: [],
                    coach: null
                }
            },
            {
                name: 'Apex Predators',
                slogan: 'Born to dominate',
                category: 'Battle Royale',
                game: 'Apex Legends',
                teamGender: 'Mixto',
                teamCountry: 'USA',
                teamLevel: 'Leyenda (Elite)',
                teamLanguage: 'English',
                maxMembers: 3,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'WraithMain', role: 'Fragger', gameId: 'WraithMain', region: 'NA', email: 'wraith@demo.gg' },
                        { nickname: 'CommanderX', role: 'IGL', gameId: 'CommanderX', region: 'NA', email: 'cmdx@demo.gg' },
                        { nickname: 'LifelineGO', role: 'Support', gameId: 'LifelineGO', region: 'NA', email: 'lifeline@demo.gg' },
                    ],
                    subs: [
                        { nickname: 'SubApex', role: 'Fragger', gameId: 'SubApex', region: 'NA' },
                    ],
                    coach: { nickname: 'CoachPred', role: 'Analyst', gameId: 'CoachPred', region: 'NA', email: 'analyst@demo.gg' }
                }
            },
            {
                name: 'Gol Esports',
                slogan: 'El balón es nuestro',
                category: 'Deportes y Carreras',
                game: 'FIFA / EA FC',
                teamGender: 'Masculino',
                teamCountry: 'Perú',
                teamLevel: 'Semi-Pro',
                teamLanguage: 'Español',
                maxMembers: 1,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'FIFAKing', role: 'Player', gameId: 'FIFAKing', region: 'LATAM' },
                    ],
                    subs: [
                        { nickname: 'SubFIFA', role: 'Player', gameId: 'SubFIFA', region: 'LATAM' },
                    ],
                    coach: null
                }
            },
            {
                name: 'Iron Fist Dojo',
                slogan: 'Fight with honor',
                category: 'Pelea / Fighting',
                game: 'Tekken 8',
                teamGender: 'Mixto',
                teamCountry: 'Japón',
                teamLevel: 'Profesional',
                teamLanguage: 'English',
                maxMembers: 1,
                maxSubstitutes: 0,
                roster: {
                    starters: [
                        { nickname: 'MishimaX', role: 'Fighter', gameId: 'MishimaX', region: 'JP', email: 'mishima@demo.gg' },
                    ],
                    subs: [],
                    coach: { nickname: 'SenseiDojo', role: 'Coach', region: 'JP' }
                }
            },
        ];

        // Delete previous demo teams to avoid duplicates
        await Team.deleteMany({ slogan: { $in: DEMO_TEAMS.map(t => t.slogan) } });

        const created = [];
        for (const teamData of DEMO_TEAMS) {
            const team = new Team({
                ...teamData,
                captain: req.userId, // assign to the calling user
                inviteCode: buildCode()
            });
            await team.save();
            created.push(team);
        }

        // Add teams to user's teams array
        await User.findByIdAndUpdate(req.userId, {
            $addToSet: { teams: { $each: created.map(t => t._id) } }
        });

        res.status(201).json({ message: `${created.length} equipos demo creados`, teams: created });
    } catch (error) {
        console.error('seedDemoTeams error:', error);
        res.status(500).json({ message: 'Error al crear equipos demo', error: error.message });
    }
};

// ─── Seed Third-Party Teams (not owned by the caller) ────────────────
export const seedThirdPartyTeams = async (req, res) => {
    try {
        const buildCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

        // Create or find a "phantom" user to act as captain
        let phantom = await User.findOne({ email: 'phantom_captain@esportefy.demo' });
        if (!phantom) {
            phantom = await User.findOne({ username: /^PhantomCaptain/i });
        }
        if (!phantom) {
            const hashedPw = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            phantom = await User.create({
                username: 'PhantomCaptain_' + Date.now(),
                email: 'phantom_captain@esportefy.demo',
                password: hashedPw,
                checkTerms: true,
                fullName: 'Phantom Captain',
                phone: '0000000000',
                country: 'N/A',
                birthDate: new Date('2000-01-01'),
                gender: 'Otro'
            });
        }

        const THIRD_PARTY_TEAMS = [
            {
                name: 'Nova Esports',
                slogan: 'Brillamos en cada partida',
                category: 'FPS',
                game: 'Valorant',
                teamGender: 'Mixto',
                teamCountry: 'España',
                teamLevel: 'Profesional',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 2,
                roster: {
                    starters: [
                        { nickname: 'StarDust', role: 'Duelist', gameId: 'StarDust#EUW', region: 'EUW', email: 'stardust@nova.gg' },
                        { nickname: 'Vanguard', role: 'Sentinel', gameId: 'Vanguard#EUW', region: 'EUW', email: 'vanguard@nova.gg' },
                        { nickname: 'SmokeScreen', role: 'Controller', gameId: 'SmokeScreen#EUW', region: 'EUW' },
                        { nickname: 'FlashPoint', role: 'Initiator', gameId: 'FlashPoint#EUW', region: 'EUW' },
                        { nickname: 'Wildcard', role: 'Flex', gameId: 'Wildcard#EUW', region: 'EUW' },
                    ],
                    subs: [
                        { nickname: 'ReservaStar', role: 'Duelist', gameId: 'ReservaStar#EUW', region: 'EUW' },
                    ],
                    coach: { nickname: 'CoachNova', role: 'Head Coach', gameId: 'CoachNova#EUW', region: 'EUW', email: 'coach@nova.gg' }
                }
            },
            {
                name: 'Dragón Rojo',
                slogan: 'Fuego y gloria',
                category: 'MOBA',
                game: 'League of Legends',
                teamGender: 'Mixto',
                teamCountry: 'México',
                teamLevel: 'Semi-Pro',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 2,
                roster: {
                    starters: [
                        { nickname: 'DragonTop', role: 'Top', gameId: 'DragonTop#LAN', region: 'LAN', email: 'top@dragon.gg' },
                        { nickname: 'SelvaRoja', role: 'Jungle', gameId: 'SelvaRoja#LAN', region: 'LAN' },
                        { nickname: 'MagoCentral', role: 'Mid', gameId: 'MagoCentral#LAN', region: 'LAN' },
                        { nickname: 'TiradorX', role: 'ADC', gameId: 'TiradorX#LAN', region: 'LAN' },
                        { nickname: 'Guardián', role: 'Supp', gameId: 'Guardian#LAN', region: 'LAN' },
                    ],
                    subs: [
                        { nickname: 'DragónJr', role: 'Mid', gameId: 'DragonJr#LAN', region: 'LAN' },
                        { nickname: 'FuegoBajo', role: 'ADC', gameId: 'FuegoBajo#LAN', region: 'LAN' },
                    ],
                    coach: null
                }
            },
            {
                name: 'Phantom Aces',
                slogan: 'Invisible but deadly',
                category: 'FPS',
                game: 'CS2',
                teamGender: 'Masculino',
                teamCountry: 'Argentina',
                teamLevel: 'Amateur',
                teamLanguage: 'Español',
                maxMembers: 5,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'GhostShot', role: 'Entry', gameId: 'GhostShot', region: 'LAS' },
                        { nickname: 'SilentAWP', role: 'AWPer', gameId: 'SilentAWP', region: 'LAS', email: 'awp@phantom.gg' },
                        { nickname: 'ShadowLurk', role: 'Lurker', gameId: 'ShadowLurk', region: 'LAS' },
                    ],
                    subs: [],
                    coach: null
                }
            },
            {
                name: 'Sakura Team',
                slogan: 'La flor que nunca cae',
                category: 'MOBA',
                game: 'Mobile Legends',
                teamGender: 'Femenino',
                teamCountry: 'Filipinas',
                teamLevel: 'Universitario',
                teamLanguage: 'English',
                maxMembers: 5,
                maxSubstitutes: 2,
                roster: {
                    starters: [
                        { nickname: 'CherryEXP', role: 'EXP', gameId: 'CherryEXP', region: 'SEA', email: 'cherry@sakura.gg' },
                        { nickname: 'PetalJG', role: 'Gold', gameId: 'PetalJG', region: 'SEA' },
                        { nickname: 'BlossomMid', role: 'Mid', gameId: 'BlossomMid', region: 'SEA' },
                        { nickname: 'ThorneJG', role: 'Jungla', gameId: 'ThorneJG', region: 'SEA' },
                        { nickname: 'HanaRoam', role: 'Roam', gameId: 'HanaRoam', region: 'SEA' },
                    ],
                    subs: [
                        { nickname: 'SubSakura1', role: 'Mid', gameId: 'SubSakura1', region: 'SEA' },
                        { nickname: 'SubSakura2', role: 'Gold', gameId: 'SubSakura2', region: 'SEA' },
                    ],
                    coach: { nickname: 'CoachHana', role: 'Analyst', region: 'SEA' }
                }
            },
            {
                name: 'Turbo Racers',
                slogan: 'Velocidad máxima',
                category: 'Deportes y Carreras',
                game: 'Rocket League',
                teamGender: 'Mixto',
                teamCountry: 'Brasil',
                teamLevel: 'Casual',
                teamLanguage: 'Português',
                maxMembers: 3,
                maxSubstitutes: 1,
                roster: {
                    starters: [
                        { nickname: 'NitroBoost', role: 'Striker', gameId: 'NitroBoost', region: 'SAM', email: 'nitro@turbo.gg' },
                        { nickname: 'DefenseWall', role: 'Defender', gameId: 'DefenseWall', region: 'SAM' },
                        { nickname: 'AeroFlip', role: 'Midfield', gameId: 'AeroFlip', region: 'SAM' },
                    ],
                    subs: [
                        { nickname: 'SubTurbo', role: 'Striker', gameId: 'SubTurbo', region: 'SAM' },
                    ],
                    coach: { nickname: 'CoachSpeed', role: 'Coach', region: 'SAM' }
                }
            },
        ];

        // Delete previous third-party demo teams to avoid duplicates
        await Team.deleteMany({ slogan: { $in: THIRD_PARTY_TEAMS.map(t => t.slogan) } });

        const created = [];
        for (const teamData of THIRD_PARTY_TEAMS) {
            const team = new Team({
                ...teamData,
                captain: phantom._id, // NOT the calling user
                inviteCode: buildCode()
            });
            await team.save();
            created.push(team);
        }

        res.status(201).json({ message: `${created.length} equipos de terceros creados`, teams: created });
    } catch (error) {
        console.error('seedThirdPartyTeams error:', error);
        res.status(500).json({ message: 'Error al crear equipos de terceros', error: error.message });
    }
};
