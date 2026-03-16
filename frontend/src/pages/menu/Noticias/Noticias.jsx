import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FaFire, FaClock, FaEye, FaComment, FaChevronRight, FaChevronDown,
    FaGamepad, FaTrophy, FaCalendarAlt, FaBuilding, FaUsers,
    FaNewspaper, FaArrowRight, FaSearch, FaTimes, FaBookmark,
    FaRegBookmark, FaShare, FaHeart, FaRegHeart, FaSortAmountDown, FaPlus
} from 'react-icons/fa';
import PageHud from '../../../components/PageHud/PageHud';
import { isSupportedGameName } from '../../../../../shared/supportedGames.js';
import {
    ALLOWED_NEWS_IMAGE_TYPES,
    DEFAULT_NEWS_COMPANY,
    MAX_NEWS_GALLERY_ITEMS,
    buildCustomNewsArticle,
    createNewsDetails,
    createNewsSummary,
    getNewsImageValidationMessage,
    fetchNewsFeed,
    readNewsImageFile,
    saveCustomNews,
} from '../../../utils/customNews';
import './Noticias.css';

// Categories
const CATEGORIES = [
    { id: 'Todos', label: 'Todos', icon: FaNewspaper },
    { id: 'Torneos', label: 'Torneos', icon: FaTrophy },
    { id: 'Competitivo', label: 'Competitivo', icon: FaGamepad },
    { id: 'Eventos', label: 'Eventos', icon: FaCalendarAlt },
    { id: 'Institucional', label: 'Institucional', icon: FaBuilding },
    { id: 'Equipos', label: 'Equipos', icon: FaUsers },
];

const GAMES = ['Todos', 'MLBB', 'Valorant', 'LoL', 'Multigame'];
const NEWS_IMAGE_ACCEPT = Array.from(ALLOWED_NEWS_IMAGE_TYPES).join(',');

const createInitialDraft = () => ({
    title: '',
    author: '',
    company: DEFAULT_NEWS_COMPANY,
    category: 'Torneos',
    game: 'Multigame',
    image: '',
    imageName: '',
    gallery: [],
    galleryNames: [],
    body: '',
    date: new Date().toISOString().slice(0, 10),
    tags: '',
    featured: true,
});

// Format date helper
const formatDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'Hoy';
    if (diff === 1) return 'Ayer';
    if (diff < 7) return `Hace ${diff} días`;
    
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Bubble component for dynamic background
const Bubbles = () => {
    return (
        <div className="nw-bubbles">
            {[...Array(15)].map((_, i) => (
                <div 
                    key={i} 
                    className="nw-bubble"
                    style={{
                        '--size': `${Math.random() * 100 + 40}px`,
                        '--left': `${Math.random() * 100}%`,
                        '--delay': `${Math.random() * 15}s`,
                        '--duration': `${Math.random() * 10 + 15}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default function Noticias() {
    const navigate = useNavigate();
    const primaryImageInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const [newsItems, setNewsItems] = useState([]);
    const [category, setCategory] = useState('Todos');
    const [game, setGame] = useState('Todos');
    const [sortBy, setSortBy] = useState('recent');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [bookmarks, setBookmarks] = useState([]);
    const [likes, setLikes] = useState({});
    const [showFilters, setShowFilters] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [draft, setDraft] = useState(createInitialDraft);
    const [isProcessingMedia, setIsProcessingMedia] = useState(false);

    // Load news from API + bookmarks from localStorage
    useEffect(() => {
        const loadFeed = async () => {
            const items = await fetchNewsFeed();
            const filtered = items.filter((item) => item?.game === 'Multigame' || isSupportedGameName(item?.game));
            setNewsItems(filtered);
        };

        loadFeed();

        const saved = localStorage.getItem('news_bookmarks');
        if (saved) setBookmarks(JSON.parse(saved));

        const savedLikes = localStorage.getItem('news_likes');
        if (savedLikes) setLikes(JSON.parse(savedLikes));

        const onNewsUpdated = () => loadFeed();
        window.addEventListener('custom-news-updated', onNewsUpdated);
        return () => window.removeEventListener('custom-news-updated', onNewsUpdated);
    }, []);

    useEffect(() => {
        if (!isComposerOpen) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsComposerOpen(false);
                setDraft(createInitialDraft());
                if (primaryImageInputRef.current) primaryImageInputRef.current.value = '';
                if (galleryInputRef.current) galleryInputRef.current.value = '';
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isComposerOpen]);

    // Show toast notification
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const resetMediaInputs = () => {
        if (primaryImageInputRef.current) primaryImageInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const closeComposer = () => {
        setIsComposerOpen(false);
        setDraft(createInitialDraft());
        resetMediaInputs();
    };

    const summaryPreview = useMemo(() => createNewsSummary(draft.body), [draft.body]);
    const detailsPreview = useMemo(() => createNewsDetails(draft.body), [draft.body]);

    const handleDraftChange = (event) => {
        const { name, value, type, checked } = event.target;
        setDraft((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handlePrimaryImageChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validationMessage = getNewsImageValidationMessage(file);
        if (validationMessage) {
            showToast(validationMessage);
            event.target.value = '';
            return;
        }

        setIsProcessingMedia(true);

        try {
            const image = await readNewsImageFile(file, {
                maxWidth: 1600,
                maxHeight: 900,
                quality: 0.84,
            });

            setDraft((current) => ({
                ...current,
                image,
                imageName: file.name,
            }));
            showToast('Imagen principal cargada desde tu equipo.');
        } catch {
            showToast('No pudimos procesar la imagen principal.');
            event.target.value = '';
        } finally {
            setIsProcessingMedia(false);
        }
    };

    const handleGalleryChange = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        if (files.length > MAX_NEWS_GALLERY_ITEMS) {
            showToast(`Selecciona hasta ${MAX_NEWS_GALLERY_ITEMS} imagenes para la galeria.`);
            event.target.value = '';
            return;
        }

        const invalidFile = files.find((file) => getNewsImageValidationMessage(file));
        if (invalidFile) {
            showToast(getNewsImageValidationMessage(invalidFile));
            event.target.value = '';
            return;
        }

        setIsProcessingMedia(true);

        try {
            const gallery = await Promise.all(
                files.map((file) =>
                    readNewsImageFile(file, {
                        maxWidth: 1400,
                        maxHeight: 900,
                        quality: 0.8,
                    })
                )
            );

            setDraft((current) => ({
                ...current,
                gallery,
                galleryNames: files.map((file) => file.name),
            }));
            showToast(`${files.length} imagen${files.length > 1 ? 'es' : ''} de galeria cargada${files.length > 1 ? 's' : ''}.`);
        } catch {
            showToast('No pudimos procesar la galeria.');
            event.target.value = '';
        } finally {
            setIsProcessingMedia(false);
        }
    };

    const clearPrimaryImage = () => {
        setDraft((current) => ({
            ...current,
            image: '',
            imageName: '',
        }));
        if (primaryImageInputRef.current) primaryImageInputRef.current.value = '';
    };

    const clearGallery = () => {
        setDraft((current) => ({
            ...current,
            gallery: [],
            galleryNames: [],
        }));
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const handleCreateNews = async (event) => {
        event.preventDefault();

        if (!draft.title.trim() || !draft.image.trim() || !draft.body.trim()) {
            showToast('Completa titular, imagen principal y contenido para publicar la noticia.');
            return;
        }

        const article = buildCustomNewsArticle(draft);

        try {
            await saveCustomNews(article);
            closeComposer();
            showToast('Noticia creada y publicada en el feed.');
        } catch {
            showToast('No se pudo guardar la noticia. Verifica que has iniciado sesion e intenta otra vez.');
        }
    };

    // Toggle bookmark
    const toggleBookmark = (e, newsId) => {
        e.stopPropagation();
        const updated = bookmarks.includes(newsId) 
            ? bookmarks.filter(id => id !== newsId)
            : [...bookmarks, newsId];
        setBookmarks(updated);
        localStorage.setItem('news_bookmarks', JSON.stringify(updated));
        showToast(bookmarks.includes(newsId) ? 'Eliminado de guardados' : 'Guardado en favoritos');
    };

    // Toggle like
    const toggleLike = (e, newsId) => {
        e.stopPropagation();
        const updated = { ...likes, [newsId]: !likes[newsId] };
        setLikes(updated);
        localStorage.setItem('news_likes', JSON.stringify(updated));
    };

    // Share article
    const shareArticle = (e, news) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: news.title, url: `${window.location.origin}/noticias/${news.id}` });
        } else {
            navigator.clipboard.writeText(`${window.location.origin}/noticias/${news.id}`);
            showToast('Link copiado al portapapeles');
        }
    };

    // Filter and sort news
    const filtered = useMemo(() => {
        let rows = [...newsItems];
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            rows = rows.filter(n => 
                n.title.toLowerCase().includes(term) || 
                n.excerpt.toLowerCase().includes(term) ||
                n.category.toLowerCase().includes(term) ||
                n.game.toLowerCase().includes(term)
            );
        }
        
        if (category !== 'Todos') rows = rows.filter((n) => n.category === category);
        if (game !== 'Todos') rows = rows.filter((n) => n.game === game);
        
        rows.sort((a, b) => {
            if (sortBy === 'popular') return b.views - a.views;
            if (sortBy === 'comments') return b.comments - a.comments;
            return new Date(b.createdAt || `${b.date}T00:00:00`) - new Date(a.createdAt || `${a.date}T00:00:00`);
        });
        
        return rows;
    }, [category, game, sortBy, searchTerm, newsItems]);

    // Featured news
    const featuredNews = useMemo(() => {
        const featured = newsItems.find((n) => n.featured);
        return featured || newsItems[0];
    }, [newsItems]);

    // Trending news (top 5)
    const trendingNews = useMemo(() => {
        return [...newsItems].sort((a, b) => b.views - a.views).slice(0, 5);
    }, [newsItems]);

    // Stats
    const stats = useMemo(() => ({
        total: newsItems.length,
        views: newsItems.reduce((acc, n) => acc + n.views, 0),
        comments: newsItems.reduce((acc, n) => acc + n.comments, 0),
    }), [newsItems]);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.06 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    return (
        <div className="nw-page">
            {/* Dynamic Bubble Background */}
            <Bubbles />
            
            {/* Ambient gradients */}
            <div className="nw-ambient nw-ambient--1" />
            <div className="nw-ambient nw-ambient--2" />
            <div className="nw-ambient nw-ambient--3" />

            <PageHud page="NOTICIAS" />

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        className="nw-toast"
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isComposerOpen && (
                    <motion.div
                        className="nw-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeComposer}
                    >
                        <motion.div
                            className="nw-modal"
                            initial={{ opacity: 0, y: 24, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.98 }}
                            transition={{ duration: 0.22 }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="nw-modal__head">
                                <div>
                                    <span className="nw-modal__eyebrow">Editor de GLITCH GANG</span>
                                    <h2>Haz noticias</h2>
                                    <p>Escribe el contexto base y generamos el resumen corto automaticamente para el feed.</p>
                                </div>
                                <button type="button" className="nw-modal__close" onClick={closeComposer}>
                                    <FaTimes />
                                </button>
                            </div>

                            <form className="nw-modal__body" onSubmit={handleCreateNews}>
                                <div className="nw-modal__form">
                                    <div className="nw-form__grid nw-form__grid--two">
                                        <label className="nw-form__field">
                                            <span>Titular</span>
                                            <input name="title" value={draft.title} onChange={handleDraftChange} placeholder="Escribe el titulo de la noticia" />
                                        </label>
                                        <label className="nw-form__field">
                                            <span>Autor</span>
                                            <input name="author" value={draft.author} onChange={handleDraftChange} placeholder="Nombre del autor o editor" />
                                        </label>
                                    </div>

                                    <div className="nw-form__grid nw-form__grid--three">
                                        <label className="nw-form__field">
                                            <span>Empresa</span>
                                            <input name="company" value={draft.company} onChange={handleDraftChange} placeholder="GLITCH GANG" />
                                        </label>
                                        <label className="nw-form__field">
                                            <span>Fecha</span>
                                            <input type="date" name="date" value={draft.date} onChange={handleDraftChange} />
                                        </label>
                                        <label className="nw-form__field nw-form__field--check">
                                            <span>Primicia</span>
                                            <span className="nw-switch">
                                                <input type="checkbox" name="featured" checked={draft.featured} onChange={handleDraftChange} />
                                                <span>{draft.featured ? 'Si, ponerla arriba' : 'No, solo agregar al feed'}</span>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="nw-form__grid nw-form__grid--two">
                                        <label className="nw-form__field">
                                            <span>Categoria</span>
                                            <select name="category" value={draft.category} onChange={handleDraftChange}>
                                                {CATEGORIES.filter((item) => item.id !== 'Todos').map((item) => (
                                                    <option key={item.id} value={item.id}>{item.label}</option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="nw-form__field">
                                            <span>Juego</span>
                                            <select name="game" value={draft.game} onChange={handleDraftChange}>
                                                {GAMES.filter((item) => item !== 'Todos').map((item) => (
                                                    <option key={item} value={item}>{item}</option>
                                                ))}
                                            </select>
                                        </label>
                                    </div>

                                    <label className="nw-form__field">
                                        <span>Imagen principal</span>
                                        <input
                                            ref={primaryImageInputRef}
                                            type="file"
                                            accept={NEWS_IMAGE_ACCEPT}
                                            onClick={(event) => { event.currentTarget.value = ''; }}
                                            onChange={handlePrimaryImageChange}
                                        />
                                        <small className="nw-form__help">
                                            Sube la portada desde tu equipo. Formatos: JPG, PNG o WEBP.
                                        </small>
                                        {draft.imageName && (
                                            <div className="nw-file-summary">
                                                <span>{draft.imageName}</span>
                                                <button type="button" onClick={clearPrimaryImage}>Quitar</button>
                                            </div>
                                        )}
                                    </label>

                                    <label className="nw-form__field">
                                        <span>Galeria adicional</span>
                                        <input
                                            ref={galleryInputRef}
                                            type="file"
                                            accept={NEWS_IMAGE_ACCEPT}
                                            multiple
                                            onClick={(event) => { event.currentTarget.value = ''; }}
                                            onChange={handleGalleryChange}
                                        />
                                        <small className="nw-form__help">
                                            Puedes subir hasta {MAX_NEWS_GALLERY_ITEMS} imagenes extra desde tu equipo.
                                        </small>
                                        {draft.galleryNames.length > 0 && (
                                            <div className="nw-file-summary nw-file-summary--stacked">
                                                <div className="nw-file-summary__list">
                                                    {draft.galleryNames.map((name, index) => (
                                                        <span key={`${name}-${index}`}>{name}</span>
                                                    ))}
                                                </div>
                                                <button type="button" onClick={clearGallery}>Vaciar galeria</button>
                                            </div>
                                        )}
                                    </label>

                                    <label className="nw-form__field">
                                        <span>Tags</span>
                                        <input name="tags" value={draft.tags} onChange={handleDraftChange} placeholder="torneo, caribe, final, fichaje" />
                                    </label>

                                    <label className="nw-form__field">
                                        <span>Texto base</span>
                                        <textarea
                                            name="body"
                                            value={draft.body}
                                            onChange={handleDraftChange}
                                            rows={8}
                                            placeholder="Escribe aqui toda la noticia. Puedes usar varios parrafos y nosotros la convertimos en resumen + detalle."
                                        />
                                    </label>
                                </div>

                                <aside className="nw-modal__preview">
                                    <div className="nw-preview__panel">
                                        <span className="nw-preview__eyebrow">Resumen automatico</span>
                                        <h3>{draft.title.trim() || 'Tu titular aparecera aqui'}</h3>
                                        <p>{summaryPreview || 'Cuando escribas el cuerpo de la noticia, aqui veras el resumen que ira al feed.'}</p>
                                    </div>

                                    <div className="nw-preview__panel">
                                        <span className="nw-preview__eyebrow">Ficha</span>
                                        <ul className="nw-preview__facts">
                                            <li><strong>Autor</strong><span>{draft.author.trim() || 'Mesa Editorial'}</span></li>
                                            <li><strong>Empresa</strong><span>{draft.company.trim() || DEFAULT_NEWS_COMPANY}</span></li>
                                            <li><strong>Fecha</strong><span>{draft.date || 'Sin fecha'}</span></li>
                                            <li><strong>Categoria</strong><span>{draft.category}</span></li>
                                            <li><strong>Juego</strong><span>{draft.game}</span></li>
                                        </ul>
                                    </div>

                                    <div className="nw-preview__panel">
                                        <span className="nw-preview__eyebrow">Material visual</span>
                                        {draft.image ? (
                                            <div className="nw-media-preview">
                                                <img src={draft.image} alt="Previsualizacion principal" className="nw-media-preview__hero" />
                                                <div className="nw-media-preview__meta">
                                                    <strong>{draft.imageName || 'Portada lista'}</strong>
                                                    <span>{draft.galleryNames.length} recurso{draft.galleryNames.length !== 1 ? 's' : ''} extra en galeria</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p>Selecciona una portada desde tu equipo para verla aqui.</p>
                                        )}

                                        {draft.gallery.length > 0 && (
                                            <div className="nw-media-preview__grid">
                                                {draft.gallery.slice(0, 4).map((image, index) => (
                                                    <img
                                                        key={`${draft.galleryNames[index] || 'gallery'}-${index}`}
                                                        src={image}
                                                        alt={`Galeria ${index + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="nw-preview__panel">
                                        <span className="nw-preview__eyebrow">Claves detectadas</span>
                                        <div className="nw-preview__chips">
                                            {(draft.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 6)).map((tag) => (
                                                <span key={tag}>{tag}</span>
                                            ))}
                                            {!draft.tags.trim() && <span>Sin tags todavia</span>}
                                        </div>
                                        <ol className="nw-preview__details">
                                            {detailsPreview.slice(0, 3).map((detail, index) => (
                                                <li key={`${detail}-${index}`}>{detail}</li>
                                            ))}
                                            {!detailsPreview.length && <li>Las claves del articulo saldran automaticamente del texto base.</li>}
                                        </ol>
                                    </div>

                                    <div className="nw-modal__actions">
                                        <button type="button" className="nw-modal__ghost" onClick={closeComposer}>
                                            Cancelar
                                        </button>
                                        <button type="submit" className="nw-modal__submit" disabled={isProcessingMedia}>
                                            {isProcessingMedia ? 'Procesando imagenes...' : 'Publicar noticia'}
                                        </button>
                                    </div>
                                </aside>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            {featuredNews && <motion.section
                className="nw-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="nw-hero__featured" onClick={() => navigate(`/noticias/${featuredNews.id}`)}>
                    <div className="nw-hero__image">
                        <img src={featuredNews.image} alt={featuredNews.title} />
                        <div className="nw-hero__overlay" />
                    </div>
                    <div className="nw-hero__content">
                        <div className="nw-hero__badges">
                            {featuredNews.featured && (
                                <span className="nw-badge nw-badge--featured">
                                    <FaFire /> {featuredNews.isCustom ? 'Primicia' : 'Destacado'}
                                </span>
                            )}
                            {featuredNews.isNew && (
                                <span className="nw-badge nw-badge--fresh">Nuevo</span>
                            )}
                            <span className="nw-badge nw-badge--category">{featuredNews.category}</span>
                            <span className="nw-badge nw-badge--game">{featuredNews.game}</span>
                        </div>
                        <h1>{featuredNews.title}</h1>
                        <p>{featuredNews.excerpt}</p>
                        <div className="nw-hero__meta">
                            <span><FaClock /> {formatDate(featuredNews.date)}</span>
                            <span><FaEye /> {featuredNews.views.toLocaleString()}</span>
                            <span><FaComment /> {featuredNews.comments}</span>
                            <span className="nw-hero__author">Por {featuredNews.author}</span>
                            {(featuredNews.company || featuredNews.isCustom) && (
                                <span className="nw-hero__company"><FaBuilding /> {featuredNews.company || DEFAULT_NEWS_COMPANY}</span>
                            )}
                        </div>
                        <motion.button 
                            className="nw-hero__cta"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Leer artículo completo <FaArrowRight />
                        </motion.button>
                    </div>
                    
                    {/* Hero Actions */}
                    <div className="nw-hero__actions">
                        <button onClick={(e) => toggleBookmark(e, featuredNews.id)}>
                            {bookmarks.includes(featuredNews.id) ? <FaBookmark /> : <FaRegBookmark />}
                        </button>
                        <button onClick={(e) => toggleLike(e, featuredNews.id)}>
                            {likes[featuredNews.id] ? <FaHeart className="liked" /> : <FaRegHeart />}
                        </button>
                        <button onClick={(e) => shareArticle(e, featuredNews)}>
                            <FaShare />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="nw-hero__stats">
                    <motion.div className="nw-stat" whileHover={{ scale: 1.05 }}>
                        <FaNewspaper className="nw-stat__icon" />
                        <div>
                            <span className="nw-stat__value">{stats.total}</span>
                            <span className="nw-stat__label">Artículos</span>
                        </div>
                    </motion.div>
                    <motion.div className="nw-stat" whileHover={{ scale: 1.05 }}>
                        <FaEye className="nw-stat__icon" />
                        <div>
                            <span className="nw-stat__value">{stats.views.toLocaleString()}</span>
                            <span className="nw-stat__label">Lecturas</span>
                        </div>
                    </motion.div>
                    <motion.div className="nw-stat" whileHover={{ scale: 1.05 }}>
                        <FaComment className="nw-stat__icon" />
                        <div>
                            <span className="nw-stat__value">{stats.comments}</span>
                            <span className="nw-stat__label">Comentarios</span>
                        </div>
                    </motion.div>
                </div>
            </motion.section>}

            {/* Toolbar */}
            <section className="nw-toolbar">
                <div className="nw-toolbar__top">
                    {/* Search */}
                    <div className="nw-search">
                        <FaSearch className="nw-search__icon" />
                        <input 
                            type="text"
                            placeholder="Buscar noticias, juegos, equipos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="nw-search__clear" onClick={() => setSearchTerm('')}>
                                <FaTimes />
                            </button>
                        )}
                    </div>

                    {/* Filter toggle for mobile */}
                    <button 
                        className={`nw-filter-toggle ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaSortAmountDown />
                        Filtros
                        <FaChevronDown className={showFilters ? 'rotated' : ''} />
                    </button>

                    <button className="nw-create-btn" onClick={() => setIsComposerOpen(true)}>
                        <FaPlus />
                        Haz noticias
                    </button>

                    {/* Desktop filters */}
                    <div className="nw-toolbar__filters">
                        <select value={game} onChange={(e) => setGame(e.target.value)} className="nw-select">
                            {GAMES.map((g) => <option key={g} value={g}>{g === 'Todos' ? 'Todos los juegos' : g}</option>)}
                        </select>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="nw-select">
                            <option value="recent">Más reciente</option>
                            <option value="popular">Más popular</option>
                            <option value="comments">Más comentado</option>
                        </select>
                    </div>
                </div>

                {/* Mobile filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div 
                            className="nw-toolbar__mobile-filters"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                        >
                            <select value={game} onChange={(e) => setGame(e.target.value)} className="nw-select">
                                {GAMES.map((g) => <option key={g} value={g}>{g === 'Todos' ? 'Todos los juegos' : g}</option>)}
                            </select>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="nw-select">
                                <option value="recent">Más reciente</option>
                                <option value="popular">Más popular</option>
                                <option value="comments">Más comentado</option>
                            </select>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Categories */}
                <div className="nw-categories">
                    {CATEGORIES.map((c) => (
                        <motion.button 
                            key={c.id} 
                            className={`nw-category ${category === c.id ? 'nw-category--active' : ''}`} 
                            onClick={() => setCategory(c.id)}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <c.icon />
                                <span>{c.label}</span>
                                {c.id !== 'Todos' && (
                                    <span className="nw-category__count">
                                        {newsItems.filter((n) => n.category === c.id).length}
                                    </span>
                                )}
                            </motion.button>
                    ))}
                </div>

                {/* Results count */}
                {(searchTerm || category !== 'Todos' || game !== 'Todos') && (
                    <motion.div 
                        className="nw-results-info"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
                        {(searchTerm || category !== 'Todos' || game !== 'Todos') && (
                            <button onClick={() => { setCategory('Todos'); setGame('Todos'); setSearchTerm(''); }}>
                                Limpiar filtros
                            </button>
                        )}
                    </motion.div>
                )}
            </section>

            {/* Main Content */}
            <div className="nw-main">
                {/* News Grid */}
                <motion.section 
                    className="nw-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    key={`${category}-${game}-${sortBy}-${searchTerm}`}
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.length > 0 ? (
                            filtered.map((n, index) => (
                                <motion.article 
                                    key={n.id}
                                    className={`nw-card ${index === 0 && !searchTerm && category === 'Todos' && game === 'Todos' ? 'nw-card--large' : ''}`}
                                    variants={cardVariants}
                                    layout
                                    onClick={() => navigate(`/noticias/${n.id}`)}
                                    onMouseEnter={() => setHoveredCard(n.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    whileHover={{ y: -8 }}
                                >
                                    <div className="nw-card__image">
                                        <img src={n.image} alt={n.title} loading="lazy" />
                                        <div className="nw-card__overlay" />
                                        <div className="nw-card__badges">
                                            {n.featured && <span className="nw-badge nw-badge--featured">{n.isCustom ? 'Primicia' : 'Destacado'}</span>}
                                            {n.isNew && <span className="nw-badge nw-badge--fresh">Nuevo</span>}
                                            <span className="nw-badge nw-badge--category">{n.category}</span>
                                            <span className="nw-badge nw-badge--game">{n.game}</span>
                                        </div>
                                        <div className="nw-card__actions">
                                            <button 
                                                className={bookmarks.includes(n.id) ? 'active' : ''}
                                                onClick={(e) => toggleBookmark(e, n.id)}
                                            >
                                                {bookmarks.includes(n.id) ? <FaBookmark /> : <FaRegBookmark />}
                                            </button>
                                            <button 
                                                className={likes[n.id] ? 'active' : ''}
                                                onClick={(e) => toggleLike(e, n.id)}
                                            >
                                                {likes[n.id] ? <FaHeart /> : <FaRegHeart />}
                                            </button>
                                            <button onClick={(e) => shareArticle(e, n)}>
                                                <FaShare />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="nw-card__body">
                                        <h3>{n.title}</h3>
                                        <p>{n.excerpt}</p>
                                        <div className="nw-card__footer">
                                            <div className="nw-card__meta">
                                                <span className="nw-card__date">{formatDate(n.date)}</span>
                                                <span className="nw-card__views"><FaEye /> {n.views.toLocaleString()}</span>
                                                <span className="nw-card__comments"><FaComment /> {n.comments}</span>
                                            </div>
                                            <div className="nw-card__author-block">
                                                <span className="nw-card__author">{n.author}</span>
                                                {(n.company || n.isCustom) && (
                                                    <span className="nw-card__company">{n.company || DEFAULT_NEWS_COMPANY}</span>
                                                )}
                                            </div>
                                        </div>
                                        <motion.div 
                                            className="nw-card__read-more"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ 
                                                opacity: hoveredCard === n.id ? 1 : 0, 
                                                x: hoveredCard === n.id ? 0 : -10 
                                            }}
                                        >
                                            Leer más <FaChevronRight />
                                        </motion.div>
                                    </div>
                                </motion.article>
                            ))
                        ) : (
                            <motion.div 
                                className="nw-empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <FaNewspaper />
                                <h3>No hay noticias</h3>
                                <p>No encontramos noticias con los filtros seleccionados</p>
                                <button onClick={() => { setCategory('Todos'); setGame('Todos'); setSearchTerm(''); }}>
                                    Ver todas las noticias
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.section>

                {/* Sidebar */}
                <aside className="nw-sidebar">
                    {/* Trending */}
                    <motion.div 
                        className="nw-trending"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="nw-sidebar__title">
                            <FaFire /> Tendencias
                        </h3>
                        <div className="nw-trending__list">
                            {trendingNews.map((n, index) => (
                                <motion.div 
                                    key={n.id}
                                    className="nw-trending__item"
                                    onClick={() => navigate(`/noticias/${n.id}`)}
                                    whileHover={{ x: 5 }}
                                >
                                    <span className="nw-trending__rank">{String(index + 1).padStart(2, '0')}</span>
                                    <div className="nw-trending__content">
                                        <span className="nw-trending__game">{n.game}</span>
                                        <h4>{n.title}</h4>
                                        <span className="nw-trending__views"><FaEye /> {n.views.toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Bookmarks */}
                    {bookmarks.length > 0 && (
                        <motion.div 
                            className="nw-bookmarks"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h3 className="nw-sidebar__title">
                                <FaBookmark /> Guardados ({bookmarks.length})
                            </h3>
                            <div className="nw-bookmarks__list">
                                {bookmarks.slice(0, 3).map(id => {
                                    const news = newsItems.find((n) => String(n.id) === String(id));
                                    if (!news) return null;
                                    return (
                                        <div 
                                            key={id}
                                            className="nw-bookmarks__item"
                                            onClick={() => navigate(`/noticias/${id}`)}
                                        >
                                            <img src={news.image} alt="" />
                                            <span>{news.title}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Newsletter */}
                    <motion.div 
                        className="nw-newsletter"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h3 className="nw-sidebar__title">
                            <FaNewspaper /> Newsletter
                        </h3>
                        <p>Recibe las últimas noticias directo en tu correo</p>
                        <input type="email" placeholder="tu@email.com" />
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => showToast('¡Suscrito correctamente!')}
                        >
                            Suscribirme
                        </motion.button>
                    </motion.div>

                    {/* Quick Categories */}
                    <motion.div 
                        className="nw-quick-cats"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <h3 className="nw-sidebar__title">Categorías</h3>
                        <div className="nw-quick-cats__list">
                            {CATEGORIES.filter(c => c.id !== 'Todos').map(c => {
                                const count = newsItems.filter((n) => n.category === c.id).length;
                                return (
                                    <motion.button 
                                        key={c.id}
                                        className={`nw-quick-cat ${category === c.id ? 'active' : ''}`}
                                        onClick={() => setCategory(c.id)}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <c.icon />
                                        <span>{c.label}</span>
                                        <span className="nw-quick-cat__count">{count}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </aside>
            </div>
        </div>
    );
}
