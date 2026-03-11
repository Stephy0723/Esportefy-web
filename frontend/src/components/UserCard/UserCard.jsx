import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import {
    FaGamepad, FaGlobeAmericas, FaBolt, FaShieldAlt,
    FaUserPlus, FaUserCheck, FaUsers, FaTimes, FaTrophy,
    FaStar, FaClock, FaCalendarAlt, FaHeart, FaRegHeart,
    FaComment, FaUserFriends, FaFolder, FaCheckCircle
} from 'react-icons/fa';
import AvatarCircle from '../AvatarCircle/AvatarCircle';
import PlayerTag from '../PlayerTag/PlayerTag';
import { FRAMES } from '../../data/profileOptions';
import { STATUS_LIST } from '../../data/defaultAvatars';
import { GAME_IMAGES } from '../../data/gameImages';
import { resolveMediaUrl } from '../../utils/media';
import './UserCard.css';

// Banner gradients for users without custom banner
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

/**
 * UserCard — Popup card shown when clicking on a user avatar/name.
 * Props:
 *   userId   — The user ID to fetch
 *   trigger  — React element that triggers the card (wraps children)
 *   children — Content of the trigger
 */
const UserCard = ({ userId, children }) => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [favorited, setFavorited] = useState(false);
    const cardRef = useRef(null);
    const triggerRef = useRef(null);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

    // Generate consistent banner gradient based on userId
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

    const handleToggle = (e) => {
        e.stopPropagation();
        if (!open) {
            setOpen(true);
            fetchCard();
        } else {
            setOpen(false);
        }
    };

    const handleFollow = async () => {
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

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (cardRef.current && !cardRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const userStatus = data ? (STATUS_LIST.find(s => s.id === data.status) || STATUS_LIST[0]) : null;
    const userFrame = data ? (FRAMES.find(f => f.id === data.selectedFrameId) || FRAMES[0]) : null;
    const normalizedGames = data?.selectedGames || [];

    return (
        <div className="uc__wrap">
            <div ref={triggerRef} className="uc__trigger" onClick={handleToggle}>
                {children}
            </div>

            {open && (
                <div className="uc__card" ref={cardRef}>
                    {/* Close btn */}
                    <button className="uc__close" onClick={() => setOpen(false)}><FaTimes /></button>

                    {loading && !data ? (
                        <div className="uc__loading">
                            <div className="uc__spinner" />
                        </div>
                    ) : data ? (
                        <>
                            {/* Banner with cover image */}
                            <div className="uc__banner" style={{ background: data.bannerUrl ? `url(${resolveMediaUrl(data.bannerUrl)})` : getBannerGradient(), backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {/* Organization badge */}
                                {data.organization && (
                                    <span className="uc__org-badge">
                                        <FaUsers /> {data.organization}
                                    </span>
                                )}
                            </div>

                            {/* Avatar overlapping banner */}
                            <div className="uc__avatar-wrapper">
                                <AvatarCircle
                                    src={resolveMediaUrl(data.avatar) || `https://ui-avatars.com/api/?name=${data.username}`}
                                    frameConfig={userFrame}
                                    size="72px"
                                    status={data.status}
                                />
                            </div>

                            {/* Body */}
                            <div className="uc__body">
                                {/* Name row with verified and favorite */}
                                <div className="uc__name-row">
                                    <h3 className="uc__username">
                                        {data.username || "Player"}
                                        {data.isVerified && <FaCheckCircle className="uc__verified" />}
                                    </h3>
                                    <button 
                                        className={`uc__favorite ${favorited ? 'uc__favorite--active' : ''}`}
                                        onClick={() => setFavorited(!favorited)}
                                    >
                                        {favorited ? <FaHeart /> : <FaRegHeart />}
                                    </button>
                                </div>

                                {/* Role/Title */}
                                <p className="uc__role">
                                    {data.role || (data.isOrganizer ? 'Organizador de Torneos' : 'Jugador Competitivo')}
                                </p>

                                {/* Tags: Organization and Tools */}
                                <div className="uc__tags">
                                    {data.team && (
                                        <span className="uc__tag uc__tag--team">
                                            <FaUsers /> {data.team}
                                        </span>
                                    )}
                                    {normalizedGames.length > 0 && (
                                        <span className="uc__tag uc__tag--games">
                                            <FaGamepad /> {normalizedGames.length} Juegos
                                        </span>
                                    )}
                                </div>

                                {/* Stats row */}
                                <div className="uc__stats">
                                    <div className="uc__stat">
                                        <div className="uc__stat-value">
                                            <FaStar className="uc__stat-icon uc__stat-icon--star" />
                                            {data.rating || '4.5'}
                                        </div>
                                        <span className="uc__stat-label">rating</span>
                                    </div>
                                    <div className="uc__stat">
                                        <div className="uc__stat-value">
                                            <FaClock className="uc__stat-icon" />
                                            {data.hoursPlayed || '120'}h
                                        </div>
                                        <span className="uc__stat-label">jugadas</span>
                                    </div>
                                    <div className="uc__stat">
                                        <div className="uc__stat-value">
                                            <FaCalendarAlt className="uc__stat-icon" />
                                            {data.memberSince || '12'}
                                        </div>
                                        <span className="uc__stat-label">meses</span>
                                    </div>
                                </div>

                                {/* Action buttons row */}
                                <div className="uc__actions">
                                    <button className="uc__action-btn" title="Ver perfil" onClick={() => { setOpen(false); navigate(`/profile/${userId}`); }}>
                                        <FaUserFriends />
                                    </button>
                                    <button className="uc__action-btn" title="Mensaje">
                                        <FaComment />
                                    </button>
                                    <button 
                                        className={`uc__action-btn ${data.isFollowing ? 'uc__action-btn--active' : ''}`}
                                        onClick={handleFollow}
                                        disabled={followLoading}
                                        title={data.isFollowing ? 'Siguiendo' : 'Seguir'}
                                    >
                                        {data.isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                                    </button>
                                    <button className="uc__action-btn" title="Equipos">
                                        <FaFolder />
                                    </button>
                                </div>

                                {/* Main CTA button */}
                                <button className="uc__cta-btn" onClick={() => { setOpen(false); navigate(`/profile/${userId}`); }}>
                                    Ver Perfil Completo
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="uc__error">No se pudo cargar</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserCard;
