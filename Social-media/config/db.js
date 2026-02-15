// config/db.js
import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Reemplaza con tu string de conexión de MongoDB Atlas o Local
        await mongoose.connect('mongodb://localhost:27017/esportefy-chat');
        console.log('✅ MongoDB Conectado...');
    } catch (err) {
        console.error('❌ Error de conexión:', err.message);
        process.exit(1);
    }
};