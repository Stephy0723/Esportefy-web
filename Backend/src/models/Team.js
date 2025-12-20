// Backend/src/models/Team.js

import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    game: { type: String, required: true }, // Ej: 'lol', 'valorant'
    logo: { type: String, default: 'default-team-logo.png' },
    captain: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, default: 5 },
    isPrivate: { type: Boolean, default: false },
    joinCode: { type: String } // Código para unirse si es privado
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);