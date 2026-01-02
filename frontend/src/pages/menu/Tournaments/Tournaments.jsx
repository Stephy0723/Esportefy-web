import React, { useState, useEffect, useRef } from 'react';
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

const Tournaments = () => {
  const navigate = useNavigate();
  const { notify } = useNotification(); 
  
  const { user, loading } = useAuth(); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);
  
  // ESTADO MODAL ORGANIZADOR
  const [showInfoModal, setShowInfoModal] = useState(false); 
  const [current, setCurrent] = useState(0);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const rightPanelRef = useRef(null);

  // Helper para obtener imagen segura
  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || GAME_IMAGES["Default"];
  };

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
  ]);

  // --- LOGICA CARRUSEL ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === sponsors.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
                    
                    <div className="modal-header-banner" style={{backgroundImage: `url(${getGameImage(selectedTournament.game)})`}}>
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

                        <div className="modal-actions-footer">
                            <button className="btn-secondary" onClick={() => setSelectedTournament(null)}>Cerrar</button>
                            <button 
                                className="btn-primary-action" 
                                onClick={() => { setSelectedTournament(null); goToRegistration(selectedTournament); }}
                                style={{
                                    background: GAME_CONFIG[selectedTournament.game]?.color || '#8EDB15',
                                    boxShadow: `0 0 15px ${GAME_CONFIG[selectedTournament.game]?.color}40`
                                }}
                            >
                                Inscribirse Ahora <i className='bx bx-right-arrow-alt'></i>
                            </button>
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
                                            <h3 title={torneo.title}>{torneo.title}</h3>
                                            <div className="info-row">
                                                <div className="info-pill"><i className='bx bx-calendar'></i> {torneo.date}</div>
                                                <div className="info-pill prize-pill"><i className='bx bx-trophy'></i> {torneo.prize}</div>
                                            </div>

                                            <div className="tournament-status-row">
                                                <div className="teams-counter"><i className='bx bx-group'></i><span>{torneo.slots} Equipos</span></div>
                                                <div className={`status-label ${estaLleno ? 'full' : 'available'}`}>
                                                    {estaLleno ? <><i className='bx bx-lock-alt'></i> Cerrado</> : <><i className='bx bx-check-circle'></i> Disponible</>}
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <button className="btn-details" onClick={() => setSelectedTournament(torneo)}>
                                                    <i className='bx bx-info-circle'></i> Ver Info
                                                </button>
                                                <button 
                                                    className={`btn-join ${estaLleno ? 'disabled' : ''}`}
                                                    onClick={() => !estaLleno && goToRegistration(torneo)}
                                                    style={{
                                                        background: estaLleno ? '#333' : (GAME_CONFIG[torneo.game]?.color || '#8EDB15'),
                                                        cursor: estaLleno ? 'not-allowed' : 'pointer',
                                                        color: estaLleno ? '#666' : '#000'
                                                    }}
                                                >
                                                    {estaLleno ? 'Cerrado' : 'Inscribirse'}
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