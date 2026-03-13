import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/database.js';
import { startMlbbMailQueueWorker } from './src/services/mlbbMailQueue.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    await connectDB();
    startMlbbMailQueueWorker();

    app.listen(PORT, () => {
        console.log(`Servidor corriendo endpoint http://localhost:${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
});
