import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHud from '../../../components/PageHud/PageHud';
import { NEWS } from '../../../data/newsData';
import './Noticias.css';

const CATEGORIES = ['Todos', 'Torneos', 'Competitivo', 'Eventos', 'Institucional', 'Equipos'];
const GAMES = ['Todos', 'MLBB', 'Valorant', 'LoL', 'EA FC', 'Multigame'];

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function Noticias() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('Todos');
  const [game, setGame] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');

  const filtered = useMemo(() => {
    let rows = [...NEWS];
    if (category !== 'Todos') rows = rows.filter((n) => n.category === category);
    if (game !== 'Todos') rows = rows.filter((n) => n.game === game);
    rows.sort((a, b) => (sortBy === 'popular' ? b.views - a.views : new Date(b.date) - new Date(a.date)));
    return rows;
  }, [category, game, sortBy]);

  return (
    <div className="news-page">
      <PageHud page="NOTICIAS" />

      <section className="news-intro">
        <p className="news-intro-kicker">Esportefy Newsroom</p>
        <h1>Noticias competitivas en tiempo real para la escena gamer</h1>
        <p className="news-intro-text">
          Este portal centraliza primicias de torneos, equipos, parches y organismos oficiales de esports.
          Cada noticia abre ahora en su propia pagina para una lectura mas limpia y profesional.
        </p>
      </section>

      <section className="news-toolbar">
        <div className="news-tabs">
          {CATEGORIES.map((c) => (
            <button key={c} className={`news-tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="news-selectors">
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            {GAMES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Mas reciente</option>
            <option value="popular">Popularidad</option>
          </select>
        </div>
      </section>

      <section className="news-grid">
        {filtered.map((n, index) => (
          <article key={n.id} className={`news-card ${index === 0 ? 'news-card-xl' : ''}`}>
            <button
              type="button"
              className="news-card-hero"
              onClick={() => navigate(`/noticias/${n.id}`)}
              aria-label={`Abrir noticia: ${n.title}`}
            >
              <div className="news-card-media">
                <img src={n.image} alt={n.title} loading="lazy" />
              </div>
              <div className="news-card-overlay" />
              <div className="news-card-content">
                <div className="news-chip-row">
                  <span className="news-chip">{n.category}</span>
                  <span className="news-chip muted">{n.game}</span>
                </div>
                <h2>{n.title}</h2>
                <p>{n.excerpt}</p>
                <div className="news-meta">
                  <span>{formatDate(n.date)}</span>
                  <span>{n.author}</span>
                  <span>{n.views.toLocaleString()} vistas</span>
                </div>
                <span className="news-expand-hint">Abrir noticia completa</span>
              </div>
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
