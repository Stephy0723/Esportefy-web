import Tournament from '../models/Tournament.js';

export const createTournament = async (req, res) => {
    try {
        const { title, game, date, time, prize, entry, maxSlots, description, image } = req.body;

        const newTournament = new Tournament({
            title,
            game,
            date,
            time,
            prize,
            entry,
            maxSlots,
            description,
            image,
            organizer: req.userId // ID extraído del token por el middleware verifyToken
        });

        const savedTournament = await newTournament.save();
        res.status(201).json(savedTournament);
    } catch (error) {
        console.error("Error al crear torneo:", error);
        res.status(500).json({ message: "Error al crear el torneo", error: error.message });
    }
};

export const getTournaments = async (req, res) => {
    try {
        const tournaments = await Tournament.find().populate('organizer', 'username avatar');
        res.status(200).json(tournaments);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener torneos" });
    }
};