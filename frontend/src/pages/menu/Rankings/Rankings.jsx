import React, { useMemo, useState, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy, FaUsers, FaCalendarAlt, FaMedal, FaFire, FaChartLine,
    FaGamepad, FaMapMarkerAlt, FaCrown, FaSearch, FaTimes, FaStar,
    FaArrowUp, FaArrowDown, FaMinus, FaChevronRight, FaGlobeAmericas,
    FaUserAlt, FaShieldAlt, FaCoins, FaCalendarCheck, FaFlag,
    FaHistory, FaHandshake, FaUserFriends, FaTwitter, FaInstagram, FaAt,
    FaCloudUploadAlt, FaTrash, FaImage, FaBook, FaCheckCircle,
    FaInfoCircle, FaPencilAlt, FaPlus
} from 'react-icons/fa';
import { GiPodium, GiTrophy, GiSwordsEmblem } from 'react-icons/gi';
import PageHud from '../../../components/PageHud/PageHud';
import {
    PLAYERS_DATA, TEAMS_DATA, TOURNAMENTS_DATA,
    GAMES, REGIONS, getWinRate, formatPrize, formatDate, getStatusLabel
} from '../../../data/rankingsData';
import './Rankings.css';

// All supported games
const SUPPORTED_GAMES = [
    { id: 'sf', name: 'Street Fighter', short: 'SF' },
    { id: 'ssbu', name: 'Smash Bros', short: 'Smash' },
    { id: 'valorant', name: 'Valorant', short: 'Valorant' },
    { id: 'lol', name: 'League of Legends', short: 'LoL' },
    { id: 'mlbb', name: 'Mobile Legends', short: 'MLBB' },
    { id: 'warzone', name: 'Warzone', short: 'WZ' },
    { id: 'nba2k', name: 'NBA 2K', short: 'NBA2K' },
    { id: 'eafc', name: 'EA Sports FC', short: 'EA FC' },
    { id: 'tekken', name: 'Tekken', short: 'Tekken' },
    { id: 'efootball', name: 'eFootball', short: 'eFoot' },
    { id: 'rl', name: 'Rocket League', short: 'RL' },
];

const RANKINGS_VISIBLE_GAMES = new Set([
    'Street Fighter',
    'Smash Bros',
    'Valorant',
    'League of Legends',
    'LoL',
    'Mobile Legends',
    'MLBB',
    'Warzone',
    'NBA 2K',
    'EA Sports FC',
    'Tekken',
    'eFootball',
    'Rocket League',
    'PUBG Mobile',
    'Free Fire',
    'Fortnite',
    'Multigame',
]);

// Bubbles component
const Bubbles = () => (
    <div className="rk-bubbles">
        {[...Array(12)].map((_, i) => (
            <div
                key={i}
                className="rk-bubble"
                style={{
                    '--size': `${Math.random() * 80 + 40}px`,
                    '--left': `${Math.random() * 100}%`,
                    '--delay': `${Math.random() * 12}s`,
                    '--duration': `${Math.random() * 10 + 14}s`,
                }}
            />
        ))}
    </div>
);

// Avatar URL generator
const avatarUrl = (seed) => `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;
const teamLogo = (seed) => `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(seed)}`;

// Utility: count titles (place === 1) across solo + duo + team — all count as personal
const getTitleCount = (player) => {
    if (!player.achievements) return 0;
    const solo = player.achievements.solo?.filter(a => a.place === 1).length || 0;
    const duo = player.achievements.duo?.filter(a => a.place === 1).length || 0;
    const team = player.achievements.team?.filter(a => a.place === 1).length || 0;
    return solo + duo + team;
};

// Utility: count all achievements (participations)
const getAchievementCount = (player) => {
    if (!player.achievements) return 0;
    return (player.achievements.solo?.length || 0) + (player.achievements.duo?.length || 0) + (player.achievements.team?.length || 0);
};

// Tab definitions
const TABS = [
    { id: 'players', label: 'Jugadores', icon: FaUserAlt },
    { id: 'teams', label: 'Equipos', icon: FaShieldAlt },
    { id: 'tournaments', label: 'Torneos', icon: FaTrophy },
];

export default function Rankings() {
    const fileInputRef = useRef(null);
    const achievementFileRef = useRef(null);
    const [activeTab, setActiveTab] = useState('players');
    const [game, setGame] = useState('Todos');
    const [region, setRegion] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [tournamentFilter, setTournamentFilter] = useState('Todos');
    const [playerPanelTab, setPlayerPanelTab] = useState('overview');

    // Modal States
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Achievement modal (Enviar Mi Logro)
    const initialAchievementData = {
        game: '',
        mode: 'team',
        tournamentName: '',
        tournamentDate: '',
        placement: 1,
        teamName: '',
        partnerName: '',
        description: '',
        proofFiles: []
    };
    const [achievementData, setAchievementData] = useState(initialAchievementData);

    // Contribute modal (Aportar Datos)
    const initialContributeData = {
        subject: '',
        playerOrTeam: '',
        game: '',
        tournamentName: '',
        tournamentDate: '',
        result: '',
        source: '',
        description: '',
        proofFiles: []
    };
    const [contributeData, setContributeData] = useState(initialContributeData);

    const handleContribute = useCallback((subject) => {
        setContributeData({ ...initialContributeData, subject, playerOrTeam: subject });
        setIsContributeModalOpen(true);
    }, []);

    // Achievement modal handlers
    const handleSubmitAchievement = async (e) => {
        e.preventDefault();
        if (!achievementData.game) { showToast('Selecciona un juego', 'error'); return; }
        if (!achievementData.tournamentName.trim()) { showToast('Escribe el nombre del torneo', 'error'); return; }
        if (!achievementData.tournamentDate) { showToast('Selecciona la fecha', 'error'); return; }
        if (achievementData.proofFiles.length === 0) { showToast('Sube al menos una prueba', 'error'); return; }
        if (achievementData.mode === 'duo' && !achievementData.partnerName.trim()) { showToast('Escribe el nombre de tu compañero', 'error'); return; }
        if (achievementData.mode === 'team' && !achievementData.teamName.trim()) { showToast('Escribe el nombre del equipo', 'error'); return; }

        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            if (!token) { showToast('Debes iniciar sesion', 'error'); setIsSubmitting(false); return; }
            const gameName = SUPPORTED_GAMES.find(g => g.id === achievementData.game)?.name || achievementData.game;
            await axios.post(`${API_URL}/api/auth/support/ticket`, {
                type: 'achievement',
                subject: `Logro: ${achievementData.tournamentName}`,
                message: `Juego: ${gameName} | Torneo: ${achievementData.tournamentName} | Fecha: ${achievementData.tournamentDate} | Posicion: ${achievementData.placement} | Modo: ${achievementData.mode}${achievementData.mode === 'team' ? ` | Equipo: ${achievementData.teamName}` : ''}${achievementData.mode === 'duo' ? ` | Compañero: ${achievementData.partnerName}` : ''}${achievementData.description ? `\n\n${achievementData.description}` : ''}`,
                data: {
                    game: gameName,
                    mode: achievementData.mode,
                    tournamentName: achievementData.tournamentName,
                    tournamentDate: achievementData.tournamentDate,
                    placement: achievementData.placement,
                    teamName: achievementData.teamName,
                    partnerName: achievementData.partnerName,
                    proofCount: achievementData.proofFiles.length,
                }
            }, { headers: { Authorization: `Bearer ${token}` } });

            setAchievementData(initialAchievementData);
            setIsAchievementModalOpen(false);
            showToast('Logro enviado. Nuestro equipo lo revisara en 24-48 horas.');
        } catch (err) {
            showToast(err.response?.data?.error || 'Error al enviar', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeAchievementModal = () => {
        if (!isSubmitting) { setIsAchievementModalOpen(false); setAchievementData(initialAchievementData); }
    };

    const handleAchievementFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(f => f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024);
        if (validFiles.length !== files.length) showToast('Solo imagenes de hasta 10MB', 'error');
        const newFiles = validFiles.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }));
        setAchievementData(prev => ({ ...prev, proofFiles: [...prev.proofFiles, ...newFiles].slice(0, 5) }));
    };

    const removeAchievementFile = (index) => {
        setAchievementData(prev => ({ ...prev, proofFiles: prev.proofFiles.filter((_, i) => i !== index) }));
    };

    // Show toast
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    // Handle file selection (contribute modal)
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024;
            return isImage && isValidSize;
        });
        if (validFiles.length !== files.length) {
            showToast('Solo imagenes de hasta 10MB', 'error');
        }
        const newFiles = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));
        setContributeData(prev => ({
            ...prev,
            proofFiles: [...prev.proofFiles, ...newFiles].slice(0, 5)
        }));
    };

    // Remove proof file
    const removeProofFile = (index) => {
        setContributeData(prev => ({
            ...prev,
            proofFiles: prev.proofFiles.filter((_, i) => i !== index)
        }));
    };

    // Submit contribute data to backend
    const handleSubmitContribute = async (e) => {
        e.preventDefault();

        if (!contributeData.playerOrTeam.trim()) {
            showToast('Escribe el nombre del jugador o equipo', 'error');
            return;
        }
        if (!contributeData.tournamentName.trim()) {
            showToast('Escribe el nombre del torneo o evento', 'error');
            return;
        }
        if (!contributeData.description.trim()) {
            showToast('Agrega una descripcion de los datos', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = getAuthToken();
            if (!token) {
                showToast('Debes iniciar sesion para aportar datos', 'error');
                setIsSubmitting(false);
                return;
            }

            const gameName = contributeData.game
                ? SUPPORTED_GAMES.find(g => g.id === contributeData.game)?.name || contributeData.game
                : 'No especificado';

            await axios.post(`${API_URL}/api/auth/support/ticket`, {
                type: 'achievement',
                subject: `Aporte de datos: ${contributeData.playerOrTeam}`,
                message: [
                    `Jugador/Equipo: ${contributeData.playerOrTeam}`,
                    `Juego: ${gameName}`,
                    `Torneo/Evento: ${contributeData.tournamentName}`,
                    contributeData.tournamentDate ? `Fecha: ${contributeData.tournamentDate}` : '',
                    contributeData.result ? `Resultado: ${contributeData.result}` : '',
                    contributeData.source ? `Fuente: ${contributeData.source}` : '',
                    `\nDescripcion:\n${contributeData.description}`,
                ].filter(Boolean).join('\n'),
                data: {
                    playerOrTeam: contributeData.playerOrTeam,
                    game: gameName,
                    tournamentName: contributeData.tournamentName,
                    tournamentDate: contributeData.tournamentDate,
                    result: contributeData.result,
                    source: contributeData.source,
                    proofCount: contributeData.proofFiles.length,
                }
            }, { headers: { Authorization: `Bearer ${token}` } });

            setContributeData(initialContributeData);
            setIsContributeModalOpen(false);
            showToast('Datos enviados. Nuestro equipo los revisara en 24-48 horas.');
        } catch (err) {
            console.error('Error submitting contribute data:', err);
            showToast(err.response?.data?.error || 'Error al enviar los datos', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close contribute modal
    const closeContributeModal = () => {
        if (!isSubmitting) {
            setIsContributeModalOpen(false);
            setContributeData(initialContributeData);
        }
    };

    // ═══════════════════════════════════════════════════════════
    // PLAYERS TAB
    // ═══════════════════════════════════════════════════════════
    const filteredPlayers = useMemo(() => {
        let rows = [...PLAYERS_DATA].filter((player) => {
            if (player.isTeam) return false;
            if (!RANKINGS_VISIBLE_GAMES.has(player.game)) return false;
            // Solo mostrar jugadores con logros individuales (solo/duo)
            // Los que solo tienen logros de equipo se ven en la pestaña Equipos
            const hasSolo = player.achievements?.solo?.length > 0;
            const hasDuo = player.achievements?.duo?.length > 0;
            return hasSolo || hasDuo;
        });

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(p =>
                p.player.toLowerCase().includes(term) ||
                p.team.toLowerCase().includes(term) ||
                p.realName.toLowerCase().includes(term)
            );
        }
        if (game !== 'Todos') rows = rows.filter(p => p.game === game);
        if (region !== 'Todas') rows = rows.filter(p => p.region === region);

        // Sort by titles first (place === 1), then by total achievements
        return rows.sort((a, b) => {
            const aTitles = getTitleCount(a);
            const bTitles = getTitleCount(b);
            if (bTitles !== aTitles) return bTitles - aTitles;
            return getAchievementCount(b) - getAchievementCount(a);
        });
    }, [game, region, searchTerm]);

    const podiumPlayers = filteredPlayers.slice(0, 3);
    const topPlayer = filteredPlayers[0];

    // ═══════════════════════════════════════════════════════════
    // TEAM ENRICHMENT — derive real stats from PLAYERS_DATA
    // ═══════════════════════════════════════════════════════════
    const getTeamData = useCallback((teamName) => {
        // Find individual players that belong to this team (exclude isTeam entries)
        const members = PLAYERS_DATA.filter(p =>
            !p.isTeam && p.team && p.team.split(' / ').some(t => t.trim() === teamName)
        );
        // Collect achievements from player data
        const teamAchievements = [];
        const seen = new Set();
        members.forEach(p => {
            p.achievements?.team?.forEach(ach => {
                if (ach.team === teamName) {
                    const key = `${ach.name}|${ach.date}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        teamAchievements.push({ ...ach, player: p.player });
                    }
                }
            });
        });
        // Also include achievements defined directly on the team in TEAMS_DATA
        const teamEntry = TEAMS_DATA.find(t => t.name === teamName);
        if (teamEntry?.achievements) {
            teamEntry.achievements.forEach(ach => {
                const key = `${ach.name}|${ach.date}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    teamAchievements.push(ach);
                }
            });
        }
        const titles = teamAchievements.filter(a => a.place === 1).length;
        return { members, achievements: teamAchievements, titles, isUniversity: teamEntry?.isUniversity || false };
    }, []);

    // ═══════════════════════════════════════════════════════════
    // TEAMS TAB
    // ═══════════════════════════════════════════════════════════
    const filteredTeams = useMemo(() => {
        let rows = [...TEAMS_DATA].filter((team) =>
            Array.isArray(team.games) && team.games.some((gameName) => RANKINGS_VISIBLE_GAMES.has(gameName))
        );

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(t =>
                t.name.toLowerCase().includes(term) ||
                t.tag.toLowerCase().includes(term)
            );
        }
        if (game !== 'Todos') rows = rows.filter(t => t.games.includes(game));
        if (region !== 'Todas') rows = rows.filter(t => t.region === region);

        // Sort by titles first, then achievements, then verified, then name
        return rows.sort((a, b) => {
            const tdA = getTeamData(a.name);
            const tdB = getTeamData(b.name);
            if (tdB.titles !== tdA.titles) return tdB.titles - tdA.titles;
            if (tdB.achievements.length !== tdA.achievements.length) return tdB.achievements.length - tdA.achievements.length;
            if (a.verified !== b.verified) return b.verified ? 1 : -1;
            return a.name.localeCompare(b.name);
        });
    }, [game, region, searchTerm, getTeamData]);

    // ═══════════════════════════════════════════════════════════
    // TOURNAMENTS TAB
    // ═══════════════════════════════════════════════════════════
    const filteredTournaments = useMemo(() => {
        let rows = [...TOURNAMENTS_DATA].filter((tournament) => RANKINGS_VISIBLE_GAMES.has(tournament.game));

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(t =>
                t.name.toLowerCase().includes(term) ||
                t.organizer.toLowerCase().includes(term)
            );
        }
        if (game !== 'Todos') rows = rows.filter(t => t.game === game);
        if (tournamentFilter !== 'Todos') rows = rows.filter(t => t.status === tournamentFilter);

        return rows.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    }, [game, tournamentFilter, searchTerm]);

    // Stats
    const stats = useMemo(() => ({
        totalPlayers: filteredPlayers.length,
        totalTeams: filteredTeams.length,
        activeTournaments: filteredTournaments.filter(t => t.status === 'active').length,
        totalPrize: filteredTournaments.reduce((acc, t) => acc + (t.prize || 0), 0),
    }), [filteredPlayers, filteredTeams, filteredTournaments]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const getTrendIcon = (trend) => {
        if (trend > 0) return <FaArrowUp className="rk-trend-icon rk-trend-up" />;
        if (trend < 0) return <FaArrowDown className="rk-trend-icon rk-trend-down" />;
        return <FaMinus className="rk-trend-icon rk-trend-flat" />;
    };

    return (
        <div className="rk-page">
            <Bubbles />
            <div className="rk-ambient rk-ambient--1" />
            <div className="rk-ambient rk-ambient--2" />

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        className={`rk-toast rk-toast--${toast.type}`}
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <PageHud page="RANKINGS" />

            <motion.div
                className="rk-container"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                {/* Hero Section */}
                <motion.section className="rk-hero" variants={itemVariants}>
                    <div className="rk-hero__content">
                        <div className="rk-hero__badge">
                            <FaFlag /> República Dominicana
                        </div>
                        <h1>Rankings Esports RD</h1>
                        <p>Clasificación oficial de jugadores, equipos y torneos de la escena competitiva dominicana</p>

                        {/* Submit Achievement Button */}
                        <motion.button
                            className="rk-submit-achievement-btn"
                            onClick={() => setIsAchievementModalOpen(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaTrophy />
                            <span>Enviar Mi Logro</span>
                        </motion.button>

                        {/* Quick Stats */}
                        <div className="rk-hero__stats">
                            <div className="rk-hero__stat">
                                <FaUserAlt />
                                <span>{stats.totalPlayers}</span>
                                <small>Jugadores</small>
                            </div>
                            <div className="rk-hero__stat">
                                <FaShieldAlt />
                                <span>{stats.totalTeams}</span>
                                <small>Equipos</small>
                            </div>
                            <div className="rk-hero__stat">
                                <FaTrophy />
                                <span>{stats.activeTournaments}</span>
                                <small>Torneos Activos</small>
                            </div>
                            <div className="rk-hero__stat">
                                <FaCoins />
                                <span>RD${(stats.totalPrize / 1000).toFixed(0)}K</span>
                                <small>En Premios</small>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Tabs */}
                <motion.div className="rk-tabs" variants={itemVariants}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`rk-tab ${activeTab === tab.id ? 'rk-tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <tab.icon />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Filters */}
                <motion.div className="rk-filters" variants={itemVariants}>
                    <div className="rk-search">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder={`Buscar ${activeTab === 'players' ? 'jugadores' : activeTab === 'teams' ? 'equipos' : 'torneos'}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')}><FaTimes /></button>
                        )}
                    </div>

                    <select value={game} onChange={(e) => setGame(e.target.value)}>
                        {GAMES.map(g => <option key={g} value={g}>{g === 'Todos' ? 'Todos los Juegos' : g}</option>)}
                    </select>

                    {activeTab !== 'tournaments' ? (
                        <select value={region} onChange={(e) => setRegion(e.target.value)}>
                            {REGIONS.map(r => <option key={r} value={r}>{r === 'Todas' ? 'Todas las Regiones' : r}</option>)}
                        </select>
                    ) : (
                        <select value={tournamentFilter} onChange={(e) => setTournamentFilter(e.target.value)}>
                            <option value="Todos">Todos los Estados</option>
                            <option value="active">En Curso</option>
                            <option value="upcoming">Próximamente</option>
                            <option value="completed">Finalizados</option>
                        </select>
                    )}
                </motion.div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {/* ═══════════════════════════ PLAYERS TAB ═══════════════════════════ */}
                    {activeTab === 'players' && (
                        <motion.div
                            key="players"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="rk-content"
                        >
                            {/* Podium */}
                            {podiumPlayers.length > 0 && (
                                <div className="rk-podium">
                                    {podiumPlayers.map((p, idx) => (
                                        <motion.div
                                            key={p.id}
                                            className={`rk-podium-card rk-podium-${idx + 1}`}
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            onClick={() => setSelectedPlayer(p)}
                                        >
                                            <div className="rk-podium-rank">
                                                {idx === 0 ? <FaCrown /> : `#${idx + 1}`}
                                            </div>
                                            <img src={avatarUrl(p.player)} alt={p.player} />
                                            <h3>{p.player}</h3>
                                            <span className="rk-podium-team">{p.team}</span>
                                            <div className="rk-podium-game">{p.game}</div>
                                            <div className="rk-podium-titles">
                                                <FaTrophy /> <span className="rk-podium-titles__count">{getTitleCount(p)}</span> <span className="rk-podium-titles__label">{getTitleCount(p) === 1 ? 'Titulo' : 'Titulos'}</span>
                                            </div>
                                            <small className="rk-podium-achievements">{getAchievementCount(p)} participaciones</small>
                                            <button className="rk-contribute-btn" onClick={(e) => { e.stopPropagation(); handleContribute(p.player); }}>
                                                <FaPencilAlt /> Aportar datos
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            <div className="rk-main">
                                {/* Table */}
                                <div className="rk-table-wrap">
                                    <table className="rk-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Jugador</th>
                                                <th>Equipo</th>
                                                <th>Juego</th>
                                                <th>Región</th>
                                                <th>Titulos</th>
                                                <th>Participaciones</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPlayers.length ? filteredPlayers.map((p, idx) => (
                                                <motion.tr
                                                    key={p.id}
                                                    className={idx < 3 ? 'rk-top3' : idx < 10 ? 'rk-top10' : ''}
                                                    onClick={() => setSelectedPlayer(p)}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: idx * 0.02 }}
                                                    whileHover={{ backgroundColor: 'rgba(var(--primary-rgb), 0.08)' }}
                                                >
                                                    <td>
                                                        <div className="rk-pos">
                                                            <span>#{idx + 1}</span>
                                                            {getTrendIcon(p.trend)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="rk-player-cell">
                                                            <img src={avatarUrl(p.player)} alt={p.player} />
                                                            <div>
                                                                <strong>
                                                                    {p.player}
                                                                    <img 
                                                                        src={`https://flagcdn.com/w20/${(p.country || 'DO').toLowerCase()}.png`} 
                                                                        srcSet={`https://flagcdn.com/w40/${(p.country || 'DO').toLowerCase()}.png 2x`} 
                                                                        width="21" 
                                                                        height="14"
                                                                        alt={p.country || 'DO'} 
                                                                        style={{ marginLeft: '6px', verticalAlign: 'middle', borderRadius: '2px', objectFit: 'cover' }}
                                                                    />
                                                                </strong>
                                                                <small>{p.role}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{p.team}</td>
                                                    <td><span className="rk-game-badge">{p.game}</span></td>
                                                    <td><FaMapMarkerAlt /> {p.region}</td>
                                                    <td className="rk-points"><FaTrophy className="rk-title-icon" /> {getTitleCount(p)}</td>
                                                    <td>{getAchievementCount(p)}</td>
                                                    <td>
                                                        {p.verified && <span className="rk-verified-badge"><FaCheckCircle /></span>}
                                                        <button className="rk-contribute-btn" onClick={(e) => { e.stopPropagation(); handleContribute(p.player); }}>
                                                            <FaPencilAlt /> Aportar datos
                                                        </button>
                                                    </td>
                                                </motion.tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="8" className="rk-empty">No se encontraron jugadores</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Sidebar */}
                                <aside className="rk-sidebar">
                                    {topPlayer && (
                                        <div className="rk-sidebar-card rk-sidebar-card--featured">
                                            <div className="rk-sidebar-card__header">
                                                <FaStar /> Jugador Destacado
                                            </div>
                                            <div className="rk-sidebar-player">
                                                <img src={avatarUrl(topPlayer.player)} alt={topPlayer.player} />
                                                <div>
                                                    <strong>{topPlayer.player}</strong>
                                                    <span>{topPlayer.team}</span>
                                                    <small>{topPlayer.game} · {topPlayer.region}</small>
                                                </div>
                                            </div>
                                            <div className="rk-sidebar-stats">
                                                <div><span>Titulos</span><b>{getTitleCount(topPlayer)}</b></div>
                                                <div><span>Participaciones</span><b>{getAchievementCount(topPlayer)}</b></div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="rk-sidebar-card">
                                        <div className="rk-sidebar-card__header">
                                            <FaChartLine /> Resumen
                                        </div>
                                        <ul className="rk-stats-list">
                                            <li><span>Jugadores</span><b>{filteredPlayers.length}</b></li>
                                            <li><span>Total titulos</span><b>{filteredPlayers.reduce((acc, p) => acc + getTitleCount(p), 0)}</b></li>
                                            <li><span>Participaciones</span><b>{filteredPlayers.reduce((acc, p) => acc + getAchievementCount(p), 0)}</b></li>
                                        </ul>
                                    </div>

                                    <div className="rk-sidebar-card">
                                        <div className="rk-sidebar-card__header">
                                            <FaInfoCircle /> Datos en construccion
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, padding: '0 0.5rem' }}>
                                            Las estadisticas detalladas (victorias, derrotas, winrate) no estan disponibles aun. Usa el boton "Aportar datos" para contribuir informacion verificada.
                                        </p>
                                    </div>
                                </aside>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════ TEAMS TAB ═══════════════════════════ */}
                    {activeTab === 'teams' && (
                        <motion.div
                            key="teams"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="rk-content"
                        >
                            <div className="rk-teams-grid">
                                {filteredTeams.length ? filteredTeams.map((team, idx) => (
                                    <motion.div
                                        key={team.id}
                                        className={`rk-team-card ${idx < 3 ? 'rk-team-card--top' : ''}`}
                                        whileHover={{ y: -6, scale: 1.02 }}
                                        onClick={() => setSelectedTeam(team)}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{ '--team-color': team.color }}
                                    >
                                        {(() => {
                                            const td = getTeamData(team.name);
                                            return (<>
                                        <div className="rk-team-card__rank">#{idx + 1}</div>
                                        <div className="rk-team-card__header">
                                            <img src={teamLogo(team.name)} alt={team.name} />
                                            <div>
                                                <h3>{team.name}</h3>
                                                <span className="rk-team-card__tag">[{team.tag}]</span>
                                            </div>
                                        </div>
                                        <div className="rk-team-card__region">
                                            <FaMapMarkerAlt /> {team.region}
                                        </div>
                                        {td.isUniversity && (
                                            <span className="rk-university-badge"><FaBook /> Universitario</span>
                                        )}
                                        <div className="rk-team-card__games">
                                            {team.games.map(g => (
                                                <span key={g} className="rk-game-badge">{g}</span>
                                            ))}
                                        </div>
                                        <div className="rk-team-card__stats">
                                            {td.members.length > 0 && <div><FaUsers /> {td.members.length} jugador{td.members.length !== 1 ? 'es' : ''}</div>}
                                            <div><FaTrophy style={{ color: '#ffd700' }} /> {td.titles} título{td.titles !== 1 ? 's' : ''}</div>
                                            <div><FaMedal /> {td.achievements.length} logro{td.achievements.length !== 1 ? 's' : ''}</div>
                                            <div><FaCalendarAlt /> {team.founded}</div>
                                        </div>
                                        {td.members.length > 0 && (
                                            <div className="rk-team-card__members">
                                                {td.members.slice(0, 5).map(m => (
                                                    <img key={m.id} src={avatarUrl(m.player)} alt={m.player} title={m.player} />
                                                ))}
                                                {td.members.length > 5 && (
                                                    <span className="rk-team-card__more">+{td.members.length - 5}</span>
                                                )}
                                            </div>
                                        )}
                                        <div className="rk-team-card__footer">
                                            {team.verified && (
                                                <div className="rk-verified-badge"><FaCheckCircle /> Verificado</div>
                                            )}
                                            <button
                                                className="rk-contribute-btn rk-contribute-btn--card"
                                                title="Aportar informacion"
                                                onClick={(e) => { e.stopPropagation(); handleContribute(team.name); }}
                                            >
                                                <FaPencilAlt /> Aportar datos
                                            </button>
                                        </div>
                                            </>);
                                        })()}
                                    </motion.div>
                                )) : (
                                    <div className="rk-empty-full">No se encontraron equipos</div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ═══════════════════════════ TOURNAMENTS TAB ═══════════════════════════ */}
                    {activeTab === 'tournaments' && (
                        <motion.div
                            key="tournaments"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="rk-content"
                        >
                            <div className="rk-tournaments-list">
                                {filteredTournaments.length ? filteredTournaments.map((t, idx) => (
                                    <motion.div
                                        key={t.id}
                                        className={`rk-tournament-card rk-tournament-card--${t.status} ${t.featured ? 'rk-tournament-card--featured' : ''}`}
                                        whileHover={{ x: 4 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <div className="rk-tournament-card__status">
                                            {getStatusLabel(t.status)}
                                        </div>
                                        <div className="rk-tournament-card__main">
                                            <div className="rk-tournament-card__info">
                                                <h3>{t.name}</h3>
                                                <div className="rk-tournament-card__meta">
                                                    <span><FaGamepad /> {t.game}</span>
                                                    <span><FaMapMarkerAlt /> {t.location}</span>
                                                    <span><FaCalendarCheck /> {formatDate(t.startDate)} - {formatDate(t.endDate)}</span>
                                                </div>
                                                <div className="rk-tournament-card__organizer">
                                                    Organiza: <strong>{t.organizer}</strong> · Formato: {t.format}
                                                </div>
                                            </div>
                                            <div className="rk-tournament-card__right">
                                                <div className="rk-tournament-card__prize">
                                                    <FaCoins /> {formatPrize(t.prize, t.currency)}
                                                </div>
                                                <div className="rk-tournament-card__teams">
                                                    <FaUsers /> {t.registeredTeams}/{t.teams} equipos
                                                </div>
                                                {t.champion && (
                                                    <div className="rk-tournament-card__champion">
                                                        <FaCrown /> {t.champion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {(!t.prize || (t.runnerUp && t.runnerUp.includes('No verificado')) || (t.champion && t.champion.includes('No verificado'))) && (
                                            <button
                                                className="rk-contribute-btn"
                                                title="Aportar informacion"
                                                onClick={(e) => { e.stopPropagation(); handleContribute(t.name); }}
                                            >
                                                <FaPencilAlt /> Aportar datos
                                            </button>
                                        )}
                                        <FaChevronRight className="rk-tournament-card__arrow" />
                                    </motion.div>
                                )) : (
                                    <div className="rk-empty-full">No se encontraron torneos</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Player Modal - DETAILED PANEL */}
            <AnimatePresence>
                {selectedPlayer && (
                    <motion.div
                        className="rk-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setSelectedPlayer(null); setPlayerPanelTab('overview'); }}
                    >
                        <motion.div
                            className="rk-modal rk-modal--detailed"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="rk-modal-close" onClick={() => { setSelectedPlayer(null); setPlayerPanelTab('overview'); }}>
                                <FaTimes />
                            </button>

                            {/* Header */}
                            <div className="rk-modal-header rk-modal-header--detailed">
                                <div className="rk-modal-avatar-wrap">
                                    <img src={avatarUrl(selectedPlayer.player)} alt={selectedPlayer.player} />
                                    <div className="rk-modal-rank-badge">
                                        #{filteredPlayers.findIndex(p => p.id === selectedPlayer.id) + 1}
                                    </div>
                                </div>
                                <div className="rk-modal-header-info">
                                    <h2>
                                        {selectedPlayer.player}
                                        <img 
                                            src={`https://flagcdn.com/w40/${(selectedPlayer.country || 'DO').toLowerCase()}.png`}
                                            width="30" 
                                            height="20"
                                            alt={selectedPlayer.country || 'DO'} 
                                            style={{ marginLeft: '10px', verticalAlign: 'baseline', borderRadius: '3px', objectFit: 'cover' }}
                                        />
                                    </h2>
                                    <p className="rk-modal-realname">{selectedPlayer.realName}</p>
                                    <div className="rk-modal-tags">
                                        <span className="rk-game-badge">{selectedPlayer.game}</span>
                                        <span className="rk-role-badge">{selectedPlayer.role}</span>
                                        <span className="rk-team-badge"><FaShieldAlt /> {selectedPlayer.team}</span>
                                    </div>
                                    <div className="rk-modal-social">
                                        <FaAt /> {selectedPlayer.socialMedia}
                                    </div>
                                    {selectedPlayer.bio && (
                                        <p className="rk-modal-bio">{selectedPlayer.bio}</p>
                                    )}
                                </div>
                            </div>

                            {/* Panel Tabs */}
                            <div className="rk-modal-tabs">
                                <button 
                                    className={`rk-modal-tab ${playerPanelTab === 'overview' ? 'rk-modal-tab--active' : ''}`}
                                    onClick={() => setPlayerPanelTab('overview')}
                                >
                                    <FaChartLine /> Estadísticas
                                </button>
                                <button 
                                    className={`rk-modal-tab ${playerPanelTab === 'achievements' ? 'rk-modal-tab--active' : ''}`}
                                    onClick={() => setPlayerPanelTab('achievements')}
                                >
                                    <FaTrophy /> Logros
                                </button>
                                <button 
                                    className={`rk-modal-tab ${playerPanelTab === 'history' ? 'rk-modal-tab--active' : ''}`}
                                    onClick={() => setPlayerPanelTab('history')}
                                >
                                    <FaHistory /> Historial
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="rk-modal-body">
                                {/* OVERVIEW TAB */}
                                {playerPanelTab === 'overview' && (
                                    <motion.div
                                        className="rk-panel-overview"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <div className="rk-panel-stats-grid">
                                            <div className="rk-panel-stat rk-panel-stat--highlight">
                                                <FaTrophy className="rk-panel-stat-icon rk-stat-title" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Titulos</span>
                                                    <strong>{getTitleCount(selectedPlayer)}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaMedal className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Participaciones</span>
                                                    <strong>{getAchievementCount(selectedPlayer)}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaGamepad className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Juego</span>
                                                    <strong>{selectedPlayer.game}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaMapMarkerAlt className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Region</span>
                                                    <strong>{selectedPlayer.region}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaShieldAlt className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Equipo</span>
                                                    <strong>{selectedPlayer.team}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaCheckCircle className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Estado</span>
                                                    <strong>{selectedPlayer.verified ? 'Verificado' : 'Sin verificar'}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {!selectedPlayer.verified && (
                                            <button
                                                className="rk-contribute-btn rk-contribute-btn--card"
                                                style={{ marginTop: '1rem' }}
                                                onClick={() => handleContribute(selectedPlayer.player)}
                                            >
                                                <FaPencilAlt /> Aportar datos de este jugador
                                            </button>
                                        )}

                                        {/* Achievement Summary */}
                                        {selectedPlayer.achievements && (
                                            <div className="rk-panel-achievement-summary">
                                                <h4><FaTrophy /> Resumen de Logros</h4>
                                                <div className="rk-achievement-summary-grid">
                                                    <div className="rk-achievement-summary-card">
                                                        <FaUserAlt />
                                                        <span>Solo</span>
                                                        <strong>{selectedPlayer.achievements.solo?.length || 0}</strong>
                                                    </div>
                                                    <div className="rk-achievement-summary-card">
                                                        <FaUserFriends />
                                                        <span>Duo</span>
                                                        <strong>{selectedPlayer.achievements.duo?.length || 0}</strong>
                                                    </div>
                                                    <div className="rk-achievement-summary-card">
                                                        <FaUsers />
                                                        <span>Equipo</span>
                                                        <strong>{selectedPlayer.achievements.team?.length || 0}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* ACHIEVEMENTS TAB */}
                                {playerPanelTab === 'achievements' && (
                                    <motion.div
                                        className="rk-panel-achievements"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {/* SOLO Achievements */}
                                        <div className="rk-achievement-section">
                                            <h4><FaUserAlt /> Solo</h4>
                                            {selectedPlayer.achievements?.solo?.length > 0 ? (
                                                <div className="rk-achievement-list">
                                                    {selectedPlayer.achievements.solo.map((ach, idx) => (
                                                        <div key={idx} className={`rk-achievement-item rk-place-${ach.place}`}>
                                                            <div className="rk-achievement-medal">
                                                                {ach.place === 1 ? <FaCrown /> : <FaMedal />}
                                                            </div>
                                                            <div className="rk-achievement-info">
                                                                <strong>{ach.name}</strong>
                                                                <span>{formatDate(ach.date)}</span>
                                                            </div>
                                                            <div className="rk-achievement-place">
                                                                #{ach.place}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="rk-no-achievements">Sin logros en solitario aún</p>
                                            )}
                                        </div>

                                        {/* DUO Achievements */}
                                        <div className="rk-achievement-section">
                                            <h4><FaUserFriends /> Duo</h4>
                                            {selectedPlayer.achievements?.duo?.length > 0 ? (
                                                <div className="rk-achievement-list">
                                                    {selectedPlayer.achievements.duo.map((ach, idx) => (
                                                        <div key={idx} className={`rk-achievement-item rk-place-${ach.place}`}>
                                                            <div className="rk-achievement-medal">
                                                                {ach.place === 1 ? <FaCrown /> : <FaMedal />}
                                                            </div>
                                                            <div className="rk-achievement-info">
                                                                <strong>{ach.name}</strong>
                                                                <span>{formatDate(ach.date)}</span>
                                                                {ach.partner && (
                                                                    <small><FaHandshake /> con {ach.partner}</small>
                                                                )}
                                                            </div>
                                                            <div className="rk-achievement-place">
                                                                #{ach.place}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="rk-no-achievements">Sin logros en duo aún</p>
                                            )}
                                        </div>

                                        {/* TEAM Achievements */}
                                        <div className="rk-achievement-section">
                                            <h4><FaUsers /> Equipo</h4>
                                            {selectedPlayer.achievements?.team?.length > 0 ? (
                                                <div className="rk-achievement-list">
                                                    {selectedPlayer.achievements.team.map((ach, idx) => (
                                                        <div key={idx} className={`rk-achievement-item rk-achievement-item--team rk-place-${ach.place}`}>
                                                            <div className="rk-achievement-row">
                                                                <div className="rk-achievement-medal">
                                                                    {ach.place === 1 ? <FaCrown /> : <FaMedal />}
                                                                </div>
                                                                <div className="rk-achievement-info">
                                                                    <strong>{ach.name}</strong>
                                                                    <span>{formatDate(ach.date)}</span>
                                                                    {ach.team && (
                                                                        <small><FaShieldAlt /> {ach.team}</small>
                                                                    )}
                                                                </div>
                                                                <div className="rk-achievement-place">
                                                                    #{ach.place}
                                                                </div>
                                                            </div>
                                                            {ach.roster && ach.roster.length > 0 && (
                                                                <div className="rk-roster">
                                                                    <span className="rk-roster-label"><FaUsers /> Roster</span>
                                                                    <div className="rk-roster-grid">
                                                                        {ach.roster.map((member, mIdx) => (
                                                                            member ? (
                                                                                <div key={mIdx} className={`rk-roster-member ${member === selectedPlayer.player ? 'rk-roster-member--self' : ''}`}>
                                                                                    <div className="rk-roster-avatar">
                                                                                        <img src={avatarUrl(member)} alt={member} />
                                                                                    </div>
                                                                                    <span>{member}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div key={mIdx} className="rk-roster-member rk-roster-member--empty">
                                                                                    <div className="rk-roster-avatar rk-roster-avatar--empty">
                                                                                        <FaPlus />
                                                                                    </div>
                                                                                    <span>Por verificar</span>
                                                                                </div>
                                                                            )
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="rk-no-achievements">Sin logros de equipo aún</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* MATCH HISTORY TAB */}
                                {playerPanelTab === 'history' && (
                                    <motion.div
                                        className="rk-panel-history"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h4><GiSwordsEmblem /> Historial de Partidas</h4>
                                        {selectedPlayer.matchHistory?.length > 0 ? (
                                            <div className="rk-match-history-list">
                                                {selectedPlayer.matchHistory.map((match, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`rk-match-item rk-match-${match.result}`}
                                                    >
                                                        <div className="rk-match-date">
                                                            <FaCalendarAlt />
                                                            <span>{formatDate(match.date)}</span>
                                                        </div>
                                                        <div className="rk-match-vs">
                                                            <strong>vs</strong>
                                                            <div className="rk-match-opponent">
                                                                <img src={avatarUrl(match.opponent)} alt={match.opponent} />
                                                                <div>
                                                                    <span className="rk-opponent-name">{match.opponent}</span>
                                                                    <small>{match.opponentTeam}</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="rk-match-result">
                                                            <span className={`rk-result-badge rk-result-${match.result}`}>
                                                                {match.result === 'win' ? 'VICTORIA' : 'DERROTA'}
                                                            </span>
                                                            <span className="rk-match-score">{match.score}</span>
                                                        </div>
                                                        <div className="rk-match-meta">
                                                            <span className="rk-match-tournament">{match.tournament}</span>
                                                            <span className={`rk-match-mode rk-mode-${match.mode}`}>
                                                                {match.mode === 'solo' && <FaUserAlt />}
                                                                {match.mode === 'duo' && <FaUserFriends />}
                                                                {match.mode === 'team' && <FaUsers />}
                                                                {match.mode}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="rk-no-history">No hay historial de partidas disponible</p>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Team Modal */}
            <AnimatePresence>
                {selectedTeam && (
                    <motion.div
                        className="rk-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedTeam(null)}
                    >
                        <motion.div
                            className="rk-modal"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="rk-modal-close" onClick={() => setSelectedTeam(null)}>
                                <FaTimes />
                            </button>
                            {(() => {
                                const td = getTeamData(selectedTeam.name);
                                return (<>
                            <div className="rk-modal-header">
                                <img src={teamLogo(selectedTeam.name)} alt={selectedTeam.name} />
                                <div>
                                    <h3>{selectedTeam.name}</h3>
                                    <p>[{selectedTeam.tag}]</p>
                                    <span>{selectedTeam.region} · Fundado en {selectedTeam.founded}</span>
                                </div>
                            </div>
                            {td.isUniversity && (
                                <span className="rk-university-badge" style={{ marginBottom: '8px' }}><FaBook /> Equipo Universitario</span>
                            )}
                            <div className="rk-modal-games">
                                {selectedTeam.games.map(g => (
                                    <span key={g} className="rk-game-badge">{g}</span>
                                ))}
                            </div>
                            <div className="rk-modal-stats">
                                <div><span>Jugadores</span><b>{td.members.length}</b></div>
                                <div><span>Títulos</span><b style={{ color: '#ffd700' }}>{td.titles}</b></div>
                                <div><span>Logros</span><b>{td.achievements.length}</b></div>
                                <div><span>Fundado</span><b>{selectedTeam.founded}</b></div>
                            </div>

                            {/* Bandits Gaming Extra Info */}
                            {selectedTeam.name === "Bandits Gaming" && (
                                <div className="rk-team-modal-section rk-bandits-extra">
                                    {/* playersHistory */}
                                    {selectedTeam.playersHistory && selectedTeam.playersHistory.length > 0 && (
                                        <div className="rk-bandits-history">
                                            <h4><FaUsers /> Historial de Jugadores</h4>
                                            <ul>
                                                {selectedTeam.playersHistory.map((ph, idx) => (
                                                    <li key={idx}>
                                                        <strong>{ph.name}</strong> <span style={{ fontSize: '0.9em', color: '#888' }}>({ph.realName})</span> — <span>{ph.game}</span> <span style={{ fontSize: '0.9em', color: '#888' }}>[{ph.period}]</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {/* smashBrosNote */}
                                    {selectedTeam.smashBrosNote && (
                                        <div className="rk-bandits-smash">
                                            <h4><FaGamepad /> Smash Bros</h4>
                                            <p>{selectedTeam.smashBrosNote}</p>
                                        </div>
                                    )}
                                    {/* blinkEsportsListed */}
                                    {selectedTeam.blinkEsportsListed && selectedTeam.blinkEsportsListed.length > 0 && (
                                        <div className="rk-bandits-blink">
                                            <h4><FaBook /> Jugadores en Blink Esports</h4>
                                            <ul>
                                                {selectedTeam.blinkEsportsListed.map((player, idx) => (
                                                    <li key={idx}>{player}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Team Members */}
                            {td.members.length > 0 && (
                                <div className="rk-team-modal-section">
                                    <h4><FaUsers /> Miembros ({td.members.length})</h4>
                                    <div className="rk-team-members-grid">
                                        {td.members.map(m => (
                                            <div key={m.id} className="rk-team-member-card" onClick={(e) => { e.stopPropagation(); setSelectedTeam(null); setSelectedPlayer(m); setPlayerPanelTab('overview'); }}>
                                                <img src={avatarUrl(m.player)} alt={m.player} />
                                                <div>
                                                    <strong>{m.player}</strong>
                                                    <small>
                                                        {m.role} · {m.game}
                                                        {(() => {
                                                            const th = m.teamHistory?.find(t => t.team === selectedTeam.name);
                                                            if (th) {
                                                                return (
                                                                    <span style={{ 
                                                                        display: 'block', 
                                                                        marginTop: '2px', 
                                                                        color: th.to === 'Presente' ? 'var(--primary-color)' : '#9CA3AF' 
                                                                    }}>
                                                                        {th.from} — {th.to}
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </small>
                                                </div>
                                                <span className="rk-team-member-titles">
                                                    <FaTrophy /> {getTitleCount(m)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Team Achievements */}
                            {td.achievements.length > 0 && (
                                <div className="rk-team-modal-section">
                                    <h4><FaTrophy /> Logros del Equipo ({td.achievements.length})</h4>
                                    <div className="rk-achievement-list">
                                        {td.achievements.map((ach, idx) => (
                                            <div key={idx} className={`rk-achievement-item rk-place-${ach.place}`}>
                                                <div className="rk-achievement-medal">
                                                    {ach.place === 1 ? <FaCrown /> : <FaMedal />}
                                                </div>
                                                <div className="rk-achievement-info">
                                                    <strong>{ach.name}</strong>
                                                    <span>{formatDate(ach.date)}</span>
                                                </div>
                                                <div className="rk-achievement-place">
                                                    {ach.place ? `#${ach.place}` : '—'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {td.members.length === 0 && td.achievements.length === 0 && (
                                <div className="rk-team-modal-empty">
                                    <FaInfoCircle />
                                    <p>No hay datos registrados aún para este equipo.</p>
                                    <button className="rk-contribute-btn" onClick={() => { setSelectedTeam(null); handleContribute(selectedTeam.name); }}>
                                        <FaPencilAlt /> Aportar datos
                                    </button>
                                </div>
                            )}
                                </>);
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Modal (Enviar Mi Logro) */}
            <AnimatePresence>
                {isAchievementModalOpen && (
                    <motion.div
                        className="rk-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeAchievementModal}
                    >
                        <motion.div
                            className="rk-modal rk-modal--achievement"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="rk-modal-close" onClick={closeAchievementModal} disabled={isSubmitting}>
                                <FaTimes />
                            </button>

                            <div className="rk-achievement-header">
                                <div className="rk-achievement-icon"><FaTrophy /></div>
                                <h3>Enviar Mi Logro</h3>
                                <p>Comparte tus victorias en torneos para aparecer en el ranking</p>
                            </div>

                            <form onSubmit={handleSubmitAchievement} className="rk-achievement-form">
                                <div className="rk-form-group">
                                    <label><FaGamepad /> Juego</label>
                                    <select
                                        value={achievementData.game}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, game: e.target.value }))}
                                        disabled={isSubmitting}
                                        required
                                    >
                                        <option value="">Selecciona un juego</option>
                                        {SUPPORTED_GAMES.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="rk-form-group">
                                    <label><FaUsers /> Modo de Competicion</label>
                                    <div className="rk-mode-selector">
                                        {[
                                            { id: 'solo', label: 'Solo', icon: FaUserAlt },
                                            { id: 'duo', label: 'Duo', icon: FaUserFriends },
                                            { id: 'team', label: 'Equipo', icon: FaUsers },
                                        ].map(mode => (
                                            <button
                                                key={mode.id}
                                                type="button"
                                                className={`rk-mode-btn ${achievementData.mode === mode.id ? 'rk-mode-btn--active' : ''}`}
                                                onClick={() => setAchievementData(prev => ({ ...prev, mode: mode.id }))}
                                                disabled={isSubmitting}
                                            >
                                                <mode.icon />
                                                <span>{mode.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="rk-form-row">
                                    <div className="rk-form-group">
                                        <label><FaMedal /> Nombre del Torneo</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Copa Nacional MLBB 2025"
                                            value={achievementData.tournamentName}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentName: e.target.value }))}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="rk-form-group rk-form-group--small">
                                        <label><FaCalendarAlt /> Fecha</label>
                                        <input
                                            type="date"
                                            value={achievementData.tournamentDate}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, tournamentDate: e.target.value }))}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="rk-form-row">
                                    <div className="rk-form-group rk-form-group--small">
                                        <label><FaCrown /> Posicion</label>
                                        <select
                                            value={achievementData.placement}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, placement: parseInt(e.target.value) }))}
                                            disabled={isSubmitting}
                                        >
                                            <option value={1}>1er Lugar</option>
                                            <option value={2}>2do Lugar</option>
                                            <option value={3}>3er Lugar</option>
                                            <option value={4}>4to Lugar</option>
                                            <option value={5}>Top 5</option>
                                            <option value={8}>Top 8</option>
                                            <option value={10}>Top 10</option>
                                            <option value={16}>Top 16</option>
                                        </select>
                                    </div>

                                    {achievementData.mode === 'team' && (
                                        <div className="rk-form-group">
                                            <label><FaShieldAlt /> Nombre del Equipo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Hispaniola Esports"
                                                value={achievementData.teamName}
                                                onChange={(e) => setAchievementData(prev => ({ ...prev, teamName: e.target.value }))}
                                                disabled={isSubmitting}
                                                required={achievementData.mode === 'team'}
                                            />
                                        </div>
                                    )}

                                    {achievementData.mode === 'duo' && (
                                        <div className="rk-form-group">
                                            <label><FaUserFriends /> Companero de Duo</label>
                                            <input
                                                type="text"
                                                placeholder="Nombre o IGN del companero"
                                                value={achievementData.partnerName}
                                                onChange={(e) => setAchievementData(prev => ({ ...prev, partnerName: e.target.value }))}
                                                disabled={isSubmitting}
                                                required={achievementData.mode === 'duo'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="rk-form-group">
                                    <label><FaBook /> Descripcion (opcional)</label>
                                    <textarea
                                        placeholder="Formato del torneo, numero de participantes, etc."
                                        value={achievementData.description}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, description: e.target.value }))}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                <div className="rk-form-group">
                                    <label><FaImage /> Pruebas de Victoria (max. 5 imagenes)</label>
                                    <div className="rk-proof-upload">
                                        <input
                                            ref={achievementFileRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleAchievementFileSelect}
                                            disabled={isSubmitting || achievementData.proofFiles.length >= 5}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="rk-proof-grid">
                                            {achievementData.proofFiles.map((file, index) => (
                                                <div key={index} className="rk-proof-item">
                                                    <img src={file.preview} alt={`Prueba ${index + 1}`} />
                                                    <button
                                                        type="button"
                                                        className="rk-proof-remove"
                                                        onClick={() => removeAchievementFile(index)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            {achievementData.proofFiles.length < 5 && (
                                                <button
                                                    type="button"
                                                    className="rk-proof-add"
                                                    onClick={() => achievementFileRef.current?.click()}
                                                    disabled={isSubmitting}
                                                >
                                                    <FaCloudUploadAlt />
                                                    <span>Subir</span>
                                                </button>
                                            )}
                                        </div>
                                        <p className="rk-proof-hint">
                                            Capturas del scoreboard, bracket, certificado o cualquier imagen que demuestre tu victoria.
                                        </p>
                                    </div>
                                </div>

                                <div className="rk-achievement-footer">
                                    <button
                                        type="button"
                                        className="rk-achievement-btn rk-achievement-btn--ghost"
                                        onClick={closeAchievementModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="rk-achievement-btn rk-achievement-btn--primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className='bx bx-loader-alt spin' />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Enviar Logro
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contribute Data Modal */}
            <AnimatePresence>
                {isContributeModalOpen && (
                    <motion.div
                        className="rk-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeContributeModal}
                    >
                        <motion.div
                            className="rk-modal rk-modal--achievement"
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="rk-modal-close" onClick={closeContributeModal} disabled={isSubmitting}>
                                <FaTimes />
                            </button>

                            <div className="rk-achievement-header">
                                <div className="rk-achievement-icon"><FaPencilAlt /></div>
                                <h3>Aportar Datos</h3>
                                <p>Ayuda a completar la informacion de la escena esports dominicana</p>
                            </div>

                            <form onSubmit={handleSubmitContribute} className="rk-achievement-form">
                                {/* Player / Team */}
                                <div className="rk-form-group">
                                    <label><FaUserAlt /> Jugador o Equipo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: MenaRD, ISKRA, Bot Academy..."
                                        value={contributeData.playerOrTeam}
                                        onChange={(e) => setContributeData(prev => ({ ...prev, playerOrTeam: e.target.value }))}
                                        disabled={isSubmitting}
                                        required
                                    />
                                </div>

                                {/* Game */}
                                <div className="rk-form-group">
                                    <label><FaGamepad /> Juego / Disciplina</label>
                                    <select
                                        value={contributeData.game}
                                        onChange={(e) => setContributeData(prev => ({ ...prev, game: e.target.value }))}
                                        disabled={isSubmitting}
                                    >
                                        <option value="">Selecciona (opcional)</option>
                                        {SUPPORTED_GAMES.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>

                                {/* Tournament + Date */}
                                <div className="rk-form-row">
                                    <div className="rk-form-group">
                                        <label><FaMedal /> Torneo / Evento</label>
                                        <input
                                            type="text"
                                            placeholder="Ej: Copa Popular 2025, Blink Respawn..."
                                            value={contributeData.tournamentName}
                                            onChange={(e) => setContributeData(prev => ({ ...prev, tournamentName: e.target.value }))}
                                            disabled={isSubmitting}
                                            required
                                        />
                                    </div>
                                    <div className="rk-form-group rk-form-group--small">
                                        <label><FaCalendarAlt /> Fecha</label>
                                        <input
                                            type="date"
                                            value={contributeData.tournamentDate}
                                            onChange={(e) => setContributeData(prev => ({ ...prev, tournamentDate: e.target.value }))}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {/* Result */}
                                <div className="rk-form-group">
                                    <label><FaCrown /> Resultado / Posicion</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Campeon, 2do lugar, Top 8, Representante RD..."
                                        value={contributeData.result}
                                        onChange={(e) => setContributeData(prev => ({ ...prev, result: e.target.value }))}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Source / Link */}
                                <div className="rk-form-group">
                                    <label><FaGlobeAmericas /> Fuente o Enlace de Verificacion</label>
                                    <input
                                        type="text"
                                        placeholder="Link de noticia, post de redes, bracket, VOD..."
                                        value={contributeData.source}
                                        onChange={(e) => setContributeData(prev => ({ ...prev, source: e.target.value }))}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Description */}
                                <div className="rk-form-group">
                                    <label><FaBook /> Descripcion de los Datos</label>
                                    <textarea
                                        placeholder="Describe la informacion que quieres aportar: estadisticas, resultados, miembros del equipo, premios, etc."
                                        value={contributeData.description}
                                        onChange={(e) => setContributeData(prev => ({ ...prev, description: e.target.value }))}
                                        disabled={isSubmitting}
                                        rows={4}
                                        required
                                    />
                                </div>

                                {/* Proof Images */}
                                <div className="rk-form-group">
                                    <label><FaImage /> Imagenes de Prueba (max. 5)</label>
                                    <div className="rk-proof-upload">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
                                            disabled={isSubmitting || contributeData.proofFiles.length >= 5}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="rk-proof-grid">
                                            {contributeData.proofFiles.map((file, index) => (
                                                <div key={index} className="rk-proof-item">
                                                    <img src={file.preview} alt={`Prueba ${index + 1}`} />
                                                    <button
                                                        type="button"
                                                        className="rk-proof-remove"
                                                        onClick={() => removeProofFile(index)}
                                                        disabled={isSubmitting}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            ))}
                                            {contributeData.proofFiles.length < 5 && (
                                                <button
                                                    type="button"
                                                    className="rk-proof-add"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isSubmitting}
                                                >
                                                    <FaCloudUploadAlt />
                                                    <span>Subir</span>
                                                </button>
                                            )}
                                        </div>
                                        <p className="rk-proof-hint">
                                            Capturas del bracket, scoreboard, post oficial, certificado o cualquier prueba.
                                        </p>
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="rk-achievement-footer">
                                    <button
                                        type="button"
                                        className="rk-achievement-btn rk-achievement-btn--ghost"
                                        onClick={closeContributeModal}
                                        disabled={isSubmitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="rk-achievement-btn rk-achievement-btn--primary"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <i className='bx bx-loader-alt spin' />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <FaCheckCircle />
                                                Enviar Datos
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
