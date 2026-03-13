import { useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

/* ── helpers ── */

const STATUS_META = {
  pending:  { label: 'Pendiente',  tone: 'pending'  },
  ready:    { label: 'Listo',      tone: 'ready'    },
  live:     { label: 'En vivo',    tone: 'live'     },
  finished: { label: 'Finalizado', tone: 'finished' },
  walkover: { label: 'Walkover',   tone: 'walkover' },
};

const teamLabel = (team) => {
  if (!team) return '';
  if (typeof team === 'string') return team;
  if (team.teamName) return team.teamName;
  if (team.isBye) return 'BYE';
  return '';
};

const teamRef = (team) => {
  if (!team) return '';
  if (typeof team === 'string') return team;
  return team.refId || team.teamName || '';
};

const isMatchReady = (match) => {
  const a = teamLabel(match.teamA);
  const b = teamLabel(match.teamB);
  return a && b && a !== 'BYE' && b !== 'BYE';
};

/* ── component ── */

const TournamentMatchCenter = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { loading, tournament, bracket, setBracket } = useTournamentAdminData(code);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  const [filter, setFilter] = useState('all');
  const [activeKey, setActiveKey] = useState(null);

  // Editor state
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');
  const [editStatus, setEditStatus] = useState('pending');
  const [saving, setSaving] = useState(false);

  // Proof
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const fileInputRef = useRef(null);

  /* ── flatten bracket into rounds with enriched matches ── */
  const roundsData = useMemo(() => {
    const rounds = bracket?.rounds || [];
    return rounds.map((round, ri) => {
      const matches = (round.matches || []).map((m, mi) => ({
        ...m,
        ri,
        mi,
        key: `${ri}-${mi}`,
        roundName: round.name || `Ronda ${ri + 1}`,
        displayId: `R${ri + 1}-M${mi + 1}`,
        nameA: teamLabel(m.teamA),
        nameB: teamLabel(m.teamB),
        ready: isMatchReady(m),
      }));
      const total = matches.length;
      const done = matches.filter((m) => m.status === 'finished' || m.status === 'walkover').length;
      return {
        name: round.name || `Ronda ${ri + 1}`,
        matches,
        total,
        done,
        pct: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });
  }, [bracket]);

  const allMatches = useMemo(() => roundsData.flatMap((r) => r.matches), [roundsData]);

  const filteredRounds = useMemo(() => {
    if (filter === 'all') return roundsData;

    const pred = (m) => {
      const st = m.status || 'pending';
      if (filter === 'active') return st === 'live' || st === 'ready';
      if (filter === 'disputed') return m.confirmationStatus === 'disputed';
      return st === filter;
    };

    return roundsData
      .map((r) => ({ ...r, matches: r.matches.filter(pred) }))
      .filter((r) => r.matches.length > 0);
  }, [roundsData, filter]);

  const stats = useMemo(() => {
    const total = allMatches.length;
    const live = allMatches.filter((m) => m.status === 'live').length;
    const finished = allMatches.filter((m) => m.status === 'finished').length;
    const pending = allMatches.filter((m) => !m.status || m.status === 'pending' || m.status === 'ready').length;
    const disputed = allMatches.filter((m) => m.confirmationStatus === 'disputed').length;
    return { total, live, finished, pending, disputed };
  }, [allMatches]);

  const selectedMatch = useMemo(
    () => (activeKey ? allMatches.find((m) => m.key === activeKey) : null),
    [activeKey, allMatches]
  );

  /* ── actions ── */

  const selectMatch = (match) => {
    setActiveKey(match.key);
    setEditScoreA(match.scoreA ?? '');
    setEditScoreB(match.scoreB ?? '');
    setEditStatus(match.status || 'pending');
    setProofFile(null);
    setProofPreview('');
    setProofUrl(match.proofUrl || '');
  };

  const closeEditor = () => {
    setActiveKey(null);
    setProofFile(null);
    setProofPreview('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const uploadProof = async () => {
    if (!proofFile) return '';
    setProofUploading(true);
    try {
      const formData = new FormData();
      formData.append('proof', proofFile);
      const res = await axios.post(
        `${API_URL}/api/tournaments/${code}/match-proof`,
        formData,
        { headers: { ...authHeaders, 'Content-Type': 'multipart/form-data' } }
      );
      setProofUrl(res.data.proofUrl);
      return res.data.proofUrl;
    } catch {
      alert('No se pudo subir la captura.');
      return '';
    } finally {
      setProofUploading(false);
    }
  };

  const patchBracket = async (updatedBracket) => {
    await axios.patch(
      `${API_URL}/api/tournaments/${code}/bracket`,
      { bracket: updatedBracket },
      { headers: authHeaders }
    );
    setBracket(updatedBracket);
  };

  const updateMatchInBracket = (ri, mi, updater) => {
    const updatedRounds = (bracket?.rounds || []).map((round, r) => ({
      ...round,
      matches: (round.matches || []).map((m, mIdx) =>
        r === ri && mIdx === mi ? updater(m) : m
      ),
    }));
    return { ...bracket, rounds: updatedRounds };
  };

  const saveMatchResult = async (forceFinish = false) => {
    if (!selectedMatch || saving) return;
    const finalStatus = forceFinish ? 'finished' : editStatus;

    if (finalStatus === 'finished') {
      let finalProofUrl = proofUrl;
      if (proofFile && !proofUrl) finalProofUrl = await uploadProof();
      if (!finalProofUrl && !selectedMatch.proofUrl) {
        alert('Sube una captura de resultado antes de finalizar.');
        return;
      }
    }

    setSaving(true);
    try {
      const updated = updateMatchInBracket(selectedMatch.ri, selectedMatch.mi, (m) => {
        const scoreA = editScoreA === '' ? null : Number(editScoreA);
        const scoreB = editScoreB === '' ? null : Number(editScoreB);
        let winnerRefId = m.winnerRefId || '';
        if (finalStatus === 'finished' && scoreA !== null && scoreB !== null) {
          if (scoreA > scoreB) winnerRefId = teamRef(m.teamA);
          else if (scoreB > scoreA) winnerRefId = teamRef(m.teamB);
        }
        return {
          ...m,
          scoreA,
          scoreB,
          status: finalStatus,
          winnerRefId,
          proofUrl: proofUrl || m.proofUrl || '',
          confirmationStatus: finalStatus === 'finished' ? 'resolved' : m.confirmationStatus,
        };
      });
      await patchBracket(updated);
      closeEditor();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo guardar el resultado.');
    } finally {
      setSaving(false);
    }
  };

  const setMatchStatus = async (match, status) => {
    setSaving(true);
    try {
      const updated = updateMatchInBracket(match.ri, match.mi, (m) => ({ ...m, status }));
      await patchBracket(updated);
    } catch {
      alert('No se pudo actualizar el estado.');
    } finally {
      setSaving(false);
    }
  };

  const resolveDispute = async (match, winningSide) => {
    setSaving(true);
    try {
      const updated = updateMatchInBracket(match.ri, match.mi, (m) => ({
        ...m,
        status: 'finished',
        confirmationStatus: 'resolved',
        winnerRefId: winningSide === 'A' ? teamRef(m.teamA) : teamRef(m.teamB),
      }));
      await patchBracket(updated);
    } catch {
      alert('No se pudo resolver la disputa.');
    } finally {
      setSaving(false);
    }
  };

  /* ── render ── */

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  const hasBracket = allMatches.length > 0;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="matches">
      {/* Empty state: no bracket */}
      {!hasBracket ? (
        <section className="ta-panel">
          <div className="ta-empty-hero">
            <i className="bx bx-bracket" style={{ fontSize: '2.4rem', color: 'var(--primary)' }} />
            <h2>No hay partidas todavia</h2>
            <p>El centro de partidas se alimenta del bracket. Crea el bracket y define los enfrentamientos primero.</p>
            <button
              onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/bracket`)}
            >
              Ir a Bracket
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* Stats bar */}
          <div className="mc-stats-bar">
            <div className="mc-stat">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
            <div className="mc-stat mc-stat--live">
              <strong>{stats.live}</strong>
              <span>En vivo</span>
            </div>
            <div className="mc-stat mc-stat--done">
              <strong>{stats.finished}</strong>
              <span>Finalizadas</span>
            </div>
            <div className="mc-stat">
              <strong>{stats.pending}</strong>
              <span>Pendientes</span>
            </div>
            {stats.disputed > 0 && (
              <div className="mc-stat mc-stat--warn">
                <strong>{stats.disputed}</strong>
                <span>Disputadas</span>
              </div>
            )}
            <div className="mc-stat mc-stat--pct">
              <strong>{stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0}%</strong>
              <span>Completado</span>
            </div>
          </div>

          {/* Filters */}
          <div className="mc-filters">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'active', label: 'En vivo / Listas' },
              { key: 'pending', label: 'Pendientes' },
              { key: 'finished', label: 'Finalizadas' },
              { key: 'disputed', label: 'Disputadas' },
            ].map((f) => (
              <button
                key={f.key}
                className={`ta-filter-btn ${filter === f.key ? 'is-active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Main layout */}
          <div className="mc-layout">
            {/* Left: rounds & matches */}
            <div className="mc-rounds">
              {filteredRounds.length === 0 ? (
                <div className="ta-empty">No hay partidas con ese filtro.</div>
              ) : (
                filteredRounds.map((round, idx) => (
                  <section key={idx} className="mc-round">
                    <div className="mc-round__head">
                      <div className="mc-round__title">
                        <h3>{round.name}</h3>
                        <span className="mc-round__count">{round.done}/{round.total}</span>
                      </div>
                      <div className="mc-round__bar">
                        <div className="mc-round__bar-fill" style={{ width: `${round.pct}%` }} />
                      </div>
                    </div>

                    <div className="mc-match-grid">
                      {round.matches.map((match) => {
                        const meta = STATUS_META[match.status] || STATUS_META.pending;
                        const isActive = activeKey === match.key;
                        const hasTeams = match.nameA && match.nameB;
                        const isBye = match.nameA === 'BYE' || match.nameB === 'BYE';
                        const hasProof = Boolean(match.proofUrl);
                        const winA = match.winnerRefId && match.winnerRefId === teamRef(match.teamA);
                        const winB = match.winnerRefId && match.winnerRefId === teamRef(match.teamB);

                        return (
                          <article
                            key={match.key}
                            className={`mc-card ${isActive ? 'mc-card--active' : ''} ${!hasTeams || isBye ? 'mc-card--empty' : ''} mc-card--${meta.tone}`}
                            onClick={() => hasTeams && !isBye && selectMatch(match)}
                          >
                            <div className="mc-card__top">
                              <span className="mc-card__id">{match.displayId}</span>
                              <span className={`mc-badge mc-badge--${meta.tone}`}>{meta.label}</span>
                              {hasProof && <span className="mc-badge mc-badge--proof">Prueba</span>}
                              {match.confirmationStatus === 'disputed' && (
                                <span className="mc-badge mc-badge--disputed">Disputa</span>
                              )}
                            </div>

                            <div className="mc-card__teams">
                              <div className={`mc-team ${winA ? 'mc-team--winner' : ''}`}>
                                <span className="mc-team__name">{match.nameA || 'Por definir'}</span>
                                <span className="mc-team__score">{match.scoreA ?? '-'}</span>
                              </div>
                              <div className="mc-card__vs">VS</div>
                              <div className={`mc-team ${winB ? 'mc-team--winner' : ''}`}>
                                <span className="mc-team__name">{match.nameB || 'Por definir'}</span>
                                <span className="mc-team__score">{match.scoreB ?? '-'}</span>
                              </div>
                            </div>

                            {/* Quick actions on the card */}
                            {hasTeams && !isBye && match.status !== 'finished' && match.status !== 'walkover' && (
                              <div className="mc-card__actions">
                                {match.status !== 'live' && (
                                  <button
                                    className="ta-btn-sm"
                                    onClick={(e) => { e.stopPropagation(); setMatchStatus(match, 'live'); }}
                                    disabled={saving}
                                  >
                                    Poner en vivo
                                  </button>
                                )}
                                {match.status === 'live' && (
                                  <button
                                    className="ta-btn-sm ta-btn-sm--secondary"
                                    onClick={(e) => { e.stopPropagation(); selectMatch(match); }}
                                  >
                                    Reportar resultado
                                  </button>
                                )}
                              </div>
                            )}

                            {match.confirmationStatus === 'disputed' && (
                              <div className="mc-card__actions">
                                <button
                                  className="ta-btn-sm"
                                  onClick={(e) => { e.stopPropagation(); resolveDispute(match, 'A'); }}
                                  disabled={saving}
                                >
                                  Victoria {match.nameA}
                                </button>
                                <button
                                  className="ta-btn-sm ta-btn-sm--secondary"
                                  onClick={(e) => { e.stopPropagation(); resolveDispute(match, 'B'); }}
                                  disabled={saving}
                                >
                                  Victoria {match.nameB}
                                </button>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))
              )}
            </div>

            {/* Right: editor panel */}
            {selectedMatch && (
              <aside className="mc-editor">
                <div className="mc-editor__head">
                  <div>
                    <span className="ta-kicker">{selectedMatch.roundName}</span>
                    <h3>{selectedMatch.displayId}</h3>
                  </div>
                  <button className="ghost" onClick={closeEditor}>Cerrar</button>
                </div>

                <div className="mc-editor__matchup">
                  <span className="mc-editor__team-name">{selectedMatch.nameA}</span>
                  <span className="mc-editor__vs">vs</span>
                  <span className="mc-editor__team-name">{selectedMatch.nameB}</span>
                </div>

                <div className="mc-editor__scores">
                  <label>
                    <span>{selectedMatch.nameA}</span>
                    <input
                      type="number"
                      min="0"
                      value={editScoreA}
                      onChange={(e) => setEditScoreA(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                  <label>
                    <span>{selectedMatch.nameB}</span>
                    <input
                      type="number"
                      min="0"
                      value={editScoreB}
                      onChange={(e) => setEditScoreB(e.target.value)}
                      placeholder="0"
                    />
                  </label>
                </div>

                <label className="mc-editor__status">
                  <span>Estado</span>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="pending">Pendiente</option>
                    <option value="ready">Listo</option>
                    <option value="live">En vivo</option>
                    <option value="finished">Finalizado</option>
                    <option value="walkover">Walkover</option>
                  </select>
                </label>

                {/* Proof section */}
                <div className="mc-editor__proof">
                  <span className="mc-editor__label">Captura de resultado</span>
                  <small>Obligatoria para finalizar la partida</small>

                  {(proofPreview || proofUrl || selectedMatch.proofUrl) && (
                    <div className="mc-editor__proof-img">
                      <img
                        src={proofPreview || `${API_URL}${proofUrl || selectedMatch.proofUrl}`}
                        alt="Prueba"
                      />
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  <div className="mc-editor__proof-actions">
                    <button
                      className="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={proofUploading}
                    >
                      {proofFile ? 'Cambiar captura' : 'Subir captura'}
                    </button>
                    {proofFile && !proofUrl && (
                      <button className="ghost" onClick={uploadProof} disabled={proofUploading}>
                        {proofUploading ? 'Subiendo...' : 'Confirmar subida'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Save actions */}
                <div className="mc-editor__actions">
                  <button
                    className="mc-editor__btn mc-editor__btn--save"
                    onClick={() => saveMatchResult(false)}
                    disabled={saving}
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    className="mc-editor__btn mc-editor__btn--finish"
                    onClick={() => saveMatchResult(true)}
                    disabled={saving}
                  >
                    Finalizar match
                  </button>
                </div>
              </aside>
            )}
          </div>
        </>
      )}
    </TournamentAdminShell>
  );
};

export default TournamentMatchCenter;
