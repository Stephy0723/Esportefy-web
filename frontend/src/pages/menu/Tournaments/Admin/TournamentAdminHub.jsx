import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { formatTournamentPublicId, matchesTournamentPublicId } from '../../../../utils/publicIds';
import './TournamentAdmin.css';

const TournamentAdminHub = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tournaments/manage/mine`);
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Error cargando torneos administrables:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((t) =>
      String(t.title || '').toLowerCase().includes(q) ||
      String(t.tournamentId || '').toLowerCase().includes(q) ||
      matchesTournamentPublicId(t, q) ||
      String(t.game || '').toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="ta-page">
      <header className="ta-header">
        <h1>Panel de torneos</h1>
        <p>Administra visibilidad pública, equipos y brackets.</p>
      </header>

      <div className="ta-toolbar">
        <input
          type="search"
          placeholder="Buscar por TOR-ID, nombre o juego"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={() => navigate('/create-tournament')}>Crear torneo</button>
      </div>

      {loading ? (
        <div className="ta-empty">Cargando torneos...</div>
      ) : filtered.length === 0 ? (
        <div className="ta-empty">No hay torneos para administrar.</div>
      ) : (
        <div className="ta-grid">
          {filtered.map((t) => (
            <article key={t._id || t.tournamentId} className="ta-card">
              <div>
                <span className="ta-id">{formatTournamentPublicId(t)}</span>
                <h3>{t.title}</h3>
                <p>{t.game} · {t.status}</p>
              </div>
              <div className="ta-card-actions">
                <button onClick={() => navigate(`/tournaments/manage/${t.tournamentId}`)}>Gestionar</button>
                <button
                  className="ghost"
                  onClick={() => navigate(`/torneos/publicos/${t.tournamentId}`)}
                >
                  Ver público
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentAdminHub;
