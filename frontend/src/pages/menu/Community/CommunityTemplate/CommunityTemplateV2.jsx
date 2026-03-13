import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMUNITY_LIST, COMMUNITY_GAMES } from '../../../../data/communityData';
import './communityTemplateV2.css';

/* ═══════════════════════════════════════════════════════════════════════════
   IMMERSIVE FULL-SCREEN COMMUNITY TEMPLATE
   Horizontal scroll for details, Vertical scroll for sections
   ═══════════════════════════════════════════════════════════════════════════ */

const slugify = (value) =>
    String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const normalizeCommunity = (stateData, catalogCommunity, slugParam) => {
    const source = stateData?.name ? stateData : catalogCommunity || {};
    const games = stateData?.settings?.games || stateData?.games || catalogCommunity?.tags || [];
    const members = Number(stateData?.stats?.members || catalogCommunity?.members || 12450);
    const online = Number(stateData?.stats?.online || catalogCommunity?.online || 342);
    const description =
        stateData?.description ||
        stateData?.tagline ||
        catalogCommunity?.description ||
        'La comunidad competitiva más grande. Torneos semanales, clips épicos, LFG para ranked y mucho más.';

    return {
        name: source.name || 'Valorant Latam',
        tagline: stateData?.tagline || catalogCommunity?.description || 'Comunidad Competitiva Oficial',
        description,
        banner:
            stateData?.banner ||
            catalogCommunity?.img ||
            'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1920&q=80',
        avatar:
            stateData?.avatar ||
            catalogCommunity?.img ||
            'https://via.placeholder.com/200/8EDB15/08120d?text=VAL',
        stats: { members, online, tournaments: 24, clips: 1580 },
        createdAt: stateData?.created_at || catalogCommunity?.createdAt || '2024',
        rules: stateData?.settings?.rules || stateData?.rules || [
            'Respeta a todos los miembros',
            'No toxicidad ni hate speech',
            'Usa los canales correctos',
            'No spam ni autopromoción',
            'Reporta contenido inapropiado'
        ],
        admins: stateData?.admins || ['ProGamer', 'TournamentLead', 'ModeratorX'],
        region: stateData?.region || 'LATAM',
        language: stateData?.language || 'Español',
        games: Array.isArray(games) && games.length > 0 ? games : ['Valorant'],
        color: stateData?.color || catalogCommunity?.color || '#ff4655',
        slug: stateData?.slug || catalogCommunity?.slug || slugParam || slugify(source.name || 'community')
    };
};

const MOCK_POSTS = [
    {
        id: 'p1',
        author: 'ProGamer',
        avatar: 'P',
        role: 'Admin',
        time: 'Hace 2h',
        content: '¡Nuevo torneo este fin de semana! Inscripciones abiertas. Premio: $500 USD 🏆',
        likes: 234,
        comments: 45,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
        highlight: true
    },
    {
        id: 'p2',
        author: 'ClipMaster',
        avatar: 'C',
        role: 'Member',
        time: 'Hace 4h',
        content: 'ACE con Jett en Ascent rank Inmortal. ¿Qué opinan del crosshair?',
        likes: 156,
        comments: 23,
        video: true
    },
    {
        id: 'p3',
        author: 'TeamLead',
        avatar: 'T',
        role: 'Moderator',
        time: 'Hace 6h',
        content: 'LFG para ranked 5-stack. Buscamos support/controller. DM si te interesa.',
        likes: 89,
        comments: 67
    }
];

const MOCK_TOURNAMENTS = [
    {
        id: 1,
        name: 'Copa Invierno 2024',
        status: 'live',
        prize: '$500 USD',
        teams: '16/32',
        date: 'Finaliza 20 Oct',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'
    },
    {
        id: 2,
        name: 'Liga Semanal',
        status: 'upcoming',
        prize: '$200 USD',
        teams: '8/16',
        date: 'Inicia 25 Oct',
        image: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=400'
    },
    {
        id: 3,
        name: 'Ranked Challenge',
        status: 'finished',
        prize: '$100 USD',
        teams: '32/32',
        date: 'Finalizado',
        image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=400'
    }
];

const CommunityTemplateV2 = () => {
    const [currentSection, setCurrentSection] = useState(0);
    const [horizontalSlide, setHorizontalSlide] = useState(0);
    const [isJoined, setIsJoined] = useState(false);
    const containerRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();

    const incomingData = location.state || {};
    const catalogCommunity = useMemo(
        () => COMMUNITY_LIST.find((c) => c.slug === slug),
        [slug]
    );
    const community = useMemo(
        () => normalizeCommunity(incomingData, catalogCommunity, slug),
        [incomingData, catalogCommunity, slug]
    );

    // Related communities (same game)
    const relatedCommunities = useMemo(() => {
        return COMMUNITY_LIST.filter(c => 
            c.slug !== slug && 
            c.tags?.some(tag => community.games.includes(tag))
        ).slice(0, 6);
    }, [slug, community.games]);

    // Section names for navigation indicator
    const sections = ['Inicio', 'Comunidades', 'Feed', 'Torneos', 'Info'];

    // Handle keyboard navigation
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
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSection, sections.length]);

    // Scroll to section
    useEffect(() => {
        containerRef.current?.children[currentSection]?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, [currentSection]);

    const goToSection = (index) => {
        setCurrentSection(index);
        setHorizontalSlide(0);
    };

    const dynamicStyles = {
        '--ct-accent': community.color,
        '--ct-accent-rgb': hexToRgb(community.color),
        '--ct-banner': `url(${community.banner})`,
        '--ct-avatar': `url(${community.avatar})`
    };

    return (
        <div className="ctv2" style={dynamicStyles} ref={containerRef}>
            {/* Navigation Indicators */}
            <nav className="ctv2-nav">
                {sections.map((name, i) => (
                    <button
                        key={name}
                        className={`ctv2-nav__dot ${currentSection === i ? 'active' : ''}`}
                        onClick={() => goToSection(i)}
                        title={name}
                    >
                        <span className="ctv2-nav__label">{name}</span>
                    </button>
                ))}
            </nav>



            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 0: HERO - Full Screen Landing
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="ctv2-section ctv2-hero">
                <div className="ctv2-hero__bg">
                    <div className="ctv2-hero__image" />
                    <div className="ctv2-hero__overlay" />
                    <div className="ctv2-hero__grid" />
                    <div className="ctv2-hero__scanlines" />
                    <div className="ctv2-hero__particles">
                        {Array.from({ length: 20 }).map((_, i) => (
                            <span key={i} className="ctv2-particle" style={{
                                '--x': `${Math.random() * 100}%`,
                                '--delay': `${Math.random() * 5}s`,
                                '--duration': `${8 + Math.random() * 8}s`
                            }} />
                        ))}
                    </div>
                </div>

                <div className="ctv2-hero__horizontal" style={{ '--slide': horizontalSlide }}>
                    {/* Slide 0: Main Hero */}
                    <div className="ctv2-hero__slide">
                        <motion.div 
                            className="ctv2-hero__content"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="ctv2-hero__avatar-wrap">
                                <div className="ctv2-hero__avatar" />
                                <span className="ctv2-hero__pulse" />
                            </div>
                            <div className="ctv2-hero__badges">
                                <span className="ctv2-badge ctv2-badge--accent">
                                    <i className='bx bxs-check-circle'></i> Oficial
                                </span>
                                <span className="ctv2-badge">{community.region}</span>
                                <span className="ctv2-badge">{community.language}</span>
                            </div>
                            <h1 className="ctv2-hero__title" data-text={community.name}>
                                {community.name}
                            </h1>
                            <p className="ctv2-hero__tagline">{community.tagline}</p>
                            
                            <div className="ctv2-hero__stats">
                                <div className="ctv2-stat">
                                    <i className='bx bxs-group'></i>
                                    <strong>{community.stats.members.toLocaleString()}</strong>
                                    <span>Miembros</span>
                                </div>
                                <div className="ctv2-stat ctv2-stat--online">
                                    <span className="ctv2-stat__dot" />
                                    <strong>{community.stats.online}</strong>
                                    <span>Online</span>
                                </div>
                                <div className="ctv2-stat">
                                    <i className='bx bxs-trophy'></i>
                                    <strong>{community.stats.tournaments}</strong>
                                    <span>Torneos</span>
                                </div>
                            </div>

                            <div className="ctv2-hero__actions">
                                <button 
                                    className={`ctv2-btn ctv2-btn--primary ${isJoined ? 'joined' : ''}`}
                                    onClick={() => setIsJoined(!isJoined)}
                                >
                                    {isJoined ? (
                                        <><i className='bx bxs-check-circle'></i> Miembro</>
                                    ) : (
                                        <><i className='bx bx-plus'></i> Unirse</>
                                    )}
                                </button>
                                <button className="ctv2-btn ctv2-btn--ghost">
                                    <i className='bx bx-share-alt'></i> Compartir
                                </button>
                            </div>
                        </motion.div>

                        {/* Edge Navigation Indicators */}
                        {horizontalSlide < 2 && (
                            <div className="ctv2-edge ctv2-edge--right" onClick={() => setHorizontalSlide(horizontalSlide + 1)}>
                                <div className="ctv2-edge__arrows">
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                </div>
                            </div>
                        )}
                        {currentSection < sections.length - 1 && (
                            <div className="ctv2-edge ctv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide 1: Description & Info */}
                    <div className="ctv2-hero__slide ctv2-hero__slide--info">
                        {horizontalSlide > 0 && (
                            <div className="ctv2-edge ctv2-edge--left" onClick={() => setHorizontalSlide(horizontalSlide - 1)}>
                                <div className="ctv2-edge__arrows">
                                    <i className='bx bx-chevron-left'></i>
                                    <i className='bx bx-chevron-left'></i>
                                    <i className='bx bx-chevron-left'></i>
                                </div>
                            </div>
                        )}
                        <motion.div 
                            className="ctv2-info-panel"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: horizontalSlide === 1 ? 1 : 0, x: horizontalSlide === 1 ? 0 : 50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="ctv2-info-panel__header">
                                <div className="ctv2-info-panel__icon">
                                    <i className='bx bxs-info-circle'></i>
                                </div>
                                <div>
                                    <h2>Sobre Nosotros</h2>
                                    <span className="ctv2-info-panel__subtitle">Conoce nuestra comunidad</span>
                                </div>
                            </div>
                            
                            <p className="ctv2-description">{community.description}</p>
                            
                            <div className="ctv2-info-stats">
                                <div className="ctv2-info-stat">
                                    <div className="ctv2-info-stat__icon"><i className='bx bxs-map'></i></div>
                                    <div className="ctv2-info-stat__content">
                                        <span>Región</span>
                                        <strong>{community.region}</strong>
                                    </div>
                                </div>
                                <div className="ctv2-info-stat">
                                    <div className="ctv2-info-stat__icon"><i className='bx bxs-globe'></i></div>
                                    <div className="ctv2-info-stat__content">
                                        <span>Idioma</span>
                                        <strong>{community.language}</strong>
                                    </div>
                                </div>
                                <div className="ctv2-info-stat">
                                    <div className="ctv2-info-stat__icon"><i className='bx bxs-calendar'></i></div>
                                    <div className="ctv2-info-stat__content">
                                        <span>Fundada</span>
                                        <strong>{community.createdAt}</strong>
                                    </div>
                                </div>
                                <div className="ctv2-info-stat">
                                    <div className="ctv2-info-stat__icon"><i className='bx bxs-joystick'></i></div>
                                    <div className="ctv2-info-stat__content">
                                        <span>Juego Principal</span>
                                        <strong>{community.games[0]}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="ctv2-games-row">
                                {community.games.map(game => (
                                    <span key={game} className="ctv2-game-chip">
                                        <i className='bx bxs-joystick'></i> {game}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                        {horizontalSlide < 2 && (
                            <div className="ctv2-edge ctv2-edge--right" onClick={() => setHorizontalSlide(horizontalSlide + 1)}>
                                <div className="ctv2-edge__arrows">
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                    <i className='bx bx-chevron-right'></i>
                                </div>
                            </div>
                        )}
                        {currentSection < sections.length - 1 && (
                            <div className="ctv2-edge ctv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                    <i className='bx bx-chevron-down'></i>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Slide 2: Rules */}
                    <div className="ctv2-hero__slide ctv2-hero__slide--info">
                        <div className="ctv2-edge ctv2-edge--left" onClick={() => setHorizontalSlide(1)}>
                            <div className="ctv2-edge__arrows">
                                <i className='bx bx-chevron-left'></i>
                                <i className='bx bx-chevron-left'></i>
                                <i className='bx bx-chevron-left'></i>
                            </div>
                        </div>
                        <motion.div 
                            className="ctv2-info-panel ctv2-info-panel--rules"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: horizontalSlide === 2 ? 1 : 0, x: horizontalSlide === 2 ? 0 : 50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="ctv2-info-panel__header">
                                <div className="ctv2-info-panel__icon ctv2-info-panel__icon--rules">
                                    <i className='bx bxs-shield-alt-2'></i>
                                </div>
                                <div>
                                    <h2>Reglas</h2>
                                    <span className="ctv2-info-panel__subtitle">Normas de convivencia</span>
                                </div>
                            </div>
                            <div className="ctv2-rules">
                                {(Array.isArray(community.rules) ? community.rules : community.rules.split('\n').filter(Boolean)).map((rule, i) => (
                                    <div key={i} className="ctv2-rule">
                                        <span className="ctv2-rule__num">{String(i + 1).padStart(2, '0')}</span>
                                        <p>{rule.replace(/^\d+\.\s*/, '')}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="ctv2-warning">
                                <i className='bx bxs-error'></i>
                                <span>Violaciones pueden resultar en ban permanente</span>
                            </div>
                        </motion.div>
                        {currentSection < sections.length - 1 && (
                            <div className="ctv2-edge ctv2-edge--bottom" onClick={() => goToSection(currentSection + 1)}>
                                <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
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
                SECTION 1: RELATED COMMUNITIES - Horizontal Scroll
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="ctv2-section ctv2-communities">
                <div className="ctv2-section__header">
                    <span className="ctv2-eyebrow">Explora más</span>
                    <h2>Comunidades de {community.games[0]}</h2>
                    <p>Descubre otras comunidades relacionadas con este juego</p>
                </div>
                <div className="ctv2-communities__scroll">
                    {relatedCommunities.length > 0 ? relatedCommunities.map((c, i) => (
                        <motion.article 
                            key={c.slug}
                            className="ctv2-community-card"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => navigate(`/community/${c.slug}`)}
                        >
                            <div className="ctv2-community-card__img" style={{ backgroundImage: `url(${c.img})` }} />
                            <div className="ctv2-community-card__overlay" />
                            <div className="ctv2-community-card__content">
                                <h3>{c.name}</h3>
                                <p>{c.description}</p>
                                <div className="ctv2-community-card__meta">
                                    <span><i className='bx bxs-group'></i> {c.members}</span>
                                    <span className="ctv2-community-card__online">
                                        <span className="dot" /> {c.online} online
                                    </span>
                                </div>
                            </div>
                        </motion.article>
                    )) : (
                        <div className="ctv2-empty">
                            <i className='bx bx-search-alt'></i>
                            <p>No hay comunidades relacionadas por ahora</p>
                        </div>
                    )}
                </div>
                
                {/* Edge Navigation */}
                <div className="ctv2-edge ctv2-edge--right ctv2-edge--section">
                    <div className="ctv2-edge__arrows">
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                    </div>
                </div>
                {currentSection < sections.length - 1 && (
                    <div className="ctv2-edge ctv2-edge--bottom ctv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 2: FEED - Posts & Activity
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="ctv2-section ctv2-feed">
                <div className="ctv2-section__header">
                    <span className="ctv2-eyebrow">Actividad</span>
                    <h2>Feed de la Comunidad</h2>
                    <p>Las últimas publicaciones, clips y anuncios</p>
                </div>
                <div className="ctv2-feed__grid">
                    <div className="ctv2-feed__main">
                        {isJoined && (
                            <div className="ctv2-composer">
                                <div className="ctv2-composer__avatar">U</div>
                                <input type="text" placeholder="Comparte algo con la comunidad..." />
                                <div className="ctv2-composer__actions">
                                    <button><i className='bx bx-image'></i></button>
                                    <button><i className='bx bx-video'></i></button>
                                    <button><i className='bx bx-poll'></i></button>
                                </div>
                            </div>
                        )}
                        <div className="ctv2-feed__filters">
                            <button className="active"><i className='bx bxs-hot'></i> Destacado</button>
                            <button>Reciente</button>
                            <button>Clips</button>
                            <button>LFG</button>
                        </div>
                        <div className="ctv2-posts">
                            {MOCK_POSTS.map((post, i) => (
                                <motion.article 
                                    key={post.id}
                                    className={`ctv2-post ${post.highlight ? 'highlight' : ''}`}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <div className="ctv2-post__header">
                                        <div className="ctv2-post__avatar">{post.avatar}</div>
                                        <div className="ctv2-post__meta">
                                            <strong>{post.author}</strong>
                                            <span>{post.role} · {post.time}</span>
                                        </div>
                                        <button className="ctv2-post__more">
                                            <i className='bx bx-dots-horizontal-rounded'></i>
                                        </button>
                                    </div>
                                    <p className="ctv2-post__content">{post.content}</p>
                                    {post.image && (
                                        <div className="ctv2-post__media">
                                            <img src={post.image} alt="" />
                                        </div>
                                    )}
                                    {post.video && (
                                        <div className="ctv2-post__media ctv2-post__media--video">
                                            <i className='bx bx-play-circle'></i>
                                            <span>Ver clip</span>
                                        </div>
                                    )}
                                    <div className="ctv2-post__actions">
                                        <button><i className='bx bx-heart'></i> {post.likes}</button>
                                        <button><i className='bx bx-comment'></i> {post.comments}</button>
                                        <button><i className='bx bx-share'></i></button>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                    <aside className="ctv2-feed__sidebar">
                        <div className="ctv2-sidebar-card">
                            <h3><i className='bx bxs-hot'></i> Trending</h3>
                            <div className="ctv2-trending-list">
                                {['#TorneoInvierno', '#LFGRanked', '#ClipsValorant', '#PatchNotes'].map((tag, i) => (
                                    <span key={tag} className="ctv2-trending-item">
                                        <span className="ctv2-trending-rank">#{i + 1}</span>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="ctv2-sidebar-card">
                            <h3><i className='bx bxs-group'></i> Staff</h3>
                            <div className="ctv2-staff-list">
                                {community.admins.map((admin, i) => (
                                    <div key={admin} className="ctv2-staff-item">
                                        <div className="ctv2-staff-avatar">{admin[0]}</div>
                                        <div>
                                            <strong>{admin}</strong>
                                            <span>{i === 0 ? 'Owner' : 'Admin'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
                
                {/* Edge Navigation */}
                {currentSection < sections.length - 1 && (
                    <div className="ctv2-edge ctv2-edge--bottom ctv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 3: TOURNAMENTS
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="ctv2-section ctv2-tournaments">
                <div className="ctv2-section__header">
                    <span className="ctv2-eyebrow">Competencia</span>
                    <h2>Torneos de la Comunidad</h2>
                    <p>Compite y demuestra tu habilidad</p>
                </div>
                <div className="ctv2-tournaments__scroll">
                    {MOCK_TOURNAMENTS.map((t, i) => (
                        <motion.article 
                            key={t.id}
                            className={`ctv2-tournament-card ${t.status}`}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div className="ctv2-tournament-card__img" style={{ backgroundImage: `url(${t.image})` }}>
                                <span className={`ctv2-tournament-card__status ${t.status}`}>
                                    {t.status === 'live' && <><span className="live-dot" /> EN VIVO</>}
                                    {t.status === 'upcoming' && 'PRÓXIMO'}
                                    {t.status === 'finished' && 'FINALIZADO'}
                                </span>
                            </div>
                            <div className="ctv2-tournament-card__body">
                                <h3>{t.name}</h3>
                                <div className="ctv2-tournament-card__meta">
                                    <span><i className='bx bxs-trophy'></i> {t.prize}</span>
                                    <span><i className='bx bxs-group'></i> {t.teams}</span>
                                    <span><i className='bx bxs-calendar'></i> {t.date}</span>
                                </div>
                                <div className="ctv2-tournament-card__actions">
                                    <button className="ctv2-btn ctv2-btn--primary ctv2-btn--sm">
                                        {t.status === 'live' ? 'Ver bracket' : t.status === 'upcoming' ? 'Inscribirse' : 'Ver resultados'}
                                    </button>
                                    <button className="ctv2-btn ctv2-btn--ghost ctv2-btn--sm">Detalles</button>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
                
                {/* Edge Navigation */}
                <div className="ctv2-edge ctv2-edge--right ctv2-edge--section">
                    <div className="ctv2-edge__arrows">
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                        <i className='bx bx-chevron-right'></i>
                    </div>
                </div>
                {currentSection < sections.length - 1 && (
                    <div className="ctv2-edge ctv2-edge--bottom ctv2-edge--section" onClick={() => goToSection(currentSection + 1)}>
                        <div className="ctv2-edge__arrows ctv2-edge__arrows--vertical">
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                            <i className='bx bx-chevron-down'></i>
                        </div>
                    </div>
                )}
            </section>

            {/* ═══════════════════════════════════════════════════════════════════
                SECTION 4: INFO & ADMIN
               ═══════════════════════════════════════════════════════════════════ */}
            <section className="ctv2-section ctv2-info">
                <div className="ctv2-info__grid">
                    <div className="ctv2-info__main">
                        <div className="ctv2-section__header">
                            <span className="ctv2-eyebrow">Administración</span>
                            <h2>Equipo y Configuración</h2>
                        </div>
                        <div className="ctv2-staff-grid">
                            {community.admins.map((admin, i) => (
                                <div key={admin} className="ctv2-staff-card">
                                    <div className="ctv2-staff-card__avatar">{admin[0]}</div>
                                    <h4>{admin}</h4>
                                    <span>{i === 0 ? 'Owner' : 'Administrador'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="ctv2-apply-banner">
                            <div className="ctv2-apply-banner__content">
                                <i className='bx bxs-briefcase'></i>
                                <div>
                                    <h3>¿Quieres unirte al staff?</h3>
                                    <p>Buscamos moderadores, hosts y coordinadores de torneos</p>
                                </div>
                            </div>
                            <button className="ctv2-btn ctv2-btn--primary">Aplicar ahora</button>
                        </div>
                    </div>
                    <div className="ctv2-info__aside">
                        <div className="ctv2-quick-actions">
                            <h3>Acciones rápidas</h3>
                            <button onClick={() => navigate(`/community/${community.slug}/admin`, { state: community })}>
                                <i className='bx bxs-cog'></i> Panel de Admin
                            </button>
                            <button><i className='bx bxs-flag-alt'></i> Reportar comunidad</button>
                            <button><i className='bx bxs-share-alt'></i> Invitar amigos</button>
                            <button><i className='bx bxs-bell'></i> Configurar notificaciones</button>
                        </div>
                    </div>
                </div>
                <footer className="ctv2-footer">
                    <p>© {new Date().getFullYear()} {community.name}. Parte de la red GLITCH GANG.</p>
                </footer>
            </section>
        </div>
    );
};

// Helper to convert hex to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '142, 219, 21';
}

export default CommunityTemplateV2;
