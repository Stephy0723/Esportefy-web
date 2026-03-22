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
import { COMMUNITY_GAMES, COMMUNITY_GAME_TAXONOMY } from '../../data/communityData';
import { useTheme } from '../../context/ThemeContext';
import { isSupportedGameId as isCoreGameId } from '../../../../shared/supportedGames.js';
import { fetchGameHubDetails, formatGameHubCount, joinGameHub } from '../menu/Community/gameHub.service';
import './CommunityGamePageTemplate.css';

const DATA_ALIASES = {
  ow2: 'overwatch', rl: 'rocket', ff: 'freefire', wr: 'wildrift', wildrift: 'wildrift',
  r6s: 'r6', r6: 'r6', pubg: 'pubgm', pubgm: 'pubgm', hs: 'hearthstone',
  nba2k: 'nba2k', lor: 'lor', cr: 'clashroyale', aov: 'hok',
};

const COMPANY_BY_ID = {
  lol: 'Riot Games', valorant: 'Riot Games', dota2: 'Valve', mlbb: 'Moonton',
  wildrift: 'Riot Games', fortnite: 'Epic Games', cs2: 'Valve', apex: 'Respawn Entertainment',
  warzone: 'Activision', pubgm: 'Tencent', rl: 'Psyonix', tekken8: 'Bandai Namco',
  sf6: 'Capcom', gta: 'Rockstar Games', genshin: 'HoYoverse', amongus: 'Innersloth',
  fallguys: 'Mediatonic', marvel: 'NetEase Games', xdefiant: 'Ubisoft',
  thefinals: 'Embark Studios', deadlock: 'Valve', eafc25: 'EA Sports',
  palworld: 'Pocketpair', ow2: 'Blizzard Entertainment', r6: 'Ubisoft',
  hs: 'Blizzard Entertainment', lor: 'Riot Games', tft: 'Riot Games', hok: 'Tencent',
  ff: 'Garena', cr: 'Supercell', aov: 'Tencent', starcraft: 'Blizzard Entertainment',
  nba2k: '2K Sports', mariokart: 'Nintendo', halo: '343 Industries', wuwa: 'Kuro Games',
  codbo6: 'Activision', mk1: 'NetherRealm', eldenring: 'FromSoftware',
  cyberpunk: 'CD Projekt Red', rdr2: 'Rockstar Games', mhwilds: 'Capcom',
  hogwarts: 'Avalanche Studios', nms: 'Hello Games', dbsz: 'Bandai Namco',
  multiversus: 'Player First Games', helldivers2: 'Arrowhead', bg3: 'Larian Studios',
  tarkov: 'Battlestate Games',
};

const normalizeText = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const toTitle = (v) => String(v || '').split(/[\s-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
const fallbackArray = (v, fb = []) => (Array.isArray(v) && v.length > 0 ? v : fb);

const formatDate = (d) => {
  if (!d) return 'Proximamente';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? 'Proximamente' : date.toLocaleDateString('es-DO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPrize = (val, currency = 'USD') => {
  if (!val) return 'Por definir';
  const str = String(val).trim();
  return (!str || str === '0') ? 'Gratis' : `${str} ${currency}`;
};

const STATUS_LABELS = { draft: 'Borrador', open: 'Abierto', ongoing: 'En curso', finished: 'Finalizado', cancelled: 'Cancelado' };

/* ────────────────────────────────────────────────────────── */

const CommunityGamePageTemplate = () => {
  const { gameId: rawId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();

  const id = normalizeText(rawId);
  const detailId = DATA_ALIASES[id] || id;
  const isSupported = isCoreGameId(id) || isCoreGameId(detailId) || COMMUNITY_GAMES.some((g) => g.id === id || g.id === detailId);

  const game = COMMUNITY_GAMES.find((g) => normalizeText(g.id) === id || normalizeText(g.id) === detailId) || null;
  const taxonomy = COMMUNITY_GAME_TAXONOMY?.[id] || COMMUNITY_GAME_TAXONOMY?.[detailId] || {};

  const name = game?.name || toTitle(id);
  const banner = game?.img || '';
  const accent = game?.color || '#8EDB15';
  const developer = COMPANY_BY_ID[id] || COMPANY_BY_ID[detailId] || 'Studio';
  const category = game?.cat || toTitle(fallbackArray(taxonomy?.genre, ['competitivo'])[0]);
  const platform = toTitle(fallbackArray(taxonomy?.platform, ['pc'])[0]);

  const [loading, setLoading] = useState(true);
  const [joiningHub, setJoiningHub] = useState(false);
  const [data, setData] = useState({ stats: { gameId: id, usersCount: 0, activeCount: 0, joined: false }, teams: [], tournaments: [], communities: [], organizers: [] });

  useEffect(() => { if (!isSupported) navigate('/comunidad', { replace: true }); }, [isSupported, navigate]);

  useEffect(() => {
    let c = false;
    if (isSupported) {
      setLoading(true);
      fetchGameHubDetails(id || detailId).then((r) => { if (!c) setData(r); }).catch(() => {}).finally(() => { if (!c) setLoading(false); });
    }
    return () => { c = true; };
  }, [id, detailId, isSupported]);

  const handleJoin = useCallback(async () => {
    if (!id || joiningHub) return;
    try { setJoiningHub(true); const r = await joinGameHub(id); setData((p) => ({ ...p, stats: r.stats })); } finally { setJoiningHub(false); }
  }, [id, joiningHub]);

  const { stats, teams, tournaments, communities, organizers } = data;

  return (
    <div className={`gh theme-${theme || 'dark'}`} style={{ '--accent': accent }}>

      {/* ── HERO with full game background ── */}
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
            <p className="gh-hero__sub">{name} — hub dedicado para comunidades, torneos, equipos y competitivo.</p>

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

      {/* ── BODY ── */}
      <div className="gh-body">

        {loading ? (
          <div className="gh-loader"><div className="gh-loader__spin" /><p>Cargando hub...</p></div>
        ) : (
          <>
            {/* ── TORNEOS ── */}
            <section className="gh-section" id="tournaments">
              <div className="gh-section__head">
                <div className="gh-section__icon"><FaTrophy /></div>
                <div>
                  <h2>Torneos</h2>
                  <p className="gh-muted">{tournaments.length > 0 ? `${tournaments.length} torneos registrados` : 'Sin torneos aun'}</p>
                </div>
                {tournaments.length > 0 && (
                  <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/torneos')}>Ver todos <FaChevronRight /></button>
                )}
              </div>

              {tournaments.length > 0 ? (
                <div className="gh-row">
                  {tournaments.slice(0, 6).map((t) => (
                    <div key={t.id} className="gh-item" onClick={() => navigate('/torneos')}>
                      <div className="gh-item__top">
                        <span className={`gh-status gh-status--${t.status}`}>{STATUS_LABELS[t.status] || t.status}</span>
                        <span className="gh-muted gh-small">{formatDate(t.date)}</span>
                      </div>
                      <h3>{t.title}</h3>
                      <div className="gh-item__detail">
                        <span><FaTrophy /> {formatPrize(t.prizePool, t.currency)}</span>
                        <span><FaUsers /> {t.registeredTeams}/{t.maxSlots}</span>
                        <span><FaShieldAlt /> {t.format || 'Open'}</span>
                      </div>
                      {t.organizer?.username && <p className="gh-muted gh-small">Org: {t.organizer.username}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gh-empty">
                  <p>Todavia no hay torneos para {name}.</p>
                  <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/create-tournament')}>Crear torneo</button>
                </div>
              )}
            </section>

            {/* ── EQUIPOS ── */}
            <section className="gh-section" id="teams">
              <div className="gh-section__head">
                <div className="gh-section__icon"><FaShieldAlt /></div>
                <div>
                  <h2>Equipos</h2>
                  <p className="gh-muted">{teams.length > 0 ? `${teams.length} equipos activos` : 'Sin equipos aun'}</p>
                </div>
                {teams.length > 0 && (
                  <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/equipos')}>Ver todos <FaChevronRight /></button>
                )}
              </div>

              {teams.length > 0 ? (
                <div className="gh-row">
                  {teams.slice(0, 6).map((t) => (
                    <div key={t.id} className="gh-item">
                      <div className="gh-item__top">
                        <div className="gh-team-id">
                          {t.logo ? <img src={t.logo} alt={t.name || 'Equipo'} className="gh-team-id__img" /> : <div className="gh-team-id__letter">{(t.name || '?')[0]}</div>}
                          <div>
                            <h3>{t.name}</h3>
                            {t.teamCode && <span className="gh-muted gh-small">{t.teamCode}</span>}
                          </div>
                        </div>
                        {t.country && <span className="gh-tag">{t.country}</span>}
                      </div>
                      <div className="gh-item__detail">
                        <span><FaUsers /> {t.startersCount} titulares</span>
                        <span><FaShieldAlt /> {t.level || 'Open'}</span>
                      </div>
                      {t.captain?.username && <p className="gh-muted gh-small">Cap: {t.captain.username}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gh-empty">
                  <p>Todavia no hay equipos para {name}.</p>
                  <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/create-team')}>Crear equipo</button>
                </div>
              )}
            </section>

            {/* ── COMUNIDADES ── */}
            <section className="gh-section" id="communities">
              <div className="gh-section__head">
                <div className="gh-section__icon"><FaGlobe /></div>
                <div>
                  <h2>Comunidades</h2>
                  <p className="gh-muted">{communities.length > 0 ? `${communities.length} comunidades` : 'Sin comunidades aun'}</p>
                </div>
                <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/comunidad')}>Explorar <FaChevronRight /></button>
              </div>

              {communities.length > 0 ? (
                <div className="gh-row">
                  {communities.slice(0, 4).map((c) => (
                    <div key={c.id} className="gh-item gh-item--wide" onClick={() => navigate(`/community/${c.shortUrl || c.id}`)}>
                      <div>
                        <h3>{c.name}</h3>
                        {c.description && <p className="gh-muted gh-small">{c.description}</p>}
                      </div>
                      <div className="gh-item__detail">
                        <span><FaUsers /> {formatGameHubCount(c.membersCount)} miembros</span>
                        <span><FaGlobe /> {c.region || 'LATAM'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="gh-empty">
                  <p>Todavia no hay comunidades para {name}.</p>
                  <button type="button" className="gh-btn gh-btn--glass gh-btn--sm" onClick={() => navigate('/comunidad')}>Explorar</button>
                </div>
              )}
            </section>

            {/* ── ORGANIZADORES ── */}
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
                  {organizers.map((o) => (
                    <div key={o.id} className="gh-item gh-item--compact">
                      <div className="gh-organizer-id">
                        {o.avatar ? <img src={o.avatar} alt={o.username || 'Organizador'} className="gh-organizer-id__img" /> : <div className="gh-organizer-id__letter"><FaShieldAlt /></div>}
                        <div>
                          <h3>{o.username}</h3>
                          <span className="gh-muted gh-small">{o.tournamentsCount} {o.tournamentsCount === 1 ? 'torneo' : 'torneos'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityGamePageTemplate;
