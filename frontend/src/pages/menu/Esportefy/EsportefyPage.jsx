import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './EsportefyPage.css';

/* ═══════════════════════════════════════
   SCENE DATA
   ═══════════════════════════════════════ */
const SCENES = [
  {
    id: 'hero',
    kicker: 'La plataforma',
    title: 'GLITCH GANG',
    subtitle: 'Donde la competencia se convierte en cultura.',
    desc: 'Somos la plataforma de esports que centraliza torneos, equipos y comunidad en un solo ecosistema profesional. Diseñada para jugadores, organizadores y marcas que buscan competir al más alto nivel.',
    stats: [
      { value: '3', label: 'Juegos soportados' },
      { value: '24/7', label: 'Plataforma activa' },
      { value: '100%', label: 'Gratuito para equipos' },
    ],
  },
  {
    id: 'mission',
    kicker: 'Nuestra misión',
    step: '01',
    title: 'Democratizar los esports en Latinoamérica.',
    desc: 'Creemos que todo jugador merece acceso a competencia organizada, herramientas profesionales y una comunidad que lo respalde. GLITCH GANG elimina las barreras entre el talento y la oportunidad.',
    cards: [
      { icon: 'bx-trophy', title: 'Torneos accesibles', body: 'Cualquier organizador puede crear torneos con brackets profesionales, reglas claras y gestión automatizada.' },
      { icon: 'bx-group', title: 'Equipos organizados', body: 'Hub completo para crear equipos, gestionar rosters, reclutar jugadores y coordinar competencias.' },
      { icon: 'bx-globe', title: 'Comunidad conectada', body: 'Un ecosistema donde jugadores, equipos y organizadores interactúan bajo un mismo techo digital.' },
    ],
  },
  {
    id: 'values',
    kicker: 'Nuestros valores',
    step: '02',
    title: 'Principios que definen cada decisión.',
    desc: 'La identidad de GLITCH GANG no es solo visual. Cada funcionalidad, cada interacción y cada línea de código refleja estos pilares fundamentales.',
    pillars: [
      { icon: 'bx-shield-quarter', title: 'Integridad competitiva', body: 'Verificación anti-smurf, validación de cuentas y reglas transparentes. La competencia justa no es negociable.' },
      { icon: 'bx-analyse', title: 'Claridad operativa', body: 'Flujos intuitivos que reducen fricción. Desde inscripción hasta resultados, todo debe ser claro y directo.' },
      { icon: 'bx-rocket', title: 'Evolución constante', body: 'La plataforma se adapta. Escuchamos a la comunidad, iteramos rápido y entregamos mejoras reales cada semana.' },
      { icon: 'bx-heart', title: 'Comunidad primero', body: 'Las decisiones de producto priorizan la experiencia de jugadores y organizadores sobre cualquier métrica vanidosa.' },
    ],
  },
  {
    id: 'platform',
    kicker: 'La plataforma',
    step: '03',
    title: 'Todo lo que necesitas para competir.',
    desc: 'Un ecosistema completo que cubre cada aspecto de la experiencia esports, desde la creación del equipo hasta la final del torneo.',
    features: [
      { icon: 'bx-bracket', title: 'Brackets inteligentes', body: 'Eliminación simple, doble, round robin y formatos híbridos con gestión automatizada de resultados.' },
      { icon: 'bx-user-check', title: 'Verificación de cuentas', body: 'Sistema anti-smurf que vincula tu cuenta real del juego para garantizar competencia en tu nivel.' },
      { icon: 'bx-video', title: 'Streams integrados', body: 'Conecta tu transmisión directamente al torneo. Los espectadores siguen la acción en tiempo real.' },
      { icon: 'bx-wallet', title: 'Wallet y premios', body: 'Sistema de pagos integrado con retiros por PayPal, transferencia bancaria y criptomonedas.' },
      { icon: 'bx-shield', title: 'Staff de torneo', body: 'Asigna administradores, árbitros y moderadores con permisos granulares para cada evento.' },
      { icon: 'bx-bar-chart-alt-2', title: 'Centro de partidos', body: 'Gestión centralizada de cada match: scores, evidencias, disputas y resultados en un solo lugar.' },
    ],
  },
  {
    id: 'games',
    kicker: 'Juegos soportados',
    step: '04',
    title: 'Los títulos que mueven la escena.',
    desc: 'Cada juego tiene su propia configuración de roles, verificación de cuentas y reglas específicas dentro de la plataforma.',
    gameList: [
      { name: 'Mobile Legends: Bang Bang', short: 'MLBB', desc: 'El MOBA móvil más competitivo de Latinoamérica. Verificación de cuenta, roles por posición y torneos de 5v5.', color: '#3d7dca' },
      { name: 'Valorant', short: 'VAL', desc: 'FPS táctico de Riot Games. Integración con Riot ID, verificación RSO y brackets adaptados al formato competitivo.', color: '#fd4556' },
      { name: 'League of Legends', short: 'LoL', desc: 'El MOBA por excelencia. Verificación de cuenta Riot, roles de equipo y formatos profesionales de competición.', color: '#c89b3c' },
    ],
  },
  {
    id: 'team',
    kicker: 'El equipo',
    step: '05',
    title: 'Las personas detrás de la plataforma.',
    desc: 'GLITCH GANG es impulsado por un equipo multidisciplinario con pasión real por los esports y compromiso con la excelencia operativa.',
    roles: [
      { icon: 'bx-code-alt', area: 'Ingeniería', body: 'Arquitectura, rendimiento, seguridad y evolución continua de toda la infraestructura técnica.' },
      { icon: 'bx-palette', area: 'Diseño & UX', body: 'Identidad visual, experiencia de usuario y sistema de diseño cohesivo para toda la plataforma.' },
      { icon: 'bx-trophy', area: 'Competencia', body: 'Operación de torneos, reglas, brackets, staff y decisiones clave durante eventos en vivo.' },
      { icon: 'bx-conversation', area: 'Comunidad', body: 'Gestión de relaciones con equipos, jugadores y organizadores. Feedback constante.' },
      { icon: 'bx-support', area: 'Soporte', body: 'Resolución de incidencias, pagos, disputas y acompañamiento al usuario en tiempo real.' },
    ],
  },
  {
    id: 'cta',
    kicker: 'Únete',
    title: 'La competencia te espera.',
    desc: 'Empieza a competir hoy. Crea tu equipo, inscríbete en torneos y forma parte de la comunidad de esports más organizada de la región.',
  },
];

/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */
const AUTO_SCROLL_MS = 6000;
const TOTAL_SECTIONS = SCENES.length;

const EsportefyPage = () => {
  const sectionRefs = useRef([]);
  const [visibleSections, setVisibleSections] = useState(new Set());
  const [autoScroll, setAutoScroll] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);

  // Intersection observer — mark sections as visible for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = entry.target.dataset.idx;
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, idx]));
            setCurrentSection(Number(idx));
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
    );

    sectionRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  // Auto-scroll every 6s — stops on any click/touch
  useEffect(() => {
    if (!autoScroll) return;
    const timer = setTimeout(() => {
      const next = currentSection + 1;
      if (next < TOTAL_SECTIONS) {
        sectionRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setCurrentSection(next);
      } else {
        setAutoScroll(false);
      }
    }, AUTO_SCROLL_MS);
    return () => clearTimeout(timer);
  }, [autoScroll, currentSection]);

  // Stop auto-scroll on user interaction
  const stopAuto = () => { if (autoScroll) setAutoScroll(false); };

  const jumpTo = (idx) => {
    setAutoScroll(false);
    setCurrentSection(idx);
    sectionRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const isVisible = (idx) => visibleSections.has(String(idx));

  return (
    <div className="ef" onPointerDownCapture={stopAuto}>
      {/* ── Nav Rail + Hint ── */}
      <div className="ef-chrome">
        <p className="ef-hint">
          <i className={`bx ${autoScroll ? 'bx-play-circle' : 'bx-hand'}`}></i>
          {autoScroll ? 'Secuencia automática' : 'Modo manual'}
        </p>
        <nav className="ef-rail">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              className={`ef-rail__btn ${i === currentSection ? 'active' : ''} ${isVisible(i) ? 'visited' : ''}`}
              onClick={() => jumpTo(i)}
            >
              <span className="ef-rail__dot" />
              <span className="ef-rail__label">{s.kicker}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* ── HERO ── */}
      <section
        ref={(el) => (sectionRefs.current[0] = el)}
        data-idx="0"
        className={`ef-hero ${isVisible(0) ? 'is-visible' : ''}`}
      >
        <div className="ef-hero__glow" />
        <div className="ef-hero__inner">
          <span className="ef-kicker"><i className='bx bx-bolt-circle'></i> {SCENES[0].kicker}</span>
          <h1 className="ef-hero__wordmark">
            {[...SCENES[0].title].map((letter, index) => (
              letter === ' ' ? (
                <span key={`space-${index}`} className="ef-hero__space" aria-hidden="true" />
              ) : (
                <span key={`${letter}-${index}`} className="ef-hero__letter" style={{ '--i': index }}>
                  {letter}
                </span>
              )
            ))}
          </h1>
          <p className="ef-hero__subtitle">{SCENES[0].subtitle}</p>
          <p className="ef-hero__desc">{SCENES[0].desc}</p>

          <div className="ef-hero__stats">
            {SCENES[0].stats.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="ef-hero__stat-sep" />}
                <div className="ef-hero__stat">
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="ef-hero__actions">
            <Link to="/equipos" className="ef-btn ef-btn--primary"><i className='bx bx-shield-quarter'></i> Explorar equipos</Link>
            <Link to="/tournaments" className="ef-btn ef-btn--ghost"><i className='bx bx-trophy'></i> Ver torneos</Link>
          </div>
        </div>
        <div className="ef-hero__scroll">
          <i className='bx bx-chevrons-down'></i>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section
        ref={(el) => (sectionRefs.current[1] = el)}
        data-idx="1"
        className={`ef-section ${isVisible(1) ? 'is-visible' : ''}`}
      >
        <div className="ef-section__inner">
          <div className="ef-section__head">
            <span className="ef-kicker"><i className='bx bx-target-lock'></i> {SCENES[1].kicker}</span>
            <span className="ef-step">{SCENES[1].step}</span>
          </div>
          <h2 className="ef-section__title">{SCENES[1].title}</h2>
          <p className="ef-section__desc">{SCENES[1].desc}</p>
          <div className="ef-cards ef-cards--3">
            {SCENES[1].cards.map((c, i) => (
              <div key={i} className="ef-card" style={{ '--delay': `${i * 0.12}s` }}>
                <div className="ef-card__icon"><i className={`bx ${c.icon}`}></i></div>
                <h4>{c.title}</h4>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section
        ref={(el) => (sectionRefs.current[2] = el)}
        data-idx="2"
        className={`ef-section ef-section--alt ${isVisible(2) ? 'is-visible' : ''}`}
      >
        <div className="ef-section__inner">
          <div className="ef-section__head">
            <span className="ef-kicker"><i className='bx bx-diamond'></i> {SCENES[2].kicker}</span>
            <span className="ef-step">{SCENES[2].step}</span>
          </div>
          <h2 className="ef-section__title">{SCENES[2].title}</h2>
          <p className="ef-section__desc">{SCENES[2].desc}</p>
          <div className="ef-cards ef-cards--4">
            {SCENES[2].pillars.map((p, i) => (
              <div key={i} className="ef-card ef-card--pillar" style={{ '--delay': `${i * 0.1}s` }}>
                <div className="ef-card__icon"><i className={`bx ${p.icon}`}></i></div>
                <h4>{p.title}</h4>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM ── */}
      <section
        ref={(el) => (sectionRefs.current[3] = el)}
        data-idx="3"
        className={`ef-section ${isVisible(3) ? 'is-visible' : ''}`}
      >
        <div className="ef-section__inner">
          <div className="ef-section__head">
            <span className="ef-kicker"><i className='bx bx-cube-alt'></i> {SCENES[3].kicker}</span>
            <span className="ef-step">{SCENES[3].step}</span>
          </div>
          <h2 className="ef-section__title">{SCENES[3].title}</h2>
          <p className="ef-section__desc">{SCENES[3].desc}</p>
          <div className="ef-cards ef-cards--3">
            {SCENES[3].features.map((f, i) => (
              <div key={i} className="ef-card ef-card--feature" style={{ '--delay': `${i * 0.08}s` }}>
                <div className="ef-card__icon"><i className={`bx ${f.icon}`}></i></div>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMES ── */}
      <section
        ref={(el) => (sectionRefs.current[4] = el)}
        data-idx="4"
        className={`ef-section ef-section--alt ${isVisible(4) ? 'is-visible' : ''}`}
      >
        <div className="ef-section__inner">
          <div className="ef-section__head">
            <span className="ef-kicker"><i className='bx bx-joystick'></i> {SCENES[4].kicker}</span>
            <span className="ef-step">{SCENES[4].step}</span>
          </div>
          <h2 className="ef-section__title">{SCENES[4].title}</h2>
          <p className="ef-section__desc">{SCENES[4].desc}</p>
          <div className="ef-games">
            {SCENES[4].gameList.map((g, i) => (
              <div key={i} className="ef-game" style={{ '--gc': g.color, '--delay': `${i * 0.12}s` }}>
                <div className="ef-game__badge">{g.short}</div>
                <div className="ef-game__info">
                  <h4>{g.name}</h4>
                  <p>{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section
        ref={(el) => (sectionRefs.current[5] = el)}
        data-idx="5"
        className={`ef-section ${isVisible(5) ? 'is-visible' : ''}`}
      >
        <div className="ef-section__inner">
          <div className="ef-section__head">
            <span className="ef-kicker"><i className='bx bx-group'></i> {SCENES[5].kicker}</span>
            <span className="ef-step">{SCENES[5].step}</span>
          </div>
          <h2 className="ef-section__title">{SCENES[5].title}</h2>
          <p className="ef-section__desc">{SCENES[5].desc}</p>
          <div className="ef-roles">
            {SCENES[5].roles.map((r, i) => (
              <div key={i} className="ef-role" style={{ '--delay': `${i * 0.1}s` }}>
                <div className="ef-role__icon"><i className={`bx ${r.icon}`}></i></div>
                <div>
                  <strong>{r.area}</strong>
                  <p>{r.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        ref={(el) => (sectionRefs.current[6] = el)}
        data-idx="6"
        className={`ef-cta ${isVisible(6) ? 'is-visible' : ''}`}
      >
        <div className="ef-cta__glow" />
        <div className="ef-cta__inner">
          <span className="ef-kicker"><i className='bx bx-rocket'></i> {SCENES[6].kicker}</span>
          <h2>{SCENES[6].title}</h2>
          <p>{SCENES[6].desc}</p>
          <div className="ef-cta__actions">
            <Link to="/create-team" className="ef-btn ef-btn--primary ef-btn--lg"><i className='bx bx-plus-circle'></i> Crear equipo</Link>
            <Link to="/tournaments" className="ef-btn ef-btn--ghost ef-btn--lg"><i className='bx bx-trophy'></i> Explorar torneos</Link>
            <Link to="/support" className="ef-btn ef-btn--ghost ef-btn--lg"><i className='bx bx-support'></i> Centro de ayuda</Link>
          </div>
          <p className="ef-cta__footer">
            <i className='bx bx-code-alt'></i> Desarrollado con pasión por el equipo de <strong>GLITCH GANG</strong> &middot; Dirección visual por <strong>Steliant</strong>
          </p>
        </div>
      </section>
    </div>
  );
};

export default EsportefyPage;
