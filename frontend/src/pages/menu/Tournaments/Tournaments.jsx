import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';

// Configuración de colores e iconos para TODOS los juegos nuevos
const GAME_CONFIG = {
  "All":                  { color: "#ffffff", icon: "bx-grid-alt" },
  
  // Shooters & Battle Royale
  "Valorant":             { color: "#ff4655", icon: "bx-crosshair" },
  "CS:GO 2":              { color: "#de9b35", icon: "bx-target-lock" },
  "Call of Duty":         { color: "#54b946", icon: "bx-run" },
  "Warzone":              { color: "#54b946", icon: "bx-radar" },
  "Fortnite":             { color: "#a349a4", icon: "bx-building" },
  "Free Fire":            { color: "#f39c12", icon: "bx-flame" },
  "PUBG":                 { color: "#f1c40f", icon: "bx-target-lock" },
  "Apex Legends":         { color: "#e74c3c", icon: "bx-shield-quarter" },
  "Overwatch 2":          { color: "#f39c12", icon: "bx-shield" },
  "Rainbow Six Siege":    { color: "#3498db", icon: "bx-window" },

  // MOBA
  "League of Legends":    { color: "#c1a05e", icon: "bx-world" },
  "Dota 2":               { color: "#e74c3c", icon: "bx-map-alt" },
  "Mobile Legends":       { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "Honor of Kings":       { color: "#e6b333", icon: "bx-crown" },
  "Smite":                { color: "#f1c40f", icon: "bx-bolt-circle" },
  "Wild Rift":            { color: "#00a8ff", icon: "bx-mobile" },

  // Deportes / Pelea / Coches
  "FIFA 24":              { color: "#2ecc71", icon: "bx-football" },
  "NBA 2K24":             { color: "#e67e22", icon: "bx-basketball" },
  "Rocket League":        { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6":     { color: "#f39c12", icon: "bx-walk" },
  "Tekken 8":             { color: "#c0392b", icon: "bx-angry" },

  // Estrategia
  "Clash Royale":         { color: "#3498db", icon: "bx-crown" },
  "Teamfight Tactics":    { color: "#f1c40f", icon: "bx-grid" },
  "Hearthstone":          { color: "#f39c12", icon: "bx-book" },
  "Legends of Runeterra": { color: "#3498db", icon: "bx-book-open" },
  "StarCraft II":         { color: "#00a8ff", icon: "bx-planet" }
};

const Tournaments = () => {
  const navigate = useNavigate();
  const { notify } = useNotification(); 
  
  const { user, loading } = useAuth(); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false); 


  // Helper para obtener imagen segura
  const getGameImage = (gameName) => {
    return GAME_IMAGES[gameName] || GAME_IMAGES["Default"];
  };

  // DATOS AMPLIADOS CON LAS IMÁGENES NUEVAS
  const [tournaments, setTournaments] = useState([
    { id: 1, game: 'Valorant', title: 'Valorant Masters: Tokyo', date: '2024-10-24', time: '18:00', prize: '$50,000', entry: 'Gratis', slots: '12/16' },
    { id: 2, game: 'League of Legends', title: "Summoner's Cup", date: '2024-10-25', time: '20:00', prize: '$10,000', entry: '$50', slots: '8/32' },
    { id: 3, game: 'Mobile Legends', title: 'M5 Qualifier', date: '2024-11-01', time: '16:00', prize: '$25,000', entry: 'Gratis', slots: '60/64' },
    { id: 4, game: 'CS:GO 2', title: 'Blast Premier Fall', date: '2024-11-05', time: '14:00', prize: '$100,000', entry: '$100', slots: '15/16' },
    { id: 5, game: 'Fortnite', title: 'FNCS Global', date: '2024-11-10', time: '17:00', prize: '$2M', entry: 'Gratis', slots: '98/100' },
    { id: 6, game: 'FIFA 24', title: 'eLibertadores', date: '2024-11-12', time: '19:00', prize: '$5,000', entry: '$20', slots: '4/32' },
    { id: 7, game: 'Rocket League', title: 'RLCS Major', date: '2024-11-15', time: '15:00', prize: '$40,000', entry: 'Gratis', slots: '10/16' },
    { id: 8, game: 'Free Fire', title: 'World Series', date: '2024-11-20', time: '20:00', prize: '$15,000', entry: 'Gratis', slots: '45/48' },
    { id: 9, game: 'Call of Duty', title: 'CDL Championship', date: '2024-11-22', time: '21:00', prize: '$200,000', entry: '$150', slots: '7/8' },
    { id: 10, game: 'Tekken 8', title: 'Iron Fist Tournament', date: '2024-11-25', time: '18:00', prize: '$10,000', entry: '$10', slots: '60/64' },
    { id: 11, game: 'Clash Royale', title: 'Crown Championship', date: '2024-11-28', time: '15:00', prize: '$5,000', entry: 'Gratis', slots: '100/128' },
    { id: 12, game: 'Overwatch 2', title: 'OW World Cup', date: '2024-12-01', time: '17:00', prize: '$30,000', entry: '$25', slots: '12/16' }
  ]);

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

  const handleApplyOrganizer = () => {
    navigate('/organizer-application');
    setShowInfoModal(false);
  };

  return (
    <div className="tournaments-page-wrapper">
        
        {/* --- NUEVO: MODAL DE INFORMACIÓN (Blanco y Negro) --- */}
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
                    {(showAllFilters ? Object.keys(GAME_CONFIG) : Object.keys(GAME_CONFIG).slice(0, 10)).map(cat => {
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
                            
                            {/* HEADER CON IMAGEN Y BADGES */}
                            <div className="card-img">
                                <img src={getGameImage(torneo.game)} alt={torneo.game} loading="lazy" />
                                
                                {/* Badge del Juego */}
                                <div className="game-tag" style={{borderColor: GAME_CONFIG[torneo.game]?.color || '#fff'}}>
                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-joystick'}`}></i> 
                                    <span>{torneo.game}</span>
                                </div>
                                
                                {/* Badge Nuevo */}
                                <div className="hashtags-overlay">
                                    <span className="hash-badge">Nuevo</span>
                                </div>
                            </div>
                            
                            {/* CUERPO LIMPIO */}
                            <div className="card-body">
                                {/* Título y Organizador */}
                                <div className="title-section">
                                    <h3>{torneo.title}</h3>
                                    <p className="organizer-text">Organizado por: <span>Esportefy</span></p>
                                </div>

                                {/* Metadatos: Fecha y Premio */}
                                <div className="meta-row">
                                    <div className="meta-item">
                                        <i className='bx bx-calendar'></i> 
                                        <span>{torneo.date}</span>
                                    </div>
                                    <div className="meta-item prize">
                                        <i className='bx bx-trophy'></i> 
                                        <span>{torneo.prize}</span>
                                    </div>
                                </div>

                                {/* Cupos (Sin barra de progreso) */}
                                <div className="slots-info">
                                    <i className='bx bx-group'></i>
                                    <span>Cupos: <strong>{torneo.slots}</strong></span>
                                </div>

                                {/* FOOTER CON DOS BOTONES */}
                                <div className="card-footer-dual">
                                    <button className="btn-secondary">
                                        <i className='bx bx-info-circle'></i> Info
                                    </button>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => goToRegistration(torneo)}
                                        style={{background: GAME_CONFIG[torneo.game]?.color || '#8EDB15'}}
                                    >
                                        Inscribirse
                                    </button>
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