// Backend/src/models/User.js

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    // --- Identidad Visual ---
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],

    // --- Etapa 1: Datos Personales ---
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
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

    // --- Seguridad y Recuperación ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

}, { timestamps: true });

export default mongoose.model('User', UserSchema);