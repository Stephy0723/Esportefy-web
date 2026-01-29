import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import fs from 'fs';

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


        const savedTournament = await newTournament.save();
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
        const { teamName, logoUrl, roster } = req.body || {};

        if (!teamName || !String(teamName).trim()) {
            return res.status(400).json({ message: 'Nombre de equipo requerido' });
        }

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

        const alreadyRegistered = (tournament.registrations || []).some(r => String(r.captain) === String(req.userId));
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Ya registraste un equipo en este torneo' });
        }

        const starters = Array.isArray(roster?.starters) ? roster.starters.filter(Boolean) : [];
        const subs = Array.isArray(roster?.subs) ? roster.subs.filter(Boolean) : [];

        tournament.registrations = tournament.registrations || [];
        tournament.registrations.push({
            teamName: String(teamName).trim(),
            logoUrl: logoUrl || '',
            captain: req.userId,
            roster: { starters, subs },
            status: 'pending'
        });

        tournament.currentSlots = Math.min(tournament.currentSlots + 1, tournament.maxSlots);
        await tournament.save();

        return res.status(200).json({ message: 'Equipo registrado', tournamentId: tournament.tournamentId });

    } catch (error) {
        console.error("Error al registrar equipo:", error);
        res.status(500).json({ message: "Error interno del servidor", error: error.message });
    }
};
