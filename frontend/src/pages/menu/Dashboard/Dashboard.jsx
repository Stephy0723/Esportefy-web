import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'react-apexcharts';
import { API_URL } from '../../../config/api';
import PageHud from '../../../components/PageHud/PageHud';
import './Dashboard.css';
import { gamesDetailedData } from '../../../data/gamesDetailedData';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import SponsorMotion from '../../../components/SponsorMotion/SponsorMotion';

/* ── Animated count-up ── */
const AnimatedNumber = ({ target, duration = 1800 }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!target) { setCount(0); return; }
        let start = 0;
        const inc = target / (duration / 16);
        const t = setInterval(() => {
            start += inc;
            if (start >= target) { setCount(target); clearInterval(t); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return <span>{count.toLocaleString()}</span>;
};

/* ── Tier color mapping ── */
const TIER_COLORS = {
    IRON: '#6B6B6B', BRONZE: '#8B6914', SILVER: '#A0A0A0',
    GOLD: '#FFD700', PLATINUM: '#00CED1', EMERALD: '#50C878',
    DIAMOND: '#B9F2FF', MASTER: '#9B59B6', GRANDMASTER: '#E74C3C',
    CHALLENGER: '#F1C40F'
};
const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];

/* ── Hex to rgba helper ── */
const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
};

/* ── Sections for dot nav ── */
const SECTIONS = [
    { id: 'hero',        label: 'Identidad' },
    { id: 'metrics',     label: 'Métricas' },
    { id: 'connections', label: 'Cuentas' },
    { id: 'teams',       label: 'Equipos' },
    { id: 'tourneys',    label: 'Torneos' },
    { id: 'communities', label: 'Comunidades' },
    { id: 'library',     label: 'Juegos' },
    { id: 'account',     label: 'Cuenta' },
];

/* ── Connection providers ── */
const CONNECTION_PROVIDERS = [
    { id: 'riot',    icon: 'bx bxs-shield-alt-2', name: 'Riot Games',    color: '#ff4655', fields: ['gameName','tagLine'], verifiedKey: 'riot' },
    { id: 'discord', icon: 'bx bxl-discord-alt',  name: 'Discord',       color: '#5865F2', fields: ['username'],           verifiedKey: 'discord' },
    { id: 'moonton', icon: 'bx bx-game',           name: 'Moonton (MLBB)', color: '#00b4d8', fields: ['gameId'],            verifiedKey: 'moonton' },
    { id: 'steam',   icon: 'bx bxl-steam',         name: 'Steam',         color: '#1b2838', fields: ['steamId'],            verifiedKey: 'steam' },
    { id: 'epic',    icon: 'bx bx-cube',           name: 'Epic Games',    color: '#0078f2', fields: ['epicId'],             verifiedKey: 'epic' },
    { id: 'twitch',  icon: 'bx bxl-twitch',        name: 'Twitch',        color: '#9146ff', fields: ['twitchId'],           verifiedKey: 'twitch' },
];

/* ── Framer variants ── */
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const fadeChild = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
};
const slideRight = {
    hidden: { opacity: 0, x: 320 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', damping: 28, stiffness: 260 } },
    exit: { opacity: 0, x: 320, transition: { duration: 0.25 } }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const sectionRefs = useRef({});
    const teamsTrackRef = useRef(null);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myTeams, setMyTeams] = useState([]);
    const [activeTeam, setActiveTeam] = useState(null);
    const [now, setNow] = useState(new Date());
    const [tournaments, setTournaments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [activeSection, setActiveSection] = useState('hero');
    const [connectionPanel, setConnectionPanel] = useState(null);
    const [myCommunities, setMyCommunities] = useState([]);
    const [activeGameIdx, setActiveGameIdx] = useState(0);
    const [teamPanel, setTeamPanel] = useState(null);

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

    /* ══════════════════════════════════════════════
       FETCH COMMUNITIES
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchComms = async () => {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (!token) return;
            try {
                const res = await axios.get(`${API_URL}/api/community/communities/mine`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setMyCommunities(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error('Error cargando comunidades:', err);
            }
        };
        if (user) fetchComms();
    }, [user]);

    /* ── IntersectionObserver for dot nav ── */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) setActiveSection(entry.target.dataset.section);
                });
            },
            { root: container, threshold: 0.55 }
        );
        Object.values(sectionRefs.current).forEach(el => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [loading, user]);

    const scrollTo = useCallback((id) => {
        const el = sectionRefs.current[id];
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const scrollTeams = useCallback((dir) => {
        const track = teamsTrackRef.current;
        if (!track) return;
        track.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }, []);

    /* ── Datos derivados ── */
    const userData = { username: user?.username || 'Jugador', games: user?.selectedGames || [] };
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];

    const riotLinked = user?.connections?.riot?.verified;
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

    const greeting = useMemo(() => {
        const h = now.getHours();
        if (h < 6)  return 'Buenas noches';
        if (h < 12) return 'Buenos días';
        if (h < 19) return 'Buenas tardes';
        return 'Buenas noches';
    }, [now]);

    const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

    const activeTournaments = useMemo(() =>
        tournaments
            .filter(t => t.status === 'open' || t.status === 'ongoing')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 5),
    [tournaments]);

    const pendingRequests = useMemo(() => {
        if (!user?._id) return [];
        const uid = String(user._id);
        let reqs = [];
        myTeams.forEach(team => {
            if (String(team.captain?._id || team.captain) === uid) {
                (team.joinRequests || []).forEach(r => {
                    if (r.status === 'pending') reqs.push({ ...r, teamName: team.name, teamId: team._id });
                });
            }
        });
        return reqs;
    }, [myTeams, user?._id]);

    const profileCompletion = useMemo(() => {
        if (!user) return 0;
        const checks = [
            !!user.avatar, !!user.bio,
            (user.selectedGames?.length || 0) > 0, (user.platforms?.length || 0) > 0,
            (user.goals?.length || 0) > 0, (user.experience?.length || 0) > 0,
            !!user.connections?.riot?.verified, !!user.connections?.discord?.verified,
            !!user.selectedFrameId, !!user.selectedBgId
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }, [user]);

    const accountAgeDays = useMemo(() => {
        if (!user?.createdAt) return 0;
        return Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86400000);
    }, [user?.createdAt]);

    const totalRosterSlots = useMemo(() =>
        myTeams.reduce((sum, t) => sum + (t.roster?.starters?.length || 0) + (t.roster?.subs?.length || 0) + (t.roster?.coach ? 1 : 0), 0),
    [myTeams]);

    const highestRank = useMemo(() => {
        const lolTier = user?.gameProfiles?.lol?.rank?.tier;
        const valTier = user?.gameProfiles?.valorant?.rank?.tier;
        const lolIdx = lolTier ? TIER_ORDER.indexOf(lolTier.toUpperCase()) : -1;
        const valIdx = valTier ? TIER_ORDER.indexOf(valTier.toUpperCase()) : -1;
        if (lolIdx >= valIdx && lolTier) return { tier: lolTier, game: 'LoL' };
        if (valTier) return { tier: valTier, game: 'Valorant' };
        return null;
    }, [user?.gameProfiles]);

    /* ── ApexCharts data ── */
    const categoryChartOpts = useMemo(() => {
        const counts = {};
        enrichedGames.forEach(g => { const cat = g.category || 'Otro'; counts[cat] = (counts[cat] || 0) + 1; });
        return {
            series: Object.values(counts),
            options: {
                chart: { type: 'donut', background: 'transparent' },
                labels: Object.keys(counts),
                colors: ['#8EDB15', '#00d2ff', '#ff4655', '#ffd700', '#a78bfa', '#f97316'],
                stroke: { width: 0 },
                dataLabels: { enabled: false },
                legend: { position: 'bottom', labels: { colors: 'rgba(255,255,255,0.5)' }, fontSize: '11px', fontWeight: 700 },
                plotOptions: { pie: { donut: { size: '68%', labels: { show: true, total: { show: true, label: 'Total', color: 'rgba(255,255,255,0.4)', fontSize: '12px', formatter: () => enrichedGames.length } } } } },
                tooltip: { theme: 'dark' },
                theme: { mode: 'dark' }
            }
        };
    }, [enrichedGames]);

    const tournamentChartOpts = useMemo(() => {
        const sm = { open: 0, ongoing: 0, finished: 0, cancelled: 0 };
        tournaments.forEach(t => { if (sm[t.status] !== undefined) sm[t.status]++; });
        return {
            series: [{ name: 'Torneos', data: [sm.open, sm.ongoing, sm.finished, sm.cancelled] }],
            options: {
                chart: { type: 'bar', background: 'transparent', toolbar: { show: false } },
                colors: ['#8EDB15'],
                plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
                xaxis: { categories: ['Abiertos', 'En Curso', 'Finalizados', 'Cancelados'], labels: { style: { colors: 'rgba(255,255,255,0.5)', fontSize: '11px' } } },
                yaxis: { labels: { style: { colors: 'rgba(255,255,255,0.4)' } }, stepSize: 1 },
                grid: { borderColor: 'rgba(255,255,255,0.04)', strokeDashArray: 4 },
                dataLabels: { enabled: false },
                tooltip: { theme: 'dark' },
                theme: { mode: 'dark' },
                legend: { show: false },
                fill: { colors: ['#8EDB15', '#ff4466', '#00d2ff', '#666'] },
                states: { hover: { filter: { type: 'lighten', value: 0.15 } } }
            }
        };
    }, [tournaments]);

    const radialOpts = useMemo(() => ({
        series: [profileCompletion],
        options: {
            chart: { type: 'radialBar', background: 'transparent' },
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%' },
                    track: { background: 'rgba(255,255,255,0.06)' },
                    dataLabels: {
                        name: { show: true, fontSize: '11px', color: 'rgba(255,255,255,0.4)', offsetY: 18 },
                        value: { show: true, fontSize: '28px', fontWeight: 900, color: '#8EDB15', offsetY: -12, formatter: (v) => `${v}%` }
                    }
                }
            },
            colors: ['#8EDB15'],
            labels: ['Perfil'],
            stroke: { lineCap: 'round' },
            theme: { mode: 'dark' }
        }
    }), [profileCompletion]);

    /* ── Connection status helper ── */
    const isConnected = (providerId) => {
        return !!user?.connections?.[providerId]?.verified;
    };

    const connectedCount = CONNECTION_PROVIDERS.filter(p => isConnected(p.id)).length;

    /* ── Get connected account display info ── */
    const getConnectionInfo = (provider) => {
        const conn = user?.connections?.[provider.id];
        if (!conn?.verified) return null;
        switch (provider.id) {
            case 'riot':
                return { tag: `${conn.gameName || '?'}#${conn.tagLine || '?'}`, stats: [
                    { label: 'Rango', val: riotRank ? `${riotRank.tier} ${riotRank.division || ''}` : 'Sin rango' },
                    { label: 'LP', val: riotRank?.lp !== undefined ? `${riotRank.lp}` : '—' },
                ] };
            case 'discord':
                return { tag: conn.username || 'Conectado', stats: [
                    { label: 'Estado', val: 'Verificado' },
                    { label: 'Tipo', val: 'OAuth2' },
                ] };
            default:
                return { tag: conn.username || conn.gameId || conn.steamId || conn.epicId || conn.twitchId || 'Conectado', stats: [
                    { label: 'Estado', val: 'Verificado' },
                    { label: 'ID', val: '•••••' },
                ] };
        }
    };

    /* ── Active game for library ── */
    const activeGame = enrichedGames[activeGameIdx] || null;

    /* ── Match game to community ── */
    const activeGameCommunity = useMemo(() => {
        if (!activeGame || !Array.isArray(myCommunities)) return null;
        return myCommunities.find(c =>
            c.mainGames?.some(g => g.toLowerCase().includes(activeGame.name?.toLowerCase()))
        ) || null;
    }, [activeGame, myCommunities]);

    /* ── Team roster helper ── */
    const getTeamRoster = (team) => {
        if (!team) return [];
        const members = [];
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const coach = team.roster?.coach;
        starters.forEach(p => members.push({ ...p, section: 'Titular' }));
        subs.forEach(p => members.push({ ...p, section: 'Suplente' }));
        if (coach) members.push({ ...coach, section: 'Coach' });
        return members;
    };

    /* ── Loading ── */
    if (loading) {
        return (
            <div className="db-loading">
                <div className="db-loading__pulse"></div>
                <p>Cargando tu hub...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="db-loading">
                <p>No se pudo cargar tu perfil. Verifica tu conexión.</p>
            </div>
        );
    }

    const tierColor = TIER_COLORS[riotRank?.tier?.toUpperCase()] || '#8EDB15';

    /* ══════════════════════════════════════════════
       RENDER
       ══════════════════════════════════════════════ */
    return (
        <div className="db" ref={containerRef}>
            <PageHud page="DASHBOARD" />

            {/* ═══════ DOT NAV ═══════ */}
            <nav className="db__dot-nav">
                {SECTIONS.map(s => (
                    <button key={s.id} className={`db__dot ${activeSection === s.id ? 'active' : ''}`} onClick={() => scrollTo(s.id)}>
                        <span className="db__dot-label">{s.label}</span>
                    </button>
                ))}
            </nav>

            {/* ═══════ SPONSOR SNAKE ═══════ */}
            <div className="db__sponsor-wrap">
                <SponsorMotion />
            </div>

            {/* ═══════ CONNECTION PANEL (slide right) ═══════ */}
            <AnimatePresence>
                {connectionPanel && (
                    <>
                        <motion.div className="db__panel-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConnectionPanel(null)} />
                        <motion.aside className="db__conn-panel" variants={slideRight} initial="hidden" animate="visible" exit="exit">
                            <div className="db__conn-panel-header">
                                <h3>{connectionPanel.name}</h3>
                                <button onClick={() => setConnectionPanel(null)}><i className="bx bx-x"></i></button>
                            </div>
                            <div className="db__conn-panel-body">
                                {(() => {
                                    const info = getConnectionInfo(connectionPanel);
                                    if (info) {
                                        /* ── Connected: rich account view ── */
                                        return (
                                            <div className="db__conn-panel-linked">
                                                <div className="db__conn-panel-avatar" style={{ color: connectionPanel.color, borderColor: connectionPanel.color }}>
                                                    <i className={connectionPanel.icon}></i>
                                                    <span className="db__conn-panel-badge"><i className="bx bx-check"></i></span>
                                                </div>
                                                <p className="db__conn-panel-gamertag" style={{ color: connectionPanel.color }}>{info.tag}</p>
                                                <p className="db__conn-panel-sub">Cuenta verificada en {connectionPanel.name}</p>
                                                <div className="db__conn-panel-stats">
                                                    {info.stats.map(s => (
                                                        <div key={s.label} className="db__conn-panel-stat">
                                                            <span className="db__conn-panel-stat-val">{s.val}</span>
                                                            <span className="db__conn-panel-stat-lbl">{s.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="db__conn-panel-actions">
                                                    <button className="db__btn db__btn--outline" onClick={() => navigate('/settings')}>
                                                        <i className="bx bx-cog"></i> Configurar
                                                    </button>
                                                    <button className="db__btn db__btn--danger-ghost">
                                                        <i className="bx bx-unlink"></i> Desvincular
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        /* ── Not connected: CTA + preview mockup ── */
                                        return (
                                            <>
                                                <div className="db__conn-panel-icon" style={{ color: connectionPanel.color }}>
                                                    <i className={connectionPanel.icon}></i>
                                                </div>
                                                <div className="db__conn-panel-status db__conn-panel-status--pending">
                                                    <i className="bx bx-link-external"></i>
                                                    <span>No vinculada</span>
                                                    <p className="db__conn-panel-desc">Vincula tu cuenta de {connectionPanel.name} para acceder a estadísticas y funciones exclusivas.</p>
                                                    <button className="db__btn db__btn--primary" onClick={() => navigate('/settings')}>
                                                        <i className="bx bx-link-alt"></i> Vincular ahora
                                                    </button>
                                                </div>
                                                {/* Preview mockup of what it looks like linked */}
                                                <div className="db__conn-panel-preview">
                                                    <div className="db__conn-panel-avatar" style={{ color: connectionPanel.color, borderColor: connectionPanel.color }}>
                                                        <i className={connectionPanel.icon}></i>
                                                    </div>
                                                    <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>Tu Gamertag#0000</span>
                                                    <div className="db__conn-panel-stats" style={{ width: '100%' }}>
                                                        <div className="db__conn-panel-stat">
                                                            <span className="db__conn-panel-stat-val">—</span>
                                                            <span className="db__conn-panel-stat-lbl">Rango</span>
                                                        </div>
                                                        <div className="db__conn-panel-stat">
                                                            <span className="db__conn-panel-stat-val">—</span>
                                                            <span className="db__conn-panel-stat-lbl">Stats</span>
                                                        </div>
                                                    </div>
                                                    <span className="db__conn-panel-preview-tag">Así se verá tu cuenta vinculada</span>
                                                </div>
                                            </>
                                        );
                                    }
                                })()}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════ TEAM DETAIL PANEL (slide right) ═══════ */}
            <AnimatePresence>
                {teamPanel && (
                    <>
                        <motion.div className="db__panel-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setTeamPanel(null)} />
                        <motion.aside className="db__team-panel" variants={slideRight} initial="hidden" animate="visible" exit="exit">
                            <div className="db__team-panel-header">
                                <div className="db__tp-header-logo">
                                    {teamPanel.logo ? <img src={teamPanel.logo} alt={teamPanel.name} /> : <i className="bx bx-group"></i>}
                                </div>
                                <div className="db__tp-header-info">
                                    <strong>{teamPanel.name}</strong>
                                    <span>{teamPanel.game || 'Sin juego'} • {teamPanel.tag || teamPanel._id?.slice(-6)}</span>
                                </div>
                                <button className="db__team-panel-header-close" onClick={() => setTeamPanel(null)}><i className="bx bx-x"></i></button>
                            </div>
                            <div className="db__team-panel-body">
                                <span className="db__tp-role-badge"><i className="bx bx-shield-quarter"></i> {resolveTeamRole(teamPanel)}</span>

                                <div className="db__tp-info-row">
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Miembros</span>
                                        <span className="db__tp-info-item-val">{(teamPanel.roster?.starters?.length || 0) + (teamPanel.roster?.subs?.length || 0) + (teamPanel.roster?.coach ? 1 : 0)}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Región</span>
                                        <span className="db__tp-info-item-val">{teamPanel.region || '—'}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Creado</span>
                                        <span className="db__tp-info-item-val">{teamPanel.createdAt ? new Date(teamPanel.createdAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : '—'}</span>
                                    </div>
                                </div>

                                <p className="db__tp-roster-title">Roster</p>
                                <div className="db__tp-roster-list">
                                    {getTeamRoster(teamPanel).map((member, idx) => (
                                        <div key={idx} className="db__tp-member">
                                            <div className="db__tp-member-avatar">
                                                {member.user?.avatar ? <img src={member.user.avatar} alt="" /> : <i className="bx bx-user"></i>}
                                            </div>
                                            <div className="db__tp-member-info">
                                                <strong>{member.user?.username || member.username || 'Jugador'}</strong>
                                                <span>{member.role || member.section}</span>
                                            </div>
                                            <span className="db__tp-member-role">{member.section}</span>
                                        </div>
                                    ))}
                                    {getTeamRoster(teamPanel).length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', textAlign: 'center', padding: '16px 0' }}>Sin miembros registrados</p>
                                    )}
                                </div>
                            </div>
                            <div className="db__team-panel-footer">
                                <button className="db__btn db__btn--primary" onClick={() => navigate('/teams')}>
                                    <i className="bx bx-expand"></i> Ver equipo completo
                                </button>
                                <button className="db__btn db__btn--outline" onClick={() => setTeamPanel(null)}>
                                    Cerrar
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* ═══════════════════════════════════════════
                SECTION 1 — HERO
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--hero" data-section="hero" ref={el => sectionRefs.current.hero = el}>
                <div className="db__hero-bg" style={{ backgroundImage: `url(${currentBg.src})` }}>
                    <div className="db__hero-scanline" />
                </div>

                <div className="db__hero-hud">
                    <div className="db__hero-hud-left">
                        <span className="db__hero-hud-dot"></span>
                        <span>DASHBOARD</span>
                        <span className="db__hero-hud-sep">/</span>
                        <span>{userData.username.toUpperCase()}</span>
                    </div>
                    <div className="db__hero-hud-right">
                        <span>{timeStr}</span>
                        <span className="db__hero-hud-sep">|</span>
                        <span>{dateStr}</span>
                    </div>
                </div>

                <motion.div className="db__hero-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}>
                    <div className="db__hero-avatar">
                        <AvatarCircle src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`} frameConfig={currentFrame} size="150px" status={user.status} />
                    </div>
                    <span className="db__hero-greeting">{greeting}</span>
                    <PlayerTag name={userData.username.toUpperCase()} tagId={user.selectedTagId} size="normal" fontTag="2.8rem" />
                    {user.bio && <p className="db__hero-bio">{user.bio}</p>}
                    <div className="db__hero-chips">
                        {user.country && <span className="db__hero-chip"><i className="bx bx-globe"></i>{user.country}</span>}
                        <span className="db__hero-chip"><i className="bx bx-game"></i>{userData.games.length} juego{userData.games.length !== 1 ? 's' : ''}</span>
                        {myTeams.length > 0 && <span className="db__hero-chip db__hero-chip--accent"><i className="bx bx-group"></i>{myTeams.length} equipo{myTeams.length !== 1 ? 's' : ''}</span>}
                        {user.platforms?.length > 0 && <span className="db__hero-chip"><i className="bx bx-desktop"></i>{user.platforms.join(', ')}</span>}
                    </div>
                </motion.div>

                <button className="db__hero-edit" onClick={() => navigate('/profile')}><i className="bx bx-edit-alt"></i> Editar perfil</button>
                <div className="db__scroll-hint"><span>Scroll</span><i className="bx bx-chevron-down"></i></div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 2 — MÉTRICAS MODERNAS
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--metrics" data-section="metrics" ref={el => sectionRefs.current.metrics = el}>
                <motion.div className="db__metrics-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__metrics-header" variants={fadeChild}>
                        <p className="db__metrics-kicker">Centro de comando</p>
                        <h2 className="db__metrics-title">Métricas de Jugador</h2>
                    </motion.div>

                    <div className="db__metrics-layout">
                        {/* LEFT: Detailed metrics */}
                        <motion.div className="db__metrics-left" variants={stagger}>
                            {/* Rank card */}
                            {riotLinked && riotRank?.tier && (
                                <motion.div className="db__mcard db__mcard--rank" variants={fadeChild} style={{ '--tc': tierColor }}>
                                    <div className="db__mcard-icon" style={{ borderColor: tierColor, background: hexToRgba(tierColor, 0.08) }}>
                                        <i className="bx bxs-shield-alt-2" style={{ color: tierColor }}></i>
                                    </div>
                                    <div className="db__mcard-body">
                                        <span className="db__mcard-label">RANGO LoL</span>
                                        <span className="db__mcard-value" style={{ color: tierColor }}>{riotRank.tier} {riotRank.division}</span>
                                        {riotRank.lp !== undefined && <span className="db__mcard-sub">{riotRank.lp} LP</span>}
                                    </div>
                                    <div className="db__mcard-glow" style={{ background: tierColor }}></div>
                                </motion.div>
                            )}

                            <motion.div className="db__mcard" variants={fadeChild}>
                                <div className="db__mcard-icon"><i className="bx bx-game"></i></div>
                                <div className="db__mcard-body">
                                    <span className="db__mcard-label">JUEGOS</span>
                                    <span className="db__mcard-value"><AnimatedNumber target={userData.games.length} /></span>
                                </div>
                            </motion.div>

                            <motion.div className="db__mcard" variants={fadeChild}>
                                <div className="db__mcard-icon"><i className="bx bx-group"></i></div>
                                <div className="db__mcard-body">
                                    <span className="db__mcard-label">EQUIPOS</span>
                                    <span className="db__mcard-value"><AnimatedNumber target={myTeams.length} /></span>
                                </div>
                            </motion.div>

                            <motion.div className="db__mcard" variants={fadeChild}>
                                <div className="db__mcard-icon" style={{ borderColor: '#ffd700', background: 'rgba(255,215,0,0.08)' }}>
                                    <i className="bx bx-trophy" style={{ color: '#ffd700' }}></i>
                                </div>
                                <div className="db__mcard-body">
                                    <span className="db__mcard-label">TORNEOS ACTIVOS</span>
                                    <span className="db__mcard-value"><AnimatedNumber target={activeTournaments.length} /></span>
                                </div>
                            </motion.div>

                            <motion.div className="db__mcard" variants={fadeChild}>
                                <div className="db__mcard-icon"><i className="bx bx-time-five"></i></div>
                                <div className="db__mcard-body">
                                    <span className="db__mcard-label">DÍAS ACTIVO</span>
                                    <span className="db__mcard-value"><AnimatedNumber target={accountAgeDays} /></span>
                                </div>
                            </motion.div>

                            <motion.div className="db__mcard" variants={fadeChild}>
                                <div className="db__mcard-icon"><i className="bx bx-user-check"></i></div>
                                <div className="db__mcard-body">
                                    <span className="db__mcard-label">SLOTS ROSTER</span>
                                    <span className="db__mcard-value"><AnimatedNumber target={totalRosterSlots} /></span>
                                </div>
                            </motion.div>

                            {highestRank && (
                                <motion.div className="db__mcard" variants={fadeChild}>
                                    <div className="db__mcard-icon" style={{ borderColor: TIER_COLORS[highestRank.tier.toUpperCase()], background: hexToRgba(TIER_COLORS[highestRank.tier.toUpperCase()], 0.08) }}>
                                        <i className="bx bxs-crown" style={{ color: TIER_COLORS[highestRank.tier.toUpperCase()] }}></i>
                                    </div>
                                    <div className="db__mcard-body">
                                        <span className="db__mcard-label">MEJOR RANGO ({highestRank.game})</span>
                                        <span className="db__mcard-value" style={{ color: TIER_COLORS[highestRank.tier.toUpperCase()] }}>{highestRank.tier}</span>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* RIGHT: Charts */}
                        <motion.div className="db__metrics-right" variants={stagger}>
                            <motion.div className="db__chart-card" variants={fadeChild}>
                                <span className="db__chart-label">Perfil completado</span>
                                <div className="db__chart-area db__chart-area--radial">
                                    <Chart options={radialOpts.options} series={radialOpts.series} type="radialBar" height={200} />
                                </div>
                            </motion.div>

                            <motion.div className="db__chart-card" variants={fadeChild}>
                                <span className="db__chart-label">Géneros de juego</span>
                                <div className="db__chart-area">
                                    {enrichedGames.length > 0
                                        ? <Chart options={categoryChartOpts.options} series={categoryChartOpts.series} type="donut" height={220} />
                                        : <p className="db__chart-empty">Sin juegos</p>
                                    }
                                </div>
                            </motion.div>

                            <motion.div className="db__chart-card" variants={fadeChild}>
                                <span className="db__chart-label">Torneos por estado</span>
                                <div className="db__chart-area">
                                    {tournaments.length > 0
                                        ? <Chart options={tournamentChartOpts.options} series={tournamentChartOpts.series} type="bar" height={200} />
                                        : <p className="db__chart-empty">Sin datos</p>
                                    }
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 3 — VINCULACIÓN DE CUENTAS
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--connections" data-section="connections" ref={el => sectionRefs.current.connections = el}>
                <motion.div className="db__conn-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__conn-header" variants={fadeChild}>
                        <p className="db__conn-kicker">Integraciones</p>
                        <h2 className="db__conn-title">Vincula tus Cuentas</h2>
                        <p className="db__conn-subtitle">{connectedCount}/{CONNECTION_PROVIDERS.length} vinculadas</p>
                    </motion.div>

                    <motion.div className="db__conn-grid" variants={stagger}>
                        {CONNECTION_PROVIDERS.map(p => {
                            const linked = isConnected(p.id);
                            return (
                                <motion.div
                                    key={p.id}
                                    className={`db__conn-card ${linked ? 'db__conn-card--linked' : ''}`}
                                    variants={fadeChild}
                                    onClick={() => setConnectionPanel(p)}
                                    style={{ '--cc': p.color }}
                                >
                                    <div className="db__conn-card-icon"><i className={p.icon}></i></div>
                                    <div className="db__conn-card-info">
                                        <strong>{p.name}</strong>
                                        <span>{linked ? 'Vinculada' : 'No vinculada'}</span>
                                    </div>
                                    <div className="db__conn-card-status">
                                        {linked
                                            ? <i className="bx bx-check-circle" style={{ color: '#4ade80' }}></i>
                                            : <i className="bx bx-plus-circle" style={{ color: 'var(--text-muted)' }}></i>
                                        }
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    <motion.div className="db__conn-footer" variants={fadeChild}>
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/settings')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 4 — EQUIPOS
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--teams" data-section="teams" ref={el => sectionRefs.current.teams = el}>
                <motion.div className="db__teams-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__teams-header" variants={fadeChild}>
                        <div>
                            <p className="db__teams-kicker">Tu Roster</p>
                            <h2 className="db__teams-title">Mis Equipos</h2>
                        </div>
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/teams')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>

                    {myTeams.length > 0 ? (
                        <div className="db__teams-carousel">
                            <button className="db__teams-arrow db__teams-arrow--left" onClick={() => scrollTeams(-1)}>
                                <i className="bx bx-chevron-left"></i>
                            </button>
                            <motion.div className="db__teams-track" ref={teamsTrackRef} variants={stagger}>
                                {myTeams.map(team => (
                                    <motion.div key={team._id} className="db__team-card" variants={fadeChild} onClick={() => setTeamPanel(team)}>
                                        <div className="db__tc-logo">
                                            {team.logo ? <img src={team.logo} alt={team.name} /> : <div className="db__tc-logo--ph"><i className="bx bx-group"></i></div>}
                                        </div>
                                        <strong className="db__tc-name">{team.name}</strong>
                                        <span className="db__tc-game">{team.game || 'Sin juego'}</span>
                                        <span className="db__tc-role">{resolveTeamRole(team)}</span>
                                        <div className="db__tc-members"><i className="bx bx-user"></i><span>{(team.roster?.starters?.length || 0) + (team.roster?.subs?.length || 0)} miembros</span></div>
                                    </motion.div>
                                ))}
                            </motion.div>
                            <button className="db__teams-arrow db__teams-arrow--right" onClick={() => scrollTeams(1)}>
                                <i className="bx bx-chevron-right"></i>
                            </button>
                        </div>
                    ) : (
                        <motion.div className="db__teams-empty" variants={fadeChild}>
                            <i className="bx bx-group"></i>
                            <p>No perteneces a ningún equipo aún</p>
                            <div className="db__teams-empty-btns">
                                <button className="db__btn db__btn--primary" onClick={() => navigate('/create-team')}><i className="bx bx-plus"></i> Crear equipo</button>
                                <button className="db__btn db__btn--outline" onClick={() => navigate('/teams')}><i className="bx bx-search"></i> Buscar</button>
                            </div>
                        </motion.div>
                    )}

                    {pendingRequests.length > 0 && (
                        <div className="db__teams-pending">
                            <i className="bx bx-bell bx-tada"></i>
                            <span>{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}</span>
                            <button className="db__btn db__btn--sm" onClick={() => navigate('/teams')}>Revisar</button>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 5 — TORNEOS
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--tourneys" data-section="tourneys" ref={el => sectionRefs.current.tourneys = el}>
                <motion.div className="db__tourneys-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__tourneys-header" variants={fadeChild}>
                        <div>
                            <p className="db__tourneys-kicker">Competición</p>
                            <h2 className="db__tourneys-title">Torneos Activos</h2>
                        </div>
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/tournaments')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>

                    {activeTournaments.length > 0 ? (
                        <motion.div className="db__tourneys-list" variants={stagger}>
                            {activeTournaments.map(t => {
                                const slotPercent = t.maxSlots ? Math.round((t.currentSlots / t.maxSlots) * 100) : 0;
                                const msLeft = new Date(t.date).getTime() - now.getTime();
                                const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
                                const hoursLeft = Math.max(0, Math.floor((msLeft % 86400000) / 3600000));
                                return (
                                    <motion.div key={t._id || t.tournamentId} className="db__tr-card" variants={fadeChild} onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                                        <div className="db__tr-thumb">
                                            {t.bannerImage ? <img src={`${API_URL}/${t.bannerImage}`} alt="" /> : <i className="bx bx-trophy"></i>}
                                        </div>
                                        <div className="db__tr-info">
                                            <strong>{t.title}</strong>
                                            <div className="db__tr-meta">
                                                <span><i className="bx bx-game"></i> {t.game}</span>
                                                <span><i className="bx bx-calendar"></i> {new Date(t.date).toLocaleDateString('es')}</span>
                                                {t.prizePool && <span className="db__tr-prize"><i className="bx bx-dollar-circle"></i> {t.prizePool}</span>}
                                            </div>
                                            <div className="db__tr-progress">
                                                <div className="db__tr-progress-bar"><div className="db__tr-progress-fill" style={{ width: `${slotPercent}%` }}></div></div>
                                                <span className="db__tr-progress-text">{t.currentSlots}/{t.maxSlots} equipos</span>
                                            </div>
                                        </div>
                                        <div className="db__tr-right">
                                            <span className={`db__tr-status db__tr-status--${t.status}`}>
                                                {t.status === 'ongoing' ? 'EN CURSO' : t.status === 'open' ? 'ABIERTO' : t.status.toUpperCase()}
                                            </span>
                                            {msLeft > 0 && t.status === 'open' && (
                                                <span className="db__tr-countdown"><i className="bx bx-timer"></i>{daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : `${hoursLeft}h`}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div className="db__tourneys-empty" variants={fadeChild}>
                            <i className="bx bx-trophy"></i>
                            <p>No hay torneos activos</p>
                            <button className="db__btn db__btn--outline" onClick={() => navigate('/tournaments')}>Explorar torneos</button>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 6 — COMUNIDADES
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--communities" data-section="communities" ref={el => sectionRefs.current.communities = el}>
                <motion.div className="db__comms-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__comms-header" variants={fadeChild}>
                        <div>
                            <p className="db__comms-kicker">Social</p>
                            <h2 className="db__comms-title">Mis Comunidades</h2>
                        </div>
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/community')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>

                    {myCommunities.length > 0 ? (
                        <motion.div className="db__comms-grid" variants={stagger}>
                            {myCommunities.slice(0, 6).map(c => (
                                <motion.div key={c._id || c.id} className="db__comm-card" variants={fadeChild} onClick={() => navigate(`/community/${c.shortUrl}`)}>
                                    <div className="db__comm-banner">
                                        {c.bannerUrl ? <img src={c.bannerUrl} alt="" /> : <div className="db__comm-banner--ph"></div>}
                                    </div>
                                    <div className="db__comm-avatar">
                                        {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} /> : <i className="bx bx-buildings"></i>}
                                    </div>
                                    <div className="db__comm-info">
                                        <strong>{c.name}</strong>
                                        <span>{c.membersCount || 0} miembros</span>
                                    </div>
                                    {c.mainGames?.length > 0 && (
                                        <div className="db__comm-games">
                                            {c.mainGames.slice(0, 2).map((g, i) => <span key={i} className="db__comm-game-tag">{g}</span>)}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div className="db__comms-empty" variants={fadeChild}>
                            <i className="bx bx-buildings"></i>
                            <p>No perteneces a ninguna comunidad</p>
                            <button className="db__btn db__btn--primary" onClick={() => navigate('/community')}>
                                <i className="bx bx-search"></i> Explorar comunidades
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 7 — BIBLIOTECA DE JUEGOS (Fullscreen)
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--library" data-section="library" ref={el => sectionRefs.current.library = el}>
                {/* Dynamic background */}
                {activeGame && (
                    <div className="db__lib-hero-bg" style={{ backgroundImage: `url(${activeGame.banner})` }}>
                        <div className="db__lib-hero-fade" />
                    </div>
                )}

                <motion.div className="db__library-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={stagger}>
                    <div className="db__lib-split">
                        {/* Left: active game detail */}
                        <motion.div className="db__lib-detail" variants={fadeChild}>
                            {activeGame ? (
                                <>
                                    <span className="db__lib-detail-kicker">{activeGame.developer}</span>
                                    <h2 className="db__lib-detail-title">{activeGame.name}</h2>
                                    {activeGame.tags?.length > 0 && (
                                        <div className="db__lib-detail-tags">
                                            {activeGame.tags.slice(0, 5).map((tag, i) => (
                                                <span key={i} className="db__lib-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <p className="db__lib-detail-desc">{activeGame.history?.substring(0, 200)}...</p>
                                    <div className="db__lib-detail-meta">
                                        {activeGame.category && <span><i className="bx bx-category"></i> {activeGame.category}</span>}
                                        {activeGame.platforms && <span><i className="bx bx-desktop"></i> {activeGame.platforms?.join?.(', ') || activeGame.platforms}</span>}
                                    </div>
                                    <button
                                        className="db__btn db__btn--primary db__lib-go-btn"
                                        onClick={() => navigate(activeGameCommunity ? `/communities/${activeGameCommunity.shortUrl}` : '/community')}
                                    >
                                        <i className={activeGameCommunity ? 'bx bx-buildings' : 'bx bx-search'}></i>
                                        {activeGameCommunity ? 'Ir a comunidad' : 'Buscar comunidad'}
                                    </button>
                                </>
                            ) : (
                                <div className="db__lib-empty-detail">
                                    <i className="bx bx-joystick"></i>
                                    <h3>Sin juegos seleccionados</h3>
                                    <button className="db__btn db__btn--primary" onClick={() => navigate('/profile')}>Agregar juegos</button>
                                </div>
                            )}
                        </motion.div>

                        {/* Right: game grid selector */}
                        <motion.div className="db__lib-grid-wrap" variants={stagger}>
                            <div className="db__lib-grid-header">
                                <span className="db__lib-grid-label">TU COLECCIÓN</span>
                                <span className="db__lib-grid-count">{enrichedGames.length}</span>
                            </div>
                            <div className="db__lib-grid">
                                {enrichedGames.map((game, idx) => (
                                    <motion.div
                                        key={game.id}
                                        className={`db__lib-tile ${idx === activeGameIdx ? 'db__lib-tile--active' : ''}`}
                                        variants={fadeChild}
                                        onClick={() => setActiveGameIdx(idx)}
                                    >
                                        <img src={game.banner} alt={game.name} />
                                        <div className="db__lib-tile-overlay">
                                            <strong>{game.name}</strong>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 8 — CUENTA
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--account" data-section="account" ref={el => sectionRefs.current.account = el}>
                <motion.div className="db__account-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__account-header" variants={fadeChild}>
                        <p className="db__account-kicker">Tu perfil</p>
                        <h2 className="db__account-title">Info de Cuenta</h2>
                    </motion.div>

                    <motion.div className="db__account-grid" variants={stagger}>
                        {[
                            { icon: 'bx bx-envelope',     lbl: 'Email',       val: user.email },
                            { icon: 'bx bx-user',         lbl: 'Nombre',      val: user.fullName },
                            { icon: 'bx bx-map',          lbl: 'País',        val: user.country },
                            { icon: 'bx bx-target-lock',  lbl: 'Objetivos',   val: user.goals?.length ? user.goals.join(', ') : '—' },
                            { icon: 'bx bx-star',         lbl: 'Experiencia', val: user.experience?.length ? user.experience.join(', ') : '—' },
                            { icon: 'bx bxl-discord-alt', lbl: 'Discord',     val: user.connections?.discord?.verified ? user.connections.discord.username : 'No vinculado' },
                        ].map(item => (
                            <motion.div key={item.lbl} className="db__acct-item" variants={fadeChild}>
                                <i className={item.icon}></i>
                                <div className="db__acct-item-data">
                                    <span className="db__acct-item-lbl">{item.lbl}</span>
                                    <span className="db__acct-item-val">{item.val}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div className="db__quick-nav" variants={stagger}>
                        {[
                            { icon: 'bx bxs-user-detail', label: 'Perfil',      path: '/profile',     color: '#8EDB15' },
                            { icon: 'bx bxs-group',       label: 'Equipos',     path: '/teams',       color: '#00d2ff' },
                            { icon: 'bx bxs-trophy',      label: 'Torneos',     path: '/tournaments', color: '#ffd700' },
                            { icon: 'bx bxs-graduation',  label: 'Universidad', path: '/university',  color: '#ff6b6b' },
                            { icon: 'bx bxs-cog',         label: 'Ajustes',     path: '/settings',    color: '#a78bfa' },
                            { icon: 'bx bxs-store',       label: 'Tienda',      path: '/marketplace', color: '#f97316' },
                        ].map(item => (
                            <motion.button key={item.path} className="db__qn-btn" variants={fadeChild} onClick={() => navigate(item.path)} style={{ '--qn-c': item.color }}>
                                <i className={item.icon}></i>
                                <span>{item.label}</span>
                            </motion.button>
                        ))}
                    </motion.div>
                </motion.div>
            </section>
        </div>
    );
};

export default Dashboard;
