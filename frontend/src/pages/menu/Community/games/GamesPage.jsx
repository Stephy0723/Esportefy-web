import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaHeart,
  FaRegHeart,
  FaUserPlus,
  FaUserCheck,
  FaGamepad,
  FaGlobe,
  FaLayerGroup,
  FaUsers,
  FaBolt,
  FaShareAlt,
  FaCopy,
  FaCheck,
  FaTwitter,
  FaWhatsapp
} from 'react-icons/fa';
import { useTheme } from '../../../../context/ThemeContext';
import { useLang } from '../../../../context/LanguageContext';
import { normalizeCommunityGameId } from '../../../../../../shared/communityCatalog.js';
import { fetchGameHubDetails, joinGameHub, formatGameHubCount } from '../gameHub.service';
import { decorateCommunityGame } from '../communityGameAssets';
import './GameCard.css';

const emptyStats = { usersCount: 0, activeCount: 0, joined: false };

const GamesPage = () => {
  const { t } = useLang();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const [isLiked, setIsLiked] = useState(false);
  const [joiningHub, setJoiningHub] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);
  const [particles, setParticles] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [pageLoading, setPageLoading] = useState(true);
  const [hubData, setHubData] = useState({
    game: null,
    stats: emptyStats,
    teams: [],
    tournaments: [],
    communities: [],
    organizers: []
  });

  const cardRef = useRef(null);
  const shareMenuRef = useRef(null);

  const normalizeId = (value) => String(value || '').toLowerCase().trim();
  const incomingId = normalizeId(gameId);
  const hubId = normalizeCommunityGameId(incomingId) || incomingId;

  const game = hubData.game;
  const gameStats = hubData.stats || emptyStats;
  const isFollowing = gameStats.joined;
  const gameColor = game?.color || '#8EDB15';

  useEffect(() => {
    const p = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      dur: 3 + Math.random() * 5,
      delay: Math.random() * 3
    }));
    setParticles(p);
  }, []);

  useEffect(() => {
    if (!hubId) return;

    let cancelled = false;

    const loadGameDetails = async () => {
      try {
        setPageLoading(true);
        const response = await fetchGameHubDetails(hubId);
        if (cancelled) return;
        setHubData({
          game: response.game ? decorateCommunityGame(response.game) : null,
          stats: response.stats || emptyStats,
          teams: Array.isArray(response.teams) ? response.teams : [],
          tournaments: Array.isArray(response.tournaments) ? response.tournaments : [],
          communities: Array.isArray(response.communities) ? response.communities : [],
          organizers: Array.isArray(response.organizers) ? response.organizers : []
        });
      } catch {
        if (!cancelled) {
          setHubData({
            game: null,
            stats: emptyStats,
            teams: [],
            tournaments: [],
            communities: [],
            organizers: []
          });
        }
      } finally {
        if (!cancelled) {
          setPageLoading(false);
        }
      }
    };

    loadGameDetails();

    return () => {
      cancelled = true;
    };
  }, [hubId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  const handleLike = useCallback(() => {
    setIsLiked((prev) => {
      const next = !prev;
      showToast(next ? '¡Añadido a favoritos!' : 'Eliminado de favoritos', next ? 'success' : 'info');
      return next;
    });
  }, [showToast]);

  const handleJoinHub = useCallback(async () => {
    if (!hubId || joiningHub) return null;

    try {
      setJoiningHub(true);
      const response = await joinGameHub(hubId);
      setHubData((prev) => ({
        ...prev,
        stats: response.stats || emptyStats
      }));
      showToast(
        response.alreadyJoined ? 'Ya formas parte de este hub.' : 'Ahora formas parte de esta comunidad.',
        'success'
      );
      return response.stats || emptyStats;
    } catch {
      showToast('No se pudo actualizar el conteo de este juego.', 'error');
      return null;
    } finally {
      setJoiningHub(false);
    }
  }, [hubId, joiningHub, showToast]);

  const handleFollow = useCallback(async () => {
    await handleJoinHub();
  }, [handleJoinHub]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast('¡Enlace copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Error al copiar', 'error');
    }
  }, [showToast]);

  const handleShare = useCallback((platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Unete a la comunidad de ${game?.name || 'este juego'} en GLITCH GANG`);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  }, [game?.name]);

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const handleEnterGame = useCallback(async () => {
    await handleJoinHub();
    navigate(`/game/${hubId}`);
  }, [handleJoinHub, hubId, navigate]);

  const normalizedTags = useMemo(() => {
    const tags = [
      ...(Array.isArray(game?.taxonomy?.genre) ? game.taxonomy.genre : []),
      ...(Array.isArray(game?.taxonomy?.mode) ? game.taxonomy.mode : []),
      ...(Array.isArray(game?.taxonomy?.platform) ? game.taxonomy.platform : []),
      ...(Array.isArray(game?.taxonomy?.competitive) ? game.taxonomy.competitive : []),
      ...(Array.isArray(game?.taxonomy?.style) ? game.taxonomy.style : []),
      ...(Array.isArray(game?.taxonomy?.mechanics) ? game.taxonomy.mechanics : []),
      game?.category
    ].filter(Boolean);

    const seen = new Set();
    return tags.filter((tag) => {
      const key = String(tag || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [game]);

  const goToFilter = (type, value) => {
    if (!value) return;
    navigate(`/games/filter/${type}/${encodeURIComponent(String(value))}`);
  };

  if (pageLoading) {
    return (
      <div className="gp-backdrop">
        <div className="gp-error">
          <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: '#8EDB15' }} />
          <h2>{t('gameLoading')}</h2>
          <p>{t('gameLoadingDesc')}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="gp-backdrop">
        <div className="gp-error">
          <i className='bx bx-error-circle' style={{ fontSize: '3rem', color: '#ef4444' }} />
          <h2>{t('gameNotFound')}</h2>
          <p>El ID "{gameId}" no coincide con ningun juego registrado.</p>
          <button className="gp-btn gp-btn--primary" onClick={() => navigate(-1)}>
            <FaArrowLeft /> {t('back')}
          </button>
        </div>
      </div>
    );
  }

  const company = game.company || 'Desarrollador no especificado';
  const tournamentsCount = Array.isArray(hubData.tournaments) ? hubData.tournaments.length : 0;
  const gameDescription = game.history || 'Unete a la comunidad oficial para encontrar torneos y companeros de equipo.';
  const primaryPlatform = Array.isArray(game?.taxonomy?.platform) && game.taxonomy.platform.length > 0
    ? game.taxonomy.platform.join(', ')
    : 'Cross-platform';

  return (
    <div className={`gp-backdrop theme-${theme}`} style={{ '--gc': gameColor }}>
      {toast && (
        <div className={`gp-toast gp-toast--${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="gp-ambient">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="gp-ambient__dot"
            style={{
              '--px': `${particle.x}%`,
              '--py': `${particle.y}%`,
              '--ps': `${particle.size}px`,
              '--pd': `${particle.dur}s`,
              '--pdelay': `${particle.delay}s`
            }}
          />
        ))}
      </div>

      <button className="gp-back" onClick={() => navigate(-1)}>
        <FaArrowLeft />
        <span>{t('back')}</span>
      </button>

      <div
        ref={cardRef}
        className="gp-card"
        onMouseMove={handleMouseMove}
        style={{ '--mx': `${mousePos.x}%`, '--my': `${mousePos.y}%` }}
      >
        <div className="gp-card__cursor-glow" />
        <div className="gp-card__accent" />

        <div className="gp-card__image">
          <img src={game.img || game.imageUrl || 'https://via.placeholder.com/400'} alt={game.name} />
          <div className="gp-card__image-overlay" />
          <div className="gp-card__image-scanlines" />

          <button
            className={`gp-heart ${isLiked ? 'active' : ''}`}
            onClick={handleLike}
            title={isLiked ? 'Quitar de favoritos' : 'Anadir a favoritos'}
          >
            {isLiked ? <FaHeart /> : <FaRegHeart />}
          </button>

          <div className="gp-status-badge">
            <span className="gp-status-badge__dot" />
            <span>{t('gameLive')}</span>
          </div>
        </div>

        <div className="gp-card__body">
          <div className="gp-meta">
            <span className="gp-meta__active">
              <FaBolt className="gp-meta__icon" />
              Activo ahora
            </span>
            <span className="gp-meta__date">
              <i className='bx bx-time-five' /> Actualizado desde backend
            </span>
          </div>

          <h1 className="gp-title">{game.name}</h1>
          <p className="gp-desc">{gameDescription}</p>

          <div className="gp-tags">
            <button className="gp-tag gp-tag--primary gp-tag-btn" onClick={() => goToFilter('company', company)}>
              <FaLayerGroup /> {company}
            </button>
            {normalizedTags.slice(0, 6).map((tag, index) => (
              <button key={tag} className="gp-tag gp-tag-btn" onClick={() => goToFilter('tag', tag)}>
                {index === 0 ? <FaGamepad /> : <FaGlobe />} {tag}
              </button>
            ))}
          </div>

          <div className="gp-stats-bar">
            <div className="gp-stats-bar__item">
              <FaUsers className="gp-stats-bar__icon" />
              <div className="gp-stats-bar__text">
                <strong>{formatGameHubCount(gameStats.usersCount)}</strong>
                <span>{t('gameMembersLabel')}</span>
              </div>
            </div>
            <div className="gp-stats-bar__sep" />
            <div className="gp-stats-bar__item">
              <FaBolt className="gp-stats-bar__icon" />
              <div className="gp-stats-bar__text">
                <strong>{formatGameHubCount(gameStats.activeCount)}</strong>
                <span>{t('gameActiveLabel')}</span>
              </div>
            </div>
            <div className="gp-stats-bar__sep" />
            <div className="gp-stats-bar__item">
              <FaGamepad className="gp-stats-bar__icon" />
              <div className="gp-stats-bar__text">
                <strong>{tournamentsCount}</strong>
                <span>{t('gameTournamentsLabel')}</span>
              </div>
            </div>
          </div>

          <div className="gp-divider">
            <div className="gp-divider__line" />
            <div className="gp-divider__glow" />
            <div className="gp-divider__line" />
          </div>

          <div className="gp-tags">
            <button className="gp-tag gp-tag-btn" onClick={() => goToFilter('tag', game.category)}>
              <FaLayerGroup /> {game.category || 'Game'}
            </button>
            <button className="gp-tag gp-tag-btn" onClick={() => goToFilter('tag', primaryPlatform)}>
              <FaGlobe /> {primaryPlatform}
            </button>
          </div>

          <div className="gp-footer">
            <div className="gp-avatars">
              <div className="gp-avatars__ghosts" aria-hidden="true">
                <span className="gp-avatars__ghost" />
                <span className="gp-avatars__ghost" />
                <span className="gp-avatars__ghost" />
              </div>
              <div className="gp-avatars__summary">
                <strong>{formatGameHubCount(gameStats.usersCount)}</strong>
                <span>{Number(gameStats.usersCount || 0) > 0 ? 'usuarios en el hub' : 'Sin miembros aun'}</span>
              </div>
            </div>

            <div className="gp-actions">
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

              <button
                className={`gp-btn gp-btn--icon ${isFollowing ? 'active' : ''}`}
                title={isFollowing ? 'Ya formas parte del hub' : 'Unirme al hub'}
                onClick={handleFollow}
                disabled={joiningHub}
              >
                {isFollowing ? <FaUserCheck /> : <FaUserPlus />}
              </button>

              <button className="gp-btn gp-btn--enter" onClick={handleEnterGame} disabled={joiningHub}>
                <FaGamepad className="gp-btn__gamepad" />
                <span>{t('gameJoin')}</span>
                <i className='bx bx-right-arrow-alt gp-btn__arrow' />
              </button>
            </div>
          </div>
        </div>

        <div className="gp-card__edge" />
      </div>
    </div>
  );
};

export default GamesPage;
