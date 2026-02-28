import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { formatTournamentPublicId } from '../../../../utils/publicIds';
import './TournamentPublic.css';

const LOCAL_TOURNAMENTS_KEY = 'esportefy_local_tournaments';

const getLocalTournamentByCode = (code) => {
  try {
    const raw = localStorage.getItem(LOCAL_TOURNAMENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return null;
    return list.find((t) => String(t?.tournamentId || '').toUpperCase() === String(code || '').toUpperCase()) || null;
  } catch {
    return null;
  }
};

const mapLocalToPublicShape = (t) => ({
  tournamentId: t.tournamentId,
  title: t.title,
  game: t.game,
  status: t.status || 'open',
  description: t.description || '',
  modality: t.modality || '',
  format: t.format || '',
  date: t.date || null,
  time: t.time || '',
  timezone: t.timezone || '',
  slots: {
    current: Number(t.currentSlots || 0),
    max: Number(t.maxSlots || 0)
  },
  customMessage: t.publicSettings?.customMessage || 'Vista local de prueba.',
  prizeMode: t.prizeMode || 'none',
  prizeDetails: t.prizeDetails || '',
  prizePool: t.prizePool || '',
  currency: t.currency || 'USD',
  prizesByRank: t.prizesByRank || {},
  sponsors: Array.isArray(t.sponsors) ? t.sponsors : [],
  contact: t.contact || {},
  broadcast: t.broadcast || {},
  rulesPdf: t.rulesPdf || '',
  registrations: Array.isArray(t.registrations) ? t.registrations : [],
  bracket: t.bracket || null
});

const STATUS_LABELS = {
  open: 'Abierto',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  draft: 'Borrador'
};

const TournamentPublicView = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await axios.get(`${API_URL}/api/tournaments/public/${code}`);
        setData(res.data);
      } catch (e) {
        const local = getLocalTournamentByCode(code);
        if (local) {
          setData(mapLocalToPublicShape(local));
          setError('');
        } else {
          setError(e.response?.data?.message || 'No fue posible cargar este torneo.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [code]);

  if (loading) return <div className="tpv-page"><div className="tpv-empty">Cargando torneo...</div></div>;
  if (error) return <div className="tpv-page"><div className="tpv-empty">{error}</div></div>;
  if (!data) return <div className="tpv-page"><div className="tpv-empty">Sin datos del torneo.</div></div>;

  return (
    <div className="tpv-page">
      <header className="tpv-hero">
        <div className="tpv-hero-content">
          <p className="tpv-chip"><i className='bx bx-globe'></i> Vista publica del torneo</p>
          <h1>{data.title}</h1>
          <p className="tpv-meta-line">{formatTournamentPublicId(data)} · {data.game} · {STATUS_LABELS[data.status] || 'Publicado'}</p>
          {data.customMessage ? <p className="tpv-note">{data.customMessage}</p> : null}
        </div>
        <div className="tpv-hero-side">
          <div className="tpv-kpi">
            <span>Cupos</span>
            <strong>{data.slots?.current ?? 0}/{data.slots?.max ?? 0}</strong>
          </div>
          <div className="tpv-kpi">
            <span>Fecha</span>
            <strong>{data.date ? new Date(data.date).toLocaleDateString() : '-'}</strong>
          </div>
          <div className="tpv-kpi">
            <span>Hora</span>
            <strong>{data.time || '-'} {data.timezone || ''}</strong>
          </div>
        </div>
      </header>

      <section className="tpv-card">
        <h2><i className='bx bx-info-circle'></i> Informacion general</h2>
        <p className="tpv-desc">{data.description || 'Sin descripcion publica.'}</p>
        <div className="tpv-grid">
          <div className="tpv-mini"><span>Formato</span><strong>{data.format || '-'}</strong></div>
          <div className="tpv-mini"><span>Modalidad</span><strong>{data.modality || '-'}</strong></div>
          <div className="tpv-mini"><span>ID torneo</span><strong>{formatTournamentPublicId(data)}</strong></div>
        </div>
      </section>

      {(data.prizePool !== undefined || data.prizeDetails) && (
        <section className="tpv-card">
          <h2><i className='bx bx-trophy'></i> Premios</h2>
          {data.prizePool ? <p className="tpv-prize-main">{data.prizePool} {data.currency || ''}</p> : <p className="tpv-muted">Sin premio en efectivo.</p>}
          {data.prizeDetails ? <p className="tpv-muted">{data.prizeDetails}</p> : null}
          {(data.prizesByRank?.first || data.prizesByRank?.second || data.prizesByRank?.third) && (
            <div className="tpv-grid">
              <div className="tpv-mini"><span>1er lugar</span><strong>{data.prizesByRank?.first || '-'}</strong></div>
              <div className="tpv-mini"><span>2do lugar</span><strong>{data.prizesByRank?.second || '-'}</strong></div>
              <div className="tpv-mini"><span>3er lugar</span><strong>{data.prizesByRank?.third || '-'}</strong></div>
            </div>
          )}
        </section>
      )}

      {Array.isArray(data.sponsors) && data.sponsors.length > 0 && (
        <section className="tpv-card">
          <h2><i className='bx bx-diamond'></i> Sponsors</h2>
          <div className="tpv-list">
            {data.sponsors.map((s, i) => (
              <article key={`sp-${i}`} className="tpv-row">
                <div>
                  <strong>{s.name || 'Sponsor'}</strong>
                  <p>{s.tier || 'Partner'}</p>
                </div>
                {s.link ? <a className="tpv-link" href={s.link} target="_blank" rel="noreferrer">Sitio web</a> : null}
              </article>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(data.registrations) && (
        <section className="tpv-card">
          <h2><i className='bx bx-group'></i> Equipos</h2>
          {data.registrations.length === 0 ? <div className="tpv-empty">No hay equipos publicos.</div> : (
            <div className="tpv-list">
              {data.registrations.map((r) => (
                <article key={r._id || r.teamName} className="tpv-row">
                  <strong>{r.teamName}</strong>
                  <span className="tpv-tag">{r.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {data.bracket && (
        <section className="tpv-card">
          <h2><i className='bx bx-sitemap'></i> {data.bracket.title || 'Bracket'}</h2>
          {(data.bracket.rounds || []).map((round, i) => (
            <div key={`round-${i}`} className="tpv-round">
              <h3>{round.name || `Ronda ${i + 1}`}</h3>
              {(round.matches || []).map((m, j) => (
                <div key={`m-${j}`} className="tpv-match">
                  <div>
                    <strong>{m.teamA || 'TBD'}</strong>
                    <span>{m.scoreA || 0}</span>
                  </div>
                  <span>VS</span>
                  <div>
                    <strong>{m.teamB || 'TBD'}</strong>
                    <span>{m.scoreB || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default TournamentPublicView;
