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
    category: { type: String, default: '' },
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
    prizeMode: {
        type: String,
        enum: ['none', 'money', 'items', 'mixed'],
        default: 'none'
    },
    prizeDetails: { type: String, default: '' },
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
    timezone: { type: String, default: 'America/Santo_Domingo' },
    registrationWindow: {
        start: { type: Date, default: null },
        end: { type: Date, default: null }
    },
    checkInWindow: {
        start: { type: Date, default: null },
        end: { type: Date, default: null }
    },
    eligibility: {
        minAge: { type: Number, default: 13 },
        allowedCountries: { type: [String], default: ['Global'] },
        notes: { type: String, default: '' }
    },
    contact: {
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        discordInvite: { type: String, default: '' }
    },
    broadcast: {
        streamUrl: { type: String, default: '' },
        streamLanguage: { type: String, default: 'es' }
    },
    matchConfig: {
        seriesType: { type: String, default: 'BO3' },
        mapPool: { type: [String], default: [] },
        patchVersion: { type: String, default: '' }
    },
    legalCompliance: {
        jurisdiction: { type: String, default: '' },
        governingLaw: { type: String, default: '' },
        claimsContact: { type: String, default: '' },
        rulesAccepted: { type: Boolean, default: false },
        privacyAccepted: { type: Boolean, default: false },
        organizerDeclaration: { type: Boolean, default: false }
    },
    publicSettings: {
        visibility: {
            type: String,
            enum: ['public', 'unlisted', 'private'],
            default: 'public'
        },
        showPrize: { type: Boolean, default: true },
        showSponsors: { type: Boolean, default: true },
        showRules: { type: Boolean, default: true },
        showSchedule: { type: Boolean, default: true },
        showContact: { type: Boolean, default: true },
        showTeams: { type: Boolean, default: false },
        showBracket: { type: Boolean, default: true },
        customMessage: { type: String, default: '' }
    },
    bracket: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

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
        teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
        teamName: { type: String, required: true },
        logoUrl: { type: String, default: '' },
        captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        teamMeta: {
            category: String,
            teamCountry: String,
            teamLevel: String,
            coach: String
        },
        roster: {
            starters: [{
                nickname: String,
                gameId: String,
                region: String,
                role: String,
                riotId: String
            }],
            subs: [{
                nickname: String,
                gameId: String,
                region: String,
                role: String,
                riotId: String
            }]
        },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
        registeredAt: { type: Date, default: Date.now }
    }],

    bracket: {
        format: {
            type: String,
            enum: ['single_elimination', 'double_elimination', 'swiss', 'round_robin'],
            default: 'single_elimination'
        },
        seedingMode: {
            type: String,
            enum: ['random', 'custom'],
            default: 'random'
        },
        size: { type: Number, default: 0 },
        isProvisional: { type: Boolean, default: false },
        generatedAt: Date,
        rounds: [{
            round: Number,
            name: String,
            matches: [{
                matchId: String,
                teamA: {
                    refId: String,
                    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
                    registrationId: { type: mongoose.Schema.Types.ObjectId, default: null },
                    teamName: String,
                    logoUrl: String,
                    seed: Number,
                    isBye: { type: Boolean, default: false },
                    isPlaceholder: { type: Boolean, default: false }
                },
                teamB: {
                    refId: String,
                    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
                    registrationId: { type: mongoose.Schema.Types.ObjectId, default: null },
                    teamName: String,
                    logoUrl: String,
                    seed: Number,
                    isBye: { type: Boolean, default: false },
                    isPlaceholder: { type: Boolean, default: false }
                },
                winnerRefId: { type: String, default: '' },
                winnerTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
                scoreA: { type: Number, default: null },
                scoreB: { type: Number, default: null },
                status: {
                    type: String,
                    enum: ['pending', 'ready', 'walkover', 'live', 'finished'],
                    default: 'pending'
                },
                confirmationStatus: {
                    type: String,
                    enum: ['unconfirmed', 'agreed', 'disputed', 'resolved'],
                    default: 'unconfirmed'
                },
                resultSubmissions: [{
                    side: {
                        type: String,
                        enum: ['A', 'B'],
                        required: true
                    },
                    winnerRefId: String,
                    scoreA: { type: Number, default: null },
                    scoreB: { type: Number, default: null },
                    submittedBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'User',
                        default: null
                    },
                    submittedAt: { type: Date, default: Date.now }
                }],
                resolvedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    default: null
                },
                resolvedAt: Date,
                nextMatchId: { type: String, default: '' },
                nextSlot: {
                    type: String,
                    enum: ['', 'A', 'B'],
                    default: ''
                },
                loserNextMatchId: { type: String, default: '' },
                loserNextSlot: {
                    type: String,
                    enum: ['', 'A', 'B'],
                    default: ''
                }
            }]
        }]
    }

}, { timestamps: true });


// Virtual para formato de cupos (Ej: 12/32)
tournamentSchema.virtual('slotsFormatted').get(function () {
    return `${this.currentSlots}/${this.maxSlots}`;
});

export default mongoose.model('Tournament', tournamentSchema);
