import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTournamentFormatLabel, TOURNAMENT_FORMAT_OPTIONS } from '../../../../../../shared/tournamentCatalog.js';
import {
  TournamentAdminShell,
  createEmptyBracket,
  createEmptyMatch,
  shuffle,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const toTeamObj = (name) => {
  if (!name) return { refId: '', teamName: '', isBye: true };
  return { refId: name, teamName: name, isBye: false };
};

const roundLabel = (index, total) => {
  const labels = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];
  return labels[Math.max(0, labels.length - total + index)] || `Ronda ${index + 1}`;
};

const buildSingleElimination = (teams, bracketTitle) => {
  const totalTeams = Math.max(2, teams.length);
  const nextPower = 2 ** Math.ceil(Math.log2(totalTeams));
  const totalRounds = Math.log2(nextPower);

  const seededMatches = [];
  for (let i = 0; i < nextPower; i += 2) {
    seededMatches.push({
      ...createEmptyMatch(),
      teamA: teams[i] ? toTeamObj(teams[i]) : { refId: '', teamName: 'BYE', isBye: true },
      teamB: teams[i + 1] ? toTeamObj(teams[i + 1]) : { refId: '', teamName: 'BYE', isBye: true },
    });
  }

  const rounds = Array.from({ length: totalRounds }, (_, index) => {
    if (index === 0) {
      return { name: roundLabel(index, totalRounds), matches: seededMatches };
    }
    const matches = Array.from(
      { length: Math.max(1, seededMatches.length / (2 ** index)) },
      () => createEmptyMatch()
    );
    return { name: roundLabel(index, totalRounds), matches };
  });

  return { title: bracketTitle, format: 'single_elimination', rounds };
};

const buildDoubleElimination = (teams, bracketTitle) => {
  const totalTeams = Math.max(2, teams.length);
  const nextPower = 2 ** Math.ceil(Math.log2(totalTeams));
  const wbRounds = Math.log2(nextPower);

  const rounds = [];

  // Winners bracket
  const firstRoundMatches = [];
  for (let i = 0; i < nextPower; i += 2) {
    firstRoundMatches.push({
      ...createEmptyMatch(),
      teamA: teams[i] ? toTeamObj(teams[i]) : { refId: '', teamName: 'BYE', isBye: true },
      teamB: teams[i + 1] ? toTeamObj(teams[i + 1]) : { refId: '', teamName: 'BYE', isBye: true },
    });
  }

  rounds.push({ name: 'WB Ronda 1', matches: firstRoundMatches });
  for (let r = 1; r < wbRounds; r++) {
    const matchCount = Math.max(1, firstRoundMatches.length / (2 ** r));
    const label = r === wbRounds - 1 ? 'WB Final' : `WB Ronda ${r + 1}`;
    rounds.push({
      name: label,
      matches: Array.from({ length: matchCount }, () => createEmptyMatch()),
    });
  }

  // Losers bracket
  const lbRounds = (wbRounds - 1) * 2;
  for (let r = 0; r < lbRounds; r++) {
    const matchCount = Math.max(1, Math.ceil(firstRoundMatches.length / (2 ** Math.floor((r + 2) / 2))));
    const label = r === lbRounds - 1 ? 'LB Final' : `LB Ronda ${r + 1}`;
    rounds.push({
      name: label,
      matches: Array.from({ length: matchCount }, () => createEmptyMatch()),
    });
  }

  // Grand final
  rounds.push({
    name: 'Gran Final',
    matches: [createEmptyMatch()],
  });

  return { title: bracketTitle, format: 'double_elimination', rounds };
};

const buildSwiss = (teams, bracketTitle, swissRounds) => {
  const shuffled = shuffle(teams);
  const numRounds = swissRounds || Math.ceil(Math.log2(Math.max(2, teams.length)));
  const rounds = [];

  // Only seed the first round, subsequent rounds are paired by points
  const firstRoundMatches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      firstRoundMatches.push({
        ...createEmptyMatch(),
        teamA: toTeamObj(shuffled[i]),
        teamB: toTeamObj(shuffled[i + 1]),
      });
    } else {
      firstRoundMatches.push({
        ...createEmptyMatch(),
        teamA: toTeamObj(shuffled[i]),
        teamB: { refId: '', teamName: 'BYE', isBye: true },
      });
    }
  }

  rounds.push({ name: 'Ronda Suiza 1', matches: firstRoundMatches });

  for (let r = 1; r < numRounds; r++) {
    rounds.push({
      name: `Ronda Suiza ${r + 1}`,
      matches: Array.from(
        { length: Math.floor(teams.length / 2) },
        () => createEmptyMatch()
      ),
    });
  }

  return { title: bracketTitle, format: 'swiss', rounds };
};

const buildRoundRobin = (teams, bracketTitle) => {
  const list = [...teams];
  if (list.length % 2 !== 0) list.push('BYE');
  const numRounds = list.length - 1;
  const half = list.length / 2;
  const rounds = [];

  const teamsCopy = [...list];
  const fixed = teamsCopy.shift();

  for (let r = 0; r < numRounds; r++) {
    const matches = [];
    const current = [fixed, ...teamsCopy];

    for (let i = 0; i < half; i++) {
      const a = current[i];
      const b = current[current.length - 1 - i];
      matches.push({
        ...createEmptyMatch(),
        teamA: a === 'BYE' ? { refId: '', teamName: 'BYE', isBye: true } : toTeamObj(a),
        teamB: b === 'BYE' ? { refId: '', teamName: 'BYE', isBye: true } : toTeamObj(b),
      });
    }

    rounds.push({ name: `Jornada ${r + 1}`, matches });

    // Rotate teams (circle method)
    teamsCopy.push(teamsCopy.shift());
  }

  return { title: bracketTitle, format: 'round_robin', rounds };
};

const TournamentBracketPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { loading, tournament, bracket, setBracket, approvedTeams, saveBracket } = useTournamentAdminData(code);
  const [selectedMatch, setSelectedMatch] = useState({ roundIndex: 0, matchIndex: 0 });
  const [selectedFormat, setSelectedFormat] = useState('single_elimination');
  const [swissRounds, setSwissRounds] = useState(0);
  const [seedMode, setSeedMode] = useState('order');

  useEffect(() => {
    if (bracket?.format) {
      setSelectedFormat(bracket.format);
    }
  }, [bracket?.format]);

  const rounds = bracket?.rounds || [];
  const selectedRound = rounds[selectedMatch.roundIndex] || rounds[0];
  const selectedMatchData = selectedRound?.matches?.[selectedMatch.matchIndex] || createEmptyMatch();

  const availableSeed = useMemo(() => approvedTeams.join(', '), [approvedTeams]);

  const teamName = (team) => {
    if (!team) return '';
    if (typeof team === 'string') return team;
    return team.teamName || team.name || '';
  };

  const updateSelectedField = (field, value) => {
    setBracket((prev) => {
      const next = {
        ...prev,
        rounds: (prev?.rounds || []).map((round, roundIndex) => ({
          ...round,
          matches: (round.matches || []).map((match, matchIndex) => {
            if (roundIndex !== selectedMatch.roundIndex || matchIndex !== selectedMatch.matchIndex) return match;
            // For team fields, preserve object structure
            if (field === 'teamA' || field === 'teamB') {
              const current = match[field];
              if (current && typeof current === 'object') {
                return { ...match, [field]: { ...current, teamName: value, refId: current.refId || value } };
              }
              return { ...match, [field]: toTeamObj(value) };
            }
            return { ...match, [field]: value };
          }),
        })),
      };
      return next;
    });
  };

  const updateRoundTitle = (roundIndex, value) => {
    setBracket((prev) => ({
      ...prev,
      rounds: (prev?.rounds || []).map((round, index) =>
        index === roundIndex ? { ...round, name: value } : round
      ),
    }));
  };

  const addRound = () => {
    setBracket((prev) => ({
      ...(prev || createEmptyBracket()),
      rounds: [
        ...((prev?.rounds || []).length ? prev.rounds : createEmptyBracket().rounds),
        {
          name: `Ronda ${(prev?.rounds || []).length + 1}`,
          matches: [createEmptyMatch()],
        },
      ],
    }));
  };

  const getTeamRef = (team) => {
    if (!team) return '';
    if (typeof team === 'string') return team;
    return team.refId || team.teamName || '';
  };

  const setWinner = (side) => {
    const ri = selectedMatch.roundIndex;
    const mi = selectedMatch.matchIndex;

    setBracket((prev) => {
      const updatedRounds = (prev?.rounds || []).map((round, roundIdx) => ({
        ...round,
        matches: (round.matches || []).map((match, matchIdx) => {
          if (roundIdx !== ri || matchIdx !== mi) return match;
          const winner = side === 'A' ? match.teamA : match.teamB;
          return {
            ...match,
            winnerRefId: getTeamRef(winner),
            status: 'finished',
          };
        }),
      }));

      // Advance winner to next round
      const nextRi = ri + 1;
      if (nextRi < updatedRounds.length) {
        const nextMi = Math.floor(mi / 2);
        const slot = mi % 2 === 0 ? 'teamA' : 'teamB';
        const currentMatch = updatedRounds[ri].matches[mi];
        const winner = side === 'A' ? currentMatch.teamA : currentMatch.teamB;
        const nextRound = updatedRounds[nextRi];
        if (nextRound.matches[nextMi]) {
          const winnerObj = typeof winner === 'object' && winner
            ? { ...winner }
            : toTeamObj(typeof winner === 'string' ? winner : winner?.teamName || '');
          nextRound.matches = nextRound.matches.map((m, idx) =>
            idx === nextMi ? { ...m, [slot]: winnerObj } : m
          );
        }
      }

      return { ...prev, rounds: updatedRounds };
    });
  };

  const addMatchToRound = (roundIndex) => {
    setBracket((prev) => ({
      ...prev,
      rounds: (prev?.rounds || []).map((round, index) =>
        index === roundIndex
          ? { ...round, matches: [...(round.matches || []), createEmptyMatch()] }
          : round
      ),
    }));
  };

  const autoBuildBracket = () => {
    if (approvedTeams.length === 0) return;

    const teams = seedMode === 'random' ? shuffle(approvedTeams) : [...approvedTeams];
    const title = bracket?.title || 'Bracket principal';

    let newBracket;
    switch (selectedFormat) {
      case 'double_elimination':
        newBracket = buildDoubleElimination(teams, title);
        break;
      case 'swiss':
        newBracket = buildSwiss(teams, title, swissRounds || undefined);
        break;
      case 'round_robin':
        newBracket = buildRoundRobin(teams, title);
        break;
      default:
        newBracket = buildSingleElimination(teams, title);
    }

    setBracket(newBracket);
    setSelectedMatch({ roundIndex: 0, matchIndex: 0 });
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="bracket">
      <div className="ta-bracket-layout">
        <aside className="ta-panel ta-panel--editor">
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">Direccion</span>
              <h2>Editor del bracket</h2>
            </div>
            <div className="ta-actions">
              <button className="ghost" onClick={addRound} title="Crea una nueva ronda vacia al final del bracket para agregar partidas manualmente">
                Agregar ronda
              </button>
              <button onClick={saveBracket} title="Guarda todos los cambios del bracket en el servidor">
                Guardar
              </button>
            </div>
          </div>

          <div className="ta-section-intro">
            <h3>Gestor de llaves del torneo</h3>
            <p>
              Aqui configuras la estructura de eliminacion de tu torneo. Puedes generar
              el bracket automaticamente con los equipos aprobados o armarlo manualmente.
              Haz clic en cualquier partida del bracket (a la derecha) para editarla desde aqui.
            </p>
          </div>

          <label>
            <span>Titulo del bracket</span>
            <input
              value={bracket?.title || ''}
              onChange={(e) => setBracket((prev) => ({ ...(prev || createEmptyBracket()), title: e.target.value }))}
              placeholder="Ej: Bracket principal"
            />
            <p className="ta-hint">Nombre visible para los participantes y espectadores.</p>
          </label>

          <div className="ta-editor-block">
            <span className="ta-editor-label">Match seleccionado</span>
            <strong>Ronda {selectedMatch.roundIndex + 1} - Match {selectedMatch.matchIndex + 1}</strong>
            <p className="ta-hint">Haz clic en una partida del bracket para seleccionarla y editar sus datos aqui.</p>
          </div>

          <div className="ta-form-grid ta-form-grid--stacked">
            <label>
              <span>Equipo A</span>
              <input value={teamName(selectedMatchData.teamA)} onChange={(e) => updateSelectedField('teamA', e.target.value)} placeholder="Nombre del equipo" />
            </label>
            <label>
              <span>Score A</span>
              <input value={selectedMatchData.scoreA || ''} onChange={(e) => updateSelectedField('scoreA', e.target.value)} placeholder="0" />
            </label>
            <label>
              <span>Equipo B</span>
              <input value={teamName(selectedMatchData.teamB)} onChange={(e) => updateSelectedField('teamB', e.target.value)} placeholder="Nombre del equipo" />
            </label>
            <label>
              <span>Score B</span>
              <input value={selectedMatchData.scoreB || ''} onChange={(e) => updateSelectedField('scoreB', e.target.value)} placeholder="0" />
            </label>
            <label className="ta-form-grid__full">
              <span>Horario</span>
              <input
                value={selectedMatchData.scheduledLabel || ''}
                onChange={(e) => updateSelectedField('scheduledLabel', e.target.value)}
                placeholder="23:00 EST - 19 Mar"
              />
              <p className="ta-hint">Fecha y hora de la partida. Visible en la tarjeta del match.</p>
            </label>
          </div>

          {/* Winner selector */}
          {(teamName(selectedMatchData.teamA) && teamName(selectedMatchData.teamB)) && (
            <div className="ta-editor-block">
              <span className="ta-editor-label">Ganador de la partida</span>
              <p className="ta-hint">
                Selecciona al equipo ganador. El ganador avanzara automaticamente a la siguiente ronda.
              </p>
              <div className="ta-winner-btns">
                <button
                  className={`ta-winner-btn ${selectedMatchData.winnerRefId && selectedMatchData.winnerRefId === getTeamRef(selectedMatchData.teamA) ? 'ta-winner-btn--active' : ''}`}
                  onClick={() => setWinner('A')}
                  title={`Marcar a ${teamName(selectedMatchData.teamA)} como ganador`}
                >
                  {teamName(selectedMatchData.teamA) || 'Equipo A'}
                </button>
                <button
                  className={`ta-winner-btn ${selectedMatchData.winnerRefId && selectedMatchData.winnerRefId === getTeamRef(selectedMatchData.teamB) ? 'ta-winner-btn--active' : ''}`}
                  onClick={() => setWinner('B')}
                  title={`Marcar a ${teamName(selectedMatchData.teamB)} como ganador`}
                >
                  {teamName(selectedMatchData.teamB) || 'Equipo B'}
                </button>
              </div>
              {selectedMatchData.winnerRefId && (
                <p className="ta-hint" style={{ color: 'var(--primary)' }}>
                  Ganador: {selectedMatchData.winnerRefId === getTeamRef(selectedMatchData.teamA) ? teamName(selectedMatchData.teamA) : teamName(selectedMatchData.teamB)}
                  {' '} — Recuerda guardar para aplicar los cambios.
                </p>
              )}
            </div>
          )}

          <button
            onClick={saveBracket}
            title="Guarda los cambios del match seleccionado al servidor"
          >
            Guardar match (R{selectedMatch.roundIndex + 1}-M{selectedMatch.matchIndex + 1})
          </button>

          <div className="ta-editor-block">
            <span className="ta-editor-label">Equipos aprobados ({approvedTeams.length})</span>
            <p>{availableSeed || 'Aun no hay equipos aprobados para sembrar.'}</p>
            <p className="ta-hint">Estos son los equipos que ya fueron aceptados en el torneo y se usaran para generar el bracket.</p>
          </div>

          <div className="ta-form-grid ta-form-grid--stacked">
            <label className="ta-form-grid__full">
              <span>Formato del torneo</span>
              <select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}>
                {TOURNAMENT_FORMAT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <p className="ta-hint">
                {selectedFormat === 'single_elimination' && 'Pierdes una vez y quedas fuera. Ideal para torneos rapidos.'}
                {selectedFormat === 'double_elimination' && 'Necesitas perder dos veces para ser eliminado. Mas justo, mas largo.'}
                {selectedFormat === 'swiss' && 'Los equipos se emparejan por puntuacion similar en cada ronda. Sin eliminacion directa.'}
                {selectedFormat === 'round_robin' && 'Todos los equipos juegan contra todos. Ideal para ligas o grupos.'}
              </p>
            </label>
            <label>
              <span>Semilla</span>
              <select value={seedMode} onChange={(e) => setSeedMode(e.target.value)}>
                <option value="order">Orden de inscripcion</option>
                <option value="random">Aleatorio</option>
              </select>
              <p className="ta-hint">Define como se ordenan los equipos en la primera ronda.</p>
            </label>
            {selectedFormat === 'swiss' && (
              <label>
                <span>Rondas suizas</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={swissRounds || ''}
                  onChange={(e) => setSwissRounds(Number(e.target.value))}
                  placeholder="Auto"
                />
                <p className="ta-hint">Cantidad de rondas. Si dejas vacio, se calcula automaticamente.</p>
              </label>
            )}
          </div>

          <div className="ta-shortcuts">
            <button onClick={autoBuildBracket} title="Crea automaticamente todas las rondas y partidas usando los equipos aprobados y el formato seleccionado">
              Generar bracket
            </button>
            <p className="ta-hint">Genera automaticamente las llaves con los equipos aprobados y el formato elegido arriba.</p>
            <button
              className="ghost"
              onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette/live/duel`)}
              title="Abre la ruleta interactiva para sortear los enfrentamientos en vivo"
            >
              Generar desde Ruleta
            </button>
            <p className="ta-hint">Usa la ruleta animada para sortear enfrentamientos de forma interactiva y luego aplicarlos al bracket.</p>
            {rounds[selectedMatch.roundIndex] ? (
              <>
                <button className="ghost" onClick={() => addMatchToRound(selectedMatch.roundIndex)} title="Agrega una nueva partida vacia a la ronda actualmente seleccionada">
                  Agregar match a esta ronda
                </button>
                <p className="ta-hint">Agrega una partida extra a la ronda seleccionada (Ronda {selectedMatch.roundIndex + 1}).</p>
              </>
            ) : null}
          </div>

          {bracket?.format && (
            <div className="ta-editor-block">
              <span className="ta-editor-label">Formato activo</span>
              <strong>{getTournamentFormatLabel(bracket.format) || bracket.format}</strong>
              <p className="ta-hint">Este es el formato con el que se genero el bracket actual.</p>
            </div>
          )}
        </aside>

        <section className="ta-stage ta-stage--bracket-page">
          <div className="ta-stage__backdrop" />
          <div className="ta-stage__brand ta-stage__brand--corner">
            <span>{tournament.game}</span>
            <strong>{bracket?.title || 'Bracket principal'}</strong>
            <p className="ta-hint" style={{ marginTop: 4 }}>
              Vista previa del bracket. Haz clic en cualquier partida para seleccionarla y editarla en el panel izquierdo.
            </p>
          </div>

          <div className="bk-tree">
            {rounds.map((round, roundIndex) => {
              const matchCount = (round.matches || []).length;
              const isLast = roundIndex === rounds.length - 1;

              return (
                <div key={`round-${roundIndex}`} className="bk-round" style={{ '--round-idx': roundIndex }}>
                  <div className="bk-round__head">
                    <input
                      className="bk-round__title"
                      value={round.name || ''}
                      onChange={(e) => updateRoundTitle(roundIndex, e.target.value)}
                      placeholder={`Ronda ${roundIndex + 1}`}
                    />
                    <span className="bk-round__count">{matchCount} {matchCount === 1 ? 'match' : 'matches'}</span>
                  </div>

                  <div className="bk-round__matches">
                    {(round.matches || []).map((match, matchIndex) => {
                      const isSelected =
                        selectedMatch.roundIndex === roundIndex && selectedMatch.matchIndex === matchIndex;
                      const teamAName = typeof match.teamA === 'string' ? match.teamA : match.teamA?.teamName || '';
                      const teamBName = typeof match.teamB === 'string' ? match.teamB : match.teamB?.teamName || '';
                      const hasWinner = match.status === 'finished' || match.winnerRefId;
                      const winnerIsA = hasWinner && (match.winnerRefId === (match.teamA?.refId || match.teamA));
                      const winnerIsB = hasWinner && (match.winnerRefId === (match.teamB?.refId || match.teamB));

                      return (
                        <div key={`m-${roundIndex}-${matchIndex}`} className="bk-match-wrap">
                          <article
                            className={`bk-match ${isSelected ? 'bk-match--selected' : ''} ${hasWinner ? 'bk-match--done' : ''}`}
                            onClick={() => setSelectedMatch({ roundIndex, matchIndex })}
                          >
                            <div className="bk-match__header">
                              <span className="bk-match__id">M{matchIndex + 1}</span>
                              {match.scheduledLabel && <span className="bk-match__time">{match.scheduledLabel}</span>}
                              {match.status === 'live' && <span className="bk-match__live">EN VIVO</span>}
                            </div>
                            <div className={`bk-match__team ${winnerIsA ? 'bk-match__team--winner' : ''} ${teamAName === 'BYE' ? 'bk-match__team--bye' : ''}`}>
                              <span className="bk-match__seed">{matchIndex * 2 + 1}</span>
                              <strong className="bk-match__name">{teamAName || 'TBD'}</strong>
                              <span className="bk-match__score">{match.scoreA ?? '-'}</span>
                            </div>
                            <div className={`bk-match__team ${winnerIsB ? 'bk-match__team--winner' : ''} ${teamBName === 'BYE' ? 'bk-match__team--bye' : ''}`}>
                              <span className="bk-match__seed">{matchIndex * 2 + 2}</span>
                              <strong className="bk-match__name">{teamBName || 'TBD'}</strong>
                              <span className="bk-match__score">{match.scoreB ?? '-'}</span>
                            </div>
                          </article>
                          {!isLast && <div className="bk-connector" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </TournamentAdminShell>
  );
};

export default TournamentBracketPage;
