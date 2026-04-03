import mongoose from "mongoose";
import {
    normalizeTeamCountry,
    normalizeTeamGender,
    normalizeTeamLanguage,
    normalizeTeamLevel
} from "../../../shared/teamCatalog.js";

const playerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nickname: String,
    gameId: String,
    region: String,
    email: String,
    role: String,
    photo: String, // Base64 o URL de Cloudinary
    competitiveProfile: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

const teamSchema = new mongoose.Schema({
    teamCode: {
        type: String,
        unique: true,
        uppercase: true,
        sparse: true
    },
    name: { type: String, required: true },
    slogan: String,
    category: String,
    game: { type: String, required: true },
    teamGender: String,
    teamCountry: String,
    teamLevel: String,
    teamLanguage: String,
    logo: String,
    university: {
        isUniversityTeam: { type: Boolean, default: false },
        universityId: { type: String, default: '' },
        universityTag: { type: String, default: '' },
        universityName: { type: String, default: '' },
        region: { type: String, default: '' },
        campus: { type: String, default: '' },
        verifiedAt: { type: Date, default: null }
    },
    maxMembers: Number,
    maxSubstitutes: Number,
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roster: {
        starters: [playerSchema],
        subs: [playerSchema],
        coach: playerSchema
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    sponsor: { type: String, trim: true, maxlength: 120, default: '' },
    inviteCode: { type: String, unique: true },
    joinRequests: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        slotType: { type: String, enum: ['starters', 'subs', 'coach'], required: true },
        slotIndex: { type: Number, default: 0 },
        player: playerSchema,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

teamSchema.pre('validate', async function(next) {
    this.teamGender = this.teamGender ? normalizeTeamGender(this.teamGender, '') : '';
    this.teamCountry = this.teamCountry ? normalizeTeamCountry(this.teamCountry) : '';
    this.teamLevel = this.teamLevel ? normalizeTeamLevel(this.teamLevel, '') : '';
    this.teamLanguage = this.teamLanguage ? normalizeTeamLanguage(this.teamLanguage, '') : '';

    if (this.teamCode) return next();

    const TeamModel = this.constructor;
    let isUnique = false;

    while (!isUnique) {
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const candidate = `TEAM-${randomDigits}`;
        const existing = await TeamModel.findOne({ teamCode: candidate }).select('_id').lean();
        if (!existing) {
            this.teamCode = candidate;
            isUnique = true;
        }
    }

    next();
});

export default mongoose.model("Team", teamSchema);
