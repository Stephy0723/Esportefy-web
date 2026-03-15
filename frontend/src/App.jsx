import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import './App.css';

import { NotificationProvider } from './context/NotificationContext';
import ToastContainer from './components/Toasts/ToastContainer';
import SponsorshipHub from './components/SponsorshipHub/SponsorshipHub';
import SponsorMotion from './components/SponsorMotion/SponsorMotion';
import Footer from './components/Home/Footer';

import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

import DocsPage from './pages/Docs/DocsPage';
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ResetPassword from './pages/Auth/ForgotPasswordFlow';
import Rankings from './pages/menu/Rankings/Rankings';
import Noticias from './pages/menu/Noticias/Noticias';
import NewsDetail from './pages/menu/Noticias/NewsDetail';
import OrganismProfile from './pages/menu/Organismos/OrganismProfile';
import Dashboard from './pages/menu/Dashboard/Dashboard';
import FriendsPage from './pages/menu/Friends/Friends';
import Chats from './pages/menu/Chats/Chats';
import EsportefyPage from './pages/menu/Esportefy/EsportefyPage';
import Tv from './pages/menu/EsportefyTV/Tv';
import Notifications from './pages/Notifications/Notifications';
import Tournaments from './pages/menu/Tournaments/Tournaments';
import Community from './pages/menu/Community/Community';
import Teams from './pages/menu/Teams/Teams';
import CreateTeamPage from './pages/menu/Teams/CreateTeamPage/CreateTeamPage';
import SettingsV2 from './pages/menu/Settings/SettingsV2';
import SupportPage from './pages/menu/Settings/Support/SupportMain';
import UniversityPage from './pages/University/UniversityPage';
import CalendarPage from './components/Calendar/CalendarPage/CalendarPage';
import TeamRegistration from './pages/menu/Tournaments/TeamRegistration/TeamRegistration';
import CreateTournament from './pages/menu/Tournaments/CreateTournament/CreateTournament';
import OrganizerApplication from './pages/menu/Tournaments/OrganizerApplication/OrganizerApplication';
import TournamentAdminHub from './pages/menu/Tournaments/Admin/TournamentAdminHub';
import TournamentManagePage from './pages/menu/Tournaments/Admin/TournamentManagePage';
import TournamentBracketPage from './pages/menu/Tournaments/Admin/TournamentBracketPage';
import TournamentRoulettePage from './pages/menu/Tournaments/Admin/TournamentRoulettePage';
import TournamentMatchCenter from './pages/menu/Tournaments/Admin/TournamentMatchCenter';
import TournamentStandingsPage from './pages/menu/Tournaments/Admin/TournamentStandingsPage';
import TournamentReportsPage from './pages/menu/Tournaments/Admin/TournamentReportsPage';
import TournamentStaffPage from './pages/menu/Tournaments/Admin/TournamentStaffPage';
import TournamentSimulatorPage from './pages/menu/Tournaments/Admin/TournamentSimulatorPage';
import TournamentPublicExplorer from './pages/menu/Tournaments/Public/TournamentPublicExplorer';
import TournamentPublicView from './pages/menu/Tournaments/Public/TournamentPublicView';
import EditProfile from './pages/menu/Profile/EditProfile';
import Profile from './pages/menu/Profile/Profile';
import OrganizerTerms from './pages/menu/Legal/OrganizerTerms';
import PaymentPolicy from './pages/menu/Legal/PaymentPolicy';
import TermsConditions from './pages/menu/Legal/TermsConditions';
import PrivacyPolicy from './pages/menu/Legal/PrivacyPolicy';
import GamesPage from './pages/menu/Community/games/GamesPage';
import GamesFilterTemplate from './pages/menu/Community/games/GamesFilterTemplate';
import GroupPage from './pages/menu/Community/groups/GroupPage';
import OrganizerPage from './pages/menu/Community/organizers/OrganizerPage';
import CommunityTemplate from './pages/menu/Community/CommunityTemplate/CommunityTemplateV2';
import CommunityAdminTemplate from './pages/menu/Community/CommunityAdminTemplate/CommunityAdminTemplate';
import CommunityGamePageTemplate from './pages/Game/CommunityGamePageTemplate';
import CommunitySpacePage from './pages/menu/Community/groups/CommunitySpacePage';
import ContentCreatorPage from './pages/menu/Roles/ContentCreatorPage';
import CoachPage from './pages/menu/Roles/CoachPage';
import CasterPage from './pages/menu/Roles/CasterPage';
import SponsorPage from './pages/menu/Roles/SponsorPage';
import AnalystPage from './pages/menu/Roles/AnalystPage';
import AdminPanel from './pages/menu/Admin/AdminPanel';

const WelcomeTrigger = () => null;

const MainLayout = () => {
  const [isClosed, setIsClosed] = useState(true);

  return (
    <>
      <Sidebar isClosed={isClosed} setIsClosed={setIsClosed} />
      {/* Overlay for mobile sidebar */}
      {!isClosed && (
        <div className="sidebar-overlay" onClick={() => setIsClosed(true)} />
      )}
      <div className={`main-layout ${isClosed ? 'collapsed' : 'expanded'}`}>
        <Navbar onMenuToggle={() => setIsClosed((prev) => !prev)} isSidebarOpen={!isClosed} />
        <div className="content-wrapper">
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
};

const PublicLayout = () => {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
};

const AppRouterContent = () => {
  const location = useLocation();
  const hideFloatingOverlays =
    location.pathname.startsWith('/create-team') ||
    location.pathname.includes('/roulette/live');

  return (
    <>
      {!hideFloatingOverlays && <SponsorshipHub />}
      {!hideFloatingOverlays && <SponsorMotion />}
      <Routes>
        <Route path="/" element={<Home />} />

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/CalendarPage" element={<CalendarPage />} />
          <Route path="/legal/organizer-terms" element={<OrganizerTerms />} />
          <Route path="/legal/payment-policy" element={<PaymentPolicy />} />
          <Route path="/legal/terms" element={<TermsConditions />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/create-team" element={<CreateTeamPage />} />
          <Route path="/torneos/publicos" element={<TournamentPublicExplorer />} />
          <Route path="/torneos/publicos/:code" element={<TournamentPublicView />} />
          <Route path="/tournaments/:code" element={<TournamentPublicView />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/tournaments/manage/:code/roulette/live/single" element={<TournamentRoulettePage />} />
          <Route path="/tournaments/manage/:code/roulette/live/duel" element={<TournamentRoulettePage />} />

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/amigos" element={<FriendsPage />} />
            <Route path="/chats" element={<Chats />} />
            <Route path="/tv" element={<Tv />} />
            <Route path="/settings" element={<SettingsV2 />} />
            <Route path="/esportefy" element={<EsportefyPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/torneos" element={<Tournaments />} />
            <Route path="/comunidad" element={<Community />} />
            <Route path="/equipos" element={<Teams />} />
            <Route path="/tournaments" element={<Tournaments />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/noticias" element={<Noticias />} />
            <Route path="/noticias/:id" element={<NewsDetail />} />
            <Route path="/organismos/:slug" element={<OrganismProfile />} />
            <Route path="/team-registration" element={<TeamRegistration />} />
            <Route path="/organizer-application" element={<OrganizerApplication />} />
            <Route path="/create-tournament" element={<CreateTournament />} />
            <Route path="/tournaments/admin" element={<TournamentAdminHub />} />
            <Route path="/tournaments/manage/:code" element={<TournamentManagePage />} />
            <Route path="/tournaments/manage/:code/bracket" element={<TournamentBracketPage />} />
            <Route path="/tournaments/manage/:code/matches" element={<TournamentMatchCenter />} />
            <Route path="/tournaments/manage/:code/standings" element={<TournamentStandingsPage />} />
            <Route path="/tournaments/manage/:code/staff" element={<TournamentStaffPage />} />
            <Route path="/tournaments/manage/:code/reports" element={<TournamentReportsPage />} />
            <Route path="/tournaments/manage/:code/roulette" element={<TournamentRoulettePage />} />
            <Route path="/tournaments/simulator" element={<TournamentSimulatorPage />} />
            <Route path="/games/:gameId" element={<GamesPage />} />
            <Route path="/games/filter/:type/:value" element={<GamesFilterTemplate />} />
            <Route path="/university" element={<UniversityPage />} />
            <Route path="/game/:gameId" element={<CommunityGamePageTemplate />} />
            <Route path="/community/:slug" element={<CommunityTemplate />} />
            <Route path="/communities/:shortUrl" element={<CommunitySpacePage />} />
            <Route path="/community/:id/admin" element={<CommunityAdminTemplate />} />
            <Route path="/group/:id" element={<GroupPage />} />
            <Route path="/organizer/:id" element={<OrganizerPage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/role/content-creator/apply" element={<ContentCreatorPage />} />
            <Route path="/role/coach/apply" element={<CoachPage />} />
            <Route path="/role/caster/apply" element={<CasterPage />} />
            <Route path="/role/sponsor/apply" element={<SponsorPage />} />
            <Route path="/role/analyst/apply" element={<AnalystPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

function App() {
  return (
    <NotificationProvider>
      <ToastContainer />
      <WelcomeTrigger />

      <BrowserRouter>
        <AppRouterContent />
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;

