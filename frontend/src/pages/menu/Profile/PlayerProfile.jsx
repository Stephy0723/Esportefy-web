import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { API_URL } from '../../../config/api';
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

const normalizePresenceTone = (status = '') => {
    const n = String(status || '').trim().toLowerCase();
    if (['online', 'gaming', 'tournament', 'streaming', 'searching'].includes(n)) return 'online';
    if (['afk', 'dnd'].includes(n)) return 'away';
    return 'offline';
};

const PlayerProfile = () => {
    const { userCode } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [followLoading, setFollowLoading] = useState(false);
    const [friendReqLoading, setFriendReqLoading] = useState(false);
    const [friendReqSent, setFriendReqSent] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showTeamsModal, setShowTeamsModal] = useState(false);
    const [showFriendsModal, setShowFriendsModal] = useState(false);
    const [showGamesModal, setShowGamesModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null);

    useEffect(() => {
        const fetchPublicProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = getAuthToken();
                if (!token) { navigate('/login'); return; }
                const res = await axios.get(`${API_URL}/api/auth/profile/public/${userCode}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(res.data);
            } catch (err) {
                if (err.response?.status === 401) navigate('/login');
                else setError('No se pudo cargar el perfil.');
            } finally { setLoading(false); }
        };
        if (userCode) fetchPublicProfile();
    }, [userCode, navigate]);

    const handleFollow = async () => {
        if (followLoading || !profile) return;
        try {
            setFollowLoading(true);
            const token = getAuthToken();
            await axios.post(`${API_URL}/api/auth/follow/${profile.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(prev => ({ ...prev, isFollowing: !prev.isFollowing, followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1 }));
        } catch {} finally { setFollowLoading(false); }
    };

    const handleFriendRequest = async () => {
        if (friendReqLoading || friendReqSent || !profile) return;
        try {
            setFriendReqLoading(true);
            const token = getAuthToken();
            await axios.post(`${API_URL}/api/friends/request/${profile.id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFriendReqSent(true);
        } catch {} finally { setFriendReqLoading(false); }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleMessage = () => {
        navigate('/chats', { state: { openChatWith: profile?.id } });
    };

    if (loading) return (
        <div className="pf-loading">
            <div className="pf-loader"><span /><span /><span /></div>
            <p>Cargando perfil...</p>
        </div>
    );
    if (error) return <div className="pf-error">{error}</div>;
    if (!profile) return null;

    /* ── Data normalization ── */
    const normalizedGames = Array.isArray(profile.selectedGames) ? profile.selectedGames : [];
    const currentFrame = FRAMES.find(f => f.id === profile.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === profile.selectedBgId) || BACKGROUNDS[0];
    const userStatus = STATUS_LIST.find(s => s.id === profile.status) || STATUS_LIST[0];
    const resolvedAvatar = resolveMediaUrl(profile.avatar);

    const socialIcons = [
        { key: 'twitch', icon: 'bx bxl-twitch', color: '#9146FF' },
        { key: 'youtube', icon: 'bx bxl-youtube', color: '#FF0000' },
        { key: 'twitter', icon: 'bx bxl-twitter', color: '#1DA1F2' },
        { key: 'instagram', icon: 'bx bxl-instagram', color: '#E4405F' },
        { key: 'tiktok', icon: 'bx bxl-tiktok', color: '#00f2ea' },
    ];
    const activeSocials = socialIcons.filter(s => profile.socialLinks?.[s.key]);
    const buildSocialUrl = (key, handle) => {
        if (!handle) return '#';
        const clean = String(handle).replace(/^@+/, '');
        const map = { twitch: `https://twitch.tv/${clean}`, youtube: `https://youtube.com/${clean}`, twitter: `https://x.com/${clean}`, instagram: `https://instagram.com/${clean}`, tiktok: `https://tiktok.com/@${clean}` };
        return map[key] || '#';
    };

    const gamingConnections = [
        { key: 'riot', icon: 'bx bxs-game', label: 'Riot', color: '#D32936', connected: profile.connections?.riot?.verified, value: profile.connections?.riot?.publicHandle || null },
        { key: 'discord', icon: 'bx bxl-discord-alt', label: 'Discord', color: '#5865F2', connected: profile.connections?.discord?.linked },
        { key: 'mlbb', icon: 'bx bx-joystick', label: 'MLBB', color: '#00b4d8', connected: profile.connections?.mlbb?.linked },
        { key: 'steam', icon: 'bx bxl-steam', label: 'Steam', color: '#1b2838', connected: profile.connections?.steam?.linked },
        { key: 'epic', icon: 'bx bx-bolt', label: 'Epic', color: '#0078f2', connected: Boolean(profile.connections?.epic?.linked || profile.gamingConnections?.epic), value: profile.connections?.epic?.displayName || profile.connections?.epic?.username || (profile.gamingConnections?.epic ? `${profile.gamingConnections.epic} · Manual` : null) },
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

    const stats = profile.stats || {};
    const friends = profile.friends || [];
    const communities = profile.communities || [];
    const achievements = profile.achievements || [];
    const recognitions = profile.recognitions || [];
    const teams = profile.teams || [];
    const onlineFriendsCount = friends.filter(f => normalizePresenceTone(f?.status) === 'online').length;

    const roleTags = [];
    if (profile.isOrganizer) roleTags.push({ label: 'Organizador', cls: 'pf-tag--org' });
    if (profile.roles?.contentCreator?.approved) roleTags.push({ label: 'Creador', cls: 'pf-tag--creator' });
    if (profile.roles?.coach?.approved) roleTags.push({ label: 'Coach', cls: 'pf-tag--coach' });
    if (profile.roles?.caster?.approved) roleTags.push({ label: 'Caster', cls: 'pf-tag--caster' });
    if (profile.roles?.analyst?.approved) roleTags.push({ label: 'Analista', cls: 'pf-tag--analyst' });
    if (profile.roles?.sponsor?.approved) roleTags.push({ label: 'Sponsor', cls: 'pf-tag--sponsor' });
    if (profile.lookingForTeam) roleTags.push({ label: 'Buscando equipo', cls: 'pf-tag--lft' });

    const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '';

    return (
        <div className="pf">
            <PageHud page={`PERFIL / ${profile.username?.toUpperCase()}`} />

            {/* HERO */}
            <section className="pf-hero">
                <div className="pf-hero__bg">
                    <img src={currentBg.src} alt="" />
                    <div className="pf-hero__overlay" />
                </div>

                <div className="pf-hero__actions">
                    <button
                        className={`pf-btn ${profile.isFollowing ? '' : 'pf-btn--primary'}`}
                        onClick={handleFollow}
                        disabled={followLoading}
                    >
                        <i className={`bx ${profile.isFollowing ? 'bx-user-check' : 'bx-user-plus'}`} />
                        {followLoading ? '...' : profile.isFollowing ? 'Siguiendo' : 'Seguir'}
                    </button>
                    {!profile.isMutual && !friendReqSent ? (
                        <button className="pf-btn pf-btn--primary" onClick={handleFriendRequest} disabled={friendReqLoading}>
                            <i className='bx bx-user-plus' /> {friendReqLoading ? '...' : 'Solicitud'}
                        </button>
                    ) : friendReqSent ? (
                        <button className="pf-btn" disabled>
                            <i className='bx bx-check' /> Enviada
                        </button>
                    ) : null}
                    <button className="pf-btn" onClick={handleMessage}>
                        <i className='bx bx-message-rounded' /> Mensaje
                    </button>
                    <button className="pf-btn" onClick={handleShare}>
                        <i className={`bx ${copiedLink ? 'bx-check' : 'bx-share-alt'}`} /> {copiedLink ? 'Copiado' : 'Compartir'}
                    </button>
                </div>

                <motion.div className="pf-hero__content" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="pf-avatar">
                        <AvatarCircle src={resolvedAvatar} username={profile.username} size={120} frameId={currentFrame?.id} />
                        <div className="pf-avatar__status" style={{ '--s-color': userStatus.color }}>
                            <span className="pf-avatar__dot" />
                            <span>{userStatus.label}</span>
                        </div>
                    </div>

                    <div className="pf-identity">
                        <div className="pf-identity__name">
                            <PlayerTag username={profile.username} tagId={profile.selectedTagId} size="lg" />
                            {profile.isOrganizer && <i className='bx bxs-check-shield pf-verified' />}
                        </div>
                        {profile.fullName && <p className="pf-identity__realname">{profile.fullName}</p>}
                        {profile.userCode && <span className="pf-identity__code">{profile.userCode}</span>}

                        <div className="pf-tags">
                            {roleTags.map((tag, i) => <span key={i} className={`pf-tag ${tag.cls}`}>{tag.label}</span>)}
                            {profile.experience?.slice(0, 2).map((exp, i) => <span key={`exp-${i}`} className="pf-tag">{exp}</span>)}
                        </div>

                        {profile.bio && <p className="pf-identity__bio">{profile.bio}</p>}

                        <div className="pf-meta">
                            {profile.country && <span><i className='bx bx-flag' /> {profile.country}</span>}
                            {joinDate && <span><i className='bx bx-calendar' /> {joinDate}</span>}
                            <span><i className='bx bx-group' /> {profile.followersCount} seguidores · {profile.followingCount} siguiendo</span>
                        </div>
                    </div>

                    <div className="pf-stats">
                        <div className="pf-stat pf-stat--main">
                            <span className="pf-stat__val">{stats.winRate}<small>%</small></span>
                            <span className="pf-stat__label">WIN RATE</span>
                            <div className="pf-stat__bar"><div style={{ width: `${stats.winRate}%` }} /></div>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{stats.wins}</span>
                            <span className="pf-stat__label">WINS</span>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{stats.tournamentsWon}</span>
                            <span className="pf-stat__label">TORNEOS</span>
                        </div>
                        <div className="pf-stat">
                            <span className="pf-stat__val">{stats.teams || 0}</span>
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

            {/* MAIN GRID */}
            <main className="pf-grid">
                {/* LEFT */}
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
                                        <span>{conn.connected ? (conn.value || 'Vinculado') : 'No vinculado'}</span>
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
                                    <a key={s.key} href={buildSocialUrl(s.key, profile.socialLinks[s.key])} target="_blank" rel="noopener noreferrer" className="pf-social" style={{ '--c-color': s.color }}>
                                        <i className={s.icon} /> <span>@{profile.socialLinks[s.key]}</span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Teams */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-shield-quarter' /> EQUIPOS
                            <span className="pf-card__count">{teams.length}</span>
                        </div>
                        {teams.length > 0 ? (
                            <div className="pf-teams">
                                {teams.slice(0, 3).map(team => (
                                    <div key={team._id} className="pf-team" onClick={() => setSelectedTeam(team)}>
                                        <img src={resolveMediaUrl(team.logo) || `https://ui-avatars.com/api/?name=${team.name}`} alt="" />
                                        <div className="pf-team__info"><span>{team.name}</span><span>{team.game}</span></div>
                                        <i className='bx bx-chevron-right' />
                                    </div>
                                ))}
                                {teams.length > 3 && <button className="pf-card__more" onClick={() => setShowTeamsModal(true)}>Ver todos <i className='bx bx-chevron-right' /></button>}
                            </div>
                        ) : <div className="pf-empty"><i className='bx bx-shield-quarter' /><p>Sin equipos</p></div>}
                    </section>

                    {/* Recognitions */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-medal' /> RECONOCIMIENTOS</div>
                        <div className="pf-awards">
                            {recognitions.length > 0 ? recognitions.map(award => (
                                <div key={award.id} className={`pf-award pf-award--${award.type || 'bronze'}`}>
                                    <i className='bx bx-award' />
                                    <div><strong>{award.name}</strong><span>{award.event}</span></div>
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-medal' /><p>Sin reconocimientos</p></div>}
                        </div>
                    </section>
                </div>

                {/* CENTER - Info/About */}
                <div className="pf-col pf-col--center">
                    {/* About section */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-user' /> SOBRE {profile.username?.toUpperCase()}</div>
                        <div className="pp-about">
                            {profile.bio && <p className="pp-about__bio">{profile.bio}</p>}

                            {profile.languages?.length > 0 && (
                                <div className="pp-about__row">
                                    <span className="pp-about__label"><i className='bx bx-globe' /> Idiomas</span>
                                    <div className="pp-about__tags">
                                        {profile.languages.map((lang, i) => <span key={i} className="pf-tag">{lang}</span>)}
                                    </div>
                                </div>
                            )}

                            {profile.preferredRoles?.length > 0 && (
                                <div className="pp-about__row">
                                    <span className="pp-about__label"><i className='bx bx-target-lock' /> Roles preferidos</span>
                                    <div className="pp-about__tags">
                                        {profile.preferredRoles.map((role, i) => <span key={i} className="pf-tag">{role}</span>)}
                                    </div>
                                </div>
                            )}

                            {profile.experience?.length > 0 && (
                                <div className="pp-about__row">
                                    <span className="pp-about__label"><i className='bx bx-badge-check' /> Experiencia</span>
                                    <div className="pp-about__tags">
                                        {profile.experience.map((exp, i) => <span key={i} className="pf-tag">{exp}</span>)}
                                    </div>
                                </div>
                            )}

                            {profile.university?.verified && (
                                <div className="pp-about__row">
                                    <span className="pp-about__label"><i className='bx bx-book' /> Universidad</span>
                                    <span className="pf-tag pf-tag--pro">{profile.university.universityName || 'Verificado'}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Mutual connections hint */}
                    {profile.isMutual && (
                        <section className="pf-card pp-mutual">
                            <i className='bx bx-check-double' />
                            <span>Se siguen mutuamente</span>
                        </section>
                    )}

                    {/* Quick stats */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-bar-chart-alt-2' /> ESTADÍSTICAS</div>
                        <div className="pp-stats-grid">
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.matches || 0}</span>
                                <span className="pp-stat-item__label">Partidas</span>
                            </div>
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.wins || 0}</span>
                                <span className="pp-stat-item__label">Victorias</span>
                            </div>
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.winRate || 0}%</span>
                                <span className="pp-stat-item__label">Win Rate</span>
                            </div>
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.tournaments || 0}</span>
                                <span className="pp-stat-item__label">Torneos</span>
                            </div>
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.tournamentsWon || 0}</span>
                                <span className="pp-stat-item__label">Títulos</span>
                            </div>
                            <div className="pp-stat-item">
                                <span className="pp-stat-item__val">{stats.teams || 0}</span>
                                <span className="pp-stat-item__label">Equipos</span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* RIGHT */}
                <div className="pf-col pf-col--right">
                    {/* Achievements */}
                    <section className="pf-card">
                        <div className="pf-card__header"><i className='bx bx-trophy' /> LOGROS</div>
                        <div className="pf-achievements">
                            {achievements.length > 0 ? achievements.map(ach => (
                                <div key={ach.id} className={`pf-ach ${ach.verified ? 'pf-ach--verified' : ''}`}>
                                    <span className="pf-ach__icon">{ach.icon || '>'}</span>
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
                            {friends.length > 0 ? friends.slice(0, 5).map(friend => (
                                <div key={friend.id} className="pf-friend" onClick={() => navigate(`/profile/${friend.userCode || friend.id}`)}>
                                    <div className="pf-friend__avatar">
                                        <img src={resolveMediaUrl(friend.avatar) || `https://ui-avatars.com/api/?name=${friend.name}`} alt="" />
                                        <span className={`pf-friend__dot pf-friend__dot--${normalizePresenceTone(friend.status)}`} />
                                    </div>
                                    <div className="pf-friend__info"><span>{friend.name}</span><span>{friend.rank}</span></div>
                                    <i className='bx bx-chevron-right' />
                                </div>
                            )) : <div className="pf-empty"><i className='bx bx-group' /><p>Sin amigos visibles</p></div>}
                        </div>
                        {friends.length > 5 && <button className="pf-card__more" onClick={() => setShowFriendsModal(true)}>Ver todos <i className='bx bx-chevron-right' /></button>}
                    </section>

                    {/* Communities */}
                    <section className="pf-card">
                        <div className="pf-card__header">
                            <i className='bx bx-layer' /> COMUNIDADES
                            <span className="pf-card__count">{communities.length}</span>
                        </div>
                        <div className="pf-communities">
                            {communities.length > 0 ? communities.map(community => (
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
                </div>
            </main>

            {/* MODALS */}
            {/* Teams List */}
            <AnimatePresence>
                {showTeamsModal && (
                    <motion.div className="pf-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowTeamsModal(false)}>
                        <motion.div className="pf-modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()}>
                            <div className="pf-modal__header"><h2><i className='bx bx-shield-quarter' /> Equipos</h2><button onClick={() => setShowTeamsModal(false)}><i className='bx bx-x' /></button></div>
                            <div className="pf-modal__body">
                                {teams.map(team => (
                                    <div key={team._id} className="pf-modal-item" onClick={() => { setShowTeamsModal(false); setSelectedTeam(team); }}>
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
                                        <span><i className='bx bx-group' /> {selectedTeam.memberCount || 0} miembros</span>
                                        {selectedTeam.teamLevel && <span><i className='bx bx-trophy' /> {selectedTeam.teamLevel}</span>}
                                    </div>
                                </div>
                                {selectedTeam.slogan && <p className="pf-detail-quote">"{selectedTeam.slogan}"</p>}
                                {selectedTeam.teamCountry && (
                                    <div className="pf-detail-meta">
                                        <span><i className='bx bx-flag' /> {selectedTeam.teamCountry}</span>
                                        {selectedTeam.category && <span><i className='bx bx-layer' /> {selectedTeam.category}</span>}
                                    </div>
                                )}
                                <div className="pf-detail-actions">
                                    <button className="pf-btn pf-btn--primary" onClick={() => navigate('/equipos', { state: { teamId: selectedTeam._id, openPreview: true } })}>
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
                                {friends.map(friend => (
                                    <div key={friend.id} className="pf-modal-item" onClick={() => { setShowFriendsModal(false); navigate(`/profile/${friend.userCode || friend.id}`); }}>
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

export default PlayerProfile;
