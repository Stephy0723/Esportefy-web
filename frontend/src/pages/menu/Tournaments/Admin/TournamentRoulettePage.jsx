import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { useNotification } from '../../../../context/NotificationContext';
import {
  TournamentAdminShell,
  createEmptyMatch,
  shuffle,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const parseEntries = (value) =>
  String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const WHEEL_COLORS = [
  '#8EDB15', '#6bbf1a', '#4fa312', '#3d8a0e',
  '#a3e635', '#84cc16', '#65a30d', '#4d7c0f',
];

const createConfetti = (seed) =>
  Array.from({ length: 50 }, (_, i) => ({
    id: `${seed}-${i}`,
    left: `${(i / 49) * 100}%`,
    delay: `${(i % 10) * 0.05}s`,
    duration: `${2.8 + (i % 5) * 0.2}s`,
    rotate: `${(i % 2 === 0 ? 1 : -1) * (120 + i * 7)}deg`,
    color: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#8EDB15' : '#fff',
  }));

/* ── Spinning Wheel Component ── */
const SpinningWheel = ({ items, onResult, disabled }) => {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const segmentAngle = items.length > 0 ? 360 / items.length : 360;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || items.length === 0) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;

    ctx.clearRect(0, 0, size, size);

    items.forEach((item, i) => {
      const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(10, Math.min(14, 180 / items.length))}px system-ui, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      const maxLen = 16;
      const label = item.length > maxLen ? item.slice(0, maxLen - 1) + '...' : item;
      ctx.fillText(label, radius - 14, 5);
      ctx.restore();
    });

    // Center
    ctx.beginPath();
    ctx.arc(center, center, radius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1a10';
    ctx.fill();
    ctx.strokeStyle = '#8EDB15';
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [items, segmentAngle]);

  const spin = useCallback(() => {
    if (spinning || items.length === 0 || disabled) return;
    setSpinning(true);

    const extraSpins = 5 + Math.random() * 3;
    const targetAngle = Math.random() * 360;
    const totalRotation = rotation + extraSpins * 360 + targetAngle;

    setRotation(totalRotation);

    setTimeout(() => {
      const normalizedAngle = (360 - (totalRotation % 360)) % 360;
      const winnerIndex = Math.floor(normalizedAngle / segmentAngle) % items.length;
      setSpinning(false);
      onResult(items[winnerIndex], winnerIndex);
    }, 4500);
  }, [spinning, items, disabled, rotation, segmentAngle, onResult]);

  return (
    <div className="rl-wheel-container">
      <div className="rl-wheel-pointer" />
      <div
        className="rl-wheel-spinner"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
        }}
      >
        <canvas ref={canvasRef} width={440} height={440} className="rl-wheel-canvas" />
      </div>
      <button className="rl-wheel-spin-btn" onClick={spin} disabled={spinning || items.length === 0 || disabled}>
        {spinning ? 'GIRANDO...' : 'GIRAR'}
      </button>
    </div>
  );
};

/* ── Winner Overlay ── */
const WinnerOverlay = ({ winner, onClose }) => {
  if (!winner) return null;
  return (
    <div className="rl-winner-overlay" onClick={onClose}>
      <div className="rl-winner-card" onClick={(e) => e.stopPropagation()}>
        <div className="rl-winner-crown">&#9733;</div>
        <span className="ta-kicker">Ganador seleccionado</span>
        <h2 className="rl-winner-name">{winner}</h2>
        <button onClick={onClose}>Continuar</button>
      </div>
    </div>
  );
};

/* ── Single Roulette (General Purpose) ── */
const SingleRoulette = ({ tournament, initialItems, liveMode }) => {
  const [input, setInput] = useState(initialItems.join('\n'));
  const [items, setItems] = useState(initialItems);
  const [history, setHistory] = useState([]);
  const [winner, setWinner] = useState('');
  const [confetti, setConfetti] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [removeOnWin, setRemoveOnWin] = useState(true);

  const totalItems = useMemo(() => parseEntries(input).length, [input]);

  useEffect(() => { if (!isEditing) setItems(parseEntries(input)); }, [input, isEditing]);

  const handleResult = useCallback((winnerName) => {
    setWinner(winnerName);
    setHistory((prev) => [{ name: winnerName, time: new Date().toLocaleTimeString('es-DO') }, ...prev]);
    setConfetti(createConfetti(Date.now()));
    setTimeout(() => setConfetti([]), 4000);
    if (removeOnWin) {
      setItems((prev) => { const idx = prev.indexOf(winnerName); if (idx === -1) return prev; const n = [...prev]; n.splice(idx, 1); return n; });
      setInput((prev) => { const lines = prev.split('\n').map((l) => l.trim()).filter(Boolean); const idx = lines.indexOf(winnerName); if (idx === -1) return prev; lines.splice(idx, 1); return lines.join('\n'); });
    }
  }, [removeOnWin]);

  const handleReset = () => {
    setInput(initialItems.join('\n'));
    setItems(initialItems);
    setHistory([]);
  };

  const handleApplyEdit = () => {
    setItems(parseEntries(input));
    setIsEditing(false);
  };

  const singleHistoryPanel = (
    <aside className="rl-history-panel">
      <div className="rl-history-panel__header">
        <span className="ta-kicker">Resultados</span>
        <span className="rl-history-panel__count">{history.length} seleccionados</span>
      </div>

      <div className="rl-history-panel__progress">
        <div
          className="rl-history-panel__progress-fill"
          style={{ width: `${totalItems > 0 ? (history.length / totalItems) * 100 : 0}%` }}
        />
      </div>

      <div className="rl-history-panel__pool">
        <span>{items.length} restantes</span>
        <span>{history.length} sorteados</span>
      </div>

      <div className="rl-history-panel__list">
        {history.length === 0 ? (
          <div className="rl-history-panel__empty">Gira la ruleta para comenzar</div>
        ) : (
          history.map((h, i) => (
            <div key={i} className="rl-history-panel__match">
              <span className="rl-history-panel__num">{history.length - i}</span>
              <div className="rl-history-panel__teams">
                <strong>{h.name}</strong>
              </div>
              <small>{h.time}</small>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="rl-history-panel__remaining">
          <span className="ta-kicker">Pendientes ({items.length})</span>
          <div className="rl-team-pool">
            {items.map((t) => (<span key={t} className="rl-item-tag">{t}</span>))}
          </div>
        </div>
      )}

      <div className="rl-history-panel__actions">
        <button className="ghost" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancelar' : 'Editar lista'}
        </button>
        <button className="ghost" onClick={handleReset}>Reiniciar</button>
      </div>
    </aside>
  );

  return (
    <div className={`rl-page ${liveMode ? 'rl-page--live' : ''}`}>
      {confetti.length > 0 && (
        <div className="rl-confetti">
          {confetti.map((p) => (
            <span key={p.id} style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--confetti-rotate': p.rotate, background: p.color }} />
          ))}
        </div>
      )}
      <div className={`rl-layout ${liveMode ? 'rl-layout--duel-live' : ''}`}>
        {!liveMode && (
          <aside className="rl-sidebar">
            <div className="ta-panel">
              <span className="ta-kicker">Configuracion</span>
              <h3>Ruleta personalizada</h3>
              <label className="rl-textarea-label">
                <span>Participantes / Premios / Items (uno por linea)</span>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Jugador 1&#10;Espectador VIP&#10;Premio sorpresa" rows={8} />
              </label>
              <label className="rl-checkbox-label">
                <input type="checkbox" checked={removeOnWin} onChange={(e) => setRemoveOnWin(e.target.checked)} />
                <span>Eliminar al salir seleccionado</span>
              </label>
              <div className="ta-shortcuts">
                <button className="ghost" onClick={handleReset}>Reiniciar</button>
              </div>
            </div>
            <div className="ta-panel">
              <span className="ta-kicker">Historial ({history.length})</span>
              <h3>Seleccionados</h3>
              {history.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Sin resultados aun.</p>
              ) : (
                <div className="rl-history">
                  {history.map((h, i) => (
                    <div key={i} className="rl-history__item">
                      <span className="rl-history__pos">{history.length - i}</span>
                      <strong>{h.name}</strong>
                      <small>{h.time}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
        <main className="rl-main">
          <div className="rl-stage">
            <div className="rl-stage__backdrop" />
            <div className="rl-stage__content">
              <div className="rl-stage__header">
                <span className="ta-kicker">{liveMode ? 'En directo' : 'Sorteo'}</span>
                <h2>{tournament.title}</h2>
                <p>{items.length} participantes restantes</p>
              </div>

              {isEditing ? (
                <div className="rl-live-editor">
                  <label className="rl-textarea-label">
                    <span>Edita los nombres (uno por linea)</span>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Jugador 1&#10;Espectador VIP&#10;Premio sorpresa"
                      rows={10}
                    />
                  </label>
                  <label className="rl-checkbox-label">
                    <input type="checkbox" checked={removeOnWin} onChange={(e) => setRemoveOnWin(e.target.checked)} />
                    <span>Eliminar al salir seleccionado</span>
                  </label>
                  <button onClick={handleApplyEdit}>Aplicar cambios</button>
                </div>
              ) : (
                <>
                  <SpinningWheel items={items} onResult={handleResult} />
                  <div className="rl-items-bar">
                    {items.map((item) => (<span key={item} className="rl-item-tag">{item}</span>))}
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
        {liveMode && singleHistoryPanel}
      </div>
      <WinnerOverlay winner={winner} onClose={() => setWinner('')} />
    </div>
  );
};

/* ── Duel Roulette ── */
const DuelRoulette = ({ tournament, teams, liveMode, onApplyToBracket }) => {
  const [pool, setPool] = useState(teams);
  const [usedTeams, setUsedTeams] = useState([]);
  const [history, setHistory] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [confetti, setConfetti] = useState([]);
  const [tickTeamA, setTickTeamA] = useState('');
  const [tickTeamB, setTickTeamB] = useState('');
  const [applying, setApplying] = useState(false);

  const spinDuel = () => {
    if (spinning || pool.length < 2) return;
    setSpinning(true);
    setResult(null);

    let ticks = 0;
    const interval = setInterval(() => {
      const s = shuffle(pool);
      setTickTeamA(s[0]);
      setTickTeamB(s[1]);
      ticks += 1;
      if (ticks >= 30) clearInterval(interval);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const s = shuffle(pool);
      const teamA = s[0];
      const teamB = s[1];
      setTickTeamA(teamA);
      setTickTeamB(teamB);
      setResult({ teamA, teamB });
      setHistory((prev) => [{ teamA, teamB, time: new Date().toLocaleTimeString('es-DO') }, ...prev]);
      setSpinning(false);
      setConfetti(createConfetti(Date.now()));
      setTimeout(() => setConfetti([]), 4000);

      // Remove used teams from pool
      setPool((prev) => prev.filter((t) => t !== teamA && t !== teamB));
      setUsedTeams((prev) => [...prev, teamA, teamB]);
    }, 3000);
  };

  const resetPool = () => {
    setPool(teams);
    setUsedTeams([]);
    setHistory([]);
  };

  const handleApply = async () => {
    if (history.length === 0 || applying) return;
    setApplying(true);
    try {
      await onApplyToBracket(history);
    } finally {
      setApplying(false);
    }
  };

  const allPaired = pool.length < 2 && history.length > 0;

  const historyPanel = (
    <aside className="rl-history-panel">
      <div className="rl-history-panel__header">
        <span className="ta-kicker">Historial de emparejamientos</span>
        <span className="rl-history-panel__count">{history.length} / {Math.floor(teams.length / 2)}</span>
      </div>

      {/* Progress bar */}
      <div className="rl-history-panel__progress">
        <div
          className="rl-history-panel__progress-fill"
          style={{ width: `${teams.length > 1 ? (history.length / Math.floor(teams.length / 2)) * 100 : 0}%` }}
        />
      </div>

      {/* Pool status */}
      <div className="rl-history-panel__pool">
        <span>{pool.length} restantes</span>
        <span>{usedTeams.length} emparejados</span>
      </div>

      {/* Match list */}
      <div className="rl-history-panel__list">
        {history.length === 0 ? (
          <div className="rl-history-panel__empty">
            Gira para emparejar equipos
          </div>
        ) : (
          [...history].reverse().map((h, i) => (
            <div key={i} className="rl-history-panel__match">
              <span className="rl-history-panel__num">{i + 1}</span>
              <div className="rl-history-panel__teams">
                <strong>{h.teamA}</strong>
                <span className="rl-history-panel__vs">VS</span>
                <strong>{h.teamB}</strong>
              </div>
              <small>{h.time}</small>
            </div>
          ))
        )}
      </div>

      {/* Remaining pool tags */}
      {pool.length > 0 && (
        <div className="rl-history-panel__remaining">
          <span className="ta-kicker">En espera</span>
          <div className="rl-team-pool">
            {pool.map((t) => (<span key={t} className="rl-item-tag">{t}</span>))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rl-history-panel__actions">
        {allPaired && (
          <button onClick={handleApply} disabled={applying}>
            {applying ? 'Aplicando...' : 'Aplicar al bracket'}
          </button>
        )}
        <button className="ghost" onClick={resetPool}>Reiniciar</button>
      </div>
    </aside>
  );

  return (
    <div className={`rl-page ${liveMode ? 'rl-page--live' : ''}`}>
      {confetti.length > 0 && (
        <div className="rl-confetti">
          {confetti.map((p) => (
            <span key={p.id} style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, '--confetti-rotate': p.rotate, background: p.color }} />
          ))}
        </div>
      )}
      <div className={`rl-layout ${liveMode ? 'rl-layout--duel-live' : ''}`}>
        {!liveMode && (
          <aside className="rl-sidebar">
            <div className="ta-panel">
              <span className="ta-kicker">Pool restante ({pool.length})</span>
              <h3>Equipos disponibles</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Equipos que aun no han sido emparejados.
              </p>
              <div className="rl-team-pool">{pool.map((t) => (<span key={t} className="rl-item-tag">{t}</span>))}</div>
              {pool.length < 2 && pool.length > 0 && (
                <div className="ta-empty">Queda 1 equipo sin emparejar (BYE en la primera ronda).</div>
              )}
              {pool.length === 0 && history.length > 0 && (
                <div className="ta-empty">Todos los equipos han sido emparejados.</div>
              )}
            </div>
            <div className="ta-panel">
              <span className="ta-kicker">Emparejamientos ({history.length})</span>
              <h3>Bracket de la ruleta</h3>
              {history.length === 0 ? (
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Gira la ruleta para emparejar equipos.</p>
              ) : (
                <div className="rl-history">
                  {[...history].reverse().map((h, i) => (
                    <div key={i} className="rl-history__item rl-history__item--duel">
                      <span className="rl-history__pos">{i + 1}</span>
                      <strong>{h.teamA}</strong>
                      <span className="rl-history__vs">VS</span>
                      <strong>{h.teamB}</strong>
                    </div>
                  ))}
                </div>
              )}
              <div className="ta-shortcuts" style={{ marginTop: 12 }}>
                {history.length > 0 && (
                  <button onClick={handleApply} disabled={applying}>
                    {applying ? 'Aplicando...' : 'Aplicar al bracket'}
                  </button>
                )}
                <button className="ghost" onClick={resetPool}>Reiniciar</button>
              </div>
            </div>
          </aside>
        )}
        <main className="rl-main">
          <div className="rl-stage">
            <div className="rl-stage__backdrop" />
            <div className="rl-stage__content">
              <div className="rl-stage__header">
                <span className="ta-kicker">{liveMode ? 'En directo' : 'Duelo aleatorio'}</span>
                <h2>{tournament.title}</h2>
                <p>
                  {allPaired
                    ? 'Todos los equipos emparejados. Aplica el resultado al bracket.'
                    : `${pool.length} equipos restantes por emparejar`}
                </p>
              </div>

              <div className={`rl-duel-stage ${spinning ? 'rl-duel-stage--spinning' : ''} ${result ? 'rl-duel-stage--result' : ''}`}>
                <div className="rl-duel-card rl-duel-card--a">
                  <span className="rl-duel-label">LADO A</span>
                  <strong className={`rl-duel-name ${spinning ? 'rl-duel-name--ticking' : ''}`}>
                    {result ? result.teamA : tickTeamA || '???'}
                  </strong>
                </div>
                <div className="rl-duel-vs">
                  <div className={`rl-duel-vs__circle ${spinning ? 'rl-duel-vs__circle--spin' : ''}`}>
                    <strong>VS</strong>
                  </div>
                </div>
                <div className="rl-duel-card rl-duel-card--b">
                  <span className="rl-duel-label">LADO B</span>
                  <strong className={`rl-duel-name ${spinning ? 'rl-duel-name--ticking' : ''}`}>
                    {result ? result.teamB : tickTeamB || '???'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
                {!allPaired ? (
                  <button className="rl-spin-duel-btn" onClick={spinDuel} disabled={spinning || pool.length < 2}>
                    {spinning ? 'Seleccionando...' : 'Elegir enfrentamiento'}
                  </button>
                ) : (
                  <button className="rl-spin-duel-btn" onClick={handleApply} disabled={applying}>
                    {applying ? 'Aplicando...' : 'Aplicar al bracket'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        {liveMode && historyPanel}
      </div>

      {result && !spinning && (
        <div className="rl-winner-overlay" onClick={() => setResult(null)}>
          <div className="rl-winner-card rl-winner-card--duel" onClick={(e) => e.stopPropagation()}>
            <span className="ta-kicker">Enfrentamiento seleccionado</span>
            <div className="rl-winner-duel-display">
              <div className="rl-winner-duel-side"><small>LADO A</small><h2>{result.teamA}</h2></div>
              <div className="rl-winner-duel-vs">VS</div>
              <div className="rl-winner-duel-side"><small>LADO B</small><h2>{result.teamB}</h2></div>
            </div>
            <button onClick={() => setResult(null)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Build bracket from roulette matchups ── */
const roundLabel = (index, total) => {
  const labels = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];
  return labels[Math.max(0, labels.length - total + index)] || `Ronda ${index + 1}`;
};

const toTeamObj = (name) => {
  if (!name) return { refId: '', teamName: '', isBye: true };
  return { refId: name, teamName: name, isBye: false };
};

const buildBracketFromMatchups = (matchups) => {
  const pairs = [...matchups].reverse(); // oldest first
  const firstRoundMatches = pairs.map((pair) => ({
    ...createEmptyMatch(),
    teamA: toTeamObj(pair.teamA),
    teamB: toTeamObj(pair.teamB),
  }));

  const nextPower = 2 ** Math.ceil(Math.log2(Math.max(2, firstRoundMatches.length)));
  // Pad with empty matches if needed
  while (firstRoundMatches.length < nextPower / 2) {
    firstRoundMatches.push(createEmptyMatch());
  }

  const totalRounds = Math.log2(nextPower);
  const rounds = [{ name: roundLabel(0, totalRounds), matches: firstRoundMatches }];

  for (let r = 1; r < totalRounds; r++) {
    const matchCount = Math.max(1, firstRoundMatches.length / (2 ** r));
    rounds.push({
      name: roundLabel(r, totalRounds),
      matches: Array.from({ length: matchCount }, () => createEmptyMatch()),
    });
  }

  return { title: 'Bracket principal', format: 'single_elimination', rounds };
};

/* ── Main Page ── */
const DEFAULT_SINGLE = ['Premio 1', 'Premio 2', 'Premio 3', 'Premio 4', 'Premio 5', 'Premio 6'];

const TournamentRoulettePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useNotification();
  const liveScene = location.pathname.endsWith('/live/single')
    ? 'single'
    : location.pathname.endsWith('/live/duel')
      ? 'duel'
      : null;

  const { loading, tournament, bracket, approvedTeams, prizeOptions } = useTournamentAdminData(code);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const singleItems = useMemo(() => (prizeOptions.length > 0 ? prizeOptions : DEFAULT_SINGLE), [prizeOptions]);
  const duelTeams = useMemo(() => (approvedTeams.length > 0 ? approvedTeams : ['Team Alpha', 'Team Bravo', 'Team Delta', 'Team Sigma']), [approvedTeams]);

  const applyToBracket = useCallback(async (matchups) => {
    const bracket = buildBracketFromMatchups(matchups);
    try {
      await axios.patch(
        `${API_URL}/api/tournaments/${code}/bracket`,
        { bracket },
        { headers: authHeaders }
      );
      addToast('Bracket generado desde la ruleta. Redirigiendo...', 'success');
      navigate(`/tournaments/manage/${tournament.tournamentId}/bracket`);
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo guardar el bracket.', 'error');
    }
  }, [code, authHeaders, navigate, tournament?.tournamentId]);

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  if (liveScene === 'single') return <SingleRoulette tournament={tournament} initialItems={singleItems} liveMode />;
  if (liveScene === 'duel') return <DuelRoulette tournament={tournament} teams={duelTeams} liveMode onApplyToBracket={applyToBracket} />;

  const hasBracket = bracket?.rounds?.length > 0 && bracket.rounds.some((r) => (r.matches || []).some((m) => m.teamA || m.teamB));

  return (
    <TournamentAdminShell tournament={tournament} currentTab="roulette">
      {hasBracket && (
        <div className="rl-bracket-link" style={{ marginBottom: 16 }}>
          <span>Ya existe un bracket generado.</span>
          <button className="ghost" onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/bracket`)}>
            Ver Bracket actual
          </button>
        </div>
      )}
      <div className="rl-selector">
        <article className="rl-selector__card" onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette/live/single`)}>
          <div className="rl-selector__icon">&#127922;</div>
          <span className="ta-kicker">Ruleta personalizada</span>
          <h3>Sorteo libre</h3>
          <p>Sortea jugadores, espectadores, premios o cualquier lista. Edita los nombres en vivo y lleva el historial completo.</p>
          <button>Abrir ruleta</button>
        </article>

        <article className="rl-selector__card" onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette/live/duel`)}>
          <div className="rl-selector__icon">&#9876;</div>
          <span className="ta-kicker">Duelo aleatorio → Bracket</span>
          <h3>Enfrentamiento VS</h3>
          <p>Empareja equipos al azar con la ruleta. Los equipos se van eliminando del pool. Al terminar, aplica los enfrentamientos directamente al bracket.</p>
          <span className="rl-selector__badge">{approvedTeams.length} equipos en BD</span>
          <button>Abrir duelo</button>
        </article>
      </div>
    </TournamentAdminShell>
  );
};

export default TournamentRoulettePage;
