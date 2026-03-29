import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import PageHud from '../../../../components/PageHud/PageHud';
import { getTournamentGameByName } from '../../../../data/tournamentGames/tournamentGames';
import { resolveMediaUrl } from '../../../../utils/media';
import { formatTeamPublicId, formatTournamentPublicId } from '../../../../utils/publicIds';
import { getAuthToken, getStoredUser } from '../../../../utils/authSession';
import { useAuth } from '../../../../context/AuthContext';
import { useNotification } from '../../../../context/NotificationContext';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../../utils/mlbbStatus';
import { isSupportedMlbbGame, isSupportedRiotGame, normalizeSupportedGameName } from '../../../../../../shared/supportedGames.js';
import './TeamRegistration.css';

const normalizeGame = (value) => {
  return String(normalizeSupportedGameName(value) || value || '').trim().toLowerCase();
};

const isValorantGame = (value) => normalizeGame(value) === 'valorant';

const TeamRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser } = useAuth();
  const { notify } = useNotification();

  const DEFAULT_IMAGE =
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop';
  const incomingTournament = location.state?.tournament;

  const tournament = {
    title: incomingTournament?.title || 'Torneo Global',
    image: resolveMediaUrl(incomingTournament?.bannerImage || incomingTournament?.image) || DEFAULT_IMAGE,
    tournamentId: incomingTournament?.tournamentId || '',
    game: incomingTournament?.game || '',
    riotRequirements: incomingTournament?.riotRequirements || {},
    eligibility: incomingTournament?.eligibility || {},
  };

  const [submitting, setSubmitting] = useState(false);
  const [userTeams, setUserTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [loadingTeams, setLoadingTeams] = useState(true);

  const currentUser = authUser || getStoredUser();
  const tournamentGameNormalized = normalizeGame(tournament.game);

  const filteredTeams = useMemo(() => {
    if (!tournamentGameNormalized) return userTeams;
    return userTeams.filter((team) => normalizeGame(team?.game) === tournamentGameNormalized);
  }, [userTeams, tournamentGameNormalized]);

  const selectedTeam = userTeams.find((team) => String(team._id) === String(selectedTeamId));
  const starters = Array.isArray(selectedTeam?.roster?.starters) ? selectedTeam.roster.starters : [];
  const subs = Array.isArray(selectedTeam?.roster?.subs) ? selectedTeam.roster.subs.filter(Boolean) : [];
  const expectedStarters =
    Number.isFinite(Number(selectedTeam?.maxMembers)) && Number(selectedTeam?.maxMembers) > 0
      ? Number(selectedTeam.maxMembers)
      : starters.length;
  const filledStarters = starters
    .slice(0, expectedStarters)
    .filter((p) => p && (p.nickname || p.user)).length;
  const teamComplete = expectedStarters > 0 && filledStarters >= expectedStarters;
  const gameMatches = !tournamentGameNormalized || normalizeGame(selectedTeam?.game) === tournamentGameNormalized;
  const requiresRiot = Boolean(tournament.riotRequirements?.required) || isSupportedRiotGame(tournament.game);
  const requiresValorantRso = requiresRiot && isValorantGame(tournament.game);
  const hasRiotLinked = Boolean(currentUser?.connections?.riot?.verified);
  const hasValorantRso = currentUser?.connections?.riot?.products?.valorant?.consentGranted === true;
  const requiresMlbb = isSupportedMlbbGame(tournament.game);
  const hasMlbbLinked = isMlbbVerifiedStatus(
    normalizeMlbbVerificationStatus(
      currentUser?.connections?.mlbb?.verificationStatus,
      currentUser?.connections?.mlbb?.verified
    ),
    currentUser?.connections?.mlbb?.verified
  );
  const currentUserUniversity = currentUser?.university || {};
  const hasVerifiedUniversity = Boolean(currentUserUniversity?.verified && currentUserUniversity?.universityId);
  const requiresUniversityTeam =
    tournament?.eligibility?.universityOnly === true || incomingTournament?.eligibility?.universityOnly === true;
  const mlbbRosterPlayers = requiresMlbb ? starters.slice(0, expectedStarters).concat(subs) : [];
  const universityRosterPlayers = requiresUniversityTeam ? starters.slice(0, expectedStarters).concat(subs) : [];
  const mlbbPlayersMissingLinkedUser = requiresMlbb
    ? mlbbRosterPlayers.some((p) => p && !p.user)
    : false;
  const universityTeamValid = requiresUniversityTeam
    ? Boolean(selectedTeam?.university?.isUniversityTeam && selectedTeam?.university?.universityId)
    : true;
  const universityPlayersMissingLinkedUser = requiresUniversityTeam
    ? universityRosterPlayers.some((p) => p && !p.user)
    : false;
  const universityMismatch = requiresUniversityTeam
    ? Boolean(
        selectedTeam?.university?.universityId
          && hasVerifiedUniversity
          && String(selectedTeam.university.universityId) !== String(currentUserUniversity.universityId)
      )
    : false;
  const selectedTeamCaptainId = String(selectedTeam?.captain?._id || selectedTeam?.captain || '');
  const selectedTeamCoachId = String(selectedTeam?.roster?.coach?.user || '');
  const requesterIsSelectedTeamCoach = Boolean(currentUser?._id && selectedTeamCoachId && selectedTeamCoachId === String(currentUser._id));
  const requesterCanRegisterSelectedTeam = Boolean(
    currentUser?.isAdmin
    || (currentUser?._id && selectedTeamCaptainId === String(currentUser._id))
    || requesterIsSelectedTeamCoach
  );
  const startersMissingRiotId = requiresRiot
    ? starters.slice(0, expectedStarters).some((p) => p && !p.gameId)
    : false;
  const mlbbPlayersMissingId = requiresMlbb
    ? mlbbRosterPlayers.some((p) => p && (!p.gameId || !p.region))
    : false;
  const canSubmit =
    Boolean(selectedTeamId)
    && teamComplete
    && gameMatches
    && (!requiresUniversityTeam
      || (requesterCanRegisterSelectedTeam && universityTeamValid && !universityPlayersMissingLinkedUser && !universityMismatch))
    && (!requiresRiot || (hasRiotLinked && (!requiresValorantRso || hasValorantRso) && !startersMissingRiotId))
    && (!requiresMlbb || (hasMlbbLinked && !mlbbPlayersMissingId && !mlbbPlayersMissingLinkedUser));

  useEffect(() => {
    const loadTeams = async () => {
      try {
        setLoadingTeams(true);
        const user = authUser || getStoredUser();
        const response = await axios.get(`${API_URL}/api/teams`);
        const allTeams = response.data || [];
        const visibleTeams = user?.isAdmin
          ? allTeams
          : (user?._id
              ? allTeams.filter((t) => {
                  const captainId = String(t.captain?._id || t.captain || '');
                  const coachId = String(t.roster?.coach?.user || '');
                  return captainId === String(user._id) || coachId === String(user._id);
                })
              : allTeams);
        const scopedTeams = requiresUniversityTeam
          ? visibleTeams.filter((team) => team?.university?.isUniversityTeam === true)
          : visibleTeams;
        setUserTeams(scopedTeams);
      } catch (err) {
        /* silent — UI shows empty state */
      } finally {
        setLoadingTeams(false);
      }
    };
    loadTeams();
  }, [authUser, requiresUniversityTeam]);

  useEffect(() => {
    if (!selectedTeamId) return;
    const stillAvailable = filteredTeams.some((team) => String(team._id) === String(selectedTeamId));
    if (!stillAvailable) setSelectedTeamId('');
  }, [filteredTeams, selectedTeamId]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!tournament.tournamentId) {
      notify('danger', 'Error', 'No se pudo identificar el torneo.');
      return;
    }
    if (!selectedTeamId) {
      notify('warning', 'Equipo requerido', 'Selecciona un equipo para inscribirte.');
      return;
    }
    if (!gameMatches) {
      notify('danger', 'Juego incompatible', 'El juego del equipo no coincide con el torneo.');
      return;
    }
    if (!teamComplete) {
      notify('warning', 'Roster incompleto', 'El equipo no está completo para inscribirse.');
      return;
    }
    if (requiresRiot && !hasRiotLinked) {
      notify('danger', 'Cuenta Riot requerida', 'Debes vincular tu cuenta Riot para inscribirte.');
      return;
    }
    if (requiresValorantRso && !hasValorantRso) {
      notify('danger', 'VALORANT RSO requerido', 'Debes autorizar VALORANT con Riot Sign On en Settings para inscribirte.');
      return;
    }
    if (requiresRiot && startersMissingRiotId) {
      notify('danger', 'Riot ID faltante', 'Todos los titulares deben tener Riot ID.');
      return;
    }
    if (requiresUniversityTeam && !requesterCanRegisterSelectedTeam) {
      notify('danger', 'Sin permisos', 'Solo el capitán, coach o un admin puede inscribir este equipo universitario.');
      return;
    }
    if (requiresUniversityTeam && !universityTeamValid) {
      notify('danger', 'Equipo no válido', 'Este torneo solo acepta equipos universitarios verificados.');
      return;
    }
    if (requiresUniversityTeam && universityPlayersMissingLinkedUser) {
      notify('danger', 'Jugadores sin vincular', 'En torneos universitarios todos los jugadores del roster deben ser usuarios verificados de GLITCH GANG.');
      return;
    }
    if (requiresUniversityTeam && universityMismatch) {
      notify('danger', 'Universidad no coincide', 'Tu cuenta universitaria no coincide con la universidad del equipo seleccionado.');
      return;
    }
    if (requiresMlbb && !hasMlbbLinked) {
      notify('danger', 'Cuenta MLBB requerida', 'Debes verificar tu cuenta MLBB para inscribirte.');
      return;
    }
    if (requiresMlbb && mlbbPlayersMissingLinkedUser) {
      notify('danger', 'Jugadores sin vincular', 'En torneos MLBB todos los jugadores del roster deben ser usuarios vinculados de GLITCH GANG.');
      return;
    }
    if (requiresMlbb && mlbbPlayersMissingId) {
      notify('danger', 'IDs MLBB faltantes', 'Todos los jugadores del roster MLBB deben tener User ID y Zone ID.');
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      if (!token) {
        notify('danger', 'Sesión expirada', 'Debes iniciar sesión para registrar tu equipo.');
        return;
      }
      await axios.post(
        `${API_URL}/api/tournaments/${tournament.tournamentId}/register`,
        { teamId: selectedTeamId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      notify('success', 'Equipo registrado', 'Tu equipo fue inscrito correctamente. GL HF.');
      navigate('/tournaments');
    } catch (err) {
      const msg = err.response?.data?.message || 'No se pudo registrar el equipo';
      notify('danger', 'Error de registro', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageError = (e) => {
    e.target.src =
      'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=2070&auto=format&fit=crop';
  };

  // Get tournament game info for image/color/icon
  const tournamentGameInfo = getTournamentGameByName(tournament.game);

  return (
    <>
      {/* Breadcrumb/route info at the very top, outside registration-content, for true top alignment */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'var(--bg-page)', padding: '18px 0 0 0' }}>
        <PageHud page="REGISTRO" />
      </div>
      <div className="registration-content">
        <div className="center-stage">
        <div className="glass-card">
          <div className="form-section">
            <div className="header-box">
              <span className="step-tag">FASE 1</span>
              <h1>Registro <span className="highlight">{tournament.title}</span></h1>
              {formatTournamentPublicId(tournament) && <p>{formatTournamentPublicId(tournament)}</p>}
              <p>Prepara a tu escuadra para la gloria.</p>
              {tournament.game ? (
                <div className="tournament-game-badge">Juego: {tournament.game}</div>
              ) : null}
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
                    <option key={team._id} value={team._id}>
                      {team.name}{formatTeamPublicId(team) ? ` · ${formatTeamPublicId(team)}` : ''}
                    </option>
                  ))}
                </select>
                <label>Equipo</label>
                <span className="bar" />
              </div>

              {!loadingTeams && userTeams.length === 0 ? (
                <div className="neon-input-group">
                  <button type="button" className="btn-confirm" onClick={() => navigate('/create-team')}>
                    Crear equipo
                  </button>
                </div>
              ) : null}

              {!loadingTeams && userTeams.length > 0 && filteredTeams.length === 0 ? (
                <div className="registration-alert">
                  No tienes equipos para <strong>{tournament.game}</strong>. Crea uno para inscribirte.
                </div>
              ) : null}

              {selectedTeam ? (
                <div className="validation-box">
                  {!gameMatches ? (
                    <p className="validation-error">El juego del equipo no coincide con el torneo.</p>
                  ) : null}
                  {!teamComplete ? (
                    <p className="validation-error">El equipo no esta completo ({filledStarters}/{expectedStarters}).</p>
                  ) : null}
                  {requiresUniversityTeam && !requesterCanRegisterSelectedTeam ? (
                    <p className="validation-error">Solo el capitán, coach o un admin puede registrar este equipo.</p>
                  ) : null}
                  {requiresUniversityTeam && !universityTeamValid ? (
                    <p className="validation-error">Solo puedes registrar equipos universitarios verificados.</p>
                  ) : null}
                  {requiresUniversityTeam && universityPlayersMissingLinkedUser ? (
                    <p className="validation-error">Todos los jugadores del roster deben ser usuarios universitarios verificados.</p>
                  ) : null}
                  {requiresUniversityTeam && universityMismatch ? (
                    <p className="validation-error">Tu universidad verificada no coincide con la del equipo.</p>
                  ) : null}
                  {requiresRiot && !hasRiotLinked ? (
                    <p className="validation-error">Debes vincular tu cuenta Riot en Settings.</p>
                  ) : null}
                  {requiresValorantRso && !hasValorantRso ? (
                    <p className="validation-error">Debes autorizar VALORANT con Riot Sign On en Settings.</p>
                  ) : null}
                  {requiresRiot && startersMissingRiotId ? (
                    <p className="validation-error">Faltan Riot ID en titulares.</p>
                  ) : null}
                  {requiresMlbb && !hasMlbbLinked ? (
                    <p className="validation-error">Debes verificar tu cuenta MLBB en Settings.</p>
                  ) : null}
                  {requiresMlbb && mlbbPlayersMissingLinkedUser ? (
                    <p className="validation-error">En MLBB todos los jugadores del roster deben ser usuarios vinculados.</p>
                  ) : null}
                  {requiresMlbb && mlbbPlayersMissingId ? (
                    <p className="validation-error">Faltan User ID/Zone ID de MLBB en algun jugador del roster.</p>
                  ) : null}
                </div>
              ) : null}

              <div className="actions">
                <button type="button" className="btn-cancel" onClick={() => navigate('/tournaments')}>
                  Cancelar
                </button>
                <button type="submit" className="btn-confirm" disabled={submitting || !canSubmit}>
                  {submitting ? 'Registrando...' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>

          <div className="image-section">
            <div className="overlay-gradient" />
            <img
              src={tournamentGameInfo?.img || tournament.image}
              alt={tournamentGameInfo?.name || 'Game Art'}
              className="cinematic-bg"
              onError={handleImageError}
              style={tournamentGameInfo?.color ? { boxShadow: `0 0 60px 0 ${tournamentGameInfo.color}55` } : {}}
            />
            <div className="image-text">
              <h2>{tournamentGameInfo?.name || 'Domina el Juego'}</h2>
              <p>La competencia empieza aqui.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default TeamRegistration;
