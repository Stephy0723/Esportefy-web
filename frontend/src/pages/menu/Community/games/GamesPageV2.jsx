import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { gamesList } from '../../../../data/gamesData';
import { COMMUNITY_GAMES, COMMUNITY_LIST } from '../../../../data/communityData';
import { supportedGamesDetailedData as gamesDetailedData } from '../../../../data/supportedGamesDetailedData';
import './GamesPageV2.css';

/* ═══════════════════════════════════════════════════════════════════════════
   GAMES PAGE V2 - IMMERSIVE FULL-SCREEN DESIGN
   Same style as CommunityTemplateV2
   ═══════════════════════════════════════════════════════════════════════════ */

const normalizeId = (value) => String(value || '').toLowerCase().trim();

const aliasToCatalogId = {
    ow2: 'overwatch', rl: 'rocket', ff: 'freefire', wr: 'wildrift',
    wildrift: 'wildrift', r6s: 'r6', r6: 'r6', pubg: 'pubgm', pubgm: 'pubgm',
    hs: 'hearthstone', nba2k: 'nba2k', lor: 'lor', cr: 'clashroyale', aov: 'hok',
};

const companyById = {
    ow2: 'Blizzard Entertainment', rl: 'Psyonix', ff: 'Garena',
    wr: 'Riot Games', r6: 'Ubisoft', r6s: 'Ubisoft', pubgm: 'Krafton / Tencent',
    aov: 'TiMi Studio Group', lor: 'Riot Games', hs: 'Blizzard Entertainment',
    valorant: 'Riot Games', lol: 'Riot Games', mlbb: 'Moonton',
    fortnite: 'Epic Games', apex: 'Respawn Entertainment', cs2: 'Valve',
    dota2: 'Valve',
};

const MOCK_TOURNAMENTS = [
    { id: 1, name: 'Copa Regional 2024', status: 'live', prize: '$500 USD', teams: '16/32', date: 'Finaliza hoy' },
    { id: 2, name: 'Liga Semanal', status: 'upcoming', prize: '$200 USD', teams: '8/16', date: 'Inicia mañana' },
    { id: 3, name: 'Torneo Ranked', status: 'finished', prize: '$100 USD', teams: '32/32', date: 'Finalizado' },
];

const MOCK_CLIPS = [
    { id: 1, title: 'Ace increíble en ranked', author: 'ProPlayer', views: '12.5k', likes: 890 },
    { id: 2, title: 'Clutch 1v5 épico', author: 'ClipMaster', views: '8.2k', likes: 456 },
    { id: 3, title: 'Mejores jugadas del mes', author: 'HighlightKing', views: '25k', likes: 1200 },
];

const GamesPageV2 = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const [currentSection, setCurrentSection] = useState(0);
    const [horizontalSlide, setHorizontalSlide] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const containerRef = useRef(null);

    const incomingId = normalizeId(gameId);
    const catalogId = aliasToCatalogId[incomingId] || incomingId;
    
    const communityGame = COMMUNITY_GAMES?.find(g => normalizeId(g.id) === incomingId);
    const catalogGame = gamesList?.find(g => normalizeId(g.id) === catalogId);
    const game = communityGame || catalogGame || null;
    const detail = gamesDetailedData[incomingId] || gamesDetailedData[catalogId] || null;

    const gameColor = game?.color || '#8EDB15';
    const company = detail?.developer || game?.developer || game?.company || 
                    companyById[incomingId] || companyById[catalogId] || 'Desarrollador';

    // Related communities for this game
    const relatedCommunities = useMemo(() => {
        const gameName = game?.name?.toLowerCase() || '';
        return COMMUNITY_LIST?.filter(c => 
            c.tags?.some(tag => tag.toLowerCase().includes(gameName) || gameName.includes(tag.toLowerCase()))
        ).slice(0, 6) || [];
    }, [game]);

    // Tags
    const tags = useMemo(() => {
        const allTags = [
            ...(Array.isArray(detail?.tags) ? detail.tags : []),
            ...(Array.isArray(game?.tags) ? game.tags : []),
            game?.cat, detail?.category, game?.mode, game?.platform,
        ].filter(Boolean);
        const seen = new Set();
        return allTags.filter(tag => {
            const key = String(tag).trim().toLowerCase();
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        }).slice(0, 8);
    }, [game, detail]);

    const sections = ['Inicio', 'Comunidades', 'Torneos', 'Clips', 'Info'];

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowDown' && currentSection < sections.length - 1) {
                setCurrentSection(prev => prev + 1);
                setHorizontalSlide(0);
            } else if (e.key === 'ArrowUp' && currentSection > 0) {
                setCurrentSection(prev => prev - 1);
                setHorizontalSlide(0);
            } else if (e.key === 'ArrowRight') {
                setHorizontalSlide(prev => Math.min(prev + 1, 2));
            } else if (e.key === 'ArrowLeft') {
                setHorizontalSlide(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Escape') {
                navigate(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSection, sections.length, navigate]);

    // Scroll to section
    useEffect(() => {
        containerRef.current?.children[currentSection]?.scrollIntoView({
            behavior: 'smooth', block: 'start'
        });
    }, [currentSection]);

    const goToSection = (index) => {
        setCurrentSection(index);
        setHorizontalSlide(0);
    };

    const dynamicStyles = {
        '--gp-accent': gameColor,
        '--gp-accent-rgb': hexToRgb(gameColor),
        '--gp-banner': `url(${game?.img || game?.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1920'})`
    };

    if (!game) {
        return (
            <div className="gpv2 gpv2--error" style={dynamicStyles}>
                <div className="gpv2-error">
                    <i className='bx bx-error-circle'></i>
                    <h2>Juego no encontrado</h2>
                    <p>El ID "{gameId}" no coincide con ningún juego.</p>
                    <button className="gpv2-btn gpv2-btn--primary" onClick={() => navigate(-1)}>
                        <i className='bx bx-arrow-back'></i> Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="gpv2" style={dynamicStyles} ref={containerRef}>
            {/* Navigation Dots */}
            <nav className="gpv2-nav">
                {sections.map((name, i) => (
                    <button
                        key={name}
                        className={`gpv2-nav__dot ${currentSection === i ? 'active' : ''}`}
                        onClick={() => goToSection(i)}
                        title={name}
                    >
                        <span className="gpv2-nav__label">{name}</span>
                    </button>
                ))}
            </nav>

            {/* Back Button */}
            <button className="gpv2-back" onClick={() => navigate(-1)}>
                <i className='bx bx-arrow-back'></i>
            </button>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 0: HERO
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="gpv2-section gpv2-hero">
                <div className="gpv2-hero__bg">
                    <div className="gpv2-hero__image" />
                    <div className="gpv2-hero__overlay" />
                    <div className="gpv2-hero__grid" />
                    <div className="gpv2-hero__particles">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <span key={i} className="gpv2-particle" style={{
                                '--x': `${Math.random() * 100}%`,
                                '--delay': `${Math.random() * 5}s`,
                                '--duration': `${8 + Math.random() * 8}s`
                            }} />
                        ))}
                    </div>
                </div>

                <div className="gpv2-hero__horizontal" style={{ '--slide': horizontalSlide }}>
                    {/* Slide 0: Main Hero */}
                    <div className="gpv2-hero__slide">
                        <motion.div 
                            className="gpv2-hero__content"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="gpv2-hero__logo">
                                <img src={game.img || game.image} alt={game.name} />
                                <span className="gpv2-hero__pulse" />
                            </div>

                            <div className="gpv2-hero__badges">
                                <span className="gpv2-badge gpv2-badge--live">
                                    <span className="gpv2-badge__dot" /> ACTIVO
                                </span>
                                <span className="gpv2-badge">{company}</span>
                                <span className="gpv2-badge">{game.platform || 'Multiplataforma'}</span>
                            </div>

                            <h1 className="gpv2-hero__title" data-text={game.name}>
                                {game.name}
                            </h1>
                            <p className="gpv2-hero__tagline">
                                {game.desc || game.description || 'La comunidad competitiva más grande'}
                            </p>

                            <div className="gpv2-hero__stats">
                                <div className="gpv2-stat">
                                    <i className='bx bxs-group'></i>
                                    <strong>{game.members || '15.2k'}</strong>
                                    <span>Jugadores</span>
                                </div>
                                <div className="gpv2-stat gpv2-stat--online">
                                    <span className="gpv2-stat__dot" />
                                    <strong>{game.active || '2.4k'}</strong>
                                    <span>Online</span>
                                </div>
                                <div className="gpv2-stat">
                                    <i className='bx bxs-trophy'></i>
                                    <strong>24</strong>
                                    <span>Torneos</span>
                                </div>
                                <div className="gpv2-stat">
                                    <i className='bx bxs-video'></i>
                                    <strong>1.2k</strong>
                                    <span>Clips</span>
                                </div>
                            </div>

                            <div className="gpv2-hero__actions">
                                <button 
                                    className={`gpv2-btn gpv2-btn--primary ${isFollowing ? 'following' : ''}`}
                                    onClick={() => setIsFollowing(!isFollowing)}
                                >
                                    {isFollowing ? (
                                        <><i className='bx bxs-check-circle'></i> Siguiendo</>
                                    ) : (
                                        <><i className='bx bx-plus'></i> Seguir</>
                                    )}
                                </button>
                                <button 
                                    className="gpv2-btn gpv2-btn--enter"
                                    onClick={() => navigate(`/game/${catalogId}`)}
                                >
                                    <i className='bx bx-joystick'></i> Entrar
                                </button>
                                <button className="gpv2-btn gpv2-btn--ghost">
                                    <i className='bx bx-share-alt'></i>
                                </button>
                            </div>
                        </motion.div>

                        {/* Edge Navigation */}
                        {horizontalSlide < 2 && (
                            <div className="gpv2-edge gpv2-edge--right" onClick={() => setHorizontalSlide(horizontalSlide + 1)}>
                                <div className="gpv2-edge__arrows">
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                </div>
                            </div>
                        )}
                        {currentSection < sections.length - 1 && (
                            <div className="gpv2-edge gpv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide 1: Info & Tags */}
                    <div className="gpv2-hero__slide gpv2-hero__slide--info">
                        {horizontalSlide > 0 && (
                            <div className="gpv2-edge gpv2-edge--left" onClick={() => setHorizontalSlide(horizontalSlide - 1)}>
                                <div className="gpv2-edge__arrows">
                                    <i className='bx bx-chevron-left'></i>
                                    <i className='bx bx-chevron-left'></i>
                                    <i className='bx bx-chevron-left'></i>
                                </div>
                            </div>
                        )}
                        <motion.div 
                            className="gpv2-info-panel"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: horizontalSlide === 1 ? 1 : 0, x: horizontalSlide === 1 ? 0 : 50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="gpv2-info-panel__header">
                                <div className="gpv2-info-panel__icon">
                                    <i className='bx bxs-info-circle'></i>
                                </div>
                                <div>
                                    <h2>Sobre el Juego</h2>
                                    <span className="gpv2-info-panel__subtitle">Información detallada</span>
                                </div>
                            </div>

                            <p className="gpv2-description">
                                {detail?.description || game.desc || game.description || 
                                'Únete a la comunidad oficial para encontrar torneos, compañeros de equipo y mejorar tus habilidades.'}
                            </p>

                            <div className="gpv2-info-stats">
                                <div className="gpv2-info-stat">
                                    <div className="gpv2-info-stat__icon"><i className='bx bxs-building'></i></div>
                                    <div className="gpv2-info-stat__content">
                                        <span>Desarrollador</span>
                                        <strong>{company}</strong>
                                    </div>
                                </div>
                                <div className="gpv2-info-stat">
                                    <div className="gpv2-info-stat__icon"><i className='bx bxs-devices'></i></div>
                                    <div className="gpv2-info-stat__content">
                                        <span>Plataforma</span>
                                        <strong>{game.platform || 'PC, Console, Mobile'}</strong>
                                    </div>
                                </div>
                                <div className="gpv2-info-stat">
                                    <div className="gpv2-info-stat__icon"><i className='bx bxs-category'></i></div>
                                    <div className="gpv2-info-stat__content">
                                        <span>Género</span>
                                        <strong>{game.cat || detail?.category || 'Competitivo'}</strong>
                                    </div>
                                </div>
                                <div className="gpv2-info-stat">
                                    <div className="gpv2-info-stat__icon"><i className='bx bxs-user-voice'></i></div>
                                    <div className="gpv2-info-stat__content">
                                        <span>Modo</span>
                                        <strong>{game.mode || 'Multiplayer'}</strong>
                                    </div>
                                </div>
                            </div>

                            <h3>Categorías</h3>
                            <div className="gpv2-tags">
                                {tags.map(tag => (
                                    <span 
                                        key={tag} 
                                        className="gpv2-tag"
                                        onClick={() => navigate(`/games/filter/tag/${encodeURIComponent(tag)}`)}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                        {horizontalSlide < 2 && (
                            <div className="gpv2-edge gpv2-edge--right" onClick={() => setHorizontalSlide(horizontalSlide + 1)}>
                                <div className="gpv2-edge__arrows">
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                </div>
                            </div>
                        )}
                        {currentSection < sections.length - 1 && (
                            <div className="gpv2-edge gpv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide 2: Quick Stats */}
                    <div className="gpv2-hero__slide gpv2-hero__slide--info">
                        <div className="gpv2-edge gpv2-edge--left" onClick={() => setHorizontalSlide(1)}>
                            <div className="gpv2-edge__arrows">
                                <i className='bx bx-chevron-left'></i>
                                <i className='bx bx-chevron-left'></i>
                                <i className='bx bx-chevron-left'></i>
                            </div>
                        </div>
                        <motion.div 
                            className="gpv2-info-panel gpv2-info-panel--stats"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: horizontalSlide === 2 ? 1 : 0, x: horizontalSlide === 2 ? 0 : 50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="gpv2-info-panel__header">
                                <div className="gpv2-info-panel__icon gpv2-info-panel__icon--stats">
                                    <i className='bx bxs-bar-chart-alt-2'></i>
                                </div>
                                <div>
                                    <h2>Estadísticas</h2>
                                    <span className="gpv2-info-panel__subtitle">Datos de la comunidad</span>
                                </div>
                            </div>

                            <div className="gpv2-big-stats">
                                <div className="gpv2-big-stat">
                                    <i className='bx bxs-group'></i>
                                    <strong>{game.members || '15.2k'}</strong>
                                    <span>Total Miembros</span>
                                </div>
                                <div className="gpv2-big-stat gpv2-big-stat--accent">
                                    <i className='bx bxs-zap'></i>
                                    <strong>{game.active || '2.4k'}</strong>
                                    <span>Activos Ahora</span>
                                </div>
                                <div className="gpv2-big-stat">
                                    <i className='bx bxs-trophy'></i>
                                    <strong>156</strong>
                                    <span>Torneos Totales</span>
                                </div>
                                <div className="gpv2-big-stat">
                                    <i className='bx bxs-video'></i>
                                    <strong>4.8k</strong>
                                    <span>Clips Subidos</span>
                                </div>
                            </div>

                            <div className="gpv2-activity-bar">
                                <h4>Actividad Semanal</h4>
                                <div className="gpv2-activity-bar__chart">
                                    {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, i) => (
                                        <div key={day} className="gpv2-activity-bar__day">
                                            <div 
                                                className="gpv2-activity-bar__fill"
                                                style={{ height: `${30 + Math.random() * 60}%` }}
                                            />
                                            <span>{day}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                        {currentSection < sections.length - 1 && (
                            <div className="gpv2-edge gpv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 1: COMMUNITIES
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="gpv2-section gpv2-communities">
                <div className="gpv2-section__header">
                    <span className="gpv2-eyebrow">Explora</span>
                    <h2>Comunidades de {game.name}</h2>
                    <p>Únete a grupos y equipos relacionados</p>
                </div>
                <div className="gpv2-communities__scroll">
                    {relatedCommunities.length > 0 ? relatedCommunities.map((c, i) => (
                        <motion.article 
                            key={c.slug || i}
                            className="gpv2-community-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => navigate(`/community/${c.slug}`)}
                        >
                            <div className="gpv2-community-card__img" style={{ backgroundImage: `url(${c.img})` }} />
                            <div className="gpv2-community-card__overlay" />
                            <div className="gpv2-community-card__content">
                                <h3>{c.name}</h3>
                                <p>{c.description}</p>
                                <div className="gpv2-community-card__meta">
                                    <span><i className='bx bxs-group'></i> {c.members}</span>
                                    <span className="gpv2-community-card__online">
                                        <span className="dot" /> {c.online} online
                                    </span>
                                </div>
                            </div>
                        </motion.article>
                    )) : (
                        <div className="gpv2-empty">
                            <i className='bx bx-world'></i>
                            <p>Las comunidades aparecerán aquí pronto</p>
                            <button className="gpv2-btn gpv2-btn--primary" onClick={() => navigate('/comunidad')}>
                                Explorar todas
                            </button>
                        </div>
                    )}
                </div>

                {/* Edge Navigation */}
                <div className="gpv2-edge gpv2-edge--right gpv2-edge--section">
                    <div className="gpv2-edge__arrows">
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                    </div>
                </div>
                {currentSection < sections.length - 1 && (
                    <div className="gpv2-edge gpv2-edge--bottom gpv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2: TOURNAMENTS
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="gpv2-section gpv2-tournaments">
                <div className="gpv2-section__header">
                    <span className="gpv2-eyebrow">Competencia</span>
                    <h2>Torneos de {game.name}</h2>
                    <p>Compite y demuestra tu habilidad</p>
                </div>
                <div className="gpv2-tournaments__scroll">
                    {MOCK_TOURNAMENTS.map((t, i) => (
                        <motion.article 
                            key={t.id}
                            className={`gpv2-tournament-card ${t.status}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="gpv2-tournament-card__header">
                                <span className={`gpv2-tournament-card__status ${t.status}`}>
                                    {t.status === 'live' && <><span className="live-dot" /> EN VIVO</>}
                                    {t.status === 'upcoming' && 'PRÓXIMO'}
                                    {t.status === 'finished' && 'FINALIZADO'}
                                </span>
                                <i className='bx bxs-trophy'></i>
                            </div>
                            <div className="gpv2-tournament-card__body">
                                <h3>{t.name}</h3>
                                <div className="gpv2-tournament-card__meta">
                                    <span><i className='bx bxs-dollar-circle'></i> {t.prize}</span>
                                    <span><i className='bx bxs-group'></i> {t.teams}</span>
                                </div>
                                <span className="gpv2-tournament-card__date">
                                    <i className='bx bxs-calendar'></i> {t.date}
                                </span>
                            </div>
                            <div className="gpv2-tournament-card__actions">
                                <button className="gpv2-btn gpv2-btn--primary gpv2-btn--sm">
                                    {t.status === 'live' ? 'Ver' : t.status === 'upcoming' ? 'Inscribirse' : 'Resultados'}
                                </button>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Edge Navigation */}
                <div className="gpv2-edge gpv2-edge--right gpv2-edge--section">
                    <div className="gpv2-edge__arrows">
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                    </div>
                </div>
                {currentSection < sections.length - 1 && (
                    <div className="gpv2-edge gpv2-edge--bottom gpv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3: CLIPS
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="gpv2-section gpv2-clips">
                <div className="gpv2-section__header">
                    <span className="gpv2-eyebrow">Contenido</span>
                    <h2>Mejores Clips</h2>
                    <p>Las mejores jugadas de la comunidad</p>
                </div>
                <div className="gpv2-clips__grid">
                    {MOCK_CLIPS.map((clip, i) => (
                        <motion.article 
                            key={clip.id}
                            className="gpv2-clip-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="gpv2-clip-card__preview">
                                <i className='bx bx-play-circle'></i>
                            </div>
                            <div className="gpv2-clip-card__body">
                                <h4>{clip.title}</h4>
                                <span className="gpv2-clip-card__author">por {clip.author}</span>
                                <div className="gpv2-clip-card__stats">
                                    <span><i className='bx bx-show'></i> {clip.views}</span>
                                    <span><i className='bx bxs-heart'></i> {clip.likes}</span>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>

                {/* Edge Navigation */}
                {currentSection < sections.length - 1 && (
                    <div className="gpv2-edge gpv2-edge--bottom gpv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="gpv2-edge__arrows gpv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 4: INFO
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="gpv2-section gpv2-info">
                <div className="gpv2-section__header">
                    <span className="gpv2-eyebrow">Más</span>
                    <h2>Información</h2>
                </div>
                <div className="gpv2-info__grid">
                    <div className="gpv2-info-block">
                        <h3><i className='bx bxs-link-alt'></i> Enlaces Oficiales</h3>
                        <div className="gpv2-links">
                            <a href="#" className="gpv2-link"><i className='bx bxl-discord'></i> Discord Oficial</a>
                            <a href="#" className="gpv2-link"><i className='bx bxl-twitter'></i> Twitter</a>
                            <a href="#" className="gpv2-link"><i className='bx bxl-youtube'></i> YouTube</a>
                            <a href="#" className="gpv2-link"><i className='bx bx-globe'></i> Sitio Web</a>
                        </div>
                    </div>
                    <div className="gpv2-info-block">
                        <h3><i className='bx bxs-shield-alt-2'></i> Acciones</h3>
                        <div className="gpv2-actions-list">
                            <button onClick={() => navigate(`/game/${catalogId}`)}>
                                <i className='bx bxs-joystick'></i> Ir a página del juego
                            </button>
                            <button><i className='bx bxs-flag-alt'></i> Reportar</button>
                            <button><i className='bx bxs-share-alt'></i> Compartir</button>
                        </div>
                    </div>
                </div>
                <footer className="gpv2-footer">
                    <p>© {new Date().getFullYear()} {game.name} - Esportefy</p>
                </footer>
            </section>
        </div>
    );
};

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '142, 219, 21';
}

export default GamesPageV2;
