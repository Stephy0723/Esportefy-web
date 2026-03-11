import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import {
    FaUserEdit, FaGamepad, FaTrophy, FaShareAlt, FaCheck,
    FaMedal, FaChevronRight, FaFire, FaFlag, FaCrosshairs,
    FaShieldAlt, FaUsers, FaCrown, FaTwitch, FaYoutube,
    FaTwitter, FaInstagram, FaTiktok, FaDiscord, FaStar,
    FaCalendarAlt, FaChartLine, FaHeart, FaComment, FaPaperPlane,
    FaEllipsisH, FaUserPlus, FaUserFriends, FaGem, FaGlobe,
    FaRegHeart, FaRegComment, FaTimes, FaSearch, FaGraduationCap
} from 'react-icons/fa';
import { GAME_IMAGES } from '../../../data/gameImages';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import UserCard from '../../../components/UserCard/UserCard';
import { STATUS_LIST } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { resolveMediaUrl } from '../../../utils/media';
import { getAuthToken } from '../../../utils/authSession';
import './Profile.css';

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileStats, setProfileStats] = useState({
        matches: 0,
        wins: 0,
        winRate: 0,
        tournaments: 0,
        tournamentsWon: 0,
        mvps: 0,
    });
    const [achievements, setAchievements] = useState([]);
    const [friends, setFriends] = useState([]);
    const [activities, setActivities] = useState([]);
    const [copiedLink, setCopiedLink] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState([]);
    const [postingComment, setPostingComment] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [isOwnProfile, setIsOwnProfile] = useState(true); // Para determinar si es el perfil propio
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const [socialTab, setSocialTab] = useState('friends');
    const [socialData, setSocialData] = useState({ friends: [], followers: [], following: [], counts: { friends: 0, followers: 0, following: 0 } });
    const [socialLoading, setSocialLoading] = useState(false);
    const [socialError, setSocialError] = useState('');
    const [socialSearch, setSocialSearch] = useState('');
    const [socialSearchResults, setSocialSearchResults] = useState([]);
    const [socialSearchLoading, setSocialSearchLoading] = useState(false);
    const [followBusyIds, setFollowBusyIds] = useState({});
    const navigate = useNavigate();

    const loadProfileData = useCallback(async ({ showLoader = true } = {}) => {
        try {
            if (showLoader) setLoading(true);
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const [profileResult, overviewResult] = await Promise.allSettled([
                axios.get(`${API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/auth/profile/overview`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (profileResult.status !== 'fulfilled') {
                const profileError = profileResult.reason;
                setError("No se pudo cargar el perfil.");
                if (profileError?.response?.status === 401) navigate('/login');
                if (showLoader) setLoading(false);
                return;
            }

            setError(null);
            setUser(profileResult.value.data);

            if (overviewResult.status === 'fulfilled') {
                const overview = overviewResult.value?.data || {};
                const stats = overview?.stats || {};
                setProfileStats({
                    matches: Number(stats.matches || 0),
                    wins: Number(stats.wins || 0),
                    winRate: Number(stats.winRate || 0),
                    tournaments: Number(stats.tournaments || 0),
                    tournamentsWon: Number(stats.tournamentsWon || 0),
                    mvps: Number(stats.mvps || 0),
                });
                setAchievements(Array.isArray(overview?.achievements) ? overview.achievements : []);
                setFriends(Array.isArray(overview?.friends) ? overview.friends : []);
                setActivities(Array.isArray(overview?.activity) ? overview.activity : []);
                setComments(Array.isArray(overview?.wallComments) ? overview.wallComments : []);
            } else {
                console.warn('No se pudo cargar profile/overview:', overviewResult.reason);
                setAchievements([]);
                setFriends([]);
                setActivities([]);
                setComments([]);
            }
        } catch (err) {
            setError("No se pudo cargar el perfil.");
            if (err?.response?.status === 401) navigate('/login');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [navigate]);

    const loadSocialData = useCallback(async () => {
        try {
            setSocialLoading(true);
            setSocialError('');
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`${API_URL}/api/auth/social`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const payload = response?.data || {};
            setSocialData({
                friends: Array.isArray(payload?.friends) ? payload.friends : [],
                followers: Array.isArray(payload?.followers) ? payload.followers : [],
                following: Array.isArray(payload?.following) ? payload.following : [],
                counts: payload?.counts || { friends: 0, followers: 0, following: 0 }
            });
        } catch (err) {
            if (err?.response?.status === 401) {
                navigate('/login');
                return;
            }
            setSocialError(err?.response?.data?.message || 'No se pudo cargar la lista social.');
        } finally {
            setSocialLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        loadProfileData({ showLoader: true });
    }, [loadProfileData]);

    useEffect(() => {
        if (!socialModalOpen || socialTab !== 'discover') return undefined;
        const searchValue = String(socialSearch || '').trim();
        if (searchValue.length < 2) {
            setSocialSearchResults([]);
            setSocialSearchLoading(false);
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setSocialSearchLoading(true);
                const token = getAuthToken();
                if (!token) return;
                const response = await axios.get(`${API_URL}/api/auth/users/search`, {
                    params: { q: searchValue, limit: 20 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSocialSearchResults(Array.isArray(response?.data?.users) ? response.data.users : []);
            } catch (err) {
                setSocialSearchResults([]);
            } finally {
                setSocialSearchLoading(false);
            }
        }, 280);

        return () => clearTimeout(timeoutId);
    }, [socialModalOpen, socialTab, socialSearch]);

    useEffect(() => {
        if (!socialModalOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleEscClose = (event) => {
            if (event.key === 'Escape') {
                setSocialModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscClose);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleEscClose);
        };
    }, [socialModalOpen]);

    const handleOpenSocialModal = async (tab = 'friends') => {
        setSocialTab(tab);
        setSocialModalOpen(true);
        await loadSocialData();
    };

    const handleToggleFollowUser = async (targetUserId) => {
        const targetId = String(targetUserId || '').trim();
        if (!targetId || followBusyIds[targetId]) return;

        setFollowBusyIds((prev) => ({ ...prev, [targetId]: true }));
        try {
            const token = getAuthToken();
            if (!token) {
                navigate('/login');
                return;
            }

            await axios.post(`${API_URL}/api/auth/follow/${targetId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await Promise.all([
                loadSocialData(),
                loadProfileData({ showLoader: false })
            ]);
            if (socialTab === 'discover' && String(socialSearch || '').trim().length >= 2) {
                const response = await axios.get(`${API_URL}/api/auth/users/search`, {
                    params: { q: String(socialSearch || '').trim(), limit: 20 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSocialSearchResults(Array.isArray(response?.data?.users) ? response.data.users : []);
            }
        } catch (err) {
            setSocialError(err?.response?.data?.message || 'No se pudo actualizar el seguimiento.');
        } finally {
            setFollowBusyIds((prev) => ({ ...prev, [targetId]: false }));
        }
    };

    const handleShareProfile = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        const text = String(newComment || '').trim();
        if (!text || postingComment) return;

        const token = getAuthToken();
        if (!token) {
            navigate('/login');
            return;
        }

        setCommentError('');
        setPostingComment(true);
        try {
            await axios.post(
                `${API_URL}/api/community/posts`,
                { text, privacy: 'Public' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewComment('');
            await loadProfileData({ showLoader: false });
        } catch (err) {
            const message = err?.response?.data?.message || 'No se pudo publicar en tu muro.';
            setCommentError(message);
        } finally {
            setPostingComment(false);
        }
    };

    const toggleLike = (commentId) => {
        setComments(comments.map(c => 
            c.id === commentId 
                ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                : c
        ));
    };

    const formatRelativeTime = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value || '');
        const diffMs = Date.now() - date.getTime();
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;
        if (diffMs < minute) return 'Ahora';
        if (diffMs < hour) return `Hace ${Math.max(1, Math.floor(diffMs / minute))} min`;
        if (diffMs < day) return `Hace ${Math.max(1, Math.floor(diffMs / hour))} h`;
        if (diffMs < 7 * day) return `Hace ${Math.max(1, Math.floor(diffMs / day))} días`;
        return date.toLocaleDateString('es-ES');
    };

    if (loading) {
        return (
            <div className="pf-loading">
                <div className="pf-loader"><span></span><span></span><span></span></div>
            </div>
        );
    }

    if (error) return <div className="pf-error">{error}</div>;
    if (!user) return null;

    const toArray = (value) => (Array.isArray(value) ? value : (value ? [value] : []));
    const normalizeSocialValue = (value) => String(value || '').trim();
    const buildSocialUrl = (key, value) => {
        const raw = normalizeSocialValue(value);
        if (!raw) return '';
        if (/^https?:\/\//i.test(raw)) return raw;
        if (key === 'twitter') return `https://x.com/${raw.replace(/^@/, '')}`;
        if (key === 'twitch') return `https://twitch.tv/${raw}`;
        if (key === 'youtube') return `https://youtube.com/${raw}`;
        if (key === 'instagram') return `https://instagram.com/${raw.replace(/^@/, '')}`;
        if (key === 'tiktok') return `https://tiktok.com/@${raw.replace(/^@/, '')}`;
        return `https://${raw}`;
    };

    const normalizedGames = Array.isArray(user.selectedGames)
        ? user.selectedGames
        : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    const normalizedPlatforms = toArray(user.platforms);
    const normalizedGoals = toArray(user.goals);
    const normalizedLanguages = toArray(user.languages);
    const normalizedPreferredRoles = toArray(user.preferredRoles);
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    const userStatus = STATUS_LIST.find(s => s.id === user.status) || STATUS_LIST[0];
    const resolvedUserAvatar = resolveMediaUrl(user.avatar);

    const socialIcons = [
        { key: 'twitch', icon: <FaTwitch />, color: '#9146FF' },
        { key: 'youtube', icon: <FaYoutube />, color: '#FF0000' },
        { key: 'twitter', icon: <FaTwitter />, color: '#1DA1F2' },
        { key: 'instagram', icon: <FaInstagram />, color: '#E4405F' },
        { key: 'tiktok', icon: <FaTiktok />, color: '#00f2ea' }
    ];
    const activeSocials = socialIcons
        .map((social) => ({
            ...social,
            value: normalizeSocialValue(user.socialLinks?.[social.key]),
            href: buildSocialUrl(social.key, user.socialLinks?.[social.key])
        }))
        .filter((social) => social.value && social.href);
    const onlineFriends = friends.filter((friend) =>
        ['online', 'gaming', 'tournament', 'streaming', 'searching'].includes(String(friend?.status || '').toLowerCase())
    );
    const socialCounts = socialData?.counts || {
        friends: socialData?.friends?.length || 0,
        followers: socialData?.followers?.length || 0,
        following: socialData?.following?.length || 0
    };
    const socialTabs = [
        { id: 'friends', label: 'Amigos', count: Number(socialCounts.friends || 0) },
        { id: 'followers', label: 'Seguidores', count: Number(socialCounts.followers || 0) },
        { id: 'following', label: 'Siguiendo', count: Number(socialCounts.following || 0) },
        { id: 'discover', label: 'Buscar', count: null }
    ];
    const activeSocialList = socialTab === 'discover'
        ? socialSearchResults
        : (Array.isArray(socialData?.[socialTab]) ? socialData[socialTab] : []);
    const socialEmptyText = socialTab === 'discover'
        ? 'Escribe al menos 2 caracteres para buscar por nombre, username o número.'
        : (socialTab === 'followers'
            ? 'Aún no tienes seguidores.'
            : (socialTab === 'following'
                ? 'Aún no sigues a nadie.'
                : 'Aún no tienes amigos mutuos.'));
    const normalizeId = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object') {
            if (value._id) return String(value._id);
            if (value.id) return String(value.id);
        }
        return String(value);
    };
    const currentUserId = normalizeId(user?._id || user?.id);
    const getTeamRoleForCurrentUser = (team) => {
        if (!team || !currentUserId) return 'Miembro';
        if (normalizeId(team?.captain) === currentUserId) return 'Capitán';

        const coach = team?.roster?.coach || null;
        if (coach?.user && normalizeId(coach.user) === currentUserId) {
            const coachRole = String(coach?.role || '').trim();
            return coachRole ? `Coach (${coachRole})` : 'Coach';
        }

        const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
        const starterSlot = starters.find((slot) => normalizeId(slot?.user) === currentUserId);
        if (starterSlot) {
            const slotRole = String(starterSlot?.role || '').trim();
            return slotRole ? `Titular (${slotRole})` : 'Titular';
        }

        const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
        const subSlot = subs.find((slot) => normalizeId(slot?.user) === currentUserId);
        if (subSlot) {
            const slotRole = String(subSlot?.role || '').trim();
            return slotRole ? `Suplente (${slotRole})` : 'Suplente';
        }

        return 'Miembro';
    };
    const getTeamRosterSummary = (team) => {
        const starters = Array.isArray(team?.roster?.starters) ? team.roster.starters : [];
        const subs = Array.isArray(team?.roster?.subs) ? team.roster.subs : [];
        const coach = team?.roster?.coach || null;

        const startersFilled = starters.filter((slot) => Boolean(normalizeId(slot?.user))).length;
        const subsFilled = subs.filter((slot) => Boolean(normalizeId(slot?.user))).length;
        const coachFilled = coach?.user ? 1 : 0;

        const startersCapRaw = Number(team?.maxMembers);
        const subsCapRaw = Number(team?.maxSubstitutes);
        const startersCap = Number.isFinite(startersCapRaw) && startersCapRaw > 0 ? startersCapRaw : starters.length;
        const subsCap = Number.isFinite(subsCapRaw) && subsCapRaw > 0 ? subsCapRaw : subs.length;
        const coachCap = coach ? 1 : 0;

        const segments = [];
        if (startersCap > 0 || startersFilled > 0) {
            segments.push(`Titulares ${startersFilled}/${Math.max(startersCap, startersFilled)}`);
        }
        if (subsCap > 0 || subsFilled > 0) {
            segments.push(`Subs ${subsFilled}/${Math.max(subsCap, subsFilled)}`);
        }
        if (coachCap > 0 || coachFilled > 0) {
            segments.push(`Coach ${coachFilled}/${Math.max(coachCap, coachFilled)}`);
        }
        return segments.join(' · ');
    };
    const getTeamCodeDisplay = (rawCode) => {
        const raw = String(rawCode || '').trim();
        if (!raw) return '';
        const numeric = raw.replace(/[^\d]/g, '');
        return numeric || raw;
    };

    return (
        <div className="pf">
            <PageHud page="PERFIL" />
            
            {/* ════════════════════════════════════════
                HERO BANNER
               ════════════════════════════════════════ */}
            <section className="pf-banner">
                <div className="pf-banner__bg">
                    <img src={currentBg.src} alt="" />
                    <div className="pf-banner__overlay" />
                    <div className="pf-banner__glow pf-banner__glow--1" />
                    <div className="pf-banner__glow pf-banner__glow--2" />
                </div>

                <div className="pf-banner__content">
                    {/* Avatar */}
                    <motion.div 
                        className="pf-avatar"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                    >
                        <div className="pf-avatar__ring">
                            <AvatarCircle
                                src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                frameConfig={currentFrame}
                                size="150px"
                                status={user.status}
                            />
                        </div>
                        <div className="pf-avatar__status" style={{ '--status-color': userStatus.color }}>
                            <span className="pf-avatar__status-dot" />
                            {userStatus.label}
                        </div>
                    </motion.div>

                    {/* Info */}
                    <div className="pf-hero-info">
                        <div className="pf-hero-info__top">
                            <PlayerTag name={user.username || "Player"} tagId={user.selectedTagId} size="large" />
                            <div className="pf-badges">
                                <span className="pf-badge pf-badge--verified"><FaCheck /> Verificado</span>
                                <span className="pf-badge pf-badge--pro"><FaGem /> PRO</span>
                                {user.university?.verified && (
                                    <span className="pf-badge pf-badge--student">
                                        <FaGraduationCap /> Estudiante verificado
                                    </span>
                                )}
                            </div>
                        </div>

                        {user.fullName && <p className="pf-hero-info__fullname">{user.fullName}</p>}
                        
                        <div className="pf-hero-info__meta">
                            {user.country && <span><FaFlag /> {user.country}</span>}
                            <span><FaCalendarAlt /> Miembro desde {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
                            {user.userCode && (
                                <span className="pf-hero-info__meta--id">#{user.userCode}</span>
                            )}
                            {user.university?.verified && user.university?.universityName && (
                                <span className="pf-hero-info__meta--student">
                                    <FaGraduationCap /> {user.university.universityName}
                                </span>
                            )}
                            {user.connections?.discord?.verified && (
                                <span className="pf-hero-info__meta--discord"><FaDiscord /> {user.connections.discord.username}</span>
                            )}
                        </div>

                        {user.bio && <p className="pf-hero-info__bio">{user.bio}</p>}

                        {/* Social Links */}
                        {activeSocials.length > 0 && (
                            <div className="pf-hero-info__socials">
                                {activeSocials.map(s => (
                                    <a
                                        key={s.key}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="pf-social-link"
                                        style={{ '--social-color': s.color }}
                                    >
                                        {s.icon}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pf-hero-actions">
                        {isOwnProfile ? (
                            <>
                                <button className="pf-btn pf-btn--primary" onClick={() => navigate('/edit-profile')}>
                                    <FaUserEdit /> Editar
                                </button>
                                <button className="pf-btn pf-btn--ghost" onClick={handleShareProfile}>
                                    {copiedLink ? <><FaCheck /> Copiado</> : <><FaShareAlt /> Compartir</>}
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="pf-btn pf-btn--primary">
                                    <FaUserPlus /> Seguir
                                </button>
                                <button className="pf-btn pf-btn--ghost">
                                    <FaComment /> Mensaje
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                STATS HIGHLIGHTS
               ════════════════════════════════════════ */}
            <section className="pf-highlights">
                <div className="pf-highlight">
                    <FaCrosshairs className="pf-highlight__icon" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{Number(profileStats.matches || 0).toLocaleString()}</span>
                        <span className="pf-highlight__label">Partidas</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaTrophy className="pf-highlight__icon pf-highlight__icon--gold" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{Number(profileStats.tournamentsWon || 0)}</span>
                        <span className="pf-highlight__label">Torneos Ganados</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaChartLine className="pf-highlight__icon pf-highlight__icon--green" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{Number(profileStats.winRate || 0)}%</span>
                        <span className="pf-highlight__label">Win Rate</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaStar className="pf-highlight__icon pf-highlight__icon--purple" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{Number(profileStats.mvps || 0)}</span>
                        <span className="pf-highlight__label">MVPs</span>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════
                MAIN CONTENT GRID
               ════════════════════════════════════════ */}
            <main className="pf-main">
                {/* LEFT COLUMN */}
                <div className="pf-col pf-col--left">
                    {/* Games Hub */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaGamepad /> Juegos</h3>
                        </div>
                        <div className="pf-games">
                            {normalizedGames.length > 0 ? (
                                normalizedGames.slice(0, 3).map((gameId, i) => {
                                    const imgSrc = Object.entries(GAME_IMAGES).find(([key]) =>
                                        key.toLowerCase().includes(gameId.toLowerCase())
                                    )?.[1] || GAME_IMAGES.Default;
                                    return (
                                        <div key={i} className={`pf-game ${i === 0 ? 'pf-game--main' : ''}`}>
                                            <img src={imgSrc} alt={gameId} />
                                            <div className="pf-game__info">
                                                <span className="pf-game__name">{gameId}</span>
                                                {i === 0 && <span className="pf-game__badge"><FaStar /> MAIN</span>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="pf-empty-sm">Sin juegos</div>
                            )}
                        </div>
                    </section>

                    {/* Gamer Profile Hub */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaCrosshairs /> Perfil Gamer</h3>
                        </div>
                        <div className="pf-profile-details">
                            <div className="pf-profile-details__row">
                                <span className="pf-profile-details__label">Roles</span>
                                <div className="pf-profile-details__chips">
                                    {normalizedPreferredRoles.length > 0
                                        ? normalizedPreferredRoles.map((role) => (
                                            <span key={role} className="pf-chip">{role}</span>
                                        ))
                                        : <span className="pf-empty-sm">Sin roles</span>}
                                </div>
                            </div>
                            <div className="pf-profile-details__row">
                                <span className="pf-profile-details__label">Idiomas</span>
                                <div className="pf-profile-details__chips">
                                    {normalizedLanguages.length > 0
                                        ? normalizedLanguages.map((lang) => (
                                            <span key={lang} className="pf-chip">{lang}</span>
                                        ))
                                        : <span className="pf-empty-sm">Sin idiomas</span>}
                                </div>
                            </div>
                            <div className="pf-profile-details__row">
                                <span className="pf-profile-details__label">Plataformas</span>
                                <div className="pf-profile-details__chips">
                                    {normalizedPlatforms.length > 0
                                        ? normalizedPlatforms.map((platform) => (
                                            <span key={platform} className="pf-chip">{platform}</span>
                                        ))
                                        : <span className="pf-empty-sm">Sin plataformas</span>}
                                </div>
                            </div>
                            <div className="pf-profile-details__row">
                                <span className="pf-profile-details__label">Objetivos</span>
                                <div className="pf-profile-details__chips">
                                    {normalizedGoals.length > 0
                                        ? normalizedGoals.map((goal) => (
                                            <span key={goal} className="pf-chip">{goal}</span>
                                        ))
                                        : <span className="pf-empty-sm">Sin objetivos</span>}
                                </div>
                            </div>
                            <div className="pf-profile-details__flags">
                                <span className={`pf-flag ${user.lookingForTeam ? 'is-active' : ''}`}>
                                    <FaUsers /> {user.lookingForTeam ? 'Buscando equipo' : 'No busca equipo'}
                                </span>
                                {user.university?.verified && (
                                    <span className="pf-flag is-active">
                                        <FaGraduationCap /> Estudiante verificado
                                    </span>
                                )}
                                <span className={`pf-flag ${user.isProfileHidden ? 'is-active' : ''}`}>
                                    <FaShieldAlt /> {user.isProfileHidden ? 'Perfil privado' : 'Perfil visible'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Friends Hub */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaUserFriends /> Amigos</h3>
                            <span className="pf-hub__count">{onlineFriends.length} en línea</span>
                        </div>
                        {friends.length > 0 ? (
                            <>
                                <div className="pf-friends">
                                    {friends.slice(0, 6).map((friend, index) => {
                                        const friendId = normalizeId(friend?.id || friend?._id || friend?.userId);
                                        const fallbackKey = `${String(friend?.userCode || friend?.name || 'friend')}-${index}`;
                                        const friendPreview = (
                                            <div key={friendId || fallbackKey} className="pf-friend">
                                                <div className="pf-friend__avatar">
                                                    <img
                                                        src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=1a1a2e&color=8EDB15`}
                                                        alt={friend.name}
                                                    />
                                                    <span className={`pf-friend__status pf-friend__status--${String(friend.status || '').toLowerCase()}`} />
                                                </div>
                                                <div className="pf-friend__info">
                                                    <span className="pf-friend__name">{friend.name}</span>
                                                    {friend.userCode && (
                                                        <span className="pf-friend__code">#{friend.userCode}</span>
                                                    )}
                                                    <span className="pf-friend__rank">{friend.rank || 'Jugador'}</span>
                                                </div>
                                            </div>
                                        );

                                        if (!friendId) return friendPreview;

                                        return (
                                            <UserCard key={friendId} userId={friendId}>
                                                {friendPreview}
                                            </UserCard>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <div className="pf-empty-sm">Aún no tienes compañeros sincronizados.</div>
                        )}
                        <button className="pf-hub__more pf-hub__more--social" onClick={() => navigate('/friends')}>
                            Ver todos ({Math.max(Number(socialCounts.friends || 0), friends.length)}) <FaChevronRight />
                        </button>
                    </section>

                    {/* Teams Hub */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaShieldAlt /> Equipos</h3>
                        </div>
                        {user.teams?.length > 0 ? (
                            <div className="pf-teams">
                                {user.teams.slice(0, 3).map(team => {
                                    const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name || 'T')}&background=1a1a2e&color=8EDB15&size=128&bold=true`;
                                    const teamRole = getTeamRoleForCurrentUser(team);
                                    const rosterSummary = getTeamRosterSummary(team);
                                    const teamLevel = String(team?.teamLevel || '').trim() || 'Sin nivel';
                                    const teamCountry = String(team?.teamCountry || '').trim() || 'Sin país';
                                    const universityName = String(team?.university?.universityName || '').trim();
                                    const teamType = team?.university?.isUniversityTeam
                                        ? (universityName ? `Universitario (${universityName})` : 'Universitario')
                                        : 'Club';
                                    const teamCodeDisplay = getTeamCodeDisplay(team?.teamCode);
                                    return (
                                        <div
                                            key={team._id}
                                            className="pf-team"
                                            onClick={() => navigate('/teams', {
                                                state: {
                                                    teamId: team?._id,
                                                    openPreview: true
                                                }
                                            })}
                                        >
                                            <img src={resolveMediaUrl(team.logo || team.avatar) || defaultLogo} alt={team.name} onError={e => e.target.src = defaultLogo} />
                                            <div className="pf-team__info">
                                                <h4>{team.name}</h4>
                                                <span>{team.game || 'Sin juego'} · {teamLevel}</span>
                                                <small className="pf-team__meta">{teamCountry} · {teamType} · {teamRole}</small>
                                                {rosterSummary && <small className="pf-team__roster">{rosterSummary}</small>}
                                                {teamCodeDisplay && <small className="pf-team__code">{teamCodeDisplay}</small>}
                                            </div>
                                            <FaChevronRight />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="pf-empty">
                                <FaShieldAlt />
                                <p>Sin equipos</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* CENTER COLUMN - Comments Wall */}
                <div className="pf-col pf-col--center">
                    <section className="pf-hub pf-hub--comments">
                        <div className="pf-hub__header">
                            <h3><FaComment /> Muro</h3>
                            <span className="pf-hub__count">{comments.length} comentarios</span>
                        </div>

                        {/* Comment Input */}
                        <form className="pf-comment-form" onSubmit={handleSubmitComment}>
                            <img 
                                src={resolvedUserAvatar || `https://ui-avatars.com/api/?name=${user.username}`} 
                                alt="" 
                                className="pf-comment-form__avatar"
                            />
                            <input
                                type="text"
                                placeholder="Escribe un comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button type="submit" disabled={!newComment.trim() || postingComment}>
                                <FaPaperPlane />
                            </button>
                        </form>
                        {commentError && <div className="pf-comment-error">{commentError}</div>}

                        {/* Comments List */}
                        {comments.length > 0 ? (
                            <div className="pf-comments">
                                {comments.map(comment => (
                                    <motion.div 
                                        key={comment.id} 
                                        className="pf-comment"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <img 
                                            src={resolveMediaUrl(comment?.user?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment?.user?.name || 'U')}&background=1a1a2e&color=8EDB15`} 
                                            alt={comment?.user?.name || 'Usuario'}
                                            className="pf-comment__avatar"
                                        />
                                        <div className="pf-comment__content">
                                            <div className="pf-comment__header">
                                                <span className="pf-comment__name">{comment?.user?.name || 'Usuario'}</span>
                                                <span className="pf-comment__time">{formatRelativeTime(comment?.time)}</span>
                                            </div>
                                            <p className="pf-comment__text">{comment?.text || ''}</p>
                                            <div className="pf-comment__actions">
                                                <button 
                                                    className={`pf-comment__like ${comment.liked ? 'pf-comment__like--active' : ''}`}
                                                    onClick={() => toggleLike(comment.id)}
                                                >
                                                    {comment.liked ? <FaHeart /> : <FaRegHeart />}
                                                    <span>{comment.likes}</span>
                                                </button>
                                                <button className="pf-comment__reply">
                                                    <FaRegComment /> Responder
                                                </button>
                                            </div>
                                        </div>
                                        <button className="pf-comment__menu">
                                            <FaEllipsisH />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="pf-empty-sm">Aún no tienes publicaciones para mostrar.</div>
                        )}
                    </section>
                </div>

                {/* RIGHT COLUMN */}
                <div className="pf-col pf-col--right">
                    {/* Achievements Hub */}
                    <section className="pf-hub pf-hub--achievements">
                        <div className="pf-hub__header">
                            <h3><FaTrophy /> Logros Destacados</h3>
                        </div>
                        {achievements.length > 0 ? (
                            <>
                                <div className="pf-achievements">
                                    {achievements.slice(0, 6).map(ach => (
                                        <div key={ach.id} className={`pf-achievement ${ach.verified ? 'pf-achievement--verified' : ''}`}>
                                            <span className="pf-achievement__icon">{ach.icon}</span>
                                            <div className="pf-achievement__info">
                                                <h4>{ach.name}</h4>
                                                <span>{ach.tournament}</span>
                                                <span className="pf-achievement__date">{ach.game} • {ach.date}</span>
                                            </div>
                                            {ach.verified && (
                                                <span className="pf-achievement__badge"><FaCheck /></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button className="pf-hub__more">
                                    Ver todos los logros <FaChevronRight />
                                </button>
                            </>
                        ) : (
                            <div className="pf-empty-sm">Aún no hay logros registrados.</div>
                        )}
                    </section>

                    {/* Recent Activity */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaFire /> Actividad Reciente</h3>
                        </div>
                        {activities.length > 0 ? (
                            <div className="pf-activity">
                                {activities.slice(0, 8).map((item) => (
                                    <div key={item.id} className={`pf-activity__item pf-activity__item--${item.type || 'rank'}`}>
                                        <div className="pf-activity__dot" />
                                        <div className="pf-activity__content">
                                            <p>
                                                <strong>{item.title || 'Actividad'}</strong>
                                                {item.text ? ` · ${item.text}` : ''}
                                            </p>
                                            <span>{formatRelativeTime(item.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="pf-empty-sm">Sin actividad reciente.</div>
                        )}
                    </section>
                </div>
            </main>

            <AnimatePresence>
                {socialModalOpen && (
                    <motion.div
                        className="pf-social-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSocialModalOpen(false)}
                    >
                        <motion.div
                            className="pf-social-modal__panel"
                            initial={{ y: 24, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 24, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="pf-social-modal__header">
                                <h3><FaUserFriends /> Centro de Amigos</h3>
                                <button onClick={() => setSocialModalOpen(false)}><FaTimes /></button>
                            </div>

                            <div className="pf-social-tabs">
                                {socialTabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`pf-social-tab ${socialTab === tab.id ? 'is-active' : ''}`}
                                        onClick={() => {
                                            setSocialTab(tab.id);
                                            setSocialError('');
                                        }}
                                    >
                                        <span>{tab.label}</span>
                                        {tab.count !== null && <small>{tab.count}</small>}
                                    </button>
                                ))}
                            </div>

                            {socialTab === 'discover' && (
                                <div className="pf-social-search">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        value={socialSearch}
                                        onChange={(event) => setSocialSearch(event.target.value)}
                                        placeholder="Buscar por username, nombre o número..."
                                    />
                                </div>
                            )}

                            {socialError && <div className="pf-social-error">{socialError}</div>}

                            <div className="pf-social-list">
                                {(socialLoading || socialSearchLoading) ? (
                                    <div className="pf-empty-sm">Cargando...</div>
                                ) : activeSocialList.length > 0 ? (
                                    activeSocialList.map((entry) => {
                                        const targetId = String(entry?.id || '');
                                        return (
                                            <div key={targetId} className="pf-social-item">
                                                <div className="pf-social-item__left">
                                                    <img
                                                        src={resolveMediaUrl(entry?.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(entry?.name || 'U')}&background=1a1a2e&color=8EDB15`}
                                                        alt={entry?.name || 'Usuario'}
                                                    />
                                                    <div>
                                                        <strong>{entry?.name || 'Jugador'}</strong>
                                                        <span>@{entry?.username || 'usuario'}</span>
                                                        {entry?.userCode && (
                                                            <span className="pf-social-item__code">#{entry.userCode}</span>
                                                        )}
                                                        <small>{entry?.rank || 'Jugador'} · {entry?.status || 'offline'}</small>
                                                    </div>
                                                </div>
                                                <button
                                                    className={`pf-social-item__follow ${entry?.isFollowing ? 'is-following' : ''}`}
                                                    onClick={() => handleToggleFollowUser(targetId)}
                                                    disabled={Boolean(followBusyIds[targetId])}
                                                >
                                                    {followBusyIds[targetId]
                                                        ? '...'
                                                        : (entry?.isFollowing ? 'Siguiendo' : 'Seguir')}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="pf-empty-sm">{socialEmptyText}</div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
