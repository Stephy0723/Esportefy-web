// Backend/src/models/User.js

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    // --- Identidad Visual ---
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    isOrganizer: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },


    // --- Etapa 1: Datos Personales ---
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['Masculino', 'Femenino', 'Otro'], default: 'Otro' },
    country: { type: String, required: true },
    birthDate: { type: Date, required: true },

    // --- Etapa 2: Gaming Core ---
    selectedGames: { type: [String], default: [] }, // Cambiado a default [] para evitar errores de .map()

    // --- Etapa 3: Perfil Pro ---
    experience: { type: [String], default: [] },
    platforms: { type: [String], default: [] },
    goals: { type: [String], default: [] },

    // --- Etapa 4: Credenciales ---
    username: { type: String, required: true, unique: true }, // unique para que no se repitan gamertags
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    checkTerms: { type: Boolean, required: true },

    // -- Seguridad y Recuperación ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // -- Datos visuales ---
    status: {
            type: String,
            enum: ['online', 'gaming', 'tournament', 'streaming', 'searching', 'afk', 'dnd', 'offline'],
            default: 'online'
            },

    selectedFrameId: {
            type: String,
            default: null
            },

    selectedBgId: {
            type: String,
            default: null
            },

    selectedTagId: {
            type: String,
            default: null
            },
 
    // --- SETTINGS ---
    connections: {
        discord: {
            id: { type: String },
            username: { type: String },
            verified: { type: Boolean, default: false }
        },

        microsoft: {
            tenantId: { type: String, default: '' },
            userId: { type: String, default: '' },
            email: { type: String, default: '' },
            displayName: { type: String, default: '' },
            verified: { type: Boolean, default: false },
            linkedAt: { type: Date, default: null }
        },

        riot: {
            puuid: String,
            gameName: String,
            tagLine: String,

            accountRegion: { type: String, default: 'americas' }, // para account-v1
            verified: { type: Boolean, default: false },
            linkedAt: Date,

            // seguridad / verificación por OTP
            pendingLink: {
                otpHash: String,
                expiresAt: Date,
                puuid: String,
                gameName: String,
                tagLine: String,
                attempts: { type: Number, default: 0 },
                lastSentAt: Date
            }
        },

        mlbb: {
            playerId: { type: String },
            zoneId: { type: String },
            ign: { type: String },
            verificationStatus: {
                type: String,
                enum: ['unlinked', 'pending', 'verified', 'verified_auto', 'verified_manual', 'rejected'],
                default: 'unlinked'
            },
            verified: { type: Boolean, default: false },
            linkedAt: Date,
            reviewRequestedAt: Date,
            reviewedAt: Date,
            reviewedBy: { type: String },
            rejectReason: { type: String, default: '' },
            linkAttempts: { type: [Date], default: [] },
            riskFlags: { type: [String], default: [] }
        }
    },

    gameProfiles: {
        lol: {
            exists: { type: Boolean, default: false },
            platformRegion: { type: String, default: '' }, // la1/na1/euw1 etc
            summonerId: String,
            profileIconId: Number,
            summonerLevel: Number,
            rank: {
                tier: String,
                division: String,
                lp: Number
            },
            lastSyncAt: Date
        },

        valorant: {
            exists: { type: Boolean, default: false },
            shard: { type: String, default: '' }, // na / latam / br / eu / ap / kr (depende del API)
            rank: {
                tier: String,
                rr: Number
            },
            lastSyncAt: Date
        },
        steam: {
            steamId: { type: String },
            verified: { type: Boolean, default: false }
        }
    },
    
    privacy: {
        allowTeamInvites: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        allowTournamentInvites: { type: Boolean, default: true }
    },
    university: {
        universityId: { type: String, default: '' },
        universityTag: { type: String, default: '' },
        universityName: { type: String, default: '' },
        region: { type: String, default: '' },
        city: { type: String, default: '' },
        campus: { type: String, default: '' },
        studentId: { type: String, default: '' },
        program: { type: String, default: '' },
        academicLevel: { type: String, default: '' },
        institutionalEmail: { type: String, default: '' },
        verificationSource: {
            type: String,
            enum: ['none', 'manual', 'microsoft'],
            default: 'none'
        },
        verificationStatus: {
            type: String,
            enum: ['unlinked', 'pending', 'verified', 'rejected'],
            default: 'unlinked'
        },
        verified: { type: Boolean, default: false },
        tenantId: { type: String, default: '' },
        appliedAt: { type: Date, default: null },
        verifiedAt: { type: Date, default: null },
        reviewedAt: { type: Date, default: null },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        rejectReason: { type: String, default: '' }
    },
    notifications: [{
        type: { type: String, default: 'info' },
        category: { type: String, default: 'system' },
        title: String,
        source: { type: String, default: 'Sistema' },
        message: String,
        status: { type: String, enum: ['unread', 'read'], default: 'unread' },
        isSaved: { type: Boolean, default: false },
        isArchived: { type: Boolean, default: false },
        meta: { type: mongoose.Schema.Types.Mixed, default: {} },
        visuals: {
            icon: String,
            color: String,
            glow: Boolean
        },
        createdAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

UserSchema.index(
    {
        'connections.mlbb.playerId': 1,
        'connections.mlbb.zoneId': 1
    },
    {
        unique: true,
        partialFilterExpression: {
            'connections.mlbb.verified': true,
            'connections.mlbb.playerId': { $exists: true, $type: 'string' },
            'connections.mlbb.zoneId': { $exists: true, $type: 'string' }
        }
    }
);

UserSchema.index(
    { 'university.studentId': 1 },
    {
        unique: true,
        partialFilterExpression: {
            'university.studentId': { $exists: true, $type: 'string' },
            'university.verificationStatus': { $in: ['pending', 'verified'] }
        }
    }
);

UserSchema.index(
    { 'university.institutionalEmail': 1 },
    {
        unique: true,
        partialFilterExpression: {
            'university.institutionalEmail': { $exists: true, $type: 'string' },
            'university.verificationStatus': { $in: ['pending', 'verified'] }
        }
    }
);

export default mongoose.model('User', UserSchema);
