// Backend/src/controllers/team.controller.js

import Team from "../models/Team.js";
import crypto from "crypto";

export const createTeam = async (req, res) => {
    try {
        // Extraemos todo lo que viene del CreateTeamPage.jsx
        const { formData, roster, logoPreview } = req.body;

        const newTeam = new Team({
            ...formData,
            logo: logoPreview,
            roster: roster,
            captain: req.userId, // Viene de tu middleware de auth
            inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase()
        });

        const savedTeam = await newTeam.save();
        
        res.status(201).json({
            message: "Equipo creado con éxito",
            team: savedTeam,
            inviteLink: `http://localhost:3000/join/${savedTeam.inviteCode}`
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al crear el equipo", error });
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

        // Filtrar al usuario fuera del array de miembros
        team.members = team.members.filter(member => member.toString() !== userId);
        
        await team.save();

        res.status(200).json({ message: "Has abandonado el equipo correctamente" });
    } catch (error) {
        res.status(500).json({ message: "Error al abandonar el equipo", error: error.message });
    }
};