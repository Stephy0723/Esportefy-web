import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { GAME_IMAGES } from '../../../data/gameImages';
import { COMMUNITY_GAMES } from '../../../data/communityData';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import { EMPTY_PROFILE_PROGRESSION, normalizeProfileProgression } from '../../../data/profileProgression';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { STATUS_LIST } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import './Profile.css';

/* ═══════════════════════════════
   CONSTANTS
   ═══════════════════════════════ */
const EMPTY_PROFILE_OVERVIEW = {
    stats: { matches: 0, wins: 0, winRate: 0, points: 0, tournaments: 0, tournamentsWon: 0, mvps: 0, teams: 0, ongoing: 0 },
    achievements: [], recognitions: [], friends: [], communities: [], activity: [], wallComments: [],
    progression: EMPTY_PROFILE_PROGRESSION,
    flags: { hasVerifiedGameAccount: false, hasUniversityVerification: false, hasOnlineTeammates: false }
};

const normalizeProfileOverview = (payload = {}) => ({
    ...EMPTY_PROFILE_OVERVIEW, ...payload,
    stats: { ...EMPTY_PROFILE_OVERVIEW.stats, ...(payload?.stats || {}) },
    achievements: Array.isArray(payload?.achievements) ? payload.achievements : [],
    recognitions: Array.isArray(payload?.recognitions) ? payload.recognitions : [],
    friends: Array.isArray(payload?.friends) ? payload.friends : [],
    communities: Array.isArray(payload?.communities) ? payload.communities : [],
    activity: Array.isArray(payload?.activity) ? payload.activity : [],
    wallComments: Array.isArray(payload?.wallComments) ? payload.wallComments : [],
    progression: normalizeProfileProgression(payload?.progression),
    flags: { ...EMPTY_PROFILE_OVERVIEW.flags, ...(payload?.flags || {}) }
});

const normalizePresenceTone = (status = '') => {
    const n = String(status || '').trim().toLowerCase();
    if (['online', 'gaming', 'tournament', 'streaming', 'searching'].includes(n)) return 'online';
    if (['afk', 'dnd'].includes(n)) return 'away';
    return 'offline';
};

const renderAchievementIcon = (achievement, className = '') => {
    const iconClass = String(achievement?.iconClass || '').trim();
    if (iconClass.startsWith('bx ')) {
        return <i className={`${iconClass} ${className}`.trim()} aria-hidden="true" />;
    }
    return <span className={className}>{achievement?.icon || '>'}</span>;
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

    /* ── Data fetching ── */
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = getAuthToken();
                if (!token) { navigate('/login'); return; }
                const [profileResult, overviewResult] = await Promise.allSettled([
                    axios.get(`${API_URL}/api/auth/profile`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${API_URL}/api/auth/profile/overview`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                if (profileResult.status !== 'fulfilled') throw profileResult.reason;
                setUser(profileResult.value.data);
                if (overviewResult.status === 'fulfilled') {
                    const next = normalizeProfileOverview(overviewResult.value.data);
                    setProfileOverview(next);
                    setComments(next.wallComments);
                } else {
                    setProfileOverview(EMPTY_PROFILE_OVERVIEW);
                    setComments([]);
                }
            } catch (err) {
                setError("No se pudo cargar el perfil.");
                if (err.response?.status === 401) navigate('/login');
            } finally { setLoading(false); }
        };
        fetchUserProfile();
    }, [navigate]);

    /* ── Actions ── */
    const handleShareProfile = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const formatTime = (timestamp) => {
        const d = new Date(timestamp);
        if (Number.isNaN(d.getTime())) return '';
        const diff = Date.now() - d.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    /* ── Comments / Wall ── */
    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setComments([{
            id: Date.now(), user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: newComment, time: Date.now(), likes: 0, liked: false, replies: []
        }, ...comments]);
        setNewComment('');
    };

    const handleSubmitReply = (commentId) => {
        if (!replyText.trim()) return;
        const reply = { id: Date.now(), user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true }, text: replyText, time: Date.now(), likes: 0, liked: false };
        setComments(comments.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), reply] } : c));
        setReplyText(''); setReplyingTo(null);
    };

    const addNestedReply = (commentId, replyId = null) => {
        if (!replyText.trim()) return;
        const newReply = { id: Date.now(), user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true }, text: replyText, time: Date.now(), likes: 0, liked: false, replies: [] };
        const addRec = (items, targetId) => items.map(item => item.id === targetId ? { ...item, replies: [...(item.replies || []), newReply] } : { ...item, replies: item.replies?.length > 0 ? addRec(item.replies, targetId) : (item.replies || []) });
        if (replyId) setComments(addRec(comments, replyId));
        else setComments(comments.map(c => c.id === commentId ? { ...c, replies: [...(c.replies || []), newReply] } : c));
        setReplyText(''); setReplyingTo(null);
    };

    const deleteComment = (commentId, parentId = null) => {
        if (parentId) setComments(comments.map(c => c.id === parentId ? { ...c, replies: c.replies.filter(r => r.id !== commentId) } : c));
        else setComments(comments.filter(c => c.id !== commentId));
    };

    const deleteNestedComment = (commentId) => {
        const delRec = (items, targetId) => items.filter(item => item.id !== targetId).map(item => ({ ...item, replies: item.replies ? delRec(item.replies, targetId) : [] }));
        setComments(delRec(comments, commentId));
    };

    const toggleLike = (commentId) => {
        setComments(comments.map(c => c.id === commentId ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 } : c));
    };

    const toggleNestedLike = (commentId) => {
        const toggleRec = (items) => items.map(item => item.id === commentId ? { ...item, liked: !item.liked, likes: item.liked ? item.likes - 1 : item.likes + 1 } : { ...item, replies: item.replies?.length > 0 ? toggleRec(item.replies) : (item.replies || []) });
        setComments(toggleRec(comments));
    };

    const shareComment = (comment) => { navigator.clipboard.writeText(`${comment.user.name}: "${comment.text}"`); setCommentMenu(null); };
    const reportComment = (commentId) => { setComments(comments.map(c => c.id === commentId ? { ...c, reported: true } : c)); setCommentMenu(null); };

    /* ── Polls ── */
    const createPoll = () => {
        if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
        setComments([{
            id: Date.now(), user: { name: user?.username || "Tú", avatar: resolvedUserAvatar, isOwner: true },
            text: pollQuestion, time: Date.now(), likes: 0, liked: false, replies: [], isPoll: true,
            pollOptions: pollOptions.filter(o => o.trim()).map((option, idx) => ({ id: idx, text: option, votes: 0, voters: [] })),
            totalVotes: 0, userVoted: null
        }, ...comments]);
        setPollQuestion(''); setPollOptions(['', '']); setShowPollForm(false);
    };

    const voteOnPoll = (pollId, optionId) => {
        setComments(comments.map(c => {
            if (c.id === pollId && c.isPoll && c.userVoted === null) {
                return { ...c, pollOptions: c.pollOptions.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1, voters: [...opt.voters, user?.username] } : opt), totalVotes: c.totalVotes + 1, userVoted: optionId };
            }
            return c;
        }));
    };

    /* ── Friend detail ── */
    const handleFriendClick = async (friend) => {
        setSelectedFriend(friend);
        if (!friend?.id) return;
        try {
            setSelectedFriendLoading(true);
            const token = getAuthToken();
            const res = await axios.get(`${API_URL}/api/auth/user-card/${friend.id}`, { headers: { Authorization: `Bearer ${token}` } });
            setSelectedFriend(prev => ({ ...(prev || {}), ...(res.data || {}) }));
        } catch {}
        finally { setSelectedFriendLoading(false); }
    };

    const handleTeamClick = (team, e) => { e.stopPropagation(); setSelectedTeam(team); };

    /* ── Loading / Error ── */
    if (loading) return (
        <div className="pf-loading">
            <div className="pf-loader"><span /><span /><span /></div>
            <p>Cargando perfil...</p>
        </div>
    );
    if (error) return <div className="pf-error">{error}</div>;
    if (!user) return null;

    /* ── Data normalization ── */
    const normalizedGames = Array.isArray(user.selectedGames) ? user.selectedGames : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    const visibleProfileStatus = user?.privacy?.showOnlineStatus === false ? 'offline' : user?.status;
    const userStatus = STATUS_LIST.find(s => s.id === visibleProfileStatus) || STATUS_LIST[0];
    const resolvedUserAvatar = resolveMediaUrl(user.avatar);
    const lookingForTeam = Boolean(user.lookingForTeam);

    const socialIcons = [
        { key: 'twitch', icon: 'bx bxl-twitch', color: '#9146FF' },
        { key: 'youtube', icon: 'bx bxl-youtube', color: '#FF0000' },
        { key: 'twitter', icon: 'bx bxl-twitter', color: '#1DA1F2' },
        { key: 'instagram', icon: 'bx bxl-instagram', color: '#E4405F' },
        { key: 'tiktok', icon: 'bx bxl-tiktok', color: '#00f2ea' },
    ];
    const activeSocials = socialIcons.filter(s => user.socialLinks?.[s.key]);
    const buildSocialUrl = (key, handle) => {
        if (!handle) return '#';
        const clean = String(handle).replace(/^@+/, '');
        const map = { twitch: `https://twitch.tv/${clean}`, youtube: `https://youtube.com/${clean}`, twitter: `https://x.com/${clean}`, instagram: `https://instagram.com/${clean}`, tiktok: `https://tiktok.com/@${clean}` };
        return map[key] || '#';
    };

    const gamingConnections = [
        { key: 'riot', icon: 'bx bxs-game', label: 'Riot', color: '#D32936', connected: user.connections?.riot?.verified, value: user.connections?.riot?.gameName ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : null },
        { key: 'discord', icon: 'bx bxl-discord-alt', label: 'Discord', color: '#5865F2', connected: user.connections?.discord?.verified, value: user.connections?.discord?.username },
        { key: 'mlbb', icon: 'bx bx-joystick', label: 'MLBB', color: '#00b4d8', connected: user.connections?.mlbb?.verified, value: user.connections?.mlbb?.playerId ? `${user.connections.mlbb.playerId} (${user.connections.mlbb.zoneId || 'zone'})` : null },
        { key: 'steam', icon: 'bx bxl-steam', label: 'Steam', color: '#1b2838', connected: user.connections?.steam?.verified, value: user.connections?.steam?.username },
        { key: 'epic', icon: 'bx bx-bolt', label: 'Epic', color: '#0078f2', connected: user.connections?.epic?.verified, value: user.connections?.epic?.displayName || user.connections?.epic?.username || null },
    ];

    const mainGame = normalizedGames[0];
    const mainGameData = mainGame ? COMMUNITY_GAMES.find(g => g.id.toLowerCase() === mainGame.toLowerCase() || g.name.toLowerCase().includes(mainGame.toLowerCase())) : null;
    const mainGameImg = mainGameData?.img || (mainGame ? (Object.entries(GAME_IMAGES).find(([key]) => key.toLowerCase().includes(mainGame.toLowerCase()))?.[1] || GAME_IMAGES.Default) : null);
    const mainGameName = mainGameData?.name || mainGame;

    const resolveGameImage = (gameId) => {
        const gd = COMMUNITY_GAMES.find(g => g.id.toLowerCase() === gameId.toLowerCase() || g.name.toLowerCase().includes(gameId.toLowerCase()));
        return gd?.img || Object.entries(GAME_IMAGES).find(([key]) => key.toLowerCase().includes(gameId.toLowerCase()))?.[1] || GAME_IMAGES.Default;
    };
    const resolveGameName = (gameId) => {
        const gd = COMMUNITY_GAMES.find(g => g.id.toLowerCase() === gameId.toLowerCase() || g.name.toLowerCase().includes(gameId.toLowerCase()));
        return gd?.name || gameId;
    };

    const overviewStats = profileOverview.stats || EMPTY_PROFILE_OVERVIEW.stats;
    const profileProgression = normalizeProfileProgression(profileOverview.progression);
    const profileAchievements = profileOverview.achievements || [];
    const profileRecognitions = profileOverview.recognitions || [];
    const profileFriends = profileOverview.friends || [];
    const profileCommunities = profileOverview.communities || [];
    const profileActivity = profileOverview.activity || [];
    const onlineFriendsCount = profileFriends.filter(f => normalizePresenceTone(f?.status) === 'online').length;
    const profilePointsText = Number(profileProgression.totalPoints || 0).toLocaleString('es-ES');

    // Friend detail helpers
    const sfMainGame = selectedFriend?.selectedGames?.[0] || selectedFriend?.rank || 'Jugador';
    const sfTeamsCount = Array.isArray(selectedFriend?.teams) ? selectedFriend.teams.length : 0;
    const sfStatusTone = normalizePresenceTone(selectedFriend?.status);
    const sfStatusMeta = STATUS_LIST.find(s => s.id === selectedFriend?.status) || null;
    const sfStatusLabel = sfStatusMeta?.label || (sfStatusTone === 'online' ? 'En línea' : sfStatusTone === 'away' ? 'Ausente' : 'Offline');
    const sfRiotHandle = selectedFriend?.connections?.riot?.publicHandle || '';
    const sfGames = Array.isArray(selectedFriend?.selectedGames) ? selectedFriend.selectedGames.slice(0, 4) : [];
    const sfExperience = Array.isArray(selectedFriend?.experience) ? selectedFriend.experience.slice(0, 3) : [];
    const sfLinkedAccounts = [
        selectedFriend?.connections?.riot?.verified ? (sfRiotHandle || 'Riot') : null,
        selectedFriend?.connections?.discord?.linked ? 'Discord' : null,
        selectedFriend?.connections?.steam?.linked ? 'Steam' : null,
        selectedFriend?.connections?.epic?.linked ? 'Epic Games' : null,
        selectedFriend?.connections?.mlbb?.linked ? 'MLBB' : null
    ].filter(Boolean);
    const sfUniLabel = selectedFriend?.university?.verified ? 'Estudiante verificado' : 'Sin verificación universitaria';

    /* ── Recursive comment renderer ── */
    const RenderComment = ({ c, depth = 0 }) => {
        const isReplying = replyingTo === c.id;
        const showMenu = commentMenu === c.id;
        return (
            <motion.div className={`pf-comment ${depth > 0 ? 'pf-comment--nested' : ''} ${c.reported ? 'pf-comment--reported' : ''}`} style={depth > 0 ? { marginLeft: Math.min(depth * 20, 60) } : undefined} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <img className="pf-comment__avatar" src={c.user.avatar || `https://ui-avatars.com/api/?name=${c.user.name}`} alt="" />
                <div className="pf-comment__body">
                    <div className="pf-comment__head">
                        <strong>{c.user.name}</strong>
                        <span>{formatTime(c.time)}</span>
                        <div className="pf-comment__menu-wrap">
                            <button onClick={() => setCommentMenu(showMenu ? null : c.id)}><i className='bx bx-dots-horizontal-rounded' /></button>
                            {showMenu && (
                                <div className="pf-comment__menu">
                                    <button onClick={() => shareComment(c)}><i className='bx bx-copy' /> Copiar</button>
                                    {!c.user.isOwner && <button onClick={() => reportComment(c.id)}><i className='bx bx-error' /> Reportar</button>}
                                    {c.user.isOwner && <button onClick={() => { deleteNestedComment(c.id); setCommentMenu(null); }}><i className='bx bx-trash' /> Eliminar</button>}
                                </div>
                            )}
                        </div>
                    </div>
                    {c.isPoll ? (
                        <div className="pf-poll">
                            <p className="pf-poll__question">{c.text}</p>
                            <div className="pf-poll__options">
                                {c.pollOptions.map(opt => {
                                    const pct = c.totalVotes > 0 ? Math.round((opt.votes / c.totalVotes) * 100) : 0;
                                    return (
                                        <button key={opt.id} className={`pf-poll__opt ${c.userVoted === opt.id ? 'voted' : ''} ${c.userVoted !== null ? 'disabled' : ''}`} onClick={() => !c.userVoted && voteOnPoll(c.id, opt.id)} disabled={!!c.userVoted}>
                                            <span>{opt.text}</span>
                                            <span>{opt.votes} ({pct}%)</span>
                                            <div className="pf-poll__bar" style={{ width: `${pct}%` }} />
                                        </button>
                                    );
                                })}
                            </div>
                            <span className="pf-poll__total">{c.totalVotes} votos</span>
                        </div>
                    ) : <p>{c.text}</p>}
                    <div className="pf-comment__actions">
                        <button className={c.liked ? 'active' : ''} onClick={() => depth === 0 ? toggleLike(c.id) : toggleNestedLike(c.id)}>
                            <i className={`bx ${c.liked ? 'bxs-heart' : 'bx-heart'}`} /> {c.likes}
                        </button>
                        <button onClick={() => setReplyingTo(isReplying ? null : c.id)}>
                            <i className='bx bx-reply' /> Responder
                        </button>
                    </div>
                    {isReplying && (
                        <div className="pf-reply-form">
                            <img src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="" />
                            <input type="text" placeholder={`Responder a ${c.user.name}...`} value={replyText} onChange={e => setReplyText(e.target.value)} autoFocus />
                            <button onClick={() => { if (depth === 0) handleSubmitReply(c.id); else addNestedReply(c.id, c.id); }} disabled={!replyText.trim()}><i className='bx bx-send' /></button>
                        </div>
                    )}
                    {c.replies?.length > 0 && (
                        <div className="pf-comment__replies">
                            {c.replies.map(reply => <RenderComment key={reply.id} c={reply} depth={depth + 1} />)}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    /* ════════════════════════════════════════
       RENDER
       ════════════════════════════════════════ */
    return (
        <div className="pf">
            <PageHud page="PERFIL" />

            {/* ═══ HERO ═══ */}
            <section className="pf-hero">
                <div className="pf-hero__bg">
                    <img src={currentBg.src} alt="" />
                    <div className="pf-hero__overlay" />
                </div>

                <div className="pf-hero__actions">
                    {isOwnProfile ? (
                        <>
                            <button className="pf-btn pf-btn--primary" onClick={() => navigate('/edit-profile')}>
                                <i className='bx bx-edit-alt' /> Editar Perfil
                            </button>
                            <button className="pf-btn" onClick={handleShareProfile}>
                                <i className={`bx ${copiedLink ? 'bx-check' : 'bx-share-alt'}`} /> {copiedLink ? 'Copiado' : 'Compartir'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="pf-btn pf-btn--primary"><i className='bx bx-user-plus' /> Seguir</button>
                            <button className="pf-btn"><i className='bx bx-message-rounded' /> Mensaje</button>
                        </>
                    )}
                </div>

                <motion.div className="pf-hero__content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="pf-avatar">
                        <AvatarCircle src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`} frameConfig={currentFrame} size="140px" status={visibleProfileStatus} />
                        <div className="pf-avatar__status" style={{ '--s-color': userStatus.color }}>
                            <span className="pf-avatar__dot" />
                            {userStatus.label}
                        </div>
                    </div>

                    <div className="pf-identity">
                        <div className="pf-identity__name">
                            <PlayerTag nickname={user.nickname || user.username} name={user.name} tagId={user.selectedTagId} size="xlarge" />
                            {user.university?.verified && <span className="pf-verified"><i className='bx bxs-check-circle' /></span>}
                        </div>
                        {user.fullName && <p className="pf-identity__realname">{user.fullName}</p>}
                        {user.userCode && <span className="pf-identity__code">#{user.userCode}</span>}
                        <div className="pf-tags">
                            <span className="pf-tag"><i className='bx bx-joystick' /> Player</span>
                            {(user.roles || []).includes('organizer') || user.isOrganizer ? (
                                <span className="pf-tag pf-tag--org pf-tag--clickable" onClick={() => navigate('/organizer-application')}><i className='bx bx-crown' /> Organizador</span>
                            ) : null}
                            {(user.roles || []).includes('content-creator') && (
                                <span className="pf-tag pf-tag--creator pf-tag--clickable" onClick={() => navigate('/role/content-creator')}><i className='bx bx-video' /> Creador</span>
                            )}
                            {(user.roles || []).includes('coach') && (
                                <span className="pf-tag pf-tag--coach pf-tag--clickable" onClick={() => navigate('/role/coach')}><i className='bx bx-chalkboard' /> Coach</span>
                            )}
                            {(user.roles || []).includes('caster') && (
                                <span className="pf-tag pf-tag--caster pf-tag--clickable" onClick={() => navigate('/role/caster')}><i className='bx bx-microphone' /> Caster</span>
                            )}
                            {(user.roles || []).includes('analyst') && (
                                <span className="pf-tag pf-tag--analyst pf-tag--clickable" onClick={() => navigate('/role/analyst')}><i className='bx bx-line-chart' /> Analista</span>
                            )}
                            {(user.roles || []).includes('sponsor') && (
                                <span className="pf-tag pf-tag--sponsor pf-tag--clickable" onClick={() => navigate('/role/sponsor')}><i className='bx bx-dollar-circle' /> Sponsor</span>
                            )}
                            {user.isPro && <span className="pf-tag pf-tag--pro"><i className='bx bx-diamond' /> Pro</span>}
                            {lookingForTeam && <span className="pf-tag pf-tag--lft"><i className='bx bx-search-alt' /> Buscando Equipo</span>}
                        </div>
                        {user.bio && <p className="pf-identity__bio">{user.bio}</p>}
                        <div className="pf-meta">
                            {user.country && <span><i className='bx bx-flag' /> {user.country}</span>}
                            <span><i className='bx bx-calendar' /> {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                        </div>
                    </div>

                    <div className="pf-progress-card">
                        <div className="pf-progress-card__top">
                            <span className="pf-progress-card__eyebrow">Puntos de perfil</span>
                            <span className="pf-progress-card__level">{profileProgression.level.name}</span>
                        </div>
                        <div className="pf-progress-card__value">{profilePointsText}</div>
                        <div className="pf-progress-card__meta">
                            <span>{profileProgression.unlockedAchievements}/{profileProgression.totalAchievements} logros</span>
                            <span>
                                {profileProgression.level.pointsNeeded > 0
                                    ? `${profileProgression.level.pointsNeeded} para ${profileProgression.level.nextLevelName}`
                                    : 'Nivel maximo'}
                            </span>
                        </div>
                        <div className="pf-progress-card__bar">
                            <div style={{ width: `${profileProgression.level.progressPercent}%` }} />
                        </div>
                    </div>

                    <div className="pf-stats">
                        <div className="pf-stat pf-stat--main">
                            <span className="pf-stat__val">{overviewStats.winRate}<small>%</small></span>
                            <span className="pf-stat__label">WIN RATE</span>
                            <div className="pf-stat__bar"><div style={{ width: `${overviewStats.winRate}%` }} /></div>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{overviewStats.wins}</span>
                            <span className="pf-stat__label">WINS</span>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{overviewStats.tournamentsWon}</span>
                            <span className="pf-stat__label">TORNEOS</span>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{overviewStats.teams || user.teams?.length || 0}</span>
                            <span className="pf-stat__label">EQUIPOS</span>
                        </div>
                    </div>

                    {mainGame && (
                        <div className="pf-hero__game">
                            <div className="pf-game-card" onClick={() => setSelectedGame(mainGameData || { id: mainGame, name: mainGameName, img: mainGameImg })}>
                                <img src={mainGameImg} alt={mainGameName} />
                                <div className="pf-game-card__info">
                                    <span className="pf-game-card__badge">MAIN</span>
                                    <span className="pf-game-card__name">{mainGameName}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </section>

            {/* ═══ MAIN GRID ═══ */}
            <main className="pf-grid">
                {/* ── LEFT ── */}
                <div className="pf-col pf-col--left">
                    {/* Games */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-joystick' /> JUEGOS
                            {normalizedGames.length > 4 && <button className="pf-card__more" onClick={() => setShowGamesModal(true)}>Ver todos <i className='bx bx-chevron-right' /></button>}
                        </div>
                        <div className="pf-games">
                            {normalizedGames.length > 0 ? normalizedGames.slice(0, 4).map((gameId, i) => (
                                <div key={i} className={`pf-game ${i === 0 ? 'pf-game--main' : ''}`} onClick={() => setSelectedGame(COMMUNITY_GAMES.find(g => g.id.toLowerCase() === gameId.toLowerCase()) || { id: gameId, name: resolveGameName(gameId), img: resolveGameImage(gameId) })}>
                                    <img src={resolveGameImage(gameId)} alt="" />
                                    <div className="pf-game__info">
                                        <span>{resolveGameName(gameId)}</span>
                                        <div className="pf-game__meta">
                                            <span className={`pf-game__rank ${i === 0 ? 'pf-game__rank--main' : ''}`}>
                                                {i === 0 ? '#1 Main' : `#${i + 1}`}
                                            </span>
                                        </div>
                                    </div>
                                    <i className='bx bx-link-external pf-game__link' />
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-joystick' /><p>Sin juegos</p></div>}
                        </div>
                    </section>

                    {/* Connections */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-link' /> CONEXIONES</div>
                        <div className="pf-connections">
                            {gamingConnections.map(conn => (
                                <div key={conn.key} className={`pf-conn ${conn.connected ? 'pf-conn--active' : ''}`} style={{ '--c-color': conn.color }}>
                                    <i className={conn.icon} />
                                    <div className="pf-conn__info">
                                        <span>{conn.label}</span>
                                        <span>{conn.connected ? conn.value : 'No vinculado'}</span>
                                    </div>
                                    {conn.connected && <i className='bx bx-check' />}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Socials */}
                    {activeSocials.length > 0 && (
                        <section className="pf-card">
                            <div className="pf-card__header"><i className='bx bx-globe' /> REDES</div>
                            <div className="pf-socials">
                                {activeSocials.map(s => (
                                    <a key={s.key} href={buildSocialUrl(s.key, user.socialLinks[s.key])} target="_blank" rel="noopener noreferrer" className="pf-social" style={{ '--c-color': s.color }}>
                                        <i className={s.icon} /> <span>@{user.socialLinks[s.key]}</span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Teams */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-shield-quarter' /> EQUIPOS
                            <span className="pf-card__count">{user.teams?.length || 0}</span>
                        </div>
                        {user.teams?.length > 0 ? (
                            <div className="pf-teams">
                                {user.teams.slice(0, 3).map(team => (
                                    <div key={team._id} className="pf-team" onClick={e => handleTeamClick(team, e)}>
                                        <img src={resolveMediaUrl(team.logo) || `https://ui-avatars.com/api/?name=${team.name}`} alt="" />
                                        <div className="pf-team__info"><span>{team.name}</span><span>{team.game}</span></div>
                                        <i className='bx bx-chevron-right' />
                                    </div>
                                ))}
                                {user.teams.length > 3 && <button className="pf-card__more" onClick={() => setShowTeamsModal(true)}>Ver todos <i className='bx bx-chevron-right' /></button>}
                            </div>
                        ) : <div className="pf-empty"><i className='bx bx-shield-quarter' /><p>Sin equipos</p></div>}
                    </section>

                    {/* Recognitions */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-medal' /> RECONOCIMIENTOS</div>
                        <div className="pf-awards">
                            {profileRecognitions.length > 0 ? profileRecognitions.map(award => (
                                <div key={award.id} className={`pf-award pf-award--${award.type || 'bronze'}`}>
                                    <i className='bx bx-award' />
                                    <div><strong>{award.name}</strong><span>{award.event}</span></div>
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-medal' /><p>Sin reconocimientos</p></div>}
                        </div>
                    </section>
                </div>

                {/* ── CENTER (Wall) ── */}
                <div className="pf-col pf-col--center">
                    <section className="pf-card pf-card--wall">
                        <div className="pf-card__header">
                            <i className='bx bx-message-rounded' /> MURO
                            <span className="pf-card__count">{comments.length}</span>
                            <button className="pf-poll-toggle" onClick={() => setShowPollForm(!showPollForm)}>
                                <i className='bx bx-poll' /> {showPollForm ? 'Cancelar' : 'Encuesta'}
                            </button>
                        </div>

                        {showPollForm && (
                            <div className="pf-poll-form">
                                <input type="text" placeholder="Pregunta de la encuesta..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                                <div className="pf-poll-form__options">
                                    {pollOptions.map((opt, idx) => (
                                        <div key={idx} className="pf-poll-form__opt">
                                            <input type="text" placeholder={`Opción ${idx + 1}`} value={opt} onChange={e => { const o = [...pollOptions]; o[idx] = e.target.value; setPollOptions(o); }} />
                                            {pollOptions.length > 2 && <button onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}><i className='bx bx-minus' /></button>}
                                        </div>
                                    ))}
                                    {pollOptions.length < 6 && <button className="pf-poll-form__add" onClick={() => setPollOptions([...pollOptions, ''])}><i className='bx bx-plus' /> Agregar</button>}
                                </div>
                                <button className="pf-btn pf-btn--primary" onClick={createPoll} disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}>Crear Encuesta</button>
                            </div>
                        )}

                        <form className="pf-wall-form" onSubmit={handleSubmitComment}>
                            <img src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`} alt="" />
                            <input type="text" placeholder="Escribe algo..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                            <button type="submit" disabled={!newComment.trim()}><i className='bx bx-send' /></button>
                        </form>

                        <div className="pf-comments">
                            {comments.length === 0 ? (
                                <div className="pf-empty"><i className='bx bx-message-rounded' /><p>Sin publicaciones recientes</p></div>
                            ) : comments.map(comment => <RenderComment key={comment.id} c={comment} />)}
                        </div>
                    </section>
                </div>

                {/* ── RIGHT ── */}
                <div className="pf-col pf-col--right">
                    {/* Achievements */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-trophy' /> LOGROS</div>
                        <div className="pf-achievements">
                            {profileAchievements.length > 0 ? profileAchievements.map(ach => (
                                <div key={ach.id} className={`pf-ach ${ach.verified ? 'pf-ach--verified' : ''}`}>
                                    <span className="pf-ach__icon">{renderAchievementIcon(ach, 'pf-ach__icon-glyph')}</span>
                                    <div className="pf-ach__info"><span>{ach.name}</span><span>{ach.tournament} · {ach.date}</span></div>
                                    {ach.verified && <i className='bx bx-check' />}
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-trophy' /><p>Sin logros registrados</p></div>}
                        </div>
                    </section>

                    {/* Friends */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-group' /> AMIGOS
                            <span className="pf-card__count">{onlineFriendsCount} en línea</span>
                        </div>
                        <div className="pf-friends">
                            {profileFriends.length > 0 ? profileFriends.slice(0, 5).map(friend => (
                                <div key={friend.id} className="pf-friend" onClick={() => handleFriendClick(friend)}>
                                    <div className="pf-friend__avatar">
                                        <img src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" />
                                        <span className={`pf-friend__dot pf-friend__dot--${normalizePresenceTone(friend.status)}`} />
                                    </div>
                                    <div className="pf-friend__info"><span>{friend.name}</span><span>{friend.rank}</span></div>
                                    <i className='bx bx-chevron-right' />
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-group' /><p>Sin amigos mutuos</p></div>}
                        </div>
                        {profileFriends.length > 0 && <button className="pf-card__more" onClick={() => setShowFriendsModal(true)}>Ver todos <i className='bx bx-chevron-right' /></button>}
                    </section>

                    {/* Communities */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-layer' /> COMUNIDADES
                            <span className="pf-card__count">{profileCommunities.length}</span>
                        </div>
                        <div className="pf-communities">
                            {profileCommunities.length > 0 ? profileCommunities.map(community => (
                                <div key={community.id} className="pf-community" onClick={() => navigate(`/communities/${community.shortUrl}`)}>
                                    <div className="pf-community__icon">
                                        {community.image ? <img src={resolveMediaUrl(community.image)} alt="" /> : <i className='bx bx-layer' />}
                                    </div>
                                    <div className="pf-community__info">
                                        <span>{community.name}</span>
                                        <div className="pf-community__meta">
                                            <span><i className='bx bx-group' /> {Number(community.members || 0).toLocaleString()}</span>
                                            <span>{community.role}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-layer' /><p>Sin comunidades</p></div>}
                        </div>
                    </section>

                    {/* Activity */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-trending-up' /> ACTIVIDAD</div>
                        <div className="pf-activity">
                            {profileActivity.length > 0 ? profileActivity.map(item => (
                                <div key={item.id} className="pf-act">
                                    <i className={`bx ${item.type === 'win' ? 'bx-trophy' : item.type === 'team' ? 'bx-shield-quarter' : item.type === 'achievement' ? 'bx-medal' : 'bx-bolt'}`} />
                                    <div><p>{item.text || item.title}</p><span>{item.source || 'Sistema'} · {formatTime(item.createdAt)}</span></div>
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-trending-up' /><p>Sin actividad reciente</p></div>}
                        </div>
                    </section>
                </div>
            </main>

            {/* ═══ MODALS ═══ */}
            {/* Teams List */}
            <AnimatePresence>
                {showTeamsModal && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamsModal(false)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-shield-quarter' /> Mis Equipos</h2><button onClick={() => setShowTeamsModal(false)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                {user.teams?.map(team => (
                                    <div key={team._id} className="pf-modal-item" onClick={e => { setShowTeamsModal(false); handleTeamClick(team, e); }}>
                                        <img src={resolveMediaUrl(team.logo) || `https://ui-avatars.com/api/?name=${team.name}`} alt="" />
                                        <div><strong>{team.name}</strong><span>{team.game}</span></div>
                                        <i className='bx bx-chevron-right' />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Team Detail */}
            <AnimatePresence>
                {selectedTeam && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeam(null)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-shield-quarter' /> Detalles del Equipo</h2><button onClick={() => setSelectedTeam(null)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                <div className="pf-detail-header">
                                    <img src={resolveMediaUrl(selectedTeam.logo) || `https://ui-avatars.com/api/?name=${selectedTeam.name}`} alt="" />
                                    <div>
                                        <h3>{selectedTeam.name}</h3>
                                        <span><i className='bx bx-joystick' /> {selectedTeam.game}</span>
                                        <span><i className='bx bx-group' /> {(selectedTeam.roster?.starters?.length || 0) + (selectedTeam.roster?.subs?.length || 0) + (selectedTeam.roster?.coach ? 1 : 0)} miembros</span>
                                        {selectedTeam.teamLevel && <span><i className='bx bx-trophy' /> {selectedTeam.teamLevel}</span>}
                                    </div>
                                </div>
                                {selectedTeam.slogan && <p className="pf-detail-quote">"{selectedTeam.slogan}"</p>}
                                <div className="pf-detail-stats">
                                    <div><strong>{selectedTeam.roster?.starters?.length || 0}</strong><span>Titulares</span></div>
                                    <div><strong>{selectedTeam.roster?.subs?.length || 0}</strong><span>Suplentes</span></div>
                                    <div><strong>{selectedTeam.roster?.coach ? '1' : '0'}</strong><span>Coach</span></div>
                                </div>
                                {selectedTeam.teamCountry && (
                                    <div className="pf-detail-meta">
                                        <span><i className='bx bx-flag' /> {selectedTeam.teamCountry}</span>
                                        {selectedTeam.category && <span><i className='bx bx-layer' /> {selectedTeam.category}</span>}
                                    </div>
                                )}
                                <div className="pf-detail-actions">
                                    <button
                                        className="pf-btn pf-btn--primary"
                                        onClick={() => navigate('/equipos', {
                                            state: {
                                                teamId: selectedTeam._id,
                                                openPreview: true
                                            }
                                        })}
                                    >
                                        <i className='bx bx-link-external' /> Ver página
                                    </button>
                                    <button className="pf-btn" onClick={() => setSelectedTeam(null)}>Cerrar</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friends List */}
            <AnimatePresence>
                {showFriendsModal && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFriendsModal(false)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-group' /> Amigos</h2><button onClick={() => setShowFriendsModal(false)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                {profileFriends.map(friend => (
                                    <div key={friend.id} className="pf-modal-item" onClick={() => { setShowFriendsModal(false); handleFriendClick(friend); }}>
                                        <div className="pf-friend__avatar"><img src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" /><span className={`pf-friend__dot pf-friend__dot--${normalizePresenceTone(friend.status)}`} /></div>
                                        <div><strong>{friend.name}</strong><span>{friend.rank}</span></div>
                                        <i className='bx bx-chevron-right' />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Friend Detail */}
            <AnimatePresence>
                {selectedFriend && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedFriend(null)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-group' /> Perfil</h2><button onClick={() => setSelectedFriend(null)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                <div className="pf-friend-detail">
                                    <div className="pf-friend-detail__top">
                                        <div className="pf-friend-detail__avatar-wrap">
                                            <img src={resolveMediaUrl(selectedFriend.avatar) || `https://ui-avatars.com/api/?name=${selectedFriend.username || selectedFriend.name}`} alt="" />
                                            <span className={`pf-friend__dot pf-friend__dot--${sfStatusTone}`} />
                                        </div>
                                        <strong>{selectedFriend.username || selectedFriend.name}</strong>
                                        <div className="pf-friend-detail__tags">
                                            {selectedFriend.isOrganizer && <span>Organizador</span>}
                                            {selectedFriend?.university?.verified && <span>Estudiante verificado</span>}
                                            {sfRiotHandle && <span>{sfRiotHandle}</span>}
                                        </div>
                                        {selectedFriend.country && <span className="pf-friend-detail__country"><i className='bx bx-flag' /> {selectedFriend.country}</span>}
                                        {sfMainGame && <span className="pf-friend-detail__country"><i className='bx bx-trophy' /> {sfMainGame}</span>}
                                        {selectedFriendLoading && <p className="pf-text-muted">Cargando...</p>}
                                    </div>
                                    <div className="pf-detail-stats">
                                        <div><strong>{sfTeamsCount}</strong><span>Equipos</span></div>
                                        <div><strong>{sfStatusLabel}</strong><span>Estado</span></div>
                                    </div>
                                    <div className="pf-friend-detail__section">
                                        <h4>Perfil público</h4>
                                        <div className="pf-friend-detail__tags">
                                            {sfGames.length > 0 ? sfGames.map(g => <span key={g}>{g}</span>) : <span>Sin juegos públicos</span>}
                                            {sfExperience.map(e => <span key={e}>{e}</span>)}
                                            {selectedFriend?.university?.verified && selectedFriend.university.universityName && <span>{selectedFriend.university.universityName}</span>}
                                        </div>
                                    </div>
                                    <div className="pf-friend-detail__section">
                                        <h4>Universidad</h4>
                                        <div className="pf-friend-detail__meta-list">
                                            <div><span>Estado</span><span>{sfUniLabel}</span></div>
                                            {selectedFriend?.university?.verified && selectedFriend.university.universityName && <div><span>Universidad</span><span>{selectedFriend.university.universityName}</span></div>}
                                        </div>
                                    </div>
                                    <div className="pf-friend-detail__section">
                                        <h4>Cuentas vinculadas</h4>
                                        <div className="pf-friend-detail__tags">
                                            {sfLinkedAccounts.length > 0 ? sfLinkedAccounts.map(a => <span key={a}>{a}</span>) : <span className="pf-text-muted">Sin cuentas vinculadas</span>}
                                        </div>
                                    </div>
                                    <div className="pf-detail-actions">
                                        <button className="pf-btn pf-btn--primary" onClick={() => { setSelectedFriend(null); navigate(`/profile/${selectedFriend.userCode || selectedFriend.id}`); }}><i className='bx bx-user' /> Ver Perfil</button>
                                        <button className="pf-btn" onClick={() => navigate('/chats', { state: { openChatWith: selectedFriend.id } })}><i className='bx bx-envelope' /> Mensaje</button>
                                        <button className="pf-btn" onClick={() => setSelectedFriend(null)}>Cerrar</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Games List */}
            <AnimatePresence>
                {showGamesModal && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGamesModal(false)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-joystick' /> Todos los Juegos</h2><button onClick={() => setShowGamesModal(false)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                <div className="pf-games-grid">
                                    {normalizedGames.map((gameId, i) => (
                                        <div key={i} className="pf-modal-game" onClick={() => { setShowGamesModal(false); setSelectedGame(COMMUNITY_GAMES.find(g => g.id.toLowerCase() === gameId.toLowerCase()) || { id: gameId, name: resolveGameName(gameId), img: resolveGameImage(gameId) }); }}>
                                            <img src={resolveGameImage(gameId)} alt="" />
                                            <span>{resolveGameName(gameId)}</span>
                                            <span className={`pf-modal-game__rank ${i === 0 ? 'pf-modal-game__rank--main' : ''}`}>
                                                {i === 0 ? '#1 Main' : `#${i + 1}`}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Detail */}
            <AnimatePresence>
                {selectedGame && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedGame(null)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-joystick' /> {selectedGame.name}</h2><button onClick={() => setSelectedGame(null)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                <div className="pf-detail-header">
                                    <img src={selectedGame.img} alt="" className="pf-detail-header__game-img" />
                                    <div>
                                        <h3>{selectedGame.name}</h3>
                                        {selectedGame.cat && <span><i className='bx bx-layer' /> {selectedGame.cat}</span>}
                                        {selectedGame.players && <span><i className='bx bx-group' /> {selectedGame.players} jugadores</span>}
                                    </div>
                                </div>
                                <div className="pf-detail-actions">
                                    <button className="pf-btn pf-btn--primary" onClick={() => navigate(`/games/${selectedGame.id}`)}><i className='bx bx-group' /> Comunidad</button>
                                    {selectedGame.url && <a className="pf-btn" href={selectedGame.url} target="_blank" rel="noopener noreferrer"><i className='bx bx-download' /> Descargar</a>}
                                    <button className="pf-btn" onClick={() => setSelectedGame(null)}>Cerrar</button>
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
