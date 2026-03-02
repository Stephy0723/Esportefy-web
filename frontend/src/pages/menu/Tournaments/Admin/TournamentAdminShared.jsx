import React, { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';

export const createEmptyMatch = () => ({
  teamA: '',
  teamB: '',
  scoreA: '',
  scoreB: '',
  scheduledLabel: '',
});

export const createEmptyBracket = () => ({
  title: 'Bracket principal',
  rounds: [{ name: 'Octavos', matches: [createEmptyMatch()] }],
});

export const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

export const buildPrizeOptions = (tournament) => {
  const options = [];
  const currency = tournament?.currency ? ` ${tournament.currency}` : '';
  if (tournament?.prizePool) options.push(`Prize Pool ${tournament.prizePool}${currency}`);
  if (tournament?.prizesByRank?.first) options.push(`1er lugar ${tournament.prizesByRank.first}`);
  if (tournament?.prizesByRank?.second) options.push(`2do lugar ${tournament.prizesByRank.second}`);
  if (tournament?.prizesByRank?.third) options.push(`3er lugar ${tournament.prizesByRank.third}`);
  if (tournament?.prizeDetails) options.push(tournament.prizeDetails);
  return options.length > 0 ? options : ['Premio sorpresa', 'Boost competitivo', 'Pack de beneficios'];
};

export const STATUS_LABELS = {
  open: 'Abierto',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  draft: 'Borrador',
};

export const useTournamentAdminData = (code) => {
  const [loading, setLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [settings, setSettings] = useState({
    visibility: 'public',
    showPrize: true,
    showSponsors: true,
    showRules: true,
    showSchedule: true,
    showContact: true,
    showTeams: false,
    showBracket: true,
    customMessage: '',
  });
  const [bracket, setBracket] = useState(createEmptyBracket());

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tournaments/${code}`);
        setTournament(res.data);
        setSettings((prev) => ({ ...prev, ...(res.data?.publicSettings || {}) }));
        setBracket(res.data?.bracket || createEmptyBracket());
      } catch (error) {
        console.error('Error cargando torneo:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code]);

  const registrations = useMemo(
    () => (Array.isArray(tournament?.registrations) ? tournament.registrations : []),
    [tournament]
  );

  const approvedTeams = useMemo(
    () => registrations.filter((item) => item.status === 'approved').map((item) => item.teamName).filter(Boolean),
    [registrations]
  );

  const prizeOptions = useMemo(() => buildPrizeOptions(tournament), [tournament]);

  const savePublicSettings = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/public-settings`, settings);
      alert('Configuracion publica guardada.');
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo guardar la configuracion publica.');
    }
  };

  const saveBracket = async () => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/bracket`, { bracket });
      alert('Bracket guardado.');
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo guardar el bracket.');
    }
  };

  const updateRegistration = async (registrationId, status) => {
    try {
      await axios.patch(`${API_URL}/api/tournaments/${code}/registrations/${registrationId}`, { status });
      setTournament((prev) => ({
        ...prev,
        registrations: (prev?.registrations || []).map((item) =>
          String(item._id) === String(registrationId) ? { ...item, status } : item
        ),
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo actualizar el estado.');
    }
  };

  const removeRegistration = async (registrationId) => {
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/registrations/${registrationId}`);
      setTournament((prev) => ({
        ...prev,
        registrations: (prev?.registrations || []).filter((item) => String(item._id) !== String(registrationId)),
      }));
    } catch (error) {
      alert(error.response?.data?.message || 'No se pudo eliminar la inscripcion.');
    }
  };

  return {
    loading,
    tournament,
    settings,
    setSettings,
    bracket,
    setBracket,
    registrations,
    approvedTeams,
    prizeOptions,
    savePublicSettings,
    saveBracket,
    updateRegistration,
    removeRegistration,
  };
};

export const TournamentAdminShell = ({ tournament, currentTab, children }) => (
  <div className="ta-page">
    <header className="ta-manage-hero">
      <div className="ta-manage-hero__copy">
        <span className="ta-kicker">Control del torneo</span>
        <h1>{tournament.title}</h1>
        <p>
          #{tournament.tournamentId} - {tournament.game} - {STATUS_LABELS[tournament.status] || 'Configuracion'}
        </p>
      </div>

      <nav className="ta-manage-nav">
        <NavLink
          to={`/tournaments/manage/${tournament.tournamentId}`}
          end
          className={({ isActive }) => `ta-manage-nav__item ${isActive || currentTab === 'overview' ? 'is-active' : ''}`}
        >
          <span>Operacion</span>
          <strong>Equipos y visibilidad</strong>
        </NavLink>
        <NavLink
          to={`/tournaments/manage/${tournament.tournamentId}/bracket`}
          className={({ isActive }) => `ta-manage-nav__item ${isActive || currentTab === 'bracket' ? 'is-active' : ''}`}
        >
          <span>Bracket</span>
          <strong>Escenario del cuadro</strong>
        </NavLink>
        <NavLink
          to={`/tournaments/manage/${tournament.tournamentId}/roulette`}
          className={({ isActive }) => `ta-manage-nav__item ${isActive || currentTab === 'roulette' ? 'is-active' : ''}`}
        >
          <span>Ruleta</span>
          <strong>Vista para directo</strong>
        </NavLink>
      </nav>
    </header>

    {children}
  </div>
);
