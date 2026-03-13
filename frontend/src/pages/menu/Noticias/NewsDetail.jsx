import React, { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaArrowLeft, FaChartLine, FaCommentDots, FaEye,
    FaGlobeAmericas, FaLayerGroup, FaRegClock, FaShareAlt,
    FaStar, FaBookmark, FaRegBookmark, FaHeart, FaRegHeart,
    FaTwitter, FaFacebook, FaCopy, FaCheck
} from 'react-icons/fa';
import PageHud from '../../../components/PageHud/PageHud';
import { ORGANISM_PATHS } from '../../../data/esportsOrganismsData';
import { DEFAULT_NEWS_COMPANY, getNewsFeed } from '../../../utils/customNews';
import './NewsDetail.css';

// Format date
const formatDate = (iso) => {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Escape regex special chars
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Linked keywords component
function LinkedKeywordsText({ text }) {
    const keys = Object.keys(ORGANISM_PATHS).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${keys.map(escapeRegex).join('|')})`, 'g');
    const parts = String(text || '').split(pattern);

    return parts.map((part, idx) => {
        const to = ORGANISM_PATHS[part];
        if (!to) return <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>;
        return (
            <Link key={`${part}-${idx}`} to={to} className="nd-keyword">
                <strong>{part}</strong>
            </Link>
        );
    });
}

// Format compact numbers
const formatCompact = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return String(value);
};

// Bubble component
const Bubbles = () => {
    return (
        <div className="nd-bubbles">
            {[...Array(12)].map((_, i) => (
                <div 
                    key={i} 
                    className="nd-bubble"
                    style={{
                        '--size': `${Math.random() * 80 + 30}px`,
                        '--left': `${Math.random() * 100}%`,
                        '--delay': `${Math.random() * 12}s`,
                        '--duration': `${Math.random() * 10 + 12}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default function NewsDetail() {
    const { id } = useParams();
    const [newsItems, setNewsItems] = useState(() => getNewsFeed());
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });
    const news = useMemo(
        () => newsItems.find((item) => String(item.id) === String(id)),
        [newsItems, id]
    );

    useEffect(() => {
        const loadFeed = () => setNewsItems(getNewsFeed());

        loadFeed();
        window.addEventListener('custom-news-updated', loadFeed);

        return () => window.removeEventListener('custom-news-updated', loadFeed);
    }, []);

    // Load saved state
    useEffect(() => {
        const bookmarks = JSON.parse(localStorage.getItem('news_bookmarks') || '[]');
        const likes = JSON.parse(localStorage.getItem('news_likes') || '{}');
        setIsBookmarked(bookmarks.some((bookmarkId) => String(bookmarkId) === String(id)));
        setIsLiked(!!likes[id]);
    }, [id]);

    // Show toast
    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    // Toggle bookmark
    const toggleBookmark = () => {
        const bookmarks = JSON.parse(localStorage.getItem('news_bookmarks') || '[]');
        const articleId = news?.id ?? id;
        const updated = isBookmarked
            ? bookmarks.filter((bookmarkId) => String(bookmarkId) !== String(articleId))
            : [...bookmarks, articleId];
        localStorage.setItem('news_bookmarks', JSON.stringify(updated));
        setIsBookmarked(!isBookmarked);
        showToast(isBookmarked ? 'Eliminado de guardados' : 'Guardado en favoritos');
    };

    // Toggle like
    const toggleLike = () => {
        const likes = JSON.parse(localStorage.getItem('news_likes') || '{}');
        likes[id] = !isLiked;
        localStorage.setItem('news_likes', JSON.stringify(likes));
        setIsLiked(!isLiked);
    };

    // Copy link
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        showToast('Link copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    // Share
    const shareArticle = () => {
        if (navigator.share) {
            navigator.share({ 
                title: news?.title, 
                url: window.location.href 
            });
        } else {
            copyLink();
        }
    };

    // Related news
    const relatedNews = useMemo(() => {
        if (!news) return [];
        return newsItems
            .filter((item) => item.id !== news.id && (item.game === news.game || item.category === news.category))
            .slice(0, 3);
    }, [news, newsItems]);

    // 404 state
    if (!news) {
        return (
            <div className="nd-page">
                <Bubbles />
                <div className="nd-ambient nd-ambient--1" />
                <div className="nd-ambient nd-ambient--2" />
                <PageHud page="NOTICIAS" />
                
                <motion.div 
                    className="nd-missing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1>Noticia no encontrada</h1>
                    <p>La noticia que buscas no existe o fue removida del portal.</p>
                    <Link to="/noticias" className="nd-back-btn">
                        <FaArrowLeft /> Volver a Noticias
                    </Link>
                </motion.div>
            </div>
        );
    }

    const storyDetails = Array.isArray(news.details) && news.details.length
        ? news.details
        : [news.excerpt].filter(Boolean);
    const galleryItems = Array.isArray(news.gallery) && news.gallery.length
        ? news.gallery
        : [news.image].filter(Boolean);
    const publisherName = news.company || DEFAULT_NEWS_COMPANY;
    const articleTags = Array.isArray(news.tags) ? news.tags.filter(Boolean).slice(0, 4) : [];
    const readMinutes = Math.max(2, Math.ceil((news.excerpt.length + storyDetails.join(' ').length) / 420));
    const highlightLines = storyDetails.slice(0, 3);

    return (
        <div className="nd-page">
            {/* Dynamic Bubbles */}
            <Bubbles />
            
            {/* Ambient gradients */}
            <div className="nd-ambient nd-ambient--1" />
            <div className="nd-ambient nd-ambient--2" />
            <div className="nd-ambient nd-ambient--3" />

            <PageHud page="NOTICIAS" />

            {/* Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        className="nd-toast"
                        initial={{ opacity: 0, y: -30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -30 }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="nd-shell">
                {/* Topbar */}
                <motion.div 
                    className="nd-topbar"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Link to="/noticias" className="nd-back-btn">
                        <FaArrowLeft /> Volver a Noticias
                    </Link>
                    <div className="nd-topbar__meta">
                        <span><FaRegClock /> {readMinutes} min lectura</span>
                        <span><FaShareAlt /> {publisherName}</span>
                    </div>
                </motion.div>

                {/* Hero Section */}
                <motion.article 
                    className="nd-hero"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="nd-hero__media">
                        <img src={news.image} alt={news.title} />
                        <div className="nd-hero__veil" />
                    </div>

                    <div className="nd-hero__content">
                        <div className="nd-tags">
                            {news.featured && <span className="nd-tag nd-tag--accent">Primicia</span>}
                            {news.isNew && <span className="nd-tag nd-tag--fresh">Nuevo</span>}
                            <span className="nd-tag">{news.category}</span>
                            <span className="nd-tag">{news.game}</span>
                            {articleTags.map((tag) => (
                                <span key={tag} className="nd-tag nd-tag--soft">{tag}</span>
                            ))}
                        </div>

                        <p className="nd-kicker">{publisherName}</p>
                        <h1><LinkedKeywordsText text={news.title} /></h1>
                        <p className="nd-lead"><LinkedKeywordsText text={news.excerpt} /></p>

                        <div className="nd-meta">
                            <span>{formatDate(news.date)}</span>
                            <span>{news.author}</span>
                            <span>{publisherName}</span>
                            <span>{news.views.toLocaleString()} vistas</span>
                            <span>{news.comments} comentarios</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="nd-hero__actions">
                        <motion.button 
                            onClick={toggleBookmark}
                            className={isBookmarked ? 'active' : ''}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isBookmarked ? <FaBookmark /> : <FaRegBookmark />}
                        </motion.button>
                        <motion.button 
                            onClick={toggleLike}
                            className={isLiked ? 'active liked' : ''}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isLiked ? <FaHeart /> : <FaRegHeart />}
                        </motion.button>
                        <motion.button 
                            onClick={shareArticle}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <FaShareAlt />
                        </motion.button>
                    </div>

                    {/* Stats Rail */}
                    <aside className="nd-hero__rail">
                        <div className="nd-statcard">
                            <small>Radar competitivo</small>
                            <strong>{news.game}</strong>
                            <p>Seguimiento en tiempo real del impacto competitivo e institucional.</p>
                        </div>
                        <div className="nd-statgrid">
                            <div className="nd-statbox">
                                <FaEye />
                                <strong>{formatCompact(news.views)}</strong>
                                <span>audiencia</span>
                            </div>
                            <div className="nd-statbox">
                                <FaCommentDots />
                                <strong>{news.comments}</strong>
                                <span>debate</span>
                            </div>
                            <div className="nd-statbox">
                                <FaLayerGroup />
                                <strong>{storyDetails.length}</strong>
                                <span>claves</span>
                            </div>
                            <div className="nd-statbox">
                                <FaChartLine />
                                <strong>{readMinutes}m</strong>
                                <span>lectura</span>
                            </div>
                        </div>
                    </aside>
                </motion.article>

                {/* Content Layout */}
                <div className="nd-layout">
                    <main className="nd-main">
                        {/* Highlights */}
                        <motion.section 
                            className="nd-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="nd-panel__head">
                                <span><FaStar /></span>
                                <h2>Lo esencial</h2>
                            </div>
                            <div className="nd-highlights">
                                {highlightLines.map((item, idx) => (
                                    <motion.article 
                                        key={`highlight-${idx}`} 
                                        className="nd-highlight"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + idx * 0.1 }}
                                    >
                                        <span className="nd-highlight__index">0{idx + 1}</span>
                                        <p><LinkedKeywordsText text={item} /></p>
                                    </motion.article>
                                ))}
                            </div>
                        </motion.section>

                        {/* Story */}
                        <motion.section 
                            className="nd-story"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="nd-story__intro">
                                <span className="nd-eyebrow">Análisis editorial</span>
                                <h2>Contexto y desarrollo</h2>
                            </div>

                            <div className="nd-copy">
                                <p className="nd-copy__lead">
                                    <LinkedKeywordsText text={news.excerpt} />
                                </p>
                                {storyDetails.map((paragraph, idx) => (
                                    <p key={`detail-${idx}`}>
                                        <LinkedKeywordsText text={paragraph} />
                                    </p>
                                ))}
                            </div>
                        </motion.section>

                        {/* Gallery */}
                        <motion.section 
                            className="nd-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="nd-panel__head">
                                <span><FaGlobeAmericas /></span>
                                <h2>Galería visual</h2>
                            </div>
                            <div className="nd-gallery">
                                {galleryItems.map((img, idx) => (
                                    <motion.figure 
                                        key={`gallery-${idx}`} 
                                        className={`nd-gallery__item nd-gallery__item--${(idx % 3) + 1}`}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <img src={img} alt={`${news.title} imagen ${idx + 1}`} loading="lazy" />
                                    </motion.figure>
                                ))}
                            </div>
                        </motion.section>

                        {/* Share bar */}
                        <motion.div 
                            className="nd-share-bar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span>Compartir:</span>
                            <div className="nd-share-bar__buttons">
                                <button onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(news.title)}`, '_blank')}>
                                    <FaTwitter />
                                </button>
                                <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}>
                                    <FaFacebook />
                                </button>
                                <button onClick={copyLink}>
                                    {copied ? <FaCheck /> : <FaCopy />}
                                </button>
                            </div>
                        </motion.div>
                    </main>

                    {/* Sidebar */}
                    <aside className="nd-sidebar">
                        <motion.section 
                            className="nd-sidecard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p className="nd-sidecard__label">Ficha</p>
                            <div className="nd-sidecard__row">
                                <span>Categoría</span>
                                <strong>{news.category}</strong>
                            </div>
                            <div className="nd-sidecard__row">
                                <span>Juego</span>
                                <strong>{news.game}</strong>
                            </div>
                            <div className="nd-sidecard__row">
                                <span>Publicado</span>
                                <strong>{formatDate(news.date)}</strong>
                            </div>
                            <div className="nd-sidecard__row">
                                <span>Autor</span>
                                <strong>{news.author}</strong>
                            </div>
                            <div className="nd-sidecard__row">
                                <span>Empresa</span>
                                <strong>{publisherName}</strong>
                            </div>
                            {articleTags.length > 0 && (
                                <div className="nd-sidecard__stack">
                                    <span>Tags</span>
                                    <div className="nd-sidecard__chips">
                                        {articleTags.map((tag) => (
                                            <span key={tag}>{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.section>

                        <motion.section 
                            className="nd-sidecard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="nd-sidecard__label">Cobertura relacionada</p>
                            {relatedNews.length > 0 ? (
                                <div className="nd-related">
                                    {relatedNews.map((item) => (
                                        <Link key={item.id} to={`/noticias/${item.id}`} className="nd-related__item">
                                            <img src={item.image} alt={item.title} loading="lazy" />
                                            <div>
                                                <span>{item.category}</span>
                                                <strong>{item.title}</strong>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="nd-related__empty">Aun no hay mas coberturas relacionadas para esta publicacion.</p>
                            )}
                        </motion.section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
