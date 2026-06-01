import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournamentFormatLabel, TOURNAMENT_OPERATIONAL_FORMAT_OPTIONS } from '../../../../../../shared/tournamentCatalog.js';
import { useLang } from '../../../../context/LanguageContext';
import './TournamentAdmin.css';

/* ── Fake Data ── */

const TEAM_NAMES = [
  'Phoenix Rising', 'Shadow Wolves', 'Iron Titans', 'Neon Blitz',
  'Arctic Storm', 'Dark Pulse', 'Cyber Hawks', 'Thunder Strike',
  'Venom Squad', 'Ghost Legion', 'Solar Flare', 'Nova Elite',
  'Crimson Tide', 'Omega Force', 'Blaze Unit', 'Frost Byte',
];

const SUPPORTED_SIMULATOR_FORMATS = TOURNAMENT_OPERATIONAL_FORMAT_OPTIONS;

const randomScore = () => Math.floor(Math.random() * 4);
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── Bracket Builders ── */

const buildSingleElim = (teams) => {
  const n = teams.length;
  const nextPow = 2 ** Math.ceil(Math.log2(n));
  const totalRounds = Math.log2(nextPow);
  const labels = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];

  const padded = [...teams];
  while (padded.length < nextPow) padded.push('BYE');

  const firstMatches = [];
  for (let i = 0; i < nextPow; i += 2) {
    firstMatches.push({ teamA: padded[i], teamB: padded[i + 1], scoreA: null, scoreB: null, status: 'pending', winner: '' });
  }

  const rounds = [{ name: labels[Math.max(0, labels.length - totalRounds)] || 'Ronda 1', matches: firstMatches }];
  for (let r = 1; r < totalRounds; r++) {
    const count = Math.max(1, firstMatches.length / (2 ** r));
    rounds.push({
      name: labels[Math.max(0, labels.length - totalRounds + r)] || `Ronda ${r + 1}`,
      matches: Array.from({ length: count }, () => ({ teamA: '', teamB: '', scoreA: null, scoreB: null, status: 'pending', winner: '' })),
    });
  }

  return rounds;
};

const buildSwissRounds = (teams, numRounds) => {
  const rounds = [];
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const firstMatches = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    firstMatches.push({
      teamA: shuffled[i],
      teamB: i + 1 < shuffled.length ? shuffled[i + 1] : 'BYE',
      scoreA: null, scoreB: null, status: 'pending', winner: '',
    });
  }
  rounds.push({ name: 'Ronda 1', matches: firstMatches });
  for (let r = 1; r < numRounds; r++) {
    rounds.push({ name: `Ronda ${r + 1}`, matches: [] });
  }
  return rounds;
};

const buildRoundRobin = (teams) => {
  const rounds = [];
  const n = teams.length;
  const list = n % 2 === 0 ? [...teams] : [...teams, 'BYE'];
  const total = list.length;
  const numRounds = total - 1;

  for (let r = 0; r < numRounds; r++) {
    const matches = [];
    for (let i = 0; i < total / 2; i++) {
      const a = list[i];
      const b = list[total - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') {
        matches.push({ teamA: a, teamB: b, scoreA: null, scoreB: null, status: 'pending', winner: '' });
      }
    }
    rounds.push({ name: `Jornada ${r + 1}`, matches });
    // Rotate: fix first, rotate rest
    const last = list.pop();
    list.splice(1, 0, last);
  }

  return rounds;
};

/* ── Standings Calculator ── */

const computeStandings = (teams, rounds) => {
  const stats = {};
  teams.forEach((t) => { stats[t] = { team: t, w: 0, l: 0, d: 0, gf: 0, gc: 0, pts: 0 }; });

  rounds.forEach((round) => {
    round.matches.forEach((m) => {
      if (m.status !== 'finished' || !stats[m.teamA] || !stats[m.teamB]) return;
      const sa = m.scoreA ?? 0;
      const sb = m.scoreB ?? 0;
      stats[m.teamA].gf += sa;
      stats[m.teamA].gc += sb;
      stats[m.teamB].gf += sb;
      stats[m.teamB].gc += sa;
      if (sa > sb) { stats[m.teamA].w++; stats[m.teamA].pts += 3; stats[m.teamB].l++; }
      else if (sb > sa) { stats[m.teamB].w++; stats[m.teamB].pts += 3; stats[m.teamA].l++; }
      else { stats[m.teamA].d++; stats[m.teamB].d++; stats[m.teamA].pts++; stats[m.teamB].pts++; }
    });
  });

  return Object.values(stats).sort((a, b) => b.pts - a.pts || (b.gf - b.gc) - (a.gf - a.gc));
};

/* ── Pairing for Swiss (by points) ── */

const pairByPoints = (teams, rounds) => {
  const standings = computeStandings(teams, rounds);
  const available = standings.map((s) => s.team);
  const matches = [];
  const used = new Set();

  for (let i = 0; i < available.length; i++) {
    if (used.has(available[i])) continue;
    for (let j = i + 1; j < available.length; j++) {
      if (used.has(available[j])) continue;
      matches.push({ teamA: available[i], teamB: available[j], scoreA: null, scoreB: null, status: 'pending', winner: '' });
      used.add(available[i]);
      used.add(available[j]);
      break;
    }
  }

  return matches;
};

/* ── Phase Labels ── */

const PHASES = (t) => [
  { key: 'config', label: t('simPhaseConfig'), desc: t('simPhaseConfigDesc') },
  { key: 'registration', label: t('simPhaseRegistration'), desc: t('simPhaseRegistrationDesc') },
  { key: 'bracket', label: t('simPhaseBracket'), desc: t('simPhaseBracketDesc') },
  { key: 'playing', label: t('simPhasePlaying'), desc: t('simPhasePlayingDesc') },
  { key: 'standings', label: t('simPhaseStandings'), desc: t('simPhaseStandingsDesc') },
  { key: 'finished', label: t('simPhaseFinished'), desc: t('simPhaseFinishedDesc') },
];

/* ── Component ── */

const TournamentSimulatorPage = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  // Config
  const [format, setFormat] = useState('single_elimination');
  const [teamCount, setTeamCount] = useState(8);
  const [speed, setSpeed] = useState(600);

  // Sim state
  const [phase, setPhase] = useState('config');
  const [teams, setTeams] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [champion, setChampion] = useState('');
  const [log, setLog] = useState([]);

  const addLog = useCallback((msg) => {
    setLog((prev) => [...prev, { time: new Date().toLocaleTimeString('es-DO'), msg }]);
  }, []);

  const standings = useMemo(() => computeStandings(teams, rounds), [teams, rounds]);

  const phases = PHASES(t);
  const phaseIndex = phases.findIndex((p) => p.key === phase);

  /* ── Start Simulation ── */
  const startSimulation = async () => {
    setLog([]);
    setChampion('');

    // 1. Generate teams
    const selected = TEAM_NAMES.slice(0, teamCount).sort(() => Math.random() - 0.5);
    setTeams(selected);
    setPhase('registration');
    addLog(`${selected.length} ${t('logTeamsRegistered')}`);
    await delay(speed);

    // 2. Build bracket
    let generatedRounds;
    if (format === 'single_elimination') {
      generatedRounds = buildSingleElim(selected);
    } else if (format === 'swiss') {
      const numSwissRounds = Math.ceil(Math.log2(selected.length));
      generatedRounds = buildSwissRounds(selected, numSwissRounds);
    } else {
      generatedRounds = buildRoundRobin(selected);
    }
    setRounds(generatedRounds);
    setPhase('bracket');
    addLog(`${t('logBracketGenerated')}: ${getTournamentFormatLabel(format)}`);
    await delay(speed);

    // 3. Play matches
    setPhase('playing');

    if (format === 'single_elimination') {
      await playSingleElim(generatedRounds, selected, speed);
    } else if (format === 'swiss') {
      await playSwiss(generatedRounds, selected, speed);
    } else {
      await playRoundRobin(generatedRounds, selected, speed);
    }
  };

  /* ── Single Elimination Play ── */
  const playSingleElim = async (rnds, allTeams, spd) => {
    const updated = rnds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));

    for (let ri = 0; ri < updated.length; ri++) {
      setCurrentRound(ri);
      addLog(`--- ${updated[ri].name} ---`);

      for (let mi = 0; mi < updated[ri].matches.length; mi++) {
        const match = updated[ri].matches[mi];

        if (match.teamA === 'BYE' || match.teamB === 'BYE') {
          const winner = match.teamA === 'BYE' ? match.teamB : match.teamA;
          match.winner = winner;
          match.status = 'finished';
          match.scoreA = match.teamA === 'BYE' ? 0 : 'W';
          match.scoreB = match.teamB === 'BYE' ? 0 : 'W';
          // Advance
          if (ri + 1 < updated.length) {
            const nextSlot = Math.floor(mi / 2);
            const nextMatch = updated[ri + 1].matches[nextSlot];
            if (nextMatch) {
              if (mi % 2 === 0) nextMatch.teamA = winner;
              else nextMatch.teamB = winner;
            }
          }
          setRounds([...updated]);
          addLog(`${winner} ${t('logAdvancesBye')}`);
          await delay(spd / 3);
          continue;
        }

        match.status = 'live';
        setRounds([...updated]);
        addLog(`${t('logLive')}: ${match.teamA} vs ${match.teamB}`);
        await delay(spd);

        let sA = randomScore();
        let sB = randomScore();
        if (sA === sB) sA += 1; // no ties in elimination
        match.scoreA = sA;
        match.scoreB = sB;
        match.winner = sA > sB ? match.teamA : match.teamB;
        match.status = 'finished';

        // Advance winner
        if (ri + 1 < updated.length) {
          const nextSlot = Math.floor(mi / 2);
          const nextMatch = updated[ri + 1].matches[nextSlot];
          if (nextMatch) {
            if (mi % 2 === 0) nextMatch.teamA = match.winner;
            else nextMatch.teamB = match.winner;
          }
        }

        setRounds([...updated]);
        addLog(`${match.winner} ${t('logWins')} (${match.scoreA}-${match.scoreB})`);
        await delay(spd);
      }
    }

    // Champion is the winner of the last match
    const finalMatch = updated[updated.length - 1].matches[0];
    setChampion(finalMatch.winner);
    setPhase('finished');
    addLog(`${t('logChampion')}: ${finalMatch.winner}`);
  };

  /* ── Swiss Play ── */
  const playSwiss = async (rnds, allTeams, spd) => {
    const updated = rnds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));

    for (let ri = 0; ri < updated.length; ri++) {
      setCurrentRound(ri);

      // Pair by standings for rounds > 0
      if (ri > 0) {
        updated[ri].matches = pairByPoints(allTeams, updated.slice(0, ri));
        setRounds([...updated]);
      }

      addLog(`--- ${updated[ri].name} ---`);

      for (let mi = 0; mi < updated[ri].matches.length; mi++) {
        const match = updated[ri].matches[mi];

        if (match.teamB === 'BYE') {
          match.status = 'finished';
          match.scoreA = 1;
          match.scoreB = 0;
          match.winner = match.teamA;
          setRounds([...updated]);
          addLog(`${match.teamA} ${t('logWinsBye')}`);
          await delay(spd / 3);
          continue;
        }

        match.status = 'live';
        setRounds([...updated]);
        addLog(`${t('logLive')}: ${match.teamA} vs ${match.teamB}`);
        await delay(spd);

        match.scoreA = randomScore();
        match.scoreB = randomScore();
        if (match.scoreA === match.scoreB) match.scoreA += 1;
        match.winner = match.scoreA > match.scoreB ? match.teamA : match.teamB;
        match.status = 'finished';

        setRounds([...updated]);
        addLog(`${match.winner} ${t('logWins')} (${match.scoreA}-${match.scoreB})`);
        await delay(spd / 2);
      }
    }

    // Show standings
    setPhase('standings');
    addLog(`--- ${t('logFinalStandings')} ---`);
    await delay(spd);

    const final = computeStandings(allTeams, updated);
    setChampion(final[0]?.team || '');
    setPhase('finished');
    addLog(`${t('logChampion')}: ${final[0]?.team}`);
  };

  /* ── Round Robin Play ── */
  const playRoundRobin = async (rnds, allTeams, spd) => {
    const updated = rnds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) }));

    for (let ri = 0; ri < updated.length; ri++) {
      setCurrentRound(ri);
      addLog(`--- ${updated[ri].name} ---`);

      for (let mi = 0; mi < updated[ri].matches.length; mi++) {
        const match = updated[ri].matches[mi];

        match.status = 'live';
        setRounds([...updated]);
        addLog(`${t('logLive')}: ${match.teamA} vs ${match.teamB}`);
        await delay(spd / 1.5);

        match.scoreA = randomScore();
        match.scoreB = randomScore();
        if (match.scoreA > match.scoreB) match.winner = match.teamA;
        else if (match.scoreB > match.scoreA) match.winner = match.teamB;
        else match.winner = t('logDraw');
        match.status = 'finished';

        setRounds([...updated]);
        const resultLabel = match.winner === t('logDraw') ? `${t('logDraw')} (${match.scoreA}-${match.scoreB})` : `${match.winner} ${t('logWins')} (${match.scoreA}-${match.scoreB})`;
        addLog(resultLabel);
        await delay(spd / 3);
      }
    }

    setPhase('standings');
    addLog(`--- ${t('logFinalStandings')} ---`);
    await delay(spd);

    const final = computeStandings(allTeams, updated);
    setChampion(final[0]?.team || '');
    setPhase('finished');
    addLog(`${t('logChampion')}: ${final[0]?.team}`);
  };

  /* ── Reset ── */
  const reset = () => {
    setPhase('config');
    setTeams([]);
    setRounds([]);
    setCurrentRound(0);
    setChampion('');
    setLog([]);
  };

  /* ── Render ── */
  return (
    <div className="ta-page">
      <div className="ta-manage-hero">
        <div className="ta-manage-hero__copy">
          <span className="ta-kicker">{t('simKicker')}</span>
          <h1>{t('simTitle')}</h1>
          <p>{t('simDescription')}</p>
        </div>
      </div>

      {/* Phase progress */}
      <div className="sim-phases">
        {phases.map((p, i) => (
          <div key={p.key} className={`sim-phase ${i <= phaseIndex ? 'is-done' : ''} ${p.key === phase ? 'is-current' : ''}`}>
            <span className="sim-phase__dot">{i < phaseIndex ? '\u2713' : i + 1}</span>
            <div>
              <strong>{p.label}</strong>
              <small>{p.desc}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="sim-layout">
        {/* Left: Controls + Bracket */}
        <div className="sim-main">
          {/* Config */}
          {phase === 'config' && (
            <section className="ta-panel">
              <div className="ta-panel__head">
                <div>
                  <span className="ta-kicker">{t('simStep1')}</span>
                  <h2>{t('simConfigTitle')}</h2>
                </div>
              </div>

              <div className="ta-form-grid">
                <label>
                  <span>{t('simFormatLabel')}</span>
                  <select value={format} onChange={(e) => setFormat(e.target.value)}>
                    {SUPPORTED_SIMULATOR_FORMATS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t('simTeamCount')}</span>
                  <select value={teamCount} onChange={(e) => setTeamCount(Number(e.target.value))}>
                    <option value={4}>{t('simTeams4')}</option>
                    <option value={8}>{t('simTeams8')}</option>
                    <option value={12}>{t('simTeams12')}</option>
                    <option value={16}>{t('simTeams16')}</option>
                  </select>
                </label>
                <label>
                  <span>{t('simSpeed')}</span>
                  <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                    <option value={300}>{t('simSpeedFast')}</option>
                    <option value={600}>{t('simSpeedNormal')}</option>
                    <option value={1200}>{t('simSpeedSlow')}</option>
                  </select>
                </label>
              </div>

              <div className="ta-shortcuts">
                <button onClick={startSimulation}>{t('startSimulation')}</button>
              </div>
            </section>
          )}

          {/* Teams */}
          {phase !== 'config' && (
            <section className="ta-panel">
              <div className="ta-panel__head">
                <div>
                  <span className="ta-kicker">{t('simTeamsKicker')} ({teams.length})</span>
                  <h2>{t('simParticipants')}</h2>
                </div>
              </div>
              <div className="sim-teams">
                {teams.map((team) => (
                  <span key={team} className={`sim-team-tag ${champion === team ? 'is-champion' : ''}`}>
                    {champion === team && <i className="bx bx-trophy" />}
                    {team}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Bracket / Matches */}
          {rounds.length > 0 && phase !== 'config' && (
            <section className="ta-panel" style={{ marginTop: 12 }}>
              <div className="ta-panel__head">
                <div>
                  <span className="ta-kicker">
                    {getTournamentFormatLabel(format)}
                  </span>
                  <h2>{t('simMatchBoard')}</h2>
                </div>
              </div>

              {format === 'single_elimination' ? (
                <div className="sim-bracket-tree">
                  {rounds.map((round, ri) => (
                    <div key={ri} className="sim-bracket-round">
                      <span className="sim-bracket-round-title">{round.name}</span>
                      <div className="sim-bracket-matches">
                        {round.matches.map((m, mi) => (
                          <div key={mi} className={`sim-match ${m.status === 'live' ? 'is-live' : ''} ${m.status === 'finished' ? 'is-done' : ''}`}>
                            <div className={`sim-match__team ${m.winner === m.teamA ? 'is-winner' : ''}`}>
                              <span>{m.teamA || '???'}</span>
                              <strong>{m.scoreA ?? '-'}</strong>
                            </div>
                            <div className={`sim-match__team ${m.winner === m.teamB ? 'is-winner' : ''}`}>
                              <span>{m.teamB || '???'}</span>
                              <strong>{m.scoreB ?? '-'}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sim-rounds-list">
                  {rounds.map((round, ri) => (
                    <div key={ri} className={`sim-round-block ${ri === currentRound && phase === 'playing' ? 'is-active' : ''}`}>
                      <span className="sim-round-title">{round.name}</span>
                      {round.matches.length === 0 ? (
                        <small className="sim-round-pending">{t('simPendingPairing')}</small>
                      ) : (
                        <div className="sim-round-matches">
                          {round.matches.map((m, mi) => (
                            <div key={mi} className={`sim-match-row ${m.status === 'live' ? 'is-live' : ''} ${m.status === 'finished' ? 'is-done' : ''}`}>
                              <span className={m.winner === m.teamA ? 'is-winner' : ''}>{m.teamA}</span>
                              <strong>{m.scoreA ?? '-'} - {m.scoreB ?? '-'}</strong>
                              <span className={m.winner === m.teamB ? 'is-winner' : ''}>{m.teamB}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Standings */}
          {(phase === 'standings' || phase === 'finished') && (format === 'swiss' || format === 'round_robin') && (
            <section className="ta-panel" style={{ marginTop: 12 }}>
              <div className="ta-panel__head">
                <div>
                  <span className="ta-kicker">{t('simPhaseStandings')}</span>
                  <h2>{t('simStandingsTable')}</h2>
                </div>
              </div>
              <div className="ta-standings-table-wrap">
                <table className="ta-standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{t('colTeam')}</th>
                      <th>{t('colWins')}</th>
                      <th>{t('colDraws')}</th>
                      <th>{t('colLosses')}</th>
                      <th>{t('colGF')}</th>
                      <th>{t('colGC')}</th>
                      <th>{t('colPTS')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((s, i) => (
                      <tr key={s.team} className={i === 0 ? 'ta-standings-top' : ''}>
                        <td>
                          <span className={`ta-standings-pos ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td><strong>{s.team}</strong></td>
                        <td className="ta-standings-win">{s.w}</td>
                        <td>{s.d}</td>
                        <td className="ta-standings-loss">{s.l}</td>
                        <td>{s.gf}</td>
                        <td>{s.gc}</td>
                        <td><strong>{s.pts}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Champion */}
          {phase === 'finished' && champion && (
            <section className="sim-champion" style={{ marginTop: 12 }}>
              <span className="sim-champion__crown">&#127942;</span>
              <h2>{t('simChampionTitle')}</h2>
              <strong>{champion}</strong>
              <div className="ta-shortcuts" style={{ marginTop: 16 }}>
                <button onClick={reset}>{t('newSimulation')}</button>
                <button className="ghost" onClick={() => navigate('/tournaments/admin')}>{t('backToPanel')}</button>
              </div>
            </section>
          )}
        </div>

        {/* Right: Live log */}
        <aside className="sim-log-panel">
          <div className="ta-panel" style={{ position: 'sticky', top: 104 }}>
            <span className="ta-kicker">{t('simLiveLogKicker')}</span>
            <h3>{t('simLiveLogTitle')}</h3>
            <div className="sim-log">
              {log.length === 0 ? (
                <p className="sim-log__empty">{t('simLogEmpty')}</p>
              ) : (
                log.map((entry, i) => (
                  <div key={i} className={`sim-log__entry ${entry.msg.startsWith(t('logChampion')) ? 'is-champion' : entry.msg.startsWith(t('logLive')) ? 'is-live' : entry.msg.startsWith('---') ? 'is-round' : ''}`}>
                    <small>{entry.time}</small>
                    <span>{entry.msg}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TournamentSimulatorPage;
