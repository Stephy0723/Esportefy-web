// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import User from "../models/User.js";
import axios from 'axios';
import crypto from "crypto";
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { isUniversityGameAllowed } from '../config/universityCatalog.js';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../utils/mlbbStatus.js';
import { getRiotAccountByRiotId, getRiotApiKey } from '../utils/riotApi.js';
import {
    getSupportedGameRoles,
    isSupportedGameName,
    isSupportedMlbbGame,
    isSupportedRiotGame,
    normalizeSupportedGameName
} from '../../../shared/supportedGames.js';
import { safeDeleteTeamConversation, safeSyncTeamConversation } from '../services/teamChatSync.js';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const teamUploadsDir = path.resolve(__dirname, '../../uploads/teams');
const frontendBaseUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').trim().replace(/\/$/, '');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = teamUploadsDir;

        // 1. PRIMERO: Verificar y crear la carpeta
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
                console.log("Carpeta de equipos creada con éxito.");
            }
        } catch (err) {
            console.error("Error al crear la carpeta:", err);
            return cb(err);
        }

        // 2. SEGUNDO: Pasar el control a Multer
        return cb(null, uploadDir); 
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
    limits: {
        fileSize: 8 * 1024 * 1024,
        fieldSize: 20 * 1024 * 1024
    },
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
        if (!team.teamCode) {
            await team.save();
        }
        return res.status(200).json(team);
    } catch (error) {
        return res.status(500).json({ message: "Error al buscar equipo", error: error.message });
    }
};

export const createTeam = async (req, res) => {
    try {
        // Multer pone los textos en req.body y el archivo en req.file
        let { formData, roster } = req.body;

        // IMPORTANTE: Parsear si vienen como string CON VALIDACIÓN
        let parsedFormData, parsedRoster;
        try {
            parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;
        } catch (parseError) {
            console.error('[createTeam] Error parsing formData:', parseError.message);
            return res.status(400).json({ message: 'formData inválido: ' + parseError.message });
        }
        try {
            parsedRoster = typeof roster === 'string' ? JSON.parse(roster) : roster;
        } catch (parseError) {
            console.error('[createTeam] Error parsing roster:', parseError.message);
            return res.status(400).json({ message: 'roster inválido: ' + parseError.message });
        }

        // Validar que parsedFormData tiene los campos necesarios
        if (!parsedFormData || typeof parsedFormData !== 'object') {
            return res.status(400).json({ message: 'formData debe ser un objeto válido' });
        }

        // Limpiar campos ObjectId que lleguen vacíos (el frontend envía "" para community)
        // Mongoose no puede convertir "" a ObjectId válido, así que eliminamos
        if (!parsedFormData.community || parsedFormData.community === '') {
            delete parsedFormData.community;
        }

        const normalizedGame = normalizeSupportedGameName(parsedFormData?.game);
        if (!normalizedGame) {
            return res.status(400).json({ message: 'Ese juego todavía no está soportado en GlitchGang.' });
        }
        parsedFormData.game = normalizedGame;

        const logoPath = req.file
            ? `/uploads/teams/${req.file.filename}`
            : '/uploads/teams/default.png';

        const rosterData = parsedRoster || { starters: [], subs: [], coach: null };
        const wantsUniversityTeam = isUniversityTeamLevel(parsedFormData?.teamLevel);
        if (wantsUniversityTeam && !isUniversityGameAllowed(parsedFormData?.game)) {
            return res.status(400).json({
                message: 'Los equipos universitarios solo pueden crearse para juegos de Riot o Mobile Legends.'
            });
        }
        // Asegura que el capitán quede en el roster
        const captainPlayer = {
            user: req.userId,
            nickname: parsedFormData?.leaderIgn || parsedFormData?.name || 'Captain',
            gameId: parsedFormData?.leaderGameId || '',
            region: parsedFormData?.leaderRegion || '',
            email: '',
            role: parsedFormData?.leaderRole || ''
        };
        if (Array.isArray(rosterData.starters)) {
            const isEmptySlot = (slot) => !slot || (!slot.user && !slot.nickname && !slot.gameId && !slot.email && !slot.role);
            const captainIdx = rosterData.starters.findIndex((slot) => String(slot?.user || '') === String(req.userId));
            if (captainIdx >= 0) {
                rosterData.starters[captainIdx] = {
                    ...(rosterData.starters[captainIdx] || {}),
                    ...captainPlayer
                };
            } else {
                const firstEmptyIdx = rosterData.starters.findIndex(isEmptySlot);
                if (firstEmptyIdx >= 0) {
                    rosterData.starters[firstEmptyIdx] = {
                        ...(rosterData.starters[firstEmptyIdx] || {}),
                        ...captainPlayer
                    };
                } else if (rosterData.starters.length === 0) {
                    rosterData.starters.push(captainPlayer);
                } else {
                    return res.status(400).json({ message: "Debes dejar un slot disponible para el capitán en el roster" });
                }
            }
        }

        let universitySnapshot = getEmptyUniversityTeamSnapshot();
        if (wantsUniversityTeam) {
            const universityResult = await buildVerifiedUniversitySnapshot(req.userId);
            if (!universityResult.ok) {
                return res.status(400).json({ message: universityResult.message });
            }
            universitySnapshot = universityResult.snapshot;
        }

        if (isSupportedRiotGame(parsedFormData.game)) {
            const linked = await requireRiotLinked(req.userId, parsedFormData.game, 'crear equipo');
            if (!linked.ok) {
                return res.status(400).json({ message: linked.message });
            }
            const riotCheck = await validateRiotAccount(parsedFormData.leaderIgn, parsedFormData.leaderGameId);
            if (!riotCheck.ok) {
                console.warn('[createTeam] Riot validation failed:', riotCheck.message);
                return res.status(400).json({ message: riotCheck.message });
            }
            const riotMatch = await ensureRiotPlayerMatchesLinkedUser(
                req.userId,
                parsedFormData.leaderIgn,
                parsedFormData.leaderGameId,
                parsedFormData.game
            );
            if (!riotMatch.ok) {
                return res.status(400).json({ message: riotMatch.message });
            }
            const riotUnique = await ensureRiotIdNotInOtherTeam(
                parsedFormData.game,
                parsedFormData.leaderIgn,
                parsedFormData.leaderGameId,
                null,
                {
                    targetTeamLike: {
                        teamLevel: parsedFormData.teamLevel,
                        university: { isUniversityTeam: wantsUniversityTeam }
                    },
                    targetUserId: req.userId
                }
            );
            if (!riotUnique.ok) {
                console.warn('[createTeam] Riot ID already in team:', riotUnique.message);
                return res.status(400).json({ message: riotUnique.message });
            }
        }
        if (isMlbbGame(parsedFormData.game)) {
            const ok = await requireMlbbLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes verificar tu cuenta MLBB en Conexiones para crear equipo" });
            const captainConn = await getMlbbConnectionState(req.userId);
            parsedFormData.leaderGameId = captainConn.playerId;
            parsedFormData.leaderRegion = captainConn.zoneId;
            const mlbbCheck = validateMlbbIdentity(parsedFormData.leaderGameId, parsedFormData.leaderRegion);
            if (!mlbbCheck.ok) return res.status(400).json({ message: mlbbCheck.message });
            const mlbbMatch = await ensureMlbbPlayerMatchesLinkedUser(
                req.userId,
                parsedFormData.leaderGameId,
                parsedFormData.leaderRegion
            );
            if (!mlbbMatch.ok) return res.status(400).json({ message: mlbbMatch.message });
            if (Array.isArray(rosterData.starters)) {
                const captainIdx = rosterData.starters.findIndex((slot) => String(slot?.user || '') === String(req.userId));
                const targetIdx = captainIdx >= 0 ? captainIdx : 0;
                rosterData.starters[targetIdx] = {
                    ...(rosterData.starters[targetIdx] || {}),
                    user: req.userId,
                    nickname: parsedFormData?.leaderIgn || parsedFormData?.name || 'Captain',
                    gameId: String(parsedFormData.leaderGameId || '').trim(),
                    region: String(parsedFormData.leaderRegion || '').trim(),
                    role: parsedFormData?.leaderRole || rosterData.starters[targetIdx]?.role || ''
                };
            }
            const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
                parsedFormData.game,
                parsedFormData.leaderGameId,
                parsedFormData.leaderRegion,
                null,
                {
                    targetTeamLike: {
                        teamLevel: parsedFormData.teamLevel,
                        university: { isUniversityTeam: wantsUniversityTeam }
                    },
                    targetUserId: req.userId
                }
            );
            if (!mlbbUnique.ok) return res.status(400).json({ message: mlbbUnique.message });
            const mlbbRosterValidation = await validateMlbbRosterEntries(
                parsedFormData.game,
                rosterData,
                null,
                { teamLevel: parsedFormData.teamLevel, university: { isUniversityTeam: wantsUniversityTeam } }
            );
            if (!mlbbRosterValidation.ok) {
                return res.status(400).json({ message: mlbbRosterValidation.message });
            }
        }

        const captainRoleUniqueness = validateCaptainRoleUniquenessInCreate({
            roster: rosterData,
            captainUserId: req.userId,
            leaderRole: parsedFormData?.leaderRole || '',
            isUniversityTeam: wantsUniversityTeam
        });
        if (!captainRoleUniqueness.ok) {
            return res.status(400).json({ message: captainRoleUniqueness.message });
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(
            parsedFormData.game,
            req.userId,
            null,
            { teamLevel: parsedFormData.teamLevel, university: { isUniversityTeam: wantsUniversityTeam } }
        );
        if (!uniqueCheck.ok) {
            console.warn('[createTeam] User already in team for this game:', uniqueCheck.message);
            return res.status(400).json({ message: uniqueCheck.message });
        }

        if (wantsUniversityTeam) {
            const universityRosterValidation = await validateUniversityTeamRoster(
                { roster: rosterData, university: universitySnapshot },
                universitySnapshot.universityId
            );
            if (!universityRosterValidation.ok) {
                return res.status(400).json({ message: universityRosterValidation.message });
            }
        }

        const newTeam = new Team({
            ...parsedFormData,
            logo: logoPath,
            university: universitySnapshot,
            roster: rosterData,
            captain: req.userId,
            inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase()
        });

        const savedTeam = await newTeam.save();
        
        // Actualizar al usuario para que vea su nuevo equipo
        await User.findByIdAndUpdate(req.userId, { $push: { teams: savedTeam._id } });
        await safeSyncTeamConversation(savedTeam);

        res.status(201).json({
            message: "Equipo creado",
            inviteLink: `${frontendBaseUrl}/equipos?invite=${savedTeam.inviteCode}`,
            teamId: String(savedTeam._id),
            inviteCode: savedTeam.inviteCode
        });
    } catch (error) {
        console.error('[createTeam] Unexpected error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            code: error.code
        });
        res.status(500).json({ 
            message: "Error al crear equipo",
            error: error.message,
            code: error.code
        });
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

const toPlainPlayerPayload = (player = {}) => {
    const raw = typeof player?.toObject === 'function'
        ? player.toObject()
        : { ...player };
    if (raw && typeof raw === 'object') {
        delete raw._id;
        delete raw.id;
        Object.keys(raw).forEach((key) => {
            const value = raw[key];
            if (value === undefined || value === null) {
                delete raw[key];
                return;
            }
            if (typeof value === 'string' && value.trim() === '') {
                delete raw[key];
            }
        });
    }
    return raw;
};

const applyRosterSlot = (team, slotType, slotIndex, player) => {
    if (!team.roster) team.roster = { starters: [], subs: [], coach: null };
    const playerPayload = toPlainPlayerPayload(player);
    if (slotType === 'coach') {
        if (isSlotFilled(team.roster.coach)) return { ok: false, message: 'El slot de coach ya está ocupado' };
        team.roster.coach = { ...(team.roster.coach || {}), ...playerPayload };
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
        return {
            ok: false,
            message: slotType === 'starters'
                ? 'Slot fuera del límite de titulares'
                : 'Slot fuera del límite de suplentes'
        };
    }
    if (isSlotFilled(list[idx])) return { ok: false, message: 'Ese slot ya está ocupado' };
    list[idx] = { ...(list[idx] || {}), ...playerPayload };
    team.roster[slotType] = list;
    return { ok: true };
};

const getTeamScopeKey = (teamLike = {}) =>
    (Boolean(teamLike?.university?.isUniversityTeam) || isUniversityTeamLevel(teamLike?.teamLevel))
        ? 'university'
        : 'normal';
const getTeamScopeLabel = (teamLike = {}) => (getTeamScopeKey(teamLike) === 'university' ? 'universitario' : 'normal');
const teamContainsUser = (teamLike = {}, userId = '') => {
    const key = String(userId || '');
    if (!key) return false;
    if (String(teamLike?.captain || '') === key) return true;
    const starters = Array.isArray(teamLike?.roster?.starters) ? teamLike.roster.starters : [];
    const subs = Array.isArray(teamLike?.roster?.subs) ? teamLike.roster.subs : [];
    const coach = teamLike?.roster?.coach;
    if (starters.some((slot) => String(slot?.user || '') === key)) return true;
    if (subs.some((slot) => String(slot?.user || '') === key)) return true;
    if (String(coach?.user || '') === key) return true;
    return false;
};
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ensureUserNotInOtherTeam = async (game, userId, currentTeamId, targetTeamLike = null) => {
    if (!userId) return { ok: true };
    const normalizedGame = normalizeSupportedGameName(game);
    if (!normalizedGame) {
        return { ok: false, message: 'Ese juego todavía no está soportado en GlitchGang.' };
    }
    const query = {
        game: normalizedGame,
        _id: { $ne: currentTeamId },
        $or: [
            { captain: userId },
            { 'roster.starters.user': userId },
            { 'roster.subs.user': userId },
            { 'roster.coach.user': userId }
        ]
    };
    const existingTeams = await Team.find(query)
        .select('_id name teamLevel university.isUniversityTeam captain roster.starters.user roster.subs.user roster.coach.user')
        .lean();
    if (!existingTeams.length) return { ok: true };

    if (!targetTeamLike) {
        return { ok: false, message: `Ya perteneces a otro equipo (${existingTeams[0]?.name || 'sin nombre'}) de este juego` };
    }

    const targetScope = getTeamScopeKey(targetTeamLike);
    const sameScopeTeam = existingTeams.find((teamDoc) => getTeamScopeKey(teamDoc) === targetScope);
    if (sameScopeTeam) {
        const scopeLabel = targetScope === 'university' ? 'universitario' : 'normal';
        return {
            ok: false,
            message: `Ya perteneces a otro equipo ${scopeLabel} (${sameScopeTeam.name}) de este juego`
        };
    }

    return { ok: true };
};

const ensureRiotIdNotInOtherTeam = async (game, nickname, gameId, currentTeamId, options = {}) => {
    const { targetTeamLike = null, targetUserId = null } = options;
    const normalizedGame = normalizeSupportedGameName(game);
    if (!normalizedGame) {
        return { ok: false, message: 'Ese juego todavía no está soportado en GlitchGang.' };
    }
    const gn = String(nickname || '').trim();
    const tl = String(gameId || '').trim();
    if (!gn || !tl) return { ok: true };
    const nickRegex = new RegExp(`^${escapeRegex(gn)}$`, 'i');
    const tagRegex = new RegExp(`^${escapeRegex(tl)}$`, 'i');
    const query = {
        game: normalizedGame,
        _id: { $ne: currentTeamId },
        $or: [
            { 'roster.starters': { $elemMatch: { nickname: nickRegex, gameId: tagRegex } } },
            { 'roster.subs': { $elemMatch: { nickname: nickRegex, gameId: tagRegex } } },
            { 'roster.coach.nickname': nickRegex, 'roster.coach.gameId': tagRegex }
        ]
    };
    const existingTeams = await Team.find(query)
        .select('_id name teamLevel university.isUniversityTeam captain roster.starters.user roster.subs.user roster.coach.user')
        .lean();
    if (!existingTeams.length) return { ok: true };

    const targetScope = targetTeamLike ? getTeamScopeKey(targetTeamLike) : null;
    for (const teamDoc of existingTeams) {
        if (!targetScope || !targetUserId) {
            return { ok: false, message: 'Este Riot ID ya pertenece a otro equipo de este juego' };
        }
        const existingScope = getTeamScopeKey(teamDoc);
        const sameScope = existingScope === targetScope;
        const sameUser = teamContainsUser(teamDoc, targetUserId);
        if (sameScope || !sameUser) {
            return {
                ok: false,
                message: sameScope
                    ? `Este Riot ID ya pertenece a otro equipo ${getTeamScopeLabel(teamDoc)} de este juego`
                    : 'Este Riot ID ya pertenece a otro equipo de este juego'
            };
        }
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
    if (!isValidObjectIdLike(userId)) return false;
    const notification = {
        ...payload,
        status: payload?.status || 'unread',
        isSaved: Boolean(payload?.isSaved),
        isArchived: Boolean(payload?.isArchived),
        createdAt: payload?.createdAt || new Date()
    };

    const result = await User.updateOne(
        { _id: userId },
        {
            $push: {
                notifications: {
                    $each: [notification],
                    $slice: -200
                }
            }
        }
    );

    return result?.modifiedCount > 0;
};
const resolveNotificationsForUser = async (userId, matcher) => {
    if (!userId || typeof matcher !== 'function') return;
    const user = await User.findById(userId).select('notifications');
    if (!user || !Array.isArray(user.notifications) || user.notifications.length === 0) return;

    let changed = false;
    user.notifications.forEach((note) => {
        if (!matcher(note)) return;
        if (note.status !== 'read') {
            note.status = 'read';
            changed = true;
        }
        if (!note.isArchived) {
            note.isArchived = true;
            changed = true;
        }
    });
    if (changed) {
        await user.save();
    }
};
const sameTeamMeta = (note, teamId) => String(note?.meta?.teamId || '') === String(teamId || '');
const resolveTeamInviteNotificationsForInvitee = async (userId, teamId) => (
    resolveNotificationsForUser(
        userId,
        (note) => sameTeamMeta(note, teamId) && String(note?.meta?.action || '') === 'team_invite'
    )
);
const resolveTeamInviteSentNotificationsByTarget = async (teamId, targetUserId) => {
    if (!teamId || !targetUserId) return;
    const owners = await User.find({
        notifications: {
            $elemMatch: {
                'meta.action': 'team_invite_sent',
                'meta.teamId': String(teamId),
                'meta.targetUserId': String(targetUserId)
            }
        }
    }).select('_id').lean();

    for (const owner of owners) {
        await resolveNotificationsForUser(
            owner?._id,
            (note) =>
                sameTeamMeta(note, teamId)
                && String(note?.meta?.action || '') === 'team_invite_sent'
                && String(note?.meta?.targetUserId || '') === String(targetUserId)
        );
    }
};
const resolveTeamJoinRequestNotification = async (userId, teamId, requestId) => (
    resolveNotificationsForUser(
        userId,
        (note) =>
            sameTeamMeta(note, teamId)
            && (
                String(note?.meta?.requestId || '') === String(requestId || '')
                || String(note?.meta?.action || '') === 'team_join_request'
            )
    )
);
const isValidObjectIdLike = (value = '') => /^[a-fA-F0-9]{24}$/.test(String(value));
const toIdArray = (value) => (
    Array.isArray(value)
        ? value.map((entry) => String(entry || '').trim()).filter(Boolean)
        : []
);

const UNIVERSITY_TEAM_LEVEL = 'universitario';
const resolveSlotRole = ({ team, slotType, slotIndex, explicitRole = '' }) => {
    const roleFromInput = String(explicitRole || '').trim();
    const normalizedType = String(slotType || '').trim();
    const index = Number(slotIndex);
    if (normalizedType === 'coach') {
        return roleFromInput || String(team?.roster?.coach?.role || '').trim() || 'Coach';
    }
    if (!['starters', 'subs'].includes(normalizedType)) return '';

    const roleFromRoster = String(team?.roster?.[normalizedType]?.[index]?.role || '').trim();
    if (roleFromRoster) return roleFromRoster;

    const roleTemplate = getSupportedGameRoles(team?.game);
    if (Number.isFinite(index) && index >= 0 && roleTemplate[index]) {
        return roleTemplate[index];
    }

    if (roleFromInput) return roleFromInput;
    if (!Number.isFinite(index) || index < 0) return '';
    return normalizedType === 'subs' ? `Suplente ${index + 1}` : `Titular ${index + 1}`;
};

const normalizeText = (value = '') =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
const isMlbbGame = (game) => isSupportedMlbbGame(game);
const isFilledRosterPlayer = (slot) => Boolean(
    slot && (slot.user || slot.nickname || slot.gameId || slot.region || slot.email || slot.role)
);
const validateCaptainRoleUniquenessInCreate = ({ roster = {}, captainUserId, leaderRole = '', isUniversityTeam = false }) => {
    if (isUniversityTeam) return { ok: true };

    const normalizedCaptainRole = normalizeText(leaderRole);
    if (!normalizedCaptainRole) return { ok: true };

    const starters = Array.isArray(roster?.starters) ? roster.starters : [];
    for (const slot of starters) {
        if (!isFilledRosterPlayer(slot)) continue;
        const isCaptainSlot = String(slot?.user || '') === String(captainUserId || '');
        if (isCaptainSlot) continue;
        if (normalizeText(slot?.role) === normalizedCaptainRole) {
            return {
                ok: false,
                message: 'En equipos no universitarios, el rol del capitán queda reservado y no puede repetirse en otro titular.'
            };
        }
    }
    return { ok: true };
};
const validateCaptainRoleReservationInTeam = (teamLike = {}) => {
    const isUniversity = Boolean(teamLike?.university?.isUniversityTeam) || isUniversityTeamLevel(teamLike?.teamLevel);
    if (isUniversity) return { ok: true };

    const captainId = String(teamLike?.captain || '');
    if (!captainId) return { ok: true };

    const starters = Array.isArray(teamLike?.roster?.starters) ? teamLike.roster.starters : [];
    const captainSlot = starters.find((slot) => String(slot?.user || '') === captainId);
    const captainRole = normalizeText(captainSlot?.role || '');
    if (!captainRole) return { ok: true };

    const duplicated = starters.some((slot) => {
        if (!isFilledRosterPlayer(slot)) return false;
        if (String(slot?.user || '') === captainId) return false;
        return normalizeText(slot?.role) === captainRole;
    });

    if (duplicated) {
        return {
            ok: false,
            message: 'En equipos no universitarios, el rol del capitán queda reservado y no puede repetirse en otro titular.'
        };
    }
    return { ok: true };
};
const normalizeUniversityText = (value = '') => String(value || '').trim();
const isUniversityTeamLevel = (value = '') => normalizeText(value).includes(UNIVERSITY_TEAM_LEVEL);
const getEmptyUniversityTeamSnapshot = () => ({
    isUniversityTeam: false,
    universityId: '',
    universityTag: '',
    universityName: '',
    region: '',
    campus: '',
    verifiedAt: null
});
const toUniversityTeamSnapshot = (university = {}) => ({
    isUniversityTeam: true,
    universityId: normalizeUniversityText(university?.universityId),
    universityTag: normalizeUniversityText(university?.universityTag),
    universityName: normalizeUniversityText(university?.universityName),
    region: normalizeUniversityText(university?.region),
    campus: normalizeUniversityText(university?.campus),
    verifiedAt: university?.verifiedAt || new Date()
});
const buildVerifiedUniversitySnapshot = async (userId) => {
    const user = await User.findById(userId).select('university');
    const university = user?.university || {};
    const universityId = normalizeUniversityText(university?.universityId);
    if (!university?.verified || !universityId) {
        return {
            ok: false,
            message: 'Para crear o gestionar un equipo universitario debes tener tu universidad verificada.'
        };
    }
    return { ok: true, snapshot: toUniversityTeamSnapshot(university) };
};
const ensureUniversityTeamConfigured = (teamLike = {}) => {
    const isUniversity = Boolean(teamLike?.university?.isUniversityTeam) || isUniversityTeamLevel(teamLike?.teamLevel);
    if (!isUniversity) {
        return { ok: true, isUniversity: false, universityId: '' };
    }
    const universityId = normalizeUniversityText(teamLike?.university?.universityId);
    if (!universityId) {
        return {
            ok: false,
            isUniversity: true,
            universityId: '',
            message: 'Este equipo universitario no tiene la universidad sincronizada. Sincronízala antes de agregar jugadores.'
        };
    }
    return { ok: true, isUniversity: true, universityId };
};
const ensureUserMatchesUniversityTeam = async (userId, expectedUniversityId) => {
    const user = await User.findById(userId).select('university');
    const university = user?.university || {};
    if (!user || !university?.verified || !normalizeUniversityText(university?.universityId)) {
        return {
            ok: false,
            message: 'Todos los jugadores del equipo universitario deben tener universidad verificada.'
        };
    }
    if (normalizeUniversityText(university.universityId) !== normalizeUniversityText(expectedUniversityId)) {
        return {
            ok: false,
            message: 'Todos los jugadores del equipo universitario deben pertenecer a la misma universidad.'
        };
    }
    return { ok: true, university };
};
const getUniversityRosterPlayers = (roster = {}) => {
    const starters = Array.isArray(roster?.starters) ? roster.starters.filter(isFilledRosterPlayer) : [];
    const subs = Array.isArray(roster?.subs) ? roster.subs.filter(isFilledRosterPlayer) : [];
    return [...starters, ...subs];
};
const validateUniversityTeamRoster = async (teamLike = {}, expectedUniversityId = '') => {
    const universityId = normalizeUniversityText(expectedUniversityId || teamLike?.university?.universityId);
    if (!universityId) {
        return { ok: false, message: 'El equipo universitario no tiene universidad vinculada.' };
    }
    const players = getUniversityRosterPlayers(teamLike?.roster || {});
    for (const player of players) {
        if (!player?.user) {
            return {
                ok: false,
                message: 'En equipos universitarios todos los jugadores del roster deben ser usuarios verificados de GlitchGang.'
            };
        }
        const universityCheck = await ensureUserMatchesUniversityTeam(player.user, universityId);
        if (!universityCheck.ok) return universityCheck;
    }
    return { ok: true };
};
const getMlbbRosterPlayers = (roster = {}) => {
    const starters = Array.isArray(roster?.starters) ? roster.starters.filter(isFilledRosterPlayer) : [];
    const subs = Array.isArray(roster?.subs) ? roster.subs.filter(isFilledRosterPlayer) : [];
    return [...starters, ...subs];
};

const isValorantGame = (game = '') => normalizeSupportedGameName(game) === 'Valorant';

const getRiotConnectionState = async (userId) => {
    const user = await User.findById(userId).select('connections.riot');
    return {
        verified: Boolean(user?.connections?.riot?.verified && user?.connections?.riot?.puuid),
        gameName: String(user?.connections?.riot?.gameName || '').trim(),
        tagLine: String(user?.connections?.riot?.tagLine || '').trim(),
        consentGranted: user?.connections?.riot?.products?.valorant?.consentGranted === true
    };
};

const buildRiotLinkRequirementMessage = (game = '', action = 'continuar') => {
    if (isValorantGame(game)) {
        return `Debes autorizar VALORANT con Riot Sign On en Conexiones para ${action}.`;
    }
    return `Debes vincular tu cuenta Riot en Conexiones para ${action}.`;
};

const requireRiotLinked = async (userId, game = '', action = 'continuar') => {
    const conn = await getRiotConnectionState(userId);
    if (!conn.verified) {
        return { ok: false, message: buildRiotLinkRequirementMessage(game, action), connection: conn };
    }
    if (isValorantGame(game) && conn.consentGranted !== true) {
        return { ok: false, message: buildRiotLinkRequirementMessage(game, action), connection: conn };
    }
    return { ok: true, message: '', connection: conn };
};

const ensureRiotPlayerMatchesLinkedUser = async (userId, gameName, tagLine, game = '') => {
    const linked = await requireRiotLinked(userId, game);
    if (!linked.ok) return linked;

    const expectedGameName = String(linked?.connection?.gameName || '').trim().toLowerCase();
    const expectedTagLine = String(linked?.connection?.tagLine || '').trim().toLowerCase();
    const actualGameName = String(gameName || '').trim().toLowerCase();
    const actualTagLine = String(tagLine || '').trim().toLowerCase();

    if (!actualGameName || !actualTagLine || actualGameName !== expectedGameName || actualTagLine !== expectedTagLine) {
        return { ok: false, message: 'El Riot ID del jugador no coincide con su cuenta Riot vinculada.' };
    }

    return { ok: true, message: '', connection: linked.connection };
};

const getMlbbConnectionState = async (userId) => {
    const user = await User.findById(userId).select('connections.mlbb');
    const status = normalizeMlbbVerificationStatus(
        user?.connections?.mlbb?.verificationStatus,
        user?.connections?.mlbb?.verified
    );
    return {
        status,
        playerId: String(user?.connections?.mlbb?.playerId || '').trim(),
        zoneId: String(user?.connections?.mlbb?.zoneId || '').trim()
    };
};

const requireMlbbLinked = async (userId) => {
    const conn = await getMlbbConnectionState(userId);
    return isMlbbVerifiedStatus(conn.status);
};

const validateMlbbIdentity = (playerId, zoneId) => {
    const pid = String(playerId || '').trim();
    const zid = String(zoneId || '').trim();
    if (!pid || !zid) {
        return { ok: false, message: 'Para Mobile Legends debes completar User ID y Zone ID.' };
    }
    if (!/^\d+$/.test(pid)) {
        return { ok: false, message: 'El User ID de Mobile Legends debe contener solo números.' };
    }
    if (!/^\d+$/.test(zid)) {
        return { ok: false, message: 'El Zone ID de Mobile Legends debe contener solo números.' };
    }
    return { ok: true };
};

const ensureMlbbPlayerMatchesLinkedUser = async (userId, playerId, zoneId) => {
    const conn = await getMlbbConnectionState(userId);
    if (!isMlbbVerifiedStatus(conn.status)) {
        return { ok: false, message: 'La cuenta MLBB del jugador no está verificada.' };
    }

    const pid = String(playerId || '').trim();
    const zid = String(zoneId || '').trim();
    if (pid !== conn.playerId || zid !== conn.zoneId) {
        return { ok: false, message: 'El User ID + Zone ID no coincide con la cuenta MLBB vinculada.' };
    }

    return { ok: true };
};

const buildMlbbLinkedPlayerPayload = async (userId, player = {}) => {
    const conn = await getMlbbConnectionState(userId);
    if (!isMlbbVerifiedStatus(conn.status)) {
        return { ok: false, message: 'La cuenta MLBB del jugador no está verificada.' };
    }

    return {
        ok: true,
        player: {
            ...player,
            user: userId,
            gameId: conn.playerId,
            region: conn.zoneId
        }
    };
};

const ensureMlbbIdNotInOtherTeam = async (game, playerId, zoneId, currentTeamId, options = {}) => {
    const { targetTeamLike = null, targetUserId = null } = options;
    const normalizedGame = normalizeSupportedGameName(game);
    if (!normalizedGame) {
        return { ok: false, message: 'Ese juego todavía no está soportado en GlitchGang.' };
    }
    const pid = String(playerId || '').trim();
    const zid = String(zoneId || '').trim();
    if (!pid || !zid) return { ok: true };
    const playerRegex = new RegExp(`^${escapeRegex(pid)}$`, 'i');
    const zoneRegex = new RegExp(`^${escapeRegex(zid)}$`, 'i');
    const query = {
        game: normalizedGame,
        _id: { $ne: currentTeamId },
        $or: [
            { 'roster.starters': { $elemMatch: { gameId: playerRegex, region: zoneRegex } } },
            { 'roster.subs': { $elemMatch: { gameId: playerRegex, region: zoneRegex } } },
            { 'roster.coach.gameId': playerRegex, 'roster.coach.region': zoneRegex }
        ]
    };
    const existingTeams = await Team.find(query)
        .select('_id name teamLevel university.isUniversityTeam captain roster.starters.user roster.subs.user roster.coach.user')
        .lean();
    if (!existingTeams.length) return { ok: true };

    const targetScope = targetTeamLike ? getTeamScopeKey(targetTeamLike) : null;
    for (const teamDoc of existingTeams) {
        if (!targetScope || !targetUserId) {
            return { ok: false, message: 'Este User ID + Zone ID de Mobile Legends ya pertenece a otro equipo de este juego' };
        }
        const existingScope = getTeamScopeKey(teamDoc);
        const sameScope = existingScope === targetScope;
        const sameUser = teamContainsUser(teamDoc, targetUserId);
        if (sameScope || !sameUser) {
            return {
                ok: false,
                message: sameScope
                    ? `Este User ID + Zone ID de Mobile Legends ya pertenece a otro equipo ${getTeamScopeLabel(teamDoc)} de este juego`
                    : 'Este User ID + Zone ID de Mobile Legends ya pertenece a otro equipo de este juego'
            };
        }
    }

    return { ok: true };
};

const validateMlbbRosterEntries = async (game, roster, currentTeamId, targetTeamLike = null) => {
    const players = getMlbbRosterPlayers(roster);
    const seenUsers = new Set();
    const seenIds = new Set();

    for (const player of players) {
        if (!player?.user) {
            return {
                ok: false,
                message: 'En equipos MLBB todos los jugadores del roster deben ser usuarios vinculados de GlitchGang.'
            };
        }

        const userKey = String(player.user);
        if (seenUsers.has(userKey)) {
            return { ok: false, message: 'No puedes repetir el mismo usuario en el roster MLBB.' };
        }
        seenUsers.add(userKey);

        const uniqueUser = await ensureUserNotInOtherTeam(game, player.user, currentTeamId, targetTeamLike);
        if (!uniqueUser.ok) return uniqueUser;

        const mlbbCheck = validateMlbbIdentity(player?.gameId, player?.region);
        if (!mlbbCheck.ok) return mlbbCheck;

        const mlbbMatch = await ensureMlbbPlayerMatchesLinkedUser(player.user, player?.gameId, player?.region);
        if (!mlbbMatch.ok) return mlbbMatch;

        const idKey = `${String(player?.gameId || '').trim()}::${String(player?.region || '').trim()}`;
        if (seenIds.has(idKey)) {
            return {
                ok: false,
                message: 'No puedes repetir el mismo User ID + Zone ID dentro del roster MLBB.'
            };
        }
        seenIds.add(idKey);

        const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
            game,
            player?.gameId,
            player?.region,
            currentTeamId,
            { targetTeamLike, targetUserId: player.user }
        );
        if (!mlbbUnique.ok) return mlbbUnique;
    }

    return { ok: true };
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
    const gn = String(gameName || '').trim();
    const tl = String(tagLine || '').trim();
    if (!gn || !tl) {
        return { ok: false, message: 'Riot ID inválido' };
    }
    try {
        if (!getRiotApiKey()) {
            return { ok: false, message: 'Riot API no configurada en el servidor.' };
        }
        await getRiotAccountByRiotId(gn, tl);
        return { ok: true };
    } catch (error) {
        if (error?.code === 'RIOT_KEY_MODE_RESTRICTED') {
            return {
                ok: false,
                message: 'La key Riot actual no está permitida en este entorno público. Usa una review URL controlada o una production key.'
            };
        }
        const status = Number(error?.response?.status || 0);
        if (status === 404) return { ok: false, message: 'Riot ID no válido' };
        if (status === 401 || status === 403) {
            return { ok: false, message: 'La Riot API key es inválida, expiró o no tiene permisos.' };
        }
        if (status === 429) {
            return { ok: false, message: 'Riot API rate limit alcanzado. Intenta otra vez en unos minutos.' };
        }
        return { ok: false, message: 'No se pudo validar la cuenta Riot en este momento.' };
    }
};

export const joinTeam = async (req, res) => {
    try {
        const { teamId, inviteCode, slotType, slotIndex, player } = req.body;
        const normalizedSlotType = ['starters', 'subs', 'coach'].includes(String(slotType || '').trim())
            ? String(slotType).trim()
            : 'starters';
        const parsedSlotIndex = Number(slotIndex);
        const normalizedSlotIndex = normalizedSlotType === 'coach'
            ? 0
            : (Number.isFinite(parsedSlotIndex) ? parsedSlotIndex : 0);
        const team = await Team.findById(teamId);
        let playerPayload = { ...player, user: req.userId };

        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (normalizedSlotType === 'starters' && Number.isFinite(Number(team.maxMembers)) && normalizedSlotIndex >= Number(team.maxMembers)) {
            return res.status(400).json({ message: "Slot fuera del límite de titulares" });
        }
        if (normalizedSlotType === 'subs' && Number.isFinite(Number(team.maxSubstitutes)) && normalizedSlotIndex >= Number(team.maxSubstitutes)) {
            return res.status(400).json({ message: "Slot fuera del límite de suplentes" });
        }
        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id, team);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (team?.university?.isUniversityTeam && normalizedSlotType !== 'coach') {
            const universityCheck = await ensureUserMatchesUniversityTeam(req.userId, team.university.universityId);
            if (!universityCheck.ok) return res.status(400).json({ message: universityCheck.message });
        }
        if (isSupportedRiotGame(team.game)) {
            const linked = await requireRiotLinked(req.userId, team.game, 'unirte a este equipo');
            if (!linked.ok) return res.status(400).json({ message: linked.message });
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotMatch = await ensureRiotPlayerMatchesLinkedUser(req.userId, player?.nickname, player?.gameId, team.game);
            if (!riotMatch.ok) return res.status(400).json({ message: riotMatch.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(
                team.game,
                player?.nickname,
                player?.gameId,
                team._id,
                { targetTeamLike: team, targetUserId: req.userId }
            );
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (isMlbbGame(team.game)) {
            const ok = await requireMlbbLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes verificar tu cuenta MLBB para unirte a este equipo" });
            const mlbbPlayer = await buildMlbbLinkedPlayerPayload(req.userId, playerPayload);
            if (!mlbbPlayer.ok) return res.status(400).json({ message: mlbbPlayer.message });
            playerPayload = mlbbPlayer.player;
            const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
                team.game,
                playerPayload?.gameId,
                playerPayload?.region,
                team._id,
                { targetTeamLike: team, targetUserId: req.userId }
            );
            if (!mlbbUnique.ok) return res.status(400).json({ message: mlbbUnique.message });
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
        playerPayload.role = resolveSlotRole({
            team,
            slotType: normalizedSlotType,
            slotIndex: normalizedSlotIndex,
            explicitRole: playerPayload?.role
        });
        const applied = applyRosterSlot(team, normalizedSlotType, normalizedSlotIndex, playerPayload);
        if (!applied.ok) return res.status(400).json({ message: applied.message });
        if (team?.university?.isUniversityTeam) {
            const universityRosterValidation = await validateUniversityTeamRoster(team, team.university.universityId);
            if (!universityRosterValidation.ok) return res.status(400).json({ message: universityRosterValidation.message });
        }
        if (isMlbbGame(team.game)) {
            const mlbbRosterValidation = await validateMlbbRosterEntries(team.game, team.roster, team._id, team);
            if (!mlbbRosterValidation.ok) return res.status(400).json({ message: mlbbRosterValidation.message });
        }
        const captainRoleReservation = validateCaptainRoleReservationInTeam(team);
        if (!captainRoleReservation.ok) return res.status(400).json({ message: captainRoleReservation.message });

        await team.save();
        await User.updateOne({ _id: req.userId }, { $addToSet: { teams: team._id } });
        await safeSyncTeamConversation(team);
        await pushNotification(team.captain, {
            type: 'team',
            category: 'team',
            title: 'Nuevo miembro',
            source: team.name,
            message: `${playerPayload.nickname} se unió a tu equipo.`,
            status: 'unread',
            visuals: { icon: 'bx-group', color: '#4facfe', glow: true }
        });
        await Promise.all([
            resolveTeamInviteNotificationsForInvitee(req.userId, team._id),
            resolveTeamInviteSentNotificationsByTarget(team._id, req.userId)
        ]);
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
        const universityTeamState = ensureUniversityTeamConfigured(team);
        if (!universityTeamState.ok && slotType !== 'coach') {
            return res.status(400).json({ message: universityTeamState.message });
        }

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

        let playerPayload = {
            ...player,
            user: player?.user || null
        };

        if (playerPayload?.user && userInRoster(team, playerPayload.user)) {
            return res.status(400).json({ message: 'Ese usuario ya pertenece al roster de este equipo' });
        }
        if (universityTeamState.isUniversity && slotType !== 'coach') {
            if (!playerPayload?.user) {
                return res.status(400).json({
                    message: 'En equipos universitarios no puedes agregar jugadores manuales sin usuario verificado.'
                });
            }
            const universityCheck = await ensureUserMatchesUniversityTeam(playerPayload.user, universityTeamState.universityId);
            if (!universityCheck.ok) return res.status(400).json({ message: universityCheck.message });
        }

        if (isSupportedRiotGame(team.game) && slotType !== 'coach') {
            if (!playerPayload?.user) {
                return res.status(400).json({
                    message: 'En equipos Riot no puedes agregar jugadores manuales sin usuario vinculado.'
                });
            }
            const linked = await requireRiotLinked(playerPayload.user, team.game, 'integrar este roster');
            if (!linked.ok) return res.status(400).json({ message: linked.message });
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotMatch = await ensureRiotPlayerMatchesLinkedUser(
                playerPayload.user,
                player?.nickname,
                player?.gameId,
                team.game
            );
            if (!riotMatch.ok) return res.status(400).json({ message: riotMatch.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(
                team.game,
                player?.nickname,
                player?.gameId,
                team._id,
                { targetTeamLike: team, targetUserId: playerPayload?.user || null }
            );
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (isMlbbGame(team.game)) {
            if (slotType !== 'coach') {
                if (!playerPayload?.user) {
                    return res.status(400).json({
                        message: 'En equipos MLBB no puedes agregar jugadores manuales sin usuario vinculado.'
                    });
                }
                const mlbbPlayer = await buildMlbbLinkedPlayerPayload(playerPayload.user, playerPayload);
                if (!mlbbPlayer.ok) return res.status(400).json({ message: mlbbPlayer.message });
                playerPayload = mlbbPlayer.player;

                const uniqueUser = await ensureUserNotInOtherTeam(team.game, playerPayload.user, team._id, team);
                if (!uniqueUser.ok) return res.status(400).json({ message: uniqueUser.message });
                const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
                    team.game,
                    playerPayload?.gameId,
                    playerPayload?.region,
                    team._id,
                    { targetTeamLike: team, targetUserId: playerPayload.user }
                );
                if (!mlbbUnique.ok) return res.status(400).json({ message: mlbbUnique.message });
            } else if (playerPayload?.user) {
                const uniqueUser = await ensureUserNotInOtherTeam(team.game, playerPayload.user, team._id, team);
                if (!uniqueUser.ok) return res.status(400).json({ message: uniqueUser.message });
            }
        }

        const applied = applyRosterSlot(team, slotType, slotIndex, playerPayload);
        if (!applied.ok) return res.status(400).json({ message: applied.message });
        if (team?.university?.isUniversityTeam) {
            const universityRosterValidation = await validateUniversityTeamRoster(team, team.university.universityId);
            if (!universityRosterValidation.ok) return res.status(400).json({ message: universityRosterValidation.message });
        }
        if (isMlbbGame(team.game)) {
            const mlbbRosterValidation = await validateMlbbRosterEntries(team.game, team.roster, team._id, team);
            if (!mlbbRosterValidation.ok) return res.status(400).json({ message: mlbbRosterValidation.message });
        }
        const captainRoleReservation = validateCaptainRoleReservationInTeam(team);
        if (!captainRoleReservation.ok) return res.status(400).json({ message: captainRoleReservation.message });

        await team.save();
        await safeSyncTeamConversation(team);
        return res.status(200).json({ message: "Jugador agregado", team });
    } catch (error) {
        return res.status(500).json({ message: "Error al agregar jugador", error: error.message });
    }
};

export const inviteFriendToTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { targetUserId, slotType, slotIndex, note } = req.body || {};

        if (!isValidObjectIdLike(teamId)) {
            return res.status(400).json({ message: 'Equipo inválido.' });
        }
        if (!isValidObjectIdLike(targetUserId)) {
            return res.status(400).json({ message: 'Debes seleccionar un amigo válido.' });
        }

        const normalizedSlotType = ['starters', 'subs', 'coach'].includes(String(slotType || '').trim())
            ? String(slotType).trim()
            : 'starters';

        const [team, actor, target] = await Promise.all([
            Team.findById(teamId),
            User.findById(req.userId).select('isAdmin fullName username followers following'),
            User.findById(targetUserId).select('fullName username privacy.allowTeamInvites')
        ]);

        if (!team) return res.status(404).json({ message: 'Equipo no encontrado.' });
        if (!actor) return res.status(401).json({ message: 'Sesión inválida.' });
        if (!target) return res.status(404).json({ message: 'Amigo no encontrado.' });
        if (String(target._id) === String(req.userId)) {
            return res.status(400).json({ message: 'No puedes invitarte a ti mismo.' });
        }

        const isCaptain = String(team.captain) === String(req.userId);
        const isAdmin = actor.isAdmin === true;
        if (!isCaptain && !isAdmin) {
            return res.status(403).json({ message: 'Solo el capitán o un admin puede invitar jugadores.' });
        }

        const targetId = String(target._id);
        const actorFollowing = new Set(toIdArray(actor?.following));
        const actorFollowers = new Set(toIdArray(actor?.followers));
        const isMutualFriend = actorFollowing.has(targetId) && actorFollowers.has(targetId);
        if (!isMutualFriend) {
            return res.status(403).json({
                message: 'Solo puedes invitar usuarios con seguimiento mutuo (amigos).'
            });
        }

        if (target?.privacy?.allowTeamInvites === false) {
            return res.status(403).json({ message: 'Este usuario no acepta invitaciones de equipo.' });
        }

        if (userInRoster(team, target._id)) {
            return res.status(400).json({ message: 'Ese usuario ya pertenece a este equipo.' });
        }

        const hasPendingJoinRequest = Array.isArray(team.joinRequests)
            ? team.joinRequests.some((request) =>
                String(request?.user || '') === String(target._id) && request?.status === 'pending')
            : false;
        if (hasPendingJoinRequest) {
            return res.status(409).json({ message: 'Ese usuario ya tiene una solicitud pendiente para este equipo.' });
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, target._id, team._id, team);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });

        const genderCheck = await canJoinByGender(team, target._id);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });

        if (team?.university?.isUniversityTeam && normalizedSlotType !== 'coach') {
            const universityCheck = await ensureUserMatchesUniversityTeam(target._id, team.university.universityId);
            if (!universityCheck.ok) return res.status(400).json({ message: universityCheck.message });
        }

        if (isSupportedRiotGame(team.game) && normalizedSlotType !== 'coach') {
            const riotLinked = await requireRiotLinked(target._id, team.game, 'recibir invitación para este equipo');
            if (!riotLinked.ok) {
                return res.status(400).json({
                    message: riotLinked.message
                });
            }
        }

        if (isMlbbGame(team.game) && normalizedSlotType !== 'coach') {
            const mlbbLinked = await requireMlbbLinked(target._id);
            if (!mlbbLinked) {
                return res.status(400).json({
                    message: 'Este usuario debe verificar su cuenta MLBB antes de recibir invitación para este equipo.'
                });
            }
        }

        const startersLimit = Number(team.maxMembers || 0);
        const subsLimit = Number(team.maxSubstitutes || 0);
        let resolvedSlotIndex = 0;

        if (normalizedSlotType === 'coach') {
            if (isSlotFilled(team?.roster?.coach)) {
                return res.status(400).json({ message: 'El slot de coach ya está ocupado.' });
            }
            resolvedSlotIndex = 0;
        } else {
            const maxForType = normalizedSlotType === 'starters' ? startersLimit : subsLimit;
            if (maxForType <= 0) {
                return res.status(400).json({
                    message: normalizedSlotType === 'subs'
                        ? 'Este equipo no tiene slots de suplentes.'
                        : 'Este equipo no tiene slots disponibles para titulares.'
                });
            }

            const requestedIndex = Number(slotIndex);
            resolvedSlotIndex = Number.isFinite(requestedIndex) ? requestedIndex : 0;
            if (resolvedSlotIndex < 0 || resolvedSlotIndex >= maxForType) {
                resolvedSlotIndex = 0;
            }

            const currentList = Array.isArray(team?.roster?.[normalizedSlotType]) ? team.roster[normalizedSlotType] : [];
            if (isSlotFilled(currentList[resolvedSlotIndex])) {
                const firstEmpty = findFirstEmptySlot(team, normalizedSlotType);
                if (firstEmpty === -1) {
                    return res.status(400).json({
                        message: normalizedSlotType === 'starters'
                            ? 'No hay slots libres de titulares para invitar.'
                            : 'No hay slots libres de suplentes para invitar.'
                    });
                }
                resolvedSlotIndex = firstEmpty;
            }
        }

        const slotHasPendingJoinRequest = Array.isArray(team.joinRequests)
            ? team.joinRequests.some((request) =>
                request?.status === 'pending'
                && String(request?.slotType || '') === normalizedSlotType
                && Number(request?.slotIndex) === Number(resolvedSlotIndex))
            : false;
        if (slotHasPendingJoinRequest) {
            return res.status(409).json({
                message: 'Ese slot ya tiene una solicitud pendiente. Resuélvela antes de invitar a otro jugador.'
            });
        }

        const slotHasPendingInvite = await User.findOne({
            notifications: {
                $elemMatch: {
                    category: 'team',
                    status: 'unread',
                    'meta.action': 'team_invite',
                    'meta.teamId': String(team._id),
                    'meta.slotType': normalizedSlotType,
                    'meta.slotIndex': Number(resolvedSlotIndex)
                }
            }
        }).select('_id').lean();
        if (slotHasPendingInvite) {
            return res.status(409).json({
                message: 'Ese slot ya tiene una invitación pendiente. Espera respuesta o cambia de slot.'
            });
        }

        const duplicateInvite = await User.findOne({
            _id: target._id,
            notifications: {
                $elemMatch: {
                    category: 'team',
                    status: 'unread',
                    'meta.action': 'team_invite',
                    'meta.teamId': String(team._id)
                }
            }
        }).select('_id').lean();
        if (duplicateInvite) {
            return res.status(409).json({ message: 'Este usuario ya tiene una invitación pendiente para este equipo.' });
        }

        const inviterName = actor.fullName || actor.username || 'Un capitán';
        const targetName = target.fullName || target.username || 'Jugador';
        const slotLabel = normalizedSlotType === 'coach'
            ? 'Coach'
            : `${normalizedSlotType === 'starters' ? 'Titular' : 'Suplente'} #${resolvedSlotIndex + 1}`;
        const slotRole = resolveSlotRole({
            team,
            slotType: normalizedSlotType,
            slotIndex: resolvedSlotIndex
        });
        const trimmedNote = String(note || '').trim().slice(0, 120);
        const noteSuffix = trimmedNote ? ` Nota: ${trimmedNote}` : '';

        await pushNotification(target._id, {
            type: 'team',
            category: 'team',
            title: 'Invitación de equipo',
            source: team.name,
            message: `${inviterName} te invitó a ${team.name} (${slotLabel}). Puedes aceptar directo desde Notificaciones o usar el código ${team.inviteCode}.${noteSuffix}`,
            status: 'unread',
            meta: {
                action: 'team_invite',
                teamId: String(team._id),
                teamName: team.name,
                teamCode: team.teamCode || '',
                inviteCode: team.inviteCode,
                slotType: normalizedSlotType,
                slotIndex: resolvedSlotIndex,
                slotRole,
                invitedBy: String(req.userId),
                invitedByName: inviterName,
                game: team.game,
                isUniversityTeam: Boolean(team?.university?.isUniversityTeam)
            },
            visuals: { icon: 'bx-user-plus', color: '#4facfe', glow: true }
        });

        await pushNotification(req.userId, {
            type: 'team',
            category: 'team',
            title: 'Invitación enviada',
            source: team.name,
            message: `Invitación enviada a ${targetName} para ${slotLabel}${slotRole ? ` · Rol ${slotRole}` : ''}.`,
            status: 'unread',
            meta: {
                action: 'team_invite_sent',
                teamId: String(team._id),
                teamName: team.name,
                teamCode: team.teamCode || '',
                targetUserId: String(target._id),
                targetName,
                slotType: normalizedSlotType,
                slotIndex: resolvedSlotIndex,
                slotRole,
                game: team.game
            },
            visuals: { icon: 'bx-send', color: '#8EDB15', glow: false }
        });

        return res.status(200).json({
            message: 'Invitación enviada por notificación.',
            invite: {
                teamId: String(team._id),
                targetUserId: String(target._id),
                slotType: normalizedSlotType,
                slotIndex: resolvedSlotIndex,
                slotRole
            }
        });
    } catch (error) {
        return res.status(500).json({ message: 'Error al enviar invitación.', error: error.message });
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

        await safeSyncTeamConversation(team);
        return res.status(200).json({ message: "Jugador removido", team });
    } catch (error) {
        return res.status(500).json({ message: "Error al remover jugador", error: error.message });
    }
};

export const requestJoinTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, player, inviteCode } = req.body;
        const normalizedSlotType = ['starters', 'subs', 'coach'].includes(String(slotType || '').trim())
            ? String(slotType).trim()
            : 'starters';
        const parsedSlotIndex = Number(slotIndex);
        const normalizedSlotIndex = normalizedSlotType === 'coach'
            ? 0
            : (Number.isFinite(parsedSlotIndex) ? parsedSlotIndex : 0);
        const team = await Team.findById(teamId);
        let requestPlayer = { ...player, user: req.userId };
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (normalizedSlotType === 'starters' && Number.isFinite(Number(team.maxMembers)) && normalizedSlotIndex >= Number(team.maxMembers)) {
            return res.status(400).json({ message: "Slot fuera del límite de titulares" });
        }
        if (normalizedSlotType === 'subs' && Number.isFinite(Number(team.maxSubstitutes)) && normalizedSlotIndex >= Number(team.maxSubstitutes)) {
            return res.status(400).json({ message: "Slot fuera del límite de suplentes" });
        }

        // Invite code verification
        if (!inviteCode || inviteCode !== team.inviteCode) {
            return res.status(401).json({ message: "Código de invitación incorrecto" });
        }

        const uniqueCheck = await ensureUserNotInOtherTeam(team.game, req.userId, team._id, team);
        if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
        const genderCheck = await canJoinByGender(team, req.userId);
        if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
        if (team?.university?.isUniversityTeam && normalizedSlotType !== 'coach') {
            const universityCheck = await ensureUserMatchesUniversityTeam(req.userId, team.university.universityId);
            if (!universityCheck.ok) return res.status(400).json({ message: universityCheck.message });
        }
        if (isSupportedRiotGame(team.game)) {
            const linked = await requireRiotLinked(req.userId, team.game, 'solicitar ingreso');
            if (!linked.ok) return res.status(400).json({ message: linked.message });
            const riotCheck = await validateRiotAccount(player?.nickname, player?.gameId);
            if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
            const riotMatch = await ensureRiotPlayerMatchesLinkedUser(req.userId, player?.nickname, player?.gameId, team.game);
            if (!riotMatch.ok) return res.status(400).json({ message: riotMatch.message });
            const riotUnique = await ensureRiotIdNotInOtherTeam(
                team.game,
                player?.nickname,
                player?.gameId,
                team._id,
                { targetTeamLike: team, targetUserId: req.userId }
            );
            if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
        }
        if (isMlbbGame(team.game)) {
            const ok = await requireMlbbLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes verificar tu cuenta MLBB para solicitar ingreso" });
            const mlbbPlayer = await buildMlbbLinkedPlayerPayload(req.userId, requestPlayer);
            if (!mlbbPlayer.ok) return res.status(400).json({ message: mlbbPlayer.message });
            requestPlayer = mlbbPlayer.player;
            const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
                team.game,
                requestPlayer?.gameId,
                requestPlayer?.region,
                team._id,
                { targetTeamLike: team, targetUserId: req.userId }
            );
            if (!mlbbUnique.ok) return res.status(400).json({ message: mlbbUnique.message });
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
        requestPlayer.role = resolveSlotRole({
            team,
            slotType: normalizedSlotType,
            slotIndex: normalizedSlotIndex,
            explicitRole: requestPlayer?.role
        });
        team.joinRequests.push({
            user: req.userId,
            slotType: normalizedSlotType,
            slotIndex: normalizedSlotIndex,
            player: requestPlayer,
            status: 'pending'
        });
        await team.save();

        // Build detailed message for captain
        const rolePart = requestPlayer?.role ? ` | Rol: ${requestPlayer.role}` : '';
        const regionPart = requestPlayer?.region ? ` | Región: ${requestPlayer.region}` : '';
        await pushNotification(team.captain, {
            type: 'team',
            category: 'team',
            title: 'Nueva solicitud de ingreso',
            source: team.name,
            message: `${requestPlayer?.nickname || 'Un jugador'} quiere unirse a tu equipo.${rolePart}${regionPart}`,
            status: 'unread',
            meta: {
                action: 'team_join_request',
                teamId: team._id,
                requestId: team.joinRequests[team.joinRequests.length - 1]?._id,
                applicant: {
                    nickname: requestPlayer?.nickname,
                    role: requestPlayer?.role,
                    region: requestPlayer?.region,
                    gameId: requestPlayer?.gameId,
                    email: requestPlayer?.email,
                    photo: requestPlayer?.photo || ''
                }
            },
            visuals: { icon: 'bx-user-plus', color: '#4facfe', glow: true }
        });
        await Promise.all([
            resolveTeamInviteNotificationsForInvitee(req.userId, team._id),
            resolveTeamInviteSentNotificationsByTarget(team._id, req.userId)
        ]);
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
        const handledRequestId = String(reqDoc?._id || requestId || '');

        if (action === 'approve') {
            const uniqueCheck = await ensureUserNotInOtherTeam(team.game, reqDoc.user, team._id, team);
            if (!uniqueCheck.ok) return res.status(400).json({ message: uniqueCheck.message });
            if (team?.university?.isUniversityTeam && reqDoc.slotType !== 'coach') {
                const universityCheck = await ensureUserMatchesUniversityTeam(reqDoc.user, team.university.universityId);
                if (!universityCheck.ok) return res.status(400).json({ message: universityCheck.message });
            }
            if (isSupportedRiotGame(team.game)) {
                const linked = await requireRiotLinked(reqDoc.user, team.game, 'integrar este equipo');
                if (!linked.ok) return res.status(400).json({ message: linked.message });
                const riotCheck = await validateRiotAccount(reqDoc.player?.nickname, reqDoc.player?.gameId);
                if (!riotCheck.ok) return res.status(400).json({ message: riotCheck.message });
                const riotMatch = await ensureRiotPlayerMatchesLinkedUser(
                    reqDoc.user,
                    reqDoc.player?.nickname,
                    reqDoc.player?.gameId,
                    team.game
                );
                if (!riotMatch.ok) return res.status(400).json({ message: riotMatch.message });
                const riotUnique = await ensureRiotIdNotInOtherTeam(
                    team.game,
                    reqDoc.player?.nickname,
                    reqDoc.player?.gameId,
                    team._id,
                    { targetTeamLike: team, targetUserId: reqDoc.user }
                );
                if (!riotUnique.ok) return res.status(400).json({ message: riotUnique.message });
            }
            if (isMlbbGame(team.game)) {
                const ok = await requireMlbbLinked(reqDoc.user);
                if (!ok) return res.status(400).json({ message: "El jugador debe verificar su cuenta MLBB" });
                const mlbbCheck = validateMlbbIdentity(reqDoc.player?.gameId, reqDoc.player?.region);
                if (!mlbbCheck.ok) return res.status(400).json({ message: mlbbCheck.message });
                const mlbbMatch = await ensureMlbbPlayerMatchesLinkedUser(reqDoc.user, reqDoc.player?.gameId, reqDoc.player?.region);
                if (!mlbbMatch.ok) return res.status(400).json({ message: mlbbMatch.message });
                const mlbbUnique = await ensureMlbbIdNotInOtherTeam(
                    team.game,
                    reqDoc.player?.gameId,
                    reqDoc.player?.region,
                    team._id,
                    { targetTeamLike: team, targetUserId: reqDoc.user }
                );
                if (!mlbbUnique.ok) return res.status(400).json({ message: mlbbUnique.message });
            }
            const genderCheck = await canJoinByGender(team, reqDoc.user);
            if (!genderCheck.ok) return res.status(400).json({ message: genderCheck.message });
            if (userInRoster(team, reqDoc.user)) {
                team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
                await team.save();
                return res.status(400).json({ message: "El jugador ya está en el equipo" });
            }
            reqDoc.player = reqDoc.player || {};
            reqDoc.player.role = resolveSlotRole({
                team,
                slotType: reqDoc.slotType,
                slotIndex: reqDoc.slotIndex,
                explicitRole: reqDoc.player?.role
            });
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
            if (isMlbbGame(team.game)) {
                const mlbbRosterValidation = await validateMlbbRosterEntries(team.game, team.roster, team._id, team);
                if (!mlbbRosterValidation.ok) return res.status(400).json({ message: mlbbRosterValidation.message });
            }
            if (team?.university?.isUniversityTeam) {
                const universityRosterValidation = await validateUniversityTeamRoster(team, team.university.universityId);
                if (!universityRosterValidation.ok) return res.status(400).json({ message: universityRosterValidation.message });
            }
            const captainRoleReservation = validateCaptainRoleReservationInTeam(team);
            if (!captainRoleReservation.ok) return res.status(400).json({ message: captainRoleReservation.message });
            await User.updateOne({ _id: reqDoc.user }, { $addToSet: { teams: team._id } });
            team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
        await pushNotification(reqDoc.user, {
            type: 'team',
            category: 'team',
            title: 'Solicitud aprobada',
            source: team.name,
            message: `Tu solicitud para unirte a ${team.name} fue aprobada.`,
            status: 'unread',
            meta: { teamId: team._id, requestId: handledRequestId, action: 'approve' },
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
                meta: { teamId: team._id, requestId: handledRequestId, action: 'reject' },
                visuals: { icon: 'bx-error-circle', color: '#ff6b6b', glow: false }
            });
        } else {
            return res.status(400).json({ message: "Acción inválida" });
        }

        const joinRequestOwners = Array.from(
            new Set([String(req.userId || ''), String(team?.captain || '')])
        ).filter(isValidObjectIdLike);
        await Promise.all([
            resolveTeamInviteNotificationsForInvitee(reqDoc.user, team._id),
            resolveTeamInviteSentNotificationsByTarget(team._id, reqDoc.user),
            ...joinRequestOwners.map((ownerId) =>
                resolveTeamJoinRequestNotification(ownerId, team._id, handledRequestId)
            )
        ]);

        await team.save();
        if (action === 'approve') {
            await safeSyncTeamConversation(team);
        }
        res.status(200).json({ message: "Solicitud actualizada", team });
    } catch (error) {
        console.error("Error al gestionar solicitud:", error);
        res.status(500).json({ message: "Error al gestionar solicitud", error: error.message });
    }
};

export const getTeams = async (req, res) => {
    try {
        const teams = await Team.find()
            .populate('captain', 'fullName avatar')
            .populate('community', 'name shortUrl')
            .sort({ createdAt: -1 });

        const supportedTeams = teams.filter((team) => isSupportedGameName(team?.game));

        for (const team of supportedTeams) {
            if (!team.teamCode) {
                await team.save();
            }
        }

        const neededUserIds = new Set();
        const collectUserId = (slot) => {
            const id = String(slot?.user || '').trim();
            if (id && !slot?.photo) neededUserIds.add(id);
        };

        supportedTeams.forEach((team) => {
            (team?.roster?.starters || []).forEach(collectUserId);
            (team?.roster?.subs || []).forEach(collectUserId);
            collectUserId(team?.roster?.coach);
        });

        let avatarMap = new Map();
        if (neededUserIds.size > 0) {
            const users = await User.find({ _id: { $in: Array.from(neededUserIds) } }).select('_id avatar');
            avatarMap = new Map(users.map((u) => [String(u._id), String(u.avatar || '').trim()]));
        }

        const fillSlotPhoto = (slot) => {
            if (!slot || slot.photo) return slot;
            const userId = String(slot.user || '').trim();
            const avatar = avatarMap.get(userId);
            if (!avatar) return slot;
            return { ...slot, photo: avatar };
        };

        const normalized = supportedTeams.map((teamDoc) => {
            const team = teamDoc.toObject();
            if (!team.roster) return team;
            team.roster.starters = (team.roster.starters || []).map(fillSlotPhoto);
            team.roster.subs = (team.roster.subs || []).map(fillSlotPhoto);
            team.roster.coach = fillSlotPhoto(team.roster.coach);
            return team;
        });

        res.status(200).json(normalized);
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

        const removeUserFromList = (list) => list.map((p) => (String(p?.user) === String(userId) ? null : p));
        if (Array.isArray(team.roster?.starters)) team.roster.starters = removeUserFromList(team.roster.starters);
        if (Array.isArray(team.roster?.subs)) team.roster.subs = removeUserFromList(team.roster.subs);
        if (team.roster?.coach && String(team.roster.coach.user) === String(userId)) team.roster.coach = null;

        await team.save();
        await User.updateOne({ _id: userId }, { $pull: { teams: teamId } });
        await safeSyncTeamConversation(team);
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
            'name','slogan','category','game','teamGender','teamCountry','teamLevel','teamLanguage',
            'community','sponsor'
        ];
        allowed.forEach((key) => {
            if (data[key] !== undefined) team[key] = data[key];
        });

        const wantsUniversityTeam = isUniversityTeamLevel(team.teamLevel);
        if (wantsUniversityTeam && !isUniversityGameAllowed(team.game)) {
            return res.status(400).json({
                message: 'Los equipos universitarios solo pueden competir en juegos de Riot o Mobile Legends.'
            });
        }
        if (wantsUniversityTeam) {
            const universityResult = await buildVerifiedUniversitySnapshot(team.captain);
            if (!universityResult.ok) {
                return res.status(400).json({ message: universityResult.message });
            }
            team.university = universityResult.snapshot;
            const universityRosterValidation = await validateUniversityTeamRoster(team, team.university.universityId);
            if (!universityRosterValidation.ok) {
                return res.status(400).json({ message: universityRosterValidation.message });
            }
        } else {
            team.university = getEmptyUniversityTeamSnapshot();
        }

        await team.save();
        await safeSyncTeamConversation(team);
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
        const logoPath = `/uploads/teams/${req.file.filename}`;
        team.logo = logoPath;
        await team.save();
        await safeSyncTeamConversation(team);
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
        await safeDeleteTeamConversation(teamId);

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
        for (const teamData of DEMO_TEAMS.filter((team) => isSupportedGameName(team?.game))) {
            const team = new Team({
                ...teamData,
                game: normalizeSupportedGameName(teamData.game),
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
        let phantom = await User.findOne({ email: 'phantom_captain@glitchgang.demo' });
        if (!phantom) {
            phantom = await User.findOne({ username: /^PhantomCaptain/i });
        }
        if (!phantom) {
            const hashedPw = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
            phantom = await User.create({
                username: 'PhantomCaptain_' + Date.now(),
                email: 'phantom_captain@glitchgang.demo',
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
        for (const teamData of THIRD_PARTY_TEAMS.filter((team) => isSupportedGameName(team?.game))) {
            const team = new Team({
                ...teamData,
                game: normalizeSupportedGameName(teamData.game),
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
