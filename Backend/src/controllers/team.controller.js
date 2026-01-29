// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import User from "../models/User.js";
import crypto from "crypto";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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

        const rosterData = parsedRoster || { starters: [], subs: [], coach: null };
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
            inviteLink: `http://localhost:3000/join/${savedTeam.inviteCode}`
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

const applyRosterSlot = (team, slotType, slotIndex, player) => {
    if (!team.roster) team.roster = { starters: [], subs: [], coach: null };
    if (slotType === 'coach') {
        if (team.roster.coach) return { ok: false, message: 'El slot de coach ya está ocupado' };
        team.roster.coach = player;
        return { ok: true };
    }
    if (!['starters', 'subs'].includes(slotType)) {
        return { ok: false, message: 'Slot inválido' };
    }
    const list = Array.isArray(team.roster[slotType]) ? team.roster[slotType] : [];
    const idx = Number(slotIndex);
    if (Number.isNaN(idx) || idx < 0) return { ok: false, message: 'Índice inválido' };
    if (list[idx]) return { ok: false, message: 'Ese slot ya está ocupado' };
    list[idx] = player;
    team.roster[slotType] = list;
    return { ok: true };
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

export const joinTeam = async (req, res) => {
    try {
        const { teamId, inviteCode, slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);

        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (RIOT_GAMES.has(team.game)) {
            const ok = await requireRiotLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes vincular tu cuenta Riot para unirte a este equipo" });
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
        res.status(200).json({ message: "Te has unido al equipo", team });
    } catch (error) {
        res.status(500).json({ message: "Error al unirse al equipo" });
    }
};

export const requestJoinTeam = async (req, res) => {
    try {
        const { teamId } = req.params;
        const { slotType, slotIndex, player } = req.body;
        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (RIOT_GAMES.has(team.game)) {
            const ok = await requireRiotLinked(req.userId);
            if (!ok) return res.status(400).json({ message: "Debes vincular tu cuenta Riot para solicitar ingreso" });
        }
        if (userInRoster(team, req.userId)) {
            return res.status(400).json({ message: "Ya estás en este equipo" });
        }
        if (!player?.nickname) {
            return res.status(400).json({ message: "Nickname requerido" });
        }
        team.joinRequests = team.joinRequests || [];
        team.joinRequests.push({
            user: req.userId,
            slotType,
            slotIndex: Number(slotIndex) || 0,
            player: { ...player, user: req.userId },
            status: 'pending'
        });
        await team.save();
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

        if (action === 'approve') {
            if (RIOT_GAMES.has(team.game)) {
                const ok = await requireRiotLinked(reqDoc.user);
                if (!ok) return res.status(400).json({ message: "El jugador debe vincular su cuenta Riot" });
            }
            if (userInRoster(team, reqDoc.user)) {
                team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
                await team.save();
                return res.status(400).json({ message: "El jugador ya está en el equipo" });
            }
            const applied = applyRosterSlot(team, reqDoc.slotType, reqDoc.slotIndex, reqDoc.player || {});
            if (!applied.ok) return res.status(400).json({ message: applied.message });
            team.joinRequests = team.joinRequests.filter(r => String(r._id) !== String(requestId));
            await pushNotification(reqDoc.user, {
                type: 'team',
                category: 'team',
                title: 'Solicitud aprobada',
                source: team.name,
                message: `Tu solicitud para unirte a ${team.name} fue aprobada.`,
                status: 'unread',
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
        res.status(200).json({ message: "Has abandonado el equipo correctamente" });
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
