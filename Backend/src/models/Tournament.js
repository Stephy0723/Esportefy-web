import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'El título del torneo es obligatorio'],
        trim: true
    },
    game: {
        type: String,
        required: [true, 'El juego es obligatorio'],
        // Puedes añadir una lista de juegos permitidos (enum) si lo deseas
    },
    date: {
        type: Date,
        required: [true, 'La fecha es obligatoria']
    },
    time: {
        type: String, // Ejemplo: "18:00"
        required: [true, 'La hora es obligatoria']
    },
    prize: {
        type: String, // Usamos String para permitir formatos como "$50,000" o "2M"
        required: [true, 'El premio es obligatorio']
    },
    entry: {
        type: String, // Ejemplo: "Gratis" o "$50"
        default: 'Gratis'
    },
    maxSlots: {
        type: Number,
        required: [true, 'El número total de cupos es obligatorio']
    },
    currentSlots: {
        type: Number,
        default: 0
    },
    image: {
        type: String,
        default: '' // URL de la imagen del torneo
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo de Usuario
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'finished', 'cancelled'],
        default: 'open'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Crea createdAt y updatedAt automáticamente
});

// Virtual para mostrar el formato "12/16" como en tu frontend
tournamentSchema.virtual('slotsFormatted').get(function() {
    return `${this.currentSlots}/${this.maxSlots}`;
});

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;