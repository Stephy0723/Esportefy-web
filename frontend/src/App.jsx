import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import './App.css';


// --- EXTENSIONES DE NOTIFICACIONES ---
import { NotificationProvider, useNotification } from './context/NotificationContext';
import ToastContainer from './components/Toasts/ToastContainer';

// COMPONENTES
import Navbar from './components/Navbar/Navbar'; 
import Sidebar from './components/Sidebar/Sidebar'; 

// PÁGINAS
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// CORRECCIÓN AQUÍ: Quité el punto y coma (;) que estaba DENTRO de las comillas
import ResetPassword from './pages/Auth/ForgotPasswordFlow'; 
import Dashboard from './pages/menu/Dashboard/Dashboard';
import Chats from './pages/menu/Chats/Chats';
import Tv from './pages/menu/EsportefyTV/Tv';
import Notifications from './pages/Notifications/Notifications';
import Tournaments from './pages/menu/Tournaments/Tournaments';
import Community from './pages/menu/Community/Community';
import Teams from './pages/menu/Teams/Teams';
import CreateTeamPage from './pages/menu/Teams/CreateTeamPage/CreateTeamPage';
// Configuración y ayuda
import Settings from './pages/menu/Settings/Settings';
import SupportPage from './pages/menu/Settings/Support/SupportMain';
// Formularios
import TeamRegistration from './pages/menu/Tournaments/TeamRegistration/TeamRegistration';
import CreateTournament from './pages/menu/Tournaments/CreateTournament/CreateTournament';
import OrganizerApplication from './pages/menu/Tournaments/OrganizerApplication/OrganizerApplication';
// Perfile
import EditProfile from './pages/menu/Profile/EditProfile';
import Profile from './pages/menu/Profile/Profile';
// Políticas legales
import OrganizerTerms from './pages/menu/Legal/OrganizerTerms';
import PaymentPolicy from './pages/menu/Legal/PaymentPolicy';
import TermsConditions from './pages/menu/Legal/TermsConditions';
import PrivacyPolicy from './pages/menu/Legal/PrivacyPolicy';

// --- COMPONENTE AUXILIAR: DETECTOR DE BIENVENIDA ---
const WelcomeTrigger = () => {
  const { triggerWelcomeSequence } = useNotification();

  useEffect(() => {
    // triggerWelcomeSequence(); 
  }, [triggerWelcomeSequence]);

  return null;
};

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

   

    <NotificationProvider>
      
      {/* 2. CONTENEDOR VISUAL DE ALERTAS FLOTANTES (TOASTS) */}
      <ToastContainer />
      
      {/* 3. DISPARADOR DE BIENVENIDA (Lógica invisible) */}
      <WelcomeTrigger />

      <BrowserRouter>
        <Routes>

          {/* PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          
          {/* LEGALES */}
          <Route path="/legal/organizer-terms" element={<OrganizerTerms />} />
          <Route path="/legal/payment-policy" element={<PaymentPolicy />} />
          <Route path="/legal/terms" element={<TermsConditions />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          
          {/* CREACIÓN DE EQUIPO (Pública o separada del layout principal según tu diseño actual) */}
          <Route path="/create-team" element={<CreateTeamPage />} />
          
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
            <Route path="/profile" element={<Profile />} />
            {/* Rutas de Gestión de Torneos */}
            <Route path="/team-registration" element={<TeamRegistration />} />
            <Route path="/organizer-application" element={<OrganizerApplication />} />
            <Route path="/create-tournament" element={<CreateTournament />} />
          </Route>
        </Routes>
      </BrowserRouter>

    </NotificationProvider>
      
  
  );
}

export default App;