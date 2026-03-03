import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  TournamentAdminShell,
  shuffle,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const storageKey = (code) => `esportefy_roulette_config_${code}`;

const parseEntries = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const buildWheelGradient = (count) => {
  if (count <= 0) {
    return 'radial-gradient(circle, color-mix(in srgb, var(--primary) 22%, transparent), transparent 70%)';
  }

  const tones = [
    'color-mix(in srgb, var(--primary) 88%, white 12%)',
    'color-mix(in srgb, var(--primary-hover) 82%, white 8%)',
    'color-mix(in srgb, var(--primary) 62%, var(--bg-card))',
    'color-mix(in srgb, var(--primary-hover) 60%, var(--bg-card))',
  ];

  const slices = [];
  for (let index = 0; index < count; index += 1) {
    const start = (360 / count) * index;
    const end = (360 / count) * (index + 1);
    slices.push(`${tones[index % tones.length]} ${start}deg ${end}deg`);
  }

  return `conic-gradient(from -90deg, ${slices.join(', ')})`;
};

const createConfetti = (seed) =>
  Array.from({ length: 44 }, (_, index) => ({
    id: `${seed}-${index}`,
    left: `${(index / 43) * 100}%`,
    delay: `${(index % 10) * 0.06}s`,
    duration: `${3.1 + (index % 5) * 0.22}s`,
    rotate: `${(index % 2 === 0 ? 1 : -1) * (110 + index * 8)}deg`,
  }));

const DEFAULT_SINGLE = ['Premio 1', 'Premio 2', 'Premio 3', 'Premio 4'];

const WinnerOverlay = ({ title, winner, onClose }) => {
  if (!winner) return null;

  return (
    <div className="ta-winner-overlay">
      <div className="ta-winner-panel">
        <span className="ta-kicker">Resultado</span>
        <h3>{title}</h3>
        <strong>{winner}</strong>
        <button onClick={onClose}>Cerrar anuncio</button>
      </div>
    </div>
  );
};

const RouletteWheel = ({
  title,
  subtitle,
  items,
  rotation,
  spinning,
  centerLabel,
  result,
  onSpin,
  confetti,
  winnerTitle,
  onCloseWinner,
}) => {
  const wheelStyle = useMemo(
    () => ({ background: buildWheelGradient(items.length), transform: `rotate(${rotation}deg)` }),
    [items.length, rotation]
  );

  return (
    <article className="ta-stream-card ta-stream-card--wheel ta-stream-card--full">
      {confetti.length > 0 ? (
        <div className="ta-confetti">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                '--confetti-rotate': piece.rotate,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="ta-stream-card__head">
        <span>{subtitle}</span>
        <strong>{title}</strong>
      </div>

      <div className={`ta-wheel-frame ta-wheel-frame--hero ${spinning ? 'is-spinning' : ''}`}>
        <div className="ta-wheel-pointer" />
        <div className="ta-wheel ta-wheel--labeled" style={wheelStyle}>
          {items.map((item, index) => {
            const angle = (360 / items.length) * index;
            return (
              <div
                key={`${item}-${index}`}
                className="ta-wheel__label"
                style={{ transform: `rotate(${angle}deg)` }}
              >
                <span>{item}</span>
              </div>
            );
          })}

          <div className="ta-wheel__core">
            <small>{spinning ? 'Girando' : centerLabel}</small>
            <strong>{result || 'Listo'}</strong>
          </div>
        </div>
      </div>

      <div className="ta-roulette-tags ta-roulette-tags--dense ta-roulette-tags--centered">
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <div className="ta-stream-card__actions">
        <button onClick={onSpin} disabled={spinning || items.length === 0}>Girar ruleta</button>
      </div>

      <WinnerOverlay title={winnerTitle} winner={result && !spinning ? result : ''} onClose={onCloseWinner} />
    </article>
  );
};

const TournamentRoulettePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const liveScene = location.pathname.endsWith('/live/single')
    ? 'single'
    : location.pathname.endsWith('/live/duel')
      ? 'duel'
      : null;

  const { loading, tournament, approvedTeams, prizeOptions } = useTournamentAdminData(code);

  const [singleInput, setSingleInput] = useState('');
  const [duelInput, setDuelInput] = useState('');
  const [singleRotation, setSingleRotation] = useState(0);
  const [singleSpinning, setSingleSpinning] = useState(false);
  const [singleResult, setSingleResult] = useState('');
  const [singleConfetti, setSingleConfetti] = useState([]);
  const [duelRotation, setDuelRotation] = useState(0);
  const [duelSpinning, setDuelSpinning] = useState(false);
  const [duelResult, setDuelResult] = useState({ sideA: '', sideB: '' });
  const [duelConfetti, setDuelConfetti] = useState([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(code));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setSingleInput(parsed.singleInput || '');
        setDuelInput(parsed.duelInput || '');
        return;
      } catch {
        // ignore invalid local storage
      }
    }

    setSingleInput((prizeOptions.length > 0 ? prizeOptions : DEFAULT_SINGLE).join('\n'));
    setDuelInput((approvedTeams.length > 0 ? approvedTeams : ['Team Alpha', 'Team Bravo', 'Team Delta', 'Team Sigma']).join('\n'));
  }, [code, approvedTeams, prizeOptions]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKey(code),
      JSON.stringify({
        singleInput,
        duelInput,
      })
    );
  }, [code, singleInput, duelInput]);

  const singleItems = useMemo(() => parseEntries(singleInput), [singleInput]);
  const duelItems = useMemo(() => parseEntries(duelInput), [duelInput]);

  const spinSingle = () => {
    if (singleSpinning || singleItems.length === 0) return;

    setSingleSpinning(true);
    setSingleConfetti([]);
    setSingleResult('');
    const nextRotation = singleRotation + 2160 + Math.random() * 720;
    setSingleRotation(nextRotation);

    const tickItems = [...singleItems];
    let ticks = 0;
    const interval = window.setInterval(() => {
      setSingleResult(tickItems[Math.floor(Math.random() * tickItems.length)]);
      ticks += 1;
      if (ticks >= 22) window.clearInterval(interval);
    }, 110);

    window.setTimeout(() => {
      window.clearInterval(interval);
      const winner = tickItems[Math.floor(Math.random() * tickItems.length)];
      setSingleResult(winner);
      setSingleSpinning(false);
      setSingleConfetti(createConfetti(`single-${Date.now()}`));
      window.setTimeout(() => setSingleConfetti([]), 4200);
    }, 4200);
  };

  const spinDuel = () => {
    if (duelSpinning || duelItems.length === 0) return;

    setDuelSpinning(true);
    setDuelConfetti([]);
    setDuelResult({ sideA: '', sideB: '' });
    const nextRotation = duelRotation + 2160 + Math.random() * 720;
    setDuelRotation(nextRotation);

    let ticks = 0;
    const interval = window.setInterval(() => {
      const seeded = shuffle(duelItems);
      setDuelResult({
        sideA: seeded[0] || '',
        sideB: seeded[1] || seeded[0] || '',
      });
      ticks += 1;
      if (ticks >= 22) window.clearInterval(interval);
    }, 110);

    window.setTimeout(() => {
      window.clearInterval(interval);
      const seeded = shuffle(duelItems);
      setDuelResult({
        sideA: seeded[0] || '',
        sideB: seeded[1] || seeded[0] || '',
      });
      setDuelSpinning(false);
      setDuelConfetti(createConfetti(`duel-${Date.now()}`));
      window.setTimeout(() => setDuelConfetti([]), 4200);
    }, 4200);
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  const singleScene = (
    <section className="ta-roulette-stage ta-roulette-stage--live">
      <div className="ta-roulette-stage__backdrop" />
      <header className="ta-roulette-stage__hero ta-roulette-stage__hero--live">
        <div>
          <span className="ta-kicker">Ruleta libre</span>
          <h2>{tournament.title}</h2>
          <p>Premios, jugadores, nombres o cualquier sorteo de directo.</p>
        </div>
      </header>

      <div className="ta-roulette-stage__grid ta-roulette-stage__grid--single">
        <RouletteWheel
          title="Ruleta principal"
          subtitle="Sorteo"
          items={singleItems}
          rotation={singleRotation}
          spinning={singleSpinning}
          centerLabel="Ganador"
          result={singleResult}
          onSpin={spinSingle}
          confetti={singleConfetti}
          winnerTitle="Ganador seleccionado"
          onCloseWinner={() => setSingleResult('')}
        />
      </div>
    </section>
  );

  const duelScene = (
    <section className="ta-roulette-stage ta-roulette-stage--live">
      <div className="ta-roulette-stage__backdrop" />
      <header className="ta-roulette-stage__hero ta-roulette-stage__hero--live">
        <div>
          <span className="ta-kicker">Seleccion de lados</span>
          <h2>{tournament.title}</h2>
          <p>Escena para definir orden, equipos o enfrentamiento en directo.</p>
        </div>
      </header>

      <div className="ta-roulette-stage__grid ta-roulette-stage__grid--single">
        <article className="ta-stream-card ta-stream-card--wheel ta-stream-card--full">
          {duelConfetti.length > 0 ? (
            <div className="ta-confetti">
              {duelConfetti.map((piece) => (
                <span
                  key={piece.id}
                  style={{
                    left: piece.left,
                    animationDelay: piece.delay,
                    animationDuration: piece.duration,
                    '--confetti-rotate': piece.rotate,
                  }}
                />
              ))}
            </div>
          ) : null}

          <div className="ta-stream-card__head">
            <span>Duelo</span>
            <strong>Ruleta de orden</strong>
          </div>

          <div className={`ta-wheel-frame ta-wheel-frame--hero ${duelSpinning ? 'is-spinning' : ''}`}>
            <div className="ta-wheel-pointer" />
            <div
              className="ta-wheel ta-wheel--labeled"
              style={{ background: buildWheelGradient(duelItems.length), transform: `rotate(${duelRotation}deg)` }}
            >
              {duelItems.map((item, index) => {
                const angle = (360 / duelItems.length) * index;
                return (
                  <div
                    key={`${item}-${index}`}
                    className="ta-wheel__label"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span>{item}</span>
                  </div>
                );
              })}

              <div className="ta-wheel__core">
                <small>{duelSpinning ? 'Girando' : 'Orden'}</small>
                <strong>{duelResult.sideA && duelResult.sideB ? 'VS' : 'Teams'}</strong>
              </div>
            </div>
          </div>

          <div className="ta-stream-versus-board ta-stream-versus-board--wide">
            <div>
              <small>Lado A</small>
              <strong>{duelResult.sideA || 'Pendiente'}</strong>
            </div>
            <span>VS</span>
            <div>
              <small>Lado B</small>
              <strong>{duelResult.sideB || 'Pendiente'}</strong>
            </div>
          </div>

          <div className="ta-roulette-tags ta-roulette-tags--dense ta-roulette-tags--centered">
            {duelItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>

          <div className="ta-stream-card__actions">
            <button onClick={spinDuel} disabled={duelSpinning || duelItems.length === 0}>Elegir lados</button>
          </div>

          <WinnerOverlay
            title="Enfrentamiento elegido"
            winner={duelResult.sideA && duelResult.sideB ? `${duelResult.sideA} VS ${duelResult.sideB}` : ''}
            onClose={() => setDuelResult({ sideA: '', sideB: '' })}
          />
        </article>
      </div>
    </section>
  );

  if (liveScene === 'single') return <div className="ta-roulette-live-page">{singleScene}</div>;
  if (liveScene === 'duel') return <div className="ta-roulette-live-page">{duelScene}</div>;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="roulette">
      <section className="ta-roulette-stage">
        <div className="ta-roulette-stage__backdrop" />
        <header className="ta-roulette-stage__hero">
          <div>
            <span className="ta-kicker">Configuracion broadcast</span>
            <h2>Ruletas para directo</h2>
            <p>Prepara una ruleta libre para sorteos y otra para seleccionar lados o enfrentamientos.</p>
          </div>
        </header>

        <div className="ta-roulette-config-grid">
          <article className="ta-stream-card">
            <div className="ta-stream-card__head">
              <span>Ruleta libre</span>
              <strong>Sorteo de premios o nombres</strong>
            </div>
            <label className="ta-roulette-editor">
              <span>Items de la ruleta</span>
              <textarea
                value={singleInput}
                onChange={(e) => setSingleInput(e.target.value)}
                placeholder="Premio 1&#10;Premio 2&#10;Jugador 1"
              />
            </label>
            <div className="ta-shortcuts">
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette/live/single`)}>
                Abrir ruleta fullscreen
              </button>
            </div>
          </article>

          <article className="ta-stream-card">
            <div className="ta-stream-card__head">
              <span>Ruleta duelo</span>
              <strong>Seleccion de lados o equipos</strong>
            </div>
            <label className="ta-roulette-editor">
              <span>Participantes</span>
              <textarea
                value={duelInput}
                onChange={(e) => setDuelInput(e.target.value)}
                placeholder="Team A&#10;Team B&#10;Team C"
              />
            </label>
            <div className="ta-shortcuts">
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette/live/duel`)}>
                Abrir duelo fullscreen
              </button>
            </div>
          </article>
        </div>
      </section>
    </TournamentAdminShell>
  );
};

export default TournamentRoulettePage;
