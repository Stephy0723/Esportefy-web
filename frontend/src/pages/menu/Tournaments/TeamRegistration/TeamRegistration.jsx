import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TeamRegistration.css';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { resolveMediaUrl } from '../../../../utils/media';
import { formatTeamPublicId, formatTournamentPublicId } from '../../../../utils/publicIds';
import { useAuth } from '../../../../context/AuthContext';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  
  // URL de imagen Genérica de Alta Calidad (Cyberpunk/Esports Arena)
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop";

  // LÓGICA BLINDADA:
  // 1. Intentamos leer del estado.
  // 2. Si existe el estado pero NO tiene imagen, usamos la DEFAULT.
  // 3. Si no existe el estado, usamos todo DEFAULT.
  const incomingTournament = location.state?.tournament;
  
  const tournament = {
    title: incomingTournament?.title || "Torneo Global",
    // Aquí está el truco: Si no hay banner, usa DEFAULT_IMAGE
    image: resolveMediaUrl(incomingTournament?.bannerImage || incomingTournament?.image) || DEFAULT_IMAGE,
    tournamentId: incomingTournament?.tournamentId || '',
    game: incomingTournament?.game || '',
    riotRequirements: incomingTournament?.riotRequirements || {},
    eligibility: incomingTournament?.eligibility || {}
  };

  const [teamName, setTeamName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);
  const storedUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
  const currentUser = authUser || (storedUser ? JSON.parse(storedUser) : null);

  const selectedTeam = userTeams.find(t => String(t._id) === String(selectedTeamId));
  const starters = Array.isArray(selectedTeam?.roster?.starters) ? selectedTeam.roster.starters : [];
  const subs = Array.isArray(selectedTeam?.roster?.subs) ? selectedTeam.roster.subs.filter(Boolean) : [];
  const expectedStarters = Number.isFinite(Number(selectedTeam?.maxMembers)) && Number(selectedTeam?.maxMembers) > 0
    ? Number(selectedTeam.maxMembers)
    : starters.length;
  const filledStarters = starters.slice(0, expectedStarters).filter(p => p && (p.nickname || p.user)).length;
  const teamComplete = expectedStarters > 0 && filledStarters >= expectedStarters;
  const gameMatches = !tournament.game || !selectedTeam?.game || String(selectedTeam.game) === String(tournament.game);
  const requiresRiot = Boolean(tournament.riotRequirements?.required) || ['Valorant','League of Legends','Wild Rift','Teamfight Tactics','Legends of Runeterra'].includes(tournament.game);
  const hasRiotLinked = Boolean(currentUser?.connections?.riot?.verified);
  const requiresMlbb = ['Mobile Legends', 'Mobile Legends: Bang Bang', 'MLBB'].includes(tournament.game);
  const hasMlbbLinked = String(
    currentUser?.connections?.mlbb?.verificationStatus
    || (currentUser?.connections?.mlbb?.verified ? 'verified' : 'unlinked')
  ) === 'verified';
  const currentUserUniversity = currentUser?.university || {};
  const hasVerifiedUniversity = Boolean(currentUserUniversity?.verified && currentUserUniversity?.universityId);
  const requiresUniversityTeam = tournament?.eligibility?.universityOnly === true || incomingTournament?.eligibility?.universityOnly === true;
  const mlbbRosterPlayers = requiresMlbb
    ? starters.slice(0, expectedStarters).concat(subs)
    : [];
  const universityRosterPlayers = requiresUniversityTeam
    ? starters.slice(0, expectedStarters).concat(subs)
    : [];
  const mlbbPlayersMissingLinkedUser = requiresMlbb
    ? mlbbRosterPlayers.some(p => p && !p.user)
    : false;
  const universityTeamValid = requiresUniversityTeam
    ? Boolean(selectedTeam?.university?.isUniversityTeam && selectedTeam?.university?.universityId)
    : true;
  const universityPlayersMissingLinkedUser = requiresUniversityTeam
    ? universityRosterPlayers.some(p => p && !p.user)
    : false;
  const universityMismatch = requiresUniversityTeam
    ? Boolean(
        selectedTeam?.university?.universityId
        && hasVerifiedUniversity
        && String(selectedTeam.university.universityId) !== String(currentUserUniversity.universityId)
      )
    : false;
  const startersMissingRiotId = requiresRiot
    ? starters.slice(0, expectedStarters).some(p => p && !p.gameId)
    : false;
  const mlbbPlayersMissingId = requiresMlbb
    ? mlbbRosterPlayers.some(p => p && (!p.gameId || !p.region))
    : false;
  const canSubmit = Boolean(selectedTeamId)
    && teamComplete
    && gameMatches
    && (!requiresUniversityTeam || (hasVerifiedUniversity && universityTeamValid && !universityPlayersMissingLinkedUser && !universityMismatch))
    && (!requiresRiot || (hasRiotLinked && !startersMissingRiotId))
    && (!requiresMlbb || (hasMlbbLinked && !mlbbPlayersMissingId && !mlbbPlayersMissingLinkedUser));

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const user = authUser || (storedUser ? JSON.parse(storedUser) : null);
        const response = await axios.get(`${API_URL}/api/teams`);
        const allTeams = response.data || [];
        const visibleTeams = user?.isAdmin
          ? allTeams
          : (user?._id
              ? allTeams.filter(t => String(t.captain?._id || t.captain) === String(user._id))
              : allTeams);
        const filteredTeams = requiresUniversityTeam
          ? visibleTeams.filter((team) => team?.university?.isUniversityTeam === true)
          : visibleTeams;
        setUserTeams(filteredTeams);
      } catch (err) {
        console.error('Error cargando equipos:', err);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, [authUser, requiresUniversityTeam]);

  useEffect(() => {
    const team = userTeams.find(t => String(t._id) === String(selectedTeamId));
    if (!team) return;
    setTeamName(team.name || '');
    setLogoUrl(team.logo || '');
  }, [selectedTeamId, userTeams]);

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
      alert('El equipo no está completo.');
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
    if (requiresUniversityTeam && !hasVerifiedUniversity) {
      alert('Debes tener tu universidad verificada para inscribirte en este torneo.');
      return;
    }
    if (requiresUniversityTeam && !universityTeamValid) {
      alert('Este torneo solo acepta equipos universitarios verificados.');
      return;
    }
    if (requiresUniversityTeam && universityPlayersMissingLinkedUser) {
      alert('En torneos universitarios todos los jugadores del roster deben ser usuarios verificados de Esportefy.');
      return;
    }
    if (requiresUniversityTeam && universityMismatch) {
      alert('Tu cuenta universitaria no coincide con la universidad del equipo seleccionado.');
      return;
    }
    if (requiresMlbb && !hasMlbbLinked) {
      alert('Debes verificar tu cuenta MLBB para inscribirte.');
      return;
    }
    if (requiresMlbb && mlbbPlayersMissingLinkedUser) {
      alert('En torneos MLBB todos los jugadores del roster deben ser usuarios vinculados de Esportefy.');
      return;
    }
    if (requiresMlbb && mlbbPlayersMissingId) {
      alert('Todos los jugadores del roster MLBB deben tener User ID y Zone ID.');
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para registrar tu equipo.');
        return;
      }
      await axios.post(
        `${API_URL}/api/tournaments/${tournament.tournamentId}/register`,
        {
          teamId: selectedTeamId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert("¡Equipo Registrado! GL HF.");
      navigate('/tournaments');
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo registrar el equipo';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Función de respaldo por si la URL falla al cargar (404, bloqueo, etc)
  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop"; // Imagen de backup (Gaming Setup)
  };

  return (
    <div className="registration-content">
       
        <div className="center-stage">
            
            <div className="glass-card">
                
                {/* IZQUIERDA: FORMULARIO */}
                <div className="form-section">
                    <div className="header-box">
                        <span className="step-tag">FASE 1</span>
                        <h1>Registro <span className="highlight">{tournament.title}</span></h1>
                        {formatTournamentPublicId(tournament) && <p>{formatTournamentPublicId(tournament)}</p>}
                        <p>Prepara a tu escuadra para la gloria.</p>
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
                              <option value="">Selecciona tu equipo</option>
                              {userTeams.map(team => (
                                <option key={team._id} value={team._id}>
                                  {team.name}{formatTeamPublicId(team) ? ` · ${formatTeamPublicId(team)}` : ''}
                                </option>
                              ))}
                            </select>
                            <label>Equipo</label>
                            
                            <span className="bar"></span>
                        </div>
                        {(!loadingTeams && userTeams.length === 0) && (
                          <div className="neon-input-group">
                            <button type="button" className="btn-confirm" onClick={() => navigate('/create-team')}>
                              Crear equipo
                            </button>
                          </div>
                        )}
                        {selectedTeam && (
                          <div className="neon-input-group">
                            {!gameMatches && <p style={{color:'#ff6b6b'}}>El juego del equipo no coincide con el torneo.</p>}
                            {!teamComplete && <p style={{color:'#ff6b6b'}}>El equipo no está completo ({filledStarters}/{expectedStarters}).</p>}
                            {requiresUniversityTeam && !hasVerifiedUniversity && <p style={{color:'#ff6b6b'}}>Debes tener tu universidad verificada en University.</p>}
                            {requiresUniversityTeam && !universityTeamValid && <p style={{color:'#ff6b6b'}}>Solo puedes registrar equipos universitarios verificados.</p>}
                            {requiresUniversityTeam && universityPlayersMissingLinkedUser && <p style={{color:'#ff6b6b'}}>Todos los jugadores del roster deben ser usuarios universitarios verificados.</p>}
                            {requiresUniversityTeam && universityMismatch && <p style={{color:'#ff6b6b'}}>Tu universidad verificada no coincide con la del equipo.</p>}
                            {requiresRiot && !hasRiotLinked && <p style={{color:'#ff6b6b'}}>Debes vincular tu cuenta Riot en Settings.</p>}
                            {requiresRiot && startersMissingRiotId && <p style={{color:'#ff6b6b'}}>Faltan Riot ID en titulares.</p>}
                            {requiresMlbb && !hasMlbbLinked && <p style={{color:'#ff6b6b'}}>Debes verificar tu cuenta MLBB en Settings.</p>}
                            {requiresMlbb && mlbbPlayersMissingLinkedUser && <p style={{color:'#ff6b6b'}}>En MLBB todos los jugadores del roster deben ser usuarios vinculados.</p>}
                            {requiresMlbb && mlbbPlayersMissingId && <p style={{color:'#ff6b6b'}}>Faltan User ID/Zone ID de MLBB en algún jugador del roster.</p>}
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

                {/* DERECHA: IMAGEN */}
                <div className="image-section">
                    <div className="overlay-gradient"></div>
                    {/* AÑADIDO: onError para manejar fallos de carga */}
                    <img 
                        src={tournament.image} 
                        alt="Game Art" 
                        className="cinematic-bg"
                        onError={handleImageError} 
                    />
                    <div className="image-text">
                        <h2>Domina el Juego</h2>
                        <p>La competencia empieza aquí.</p>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default TeamRegistration;
