import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import './Dashboard.css';
import { gamesDetailedData } from '../../../data/gamesDetailedData';
import defaultBanner from '../../../assets/images/login-black.png';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myTeams, setMyTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);
    const [hoveredGame, setHoveredGame] = useState(null);
    const [now, setNow] = useState(new Date());
    const [tournaments, setTournaments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [featuredGameIdx, setFeaturedGameIdx] = useState(0);

    /* ── Reloj ── */
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    /* ══════════════════════════════════════════════
       FETCH PROFILE  (DB — NO TOCAR)
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchProfile = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) { navigate('/login'); return; }
            try {
                const response = await axios.get(`${API_URL}/api/auth/profile`, {
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

    /* ══════════════════════════════════════════════
       FETCH TEAMS  (DB — NO TOCAR)
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchTeams = async () => {
            if (!user?._id) return;
            try {
                const res = await axios.get(`${API_URL}/api/teams`);
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

    /* ══════════════════════════════════════════════
       FETCH TOURNAMENTS  (DB — REAL)
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/tournaments`);
                setTournaments(res.data || []);
            } catch (err) {
                console.error('Error cargando torneos:', err);
            }
        };
        fetchTournaments();
    }, []);

    /* ══════════════════════════════════════════════
       FETCH NOTIFICATIONS  (DB — REAL)
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchNotifs = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get(`${API_URL}/api/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(res.data || []);
            } catch (err) {
                console.error('Error cargando notificaciones:', err);
            }
        };
        if (user) fetchNotifs();
    }, [user]);

    /* ── Datos derivados ── */
    const userData = {
        username: user?.username || 'Jugador',
        games: user?.selectedGames || []
    };

    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];

    const riotLinked = user?.connections?.riot?.verified;
    const riotIconId = user?.gameProfiles?.lol?.profileIconId ?? 0;
    const riotLevel  = user?.gameProfiles?.lol?.summonerLevel;
    const riotRank   = user?.gameProfiles?.lol?.rank;
    const riotName   = user?.connections?.riot?.gameName;
    const riotTag    = user?.connections?.riot?.tagLine;

    const resolveTeamRole = (team) => {
        if (!team || !user?._id) return '';
        const uid = String(user._id);
        const cid = team.captain?._id || team.captain;
        if (String(cid) === uid) return 'Capitán';
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs     = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const coach    = team.roster?.coach;
        if (coach && String(coach.user) === uid) return coach.role || 'Coach';
        const s = starters.find(p => String(p?.user) === uid);
        if (s) return s.role || 'Titular';
        const sub = subs.find(p => String(p?.user) === uid);
        if (sub) return sub.role || 'Suplente';
        return 'Miembro';
    };

    const enrichedGames = useMemo(() =>
        userData.games.map(id => gamesDetailedData[id]).filter(Boolean),
    [userData.games]);

    const featuredGame = enrichedGames[featuredGameIdx] || null;

    const greeting = useMemo(() => {
        const h = now.getHours();
        if (h < 6)  return 'Buenas noches';
        if (h < 12) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    }, [now]);

    const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

    // Active / upcoming tournaments  
    const activeTournaments = useMemo(() =>
        tournaments
            .filter(t => t.status === 'open' || t.status === 'ongoing')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5),
    [tournaments]);

    // Pending join requests for captain
    const pendingRequests = useMemo(() => {
        if (!user?._id) return [];
        const uid = String(user._id);
        let reqs = [];
        myTeams.forEach(team => {
            if (String(team.captain?._id || team.captain) === uid) {
                (team.joinRequests || []).forEach(r => {
                    if (r.status === 'pending') {
                        reqs.push({ ...r, teamName: team.name, teamId: team._id });
                    }
                });
            }
        });
        return reqs;
    }, [myTeams, user?._id]);

    const unreadNotifs = notifications.filter(n => !n.read).length;

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="db-loading">
                <div className="db-loading__pulse"></div>
                <p>Cargando tu hub...</p>
            </div>
        );
    }

    /* ══════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════ */
    return (
        <div className="db">
            {/* ═══════ HERO — BANNER + Profile  ═══════ */}
            <header className="db__hero">
                <div className="db__banner" style={{ backgroundImage: `url(${currentBg.src})` }}>
                    <div className="db__banner-scanline" />
                    <div className="db__banner-fade" />
                </div>

                <div className="db__hud-strip">
                    <div className="db__hud-left">
                        <span className="db__hud-dot"></span>
                        <span>DASHBOARD</span>
                        <span className="db__hud-sep">/</span>
                        <span>{userData.username.toUpperCase()}</span>
                    </div>
                    <div className="db__hud-right">
                        <span>{timeStr}</span>
                        <span className="db__hud-sep">|</span>
                        <span>{dateStr}</span>
                    </div>
                </div>

                <div className="db__profile-panel">
                    {/* HUD corners */}
                    <div className="db__corner db__corner--tl"></div>
                    <div className="db__corner db__corner--tr"></div>
                    <div className="db__corner db__corner--bl"></div>
                    <div className="db__corner db__corner--br"></div>

                    <div className="db__profile-row">
                        <div className="db__avatar-area">
                            <AvatarCircle
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                frameConfig={currentFrame}
                                size="110px"
                                status={user.status}
                            />
                        </div>

                        <div className="db__identity">
                            <span className="db__greeting">{greeting},</span>
                            <PlayerTag
                                name={userData.username.toUpperCase()}
                                tagId={user.selectedTagId}
                                size="normal"
                                fontTag="2.2rem"
                            />
                            {user.bio && <p className="db__bio">{user.bio}</p>}
                            <div className="db__chips">
                                {user.country && <span className="db__chip"><i className="bx bx-globe"></i>{user.country}</span>}
                                <span className="db__chip"><i className="bx bx-game"></i>{userData.games.length} juego{userData.games.length !== 1 ? 's' : ''}</span>
                                {myTeams.length > 0 && <span className="db__chip chip--green"><i className="bx bx-group"></i>{myTeams.length} equipo{myTeams.length !== 1 ? 's' : ''}</span>}
                                {user.platforms?.length > 0 && <span className="db__chip"><i className="bx bx-desktop"></i>{user.platforms.join(', ')}</span>}
                            </div>
                        </div>

                        <div className="db__hero-stats">
                            <div className="db__stat-box">
                                <i className="bx bx-game"></i>
                                <strong>{userData.games.length}</strong>
                                <span>Juegos</span>
                            </div>
                            <div className="db__stat-box">
                                <i className="bx bx-group"></i>
                                <strong>{myTeams.length}</strong>
                                <span>Equipos</span>
                            </div>
                            <div className="db__stat-box">
                                <i className="bx bx-trophy"></i>
                                <strong>{activeTournaments.length}</strong>
                                <span>Torneos</span>
                            </div>
                            <div className="db__stat-box">
                                <i className="bx bx-bell"></i>
                                <strong>{unreadNotifs}</strong>
                                <span>Alertas</span>
                            </div>
                        </div>
                    </div>

                    <button className="db__edit-profile" onClick={() => navigate('/profile')}>
                        <i className="bx bx-edit-alt"></i> Editar perfil
                    </button>
                </div>
            </header>

            {/* ═══════ MAIN BENTO GRID  ═══════ */}
            <main className="db__bento">

                {/* ─── PANEL: FEATURED GAME (large, cinematic) ─── */}
                <section className="db__panel db__panel--featured">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-joystick"></i> JUEGO DESTACADO</span>
                    </div>
                    {featuredGame ? (
                        <>
                            <div className="db__feat-bg" style={{ backgroundImage: `url(${featuredGame.banner})` }}></div>
                            <div className="db__feat-content">
                                <span className="db__feat-dev">{featuredGame.developer}</span>
                                <h2 className="db__feat-title">{featuredGame.name}</h2>
                                <div className="db__feat-tags">
                                    {featuredGame.tags?.slice(0, 4).map((tag, i) => (
                                        <span key={i} className="db__feat-tag">{tag}</span>
                                    ))}
                                </div>
                                <p className="db__feat-desc">{featuredGame.history?.substring(0, 140)}...</p>
                            </div>
                            {/* Game carousel dots */}
                            {enrichedGames.length > 1 && (
                                <div className="db__feat-nav">
                                    {enrichedGames.map((g, i) => (
                                        <button
                                            key={g.id}
                                            className={`db__feat-dot ${i === featuredGameIdx ? 'active' : ''}`}
                                            onClick={() => setFeaturedGameIdx(i)}
                                            title={g.name}
                                        >
                                            <img src={g.banner} alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="db__panel-empty">
                            <i className="bx bx-joystick"></i>
                            <p>No has seleccionado juegos</p>
                            <button className="db__btn db__btn--primary" onClick={() => navigate('/profile')}>Agregar juegos</button>
                        </div>
                    )}
                </section>

                {/* ─── PANEL: RIOT CONNECTION ─── */}
                <section className="db__panel db__panel--riot">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-link-alt"></i> CUENTA RIOT</span>
                        {riotLinked && <span className="db__badge-live">LINKED</span>}
                    </div>
                    {riotLinked ? (
                        <div className="db__riot-body">
                            <img
                                src={`https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/${riotIconId}.png`}
                                alt="Riot"
                                className="db__riot-icon"
                            />
                            <div className="db__riot-data">
                                <strong className="db__riot-name">{riotName}<span>#{riotTag}</span></strong>
                                <div className="db__riot-stats">
                                    <div className="db__riot-stat">
                                        <span>NIVEL</span>
                                        <strong>{riotLevel ?? '-'}</strong>
                                    </div>
                                    <div className="db__riot-stat">
                                        <span>RANGO</span>
                                        <strong>{riotRank ? `${riotRank.tier} ${riotRank.division}` : 'N/A'}</strong>
                                    </div>
                                    {riotRank?.lp !== undefined && (
                                        <div className="db__riot-stat">
                                            <span>LP</span>
                                            <strong>{riotRank.lp}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="db__panel-empty">
                            <i className="bx bx-link-alt"></i>
                            <p>Vincula tu cuenta de Riot</p>
                            <button className="db__btn db__btn--outline" onClick={() => navigate('/settings')}>Conectar</button>
                        </div>
                    )}
                </section>

                {/* ─── PANEL: MIS EQUIPOS ─── */}
                <section className="db__panel db__panel--teams">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-group"></i> MIS EQUIPOS</span>
                        <button className="db__hud-btn" onClick={() => navigate('/teams')}>VER TODOS <i className="bx bx-right-arrow-alt"></i></button>
                    </div>

                    {myTeams.length > 0 ? (
                        <div className="db__teams-list">
                            {myTeams.map(team => (
                                <div key={team._id} className="db__team-row" onClick={() => navigate('/teams')}>
                                    <div className="db__team-logo">
                                        {team.logo
                                            ? <img src={team.logo} alt={team.name} />
                                            : <div className="db__team-logo--ph"><i className="bx bx-group"></i></div>
                                        }
                                    </div>
                                    <div className="db__team-info">
                                        <strong>{team.name}</strong>
                                        <span>{team.game || 'Sin juego'}</span>
                                    </div>
                                    <span className="db__team-role-badge">{resolveTeamRole(team)}</span>
                                    <div className="db__team-members">
                                        <i className="bx bx-user"></i>
                                        <span>{(team.roster?.starters?.length || 0) + (team.roster?.subs?.length || 0)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="db__panel-empty">
                            <i className="bx bx-group"></i>
                            <p>Sin equipos aún</p>
                            <div className="db__empty-btns">
                                <button className="db__btn db__btn--primary" onClick={() => navigate('/create-team')}>
                                    <i className="bx bx-plus"></i> Crear
                                </button>
                                <button className="db__btn db__btn--outline" onClick={() => navigate('/teams')}>
                                    <i className="bx bx-search"></i> Buscar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Pending join requests */}
                    {pendingRequests.length > 0 && (
                        <div className="db__pending-strip">
                            <i className="bx bx-bell bx-tada"></i>
                            <span>{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}</span>
                            <button className="db__btn db__btn--sm" onClick={() => navigate('/teams')}>Revisar</button>
                        </div>
                    )}
                </section>

                {/* ─── PANEL: TORNEOS ─── */}
                <section className="db__panel db__panel--tourneys">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-trophy"></i> TORNEOS ACTIVOS</span>
                        <button className="db__hud-btn" onClick={() => navigate('/tournaments')}>VER TODOS <i className="bx bx-right-arrow-alt"></i></button>
                    </div>

                    {activeTournaments.length > 0 ? (
                        <div className="db__tourney-list">
                            {activeTournaments.map(t => (
                                <div key={t._id || t.tournamentId} className="db__tourney-row" onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                                    <div className="db__tourney-icon">
                                        {t.bannerImage
                                            ? <img src={`${API_URL}/${t.bannerImage}`} alt="" />
                                            : <i className="bx bx-trophy"></i>
                                        }
                                    </div>
                                    <div className="db__tourney-info">
                                        <strong>{t.title}</strong>
                                        <div className="db__tourney-meta">
                                            <span><i className="bx bx-game"></i> {t.game}</span>
                                            <span><i className="bx bx-calendar"></i> {new Date(t.date).toLocaleDateString('es')}</span>
                                        </div>
                                    </div>
                                    <div className="db__tourney-right">
                                        <span className={`db__tourney-status ${t.status}`}>
                                            {t.status === 'ongoing' ? 'EN CURSO' : t.status === 'open' ? 'ABIERTO' : t.status.toUpperCase()}
                                        </span>
                                        <span className="db__tourney-slots">
                                            <i className="bx bx-user"></i> {t.currentSlots}/{t.maxSlots}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="db__panel-empty">
                            <i className="bx bx-trophy"></i>
                            <p>No hay torneos activos</p>
                            <button className="db__btn db__btn--outline" onClick={() => navigate('/tournaments')}>Explorar torneos</button>
                        </div>
                    )}
                </section>

                {/* ─── PANEL: GAME LIBRARY (Mini tiles) ─── */}
                <section className="db__panel db__panel--library">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-collection"></i> BIBLIOTECA DE JUEGOS</span>
                        <span className="db__panel-count">{enrichedGames.length}</span>
                    </div>

                    {enrichedGames.length > 0 ? (
                        <div className="db__games-grid">
                            {enrichedGames.map(game => (
                                <div
                                    key={game.id}
                                    className={`db__game-card ${hoveredGame === game.id ? 'is-hover' : ''}`}
                                    onMouseEnter={() => setHoveredGame(game.id)}
                                    onMouseLeave={() => setHoveredGame(null)}
                                    onClick={() => {
                                        const idx = enrichedGames.findIndex(g => g.id === game.id);
                                        setFeaturedGameIdx(idx);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                >
                                    <img src={game.banner} alt={game.name} className="db__game-bg" />
                                    <div className="db__game-info">
                                        <strong>{game.name}</strong>
                                        <span>{game.developer}</span>
                                    </div>
                                    <div className="db__game-glow"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="db__panel-empty">
                            <i className="bx bx-joystick"></i>
                            <p>Agrega juegos para ver tu biblioteca</p>
                        </div>
                    )}
                </section>

                {/* ─── PANEL: QUICK NAV / COMMAND CENTER ─── */}
                <section className="db__panel db__panel--nav">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-grid-alt"></i> CENTRO DE MANDO</span>
                    </div>
                    <div className="db__nav-grid">
                        {[
                            { icon: 'bx bxs-user-detail', label: 'Perfil',      path: '/profile',     color: '#8EDB15' },
                            { icon: 'bx bxs-group',       label: 'Equipos',     path: '/teams',       color: '#00d2ff' },
                            { icon: 'bx bxs-trophy',      label: 'Torneos',     path: '/tournaments', color: '#ffd700' },
                            { icon: 'bx bxs-graduation',  label: 'Universidad', path: '/university',  color: '#ff6b6b' },
                            { icon: 'bx bxs-cog',         label: 'Ajustes',     path: '/settings',    color: '#a78bfa' },
                            { icon: 'bx bxs-store',       label: 'Tienda',      path: '/marketplace', color: '#f97316' },
                        ].map(item => (
                            <button key={item.path} className="db__nav-btn" onClick={() => navigate(item.path)} style={{ '--nav-c': item.color }}>
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* ─── PANEL: ACCOUNT / CONNECTIONS ─── */}
                <section className="db__panel db__panel--account">
                    <div className="db__panel-hud">
                        <span className="db__panel-label"><i className="bx bx-id-card"></i> INFO DE CUENTA</span>
                    </div>
                    <div className="db__acct-grid">
                        {[
                            { icon: 'bx bx-envelope',    lbl: 'Email',       val: user.email },
                            { icon: 'bx bx-user',        lbl: 'Nombre',      val: user.fullName },
                            { icon: 'bx bx-map',         lbl: 'País',        val: user.country },
                            { icon: 'bx bx-target-lock', lbl: 'Objetivos',   val: user.goals?.length ? user.goals.join(', ') : '—' },
                            { icon: 'bx bx-star',        lbl: 'Experiencia', val: user.experience?.length ? user.experience.join(', ') : '—' },
                            { icon: 'bx bxl-discord-alt',lbl: 'Discord',     val: user.connections?.discord?.verified ? user.connections.discord.username : 'No vinculado' },
                        ].map(item => (
                            <div key={item.lbl} className="db__acct-row">
                                <i className={item.icon}></i>
                                <div>
                                    <span className="db__acct-lbl">{item.lbl}</span>
                                    <span className="db__acct-val">{item.val}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Dashboard;
