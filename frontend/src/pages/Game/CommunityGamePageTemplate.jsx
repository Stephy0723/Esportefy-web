import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaBolt,
  FaChevronRight,
  FaGlobe,
  FaShieldAlt,
  FaSignInAlt,
  FaTrophy,
  FaUsers,
  FaCalendarAlt,
  FaBuilding,
} from 'react-icons/fa';
import { useTheme } from '../../context/ThemeContext';
import { normalizeCommunityGameId } from '../../../../shared/communityCatalog.js';
import { getTournamentFormatLabel } from '../../../../shared/tournamentCatalog.js';
import { fetchGameHubDetails, formatGameHubCount, joinGameHub } from '../menu/Community/gameHub.service';
import { decorateCommunityGame } from '../menu/Community/communityGameAssets';
import './CommunityGamePageTemplate.css';

const formatDate = (value) => {
  if (!value) return 'Proximamente';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Proximamente'
    : date.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPrize = (value, currency = 'USD') => {
  if (!value) return 'Por definir';
  const prize = String(value || '').trim();
  return !prize || prize === '0' ? 'Gratis' : `${prize} ${currency}`;
};

const STATUS_LABELS = {
  draft: 'Borrador',
  open: 'Abierto',
  ongoing: 'En curso',
  finished: 'Finalizado',
  cancelled: 'Cancelado'
};

const emptyDetails = {
  game: null,
  stats: { gameId: '', usersCount: 0, activeCount: 0, joined: false },
  teams: [],
  tournaments: [],
  communities: [],
  organizers: []
};

const CommunityGamePageTemplate = () => {
  const { gameId: rawId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const hubId = normalizeCommunityGameId(rawId) || String(rawId || '').trim().toLowerCase();

  const [loading, setLoading] = useState(true);
  const [joiningHub, setJoiningHub] = useState(false);
  const [data, setData] = useState(emptyDetails);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      try {
        setLoading(true);
        const response = await fetchGameHubDetails(hubId);
        if (cancelled) return;
        setData({
          game: response.game ? decorateCommunityGame(response.game) : null,
          stats: response.stats || emptyDetails.stats,
          teams: Array.isArray(response.teams) ? response.teams : [],
          tournaments: Array.isArray(response.tournaments) ? response.tournaments : [],
          communities: Array.isArray(response.communities) ? response.communities : [],
          organizers: Array.isArray(response.organizers) ? response.organizers : []
        });
      } catch {
        if (!cancelled) {
          setData(emptyDetails);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (hubId) {
      loadDetails();
    } else {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [hubId]);

  const handleJoin = useCallback(async () => {
    if (!hubId || joiningHub) return;
    try {
      setJoiningHub(true);
      const response = await joinGameHub(hubId);
      setData((prev) => ({ ...prev, stats: response.stats || prev.stats }));
    } finally {
      setJoiningHub(false);
    }
  }, [hubId, joiningHub]);

  if (loading) {
    return (
      <div className={`gh theme-${theme || 'dark'}`} style={{ '--accent': '#8EDB15' }}>
        <div className="gh-body">
          <div className="gh-loader"><div className="gh-loader__spin" /><p>Cargando hub...</p></div>
        </div>
      </div>
    );
  }

  if (!data.game) {
    return (
      <div className={`gh theme-${theme || 'dark'}`} style={{ '--accent': '#8EDB15' }}>
        <div className="gh-body">
          <div className="gh-empty">
            <p>No encontramos un hub real para este juego.</p>
            <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/comunidad')}>
              Volver a comunidad
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { game, stats, teams, tournaments, communities, organizers } = data;
  const name = game.name || 'Game Hub';
  const banner = game.img || game.imageUrl || '';
  const accent = game.color || '#8EDB15';
  const developer = game.company || 'Studio';
  const category = game.category || 'Competitivo';
  const platform = Array.isArray(game?.taxonomy?.platform) && game.taxonomy.platform.length > 0
    ? game.taxonomy.platform.join(', ')
    : 'pc';

  return (
    <div className={`gh theme-${theme || 'dark'}`} style={{ '--accent': accent }}>
      <section className="gh-hero">
        <div className="gh-hero__bg">
          {banner && <img src={banner} alt={name} className="gh-hero__img" />}
          <div className="gh-hero__fade" />
        </div>

        <div className="gh-hero__inner">
          <button type="button" className="gh-back" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Volver
          </button>

          <div className="gh-hero__content">
            <span className="gh-badge-accent"><span className="gh-pulse" /> GAME HUB</span>
            <h1 className="gh-hero__title">{name}</h1>
            <p className="gh-hero__sub">
              {game.history || `${name} tiene un hub activo con comunidades, equipos y torneos conectados al backend.`}
            </p>

            <div className="gh-hero__meta">
              <span><FaBuilding /> {developer}</span>
              <span><FaGlobe /> {category}</span>
              <span><FaBolt /> {platform}</span>
            </div>

            <div className="gh-hero__stats">
              <div className="gh-hero__stat">
                <strong>{formatGameHubCount(stats.usersCount)}</strong>
                <span>Jugadores</span>
              </div>
              <div className="gh-hero__stat">
                <strong>{formatGameHubCount(stats.activeCount)}</strong>
                <span>Activos</span>
              </div>
              <div className="gh-hero__stat">
                <strong>{teams.length}</strong>
                <span>Equipos</span>
              </div>
              <div className="gh-hero__stat">
                <strong>{tournaments.length}</strong>
                <span>Torneos</span>
              </div>
            </div>

            <div className="gh-hero__actions">
              <button type="button" className="gh-btn gh-btn--primary" onClick={handleJoin} disabled={joiningHub || stats.joined}>
                <FaSignInAlt />
                {stats.joined ? 'Ya estas en el hub' : joiningHub ? 'Uniendo...' : 'Unirme al hub'}
              </button>
              <button type="button" className="gh-btn gh-btn--glass" onClick={() => navigate('/torneos')}>
                <FaTrophy /> Torneos
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="gh-body">
        <section className="gh-section" id="tournaments">
          <div className="gh-section__head">
            <div className="gh-section__icon"><FaTrophy /></div>
            <div>
              <h2>Torneos</h2>
              <p className="gh-muted">{tournaments.length > 0 ? `${tournaments.length} torneos registrados` : 'Sin torneos aun'}</p>
            </div>
            {tournaments.length > 0 && (
              <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/torneos')}>
                Ver todos <FaChevronRight />
              </button>
            )}
          </div>

          {tournaments.length > 0 ? (
            <div className="gh-row">
              {tournaments.slice(0, 6).map((tournament) => (
                <div key={tournament.id} className="gh-item" onClick={() => navigate('/torneos')}>
                  <div className="gh-item__top">
                    <span className={`gh-status gh-status--${tournament.status}`}>{STATUS_LABELS[tournament.status] || tournament.status}</span>
                    <span className="gh-muted gh-small">{formatDate(tournament.date)}</span>
                  </div>
                  <h3>{tournament.title}</h3>
                  <div className="gh-item__detail">
                    <span><FaTrophy /> {formatPrize(tournament.prizePool, tournament.currency)}</span>
                    <span><FaUsers /> {tournament.registeredTeams}/{tournament.maxSlots}</span>
                    <span><FaShieldAlt /> {getTournamentFormatLabel(tournament.format) || 'Open'}</span>
                  </div>
                  {tournament.organizer?.username && (
                    <p className="gh-muted gh-small">Org: {tournament.organizer.username}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="gh-empty">
              <p>Todavia no hay torneos para {name}.</p>
              <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/create-tournament')}>
                Crear torneo
              </button>
            </div>
          )}
        </section>

        <section className="gh-section" id="teams">
          <div className="gh-section__head">
            <div className="gh-section__icon"><FaShieldAlt /></div>
            <div>
              <h2>Equipos</h2>
              <p className="gh-muted">{teams.length > 0 ? `${teams.length} equipos activos` : 'Sin equipos aun'}</p>
            </div>
            {teams.length > 0 && (
              <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/equipos')}>
                Ver todos <FaChevronRight />
              </button>
            )}
          </div>

          {teams.length > 0 ? (
            <div className="gh-row">
              {teams.slice(0, 6).map((team) => (
                <div key={team.id} className="gh-item">
                  <div className="gh-item__top">
                    <div className="gh-team-id">
                      {team.logo ? (
                        <img src={team.logo} alt={team.name || 'Equipo'} className="gh-team-id__img" />
                      ) : (
                        <div className="gh-team-id__letter">{(team.name || '?')[0]}</div>
                      )}
                      <div>
                        <h3>{team.name}</h3>
                        {team.teamCode && <span className="gh-muted gh-small">{team.teamCode}</span>}
                      </div>
                    </div>
                    {team.country && <span className="gh-tag">{team.country}</span>}
                  </div>
                  <div className="gh-item__detail">
                    <span><FaUsers /> {team.startersCount} titulares</span>
                    <span><FaShieldAlt /> {team.level || 'Open'}</span>
                  </div>
                  {team.captain?.username && <p className="gh-muted gh-small">Cap: {team.captain.username}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="gh-empty">
              <p>Todavia no hay equipos para {name}.</p>
              <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/create-team')}>
                Crear equipo
              </button>
            </div>
          )}
        </section>

        <section className="gh-section" id="communities">
          <div className="gh-section__head">
            <div className="gh-section__icon"><FaGlobe /></div>
            <div>
              <h2>Comunidades</h2>
              <p className="gh-muted">{communities.length > 0 ? `${communities.length} comunidades` : 'Sin comunidades aun'}</p>
            </div>
            <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/comunidad')}>
              Explorar <FaChevronRight />
            </button>
          </div>

          {communities.length > 0 ? (
            <div className="gh-row">
              {communities.slice(0, 4).map((community) => (
                <div key={community.id} className="gh-item gh-item--wide" onClick={() => navigate(`/communities/${community.shortUrl || community.id}`)}>
                  <div>
                    <h3>{community.name}</h3>
                    {community.description && <p className="gh-muted gh-small">{community.description}</p>}
                  </div>
                  <div className="gh-item__detail">
                    <span><FaUsers /> {formatGameHubCount(community.membersCount)} miembros</span>
                    <span><FaGlobe /> {community.region || 'LATAM'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="gh-empty">
              <p>Todavia no hay comunidades para {name}.</p>
              <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/comunidad')}>
                Explorar
              </button>
            </div>
          )}
        </section>

        {organizers.length > 0 && (
          <section className="gh-section" id="organizers">
            <div className="gh-section__head">
              <div className="gh-section__icon"><FaCalendarAlt /></div>
              <div>
                <h2>Organizadores</h2>
                <p className="gh-muted">{organizers.length} organizadores activos</p>
              </div>
            </div>
            <div className="gh-row">
              {organizers.map((organizer) => (
                <div key={organizer.id} className="gh-item gh-item--compact">
                  <div className="gh-organizer-id">
                    {organizer.avatar ? (
                      <img src={organizer.avatar} alt={organizer.username || 'Organizador'} className="gh-organizer-id__img" />
                    ) : (
                      <div className="gh-organizer-id__letter"><FaShieldAlt /></div>
                    )}
                    <div>
                      <h3>{organizer.username}</h3>
                      <span className="gh-muted gh-small">
                        {organizer.tournamentsCount} {organizer.tournamentsCount === 1 ? 'torneo' : 'torneos'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default CommunityGamePageTemplate;
