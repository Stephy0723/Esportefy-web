import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaTrophy, FaUsers, FaCalendarAlt, FaMedal, FaFire, FaChartLine,
    FaGamepad, FaMapMarkerAlt, FaCrown, FaSearch, FaTimes, FaStar,
    FaArrowUp, FaArrowDown, FaMinus, FaChevronRight, FaGlobeAmericas,
    FaUserAlt, FaShieldAlt, FaCoins, FaCalendarCheck, FaFlag,
    FaHistory, FaHandshake, FaUserFriends, FaTwitter, FaInstagram, FaAt,
    FaCloudUploadAlt, FaTrash, FaImage, FaBook, FaPlus, FaCheckCircle
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
    { id: 'mlbb', name: 'Mobile Legends', short: 'MLBB' },
    { id: 'valorant', name: 'Valorant', short: 'Valorant' },
    { id: 'lol', name: 'League of Legends', short: 'LoL' },
];

const RANKINGS_VISIBLE_GAMES = new Set([
    'Mobile Legends',
    'Mobile Legends: Bang Bang',
    'MLBB',
    'Valorant',
    'League of Legends',
    'LoL',
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

// Tab definitions
const TABS = [
    { id: 'players', label: 'Jugadores', icon: FaUserAlt },
    { id: 'teams', label: 'Equipos', icon: FaShieldAlt },
    { id: 'tournaments', label: 'Torneos', icon: FaTrophy },
];

export default function Rankings() {
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState('players');
    const [game, setGame] = useState('Todos');
    const [region, setRegion] = useState('Todas');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [tournamentFilter, setTournamentFilter] = useState('Todos');
    const [playerPanelTab, setPlayerPanelTab] = useState('overview');

    // Achievement Modal States
    const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [achievementData, setAchievementData] = useState({
        game: '',
        mode: 'team',
        tournamentName: '',
        tournamentDate: '',
        placement: 1,
        teamName: '',
        partnerName: '',
        description: '',
        proofFiles: []
    });

    // Show toast
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
    };

    // Handle file selection for achievements
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            const isImage = file.type.startsWith('image/');
            const isValidSize = file.size <= 10 * 1024 * 1024;
            return isImage && isValidSize;
        });

        if (validFiles.length !== files.length) {
            showToast('Algunos archivos fueron ignorados (solo imágenes de hasta 10MB)', 'error');
        }

        const newFiles = validFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));

        setAchievementData(prev => ({
            ...prev,
            proofFiles: [...prev.proofFiles, ...newFiles].slice(0, 5)
        }));
    };

    // Remove proof file
    const removeProofFile = (index) => {
        setAchievementData(prev => ({
            ...prev,
            proofFiles: prev.proofFiles.filter((_, i) => i !== index)
        }));
    };

    // Handle achievement submission
    const handleSubmitAchievement = async (e) => {
        e.preventDefault();

        if (!achievementData.game) {
            showToast('Selecciona un juego', 'error');
            return;
        }
        if (!achievementData.tournamentName.trim()) {
            showToast('Escribe el nombre del torneo', 'error');
            return;
        }
        if (!achievementData.tournamentDate) {
            showToast('Selecciona la fecha del torneo', 'error');
            return;
        }
        if (achievementData.proofFiles.length === 0) {
            showToast('Sube al menos una prueba de tu victoria', 'error');
            return;
        }
        if (achievementData.mode === 'duo' && !achievementData.partnerName.trim()) {
            showToast('Escribe el nombre de tu compañero de duo', 'error');
            return;
        }
        if (achievementData.mode === 'team' && !achievementData.teamName.trim()) {
            showToast('Escribe el nombre de tu equipo', 'error');
            return;
        }

        setIsSubmitting(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setIsSubmitting(false);
        setAchievementData({
            game: '',
            mode: 'team',
            tournamentName: '',
            tournamentDate: '',
            placement: 1,
            teamName: '',
            partnerName: '',
            description: '',
            proofFiles: []
        });
        setIsAchievementModalOpen(false);
        showToast('🏆 ¡Logro enviado! Nuestro equipo lo revisará en 24-48 horas.');
    };

    // Close achievement modal
    const closeAchievementModal = () => {
        if (!isSubmitting) {
            setIsAchievementModalOpen(false);
            setAchievementData({
                game: '',
                mode: 'team',
                tournamentName: '',
                tournamentDate: '',
                placement: 1,
                teamName: '',
                partnerName: '',
                description: '',
                proofFiles: []
            });
        }
    };

    // ═══════════════════════════════════════════════════════════
    // PLAYERS TAB
    // ═══════════════════════════════════════════════════════════
    const filteredPlayers = useMemo(() => {
        let rows = [...PLAYERS_DATA].filter((player) => RANKINGS_VISIBLE_GAMES.has(player.game));

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

        return rows.sort((a, b) => b.points - a.points);
    }, [game, region, searchTerm]);

    const podiumPlayers = filteredPlayers.slice(0, 3);
    const topPlayer = filteredPlayers[0];
    const hotStreak = useMemo(() => {
        if (!filteredPlayers.length) return null;
        return [...filteredPlayers].sort((a, b) => b.streak - a.streak)[0];
    }, [filteredPlayers]);

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

        return rows.sort((a, b) => b.points - a.points);
    }, [game, region, searchTerm]);

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
        totalPrize: filteredTournaments.reduce((acc, t) => acc + t.prize, 0),
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
                            <FaPlus />
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
                                            <strong>{p.points.toLocaleString()} pts</strong>
                                            <div className="rk-podium-stats">
                                                <span>{p.wins}W</span>
                                                <span>{p.losses}L</span>
                                                <span>{getWinRate(p.wins, p.losses)}%</span>
                                            </div>
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
                                                <th>Puntos</th>
                                                <th>Win Rate</th>
                                                <th>Racha</th>
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
                                                                <strong>{p.player}</strong>
                                                                <small>{p.role}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{p.team}</td>
                                                    <td><span className="rk-game-badge">{p.game}</span></td>
                                                    <td><FaMapMarkerAlt /> {p.region}</td>
                                                    <td className="rk-points">{p.points.toLocaleString()}</td>
                                                    <td>{getWinRate(p.wins, p.losses)}%</td>
                                                    <td>
                                                        {p.streak > 0 && (
                                                            <span className="rk-streak-badge">
                                                                <FaFire /> {p.streak}
                                                            </span>
                                                        )}
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
                                                <FaStar /> Jugador #1
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
                                                <div><span>Puntos</span><b>{topPlayer.points.toLocaleString()}</b></div>
                                                <div><span>Win Rate</span><b>{getWinRate(topPlayer.wins, topPlayer.losses)}%</b></div>
                                            </div>
                                        </div>
                                    )}

                                    {hotStreak && (
                                        <div className="rk-sidebar-card">
                                            <div className="rk-sidebar-card__header">
                                                <FaFire /> Mayor Racha
                                            </div>
                                            <div className="rk-sidebar-player">
                                                <img src={avatarUrl(hotStreak.player)} alt={hotStreak.player} />
                                                <div>
                                                    <strong>{hotStreak.player}</strong>
                                                    <span className="rk-hot-streak">{hotStreak.streak} victorias seguidas</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="rk-sidebar-card">
                                        <div className="rk-sidebar-card__header">
                                            <FaChartLine /> Estadísticas
                                        </div>
                                        <ul className="rk-stats-list">
                                            <li><span>Jugadores filtrados</span><b>{filteredPlayers.length}</b></li>
                                            <li><span>Promedio puntos</span><b>{filteredPlayers.length ? Math.round(filteredPlayers.reduce((a, b) => a + b.points, 0) / filteredPlayers.length).toLocaleString() : 0}</b></li>
                                            <li><span>Mejor WR</span><b>{filteredPlayers.length ? `${Math.max(...filteredPlayers.map(p => getWinRate(p.wins, p.losses)))}%` : '0%'}</b></li>
                                        </ul>
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
                                        <div className="rk-team-card__games">
                                            {team.games.map(g => (
                                                <span key={g} className="rk-game-badge">{g}</span>
                                            ))}
                                        </div>
                                        <div className="rk-team-card__stats">
                                            <div><FaUsers /> {team.players}</div>
                                            <div><FaTrophy /> {team.trophies}</div>
                                            <div><FaChartLine /> {team.winRate}%</div>
                                        </div>
                                        <div className="rk-team-card__points">
                                            {team.points.toLocaleString()} pts
                                        </div>
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
                                    <h2>{selectedPlayer.player}</h2>
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
                                            <div className="rk-panel-stat">
                                                <FaStar className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Puntos Ranking</span>
                                                    <strong>{selectedPlayer.points.toLocaleString()}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaTrophy className="rk-panel-stat-icon rk-stat-win" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Victorias</span>
                                                    <strong>{selectedPlayer.wins}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaTimes className="rk-panel-stat-icon rk-stat-loss" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Derrotas</span>
                                                    <strong>{selectedPlayer.losses}</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaChartLine className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Win Rate</span>
                                                    <strong>{getWinRate(selectedPlayer.wins, selectedPlayer.losses)}%</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaFire className="rk-panel-stat-icon rk-stat-streak" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Racha Actual</span>
                                                    <strong>{selectedPlayer.streak}W</strong>
                                                </div>
                                            </div>
                                            <div className="rk-panel-stat">
                                                <FaMapMarkerAlt className="rk-panel-stat-icon" />
                                                <div className="rk-panel-stat-content">
                                                    <span>Región</span>
                                                    <strong>{selectedPlayer.region}</strong>
                                                </div>
                                            </div>
                                        </div>

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
                                                        <div key={idx} className={`rk-achievement-item rk-place-${ach.place}`}>
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
                            <div className="rk-modal-header">
                                <img src={teamLogo(selectedTeam.name)} alt={selectedTeam.name} />
                                <div>
                                    <h3>{selectedTeam.name}</h3>
                                    <p>[{selectedTeam.tag}]</p>
                                    <span>{selectedTeam.region} · Fundado en {selectedTeam.founded}</span>
                                </div>
                            </div>
                            <div className="rk-modal-games">
                                {selectedTeam.games.map(g => (
                                    <span key={g} className="rk-game-badge">{g}</span>
                                ))}
                            </div>
                            <div className="rk-modal-stats">
                                <div><span>Puntos</span><b>{selectedTeam.points.toLocaleString()}</b></div>
                                <div><span>Jugadores</span><b>{selectedTeam.players}</b></div>
                                <div><span>Trofeos</span><b>{selectedTeam.trophies}</b></div>
                                <div><span>Win Rate</span><b>{selectedTeam.winRate}%</b></div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievement Submission Modal */}
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
                            <button 
                                className="rk-modal-close"
                                onClick={closeAchievementModal}
                                disabled={isSubmitting}
                            >
                                <FaTimes />
                            </button>

                            <div className="rk-achievement-header">
                                <div className="rk-achievement-icon">
                                    <FaTrophy />
                                </div>
                                <h3>Enviar Mi Logro</h3>
                                <p>Comparte tus victorias en torneos para aparecer en el ranking</p>
                            </div>

                            <form onSubmit={handleSubmitAchievement} className="rk-achievement-form">
                                {/* Game Selection */}
                                <div className="rk-form-group">
                                    <label><FaGamepad /> Juego</label>
                                    <select 
                                        value={achievementData.game}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, game: e.target.value }))}
                                        disabled={isSubmitting}
                                        required
                                    >
                                        <option value="">Selecciona un juego</option>
                                        {SUPPORTED_GAMES.map(game => (
                                            <option key={game.id} value={game.id}>{game.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mode Selection */}
                                <div className="rk-form-group">
                                    <label><FaUsers /> Modo de Competición</label>
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

                                {/* Tournament Info Row */}
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

                                {/* Placement Row */}
                                <div className="rk-form-row">
                                    <div className="rk-form-group rk-form-group--small">
                                        <label><FaCrown /> Posición</label>
                                        <select 
                                            value={achievementData.placement}
                                            onChange={(e) => setAchievementData(prev => ({ ...prev, placement: parseInt(e.target.value) }))}
                                            disabled={isSubmitting}
                                        >
                                            <option value={1}>🥇 1er Lugar</option>
                                            <option value={2}>🥈 2do Lugar</option>
                                            <option value={3}>🥉 3er Lugar</option>
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
                                            <label><FaUserFriends /> Compañero de Duo</label>
                                            <input 
                                                type="text"
                                                placeholder="Nombre o IGN del compañero"
                                                value={achievementData.partnerName}
                                                onChange={(e) => setAchievementData(prev => ({ ...prev, partnerName: e.target.value }))}
                                                disabled={isSubmitting}
                                                required={achievementData.mode === 'duo'}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="rk-form-group">
                                    <label><FaBook /> Descripción (opcional)</label>
                                    <textarea
                                        placeholder="Cuéntanos más sobre este logro, formato del torneo, número de participantes, etc."
                                        value={achievementData.description}
                                        onChange={(e) => setAchievementData(prev => ({ ...prev, description: e.target.value }))}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                {/* Proof Upload */}
                                <div className="rk-form-group">
                                    <label><FaImage /> Pruebas de Victoria (máx. 5 imágenes)</label>
                                    <div className="rk-proof-upload">
                                        <input 
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileSelect}
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
                                                        onClick={() => removeProofFile(index)}
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
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isSubmitting}
                                                >
                                                    <FaCloudUploadAlt />
                                                    <span>Subir</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        <p className="rk-proof-hint">
                                            Sube capturas del scoreboard, bracket, certificado o cualquier imagen que demuestre tu victoria.
                                        </p>
                                    </div>
                                </div>

                                {/* Submit */}
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
        </div>
    );
}
