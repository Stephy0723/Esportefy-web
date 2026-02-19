import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import './App.css';



// --- EXTENSIONES DE NOTIFICACIONES ---
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { useAuth } from './context/AuthContext';
import ToastContainer from './components/Toasts/ToastContainer';

// COMPONENTES
import Navbar from './components/Navbar/Navbar'; 
import Sidebar from './components/Sidebar/Sidebar'; 

// PÁGINAS
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
//rANKINGS
import Rankings from './pages/menu/Rankings/Rankings';
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
//Universidad
import UniversityPage from './pages/University/UniversityPage';
//Calendario
import CalendarPage from './components/Calendar/CalendarPage/CalendarPage';
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
//Comunidad
import GamesPage from './pages/menu/Community/games/GamesPage';
import GroupPage from './pages/menu/Community/groups/GroupPage';
import OrganizerPage from './pages/menu/Community/organizers/OrganizerPage';
//Juegos (comunidad)
import ValorantPage from './pages/Game/ValorantPage';
import Dota2Page from './pages/Game/Dota2Page'; 
import LeagueOfLegendsPage from './pages/Game/LeagueOfLegendsPage';
import MobileLegendsPage from './pages/Game/MobileLegendsPage';
import WildRiftPage from './pages/Game/WildRiftPage';
import FortnitePage from './pages/Game/FortnitePage';
import FreeFirePage from './pages/Game/FreeFirePage';
import HearthstonePage from './pages/Game/HearthstonePage'; 
import OverwatchPage from './pages/Game/OverwatchPage';
import CsgoPage from './pages/Game/CsgoPage';
import ApexPage from './pages/Game/ApexPage';
import CodPage from './pages/Game/CodPage';
import FifaPage from './pages/Game/FifaPage.jsx';
import HokPage from './pages/Game/HokPage.jsx'; 
import PubgPage from './pages/Game/PubgMobilePage.jsx';
import RainbowSixPage from './pages/Game/RainbowSixPage.jsx';
import RocketLeaguePage from './pages/Game/RocketLeaguePage.jsx';   
import TftPage from './pages/Game/TftPage.jsx';
import ClashRoyalePage from './pages/Game/ClashRoyalePage.jsx';
import StreetFighter6Page from './pages/Game/StreetFighter6Page.jsx';
import Tekken8Page from './pages/Game/Tekken8Page.jsx';
import StarcraftPage from './pages/Game/StarcraftPage.jsx';
import RuneterraPage from './pages/Game/RuneteraPage.jsx';
import Nba2k14Page from './pages/Game/Nba2k14Page.jsx';


// --- COMPONENTE AUXILIAR: DETECTOR DE BIENVENIDA ---
const WelcomeTrigger = () => {
  const { triggerWelcomeSequence } = useNotification();

  useEffect(() => {
    // triggerWelcomeSequence(); 
  }, [triggerWelcomeSequence]);

  return null;
};

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
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
          
          {/* LEGALES */}
          <Route path="/legal/organizer-terms" element={<OrganizerTerms />} />
          <Route path="/legal/payment-policy" element={<PaymentPolicy />} />
          <Route path="/legal/terms" element={<TermsConditions />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/support" element={<SupportPage />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/CalendarPage" element={<CalendarPage />} />
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
              <Route path="/rankings" element={<Rankings />} />
              
              {/* Rutas de Gestión de Torneos */}
              <Route path="/team-registration" element={<TeamRegistration />} />
              <Route path="/organizer-application" element={<OrganizerApplication />} />
              <Route path="/create-tournament" element={<CreateTournament />} />
              {/* Rutas de Comunidad */}
              <Route path="/games/:id" element={<GamesPage />} />
              <Route path="/university" element={<UniversityPage />} />

              {/* Rutas con nombre propio */}
              <Route path="/game/valorant" element={<ValorantPage />} />
              <Route path="/game/dota2" element={<Dota2Page />} />
              <Route path="/game/lol" element={<LeagueOfLegendsPage />} />
              <Route path="/game/mlbb" element={<MobileLegendsPage />} />
              <Route path="/game/wildrift" element={<WildRiftPage />} />
              <Route path="/game/fortnite" element={<FortnitePage />} />
              <Route path="/game/freefire" element={<FreeFirePage />} />
              <Route path="/game/apex" element={<ApexPage />} />
              <Route path="/game/warzone" element={<CodPage />} />
              <Route path="/game/fifa" element={<FifaPage />} />  
              <Route path="/game/hok" element={<HokPage />} />
              <Route path="/game/hearthstone" element={<HearthstonePage />} />  
              <Route path="/game/overwatch" element={<OverwatchPage />} />
              <Route path="/game/pubgm" element={<PubgPage />} />
              <Route path="/game/r6" element={<RainbowSixPage />} />
              <Route path="/game/rocket" element={<RocketLeaguePage />} />
              <Route path="/game/freefire" element={<FreeFirePage />} />
              <Route path="/game/cs2" element={<CsgoPage />} />  
              <Route path="/game/apex" element={<ApexPage />} />
              <Route path="/game/tft" element={<TftPage />} />
              <Route path="/game/clashroyale" element={<ClashRoyalePage />} />
              <Route path="/game/sf6" element={<StreetFighter6Page />} />
              <Route path="/game/tekken8" element={<Tekken8Page />} />
              <Route path="/game/starcraft" element={<StarcraftPage />} />
              <Route path="/game/lor" element={<RuneterraPage />} />  
              <Route path="/game/nba2k" element={<Nba2k14Page />} />
              {/* Rankings */  }
              <Route path="/rankings" element={<Rankings />} />

              {/* Rutas dinámicas */  }
              <Route path="/group/:id" element={<GroupPage />} />
              <Route path="/organizer/:id" element={<OrganizerPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

    </NotificationProvider>
      
  
  );
}

export default App;
