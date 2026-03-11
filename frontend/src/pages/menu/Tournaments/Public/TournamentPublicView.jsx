import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { formatTournamentPublicId } from '../../../../utils/publicIds';
import { normalizeSupportedGameName } from '../../../../../../shared/supportedGames.js';
import './TournamentPublic.css';

const LOCAL_TOURNAMENTS_KEY = 'esportefy_local_tournaments';

const getLocalTournamentByCode = (code) => {
  try {
    const raw = localStorage.getItem(LOCAL_TOURNAMENTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return null;
    return list.find((item) => String(item?.tournamentId || '').toUpperCase() === String(code || '').toUpperCase()) || null;
  } catch {
    return null;
  }
};

const mapLocalToPublicShape = (item) => ({
  tournamentId: item.tournamentId,
  title: item.title,
  game: item.game,
  status: item.status || 'open',
  description: item.description || '',
  modality: item.modality || '',
  format: item.format || '',
  date: item.date || null,
  time: item.time || '',
  timezone: item.timezone || '',
  slots: {
    current: Number(item.currentSlots || 0),
    max: Number(item.maxSlots || 0),
  },
  customMessage: item.publicSettings?.customMessage || '',
  publicSettings: item.publicSettings || {},
  prizeMode: item.prizeMode || 'none',
  prizeDetails: item.prizeDetails || '',
  prizePool: item.prizePool || '',
  currency: item.currency || 'USD',
  prizesByRank: item.prizesByRank || {},
  sponsors: Array.isArray(item.sponsors) ? item.sponsors : [],
  contact: item.contact || {},
  broadcast: item.broadcast || {},
  rulesPdf: item.rulesPdf || '',
  registrations: Array.isArray(item.registrations) ? item.registrations : [],
  bracket: item.bracket || null,
});

const STATUS_LABELS = {
  open: 'Abierto',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
  draft: 'Borrador',
};

const formatDate = (value) => {
  if (!value) return 'Fecha por anunciar';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Fecha por anunciar';
  return parsed.toLocaleDateString('es-DO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const PublicBracketBoard = ({ bracket, game }) => (
  <div className="tpv-stage">
    <div className="tpv-stage__backdrop" />
    <div className="tpv-stage__brand">
      <span>{game}</span>
      <strong>{bracket?.title || 'Bracket'}</strong>
    </div>

    <div className="tpv-stage__board">
      {(bracket?.rounds || []).map((round, roundIndex) => (
        <div key={`round-${roundIndex}`} className="tpv-stage__column">
          <div className="tpv-stage__round-head">
            <h3>{round.name || `Ronda ${roundIndex + 1}`}</h3>
            <span>{(round.matches || []).length} matches</span>
          </div>

          <div className="tpv-stage__matches">
            {(round.matches || []).map((match, matchIndex) => (
              <article key={`match-${roundIndex}-${matchIndex}`} className="tpv-stage__match">
                <div className="tpv-stage__match-top">
                  <span>{`MATCH ${matchIndex + 1}`}</span>
                  <small>{match.scheduledLabel || 'Sin horario'}</small>
                </div>
                <div className="tpv-stage__team-row">
                  <strong>{match.teamA || 'TBD'}</strong>
                  <span>{match.scoreA || 0}</span>
                </div>
                <div className="tpv-stage__team-row">
                  <strong>{match.teamB || 'TBD'}</strong>
                  <span>{match.scoreB || 0}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

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
        const response = await axios.get(`${API_URL}/api/tournaments/public/${code}`);
        setData(response.data);
      } catch (loadError) {
        const local = getLocalTournamentByCode(code);
        if (local) {
          setData(mapLocalToPublicShape(local));
          setError('');
        } else {
          setError(loadError.response?.data?.message || 'No fue posible cargar este torneo.');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [code]);

  const highlights = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Juego', value: data.game || '-' },
      { label: 'Formato', value: data.format || '-' },
      { label: 'Modalidad', value: data.modality || '-' },
      { label: 'Equipos', value: `${data.slots?.current ?? 0}/${data.slots?.max ?? 0}` },
    ];
  }, [data]);

  if (loading) return <div className="tpv-page"><div className="tpv-empty">Cargando torneo...</div></div>;
  if (error) return <div className="tpv-page"><div className="tpv-empty">{error}</div></div>;
  if (!data) return <div className="tpv-page"><div className="tpv-empty">Sin datos del torneo.</div></div>;

  const settings = data.publicSettings || {};
  const showPrize = settings.showPrize !== false;
  const showSponsors = settings.showSponsors !== false;
  const showRules = settings.showRules !== false;
  const showContact = settings.showContact !== false;
  const showTeams = settings.showTeams === true;
  const showBracket = settings.showBracket !== false;
  const displaySponsors = Array.isArray(data.sponsors) ? data.sponsors : [];
  const displayRegistrations = Array.isArray(data.registrations) ? data.registrations : [];
  const isValorantTournament = normalizeSupportedGameName(data.game) === 'Valorant';

  return (
    <div className="tpv-page">
      <section className="tpv-showcase">
        <div className="tpv-showcase__copy">
          <p className="tpv-chip"><i className="bx bx-trophy" /> Torneo oficial</p>
          <h1>{data.title}</h1>
          <p className="tpv-meta-line">
            {formatTournamentPublicId(data)} - {data.game} - {STATUS_LABELS[data.status] || 'Publicado'}
          </p>
          <p className="tpv-lead">
            {data.customMessage || data.description || 'Competencia organizada para equipos, comunidad y transmision en directo.'}
          </p>
          <div className="tpv-showcase__actions">
            {data.rulesPdf ? <a className="tpv-cta" href={data.rulesPdf} target="_blank" rel="noreferrer">Ver reglamento</a> : null}
            {data.broadcast?.streamUrl ? <a className="tpv-cta tpv-cta--ghost" href={data.broadcast.streamUrl} target="_blank" rel="noreferrer">Ver stream</a> : null}
          </div>
        </div>

        <aside className="tpv-showcase__side">
          <div className="tpv-event-card">
            <span>Fecha</span>
            <strong>{formatDate(data.date)}</strong>
            <p>{data.time || 'Hora por anunciar'} {data.timezone || ''}</p>
          </div>
          <div className="tpv-event-card">
            <span>Participacion</span>
            <strong>{data.slots?.current ?? 0}/{data.slots?.max ?? 0}</strong>
            <p>{STATUS_LABELS[data.status] || 'Publicado'}</p>
          </div>
        </aside>
      </section>

      <section className="tpv-highlights">
        {highlights.map((item) => (
          <article key={item.label} className="tpv-highlight">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      {isValorantTournament ? (
        <section className="tpv-disclaimer" aria-label="VALORANT tournament disclaimer">
          <span className="tpv-disclaimer__eyebrow">VALORANT Community Competition</span>
          <p>
            This competition is not affiliated with or sponsored by Riot Games, Inc. or VALORANT Esports.
          </p>
        </section>
      ) : null}

      <div className="tpv-layout">
        <div className="tpv-main">
          <section className="tpv-card tpv-card--feature">
            <div className="tpv-card__topline">
              <span className="tpv-chip tpv-chip--soft">Vista general</span>
            </div>
            <h2>Produccion y narrativa del torneo</h2>
            <p className="tpv-desc">
              {data.description || 'Torneo competitivo preparado para exhibicion publica, seguimiento de llaves y lectura clara de participantes.'}
            </p>
          </section>

          {showBracket && data.bracket ? (
            <section className="tpv-card tpv-card--bracket">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Bracket oficial</span>
              </div>
              <h2>{data.bracket.title || 'Bracket principal'}</h2>
              <PublicBracketBoard bracket={data.bracket} game={data.game} />
            </section>
          ) : null}

          {showTeams ? (
            <section className="tpv-card">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Participantes</span>
              </div>
              <h2>Equipos en competencia</h2>
              {displayRegistrations.length === 0 ? (
                <div className="tpv-empty">No hay equipos publicos.</div>
              ) : (
                <div className="tpv-list">
                  {displayRegistrations.map((item) => (
                    <article key={item._id || item.teamName} className="tpv-row">
                      <div>
                        <strong>{item.teamName}</strong>
                        <p>Equipo inscrito</p>
                      </div>
                      <span className="tpv-tag">{item.status}</span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>

        <aside className="tpv-sidebar">
          {showPrize ? (
            <section className="tpv-card">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Premios</span>
              </div>
              <h2>Prize pool</h2>
              {data.prizePool ? (
                <p className="tpv-prize-main">{data.prizePool} {data.currency || ''}</p>
              ) : (
                <p className="tpv-muted">Sin premio en efectivo.</p>
              )}
              {data.prizeDetails ? <p className="tpv-muted">{data.prizeDetails}</p> : null}
              {(data.prizesByRank?.first || data.prizesByRank?.second || data.prizesByRank?.third) ? (
                <div className="tpv-rank-grid">
                  <div className="tpv-mini"><span>1er lugar</span><strong>{data.prizesByRank?.first || '-'}</strong></div>
                  <div className="tpv-mini"><span>2do lugar</span><strong>{data.prizesByRank?.second || '-'}</strong></div>
                  <div className="tpv-mini"><span>3er lugar</span><strong>{data.prizesByRank?.third || '-'}</strong></div>
                </div>
              ) : null}
            </section>
          ) : null}

          {showContact ? (
            <section className="tpv-card">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Contacto</span>
              </div>
              <h2>Canales oficiales</h2>
              <div className="tpv-stack">
                <div className="tpv-mini">
                  <span>Organizador</span>
                  <strong>{data.contact?.email || 'Sin correo publicado'}</strong>
                </div>
                <div className="tpv-mini">
                  <span>Stream</span>
                  <strong>{data.broadcast?.channelName || data.broadcast?.streamUrl || 'Sin canal definido'}</strong>
                </div>
              </div>
            </section>
          ) : null}

          {showRules ? (
            <section className="tpv-card">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Reglas</span>
              </div>
              <h2>Documentacion</h2>
              {data.rulesPdf ? (
                <a className="tpv-link" href={data.rulesPdf} target="_blank" rel="noreferrer">Abrir reglamento del torneo</a>
              ) : (
                <p className="tpv-muted">Aun no se ha publicado un reglamento.</p>
              )}
            </section>
          ) : null}

          {showSponsors && displaySponsors.length > 0 ? (
            <section className="tpv-card">
              <div className="tpv-card__topline">
                <span className="tpv-chip tpv-chip--soft">Aliados</span>
              </div>
              <h2>Sponsors</h2>
              <div className="tpv-list">
                {displaySponsors.map((item, index) => (
                  <article key={`sponsor-${index}`} className="tpv-row">
                    <div>
                      <strong>{item.name || 'Sponsor'}</strong>
                      <p>{item.tier || 'Partner'}</p>
                    </div>
                    {item.link ? <a className="tpv-link" href={item.link} target="_blank" rel="noreferrer">Visitar</a> : null}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
};

export default TournamentPublicView;
