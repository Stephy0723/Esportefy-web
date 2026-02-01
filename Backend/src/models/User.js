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
            enum: ['online', 'dnd', 'tournament', 'offline'],
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
 
    // ===== SETTINGS =====
    connections: {
        discord: {
            id: { type: String },
            username: { type: String },
            verified: { type: Boolean, default: false }
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
                tagLine: String
            }
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
    notifications: [{
        type: { type: String, default: 'info' },
        category: { type: String, default: 'system' },
        title: String,
        source: { type: String, default: 'Sistema' },
        message: String,
        status: { type: String, enum: ['unread', 'read'], default: 'unread' },
        visuals: {
            icon: String,
            color: String,
            glow: Boolean
        },
        createdAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

export default mongoose.model('User', UserSchema);
