import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
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
    game: { type: String, required: true },
    teamGender: String,
    teamCountry: String,
    teamLevel: String,
    teamLanguage: String,
    logo: String,
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    roster: {
        starters: [playerSchema],
        subs: [playerSchema],
        coach: playerSchema
    },
    inviteCode: { type: String, unique: true }
}, { timestamps: true });

export default mongoose.model("Team", teamSchema);