import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css'; 
import { gamesDetailedData } from '../../../data/gamesDetailedData'; 
import defaultBanner from '../../../assets/images/login-black.png'; // Ajusta tu ruta
// 1. IMPORTAMOS LOS NUEVOS ASSETS Y COMPONENTES

import { backgroundList } from '../../../data/backgroundImages'; // Tu lista de fondos
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx'; // El nuevo componente
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import PlayerTag from '../../../components/PlayerTag/PlayerTag'; // <--- EL COMPONENTE NUEVO
import { PLAYER_TAGS } from '../../../data/playerTags';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeGameIndex, setActiveGameIndex] = useState(0);
    const [myTeams, setMyTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);

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
            try {
                const response = await axios.get('http://localhost:4000/api/auth/profile');
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

    useEffect(() => {
        const fetchTeams = async () => {
            if (!user?._id) return;
            try {
                const res = await axios.get('http://localhost:4000/api/teams');
                const allTeams = res.data || [];
                const uid = String(user._id);
                let list = [];

                if (Array.isArray(user?.teams) && user.teams.length > 0) {
                    const ids = user.teams.map((t) => String(t?._id || t));
                    list = allTeams.filter((t) => ids.includes(String(t._id)));
                } else {
                    list = allTeams.filter((t) => {
                        const starters = Array.isArray(t.roster?.starters) ? t.roster.starters : [];
                        const subs = Array.isArray(t.roster?.subs) ? t.roster.subs : [];
                        const coach = t.roster?.coach;
                        return starters.some(p => String(p?.user) === uid) ||
                            subs.some(p => String(p?.user) === uid) ||
                            (coach && String(coach.user) === uid);
                    });
                }

                setMyTeams(list);
                setActiveTeam(list[0] || null);
            } catch (err) {
                console.error('Error cargando equipos:', err);
            }
        };
        fetchTeams();
    }, [user?._id, user?.teams?.length]);

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
    const currentFrame = FRAMES.find(frame => frame.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0]; 
    const riotLinked = user?.connections?.riot?.verified;
    const riotProfileIconId = user?.gameProfiles?.lol?.profileIconId ?? 0;
    const riotSummonerLevel = user?.gameProfiles?.lol?.summonerLevel;
    const riotRank = user?.gameProfiles?.lol?.rank;
    const riotName = user?.connections?.riot?.gameName;
    const riotTagLine = user?.connections?.riot?.tagLine;
    const riotGameIds = new Set(['lol', 'valorant', 'wildrift', 'tft', 'runeterra']);
    const hasRiotGame = userData.games.some((gameId) => riotGameIds.has(gameId));
    const profileComplete = Boolean(user?.avatar || user?.bio || user?.description || user?.about);

    const onboardingSteps = [
        {
            id: 'profile',
            label: 'Completa tu perfil',
            done: profileComplete,
            cta: 'Editar',
            action: () => navigate('/profile')
        },
        {
            id: 'games',
            label: 'Selecciona tus juegos',
            done: userData.games.length > 0,
            cta: 'Elegir',
            action: () => navigate('/profile')
        },
        {
            id: 'team',
            label: 'Crea o únete a un equipo',
            done: Boolean(activeTeam),
            cta: activeTeam ? 'Ver' : 'Crear',
            action: () => navigate(activeTeam ? '/teams' : '/create-team')
        },
        {
            id: 'riot',
            label: 'Vincula tu cuenta Riot (ID)',
            done: Boolean(riotLinked),
            hidden: !hasRiotGame,
            cta: 'Vincular',
            action: () => navigate('/settings')
        }
    ];
    const visibleSteps = onboardingSteps.filter((step) => !step.hidden);
    const completedSteps = visibleSteps.filter((step) => step.done).length;

    const resolveTeamRole = (team) => {
        if (!team || !user?._id) return '';
        const uid = String(user._id);
        const captainId = team.captain?._id || team.captain;
        if (String(captainId) === uid) return 'Capitán';
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const coach = team.roster?.coach;
        if (coach && String(coach.user) === uid) return coach.role || 'Coach';
        const starter = starters.find((p) => String(p?.user) === uid);
        if (starter) return starter.role || 'Titular';
        const sub = subs.find((p) => String(p?.user) === uid);
        if (sub) return sub.role || 'Suplente';
        return 'Miembro';
    };

    const renderTeamCard = () => {
        if (!activeTeam) {
            return (
                <div className="panel-glass team-card">
                    <div className="team-bg-blur"></div>
                    <div className="team-content">
                        <div className="team-avatar">
                            <i className='bx bx-group'></i>
                        </div>
                        <h3>Sin equipo</h3>
                        <span className="role-badge">Crea o únete</span>
                        <div className="team-actions">
                            <button className="btn-neon-outline" onClick={() => navigate('/create-team')}>CREAR EQUIPO</button>
                            <button className="btn-neon-outline" onClick={() => navigate('/teams')}>BUSCAR EQUIPOS</button>
                        </div>
                    </div>
                </div>
            );
        }

        const role = resolveTeamRole(activeTeam);
        return (
            <div className="panel-glass team-card">
                <div className="team-bg-blur" style={{backgroundImage: `url(${activeTeam.logo || mockSocial.team.logo})`}}></div>
                <div className="team-content">
                    <div className="team-avatar">
                        <img src={activeTeam.logo || mockSocial.team.logo} alt="Team" />
                    </div>
                    <h3>{activeTeam.name}</h3>
                    <span className="role-badge">{role}</span>
                    <div className="team-actions">
                        <button className="btn-neon-outline" onClick={() => navigate('/equipos')}>VER ROSTER</button>
                        <button className="btn-neon-outline" onClick={() => navigate('/tournaments')}>TORNEOS</button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading-screen">Cargando...</div>;

    return (
        <div className="dashboard-dashboard-container">        
         

           {/* --- SECCIÓN 1: HERO --- */}
            <section id="sec-1" className="hero-profile-section">
                
                {/* 1. EL BANNER DE FONDO */}
                <div 
                    className="hero-banner-bg" 
                    style={{ backgroundImage: `url(${currentBg.src})` }}
                >
                    <div className="banner-overlay"></div>
                </div>

                {/* 2. LA TARJETA DE INFORMACIÓN */}
                <div className="hero-profile-card">
                    
                    {/* --- AQUI ESTA EL CAMBIO PRINCIPAL --- */}
                    <div className="profile-avatar-wrapper">
                        <AvatarCircle 
                                            src={ user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                            frameConfig={currentFrame}
                                            size="120px"
                                            status={user.status}
                         />
                    </div>
                    {/* --- FIN DEL CAMBIO --- */}

                    {/* CONTENIDO DE LA TARJETA */}
                    <div className="profile-content">
                        <span className="welcome-badge">BIENVENIDO AL HUB</span><br></br>
                        <PlayerTag className="profile-username"
                            name={userData.username.toUpperCase() || "Player"} 
                            tagId={user.selectedTagId} 
                            size="normal" 
                            fontTag='3.2rem'
                        />                       
                        
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

                        {riotLinked && (
                            <div className="riot-mini-card">
                                <img
                                    src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${riotProfileIconId}.png`}
                                    alt="Riot Icon"
                                    className="riot-mini-avatar"
                                />
                                <div className="riot-mini-meta">
                                    <strong>{riotName}#{riotTagLine}</strong>
                                    <span>Nivel {riotSummonerLevel ?? '-'}</span>
                                    <span>
                                        {riotRank
                                            ? `${riotRank.tier} ${riotRank.division} (${riotRank.lp} LP)`
                                            : 'Sin clasificar'}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className={`team-mini-card ${activeTeam ? '' : 'empty'}`}>
                            <div className="team-mini-avatar">
                                {activeTeam?.logo ? (
                                    <img src={activeTeam.logo} alt={activeTeam.name} />
                                ) : (
                                    <i className='bx bx-group'></i>
                                )}
                            </div>
                            <div className="team-mini-meta">
                                <strong>{activeTeam?.name || 'Sin equipo'}</strong>
                                <span>{activeTeam ? resolveTeamRole(activeTeam) : 'Crea o únete a uno'}</span>
                            </div>
                            <button
                                className="team-mini-btn"
                                onClick={() => navigate(activeTeam ? '/equipos' : '/create-team')}
                            >
                                {activeTeam ? 'Ver' : 'Crear'}
                            </button>
                        </div>

                        <div className="onboarding-card">
                            <div className="onboarding-header">
                                <div>
                                    <span className="onboarding-kicker">PRIMEROS PASOS</span>
                                    <h4>Checklist de Inicio</h4>
                                </div>
                                <span className="onboarding-progress">{completedSteps}/{visibleSteps.length}</span>
                            </div>
                            <div className="onboarding-steps">
                                {visibleSteps.map((step) => (
                                    <div key={step.id} className={`onboarding-step ${step.done ? 'done' : ''}`}>
                                        <div className="step-status">
                                            <i className={`bx ${step.done ? 'bx-check-circle' : 'bx-circle'}`}></i>
                                        </div>
                                        <div className="step-meta">
                                            <span className="step-label">{step.label}</span>
                                            <span className="step-desc">{step.done ? 'Completado' : 'Pendiente'}</span>
                                        </div>
                                        <button
                                            className="step-action"
                                            onClick={step.action}
                                            disabled={step.done}
                                        >
                                            {step.done ? 'OK' : step.cta}
                                        </button>
                                    </div>
                                ))}
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
                    {renderTeamCard()}

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

                </div>
            </section>

        </div>
    );
};

export default Dashboard;
