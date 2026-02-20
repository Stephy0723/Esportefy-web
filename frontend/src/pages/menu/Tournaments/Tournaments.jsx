import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../../config/api';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';
import MatchCalendar from '../../../components/Calendar/MatchCalendar/WidgetCalendar';
import PageHud from '../../../components/PageHud/PageHud';


const GAME_CONFIG = {
  "All": { color: "#ffffff", icon: "bx-grid-alt" },
  "Valorant": { color: "#ff4655", icon: "bx-crosshair" },
  "CS:GO 2": { color: "#de9b35", icon: "bx-target-lock" },
  "Call of Duty": { color: "#54b946", icon: "bx-run" },
  "Warzone": { color: "#54b946", icon: "bx-radar" },
  "Fortnite": { color: "#a349a4", icon: "bx-building" },
  "Free Fire": { color: "#f39c12", icon: "bx-flame" },
  "PUBG": { color: "#f1c40f", icon: "bx-target-lock" },
  "Apex Legends": { color: "#e74c3c", icon: "bx-shield-quarter" },
  "Overwatch 2": { color: "#f39c12", icon: "bx-shield" },
  "Rainbow Six Siege": { color: "#3498db", icon: "bx-window" },
  "League of Legends": { color: "#c1a05e", icon: "bx-world" },
  "Dota 2": { color: "#e74c3c", icon: "bx-map-alt" },
  "Mobile Legends": { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "Honor of Kings": { color: "#e6b333", icon: "bx-crown" },
  "Smite": { color: "#f1c40f", icon: "bx-bolt-circle" },
  "Wild Rift": { color: "#00a8ff", icon: "bx-mobile" },
  "FIFA 24": { color: "#2ecc71", icon: "bx-football" },
  "NBA 2K24": { color: "#e67e22", icon: "bx-basketball" },
  "Rocket League": { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6": { color: "#f39c12", icon: "bx-walk" },
  "Tekken 8": { color: "#c0392b", icon: "bx-angry" },
  "Clash Royale": { color: "#3498db", icon: "bx-crown" },
  "Teamfight Tactics": { color: "#f1c40f", icon: "bx-grid" },
  "Hearthstone": { color: "#f39c12", icon: "bx-book" },
  "Legends of Runeterra": { color: "#3498db", icon: "bx-book-open" },
  "StarCraft II": { color: "#00a8ff", icon: "bx-planet" }
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PROMO SLIDES â€” platform-branded carousel
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const PROMO_SLIDES = [
    {
        id: 1,
        gradient: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        accent: '#8EDB15',
        icon: 'bx-trophy',
        badge: 'ESPORTEFY ARENA',
        title: 'COMPITE AL MÁXIMO NIVEL',
        subtitle: 'Inscríbete en torneos oficiales, demuestra tu skill y gana premios reales.',
        cta: 'Explorar Torneos',
        ctaIcon: 'bx-right-arrow-alt',
        ctaAction: 'scroll',
        particles: ['bx-game', 'bx-joystick', 'bx-trophy', 'bx-medal']
    },
    {
        id: 2,
        gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        accent: '#4facfe',
        icon: 'bx-crown',
        badge: 'ORGANIZADOR PRO',
        title: 'CREA TU PROPIO TORNEO',
        subtitle: 'Gestiona inscripciones, define premios y construye tu comunidad competitiva.',
        cta: 'Crear Torneo',
        ctaIcon: 'bx-plus',
        ctaAction: 'create',
        particles: ['bx-crown', 'bx-star', 'bx-shield', 'bx-diamond']
    },
    {
        id: 3,
        gradient: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)',
        accent: '#f093fb',
        icon: 'bx-group',
        badge: 'TEAM UP',
        title: 'ENCUENTRA TU ESCUADRA',
        subtitle: 'Forma equipo con los mejores jugadores y conquista la arena juntos.',
        cta: 'Armar Equipo',
        ctaIcon: 'bx-group',
        ctaAction: 'team',
        particles: ['bx-user', 'bx-group', 'bx-rocket', 'bx-world']
    }
];

const STATUS_CONFIG = {
    open:      { label: 'Abierto',    color: '#00ff88', icon: 'bx-check-circle' },
    ongoing:   { label: 'En curso',   color: '#4facfe', icon: 'bx-loader-circle' },
    finished:  { label: 'Finalizado', color: '#888',    icon: 'bx-flag' },
    cancelled: { label: 'Cancelado',  color: '#ef4444', icon: 'bx-x-circle' },
    draft:     { label: 'Borrador',   color: '#ffc107', icon: 'bx-pencil' },
};

const toAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${API_URL}/${path.replace(/^\//, '')}`;
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(' ').filter(Boolean);
  if (!parts.length) return 'EQ';
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('');
};

const formatTournamentFromApi = (t) => ({
  id: t._id,
  game: t.game,
  title: t.title,
  date: t.date ? new Date(t.date).toLocaleDateString() : '',
  dateRaw: t.date || '',
  prize: t.prizePool || t.prize,
  prizePool: t.prizePool || '',
  currency: t.currency || 'USD',
  slots: `${t.currentSlots}/${t.maxSlots}`,
  maxSlots: t.maxSlots,
  time: t.time,
  entry: t.entryFee || t.entry,
  entryFee: t.entryFee || '',
  organizer: t.organizer?.username || 'Organizador',
  organizerId: t.organizer?._id || t.organizer || '',
  format: t.format || 'Por definir',
  desc: t.description || 'Sin descripción disponible.',
  description: t.description || '',
  tournamentId: t.tournamentId,
  gender: t.gender,
  modality: t.modality,
  platform: t.platform,
  server: t.server,
  prizesByRank: t.prizesByRank,
  staff: t.staff,
  sponsors: t.sponsors,
  registrations: t.registrations || [],
  status: t.status,
  registrationClosed: t.registrationClosed,
  riotRequirements: t.riotRequirements,
  bannerImage: toAssetUrl(t.bannerImage),
  rulesPdf: toAssetUrl(t.rulesPdf)
});

const RIOT_GAMES = new Set([
  'Valorant',
  'League of Legends',
  'Wild Rift',
  'Teamfight Tactics',
  'Legends of Runeterra'
]);

const isRiotGame = (game) => RIOT_GAMES.has(game);

const Tournaments = () => {
  const navigate = useNavigate();
  const { notify } = useNotification(); 
  
  const { user, loading } = useAuth(); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);

  const [tournaments, setTournaments] = useState([]); // Ahora inicia vacío
  const [loadingTournaments, setLoadingTournaments] = useState(true);
  
  // ESTADO MODAL ORGANIZADOR
  const [showInfoModal, setShowInfoModal] = useState(false); 
  const [current, setCurrent] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [showTeamPreview, setShowTeamPreview] = useState(false);
  const [selectedTeamIdForPreview, setSelectedTeamIdForPreview] = useState(null);
  const [selectedTeamPreview, setSelectedTeamPreview] = useState(null);
  const rightPanelRef = useRef(null);
  const [rosterTeamIds, setRosterTeamIds] = useState([]);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  const userTeamIds = Array.isArray(user?.teams)
    ? user.teams.map((t) => String(t?._id || t))
    : [];
  const effectiveTeamIds = userTeamIds.length ? userTeamIds : rosterTeamIds;

  const hasRegisteredTeam = (tournament) => {
    if (!tournament) return false;
    const regs = Array.isArray(tournament.registrations) ? tournament.registrations : [];
    const uid = user?._id || user?.id;
    return regs.some((r) => {
      if (uid && String(r.captain) === String(uid)) return true;
      if (r.teamId && effectiveTeamIds.includes(String(r.teamId))) return true;
      return false;
    });
  };

  // Helper para obtener imagen segura
  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || GAME_IMAGES["Default"];
  };
/*
  // --- DATOS COMPLETOS DE TORNEOS ---
  const [tournaments] = useState([
    { 
        id: 1, game: 'Valorant', title: 'Valorant Masters: Tokyo', date: '2024-10-24', prize: '$50,000', slots: '12/16', 
        time: '18:00 EST', entry: '$10 USD', organizer: 'Riot Games', format: '5v5 - Elim. Simple',
        desc: 'El torneo más competitivo de la temporada. Requiere rango Ascendente o superior. Anti-cheat Vanguard obligatorio. Mapas: Bind, Haven, Split.'
    },
    { 
        id: 2, game: 'League of Legends', title: "Summoner's Cup: Regional", date: '2024-10-25', prize: '$10,000', slots: '32/32', 
        time: '20:00 EST', entry: 'Gratis', organizer: 'Esportefy Latam', format: '5v5 - Grieta',
        desc: 'Torneo abierto para toda la comunidad. Ideal para equipos amateur que buscan su primera experiencia competitiva. Modo Draft con 3 baneos.'
    },
    { 
        id: 3, game: 'CS:GO 2', title: 'Blast Premier Fall Showdown', date: '2024-11-05', prize: '$100,000', slots: '15/16', 
        time: '21:00 EST', entry: '$50 USD', organizer: 'BLAST Premier', format: '5v5 - BO3',
        desc: 'Clasificatorio directo para la Major. Solo equipos verificados con Prime Status activo. Se requiere check-in 1 hora antes.'
    },
    { 
        id: 4, game: 'Free Fire', title: 'Copa Survivors Latam', date: '2024-11-08', prize: '$5,000', slots: '45/48', 
        time: '19:00 EST', entry: 'Gratis', organizer: 'Garena', format: 'Squads - Battle Royale',
        desc: 'Demuestra quién manda en Bermuda. 3 mapas rotativos. Puntos por kill y posicionamiento. ¡Booyah garantizado para el ganador!'
    },
    { 
        id: 5, game: 'FIFA 24', title: 'Ultimate Team Championship', date: '2024-11-12', prize: '$2,000', slots: '60/64', 
        time: '14:00 EST', entry: '$5 USD', organizer: 'EA Sports', format: '1v1 - Global Series',
        desc: 'Torneo oficial de fin de semana. Prohibido el uso de jugadores cedidos. Formato de ida y vuelta con gol de oro en desempate.'
    },
    { 
        id: 6, game: 'Rocket League', title: 'Nitro League 3v3', date: '2024-11-15', prize: '$1,500', slots: '8/16', 
        time: '17:30 EST', entry: 'Gratis', organizer: 'Psyonix Community', format: '3v3 - Estándar',
        desc: 'Acelera y vuela hacia la victoria. Torneo rápido de eliminación doble. Se permiten suplentes registrados previamente.'
    },
    { 
        id: 7, game: 'Call of Duty', title: 'Warfare Elite Ops', date: '2024-11-20', prize: '$15,000', slots: '10/12', 
        time: '22:00 EST', entry: '$20 USD', organizer: 'Activision', format: '4v4 - Hardpoint/S&D',
        desc: 'Rotación de modos competitivos (CDL Ruleset). Prohibidas las armas restringidas por la liga oficial. Solo PC y Consola (Crossplay ON).'
    },
    { 
        id: 8, game: 'Rainbow Six Siege', title: 'Operator League: Six Invite', date: '2024-11-25', prize: '$8,000', slots: '4/8', 
        time: '16:00 EST', entry: '$15 USD', organizer: 'Ubisoft', format: '5v5 - Bomb',
        desc: 'Táctica y destrucción. Mapas competitivos oficiales. Se requiere Moss Anti-Cheat ejecutándose en segundo plano.'
    }
  ]);*///juegos de ejemplo

  // --- LOGICA CARRUSEL ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === PROMO_SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // --- CARGA DINÁMICA DE TORNEOS ---
useEffect(() => {
    const fetchTournaments = async () => {
        try {
            setLoadingTournaments(true);
            const response = await axios.get(`${API_URL}/api/tournaments`);
            
            // Adaptamos los datos de la base de datos al formato que usa tu diseño
            const formattedTournaments = response.data.map(formatTournamentFromApi);

            setTournaments(formattedTournaments);
        } catch (err) {
            console.error("Error cargando torneos:", err);
            notify('danger', 'Error', 'No se pudieron cargar los torneos de la base de datos.');
        } finally {
            setLoadingTournaments(false);
        }
    };

    fetchTournaments();
}, []);

  useEffect(() => {
    const loadRosterTeams = async () => {
      if (!user?._id) return;
      if (userTeamIds.length > 0) return;
      try {
        const res = await axios.get(`${API_URL}/api/teams`);
        const uid = String(user._id);
        const ids = (res.data || [])
          .filter((t) => {
            const starters = Array.isArray(t.roster?.starters) ? t.roster.starters : [];
            const subs = Array.isArray(t.roster?.subs) ? t.roster.subs : [];
            const coach = t.roster?.coach;
            return starters.some(p => String(p?.user) === uid) ||
              subs.some(p => String(p?.user) === uid) ||
              (coach && String(coach.user) === uid);
          })
          .map((t) => String(t._id));
        setRosterTeamIds(ids);
      } catch (_) {
        // no bloquear
      }
    };
    loadRosterTeams();
  }, [user?._id, userTeamIds.length]);

  const openTournamentDetails = async (torneo) => {
    setDetailLoading(true);
    setSelectedTournament({ ...torneo });
    try {
      const response = await axios.get(`${API_URL}/api/tournaments/${torneo.tournamentId}`);
      const formatted = formatTournamentFromApi(response.data);
      setSelectedTournament({ ...torneo, ...formatted });
    } catch (err) {
      console.error('Error cargando detalle del torneo:', err);
      notify('danger', 'Error', 'No se pudo cargar el detalle del torneo.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDotClick = (index) => setCurrent(index);
  const activeSlide = PROMO_SLIDES[current] || PROMO_SLIDES[0];

  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  // --- FILTERED + SEARCH ---
  const displayTournaments = useMemo(() => {
    let list = filteredTournaments;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.game?.toLowerCase().includes(q) ||
        t.organizer?.toLowerCase().includes(q) ||
        t.tournamentId?.toLowerCase().includes(q)
      );
    }
    if (activeStatus !== 'all') {
      list = list.filter(t => t.status === activeStatus);
    }
    return list;
  }, [filteredTournaments, search, activeStatus]);

  // --- STATS ---
  const stats = useMemo(() => {
    const active = tournaments.filter(t => t.status === 'open' || t.status === 'ongoing');
    const totalPrize = tournaments.reduce((sum, t) => {
      const num = parseFloat(String(t.prize || '0').replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
    const uniqueGames = new Set(tournaments.map(t => t.game)).size;
    return { total: tournaments.length, active: active.length, totalPrize, uniqueGames };
  }, [tournaments]);

  // --- CLICK OUTSIDE SIDEBAR ---
  useEffect(() => {
    const handleClickOutsideRight = (event) => {
      if (isRightPanelOpen && rightPanelRef.current && !rightPanelRef.current.contains(event.target)) {
        if (!event.target.closest('.toggle-right-sidebar-btn')) {
            setIsRightPanelOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutsideRight);
    return () => document.removeEventListener("mousedown", handleClickOutsideRight);
  }, [isRightPanelOpen]);

  const goToRegistration = (torneo) => navigate('/team-registration', { state: { tournament: torneo } });
  const needsRiot = (torneo) => isRiotGame(torneo.game) && torneo?.riotRequirements?.required;
  const hasRiotLinked = Boolean(user?.connections?.riot?.verified);

  const canManageTournament = (torneo) => {
    if (!user) return false;
    return user?.isAdmin === true || String(torneo?.organizerId) === String(user?._id);
  };

  const canSeeTeamIds = (torneo) => canManageTournament(torneo);

  const goToEditTournament = (torneo) => {
    navigate('/create-tournament', { state: { editTournament: torneo } });
  };

  const updateRegistrationStatus = async (torneo, registrationId, status) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.patch(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => {
        if (!prev) return prev;
        const nextRegs = status === 'rejected'
          ? (prev.registrations || []).filter((r) => String(r._id) !== String(registrationId))
          : (prev.registrations || []).map((r) =>
              String(r._id) === String(registrationId) ? { ...r, status } : r
            );
        return { ...prev, registrations: nextRegs };
      });
      notify('success', 'Estado actualizado', `Equipo ${status === 'approved' ? 'aprobado' : 'rechazado'}.`);
    } catch (err) {
      console.error('Error actualizando registro:', err);
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo actualizar el estado del equipo.');
    }
  };

  const removeRegistration = async (torneo, registrationId) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => {
        if (!prev) return prev;
        const nextRegs = (prev.registrations || []).filter((r) => String(r._id) !== String(registrationId));
        return { ...prev, registrations: nextRegs };
      });
      notify('success', 'Equipo removido', 'El equipo fue eliminado del torneo.');
    } catch (err) {
      notify('danger', 'Error', err.response?.data?.message || 'No se pudo remover el equipo.');
    }
  };

  const updateTournamentStatus = async (torneo, action) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${API_URL}/api/tournaments/${torneo.tournamentId}/status`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTournament((prev) => prev ? ({
        ...prev,
        status: response.data.status,
        registrationClosed: response.data.registrationClosed
      }) : prev);
    } catch (err) {
      console.error('Error actualizando estado:', err);
      notify('danger', 'Error', 'No se pudo actualizar el estado del torneo.');
    }
  };

  const openTeamPreview = async (teamId) => {
    try {
      const res = await axios.get(`${API_URL}/api/teams`);
      const team = (res.data || []).find(t => String(t._id) === String(teamId));
      setSelectedTeamPreview(team || null);
      setShowTeamPreview(true);
    } catch (err) {
      notify('danger', 'Error', 'No se pudo cargar el equipo.');
    }
  };

  const deleteTournament = async (torneo) => {
    const ok = window.confirm(`¿Eliminar el torneo "${torneo.title}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/api/tournaments/${torneo.tournamentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTournament(null);
      setTournaments((prev) => prev.filter((t) => t.id !== torneo.id));
      notify('success', 'Torneo eliminado', 'El torneo fue eliminado correctamente.');
    } catch (err) {
      console.error('Error eliminando torneo:', err);
      notify('danger', 'Error', 'No se pudo eliminar el torneo.');
    }
  };

  const handleCreateClick = () => {
        if (loading) return; // Evita clics mientras carga el contexto

        if (!user) {
            notify('warning', 'Acceso Denegado', 'Debes iniciar sesión para crear un torneo.');
            return;
        }

        // VALIDACI“N CLAVE: Usamos el campo de tu base de datos
        if (user.isOrganizer === true) {
            navigate('/create-tournament');
        } else {
            notify('danger', 'Acceso Restringido', 'Solo los Organizadores Verificados pueden crear torneos. Solicita tu verificación.');
            
        }
    };

  const handleBecomeOrganizer = () => {
    setShowInfoModal(false);
    navigate('/organizer-application');
  };

  return (
    <div className="tournaments-page-wrapper">
        <PageHud page="TORNEOS" />
        
        {/* ======================================================= */}
        {/* 1. MODAL DE ORGANIZADOR (CONVERTIRSE EN PRO)            */}
        {/* ======================================================= */}
        {showInfoModal && (
            <div className="modal-overlay-backdrop" onClick={() => setShowInfoModal(false)}>
                <div className="organizer-modal-card" onClick={e => e.stopPropagation()}>
                    <div className="modal-icon-glow">
                        <i className='bx bx-crown'></i>
                    </div>
                    <div className="modal-content-text">
                        <h3>Conviértete en Organizador</h3>
                        <p>
                            Lleva tu pasión al siguiente nivel. Crea tus propios torneos, 
                            gestiona equipos y ofrece premios reales a la comunidad.
                            <br/><br/>
                            <strong>¿Estás listo para liderar la arena?</strong>
                        </p>
                    </div>
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={() => setShowInfoModal(false)}>Cancelar</button>
                        <button className="btn-confirm" onClick={handleBecomeOrganizer}>
                            Ser Organizador <i className='bx bx-right-arrow-alt'></i>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* ======================================================= */}
        {/* 2. MODAL DE DETALLES DEL TORNEO */}
        {/* ======================================================= */}
        {selectedTournament && (
            <div className="modal-overlay-backdrop" onClick={() => setSelectedTournament(null)} style={{zIndex: 10000}}>
                <div className="tournament-details-modal" onClick={e => e.stopPropagation()}>
                    
                    <div className="modal-header-banner" style={{backgroundImage: `url(${selectedTournament.bannerImage || getGameImage(selectedTournament.game)})`}}>
                        <div className="overlay-dark"></div>
                        <button className="close-btn-round" onClick={() => setSelectedTournament(null)}><i className='bx bx-x'></i></button>

                        <div className="banner-content">
                            <div className="top-tags">
                                <span className="game-badge" style={{background: GAME_CONFIG[selectedTournament.game]?.color || '#fff'}}>
                                    <i className={`bx ${GAME_CONFIG[selectedTournament.game]?.icon}`}></i> {selectedTournament.game}
                                </span>
                            </div>
                            <h2>{selectedTournament.title}</h2>
                            <div className="host-info">
                                <span>Organizado por:</span>
                                <strong style={{color: '#fff'}}>{selectedTournament.organizer}</strong>
                                <i className='bx bxs-badge-check' style={{color: '#00b894'}}></i>
                            </div>
                            {selectedTournament.status && (
                                <div className="tournament-status-pill">
                                    {selectedTournament.status}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="modal-content-body">
                        <div className="stats-grid">
                            <div className="stat-box">
                                <span className="label">Fecha</span>
                                <span className="value">{selectedTournament.date}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Hora</span>
                                <span className="value">{selectedTournament.time}</span>
                            </div>
                            <div className="stat-box prize">
                                <span className="label">Premio</span>
                                <span className="value highlight">{selectedTournament.prize}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Formato</span>
                                <span className="value">{selectedTournament.format}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Cupos</span>
                                <span className="value">{selectedTournament.slots}</span>
                            </div>
                            <div className="stat-box">
                                <span className="label">Entrada</span>
                                <span className="value">{selectedTournament.entry}</span>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <div className="info-section">
                            <h4><i className='bx bx-file'></i> Descripción y Reglas</h4>
                            <p>{selectedTournament.desc}</p>
                        </div>

                        {Array.isArray(selectedTournament.registrations) && selectedTournament.registrations.length > 0 && (
                            <div className="info-section" style={{ marginTop: 18 }}>
                                <h4><i className='bx bx-group'></i> Equipos inscritos</h4>
                                <div className="tournament-registrations">
                                    {selectedTournament.registrations.map((r, idx) => (
                                        <div key={r._id || `${r.teamName}-${idx}`} className="registration-row">
                                            <div className="registration-main">
                                                <div className="team-row">
                                                    <div className="team-logo">
                                                        {r.logoUrl
                                                            ? <img src={toAssetUrl(r.logoUrl)} alt={r.teamName || 'Equipo'} />
                                                            : <span>{getInitials(r.teamName)}</span>
                                                        }
                                                    </div>
                                                    <div className="team-text">
                                                        <strong>{r.teamName}</strong>
                                                        {(r.teamMeta?.category || r.teamMeta?.teamLevel) && (
                                                            <span className="team-sub">
                                                                {r.teamMeta?.category || 'Sin categoría'} â€¢ {r.teamMeta?.teamLevel || 'Nivel N/A'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {r.status && <span className={`reg-status ${r.status}`}>{r.status}</span>}
                                            </div>
                                            
                                            {Array.isArray(r.roster?.starters) && r.roster.starters.length > 0 && (
                                                <div className="registration-roster">
                                                    {r.roster.starters.map(p => p.nickname || '').filter(Boolean).join(' â€¢ ')}
                                                </div>
                                            )}
                                            {/* {Array.isArray(r.roster?.starters) && r.roster.starters.length > 0 && (
                                                <div className="registration-roster">
                                                    {r.roster.starters.map((p, i) => (
                                                        <span key={`${r._id}-p-${i}`}>
                                                            {p.nickname}{p.riotId ? ` (${p.riotId})` : ''}{i < r.roster.starters.length - 1 ? ' â€¢ ' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )} */}
                                            
                                            {(r.teamMeta || r.teamId) && (
                                                <div className="registration-meta">
                                                    {r.teamMeta?.category && <span>Categoría: {r.teamMeta.category}</span>}
                                                    <br />
                                                    {r.teamMeta?.teamCountry && <span>País: {r.teamMeta.teamCountry}</span>}
                                                    <br />
                                                    {r.teamMeta?.teamLevel && <span>Nivel: {r.teamMeta.teamLevel}</span>}
                                                    <br />
                                                    {r.teamMeta?.coach && <span>Coach: {r.teamMeta.coach}</span>}
                                                </div>
                                            )}
                                            {(canManageTournament(selectedTournament) || r.teamId) && (
                                                <div className="registration-actions">
                                                    
                                                    {r.teamId && (
                                                        <button
                                                            type="button"
                                                            className="reg-btn approve"
                                                            onClick={() => openTeamPreview(r.teamId)}
                                                        >
                                                            Ver equipo
                                                        </button>
                                                    )}
                                                    {canManageTournament(selectedTournament) && (
                                                        <button
                                                            type="button"
                                                            className="reg-btn reject"
                                                            onClick={() => removeRegistration(selectedTournament, r._id)}
                                                        >
                                                            Quitar equipo
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* {canManageTournament(selectedTournament) && (
                                                <div className="registration-actions">
                                                    <button
                                                        type="button"
                                                        className="reg-btn reject"
                                                        onClick={() => removeRegistration(selectedTournament, r._id)}
                                                    >
                                                        Quitar equipo
                                                    </button>
                                                </div>
                                            )} */}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {(selectedTournament.platform || selectedTournament.server || selectedTournament.gender) && (
                            <div className="stats-grid" style={{ marginTop: 14 }}>
                                {selectedTournament.platform && (
                                    <div className="stat-box">
                                        <span className="label">Plataforma</span>
                                        <span className="value">{selectedTournament.platform}</span>
                                    </div>
                                )}
                                {selectedTournament.server && (
                                    <div className="stat-box">
                                        <span className="label">Servidor</span>
                                        <span className="value">{selectedTournament.server}</span>
                                    </div>
                                )}
                                {selectedTournament.gender && (
                                    <div className="stat-box">
                                        <span className="label">Género</span>
                                        <span className="value">{selectedTournament.gender}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {isRiotGame(selectedTournament.game) && selectedTournament.riotRequirements?.required && (
                            <div className="info-section" style={{ marginTop: 18 }}>
                                <h4><i className='bx bx-shield-quarter'></i> Requisitos Riot</h4>
                                <div className="riot-requirements">
                                    <div><strong>Cuenta Riot vinculada:</strong> requerida</div>
                                    {selectedTournament.riotRequirements?.minTier && (
                                        <div><strong>Rango mínimo:</strong> {selectedTournament.riotRequirements.minTier}</div>
                                    )}
                                    {selectedTournament.riotRequirements?.maxTier && (
                                        <div><strong>Rango máximo:</strong> {selectedTournament.riotRequirements.maxTier}</div>
                                    )}
                                    {typeof selectedTournament.riotRequirements?.soloQueueOnly === 'boolean' && (
                                        <div><strong>Solo Queue:</strong> {selectedTournament.riotRequirements.soloQueueOnly ? 'Sí' : 'No'}</div>
                                    )}
                                    <div className="riot-note">Se verifica tu perfil Riot para evitar trampas.</div>
                                </div>
                            </div>
                        )}

                        {selectedTournament.rulesPdf && (
                            <a
                                className="btn-secondary"
                                href={selectedTournament.rulesPdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 8 }}
                            >
                                Ver reglas (PDF)
                            </a>
                        )}

                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => setSelectedTournament(null)}>Cerrar</button>
                            {canManageTournament(selectedTournament) && (
                                <button className="btn-secondary" onClick={() => goToEditTournament(selectedTournament)}>
                                    Editar
                                </button>
                            )}
                            {canManageTournament(selectedTournament) && (
                                <div className="tournament-admin-actions">
                                    <button className="btn-secondary" onClick={() => updateTournamentStatus(selectedTournament, 'open')}>
                                        Abrir inscripciones
                                    </button>
                                    <button className="btn-secondary" onClick={() => updateTournamentStatus(selectedTournament, 'close')}>
                                        Cerrar inscripciones
                                    </button>
                                    <button className="btn-secondary" onClick={() => updateTournamentStatus(selectedTournament, 'cancel')}>
                                        Cancelar torneo
                                    </button>
                                </div>
                            )}
                            
                        </div>
                        <div className="modal-actions-footer">
                            {!hasRegisteredTeam(selectedTournament) && (
                                <button 
                                    className="btn-primary-action" 
                                    onClick={() => {
                                        if (needsRiot(selectedTournament) && !hasRiotLinked) {
                                            notify('danger', 'Riot requerido', 'Debes vincular tu cuenta Riot en Settings para inscribirte.');
                                            navigate('/settings');
                                            return;
                                        }
                                        setSelectedTournament(null);
                                        goToRegistration(selectedTournament);
                                    }}
                                    style={{
                                        background: GAME_CONFIG[selectedTournament.game]?.color || '#8EDB15',
                                        boxShadow: `0 0 15px ${GAME_CONFIG[selectedTournament.game]?.color}40`
                                    }}
                                    disabled={needsRiot(selectedTournament) && !hasRiotLinked}
                                >
                                    {detailLoading ? 'Cargando...' : 'Inscribirse Ahora'} <i className='bx bx-right-arrow-alt'></i>
                                </button>
                            )}
                            {canManageTournament(selectedTournament) && (
                                <button className="btn-danger-action" onClick={() => deleteTournament(selectedTournament)}>
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showTeamPreview && (
            <div className="modal-overlay-backdrop" onClick={() => setShowTeamPreview(false)} style={{zIndex: 10001}}>
                <div className="tournament-details-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header-banner" style={{backgroundImage: `url(${selectedTeamPreview?.bannerImage || getGameImage(selectedTeamPreview?.game || '')})`}}>
                        <div className="overlay-dark"></div>
                        <button className="close-btn-round" onClick={() => setShowTeamPreview(false)}><i className='bx bx-x'></i></button>
                        <div className="banner-content">
                            <div className="team-brand">
                                <div className="team-logo large">
                                    {selectedTeamPreview?.logo
                                        ? <img src={toAssetUrl(selectedTeamPreview.logo)} alt={selectedTeamPreview?.name || 'Equipo'} />
                                        : <span>{getInitials(selectedTeamPreview?.name)}</span>
                                    }
                                </div>
                                <div>
                                    <h2>{selectedTeamPreview?.name || 'Equipo'}</h2>
                                    <div className="host-info">
                                        <span>Juego:</span>
                                        <strong style={{color: '#fff'}}>{selectedTeamPreview?.game || 'N/A'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-content-body">
                        <div className="info-section">
                            <h4><i className='bx bx-info-circle'></i> Datos del equipo</h4>
                            <p>Categoría: {selectedTeamPreview?.category || 'N/A'}</p>
                            <p>País: {selectedTeamPreview?.teamCountry || 'N/A'}</p>
                            <p>Nivel: {selectedTeamPreview?.teamLevel || 'N/A'}</p>
                            <p>Coach: {selectedTeamPreview?.roster?.coach?.nickname || 'N/A'}</p>
                        </div>
                        <div className="info-section">
                            <h4><i className='bx bx-group'></i> Roster</h4>
                            <div className="tournament-registrations">
                                {(selectedTeamPreview?.roster?.starters || []).map((p, i) => (
                                    <div key={`team-prev-${i}`} className="registration-row">
                                        <div className="registration-main">
                                            <strong>{p?.nickname || 'Vacante'}</strong>
                                            {p?.role && <span className="reg-status approved">{p.role}</span>}
                                        </div>
                                        <div className="registration-roster">
                                            {canSeeTeamIds(selectedTournament)
                                                ? `${p?.gameId ? `ID: ${p.gameId}` : 'ID: N/A'} â€¢ ${p?.region || 'Región: N/A'}${p?.riotId ? ` â€¢ Riot: ${p.riotId}` : ''}`
                                                : `ID: Oculto â€¢ ${p?.region || 'Región: N/A'}`
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => setShowTeamPreview(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- MAIN LAYOUT GRID --- */}
        <div className="main-layout-container">
            
            {/* LEFT COLUMN */}
            <div className="content-area">
                <div className="tournaments-page">
                    
                    {/* ═══ HERO / PROMO CAROUSEL ═══ */}
                    <div className="tn__hero" style={{ background: activeSlide.gradient }}>
                        {/* Animated particles */}
                        <div className="tn__hero-particles">
                            {activeSlide.particles.map((p, i) => (
                                <i key={`${current}-${i}`} className={`bx ${p} tn__particle`} style={{ '--delay': `${i * 0.4}s`, '--x': `${20 + i * 22}%`, color: activeSlide.accent }} />
                            ))}
                        </div>
                        <div className="tn__hero-glow" style={{ background: `radial-gradient(ellipse at 30% 80%, ${activeSlide.accent}15 0%, transparent 60%)` }} />
                        
                        <div className="tn__hero-content">
                            <span className="tn__hero-badge" style={{ background: `${activeSlide.accent}20`, color: activeSlide.accent, borderColor: `${activeSlide.accent}40` }}>
                                <i className={`bx ${activeSlide.icon}`}></i> {activeSlide.badge}
                            </span>
                            <h1 className="tn__hero-title">{activeSlide.title}</h1>
                            <p className="tn__hero-subtitle">{activeSlide.subtitle}</p>
                            <div className="tn__hero-actions">
                                <button 
                                    className="tn__hero-btn tn__hero-btn--primary" 
                                    style={{ background: activeSlide.accent, boxShadow: `0 8px 25px ${activeSlide.accent}40` }}
                                    onClick={() => {
                                        if (activeSlide.ctaAction === 'create') handleCreateClick();
                                        else if (activeSlide.ctaAction === 'team') navigate('/create-team');
                                    }}
                                >
                                    {activeSlide.cta} <i className={`bx ${activeSlide.ctaIcon}`}></i>
                                </button>
                                <button className="tn__hero-btn tn__hero-btn--ghost" onClick={() => setShowInfoModal(true)}>
                                    Más Info <i className='bx bx-info-circle'></i>
                                </button>
                            </div>
                        </div>

                        {/* Indicator dots */}
                        <div className="tn__hero-dots">
                            {PROMO_SLIDES.map((_, index) => (
                                <button key={index} className={`tn__hero-dot ${index === current ? 'active' : ''}`} onClick={() => handleDotClick(index)} style={index === current ? { background: activeSlide.accent, boxShadow: `0 0 8px ${activeSlide.accent}` } : {}} />
                            ))}
                        </div>
                        
                        {/* Slide counter */}
                        <div className="tn__hero-counter">
                            <span style={{ color: activeSlide.accent }}>{String(current + 1).padStart(2, '0')}</span>
                            <span className="tn__hero-counter-sep">/</span>
                            <span>{String(PROMO_SLIDES.length).padStart(2, '0')}</span>
                        </div>
                    </div>

                    {/* ═══ STATS BAR ═══ */}
                    <div className="tn__stats-bar">
                        <div className="tn__stat">
                            <i className='bx bx-trophy' style={{ color: '#ffd700' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.total}</span>
                                <span className="tn__stat-label">Torneos</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-check-circle' style={{ color: '#00ff88' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.active}</span>
                                <span className="tn__stat-label">Activos</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-dollar-circle' style={{ color: '#4facfe' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">${stats.totalPrize.toLocaleString()}</span>
                                <span className="tn__stat-label">En premios</span>
                            </div>
                        </div>
                        <div className="tn__stat-divider" />
                        <div className="tn__stat">
                            <i className='bx bx-game' style={{ color: '#f093fb' }}></i>
                            <div className="tn__stat-info">
                                <span className="tn__stat-value">{stats.uniqueGames}</span>
                                <span className="tn__stat-label">Juegos</span>
                            </div>
                        </div>
                    </div>

                                        {/* ═══ HEADER + ACTIONS + SEARCH ═══ */}
                    <div className="header-actions">
                        <div className="tn__header-left">
                            <h1><i className='bx bx-trophy'></i> Torneos</h1>
                            <p>Explora, compite y gana premios.</p>
                        </div>
                        <div className="tn__header-right">
                            <div className="tn__search-box">
                                <i className='bx bx-search'></i>
                                <input 
                                    type="text" 
                                    placeholder="Buscar torneo, juego, organizador..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)} 
                                />
                                {search && (
                                    <button className="tn__search-clear" onClick={() => setSearch('')}>
                                        <i className='bx bx-x'></i>
                                    </button>
                                )}
                            </div>
                            <div className="action-group">
                                <button className="create-btn toggle-right-sidebar-btn mobile-only" onClick={(e) => { e.stopPropagation(); setIsRightPanelOpen(!isRightPanelOpen); }}><i className='bx bx-layout'></i> Info</button>
                                <button className="info-btn" onClick={() => setShowInfoModal(true)} title="¿Cómo ser organizador?"><i className='bx bx-question-mark'></i></button>
                                <button className="create-btn" onClick={handleCreateClick}><i className='bx bx-plus'></i> Crear Torneo</button>
                            </div>
                        </div>
                    </div>

                    {/* ═══ STATUS FILTERS ═══ */}
                    <div className="tn__status-filters">
                        {[
                            { key: 'all', label: 'Todos', icon: 'bx-grid-alt' },
                            { key: 'open', label: 'Abiertos', icon: 'bx-check-circle', dot: '#00ff88' },
                            { key: 'ongoing', label: 'En Curso', icon: 'bx-loader-circle', dot: '#4facfe' },
                            { key: 'finished', label: 'Finalizados', icon: 'bx-flag', dot: '#888' },
                        ].map(s => (
                            <button 
                                key={s.key} 
                                className={`tn__status-btn ${activeStatus === s.key ? 'active' : ''}`} 
                                onClick={() => setActiveStatus(s.key)}
                            >
                                {s.dot && <span className="tn__status-dot" style={{ background: s.dot }} />}
                                <i className={`bx ${s.icon}`}></i> {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="filters-bar">
                        <div className="chips-wrapper">
                            {(showAllFilters ? Object.keys(GAME_CONFIG) : Object.keys(GAME_CONFIG).slice(0, 10)).map(cat => {
                                const style = GAME_CONFIG[cat] || { color: '#fff' };
                                return (
                                    <button key={cat} className={`game-chip ${activeFilter === cat ? 'active' : ''}`} onClick={() => setActiveFilter(cat)} style={{ '--chip-color': style.color }}>
                                        <i className={`bx ${style.icon || 'bx-game'}`}></i><span>{cat}</span>
                                    </button>
                                )
                            })}
                        </div>
                        <button className="toggle-filters-btn" onClick={() => setShowAllFilters(!showAllFilters)}>
                            {showAllFilters ? <span><i className='bx bx-chevron-up'></i> Menos</span> : <span><i className='bx bx-chevron-down'></i> Ver más</span>}
                        </button>
                    </div>

                    {/* ═══ RESULTS COUNT ═══ */}
                    {(search || activeStatus !== 'all' || activeFilter !== 'All') && (
                        <div className="tn__results-count">
                            <span>{displayTournaments.length} torneo{displayTournaments.length !== 1 ? 's' : ''} encontrado{displayTournaments.length !== 1 ? 's' : ''}</span>
                            {(search || activeStatus !== 'all') && (
                                <button className="tn__clear-filters" onClick={() => { setSearch(''); setActiveStatus('all'); setActiveFilter('All'); }}>
                                    <i className='bx bx-x'></i> Limpiar filtros
                                </button>
                            )}
                        </div>
                    )}

                    {/* ═══ TOURNAMENTS GRID ═══ */}
                    <div className="tournaments-grid">
                        {loadingTournaments ? (
                            <div className="tn__loading">
                                <div className="tn__spinner" />
                                <p>Cargando torneos...</p>
                            </div>
                        ) : displayTournaments.length > 0 ? (
                            displayTournaments.map((torneo) => {
                                const [ocupados, totales] = torneo.slots.split('/').map(Number);
                                const pct = totales > 0 ? (ocupados / totales) * 100 : 0;
                                const estaLleno = ocupados >= totales;
                                const hasTeam = userTeamIds.length > 0;
                                const alreadyIn = hasRegisteredTeam(torneo);
                                const canJoin = !estaLleno && hasTeam && !alreadyIn;
                                const gameColor = GAME_CONFIG[torneo.game]?.color || '#8EDB15';
                                const statusCfg = STATUS_CONFIG[torneo.status] || STATUS_CONFIG.open;

                                return (
                                    <div key={torneo.id} className="tournament-card-pro" style={{ '--card-game': gameColor }}>
                                        <div className="tn__card-glow" />
                                        <div className="tn__card-accent" />
                                        <div className="card-image-container">
                                            <img src={getGameImage(torneo.game)} alt={torneo.game} loading="lazy" />
                                            <div className="overlay-gradient"></div>
                                            <div className="top-badges">
                                                <span className="game-pill" style={{ borderColor: gameColor, color: '#fff' }}>
                                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-joystick'}`}></i> {torneo.game}
                                                </span>
                                                <span className="tn__card-status" style={{ background: `${statusCfg.color}18`, color: statusCfg.color, border: `1px solid ${statusCfg.color}30` }}>
                                                    <i className={`bx ${statusCfg.icon}`}></i> {statusCfg.label}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <div className="tn__card-header">
                                                <span className="tournament-id-tag">#{torneo.tournamentId}</span>
                                                {torneo.entryFee && torneo.entryFee !== 'Gratis' && (
                                                    <span className="tn__entry-badge"><i className='bx bx-dollar'></i> {torneo.entryFee}</span>
                                                )}
                                                {torneo.entryFee === 'Gratis' && (
                                                    <span className="tn__free-badge"><i className='bx bx-gift'></i> Gratis</span>
                                                )}
                                            </div>
                                            <h3 title={torneo.title}>{torneo.title}</h3>
                                            
                                            <div className="tn__card-meta">
                                                <div className="tn__meta-item"><i className='bx bx-calendar'></i> {torneo.date}</div>
                                                <div className="tn__meta-item"><i className='bx bx-time'></i> {torneo.time}</div>
                                                {torneo.format && <div className="tn__meta-item"><i className='bx bx-shield'></i> {torneo.format}</div>}
                                                {torneo.platform && <div className="tn__meta-item"><i className='bx bx-desktop'></i> {torneo.platform}</div>}
                                            </div>

                                            <div className="tn__card-prize-row">
                                                <div className="tn__prize-box" style={{ borderColor: `${gameColor}30` }}>
                                                    <i className='bx bx-trophy' style={{ color: '#ffd700' }}></i>
                                                    <span>{torneo.prize || 'Sin premio'}</span>
                                                </div>
                                                {torneo.gender && (
                                                    <span className="tn__gender-tag">
                                                        <i className='bx bx-user'></i> {torneo.gender}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="tn__slots-section">
                                                <div className="tn__slots-info">
                                                    <span><i className='bx bx-group'></i> {torneo.slots} Equipos</span>
                                                    <span className="tn__slots-pct">{Math.round(pct)}%</span>
                                                </div>
                                                <div className="tn__slots-bar">
                                                    <div className="tn__slots-fill" style={{ width: `${pct}%`, background: estaLleno ? '#ef4444' : gameColor }} />
                                                </div>
                                            </div>

                                            <div className="tn__card-organizer">
                                                <i className='bx bxs-badge-check' style={{ color: '#00b894' }}></i>
                                                <span>{torneo.organizer}</span>
                                            </div>

                                            <div className="card-actions">
                                                <button className="btn-details" onClick={() => openTournamentDetails(torneo)}>
                                                    <i className='bx bx-info-circle'></i> Detalles
                                                </button>
                                                {canJoin ? (
                                                    <button 
                                                        className="btn-join"
                                                        onClick={() => {
                                                            if (needsRiot(torneo) && !hasRiotLinked) {
                                                                notify('danger', 'Riot requerido', 'Debes vincular tu cuenta Riot en Settings para inscribirte.');
                                                                navigate('/settings');
                                                                return;
                                                            }
                                                            goToRegistration(torneo);
                                                        }}
                                                        style={{ background: gameColor, color: '#000' }}
                                                    >
                                                        <i className='bx bx-log-in-circle'></i> Inscribirse
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className={`btn-join ${!hasTeam ? '' : 'disabled'}`}
                                                        onClick={() => { if (!hasTeam) navigate('/create-team'); }}
                                                        style={{
                                                            background: !hasTeam ? '#8EDB15' : '#333',
                                                            cursor: !hasTeam ? 'pointer' : 'not-allowed',
                                                            color: !hasTeam ? '#0b0f0c' : '#666'
                                                        }}
                                                        disabled={hasTeam || alreadyIn || estaLleno}
                                                    >
                                                        {estaLleno ? 'Cerrado' : alreadyIn ? 'Ya inscrito' : !hasTeam ? 'Crear equipo' : 'No disponible'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="tn__empty-state">
                                <div className="tn__empty-icon"><i className='bx bx-ghost'></i></div>
                                <h3>No se encontraron torneos</h3>
                                <p>{search ? `Sin resultados para "${search}"` : 'No hay torneos disponibles en esta categoría.'}</p>
                                {search && (
                                    <button className="tn__empty-btn" onClick={() => { setSearch(''); setActiveFilter('All'); setActiveStatus('all'); }}>
                                        <i className='bx bx-refresh'></i> Ver todos
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className={`sidebar-area right-sidebar ${isRightPanelOpen ? 'open' : ''}`} ref={rightPanelRef}>
                <aside className="right-info-sidebar">
                    
                    {/* Botón cerrar para móvil */}
                    <button className="close-right-sidebar mobile-only" onClick={() => setIsRightPanelOpen(false)}>
                        <i className='bx bx-x'></i>
                    </button>
                    
                    {/* WIDGET 1: ACCIONES RÁPIDAS (Lo mantenemos) */}
                    <div className="sidebar-widget">
                        <h3><i className='bx bx-bolt-circle'></i> Acciones Rápidas</h3>
                        <div className="quick-actions-grid">
                            <button className="qa-btn" onClick={() => navigate('/create-team')}>
                                <i className='bx bx-group'></i> Crear Equipo
                            </button>
                            <button className="qa-btn" onClick={() => navigate('/premium')}>
                                <i className='bx bx-star'></i> Premium
                            </button>
                        </div>
                    </div>

                    {/* WIDGET 2: CALENDARIO */}
                    <div className="sidebar-widget">
                        {/* Puedes pasarle datos reales en el futuro con: <MatchCalendar matches={misDatos} /> */}
                        <MatchCalendar />
                    </div>

                    {/* WIDGET 3: (Opcional) BANNER PUBLICIDAD O INFO EXTRA */}
                    <div className="sidebar-widget tn__promo-widget">
                        <div className="tn__promo-icon"><i className='bx bx-search-alt-2'></i></div>
                        <h4>¿Buscas Scrims?</h4>
                        <p>Encuentra rivales de tu nivel ahora mismo.</p>
                        <button className="tn__promo-btn" onClick={() => navigate('/teams')}>
                            <i className='bx bx-target-lock'></i> Buscar Scrim
                        </button>
                    </div>

                </aside>
            </div>
            </div>
            
            {isRightPanelOpen && <div className="sidebar-overlay-mobile"></div>}

        </div>
  );
};

export default Tournaments;
