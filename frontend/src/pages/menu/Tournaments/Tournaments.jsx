import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';

const GAME_CONFIG = {
  "All":               { color: "#ffffff", icon: "bx-grid-alt" },
  "Valorant":          { color: "#ff4655", icon: "bx-crosshair" },
  "League of Legends": { color: "#c1a05e", icon: "bx-world" },
  "Mobile Legends":    { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "CS:GO 2":           { color: "#de9b35", icon: "bx-target-lock" },
  "FIFA 24":           { color: "#2ecc71", icon: "bx-football" },
  "Fortnite":          { color: "#a349a4", icon: "bx-building" },
  "Call of Duty":      { color: "#54b946", icon: "bx-run" },
  "Free Fire":         { color: "#f39c12", icon: "bx-flame" },
  "Honor of Kings":    { color: "#e6b333", icon: "bx-crown" },
  "Dota 2":            { color: "#e74c3c", icon: "bx-shield" },
  "Rocket League":     { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6":  { color: "#f1c40f", icon: "bx-walk" }
};

const Tournaments = () => {
  const navigate = useNavigate();
  const { notify } = useNotification(); 
  
  const [userRole, setUserRole] = useState('gamer'); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false); 

  // Helper para obtener imagen segura
  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || GAME_IMAGES["Default"];
  };

  // DATOS AMPLIADOS (Mock Data)
  const [tournaments, setTournaments] = useState([
    { id: 1, game: 'Valorant', title: 'Valorant Masters: Tokyo', date: '2024-10-24', time: '18:00', prize: '$50,000', entry: 'Gratis', slots: '12/16' },
    { id: 2, game: 'League of Legends', title: "Summoner's Cup", date: '2024-10-25', time: '20:00', prize: '$10,000', entry: '$50', slots: '8/32' },
    { id: 3, game: 'Mobile Legends', title: 'M5 Qualifier', date: '2024-11-01', time: '16:00', prize: '$25,000', entry: 'Gratis', slots: '60/64' },
    { id: 4, game: 'CS:GO 2', title: 'Blast Premier Fall', date: '2024-11-05', time: '14:00', prize: '$100,000', entry: '$100', slots: '15/16' },
    { id: 5, game: 'Fortnite', title: 'FNCS Global', date: '2024-11-10', time: '17:00', prize: '$2M', entry: 'Gratis', slots: '98/100' },
    { id: 6, game: 'FIFA 24', title: 'eLibertadores', date: '2024-11-12', time: '19:00', prize: '$5,000', entry: '$20', slots: '4/32' },
    { id: 7, game: 'Rocket League', title: 'RLCS Major', date: '2024-11-15', time: '15:00', prize: '$40,000', entry: 'Gratis', slots: '10/16' },
    { id: 8, game: 'Free Fire', title: 'World Series', date: '2024-11-20', time: '20:00', prize: '$15,000', entry: 'Gratis', slots: '45/48' },
    { id: 9, game: 'Call of Duty', title: 'CDL Championship', date: '2024-11-22', time: '21:00', prize: '$200,000', entry: '$150', slots: '7/8' }
  ]);

  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  const goToRegistration = (torneo) => navigate('/team-registration', { state: { tournament: torneo } });

  const handleCreateClick = () => {
    if (userRole === 'organizer') {
        navigate('/create-tournament');
    } else {
        notify('danger', 'Acceso Restringido', 'Solo los Organizadores Verificados pueden crear torneos. Solicita tu verificación.');
    }
  };

  const handleApplyOrganizer = () => {
    navigate('/organizer-application');
    setShowInfoModal(false);
  };

  return (
    <div className="tournaments-page-wrapper">
        
        {/* --- MODAL DE INFORMACIÓN (TÚ CÓDIGO EXACTO) --- */}
        {showInfoModal && (
            <div className="modal-backdrop" onClick={() => setShowInfoModal(false)}>
                <div className="info-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3><i className='bx bx-info-circle'></i> Política de Creadores</h3>
                        <button className="close-btn" onClick={() => setShowInfoModal(false)}>
                            <i className='bx bx-x'></i>
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        <p>Para garantizar la seguridad y calidad de los eventos en Esportefy, la creación de torneos está reservada exclusivamente para <strong>Organizadores Verificados</strong>.</p>
                        <p>Esto nos permite evitar estafas, asegurar el pago de premios y mantener un estándar competitivo profesional.</p>
                        
                        <div className="organizer-promo">
                            <h4>¿Quieres organizar tus propios torneos?</h4>
                            <p>Solicita la insignia de organizador y desbloquea herramientas de gestión avanzadas.</p>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button className="btn-cancel" onClick={() => setShowInfoModal(false)}>Entendido</button>
                        <button className="btn-apply" onClick={handleApplyOrganizer}>
                            Ser Organizador <i className='bx bx-right-arrow-alt'></i>
                        </button>
                    </div>
                </div>
            </div>
        )}

        <div className="tournaments-page">
            
            {/* HERO */}
            <div className="hero-banner">
                <div className="hero-content">
                    <span className="badge-live">● EN VIVO</span>
                    <h1>World Championship 2024</h1>
                    <p>La competencia más grande del año ha comenzado.</p>
                    <button className="hero-btn">Ver Transmisión</button>
                </div>
            </div>

            {/* HEADER */}
            <div className="header-actions">
                <div>
                    <h1>🏆 Torneos Activos</h1>
                    <p>Explora, compite y gana premios.</p>
                </div>
                
                <div className="action-group">
                    <button className="info-btn" onClick={() => setShowInfoModal(true)} title="Información">
                        <i className='bx bx-question-mark'></i>
                    </button>

                    <button className="create-btn" onClick={handleCreateClick}>
                        <i className='bx bx-plus'></i> Crear Torneo
                    </button>
                </div>
            </div>

            {/* FILTROS */}
            <div className="filters-bar">
                <div className="chips-wrapper">
                    {(showAllFilters ? Object.keys(GAME_CONFIG) : Object.keys(GAME_CONFIG).slice(0, 8)).map(cat => {
                         const style = GAME_CONFIG[cat] || { color: '#fff' };
                         return (
                            <button key={cat} 
                                className={`game-chip ${activeFilter === cat ? 'active' : ''}`} 
                                onClick={() => setActiveFilter(cat)}
                                style={{ '--chip-color': style.color }}
                            >
                                <i className={`bx ${style.icon || 'bx-game'}`}></i>
                                <span>{cat}</span>
                            </button>
                         )
                    })}
                </div>
                <button className="toggle-filters-btn" onClick={() => setShowAllFilters(!showAllFilters)}>
                    {showAllFilters ? <span><i className='bx bx-chevron-up'></i> Menos</span> : <span><i className='bx bx-chevron-down'></i> Ver más</span>}
                </button>
            </div>

            {/* GRID */}
            <div className="tournaments-grid">
                {filteredTournaments.length > 0 ? (
                    filteredTournaments.map((torneo) => (
                        <div key={torneo.id} className="tournament-card">
                            <div className="card-img">
                                <img src={getGameImage(torneo.game)} alt={torneo.game} loading="lazy" />
                                
                                <div className="game-tag" style={{borderColor: GAME_CONFIG[torneo.game]?.color || '#fff'}}>
                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-joystick'}`}></i> {torneo.game}
                                </div>
                                <div className="hashtags-overlay">
                                    <span className="hash-badge">Nuevo</span>
                                </div>
                            </div>
                            
                            <div className="card-body">
                                <h3>{torneo.title}</h3>
                                <div className="meta-row">
                                    <span><i className='bx bx-calendar'></i> {torneo.date}</span>
                                    <span className="prize">{torneo.prize}</span>
                                </div>
                                <div className="card-footer">
                                    <div className="slots-bar">
                                        <div className="fill" style={{width: '60%', background: GAME_CONFIG[torneo.game]?.color || '#fff'}}></div>
                                    </div>
                                    <div className="footer-actions">
                                        <span className="slots-text">{torneo.slots} Equipos</span>
                                        <button className="join-btn" onClick={() => goToRegistration(torneo)}>Inscribirse</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <i className='bx bx-ghost'></i> <p>No hay torneos disponibles en esta categoría.</p>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};

export default Tournaments;