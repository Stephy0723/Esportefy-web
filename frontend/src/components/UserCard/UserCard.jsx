import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { resolveMediaUrl } from '../../utils/media';
import './UserCard.css';

const BANNER_GRADIENTS = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
];

const UserCard = ({ userId, children }) => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const cardRef = useRef(null);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    const getBannerGradient = useCallback(() => {
        if (!userId) return BANNER_GRADIENTS[0];
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return BANNER_GRADIENTS[hash % BANNER_GRADIENTS.length];
    }, [userId]);

    const fetchCard = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/auth/user-card/${userId}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setData(res.data);
        } catch (err) {
            console.error('UserCard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const handleOpen = (e) => {
        e.stopPropagation();
        e.preventDefault();
        setOpen(true);
        fetchCard();
    };

    const handleClose = () => setOpen(false);

    const handleFollow = async (e) => {
        e.stopPropagation();
        if (!data || followLoading) return;
        setFollowLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/auth/follow/${userId}`, {}, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            setData(prev => ({
                ...prev,
                isFollowing: res.data.followed,
                followers: res.data.followed
                    ? [...(prev.followers || []), 'me']
                    : (prev.followers || []).slice(0, -1)
            }));
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === 'Escape') handleClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const normalizedGames = data?.selectedGames || [];
    const mainGame = normalizedGames.length > 0 ? normalizedGames[0] : null;
    const followersCount = Array.isArray(data?.followers) ? data.followers.length : (data?.followersCount || 0);
    const followingCount = Array.isArray(data?.following) ? data.following.length : (data?.followingCount || 0);
    const teamsCount = Array.isArray(data?.teams) ? data.teams.length : 0;
    const avatarUrl = data ? (resolveMediaUrl(data.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username || 'U')}&background=1a1a2e&color=8EDB15&size=400`) : '';

    const uniName = data?.university?.verified ? data.university.universityName : null;

    const cardContent = open ? (
        <div className="uc__portal">
            <div className="uc__overlay" onClick={handleClose} />
            <div className={`uc__modal ${data ? 'uc__modal--loaded' : ''}`} ref={cardRef} onClick={(e) => e.stopPropagation()}>
                <button className="uc__close" onClick={handleClose}>
                    <i className="bx bx-x"></i>
                </button>

                {loading && !data ? (
                    <div className="uc__loading">
                        <div className="uc__spinner" />
                    </div>
                ) : data ? (
                    <>
                        {/* Photo area — large avatar as hero image */}
                        <div
                            className="uc__hero"
                            style={{ background: getBannerGradient() }}
                        >
                            <div className="uc__hero-img-wrap">
                                <img
                                    className="uc__hero-img"
                                    src={avatarUrl}
                                    alt={data.username}
                                />
                            </div>

                            {/* Badges on the hero */}
                            <div className="uc__hero-badges">
                                {data.isOrganizer && (
                                    <span className="uc__badge uc__badge--org">
                                        <i className="bx bx-shield-quarter"></i> Organizador
                                    </span>
                                )}
                                {data.experience?.includes('Pro') && (
                                    <span className="uc__badge uc__badge--pro">
                                        <i className="bx bxs-crown"></i> PRO
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Card body */}
                        <div className="uc__body">
                            {/* Name + verified */}
                            <div className="uc__identity">
                                <h3 className="uc__name">
                                    {data.username || 'Player'}
                                    {data.isVerified && <i className="bx bxs-badge-check uc__verified"></i>}
                                </h3>
                                {data.fullName && data.fullName !== data.username && (
                                    <span className="uc__fullname">{data.fullName}</span>
                                )}
                            </div>

                            {/* Bio */}
                            {data.bio && (
                                <p className="uc__bio">{data.bio}</p>
                            )}

                            {/* Info row */}
                            <div className="uc__info-row">
                                {data.country && (
                                    <span className="uc__info-item">
                                        <i className="bx bx-map"></i> {data.country}
                                    </span>
                                )}
                                {mainGame && (
                                    <span className="uc__info-item">
                                        <i className="bx bx-joystick"></i> {mainGame}
                                    </span>
                                )}
                                {uniName && (
                                    <span className="uc__info-item uc__info-item--uni">
                                        <i className="bx bxs-graduation"></i> {uniName}
                                    </span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="uc__stats">
                                <div className="uc__stat">
                                    <i className="bx bx-group"></i>
                                    <span className="uc__stat-num">{followersCount}</span>
                                    <span className="uc__stat-label">Seguidores</span>
                                </div>
                                <div className="uc__stat">
                                    <i className="bx bx-user-plus"></i>
                                    <span className="uc__stat-num">{followingCount}</span>
                                    <span className="uc__stat-label">Siguiendo</span>
                                </div>
                                <div className="uc__stat">
                                    <i className="bx bx-shield"></i>
                                    <span className="uc__stat-num">{teamsCount}</span>
                                    <span className="uc__stat-label">Equipos</span>
                                </div>
                            </div>

                            {/* Games tags */}
                            {normalizedGames.length > 0 && (
                                <div className="uc__tags">
                                    {normalizedGames.map((game, i) => (
                                        <span key={i} className="uc__tag">#{game.replace(/\s+/g, '')}</span>
                                    ))}
                                </div>
                            )}

                            {/* Main actions */}
                            <div className="uc__actions">
                                <button
                                    className={`uc__btn-follow ${data.isFollowing ? 'is-following' : ''}`}
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                >
                                    {followLoading ? (
                                        <i className="bx bx-loader-alt bx-spin"></i>
                                    ) : data.isFollowing ? (
                                        <><i className="bx bx-check"></i> Siguiendo</>
                                    ) : (
                                        <><i className="bx bx-user-plus"></i> Seguir</>
                                    )}
                                </button>
                                <button
                                    className="uc__btn-profile"
                                    onClick={() => { handleClose(); navigate(`/profile/${userId}`); }}
                                >
                                    <i className="bx bx-user"></i> Ver Perfil
                                </button>
                            </div>

                            {/* Secondary actions row */}
                            <div className="uc__secondary">
                                <button className="uc__sec-btn" title="Mensaje">
                                    <i className="bx bx-message-rounded-dots"></i>
                                </button>
                                <button className="uc__sec-btn" title="Reportar">
                                    <i className="bx bx-flag"></i>
                                </button>
                                <button className="uc__sec-btn" title="Bloquear">
                                    <i className="bx bx-block"></i>
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="uc__error">
                        <i className="bx bx-error-circle"></i>
                        No se pudo cargar
                    </div>
                )}
            </div>
        </div>
    ) : null;

    return (
        <>
            <span className="uc__trigger" onClick={handleOpen}>
                {children}
            </span>
            {cardContent && createPortal(cardContent, document.body)}
        </>
    );
};

export default UserCard;
