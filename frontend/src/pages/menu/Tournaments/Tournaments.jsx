import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';

// --- CONFIGURACIÓN DE DATOS (COLORES DE JUEGOS) ---
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
  
  // --- ESTADOS Y LÓGICA ---
  const [userRole, setUserRole] = useState('gamer'); 
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Lógica de Filtros
  const allCategories = Object.keys(GAME_CONFIG).filter(key => key !== 'All'); 
  const categoriesToShow = ['All', ...allCategories]; 
  const visibleCategories = showAllFilters ? categoriesToShow : categoriesToShow.slice(0, 8); 

  // Datos de Prueba
  const [tournaments, setTournaments] = useState([
    {
      id: 1,
      game: 'Valorant',
      title: 'Valorant Masters: Tokyo',
      date: '2024-10-24',
      time: '18:00',
      prize: '$50,000',
      entry: 'Gratis',
      slots: '12/16',
      image: GAME_IMAGES['Valorant']
    },
    {
      id: 2,
      game: 'League of Legends',
      title: 'Summoner\'s Cup',
      date: '2024-10-25',
      time: '20:00',
      prize: '$10,000',
      entry: '$50',
      slots: '8/32',
      image: GAME_IMAGES['League of Legends']
    },
    {
      id: 3,
      game: 'Mobile Legends',
      title: 'M5 Qualifier',
      date: '2024-11-01',
      time: '16:00',
      prize: '$25,000',
      entry: 'Gratis',
      slots: '60/64',
      image: GAME_IMAGES['Mobile Legends']
    }
  ]);

  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  // Navegación
  const goToRegistration = (torneo) => {
    navigate('/team-registration', { state: { tournament: torneo } });
  };

  const handleCreateClick = () => {
    if (userRole === 'organizer') {
        navigate('/create-tournament');
    } else {
        if(window.confirm("Solo los Organizadores Verificados pueden crear torneos. ¿Deseas solicitar la verificación?")) {
            navigate('/organizer-application');
        }
    }
  };

  return (
    // CAMBIO: Wrapper limpio que permite que el CSS controle el fondo
    <div className="tournaments-page-wrapper">
        
        <div className="tournaments-page">
            
            {/* HERO BANNER */}
            <div className="hero-banner">
                <div className="hero-content">
                    <span className="badge-live">● EN VIVO</span>
                    <h1>World Championship 2024</h1>
                    <p>Disfruta de la gran final con los mejores equipos del mundo.</p>
                    <button className="hero-btn">Ver Transmisión</button>
                </div>
            </div>

            {/* HEADER & ACTIONS */}
            <div className="header-actions">
                <div>
                    <h1>🏆 Torneos Activos</h1>
                    <p>Filtra por tu juego favorito e inscríbete.</p>
                </div>
                <button className="create-btn" onClick={handleCreateClick}>
                    <i className='bx bx-plus'></i> Crear Torneo
                </button>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="filters-bar">
                <div className="chips-wrapper">
                    {visibleCategories.map(cat => {
                        const style = GAME_CONFIG[cat] || { color: '#fff', icon: 'bx-game' };
                        const isActive = activeFilter === cat;

                        return (
                            <button 
                                key={cat} 
                                className={`game-chip ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveFilter(cat)}
                                // Pasamos el color como variable CSS para que el SCSS lo use
                                style={{ '--chip-color': style.color }}
                            >
                                <i className={`bx ${style.icon}`}></i>
                                <span>{cat}</span>
                            </button>
                        )
                    })}
                </div>

                <button className="toggle-filters-btn" onClick={() => setShowAllFilters(!showAllFilters)}>
                    {showAllFilters ? (
                         <span><i className='bx bx-chevron-up'></i> Menos</span>
                    ) : (
                         <span><i className='bx bx-chevron-down'></i> Ver más juegos</span>
                    )}
                </button>
            </div>

            {/* GRID DE TORNEOS */}
            <div className="tournaments-grid">
                {filteredTournaments.length > 0 ? (
                    filteredTournaments.map((torneo) => (
                        <div key={torneo.id} className="tournament-card">
                            
                            {/* Imagen y Tags */}
                            <div className="card-img">
                                <img src={torneo.image} alt={torneo.title} />
                                
                                <div className="game-tag" style={{borderColor: GAME_CONFIG[torneo.game]?.color}}>
                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon}`}></i>
                                    {torneo.game}
                                </div>

                                <div className="hashtags-overlay">
                                    <span className="hash-badge FreeEntry">Free Entry</span>
                                    <span className="hash-badge Nuevo">Nuevo</span>
                                </div>
                            </div>
                            
                            {/* Información */}
                            <div className="card-body">
                                <h3>{torneo.title}</h3>
                                
                                <div className="meta-row">
                                    <span><i className='bx bx-calendar'></i> {torneo.date}</span>
                                    <span className="prize">{torneo.prize}</span>
                                </div>
                                
                                <div className="card-footer">
                                    <div className="slots-bar">
                                        <div className="fill" style={{width: '75%', background: GAME_CONFIG[torneo.game]?.color}}></div>
                                    </div>
                                    
                                    <div className="footer-actions">
                                        <span className="slots-text">{torneo.slots} Equipos</span>
                                        <button className="join-btn" onClick={() => goToRegistration(torneo)}>
                                            Inscribirse
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-results">
                        <i className='bx bx-ghost'></i>
                        <p>No hay torneos de {activeFilter} en este momento.</p>
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};

export default Tournaments;