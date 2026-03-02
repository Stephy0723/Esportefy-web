import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import PageHud from '../../../../components/PageHud/PageHud';
import './TeamRegistration.css';

const RIOT_GAMES = new Set([
  'valorant',
  'league of legends',
  'wild rift',
  'teamfight tactics',
  'legends of runeterra'
]);

const normalizeGame = (value) => {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return '';
  const aliases = {
    mlbb: 'mobile legends',
    'mobile legends: bang bang': 'mobile legends',
    'mobile legends bang bang': 'mobile legends'
  };
  return aliases[raw] || raw;
};

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop';
  const incomingTournament = location.state?.tournament;

  const tournament = {
    title: incomingTournament?.title || 'Torneo Global',
    image: incomingTournament?.bannerImage || incomingTournament?.image || DEFAULT_IMAGE,
    tournamentId: incomingTournament?.tournamentId || '',
    game: incomingTournament?.game || '',
    riotRequirements: incomingTournament?.riotRequirements || {}
  };

  const [submitting, setSubmitting] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);

  const storedUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const tournamentGameNormalized = normalizeGame(tournament.game);

  const filteredTeams = useMemo(() => {
    if (!tournamentGameNormalized) return userTeams;
    return userTeams.filter((team) => normalizeGame(team?.game) === tournamentGameNormalized);
  }, [userTeams, tournamentGameNormalized]);

  const selectedTeam = userTeams.find((team) => String(team._id) === String(selectedTeamId));
  const starters = Array.isArray(selectedTeam?.roster?.starters) ? selectedTeam.roster.starters : [];
  const expectedStarters = Number.isFinite(Number(selectedTeam?.maxMembers)) && Number(selectedTeam?.maxMembers) > 0
    ? Number(selectedTeam.maxMembers)
    : starters.length;
  const filledStarters = starters.slice(0, expectedStarters).filter((p) => p && (p.nickname || p.user)).length;
  const teamComplete = expectedStarters > 0 && filledStarters >= expectedStarters;
  const gameMatches = !tournamentGameNormalized || normalizeGame(selectedTeam?.game) === tournamentGameNormalized;
  const requiresRiot = Boolean(tournament.riotRequirements?.required) || RIOT_GAMES.has(tournamentGameNormalized);
  const hasRiotLinked = Boolean(currentUser?.connections?.riot?.verified);
  const startersMissingRiotId = requiresRiot
    ? starters.slice(0, expectedStarters).some((p) => p && !p.gameId)
    : false;

  const canSubmit = Boolean(selectedTeamId)
    && teamComplete
    && gameMatches
    && (!requiresRiot || (hasRiotLinked && !startersMissingRiotId));

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const localUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
        const user = localUser ? JSON.parse(localUser) : null;
        const response = await axios.get(`${API_URL}/api/teams`);
        const allTeams = response.data || [];
        const mine = user?._id
          ? allTeams.filter((t) => String(t.captain?._id || t.captain) === String(user._id))
          : allTeams;
        setUserTeams(mine);
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    const stillAvailable = filteredTeams.some((team) => String(team._id) === String(selectedTeamId));
    if (!stillAvailable) setSelectedTeamId('');
  }, [filteredTeams, selectedTeamId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!tournament.tournamentId) {
      alert('No se pudo identificar el torneo.');
      return;
    }
    if (!selectedTeamId) {
      alert('Selecciona un equipo.');
      return;
    }
    if (!gameMatches) {
      alert('El juego del equipo no coincide con el torneo.');
      return;
    }
    if (!teamComplete) {
      alert('El equipo no esta completo.');
      return;
    }
    if (requiresRiot && !hasRiotLinked) {
      alert('Debes vincular tu cuenta Riot para inscribirte.');
      return;
    }
    if (requiresRiot && startersMissingRiotId) {
      alert('Todos los titulares deben tener Riot ID.');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_URL}/api/tournaments/${tournament.tournamentId}/register`, {
        teamId: selectedTeamId
      });
      alert('Equipo registrado. GL HF.');
      navigate('/tournaments');
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo registrar el equipo';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = (e) => {
    e.target.src = 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop';
  };

  return (
    <div className="registration-content">
      <PageHud page="REGISTRO" />
      <div className="center-stage">
        <div className="glass-card">
          <div className="form-section">
            <div className="header-box">
              <span className="step-tag">FASE 1</span>
              <h1>Registro <span className="highlight">{tournament.title}</span></h1>
              <p>Prepara a tu escuadra para la gloria.</p>
              {tournament.game && (
                <div className="tournament-game-badge">Juego: {tournament.game}</div>
              )}
            </div>

            <form onSubmit={handleRegister}>
              <div className="neon-input-group">
                <select
                  className="select-modern"
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  disabled={loadingTeams}
                  required
                >
                  <option value="">{loadingTeams ? 'Cargando equipos...' : 'Selecciona tu equipo'}</option>
                  {filteredTeams.map((team) => (
                    <option key={team._id} value={team._id}>{team.name}</option>
                  ))}
                </select>
                <label>Equipo</label>
                <span className="bar" />
              </div>

              {(!loadingTeams && userTeams.length === 0) && (
                <div className="neon-input-group">
                  <button type="button" className="btn-confirm" onClick={() => navigate('/create-team')}>
                    Crear equipo
                  </button>
                </div>
              )}

              {(!loadingTeams && userTeams.length > 0 && filteredTeams.length === 0) && (
                <div className="registration-alert">
                  No tienes equipos para <strong>{tournament.game}</strong>. Crea uno para inscribirte.
                </div>
              )}

              {selectedTeam && (
                <div className="validation-box">
                  {!gameMatches && <p className="validation-error">El juego del equipo no coincide con el torneo.</p>}
                  {!teamComplete && <p className="validation-error">El equipo no esta completo ({filledStarters}/{expectedStarters}).</p>}
                  {requiresRiot && !hasRiotLinked && <p className="validation-error">Debes vincular tu cuenta Riot en Settings.</p>}
                  {requiresRiot && startersMissingRiotId && <p className="validation-error">Faltan Riot ID en titulares.</p>}
                </div>
              )}

              <div className="actions">
                <button type="button" className="btn-cancel" onClick={() => navigate('/tournaments')}>Cancelar</button>
                <button type="submit" className="btn-confirm" disabled={submitting || !canSubmit}>
                  {submitting ? 'Registrando...' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>

          <div className="image-section">
            <div className="overlay-gradient" />
            <img
              src={tournament.image}
              alt="Game Art"
              className="cinematic-bg"
              onError={handleImageError}
            />
            <div className="image-text">
              <h2>Domina el Juego</h2>
              <p>La competencia empieza aqui.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamRegistration;
