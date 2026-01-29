import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';
import MatchCalendar from '../../../components/Calendar/MatchCalendar/WidgetCalendar';


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

const sponsors = [
    {
      id: 1,
      name: "Red Bull",
      badgeColor: "linear-gradient(45deg, #f00, #ff0)",
      bgImage: "https://images.unsplash.com/photo-1621503747124-777616674176?q=80&w=2070&auto=format&fit=crop",
      logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f5/Red_Bull_GmbH_logo.svg/1200px-Red_Bull_GmbH_logo.svg.png",
      title: "ENERGÍA QUE IMPULSA TU JUEGO",
      desc: "Domina el servidor con la energía que necesitas.",
      btnText: "Conseguir Alas",
      btnIcon: "bx-bolt-circle"
    },
    {
      id: 2,
      name: "Logitech G",
      badgeColor: "linear-gradient(45deg, #00B8FC, #2E3192)", 
      bgImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop", 
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/2560px-Logitech_logo.svg.png", 
      title: "JUEGA A LA VELOCIDAD DE LA LUZ",
      desc: "40% de descuento en periféricos PRO Series.",
      btnText: "Ver Gear",
      btnIcon: "bx-mouse"
    },
    {
      id: 3,
      name: "Intel",
      badgeColor: "linear-gradient(45deg, #0068B5, #00C7FD)",
      bgImage: "https://images.unsplash.com/photo-1591405351990-4726e331f141?q=80&w=2070&auto=format&fit=crop",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Logitech_logo.svg/2560px-Logitech_logo.svg.png",
      title: "POTENCIA, MAXIMIZA TU RENDIMIENTO",
      desc: "Procesadores i9 de 13ava generación.",
      btnText: "Upgrade PC",
      btnIcon: "bx-chip"
    }
];

const BACKEND_URL = 'http://localhost:4000';

const toAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}/${path.replace(/^\//, '')}`;
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
      setCurrent((prev) => (prev === sponsors.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // --- CARGA DINÁMICA DE TORNEOS ---
useEffect(() => {
    const fetchTournaments = async () => {
        try {
            setLoadingTournaments(true);
            const response = await axios.get('http://localhost:4000/api/tournaments');
            
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

  const openTournamentDetails = async (torneo) => {
    setDetailLoading(true);
    setSelectedTournament({ ...torneo });
    try {
      const response = await axios.get(`http://localhost:4000/api/tournaments/${torneo.tournamentId}`);
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
  const activeSponsor = sponsors[current] || sponsors[0];
  const getGameImage1 = (gameName) => GAME_IMAGES[gameName] || GAME_IMAGES["Default"];

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

  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  const goToRegistration = (torneo) => navigate('/team-registration', { state: { tournament: torneo } });
  const needsRiot = (torneo) => isRiotGame(torneo.game) && torneo?.riotRequirements?.required;
  const hasRiotLinked = Boolean(user?.connections?.riot?.verified);

  const canManageTournament = (torneo) => {
    if (!user) return false;
    return user?.isAdmin === true || String(torneo?.organizerId) === String(user?._id);
  };

  const goToEditTournament = (torneo) => {
    navigate('/create-tournament', { state: { editTournament: torneo } });
  };

  const updateRegistrationStatus = async (torneo, registrationId, status) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.patch(
        `http://localhost:4000/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
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
        `http://localhost:4000/api/tournaments/${torneo.tournamentId}/registrations/${registrationId}`,
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
        `http://localhost:4000/api/tournaments/${torneo.tournamentId}/status`,
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
      const res = await axios.get('http://localhost:4000/api/teams');
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
      await axios.delete(`http://localhost:4000/api/tournaments/${torneo.tournamentId}`, {
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

        // VALIDACIÓN CLAVE: Usamos el campo de tu base de datos
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
        {/* 2. MODAL DE DETALLES DEL TORNEO (EL QUE NO TE SALÍA)    */}
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
                                                <strong>{r.teamName}</strong>
                                                {r.status && <span className={`reg-status ${r.status}`}>{r.status}</span>}
                                            </div>
                                            
                                            {Array.isArray(r.roster?.starters) && r.roster.starters.length > 0 && (
                                                <div className="registration-roster">
                                                    {r.roster.starters.map(p => p.nickname || '').filter(Boolean).join(' • ')}
                                                </div>
                                            )}
                                            {/* {Array.isArray(r.roster?.starters) && r.roster.starters.length > 0 && (
                                                <div className="registration-roster">
                                                    {r.roster.starters.map((p, i) => (
                                                        <span key={`${r._id}-p-${i}`}>
                                                            {p.nickname}{p.riotId ? ` (${p.riotId})` : ''}{i < r.roster.starters.length - 1 ? ' • ' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )} */}
                                            
                                            {(r.teamMeta || r.teamId) && (
                                                <div className="registration-meta">
                                                    {r.teamMeta?.category && <span>Categoría: {r.teamMeta.category}</span>}
                                                    {r.teamMeta?.teamCountry && <span>País: {r.teamMeta.teamCountry}</span>}
                                                    {r.teamMeta?.teamLevel && <span>Nivel: {r.teamMeta.teamLevel}</span>}
                                                    {r.teamMeta?.coach && <span>Coach: {r.teamMeta.coach}</span>}
                                                </div>
                                            )}{canManageTournament(selectedTournament) && (
                                                <div className="registration-actions">
                                                    <button
                                                        type="button"
                                                        className="reg-btn reject"
                                                        onClick={() => removeRegistration(selectedTournament, r._id)}
                                                    >
                                                        Quitar equipo
                                                    </button>
                                                </div>
                                            )}
                                            {r.teamId && (
                                                
                                                <button
                                                    type="button"
                                                    className="reg-btn approve"
                                                    onClick={() => openTeamPreview(r.teamId)}
                                                >
                                                    Ver equipo
                                                </button>
                                                
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
                            <h2>{selectedTeamPreview?.name || 'Equipo'}</h2>
                            <div className="host-info">
                                <span>Juego:</span>
                                <strong style={{color: '#fff'}}>{selectedTeamPreview?.game || 'N/A'}</strong>
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
                                            {p?.gameId ? `ID: ${p.gameId}` : 'ID: N/A'} • {p?.region || 'Región: N/A'}{p?.riotId ? ` • Riot: ${p.riotId}` : ''}
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
                    
                    {/* HERO */}
                    <div className="hero-banner cinema-style">
                        {sponsors.map((sponsor, index) => (
                            <div key={sponsor.id} className={`hero-bg-image ${index === current ? 'active' : ''}`} style={{ backgroundImage: `url('${sponsor.bgImage}')` }}></div>
                        ))}
                        <div className="hero-gradient-overlay"></div>
                        <div className="hero-content-container">
                            <div className="sponsor-tag">
                                <span className="badge-glow" style={{ background: activeSponsor.badgeColor }}>PARTNER OFICIAL</span>
                                <img src={activeSponsor.logo} alt="Sponsor Logo" className="sponsor-logo" />
                            </div>
                            <h1 className="hero-title">{activeSponsor.title}</h1>
                            <p className="hero-subtitle">{activeSponsor.desc}</p>
                            <div className="hero-buttons">
                                <button className="btn-action primary">{activeSponsor.btnText} <i className={`bx ${activeSponsor.btnIcon}`}></i></button>
                                <button className="btn-action secondary">Más Detalles</button>
                            </div>
                        </div>
                        <div className="hero-dots">
                            {sponsors.map((_, index) => (
                                <span key={index} className={`dot ${index === current ? 'active' : ''}`} onClick={() => handleDotClick(index)}></span>
                            ))}
                        </div>
                    </div>

                    {/* HEADER & FILTERS */}
                    <div className="header-actions">
                        <div><h1>🏆 Torneos Activos</h1><p>Explora, compite y gana premios.</p></div>
                        <div className="action-group">
                            <button className="create-btn toggle-right-sidebar-btn mobile-only" onClick={(e) => { e.stopPropagation(); setIsRightPanelOpen(!isRightPanelOpen); }}><i className='bx bx-layout'></i> Info</button>
                            <button className="info-btn" onClick={() => setShowInfoModal(true)}><i className='bx bx-question-mark'></i></button>
                            <button className="create-btn" onClick={handleCreateClick}><i className='bx bx-plus'></i> Crear Torneo</button>
                        </div>
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

                    {/* TOURNAMENTS GRID */}
                    <div className="tournaments-grid">
                        {filteredTournaments.length > 0 ? (
                            filteredTournaments.map((torneo) => {
                                const [ocupados, totales] = torneo.slots.split('/').map(Number);
                                const estaLleno = ocupados >= totales;

                                return (
                                    <div key={torneo.id} className="tournament-card-pro">
                                        <div className="card-image-container">
                                            <img src={getGameImage(torneo.game)} alt={torneo.game} loading="lazy" />
                                            <div className="overlay-gradient"></div>
                                            <div className="top-badges">
                                                <span className="game-pill" style={{borderColor: GAME_CONFIG[torneo.game]?.color || '#fff', color: '#fff'}}>
                                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-joystick'}`}></i> {torneo.game}
                                                </span>
                                                {estaLleno ? (
                                                    <span className="status-badge full" style={{background: '#ff4655', padding:'4px 8px', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'800', color: 'white'}}>LLENO</span>
                                                ) : (
                                                    <span className="status-dot" style={{width:'10px', height:'10px', borderRadius:'50%', background:'#00ff88', boxShadow:'0 0 10px #00ff88'}}></span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="card-content">
                                            <span className="tournament-id-tag" style={{ fontSize: '0.65rem', color: '#888', fontWeight: 'bold' }}>#{torneo.tournamentId}</span>
                                            <h3 title={torneo.title}>{torneo.title}</h3>
                                            <div className="info-row">
                                                <div className="info-pill"><i className='bx bx-calendar'></i> {torneo.date}</div>
                                                <div className="info-pill prize-pill"><i className='bx bx-trophy'></i> {torneo.prize}</div>
                                                <div className="info-pill gender-pill"><i className='bx bx-user'></i> {torneo.gender}</div>
                                            </div>

                                            <div className="tournament-status-row">
                                                <div className="teams-counter"><i className='bx bx-group'></i><span>{torneo.slots} Equipos</span></div>
                                                <div className={`status-label ${estaLleno ? 'full' : 'available'}`}>
                                                    {estaLleno ? <><i className='bx bx-lock-alt'></i> Cerrado</> : <><i className='bx bx-check-circle'></i> Disponible</>}
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <button className="btn-details" onClick={() => openTournamentDetails(torneo)}>
                                                    <i className='bx bx-info-circle'></i> Ver Info
                                                </button>
                                                <button 
                                                    className={`btn-join ${estaLleno ? 'disabled' : ''}`}
                                                    onClick={() => {
                                                        if (estaLleno) return;
                                                        if (needsRiot(torneo) && !hasRiotLinked) {
                                                            notify('danger', 'Riot requerido', 'Debes vincular tu cuenta Riot en Settings para inscribirte.');
                                                            navigate('/settings');
                                                            return;
                                                        }
                                                        goToRegistration(torneo);
                                                    }}
                                                    style={{
                                                        background: (estaLleno || (needsRiot(torneo) && !hasRiotLinked)) ? '#333' : (GAME_CONFIG[torneo.game]?.color || '#8EDB15'),
                                                        cursor: (estaLleno || (needsRiot(torneo) && !hasRiotLinked)) ? 'not-allowed' : 'pointer',
                                                        color: (estaLleno || (needsRiot(torneo) && !hasRiotLinked)) ? '#666' : '#000'
                                                    }}
                                                    disabled={estaLleno || (needsRiot(torneo) && !hasRiotLinked)}
                                                >
                                                    {estaLleno ? 'Cerrado' : (needsRiot(torneo) && !hasRiotLinked) ? 'Riot requerido' : 'Inscribirse'}
                                                </button>
                                            </div>
                                        </div>

                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-results"><i className='bx bx-ghost'></i><h3>Nada por aquí...</h3><p>No hay torneos disponibles.</p></div>
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

                    {/* WIDGET 2: CALENDARIO DE PARTIDOS (AQUÍ ESTÁ) */}
                    <div className="sidebar-widget">
                        {/* Puedes pasarle datos reales en el futuro con: <MatchCalendar matches={misDatos} /> */}
                        <MatchCalendar />
                    </div>

                    {/* WIDGET 3: (Opcional) BANNER PUBLICIDAD O INFO EXTRA */}
                    <div className="sidebar-widget promo-box" style={{marginTop: '20px', padding: '15px', background: 'linear-gradient(45deg, #18181b, #202025)', borderRadius: '12px', border: '1px solid #333'}}>
                        <h4 style={{color: '#fff', fontSize: '0.9rem', marginBottom: '5px'}}>¿Buscas Scrims?</h4>
                        <p style={{color: '#aaa', fontSize: '0.8rem', marginBottom: '10px'}}>Encuentra rivales de tu nivel ahora mismo.</p>
                        <button style={{width: '100%', padding: '8px', background: '#8EDB15', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>Buscar Scrim</button>
                    </div>

                </aside>
            </div>
            </div>
            
            {isRightPanelOpen && <div className="sidebar-overlay-mobile"></div>}

        </div>
  );
};

export default Tournaments;
