import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
    tournamentId: {
        type: String,
        unique: true,
        uppercase: true
    },
    gender: {
        type: String,
        enum: ['Masculino', 'Femenino', 'Mixto'],
        default: 'Mixto'
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    game: { type: String, required: true },
    modality: { type: String }, // Ej: 5v5, 1v1
    platform: { type: String, default: 'PC' },
    server: String,
    format: { type: String, default: 'Eliminación Directa' },
    date: { type: Date, required: true },
    time: { type: String, required: true },

    // Premios y Economía
    prizePool: String,
    currency: { type: String, default: 'USD' },
    prizesByRank: {
        first: String,
        second: String,
        third: String
    },
    entryFee: { type: String, default: 'Gratis' },

    // Cupos y Gestión
    maxSlots: { type: Number, required: true },
    currentSlots: { type: Number, default: 0 },
    checkInTime: Number,

    // Archivos (Rutas guardadas por Multer)
    bannerImage: { type: String, default: '' },
    rulesPdf: { type: String, default: '' },

    // Sponsors y Staff (Arrays de Objetos)
    sponsors: [{
        name: String,
        logoUrl: String,
        link: String,
        tier: String
    }],
    staff: {
        moderators: [String],
        casters: [String]
    },

    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'open', 'ongoing', 'finished', 'cancelled'],
        default: 'open'
    },

    registrationClosed: {
        type: Boolean,
        default: false
    },

    riotRequirements: {
    required: { type: Boolean, default: false },

    minTier: {
        type: String,
        enum: [
            'IRON', 'BRONZE', 'SILVER', 'GOLD',
            'PLATINUM', 'DIAMOND', 'MASTER',
            'GRANDMASTER', 'CHALLENGER'
        ]
    },

    maxTier: {
        type: String,
        enum: [
            'IRON', 'BRONZE', 'SILVER', 'GOLD',
            'PLATINUM', 'DIAMOND', 'MASTER',
            'GRANDMASTER', 'CHALLENGER'
        ]
    },

    soloQueueOnly: { type: Boolean, default: true }
}

,
    registrations: [{
        teamName: { type: String, required: true },
        logoUrl: { type: String, default: '' },
        captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        roster: {
            starters: [String],
            subs: [String]
        },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        registeredAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });


// Virtual para formato de cupos (Ej: 12/32)
tournamentSchema.virtual('slotsFormatted').get(function () {
    return `${this.currentSlots}/${this.maxSlots}`;
});

export default mongoose.model('Tournament', tournamentSchema);
