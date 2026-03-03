import React, { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaChartLine,
  FaCommentDots,
  FaEye,
  FaGlobeAmericas,
  FaLayerGroup,
  FaRegClock,
  FaShareAlt,
  FaStar,
} from 'react-icons/fa';
import PageHud from '../../../components/PageHud/PageHud';
import { NEWS } from '../../../data/newsData';
import { ORGANISM_PATHS } from '../../../data/esportsOrganismsData';
import './NewsDetail.css';

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function LinkedKeywordsText({ text }) {
  const keys = Object.keys(ORGANISM_PATHS).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${keys.map(escapeRegex).join('|')})`, 'g');
  const parts = String(text || '').split(pattern);

  return parts.map((part, idx) => {
    const to = ORGANISM_PATHS[part];
    if (!to) return <React.Fragment key={`${part}-${idx}`}>{part}</React.Fragment>;
    return (
      <Link key={`${part}-${idx}`} to={to} className="detail-keyword">
        <strong>{part}</strong>
      </Link>
    );
  });
}

const formatCompact = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

export default function NewsDetail() {
  const { id } = useParams();
  const news = NEWS.find((n) => String(n.id) === String(id));

  const relatedNews = useMemo(() => {
    if (!news) return [];
    return NEWS.filter((item) => item.id !== news.id && (item.game === news.game || item.category === news.category)).slice(0, 3);
  }, [news]);

  if (!news) {
    return (
      <section className="news-detail-page">
        <PageHud page="NOTICIAS" />
        <div className="news-detail-missing">
          <h1>Noticia no encontrada</h1>
          <p>La noticia que buscas no existe o fue removida del portal.</p>
          <Link to="/noticias" className="news-detail-back">
            <FaArrowLeft /> Volver a Noticias
          </Link>
        </div>
      </section>
    );
  }

  const readMinutes = Math.max(2, Math.ceil((news.excerpt.length + news.details.join(' ').length) / 420));
  const highlightLines = news.details.slice(0, 3);

  return (
    <section className="news-detail-page">
      <PageHud page="NOTICIAS" />

      <div className="news-detail-ambient news-detail-ambient--one" />
      <div className="news-detail-ambient news-detail-ambient--two" />

      <div className="news-detail-shell">
        <div className="news-detail-topbar">
          <Link to="/noticias" className="news-detail-back">
            <FaArrowLeft /> Volver a Noticias
          </Link>
          <div className="news-detail-topbar__meta">
            <span><FaRegClock /> {readMinutes} min lectura</span>
            <span><FaShareAlt /> Editorial Esportefy</span>
          </div>
        </div>

        <article className="news-detail-hero">
          <div className="news-detail-hero__media">
            <img src={news.image} alt={news.title} />
            <div className="news-detail-hero__veil" />
            <div className="news-detail-hero__grid" />
          </div>

          <div className="news-detail-hero__content">
            <div className="news-detail-tags">
              <span>{news.category}</span>
              <span>{news.game}</span>
              <span className="news-detail-tags__accent">Breaking Desk</span>
            </div>

            <p className="news-detail-kicker">Cobertura especial</p>
            <h1>
              <LinkedKeywordsText text={news.title} />
            </h1>

            <p className="news-detail-lead">
              <LinkedKeywordsText text={news.excerpt} />
            </p>

            <div className="news-detail-meta">
              <span>{formatDate(news.date)}</span>
              <span>{news.author}</span>
              <span>{news.views.toLocaleString()} vistas</span>
              <span>{news.comments} comentarios</span>
            </div>
          </div>

          <aside className="news-detail-hero__rail">
            <div className="news-detail-statcard">
              <small>Radar competitivo</small>
              <strong>{news.game}</strong>
              <p>Seguimiento en tiempo real del impacto competitivo e institucional de esta historia.</p>
            </div>
            <div className="news-detail-statgrid">
              <div className="news-detail-statbox">
                <FaEye />
                <strong>{formatCompact(news.views)}</strong>
                <span>audiencia</span>
              </div>
              <div className="news-detail-statbox">
                <FaCommentDots />
                <strong>{news.comments}</strong>
                <span>debate</span>
              </div>
              <div className="news-detail-statbox">
                <FaLayerGroup />
                <strong>{news.details.length}</strong>
                <span>claves</span>
              </div>
              <div className="news-detail-statbox">
                <FaChartLine />
                <strong>{readMinutes}m</strong>
                <span>lectura</span>
              </div>
            </div>
          </aside>
        </article>

        <div className="news-detail-layout">
          <main className="news-detail-main">
            <section className="news-detail-panel news-detail-panel--highlights">
              <div className="news-detail-panel__head">
                <span><FaStar /></span>
                <h2>Lo esencial</h2>
              </div>
              <div className="news-detail-highlights">
                {highlightLines.map((item, idx) => (
                  <article key={`${news.id}-highlight-${idx}`} className="news-detail-highlight">
                    <span className="news-detail-highlight__index">0{idx + 1}</span>
                    <p><LinkedKeywordsText text={item} /></p>
                  </article>
                ))}
              </div>
            </section>

            <section className="news-detail-story">
              <div className="news-detail-story__intro">
                <span className="news-detail-story__eyebrow">Analisis editorial</span>
                <h2>Contexto y desarrollo</h2>
              </div>

              <div className="news-detail-copy">
                <p className="news-detail-copy__lead">
                  <LinkedKeywordsText text={news.excerpt} />
                </p>
                {news.details.map((paragraph, idx) => (
                  <p key={`${news.id}-detail-${idx}`}>
                    <LinkedKeywordsText text={paragraph} />
                  </p>
                ))}
              </div>
            </section>

            <section className="news-detail-panel">
              <div className="news-detail-panel__head">
                <span><FaGlobeAmericas /></span>
                <h2>Galeria visual</h2>
              </div>
              <div className="news-detail-gallery">
                {news.gallery.map((img, idx) => (
                  <figure key={`${news.id}-gallery-${idx}`} className={`news-detail-gallery__item news-detail-gallery__item--${(idx % 3) + 1}`}>
                    <img src={img} alt={`${news.title} imagen ${idx + 1}`} loading="lazy" />
                  </figure>
                ))}
              </div>
            </section>
          </main>

          <aside className="news-detail-sidebar">
            <section className="news-detail-sidecard">
              <p className="news-detail-sidecard__label">Ficha</p>
              <div className="news-detail-sidecard__row">
                <span>Categoria</span>
                <strong>{news.category}</strong>
              </div>
              <div className="news-detail-sidecard__row">
                <span>Juego</span>
                <strong>{news.game}</strong>
              </div>
              <div className="news-detail-sidecard__row">
                <span>Publicado</span>
                <strong>{formatDate(news.date)}</strong>
              </div>
              <div className="news-detail-sidecard__row">
                <span>Autor</span>
                <strong>{news.author}</strong>
              </div>
            </section>

            <section className="news-detail-sidecard">
              <p className="news-detail-sidecard__label">Cobertura relacionada</p>
              <div className="news-detail-related">
                {relatedNews.map((item) => (
                  <Link key={item.id} to={`/noticias/${item.id}`} className="news-detail-related__item">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <div>
                      <span>{item.category}</span>
                      <strong>{item.title}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
