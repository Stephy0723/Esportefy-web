import React, { useState, useEffect } from 'react';
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
    FaRegHeart, FaRegComment, FaTimes
} from 'react-icons/fa';
import { GAME_IMAGES } from '../../../data/gameImages';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { STATUS_LIST } from '../../../data/defaultAvatars';
import PageHud from '../../../components/PageHud/PageHud';
import { resolveMediaUrl } from '../../../utils/media';
import './Profile.css';

/* ═══════════════════════════════
   MOCK DATA - Datos de ejemplo
   ═══════════════════════════════ */

// Logros destacados
const MOCK_ACHIEVEMENTS = [
    { id: 1, name: "Campeón Nacional", icon: "🏆", tournament: "Copa RD 2025", game: "MLBB", date: "Feb 2025", verified: true },
    { id: 2, name: "MVP del Torneo", icon: "⭐", tournament: "Liga Caribe", game: "MLBB", date: "Ene 2025", verified: true },
    { id: 3, name: "Top 10 Nacional", icon: "🔥", tournament: "Ranking MLBB", game: "MLBB", date: "2024", verified: true },
    { id: 4, name: "Racha de 15 Wins", icon: "💀", tournament: "Ranked Solo", game: "MLBB", date: "Dic 2024", verified: false },
];

// Estadísticas principales
const MOCK_STATS = {
    matches: 1247,
    wins: 891,
    winRate: 71,
    tournaments: 34,
    tournamentsWon: 12,
    mvps: 23,
};

// Amigos
const MOCK_FRIENDS = [
    { id: 1, name: "DragonSlayer", avatar: null, status: "online", rank: "Mythic Glory" },
    { id: 2, name: "NightHawk99", avatar: null, status: "ingame", rank: "Mythical Honor" },
    { id: 3, name: "ShadowBlade", avatar: null, status: "online", rank: "Mythic" },
    { id: 4, name: "CyberNinja", avatar: null, status: "offline", rank: "Legend" },
    { id: 5, name: "PhoenixFire", avatar: null, status: "online", rank: "Mythic Glory" },
    { id: 6, name: "StormRider", avatar: null, status: "away", rank: "Mythical Honor" },
    { id: 7, name: "BlazeMaster", avatar: null, status: "online", rank: "Mythic" },
    { id: 8, name: "IceQueen", avatar: null, status: "ingame", rank: "Mythic Glory" },
];

// Comentarios del muro
const MOCK_COMMENTS = [
    { 
        id: 1, 
        user: { name: "DragonSlayer", avatar: null }, 
        text: "GG bro! Ese último torneo estuvo increíble 🔥", 
        time: "Hace 2 horas",
        likes: 12,
        liked: false
    },
    { 
        id: 2, 
        user: { name: "NightHawk99", avatar: null }, 
        text: "Cuando jugamos ranked? Te debo la revancha 💪", 
        time: "Hace 5 horas",
        likes: 8,
        liked: true
    },
    { 
        id: 3, 
        user: { name: "ShadowBlade", avatar: null }, 
        text: "El mejor jungler de RD sin dudas! 🏆", 
        time: "Ayer",
        likes: 24,
        liked: false
    },
    { 
        id: 4, 
        user: { name: "PhoenixFire", avatar: null }, 
        text: "Ese pentakill con Ling fue legendario hermano", 
        time: "Hace 2 días",
        likes: 31,
        liked: true
    },
];

/* ════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════ */
const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [comments, setComments] = useState(MOCK_COMMENTS);
    const [isOwnProfile, setIsOwnProfile] = useState(true); // Para determinar si es el perfil propio
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const res = await axios.get(`${API_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
                setLoading(false);
            } catch (err) {
                setError("No se pudo cargar el perfil.");
                setLoading(false);
                if (err.response?.status === 401) navigate('/login');
            }
        };
        fetchUserProfile();
    }, [navigate]);

    const handleShareProfile = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleSubmitComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        const comment = {
            id: Date.now(),
            user: { name: user?.username || "Tú", avatar: null },
            text: newComment,
            time: "Ahora",
            likes: 0,
            liked: false
        };
        setComments([comment, ...comments]);
        setNewComment('');
    };

    const toggleLike = (commentId) => {
        setComments(comments.map(c => 
            c.id === commentId 
                ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                : c
        ));
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

    const normalizedGames = Array.isArray(user.selectedGames)
        ? user.selectedGames
        : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    const userStatus = STATUS_LIST.find(s => s.id === user.status) || STATUS_LIST[0];
    const resolvedUserAvatar = resolveMediaUrl(user.avatar);

    const socialIcons = [
        { key: 'twitch', icon: <FaTwitch />, color: '#9146FF' },
        { key: 'youtube', icon: <FaYoutube />, color: '#FF0000' },
        { key: 'twitter', icon: <FaTwitter />, color: '#1DA1F2' },
        { key: 'instagram', icon: <FaInstagram />, color: '#E4405F' },
        { key: 'tiktok', icon: <FaTiktok />, color: '#00f2ea' },
    ];
    const activeSocials = socialIcons.filter(s => user.socialLinks?.[s.key]);
    const onlineFriends = MOCK_FRIENDS.filter(f => f.status === 'online' || f.status === 'ingame');

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
                            </div>
                        </div>

                        {user.fullName && <p className="pf-hero-info__fullname">{user.fullName}</p>}
                        
                        <div className="pf-hero-info__meta">
                            {user.country && <span><FaFlag /> {user.country}</span>}
                            <span><FaCalendarAlt /> Miembro desde {new Date(user.createdAt || Date.now()).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
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
                                        href={`https://${s.key === 'twitter' ? 'x' : s.key}.com/${user.socialLinks[s.key]}`}
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
                        <span className="pf-highlight__value">{MOCK_STATS.matches.toLocaleString()}</span>
                        <span className="pf-highlight__label">Partidas</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaTrophy className="pf-highlight__icon pf-highlight__icon--gold" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{MOCK_STATS.tournamentsWon}</span>
                        <span className="pf-highlight__label">Torneos Ganados</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaChartLine className="pf-highlight__icon pf-highlight__icon--green" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{MOCK_STATS.winRate}%</span>
                        <span className="pf-highlight__label">Win Rate</span>
                    </div>
                </div>
                <div className="pf-highlight">
                    <FaStar className="pf-highlight__icon pf-highlight__icon--purple" />
                    <div className="pf-highlight__data">
                        <span className="pf-highlight__value">{MOCK_STATS.mvps}</span>
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

                    {/* Friends Hub */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaUserFriends /> Amigos</h3>
                            <span className="pf-hub__count">{onlineFriends.length} en línea</span>
                        </div>
                        <div className="pf-friends">
                            {MOCK_FRIENDS.slice(0, 6).map(friend => (
                                <div key={friend.id} className="pf-friend">
                                    <div className="pf-friend__avatar">
                                        <img src={`https://ui-avatars.com/api/?name=${friend.name}&background=1a1a2e&color=8EDB15`} alt={friend.name} />
                                        <span className={`pf-friend__status pf-friend__status--${friend.status}`} />
                                    </div>
                                    <div className="pf-friend__info">
                                        <span className="pf-friend__name">{friend.name}</span>
                                        <span className="pf-friend__rank">{friend.rank}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="pf-hub__more">
                            Ver todos ({MOCK_FRIENDS.length}) <FaChevronRight />
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
                                    return (
                                        <div key={team._id} className="pf-team">
                                            <img src={resolveMediaUrl(team.logo) || defaultLogo} alt={team.name} onError={e => e.target.src = defaultLogo} />
                                            <div className="pf-team__info">
                                                <h4>{team.name}</h4>
                                                <span>{team.game}</span>
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
                            <button type="submit" disabled={!newComment.trim()}>
                                <FaPaperPlane />
                            </button>
                        </form>

                        {/* Comments List */}
                        <div className="pf-comments">
                            {comments.map(comment => (
                                <motion.div 
                                    key={comment.id} 
                                    className="pf-comment"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${comment.user.name}&background=1a1a2e&color=8EDB15`} 
                                        alt={comment.user.name}
                                        className="pf-comment__avatar"
                                    />
                                    <div className="pf-comment__content">
                                        <div className="pf-comment__header">
                                            <span className="pf-comment__name">{comment.user.name}</span>
                                            <span className="pf-comment__time">{comment.time}</span>
                                        </div>
                                        <p className="pf-comment__text">{comment.text}</p>
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
                    </section>
                </div>

                {/* RIGHT COLUMN */}
                <div className="pf-col pf-col--right">
                    {/* Achievements Hub */}
                    <section className="pf-hub pf-hub--achievements">
                        <div className="pf-hub__header">
                            <h3><FaTrophy /> Logros Destacados</h3>
                        </div>
                        <div className="pf-achievements">
                            {MOCK_ACHIEVEMENTS.map(ach => (
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
                    </section>

                    {/* Recent Activity */}
                    <section className="pf-hub">
                        <div className="pf-hub__header">
                            <h3><FaFire /> Actividad Reciente</h3>
                        </div>
                        <div className="pf-activity">
                            <div className="pf-activity__item pf-activity__item--win">
                                <div className="pf-activity__dot" />
                                <div className="pf-activity__content">
                                    <p>Ganó torneo <strong>Copa Caribe</strong></p>
                                    <span>Hace 2 días</span>
                                </div>
                            </div>
                            <div className="pf-activity__item pf-activity__item--team">
                                <div className="pf-activity__dot" />
                                <div className="pf-activity__content">
                                    <p>Se unió a <strong>Hispaniola Esports</strong></p>
                                    <span>Hace 1 semana</span>
                                </div>
                            </div>
                            <div className="pf-activity__item pf-activity__item--rank">
                                <div className="pf-activity__dot" />
                                <div className="pf-activity__content">
                                    <p>Subió a <strong>Mythic Glory</strong></p>
                                    <span>Hace 2 semanas</span>
                                </div>
                            </div>
                            <div className="pf-activity__item pf-activity__item--achievement">
                                <div className="pf-activity__dot" />
                                <div className="pf-activity__content">
                                    <p>Desbloqueó <strong>MVP del Torneo</strong></p>
                                    <span>Hace 3 semanas</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default Profile;
