import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { formatTournamentPublicId, matchesTournamentPublicId } from '../../../../utils/publicIds';
import './TournamentAdmin.css';

const STATUS_META = {
  open: { label: 'Abierto', tone: 'open' },
  ongoing: { label: 'En curso', tone: 'ongoing' },
  finished: { label: 'Finalizado', tone: 'finished' },
  cancelled: { label: 'Cancelado', tone: 'cancelled' },
};

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sin fecha';
  return parsed.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const TournamentAdminHub = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tournaments/manage/mine`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error('Error cargando torneos administrables:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

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

  const metrics = useMemo(() => {
    const openCount = items.filter((item) => item.status === 'open').length;
    const ongoingCount = items.filter((item) => item.status === 'ongoing').length;
    const totalTeams = items.reduce((acc, item) => acc + Number(item.currentSlots || 0), 0);

    return [
      { label: 'Torneos totales', value: items.length },
      { label: 'Abiertos', value: openCount },
      { label: 'En curso', value: ongoingCount },
      { label: 'Equipos inscritos', value: totalTeams },
    ];
  }, [items]);

  return (
    <div className="ta-page">
      <section className="ta-hero">
        <div className="ta-hero__main">
          <span className="ta-kicker">Panel de torneos</span>
          <h1>Gestiona tus torneos sin perder visibilidad del estado real.</h1>
          <p>
            Revisa rapidamente que torneo esta abierto, cuantos equipos lleva y entra directo
            a gestion o vista publica sin depender de una lista plana.
          </p>
        </div>

        <div className="ta-hero__metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="ta-metric">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="ta-toolbar">
        <label className="ta-search">
          <i className="bx bx-search" />
          <input
            type="search"
            placeholder="Buscar por ID, nombre o juego"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <button onClick={() => navigate('/create-tournament')}>Crear torneo</button>
      </div>

      {loading ? (
        <div className="ta-empty">Cargando torneos...</div>
      ) : filtered.length === 0 ? (
        <div className="ta-empty">No hay torneos para administrar.</div>
      ) : (
        <div className="ta-grid">
          {filtered.map((t) => {
            const status = STATUS_META[t.status] || { label: t.status || 'Sin estado', tone: 'open' };
            const slotsCurrent = Number(t.currentSlots || 0);
            const slotsMax = Number(t.maxSlots || 0);
            const progress = slotsMax > 0 ? Math.min((slotsCurrent / slotsMax) * 100, 100) : 0;

            return (
              <article key={t._id || t.tournamentId} className="ta-card">
                <div className="ta-card__top">
                  <span className="ta-id">{formatTournamentPublicId(t)}</span>
                  <span className={`ta-status ta-status--${status.tone}`}>{status.label}</span>
                </div>

                <div className="ta-card__body">
                  <h3>{t.title}</h3>
                  <p className="ta-card__game">{t.game || 'Juego no definido'}</p>

                  <div className="ta-card__meta">
                    <span><i className="bx bx-calendar" /> {formatDate(t.date)}</span>
                    <span><i className="bx bx-group" /> {slotsCurrent}/{slotsMax || 0} equipos</span>
                  </div>

                  <div className="ta-card__progress">
                    <div className="ta-card__progress-bar">
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <small>{progress.toFixed(0)}% de cupos ocupados</small>
                  </div>
                </div>

                <div className="ta-card-actions">
                  <button onClick={() => navigate(`/tournaments/manage/${t.tournamentId}`)}>Gestionar</button>
                  <button
                    className="ghost"
                    onClick={() => navigate(`/torneos/publicos/${t.tournamentId}`)}
                  >
                    Ver publico
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TournamentAdminHub;
