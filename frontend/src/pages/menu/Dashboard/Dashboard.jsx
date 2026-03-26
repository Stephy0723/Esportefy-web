import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Chart from 'react-apexcharts';
import { FaCheck, FaCheckCircle, FaDiscord, FaGamepad, FaPlusCircle, FaShieldAlt, FaSteam, FaTwitch } from 'react-icons/fa';
import { SiEpicgames } from 'react-icons/si';
import { API_URL } from '../../../config/api';
import PageHud from '../../../components/PageHud/PageHud';
import Footer from '../../../components/Home/Footer';
import './Dashboard.css';
import { supportedGamesDetailedData as gamesDetailedData } from '../../../data/supportedGamesDetailedData';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle.jsx';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import SponsorMotion from '../../../components/SponsorMotion/SponsorMotion';
import { applyImageFallback, getAvatarFallback, getTeamFallback, resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import { useAuth } from '../../../context/AuthContext';
import { isMlbbVerifiedStatus, normalizeMlbbVerificationStatus } from '../../../utils/mlbbStatus';
import { fetchMyCommunities } from '../Community/community.service';
import { getCommunitySocialEntries } from '../Community/communitySocials';

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
    { id: 'stats',       label: 'Resumen' },
    { id: 'metrics',     label: 'Métricas' },
    { id: 'connections', label: 'Cuentas' },
    { id: 'teams',       label: 'Equipos' },
    { id: 'tourneys',    label: 'Torneos' },
    { id: 'activity',    label: 'Actividad' },
    { id: 'communities', label: 'Comunidades' },
];

/* ── Connection providers ── */
const CONNECTION_PROVIDERS = [
    { id: 'riot',    icon: 'bx bxs-shield-alt-2', iconComponent: FaShieldAlt, name: 'Cuenta Riot',     color: '#ff4655', fields: ['gameName','tagLine'], verifiedKey: 'riot' },
    { id: 'discord', icon: 'bx bxl-discord-alt',  iconComponent: FaDiscord,   name: 'Discord',         color: '#5865F2', fields: ['username'],           verifiedKey: 'discord' },
    { id: 'moonton', icon: 'bx bx-game',          iconComponent: FaGamepad,   name: 'Moonton (MLBB)',  color: '#00b4d8', fields: ['gameId'],             verifiedKey: 'moonton' },
    { id: 'steam',   icon: 'bx bxl-steam',        iconComponent: FaSteam,     name: 'Steam',           color: '#1b2838', fields: ['steamId'],            verifiedKey: 'steam', comingSoon: true },
    { id: 'epic',    icon: 'bx bx-cube',          iconComponent: SiEpicgames, name: 'Epic Games',      color: '#0078f2', fields: ['epicId'],             verifiedKey: 'epic', comingSoon: true },
    { id: 'twitch',  icon: 'bx bxl-twitch',       iconComponent: FaTwitch,    name: 'Twitch',          color: '#9146ff', fields: ['twitchId'],           verifiedKey: 'twitch' },
];

const renderConnectionIcon = (provider, className = 'db__conn-provider-icon') => {
    const Icon = provider?.iconComponent;
    if (Icon) return <Icon className={className} aria-hidden="true" />;
    return <span className={className} aria-hidden="true">•</span>;
};

const getProviderName = (providerId) => {
    const normalizedProviderId = String(providerId || '').trim().toLowerCase();
    return CONNECTION_PROVIDERS.find((provider) => provider.id === normalizedProviderId)?.name || normalizedProviderId;
};

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
    const { user: authUser } = useAuth();
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
    const [oauthPanelMsg, setOauthPanelMsg] = useState('');
    const [mlbbPlayerId, setMlbbPlayerId] = useState('');
    const [mlbbZoneId, setMlbbZoneId] = useState('');
    const [mlbbIgn, setMlbbIgn] = useState('');
    const [mlbbMsg, setMlbbMsg] = useState('');
    const [mlbbLoading, setMlbbLoading] = useState(false);
    const [mlbbValidating, setMlbbValidating] = useState(false);
    const [myCommunities, setMyCommunities] = useState([]);
    const [currentMetricIdx, setCurrentMetricIdx] = useState(0);
    const [metricDetailOpen, setMetricDetailOpen] = useState(false);
    const [teamPanel, setTeamPanel] = useState(null);
    const [teamPanelLoading, setTeamPanelLoading] = useState(false);

    /* ── Reloj ── */
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(t);
    }, []);

    /* ══════════════════════════════════════════════
       FETCH PROFILE  (DB — NO TOCAR)
       ══════════════════════════════════════════════ */
    const fetchProfile = useCallback(async () => {
        if (authUser?._id) {
            setUser(authUser);
        }
        try {
            const response = await axios.get(`${API_URL}/api/auth/profile`);
            setUser(response.data);
            return response.data;
        } catch (error) {
            const status = Number(error?.response?.status || 0);
            if ((status === 401 || status === 403) && !authUser?._id) {
                navigate('/login');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, [authUser, navigate]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

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
                /* silent — UI shows empty state */
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
                /* silent — UI shows empty state */
            }
        };
        fetchTournaments();
    }, []);

    /* ══════════════════════════════════════════════
       FETCH NOTIFICATIONS  (DB — REAL)
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchNotifs = async () => {
            if (!getAuthToken()) return;
            try {
                const res = await axios.get(`${API_URL}/api/notifications`);
                setNotifications(res.data || []);
            } catch (err) {
                /* silent — UI shows empty state */
            }
        };
        if (user) fetchNotifs();
    }, [user]);

    /* ══════════════════════════════════════════════
       FETCH COMMUNITIES
       ══════════════════════════════════════════════ */
    useEffect(() => {
        const fetchComms = async () => {
            if (!getAuthToken()) return;
            try {
                const communities = await fetchMyCommunities();
                setMyCommunities(Array.isArray(communities) ? communities : []);
            } catch (err) {
                /* silent — UI shows empty state */
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

    useEffect(() => {
        if (connectionPanel?.id !== 'moonton') return;
        setMlbbPlayerId(user?.connections?.mlbb?.playerId || '');
        setMlbbZoneId(user?.connections?.mlbb?.zoneId || '');
        setMlbbIgn(user?.connections?.mlbb?.ign || '');
        setMlbbMsg('');
    }, [
        connectionPanel?.id,
        user?.connections?.mlbb?.playerId,
        user?.connections?.mlbb?.zoneId,
        user?.connections?.mlbb?.ign
    ]);

    useEffect(() => {
        setOauthPanelMsg('');
    }, [connectionPanel?.id]);

    const scrollTeams = useCallback((dir) => {
        const track = teamsTrackRef.current;
        if (!track) return;
        track.scrollBy({ left: dir * 300, behavior: 'smooth' });
    }, []);

    const fetchTeamDetail = useCallback(async (teamId) => {
        if (!teamId) return null;
        const res = await axios.get(`${API_URL}/api/teams`);
        const teams = Array.isArray(res.data) ? res.data : [];
        return teams.find((team) => String(team._id) === String(teamId)) || null;
    }, []);

    const openTeamPanel = useCallback(async (team) => {
        if (!team?._id) return;
        setTeamPanel(team);
        setTeamPanelLoading(true);
        try {
            const freshTeam = await fetchTeamDetail(team._id);
            if (freshTeam) setTeamPanel(freshTeam);
        } catch (error) {
            /* silent */
        } finally {
            setTeamPanelLoading(false);
        }
    }, [fetchTeamDetail]);

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

    /* ── User's tournaments (registered via teams) ── */
    const myTournaments = useMemo(() => {
        if (!myTeams.length || !tournaments.length) return [];
        const teamIds = myTeams.map(t => String(t._id));
        return tournaments.filter(t => {
            const regs = Array.isArray(t.registrations) ? t.registrations : [];
            return regs.some(r => teamIds.includes(String(r.team?._id || r.team)));
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [myTeams, tournaments]);

    const upcomingMyTournaments = useMemo(() =>
        myTournaments.filter(t => ['open', 'ongoing'].includes(t.status)).slice(0, 4),
    [myTournaments]);

    /* ── Unread notifications ── */
    const unreadNotifications = useMemo(() =>
        notifications.filter(n => n.status === 'unread' || !n.status).slice(0, 5),
    [notifications]);

    const importantNotifications = useMemo(() =>
        notifications.filter(n =>
            ['tournament', 'team', 'admin', 'system'].includes(n.category) && (n.status === 'unread' || !n.status)
        ).slice(0, 4),
    [notifications]);

    /* ── Quick stats derived ── */
    const totalTourneysPlayed = useMemo(() =>
        myTournaments.length,
    [myTournaments]);

    const tourneysWon = useMemo(() =>
        myTournaments.filter(t => t.status === 'finished').length,
    [myTournaments]);

    const friendsCount = useMemo(() =>
        (user?.friends?.length || 0) + (user?.followers?.length || 0),
    [user?.friends?.length, user?.followers?.length]);

    const highestRank = useMemo(() => {
        const lolTier = user?.gameProfiles?.lol?.rank?.tier;
        const valTier = user?.gameProfiles?.valorant?.rank?.tier;
        const lolIdx = lolTier ? TIER_ORDER.indexOf(lolTier.toUpperCase()) : -1;
        const valIdx = valTier ? TIER_ORDER.indexOf(valTier.toUpperCase()) : -1;
        if (lolIdx >= valIdx && lolTier) return { tier: lolTier, game: 'LoL' };
        if (valTier) return { tier: valTier, game: 'Valorant' };
        return null;
    }, [user?.gameProfiles]);

    /* ── Connection status helper ── */
    const getProviderConnection = (providerId) => {
        if (providerId === 'moonton') return user?.connections?.mlbb || null;
        return user?.connections?.[providerId] || null;
    };

    const getMlbbVerificationStatus = () => normalizeMlbbVerificationStatus(
        user?.connections?.mlbb?.verificationStatus,
        user?.connections?.mlbb?.verified
    );

    const isConnected = (providerId) => {
        const provider = CONNECTION_PROVIDERS.find((item) => item.id === providerId);
        if (provider?.comingSoon) return false;
        if (providerId === 'moonton') {
            const status = getMlbbVerificationStatus();
            return Boolean(
                isMlbbVerifiedStatus(status, user?.connections?.mlbb?.verified)
                && user?.connections?.mlbb?.playerId
                && user?.connections?.mlbb?.zoneId
            );
        }
        return !!user?.connections?.[providerId]?.verified;
    };

    const connectedCount = CONNECTION_PROVIDERS.filter(p => isConnected(p.id)).length;

    const getProviderStatusLabel = (providerId) => {
        const provider = CONNECTION_PROVIDERS.find((item) => item.id === providerId);
        if (provider?.comingSoon) return 'Pendiente';
        if (providerId === 'moonton') {
            const status = getMlbbVerificationStatus();
            if (isMlbbVerifiedStatus(status, user?.connections?.mlbb?.verified)) return 'Vinculada';
            if (status === 'pending') return 'En revisión';
            if (status === 'rejected') return 'Rechazada';
            return 'No vinculada';
        }
        return isConnected(providerId) ? 'Vinculada' : 'No vinculada';
    };

    /* ── Get connected account display info ── */
    const getConnectionInfo = (provider) => {
        if (provider?.comingSoon) return null;
        const conn = getProviderConnection(provider.id);
        if (provider.id === 'moonton') {
            const status = getMlbbVerificationStatus();
            if (!isMlbbVerifiedStatus(status, user?.connections?.mlbb?.verified) || !conn?.playerId || !conn?.zoneId) return null;
            return {
                tag: `ID ${conn.playerId} (${conn.zoneId})`,
                stats: [
                    { label: 'Estado', val: 'Verificada' },
                    { label: 'IGN', val: conn.ign || 'Sin IGN' }
                ]
            };
        }
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

    const validateMlbbDraft = useCallback(async () => {
        if (!getAuthToken()) {
            setMlbbMsg('Debes iniciar sesión nuevamente.');
            return;
        }
        if (!mlbbPlayerId.trim() || !mlbbZoneId.trim()) {
            setMlbbMsg('Debes completar User ID y Zone ID.');
            return;
        }
        try {
            setMlbbValidating(true);
            setMlbbMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/mlbb/validate`,
                {
                    playerId: mlbbPlayerId.trim(),
                    zoneId: mlbbZoneId.trim(),
                    ign: mlbbIgn.trim()
                }
            );
            setMlbbMsg(res.data?.message || 'MLBB ID válido.');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo validar la cuenta MLBB.');
        } finally {
            setMlbbValidating(false);
        }
    }, [mlbbIgn, mlbbPlayerId, mlbbZoneId]);

    const linkMlbb = useCallback(async () => {
        if (!getAuthToken()) {
            setMlbbMsg('Debes iniciar sesión nuevamente.');
            return;
        }
        if (!mlbbPlayerId.trim() || !mlbbZoneId.trim()) {
            setMlbbMsg('Debes completar User ID y Zone ID.');
            return;
        }
        try {
            setMlbbLoading(true);
            setMlbbMsg('');
            const res = await axios.post(
                `${API_URL}/api/auth/mlbb/link`,
                {
                    playerId: mlbbPlayerId.trim(),
                    zoneId: mlbbZoneId.trim(),
                    ign: mlbbIgn.trim()
                }
            );
            await fetchProfile();
            setMlbbMsg(res?.data?.message || 'Cuenta MLBB actualizada correctamente.');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo vincular la cuenta MLBB.');
        } finally {
            setMlbbLoading(false);
        }
    }, [fetchProfile, mlbbIgn, mlbbPlayerId, mlbbZoneId]);

    const unlinkMlbb = useCallback(async () => {
        if (!getAuthToken()) {
            setMlbbMsg('Debes iniciar sesión nuevamente.');
            return;
        }
        try {
            setMlbbLoading(true);
            setMlbbMsg('');
            await axios.delete(`${API_URL}/api/auth/mlbb`);
            await fetchProfile();
            setMlbbMsg('Cuenta MLBB desvinculada.');
        } catch (error) {
            setMlbbMsg(error.response?.data?.message || 'No se pudo desvincular la cuenta MLBB.');
        } finally {
            setMlbbLoading(false);
        }
    }, [fetchProfile]);

    /* ── Metric cards data (5 unique metrics with different chart types) ── */
    const metricsData = useMemo(() => {
        const totalTourneys = tournaments.length;
        const finishedTourneys = tournaments.filter(t => t.status === 'finished').length;
        const winRate = totalTourneys > 0 ? Math.round((finishedTourneys / totalTourneys) * 100) : 0;

        const captainTeams = myTeams.filter(t => String(t.captain?._id || t.captain) === String(user?._id)).length;
        const leadershipScore = Math.min(100, captainTeams * 25 + (myTeams.length * 10));

        const connCount = CONNECTION_PROVIDERS.filter(p => !!user?.connections?.[p.id]?.verified).length;
        const networkScore = Math.min(100, connCount * 15 + myCommunities.length * 10 + myTeams.length * 10);

        const consistencyScore = Math.min(100, Math.round((accountAgeDays / 365) * 40) + (enrichedGames.length * 8) + (myTeams.length * 10));

        const versatilityCategories = {};
        enrichedGames.forEach(g => {
            if (g.category) versatilityCategories[g.category] = (versatilityCategories[g.category] || 0) + 1;
        });
        const versatilityScore = Math.min(100, Object.keys(versatilityCategories).length * 20 + enrichedGames.length * 5);

        const mainGame = enrichedGames[0]?.name || 'tu juego principal';

        /* Category breakdown for versatility */
        const catKeys = Object.keys(versatilityCategories);
        const catValues = Object.values(versatilityCategories);

        /* ── Dynamic tips: always exactly 5 per metric ── */
        const ensure5 = (arr) => arr.slice(0, 5);

        const wrTips = [];
        const wrPlan = [];
        if (totalTourneys === 0) {
            wrTips.push('Inscríbete en tu primer torneo — la experiencia es el mejor maestro');
            wrTips.push(`Busca torneos de ${mainGame} con nivel principiante o abierto`);
            wrTips.push('Forma o únete a un equipo antes de competir, la coordinación marca la diferencia');
            wrTips.push('Mira streams o VODs de torneos para entender el formato y ritmo competitivo');
            wrTips.push('Configura tu perfil competitivo: avatar, bio, juegos y cuentas vinculadas');
            wrPlan.push(`Esta semana: Explora los torneos disponibles de ${mainGame} y elige uno acorde a tu nivel.`);
            wrPlan.push('Siguiente paso: Reúne un equipo o únete a uno que busque miembros.');
        } else if (winRate < 30) {
            wrTips.push('Analiza tus derrotas recientes — ¿fueron por estrategia, mecánica o comunicación?');
            wrTips.push(`Practica mecánicas específicas de ${mainGame} en modo personalizado`);
            wrTips.push('Revisa guías y VODs de jugadores top en tu rol');
            wrTips.push('No te inscribas en muchos torneos a la vez — enfócate en mejorar entre cada uno');
            wrTips.push('Graba tus partidas y revísalas con tu equipo para identificar errores en conjunto');
            wrPlan.push(`Semana 1-2: Dedica 1h diaria a practicar mecánicas en ${mainGame}.`);
            wrPlan.push('Semana 3: Analiza repeticiones de tus 3 últimas derrotas.');
            wrPlan.push('Mes 2: Inscríbete en 1 torneo aplicando lo aprendido.');
        } else if (winRate < 60) {
            wrTips.push('Estás en buen camino — mantén la consistencia en tu entrenamiento');
            wrTips.push('Identifica el 1 error más frecuente en tus últimas partidas y corrígelo');
            wrTips.push(`Domina 2-3 composiciones/agentes/campeones meta en ${mainGame}`);
            wrTips.push('Comunica mejor con tu equipo: las calls claras ganan rondas');
            wrTips.push('Estudia a los equipos rivales antes de cada torneo — la preparación marca la diferencia');
            wrPlan.push(`Semana 1: Perfecciona tu main pick y aprende 1 counter-pick en ${mainGame}.`);
            wrPlan.push('Semana 2-3: Scrimea con tu equipo al menos 3 veces.');
            wrPlan.push('Meta: Subir tu win rate 10% en los próximos 2 torneos.');
        } else {
            wrTips.push('Excelente rendimiento — ahora apunta a torneos de mayor nivel');
            wrTips.push('Comparte tu conocimiento: mentorear a otros refuerza tus propios fundamentos');
            wrTips.push('Mantén tu roster estable — la sinergia de equipo es tu ventaja competitiva');
            wrTips.push('Analiza las tendencias del meta y adapta tus estrategias antes que los rivales');
            wrTips.push('Documenta tus estrategias ganadoras para replicarlas en futuros torneos');
            wrPlan.push('Busca torneos con mayor prize pool o nivel competitivo.');
            wrPlan.push('Considera postularte como capitán o coach para maximizar tu impacto.');
        }

        const ldTips = [];
        if (captainTeams === 0 && myTeams.length === 0) {
            ldTips.push('Crea tu primer equipo — ser capitán es la base del liderazgo');
            ldTips.push(`Recluta 4 jugadores activos de ${mainGame}`);
            ldTips.push('Define un nombre, slogan y reglas claras para tu equipo');
            ldTips.push('Establece un horario de prácticas semanal desde el inicio');
            ldTips.push('Busca jugadores en comunidades y torneos — los mejores compañeros se encuentran compitiendo');
        } else if (captainTeams === 0) {
            ldTips.push('Ya eres parte de un equipo — propón ideas de estrategia para destacar');
            ldTips.push('Considera crear tu propio equipo en otro juego para diversificar');
            ldTips.push('Ayuda a tu capitán con la coordinación de prácticas');
            ldTips.push('Toma iniciativa en las sesiones de entrenamiento — lidera con el ejemplo');
            ldTips.push('Propón revisiones post-torneo para que el equipo mejore en conjunto');
        } else {
            ldTips.push(`Lidera ${captainTeams} equipo${captainTeams > 1 ? 's' : ''} — organiza sesiones semanales de práctica`);
            ldTips.push('Rota roles en entrenamientos para entender todas las posiciones');
            ldTips.push('Inscribe a tu equipo en el próximo torneo disponible');
            ldTips.push('Da feedback constructivo a cada miembro después de cada partida');
            ldTips.push(leadershipScore < 60 ? 'Completa tu roster — un equipo lleno rinde mejor' : 'Mantén la moral del equipo alta — celebra las victorias y aprende de las derrotas');
        }

        const nwTips = [];
        if (connCount < 2) {
            nwTips.push('Vincula Discord y Riot/MLBB — son esenciales para competir');
            nwTips.push('Ve a Ajustes y conecta al menos 2 plataformas');
            nwTips.push(`Únete a una comunidad de ${mainGame} para encontrar compañeros`);
            nwTips.push('Agrega amigos después de cada torneo — expande tu red de contactos');
            nwTips.push('Comparte tu perfil de GLITCH GANG en tus redes sociales');
        } else {
            nwTips.push(`${connCount} cuentas vinculadas — mantén tus perfiles actualizados`);
            nwTips.push(myCommunities.length === 0 ? `Únete a una comunidad de ${mainGame}` : `Activo en ${myCommunities.length} comunidad${myCommunities.length > 1 ? 'es' : ''} — participa en las discusiones`);
            nwTips.push('Agrega amigos después de cada torneo — expande tu red de contactos');
            nwTips.push('Participa en eventos y discusiones de la comunidad para ganar visibilidad');
            nwTips.push('Conecta todas tus cuentas de juego para que otros jugadores te encuentren fácilmente');
        }

        const csTips = [];
        if (accountAgeDays < 7) {
            csTips.push('Acabas de llegar — completa tu perfil y explora la plataforma');
            csTips.push('Añade tus juegos favoritos y configura tu avatar');
            csTips.push('Explora las comunidades y únete a las de tus juegos');
            csTips.push('Vincula al menos una cuenta de juego para empezar');
            csTips.push('Revisa los torneos disponibles y marca los que te interesen');
        } else if (accountAgeDays < 30) {
            csTips.push(`${accountAgeDays} días en la plataforma — buen ritmo, sigue activo`);
            csTips.push('Inscríbete en tu primer torneo para ganar experiencia');
            csTips.push(enrichedGames.length < 3 ? 'Añade más juegos a tu perfil para demostrar versatilidad' : 'Buen catálogo de juegos — mantén tu perfil actualizado');
            csTips.push(myTeams.length === 0 ? 'Únete a un equipo para aumentar tu actividad' : `Mantén actividad con tus ${myTeams.length} equipo${myTeams.length > 1 ? 's' : ''}`);
            csTips.push('Revisa tu dashboard semanalmente para trackear tu progreso');
        } else {
            csTips.push(`Veterano de ${Math.floor(accountAgeDays / 30)} mes${Math.floor(accountAgeDays / 30) > 1 ? 'es' : ''} — tu constancia es tu fortaleza`);
            csTips.push(enrichedGames.length < 3 ? 'Añade más juegos a tu perfil para demostrar versatilidad' : `${enrichedGames.length} juegos activos — perfil sólido`);
            csTips.push(myTeams.length === 0 ? 'Únete a un equipo para aumentar tu actividad' : `Mantén actividad con tus ${myTeams.length} equipo${myTeams.length > 1 ? 's' : ''}`);
            csTips.push('Participa en al menos 1 torneo al mes para mantener tu ritmo competitivo');
            csTips.push('Actualiza tu bio y avatar periódicamente — un perfil fresco genera más conexiones');
        }

        const vsTips = [];
        if (catKeys.length <= 1) {
            vsTips.push('Solo juegas 1 género — explora otros para ser más versátil');
            vsTips.push('Prueba un juego de estrategia si solo juegas FPS, o viceversa');
            vsTips.push(`Tienes ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} — ${enrichedGames.length < 5 ? 'añade más para mejorar' : 'buena colección'}`);
            vsTips.push('Las habilidades de un género mejoran tu rendimiento en otros');
            vsTips.push('Participa en torneos de juegos que no domines — aprenderás más rápido bajo presión');
        } else if (catKeys.length < 3) {
            vsTips.push(`${catKeys.length} géneros — buen inicio, agrega 1 más para subir tu score`);
            vsTips.push('Las habilidades de un género se transfieren a otros');
            vsTips.push(`Tienes ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} — ${enrichedGames.length < 5 ? 'añade más para mejorar' : 'buena colección'}`);
            vsTips.push('Inscríbete en un torneo de un juego que no sea tu principal');
            vsTips.push('Mira tutoriales de géneros nuevos — las bases se aprenden rápido');
        } else {
            vsTips.push(`${catKeys.length} géneros dominados — perfil de jugador completo`);
            vsTips.push('Participa en torneos de diferentes juegos para demostrar tu versatilidad');
            vsTips.push(`Tienes ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} — buena colección`);
            vsTips.push('Comparte tips entre géneros con tu equipo — la adaptabilidad es tu ventaja');
            vsTips.push('Mantén actualizada tu colección y prueba los lanzamientos nuevos');
        }

        return [
            {
                id: 'winrate',
                icon: 'bx bx-trophy',
                label: 'WIN RATE',
                subtitle: totalTourneys === 0 ? 'Aún no has competido en torneos' : `${finishedTourneys} de ${totalTourneys} torneos completados`,
                value: `${winRate}%`,
                numericValue: winRate,
                color: '#ffd700',
                chartType: 'radialBar',
                definition: totalTourneys === 0
                    ? 'Cuando participes en torneos, aquí verás tu porcentaje de éxito. ¡Inscríbete en uno para empezar!'
                    : `Tu Win Rate actual es ${winRate}%. Has completado ${finishedTourneys} de ${totalTourneys} torneo${totalTourneys > 1 ? 's' : ''}.`,
                tips: wrTips,
                plan: wrPlan.join(' ')
            },
            {
                id: 'leadership',
                icon: 'bx bx-crown',
                label: 'LIDERAZGO',
                subtitle: captainTeams > 0 ? `Capitán de ${captainTeams} equipo${captainTeams > 1 ? 's' : ''}` : 'Capacidad de liderazgo',
                value: `${leadershipScore}`,
                numericValue: leadershipScore,
                color: '#a78bfa',
                chartType: 'donut',
                chartSeries: [Math.max(1, captainTeams * 25), Math.max(1, myTeams.length * 10), Math.max(1, 100 - leadershipScore)],
                chartLabels: ['Capitán', 'Equipos', 'Potencial'],
                definition: captainTeams > 0
                    ? `Lideras ${captainTeams} equipo${captainTeams > 1 ? 's' : ''} como capitán y participas en ${myTeams.length} equipo${myTeams.length > 1 ? 's' : ''} en total.`
                    : myTeams.length > 0
                        ? `Eres miembro de ${myTeams.length} equipo${myTeams.length > 1 ? 's' : ''}. Crea tu propio equipo para subir tu liderazgo.`
                        : 'No tienes equipos aún. Crear o unirte a un equipo es el primer paso hacia el liderazgo.',
                tips: ldTips,
                plan: captainTeams === 0
                    ? `Paso 1: Crea un equipo de ${mainGame}. Paso 2: Recluta miembros activos. Paso 3: Inscríbete en un torneo como capitán.`
                    : `Mantén prácticas semanales con tu equipo. Inscríbete en el próximo torneo de ${mainGame}. Evalúa el rendimiento de tu roster tras cada competencia.`
            },
            {
                id: 'network',
                icon: 'bx bx-network-chart',
                label: 'RED SOCIAL',
                subtitle: `${connCount} cuentas · ${myCommunities.length} comunidades · ${myTeams.length} equipos`,
                value: `${networkScore}`,
                numericValue: networkScore,
                color: '#00d2ff',
                chartType: 'stackedBars',
                chartSeries: [
                    { name: 'Conexiones', data: [Math.max(1, connCount), Math.max(1, Math.ceil(connCount * 0.7)), Math.max(1, Math.ceil(connCount * 0.85)), Math.max(1, Math.ceil(connCount * 0.6)), Math.max(1, Math.ceil(connCount * 0.9)), Math.max(1, Math.ceil(connCount * 0.75)), Math.max(1, connCount)] },
                    { name: 'Comunidades', data: [Math.max(1, myCommunities.length), Math.max(1, Math.ceil(myCommunities.length * 0.8)), Math.max(1, Math.ceil(myCommunities.length * 1.1)), Math.max(1, Math.ceil(myCommunities.length * 0.7)), Math.max(1, myCommunities.length), Math.max(1, Math.ceil(myCommunities.length * 0.9)), Math.max(1, Math.ceil(myCommunities.length * 0.8))] },
                    { name: 'Equipos', data: [Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.7)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.6)), Math.max(1, Math.ceil(myTeams.length * 0.9)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.8))] }
                ],
                chartAxis: ['01', '02', '03', '04', '05', '06', '07'],
                chartLabels: ['Conexiones', 'Comunidades', 'Equipos'],
                definition: `Tu red: ${connCount} cuentas vinculadas, ${myCommunities.length} comunidades activas y ${myTeams.length} equipos. ${networkScore >= 70 ? 'Excelente presencia en el ecosistema.' : 'Hay espacio para crecer.'}`,
                tips: nwTips,
                plan: networkScore < 40
                    ? `Prioridad: Vincula tus cuentas de juego en Ajustes. Luego únete a 1-2 comunidades de ${mainGame}.`
                    : networkScore < 70
                        ? `Buen progreso. Participa más en las comunidades y agrega compañeros de torneo como amigos.`
                        : 'Red sólida. Mantén tu actividad en comunidades y expande contactos en cada torneo.'
            },
            {
                id: 'consistency',
                icon: 'bx bx-line-chart',
                label: 'CONSISTENCIA',
                subtitle: `${accountAgeDays} días en la plataforma`,
                value: `${consistencyScore}`,
                numericValue: consistencyScore,
                color: '#8EDB15',
                chartType: 'stackedBars',
                chartSeries: [
                    { name: 'Antigüedad', data: [Math.max(1, Math.ceil(accountAgeDays / 30)), Math.max(1, Math.ceil(accountAgeDays / 45)), Math.max(1, Math.ceil(accountAgeDays / 25)), Math.max(1, Math.ceil(accountAgeDays / 40)), Math.max(1, Math.ceil(accountAgeDays / 28)), Math.max(1, Math.ceil(accountAgeDays / 35)), Math.max(1, Math.ceil(accountAgeDays / 30))] },
                    { name: 'Juegos activos', data: [Math.max(1, enrichedGames.length), Math.max(1, Math.ceil(enrichedGames.length * 0.8)), Math.max(1, Math.ceil(enrichedGames.length * 1.2)), Math.max(1, enrichedGames.length), Math.max(1, Math.ceil(enrichedGames.length * 0.9)), Math.max(1, Math.ceil(enrichedGames.length * 1.1)), Math.max(1, enrichedGames.length)] },
                    { name: 'Equipos', data: [Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.8)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.7)), Math.max(1, Math.ceil(myTeams.length * 1.1)), Math.max(1, myTeams.length), Math.max(1, Math.ceil(myTeams.length * 0.9))] }
                ],
                chartAxis: ['01', '02', '03', '04', '05', '06', '07'],
                chartLabels: ['Antigüedad', 'Juegos activos', 'Equipos'],
                definition: `Llevas ${accountAgeDays} días en GLITCH GANG con ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} activo${enrichedGames.length !== 1 ? 's' : ''} y ${myTeams.length} equipo${myTeams.length !== 1 ? 's' : ''}.`,
                tips: csTips,
                plan: consistencyScore < 40
                    ? `Esta semana: Completa tu perfil al 100%. Añade tus juegos y únete a un equipo de ${mainGame}.`
                    : `Mantén tu actividad. Participa en 1 torneo al mes y actualiza tu perfil regularmente.`
            },
            {
                id: 'versatility',
                icon: 'bx bx-category-alt',
                label: 'VERSATILIDAD',
                subtitle: `${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} · ${catKeys.length} género${catKeys.length !== 1 ? 's' : ''}`,
                value: `${versatilityScore}`,
                numericValue: versatilityScore,
                color: '#f97316',
                chartType: 'donutMulti',
                chartSeries: catValues.length > 0
                    ? catValues
                    : [enrichedGames.length || 1, 1, 1],
                chartLabels: catKeys.length > 0
                    ? catKeys
                    : ['Tu género', 'Otros', 'Por explorar'],
                definition: `Tu colección tiene ${enrichedGames.length} juego${enrichedGames.length !== 1 ? 's' : ''} en ${catKeys.length} género${catKeys.length !== 1 ? 's' : ''} diferente${catKeys.length !== 1 ? 's' : ''}. ${versatilityScore >= 60 ? 'Perfil versátil.' : 'Explora nuevos géneros.'}`,
                tips: vsTips,
                plan: versatilityScore < 30
                    ? `Paso 1: Añade al menos 3 juegos de diferentes géneros. Paso 2: Prueba un juego nuevo esta semana.`
                    : versatilityScore < 60
                        ? `Añade 1 juego de un género que no tengas. Participa en un torneo diferente a ${mainGame}.`
                        : `Perfil versátil. Mantén tu colección actualizada y compite en múltiples juegos.`
            }
        ];
    }, [tournaments, myTeams, user, myCommunities, accountAgeDays, enrichedGames]);

    /* ── Team roster helper ── */
    const getTeamRoster = (team) => {
        if (!team) return [];
        const members = [];
        const starters = Array.isArray(team.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team.roster?.subs) ? team.roster.subs : [];
        const coach = team.roster?.coach;
        const isFilled = (p) => p && (p.user || p.nickname || p.gameId || p.email || p.role || p.photo);
        starters.filter(isFilled).forEach((p, idx) => members.push({ ...p, section: 'Titular', slot: idx + 1 }));
        subs.filter(isFilled).forEach((p, idx) => members.push({ ...p, section: 'Suplente', slot: idx + 1 }));
        if (isFilled(coach)) members.push({ ...coach, section: 'Coach', slot: 1 });
        return members;
    };

    const getFilledMemberCount = (team) => getTeamRoster(team).length;
    const getTeamCode = (team) => team?.teamCode ? `TEAM-${team.teamCode}` : (team?.inviteCode || team?._id?.slice(-6) || '—');

    const renderMlbbConnectionPanel = () => {
        const mlbbConn = user?.connections?.mlbb || {};
        const mlbbStatus = getMlbbVerificationStatus();
        const mlbbLinked = isConnected('moonton');

        if (mlbbLinked) {
            return (
                <div className="db__conn-panel-linked">
                    <div className="db__conn-panel-avatar" style={{ color: connectionPanel.color, borderColor: connectionPanel.color }}>
                        {renderConnectionIcon(connectionPanel)}
                        <span className="db__conn-panel-badge"><FaCheck /></span>
                    </div>
                    <p className="db__conn-panel-gamertag" style={{ color: connectionPanel.color }}>
                        ID {mlbbConn.playerId} ({mlbbConn.zoneId})
                    </p>
                    <p className="db__conn-panel-sub">Cuenta MLBB verificada en GLITCH GANG</p>
                    <div className="db__conn-panel-stats">
                        <div className="db__conn-panel-stat">
                            <span className="db__conn-panel-stat-val">{mlbbConn.ign || 'Sin IGN'}</span>
                            <span className="db__conn-panel-stat-lbl">IGN</span>
                        </div>
                        <div className="db__conn-panel-stat">
                            <span className="db__conn-panel-stat-val">Verificada</span>
                            <span className="db__conn-panel-stat-lbl">Estado</span>
                        </div>
                    </div>
                    {mlbbMsg && <p className="db__conn-panel-msg">{mlbbMsg}</p>}
                    <div className="db__conn-panel-actions">
                        <button className="db__btn db__btn--outline" onClick={() => navigate('/settings')}>
                            <i className="bx bx-cog"></i> Configurar
                        </button>
                        <button className="db__btn db__btn--danger-ghost" onClick={unlinkMlbb} disabled={mlbbLoading}>
                            <i className="bx bx-unlink"></i> {mlbbLoading ? 'Procesando...' : 'Desvincular'}
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div className="db__conn-panel-linked">
                <div className={`db__conn-panel-status ${mlbbStatus === 'rejected' ? 'db__conn-panel-status--error' : 'db__conn-panel-status--pending'}`}>
                    <i className={mlbbStatus === 'pending' ? 'bx bx-time-five' : mlbbStatus === 'rejected' ? 'bx bx-error-circle' : 'bx bx-link-external'}></i>
                    <span>{getProviderStatusLabel('moonton')}</span>
                    <p className="db__conn-panel-desc">Verificación interna de GLITCH GANG. No es una validación oficial de Moonton/API pública de MLBB.</p>
                    {mlbbStatus === 'pending' && (
                        <p className="db__conn-panel-detail">Tu solicitud está en revisión.</p>
                    )}
                    {mlbbStatus === 'rejected' && (
                        <p className="db__conn-panel-detail">{mlbbConn.rejectReason || 'La solicitud fue rechazada. Corrige los datos y vuelve a enviar.'}</p>
                    )}
                </div>

                <div className="db__conn-panel-form">
                    <label className="db__conn-panel-field">
                        <span>User ID</span>
                        <input
                            type="text"
                            value={mlbbPlayerId}
                            onChange={(e) => setMlbbPlayerId(e.target.value)}
                            disabled={mlbbLoading || mlbbValidating}
                            placeholder="Ej: 853455730"
                        />
                    </label>
                    <label className="db__conn-panel-field">
                        <span>Zone ID</span>
                        <input
                            type="text"
                            value={mlbbZoneId}
                            onChange={(e) => setMlbbZoneId(e.target.value)}
                            disabled={mlbbLoading || mlbbValidating}
                            placeholder="Ej: 5280"
                        />
                    </label>
                    <label className="db__conn-panel-field">
                        <span>IGN (opcional)</span>
                        <input
                            type="text"
                            value={mlbbIgn}
                            onChange={(e) => setMlbbIgn(e.target.value)}
                            disabled={mlbbLoading || mlbbValidating}
                            placeholder="Tu nombre dentro del juego"
                        />
                    </label>
                    {mlbbMsg && <p className="db__conn-panel-msg">{mlbbMsg}</p>}
                </div>

                <div className="db__conn-panel-actions">
                    <button className="db__btn db__btn--outline" onClick={validateMlbbDraft} disabled={mlbbLoading || mlbbValidating}>
                        <i className="bx bx-check-shield"></i> {mlbbValidating ? 'Validando...' : 'Validar ID'}
                    </button>
                    <button className="db__btn db__btn--primary" onClick={linkMlbb} disabled={mlbbLoading || mlbbValidating}>
                        <i className="bx bx-link-alt"></i> {mlbbLoading ? 'Conectando...' : 'Conectar'}
                    </button>
                </div>

                {(mlbbStatus === 'pending' || mlbbStatus === 'rejected') && (
                    <div className="db__conn-panel-actions">
                        <button className="db__btn db__btn--danger-ghost" onClick={unlinkMlbb} disabled={mlbbLoading}>
                            <i className="bx bx-x-circle"></i> {mlbbLoading ? 'Procesando...' : mlbbStatus === 'pending' ? 'Cancelar solicitud' : 'Limpiar y volver a intentar'}
                        </button>
                    </div>
                )}
            </div>
        );
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
            {!['library', 'account'].includes(activeSection) && (
                <div className="db__sponsor-wrap">
                    <SponsorMotion />
                </div>
            )}

            {/* ═══════ CONNECTION PANEL (slide right) ═══════ */}
            <AnimatePresence>
                {connectionPanel && (
                    <>
                        <motion.div className="db__panel-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConnectionPanel(null)} />
                        <motion.aside className="db__conn-panel" variants={slideRight} initial="hidden" animate="visible" exit="exit">
                            <div className="db__conn-panel-header">
                                <div className="db__conn-panel-title">
                                    <span
                                        className="db__conn-panel-title-icon"
                                        style={{ color: connectionPanel.color }}
                                    >
                                        {renderConnectionIcon(connectionPanel)}
                                    </span>
                                    <h3>{connectionPanel.name}</h3>
                                </div>
                                <button onClick={() => setConnectionPanel(null)}><i className="bx bx-x"></i></button>
                            </div>
                            <div className="db__conn-panel-body">
                                {(() => {
                                    if (connectionPanel.id === 'moonton') {
                                        return renderMlbbConnectionPanel();
                                    }

                                    if (connectionPanel.comingSoon) {
                                        return (
                                            <div className="db__conn-panel-status db__conn-panel-status--pending">
                                                <i className="bx bx-time-five"></i>
                                                <span>Próximamente</span>
                                                <p className="db__conn-panel-desc">
                                                    La integración con {connectionPanel.name} está pausada por ahora. La retomaremos cuando esté lista para producción.
                                                </p>
                                                <button className="db__btn db__btn--ghost" disabled>
                                                    Próximamente
                                                </button>
                                            </div>
                                        );
                                    }

                                    const info = getConnectionInfo(connectionPanel);
                                    if (info) {
                                        /* ── Connected: rich account view ── */
                                        return (
                                            <div className="db__conn-panel-linked">
                                                <div className="db__conn-panel-avatar" style={{ color: connectionPanel.color, borderColor: connectionPanel.color }}>
                                                    {renderConnectionIcon(connectionPanel)}
                                                    <span className="db__conn-panel-badge"><FaCheck /></span>
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
                                                </div>
                                                {oauthPanelMsg ? <p className="db__conn-panel-msg">{oauthPanelMsg}</p> : null}
                                            </div>
                                        );
                                    } else {
                                        /* ── Not connected: CTA + preview mockup ── */
                                        return (
                                            <>
                                                <div className="db__conn-panel-status db__conn-panel-status--pending">
                                                    <i className="bx bx-link-external"></i>
                                                    <span>No vinculada</span>
                                                    <p className="db__conn-panel-desc">Vincula tu cuenta de {connectionPanel.name} para acceder a estadísticas y funciones exclusivas.</p>
                                                    <button
                                                        className="db__btn db__btn--primary"
                                                        onClick={() => navigate('/settings')}
                                                    >
                                                        <i className="bx bx-link-alt"></i> Vincular ahora
                                                    </button>
                                                    {oauthPanelMsg ? <p className="db__conn-panel-msg">{oauthPanelMsg}</p> : null}
                                                </div>
                                                {/* Preview mockup of what it looks like linked */}
                                                <div className="db__conn-panel-preview">
                                                    <div className="db__conn-panel-avatar" style={{ color: connectionPanel.color, borderColor: connectionPanel.color }}>
                                                        {renderConnectionIcon(connectionPanel)}
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
                                    {teamPanel.logo ? (
                                        <img
                                            src={resolveMediaUrl(teamPanel.logo)}
                                            alt={teamPanel.name}
                                            onError={(e) => applyImageFallback(e, getTeamFallback(teamPanel.name))}
                                        />
                                    ) : <i className="bx bx-group"></i>}
                                </div>
                                <div className="db__tp-header-info">
                                    <strong>{teamPanel.name}</strong>
                                    <span>{teamPanel.game || 'Sin juego'} • {getTeamCode(teamPanel)}</span>
                                </div>
                                <button className="db__team-panel-header-close" onClick={() => setTeamPanel(null)}><i className="bx bx-x"></i></button>
                            </div>
                            <div className="db__team-panel-body">
                                <span className="db__tp-role-badge"><i className="bx bx-shield-quarter"></i> {resolveTeamRole(teamPanel)}</span>
                                {teamPanel.slogan && <p className="db__tp-slogan">{teamPanel.slogan}</p>}

                                <div className="db__tp-info-grid">
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Miembros</span>
                                        <span className="db__tp-info-item-val">{getFilledMemberCount(teamPanel)}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Titulares</span>
                                        <span className="db__tp-info-item-val">{Array.isArray(teamPanel.roster?.starters) ? teamPanel.roster.starters.filter((p) => p && (p.user || p.nickname || p.gameId || p.email || p.role)).length : 0}/{teamPanel.maxMembers || '—'}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Suplentes</span>
                                        <span className="db__tp-info-item-val">{Array.isArray(teamPanel.roster?.subs) ? teamPanel.roster.subs.filter((p) => p && (p.user || p.nickname || p.gameId || p.email || p.role)).length : 0}/{teamPanel.maxSubstitutes ?? 0}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">País</span>
                                        <span className="db__tp-info-item-val">{teamPanel.teamCountry || '—'}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Nivel</span>
                                        <span className="db__tp-info-item-val">{teamPanel.teamLevel || '—'}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Idioma</span>
                                        <span className="db__tp-info-item-val">{teamPanel.teamLanguage || '—'}</span>
                                    </div>
                                    <div className="db__tp-info-item">
                                        <span className="db__tp-info-item-lbl">Creado</span>
                                        <span className="db__tp-info-item-val">{teamPanel.createdAt ? new Date(teamPanel.createdAt).toLocaleDateString('es', { month: 'short', year: 'numeric' }) : '—'}</span>
                                    </div>
                                </div>

                                <div className="db__tp-captain-card">
                                    <div className="db__tp-captain-avatar">
                                        {teamPanel.captain?.avatar ? (
                                            <img
                                                src={resolveMediaUrl(teamPanel.captain.avatar)}
                                                alt={teamPanel.captain.fullName || 'Capitán'}
                                                onError={(e) => applyImageFallback(e, getAvatarFallback(teamPanel.captain.fullName || teamPanel.name))}
                                            />
                                        ) : <i className="bx bx-crown"></i>}
                                    </div>
                                    <div className="db__tp-captain-info">
                                        <span className="db__tp-captain-label">Capitán</span>
                                        <strong>{teamPanel.captain?.fullName || 'No definido'}</strong>
                                        <span>{teamPanel.category || 'Sin categoría'} • {teamPanel.teamGender || 'Mixto'}</span>
                                    </div>
                                </div>

                                <p className="db__tp-roster-title">Roster</p>
                                {teamPanelLoading ? (
                                    <div className="db__tp-loading">
                                        <div className="db-loading__pulse"></div>
                                        <span>Actualizando info del equipo...</span>
                                    </div>
                                ) : (
                                    <div className="db__tp-roster-list">
                                        {getTeamRoster(teamPanel).map((member, idx) => (
                                            <div key={`${member.section}-${member.slot}-${idx}`} className="db__tp-member">
                                                <div className="db__tp-member-avatar">
                                                    {member.photo ? (
                                                        <img
                                                            src={resolveMediaUrl(member.photo)}
                                                            alt={member.nickname || 'Jugador'}
                                                            onError={(e) => applyImageFallback(e, getAvatarFallback(member.nickname || member.role || member.section))}
                                                        />
                                                    ) : <i className="bx bx-user"></i>}
                                                </div>
                                                <div className="db__tp-member-info">
                                                    <strong>{member.nickname || member.email || 'Jugador'}</strong>
                                                    <span>{member.role || member.section}{member.gameId ? ` • ${member.gameId}` : ''}{member.region ? ` • ${member.region}` : ''}</span>
                                                </div>
                                                <span className="db__tp-member-role">{member.section}</span>
                                            </div>
                                        ))}
                                        {getTeamRoster(teamPanel).length === 0 && (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '.82rem', textAlign: 'center', padding: '16px 0' }}>Sin miembros registrados</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="db__team-panel-footer">
                                <button
                                    className="db__btn db__btn--primary"
                                    onClick={() => navigate('/equipos', {
                                        state: {
                                            teamId: teamPanel._id,
                                            openManage: true
                                        }
                                    })}
                                >
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
                        <AvatarCircle src={resolveMediaUrl(user.avatar) || `https://ui-avatars.com/api/?name=${user.username}`} frameConfig={currentFrame} size="150px" status={user.status} />
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
                SECTION 2 — RESUMEN RÁPIDO
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--stats" data-section="stats" ref={el => sectionRefs.current.stats = el}>
                <motion.div className="db__stats-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__stats-header" variants={fadeChild}>
                        <p className="db__stats-kicker">Resumen</p>
                        <h2 className="db__stats-title">Tu Progreso</h2>
                    </motion.div>

                    {/* Quick stat cards */}
                    <motion.div className="db__stats-grid" variants={stagger}>
                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#8EDB15' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-user-check"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={profileCompletion} />%</span>
                                <span className="db__stat-card-lbl">Perfil completo</span>
                            </div>
                            <div className="db__stat-card-bar"><div className="db__stat-card-fill" style={{ width: `${profileCompletion}%` }}></div></div>
                        </motion.div>

                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#ffd700' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-trophy"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={totalTourneysPlayed} /></span>
                                <span className="db__stat-card-lbl">Torneos jugados</span>
                            </div>
                            {totalTourneysPlayed > 0 && <span className="db__stat-card-sub">{tourneysWon} completado{tourneysWon !== 1 ? 's' : ''}</span>}
                        </motion.div>

                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#a78bfa' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-group"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={myTeams.length} /></span>
                                <span className="db__stat-card-lbl">Equipos</span>
                            </div>
                            {pendingRequests.length > 0 && <span className="db__stat-card-sub db__stat-card-sub--alert">{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''}</span>}
                        </motion.div>

                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#00d2ff' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-link-alt"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={connectedCount} />/{CONNECTION_PROVIDERS.length}</span>
                                <span className="db__stat-card-lbl">Cuentas vinculadas</span>
                            </div>
                        </motion.div>

                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#f97316' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-buildings"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={myCommunities.length} /></span>
                                <span className="db__stat-card-lbl">Comunidades</span>
                            </div>
                        </motion.div>

                        <motion.div className="db__stat-card" variants={fadeChild} style={{ '--sc-c': '#ff6b6b' }}>
                            <div className="db__stat-card-icon"><i className="bx bx-heart"></i></div>
                            <div className="db__stat-card-body">
                                <span className="db__stat-card-val"><AnimatedNumber target={friendsCount} /></span>
                                <span className="db__stat-card-lbl">Conexiones sociales</span>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Upcoming tournaments mini */}
                    {upcomingMyTournaments.length > 0 && (
                        <motion.div className="db__stats-upcoming" variants={fadeChild}>
                            <div className="db__stats-upcoming-head">
                                <i className="bx bx-calendar-event"></i>
                                <h3>Próximos torneos</h3>
                            </div>
                            <div className="db__stats-upcoming-list">
                                {upcomingMyTournaments.map(t => {
                                    const msLeft = new Date(t.date).getTime() - now.getTime();
                                    const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
                                    return (
                                        <div key={t._id} className="db__stats-tourney-mini" onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                                            <div className="db__stats-tourney-icon"><i className="bx bx-trophy"></i></div>
                                            <div className="db__stats-tourney-info">
                                                <strong>{t.title}</strong>
                                                <span>{t.game} · {new Date(t.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                                            </div>
                                            <span className={`db__stats-tourney-badge db__stats-tourney-badge--${t.status}`}>
                                                {t.status === 'ongoing' ? 'EN CURSO' : daysLeft > 0 ? `${daysLeft}d` : 'HOY'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Notifications summary */}
                    {importantNotifications.length > 0 && (
                        <motion.div className="db__stats-notifs" variants={fadeChild}>
                            <div className="db__stats-notifs-head">
                                <i className="bx bx-bell bx-tada"></i>
                                <h3>{unreadNotifications.length} notificación{unreadNotifications.length !== 1 ? 'es' : ''} sin leer</h3>
                                <button className="db__btn db__btn--ghost db__btn--sm" onClick={() => navigate('/notifications')}>Ver todas</button>
                            </div>
                            <div className="db__stats-notifs-list">
                                {importantNotifications.map((n, i) => (
                                    <div key={n._id || i} className="db__stats-notif-item" onClick={() => navigate('/notifications')}>
                                        <i className={`bx ${n.category === 'tournament' ? 'bx-trophy' : n.category === 'team' ? 'bx-group' : n.category === 'admin' ? 'bx-shield-quarter' : 'bx-bell'}`}></i>
                                        <div className="db__stats-notif-body">
                                            <strong>{n.title}</strong>
                                            <span>{n.message?.substring(0, 80)}{n.message?.length > 80 ? '...' : ''}</span>
                                        </div>
                                        <span className="db__stats-notif-time">
                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' }) : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 3 — MÉTRICAS (carrusel horizontal fullscreen)
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--metrics" data-section="metrics" ref={el => sectionRefs.current.metrics = el}>
                {/* Track horizontal */}
                <div className="db__mx-track" style={{ transform: `translateX(-${currentMetricIdx * 100}vw)` }}>
                    {metricsData.map((m, idx) => (
                        <div key={m.id} className="db__mx-page" style={{ '--mx-c': m.color }}>
                            <div className="db__mx-page-glow" style={{ background: `radial-gradient(ellipse at 30% 40%, ${hexToRgba(m.color, 0.06)} 0%, transparent 60%)` }} />

                            <div className="db__mx-page-inner">
                                {/* ── Título de la métrica ── */}
                                <div className="db__mx-page-top">
                                    <div className="db__mx-title-row">
                                        <div className="db__mx-title-icon" style={{ color: m.color, borderColor: hexToRgba(m.color, 0.25) }}>
                                            <i className={m.icon}></i>
                                        </div>
                                        <div>
                                            <p className="db__mx-page-kicker" style={{ color: m.color }}>Métricas de rendimiento</p>
                                            <h2 className="db__mx-title">{m.label}</h2>
                                            <p className="db__mx-subtitle">{m.subtitle}</p>
                                        </div>
                                    </div>
                                    <span className="db__mx-page-counter">{idx + 1} / {metricsData.length}</span>
                                </div>

                                {/* ── Split: gráfica izq, info der ── */}
                                <div className="db__mx-page-split">
                                    {/* LEFT — Gráfica única por métrica */}
                                    <div className="db__mx-chart-side">
                                        <div className="db__mx-chart-wrap">
                                            {m.chartType === 'radialBar' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'radialBar', background: 'transparent', sparkline: { enabled: true } },
                                                        plotOptions: {
                                                            radialBar: {
                                                                startAngle: -135, endAngle: 135,
                                                                hollow: { size: '60%' },
                                                                track: { background: 'rgba(255,255,255,0.04)', strokeWidth: '100%' },
                                                                dataLabels: {
                                                                    name: { show: true, fontSize: '13px', fontWeight: 800, color: m.color, offsetY: 26 },
                                                                    value: { show: true, fontSize: '48px', fontWeight: 900, color: m.color, offsetY: -14, formatter: () => m.value }
                                                                }
                                                            }
                                                        },
                                                        colors: [m.color],
                                                        labels: [m.label],
                                                        stroke: { lineCap: 'round' },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={[m.numericValue]}
                                                    type="radialBar"
                                                    height={300}
                                                />
                                            )}
                                            {m.chartType === 'donut' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'donut', background: 'transparent' },
                                                        colors: [m.color, hexToRgba(m.color, 0.5), 'rgba(255,255,255,0.06)'],
                                                        labels: m.chartLabels,
                                                        legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '12px' },
                                                        dataLabels: { enabled: false },
                                                        plotOptions: { pie: { donut: { size: '58%', labels: { show: true, name: { color: '#ccc', fontSize: '13px' }, value: { color: m.color, fontSize: '32px', fontWeight: 900 }, total: { show: true, label: m.label, color: '#888', fontSize: '11px', formatter: () => m.value } } } } },
                                                        stroke: { width: 2, colors: ['transparent'] },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={m.chartSeries}
                                                    type="donut"
                                                    height={300}
                                                />
                                            )}
                                            {m.chartType === 'polarArea' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'polarArea', background: 'transparent' },
                                                        colors: [m.color, hexToRgba(m.color, 0.6), hexToRgba(m.color, 0.3)],
                                                        labels: m.chartLabels,
                                                        legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '12px' },
                                                        dataLabels: { enabled: false },
                                                        fill: { opacity: 0.85 },
                                                        stroke: { width: 1, colors: ['rgba(255,255,255,0.1)'] },
                                                        plotOptions: { polarArea: { rings: { strokeWidth: 1, strokeColor: 'rgba(255,255,255,0.05)' }, spokes: { strokeWidth: 1, connectorColors: 'rgba(255,255,255,0.05)' } } },
                                                        yaxis: { show: false },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={m.chartSeries}
                                                    type="polarArea"
                                                    height={300}
                                                />
                                            )}
                                            {m.chartType === 'stackedBars' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'bar', stacked: true, background: 'transparent', toolbar: { show: false } },
                                                        colors: [m.color, hexToRgba(m.color, 0.72), hexToRgba(m.color, 0.42)],
                                                        plotOptions: {
                                                            bar: {
                                                                horizontal: false,
                                                                columnWidth: '34%',
                                                                borderRadius: 3,
                                                                borderRadiusApplication: 'end'
                                                            }
                                                        },
                                                        dataLabels: { enabled: false },
                                                        stroke: { show: false },
                                                        xaxis: {
                                                            categories: m.chartAxis || [],
                                                            labels: { style: { colors: 'rgba(255,255,255,0.42)', fontSize: '11px', fontWeight: 700 } },
                                                            axisBorder: { show: false },
                                                            axisTicks: { show: false }
                                                        },
                                                        yaxis: {
                                                            labels: { show: false }
                                                        },
                                                        grid: {
                                                            borderColor: 'rgba(255,255,255,0.06)',
                                                            strokeDashArray: 3,
                                                            xaxis: { lines: { show: false } }
                                                        },
                                                        legend: {
                                                            show: true,
                                                            position: 'bottom',
                                                            horizontalAlign: 'left',
                                                            labels: { colors: '#999' },
                                                            fontSize: '11px',
                                                            markers: { size: 7, radius: 2 },
                                                            itemMargin: { horizontal: 10, vertical: 4 }
                                                        },
                                                        tooltip: { theme: 'dark' },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={m.chartSeries}
                                                    type="bar"
                                                    height={300}
                                                />
                                            )}
                                            {/* Consistencia — radialBar múltiple (3 anillos) */}
                                            {m.chartType === 'radialFull' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'radialBar', background: 'transparent', sparkline: { enabled: true } },
                                                        plotOptions: {
                                                            radialBar: {
                                                                startAngle: 0, endAngle: 360,
                                                                hollow: { size: '30%' },
                                                                track: { background: 'rgba(255,255,255,0.04)', strokeWidth: '100%', margin: 8 },
                                                                dataLabels: {
                                                                    name: { show: false },
                                                                    value: { show: true, fontSize: '36px', fontWeight: 900, color: m.color, offsetY: 8, formatter: () => m.value }
                                                                }
                                                            }
                                                        },
                                                        colors: [m.color, hexToRgba(m.color, 0.6), hexToRgba(m.color, 0.3)],
                                                        labels: m.chartLabels || [],
                                                        legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '12px', markers: { size: 5 } },
                                                        stroke: { lineCap: 'round' },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={m.chartSeries}
                                                    type="radialBar"
                                                    height={320}
                                                />
                                            )}
                                            {/* Versatilidad — donut con segmentos por categoría */}
                                            {m.chartType === 'donutMulti' && (
                                                <Chart
                                                    options={{
                                                        chart: { type: 'donut', background: 'transparent' },
                                                        colors: (m.chartLabels || []).map((_, i) => {
                                                            const palette = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];
                                                            return palette[i % palette.length];
                                                        }),
                                                        labels: m.chartLabels || [],
                                                        legend: { show: true, position: 'bottom', labels: { colors: '#999' }, fontSize: '12px' },
                                                        dataLabels: { enabled: true, style: { fontSize: '13px', fontWeight: 700 }, dropShadow: { enabled: false } },
                                                        plotOptions: { pie: { donut: { size: '52%', labels: { show: true, name: { color: '#ccc', fontSize: '13px' }, value: { color: m.color, fontSize: '28px', fontWeight: 900 }, total: { show: true, label: 'TOTAL', color: '#888', fontSize: '10px', formatter: (w) => { const t = w.globals.seriesTotals.reduce((a, b) => a + b, 0); return t; } } } } } },
                                                        stroke: { width: 3, colors: ['rgba(0,0,0,0.3)'] },
                                                        theme: { mode: 'dark' }
                                                    }}
                                                    series={m.chartSeries}
                                                    type="donut"
                                                    height={300}
                                                />
                                            )}
                                        </div>
                                        {/* Valor grande debajo de la gráfica */}
                                        <div className="db__mx-chart-badge" style={{ color: m.color, borderColor: hexToRgba(m.color, 0.2) }}>
                                            <span className="db__mx-chart-badge-val">{m.value}</span>
                                            <span className="db__mx-chart-badge-label">puntuación</span>
                                        </div>
                                    </div>

                                    {/* RIGHT — Definición, Consejos, Plan */}
                                    <div className="db__mx-info-side">
                                        <div className="db__mx-block">
                                            <div className="db__mx-block-head">
                                                <i className="bx bx-book-open" style={{ color: m.color }}></i>
                                                <h4>Definición</h4>
                                            </div>
                                            <p>{m.definition}</p>
                                        </div>

                                        <div className="db__mx-block">
                                            <div className="db__mx-block-head">
                                                <i className="bx bx-bulb" style={{ color: m.color }}></i>
                                                <h4>Consejos</h4>
                                            </div>
                                            <ul className="db__mx-tips">
                                                {m.tips.map((tip, i) => (
                                                    <li key={i}><i className="bx bx-check" style={{ color: m.color }}></i>{tip}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="db__mx-block">
                                            <div className="db__mx-block-head">
                                                <i className="bx bx-target-lock" style={{ color: m.color }}></i>
                                                <h4>Plan de Mejora</h4>
                                            </div>
                                            <p className="db__mx-plan">{m.plan}</p>
                                        </div>

                                        <button
                                            className="db__mx-btn-more"
                                            onClick={() => navigate('/metricas')}
                                            style={{ borderColor: hexToRgba(m.color, 0.4), color: m.color }}
                                        >
                                            <i className="bx bx-bar-chart-alt-2"></i> Ver análisis completo
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Dots — fijos en la parte inferior central */}
                <div className="db__mx-dots">
                    {metricsData.map((dm, di) => (
                        <button
                            key={di}
                            className={`db__mx-dot ${di === currentMetricIdx ? 'db__mx-dot--active' : ''}`}
                            style={di === currentMetricIdx ? { background: dm.color, borderColor: dm.color } : {}}
                            onClick={() => setCurrentMetricIdx(di)}
                        />
                    ))}
                </div>

                {/* Botones de navegación — bordes */}
                {currentMetricIdx > 0 && (
                    <button className="db__mx-nav db__mx-nav--left" onClick={() => setCurrentMetricIdx(i => i - 1)}>
                        <span className="db__mx-nav-glyph" aria-hidden="true">{'<<'}</span>
                    </button>
                )}
                {currentMetricIdx < metricsData.length - 1 && (
                    <button className="db__mx-nav db__mx-nav--right" onClick={() => setCurrentMetricIdx(i => i + 1)}>
                        <span className="db__mx-nav-glyph" aria-hidden="true">{'>>'}</span>
                    </button>
                )}
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
                                    <div className="db__conn-card-icon">{renderConnectionIcon(p)}</div>
                                    <div className="db__conn-card-info">
                                        <strong>{p.name}</strong>
                                        <span>{getProviderStatusLabel(p.id)}</span>
                                    </div>
                                    <div className="db__conn-card-status">
                                        {linked
                                            ? <FaCheckCircle style={{ color: '#4ade80' }} />
                                            : <FaPlusCircle style={{ color: 'var(--text-muted)' }} />
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
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/equipos')}>
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
                                    <motion.div key={team._id} className="db__team-card" variants={fadeChild} onClick={() => openTeamPanel(team)}>
                                        <div className="db__tc-logo">
                                            {team.logo ? (
                                                <img
                                                    src={resolveMediaUrl(team.logo)}
                                                    alt={team.name}
                                                    onError={(e) => applyImageFallback(e, getTeamFallback(team.name))}
                                                />
                                            ) : <div className="db__tc-logo--ph"><i className="bx bx-group"></i></div>}
                                        </div>
                                        <strong className="db__tc-name">{team.name}</strong>
                                        <span className="db__tc-game">{team.game || 'Sin juego'}</span>
                                        <span className="db__tc-role">{resolveTeamRole(team)}</span>
                                        <div className="db__tc-members"><i className="bx bx-user"></i><span>{getFilledMemberCount(team)} miembros</span></div>
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
                                <button className="db__btn db__btn--outline" onClick={() => navigate('/equipos')}><i className="bx bx-search"></i> Buscar</button>
                            </div>
                        </motion.div>
                    )}

                    {pendingRequests.length > 0 && (
                        <div className="db__teams-pending">
                            <i className="bx bx-bell bx-tada"></i>
                            <span>{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}</span>
                            <button className="db__btn db__btn--sm" onClick={() => navigate('/equipos')}>Revisar</button>
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
                            <h2 className="db__tourneys-title">{upcomingMyTournaments.length > 0 ? 'Mis Torneos' : 'Torneos Activos'}</h2>
                            {upcomingMyTournaments.length > 0 && <p className="db__tourneys-sub">Inscrito en {myTournaments.length} torneo{myTournaments.length !== 1 ? 's' : ''}</p>}
                        </div>
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/tournaments')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>

                    {(upcomingMyTournaments.length > 0 || activeTournaments.length > 0) ? (
                        <motion.div className="db__tourneys-list" variants={stagger}>
                            {(upcomingMyTournaments.length > 0 ? upcomingMyTournaments : activeTournaments).map(t => {
                                const slotPercent = t.maxSlots ? Math.round((t.currentSlots / t.maxSlots) * 100) : 0;
                                const msLeft = new Date(t.date).getTime() - now.getTime();
                                const daysLeft = Math.max(0, Math.floor(msLeft / 86400000));
                                const hoursLeft = Math.max(0, Math.floor((msLeft % 86400000) / 3600000));
                                return (
                                    <motion.div key={t._id || t.tournamentId} className="db__tr-card" variants={fadeChild} onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                                        <div className="db__tr-thumb">
                                            {t.bannerImage ? (
                                                <img
                                                    src={resolveMediaUrl(t.bannerImage)}
                                                    alt={t.title || 'Torneo'}
                                                    onError={(e) => applyImageFallback(e, getTeamFallback(t.title || t.game || 'Torneo'))}
                                                />
                                            ) : <i className="bx bx-trophy"></i>}
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
                        <button className="db__btn db__btn--ghost" onClick={() => navigate('/comunidad')}>
                            Ver más <i className="bx bx-right-arrow-alt"></i>
                        </button>
                    </motion.div>

                    {myCommunities.length > 0 ? (
                        <motion.div className="db__comms-grid" variants={stagger}>
                            {myCommunities.slice(0, 6).map(c => (
                                <motion.div key={c._id || c.id} className="db__comm-card" variants={fadeChild} onClick={() => navigate(`/communities/${c.shortUrl}`)}>
                                    <div className="db__comm-banner">
                                        {c.bannerUrl ? (
                                            <img
                                                src={resolveMediaUrl(c.bannerUrl)}
                                                alt={c.name || 'Comunidad'}
                                                onError={(e) => applyImageFallback(e, getTeamFallback(c.name || 'Comunidad'))}
                                            />
                                        ) : <div className="db__comm-banner--ph"></div>}
                                    </div>
                                    <div className="db__comm-avatar">
                                        {c.avatarUrl ? (
                                            <img
                                                src={resolveMediaUrl(c.avatarUrl)}
                                                alt={c.name}
                                                onError={(e) => applyImageFallback(e, getTeamFallback(c.name || 'Comunidad'))}
                                            />
                                        ) : <i className="bx bx-buildings"></i>}
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
                                    {getCommunitySocialEntries(c.socialLinks).length > 0 && (
                                        <div className="db__comm-games">
                                            {getCommunitySocialEntries(c.socialLinks).slice(0, 4).map((entry) => (
                                                <a
                                                    key={entry.key}
                                                    href={entry.url}
                                                    className="db__comm-game-tag"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <i className={entry.iconClass} aria-hidden="true" /> {entry.label}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div className="db__comms-empty" variants={fadeChild}>
                            <i className="bx bx-buildings"></i>
                            <p>No perteneces a ninguna comunidad</p>
                            <button className="db__btn db__btn--primary" onClick={() => navigate('/comunidad')}>
                                <i className="bx bx-search"></i> Explorar comunidades
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════════
                SECTION 7 — ACTIVIDAD Y RESUMEN
               ═══════════════════════════════════════════ */}
            <section className="db__section db__section--activity" data-section="activity" ref={el => sectionRefs.current.activity = el}>
                <motion.div className="db__activity-wrap" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={stagger}>
                    <motion.div className="db__activity-header" variants={fadeChild}>
                        <p className="db__activity-kicker">Centro de Actividad</p>
                        <h2 className="db__activity-title">Lo que está pasando</h2>
                    </motion.div>

                    <div className="db__activity-grid">
                        {/* Team activity */}
                        <motion.div className="db__activity-card" variants={fadeChild}>
                            <div className="db__activity-card-head">
                                <i className="bx bx-group" style={{ color: '#a78bfa' }}></i>
                                <h3>Actividad de Equipos</h3>
                            </div>
                            <div className="db__activity-card-body">
                                {myTeams.length > 0 ? (
                                    <>
                                        {myTeams.slice(0, 3).map(team => (
                                            <div key={team._id} className="db__act-team-row" onClick={() => openTeamPanel(team)}>
                                                <div className="db__act-team-logo">
                                                    {team.logo ? (
                                                        <img src={resolveMediaUrl(team.logo)} alt={team.name} onError={(e) => applyImageFallback(e, getTeamFallback(team.name))} />
                                                    ) : <i className="bx bx-group"></i>}
                                                </div>
                                                <div className="db__act-team-info">
                                                    <strong>{team.name}</strong>
                                                    <span>{team.game || 'Sin juego'} · {resolveTeamRole(team)}</span>
                                                </div>
                                                <span className="db__act-team-count">{getFilledMemberCount(team)} <i className="bx bx-user"></i></span>
                                            </div>
                                        ))}
                                        {pendingRequests.length > 0 && (
                                            <div className="db__act-alert" onClick={() => navigate('/equipos')}>
                                                <i className="bx bx-bell bx-tada"></i>
                                                <span>{pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente{pendingRequests.length > 1 ? 's' : ''}</span>
                                                <i className="bx bx-chevron-right"></i>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="db__act-empty">
                                        <p>Sin equipos aún</p>
                                        <button className="db__btn db__btn--sm db__btn--primary" onClick={() => navigate('/create-team')}>
                                            <i className="bx bx-plus"></i> Crear equipo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Notifications */}
                        <motion.div className="db__activity-card" variants={fadeChild}>
                            <div className="db__activity-card-head">
                                <i className="bx bx-bell" style={{ color: '#ffd700' }}></i>
                                <h3>Notificaciones</h3>
                                {unreadNotifications.length > 0 && (
                                    <span className="db__act-badge">{unreadNotifications.length}</span>
                                )}
                            </div>
                            <div className="db__activity-card-body">
                                {unreadNotifications.length > 0 ? (
                                    <>
                                        {unreadNotifications.slice(0, 4).map((n, i) => (
                                            <div key={n._id || i} className="db__act-notif-row" onClick={() => navigate('/notifications')}>
                                                <i className={`bx ${n.category === 'tournament' ? 'bx-trophy' : n.category === 'team' ? 'bx-group' : n.category === 'social' ? 'bx-heart' : 'bx-bell'} db__act-notif-icon`}></i>
                                                <div className="db__act-notif-text">
                                                    <strong>{n.title}</strong>
                                                    <span>{n.message?.substring(0, 60)}{n.message?.length > 60 ? '...' : ''}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <button className="db__btn db__btn--ghost db__btn--sm" onClick={() => navigate('/notifications')}>
                                            Ver todas <i className="bx bx-right-arrow-alt"></i>
                                        </button>
                                    </>
                                ) : (
                                    <div className="db__act-empty">
                                        <i className="bx bx-check-circle" style={{ color: '#4ade80' }}></i>
                                        <p>Estás al día — sin notificaciones pendientes</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Quick navigation */}
                        <motion.div className="db__activity-card db__activity-card--nav" variants={fadeChild}>
                            <div className="db__activity-card-head">
                                <i className="bx bx-compass" style={{ color: '#8EDB15' }}></i>
                                <h3>Acceso Rápido</h3>
                            </div>
                            <div className="db__activity-nav-grid">
                                {[
                                    { icon: 'bx bxs-user-detail', label: 'Perfil',      path: '/profile',     color: '#8EDB15' },
                                    { icon: 'bx bxs-trophy',      label: 'Torneos',     path: '/tournaments', color: '#ffd700' },
                                    { icon: 'bx bxs-group',       label: 'Equipos',     path: '/equipos',     color: '#00d2ff' },
                                    { icon: 'bx bxs-cog',         label: 'Ajustes',     path: '/settings',    color: '#a78bfa' },
                                    { icon: 'bx bxs-graduation',  label: 'Universidad', path: '/university',  color: '#ff6b6b' },
                                    { icon: 'bx bxs-news',        label: 'Noticias',    path: '/noticias',    color: '#f97316' },
                                ].map(item => (
                                    <button key={item.path} className="db__act-nav-btn" onClick={() => navigate(item.path)} style={{ '--qn-c': item.color }}>
                                        <i className={item.icon}></i>
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </section>

            <div className="db__footer-shell">
                <Footer />
            </div>
        </div>
    );
};

export default Dashboard;
