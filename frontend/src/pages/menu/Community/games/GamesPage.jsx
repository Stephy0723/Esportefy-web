import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaHeart, FaRegHeart, FaUserPlus, FaUserCheck, FaGamepad, FaGlobe, FaLayerGroup, FaUsers, FaBolt, FaShareAlt, FaCopy, FaCheck, FaTwitter, FaWhatsapp } from 'react-icons/fa';
import { gamesList } from '../../../../data/gamesData';
import { COMMUNITY_GAMES } from '../../../../data/communityData';
import { supportedGamesDetailedData as gamesDetailedData } from '../../../../data/supportedGamesDetailedData';
import { useTheme, THEMES } from '../../../../context/ThemeContext';
import './GameCard.css';

const GamesPage = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [isLiked, setIsLiked] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState(null);
    const [particles, setParticles] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const cardRef = useRef(null);
    const shareMenuRef = useRef(null);
    const { theme, isDarkMode } = useTheme();

    const normalizeId = (value) => String(value || '').toLowerCase().trim();
    const incomingId = normalizeId(gameId);

    const aliasToCatalogId = {
        ow2: 'overwatch',
        rl: 'rocket',
        ff: 'freefire',
        wr: 'wildrift',
        wildrift: 'wildrift',
        r6s: 'r6',
        r6: 'r6',
        pubg: 'pubgm',
        pubgm: 'pubgm',
        hs: 'hearthstone',
        nba2k: 'nba2k',
        lor: 'lor',
        cr: 'clashroyale',
        aov: 'hok',
    };

    const catalogId = aliasToCatalogId[incomingId] || incomingId;
    const communityGame = COMMUNITY_GAMES?.find(g => normalizeId(g.id) === incomingId);
    const catalogGame = gamesList?.find(g => normalizeId(g.id) === catalogId);
    const game = communityGame || catalogGame || null;

    const gameColor = game?.color || '#8EDB15';

    // Generate particles on mount
    useEffect(() => {
        const p = Array.from({ length: 20 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 2 + Math.random() * 4,
            dur: 3 + Math.random() * 5,
            delay: Math.random() * 3,
        }));
        setParticles(p);
    }, []);

    // Close share menu on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (shareMenuRef.current && !shareMenuRef.current.contains(e.target)) {
                setShowShareMenu(false);
            }
        };
        if (showShareMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showShareMenu]);

    // Toast auto-hide
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Show toast notification
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
    }, []);

    // Handle like toggle
    const handleLike = useCallback(() => {
        setIsLiked(prev => {
            const newState = !prev;
            showToast(newState ? '¡Añadido a favoritos!' : 'Eliminado de favoritos', newState ? 'success' : 'info');
            return newState;
        });
    }, [showToast]);

    // Handle follow toggle
    const handleFollow = useCallback(() => {
        setIsFollowing(prev => {
            const newState = !prev;
            showToast(newState ? '¡Ahora sigues esta comunidad!' : 'Dejaste de seguir', newState ? 'success' : 'info');
            return newState;
        });
    }, [showToast]);

    // Copy link to clipboard
    const handleCopyLink = useCallback(async () => {
        const url = window.location.href;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            showToast('¡Enlace copiado!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            showToast('Error al copiar', 'error');
        }
    }, [showToast]);

    // Share to platform
    const handleShare = useCallback((platform) => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Únete a la comunidad de ${game?.name || 'este juego'} en GLITCH GANG`);
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            whatsapp: `https://wa.me/?text=${text}%20${url}`,
        };

        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
        setShowShareMenu(false);
    }, [game?.name]);

    // Card mouse tracking for glow
    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePos({ x, y });
    };

    if (!game) {
        return (
            <div className="gp-backdrop">
                <div className="gp-error">
                    <i className='bx bx-error-circle' style={{ fontSize: '3rem', color: '#ef4444' }} />
                    <h2>Juego no encontrado</h2>
                    <p>El ID "{gameId}" no coincide con ningun juego.</p>
                    <button className="gp-btn gp-btn--primary" onClick={() => navigate(-1)}>
                        <FaArrowLeft /> Volver
                    </button>
                </div>
            </div>
        );
    }

    const detail = gamesDetailedData[incomingId] || gamesDetailedData[catalogId] || null;
    const companyById = {
        ow2: 'Blizzard Entertainment',
        rl: 'Psyonix',
        ff: 'Garena',
        wr: 'Riot Games',
        r6: 'Ubisoft',
        r6s: 'Ubisoft',
        pubgm: 'Krafton / Tencent',
        aov: 'TiMi Studio Group',
        lor: 'Riot Games',
        hs: 'Blizzard Entertainment',
    };
    const company =
        detail?.developer ||
        game.developer ||
        game.company ||
        companyById[incomingId] ||
        companyById[catalogId] ||
        'Desarrollador no especificado';

    const allTagsRaw = [
        ...(Array.isArray(detail?.tags) ? detail.tags : []),
        ...(Array.isArray(game?.tags) ? game.tags : []),
        game?.cat,
        detail?.category,
        game?.mode,
        game?.platform,
    ].filter(Boolean);

    const seenTags = new Set();
    const normalizedTags = allTagsRaw.filter((tag) => {
        const key = String(tag).trim().toLowerCase();
        if (!key || seenTags.has(key)) return false;
        seenTags.add(key);
        return true;
    });

    const goToFilter = (type, value) => {
        if (!value) return;
        navigate(`/games/filter/${type}/${encodeURIComponent(String(value))}`);
    };

    return (
        <div className={`gp-backdrop theme-${theme}`} style={{ '--gc': gameColor }}>
            {/* Toast notification */}
            {toast && (
                <div className={`gp-toast gp-toast--${toast.type}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Ambient particles */}
            <div className="gp-ambient">
                {particles.map(p => (
                    <span key={p.id} className="gp-ambient__dot"
                        style={{ '--px': p.x + '%', '--py': p.y + '%', '--ps': p.size + 'px', '--pd': p.dur + 's', '--pdelay': p.delay + 's' }} />
                ))}
            </div>

            {/* Back button */}
            <button className="gp-back" onClick={() => navigate(-1)}>
                <FaArrowLeft />
                <span>Volver</span>
            </button>

            {/* Main card */}
            <div ref={cardRef} className="gp-card" onMouseMove={handleMouseMove}
                style={{ '--mx': mousePos.x + '%', '--my': mousePos.y + '%' }}>
                {/* Top glow that follows cursor */}
                <div className="gp-card__cursor-glow" />
                {/* Top accent line */}
                <div className="gp-card__accent" />

                {/* Image header */}
                <div className="gp-card__image">
                    <img src={game.img || game.image || 'https://via.placeholder.com/400'} alt={game.name} />
                    <div className="gp-card__image-overlay" />
                    <div className="gp-card__image-scanlines" />

                    {/* Like button */}
                    <button className={'gp-heart ' + (isLiked ? 'active' : '')} onClick={handleLike} title={isLiked ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                        {isLiked ? <FaHeart /> : <FaRegHeart />}
                    </button>

                    {/* Status badge on image */}
                    <div className="gp-status-badge">
                        <span className="gp-status-badge__dot" />
                        <span>LIVE</span>
                    </div>
                </div>

                {/* Body */}
                <div className="gp-card__body">
                    {/* Meta row */}
                    <div className="gp-meta">
                        <span className="gp-meta__active">
                            <FaBolt className="gp-meta__icon" />
                            Activo ahora
                        </span>
                        <span className="gp-meta__date">
                            <i className='bx bx-time-five' /> Actualizado hoy
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="gp-title">{game.name}</h1>

                    {/* Description */}
                    <p className="gp-desc">{game.desc || game.description || 'Unete a la comunidad oficial para encontrar torneos y companeros de equipo.'}</p>

                    {/* Tags */}
                    <div className="gp-tags">
                        <button className="gp-tag gp-tag--primary gp-tag-btn" onClick={() => goToFilter('company', company)}>
                            <FaLayerGroup /> {company}
                        </button>
                        {normalizedTags.slice(0, 6).map((tag, idx) => (
                            <button key={tag} className="gp-tag gp-tag-btn" onClick={() => goToFilter('tag', tag)}>
                                {idx === 0 ? <FaGamepad /> : <FaGlobe />} {tag}
                            </button>
                        ))}
                    </div>

                    {/* Stats bar */}
                    <div className="gp-stats-bar">
                        <div className="gp-stats-bar__item">
                            <FaUsers className="gp-stats-bar__icon" />
                            <div className="gp-stats-bar__text">
                                <strong>{game.members || '5.2k'}</strong>
                                <span>miembros</span>
                            </div>
                        </div>
                        <div className="gp-stats-bar__sep" />
                        <div className="gp-stats-bar__item">
                            <FaBolt className="gp-stats-bar__icon" />
                            <div className="gp-stats-bar__text">
                                <strong>{game.active || '1.2k'}</strong>
                                <span>activos</span>
                            </div>
                        </div>
                        <div className="gp-stats-bar__sep" />
                        <div className="gp-stats-bar__item">
                            <FaGamepad className="gp-stats-bar__icon" />
                            <div className="gp-stats-bar__text">
                                <strong>24/7</strong>
                                <span>torneos</span>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="gp-divider">
                        <div className="gp-divider__line" />
                        <div className="gp-divider__glow" />
                        <div className="gp-divider__line" />
                    </div>

                    {/* Footer */}
                    <div className="gp-footer">
                        <div className="gp-avatars">
                            <img src="https://i.pravatar.cc/150?u=1" alt="" />
                            <img src="https://i.pravatar.cc/150?u=2" alt="" />
                            <img src="https://i.pravatar.cc/150?u=3" alt="" />
                            <div className="gp-avatars__count">+{parseInt(game.members) || 99}</div>
                        </div>

                        <div className="gp-actions">
                            {/* Share button with dropdown */}
                            <div className="gp-share-wrapper" ref={shareMenuRef}>
                                <button 
                                    className={`gp-btn gp-btn--icon ${showShareMenu ? 'active' : ''}`} 
                                    title="Compartir"
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                >
                                    <FaShareAlt />
                                </button>
                                {showShareMenu && (
                                    <div className="gp-share-menu">
                                        <button onClick={handleCopyLink} className="gp-share-menu__item">
                                            {copied ? <FaCheck /> : <FaCopy />}
                                            <span>{copied ? '¡Copiado!' : 'Copiar enlace'}</span>
                                        </button>
                                        <button onClick={() => handleShare('twitter')} className="gp-share-menu__item">
                                            <FaTwitter />
                                            <span>Twitter</span>
                                        </button>
                                        <button onClick={() => handleShare('whatsapp')} className="gp-share-menu__item">
                                            <FaWhatsapp />
                                            <span>WhatsApp</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Follow button */}
                            <button 
                                className={`gp-btn gp-btn--icon ${isFollowing ? 'active' : ''}`} 
                                title={isFollowing ? 'Dejar de seguir' : 'Seguir'}
                                onClick={handleFollow}
                            >
                                {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
                            </button>
                            <button
                                className="gp-btn gp-btn--enter"
                                onClick={() => {
                                    const routeIdMap = {
                                        overwatch: 'overwatch',
                                        ow2: 'overwatch',
                                        rocket: 'rocket',
                                        rl: 'rocket',
                                        freefire: 'freefire',
                                        ff: 'freefire',
                                        wildrift: 'wildrift',
                                        wr: 'wildrift',
                                        r6: 'r6',
                                        r6s: 'r6',
                                        pubg: 'pubgm',
                                        pubgm: 'pubgm',
                                        hs: 'hearthstone',
                                        hearthstone: 'hearthstone',
                                        cr: 'clashroyale',
                                        clashroyale: 'clashroyale',
                                        lor: 'lor',
                                        nba2k: 'nba2k',
                                        aov: 'hok',
                                    };
                                    const routeId = routeIdMap[incomingId] || routeIdMap[catalogId] || catalogId;
                                    navigate(`/game/${routeId}`);
                                }}
                            >
                                <FaGamepad className="gp-btn__gamepad" />
                                <span>ENTRAR</span>
                                <i className='bx bx-right-arrow-alt gp-btn__arrow' />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom edge glow */}
                <div className="gp-card__edge" />
            </div>
        </div>
    );
};

export default GamesPage;
