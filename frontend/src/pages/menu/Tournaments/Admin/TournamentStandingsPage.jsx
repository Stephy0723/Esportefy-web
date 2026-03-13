import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const computeStandings = (bracket, registrations) => {
  const teamMap = {};

  const initTeam = (name) => {
    if (!name || name === 'TBD' || name === 'BYE') return;
    if (!teamMap[name]) {
      teamMap[name] = {
        name,
        wins: 0,
        losses: 0,
        draws: 0,
        played: 0,
        points: 0,
        scoreFor: 0,
        scoreAgainst: 0,
        buchholz: 0,
      };
    }
  };

  const getTeamName = (team) => {
    if (!team) return '';
    if (typeof team === 'string') return team;
    return team.teamName || '';
  };

  const rounds = bracket?.rounds || [];
  rounds.forEach((round) => {
    (round.matches || []).forEach((match) => {
      if (match.status !== 'finished') return;

      const nameA = getTeamName(match.teamA);
      const nameB = getTeamName(match.teamB);
      if (!nameA || !nameB) return;

      initTeam(nameA);
      initTeam(nameB);

      const sA = Number(match.scoreA) || 0;
      const sB = Number(match.scoreB) || 0;

      teamMap[nameA].played += 1;
      teamMap[nameB].played += 1;
      teamMap[nameA].scoreFor += sA;
      teamMap[nameA].scoreAgainst += sB;
      teamMap[nameB].scoreFor += sB;
      teamMap[nameB].scoreAgainst += sA;

      if (sA > sB) {
        teamMap[nameA].wins += 1;
        teamMap[nameA].points += 3;
        teamMap[nameB].losses += 1;
      } else if (sB > sA) {
        teamMap[nameB].wins += 1;
        teamMap[nameB].points += 3;
        teamMap[nameA].losses += 1;
      } else {
        teamMap[nameA].draws += 1;
        teamMap[nameB].draws += 1;
        teamMap[nameA].points += 1;
        teamMap[nameB].points += 1;
      }
    });
  });

  // Add unplayed approved teams
  (registrations || [])
    .filter((r) => r.status === 'approved')
    .forEach((r) => initTeam(r.teamName));

  // Buchholz tiebreaker (sum of opponents' points)
  rounds.forEach((round) => {
    (round.matches || []).forEach((match) => {
      if (match.status !== 'finished') return;
      const nameA = getTeamName(match.teamA);
      const nameB = getTeamName(match.teamB);
      if (teamMap[nameA] && teamMap[nameB]) {
        teamMap[nameA].buchholz += teamMap[nameB].points;
        teamMap[nameB].buchholz += teamMap[nameA].points;
      }
    });
  });

  return Object.values(teamMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    const diffA = a.scoreFor - a.scoreAgainst;
    const diffB = b.scoreFor - b.scoreAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.wins - a.wins;
  });
};

const TournamentStandingsPage = () => {
  const { code } = useParams();
  const { loading, tournament, bracket, registrations } = useTournamentAdminData(code);
  const [viewMode, setViewMode] = useState('table');

  const standings = useMemo(
    () => computeStandings(bracket, registrations),
    [bracket, registrations]
  );

  const format = bracket?.format || tournament?.format || '';
  const isSwissOrRR = ['swiss', 'round_robin'].includes(format) ||
    format?.toLowerCase()?.includes('suizo') ||
    format?.toLowerCase()?.includes('round robin');

  const downloadCSV = () => {
    if (standings.length === 0) return;
    const headers = ['#', 'Equipo', 'PJ', 'V', 'E', 'D', 'GF', 'GC', 'DIF', ...(isSwissOrRR ? ['BH'] : []), 'PTS'];
    const rows = standings.map((team, i) => [
      i + 1,
      team.name,
      team.played,
      team.wins,
      team.draws,
      team.losses,
      team.scoreFor,
      team.scoreAgainst,
      team.scoreFor - team.scoreAgainst,
      ...(isSwissOrRR ? [team.buchholz] : []),
      team.points,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clasificacion_${tournament?.tournamentId || 'torneo'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="standings">
      <section className="ta-panel">
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Clasificacion</span>
            <h2>Tabla de posiciones</h2>
          </div>
          <div className="ta-actions">
            <button
              className={viewMode === 'table' ? '' : 'ghost'}
              onClick={() => setViewMode('table')}
            >
              Tabla
            </button>
            <button
              className={viewMode === 'cards' ? '' : 'ghost'}
              onClick={() => setViewMode('cards')}
            >
              Tarjetas
            </button>
            {standings.length > 0 && (
              <button className="ghost" onClick={downloadCSV}>
                Descargar CSV
              </button>
            )}
          </div>
        </div>

        {standings.length === 0 ? (
          <div className="ta-empty">
            No hay datos de clasificacion aun. Completa partidas para ver la tabla.
          </div>
        ) : viewMode === 'table' ? (
          <div className="ta-standings-table-wrap">
            <table className="ta-standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DIF</th>
                  {isSwissOrRR && <th>BH</th>}
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((team, index) => (
                  <tr key={team.name} className={index < 3 ? 'ta-standings-top' : ''}>
                    <td>
                      <span className={`ta-standings-pos ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td><strong>{team.name}</strong></td>
                    <td>{team.played}</td>
                    <td className="ta-standings-win">{team.wins}</td>
                    <td>{team.draws}</td>
                    <td className="ta-standings-loss">{team.losses}</td>
                    <td>{team.scoreFor}</td>
                    <td>{team.scoreAgainst}</td>
                    <td className={team.scoreFor - team.scoreAgainst > 0 ? 'ta-standings-win' : team.scoreFor - team.scoreAgainst < 0 ? 'ta-standings-loss' : ''}>
                      {team.scoreFor - team.scoreAgainst > 0 ? '+' : ''}{team.scoreFor - team.scoreAgainst}
                    </td>
                    {isSwissOrRR && <td>{team.buchholz}</td>}
                    <td><strong>{team.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="ta-standings-cards">
            {standings.map((team, index) => (
              <article key={team.name} className="ta-standings-card">
                <div className="ta-standings-card__pos">
                  <span className={`ta-standings-pos ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    {index + 1}
                  </span>
                </div>
                <div className="ta-standings-card__info">
                  <strong>{team.name}</strong>
                  <div className="ta-standings-card__stats">
                    <span>{team.wins}V {team.draws}E {team.losses}D</span>
                    <span>GD: {team.scoreFor - team.scoreAgainst > 0 ? '+' : ''}{team.scoreFor - team.scoreAgainst}</span>
                  </div>
                </div>
                <div className="ta-standings-card__pts">
                  <strong>{team.points}</strong>
                  <small>PTS</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isSwissOrRR && (
        <section className="ta-panel" style={{ marginTop: 16 }}>
          <span className="ta-kicker">Formato</span>
          <h3>{format?.includes('swiss') || format?.includes('suizo') ? 'Sistema Suizo' : 'Round Robin'}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            {format?.includes('swiss') || format?.includes('suizo')
              ? 'Los emparejamientos se realizan por rondas basados en puntos. Desempate por Buchholz (suma de puntos de oponentes enfrentados).'
              : 'Todos contra todos. Los equipos juegan una vez contra cada rival. La clasificacion determina los que avanzan.'}
          </p>
        </section>
      )}
    </TournamentAdminShell>
  );
};

export default TournamentStandingsPage;
