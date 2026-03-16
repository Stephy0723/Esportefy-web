// Backend/src/models/User.js

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    // --- Identidad Visual ---
    userCode: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isOrganizer: { type: Boolean, default: false },
    isAdmin: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    bannedAt: { type: Date, default: null },
    roles: {
        type: [String],
        enum: ['player', 'organizer', 'content-creator', 'coach', 'caster', 'sponsor', 'analyst'],
        default: ['player']
    },
    roleApplications: {
        organizer: {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        },
        'content-creator': {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        },
        coach: {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        },
        caster: {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        },
        sponsor: {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        },
        analyst: {
            status: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
            appliedAt: { type: Date, default: null },
            reviewedAt: { type: Date, default: null },
            data: { type: mongoose.Schema.Types.Mixed, default: {} }
        }
    },


    // --- Etapa 1: Datos Personales ---
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, enum: ['Masculino', 'Femenino', 'Otro'], default: 'Otro' },
    country: { type: String, required: true },
    birthDate: { type: Date, required: true },

    // --- Etapa 2: Gaming Core ---
    selectedGames: { type: [String], default: [] }, // Cambiado a default [] para evitar errores de .map()
    communityGameSubscriptions: { type: [String], default: [] },

    // --- Etapa 3: Perfil Pro ---
    experience: { type: [String], default: [] },
    platforms: { type: [String], default: [] },
    goals: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    preferredRoles: { type: [String], default: [] },
    lookingForTeam: { type: Boolean, default: false },
    isProfileHidden: { type: Boolean, default: false },
    socialLinks: {
        twitch: { type: String, default: '' },
        youtube: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' }
    },

    // --- Etapa 4: Credenciales ---
    username: { type: String, required: true, unique: true }, // unique para que no se repitan gamertags
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    checkTerms: { type: Boolean, required: true },

    // -- Seguridad y Recuperación ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    passwordChangedAt: { type: Date, default: null },

    // -- 2FA ---
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorPendingSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false },
    twoFactorEnabledAt: { type: Date, default: null },

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
            products: {
                lol: {
                    linked: { type: Boolean, default: false },
                    linkedAt: { type: Date, default: null },
                    lastVerifiedAt: { type: Date, default: null }
                },
                valorant: {
                    linked: { type: Boolean, default: false },
                    linkedAt: { type: Date, default: null },
                    consentRequired: { type: Boolean, default: true },
                    consentGranted: { type: Boolean, default: false },
                    consentedAt: { type: Date, default: null },
                    lastVerifiedAt: { type: Date, default: null },
                    rsoSubject: { type: String, default: '' },
                    scopes: { type: [String], default: [] }
                }
            },

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
        },

        steam: {
            id: { type: String, default: '' },
            steamId: { type: String, default: '' },
            username: { type: String, default: '' },
            displayName: { type: String, default: '' },
            avatar: { type: String, default: '' },
            profileUrl: { type: String, default: '' },
            verified: { type: Boolean, default: false },
            linkedAt: { type: Date, default: null }
        },

        epic: {
            id: { type: String, default: '' },
            epicId: { type: String, default: '' },
            username: { type: String, default: '' },
            displayName: { type: String, default: '' },
            email: { type: String, default: '' },
            verified: { type: Boolean, default: false },
            linkedAt: { type: Date, default: null }
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
        mlbb: {
            exists: { type: Boolean, default: false },
            playerId: { type: String, default: '' },
            zoneId: { type: String, default: '' },
            ign: { type: String, default: '' },
            verificationStatus: {
                type: String,
                enum: ['unlinked', 'pending', 'verified', 'verified_auto', 'verified_manual', 'rejected'],
                default: 'unlinked'
            },
            verified: { type: Boolean, default: false },
            lastSyncAt: { type: Date, default: null }
        },
        steam: {
            steamId: { type: String },
            verified: { type: Boolean, default: false }
        }
    },
    
    privacy: {
        allowTeamInvites: { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true },
        allowTournamentInvites: { type: Boolean, default: true },
        showPublicUserCode: { type: Boolean, default: true },
        showPublicRiotHandle: { type: Boolean, default: false }
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
    { 'connections.steam.id': 1 },
    {
        unique: true,
        partialFilterExpression: {
            'connections.steam.id': { $exists: true, $type: 'string' },
            'connections.steam.verified': true
        }
    }
);

UserSchema.index(
    { 'connections.epic.id': 1 },
    {
        unique: true,
        partialFilterExpression: {
            'connections.epic.id': { $exists: true, $type: 'string' },
            'connections.epic.verified': true
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

UserSchema.pre('validate', async function(next) {
    if (this.userCode) return next();

    const UserModel = this.constructor;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 40) {
        attempts += 1;
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const candidate = `${randomDigits}`;
        const existing = await UserModel.findOne({ userCode: candidate }).select('_id').lean();
        if (!existing) {
            this.userCode = candidate;
            isUnique = true;
        }
    }

    if (!isUnique) {
        return next(new Error('No se pudo generar un ID único.'));
    }

    return next();
});

export default mongoose.model('User', UserSchema);
