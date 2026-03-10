import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { COMMUNITY_GAMES, COMMUNITY_GAME_TAXONOMY } from '../../../../data/communityData';
import { supportedGamesDetailedData as gamesDetailedData } from '../../../../data/supportedGamesDetailedData';
import HeroTagSection from './HeroTagSection';
import './GamesFilterTemplate.css';

const TYPE_LABELS = {
  tag: 'Tag',
  genre: 'Genero',
  mode: 'Modo',
  platform: 'Plataforma',
  competitive: 'Competitivo',
  style: 'Estilo',
  mechanics: 'Mecanicas',
  company: 'Empresa',
};

const TAG_DESCRIPTIONS = {
  shooter: 'Games focused on precision aiming and fast reaction combat.',
  fps: 'First person combat with fast mechanics and tactical positioning.',
  moba: 'Team strategy games where players control unique heroes.',
  'battle royale': 'Last player or squad standing survival experience.',
  estrategia: 'Decision-heavy gameplay where macro and teamwork define outcomes.',
  competitivo: 'Structured skill progression, ranked modes and esports ecosystems.',
  esports: 'Professional competitive ecosystem with leagues, events and high-level teams.',
  accion: 'Fast pace gameplay centered on execution, timing and reflexes.',
  'open world': 'Expansive worlds to explore with freedom of choice, quests and discovery.',
  rpg: 'Role-playing experiences with character progression, storytelling and deep systems.',
  'action rpg': 'Combat-focused RPGs blending real-time action with character builds and loot.',
  fighting: 'Skill-based combat games with combos, reads and competitive matchups.',
  sports: 'Competitive sports simulations and arcade sports experiences.',
  racing: 'High-speed competition on tracks, circuits and creative courses.',
  'social deduction': 'Multiplayer deception games where trust and deduction are key.',
  party: 'Fun, accessible multiplayer games designed for group entertainment.',
  strategy: 'Mind over muscle — deck building, resource management and tactical decisions.',
  'card game': 'Digital card games with deck building, strategy and collectible elements.',
  survival: 'Gather, craft, build and survive in hostile environments.',
  'riot games': 'Developer behind League of Legends and Valorant, focused on competitive ecosystems.',
  valve: 'Studio behind CS and Dota, with deep roots in competitive PC gaming.',
  tencent: 'Global publisher and technology company with broad multiplayer ecosystems.',
  'cd projekt red': 'Polish studio behind The Witcher and Cyberpunk, known for narrative-driven open worlds.',
  'rockstar games': 'Creators of GTA and Red Dead, masters of open world storytelling.',
  capcom: 'Japanese studio behind Street Fighter and Monster Hunter, blending action and fighting mastery.',
  fromsoftware: 'Creators of Dark Souls and Elden Ring, pioneers of challenging action RPGs.',
  'wb games': 'Warner Bros gaming division behind Mortal Kombat, MultiVersus and Hogwarts Legacy.',
  'hello games': 'Independent studio that built No Mans Sky into a massive procedural universe.',
  'bandai namco': 'Japanese publisher behind Tekken, Dragon Ball and a legacy of arcade fighting games.',
  supercell: 'Finnish studio behind Clash Royale and Brawl Stars, leaders in mobile competitive gaming.',
  nintendo: 'Legendary Japanese studio behind Mario, Zelda and the most iconic gaming franchises.',
};

const COMPANY_FACTS = {
  'riot games': ['Esports Focus', 'Competitive Multiplayer', 'Global Publisher'],
  valve: ['PC Ecosystem', 'Competitive DNA', 'Community Driven'],
  tencent: ['Global Publisher', 'Mobile + PC Reach', 'Live Service Expertise'],
  ubisoft: ['Tactical Shooters', 'AAA Production', 'Global Studios'],
  activision: ['Competitive Shooters', 'Global Franchises', 'Esports Events'],
  moonton: ['Mobile MOBA', 'Regional Leagues', 'High Engagement'],
  blizzard: ['Live Service Legacy', 'Hero Based Combat', 'Competitive Events'],
  epic: ['Cross Platform Reach', 'Creator Economy', 'Live Events'],
  'cd projekt red': ['Open World RPG', 'Story Driven', 'AAA Quality'],
  'rockstar games': ['Open World Icons', 'Narrative Excellence', 'AAA Production'],
  capcom: ['Fighting Legacy', 'Monster Hunting', 'Action Mastery'],
  'wb games': ['Licensed Franchises', 'Fighting Games', 'AAA RPG'],
  fromsoftware: ['Soulslike Pioneer', 'Challenging Combat', 'Dark Fantasy'],
  'hello games': ['Procedural Worlds', 'Live Updates', 'Space Exploration'],
  'bandai namco': ['Fighting Games', 'Anime Franchises', 'Arcade Legacy'],
  'ea sports': ['Sports Simulation', 'Annual Releases', 'Global Leagues'],
  supercell: ['Mobile Strategy', 'Esports Mobile', 'Live Service'],
  nintendo: ['Party Games', 'Family Gaming', 'Innovation'],
};

const COMPANY_BY_ID = {
  lol: 'Riot Games',
  valorant: 'Riot Games',
  dota2: 'Valve',
  mlbb: 'Moonton',
  wildrift: 'Riot Games',
  fortnite: 'Epic Games',
  cs2: 'Valve',
  apex: 'Respawn Entertainment',
  warzone: 'Activision',
  pubgm: 'Tencent',
  rl: 'Psyonix',
  tekken8: 'Bandai Namco',
  sf6: 'Capcom',
  gta: 'Rockstar Games',
  genshin: 'HoYoverse',
  amongus: 'Innersloth',
  fallguys: 'Mediatonic',
  marvel: 'NetEase Games',
  xdefiant: 'Ubisoft',
  aov: 'Tencent',
  thefinals: 'Embark Studios',
  tarkov: 'Battlestate Games',
  deadlock: 'Valve',
  eafc25: 'EA Sports',
  dbsz: 'Bandai Namco',
  multiversus: 'WB Games',
  palworld: 'Pocketpair',
  helldivers2: 'Arrowhead Game Studios',
  bg3: 'Larian Studios',
  ff: 'Garena',
  ow2: 'Blizzard Entertainment',
  r6: 'Ubisoft',
  hs: 'Blizzard Entertainment',
  lor: 'Riot Games',
  tft: 'Riot Games',
  hok: 'Tencent',
  cr: 'Supercell',
  starcraft: 'Blizzard Entertainment',
  nba2k: '2K Sports',
  mariokart: 'Nintendo',
  halo: '343 Industries',
  wuwa: 'Kuro Games',
  codbo6: 'Activision',
  mk1: 'WB Games',
  eldenring: 'FromSoftware',
  cyberpunk: 'CD Projekt Red',
  rdr2: 'Rockstar Games',
  mhwilds: 'Capcom',
  hogwarts: 'WB Games',
  nms: 'Hello Games',
};

const TAXONOMY_TYPES = ['genre', 'mode', 'platform', 'competitive', 'style', 'mechanics'];

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const canonicalTag = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (normalized === '5v5' || normalized === '5vs5' || normalized === '5 vs 5') return 'moba';
  if (normalized === 'br') return 'battle royale';
  if (normalized === 'accion' || normalized === 'action') return 'accion';
  if (normalized === 'e-sports') return 'esports';
  return normalized;
};

const TAG_DISPLAY = {
  fps: 'FPS', moba: 'MOBA', rpg: 'RPG', rts: 'RTS', br: 'BR',
  pc: 'PC', '5v5': '5v5', '6v6': '6v6', '3v3': '3v3', '1v1': '1v1', '2v2': '2v2',
  'e-sports': 'E-Sports', esports: 'E-Sports', 'battle royale': 'Battle Royale',
  'action rpg': 'Action RPG', rng: 'RNG', apm: 'APM', rp: 'RP',
};

const toTitle = (value) =>
  String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const GamesFilterTemplate = () => {
  const { type, value } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tiltMap, setTiltMap] = useState({});
  const [hoverAccent, setHoverAccent] = useState('');

  const normalizedType = normalizeText(type) || 'tag';
  const decodedValue = useMemo(() => {
    try {
      return decodeURIComponent(String(value || ''));
    } catch {
      return String(value || '');
    }
  }, [value]);
  const normalizedValue = canonicalTag(decodedValue);

  const games = useMemo(() => {
    return COMMUNITY_GAMES.map((game) => {
      const detail = gamesDetailedData[game.id] || gamesDetailedData[normalizeText(game.id)] || null;
      const company = detail?.developer || game.developer || game.company || COMPANY_BY_ID[game.id] || 'Unknown Studio';
      const taxonomy = COMMUNITY_GAME_TAXONOMY[game.id] || {};

      const tagsByType = {
        genre: [...(taxonomy.genre || []), game.cat].filter(Boolean),
        mode: [...(taxonomy.mode || [])].filter(Boolean),
        platform: [...(taxonomy.platform || [])].filter(Boolean),
        competitive: [...(taxonomy.competitive || [])].filter(Boolean),
        style: [...(taxonomy.style || [])].filter(Boolean),
        mechanics: [...(taxonomy.mechanics || [])].filter(Boolean),
      };

      const mixedTags = [
        ...(detail?.tags || []),
        ...Object.values(tagsByType).flat(),
      ].filter(Boolean);

      const allCanonical = Array.from(
        new Set(
          mixedTags
            .map((item) => canonicalTag(item))
            .filter(Boolean)
            .concat(canonicalTag(game.cat))
        )
      );

      return {
        ...game,
        detail,
        company,
        companyCanonical: normalizeText(company),
        tagsByType,
        tagsCanonical: allCanonical,
        cover: game.img || game.image || detail?.banner || '',
      };
    });
  }, []);

  const filteredGames = useMemo(() => {
    if (!normalizedValue) return games;

    if (normalizedType === 'company' || normalizedType === 'empresa') {
      return games.filter((game) => game.companyCanonical === normalizeText(decodedValue));
    }

    if (TAXONOMY_TYPES.includes(normalizedType)) {
      return games.filter((game) => {
        const list = game.tagsByType[normalizedType] || [];
        return list.some((item) => canonicalTag(item) === normalizedValue);
      });
    }

    return games.filter((game) => {
      if (game.tagsCanonical.includes(normalizedValue)) return true;
      if (normalizedValue === 'moba') {
        return game.tagsCanonical.includes('moba') || game.tagsCanonical.includes(canonicalTag('5v5'));
      }
      if (normalizedValue === 'battle royale') {
        return game.tagsCanonical.includes('battle royale');
      }
      return false;
    });
  }, [games, decodedValue, normalizedType, normalizedValue]);

  const heroContext = useMemo(() => {
    const selectedCompany = normalizedType === 'company' || normalizedType === 'empresa';
    const mainTitle = selectedCompany ? decodedValue : toTitle(decodedValue || 'Discover');
    const canonical = selectedCompany ? normalizeText(decodedValue) : normalizedValue;
    const description = TAG_DESCRIPTIONS[canonical] || 'Explore related games, play styles and competitive ecosystems connected to this selection.';

    const companiesInResults = Array.from(
      new Set(filteredGames.map((game) => game.company).filter(Boolean))
    );

    const relatedCompanies = selectedCompany
      ? Array.from(new Set(games.map((game) => game.company)))
          .filter((name) => normalizeText(name) !== normalizeText(decodedValue))
          .slice(0, 6)
      : companiesInResults.slice(0, 6);

    const factChips = selectedCompany
      ? COMPANY_FACTS[canonical] || ['Global Reach', 'Live Service', 'Community Scale']
      : [
          TYPE_LABELS[normalizedType] || 'Tag',
          `${filteredGames.length} Games`,
          'Community Active',
        ];

    const topGenres = Array.from(
      new Set(
        filteredGames
          .map((game) => (game.tagsByType.genre || [])[0])
          .filter(Boolean)
      )
    )
      .slice(0, 2)
      .map((genre) => toTitle(genre));

    return {
      key: `${normalizedType}:${normalizedValue}`,
      type: TYPE_LABELS[normalizedType] || 'Tag',
      title: mainTitle,
      description,
      chips: [...factChips, ...topGenres].slice(0, 6),
      facts: [
        { label: 'Games', value: String(filteredGames.length) },
        { label: 'Companies', value: String(companiesInResults.length) },
      ],
      relatedCompanies,
    };
  }, [decodedValue, filteredGames, games, normalizedType, normalizedValue]);

  const heroBackground = filteredGames[0]?.cover || games[0]?.cover || '';
  const activeAccent = hoverAccent || filteredGames[0]?.color || 'var(--primary)';

  const handleTagClick = (tag) => {
    if (!tag) return;
    navigate(`/games/filter/tag/${encodeURIComponent(String(tag))}`, {
      state: { heroContext: canonicalTag(tag) },
    });
  };

  const handleCompanyClick = (company) => {
    if (!company) return;
    navigate(`/games/filter/company/${encodeURIComponent(String(company))}`, {
      state: { heroContext: normalizeText(company) },
    });
  };

  return (
    <section
      className="gft-page"
      style={{
        '--gft-accent': activeAccent,
        '--gft-hover-accent': hoverAccent || activeAccent,
      }}
    >
      <div className="gft-ambient" />
      {heroBackground ? (
        <div className="gft-ambient-art" style={{ backgroundImage: `url("${heroBackground}")` }} />
      ) : null}

      <div className="gft-shell">
        <header className="gft-head">
          <div className="gft-head-left">
            <button type="button" className="gft-back" onClick={() => navigate(-1)}>
              Volver
            </button>
            <div className="gft-titles">
              <p className="gft-kicker">Games Filter</p>
              <h1>{toTitle(decodedValue || 'Discover')}</h1>
            </div>
          </div>
          <p className="gft-counter">{filteredGames.length} Results</p>
        </header>

        <HeroTagSection
          context={heroContext}
          backgroundImage={heroBackground}
          accent={activeAccent}
          onCompanyClick={handleCompanyClick}
          transitionKey={location.key || heroContext.key}
        />

        {filteredGames.length === 0 ? (
          <section className="gft-empty-panel">
            <div className="gft-empty-ill" />
            <h2>No games found for this filter</h2>
            <p>Try another tag or company to keep exploring the community catalog.</p>
            <button type="button" className="gft-back" onClick={() => navigate('/comunidad')}>
              Back to Community
            </button>
          </section>
        ) : (
          <div className="gft-grid">
            {filteredGames.map((game) => {
              const cardId = game.id;
              const tilt = tiltMap[cardId] || { rx: '0deg', ry: '0deg', mx: '50%', my: '50%' };
              const tags = (() => {
                const raw = [
                  ...(game.detail?.tags || []),
                  ...(game.tagsByType.genre || []),
                  ...(game.tagsByType.style || []),
                  ...(game.tagsByType.mechanics || []),
                  ...(game.tagsByType.mode || []),
                ].filter(Boolean).map((t) => String(t).trim());
                const seen = new Set();
                const result = [];
                for (const tag of raw) {
                  const key = normalizeText(tag);
                  if (key && !seen.has(key)) {
                    seen.add(key);
                    result.push(TAG_DISPLAY[key] || toTitle(tag));
                  }
                }
                return result.slice(0, 7);
              })();

              return (
                <article
                  key={game.id}
                  className="gft-card"
                  style={{
                    '--card-accent': game.color || 'var(--primary)',
                    '--rx': tilt.rx,
                    '--ry': tilt.ry,
                    '--mx': tilt.mx,
                    '--my': tilt.my,
                  }}
                  onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const px = (event.clientX - rect.left) / rect.width;
                    const py = (event.clientY - rect.top) / rect.height;
                    const ry = `${(px - 0.5) * 9}deg`;
                    const rx = `${(0.5 - py) * 10}deg`;
                    setTiltMap((prev) => ({
                      ...prev,
                      [cardId]: {
                        rx,
                        ry,
                        mx: `${px * 100}%`,
                        my: `${py * 100}%`,
                      },
                    }));
                  }}
                  onMouseEnter={() => setHoverAccent(game.color || '')}
                  onMouseLeave={() => {
                    setTiltMap((prev) => ({
                      ...prev,
                      [cardId]: { rx: '0deg', ry: '0deg', mx: '50%', my: '50%' },
                    }));
                    setHoverAccent('');
                  }}
                >
                  <div className="gft-card-neon" />
                  <div className="gft-card-bevel" />

                  <div className="gft-card-media">
                    <img src={game.cover} alt={game.name} loading="lazy" />
                    <div className="gft-card-media-overlay" />
                  </div>

                  <div className="gft-card-glass">
                    <div className="gft-card-body">
                      <h3>{game.name}</h3>
                      <p>
                        {game.detail?.history
                          ? `${game.detail.history.slice(0, 138)}...`
                          : 'Explore this game community, discover events, teams and active players.'}
                      </p>
                      <div className="gft-card-meta">
                        <span>{game.players || '0'} players</span>
                        <span>{toTitle(game.cat || 'Game')}</span>
                      </div>
                    </div>

                    <div className="gft-card-footer">
                      <div className="gft-tags">
                        <button
                          type="button"
                          className="gft-tag gft-tag-company"
                          onClick={() => handleCompanyClick(game.company)}
                        >
                          {game.company}
                        </button>
                        {tags.map((tag) => (
                          <button
                            key={`${game.id}-${tag}`}
                            type="button"
                            className="gft-tag"
                            onClick={() => handleTagClick(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="gft-detail"
                        onClick={() => navigate(`/games/${game.id}`)}
                      >
                        Mas informacion
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default GamesFilterTemplate;
