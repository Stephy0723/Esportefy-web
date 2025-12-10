import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// IMPORTA TUS PÁGINAS
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Dashboard from './pages/menu/Dashboard/Dashboard';
import OrganizerApplication from './pages/menu/Tournaments/OrganizerApplication/OrganizerApplication';
import TeamRegistration from './pages/menu/Tournaments/TeamRegistration/TeamRegistration';
import Chats from './pages/menu/Chats/Chats';
import Tv from './pages/menu/EsportefyTV/Tv';
import CreateTournament from './pages/menu/Tournaments/CreateTournament/CreateTournament';
import Settings from './pages/menu/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import Tournaments from './pages/menu/Tournaments/Tournaments';
import Community from './pages/menu/Community/Community';
import Register from './pages/Auth/Register';
import Teams from './pages/menu/Teams/Teams';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chats" element={<Chats />} />
        <Route path="/tv" element={<Tv />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/torneos" element={<Tournaments />} />
        <Route path="/comunidad" element={<Community />} />
        <Route path="/equipos" element={<Teams />} />
        <Route path="/tournaments" element={<Tournaments />} /> {/* Ojo: cambié la ruta a inglés si quieres, o déjala en español /torneos */}
        <Route path="/organizer-application" element={<OrganizerApplication />} />
        <Route path="/team-registration" element={<TeamRegistration />} />
        <Route path="/create-tournament" element={<CreateTournament />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;