import dotenv from 'dotenv';
import app, { dbReady } from './src/app.js';
import { startMlbbMailQueueWorker } from './src/services/mlbbMailQueue.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        await dbReady;
        startMlbbMailQueueWorker();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo endpoint http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('CRITICAL: No se pudo iniciar el servidor.');
        console.error('Error details:', error);
        if (error?.code) console.error('Error code:', error.code);
        process.exit(1);
    }
};

startServer();
