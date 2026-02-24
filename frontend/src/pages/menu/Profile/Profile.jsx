import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import {
    FaUserEdit, FaGamepad, FaTrophy, FaGlobeAmericas, FaQuoteLeft,
    FaDiscord, FaShareAlt, FaBullseye,
    FaHeart, FaRegHeart, FaComment, FaShare, FaImage,
    FaSmile, FaUserFriends, FaMedal, FaLock, FaEllipsisH,
    FaBookmark, FaRegBookmark, FaUsers, FaChevronRight, FaPaperPlane,
    FaFlag, FaLanguage, FaUserShield, FaCrown, FaStar,
    FaCrosshairs, FaSkull, FaBolt, FaFire, FaShieldAlt,
    FaTwitch, FaYoutube, FaTwitter, FaInstagram, FaTiktok,
    FaBirthdayCake, FaVenusMars, FaHandshake, FaLink
} from 'react-icons/fa';
import { GAME_IMAGES } from '../../../data/gameImages';
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions';
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle';
import PlayerTag from '../../../components/PlayerTag/PlayerTag';
import { STATUS_LIST } from '../../../data/defaultAvatars';
import UserCard from '../../../components/UserCard/UserCard';
import PageHud from '../../../components/PageHud/PageHud';
import './Profile.css';

/* ═══════════════════════════════
   MOCK DATA — Gaming Profile
   ═══════════════════════════════ */
const MOCK_POSTS = [
    { id: 1, text: "¡Acabo de ganar mi primera partida ranked en Valorant! El grind valió la pena 🎯🔥", image: null, likes: 24, comments: 5, shares: 2, timestamp: "Hace 2h", liked: false, saved: false },
    { id: 2, text: "Nuevo setup gaming listo para la temporada competitiva 💻🎮", image: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&h=400&fit=crop", likes: 87, comments: 12, shares: 8, timestamp: "Hace 5h", liked: true, saved: true },
    { id: 3, text: "GG al equipo rival. Nos llevamos el primer puesto del torneo universitario 🏆✨", image: null, likes: 156, comments: 32, shares: 15, timestamp: "Ayer", liked: false, saved: false },
];

const MOCK_FRIENDS = [
    { id: 1, username: "NightWolf", status: "online" },
    { id: 2, username: "ShadowBlade", status: "gaming" },
    { id: 3, username: "PhoenixRise", status: "streaming" },
    { id: 4, username: "IceStorm", status: "offline" },
    { id: 5, username: "ThunderGod", status: "afk" },
    { id: 6, username: "DragonSlayer", status: "tournament" },
    { id: 7, username: "CyberNinja", status: "dnd" },
    { id: 8, username: "StarKiller", status: "searching" },
];

const MOCK_ACHIEVEMENTS = [
    { id: 1, name: "Primera Victoria", icon: "🏆", desc: "Gana tu primera partida",  unlocked: true,  rarity: "common" },
    { id: 2, name: "Racha Imparable",  icon: "🔥", desc: "5 victorias consecutivas", unlocked: true,  rarity: "rare" },
    { id: 3, name: "Organizador Pro",  icon: "📋", desc: "Crea tu primer torneo",    unlocked: true,  rarity: "epic" },
    { id: 4, name: "Social Butterfly", icon: "🦋", desc: "Añade 10 amigos",          unlocked: false, rarity: "common" },
    { id: 5, name: "Veterano",         icon: "⭐", desc: "100 partidas jugadas",      unlocked: false, rarity: "legendary" },
    { id: 6, name: "Líder Nato",       icon: "👑", desc: "Capitán de un equipo",      unlocked: true,  rarity: "epic" },
];

const MOCK_STATS = [
    { label: "Partidas", value: "347", icon: <FaCrosshairs /> },
    { label: "Victorias", value: "198", icon: <FaTrophy /> },
    { label: "Win Rate", value: "57%", icon: <FaBolt /> },
    { label: "Racha Máx", value: "12", icon: <FaFire /> },
    { label: "K/D Ratio", value: "2.4", icon: <FaSkull /> },
    { label: "MVPs", value: "43", icon: <FaStar /> },
];

/* ════════════════════════════
   COMPONENT
   ════════════════════════════ */
const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [posts, setPosts] = useState(MOCK_POSTS);
    const [newPostText, setNewPostText] = useState('');
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

    const handleLike = (id) => setPosts(p => p.map(x => x.id === id ? { ...x, liked: !x.liked, likes: x.liked ? x.likes - 1 : x.likes + 1 } : x));
    const handleSave = (id) => setPosts(p => p.map(x => x.id === id ? { ...x, saved: !x.saved } : x));
    const handlePost = () => {
        if (!newPostText.trim()) return;
        setPosts(p => [{ id: Date.now(), text: newPostText, image: null, likes: 0, comments: 0, shares: 0, timestamp: "Ahora", liked: false, saved: false }, ...p]);
        setNewPostText('');
    };

    if (loading) return <div className="loading-container"><div className="loader"></div><p>Sincronizando...</p></div>;
    if (error) return <div className="error-text">{error}</div>;
    if (!user) return null;

    const normalizedGames = Array.isArray(user.selectedGames) ? user.selectedGames : (user.selectedGames ? user.selectedGames.split(',').map(g => g.trim()) : []);
    const currentFrame = FRAMES.find(f => f.id === user?.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === user?.selectedBgId) || BACKGROUNDS[0];
    const userStatus = STATUS_LIST.find(s => s.id === user.status) || STATUS_LIST[0];
    const unlockedAch = MOCK_ACHIEVEMENTS.filter(a => a.unlocked);

    // Calculate age
    const calcAge = (birthDate) => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const diff = Date.now() - birth.getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };
    const age = calcAge(user.birthDate);

    // Social links config
    const socialIcons = [
        { key: 'twitch', icon: <FaTwitch />, color: '#9146FF', url: 'https://twitch.tv/' },
        { key: 'youtube', icon: <FaYoutube />, color: '#FF0000', url: 'https://youtube.com/' },
        { key: 'twitter', icon: <FaTwitter />, color: '#1DA1F2', url: 'https://x.com/' },
        { key: 'instagram', icon: <FaInstagram />, color: '#E4405F', url: 'https://instagram.com/' },
        { key: 'tiktok', icon: <FaTiktok />, color: '#00f2ea', url: 'https://tiktok.com/@' },
    ];
    const activeSocials = socialIcons.filter(s => user.socialLinks?.[s.key]);

    /* ════════════════════
       RENDER
       ════════════════════ */
    return (
        <div className="gp">
            <PageHud page="PERFIL" />
            {/* ════ HERO ════ */}
            <section className="gp__hero">
                <img src={currentBg.src} alt="" className="gp__hero-bg" />
                <div className="gp__hero-overlay" />
                {/* Decorative cut lines */}
                <div className="gp__hero-cut gp__hero-cut--1" />
                <div className="gp__hero-cut gp__hero-cut--2" />

                <div className="gp__hero-inner">
                    {/* Left: Avatar + Identity */}
                    <div className="gp__id">
                        <div className="gp__avatar-wrap">
                            <AvatarCircle
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                frameConfig={currentFrame}
                                size="150px"
                                status={user.status}
                            />
                        </div>
                        <div className="gp__id-text">
                            <PlayerTag name={user.username || "Player"} tagId={user.selectedTagId} size="normal" />
                            <p className="gp__realname">{user.fullName}</p>
                            {/* Role tags */}
                            <div className="gp__role-tags">
                                <span className="gp__role-tag gp__role-tag--player"><FaGamepad /> Jugador</span>
                                {user.isOrganizer && (
                                    <span className="gp__role-tag gp__role-tag--org"><FaTrophy /> Organizador</span>
                                )}
                                {user.lookingForTeam && (
                                    <span className="gp__role-tag gp__role-tag--lft"><FaHandshake /> LFT</span>
                                )}
                            </div>
                            {/* Micro info: gender, age */}
                            <div className="gp__micro-info">
                                {user.gender && user.gender !== 'Otro' && (
                                    <span><FaVenusMars /> {user.gender}</span>
                                )}
                                {age && <span><FaBirthdayCake /> {age} años</span>}
                                {user.languages?.length > 0 && (
                                    <span><FaLanguage /> {user.languages.join(', ')}</span>
                                )}
                            </div>
                            <div className="gp__status" style={{ '--sc': userStatus.color }}>
                                <span className="gp__status-dot" />
                                {userStatus.label}
                            </div>
                            {user.connections?.riot?.verified && (
                                <div className={`gp__rank gp__rank--${user.connections.riot.rank?.tier?.toLowerCase() || 'unranked'}`}>
                                    <FaShieldAlt />
                                    {user.connections.riot.rank ? `${user.connections.riot.rank.tier} ${user.connections.riot.rank.division}` : 'UNRANKED'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Quick stats HUD */}
                    <div className="gp__hud">
                        {MOCK_STATS.map((s, i) => (
                            <div key={i} className="gp__hud-cell">
                                <span className="gp__hud-icon">{s.icon}</span>
                                <span className="gp__hud-val">{s.value}</span>
                                <span className="gp__hud-lbl">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions floating */}
                <div className="gp__hero-actions">
                    <button className="gp__btn gp__btn--primary" onClick={() => navigate('/edit-profile')}>
                        <FaUserEdit /> Editar Perfil
                    </button>
                    <button className="gp__btn gp__btn--ghost">
                        <FaShareAlt /> Compartir
                    </button>
                </div>
            </section>

            {/* ════ BIO + CONNECTIONS + FRIENDS (compact bar) ════ */}
            <section className="gp__info-bar">
                <div className="gp__info-bar-inner">
                    {/* Bio */}
                    <div className="gp__info-block">
                        <FaGlobeAmericas className="gp__info-icon" />
                        <div>
                            <small>País</small>
                            <span>{user.country || "—"}</span>
                        </div>
                    </div>
                    <div className="gp__info-sep" />
                    <div className="gp__info-block">
                        <FaBolt className="gp__info-icon" />
                        <div>
                            <small>Nivel</small>
                            <span>{Array.isArray(user.experience) ? user.experience.join(", ") : user.experience || "Principiante"}</span>
                        </div>
                    </div>
                    <div className="gp__info-sep" />
                    {/* Connections */}
                    <div className="gp__info-block">
                        <FaDiscord className="gp__info-icon" style={{ color: '#5865F2' }} />
                        <div>
                            <small>Discord</small>
                            <span>{user.connections?.discord?.verified ? user.connections.discord.username : "—"}</span>
                        </div>
                    </div>
                    <div className="gp__info-sep" />
                    <div className="gp__info-block">
                        <FaBullseye className="gp__info-icon" style={{ color: '#eb0029' }} />
                        <div>
                            <small>Riot</small>
                            <span>{user.connections?.riot?.verified ? `${user.connections.riot.gameName}#${user.connections.riot.tagLine}` : "—"}</span>
                        </div>
                    </div>
                    <div className="gp__info-sep" />
                    {/* Friends mini */}
                    <div className="gp__info-friends">
                        {/* Followers / Following counters */}
                        <div className="gp__follow-counts">
                            <div className="gp__follow-count">
                                <strong>{user.followers?.length || 0}</strong>
                                <span>Seguidores</span>
                            </div>
                            <div className="gp__follow-sep" />
                            <div className="gp__follow-count">
                                <strong>{user.following?.length || 0}</strong>
                                <span>Siguiendo</span>
                            </div>
                        </div>
                        <div className="gp__friends-divider" />
                        <div className="gp__friends-stack">
                            {MOCK_FRIENDS.slice(0, 5).map((f, i) => (
                                <UserCard key={f.id} userId={f.id}>
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${f.username}&background=1a1a2e&color=8EDB15&size=60&bold=true`}
                                        alt={f.username}
                                        className="gp__friends-stack-img"
                                        style={{ zIndex: 5 - i }}
                                    />
                                </UserCard>
                            ))}
                        </div>
                        <span className="gp__friends-count">
                            <FaUserFriends /> {MOCK_FRIENDS.length} amigos
                        </span>
                    </div>
                </div>
                {user.goals && (
                    <div className="gp__quote-bar">
                        <FaQuoteLeft className="gp__quote-icon" />
                        <span>"{user.goals}"</span>
                    </div>
                )}
            </section>

            {/* ════ BIO + SOCIAL + ROLES (identity strip) ════ */}
            {(user.bio || activeSocials.length > 0 || user.preferredRoles?.length > 0) && (
                <section className="gp__identity-strip">
                    {/* Bio */}
                    {user.bio && (
                        <div className="gp__bio-block">
                            <FaQuoteLeft className="gp__bio-quote" />
                            <p className="gp__bio-text">{user.bio}</p>
                        </div>
                    )}

                    {/* Social + Roles row */}
                    <div className="gp__identity-row">
                        {/* Social links */}
                        {activeSocials.length > 0 && (
                            <div className="gp__social-links">
                                <h4><FaLink /> Redes sociales</h4>
                                <div className="gp__social-icons">
                                    {activeSocials.map(s => (
                                        <a
                                            key={s.key}
                                            href={`${s.url}${user.socialLinks[s.key]}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="gp__social-icon-link"
                                            style={{ '--social-color': s.color }}
                                            title={`${s.key}: ${user.socialLinks[s.key]}`}
                                        >
                                            {s.icon}
                                            <span className="gp__social-handle">{user.socialLinks[s.key]}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preferred roles */}
                        {user.preferredRoles?.length > 0 && (
                            <div className="gp__roles-block">
                                <h4><FaCrosshairs /> Roles preferidos</h4>
                                <div className="gp__roles-pills">
                                    {user.preferredRoles.map(role => (
                                        <span key={role} className="gp__role-pill">
                                            <FaCrosshairs /> {role}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* ════ GAMES SHOWCASE ════ */}
            <section className="gp__section">
                <div className="gp__section-header">
                    <h2><FaGamepad /> Mis Juegos</h2>
                    <button className="gp__btn gp__btn--sm" onClick={() => navigate('/settings')}>Editar</button>
                </div>
                {normalizedGames.length > 0 ? (
                    <div className="gp__games-grid">
                        {normalizedGames.map((gameId, i) => {
                            const imgSrc = Object.entries(GAME_IMAGES).find(([key]) =>
                                key.toLowerCase().includes(gameId.toLowerCase())
                            )?.[1] || GAME_IMAGES.Default;
                            return (
                                <div
                                    key={i}
                                    className={`gp__game ${i === 0 ? 'gp__game--hero' : ''}`}
                                    onClick={() => navigate(`/games/${gameId.toLowerCase()}`)}
                                >
                                    <img src={imgSrc} alt={gameId} className="gp__game-img" />
                                    <div className="gp__game-gradient" />
                                    <div className="gp__game-content">
                                        {i === 0 && <span className="gp__game-featured"><FaStar /> MAIN</span>}
                                        <h3 className="gp__game-title">{gameId}</h3>
                                        <div className="gp__game-meta">
                                            <span><FaCrosshairs /> {Math.floor(Math.random() * 400 + 50)}h</span>
                                            <span><FaTrophy /> {Math.floor(Math.random() * 50 + 5)} wins</span>
                                        </div>
                                    </div>
                                    <div className="gp__game-border" />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="gp__empty-state">
                        <FaGamepad />
                        <p>Todavía no seleccionaste juegos</p>
                        <button className="gp__btn gp__btn--primary" onClick={() => navigate('/settings')}>Agregar</button>
                    </div>
                )}
            </section>

            {/* ════ ACHIEVEMENTS ════ */}
            <section className="gp__section">
                <div className="gp__section-header">
                    <h2><FaMedal /> Logros</h2>
                    <span className="gp__ach-counter">{unlockedAch.length}/{MOCK_ACHIEVEMENTS.length}</span>
                </div>
                {/* Progress bar */}
                <div className="gp__ach-progress-bar">
                    <div className="gp__ach-progress-fill" style={{ width: `${(unlockedAch.length / MOCK_ACHIEVEMENTS.length) * 100}%` }} />
                </div>
                <div className="gp__ach-grid">
                    {MOCK_ACHIEVEMENTS.map(ach => (
                        <div key={ach.id} className={`gp__ach ${ach.unlocked ? '' : 'gp__ach--locked'} gp__ach--${ach.rarity}`}>
                            <div className="gp__ach-glow" />
                            <span className="gp__ach-emoji">{ach.icon}</span>
                            <div className="gp__ach-info">
                                <span className="gp__ach-name">{ach.name}</span>
                                <span className="gp__ach-desc">{ach.desc}</span>
                            </div>
                            <span className={`gp__ach-badge gp__rarity--${ach.rarity}`}>{ach.rarity}</span>
                            {!ach.unlocked && <FaLock className="gp__ach-lockicon" />}
                        </div>
                    ))}
                </div>
            </section>

            {/* ════ TEAMS ════ */}
            <section className="gp__section">
                <div className="gp__section-header">
                    <h2><FaShieldAlt /> Mis Equipos</h2>
                </div>
                {user.teams?.length > 0 ? (
                    <div className="gp__teams-grid">
                        {user.teams.map(team => {
                            const defaultLogo = "https://i.ibb.co/VWV0YmP/default-esports-team.png";
                            const starters = team.roster?.starters?.filter(p => p?.user || p?.nickname)?.length || 0;
                            const subs = team.roster?.subs?.filter(p => p?.user || p?.nickname)?.length || 0;
                            const coach = team.roster?.coach?.nickname || null;
                            return (
                                <div key={team._id} className="gp__team-card">
                                    <div className="gp__team-banner">
                                        <img src={team.logo || defaultLogo} alt="" className="gp__team-banner-bg" onError={e => e.target.src = defaultLogo} />
                                        <div className="gp__team-banner-ov" />
                                        <img src={team.logo || defaultLogo} alt={team.name} className="gp__team-logo" onError={e => e.target.src = defaultLogo} />
                                    </div>
                                    <div className="gp__team-body">
                                        <div className="gp__team-top">
                                            <div>
                                                <h3 className="gp__team-name">{team.name}</h3>
                                                {team.slogan && <p className="gp__team-slogan">"{team.slogan}"</p>}
                                            </div>
                                            <span className="gp__team-game">{team.game}</span>
                                        </div>
                                        <div className="gp__team-tags">
                                            {team.teamCountry && <span><FaFlag /> {team.teamCountry}</span>}
                                            {team.teamLevel && <span><FaMedal /> {team.teamLevel}</span>}
                                            {team.category && <span><FaTrophy /> {team.category}</span>}
                                            {team.teamLanguage && <span><FaLanguage /> {team.teamLanguage}</span>}
                                        </div>
                                        <div className="gp__team-roster">
                                            <div className="gp__team-rslot">
                                                <FaUserShield />
                                                <strong>{starters}/{team.maxMembers || '?'}</strong>
                                                <small>Titulares</small>
                                            </div>
                                            <div className="gp__team-rslot">
                                                <FaUsers />
                                                <strong>{subs}/{team.maxSubstitutes || '?'}</strong>
                                                <small>Suplentes</small>
                                            </div>
                                            {coach && (
                                                <div className="gp__team-rslot gp__team-rslot--coach">
                                                    <FaCrown />
                                                    <strong>{coach}</strong>
                                                    <small>Coach</small>
                                                </div>
                                            )}
                                        </div>
                                        <button className="gp__team-cta">Ver Equipo <FaChevronRight /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="gp__empty-state">
                        <FaShieldAlt />
                        <p>Aún no te has unido a un equipo</p>
                        <button className="gp__btn gp__btn--primary" onClick={() => navigate('/teams')}>Buscar Equipo</button>
                    </div>
                )}
            </section>

            {/* ════ SOCIAL FEED ════ */}
            <section className="gp__section gp__section--feed">
                <div className="gp__section-header">
                    <h2><FaPaperPlane /> Actividad</h2>
                </div>

                {/* Create post */}
                <div className="gp__card gp__create-post">
                    <div className="gp__create-top">
                        <AvatarCircle
                            src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                            frameConfig={currentFrame}
                            size="44px"
                            status={user.status}
                        />
                        <textarea
                            className="gp__post-input"
                            placeholder="¿Qué estás jugando hoy?"
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="gp__create-bar">
                        <div className="gp__create-btns">
                            <button><FaImage /> Imagen</button>
                            <button><FaGamepad /> Juego</button>
                            <button><FaSmile /> Emoji</button>
                        </div>
                        <button className="gp__btn gp__btn--primary" onClick={handlePost} disabled={!newPostText.trim()}>
                            Publicar
                        </button>
                    </div>
                </div>

                {/* Posts */}
                <div className="gp__posts">
                    {posts.map(post => (
                        <article key={post.id} className="gp__card gp__post">
                            <div className="gp__post-head">
                                <AvatarCircle
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                                    frameConfig={currentFrame}
                                    size="40px"
                                    status={user.status}
                                />
                                <div className="gp__post-who">
                                    <span className="gp__post-author">{user.username}</span>
                                    <span className="gp__post-time">{post.timestamp}</span>
                                </div>
                                <button className="gp__post-dots"><FaEllipsisH /></button>
                            </div>
                            <p className="gp__post-text">{post.text}</p>
                            {post.image && <div className="gp__post-img"><img src={post.image} alt="" /></div>}
                            <div className="gp__post-bar">
                                <button className={post.liked ? 'liked' : ''} onClick={() => handleLike(post.id)}>
                                    {post.liked ? <FaHeart /> : <FaRegHeart />} {post.likes}
                                </button>
                                <button><FaComment /> {post.comments}</button>
                                <button><FaShare /> {post.shares}</button>
                                <button className={`save ${post.saved ? 'saved' : ''}`} onClick={() => handleSave(post.id)}>
                                    {post.saved ? <FaBookmark /> : <FaRegBookmark />}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Profile;