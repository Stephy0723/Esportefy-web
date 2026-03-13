import dotenv from 'dotenv';
import app, { dbReady } from './src/app.js';

dotenv.config();
const PORT = process.env.PORT || 4000;

const startServer = async () => {
    try {
        await dbReady;
        app.listen(PORT, () => {
            console.log(`Servidor corriendo endpoint http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error?.message || error);
        process.exit(1);
    }
};

startServer();
