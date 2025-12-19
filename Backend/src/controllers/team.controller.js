// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import crypto from "crypto";

export const createTeam = async (req, res) => {
    try {
        const { name, description, game, maxMembers, isPrivate } = req.body;
        
        // El capitán es el usuario autenticado (ID viene del middleware de auth)
        const team = await Team.create({
            name,
            description,
            game,
            maxMembers,
            isPrivate,
            captain: req.userId,
            members: [req.userId], // El capitán es el primer miembro
            joinCode: isPrivate ? crypto.randomBytes(3).toString('hex').toUpperCase() : null
        });

        res.status(201).json(team);
    } catch (error) {
        res.status(500).json({ message: "Error al crear equipo", error: error.message });
    }
};

export const joinTeam = async (req, res) => {
    try {
        const { teamId, joinCode } = req.body;
        const team = await Team.findById(teamId);

        if (!team) return res.status(404).json({ message: "Equipo no encontrado" });
        if (team.members.length >= team.maxMembers) return res.status(400).json({ message: "Equipo lleno" });
        if (team.isPrivate && team.joinCode !== joinCode) return res.status(401).json({ message: "Código incorrecto" });
        if (team.members.includes(req.userId)) return res.status(400).json({ message: "Ya estás en este equipo" });

        team.members.push(req.userId);
        await team.save();

        res.status(200).json({ message: "Te has unido al equipo", team });
    } catch (error) {
        res.status(500).json({ message: "Error al unirse al equipo" });
    }
};

export const getTeams = async (req, res) => {
    try {
        // Hacemos populate tanto al capitán como al array de miembros
        const teams = await Team.find()
            .populate('captain', 'fullName') // Trae el nombre del capitán
            .populate('members', 'fullName'); // Trae los nombres de todos los miembros
            
        res.status(200).json(teams);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los equipos", error: error.message });
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

        // Filtrar al usuario fuera del array de miembros
        team.members = team.members.filter(member => member.toString() !== userId);
        
        await team.save();

        res.status(200).json({ message: "Has abandonado el equipo correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al abandonar el equipo", error: error.message });
    }
};