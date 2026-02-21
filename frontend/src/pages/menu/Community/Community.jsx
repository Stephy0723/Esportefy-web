import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Community.css';
import PageHud from '../../../components/PageHud/PageHud';
import {
    COMMUNITY_GAMES as GAMES,
    COMMUNITY_FILTERS as FILTERS,
    COMMUNITY_LIST as COMMUNITIES,
    COMMUNITY_TRENDING_TOPICS as TRENDING_TOPICS,
} from '../../../data/communityData';

/*  COMPONENTS  */

const HeroBanner = () => {
    const [heroIdx, setHeroIdx] = useState(0);
    const heroes = [GAMES[0], GAMES[1], GAMES[3], GAMES[4], GAMES[8]];
    const hero = heroes[heroIdx];

    useEffect(() => {
        const t = setInterval(() => setHeroIdx(i => (i + 1) % heroes.length), 6000);
        return () => clearInterval(t);
    }, [heroes.length]);

    return (
        <section className="cm-hero" style={{ '--hero-color': hero.color }}>
            <div className="cm-hero__bg">
                {heroes.map((h, i) => (
                    <img key={h.id} src={h.img} alt={h.name} className={'cm-hero__img ' + (i === heroIdx ? 'active' : '')} />
                ))}
                <div className="cm-hero__overlay" />
                <div className="cm-hero__grid-lines" />
                <div className="cm-hero__scanlines" />
            </div>
            <div className="cm-hero__content">
                <span className="cm-hero__badge"><span className="cm-hero__pulse" /> LIVE COMMUNITY</span>
                <h1 className="cm-hero__title">DESCUBRE TU<br /><span className="cm-hero__accent">COMUNIDAD</span></h1>
                <p className="cm-hero__sub">Unete a miles de jugadores. Comparte, compite y domina.</p>
                <div className="cm-hero__dots">
                    {heroes.map((_, i) => (
                        <button key={i} className={'cm-hero__dot ' + (i === heroIdx ? 'active' : '')} onClick={() => setHeroIdx(i)} />
                    ))}
                </div>
            </div>
            <div className="cm-hero__particles">
                {Array.from({ length: 24 }).map((_, i) => (
                    <span key={i} className="cm-hero__particle" style={{ '--x': Math.random()*100+'%', '--y': Math.random()*100+'%', '--d': (2+Math.random()*6)+'s', '--s': (2+Math.random()*4)+'px' }} />
                ))}
            </div>
            <div className="cm-hero__vignette" />
        </section>
    );
};

const SearchBar = ({ value, onChange, gameFilter, setGameFilter, onCreateCommunity }) => {
    const [showGameDrop, setShowGameDrop] = useState(false);
    const dropRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowGameDrop(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="cm-toolbar">
            <div className="cm-search">
                <i className='bx bx-search cm-search__icon'></i>
                <input
                    type="text" placeholder="Buscar juegos, comunidades, jugadores..."
                    value={value} onChange={e => onChange(e.target.value)}
                    className="cm-search__input"
                />
                {value && <button className="cm-search__clear" onClick={() => onChange('')}><i className='bx bx-x'></i></button>}
                <div className="cm-search__filter-wrap" ref={dropRef}>
                    <button className={'cm-search__filter-btn ' + (gameFilter !== 'all' ? 'active' : '')}
                        onClick={() => setShowGameDrop(!showGameDrop)}>
                        <i className='bx bx-filter-alt'></i>
                        <span>{gameFilter === 'all' ? 'Filtrar' : gameFilter}</span>
                        <i className={'bx bx-chevron-down cm-search__chevron ' + (showGameDrop ? 'open' : '')}></i>
                    </button>
                    {showGameDrop && (
                        <div className="cm-search__dropdown">
                            <div className="cm-search__dropdown-header">Filtrar por juego</div>
                            <button className={'cm-search__dropdown-item ' + (gameFilter === 'all' ? 'active' : '')}
                                onClick={() => { setGameFilter('all'); setShowGameDrop(false); }}>
                                <i className='bx bx-grid-alt'></i> Todos los juegos
                            </button>
                            {GAMES.slice(0, 10).map(g => (
                                <button key={g.id} className={'cm-search__dropdown-item ' + (gameFilter === g.name ? 'active' : '')}
                                    onClick={() => { setGameFilter(g.name); setShowGameDrop(false); }}>
                                    <img src={g.img} alt="" className="cm-search__dropdown-img" />
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <button className="cm-create-btn" onClick={onCreateCommunity}>
                <i className='bx bx-plus-circle'></i>
                <span>Crear Comunidad</span>
            </button>
        </div>
    );
};

const GameCard = ({ game, index }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
        cardRef.current.style.setProperty('--rx', y + 'deg');
        cardRef.current.style.setProperty('--ry', x + 'deg');
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        if (cardRef.current) {
            cardRef.current.style.setProperty('--rx', '0deg');
            cardRef.current.style.setProperty('--ry', '0deg');
        }
    }, []);

    return (
        <div ref={cardRef} className={'cm-game ' + (isHovered ? 'hovered' : '')}
            style={{ '--card-color': game.color, '--delay': (index * 0.05) + 's' }}
            onMouseEnter={() => setIsHovered(true)} onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}>
            <div className="cm-game__inner">
                <img src={game.img} alt={game.name} className="cm-game__img" loading="lazy" />
                <div className="cm-game__shine" />
                <div className="cm-game__gradient" />
                <div className="cm-game__top-badge">{game.cat}</div>
                <div className="cm-game__info">
                    <h3 className="cm-game__name">{game.name}</h3>
                    <div className="cm-game__players">
                        <i className='bx bxs-user'></i> {game.players} jugadores
                    </div>
                    <button className="cm-game__btn" onClick={(e) => { e.stopPropagation(); navigate('/games/' + game.id); }}>
                        <i className='bx bx-info-circle'></i> Mas Info
                    </button>
                </div>
                <div className="cm-game__border-glow" />
            </div>
        </div>
    );
};

const GamesSection = ({ searchQuery, activeFilter, setActiveFilter, onSuggestGame }) => {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);
    const carouselRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const filtered = useMemo(() => {
        let result = activeFilter === 'all' ? GAMES : GAMES.filter(g => g.cat === activeFilter);
        if (searchQuery) result = result.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return result;
    }, [activeFilter, searchQuery]);

    useEffect(() => {
        if (isPaused || !carouselRef.current || filtered.length === 0) return;
        const interval = setInterval(() => {
            const el = carouselRef.current;
            if (!el) return;
            if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
                el.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                el.scrollBy({ left: 300, behavior: 'smooth' });
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [isPaused, filtered]);

    const handleScroll = useCallback(() => {
        const el = carouselRef.current;
        if (!el) return;
        const max = el.scrollWidth - el.clientWidth;
        setProgress(max > 0 ? (el.scrollLeft / max) * 100 : 0);
    }, []);

    const scroll = (dir) => {
        const el = carouselRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 600, behavior: 'smooth' });
    };

    return (
        <section ref={ref} className={'cm-games ' + (visible ? 'visible' : '')}>
            <div className="cm-section-header">
                <div className="cm-section-header__left">
                    <div className="cm-section-icon"><i className='bx bxs-joystick'></i></div>
                    <div>
                        <h2 className="cm-section-title">Videojuegos</h2>
                        <p className="cm-section-subtitle">{filtered.length} juegos disponibles</p>
                    </div>
                </div>
                <div className="cm-filters">
                    {FILTERS.map(f => (
                        <button key={f.value} className={'cm-filter ' + (activeFilter === f.value ? 'active' : '')}
                            onClick={() => setActiveFilter(f.value)}>
                            <i className={f.icon}></i> {f.label}
                        </button>
                    ))}
                </div>
            </div>
            {filtered.length > 0 ? (
                <div className="cm-carousel-wrap"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}>
                    <button className="cm-carousel__arrow cm-carousel__arrow--left" onClick={() => scroll(-1)}>
                        <i className='bx bx-chevron-left'></i>
                    </button>
                    <div ref={carouselRef} className="cm-carousel" onScroll={handleScroll}>
                        {filtered.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
                        <div className="cm-suggest-card" onClick={onSuggestGame}>
                            <div className="cm-suggest-card__inner">
                                <div className="cm-suggest-card__glow" />
                                <div className="cm-suggest-card__icon">
                                    <i className='bx bx-plus-circle'></i>
                                </div>
                                <h3 className="cm-suggest-card__title">¿Tu juego no esta?</h3>
                                <p className="cm-suggest-card__text">Sugiere un juego para añadirlo a la plataforma</p>
                                <span className="cm-suggest-card__btn">
                                    <i className='bx bx-right-arrow-alt'></i> Sugerir Juego
                                </span>
                            </div>
                        </div>
                    </div>
                    <button className="cm-carousel__arrow cm-carousel__arrow--right" onClick={() => scroll(1)}>
                        <i className='bx bx-chevron-right'></i>
                    </button>
                    <div className="cm-carousel__progress">
                        <div className="cm-carousel__progress-bar" style={{ width: progress + '%' }} />
                    </div>
                </div>
            ) : (
                <div className="cm-empty">
                    <i className='bx bx-search-alt-2'></i>
                    <p>No se encontraron juegos</p>
                </div>
            )}
        </section>
    );
};

const SuggestGameModal = ({ open, onClose }) => {
    const [submitted, setSubmitted] = useState(false);

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => { setSubmitted(false); onClose(); }, 2500);
    };

    return (
        <div className="cm-modal-backdrop" onClick={onClose}>
            <div className="cm-modal cm-modal--suggest" onClick={e => e.stopPropagation()}>
                <div className="cm-modal__header">
                    <h2><i className='bx bxs-game'></i> Sugerir un Juego</h2>
                    <button className="cm-modal__close" onClick={onClose}><i className='bx bx-x'></i></button>
                </div>
                {submitted ? (
                    <div className="cm-modal__success">
                        <i className='bx bx-check-circle'></i>
                        <h3>¡Gracias por tu sugerencia!</h3>
                        <p>Revisaremos tu solicitud pronto</p>
                    </div>
                ) : (
                    <form className="cm-modal__body" onSubmit={handleSubmit}>
                        <div className="cm-modal__field">
                            <label>Nombre del juego</label>
                            <input type="text" placeholder="Ej: Minecraft, Genshin Impact..." required />
                        </div>
                        <div className="cm-modal__field">
                            <label>Genero / Categoria</label>
                            <select required>
                                <option value="">Seleccionar...</option>
                                <option value="FPS">FPS</option>
                                <option value="MOBA">MOBA</option>
                                <option value="BR">Battle Royale</option>
                                <option value="Fighting">Fighting</option>
                                <option value="Strategy">Estrategia</option>
                                <option value="Sports">Deportes</option>
                                <option value="RPG">RPG</option>
                                <option value="Survival">Survival</option>
                                <option value="Racing">Carreras</option>
                                <option value="Other">Otro</option>
                            </select>
                        </div>
                        <div className="cm-modal__field">
                            <label>Plataforma</label>
                            <select required>
                                <option value="">Seleccionar...</option>
                                <option value="PC">PC</option>
                                <option value="Console">Consola</option>
                                <option value="Mobile">Movil</option>
                                <option value="Cross">Multiplataforma</option>
                            </select>
                        </div>
                        <div className="cm-modal__field">
                            <label>¿Por que debemos añadirlo?</label>
                            <textarea placeholder="Cuentanos por que este juego deberia estar en la plataforma..." rows="3" />
                        </div>
                        <button type="submit" className="cm-modal__submit cm-modal__submit--green">
                            <i className='bx bx-send'></i> Enviar Sugerencia
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

const CommunityCard = ({ community, index }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const formatNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;

    return (
        <div className={'cm-community ' + (isHovered ? 'hovered' : '')}
            style={{ '--cc-color': community.color, '--delay': (index * 0.08) + 's' }}
            onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate('/community/' + community.slug, { state: community })}>
            <div className="cm-community__banner">
                <img src={community.img} alt={community.name} />
                <div className="cm-community__banner-overlay" />
                {community.featured && <span className="cm-community__featured"><i className='bx bxs-crown'></i> DESTACADA</span>}
                <div className="cm-community__live-count"><span className="cm-community__live-dot" />{community.online} online</div>
            </div>
            <div className="cm-community__body">
                <div className="cm-community__header">
                    <div className="cm-community__avatar"><img src={community.img} alt="" /></div>
                    <div className="cm-community__meta">
                        <h3 className="cm-community__name">{community.name}</h3>
                        <span className="cm-community__game"><i className='bx bxs-game'></i> {community.game}</span>
                    </div>
                </div>
                <p className="cm-community__desc">{community.description}</p>
                <div className="cm-community__tags">
                    {community.tags.map(t => <span key={t} className="cm-community__tag">#{t}</span>)}
                </div>
                <div className="cm-community__footer">
                    <div className="cm-community__stats">
                        <div className="cm-community__stat"><i className='bx bxs-group'></i><strong>{formatNum(community.members)}</strong> miembros</div>
                        <div className="cm-community__stat"><i className='bx bxs-message-dots'></i><strong>{formatNum(community.posts)}</strong> posts</div>
                    </div>
                    <button className="cm-community__join" onClick={(e) => { e.stopPropagation(); }}>
                        <i className='bx bx-log-in-circle'></i> Unirse
                    </button>
                </div>
            </div>
            <div className="cm-community__edge" />
        </div>
    );
};

const CommunitiesSection = ({ searchQuery, gameFilter }) => {
    const [visible, setVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('popular');
    const ref = useRef(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.05 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const filtered = useMemo(() => {
        let result = COMMUNITIES.filter(c => c.category === activeTab);
        if (gameFilter && gameFilter !== 'all') result = result.filter(c => c.game === gameFilter);
        if (searchQuery) result = result.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.game.toLowerCase().includes(searchQuery.toLowerCase()));
        return result;
    }, [activeTab, gameFilter, searchQuery]);

    const tabs = [
        { id: 'popular', label: 'Populares', icon: 'bx bxs-hot' },
        { id: 'new', label: 'Nuevas', icon: 'bx bxs-star' },
    ];

    return (
        <section ref={ref} className={'cm-communities ' + (visible ? 'visible' : '')}>
            <div className="cm-section-header">
                <div className="cm-section-header__left">
                    <div className="cm-section-icon cm-section-icon--green"><i className='bx bxs-group'></i></div>
                    <div>
                        <h2 className="cm-section-title">Comunidades</h2>
                        <p className="cm-section-subtitle">{filtered.length} comunidades encontradas</p>
                    </div>
                </div>
                <div className="cm-tabs">
                    {tabs.map(t => (
                        <button key={t.id} className={'cm-tab ' + (activeTab === t.id ? 'active' : '')}
                            onClick={() => setActiveTab(t.id)}>
                            <i className={t.icon}></i> {t.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="cm-communities__grid">
                {filtered.map((c, i) => <CommunityCard key={c.id} community={c} index={i} />)}
            </div>
            {filtered.length === 0 && (
                <div className="cm-empty">
                    <i className='bx bx-group'></i>
                    <p>No se encontraron comunidades</p>
                    <span>Intenta cambiar los filtros o crea una nueva</span>
                </div>
            )}
        </section>
    );
};

const QuickStats = () => {
    const stats = [
        { icon: 'bx bxs-joystick', label: 'Juegos', value: GAMES.length, color: '#a35ddf', suffix: '' },
        { icon: 'bx bxs-group', label: 'Comunidades', value: COMMUNITIES.length, color: '#22c55e', suffix: '' },
        { icon: 'bx bxs-user-account', label: 'Jugadores', value: '21.3k', color: '#4facfe', suffix: '' },
        { icon: 'bx bxs-trophy', label: 'Torneos', value: 48, color: '#f59e0b', suffix: ' activos' },
    ];
    return (
        <div className="cm-stats">
            {stats.map((s, i) => (
                <div key={i} className="cm-stat" style={{ '--stat-color': s.color, '--stat-delay': (i * 0.1) + 's' }}>
                    <div className="cm-stat__icon-wrap"><i className={s.icon}></i></div>
                    <div className="cm-stat__text">
                        <span className="cm-stat__value">{s.value}</span>
                        <span className="cm-stat__label">{s.label}{s.suffix}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const TrendingSidebar = () => (
    <aside className="cm-trending">
        <div className="cm-trending__header">
            <i className='bx bxs-hot'></i>
            <h3>Trending</h3>
        </div>
        <div className="cm-trending__list">
            {TRENDING_TOPICS.map((t, i) => (
                <div key={i} className="cm-trending__item" style={{ '--tr-color': t.color }}>
                    <span className="cm-trending__rank">#{i + 1}</span>
                    <div className="cm-trending__info">
                        <span className="cm-trending__title">{t.title}</span>
                        <span className="cm-trending__game">{t.game} &middot; {t.comments} comentarios</span>
                    </div>
                </div>
            ))}
        </div>
    </aside>
);

const CreateCommunityModal = ({ open, onClose }) => {
    if (!open) return null;
    return (
        <div className="cm-modal-backdrop" onClick={onClose}>
            <div className="cm-modal" onClick={e => e.stopPropagation()}>
                <div className="cm-modal__header">
                    <h2><i className='bx bx-plus-circle'></i> Crear Comunidad</h2>
                    <button className="cm-modal__close" onClick={onClose}><i className='bx bx-x'></i></button>
                </div>
                <div className="cm-modal__body">
                    <div className="cm-modal__field">
                        <label>Nombre de la comunidad</label>
                        <input type="text" placeholder="Ej: Valorant Hispano" />
                    </div>
                    <div className="cm-modal__field">
                        <label>Juego</label>
                        <select>
                            <option value="">Seleccionar juego...</option>
                            {GAMES.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div className="cm-modal__field">
                        <label>Descripcion</label>
                        <textarea placeholder="Describe tu comunidad..." rows="3"></textarea>
                    </div>
                    <div className="cm-modal__field">
                        <label>Tags (separados por coma)</label>
                        <input type="text" placeholder="Ej: Ranked, Torneos, Clips" />
                    </div>
                    <button className="cm-modal__submit">
                        <i className='bx bx-rocket'></i> Crear Comunidad
                    </button>
                </div>
            </div>
        </div>
    );
};

const SectionDivider = () => (
    <div className="cm-divider">
        <div className="cm-divider__line" />
        <div className="cm-divider__diamond"><i className='bx bxs-diamond'></i></div>
        <div className="cm-divider__line" />
    </div>
);

const CtaBanner = () => (
    <div className="cm-cta-banner">
        <div className="cm-cta-banner__particles">
            {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="cm-cta-banner__particle" style={{ '--x': Math.random()*100+'%', '--d': (3+Math.random()*4)+'s' }} />
            ))}
        </div>
        <div className="cm-cta-banner__content">
            <div className="cm-cta-banner__text">
                <h3 className="cm-cta-banner__title">¿Listo para competir?</h3>
                <p className="cm-cta-banner__desc">Unite a torneos, encuentra tu equipo y domina la escena competitiva</p>
            </div>
            <div className="cm-cta-banner__actions">
                <button className="cm-cta-banner__btn cm-cta-banner__btn--primary">
                    <i className='bx bxs-trophy'></i> Ver Torneos
                </button>
                <button className="cm-cta-banner__btn cm-cta-banner__btn--secondary">
                    <i className='bx bxl-discord-alt'></i> Discord
                </button>
            </div>
        </div>
    </div>
);

/*  MAIN PAGE  */

const Community = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gameFilter, setGameFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);

    return (
        <div className="cm-page">
            <div className="cm-bg-mesh" />
            <PageHud page="Comunidad" />
            <HeroBanner />
            <div className="cm-container">
                <QuickStats />
                <SearchBar
                    value={searchQuery} onChange={setSearchQuery}
                    gameFilter={gameFilter} setGameFilter={setGameFilter}
                    onCreateCommunity={() => setShowCreateModal(true)}
                />
                <div className="cm-main-layout">
                    <div className="cm-main-content">
                        <GamesSection searchQuery={searchQuery} activeFilter={activeFilter} setActiveFilter={setActiveFilter} onSuggestGame={() => setShowSuggestModal(true)} />
                        <SectionDivider />
                        <CommunitiesSection searchQuery={searchQuery} gameFilter={gameFilter} />
                        <SectionDivider />
                        <CtaBanner />
                    </div>
                    <TrendingSidebar />
                </div>
            </div>
            <CreateCommunityModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <SuggestGameModal open={showSuggestModal} onClose={() => setShowSuggestModal(false)} />
        </div>
    );
};

export default Community;
