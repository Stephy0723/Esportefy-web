import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({

    fullName : {type: String, required: true},
    phone: {type: Number, required: true},
    country: {type: String, required: true},
    birthDate: {type: Date, required: true},
    
    selectedGames: {type: [String], required: true},

    experience: {type: [String], required: true},
    plataforms: {type: [String], required: true},
    lokingfor: {type: [String], required: true},
    
    userName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    checkTerms: {type: Boolean, required: true},
    
    
    dicord: {type: String, required: true},
    city: {type: String, required: true},
    goals: {type: [String], required: true},
    confirmPassword: {type: String, required: true},
    checkNews: {type: Boolean, required: true},

}, {timestamps: true});

export default mongoose.model('User', UserSchema);