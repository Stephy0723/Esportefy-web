import app from './src/app.js';

const PORT = process.env.PORT || 4000;

app.listen (PORT, ()=>{
    console.log(`Servidor corriendo endpoint http://localhost:${PORT}`);
    console.log('Rutas disponibles:');
    console.log(`http://localhost:${PORT}/api/auth/register`);
    console.log(`http://localhost:${PORT}/api/auth/login`);
    console.log(`http://localhost:${PORT}/api/auth/profile`);
});