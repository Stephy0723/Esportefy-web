import Tournament from '../models/Tournament.js';
import Registration from '../models/Registration.js';

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





// Nuevo controlador para registrar un equipo en un torneo
export const registerToTournament = async (req, res) => {
    try {
        const { tournamentId, teamName, players } = req.body;
        const userId = req.userId; // Viene del verifyToken

        // 1. Buscar el torneo y verificar existencia
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ message: "Torneo no encontrado" });
        }

        // 2. VALIDACIÓN DE LÍMITES: ¿Hay slots disponibles?
        if (tournament.currentSlots >= tournament.maxSlots) {
            return res.status(400).json({ 
                message: "Lo sentimos, el torneo ya está lleno (cupos agotados)." 
            });
        }

        // 3. (Opcional) Verificar si el usuario ya está inscrito
        const alreadyRegistered = await Registration.findOne({ 
            tournament: tournamentId, 
            captain: userId 
        });
        if (alreadyRegistered) {
            return res.status(400).json({ message: "Ya estás inscrito en este torneo." });
        }

        // 4. Crear la inscripción
        const newRegistration = new Registration({
            tournament: tournamentId,
            captain: userId,
            teamName,
            players
        });

        await newRegistration.save();

        // 5. ACTUALIZAR SLOTS EN EL TORNEO (+1)
        tournament.currentSlots += 1;
        await tournament.save();

        res.status(201).json({ 
            message: "¡Inscripción exitosa!", 
            registration: newRegistration 
        });

    } catch (error) {
        console.error("Error al registrar equipo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};
export const getTournamentById = async (req, res) => {
    try {
        const { id } = req.params;
        const tournament = await Tournament.findById(id).populate('organizer', 'username avatar');
        if (!tournament) {
            return res.status(404).json({ message: "Torneo no encontrado" });
        }
        res.status(200).json(tournament);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el torneo" });
    }
};
export const deleteTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId; // ID del usuario desde el verifyToken

        // 1. Buscar el torneo
        const tournament = await Tournament.findById(id);

        if (!tournament) {
            return res.status(404).json({ message: "Torneo no encontrado" });
        }

        // 2. SEGURIDAD: Verificar que el que intenta borrar sea el dueño
        // Convertimos a String para comparar correctamente los ObjectIds
        if (tournament.organizer.toString() !== userId) {
            return res.status(403).json({ 
                message: "Acceso denegado. No tienes permisos para eliminar este torneo." 
            });
        }

        // 3. (Opcional) Validar si el torneo ya empezó
        if (tournament.status === 'in_progress' || tournament.status === 'finished') {
            return res.status(400).json({ 
                message: "No se puede eliminar un torneo que ya está en curso o finalizado." 
            });
        }

        // 4. ELIMINACIÓN EN CASCADA
        // Borramos todas las inscripciones ligadas a este torneo
        await Registration.deleteMany({ tournament: id });

        // Borramos el torneo
        await Tournament.findByIdAndDelete(id);

        res.status(200).json({ message: "Torneo e inscripciones eliminadas correctamente." });

    } catch (error) {
        console.error("Error al eliminar torneo:", error);
        res.status(500).json({ message: "Error interno al procesar la eliminación." });
    }
};