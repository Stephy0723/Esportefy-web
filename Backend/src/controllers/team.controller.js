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

        const newTeam = new Team({
            ...parsedFormData,
            logo: logoPath,
            roster: parsedRoster,
            captain: req.userId,
            members: [req.userId],
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