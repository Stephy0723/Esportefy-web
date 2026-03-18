import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import {
    FaUserEdit, FaGamepad, FaTrophy, FaShareAlt, FaCheck,
    FaChevronRight, FaFire, FaFlag,
    FaShieldAlt, FaUsers, FaCrown, FaTwitch, FaYoutube,
    FaTwitter, FaInstagram, FaTiktok, FaDiscord, FaStar,
    FaCalendarAlt, FaChartLine, FaHeart, FaComment, FaPaperPlane,
    FaUserPlus, FaUserFriends, FaGem, FaGlobe,
    FaRegHeart, FaRegComment, FaTimes, FaLink, FaSteam, FaBolt,
    FaMedal, FaAward, FaLayerGroup, FaEnvelope, FaExternalLinkAlt, FaDownload, FaTrash, FaReply,
    FaEllipsisH, FaPoll, FaExclamationTriangle, FaCopy, FaPlus, FaMinus
} from 'react-icons/fa';
import { SiRiotgames } from 'react-icons/si';
import { GAME_IMAGES } from '../../../data/gameImages';
import { COMMUNITY_GAMES } from '../../../data/communityData';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { STATUS_LIST } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import './Profile.css';

const EMPTY_PROFILE_OVERVIEW = {
    stats: {
        matches: 0,
        wins: 0,
        winRate: 0,
        tournaments: 0,
        tournamentsWon: 0,
        mvps: 0,
        teams: 0,
        ongoing: 0
    },
    achievements: [],
    recognitions: [],
    friends: [],
    communities: [],
    activity: [],
    wallComments: [],
    flags: {
        hasVerifiedGameAccount: false,
        hasUniversityVerification: false,
        hasOnlineTeammates: false
    }
};

const normalizeProfileOverview = (payload = {}) => ({
    ...EMPTY_PROFILE_OVERVIEW,
    ...payload,
    stats: {
        ...EMPTY_PROFILE_OVERVIEW.stats,
        ...(payload?.stats || {})
    },
    achievements: Array.isArray(payload?.achievements) ? payload.achievements : [],
    recognitions: Array.isArray(payload?.recognitions) ? payload.recognitions : [],
    friends: Array.isArray(payload?.friends) ? payload.friends : [],
    communities: Array.isArray(payload?.communities) ? payload.communities : [],
    activity: Array.isArray(payload?.activity) ? payload.activity : [],
    wallComments: Array.isArray(payload?.wallComments) ? payload.wallComments : [],
    flags: {
        ...EMPTY_PROFILE_OVERVIEW.flags,
        ...(payload?.flags || {})
    }
});

const normalizePresenceTone = (status = '') => {
    const normalized = String(status || '').trim().toLowerCase();
    if (['online', 'gaming', 'tournament', 'streaming', 'searching'].includes(normalized)) return 'online';
    if (['afk', 'dnd'].includes(normalized)) return 'away';
    return 'offline';
};

const ACTIVITY_VARIANTS = {
    win: { icon: FaTrophy, tone: 'win' },
    team: { icon: FaShieldAlt, tone: 'team' },
    achievement: { icon: FaMedal, tone: 'win' },
    rank: { icon: FaBolt, tone: 'rank' }
};

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
const Profile = () => {
    const [user, setUser] = useState(null);
    const [profileOverview, setProfileOverview] = useState(EMPTY_PROFILE_OVERVIEW);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [commentMenu, setCommentMenu] = useState(null);
    const [showPollForm, setShowPollForm] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [isOwnProfile] = useState(true);
    const [showTeamsModal, setShowTeamsModal] = useState(false);
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [showGamesModal, setShowGamesModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedFriend, setSelectedFriend] = useState(null);
    const [selectedFriendLoading, setSelectedFriendLoading] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = getAuthToken();
                if (!token) { navigate('/login'); return; }
                const [profileResult, overviewResult] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/auth/profile`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`${API_URL}/api/auth/profile/overview`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                if (profileResult.status !== 'fulfilled') {
                    throw profileResult.reason;
                }

                setUser(profileResult.value.data);

                if (overviewResult.status === 'fulfilled') {
                    const nextOverview = normalizeProfileOverview(overviewResult.value.data);
                    setProfileOverview(nextOverview);
                    setComments(nextOverview.wallComments);
                } else {
                    setProfileOverview(EMPTY_PROFILE_OVERVIEW);
                    setComments([]);
                }
            } catch (err) {
                setError("No se pudo cargar el perfil.");
                if (err.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchUserProfile();
    }, [navigate]);

    const handleShareProfile = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    // Time formatting helper
    const formatTime = (timestamp) => {
        const parsedDate = new Date(timestamp);
        if (Number.isNaN(parsedDate.getTime())) return '';
        const diff = Date.now() - parsedDate.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return parsedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const comment = {
            id: Date.now(),
            user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: newComment,
            time: Date.now(),
            likes: 0,
            liked: false,
            replies: []
        };
        setComments([comment, ...comments]);
        setNewComment('');
    };

    const handleSubmitReply = (commentId) => {
        if (!replyText.trim()) return;
        const reply = {
            id: Date.now(),
            user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: replyText,
            time: Date.now(),
            likes: 0,
            liked: false
        };
        setComments(comments.map(c => 
            c.id === commentId 
                ? { ...c, replies: [...(c.replies || []), reply] }
                : c
        ));
        setReplyText('');
        setReplyingTo(null);
    };

    const deleteComment = (commentId, parentId = null) => {
        if (parentId) {
            setComments(comments.map(c => 
                c.id === parentId 
                    ? { ...c, replies: c.replies.filter(r => r.id !== commentId) }
                    : c
            ));
        } else {
            setComments(comments.filter(c => c.id !== commentId));
        }
    };

    const toggleLike = (commentId, parentId = null) => {
        if (parentId) {
            setComments(comments.map(c => 
                c.id === parentId 
                    ? { ...c, replies: c.replies.map(r => 
                        r.id === commentId 
                            ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
                            : r
                    )}
                    : c
            ));
        } else {
            setComments(comments.map(c => 
                c.id === commentId 
                    ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                    : c
            ));
        }
    };

    // Share comment
    const shareComment = (comment) => {
        const text = `${comment.user.name}: "${comment.text}"`;
        navigator.clipboard.writeText(text);
        setCommentMenu(null);
        // Show toast notification could be added here
    };

    // Report comment
    const reportComment = (commentId) => {
        // In a real app, this would send to backend
        setComments(comments.map(c => 
            c.id === commentId 
                ? { ...c, reported: true }
                : c
        ));
        setCommentMenu(null);
        alert('Comentario reportado. Gracias por ayudarnos a mantener la comunidad segura.');
    };

    // Add reply to any level (nested replies)
    const addNestedReply = (commentId, replyId = null) => {
        if (!replyText.trim()) return;
        const newReply = {
            id: Date.now(),
            user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: replyText,
            time: Date.now(),
            likes: 0,
            liked: false,
            replies: []
        };

        const addReplyRecursive = (items, targetId, isReplyLevel = false) => {
            return items.map(item => {
                if (item.id === targetId) {
                    return { ...item, replies: [...(item.replies || []), newReply] };
                }
                if (item.replies?.length > 0) {
                    return { ...item, replies: addReplyRecursive(item.replies, targetId, true) };
                }
                return item;
            });
        };

        if (replyId) {
            // Nested reply
            setComments(addReplyRecursive(comments, replyId));
        } else {
            // Reply to main comment
            setComments(comments.map(c => 
                c.id === commentId 
                    ? { ...c, replies: [...(c.replies || []), newReply] }
                    : c
            ));
        }
        setReplyText('');
        setReplyingTo(null);
    };

    // Create poll
    const createPoll = () => {
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
        
        const poll = {
            id: Date.now(),
            user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: pollQuestion,
            time: Date.now(),
            likes: 0,
            liked: false,
            replies: [],
            isPoll: true,
            pollOptions: pollOptions
                .filter(o => o.trim())
                .map((option, idx) => ({
                    id: idx,
                    text: option,
                    votes: 0,
                    voters: []
                })),
            totalVotes: 0,
            userVoted: null
        };
        
        setComments([poll, ...comments]);
        setPollQuestion('');
        setPollOptions(['', '']);
        setShowPollForm(false);
    };

    // Vote on poll
    const voteOnPoll = (pollId, optionId) => {
        setComments(comments.map(c => {
            if (c.id === pollId && c.isPoll && c.userVoted === null) {
                const newOptions = c.pollOptions.map(opt => 
                    opt.id === optionId 
                        ? { ...opt, votes: opt.votes + 1, voters: [...opt.voters, user?.username] }
                        : opt
                );
                return { 
                    ...c, 
                    pollOptions: newOptions, 
                    totalVotes: c.totalVotes + 1,
                    userVoted: optionId
                };
            }
            return c;
        }));
    };

    // Delete nested reply at any level
    const deleteNestedComment = (commentId, path = []) => {
        const deleteRecursive = (items, targetId) => {
            return items.filter(item => item.id !== targetId).map(item => ({
                ...item,
                replies: item.replies ? deleteRecursive(item.replies, targetId) : []
            }));
        };
        setComments(deleteRecursive(comments, commentId));
    };

    // Toggle like for nested comments
    const toggleNestedLike = (commentId) => {
        const toggleRecursive = (items) => {
            return items.map(item => {
                if (item.id === commentId) {
                    return { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 };
                }
                if (item.replies?.length > 0) {
                    return { ...item, replies: toggleRecursive(item.replies) };
                }
                return item;
            });
        };
        setComments(toggleRecursive(comments));
    };

    if (loading) {
        return (
            <div className="cyber-loading">
                <div className="cyber-loader"><span /><span /><span /></div>
                <p>CARGANDO PERFIL...</p>
            </div>
        );
    }

    if (error) return <div className="cyber-error">{error}</div>;
    if (!user) return null;

    // Data normalization
    const normalizedGames = Array.isArray(user.selectedGames)
        ? user.selectedGames
        : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    const visibleProfileStatus = user?.privacy?.showOnlineStatus === false ? 'offline' : user?.status;
    const userStatus = STATUS_LIST.find(s => s.id === visibleProfileStatus) || STATUS_LIST[0];
    const resolvedUserAvatar = resolveMediaUrl(user.avatar);
    const lookingForTeam = Boolean(user.lookingForTeam);

    const socialIcons = [
        { key: 'twitch', icon: <FaTwitch />, color: '#9146FF' },
        { key: 'youtube', icon: <FaYoutube />, color: '#FF0000' },
        { key: 'twitter', icon: <FaTwitter />, color: '#1DA1F2' },
        { key: 'instagram', icon: <FaInstagram />, color: '#E4405F' },
        { key: 'tiktok', icon: <FaTiktok />, color: '#00f2ea' },
    ];
    const activeSocials = socialIcons.filter(s => user.socialLinks?.[s.key]);
    const buildSocialUrl = (key, handle) => {
        if (!handle) return '#';
        const clean = String(handle).replace(/^@+/, '');
        if (key === 'twitch') return `https://twitch.tv/${clean}`;
        if (key === 'youtube') return `https://youtube.com/${clean}`;
        if (key === 'twitter') return `https://x.com/${clean}`;
        if (key === 'instagram') return `https://instagram.com/${clean}`;
        if (key === 'tiktok') return `https://tiktok.com/@${clean}`;
        return '#';
    };

    const gamingConnections = [
        { key: 'riot', icon: <SiRiotgames />, label: 'Riot', color: '#D32936', connected: user.connections?.riot?.verified, value: user.connections?.riot?.gameName ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : null },
        { key: 'discord', icon: <FaDiscord />, label: 'Discord', color: '#5865F2', connected: user.connections?.discord?.verified, value: user.connections?.discord?.username },
        { key: 'mlbb', icon: <FaGamepad />, label: 'MLBB', color: '#00b4d8', connected: user.connections?.mlbb?.verified, value: user.connections?.mlbb?.playerId ? `${user.connections.mlbb.playerId} (${user.connections.mlbb.zoneId || 'zone'})` : null },
        { key: 'steam', icon: <FaSteam />, label: 'Steam', color: '#1b2838', connected: user.connections?.steam?.verified, value: user.connections?.steam?.username },
        { key: 'epic', icon: <FaBolt />, label: 'Epic', color: '#0078f2', connected: user.connections?.epic?.verified, value: user.connections?.epic?.displayName || user.connections?.epic?.username || null },
    ];

    const mainGame = normalizedGames[0];
    const mainGameData = mainGame ? COMMUNITY_GAMES.find(g => 
        g.id.toLowerCase() === mainGame.toLowerCase() ||
        g.name.toLowerCase().includes(mainGame.toLowerCase())
    ) : null;
    const mainGameImg = mainGameData?.img || (mainGame ? (Object.entries(GAME_IMAGES).find(([key]) =>
        key.toLowerCase().includes(mainGame.toLowerCase())
    )?.[1] || GAME_IMAGES.Default) : null);
    const mainGameUrl = mainGameData?.url;
    const mainGameName = mainGameData?.name || mainGame;

    // Handle game click - navigate to games page
    const handleGameClick = (gameId) => {
        navigate(`/games?filter=${encodeURIComponent(gameId)}`);
    };

    // Handle team click - show team modal
    const handleTeamClick = (team, e) => {
        e.stopPropagation();
        setSelectedTeam(team);
    };

    // Handle friend click - show friend modal
    const handleFriendClick = async (friend) => {
        setSelectedFriend(friend);
        if (!friend?.id) return;
        try {
            setSelectedFriendLoading(true);
            const token = getAuthToken();
            const res = await axios.get(`${API_URL}/api/auth/user-card/${friend.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedFriend(prev => ({
                ...(prev || {}),
                ...(res.data || {})
            }));
        } catch (err) {
            console.error('No se pudo cargar la tarjeta del amigo:', err);
        } finally {
            setSelectedFriendLoading(false);
        }
    };

    const overviewStats = profileOverview.stats || EMPTY_PROFILE_OVERVIEW.stats;
    const profileAchievements = profileOverview.achievements || [];
    const profileRecognitions = profileOverview.recognitions || [];
    const profileFriends = profileOverview.friends || [];
    const profileCommunities = profileOverview.communities || [];
    const profileActivity = profileOverview.activity || [];
    const onlineFriendsCount = profileFriends.filter((friend) => normalizePresenceTone(friend?.status) === 'online').length;
    const selectedFriendMainGame = selectedFriend?.selectedGames?.[0] || selectedFriend?.rank || 'Jugador';
    const selectedFriendTeamsCount = Array.isArray(selectedFriend?.teams) ? selectedFriend.teams.length : 0;
    const selectedFriendStatusTone = normalizePresenceTone(selectedFriend?.status);
    const selectedFriendStatusMeta = STATUS_LIST.find((status) => status.id === selectedFriend?.status) || null;
    const selectedFriendStatusLabel = selectedFriendStatusMeta?.label
        || (selectedFriendStatusTone === 'online' ? 'En línea' : selectedFriendStatusTone === 'away' ? 'Ausente' : 'Offline');
    const selectedFriendRiotHandle = selectedFriend?.connections?.riot?.publicHandle || '';
    const selectedFriendExperience = Array.isArray(selectedFriend?.experience) ? selectedFriend.experience.slice(0, 3) : [];
    const selectedFriendGames = Array.isArray(selectedFriend?.selectedGames) ? selectedFriend.selectedGames.slice(0, 4) : [];
    const selectedFriendLinkedAccounts = [
        selectedFriend?.connections?.riot?.verified
            ? (selectedFriendRiotHandle || 'Riot')
            : null,
        selectedFriend?.connections?.discord?.linked ? 'Discord' : null,
        selectedFriend?.connections?.steam?.linked ? 'Steam' : null,
        selectedFriend?.connections?.epic?.linked ? 'Epic Games' : null,
        selectedFriend?.connections?.mlbb?.linked ? 'MLBB' : null
    ].filter(Boolean);
    const selectedFriendUniversityLabel = selectedFriend?.university?.verified
        ? 'Estudiante verificado'
        : 'Sin verificación universitaria';

    return (
        <div className="cyber">
            {/* Background Effects */}
            <div className="cyber__bg">
                <div className="cyber__grid" />
                <div className="cyber__scanlines" />
            </div>
            
            <PageHud page="PERFIL" />

            {/* ════════════════════════════════════════
                HERO SECTION
               ════════════════════════════════════════ */}
            <section className="cyber-hero">
                {/* Background */}
                <div className="cyber-hero__bg">
                    <img src={currentBg.src} alt="" />
                    <div className="cyber-hero__bg-overlay" />
                </div>

                {/* Top Actions */}
                <div className="cyber-hero__top">
                    <div className="cyber-hero__actions">
                        {isOwnProfile ? (
                            <>
                                <button className="cyber-btn cyber-btn--primary" onClick={() => navigate('/edit-profile')}>
                                    <FaUserEdit /> Editar Perfil
                                </button>
                                <button className="cyber-btn" onClick={handleShareProfile}>
                                    {copiedLink ? <><FaCheck /> Copiado</> : <><FaShareAlt /> Compartir</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="cyber-btn cyber-btn--primary">
                                    <FaUserPlus /> Seguir
                                </button>
                                <button className="cyber-btn">
                                    <FaComment /> Mensaje
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <motion.div 
                    className="cyber-hero__content"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Avatar */}
                    <div className="cyber-avatar">
                        <AvatarCircle
                            src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`}
                            frameConfig={currentFrame}
                            size="150px"
                            status={visibleProfileStatus}
                        />
                        <div className="cyber-avatar__status" style={{ '--status-color': userStatus.color }}>
                            <span className="cyber-avatar__dot" />
                            {userStatus.label}
                        </div>
                    </div>

                    {/* Identity */}
                    <div className="cyber-identity">
                        <div className="cyber-identity__name">
                            <PlayerTag name={user.username || "Player"} tagId={user.selectedTagId} size="xlarge" />
                            {user.university?.verified && <span className="cyber-verified"><FaCheck /></span>}
                        </div>
                        
                        {user.fullName && <p className="cyber-identity__realname">{user.fullName}</p>}
                        
                        <div className="cyber-tags">
                            <span className="cyber-tag cyber-tag--player"><FaGamepad /> Player</span>
                            {user.isOrganizer && <span className="cyber-tag cyber-tag--org"><FaCrown /> Organizador</span>}
                            {user.isPro && <span className="cyber-tag cyber-tag--pro"><FaGem /> Pro</span>}
                            {lookingForTeam && <span className="cyber-tag cyber-tag--player"><FaUsers /> Buscando Equipo</span>}
                        </div>

                        {user.bio && <p className="cyber-identity__bio">{user.bio}</p>}

                        <div className="cyber-meta">
                            {user.country && <span><FaFlag /> {user.country}</span>}
                            <span><FaCalendarAlt /> {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="cyber-stats">
                        <div className="cyber-stats__header"><FaChartLine /> STATS</div>
                        <div className="cyber-stats__grid">
                            <div className="cyber-stat cyber-stat--main">
                                <span className="cyber-stat__value">{overviewStats.winRate}<small>%</small></span>
                                <span className="cyber-stat__label">WIN RATE</span>
                                <div className="cyber-stat__bar">
                                    <div style={{ width: `${overviewStats.winRate}%` }} />
                                </div>
                            </div>
                            <div className="cyber-stat">
                                <span className="cyber-stat__value">{overviewStats.wins}</span>
                                <span className="cyber-stat__label">WINS</span>
                            </div>
                            <div className="cyber-stat">
                                <span className="cyber-stat__value">{overviewStats.tournamentsWon}</span>
                                <span className="cyber-stat__label">TORNEOS</span>
                            </div>
                            <div className="cyber-stat">
                                <span className="cyber-stat__value">{overviewStats.teams || user.teams?.length || 0}</span>
                                <span className="cyber-stat__label">EQUIPOS</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Game Card */}
                {mainGame && (
                    <motion.div 
                        className="cyber-hero__game"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <div 
                            className="cyber-game-card"
                            onClick={() => setSelectedGame(mainGameData || { id: mainGame, name: mainGameName, img: mainGameImg })}
                        >
                            <img src={mainGameImg} alt={mainGameName} />
                            <div className="cyber-game-card__overlay">
                                <span className="cyber-game-card__label">MAIN</span>
                                <span className="cyber-game-card__name">{mainGameName}</span>
                            </div>
                            <div className="cyber-game-card__border" />
                        </div>
                    </motion.div>
                )}
            </section>

            {/* ════════════════════════════════════════
                MAIN GRID
               ════════════════════════════════════════ */}
            <main className="cyber-main">
                {/* LEFT */}
                <div className="cyber-col cyber-col--left">
                    {/* Games */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaGamepad /> JUEGOS
                            <div className="cyber-panel__line" />
                            {normalizedGames.length > 4 && (
                                <button className="cyber-panel__more" onClick={() => setShowGamesModal(true)}>
                                    Ver todos <FaChevronRight />
                                </button>
                            )}
                        </div>
                        <div className="cyber-games">
                            {normalizedGames.length > 0 ? normalizedGames.slice(0, 4).map((gameId, i) => {
                                const gameData = COMMUNITY_GAMES.find(g => 
                                    g.id.toLowerCase() === gameId.toLowerCase() ||
                                    g.name.toLowerCase().includes(gameId.toLowerCase())
                                );
                                const imgSrc = gameData?.img || Object.entries(GAME_IMAGES).find(([key]) =>
                                    key.toLowerCase().includes(gameId.toLowerCase())
                                )?.[1] || GAME_IMAGES.Default;
                                const gameName = gameData?.name || gameId;
                                return (
                                    <div 
                                        key={i} 
                                        className={`cyber-game ${i === 0 ? 'cyber-game--main' : ''}`}
                                        onClick={() => setSelectedGame(gameData || { id: gameId, name: gameName, img: imgSrc })}
                                    >
                                        <img src={imgSrc} alt={gameName} />
                                        <div className="cyber-game__info">
                                            <span>{gameName}</span>
                                            {i === 0 && <span className="cyber-game__badge"><FaStar /> MAIN</span>}
                                        </div>
                                        <FaExternalLinkAlt className="cyber-game__link" />
                                    </div>
                                );
                            }) : <div className="cyber-empty">SIN JUEGOS</div>}
                        </div>
                    </section>

                    {/* Connections */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaLink /> CONEXIONES
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-connections">
                            {gamingConnections.map(conn => (
                                <div key={conn.key} className={`cyber-connection ${conn.connected ? 'cyber-connection--active' : ''}`} style={{ '--conn-color': conn.color }}>
                                    <span className="cyber-connection__icon">{conn.icon}</span>
                                    <div className="cyber-connection__info">
                                        <span>{conn.label}</span>
                                        <span>{conn.connected ? conn.value : 'NO VINCULADO'}</span>
                                    </div>
                                    {conn.connected && <FaCheck />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Socials */}
                    {activeSocials.length > 0 && (
                        <section className="cyber-panel">
                            <div className="cyber-panel__header">
                                <FaGlobe /> REDES
                                <div className="cyber-panel__line" />
                            </div>
                            <div className="cyber-socials">
                                {activeSocials.map(s => (
                                    <a key={s.key} href={buildSocialUrl(s.key, user.socialLinks[s.key])} target="_blank" rel="noopener noreferrer" className="cyber-social" style={{ '--social-color': s.color }}>
                                        {s.icon} <span>@{user.socialLinks[s.key]}</span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Teams */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaShieldAlt /> EQUIPOS
                            <span className="cyber-panel__count">{user.teams?.length || 0}</span>
                            <div className="cyber-panel__line" />
                        </div>
                        {user.teams?.length > 0 ? (
                            <div className="cyber-teams">
                                {user.teams.slice(0, 3).map(team => (
                                    <div key={team._id} className="cyber-team" onClick={(e) => handleTeamClick(team, e)}>
                                        <img src={resolveMediaUrl(team.logo) || `https://ui-avatars.com/api/?name=${team.name}&background=0a0a15&color=00f0ff`} alt={team.name} />
                                        <div className="cyber-team__info">
                                            <span>{team.name}</span>
                                            <span>{team.game}</span>
                                        </div>
                                        <FaChevronRight />
                                    </div>
                                ))}
                                {user.teams.length > 3 && (
                                    <button className="cyber-panel__more" onClick={() => setShowTeamsModal(true)}>
                                        VER TODOS <FaChevronRight />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="cyber-empty">
                                <FaShieldAlt />
                                <p>SIN EQUIPOS</p>
                            </div>
                        )}
                    </section>

                    {/* Awards & Recognitions */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaMedal /> RECONOCIMIENTOS
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-awards">
                            {profileRecognitions.length > 0 ? profileRecognitions.map((award) => (
                                <div key={award.id} className={`cyber-award cyber-award--${award.type || 'bronze'}`}>
                                    <span className="cyber-award__icon"><FaAward /></span>
                                    <div className="cyber-award__info">
                                        <div className="cyber-award__title">{award.name}</div>
                                        <div className="cyber-award__event">{award.event}</div>
                                    </div>
                                </div>
                            )) : (
                                <div className="cyber-empty">
                                    <FaMedal />
                                    <p>SIN RECONOCIMIENTOS AÚN</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* CENTER - Wall */}
                <div className="cyber-col cyber-col--center">
                    <section className="cyber-panel cyber-panel--wall">
                        <div className="cyber-panel__header">
                            <FaComment /> MURO
                            <span className="cyber-panel__count">{comments.length}</span>
                            <button className="cyber-poll-toggle" onClick={() => setShowPollForm(!showPollForm)}>
                                <FaPoll /> {showPollForm ? 'Cancelar' : 'Encuesta'}
                            </button>
                            <div className="cyber-panel__line" />
                        </div>

                        {/* Poll Creation Form */}
                        {showPollForm && (
                            <div className="cyber-poll-form">
                                <input 
                                    type="text" 
                                    placeholder="Pregunta de la encuesta..."
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                />
                                <div className="cyber-poll-options">
                                    {pollOptions.map((opt, idx) => (
                                        <div key={idx} className="cyber-poll-option-input">
                                            <input 
                                                type="text" 
                                                placeholder={`Opción ${idx + 1}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOpts = [...pollOptions];
                                                    newOpts[idx] = e.target.value;
                                                    setPollOptions(newOpts);
                                                }}
                                            />
                                            {pollOptions.length > 2 && (
                                                <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}>
                                                    <FaMinus />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {pollOptions.length < 6 && (
                                        <button type="button" className="cyber-poll-add" onClick={() => setPollOptions([...pollOptions, ''])}>
                                            <FaPlus /> Agregar opción
                                        </button>
                                    )}
                                </div>
                                <button 
                                    className="cyber-poll-submit" 
                                    onClick={createPoll}
                                    disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
                                >
                                    Crear Encuesta
                                </button>
                            </div>
                        )}

                        <form className="cyber-comment-form" onSubmit={handleSubmitComment}>
                            <img src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="" />
                            <input type="text" placeholder="Escribe algo..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                            <button type="submit" disabled={!newComment.trim()}><FaPaperPlane /></button>
                        </form>

                        <div className="cyber-comments">
                            {comments.length === 0 ? (
                                <div className="cyber-empty">
                                    <FaComment />
                                    <p>SIN PUBLICACIONES RECIENTES</p>
                                </div>
                            ) : comments.map(comment => {
                                // Recursive component for nested replies
                                const RenderComment = ({ c, parentPath = [], depth = 0 }) => {
                                    const isReplying = replyingTo === c.id;
                                    const showMenu = commentMenu === c.id;
                                    
                                    return (
                                        <motion.div 
                                            key={c.id} 
                                            className={`cyber-comment ${depth > 0 ? 'cyber-comment--reply' : ''} ${c.reported ? 'cyber-comment--reported' : ''}`}
                                            style={{ marginLeft: depth > 0 ? Math.min(depth * 20, 60) : 0 }}
                                            initial={{ opacity: 0, x: -20 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                        >
                                            <img src={c.user.avatar || `https://ui-avatars.com/api/?name=${c.user.name}&background=0a0a15&color=00f0ff`} alt="" />
                                            <div className="cyber-comment__content">
                                                <div className="cyber-comment__header">
                                                    <span>{c.user.name}</span>
                                                    <span>{formatTime(c.time)}</span>
                                                    <div className="cyber-comment__menu-wrapper">
                                                        <button className="cyber-comment__menu-btn" onClick={() => setCommentMenu(showMenu ? null : c.id)}>
                                                            <FaEllipsisH />
                                                        </button>
                                                        {showMenu && (
                                                            <div className="cyber-comment__menu">
                                                                <button onClick={() => { shareComment(c); setCommentMenu(null); }}>
                                                                    <FaCopy /> Copiar
                                                                </button>
                                                                {!c.user.isOwner && (
                                                                    <button onClick={() => { reportComment(c.id, parentPath); setCommentMenu(null); }}>
                                                                        <FaExclamationTriangle /> Reportar
                                                                    </button>
                                                                )}
                                                                {c.user.isOwner && (
                                                                    <button onClick={() => { 
                                                                        if (parentPath.length === 0) deleteComment(c.id);
                                                                        else deleteNestedComment(c.id, parentPath);
                                                                        setCommentMenu(null);
                                                                    }}>
                                                                        <FaTrash /> Eliminar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Poll Display */}
                                                {c.isPoll ? (
                                                    <div className="cyber-poll">
                                                        <p className="cyber-poll__question">{c.text}</p>
                                                        <div className="cyber-poll__options">
                                                            {c.pollOptions.map(opt => {
                                                                const percentage = c.totalVotes > 0 ? Math.round((opt.votes / c.totalVotes) * 100) : 0;
                                                                return (
                                                                    <button 
                                                                        key={opt.id}
                                                                        className={`cyber-poll__option ${c.userVoted === opt.id ? 'voted' : ''} ${c.userVoted ? 'disabled' : ''}`}
                                                                        onClick={() => !c.userVoted && voteOnPoll(c.id, opt.id, parentPath)}
                                                                        disabled={!!c.userVoted}
                                                                    >
                                                                        <span className="cyber-poll__option-text">{opt.text}</span>
                                                                        <span className="cyber-poll__option-votes">{opt.votes} votos ({percentage}%)</span>
                                                                        <div className="cyber-poll__option-bar" style={{ width: `${percentage}%` }} />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <span className="cyber-poll__total">{c.totalVotes} votos totales</span>
                                                    </div>
                                                ) : (
                                                    <p>{c.text}</p>
                                                )}
                                                
                                                <div className="cyber-comment__actions">
                                                    <button 
                                                        className={c.liked ? 'active' : ''} 
                                                        onClick={() => depth === 0 ? toggleLike(c.id) : toggleNestedLike(c.id, parentPath)}
                                                    >
                                                        {c.liked ? <FaHeart /> : <FaRegHeart />} {c.likes}
                                                    </button>
                                                    <button onClick={() => setReplyingTo(isReplying ? null : c.id)}>
                                                        <FaReply /> Responder
                                                    </button>
                                                </div>
                                                
                                                {/* Reply Form */}
                                                {isReplying && (
                                                    <div className="cyber-reply-form">
                                                        <img src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}&size=32`} alt="" />
                                                        <input 
                                                            type="text" 
                                                            placeholder={`Responder a ${c.user.name}...`}
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                if (depth === 0) handleSubmitReply(c.id);
                                                                else addNestedReply(c.id, parentPath, replyText);
                                                            }} 
                                                            disabled={!replyText.trim()}
                                                        >
                                                            <FaPaperPlane />
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {/* Nested Replies */}
                                                {c.replies?.length > 0 && (
                                                    <div className="cyber-comment__replies">
                                                        {c.replies.map(reply => (
                                                            <RenderComment 
                                                                key={reply.id} 
                                                                c={reply} 
                                                                parentPath={[...parentPath, c.id]}
                                                                depth={depth + 1}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                };
                                
                                return <RenderComment key={comment.id} c={comment} />;
                            })}
                        </div>
                    </section>
                </div>

                {/* RIGHT */}
                <div className="cyber-col cyber-col--right">
                    {/* Achievements */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaTrophy /> LOGROS
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-achievements">
                            {profileAchievements.length > 0 ? profileAchievements.map((ach) => (
                                <div key={ach.id} className={`cyber-achievement ${ach.verified ? 'cyber-achievement--verified' : ''}`}>
                                    <span className="cyber-achievement__icon">{ach.icon}</span>
                                    <div className="cyber-achievement__info">
                                        <span>{ach.name}</span>
                                        <span>{ach.tournament} • {ach.date}</span>
                                    </div>
                                    {ach.verified && <FaCheck />}
                                </div>
                            )) : (
                                <div className="cyber-empty">
                                    <FaTrophy />
                                    <p>SIN LOGROS REGISTRADOS</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Friends */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaUserFriends /> AMIGOS
                            <span className="cyber-panel__count">{onlineFriendsCount} EN LÍNEA</span>
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-friends">
                            {profileFriends.length > 0 ? profileFriends.slice(0, 5).map(friend => (
                                <div key={friend.id} className="cyber-friend" onClick={() => handleFriendClick(friend)}>
                                    <div className="cyber-friend__avatar">
                                        <img src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${friend.name}&background=0a0a15&color=00f0ff`} alt="" />
                                        <span className={`cyber-friend__status cyber-friend__status--${normalizePresenceTone(friend.status)}`} />
                                    </div>
                                    <div className="cyber-friend__info">
                                        <span>{friend.name}</span>
                                        <span>{friend.rank}</span>
                                    </div>
                                    <FaChevronRight className="cyber-friend__arrow" />
                                </div>
                            )) : (
                                <div className="cyber-empty">
                                    <FaUserFriends />
                                    <p>SIN AMIGOS MUTUOS</p>
                                </div>
                            )}
                        </div>
                        {profileFriends.length > 0 && (
                            <button className="cyber-panel__more" onClick={() => setShowFriendsModal(true)}>
                                VER TODOS <FaChevronRight />
                            </button>
                        )}
                    </section>

                    {/* Communities */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaLayerGroup /> COMUNIDADES
                            <span className="cyber-panel__count">{profileCommunities.length}</span>
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-communities">
                            {profileCommunities.length > 0 ? profileCommunities.map((community) => (
                                <div key={community.id} className="cyber-community" onClick={() => navigate(`/communities/${community.shortUrl}`)}>
                                    <div className="cyber-community__icon">
                                        {community.image ? (
                                            <img
                                                src={resolveMediaUrl(community.image)}
                                                alt={community.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
                                            />
                                        ) : (
                                            <FaLayerGroup />
                                        )}
                                    </div>
                                    <div className="cyber-community__info">
                                        <span className="cyber-community__name">{community.name}</span>
                                        <div className="cyber-community__meta">
                                            <span className="cyber-community__members"><FaUsers /> {Number(community.members || 0).toLocaleString()}</span>
                                            <span className="cyber-community__role">{community.role}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="cyber-empty">
                                    <FaLayerGroup />
                                    <p>SIN COMUNIDADES ACTIVAS</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Activity */}
                    <section className="cyber-panel">
                        <div className="cyber-panel__header">
                            <FaFire /> ACTIVIDAD
                            <div className="cyber-panel__line" />
                        </div>
                        <div className="cyber-activity">
                            {profileActivity.length > 0 ? profileActivity.map((item) => {
                                const variant = ACTIVITY_VARIANTS[item.type] || ACTIVITY_VARIANTS.rank;
                                const ActivityIcon = variant.icon;
                                return (
                                    <div key={item.id} className={`cyber-activity__item cyber-activity__item--${variant.tone}`}>
                                        <ActivityIcon />
                                        <div>
                                            <p>{item.text || item.title}</p>
                                            <span>{item.source || 'Sistema'} • {formatTime(item.createdAt)}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="cyber-empty">
                                    <FaFire />
                                    <p>SIN ACTIVIDAD RECIENTE</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Modal Teams List */}
            <AnimatePresence>
                {showTeamsModal && (
                    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamsModal(false)}>
                        <motion.div className="cyber-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <div className="cyber-modal__header">
                                <h2><FaShieldAlt /> MIS EQUIPOS</h2>
                                <button onClick={() => setShowTeamsModal(false)}><FaTimes /></button>
                            </div>
                            <div className="cyber-modal__content">
                                {user.teams?.map(team => (
                                    <div key={team._id} className="cyber-modal-team" onClick={(e) => { setShowTeamsModal(false); handleTeamClick(team, e); }}>
                                        <img src={resolveMediaUrl(team.logo) || `https://ui-avatars.com/api/?name=${team.name}&background=0a0a15&color=00f0ff`} alt={team.name} />
                                        <div><h3>{team.name}</h3><span>{team.game}</span></div>
                                        <FaChevronRight />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Team Detail */}
            <AnimatePresence>
                {selectedTeam && (
                    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeam(null)}>
                        <motion.div className="cyber-modal cyber-modal--detail" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="cyber-modal__header">
                                <h2><FaShieldAlt /> DETALLES DEL EQUIPO</h2>
                                <button onClick={() => setSelectedTeam(null)}><FaTimes /></button>
                            </div>
                            <div className="cyber-modal__content">
                                <div className="cyber-team-detail">
                                    <div className="cyber-team-detail__header">
                                        <img src={resolveMediaUrl(selectedTeam.logo) || `https://ui-avatars.com/api/?name=${selectedTeam.name}&background=0a0a15&color=00f0ff&size=128`} alt={selectedTeam.name} className="cyber-team-detail__logo" />
                                        <div className="cyber-team-detail__info">
                                            <h3>{selectedTeam.name}</h3>
                                            <span className="cyber-team-detail__game"><FaGamepad /> {selectedTeam.game}</span>
                                            <span className="cyber-team-detail__members">
                                                <FaUsers /> {(selectedTeam.roster?.starters?.length || 0) + (selectedTeam.roster?.subs?.length || 0) + (selectedTeam.roster?.coach ? 1 : 0)} miembros
                                            </span>
                                            {selectedTeam.teamLevel && (
                                                <span className="cyber-team-detail__level"><FaTrophy /> {selectedTeam.teamLevel}</span>
                                            )}
                                        </div>
                                    </div>
                                    {selectedTeam.slogan && (
                                        <p className="cyber-team-detail__desc">"{selectedTeam.slogan}"</p>
                                    )}
                                    <div className="cyber-team-detail__stats">
                                        <div className="cyber-team-detail__stat">
                                            <span className="cyber-team-detail__stat-value">{selectedTeam.roster?.starters?.length || 0}</span>
                                            <span className="cyber-team-detail__stat-label">TITULARES</span>
                                        </div>
                                        <div className="cyber-team-detail__stat">
                                            <span className="cyber-team-detail__stat-value">{selectedTeam.roster?.subs?.length || 0}</span>
                                            <span className="cyber-team-detail__stat-label">SUPLENTES</span>
                                        </div>
                                        <div className="cyber-team-detail__stat">
                                            <span className="cyber-team-detail__stat-value">{selectedTeam.roster?.coach ? '1' : '0'}</span>
                                            <span className="cyber-team-detail__stat-label">COACH</span>
                                        </div>
                                    </div>
                                    {selectedTeam.teamCountry && (
                                        <div className="cyber-team-detail__meta">
                                            <span><FaFlag /> {selectedTeam.teamCountry}</span>
                                            {selectedTeam.category && <span><FaLayerGroup /> {selectedTeam.category}</span>}
                                        </div>
                                    )}
                                    <div className="cyber-team-detail__actions">
                                        <button
                                            className="cyber-btn cyber-btn--primary"
                                            onClick={() => navigate('/equipos', {
                                                state: {
                                                    teamId: selectedTeam._id,
                                                    openPreview: true
                                                }
                                            })}
                                        >
                                            <FaExternalLinkAlt /> Ver página
                                        </button>
                                        <button className="cyber-btn" onClick={() => setSelectedTeam(null)}>
                                            Cerrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Friends List */}
            <AnimatePresence>
                {showFriendsModal && (
                    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFriendsModal(false)}>
                        <motion.div className="cyber-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <div className="cyber-modal__header">
                                <h2><FaUserFriends /> AMIGOS</h2>
                                <button onClick={() => setShowFriendsModal(false)}><FaTimes /></button>
                            </div>
                            <div className="cyber-modal__content">
                                {profileFriends.length > 0 ? profileFriends.map((friend) => (
                                    <div key={friend.id} className="cyber-modal-friend" onClick={() => { setShowFriendsModal(false); handleFriendClick(friend); }}>
                                        <div className="cyber-modal-friend__avatar">
                                            <img src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${friend.name}&background=0a0a15&color=00f0ff`} alt="" />
                                            <span className={`cyber-modal-friend__status cyber-modal-friend__status--${normalizePresenceTone(friend.status)}`} />
                                        </div>
                                        <div className="cyber-modal-friend__info">
                                            <div className="cyber-modal-friend__name">{friend.name}</div>
                                            <div className="cyber-modal-friend__bio">{friend.rank}</div>
                                        </div>
                                        <FaChevronRight className="cyber-modal-friend__arrow" />
                                    </div>
                                )) : (
                                    <div className="cyber-empty">
                                        <FaUserFriends />
                                        <p>SIN AMIGOS DISPONIBLES</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal Friend Detail */}
            <AnimatePresence>
                {selectedFriend && (
                    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFriend(null)}>
                        <motion.div className="cyber-modal cyber-modal--detail" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="cyber-modal__header">
                                <h2><FaUserFriends /> PERFIL DE AMIGO</h2>
                                <button onClick={() => setSelectedFriend(null)}><FaTimes /></button>
                            </div>
                            <div className="cyber-modal__content">
                                <div className="cyber-friend-detail">
                                    <div className="cyber-friend-detail__header">
                                        <div className="cyber-friend-detail__avatar">
                                            <img src={resolveMediaUrl(selectedFriend.avatar) || `https://ui-avatars.com/api/?name=${selectedFriend.username || selectedFriend.name}&background=0a0a15&color=00f0ff&size=128`} alt="" />
                                            <span className={`cyber-friend-detail__status-dot cyber-friend-detail__status-dot--${selectedFriendStatusTone}`} />
                                        </div>
                                        <div className="cyber-friend-detail__name">{selectedFriend.username || selectedFriend.name}</div>
                                        <div className="cyber-friend-detail__games">
                                            {selectedFriend.isOrganizer ? <span className="cyber-friend-detail__game-tag">Organizador</span> : null}
                                            {selectedFriend?.university?.verified ? <span className="cyber-friend-detail__game-tag">Estudiante verificado</span> : null}
                                            {selectedFriendRiotHandle ? <span className="cyber-friend-detail__game-tag">{selectedFriendRiotHandle}</span> : null}
                                        </div>
                                        {selectedFriend.country ? <span className="cyber-friend-detail__country"><FaFlag /> {selectedFriend.country}</span> : null}
                                        {selectedFriendMainGame ? (
                                            <span className="cyber-friend-detail__country"><FaTrophy /> {selectedFriendMainGame}</span>
                                        ) : null}
                                        {selectedFriendLoading ? <p className="cyber-friend-detail__bio">Cargando datos del usuario...</p> : null}
                                    </div>
                                    <div className="cyber-friend-detail__stats">
                                        <div className="cyber-friend-detail__stat">
                                            <span className="cyber-friend-detail__stat-value">{selectedFriendTeamsCount}</span>
                                            <span className="cyber-friend-detail__stat-label">EQUIPOS</span>
                                        </div>
                                        <div className="cyber-friend-detail__stat">
                                            <span className="cyber-friend-detail__stat-value">{selectedFriendStatusLabel}</span>
                                            <span className="cyber-friend-detail__stat-label">ESTADO</span>
                                        </div>
                                    </div>
                                    <div className="cyber-friend-detail__section">
                                        <h4>Perfil público</h4>
                                        <div className="cyber-friend-detail__games">
                                            {selectedFriendGames.length > 0
                                                ? selectedFriendGames.map((game) => (
                                                    <span key={game} className="cyber-friend-detail__game-tag">{game}</span>
                                                ))
                                                : <span className="cyber-friend-detail__game-tag">Sin juegos públicos</span>}
                                            {selectedFriendExperience.map((entry) => (
                                                <span key={entry} className="cyber-friend-detail__game-tag">{entry}</span>
                                            ))}
                                            {selectedFriend?.university?.verified && selectedFriend.university.universityName ? (
                                                <span className="cyber-friend-detail__game-tag">{selectedFriend.university.universityName}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="cyber-friend-detail__section">
                                        <h4>Universidad</h4>
                                        <div className="cyber-friend-detail__meta-list">
                                            <div className="cyber-friend-detail__meta-item">
                                                <span className="cyber-friend-detail__meta-label">Estado</span>
                                                <span className="cyber-friend-detail__meta-value">{selectedFriendUniversityLabel}</span>
                                            </div>
                                            {selectedFriend?.university?.verified && selectedFriend.university.universityName ? (
                                                <div className="cyber-friend-detail__meta-item">
                                                    <span className="cyber-friend-detail__meta-label">Universidad</span>
                                                    <span className="cyber-friend-detail__meta-value">{selectedFriend.university.universityName}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="cyber-friend-detail__section">
                                        <h4>Cuentas vinculadas</h4>
                                        <div className="cyber-friend-detail__games">
                                            {selectedFriendLinkedAccounts.length > 0 ? (
                                                selectedFriendLinkedAccounts.map((account) => (
                                                    <span key={account} className="cyber-friend-detail__game-tag">{account}</span>
                                                ))
                                            ) : (
                                                <span className="cyber-friend-detail__game-tag cyber-friend-detail__game-tag--muted">Sin cuentas vinculadas visibles</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="cyber-friend-detail__actions">
                                        <button className="cyber-btn cyber-btn--primary" disabled>
                                            <FaEnvelope /> MENSAJE
                                        </button>
                                        <button className="cyber-btn" onClick={() => setSelectedFriend(null)}>
                                            CERRAR
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

{/* Modal Games List */}
<AnimatePresence>
{showGamesModal && (
    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGamesModal(false)}>
        <motion.div className="cyber-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
            <div className="cyber-modal__header">
                <h2><FaGamepad /> TODOS LOS JUEGOS</h2>
                <button onClick={() => setShowGamesModal(false)}><FaTimes /></button>
            </div>
            <div className="cyber-modal__content">
                <div className="cyber-games-grid">
                    {normalizedGames.map((gameId, i) => {
                        const gameData = COMMUNITY_GAMES.find(g => 
                            g.id.toLowerCase() === gameId.toLowerCase() ||
                            g.name.toLowerCase().includes(gameId.toLowerCase())
                        );
                        const imgSrc = gameData?.img || Object.entries(GAME_IMAGES).find(([key]) =>
                            key.toLowerCase().includes(gameId.toLowerCase())
                        )?.[1] || GAME_IMAGES.Default;
                        const gameName = gameData?.name || gameId;
                        return (
                            <div 
                                key={i} 
                                className="cyber-modal-game"
                                onClick={() => { setShowGamesModal(false); setSelectedGame(gameData || { id: gameId, name: gameName, img: imgSrc }); }}
                            >
                                <img src={imgSrc} alt={gameName} />
                                <div className="cyber-modal-game__info">
                                    <span>{gameName}</span>
                                    {gameData?.cat && <span className="cyber-modal-game__cat">{gameData.cat}</span>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    </motion.div>
)}
</AnimatePresence>

{/* Modal Game Detail */}
<AnimatePresence>
{selectedGame && (
    <motion.div className="cyber-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGame(null)}>
        <motion.div className="cyber-modal cyber-modal--game" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={e => e.stopPropagation()}>
            <div className="cyber-modal__header">
                <h2><FaGamepad /> {selectedGame.name}</h2>
                <button onClick={() => setSelectedGame(null)}><FaTimes /></button>
            </div>
            <div className="cyber-modal__content">
                <div className="cyber-game-detail">
                    <div className="cyber-game-detail__header">
                        <img src={selectedGame.img} alt={selectedGame.name} className="cyber-game-detail__img" />
                        <div className="cyber-game-detail__info">
                            <h3>{selectedGame.name}</h3>
                            {selectedGame.cat && <span className="cyber-game-detail__cat"><FaLayerGroup /> {selectedGame.cat}</span>}
                            {selectedGame.players && <span className="cyber-game-detail__players"><FaUsers /> {selectedGame.players} jugadores</span>}
                        </div>
                    </div>
                    <div className="cyber-game-detail__actions">
                        <button className="cyber-btn cyber-btn--primary" onClick={() => navigate(`/games/${selectedGame.id}`)}>
                            <FaUsers /> Comunidad
                        </button>
                        {selectedGame.url && (
                            <a className="cyber-btn" href={selectedGame.url} target="_blank" rel="noopener noreferrer">
                                <FaDownload /> Descargar
                            </a>
                        )}
                        <button className="cyber-btn" onClick={() => setSelectedGame(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    </motion.div>
)}
</AnimatePresence>
        </div>
    );
};

export default Profile;
