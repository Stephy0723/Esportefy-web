import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './App.css';

// COMPONENTES
import Navbar from './components/Navbar/Navbar'; 
import Sidebar from './components/Sidebar/Sidebar'; 

// PÁGINAS (Tus imports)
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/menu/Dashboard/Dashboard';
import Chats from './pages/menu/Chats/Chats';
import Tv from './pages/menu/EsportefyTV/Tv';
import Settings from './pages/menu/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import Tournaments from './pages/menu/Tournaments/Tournaments';
import Community from './pages/menu/Community/Community';
import Teams from './pages/menu/Teams/Teams';

// --- LAYOUT INTERNO ---
const MainLayout = () => {
  const [isClosed, setIsClosed] = useState(true);

  return (
    <>
      {/* 1. SIDEBAR (Fijo a la izquierda) */}
      <Sidebar isClosed={isClosed} setIsClosed={setIsClosed} />

      {/* 2. CONTENEDOR FLUIDO (Se mueve según el sidebar) */}
      <div className={`main-layout ${isClosed ? 'collapsed' : 'expanded'}`}>
        
        {/* 3. NAVBAR STICKY (Flota arriba con transparencia) */}
        <Navbar />

        {/* 4. CONTENIDO PÁGINA */}
        <div className="content-wrapper">
          <Outlet /> 
        </div>

      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PÚBLICAS */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PRIVADAS (Con Sidebar + Navbar) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/tv" element={<Tv />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/torneos" element={<Tournaments />} />
          <Route path="/comunidad" element={<Community />} />
          <Route path="/equipos" element={<Teams />} />
          <Route path="/tournaments" element={<Tournaments />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;