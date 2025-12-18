// Backend/src/models/User.js

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
//Etapa 1
    fullName : {type: String, required: true},
    phone: { type: String, required: true },
    country: {type: String, required: true},
    birthDate: {type: Date, required: true},
//Etapa 2    
    selectedGames: {type: [String], required: true},
//Etapa 3
    experience: {type: [String], required: true},
    platforms: {type: [String], required: true},
    goals: {type: [String], required: true},
//Etapa 4 
    username: {type: String, required: true},//gamertag
    email: {type: String, required: true},
    password: {type: String, required: true},
    checkTerms: {type: Boolean, required: true},

//olvide mi contraseña
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },    

}, {timestamps: true});

export default mongoose.model('User', UserSchema);