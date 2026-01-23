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
                const response = await axios.get('http://76.13.97.163:4000/api/auth/profile', {
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

     <div className="dashboard-content-only">
    {/* SECCIÓN BIENVENIDA CON AVATAR */}
 <div className="dashboard-content-only">
    <div className="top-layout">
        <div className="welcome-section">
            <div className="welcome-header">
                {/* CONTENEDOR DE LA FOTO */}
                <div className="user-profile-pic">
                    <img src={user?.avatar || "https://i.pravatar.cc/150?u=yutukai"} alt="Profile" />
                </div>
                <div className="welcome-text">
                    <h1>BIENVENIDA DE NUEVO, <span className="user-name">{userData.username}</span></h1>
                    <p>Aquí tienes el resumen de tu rendimiento y actividad para hoy.</p>
                </div>
            </div>

            <div className="university-banner" onClick={() => navigate('/university')}>
                <div className="uni-icon"><i className='bx bxs-graduation'></i></div>
                <div className="uni-text">
                    <h4>ESPORTEFY UNIVERSITY</h4>
                    <p>Programas de Becas y Scouting para jugadores de élite.</p>
                </div>
                <i className='bx bx-chevron-right'></i>
            </div>
        </div>

        <div className="quick-stats-row">
            <div className="mini-kpi">
                <span className="kpi-label">WIN RATE</span>
                <span className="kpi-value">68.4%</span>
                <span className="kpi-trend">+2.1%</span>
            </div>
            <div className="mini-kpi">
                <span className="kpi-label">TORNEOS</span>
                <span className="kpi-value">24</span>
                <span className="kpi-trend">Global</span>
            </div>
        </div>
    </div>

    
</div>
</div>

      
<div className="uni-scouting-card" onClick={() => navigate('/university')}>
    <div className="uni-badge-top">BECAS DISPONIBLES</div>
    <div className="uni-content">
        <div className="uni-info-main">
            <h3>Programa de Scouting Universitario</h3>
            <p>Hay <strong>12 universidades</strong> buscando jugadores de tu nivel en {userData.games[0] || 'Esports'}.</p>
            <div className="uni-tags">
                <span className="tag"><i className='bx bxs-graduation'></i> Becas del 50-100%</span>
                <span className="tag"><i className='bx bxs-map'></i> Global</span>
            </div>
        </div>
        <button className="btn-uni-apply">
            EXPLORAR BECAS <i className='bx bx-right-arrow-alt'></i>
        </button>
    </div>
</div>

{/* SNAKE BAR NOTIFICATION - PRO VERSION */}
<div className="riot-snake-bar">
    <div className="snake-bar-container">
        {/* Línea de escaneo perimetral que cubre todo el panel */}
        <div className="snake-border-glow"></div>
        
        <div className="snake-inner-content">
            <p className="snake-message">
                VINCULA TU CUENTA RIOT PARA ESTADÍSTICAS PRO
            </p>

            {/* Botón Centralizado */}
            <div className="snake-action-center">
                <button className="snake-btn-main" onClick={() => navigate('/settings')}>
                    VINCULAR AHORA
                </button>
            </div>

            {/* Botón Cancelar (X) */}
            <button className="snake-close-btn" onClick={() => {/* Aquí pondrías tu lógica de ocultar por hoy */}}>
                <i className='bx bx-x'></i>
            </button>
        </div>
    </div>
</div>
            {/* STATS GRID */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper"><i className='bx bx-medal'></i></div>
                    <div className="stat-info">
                        <span className="stat-label">Nivel</span>
                        <h3>{userData.experience}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper platform-wrapper">
                        {userData.platforms.map((plat, index) => (
                            <i key={index} className={`bx ${getPlatformIcon(plat)}`} title={plat}></i>
                        ))}
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Plataformas</span>
                        <h3 className="sub-text">Activo</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper"><i className='bx bx-target-lock'></i></div>
                    <div className="stat-info">
                        <span className="stat-label">Objetivo Actual</span>
                        <h3>{userData.mainGoal}</h3>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon-wrapper"><i className='bx bx-trophy'></i></div>
                    <div className="stat-info">
                        <span className="stat-label">Torneos</span>
                        <h3>0</h3>
                    </div>
                </div>
            </div>

            {/* JUEGOS FAVORITOS REFACTORIZADOS (V5) */}
            <div className="content-grid">
                
                {/* SECCIÓN JUEGOS: GALERÍA VERTICAL TIPO POSTER */}
                <div className="content-panel">
                    <div className="panel-header">
                        <h3><i className='bx bx-game'></i> Tus Juegos</h3>
                        <button className="btn-link">Editar</button>
                    </div>

                    {/* Este contenedor controlará el scroll después de 4 juegos */}
                    <div className="gallery-scroll-container">
                        <div className="dash-games-gallery">
                            {userData.games.length > 0 ? (
                                userData.games.map((gameId, index) => {
                                    const imageSrc = Object.entries(GAME_IMAGES).find(([key]) =>
                                        key.toLowerCase().includes(gameId.toLowerCase())
                                    )?.[1] || GAME_IMAGES.Default;

                                    return (
                                        <div key={index} className="game-card-v6" onClick={() => navigate(`/games/${gameId.toLowerCase()}`)}>
                                            <div className="poster-container-v6">
                                                <img src={imageSrc} alt={gameId} />
                                                <div className="card-overlay-v6">
                                                    <span className="overlay-btn">IR A COMUNIDAD</span>
                                                </div>
                                            </div>
                                            <div className="game-footer-v6">
                                                <span className="game-title-v6">{gameId.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="empty-text">Sin juegos seleccionados.</p>
                            )}
                        </div>
                    </div>
                </div>

          {/* --- SECCIÓN COMUNIDAD Y TOP GLOBAL --- */}
<div className="admin-community-grid">
    
    {/* PANEL: TU RED (COMUNIDAD) */}
    <div className="content-panel community-panel">
        <div className="panel-header">
            <h3><i className='bx bx-group'></i> TU RED</h3>
            <span className="badge-notification">Sugerencias</span>
        </div>

        <div className="community-box">
            {/* Sugerencia Dinámica basada en el objetivo */}
            <div className="suggestion-box">
                <i className={userData.mainGoal?.includes('Fun') ? 'bx bx-party' : 'bx bx-trophy'}></i>
                <p>
                    {userData.mainGoal?.includes('Fun') 
                        ? <>Buscas <strong>Diversión</strong>. Únete a salas casuales.</>
                        : <>Modo <strong>Competitivo</strong> detectado. Busca equipo aquí.</>
                    }
                </p>
                <button className="btn-small-neon">
                    {userData.mainGoal?.includes('Fun') ? 'Ver Salas' : 'Reclutamiento'}
                </button>
            </div>


            {/* Lista de Amigos Sugeridos */}
    <div className="friend-list">
    <p className="list-title">JUGADORES SIMILARES</p>
    <div className="friends-scroll-area">
        {similarPlayers.map((player, idx) => (
            <div key={idx} className="friend-item-v2">
                <div className="avatar-circle-wrapper">
                    <img src={`https://i.pravatar.cc/150?u=${player.username}`} alt="avatar" />
                    <div className="status-dot online"></div>
                </div>
                
                <div className="friend-info">
                    <span className="friend-name">{player.username}</span>
                    <small className="friend-game">{player.game}</small>
                </div>

                <button className="btn-add-tech">
                    <i className='bx bx-plus'></i>
                </button>
            </div>
        ))}
    </div>
</div>
    </div>
    </div> 


   {/* PANEL: MEJORES JUGADORES / EQUIPOS */}
<div className="content-panel ranking-panel">
    <div className="panel-header">
        <h3><i className='bx bxs-star'></i> TOP GLOBAL</h3>
        <div className="ranking-tabs">
            {/* Podemos hacer que cada tab filtre o lleve a una ruta específica */}
            <span className="active" onClick={() => navigate('/rankings/players')}>JUGADORES</span>
            <span onClick={() => navigate('/rankings/teams')}>EQUIPOS</span>
        </div>
    </div>

    <div className="ranking-list">
        {[1, 2, 3, 4].map((rank) => (
            <div key={rank} className="ranking-item" onClick={() => navigate(`/profile/pro-${rank}`)}>
                <div className={`rank-number pos-${rank}`}>#{rank}</div>
                <div className="rank-avatar">
                    <img src={`https://i.pravatar.cc/150?img=${rank + 10}`} alt="pro-player" />
                    {rank === 1 && <i className='bx bxs-crown crown-icon'></i>}
                </div>
                <div className="rank-details">
                    <p className="rank-name">ProPlayer_{rank}</p>
                    <p className="rank-xp">2,450 MMR</p>
                </div>
                <div className="rank-badge-v2">PRO</div>
            </div>
        ))}
    </div>
    
    {/* BOTÓN VINCULADO A /rankings */}
    <button className="btn-view-all-ranking" onClick={() => navigate('/rankings')}>
        VER RANKING COMPLETO <i className='bx bx-right-arrow-alt'></i>
    </button>
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