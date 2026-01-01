import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import './Dashboard.css';
import { GAME_IMAGES } from '../../../data/gameImages'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarPlayers, setSimilarPlayers] = useState([]);

  const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    const fetchProfile = async () => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.get('http://localhost:4000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const realUserData = response.data;
            setUser(realUserData);

            const mockSimilar = [
                { username: 'Kratos_99', game: realUserData.selectedGames?.[0] || 'General' },
                { username: 'SlayerX', game: realUserData.selectedGames?.[1] || 'FPS' },
                { username: 'NinaV', game: 'Competitivo' }
            ];
            setSimilarPlayers(mockSimilar);

        } catch (error) {
            console.error("Error cargando perfil:", error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                localStorage.removeItem('token');
                localStorage.removeItem('esportefyUser');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) return <div className="loading-screen">Conectando con el servidor...</div>;

  const userData = {
      username: user?.username || 'Jugador',
      experience: user?.experience?.[0] || 'Rookie',
      platforms: user?.platforms || [],
      mainGoal: user?.goals?.[0] || 'Explorar',
      games: user?.selectedGames || []
  };

  const getPlatformIcon = (platString) => {
    const p = platString.toLowerCase();
    if (p.includes('pc')) return 'bx-laptop';
    if (p.includes('console') || p.includes('consola')) return 'bx-joystick';
    if (p.includes('mobile') || p.includes('celular')) return 'bx-mobile';
    return 'bx-game';
  };

  return (
    <div className="dashboard-content-only">
        
        {/* HEADER DE BIENVENIDA */}
        <div className="dash-header">
            <div className="header-content">
                <h1>Bienvenido, <span className="highlight-text">{userData.username}</span></h1>
                <p>Resumen de tu actividad en Esportefy.</p>
            </div>
            
            {/* GRUPO DE ACCIONES DERECHA */}
            <div className="header-right-actions">
                
                {/* --- NUEVO BOTÓN ZONA UNIVERSITARIA --- */}
                <button className="btn-university" onClick={() => navigate('/university')}>
                    <i className='bx bxs-graduation'></i>
                    <span>Zona Universitaria</span>
                </button>

                <div className="date-badge">
                    <i className='bx bx-calendar'></i> {today}
                </div>
            </div>
        </div>

        {/* STATS GRID */}
        <div className="stats-grid">
            {/* ... (El resto de tu código de stats sigue igual) ... */}
            <div className="stat-card">
                <div className="stat-icon-wrapper">
                    <i className='bx bx-medal'></i>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Nivel</span>
                    <h3>{userData.experience}</h3>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon-wrapper platform-wrapper">
                    {userData.platforms.length > 0 ? (
                        userData.platforms.map((plat, index) => (
                            <i key={index} className={`bx ${getPlatformIcon(plat)}`} title={plat}></i>
                        ))
                    ) : (
                        <i className='bx bx-question-mark'></i>
                    )}
                </div>
                <div className="stat-info">
                    <span className="stat-label">Plataformas</span>
                    <h3 className="sub-text">Activo</h3>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon-wrapper">
                    <i className='bx bx-target-lock'></i>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Objetivo Actual</span>
                    <h3>{userData.mainGoal}</h3>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon-wrapper">
                    <i className='bx bx-trophy'></i>
                </div>
                <div className="stat-info">
                    <span className="stat-label">Torneos</span>
                    <h3>0</h3>
                </div>
            </div>
        </div>

        {/* ... (El resto de tu código content-grid sigue igual) ... */}
        <div className="content-grid">
             {/* ... Tu código existente de Content Grid ... */}
             {/* Simplemente copié la parte de arriba para mostrarte dónde va el botón */}
             {/* Asegúrate de mantener tu código original de content-grid aquí abajo */}
             
             {/* JUEGOS FAVORITOS */}
            <div className="content-panel">
                <div className="panel-header">
                    <h3><i className='bx bx-game'></i> Tus Juegos</h3>
                    <button className="btn-link">Editar</button>
                </div>
                <div className="my-games-list">
                    {userData.games.length > 0 ? (
                        userData.games.map((gameId, index) => {
                            const imageSrc = Object.entries(GAME_IMAGES).find(([key]) => 
                                key.toLowerCase().includes(gameId.toLowerCase()) || 
                                key.toLowerCase() === gameId.toLowerCase()
                            )?.[1] || GAME_IMAGES.Default;

                            return (
                                <div key={index} className="mini-game-card">
                                    <div className="game-thumb">
                                        <img src={imageSrc} alt={gameId} />
                                    </div>
                                    <span>{gameId.toUpperCase()}</span>
                                </div>
                            )
                        })
                    ) : (
                        <p className="empty-text">Sin juegos seleccionados.</p>
                    )}
                </div>
            </div>

            {/* COMUNIDAD / JUGADORES SIMILARES */}
            <div className="content-panel">
                <div className="panel-header">
                    <h3><i className='bx bx-group'></i> Tu Red</h3>
                    <span className="badge-notification">Sugerencias</span>
                </div>
                
                <div className="community-box">
                    {userData.mainGoal.includes('Fun') || userData.mainGoal.includes('Diversión') ? (
                        <div className="suggestion-box">
                            <i className='bx bx-party'></i>
                            <p>Buscas <strong>Diversión</strong>. Únete a salas casuales.</p>
                            <button className="btn-small">Ver Salas</button>
                        </div>
                    ) : (
                        <div className="suggestion-box">
                            <i className='bx bx-trophy'></i>
                            <p>Modo <strong>Competitivo</strong> detectado. Busca equipo aquí.</p>
                            <button className="btn-small">Reclutamiento</button>
                        </div>
                    )}

                    <div className="friend-list">
                       <p className="list-title">Jugadores Similares:</p>
                       {similarPlayers.map((player, idx) => (
                           <div key={idx} className="friend-item">
                                <div className="avatar" style={{background: idx % 2 === 0 ? '#4facfe' : '#ff0055'}}></div>
                                <div>
                                    <span>{player.username}</span>
                                    <small>Interés: {player.game}</small>
                                </div>
                                <i className='bx bx-user-plus action-icon'></i>
                           </div>
                       ))}
                    </div>
                </div>
            </div>

            {/* TORNEOS SUGERIDOS */}
            <div className="content-panel full-width">
                 <div className="panel-header">
                    <h3><i className='bx bx-trophy'></i> Torneos Recomendados</h3>
                    <button className="btn-link" onClick={() => navigate('/tournaments')}>Explorar</button>
                </div>
                <div className="rec-tournament">
                    <div className="rec-info">
                        <h4>Torneo Semanal de {userData.games[0] ? userData.games[0].toUpperCase() : 'Apertura'}</h4>
                        <p>Categoría {userData.experience} - Inscripción Abierta</p>
                    </div>
                    <button className="btn-neon-small">Ver Detalles</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;