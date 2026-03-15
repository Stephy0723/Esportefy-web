import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Community.css';
import PageHud from '../../../components/PageHud/PageHud';
import FeedPanel from './FeedPanel/FeedPanel';
import CreateCommunityModal from './CreateCommunityModal/CreateCommunityModal';
import { fetchGameHubStatsIndex, formatGameHubCount } from './gameHub.service';
import {
    COMMUNITY_GAMES as GAMES,
    COMMUNITY_FILTERS as FILTERS,
    COMMUNITY_LIST as COMMUNITIES,
    COMMUNITY_TRENDING_TOPICS as TRENDING_TOPICS,
} from '../../../data/communityData';

/*  ANIMATION VARIANTS  */
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } }
};

/*  HOOKS  */
const useCountUp = (target, duration = 2200, active = true) => {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active) return;
        let start = 0;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setValue(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, [target, duration, active]);
    return value;
};

/*  COMPONENTS  */

const HeroBanner = ({ onExplore }) => {
    const [heroIdx, setHeroIdx] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const heroes = GAMES.slice(0, 3);
    const hero = heroes[heroIdx] || heroes[0] || { name: 'GLITCH GANG', img: '', color: '#8EDB15' };

    useEffect(() => {
        setIsLoaded(true);
        if (!heroes.length) return undefined;
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
                <div className="cm-hero__cyber-lines">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 80 Q 25 75, 50 80 T 100 75" className="cm-hero__path" />
                        <path d="M0 85 Q 30 80, 60 85 T 100 82" className="cm-hero__path cm-hero__path--delay" />
                    </svg>
                </div>
            </div>
            <motion.div
                className="cm-hero__content"
                initial={{ opacity: 0, y: 35 }}
                animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 35 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24, delay: 0.15 }}
            >
                <span className="cm-hero__badge">
                    <span className="cm-hero__pulse" />
                    <span className="cm-hero__badge-text">LIVE COMMUNITY</span>
                    <span className="cm-hero__badge-glow" />
                </span>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={heroIdx}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 1.02 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    >
                        <h1 className="cm-hero__title">
                            <span className="cm-hero__title-line">DESCUBRE TU</span>
                            <span className="cm-hero__accent">COMUNIDAD</span>
                        </h1>
                        <p className="cm-hero__sub">Unete a miles de jugadores. Comparte, compite y domina.</p>
                    </motion.div>
                </AnimatePresence>
                <div className="cm-hero__cta">
                    <motion.button 
                        className="cm-hero__btn cm-hero__btn--primary"
                        onClick={onExplore}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <i className='bx bxs-rocket'></i>
                        <span>Explorar</span>
                    </motion.button>
                    <motion.button 
                        className="cm-hero__btn cm-hero__btn--secondary"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <i className='bx bxl-discord-alt'></i>
                        <span>Discord</span>
                    </motion.button>
                </div>
                <div className="cm-hero__dots">
                    {heroes.map((_, i) => (
                        <button key={i} className={'cm-hero__dot ' + (i === heroIdx ? 'active' : '')} onClick={() => setHeroIdx(i)}>
                            <span className="cm-hero__dot-fill" />
                        </button>
                    ))}
                </div>
            </motion.div>
            <div className="cm-hero__particles">
                {Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="cm-hero__particle" style={{ 
                        '--x': Math.random()*100+'%', 
                        '--y': Math.random()*100+'%', 
                        '--d': (2+Math.random()*6)+'s', 
                        '--s': (2+Math.random()*5)+'px',
                        '--delay': (Math.random() * 5) + 's'
                    }} />
                ))}
            </div>
            <div className="cm-hero__vignette" />
            <div className="cm-hero__glow-orb cm-hero__glow-orb--1" />
            <div className="cm-hero__glow-orb cm-hero__glow-orb--2" />
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
                            {GAMES.map(g => (
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

const GameCard = ({ game, index, stats }) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef(null);
    const goToGame = useCallback(() => {
        navigate('/game/' + game.id);
    }, [navigate, game.id]);

    const handleMouseMove = useCallback((e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
        cardRef.current.style.setProperty('--rx', y + 'deg');
        cardRef.current.style.setProperty('--ry', x + 'deg');
        cardRef.current.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
        cardRef.current.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
        if (cardRef.current) {
            cardRef.current.style.setProperty('--rx', '0deg');
            cardRef.current.style.setProperty('--ry', '0deg');
        }
    }, []);

    return (
        <motion.div 
            ref={cardRef} 
            className={'cm-game ' + (isHovered ? 'hovered' : '')}
            style={{ '--card-color': game.color, '--delay': (index * 0.05) + 's' }}
            onMouseEnter={() => setIsHovered(true)} 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={goToGame}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToGame();
                }
            }}
            role="button"
            tabIndex={0}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
        >
            <div className="cm-game__inner">
                <img src={game.img} alt={game.name} className="cm-game__img" loading="lazy" />
                <div className="cm-game__shine" />
                <div className="cm-game__cursor-glow" />
                <div className="cm-game__gradient" />
                <div className="cm-game__scanlines" />
                <div className="cm-game__top-badge">
                    <span className="cm-game__badge-dot" />
                    {game.cat}
                </div>
                <div className="cm-game__info">
                    <h3 className="cm-game__name">{game.name}</h3>
                    <div className="cm-game__meta">
                        <div className="cm-game__players">
                            <i className='bx bxs-user'></i> {formatGameHubCount(stats?.usersCount ?? 0)}
                        </div>
                        <div className="cm-game__rating">
                            <i className='bx bxs-star'></i> 4.8
                        </div>
                    </div>
                    <motion.button 
                        className="cm-game__btn" 
                        onClick={(e) => { e.stopPropagation(); goToGame(); }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <i className='bx bx-right-arrow-alt'></i>
                        <span>Explorar</span>
                    </motion.button>
                </div>
                <div className="cm-game__border-glow" />
                <div className="cm-game__corner cm-game__corner--tl" />
                <div className="cm-game__corner cm-game__corner--tr" />
                <div className="cm-game__corner cm-game__corner--bl" />
                <div className="cm-game__corner cm-game__corner--br" />
            </div>
        </motion.div>
    );
};

const GamesSection = ({ searchQuery, activeFilter, setActiveFilter, onSuggestGame, gameStats }) => {
    const carouselRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);

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
        <motion.section
            id="community-games-section"
            className="cm-games"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
            {/* Gaming ambient particles */}
            <div className="cm-games__particles">
                {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} className="cm-games__particle" style={{
                        '--px': Math.random() * 100 + '%',
                        '--py': Math.random() * 100 + '%',
                        '--delay': (Math.random() * 5) + 's',
                        '--dur': (3 + Math.random() * 4) + 's',
                        '--size': (2 + Math.random() * 4) + 'px'
                    }} />
                ))}
            </div>
            <div className="cm-games__scanlines" />
            <div className="cm-section-header">
                <div className="cm-section-header__left">
                    <div className="cm-section-icon"><i className='bx bxs-joystick'></i></div>
                    <div>
                        <h2 className="cm-section-title" data-text="Videojuegos">Videojuegos</h2>
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
                        {filtered.map((g, i) => (
                            <GameCard key={g.id} game={g} index={i} stats={gameStats?.[g.id]} />
                        ))}
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
        </motion.section>
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
    const formatNum = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
    const communityHref = `/community/${community.slug || community.shortUrl || community.id}`;

    return (
        <motion.div
            className="cm-community"
            style={{ '--cc-color': community.color }}
            variants={fadeUp}
            whileHover={{ y: -8, scale: 1.01, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } }}
            onClick={() => navigate(communityHref, { state: community })}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(communityHref, { state: community });
                }
            }}
            role="button"
            tabIndex={0}>
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
                    <button
                        className="cm-community__join"
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(communityHref, { state: community });
                        }}>
                        <i className='bx bx-log-in-circle'></i> Abrir
                    </button>
                </div>
            </div>
            <div className="cm-community__edge" />
        </motion.div>
    );
};

const CommunitiesSection = ({ searchQuery, gameFilter }) => {
    const [activeTab, setActiveTab] = useState('popular');

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
        <motion.section
            className="cm-communities"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
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
            <motion.div
                className="cm-communities__grid"
                variants={stagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.05 }}
            >
                {filtered.map((c, i) => <CommunityCard key={c.id} community={c} index={i} />)}
            </motion.div>
            {filtered.length === 0 && (
                <div className="cm-empty">
                    <i className='bx bx-group'></i>
                    <p>No se encontraron comunidades</p>
                    <span>Intenta cambiar los filtros o crea una nueva</span>
                </div>
            )}
        </motion.section>
    );
};

const QuickStats = ({ totalUsersCount = 0 }) => {
    const [inView, setInView] = useState(false);
    const [hoveredStat, setHoveredStat] = useState(null);
    const ref = useRef(null);

    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);

    const gamesCount = useCountUp(GAMES.length, 1800, inView);
    const communitiesCount = useCountUp(COMMUNITIES.length, 1800, inView);
    const playersCount = useCountUp(totalUsersCount, 2200, inView);
    const tourneysCount = useCountUp(48, 1600, inView);

    const stats = [
        { icon: 'bx bxs-joystick', label: 'Juegos', value: gamesCount, display: String(gamesCount), color: 'var(--primary)', desc: 'Juegos disponibles' },
        { icon: 'bx bxs-group', label: 'Comunidades', value: communitiesCount, display: String(communitiesCount), color: 'var(--primary-hover)', desc: 'Comunidades activas' },
        { icon: 'bx bxs-user-account', label: 'Jugadores', value: playersCount, display: formatGameHubCount(playersCount), color: '#a8e048', desc: 'Usuarios en hubs' },
        { icon: 'bx bxs-trophy', label: 'Torneos', value: tourneysCount, display: String(tourneysCount), color: '#6bb30a', desc: 'Torneos activos' },
    ];
    return (
        <motion.div
            ref={ref}
            className="cm-stats"
            variants={stagger}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
        >
            {stats.map((s, i) => (
                <motion.div 
                    key={i} 
                    className={'cm-stat ' + (hoveredStat === i ? 'hovered' : '')}
                    style={{ '--stat-color': s.color, '--stat-index': i }} 
                    variants={fadeUp}
                    onMouseEnter={() => setHoveredStat(i)}
                    onMouseLeave={() => setHoveredStat(null)}
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <div className="cm-stat__glow" />
                    <div className="cm-stat__icon-wrap">
                        <i className={s.icon}></i>
                        <div className="cm-stat__icon-ring" />
                    </div>
                    <div className="cm-stat__text">
                        <span className="cm-stat__value">{s.display}</span>
                        <span className="cm-stat__label">{s.label}</span>
                        <span className="cm-stat__desc">{s.desc}</span>
                    </div>
                    <div className="cm-stat__particles">
                        {Array.from({ length: 3 }).map((_, j) => (
                            <span key={j} className="cm-stat__particle" style={{ '--delay': (j * 0.3) + 's' }} />
                        ))}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

const TrendingSidebar = () => (
    <motion.aside
        className="cm-trending"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
    >
        {/* Corner decorations */}
        <div className="cm-trending__corner cm-trending__corner--tl" />
        <div className="cm-trending__corner cm-trending__corner--tr" />
        
        {/* Animated glow orb */}
        <div className="cm-trending__glow-orb" />
        
        <div className="cm-trending__header">
            <div className="cm-trending__icon-wrap">
                <i className='bx bxs-hot'></i>
                <span className="cm-trending__icon-ring" />
            </div>
            <h3>Trending</h3>
            <span className="cm-trending__badge">HOT</span>
        </div>
        <div className="cm-trending__list">
            {TRENDING_TOPICS.map((t, i) => (
                <motion.div
                    key={i}
                    className="cm-trending__item"
                    style={{ '--tr-color': t.color }}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
                    whileHover={{ x: 6, transition: { duration: 0.2 } }}
                >
                    <span className="cm-trending__rank">#{i + 1}</span>
                    <div className="cm-trending__info">
                        <span className="cm-trending__title">{t.title}</span>
                        <span className="cm-trending__game">
                            <i className='bx bxs-game'></i>
                            {t.game} &middot; {t.comments} comentarios
                        </span>
                    </div>
                    <div className="cm-trending__arrow">
                        <i className='bx bx-chevron-right'></i>
                    </div>
                </motion.div>
            ))}
        </div>
    </motion.aside>
);

const ActiveMembers = () => {
    const members = [
        { name: 'NexusKing', level: 'Pro', color: 'var(--primary)', rank: 'Diamond' },
        { name: 'ProGamer_XD', level: 'Elite', color: '#a8e048', rank: 'Master' },
        { name: 'TeamAlpha', level: 'Veterano', color: '#6bb30a', rank: 'Gold' },
        { name: 'ClipMaster', level: 'Rising', color: 'var(--primary-hover)', rank: 'Platinum' },
        { name: 'ShadowStrike', level: 'Pro', color: 'var(--primary)', rank: 'Diamond' },
    ];

    return (
        <motion.aside
            className="cm-active-members"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            {/* Scanlines effect */}
            <div className="cm-active-members__scanlines" />
            
            <div className="cm-active-members__header">
                <div className="cm-active-members__icon-wrap">
                    <i className='bx bxs-group'></i>
                </div>
                <h3>Miembros Activos</h3>
                <span className="cm-active-members__count">
                    <span className="cm-active-members__count-dot" />
                    23 online
                </span>
            </div>
            <div className="cm-active-members__list">
                {members.map((m, i) => (
                    <motion.div
                        key={i}
                        className="cm-active-members__item"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.05, duration: 0.3 }}
                        whileHover={{ 
                            backgroundColor: 'rgba(142, 219, 21, 0.08)',
                            transition: { duration: 0.2 }
                        }}
                    >
                        <div className="cm-active-members__avatar" style={{ '--am-color': m.color }}>
                            {m.name[0]}
                            <span className="cm-active-members__avatar-ring" />
                        </div>
                        <div className="cm-active-members__info">
                            <span className="cm-active-members__name">{m.name}</span>
                            <div className="cm-active-members__meta">
                                <span className="cm-active-members__level" style={{ color: m.color }}>{m.level}</span>
                                <span className="cm-active-members__rank">{m.rank}</span>
                            </div>
                        </div>
                        <span className="cm-active-members__online-dot" />
                    </motion.div>
                ))}
            </div>
            <div className="cm-active-members__footer">
                <button className="cm-active-members__view-all">
                    Ver todos <i className='bx bx-right-arrow-alt'></i>
                </button>
            </div>
        </motion.aside>
    );
};

const CommunityRules = () => (
    <motion.aside 
        className="cm-rules-card"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
    >
        {/* Cyber corner decorations */}
        <div className="cm-rules-card__corner cm-rules-card__corner--bl" />
        <div className="cm-rules-card__corner cm-rules-card__corner--br" />
        
        <div className="cm-rules-card__header">
            <div className="cm-rules-card__icon-wrap">
                <i className='bx bxs-shield-alt-2'></i>
            </div>
            <h3>Reglas de la Comunidad</h3>
        </div>
        <div className="cm-rules-card__list">
            {[
                { icon: 'bx-heart', text: 'Respeta a todos los miembros' },
                { icon: 'bx-block', text: 'No spam ni autopromocion excesiva' },
                { icon: 'bx-joystick', text: 'Contenido relevante al gaming' },
                { icon: 'bx-shield-x', text: 'No toxicidad ni hate speech' },
                { icon: 'bx-flag', text: 'Reporta contenido inapropiado' },
            ].map((rule, i) => (
                <motion.div 
                    key={i}
                    className="cm-rules-card__rule"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.3 }}
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                >
                    <span className="cm-rules-card__number">{i + 1}</span>
                    <i className={`bx ${rule.icon}`}></i>
                    <span className="cm-rules-card__text">{rule.text}</span>
                </motion.div>
            ))}
        </div>
        <div className="cm-rules-card__footer">
            <span className="cm-rules-card__disclaimer">
                <i className='bx bx-info-circle'></i>
                Violaciones pueden resultar en ban
            </span>
        </div>
    </motion.aside>
);

const SectionDivider = () => (
    <div className="cm-divider">
        <div className="cm-divider__line" />
        <div className="cm-divider__diamond"><i className='bx bxs-diamond'></i></div>
        <div className="cm-divider__line" />
    </div>
);

const CtaBanner = () => {
    const navigate = useNavigate();
    return (
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
                    <button className="cm-cta-banner__btn cm-cta-banner__btn--primary" onClick={() => navigate('/torneos')}>
                        <i className='bx bxs-trophy'></i> Ver Torneos
                    </button>
                    <button className="cm-cta-banner__btn cm-cta-banner__btn--secondary">
                        <i className='bx bxl-discord-alt'></i> Discord
                    </button>
                </div>
            </div>
        </div>
    );
};

/*  MAIN PAGE  */

const Community = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [gameFilter, setGameFilter] = useState('all');
    const [activeFilter, setActiveFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [activeView, setActiveView] = useState('feed');
    const [gameStats, setGameStats] = useState({});
    const shouldScrollToGamesRef = useRef(false);

    const viewTabs = [
        { id: 'feed', label: 'Feed', icon: 'bx bxs-news' },
        { id: 'games', label: 'Videojuegos', icon: 'bx bxs-joystick' },
        { id: 'communities', label: 'Comunidades', icon: 'bx bxs-group' },
    ];

    // Generate random particles for global effect
    const globalParticles = useMemo(() => 
        Array.from({ length: 20 }).map((_, i) => ({
            x: `${Math.random() * 100}%`,
            duration: `${12 + Math.random() * 15}s`,
            delay: `${Math.random() * 10}s`,
        })), []);

    useEffect(() => {
        let cancelled = false;

        const loadGameStats = async () => {
            try {
                const nextStats = await fetchGameHubStatsIndex();
                if (!cancelled) {
                    setGameStats(nextStats);
                }
            } catch (_) {
                if (!cancelled) {
                    setGameStats({});
                }
            }
        };

        loadGameStats();

        return () => {
            cancelled = true;
        };
    }, []);

    const totalGameUsers = useMemo(
        () => Object.values(gameStats || {}).reduce((sum, entry) => sum + Number(entry?.usersCount || 0), 0),
        [gameStats]
    );

    const handleExploreGames = useCallback(() => {
        shouldScrollToGamesRef.current = true;
        setActiveView('games');
    }, []);

    useEffect(() => {
        if (activeView !== 'games' || !shouldScrollToGamesRef.current) return undefined;

        const timeoutId = window.setTimeout(() => {
            const gamesSection = document.getElementById('community-games-section');
            if (gamesSection) {
                gamesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            shouldScrollToGamesRef.current = false;
        }, 80);

        return () => window.clearTimeout(timeoutId);
    }, [activeView]);

    return (
        <div className="cm-page">
            {/* Global immersive effects */}
            <div className="cm-bg-mesh" />
            <div className="cm-page__cyber-grid" />
            <div className="cm-page__particles">
                {globalParticles.map((p, i) => (
                    <span 
                        key={i} 
                        className="cm-page__particle"
                        style={{ '--x': p.x, '--duration': p.duration, '--delay': p.delay }}
                    />
                ))}
            </div>
            <div className="cm-page__scanlines" />
            <div className="cm-page__orb-extra" />
            
            <PageHud page="Comunidad" />
            <HeroBanner onExplore={handleExploreGames} />
            <div className="cm-container">
                <QuickStats totalUsersCount={totalGameUsers} />
                <SearchBar
                    value={searchQuery} onChange={setSearchQuery}
                    gameFilter={gameFilter} setGameFilter={setGameFilter}
                    onCreateCommunity={() => setShowCreateModal(true)}
                />

                {/* View Navigation Tabs */}
                <div className="cm-view-tabs">
                    {viewTabs.map(t => (
                        <button key={t.id} className={'cm-view-tab ' + (activeView === t.id ? 'active' : '')}
                            onClick={() => setActiveView(t.id)}>
                            <i className={t.icon}></i>
                            <span>{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Feed View */}
                    {activeView === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="cm-main-layout">
                                <div className="cm-main-content">
                                    <FeedPanel communityName="Comunidad Global" />
                                </div>
                                <div className="cm-sidebar">
                                    <TrendingSidebar />
                                    <ActiveMembers />
                                    <CommunityRules />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Games View */}
                    {activeView === 'games' && (
                        <motion.div
                            key="games"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="cm-main-layout">
                                <div className="cm-main-content">
                                    <GamesSection
                                        searchQuery={searchQuery}
                                        activeFilter={activeFilter}
                                        setActiveFilter={setActiveFilter}
                                        onSuggestGame={() => setShowSuggestModal(true)}
                                        gameStats={gameStats}
                                    />
                                </div>
                                <div className="cm-sidebar">
                                    <TrendingSidebar />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Communities View */}
                    {activeView === 'communities' && (
                        <motion.div
                            key="communities"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="cm-main-layout cm-main-layout--communities">
                                <div className="cm-main-content">
                                    <motion.section
                                        className="cm-community-showcase"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 }}
                                    >
                                        <div className="cm-community-showcase__copy">
                                            <span className="cm-community-showcase__eyebrow">Panel de comunidades</span>
                                            <h2 className="cm-community-showcase__title">Encuentra hubs activos con identidad clara, reglas visibles y actividad real.</h2>
                                            <p className="cm-community-showcase__text">
                                                Explora espacios listos para competir, conversar y organizar contenido por juego, región e idioma.
                                            </p>
                                        </div>
                                        <div className="cm-community-showcase__stats">
                                            <div className="cm-community-showcase__stat">
                                                <strong>{COMMUNITIES.length}</strong>
                                                <span>Comunidades curadas</span>
                                            </div>
                                            <div className="cm-community-showcase__stat">
                                                <strong>{GAMES.length}</strong>
                                                <span>Juegos activos</span>
                                            </div>
                                            <div className="cm-community-showcase__stat">
                                                <strong>{COMMUNITIES.filter((community) => community.featured).length}</strong>
                                                <span>Destacadas ahora</span>
                                            </div>
                                        </div>
                                    </motion.section>
                                    <div className="cm-community-surface">
                                        <CommunitiesSection searchQuery={searchQuery} gameFilter={gameFilter} />
                                        <SectionDivider />
                                        <CtaBanner />
                                    </div>
                                </div>
                                <div className="cm-sidebar">
                                    <TrendingSidebar />
                                    <ActiveMembers />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <CreateCommunityModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
            <SuggestGameModal open={showSuggestModal} onClose={() => setShowSuggestModal(false)} />
        </div>
    );
};

export default Community;
