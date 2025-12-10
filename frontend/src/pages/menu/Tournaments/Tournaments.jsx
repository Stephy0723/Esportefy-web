import React, { useState } from 'react';
import Navbar from '../../../components/Navbar/Navbar';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import './Tournaments.scss'; 
import { GAME_IMAGES } from '../../../data/gameImages';

// --- CONFIGURACIÓN VISUAL (ICONOS Y COLORES) ---
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
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const sidebarWidth = isSidebarClosed ? '88px' : '250px';
  
  // --- SIMULACIÓN DE ROL ---
  // Cambia a 'organizer' para probar el flujo de creación directa
  const [userRole, setUserRole] = useState('gamer'); 

  // Filtros y Estados
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Lista de Juegos disponibles para filtrar
  const allCategories = Object.keys(GAME_CONFIG).filter(key => key !== 'All'); 
  const categoriesToShow = ['All', ...allCategories]; 
  const visibleCategories = showAllFilters ? categoriesToShow : categoriesToShow.slice(0, 8); 

  // Datos Iniciales
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

  // Filtrado
  const filteredTournaments = activeFilter === 'All' 
    ? tournaments 
    : tournaments.filter(t => t.game === activeFilter);

  // LÓGICA DE NAVEGACIÓN: REGISTRO
  const goToRegistration = (torneo) => {
    navigate('/team-registration', { state: { tournament: torneo } });
  };

  // LÓGICA DE SEGURIDAD: CREAR TORNEO
  const handleCreateClick = () => {
    if (userRole === 'organizer') {
        // Si es organizador, va a la página de creación
        navigate('/create-tournament');
    } else {
        // Si no, sugerimos validación
        if(window.confirm("Solo los Organizadores Verificados pueden crear torneos. ¿Deseas solicitar la verificación?")) {
            navigate('/organizer-application');
        }
    }
  };

  return (
    <div style={{ background: '#121212', minHeight: '100vh' }}>
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      
      <div style={{ marginLeft: sidebarWidth, transition: '0.5s', width: `calc(100% - ${sidebarWidth})` }}>
        <Navbar />
        
        <div className="tournaments-page">
            
            {/* HERO */}
            <div className="hero-banner">
                <div className="hero-content">
                    <span className="badge-live">● EN VIVO</span>
                    <h1>World Championship 2024</h1>
                    <button className="hero-btn">Ver Transmisión</button>
                </div>
            </div>

            {/* HEADER */}
            <div className="header-actions">
                <div>
                    <h1>🏆 Torneos Activos</h1>
                    <p style={{color: '#aaa'}}>Filtra por tu juego favorito e inscríbete.</p>
                </div>
                {/* BOTÓN CONECTADO A LA LÓGICA DE SEGURIDAD */}
                <button className="create-btn" onClick={handleCreateClick}>
                    <i className='bx bx-plus'></i> Crear Torneo
                </button>
            </div>

            {/* BARRA DE FILTROS (CHIPS ESTILO IMAGEN) */}
            <div className="filters-container">
                <div className="chips-wrapper">
                    {visibleCategories.map(cat => {
                        const style = GAME_CONFIG[cat] || { color: '#fff', icon: 'bx-game' };
                        const isActive = activeFilter === cat;

                        return (
                            <button 
                                key={cat} 
                                className={`game-chip ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveFilter(cat)}
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
                            <div className="card-img">
                                <img src={torneo.image} alt={torneo.title} />
                                <span className="game-tag" style={{borderColor: GAME_CONFIG[torneo.game]?.color || '#fff'}}>
                                    <i className={`bx ${GAME_CONFIG[torneo.game]?.icon || 'bx-game'}`}></i>
                                    {torneo.game}
                                </span>
                            </div>
                            
                            <div className="card-body">
                                <h3>{torneo.title}</h3>
                                <div className="meta-row">
                                    <span><i className='bx bx-calendar'></i> {torneo.date}</span>
                                    <span className="prize">{torneo.prize}</span>
                                </div>
                                
                                <div className="card-footer">
                                    <div className="slots-bar">
                                        <div className="fill" style={{width: '60%', background: GAME_CONFIG[torneo.game]?.color}}></div>
                                    </div>
                                    <div className="footer-actions">
                                        <span className="slots-text">12/16 Equipos</span>
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
    </div>
  );
};

export default Tournaments;