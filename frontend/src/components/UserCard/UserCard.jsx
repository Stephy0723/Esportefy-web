import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import {
    FaGamepad, FaGlobeAmericas, FaBolt, FaShieldAlt,
    FaUserPlus, FaUserCheck, FaUsers, FaTimes, FaTrophy
} from 'react-icons/fa';
import AvatarCircle from '../AvatarCircle/AvatarCircle';
import PlayerTag from '../PlayerTag/PlayerTag';
import { FRAMES } from '../../data/profileOptions';
import { STATUS_LIST } from '../../data/defaultAvatars';
import { GAME_IMAGES } from '../../data/gameImages';
import './UserCard.css';

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
    const cardRef = useRef(null);
    const triggerRef = useRef(null);
    const navigate = useNavigate();

    const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

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
                            {/* Header band */}
                            <div className="uc__header">
                                <div className="uc__header-glow" />
                                <AvatarCircle
                                    src={data.avatar || `https://ui-avatars.com/api/?name=${data.username}`}
                                    frameConfig={userFrame}
                                    size="80px"
                                    status={data.status}
                                />
                            </div>

                            {/* Identity */}
                            <div className="uc__body">
                                <PlayerTag name={data.username || "Player"} tagId={data.selectedTagId} size="small" />
                                {data.fullName && <p className="uc__realname">{data.fullName}</p>}

                                {/* Tags: Organizador / Jugador */}
                                <div className="uc__role-tags">
                                    <span className="uc__role-tag uc__role-tag--player">
                                        <FaGamepad /> Jugador
                                    </span>
                                    {data.isOrganizer && (
                                        <span className="uc__role-tag uc__role-tag--org">
                                            <FaTrophy /> Organizador
                                        </span>
                                    )}
                                </div>

                                {/* Status */}
                                {userStatus && (
                                    <div className="uc__status" style={{ '--sc': userStatus.color }}>
                                        <span className="uc__status-dot" />
                                        {userStatus.label}
                                    </div>
                                )}

                                {/* Quick info */}
                                <div className="uc__info-grid">
                                    {data.country && (
                                        <div className="uc__info-item">
                                            <FaGlobeAmericas />
                                            <span>{data.country}</span>
                                        </div>
                                    )}
                                    {data.experience && (
                                        <div className="uc__info-item">
                                            <FaBolt />
                                            <span>{Array.isArray(data.experience) ? data.experience.join(', ') : data.experience}</span>
                                        </div>
                                    )}
                                    {data.connections?.riot?.verified && (
                                        <div className="uc__info-item uc__info-item--riot">
                                            <FaShieldAlt />
                                            <span>{data.connections.riot.gameName}#{data.connections.riot.tagLine}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Games mini */}
                                {normalizedGames.length > 0 && (
                                    <div className="uc__games">
                                        {normalizedGames.slice(0, 4).map((gId, i) => {
                                            const imgSrc = Object.entries(GAME_IMAGES).find(([key]) =>
                                                key.toLowerCase().includes(gId.toLowerCase())
                                            )?.[1] || GAME_IMAGES.Default;
                                            return <img key={i} src={imgSrc} alt={gId} className="uc__game-thumb" title={gId} />;
                                        })}
                                        {normalizedGames.length > 4 && (
                                            <span className="uc__game-more">+{normalizedGames.length - 4}</span>
                                        )}
                                    </div>
                                )}

                                {/* Social counts */}
                                <div className="uc__social">
                                    <div>
                                        <strong>{data.followers?.length || 0}</strong>
                                        <span>Seguidores</span>
                                    </div>
                                    <div className="uc__social-sep" />
                                    <div>
                                        <strong>{data.following?.length || 0}</strong>
                                        <span>Siguiendo</span>
                                    </div>
                                    <div className="uc__social-sep" />
                                    <div>
                                        <strong>{data.teams?.length || 0}</strong>
                                        <span>Equipos</span>
                                    </div>
                                </div>

                                {/* Follow button */}
                                <button
                                    className={`uc__follow-btn ${data.isFollowing ? 'uc__follow-btn--following' : ''}`}
                                    onClick={handleFollow}
                                    disabled={followLoading}
                                >
                                    {data.isFollowing ? <><FaUserCheck /> Siguiendo</> : <><FaUserPlus /> Seguir</>}
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
