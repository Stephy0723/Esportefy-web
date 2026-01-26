import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; 
import { gamesDetailedData } from '../../../data/gamesDetailedData'; 
import defaultBanner from '../../../assets/images/login-black.png'; // Ajusta tu ruta
// 1. IMPORTAMOS LOS NUEVOS ASSETS Y COMPONENTES

import { backgroundList } from '../../../data/backgroundImages'; // Tu lista de fondos
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx'; // El nuevo componente

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeGameIndex, setActiveGameIndex] = useState(0);

    // --- DATOS MOCK PARA LAS NUEVAS SECCIONES ---
    const mockCalendar = [
        { day: '24', month: 'OCT', title: 'Scrim vs Team Liquid', time: '20:00', type: 'scrim' },
        { day: '28', month: 'OCT', title: 'Torneo Regional (Qualifiers)', time: '16:00', type: 'tourney' },
        { day: '02', month: 'NOV', title: 'Entrenamiento Táctico', time: '18:00', type: 'training' },
    ];

    const mockSocial = {
        team: { name: 'SKT T1 ACADEMY', logo: 'https://i.pravatar.cc/150?u=team', role: 'Capitán' },
        requests: [
            { id: 1, name: 'Faker_Jr', img: 'https://i.pravatar.cc/150?u=1' },
            { id: 2, name: 'ViperX', img: 'https://i.pravatar.cc/150?u=2' }
        ],
        tournaments: [
            { name: 'Worlds 2024 Qualifiers', status: 'En Curso', rank: 'Top 32' },
            { name: 'Red Bull Solo Q', status: 'Registrado', rank: '-' }
        ]
    };
    const [selectedBgIndex, setSelectedBgIndex] = useState(2); 
    const currentHeroBg = backgroundList[selectedBgIndex] || defaultBanner;
    
    
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) { navigate('/login'); return; }
            try {
                const response = await axios.get('http://76.13.97.163:4000/api/auth/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error(error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [navigate]);

    const userData = {
        username: user?.username || 'Jugador',
        games: user?.selectedGames || []
    };

    const getActiveGameData = () => {
        if (!userData.games.length) return null;
        const gameId = userData.games[activeGameIndex];
        return gamesDetailedData[gameId] || { name: gameId, banner: defaultBanner, tags: ['Juego'], history: '...', winRate: 'N/A' };
    };
    const activeGame = getActiveGameData();

    if (loading) return <div className="loading-screen">Cargando...</div>;

    return (
        <div className="dashboard-dashboard-container">        
         

           {/* --- SECCIÓN 1: HERO --- */}
            <section id="sec-1" className="hero-profile-section">
                
                {/* 1. EL BANNER DE FONDO */}
                <div 
                    className="hero-banner-bg" 
                    style={{ backgroundImage: `url(${currentHeroBg})` }}
                >
                    <div className="banner-overlay"></div>
                </div>

                {/* 2. LA TARJETA DE INFORMACIÓN */}
                <div className="hero-profile-card">
                    
                    {/* --- AQUI ESTA EL CAMBIO PRINCIPAL --- */}
                    {/* Usamos el nuevo componente AvatarCircle */}
                    <div className="profile-avatar-wrapper">
                        <AvatarCircle 
                            src={user?.avatar || "https://i.pravatar.cc/300?u=default"}
                            alt={userData.username}
                            size="160px"       
                            isActive={true}
                            borderColor="var(--brand-green)"
                            // Ya no usamos customFrame aquí, usamos el estilo CSS por defecto
                        />
                    </div>
                    {/* --- FIN DEL CAMBIO --- */}

                    {/* CONTENIDO DE LA TARJETA */}
                    <div className="profile-content">
                        <span className="welcome-badge">BIENVENIDO AL HUB</span>
                        <h1 className="profile-username">{userData.username.toUpperCase()}</h1>
                        
                        {/* ... (Resto del contenido de stats se queda IGUAL) ... */}
                        <p className="profile-quote">"La victoria está reservada para aquellos que están dispuestos a pagar su precio."</p>
                        <div className="profile-stats-row">
                             {/* ... tus stats ... */}
                             <div className="p-stat-item">
                                <i className='bx bx-crosshair'></i>
                                <div><span className="lbl">WIN RATE</span><span className="val highlight">68.4%</span></div>
                            </div>
                            <div className="p-stat-item">
                                <i className='bx bx-trophy'></i>
                                <div><span className="lbl">TORNEOS</span><span className="val">12</span></div>
                            </div>
                            <div className="p-stat-item">
                                <i className='bx bx-bar-chart-alt-2'></i>
                                <div><span className="lbl">NIVEL</span><span className="val">42</span></div>
                            </div>
                            <div className="p-stat-item">
                                <i className='bx bx-medal'></i>
                                <div><span className="lbl">RANGO</span><span className="val text-blue">DIAMANTE</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="scroll-down-btn" onClick={() => scrollToSection('sec-2')}>
                    <span>VER JUEGOS</span>
                    <i className='bx bx-chevron-down animated-arrow'></i>
                </div>
            </section>

            
            {/* --- SECCIÓN 2: ARSENAL (Tus juegos) --- */}
            <section id="sec-2" className="cinematic-section">
                <div className="cinematic-bg" style={{ backgroundImage: `url(${activeGame?.banner || defaultBanner})` }}><div className="cinematic-overlay"></div></div>
                <div className="cinematic-content-grid">
                    {activeGame ? (
                        <>
                            <div className="game-info-left">
                                <span className="developer-label">{activeGame.developer}</span>
                                <h2 className="game-big-title">{activeGame.name.toUpperCase()}</h2>
                                <div className="tags-row">{activeGame.tags?.map((tag, i) => <span key={i} className="meta-tag">{tag}</span>)}</div>
                                <p className="game-desc">{activeGame.history}</p>
                            </div>
                            <div className="game-analysis-right">
                                <div className="analysis-card">
                                    <div className="card-header"><h3><i className='bx bx-stats'></i> RENDIMIENTO</h3><span className="live-badge">EN VIVO</span></div>
                                    <div className="stats-arithmetic">
                                        <div className="stat-row"><span>WIN RATE</span><strong className="highlight">{activeGame.winRate || 'N/A'}</strong></div>
                                        <div className="stat-row"><span>KDA / AVG</span><strong>{activeGame.kda || 'N/A'}</strong></div>
                                    </div>
                                    <div className="improvement-box">
                                        <h4>A MEJORAR</h4>
                                        <div className="imp-tags">{activeGame.toImprove?.map((imp, i) => <span key={i} className="imp-tag">{imp}</span>) || <span>Sin datos</span>}</div>
                                    </div>
                                    <button className="btn-analyze-full">VER COMO ANÁLISIS <i className='bx bx-right-arrow-alt'></i></button>
                                </div>
                            </div>
                        </>
                    ) : (<div className="empty-state"><h2>Selecciona tus juegos.</h2></div>)}
                </div>
                <div className="cards-carousel-wrapper">
                    <div className="cards-track">
                        {userData.games.map((gameId, index) => {
                            const miniGame = gamesDetailedData[gameId];
                            if(!miniGame) return null;
                            return (
                                <div key={index} className={`game-mini-card ${index === activeGameIndex ? 'active' : ''}`} onClick={() => setActiveGameIndex(index)}>
                                    <img src={miniGame.banner} alt={gameId} />
                                    {index === activeGameIndex && <div className="active-indicator"></div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div className="scroll-down-btn" onClick={() => scrollToSection('sec-3')}><span>RENDIMIENTO Y CALENDARIO</span><i className='bx bx-chevron-down animated-arrow'></i></div>
            </section>

           {/* --- SECCIÓN 3: PERFORMANCE LAB (Analíticas y Calendario) --- */}
            <section id="sec-3" className="page-section section-performance">
                <div className="performance-grid">
                    
                    {/* Columna Izquierda: Gráficos y Métricas */}
                    <div className="panel-glass chart-panel">
                        <div className="panel-header">
                            <h2><i className='bx bx-line-chart'></i> MÉTRICAS DE RENDIMIENTO</h2>
                            <select className="neon-select">
                                <option>Últimos 7 días</option>
                                <option>Este Mes</option>
                            </select>
                        </div>
                        
                        <div className="chart-container-mock">
                            {/* Barras animadas simuladas */}
                            <div className="bar-chart">
                                <div className="bar" style={{height: '40%'}} title="Lunes"></div>
                                <div className="bar" style={{height: '70%'}} title="Martes"></div>
                                <div className="bar active" style={{height: '90%'}} title="Miércoles"></div>
                                <div className="bar" style={{height: '50%'}} title="Jueves"></div>
                                <div className="bar" style={{height: '80%'}} title="Viernes"></div>
                                <div className="bar" style={{height: '60%'}} title="Sábado"></div>
                                <div className="bar" style={{height: '75%'}} title="Domingo"></div>
                            </div>
                            <div className="chart-legend">
                                <span><span className="dot-l green"></span> Victorias</span>
                                <span><span className="dot-l gray"></span> Derrotas</span>
                            </div>
                        </div>
                        
                        <div className="mini-stats-row">
                            <div className="ms-item"><span>KDA</span><strong>4.2</strong></div>
                            <div className="ms-item"><span>CS/MIN</span><strong>8.5</strong></div>
                            <div className="ms-item"><span>DMG</span><strong>22%</strong></div>
                        </div>
                    </div>

                    {/* Columna Derecha: Calendario y Agenda */}
                    <div className="panel-glass calendar-panel">
                        <div className="panel-header">
                            <h2><i className='bx bx-calendar'></i> AGENDA COMPETITIVA</h2>
                            <button className="btn-icon-small"><i className='bx bx-plus'></i></button>
                        </div>
                        <div className="calendar-list">
                            {mockCalendar.map((event, i) => (
                                <div key={i} className={`calendar-item type-${event.type}`}>
                                    <div className="cal-date">
                                        <span className="cal-day">{event.day}</span>
                                        <span className="cal-month">{event.month}</span>
                                    </div>
                                    <div className="cal-info">
                                        <h4>{event.title}</h4>
                                        <span className="cal-time"><i className='bx bx-time'></i> {event.time}</span>
                                    </div>
                                    <button className="btn-cal-action"><i className='bx bx-bell'></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="scroll-down-btn" onClick={() => scrollToSection('sec-4')}>
                    <span>SOCIAL Y EQUIPO</span>
                    <i className='bx bx-chevron-down animated-arrow'></i>
                </div>
            </section>

            {/* --- SECCIÓN 4: SOCIAL HQ (Equipo, Amigos, Torneos) --- */}
            <section id="sec-4" className="page-section section-social">
                <div className="social-grid-layout">
                    
                    {/* TARJETA DE EQUIPO */}
                    <div className="panel-glass team-card">
                        <div className="team-bg-blur" style={{backgroundImage: `url(${mockSocial.team.logo})`}}></div>
                        <div className="team-content">
                            <div className="team-avatar">
                                <img src={mockSocial.team.logo} alt="Team" />
                            </div>
                            <h3>{mockSocial.team.name}</h3>
                            <span className="role-badge">{mockSocial.team.role}</span>
                            <div className="team-actions">
                                <button className="btn-neon-outline">VER ROSTER</button>
                                <button className="btn-neon-outline">SCRIMS</button>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA CENTRAL: TORNEOS */}
                    <div className="panel-glass tournaments-list">
                        <div className="panel-header-simple">TORNEOS ACTIVOS</div>
                        {mockSocial.tournaments.map((t, i) => (
                            <div key={i} className="tourney-item">
                                <div className="t-icon"><i className='bx bx-trophy'></i></div>
                                <div className="t-info">
                                    <h4>{t.name}</h4>
                                    <span className={`status-dot ${t.status === 'En Curso' ? 'live' : 'reg'}`}>{t.status}</span>
                                </div>
                                <div className="t-rank">{t.rank}</div>
                            </div>
                        ))}
                    </div>

                    {/* COLUMNA DERECHA: SOLICITUDES */}
                    <div className="panel-glass requests-panel">
                        <div className="panel-header-simple">SOLICITUDES ({mockSocial.requests.length})</div>
                        <div className="req-list">
                            {mockSocial.requests.map((req) => (
                                <div key={req.id} className="req-item">
                                    <img src={req.img} alt={req.name} />
                                    <div className="req-name">{req.name}</div>
                                    <div className="req-actions">
                                        <button className="btn-accept"><i className='bx bx-check'></i></button>
                                        <button className="btn-deny"><i className='bx bx-x'></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="scroll-down-btn" onClick={() => scrollToSection('sec-5')}>
                    <span>CENTRO DE MANDO</span>
                    <i className='bx bx-chevron-down animated-arrow'></i>
                </div>
            </section>

            {/* --- SECCIÓN 5: THE NEXUS (Botones Importantes) --- */}
            <section id="sec-5" className="page-section section-nexus">
                <h2 className="nexus-title">CENTRO DE MANDO</h2>
                <div className="nexus-grid">
                    <div className="nexus-card" onClick={() => navigate('/profile')}>
                        <i className='bx bxs-user-detail'></i>
                        <h3>EDITAR PERFIL</h3>
                        <p>Ajusta tu avatar y biografía</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/settings')}>
                        <i className='bx bxs-cog'></i>
                        <h3>CONFIGURACIÓN</h3>
                        <p>Privacidad y Conexiones</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/university')}>
                        <i className='bx bxs-graduation'></i>
                        <h3>UNIVERSIDAD</h3>
                        <p>Becas y Scouting</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/marketplace')}>
                        <i className='bx bxs-store'></i>
                        <h3>MARKETPLACE</h3>
                        <p>Tienda de recompensas</p>
                    </div>
                    <div className="nexus-card logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                        <i className='bx bx-log-out'></i>
                        <h3>CERRAR SESIÓN</h3>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN 4: SOCIAL HQ (Equipo, Amigos, Torneos) --- */}
            <section id="sec-4" className="page-section section-social">
                <div className="social-grid-layout">
                    
                    {/* TARJETA DE EQUIPO */}
                    <div className="panel-glass team-card">
                        <div className="team-bg-blur" style={{backgroundImage: `url(${mockSocial.team.logo})`}}></div>
                        <div className="team-content">
                            <div className="team-avatar"><img src={mockSocial.team.logo} alt="Team" /></div>
                            <h3>{mockSocial.team.name}</h3>
                            <span className="role-badge">{mockSocial.team.role}</span>
                            <div className="team-actions">
                                <button className="btn-neon-outline">VER ROSTER</button>
                                <button className="btn-neon-outline">SCRIMS</button>
                            </div>
                        </div>
                    </div>

                    {/* COLUMNA CENTRAL: TORNEOS */}
                    <div className="panel-glass tournaments-list">
                        <div className="panel-header-simple">TORNEOS ACTIVOS</div>
                        {mockSocial.tournaments.map((t, i) => (
                            <div key={i} className="tourney-item">
                                <div className="t-icon"><i className='bx bx-trophy'></i></div>
                                <div className="t-info">
                                    <h4>{t.name}</h4>
                                    <span className={`status-dot ${t.status === 'En Curso' ? 'live' : 'reg'}`}>{t.status}</span>
                                </div>
                                <div className="t-rank">{t.rank}</div>
                            </div>
                        ))}
                    </div>

                    {/* COLUMNA DERECHA: SOLICITUDES */}
                    <div className="panel-glass requests-panel">
                        <div className="panel-header-simple">SOLICITUDES ({mockSocial.requests.length})</div>
                        <div className="req-list">
                            {mockSocial.requests.map((req) => (
                                <div key={req.id} className="req-item">
                                    <img src={req.img} alt={req.name} />
                                    <div className="req-name">{req.name}</div>
                                    <div className="req-actions">
                                        <button className="btn-accept"><i className='bx bx-check'></i></button>
                                        <button className="btn-deny"><i className='bx bx-x'></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
                <div className="scroll-down-btn" onClick={() => scrollToSection('sec-5')}><span>CENTRO DE MANDO</span><i className='bx bx-chevron-down animated-arrow'></i></div>
            </section>

            {/* --- SECCIÓN 5: THE NEXUS (Botones Importantes) --- */}
            <section id="sec-5" className="page-section section-nexus">
                <h2 className="nexus-title">CENTRO DE MANDO</h2>
                <div className="nexus-grid">
                    <div className="nexus-card" onClick={() => navigate('/profile')}>
                        <i className='bx bxs-user-detail'></i>
                        <h3>EDITAR PERFIL</h3>
                        <p>Ajusta tu avatar y biografía</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/settings')}>
                        <i className='bx bxs-cog'></i>
                        <h3>CONFIGURACIÓN</h3>
                        <p>Privacidad y Conexiones</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/university')}>
                        <i className='bx bxs-graduation'></i>
                        <h3>UNIVERSIDAD</h3>
                        <p>Becas y Scouting</p>
                    </div>
                    <div className="nexus-card" onClick={() => navigate('/marketplace')}>
                        <i className='bx bxs-store'></i>
                        <h3>MARKETPLACE</h3>
                        <p>Tienda de recompensas</p>
                    </div>
                    <div className="nexus-card logout" onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}>
                        <i className='bx bx-log-out'></i>
                        <h3>CERRAR SESIÓN</h3>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Dashboard;