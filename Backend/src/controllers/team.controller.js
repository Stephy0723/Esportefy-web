// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import User from "../models/User.js";
import axios from 'axios';
import crypto from "crypto";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { NOTIF, pushNotification } from './notification.controller.js';

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
        const ext = path.extname(file.originalname);
        // Usamos req.userId (que viene del middleware verifyToken)
        cb(null, `${req.userId}-${Date.now()}${ext}`);
    }
});

export const upload = multer({ 
    storage,
   
});

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

        const rosterData = sanitizeCreateRoster(parsedRoster || { starters: [], subs: [], coach: null });
        // Asegura que el capitán quede en el roster si no está lleno
        if (parsedFormData?.leaderIgn) {
            const captainPlayer = {
                user: req.userId,
                nickname: parsedFormData.leaderIgn,
                gameId: parsedFormData.leaderGameId || '',
                region: parsedFormData.leaderRegion || '',
                email: '',
                role: parsedFormData.leaderRole || ''
            };
            if (Array.isArray(rosterData.starters) && !rosterData.starters[0]) {
                rosterData.starters[0] = captainPlayer;
            }
        }

        if (RIOT_GAMES.has(parsedFormData.game)) {
            const linkedRiot = await getLinkedRiotForUser(req.userId);
            if (!linkedRiot.ok) {
                return res.status(400).json({ message: linkedRiot.message });
            }
            if (!riotIdMatches(parsedFormData?.leaderIgn, parsedFormData?.leaderGameId, linkedRiot.riot.gameName, linkedRiot.riot.tagLine)) {
                return res.status(400).json({
                    message: `El Riot ID del capitán debe coincidir con tu cuenta vinculada (${linkedRiot.riot.riotId})`
                });
            }

            parsedFormData.leaderIgn = linkedRiot.riot.gameName;
            parsedFormData.leaderGameId = linkedRiot.riot.tagLine;
            if (Array.isArray(rosterData.starters)) {
                const currentCaptainSlot = rosterData.starters[0] || {};
                rosterData.starters[0] = {
                    ...currentCaptainSlot,
                    user: req.userId,
                    nickname: linkedRiot.riot.gameName,
                    gameId: linkedRiot.riot.tagLine
                };
            }

            const riotCheck = await validateRiotAccount(linkedRiot.riot.gameName, linkedRiot.riot.tagLine);
            if (!riotCheck.ok) {
                return res.status(400).json({ message: riotCheck.message });
            }
            const riotUnique = await ensureRiotIdNotInOtherTeam(parsedFormData.game, linkedRiot.riot.gameName, linkedRiot.riot.tagLine, null);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });

            const duplicateRiot = findDuplicateRiotInRoster(rosterData);
            if (duplicateRiot) {
                return res.status(400).json({ message: 'Hay Riot IDs repetidos dentro del roster del equipo' });
            }
        }

        const duplicateRosterUser = findDuplicateUserInRoster(rosterData);
        if (duplicateRosterUser) {
            return res.status(400).json({ message: 'Hay usuarios repetidos dentro del roster del equipo' });
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(parsedFormData.game, req.userId, null);
        if (!uniqueCheck.ok) {
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

        // Notificar al creador
        await pushNotification(req.userId, NOTIF.teamCreated(savedTeam.name || parsedFormData?.name));

        res.status(201).json({
            message: "Equipo creado",
            inviteLink: `http://localhost:3000/join/${savedTeam.inviteCode}`
        });
    } catch (error) {
        res.status(500).json({ message: "Error", error: error.message });
    }
};

const userInRoster = (team, userId) => {
    if (String(team?.captain || '') === String(userId || '')) return true;
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
    const max = slotType === 'starters' ? Number(team.maxMembers) : Number(team.maxSubstitutes);
    if (Number.isFinite(max) && max > 0 && idx >= max) {
        return { ok: false, message: `Slot fuera del límite de ${slotType === 'starters' ? 'titulares' : 'suplentes'}` };
    }
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
    const exists = await Team.findOne(query).select('_id');
    if (exists) {
        return { ok: false, message: 'Ya perteneces a otro equipo de este juego' };
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

// pushNotification imported from notification.controller.js

const toPlayerList = (roster = {}) => {
    const starters = Array.isArray(roster?.starters) ? roster.starters : [];
    const subs = Array.isArray(roster?.subs) ? roster.subs : [];
    const coach = roster?.coach;
    return [...starters, ...subs, coach].filter(Boolean);
};

const findDuplicateValue = (values = []) => {
    const seen = new Set();
    for (const value of values || []) {
        const normalized = String(value || '').trim();
        if (!normalized) continue;
        if (seen.has(normalized)) return normalized;
        seen.add(normalized);
    }
    return '';
};

const findDuplicateUserInRoster = (roster = {}) => {
    const users = toPlayerList(roster)
        .map((player) => String(player?.user || '').trim())
        .filter(Boolean);
    return findDuplicateValue(users);
};

const sanitizeCreateRoster = (roster = {}) => {
    const sanitizePlayer = (player) => {
        if (!player || typeof player !== 'object') return null;
        return { ...player, user: null };
    };
    return {
        starters: Array.isArray(roster?.starters) ? roster.starters.map(sanitizePlayer) : [],
        subs: Array.isArray(roster?.subs) ? roster.subs.map(sanitizePlayer) : [],
        coach: sanitizePlayer(roster?.coach)
    };
};

const validateRequestedSlot = (team, slotType, slotIndex) => {
    if (slotType === 'coach') return { ok: true, slotIndex: 0 };
    if (!['starters', 'subs'].includes(slotType)) {
        return { ok: false, message: 'Slot inválido' };
    }
    const idx = Number(slotIndex);
    if (Number.isNaN(idx) || idx < 0) {
        return { ok: false, message: 'Índice inválido' };
    }
    const max = slotType === 'starters' ? Number(team.maxMembers) : Number(team.maxSubstitutes);
    if (Number.isFinite(max) && max > 0 && idx >= max) {
        return { ok: false, message: `Slot fuera del límite de ${slotType === 'starters' ? 'titulares' : 'suplentes'}` };
    }
    return { ok: true, slotIndex: idx };
};

const RIOT_GAMES = new Set([
    'Valorant',
    'League of Legends',
    'Wild Rift',
    'Teamfight Tactics',
    'Legends of Runeterra'
]);

const normalizeRiotPart = (value = '') => String(value || '').trim().toLowerCase();

const riotIdMatches = (leftName, leftTag, rightName, rightTag) => (
    normalizeRiotPart(leftName) === normalizeRiotPart(rightName)
    && normalizeRiotPart(leftTag) === normalizeRiotPart(rightTag)
);

const buildRiotKey = (nickname, gameId) => {
    const gn = normalizeRiotPart(nickname);
    const tl = normalizeRiotPart(gameId);
    if (!gn || !tl) return '';
    return `${gn}#${tl}`;
};

const findDuplicateRiotInRoster = (roster = {}) => {
    const riotKeys = toPlayerList(roster)
        .map((player) => buildRiotKey(player?.nickname, player?.gameId))
        .filter(Boolean);
    return findDuplicateValue(riotKeys);
};

const findRiotInRoster = (team) => {
    const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
    const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
    const coach = team?.roster?.coach;
    return [...starters, ...subs, coach].filter(Boolean);
};

const riotIdExistsInTeamRoster = (team, nickname, gameId) => {
    const gn = String(nickname || '').trim();
    const tl = String(gameId || '').trim();
    if (!gn || !tl) return false;

    return findRiotInRoster(team).some((player) => (
        riotIdMatches(player?.nickname, player?.gameId, gn, tl)
    ));
};

const riotIdExistsInPendingRequests = (team, nickname, gameId, ignoredRequestId = '') => {
    const gn = String(nickname || '').trim();
    const tl = String(gameId || '').trim();
    if (!gn || !tl) return false;
    const ignore = String(ignoredRequestId || '');

    const requests = Array.isArray(team?.joinRequests) ? team.joinRequests : [];
    return requests.some((request) => {
        if (ignore && String(request?._id || '') === ignore) return false;
        if (String(request?.status || 'pending').toLowerCase() !== 'pending') return false;
        return riotIdMatches(request?.player?.nickname, request?.player?.gameId, gn, tl);
    });
};

const getLinkedRiotForUser = async (userId) => {
    const user = await User.findById(userId).select('connections.riot');
    if (!user?.connections?.riot?.verified) {
        return { ok: false, message: 'Debes vincular tu cuenta Riot para continuar' };
    }

    const gameName = String(user?.connections?.riot?.gameName || '').trim();
    const tagLine = String(user?.connections?.riot?.tagLine || '').trim();
    if (!gameName || !tagLine) {
        return { ok: false, message: 'Tu cuenta Riot vinculada está incompleta. Vuelve a vincularla.' };
    }

    return {
        ok: true,
        riot: {
            gameName,
            tagLine,
            riotId: `${gameName}#${tagLine}`
        }
    };
};

const ensurePlayerMatchesLinkedRiot = async (userId, player = {}) => {
    const linked = await getLinkedRiotForUser(userId);
    if (!linked.ok) return linked;

    const nickname = String(player?.nickname || '').trim();
    const gameId = String(player?.gameId || '').trim();
    if (!nickname || !gameId) {
        return { ok: false, message: 'Debes indicar tu Riot ID completo (GameName y TagLine)' };
    }

    if (!riotIdMatches(nickname, gameId, linked.riot.gameName, linked.riot.tagLine)) {
        return {
            ok: false,
            message: `El Riot ID debe coincidir con tu cuenta vinculada (${linked.riot.riotId})`
        };
    }

    return linked;
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
    const isLocalOrPrivateHost = (hostname = '') => {
        const host = String(hostname || '').trim().toLowerCase();
        if (!host) return false;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
        if (host.startsWith('10.')) return true;
        if (host.startsWith('192.168.')) return true;
        if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
        return false;
    };

    if (!process.env.RIOT_API_KEY) {
        return { ok: false, message: 'Riot API no configurada en el servidor' };
    }
    const keyMode = String(process.env.RIOT_KEY_MODE || 'development').trim().toLowerCase();
    const nodeEnv = String(process.env.NODE_ENV || 'development').trim().toLowerCase();
    const allowDevKeyInProd = String(process.env.ALLOW_RIOT_DEV_KEY_IN_PROD || '').trim().toLowerCase() === 'true';
    if (keyMode !== 'production' && nodeEnv === 'production' && !allowDevKeyInProd) {
        return { ok: false, message: 'La key Riot en modo development/interim no puede usarse en este entorno' };
    }
    if (keyMode !== 'production') {
        const frontendUrl = String(process.env.FRONTEND_URL || '').trim();
        if (frontendUrl) {
            try {
                const frontendHost = new URL(frontendUrl).hostname;
                if (!isLocalOrPrivateHost(frontendHost) && !allowDevKeyInProd) {
                    return { ok: false, message: 'La key Riot en modo development/interim requiere entorno local/privado' };
                }
            } catch (_) {
                return { ok: false, message: 'FRONTEND_URL inválida para RIOT_KEY_MODE=development' };
            }
        }
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
        const status = e?.response?.status;
        if (status === 404) return { ok: false, message: 'Riot ID no válido' };
        if (status === 429) return { ok: false, message: 'Riot API rate limit alcanzado. Intenta más tarde.' };
        if (status === 401 || status === 403) return { ok: false, message: 'Riot API key inválida o sin permisos' };
        return { ok: false, message: 'No se pudo validar Riot ID en este momento' };
    }
};

export const joinTeam = async (req, res) => {
    try {
        const { teamId, inviteCode, slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);
        let normalizedPlayer = { ...(player || {}) };

        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (RIOT_GAMES.has(team.game)) {
            const linked = await ensurePlayerMatchesLinkedRiot(req.userId, normalizedPlayer);
            if (!linked.ok) return res.status(400).json({ message: linked.message });
            normalizedPlayer.nickname = linked.riot.gameName;
            normalizedPlayer.gameId = linked.riot.tagLine;

            if (riotIdExistsInTeamRoster(team, normalizedPlayer.nickname, normalizedPlayer.gameId)) {
                return res.status(400).json({ message: "Ese Riot ID ya está en este equipo" });
            }

            const riotCheck = await validateRiotAccount(normalizedPlayer.nickname, normalizedPlayer.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, normalizedPlayer.nickname, normalizedPlayer.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (!inviteCode || inviteCode !== team.inviteCode) {
            return res.status(401).json({ message: "Código incorrecto" });
        }
        if (userInRoster(team, req.userId)) {
            return res.status(400).json({ message: "Ya estás en este equipo" });
        }
        if (!normalizedPlayer?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }
        const playerPayload = { ...normalizedPlayer, user: req.userId };
        const applied = applyRosterSlot(team, slotType, slotIndex, playerPayload);
        if (!applied.ok) return res.status(400).json({ message: applied.message });

        await team.save();
        await User.updateOne({ _id: req.userId }, { $addToSet: { teams: team._id } });
        await pushNotification(team.captain, NOTIF.teamJoined(team.name, playerPayload.nickname));
        await pushNotification(req.userId, NOTIF.teamJoinedConfirm(team.name));
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

        const slotValidation = validateRequestedSlot(team, slotType, slotIndex);
        if (!slotValidation.ok) return res.status(400).json({ message: slotValidation.message });

        const incomingUserId = String(player?.user || '').trim();
        if (incomingUserId) {
            if (userInRoster(team, incomingUserId)) {
                return res.status(400).json({ message: "Ese usuario ya está en este equipo" });
            }
            const uniqueCheck = await ensureUserNotInOtherTeam(team.game, incomingUserId, team._id);
            if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
            const genderCheck = await canJoinByGender(team, incomingUserId);
            if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        }

        const normalizedPlayer = { ...(player || {}) };
        const persistedUser = incomingUserId || null;

        if (RIOT_GAMES.has(team.game)) {
            if (incomingUserId) {
                const linked = await ensurePlayerMatchesLinkedRiot(incomingUserId, normalizedPlayer);
                if (!linked.ok) return res.status(400).json({ message: linked.message });
                normalizedPlayer.nickname = linked.riot.gameName;
                normalizedPlayer.gameId = linked.riot.tagLine;
            }
            if (!normalizedPlayer?.nickname || !normalizedPlayer?.gameId) {
                return res.status(400).json({ message: "Riot ID requerido (GameName y TagLine)" });
            }
            if (riotIdExistsInTeamRoster(team, normalizedPlayer?.nickname, normalizedPlayer?.gameId)) {
                return res.status(400).json({ message: "Ese Riot ID ya está en este equipo" });
            }
            const riotCheck = await validateRiotAccount(normalizedPlayer?.nickname, normalizedPlayer?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, normalizedPlayer?.nickname, normalizedPlayer?.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }

        if (!normalizedPlayer?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }

        const applied = applyRosterSlot(team, slotType, slotValidation.slotIndex, { ...normalizedPlayer, user: persistedUser });
        if (!applied.ok) return res.status(400).json({ message: applied.message });

        await team.save();
        if (persistedUser) {
            await User.updateOne({ _id: persistedUser }, { $addToSet: { teams: team._id } });
        }
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
            await pushNotification(userId, NOTIF.teamRemoved(team.name));
        }

        return res.status(200).json({ message: "Jugador removido", team });
    } catch (error) {
        return res.status(500).json({ message: "Error al remover jugador", error: error.message });
    }
};

export const requestJoinTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);
        let normalizedPlayer = { ...(player || {}) };
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        const slotValidation = validateRequestedSlot(team, slotType, slotIndex);
        if (!slotValidation.ok) return res.status(400).json({ message: slotValidation.message });
        const hasPendingByUser = (team.joinRequests || []).some((request) => (
            String(request?.user || '') === String(req.userId)
            && String(request?.status || 'pending').toLowerCase() === 'pending'
        ));
        if (hasPendingByUser) {
            return res.status(400).json({ message: "Ya tienes una solicitud pendiente para este equipo" });
        }
        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (RIOT_GAMES.has(team.game)) {
            const linked = await ensurePlayerMatchesLinkedRiot(req.userId, normalizedPlayer);
            if (!linked.ok) return res.status(400).json({ message: linked.message });
            normalizedPlayer.nickname = linked.riot.gameName;
            normalizedPlayer.gameId = linked.riot.tagLine;

            if (riotIdExistsInTeamRoster(team, normalizedPlayer.nickname, normalizedPlayer.gameId)) {
                return res.status(400).json({ message: "Ese Riot ID ya está en este equipo" });
            }
            if (riotIdExistsInPendingRequests(team, normalizedPlayer.nickname, normalizedPlayer.gameId)) {
                return res.status(400).json({ message: "Ya existe una solicitud pendiente con ese Riot ID" });
            }

            const riotCheck = await validateRiotAccount(normalizedPlayer.nickname, normalizedPlayer.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, normalizedPlayer.nickname, normalizedPlayer.gameId, team._id);
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (userInRoster(team, req.userId)) {
            return res.status(400).json({ message: "Ya estás en este equipo" });
        }
        if (!normalizedPlayer?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }
        team.joinRequests = team.joinRequests || [];
        team.joinRequests.push({
            user: req.userId,
            slotType,
            slotIndex: slotValidation.slotIndex,
            player: { ...normalizedPlayer, user: req.userId },
            status: 'pending'
        });
        await team.save();
        await pushNotification(team.captain, NOTIF.teamJoinRequest(team.name, player?.nickname));
        res.status(200).json({ message: "Solicitud enviada" });
    } catch (error) {
        res.status(500).json({ message: "Error al solicitar ingreso" });
    }
};

export const handleJoinRequest = async (req, res) => {
    try {
        const { teamId, requestId } = req.params;
        const { action } = req.body || {};
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (String(team.captain) !== String(req.userId)) {
            return res.status(403).json({ message: "Solo el capitán puede gestionar solicitudes" });
        }
        if (!Array.isArray(team.joinRequests)) team.joinRequests = [];
        const reqDoc = team.joinRequests.id(requestId);
        if (!reqDoc) return res.status(404).json({ message: "Solicitud no encontrada" });
        if (String(reqDoc.status || 'pending').toLowerCase() !== 'pending') {
            return res.status(400).json({ message: "La solicitud ya fue gestionada" });
        }

        if (action === 'approve') {
            const uniqueCheck = await ensureUserNotInOtherTeam(team.game, reqDoc.user, team._id);
            if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
            let requestPlayer = { ...(reqDoc.player || {}) };
            if (RIOT_GAMES.has(team.game)) {
                const linked = await ensurePlayerMatchesLinkedRiot(reqDoc.user, requestPlayer);
                if (!linked.ok) return res.status(400).json({ message: linked.message });
                requestPlayer.nickname = linked.riot.gameName;
                requestPlayer.gameId = linked.riot.tagLine;

                if (riotIdExistsInTeamRoster(team, requestPlayer.nickname, requestPlayer.gameId)) {
                    return res.status(400).json({ message: "Ese Riot ID ya está en este equipo" });
                }
                if (riotIdExistsInPendingRequests(team, requestPlayer.nickname, requestPlayer.gameId, requestId)) {
                    return res.status(400).json({ message: "Ya existe otra solicitud pendiente con ese Riot ID" });
                }

                const riotCheck = await validateRiotAccount(requestPlayer.nickname, requestPlayer.gameId);
                if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
                const riotUnique = await ensureRiotIdNotInOtherTeam(team.game, requestPlayer.nickname, requestPlayer.gameId, team._id);
                if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
            }
            const genderCheck = await canJoinByGender(team, reqDoc.user);
            if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
            if (userInRoster(team, reqDoc.user)) {
                team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
                await team.save();
                return res.status(400).json({ message: "El jugador ya está en el equipo" });
            }
            let applied = applyRosterSlot(team, reqDoc.slotType, reqDoc.slotIndex, requestPlayer || {});
            if (!applied.ok) {
                // Si el slot solicitado está ocupado, intenta el primero disponible
                if (applied.message === 'Ese slot ya está ocupado' && ['starters', 'subs'].includes(reqDoc.slotType)) {
                    const firstEmpty = findFirstEmptySlot(team, reqDoc.slotType);
                    if (firstEmpty === -1) {
                        return res.status(400).json({ message: 'No hay slots disponibles' });
                    }
                    applied = applyRosterSlot(team, reqDoc.slotType, firstEmpty, requestPlayer || {});
                }
                if (!applied.ok) return res.status(400).json({ message: applied.message });
            }
            await User.updateOne({ _id: reqDoc.user }, { $addToSet: { teams: team._id } });
            team.joinRequests = team.joinRequests.filter((request) => (
                String(request?._id || '') !== String(requestId)
                && String(request?.user || '') !== String(reqDoc.user)
            ));
            await pushNotification(reqDoc.user, NOTIF.teamRequestApproved(team.name));
        } else if (action === 'reject') {
            // En rechazo solo eliminamos la solicitud
            team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
            await pushNotification(reqDoc.user, NOTIF.teamRequestRejected(team.name));
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

export const getTeamByInviteCode = async (req, res) => {
    try {
        const inviteCode = String(req.params.code || '').trim().toUpperCase();
        if (!inviteCode) {
            return res.status(400).json({ message: "Código de invitación inválido" });
        }

        const team = await Team.findOne({ inviteCode })
            .populate('captain', 'fullName avatar');

        if (!team) {
            return res.status(404).json({ message: "Equipo no encontrado" });
        }

        return res.status(200).json(team);
    } catch (error) {
        return res.status(500).json({
            message: "Error al obtener equipo por invitación",
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

        // Notificar al capitán que alguien abandonó
        const leaver = await User.findById(userId).select('userName fullName');
        await pushNotification(team.captain, NOTIF.teamLeft(team.name, leaver?.userName || leaver?.fullName));

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

        // Notify all roster members before deletion
        const allMembers = [
            ...(Array.isArray(team.roster?.starters) ? team.roster.starters : []),
            ...(Array.isArray(team.roster?.subs) ? team.roster.subs : []),
            team.roster?.coach
        ].filter(p => p?.user && String(p.user) !== String(req.userId));
        for (const member of allMembers) {
            await pushNotification(member.user, NOTIF.teamDeleted(team.name));
        }

        await Team.deleteOne({ _id: teamId });
        await User.updateMany({ teams: teamId }, { $pull: { teams: teamId } });

        res.status(200).json({ message: "Equipo eliminado" });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar equipo", error: error.message });
    }
};
