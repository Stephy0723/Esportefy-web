import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  TournamentAdminShell,
  createEmptyBracket,
  createEmptyMatch,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const roundLabel = (index, total) => {
  const labels = ['Octavos', 'Cuartos', 'Semifinal', 'Final'];
  return labels[Math.max(0, labels.length - total + index)] || `Ronda ${index + 1}`;
};

const TournamentBracketPage = () => {
  const { code } = useParams();
  const { loading, tournament, bracket, setBracket, approvedTeams, saveBracket } = useTournamentAdminData(code);
  const [selectedMatch, setSelectedMatch] = useState({ roundIndex: 0, matchIndex: 0 });

  const rounds = bracket?.rounds || [];
  const selectedRound = rounds[selectedMatch.roundIndex] || rounds[0];
  const selectedMatchData = selectedRound?.matches?.[selectedMatch.matchIndex] || createEmptyMatch();

  const availableSeed = useMemo(() => approvedTeams.join(', '), [approvedTeams]);

  const updateSelectedField = (field, value) => {
    setBracket((prev) => {
      const next = {
        ...prev,
        rounds: (prev?.rounds || []).map((round, roundIndex) => ({
          ...round,
          matches: (round.matches || []).map((match, matchIndex) =>
            roundIndex === selectedMatch.roundIndex && matchIndex === selectedMatch.matchIndex
              ? { ...match, [field]: value }
              : match
          ),
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

    const totalTeams = Math.max(2, approvedTeams.length);
    const nextPower = 2 ** Math.ceil(Math.log2(totalTeams));
    const totalRounds = Math.log2(nextPower);

    const seededMatches = [];
    for (let i = 0; i < nextPower; i += 2) {
      seededMatches.push({
        ...createEmptyMatch(),
        teamA: approvedTeams[i] || 'BYE',
        teamB: approvedTeams[i + 1] || 'BYE',
      });
    }

    const nextRounds = Array.from({ length: totalRounds }, (_, index) => {
      if (index === 0) {
        return {
          name: roundLabel(index, totalRounds),
          matches: seededMatches,
        };
      }

      const matches = Array.from(
        { length: Math.max(1, seededMatches.length / (2 ** index)) },
        () => createEmptyMatch()
      );

      return {
        name: roundLabel(index, totalRounds),
        matches,
      };
    });

    const nextBracket = {
      title: bracket?.title || 'Bracket principal',
      rounds: nextRounds,
    };

    setBracket(nextBracket);
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
              <button className="ghost" onClick={addRound}>Agregar ronda</button>
              <button onClick={saveBracket}>Guardar</button>
            </div>
          </div>

          <label>
            <span>Titulo del bracket</span>
            <input
              value={bracket?.title || ''}
              onChange={(e) => setBracket((prev) => ({ ...(prev || createEmptyBracket()), title: e.target.value }))}
            />
          </label>

          <div className="ta-editor-block">
            <span className="ta-editor-label">Match seleccionado</span>
            <strong>Ronda {selectedMatch.roundIndex + 1} - Match {selectedMatch.matchIndex + 1}</strong>
          </div>

          <div className="ta-form-grid ta-form-grid--stacked">
            <label>
              <span>Equipo A</span>
              <input value={selectedMatchData.teamA || ''} onChange={(e) => updateSelectedField('teamA', e.target.value)} />
            </label>
            <label>
              <span>Score A</span>
              <input value={selectedMatchData.scoreA || ''} onChange={(e) => updateSelectedField('scoreA', e.target.value)} />
            </label>
            <label>
              <span>Equipo B</span>
              <input value={selectedMatchData.teamB || ''} onChange={(e) => updateSelectedField('teamB', e.target.value)} />
            </label>
            <label>
              <span>Score B</span>
              <input value={selectedMatchData.scoreB || ''} onChange={(e) => updateSelectedField('scoreB', e.target.value)} />
            </label>
            <label className="ta-form-grid__full">
              <span>Horario</span>
              <input
                value={selectedMatchData.scheduledLabel || ''}
                onChange={(e) => updateSelectedField('scheduledLabel', e.target.value)}
                placeholder="23:00 EST - 19 Mar"
              />
            </label>
          </div>

          <div className="ta-editor-block">
            <span className="ta-editor-label">Equipos aprobados</span>
            <p>{availableSeed || 'Aun no hay equipos aprobados para sembrar.'}</p>
          </div>

          <div className="ta-shortcuts">
            <button onClick={autoBuildBracket}>Generar bracket</button>
            {rounds[selectedMatch.roundIndex] ? (
              <button className="ghost" onClick={() => addMatchToRound(selectedMatch.roundIndex)}>
                Agregar match a esta ronda
              </button>
            ) : null}
          </div>
        </aside>

        <section className="ta-stage ta-stage--bracket-page">
          <div className="ta-stage__backdrop" />
          <div className="ta-stage__brand ta-stage__brand--corner">
            <span>{tournament.game}</span>
            <strong>{bracket?.title || 'Bracket principal'}</strong>
          </div>

          <div className="ta-stage__board ta-stage__board--broadcast">
            {rounds.map((round, roundIndex) => (
              <div key={`round-${roundIndex}`} className="ta-stage__column">
                <div className="ta-stage__round-head ta-stage__round-head--stacked">
                  <input
                    value={round.name || ''}
                    onChange={(e) => updateRoundTitle(roundIndex, e.target.value)}
                    placeholder={`Ronda ${roundIndex + 1}`}
                  />
                  <span>{(round.matches || []).length} matches</span>
                </div>

                <div className="ta-stage__matches">
                  {(round.matches || []).map((match, matchIndex) => {
                    const isSelected =
                      selectedMatch.roundIndex === roundIndex && selectedMatch.matchIndex === matchIndex;

                    return (
                      <article
                        key={`match-${roundIndex}-${matchIndex}`}
                        className={`ta-stage__match ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => setSelectedMatch({ roundIndex, matchIndex })}
                      >
                        <div className="ta-stage__match-top">
                          <span>{`MATCH ${matchIndex + 1}`}</span>
                          <small>{match.scheduledLabel || 'Sin horario'}</small>
                        </div>
                        <div className="ta-stage__team-line">
                          <strong>{match.teamA || 'TBD'}</strong>
                          <span>{match.scoreA || 0}</span>
                        </div>
                        <div className="ta-stage__team-line">
                          <strong>{match.teamB || 'TBD'}</strong>
                          <span>{match.scoreB || 0}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </TournamentAdminShell>
  );
};

export default TournamentBracketPage;
