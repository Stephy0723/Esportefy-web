import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
    FaUsers,
    FaSearch,
    FaPen,
    FaFire,
    FaGamepad,
    FaImage,
    FaShareAlt,
    FaMapMarkerAlt,
    FaBriefcase,
    FaClock,
    FaGlobe,
    FaCalendarAlt,
    FaFilePdf,
    FaExclamationTriangle,
    FaBolt,
    FaSignal,
    FaSkull
} from 'react-icons/fa';
import { COMMUNITY_LIST } from '../../../../data/communityData';
import './communityTemplate.css';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } }
};

const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } }
};

const TOURNAMENTS_DATA = [
    {
        id: 1,
        name: 'Copa Invierno Valorant 2024',
        status: 'active',
        participants: '16/32',
        logo: 'https://cdn-icons-png.flaticon.com/512/3176/3176218.png',
        banner: 'https://via.placeholder.com/800x300/0b1220/8EDB15?text=VALORANT+CUP',
        date: 'Finaliza 20 Oct',
        organizer: 'Esportefy Staff'
    },
    {
        id: 2,
        name: 'Liga Rocket League',
        status: 'finished',
        participants: '8/8',
        logo: 'https://cdn-icons-png.flaticon.com/512/1693/1693244.png',
        banner: 'https://via.placeholder.com/800x300/111827/9ca3af?text=RL+WEEKLY',
        date: 'Finalizado',
        organizer: 'RL Community'
    }
];

const DEFAULT_POSTS = [
    {
        id: 'p1',
        author: 'Admin',
        role: 'Staff',
        time: 'Hace 2h',
        text: 'Bienvenidos a la comunidad. Usa este espacio para compartir scrims, clips y convocatorias.',
        highlight: true
    },
    {
        id: 'p2',
        author: 'Mod_Tester',
        role: 'Moderador',
        time: 'Hace 5h',
        text: 'Recuerda revisar las reglas antes de publicar. Estamos priorizando contenido competitivo y anuncios oficiales.',
        highlight: false
    }
];

const COMMUNITY_TABS = [
    { id: 'feed', label: 'Feed' },
    { id: 'tournaments', label: 'Torneos' },
    { id: 'about', label: 'Información' },
    { id: 'rules', label: 'Reglas' },
    { id: 'staff', label: 'Staff' }
];

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
    const members = Number(stateData?.stats?.members || catalogCommunity?.members || 1240);
    const online = Number(stateData?.stats?.online || catalogCommunity?.online || 45);
    const description =
        stateData?.description ||
        stateData?.tagline ||
        catalogCommunity?.description ||
        'Comunidad competitiva enfocada en contenido, torneos y coordinación entre jugadores.';

    return {
        name: source.name || 'Neoxys Esport',
        tagline: stateData?.tagline || catalogCommunity?.description || 'Comunidad Competitiva Oficial',
        description,
        banner:
            stateData?.banner ||
            catalogCommunity?.img ||
            'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1400&q=80',
        avatar:
            stateData?.avatar ||
            catalogCommunity?.img ||
            'https://via.placeholder.com/180/8EDB15/08120d?text=ES',
        stats: { members, online },
        createdAt: stateData?.created_at || catalogCommunity?.createdAt || '2024',
        rules:
            stateData?.settings?.rules ||
            stateData?.rules ||
            '1. Respeto.\n2. No toxicidad.\n3. Usa los canales correctos.\n4. No spam.',
        admins: stateData?.admins || ['Admin', 'TournamentLead'],
        region: stateData?.region || 'Global',
        language: stateData?.language || 'Español',
        games: Array.isArray(games) && games.length > 0 ? games : ['Valorant', 'LoL', 'CS2', 'Minecraft'],
        slug: stateData?.slug || catalogCommunity?.slug || slugParam || slugify(source.name || 'community')
    };
};

const CommunityTemplate = () => {
    const [activeTab, setActiveTab] = useState('feed');
    const [isJoined, setIsJoined] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [scrollY, setScrollY] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [slug]);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const incomingData = location.state || {};
    const catalogCommunity = useMemo(
        () => COMMUNITY_LIST.find((community) => community.slug === slug),
        [slug]
    );

    const communityData = useMemo(
        () => normalizeCommunity(incomingData, catalogCommunity, slug),
        [incomingData, catalogCommunity, slug]
    );

    const filteredPosts = useMemo(() => {
        if (!searchQuery.trim()) return DEFAULT_POSTS;
        const query = searchQuery.toLowerCase();
        return DEFAULT_POSTS.filter(
            (post) =>
                post.text.toLowerCase().includes(query) ||
                post.author.toLowerCase().includes(query) ||
                post.role.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const dynamicStyles = {
        '--hero-banner': `url(${communityData.banner})`,
        '--hero-avatar': `url(${communityData.avatar})`,
        '--scroll-y': `${scrollY * 0.22}px`
    };

    const neonStats = [
        { label: 'Miembros', value: communityData.stats.members, icon: <FaUsers /> },
        { label: 'En línea', value: communityData.stats.online, icon: <FaSignal /> },
        { label: 'Juegos', value: communityData.games.length, icon: <FaGamepad /> }
    ];

    const renderFeed = () => (
        <div className="ct-content-grid">
            <section className="ct-panel ct-panel--main">
                <div className="ct-panel__header">
                    <div>
                        <span className="ct-panel__eyebrow">Actividad</span>
                        <h3>Feed de la comunidad</h3>
                    </div>
                </div>
                {isJoined && (
                    <div className="ct-compose">
                        <div className="ct-compose__avatar" />
                        <div className="ct-compose__input">Comparte una actualización, una scrim o un anuncio.</div>
                        <div className="ct-compose__actions">
                            <button type="button"><FaGamepad /></button>
                            <button type="button"><FaImage /></button>
                        </div>
                    </div>
                )}
                <div className="ct-feed-filters">
                    <button type="button" className="ct-chip ct-chip--active"><FaFire /> Destacado</button>
                    <button type="button" className="ct-chip">Reciente</button>
                    <button type="button" className="ct-chip">Clips</button>
                </div>
                {filteredPosts.length > 0 ? (
                    <div className="ct-post-list">
                        {filteredPosts.map((post) => (
                            <article key={post.id} className={`ct-post ${post.highlight ? 'is-highlight' : ''}`}>
                                <div className="ct-post__meta">
                                    <div className="ct-post__avatar">{post.author.charAt(0)}</div>
                                    <div>
                                        <strong>{post.author}</strong>
                                        <span>{post.role} · {post.time}</span>
                                    </div>
                                </div>
                                <p>{post.text}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="ct-empty-state">
                        <FaPen className="ct-empty-state__icon" />
                        <h3>Sin resultados</h3>
                        <p>No encontramos publicaciones que coincidan con la búsqueda.</p>
                    </div>
                )}
            </section>

            <aside className="ct-side-stack">
                <div className="ct-panel">
                    <div className="ct-panel__header">
                        <div>
                            <span className="ct-panel__eyebrow">Resumen</span>
                            <h3>Señal de la comunidad</h3>
                        </div>
                    </div>
                    <p className="ct-muted">{communityData.tagline}</p>
                    <div className="ct-info-list">
                        <span><FaGlobe /> {communityData.region}</span>
                        <span><FaClock /> Desde {communityData.createdAt}</span>
                        <span><FaUsers /> {communityData.stats.members} miembros</span>
                    </div>
                </div>

                <div className="ct-panel">
                    <div className="ct-panel__header">
                        <div>
                            <span className="ct-panel__eyebrow">Juegos</span>
                            <h3>Zonas activas</h3>
                        </div>
                    </div>
                    <div className="ct-tag-cloud">
                        {communityData.games.map((game) => (
                            <span key={game} className="ct-tag"><FaGamepad /> {game}</span>
                        ))}
                    </div>
                </div>
            </aside>
        </div>
    );

    const renderTournaments = () => (
        <div className="ct-panel ct-panel--wide">
            <div className="ct-panel__header">
                <div>
                    <span className="ct-panel__eyebrow">Competencia</span>
                    <h3>Torneos vinculados</h3>
                </div>
            </div>
            <motion.div className="ct-tournament-grid" variants={stagger} initial="hidden" animate="visible">
                {TOURNAMENTS_DATA.map((tournament) => (
                    <motion.article
                        key={tournament.id}
                        className={`ct-tournament ${tournament.status}`}
                        variants={fadeUp}
                        whileHover={{ y: -4 }}
                    >
                        <div className="ct-tournament__banner" style={{ '--ct-banner': `url(${tournament.banner})` }}>
                            <span className="ct-tournament__badge">{tournament.status === 'active' ? 'Activo' : 'Finalizado'}</span>
                            <img src={tournament.logo} alt={tournament.name} className="ct-tournament__logo" />
                        </div>
                        <div className="ct-tournament__body">
                            <h4>{tournament.name}</h4>
                            <div className="ct-tournament__meta">
                                <span><FaUsers /> {tournament.participants}</span>
                                <span><FaCalendarAlt /> {tournament.date}</span>
                            </div>
                            <p>{tournament.organizer}</p>
                            <div className="ct-tournament__actions">
                                <button type="button" className="ct-btn ct-btn--primary">Ver bracket</button>
                                <button type="button" className="ct-btn ct-btn--ghost">Detalles</button>
                            </div>
                        </div>
                    </motion.article>
                ))}
            </motion.div>
        </div>
    );

    const renderAbout = () => (
        <div className="ct-content-grid ct-content-grid--about">
            <section className="ct-panel ct-panel--main">
                <div className="ct-panel__header">
                    <div>
                        <span className="ct-panel__eyebrow">Información</span>
                        <h3>Manifiesto y alcance</h3>
                    </div>
                </div>
                <p className="ct-about-copy">{communityData.description}</p>
                <div className="ct-divider" />
                <h4 className="ct-subtitle">Juegos principales</h4>
                <div className="ct-tag-cloud">
                    {communityData.games.map((game) => (
                        <span key={game} className="ct-tag"><FaGamepad /> {game}</span>
                    ))}
                </div>
            </section>
            <aside className="ct-side-stack">
                <div className="ct-stat-card">
                    <span>Región</span>
                    <strong><FaMapMarkerAlt /> {communityData.region}</strong>
                </div>
                <div className="ct-stat-card">
                    <span>Idioma</span>
                    <strong><FaGlobe /> {communityData.language}</strong>
                </div>
                <div className="ct-stat-card">
                    <span>Miembros</span>
                    <strong>{communityData.stats.members}</strong>
                </div>
            </aside>
        </div>
    );

    const renderRules = () => (
        <div className="ct-content-grid ct-content-grid--rules">
            <section className="ct-panel ct-panel--main">
                <div className="ct-panel__header">
                    <div>
                        <span className="ct-panel__eyebrow">Normativa</span>
                        <h3>Reglamento oficial</h3>
                    </div>
                </div>
                <div className="ct-rule-list">
                    {communityData.rules.split('\n').filter(Boolean).map((rule, index) => (
                        <div key={`${rule}-${index}`} className="ct-rule">
                            <span className="ct-rule__index">{String(index + 1).padStart(2, '0')}</span>
                            <p>{rule}</p>
                        </div>
                    ))}
                </div>
            </section>
            <aside className="ct-side-stack">
                <button type="button" className="ct-action-card ct-action-card--danger">
                    <FaExclamationTriangle />
                    <span>Reportar conducta</span>
                </button>
                <button type="button" className="ct-action-card">
                    <FaFilePdf />
                    <span>Descargar PDF</span>
                </button>
            </aside>
        </div>
    );

    const renderStaff = () => (
        <div className="ct-panel ct-panel--wide">
            <div className="ct-panel__header">
                <div>
                    <span className="ct-panel__eyebrow">Gestión</span>
                    <h3>Equipo administrativo</h3>
                </div>
            </div>
            <motion.div className="ct-staff-grid" variants={stagger} initial="hidden" animate="visible">
                {communityData.admins.map((admin, index) => (
                    <motion.article key={`${admin}-${index}`} className="ct-staff-card" variants={fadeUp} whileHover={{ y: -4 }}>
                        <div className="ct-staff-card__avatar">{admin.charAt(0).toUpperCase()}</div>
                        <h4>{admin}</h4>
                        <span className="ct-staff-card__role">Administrador</span>
                    </motion.article>
                ))}
                <motion.article className="ct-staff-card" variants={fadeUp} whileHover={{ y: -4 }}>
                    <div className="ct-staff-card__avatar is-secondary">M</div>
                    <h4>Mod_Tester</h4>
                    <span className="ct-staff-card__role is-secondary">Moderador</span>
                </motion.article>
            </motion.div>
            <div className="ct-recruitment">
                <div className="ct-recruitment__copy">
                    <div className="ct-recruitment__icon"><FaBriefcase /></div>
                    <div>
                        <h3>¿Quieres unirte al staff?</h3>
                        <p>Estamos buscando moderadores, hosts y coordinadores de torneos.</p>
                    </div>
                </div>
                <div className="ct-recruitment__actions">
                    <button type="button" className="ct-btn ct-btn--primary">Aplicar ahora</button>
                    <button
                        type="button"
                        className="ct-btn ct-btn--ghost"
                        onClick={() =>
                            navigate(`/community/${communityData.slug}/admin`, {
                                state: { ...incomingData, ...communityData }
                            })
                        }
                    >
                        Panel admin
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="ct-page" style={dynamicStyles}>
            <header className="ct-hero">
                <div className="ct-hero__banner" />
                <div className="ct-hero__grid" />
                <div className="ct-hero__scanlines" />
                <div className="ct-hero__overlay" />
                <motion.div
                    className="ct-shell ct-hero__body"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                >
                    <div className="ct-hero__dock">
                        <div className="ct-hero__mark">
                            <div className="ct-hero__avatar-wrap">
                                <div className="ct-hero__avatar" />
                                <span className="ct-hero__pulse" />
                            </div>
                        </div>
                        <div className="ct-neon-sign">
                            <div className="ct-neon-sign__topbar">
                                <span className="ct-neon-sign__label">Community signal</span>
                                <div className="ct-badges">
                                    <span className="ct-badge ct-badge--accent">Oficial</span>
                                    <span className="ct-badge">{communityData.region}</span>
                                    <span className="ct-badge">{communityData.language}</span>
                                </div>
                            </div>
                            <div className="ct-neon-sign__brand">
                                <span className="ct-neon-sign__logo"><FaSkull /></span>
                                <div className="ct-neon-sign__copy">
                                    <div className="ct-neon-sign__headline">
                                        <div className="ct-neon-sign__title-block">
                                            <h1 data-text={communityData.name}>{communityData.name}</h1>
                                        </div>
                                        <div className="ct-neon-sign__divider" />
                                        <div className="ct-neon-sign__description">
                                            <p>
                                                La comunidad más grande de <span>Valorant</span> en Latinoamérica.
                                                Torneos semanales, clips épicos y LFG para ranked.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="ct-neon-ticker">
                                {neonStats.map((item) => (
                                    <div key={item.label} className="ct-neon-ticker__item">
                                        <span>{item.icon}</span>
                                        <strong>{item.value}</strong>
                                        <small>{item.label}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ct-radar-card">
                            <div className="ct-radar-card__top">
                                <span className="ct-radar-card__label"><FaBolt /> Live status</span>
                                <span className="ct-radar-card__ping">Pulse 97%</span>
                            </div>
                            <div className="ct-radar-card__ring">
                                <div className="ct-radar-card__center" />
                            </div>
                            <div className="ct-radar-card__metrics">
                                <div>
                                    <span>Online</span>
                                    <strong>{communityData.stats.online}</strong>
                                </div>
                                <div>
                                    <span>Región</span>
                                    <strong>{communityData.region}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="ct-hero__actions">
                        <button type="button" className="ct-btn ct-btn--ghost"><FaShareAlt /> Compartir</button>
                        <button
                            type="button"
                            className={`ct-btn ct-btn--primary ${isJoined ? 'is-joined' : ''}`}
                            onClick={() => setIsJoined((prev) => !prev)}
                        >
                            {isJoined ? 'Miembro' : 'Miembro'}
                        </button>
                    </div>
                </motion.div>
            </header>
            <section className="ct-toolbar">
                <div className="ct-shell ct-toolbar__inner">
                    <nav className="ct-nav">
                        {COMMUNITY_TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={`ct-nav__btn ${activeTab === tab.id ? 'is-active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        className="ct-nav__indicator"
                                        layoutId="ct-tab-indicator"
                                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                    />
                                )}
                            </button>
                        ))}
                    </nav>
                    <label className="ct-search">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Buscar en la comunidad..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                </div>
            </section>
            <main className="ct-shell ct-main">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    >
                        {activeTab === 'feed' && renderFeed()}
                        {activeTab === 'tournaments' && renderTournaments()}
                        {activeTab === 'about' && renderAbout()}
                        {activeTab === 'rules' && renderRules()}
                        {activeTab === 'staff' && renderStaff()}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default CommunityTemplate;
