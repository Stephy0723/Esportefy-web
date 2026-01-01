import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    teamName: {
        type: String,
        required: true,
        trim: true
    },
    players: [{
        type: String, // IDs o Nombres de los jugadores
        required: true
    }],
    status: {
        type: String,
        enum: ['confirmed', 'pending'],
        default: 'confirmed'
    }
}, { timestamps: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;