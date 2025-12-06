import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// IMPORTA TUS PÁGINAS
import Home from './pages/Home/Home'; // Asegúrate que la ruta sea correcta
import Login from './pages/Auth/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* RUTA PRINCIPAL (Tu Home) */}
        <Route path="/" element={<Home />} />

        {/* RUTAS DE ACCESO */}
        <Route path="/login" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;