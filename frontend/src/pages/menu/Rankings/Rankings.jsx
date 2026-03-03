import React, { useMemo, useState } from 'react';
import PageHud from '../../../components/PageHud/PageHud';
import './Rankings.css';

const RANK_DATA = [
  { id: 1, player: 'MenaRD', team: 'Bandits', game: 'SF6', region: 'LATAM', season: 'S1-2026', points: 9820, wins: 121, losses: 29, lastActivity: 'Hace 2h', trend: 2, streak: 8 },
  { id: 2, player: 'Santo Viper', team: 'Aurum Esports', game: 'LoL', region: 'CARIBE', season: 'S1-2026', points: 9480, wins: 98, losses: 31, lastActivity: 'Hace 30m', trend: 1, streak: 6 },
  { id: 3, player: 'Kira Plays', team: 'Nova Five', game: 'Valorant', region: 'NORTE', season: 'S1-2026', points: 9310, wins: 90, losses: 28, lastActivity: 'Hace 1h', trend: -1, streak: 3 },
  { id: 4, player: 'Mangu Killer', team: 'Dominican Team', game: 'LoL', region: 'CARIBE', season: 'S1-2026', points: 9020, wins: 88, losses: 37, lastActivity: 'Hace 4h', trend: 1, streak: 4 },
  { id: 5, player: 'Rey Mid', team: 'Tempest', game: 'LoL', region: 'LATAM', season: 'S1-2026', points: 8790, wins: 81, losses: 34, lastActivity: 'Hace 6h', trend: 3, streak: 9 },
  { id: 6, player: 'Luz Zero', team: 'Aurum Esports', game: 'Valorant', region: 'NORTE', season: 'S1-2026', points: 8610, wins: 74, losses: 33, lastActivity: 'Hace 45m', trend: 0, streak: 2 },
  { id: 7, player: 'Nox', team: 'Wave Unit', game: 'MLBB', region: 'ASIA', season: 'S1-2026', points: 8520, wins: 77, losses: 41, lastActivity: 'Hace 3h', trend: -2, streak: 1 },
  { id: 8, player: 'Aria', team: 'Phoenix', game: 'MLBB', region: 'LATAM', season: 'S1-2026', points: 8450, wins: 76, losses: 39, lastActivity: 'Hace 2h', trend: 2, streak: 5 },
  { id: 9, player: 'Hex', team: 'Nova Five', game: 'SF6', region: 'EU', season: 'S1-2026', points: 8320, wins: 68, losses: 31, lastActivity: 'Hace 7h', trend: 1, streak: 4 },
  { id: 10, player: 'Bela', team: 'Tempest', game: 'Valorant', region: 'EU', season: 'S1-2026', points: 8240, wins: 66, losses: 30, lastActivity: 'Hace 1d', trend: -1, streak: 2 },
  { id: 11, player: 'Kronos', team: 'Mirage', game: 'LoL', region: 'NORTE', season: 'S1-2026', points: 8130, wins: 63, losses: 35, lastActivity: 'Hace 8h', trend: 0, streak: 3 },
  { id: 12, player: 'Izan', team: 'Mirage', game: 'MLBB', region: 'CARIBE', season: 'S1-2026', points: 8070, wins: 62, losses: 36, lastActivity: 'Hace 3h', trend: 2, streak: 7 }
];

const seasons = ['S1-2026', 'Pre-Season 2026'];
const games = ['Todos', 'LoL', 'Valorant', 'MLBB', 'SF6'];
const regions = ['Global', 'LATAM', 'CARIBE', 'NORTE', 'EU', 'ASIA'];

const getWinRate = (wins, losses) => {
  const total = wins + losses;
  if (!total) return 0;
  return Math.round((wins / total) * 100);
};

const avatarUrl = (seed) => `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}`;

const Rankings = () => {
  const [season, setSeason] = useState('S1-2026');
  const [game, setGame] = useState('Todos');
  const [region, setRegion] = useState('Global');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const filtered = useMemo(() => {
    let rows = RANK_DATA.filter((r) => r.season === season);
    if (game !== 'Todos') rows = rows.filter((r) => r.game === game);
    if (region !== 'Global') rows = rows.filter((r) => r.region === region);
    return [...rows].sort((a, b) => b.points - a.points);
  }, [season, game, region]);

  const podium = filtered.slice(0, 3);
  const tableRows = filtered;

  const featured = useMemo(() => {
    if (!filtered.length) return null;
    return [...filtered].sort((a, b) => getWinRate(b.wins, b.losses) - getWinRate(a.wins, a.losses))[0];
  }, [filtered]);

  const hotStreak = useMemo(() => {
    if (!filtered.length) return null;
    return [...filtered].sort((a, b) => b.streak - a.streak)[0];
  }, [filtered]);

  return (
    <div className="rk-page">
      <PageHud page="RANKINGS" />

      <section className="rk-hero">
        <div className="rk-hero-left">
          <p className="rk-overline">Competitivo Global</p>
          <h1>Ranking Global</h1>
          <p className="rk-subtitle">Escala posiciones, domina la temporada y entra al top competitivo oficial.</p>
        </div>
        <div className="rk-hero-filters">
          <label>
            Temporada
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              {seasons.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Juego
            <select value={game} onChange={(e) => setGame(e.target.value)}>
              {games.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
          <label>
            Region
            <select value={region} onChange={(e) => setRegion(e.target.value)}>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="rk-podium">
        {podium.map((p, idx) => (
          <article key={p.id} className={`rk-podium-card rk-podium-${idx + 1}`}>
            <div className="rk-podium-rank">#{idx + 1}</div>
            <img src={avatarUrl(p.player)} alt={p.player} />
            <h3>{p.player}</h3>
            <p>{p.team}</p>
            <strong>{p.points.toLocaleString()} pts</strong>
            <div className="rk-mini-stats">
              <span>{p.wins}W</span>
              <span>{p.losses}L</span>
              <span>{getWinRate(p.wins, p.losses)}% WR</span>
            </div>
          </article>
        ))}
      </section>

      <section className="rk-content">
        <div className="rk-table-wrap">
          <table className="rk-table">
            <thead>
              <tr>
                <th>Posicion</th>
                <th>Jugador</th>
                <th>Equipo</th>
                <th>Puntos</th>
                <th>Victorias</th>
                <th>Derrotas</th>
                <th>Win Rate</th>
                <th>Ultima actividad</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.length ? tableRows.map((r, index) => (
                <tr
                  key={r.id}
                  className={`${index < 10 ? 'rk-top10' : ''}`}
                  onClick={() => setSelectedPlayer(r)}
                >
                  <td>
                    <div className="rk-pos-cell">
                      <span>#{index + 1}</span>
                      <em className={`rk-trend ${r.trend > 0 ? 'up' : r.trend < 0 ? 'down' : 'flat'}`}>
                        {r.trend > 0 ? `+${r.trend}` : r.trend}
                      </em>
                    </div>
                  </td>
                  <td>
                    <div className="rk-player-cell">
                      <img src={avatarUrl(r.player)} alt={r.player} />
                      <span>{r.player}</span>
                    </div>
                  </td>
                  <td>{r.team}</td>
                  <td className="rk-points">{r.points.toLocaleString()}</td>
                  <td>{r.wins}</td>
                  <td>{r.losses}</td>
                  <td>{getWinRate(r.wins, r.losses)}%</td>
                  <td>{r.lastActivity}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8">
                    <div className="rk-empty">No hay datos para los filtros seleccionados.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="rk-side">
          <div className="rk-side-card">
            <h4>Jugador de la semana</h4>
            {featured ? (
              <div className="rk-side-player">
                <img src={avatarUrl(featured.player)} alt={featured.player} />
                <div>
                  <strong>{featured.player}</strong>
                  <span>{featured.team}</span>
                  <small>{getWinRate(featured.wins, featured.losses)}% WR</small>
                </div>
              </div>
            ) : <p>Sin datos</p>}
          </div>

          <div className="rk-side-card">
            <h4>Mayor racha activa</h4>
            {hotStreak ? (
              <div className="rk-streak">
                <strong>{hotStreak.player}</strong>
                <span>{hotStreak.streak} victorias seguidas</span>
              </div>
            ) : <p>Sin datos</p>}
          </div>

          <div className="rk-side-card">
            <h4>Estadisticas rapidas</h4>
            <ul>
              <li><span>Jugadores en tabla</span><b>{filtered.length}</b></li>
              <li><span>Promedio de puntos</span><b>{filtered.length ? Math.round(filtered.reduce((a, b) => a + b.points, 0) / filtered.length).toLocaleString() : 0}</b></li>
              <li><span>Mejor win rate</span><b>{featured ? `${getWinRate(featured.wins, featured.losses)}%` : '0%'}</b></li>
            </ul>
          </div>
        </aside>
      </section>

      {selectedPlayer && (
        <div className="rk-modal-backdrop" onClick={() => setSelectedPlayer(null)}>
          <div className="rk-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rk-modal-close" onClick={() => setSelectedPlayer(null)}>Cerrar</button>
            <div className="rk-modal-head">
              <img src={avatarUrl(selectedPlayer.player)} alt={selectedPlayer.player} />
              <div>
                <h3>{selectedPlayer.player}</h3>
                <p>{selectedPlayer.team} · {selectedPlayer.game} · {selectedPlayer.region}</p>
              </div>
            </div>
            <div className="rk-modal-stats">
              <div><span>Puntos</span><b>{selectedPlayer.points.toLocaleString()}</b></div>
              <div><span>Victorias</span><b>{selectedPlayer.wins}</b></div>
              <div><span>Derrotas</span><b>{selectedPlayer.losses}</b></div>
              <div><span>Win Rate</span><b>{getWinRate(selectedPlayer.wins, selectedPlayer.losses)}%</b></div>
              <div><span>Racha</span><b>{selectedPlayer.streak}</b></div>
              <div><span>Ultima actividad</span><b>{selectedPlayer.lastActivity}</b></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rankings;
