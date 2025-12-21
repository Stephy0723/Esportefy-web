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
import ResetPassword from './pages/Auth/ForgotPasswordFlow;';
import Dashboard from './pages/menu/Dashboard/Dashboard';
import Chats from './pages/menu/Chats/Chats';
import Tv from './pages/menu/EsportefyTV/Tv';
import Settings from './pages/menu/Settings/Settings';
import Notifications from './pages/Notifications/Notifications';
import Tournaments from './pages/menu/Tournaments/Tournaments';
import Community from './pages/menu/Community/Community';
import Teams from './pages/menu/Teams/Teams';

//Formulario de registro de equipos
import TeamRegistration from './pages/menu/Tournaments/TeamRegistration/TeamRegistration';
import CreateTeamPage from './pages/menu/Tournaments/CreateTournament/CreateTournament';
import OrganizerApplication from './pages/menu/Tournaments/OrganizerApplication/OrganizerApplication';

//políticas legales
import OrganizerTerms from './pages/menu/Legal/OrganizerTerms';
import PaymentPolicy from './pages/menu/Legal/PaymentPolicy';
import TermsConditions from './pages/menu/Legal/TermsConditions';
import PrivacyPolicy from './pages/menu/Legal/PrivacyPolicy';

// --- COMPONENTE AUXILIAR: DETECTOR DE BIENVENIDA ---
// Este componente invisible verifica si es la primera vez que entras para lanzar la alerta
const WelcomeTrigger = () => {
  const { triggerWelcomeSequence } = useNotification();

  useEffect(() => {
    // SIMULACIÓN: Aquí podrías verificar si "isNewUser === true" en tu base de datos.
    // Por ahora, lo disparamos al cargar para probar el efecto visual.
    // Descomenta la siguiente línea para ver la magia al recargar:
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
    /* 1. ENVUELVE LA APP CON EL CEREBRO DE NOTIFICACIONES */
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
          <Route path="/legal/organizer-terms" element={<OrganizerTerms />} />
          <Route path="/legal/payment-policy" element={<PaymentPolicy />} />
          <Route path="/legal/terms" element={<TermsConditions />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
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
          {/* Standardized URLs */}
            <Route path="/team-registration" element={<TeamRegistration />} />
            <Route path="/organizer-application" element={<OrganizerApplication />} />
            
          </Route>
        </Routes>
      </BrowserRouter>

    </NotificationProvider>
  );
}

export default App;