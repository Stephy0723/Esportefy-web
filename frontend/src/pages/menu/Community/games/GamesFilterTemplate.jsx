import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { COMMUNITY_GAMES } from '../../../../data/communityData';
import { gamesDetailedData } from '../../../../data/gamesDetailedData';
import './GamesFilterTemplate.css';

const normalize = (value) => String(value || '').toLowerCase().trim();

const tagAliases = {
  '5vs5': '5v5',
  '5v5': '5v5',
  moba: 'moba',
  'moba movil': 'moba',
  'mobile moba': 'moba',
  'battle royale': 'br',
  'battle-royale': 'br',
  br: 'br',
  esports: 'e-sports',
  'e sports': 'e-sports',
  'e-sports': 'e-sports',
  movil: 'mobile',
  mobile: 'mobile',
  'pc/mobile': 'cross-platform',
  multiplataforma: 'cross-platform'
};

const canonicalTag = (tag) => tagAliases[normalize(tag)] || normalize(tag);

const tagDisplay = {
  '5v5': '5v5',
  moba: 'MOBA',
  br: 'Battle Royale',
  'e-sports': 'E-Sports',
  mobile: 'Mobile',
  'cross-platform': 'Cross-Platform'
};

const getTagLabel = (tag) => tagDisplay[canonicalTag(tag)] || String(tag).trim();

const relatedTagFamilies = {
  moba: new Set(['moba', '5v5']),
  '5v5': new Set(['5v5', 'moba']),
  br: new Set(['br', 'battle royale']),
  'battle royale': new Set(['br', 'battle royale']),
  'e-sports': new Set(['e-sports', 'esports']),
  esports: new Set(['e-sports', 'esports'])
};

const resolveDetailedGame = (id) => {
  const key = normalize(id);
  const alias = {
    ow2: 'overwatch',
    rl: 'rocketleague',
    ff: 'freefire',
    wr: 'wildrift',
    r6s: 'rainbowsix',
    r6: 'rainbowsix',
    pubgm: 'pubg',
    hs: 'hearthstone',
    lor: 'runeterra',
    cr: 'clashroyale',
    aov: 'hok'
  };
  return gamesDetailedData[key] || gamesDetailedData[alias[key]] || null;
};

const companyById = {
  ow2: 'Blizzard Entertainment',
  rl: 'Psyonix',
  ff: 'Garena',
  wr: 'Riot Games',
  r6: 'Ubisoft',
  r6s: 'Ubisoft',
  pubgm: 'Krafton / Tencent',
  aov: 'TiMi Studio Group',
  lor: 'Riot Games',
  hs: 'Blizzard Entertainment'
};

const GamesFilterTemplate = () => {
  const { type, value } = useParams();
  const navigate = useNavigate();

  const decodedValue = decodeURIComponent(value || '');
  const normalizedValue = normalize(decodedValue);

  const games = useMemo(() => {
    const merged = COMMUNITY_GAMES.map((game) => {
      const detail = resolveDetailedGame(game.id);

      const rawTags = [
        ...(Array.isArray(detail?.tags) ? detail.tags : []),
        ...(Array.isArray(game?.tags) ? game.tags : []),
        game?.cat,
        detail?.category,
        game?.mode,
        game?.platform
      ].filter(Boolean);

      const seen = new Set();
      const tags = rawTags.filter((tag) => {
        const key = canonicalTag(tag);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      if (tags.some((t) => canonicalTag(t) === 'moba') && !tags.some((t) => canonicalTag(t) === '5v5')) {
        tags.push('5v5');
      }

      return {
        ...game,
        developer: detail?.developer || companyById[normalize(game.id)] || 'Desarrollador no especificado',
        tags,
        description:
          game?.desc ||
          detail?.description ||
          'Unete a la comunidad para scrims, torneos y equipo competitivo.'
      };
    });

    if (type === 'company') return merged.filter((g) => normalize(g.developer).includes(normalizedValue));
    if (type === 'tag') {
      const selected = canonicalTag(normalizedValue);
      const family = relatedTagFamilies[selected] || new Set([selected]);
      return merged.filter((g) =>
        g.tags.some((tag) => family.has(canonicalTag(tag)))
      );
    }
    return merged;
  }, [type, normalizedValue]);

  const pageAccent = games[0]?.color || '#22c55e';
  const bgImage = games[0]?.img || COMMUNITY_GAMES[0]?.img;
  const title = type === 'company' ? decodedValue : getTagLabel(decodedValue);

  if (!games.length) {
    return (
      <div className="gft-empty" style={{ '--gft-accent': pageAccent }}>
        <button className="gft-back" onClick={() => navigate(-1)}>Volver</button>
        <h2>No encontramos juegos para {decodedValue}</h2>
      </div>
    );
  }

  return (
    <section className="gft-page" style={{ '--gft-accent': pageAccent }}>
      <div className="gft-bg" style={{ backgroundImage: `url("${bgImage}")` }} />
      <div className="gft-overlay" />
      <div className="gft-gridfx" />
      <div className="gft-corner-tag" aria-hidden="true">{title}</div>

      <header className="gft-topbar">
        <button className="gft-back" onClick={() => navigate(-1)}>Volver</button>
        <p className="gft-counter">{games.length} juegos</p>
      </header>

      <main className="gft-main">
        <div className="gft-intro">
          <p className="gft-kicker">Filtro activo</p>
          <h1>{title}</h1>
          <p>Explora por tags y empresa. Cada tag de cada carta abre otra seleccion automaticamente.</p>
        </div>

        <div className="gft-cards" role="list">
          {games.map((game) => (
            <article className="gft-card" key={game.id} style={{ '--card-accent': game.color || pageAccent }} role="listitem">
              <div className="gft-card-media">
                <img src={game.img} alt={game.name} loading="lazy" />
                <div className="gft-card-media-overlay" />
              </div>

              <div className="gft-card-body">
                <h3>{game.name}</h3>
                <p>{game.description}</p>

                <div className="gft-card-meta">
                  <span>{game.players || 'N/A'} activos</span>
                  <span>{game.members || 'N/A'} comunidad</span>
                </div>

                <div className="gft-tags">
                  <button
                    type="button"
                    className="gft-tag gft-tag-company"
                    onClick={() => navigate(`/games/filter/company/${encodeURIComponent(game.developer)}`)}
                  >
                    {game.developer}
                  </button>
                  {game.tags.slice(0, 6).map((tag) => (
                    <button
                      type="button"
                      key={`${game.id}-${tag}`}
                      className="gft-tag"
                      onClick={() => navigate(`/games/filter/tag/${encodeURIComponent(canonicalTag(tag))}`)}
                    >
                      {getTagLabel(tag)}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="gft-detail"
                  onClick={() => navigate(`/games/${String(game.id).toLowerCase()}`)}
                >
                  Mas informacion
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </section>
  );
};

export default GamesFilterTemplate;
