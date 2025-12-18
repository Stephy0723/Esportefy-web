// Backend/src/config/database.js
import mongoose from "mongoose";

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Mongo conectado');
    }catch(error)
    {
        console.error('Error MongoDB', error.messege);
        process.exit(1);
    }
}

export default connectDB;