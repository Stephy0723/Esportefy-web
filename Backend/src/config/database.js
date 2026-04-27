// Backend/src/config/database.js
import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            maxPoolSize: 50,
            minPoolSize: 5,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('Mongo conectado');
    } catch (error) {
        console.error('Error MongoDB', error.message);
        throw error;
    }
};

export default connectDB;
