import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    nickname: String,
    gameId: String,
    region: String,
    email: String,
    role: String,
    photo: String // Base64 o URL de Cloudinary
});

const teamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    slogan: String,
    category: String,
    game: { type: String, required: true },
    teamGender: String,
    teamCountry: String,
    teamLevel: String,
    teamLanguage: String,
    logo: String,
    maxMembers: Number,
    maxSubstitutes: Number,
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roster: {
        starters: [playerSchema],
        subs: [playerSchema],
        coach: playerSchema
    },
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

export default mongoose.model("Team", teamSchema);
