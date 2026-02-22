import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaChevronDown,
  FaChevronRight,
  FaHandshake,
  FaUsers,
  FaStar,
  FaTrophy,
  FaGamepad,
  FaBuilding,
  FaGlobe,
  FaShieldAlt,
  FaCrown,
  FaFire,
  FaBullhorn,
  FaCalendarAlt,
  FaUserFriends,
  FaNewspaper,
} from 'react-icons/fa';
import { COMMUNITY_GAMES, COMMUNITY_GAME_TAXONOMY } from '../../data/communityData';
import { gamesDetailedData } from '../../data/gamesDetailedData';
import './CommunityGamePageTemplate.css';

const fallbackArray = (arr, fb) => (Array.isArray(arr) && arr.length > 0 ? arr : fb);
const toTitle = (v) =>
  String(v || '')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const DATA_ALIASES = {
  cs2: 'csgo', warzone: 'cod', rocket: 'rl', overwatch: 'ow2',
  hearthstone: 'hs', clashroyale: 'cr', freefire: 'ff', pubg: 'pubgm',
  rainbowsix: 'r6', r6s: 'r6', fifa: 'eafc25',
};

const COMPANY_BY_ID = {
  lol: 'Riot Games', valorant: 'Riot Games', dota2: 'Valve', mlbb: 'Moonton',
  wildrift: 'Riot Games', fortnite: 'Epic Games', cs2: 'Valve', apex: 'Respawn Entertainment',
  warzone: 'Activision', pubgm: 'Tencent', rl: 'Psyonix', tekken8: 'Bandai Namco',
  sf6: 'Capcom', gta: 'Rockstar Games', genshin: 'HoYoverse', amongus: 'Innersloth',
  fallguys: 'Mediatonic', marvel: 'NetEase Games', xdefiant: 'Ubisoft', aov: 'Tencent',
  thefinals: 'Embark Studios', tarkov: 'Battlestate Games', deadlock: 'Valve',
  eafc25: 'EA Sports', dbsz: 'Bandai Namco', multiversus: 'WB Games', palworld: 'Pocketpair',
  helldivers2: 'Arrowhead Game Studios', bg3: 'Larian Studios', ff: 'Garena',
  ow2: 'Blizzard Entertainment', r6: 'Ubisoft', hs: 'Blizzard Entertainment',
  lor: 'Riot Games', tft: 'Riot Games', hok: 'Tencent', cr: 'Supercell',
  starcraft: 'Blizzard Entertainment', nba2k: '2K Sports', mariokart: 'Nintendo',
  halo: '343 Industries', wuwa: 'Kuro Games', codbo6: 'Activision', mk1: 'WB Games',
  eldenring: 'FromSoftware', cyberpunk: 'CD Projekt Red', rdr2: 'Rockstar Games',
  mhwilds: 'Capcom', hogwarts: 'WB Games', nms: 'Hello Games',
  cod: 'Activision', csgo: 'Valve', smash: 'Nintendo', minecraft: 'Mojang',
};

const TAG_DISPLAY = {
  fps: 'FPS', moba: 'MOBA', rpg: 'RPG', rts: 'RTS', br: 'BR', pc: 'PC',
  'e-sports': 'E-Sports', esports: 'E-Sports', 'battle royale': 'Battle Royale',
  'action rpg': 'Action RPG',
};

const CommunityGamePageTemplate = () => {
  const { gameId: rawId } = useParams();
  const navigate = useNavigate();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [activeSection, setActiveSection] = useState(0);
  const [revealed, setRevealed] = useState(new Set([0]));
  const sectionRefs = useRef([]);

  const id = String(rawId || '').toLowerCase().trim();
  const detailId = DATA_ALIASES[id] || id;

  const data = gamesDetailedData?.[detailId] || gamesDetailedData?.[id] || null;
  const communityGame = COMMUNITY_GAMES.find((g) => g.id === id || g.id === detailId);
  const taxonomy = COMMUNITY_GAME_TAXONOMY?.[id] || COMMUNITY_GAME_TAXONOMY?.[detailId] || {};

  const name = data?.name || communityGame?.name || toTitle(id);
  const banner = data?.banner || communityGame?.img || '';
  const accentColor = data?.color || communityGame?.color || 'var(--primary)';
  const developer =
    data?.developer || communityGame?.developer || communityGame?.company || COMPANY_BY_ID[id] || COMPANY_BY_ID[detailId] || 'Studio';
  const history =
    data?.history ||
    `${name} es parte de la comunidad de Esportefy. Proximamente agregaremos informacion detallada, organizadores y eventos destacados.`;

  const organizers = fallbackArray(data?.organizers, [{ name: 'Esportefy Community', motto: 'Organizacion en actualizacion' }]);
  const sponsors = fallbackArray(data?.sponsors, [{ name: 'Community Sponsor' }]);
  const userCommunities = fallbackArray(data?.userCommunities, [{ name: `${name} Hub`, members: communityGame?.players || '0' }]);
  const tournaments = fallbackArray(data?.activeTournaments || data?.tournaments, [
    { title: `${name} Open Series`, prize: 'TBD', date: 'Proximamente' },
  ]);

  const tags = useMemo(() => {
    const raw = [
      ...(data?.tags || []),
      ...(taxonomy.genre || []),
      ...(taxonomy.style || []),
      ...(taxonomy.mechanics || []),
      ...(taxonomy.mode || []),
      communityGame?.cat,
    ].filter(Boolean);
    const seen = new Set();
    const result = [];
    for (const tag of raw) {
      const key = String(tag).toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        result.push(TAG_DISPLAY[key] || toTitle(tag));
      }
    }
    return result.slice(0, 8);
  }, [data, taxonomy, communityGame]);

  const relatedGames = useMemo(() => {
    const devLower = developer.toLowerCase();
    return COMMUNITY_GAMES.filter((g) => {
      const gDev = (COMPANY_BY_ID[g.id] || '').toLowerCase();
      return gDev === devLower && g.id !== id && g.id !== detailId;
    }).slice(0, 8);
  }, [developer, id, detailId]);

  /* ── Build publication feed items ── */
  const feedItems = useMemo(() => {
    const items = [];
    tournaments.forEach((t) => {
      items.push({ type: 'torneo', icon: <FaTrophy />, title: t.title, sub: t.date || 'Proximamente', badge: t.prize || 'TBD' });
    });
    userCommunities.forEach((c) => {
      items.push({ type: 'comunidad', icon: <FaUserFriends />, title: c.name, sub: `${c.members || '0'} miembros`, badge: 'ACTIVA' });
    });
    sponsors.forEach((s) => {
      items.push({ type: 'sponsor', icon: <FaCrown />, title: s.name, sub: 'Patrocinador oficial', badge: 'PARTNER' });
    });
    return items.slice(0, 6);
  }, [tournaments, userCommunities, sponsors]);

  /* ── Parallax ── */
  const onHeroMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallax({ x, y });
  };
  const onHeroLeave = () => setParallax({ x: 0, y: 0 });

  /* ── Scroll spy + reveal ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const idx = sectionRefs.current.indexOf(entry.target);
          if (idx === -1) continue;
          if (entry.isIntersecting) {
            setActiveSection(idx);
            setRevealed((prev) => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
          }
        }
      },
      { threshold: 0.18 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [relatedGames.length]);

  const scrollTo = (idx) => {
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToFilter = (type, value) => {
    if (!value) return;
    navigate(`/games/filter/${type}/${encodeURIComponent(String(value))}`);
  };

  const sectionCount = relatedGames.length > 0 ? 5 : 4;

  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 8}s`,
      size: `${2 + Math.random() * 3}px`,
    })),
  []);

  return (
    <div className="ghp" style={{ '--gc': accentColor }}>

      {/* Side dots */}
      <nav className="ghp-nav">
        {Array.from({ length: sectionCount }, (_, i) => (
          <button key={i} type="button" className={`ghp-nav__dot ${activeSection === i ? 'ghp-nav__dot--on' : ''}`} onClick={() => scrollTo(i)} />
        ))}
      </nav>

      {/* ═══════ SECTION 1 — HERO ═══════ */}
      <section className="ghp-s ghp-hero" ref={(el) => (sectionRefs.current[0] = el)} onMouseMove={onHeroMove} onMouseLeave={onHeroLeave}>
        <div className="ghp-hero__bg" style={{ backgroundImage: banner ? `url(${banner})` : 'none', transform: `translate3d(${parallax.x * 16}px, ${parallax.y * 12}px, 0) scale(1.1)` }} />
        <div className="ghp-hero__fade" />
        <div className="ghp-hero__vignette" />
        <div className="ghp-particles">{particles.map((p) => <span key={p.id} className="ghp-particle" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size }} />)}</div>

        <button className="ghp-back" type="button" onClick={() => navigate(-1)}><FaArrowLeft /> <span>VOLVER</span></button>

        <div className="ghp-hero__center">
          <span className="ghp-hero__kicker"><FaFire /> GAME HUB</span>
          <h1 className="ghp-hero__title">{name}</h1>
          <div className="ghp-hero__line" />
          <p className="ghp-hero__desc">{history.length <= 200 ? history : `${history.slice(0, 200)}...`}</p>

          <div className="ghp-hero__tags">
            <button className="ghp-chip ghp-chip--dev" type="button" onClick={() => goToFilter('company', developer)}><FaBuilding /> {developer}</button>
            {tags.map((tag) => <button key={tag} type="button" className="ghp-chip" onClick={() => goToFilter('tag', tag)}>{tag}</button>)}
          </div>

          <div className="ghp-hero__row">
            {[
              { label: 'Jugadores', value: communityGame?.players || '—', icon: <FaUsers /> },
              { label: 'Torneos', value: tournaments.length, icon: <FaTrophy /> },
              { label: 'Comunidades', value: userCommunities.length, icon: <FaGlobe /> },
              { label: 'Organizadores', value: organizers.length, icon: <FaShieldAlt /> },
            ].map((s) => (
              <div key={s.label} className="ghp-hero__stat">
                <div className="ghp-hero__stat-icon">{s.icon}</div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="ghp-scroll" type="button" onClick={() => scrollTo(1)}><span>EXPLORAR</span> <FaChevronDown /></button>
      </section>

      {/* ═══════ SECTION 2 — PUBLICATION HUB ═══════ */}
      <section className={`ghp-s ghp-sec ${revealed.has(1) ? 'ghp-sec--visible' : ''}`} ref={(el) => (sectionRefs.current[1] = el)}>
        <div className="ghp-sec__inner">
          <SectionTitle icon={<FaNewspaper />} title="Hub de Novedades" subtitle={`Torneos, comunidades y alianzas de ${name}`} />

          <div className="ghp-feed">
            {feedItems.map((item, i) => (
              <article key={`${item.title}-${i}`} className="ghp-feed__card">
                <div className="ghp-feed__card-top">
                  <span className={`ghp-feed__type ghp-feed__type--${item.type}`}>{item.icon} {item.type}</span>
                  <span className="ghp-feed__badge">{item.badge}</span>
                </div>
                <h3 className="ghp-feed__card-title">{item.title}</h3>
                <p className="ghp-feed__card-sub">{item.sub}</p>
                <div className="ghp-feed__card-line" />
              </article>
            ))}
          </div>
        </div>
        <button className="ghp-scroll ghp-scroll--sec" type="button" onClick={() => scrollTo(2)}><FaChevronDown /></button>
      </section>

      {/* ═══════ SECTION 3 — HISTORIA & COMUNIDAD ═══════ */}
      <section className={`ghp-s ghp-sec ${revealed.has(2) ? 'ghp-sec--visible' : ''}`} ref={(el) => (sectionRefs.current[2] = el)}>
        <div className="ghp-sec__inner">
          <SectionTitle icon={<FaStar />} title="Historia & Comunidad" subtitle={`Conoce la historia y comunidades de ${name}`} />

          <div className="ghp-duo">
            <article className="ghp-block">
              <div className="ghp-block__head"><FaStar /> <h3>Historia</h3></div>
              <p className="ghp-block__text">{history}</p>
            </article>
            <article className="ghp-block">
              <div className="ghp-block__head"><FaUsers /> <h3>Comunidades</h3></div>
              <div className="ghp-comm-list">
                {userCommunities.map((c, i) => (
                  <div key={`${c.name}-${i}`} className="ghp-comm">
                    <div className="ghp-comm__left">
                      <div className="ghp-comm__avatar"><FaUsers /></div>
                      <div><strong>{c.name}</strong><span>{c.members || '0'} miembros</span></div>
                    </div>
                    <FaChevronRight className="ghp-comm__arrow" />
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
        <button className="ghp-scroll ghp-scroll--sec" type="button" onClick={() => scrollTo(3)}><FaChevronDown /></button>
      </section>

      {/* ═══════ SECTION 4 — SPONSORS & ORGANIZERS ═══════ */}
      <section className={`ghp-s ghp-sec ${revealed.has(3) ? 'ghp-sec--visible' : ''}`} ref={(el) => (sectionRefs.current[3] = el)}>
        <div className="ghp-sec__inner">
          <SectionTitle icon={<FaHandshake />} title="Patrocinadores & Organizadores" subtitle="Alianzas oficiales y organizadores verificados" />

          <div className="ghp-duo">
            <article className="ghp-block">
              <div className="ghp-block__head"><FaCrown /> <h3>Patrocinadores</h3></div>
              <div className="ghp-sponsors-grid">
                {sponsors.map((s, i) => (
                  <div key={`${s.name}-${i}`} className="ghp-sponsor-item">
                    <div className="ghp-sponsor-item__ico"><FaHandshake /></div>
                    <div className="ghp-sponsor-item__info">
                      <strong>{s.name}</strong>
                      <span>Partner oficial</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <article className="ghp-block">
              <div className="ghp-block__head"><FaShieldAlt /> <h3>Organizadores</h3></div>
              <div className="ghp-org-list">
                {organizers.map((o, i) => (
                  <div key={`${o.name}-${i}`} className="ghp-org-item">
                    <div className="ghp-org-item__avatar"><FaShieldAlt /></div>
                    <div className="ghp-org-item__info">
                      <strong>{o.name}</strong>
                      <span>{o.motto || 'Official organizer'}</span>
                      {o.region && <small>{o.region}</small>}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
        {relatedGames.length > 0 && <button className="ghp-scroll ghp-scroll--sec" type="button" onClick={() => scrollTo(4)}><FaChevronDown /></button>}
      </section>

      {/* ═══════ SECTION 5 — RELATED GAMES ═══════ */}
      {relatedGames.length > 0 && (
        <section className={`ghp-s ghp-sec ${revealed.has(4) ? 'ghp-sec--visible' : ''}`} ref={(el) => (sectionRefs.current[4] = el)}>
          <div className="ghp-sec__inner">
            <SectionTitle icon={<FaGamepad />} title={`Mas de ${developer}`} subtitle="Explora otros juegos del mismo estudio" />

            <div className="ghp-related-grid">
              {relatedGames.map((g) => (
                <button key={g.id} type="button" className="ghp-rcard" onClick={() => navigate(`/game/${g.id}`)} style={{ '--rg': g.color || accentColor }}>
                  <div className="ghp-rcard__img"><img src={g.img || g.image || ''} alt={g.name} loading="lazy" /></div>
                  <div className="ghp-rcard__body">
                    <span className="ghp-rcard__cat">{g.cat}</span>
                    <h4>{g.name}</h4>
                    <span className="ghp-rcard__cta">VER HUB <FaChevronRight /></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

/* ── Section Title — centered with decorative line ── */
const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="ghp-stitle">
    <div className="ghp-stitle__icon">{icon}</div>
    <h2>{title}</h2>
    <div className="ghp-stitle__line" />
    <p>{subtitle}</p>
  </div>
);

export default CommunityGamePageTemplate;
