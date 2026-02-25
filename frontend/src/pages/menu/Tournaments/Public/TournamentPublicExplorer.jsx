import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import './TournamentPublic.css';

const TournamentPublicExplorer = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = async (q = '') => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/tournaments/public/search`, { params: { q } });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Error busqueda publica:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search('');
  }, []);

  return (
    <div className="tpv-page">
      <header className="tpv-hero tpe-hero">
        <div className="tpv-hero-content">
          <p className="tpv-chip"><i className='bx bx-search-alt-2'></i> Explorador publico</p>
          <h1>Busca torneos por ID o nombre</h1>
          <p className="tpv-meta-line">Comparte el enlace publico con tu comunidad y revisa lo que el organizador habilito.</p>
        </div>
      </header>

      <section className="tpv-card">
        <div className="tpe-searchbar">
          <input
            type="search"
            placeholder="Ej: TOR-123456 o MLBB Caribbean Clash"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={() => search(query)}>
            <i className='bx bx-search'></i>
            Buscar
          </button>
        </div>
      </section>

      {loading ? (
        <div className="tpv-empty">Buscando torneos...</div>
      ) : items.length === 0 ? (
        <div className="tpv-empty">No hay torneos publicos con ese criterio.</div>
      ) : (
        <section className="tpe-grid">
          {items.map((t) => (
            <article key={t.tournamentId} className="tpe-card">
              <div>
                <p className="tpv-chip tpe-id">#{t.tournamentId}</p>
                <h3>{t.title}</h3>
                <p>{t.game} · {t.status}</p>
              </div>
              <button onClick={() => navigate(`/tournaments/${t.tournamentId}`)}>
                Ver torneo
                <i className='bx bx-right-arrow-alt'></i>
              </button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default TournamentPublicExplorer;
