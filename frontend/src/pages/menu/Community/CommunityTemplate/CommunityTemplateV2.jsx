import { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { COMMUNITY_LIST } from '../../../../data/communityData';
import './communityTemplateV2.css';

/* ═══════════════════════════════════════════════════════════════
   COMMUNITY TEMPLATE V2 — Professional tabbed layout
   4 tabs: Presentación, Eventos, Hub, Equipos
   ═══════════════════════════════════════════════════════════════ */

const slugify = (v) =>
    String(v || '').trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const normalizeCommunity = (stateData, catalog, slugParam) => {
    const src = stateData?.name ? stateData : catalog || {};
    const games = stateData?.settings?.games || stateData?.games || catalog?.tags || [];
    const members = Number(stateData?.stats?.members || catalog?.members || 12450);
    const online = Number(stateData?.stats?.online || catalog?.online || 342);
    return {
        name: src.name || 'Valorant Latam',
        tagline: stateData?.tagline || catalog?.description || 'Comunidad Competitiva Oficial',
        description: stateData?.description || stateData?.tagline || catalog?.description ||
            'La comunidad competitiva más grande de la región. Torneos semanales, clips épicos, LFG para ranked y mucho más.',
        banner: stateData?.banner || catalog?.img ||
            'https://images.unsplash.com/photo-1542751110-97427bbecf20?auto=format&fit=crop&w=1920&q=80',
        avatar: stateData?.avatar || catalog?.img ||
            'https://via.placeholder.com/200/8EDB15/08120d?text=VAL',
        stats: { members, online, tournaments: 24, clips: 1580 },
        createdAt: stateData?.created_at || catalog?.createdAt || '2024',
        rules: stateData?.settings?.rules || stateData?.rules || [
            'Respeta a todos los miembros',
            'No toxicidad ni hate speech',
            'Usa los canales correctos',
            'No spam ni autopromoción',
            'Reporta contenido inapropiado'
        ],
        admins: stateData?.admins || [
            { name: 'ProGamer', role: 'Owner' },
            { name: 'TournamentLead', role: 'Admin' },
            { name: 'ModeratorX', role: 'Moderator' }
        ],
        region: stateData?.region || 'LATAM',
        language: stateData?.language || 'Español',
        games: Array.isArray(games) && games.length > 0 ? games : ['Valorant'],
        color: stateData?.color || catalog?.color || '#ff4655',
        slug: stateData?.slug || catalog?.slug || slugParam || slugify(src.name || 'community')
    };
};

const TABS = [
    { id: 'about', label: 'Presentación', icon: 'bx-info-circle' },
    { id: 'events', label: 'Eventos', icon: 'bx-calendar-event' },
    { id: 'hub', label: 'Hub', icon: 'bx-message-square-dots' },
    { id: 'teams', label: 'Equipos', icon: 'bx-group' }
];

const MOCK_POSTS = [
    { id: 'p1', author: 'ProGamer', role: 'Admin', time: 'Hace 2h', content: '¡Nuevo torneo este fin de semana! Inscripciones abiertas. Premio: $500 USD 🏆', likes: 234, comments: 45, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600', pinned: true },
    { id: 'p2', author: 'ClipMaster', role: 'Miembro', time: 'Hace 4h', content: 'ACE con Jett en Ascent rank Inmortal. ¿Qué opinan del crosshair?', likes: 156, comments: 23 },
    { id: 'p3', author: 'TeamLead', role: 'Moderador', time: 'Hace 6h', content: 'LFG para ranked 5-stack. Buscamos support/controller. DM si te interesa.', likes: 89, comments: 67 },
    { id: 'p4', author: 'NewPlayer', role: 'Miembro', time: 'Hace 8h', content: 'Acabo de llegar a Diamante por primera vez. ¿Algún consejo para seguir subiendo?', likes: 45, comments: 31 }
];

const MOCK_TOURNAMENTS = [
    { id: 1, name: 'Copa Invierno 2024', status: 'live', prize: '$500 USD', teams: '16/32', date: 'Finaliza 20 Oct', game: 'Valorant' },
    { id: 2, name: 'Liga Semanal', status: 'upcoming', prize: '$200 USD', teams: '8/16', date: 'Inicia 25 Oct', game: 'Valorant' },
    { id: 3, name: 'Ranked Challenge', status: 'finished', prize: '$100 USD', teams: '32/32', date: 'Finalizado', game: 'Valorant' },
    { id: 4, name: 'Show Match Streamer', status: 'upcoming', prize: 'Glory', teams: '4/8', date: '1 Nov', game: 'Valorant' }
];

const MOCK_TEAMS = [
    { id: 't1', name: 'Viper Squad', tag: 'VPR', members: 5, rank: 'Inmortal', game: 'Valorant', recruiting: true },
    { id: 't2', name: 'Phoenix Rising', tag: 'PHX', members: 5, rank: 'Diamante', game: 'Valorant', recruiting: false },
    { id: 't3', name: 'Shadow Ops', tag: 'SHD', members: 4, rank: 'Ascendente', game: 'Valorant', recruiting: true },
    { id: 't4', name: 'Neon Blitz', tag: 'NBZ', members: 3, rank: 'Platino', game: 'Valorant', recruiting: true }
];

const pageVariants = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25 } }
};

const staggerContainer = {
    animate: { transition: { staggerChildren: 0.08 } }
};

const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const CommunityTemplateV2 = () => {
    const [activeTab, setActiveTab] = useState('about');
    const [isJoined, setIsJoined] = useState(false);
    const [hubFilter, setHubFilter] = useState('all');
    const [newPost, setNewPost] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { slug } = useParams();
    const contentRef = useRef(null);

    const incomingData = location.state || {};
    const catalog = useMemo(() => COMMUNITY_LIST.find(c => c.slug === slug), [slug]);
    const community = useMemo(() => normalizeCommunity(incomingData, catalog, slug), [incomingData, catalog, slug]);

    const dynamicStyles = {
        '--ct-accent': community.color,
        '--ct-accent-rgb': hexToRgb(community.color)
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="ct" style={dynamicStyles}>
            {/* ═══ HERO BANNER ═══ */}
            <header className="ct__hero">
                <div className="ct__hero-bg" style={{ backgroundImage: `url(${community.banner})` }} />
                <div className="ct__hero-overlay" />

                <div className="ct__hero-content">
                    <div className="ct__hero-avatar">
                        <img src={community.avatar} alt={community.name} />
                        <span className="ct__hero-pulse" />
                    </div>
                    <div className="ct__hero-info">
                        <div className="ct__hero-badges">
                            <span className="ct__badge ct__badge--accent">
                                <i className="bx bxs-check-circle"></i> Oficial
                            </span>
                            <span className="ct__badge">{community.region}</span>
                            <span className="ct__badge">{community.language}</span>
                        </div>
                        <h1 className="ct__hero-title">{community.name}</h1>
                        <p className="ct__hero-tagline">{community.tagline}</p>
                    </div>
                    <div className="ct__hero-stats">
                        <div className="ct__hstat">
                            <strong>{community.stats.members.toLocaleString()}</strong>
                            <span>Miembros</span>
                        </div>
                        <div className="ct__hstat ct__hstat--online">
                            <span className="ct__hstat-dot" />
                            <strong>{community.stats.online}</strong>
                            <span>Online</span>
                        </div>
                        <div className="ct__hstat">
                            <strong>{community.stats.tournaments}</strong>
                            <span>Torneos</span>
                        </div>
                    </div>
                    <div className="ct__hero-actions">
                        <button
                            className={`ct__btn ct__btn--primary ${isJoined ? 'is-joined' : ''}`}
                            onClick={() => setIsJoined(!isJoined)}
                        >
                            {isJoined ? <><i className="bx bxs-check-circle"></i> Miembro</> : <><i className="bx bx-plus"></i> Unirse</>}
                        </button>
                        <button className="ct__btn ct__btn--ghost">
                            <i className="bx bx-share-alt"></i> Compartir
                        </button>
                        <button className="ct__btn ct__btn--ghost">
                            <i className="bx bx-bell"></i>
                        </button>
                    </div>
                </div>
            </header>

            {/* ═══ TAB NAV ═══ */}
            <nav className="ct__tabs">
                <div className="ct__tabs-inner">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`ct__tab ${activeTab === tab.id ? 'is-active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                        >
                            <i className={`bx ${tab.icon}`}></i>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* ═══ TAB CONTENT ═══ */}
            <main className="ct__content" ref={contentRef}>
                <AnimatePresence mode="wait">
                    {/* ─── TAB 1: PRESENTACIÓN ─── */}
                    {activeTab === 'about' && (
                        <motion.div key="about" className="ct__page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <motion.div className="ct__page-grid ct__page-grid--about" variants={staggerContainer} initial="initial" animate="animate">
                                {/* About card */}
                                <motion.section className="ct__card ct__card--about" variants={staggerItem}>
                                    <div className="ct__card-header">
                                        <div className="ct__card-icon"><i className="bx bxs-info-circle"></i></div>
                                        <div>
                                            <h2>Sobre Nosotros</h2>
                                            <span>Conoce la comunidad</span>
                                        </div>
                                    </div>
                                    <p className="ct__about-desc">{community.description}</p>
                                    <div className="ct__about-details">
                                        <div className="ct__detail">
                                            <i className="bx bx-map"></i>
                                            <div><span>Región</span><strong>{community.region}</strong></div>
                                        </div>
                                        <div className="ct__detail">
                                            <i className="bx bx-globe"></i>
                                            <div><span>Idioma</span><strong>{community.language}</strong></div>
                                        </div>
                                        <div className="ct__detail">
                                            <i className="bx bx-calendar"></i>
                                            <div><span>Fundada</span><strong>{community.createdAt}</strong></div>
                                        </div>
                                        <div className="ct__detail">
                                            <i className="bx bx-joystick"></i>
                                            <div><span>Juego Principal</span><strong>{community.games[0]}</strong></div>
                                        </div>
                                    </div>
                                    <div className="ct__game-chips">
                                        {community.games.map(g => (
                                            <span key={g} className="ct__game-chip"><i className="bx bxs-joystick"></i> {g}</span>
                                        ))}
                                    </div>
                                </motion.section>

                                {/* Rules card */}
                                <motion.section className="ct__card ct__card--rules" variants={staggerItem}>
                                    <div className="ct__card-header">
                                        <div className="ct__card-icon ct__card-icon--red"><i className="bx bxs-shield-alt-2"></i></div>
                                        <div>
                                            <h2>Reglas</h2>
                                            <span>Normas de convivencia</span>
                                        </div>
                                    </div>
                                    <div className="ct__rules-list">
                                        {(Array.isArray(community.rules) ? community.rules : community.rules.split('\n').filter(Boolean)).map((rule, i) => (
                                            <div key={i} className="ct__rule">
                                                <span className="ct__rule-num">{String(i + 1).padStart(2, '0')}</span>
                                                <p>{rule.replace(/^\d+\.\s*/, '')}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ct__warning">
                                        <i className="bx bxs-error"></i>
                                        Violaciones pueden resultar en ban permanente
                                    </div>
                                </motion.section>

                                {/* Quick stats card */}
                                <motion.section className="ct__card ct__card--quickstats" variants={staggerItem}>
                                    <div className="ct__card-header">
                                        <div className="ct__card-icon"><i className="bx bxs-bar-chart-alt-2"></i></div>
                                        <div>
                                            <h2>Estadísticas</h2>
                                            <span>Números de la comunidad</span>
                                        </div>
                                    </div>
                                    <div className="ct__qstats">
                                        <div className="ct__qstat">
                                            <i className="bx bxs-group"></i>
                                            <strong>{community.stats.members.toLocaleString()}</strong>
                                            <span>Miembros</span>
                                        </div>
                                        <div className="ct__qstat">
                                            <i className="bx bxs-trophy"></i>
                                            <strong>{community.stats.tournaments}</strong>
                                            <span>Torneos</span>
                                        </div>
                                        <div className="ct__qstat">
                                            <i className="bx bxs-video"></i>
                                            <strong>{community.stats.clips.toLocaleString()}</strong>
                                            <span>Clips</span>
                                        </div>
                                        <div className="ct__qstat">
                                            <i className="bx bxs-circle"></i>
                                            <strong>{community.stats.online}</strong>
                                            <span>Online</span>
                                        </div>
                                    </div>
                                </motion.section>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ─── TAB 2: EVENTOS ─── */}
                    {activeTab === 'events' && (
                        <motion.div key="events" className="ct__page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <div className="ct__page-header">
                                <h2><i className="bx bx-calendar-event"></i> Eventos & Torneos</h2>
                                <p>Compite, demuestra tu nivel y gana premios</p>
                            </div>

                            {/* Live / Active */}
                            <div className="ct__events-section">
                                <h3 className="ct__events-label"><span className="ct__live-dot" /> En Vivo & Próximos</h3>
                                <motion.div className="ct__events-grid" variants={staggerContainer} initial="initial" animate="animate">
                                    {MOCK_TOURNAMENTS.filter(t => t.status !== 'finished').map(t => (
                                        <motion.article key={t.id} className={`ct__event-card ct__event-card--${t.status}`} variants={staggerItem}>
                                            <div className="ct__event-status">
                                                {t.status === 'live' && <><span className="ct__live-dot" /> EN VIVO</>}
                                                {t.status === 'upcoming' && <><i className="bx bx-time-five"></i> PRÓXIMO</>}
                                            </div>
                                            <h4>{t.name}</h4>
                                            <div className="ct__event-meta">
                                                <span><i className="bx bxs-trophy"></i> {t.prize}</span>
                                                <span><i className="bx bxs-group"></i> {t.teams}</span>
                                                <span><i className="bx bx-calendar"></i> {t.date}</span>
                                            </div>
                                            <div className="ct__event-footer">
                                                <span className="ct__event-game"><i className="bx bx-joystick"></i> {t.game}</span>
                                                <button className="ct__btn ct__btn--primary ct__btn--sm">
                                                    {t.status === 'live' ? 'Ver bracket' : 'Inscribirse'}
                                                </button>
                                            </div>
                                        </motion.article>
                                    ))}
                                </motion.div>
                            </div>

                            {/* Finished */}
                            <div className="ct__events-section">
                                <h3 className="ct__events-label"><i className="bx bx-check-circle"></i> Finalizados</h3>
                                <motion.div className="ct__events-grid" variants={staggerContainer} initial="initial" animate="animate">
                                    {MOCK_TOURNAMENTS.filter(t => t.status === 'finished').map(t => (
                                        <motion.article key={t.id} className="ct__event-card ct__event-card--finished" variants={staggerItem}>
                                            <div className="ct__event-status"><i className="bx bx-check"></i> FINALIZADO</div>
                                            <h4>{t.name}</h4>
                                            <div className="ct__event-meta">
                                                <span><i className="bx bxs-trophy"></i> {t.prize}</span>
                                                <span><i className="bx bxs-group"></i> {t.teams}</span>
                                            </div>
                                            <div className="ct__event-footer">
                                                <span className="ct__event-game"><i className="bx bx-joystick"></i> {t.game}</span>
                                                <button className="ct__btn ct__btn--ghost ct__btn--sm">Ver resultados</button>
                                            </div>
                                        </motion.article>
                                    ))}
                                </motion.div>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── TAB 3: HUB ─── */}
                    {activeTab === 'hub' && (
                        <motion.div key="hub" className="ct__page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <div className="ct__hub-layout">
                                <div className="ct__hub-main">
                                    {/* Composer */}
                                    {isJoined && (
                                        <div className="ct__composer">
                                            <div className="ct__composer-avatar">U</div>
                                            <div className="ct__composer-body">
                                                <textarea
                                                    placeholder="Comparte algo con la comunidad..."
                                                    value={newPost}
                                                    onChange={(e) => setNewPost(e.target.value)}
                                                    rows={2}
                                                />
                                                <div className="ct__composer-bar">
                                                    <div className="ct__composer-tools">
                                                        <button title="Imagen"><i className="bx bx-image"></i></button>
                                                        <button title="Video"><i className="bx bx-video"></i></button>
                                                        <button title="Encuesta"><i className="bx bx-poll"></i></button>
                                                        <button title="GIF"><i className="bx bx-happy-beaming"></i></button>
                                                    </div>
                                                    <button className="ct__btn ct__btn--primary ct__btn--sm" disabled={!newPost.trim()}>
                                                        Publicar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {!isJoined && (
                                        <div className="ct__hub-join-prompt">
                                            <i className="bx bx-lock-alt"></i>
                                            <p>Únete a la comunidad para publicar en el Hub</p>
                                            <button className="ct__btn ct__btn--primary ct__btn--sm" onClick={() => setIsJoined(true)}>
                                                <i className="bx bx-plus"></i> Unirse
                                            </button>
                                        </div>
                                    )}

                                    {/* Filters */}
                                    <div className="ct__hub-filters">
                                        {['all', 'destacado', 'clips', 'lfg'].map(f => (
                                            <button
                                                key={f}
                                                className={`ct__hub-filter ${hubFilter === f ? 'is-active' : ''}`}
                                                onClick={() => setHubFilter(f)}
                                            >
                                                {f === 'all' && <><i className="bx bx-grid-alt"></i> Todo</>}
                                                {f === 'destacado' && <><i className="bx bxs-hot"></i> Destacado</>}
                                                {f === 'clips' && <><i className="bx bx-play-circle"></i> Clips</>}
                                                {f === 'lfg' && <><i className="bx bx-search-alt"></i> LFG</>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Posts */}
                                    <motion.div className="ct__posts" variants={staggerContainer} initial="initial" animate="animate">
                                        {MOCK_POSTS.map(post => (
                                            <motion.article
                                                key={post.id}
                                                className={`ct__post ${post.pinned ? 'ct__post--pinned' : ''}`}
                                                variants={staggerItem}
                                            >
                                                {post.pinned && (
                                                    <div className="ct__post-pin"><i className="bx bx-pin"></i> Fijado</div>
                                                )}
                                                <div className="ct__post-header">
                                                    <div className="ct__post-avatar">{post.author[0]}</div>
                                                    <div className="ct__post-meta">
                                                        <strong>{post.author}</strong>
                                                        <span>{post.role} · {post.time}</span>
                                                    </div>
                                                    <button className="ct__post-more"><i className="bx bx-dots-horizontal-rounded"></i></button>
                                                </div>
                                                <p className="ct__post-content">{post.content}</p>
                                                {post.image && (
                                                    <div className="ct__post-img">
                                                        <img src={post.image} alt="" loading="lazy" />
                                                    </div>
                                                )}
                                                <div className="ct__post-actions">
                                                    <button><i className="bx bx-heart"></i> {post.likes}</button>
                                                    <button><i className="bx bx-comment"></i> {post.comments}</button>
                                                    <button><i className="bx bx-share"></i></button>
                                                    <button><i className="bx bx-bookmark"></i></button>
                                                </div>
                                            </motion.article>
                                        ))}
                                    </motion.div>
                                </div>

                                {/* Sidebar */}
                                <aside className="ct__hub-sidebar">
                                    <div className="ct__sidebar-card">
                                        <h3><i className="bx bxs-hot"></i> Trending</h3>
                                        {['#TorneoInvierno', '#LFGRanked', '#ClipsValorant', '#PatchNotes'].map((tag, i) => (
                                            <div key={tag} className="ct__trending">
                                                <span className="ct__trending-rank">#{i + 1}</span>
                                                <span>{tag}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="ct__sidebar-card">
                                        <h3><i className="bx bxs-user-badge"></i> Staff Activo</h3>
                                        {(Array.isArray(community.admins) ? community.admins : []).slice(0, 3).map((admin, i) => {
                                            const name = typeof admin === 'string' ? admin : admin.name;
                                            const role = typeof admin === 'string' ? (i === 0 ? 'Owner' : 'Admin') : admin.role;
                                            return (
                                                <div key={name} className="ct__staff-row">
                                                    <div className="ct__staff-avatar">{name[0]}</div>
                                                    <div>
                                                        <strong>{name}</strong>
                                                        <span>{role}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </aside>
                            </div>
                        </motion.div>
                    )}

                    {/* ─── TAB 4: EQUIPOS ─── */}
                    {activeTab === 'teams' && (
                        <motion.div key="teams" className="ct__page" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                            <div className="ct__page-header">
                                <h2><i className="bx bx-group"></i> Equipos de la Comunidad</h2>
                                <p>Encuentra un equipo o crea el tuyo propio</p>
                            </div>

                            {/* Teams grid */}
                            <motion.div className="ct__teams-grid" variants={staggerContainer} initial="initial" animate="animate">
                                {MOCK_TEAMS.map(team => (
                                    <motion.article key={team.id} className="ct__team-card" variants={staggerItem}>
                                        <div className="ct__team-top">
                                            <div className="ct__team-logo">{team.tag}</div>
                                            <div className="ct__team-info">
                                                <h4>{team.name}</h4>
                                                <span className="ct__team-rank"><i className="bx bxs-medal"></i> {team.rank}</span>
                                            </div>
                                            {team.recruiting && (
                                                <span className="ct__team-recruiting">
                                                    <i className="bx bx-user-plus"></i> Reclutando
                                                </span>
                                            )}
                                        </div>
                                        <div className="ct__team-details">
                                            <span><i className="bx bx-group"></i> {team.members}/5</span>
                                            <span><i className="bx bx-joystick"></i> {team.game}</span>
                                        </div>
                                        <div className="ct__team-actions">
                                            <button className="ct__btn ct__btn--ghost ct__btn--sm">Ver equipo</button>
                                            {team.recruiting && (
                                                <button className="ct__btn ct__btn--primary ct__btn--sm">Aplicar</button>
                                            )}
                                        </div>
                                    </motion.article>
                                ))}
                            </motion.div>

                            {/* Staff section */}
                            <section className="ct__staff-section">
                                <div className="ct__page-header">
                                    <h2><i className="bx bx-briefcase"></i> Staff de la Comunidad</h2>
                                    <p>El equipo detrás de la comunidad</p>
                                </div>
                                <div className="ct__staff-grid">
                                    {(Array.isArray(community.admins) ? community.admins : []).map((admin, i) => {
                                        const name = typeof admin === 'string' ? admin : admin.name;
                                        const role = typeof admin === 'string' ? (i === 0 ? 'Owner' : 'Admin') : admin.role;
                                        return (
                                            <div key={name} className="ct__staff-card">
                                                <div className="ct__staff-card-avatar">{name[0]}</div>
                                                <h4>{name}</h4>
                                                <span>{role}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Join staff CTA */}
                                <div className="ct__join-staff">
                                    <div className="ct__join-staff-content">
                                        <i className="bx bxs-briefcase"></i>
                                        <div>
                                            <h3>¿Quieres unirte al staff?</h3>
                                            <p>Buscamos moderadores, hosts de torneos y coordinadores de eventos</p>
                                        </div>
                                    </div>
                                    <button className="ct__btn ct__btn--primary">
                                        <i className="bx bx-send"></i> Aplicar ahora
                                    </button>
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '142, 219, 21';
}

export default CommunityTemplateV2;
