import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { useNotification } from '../../../../context/NotificationContext';
import { applyImageFallback, getTeamFallback, resolveMediaUrl } from '../../../../utils/media';
import {
  getGameMatchResultConfig,
  normalizeGameMatchResultPayload,
} from '../../../../../../shared/gameMatchResults.js';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';
import './TournamentMatchCenter.overrides.css';

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

const toInputValue = (value) => (value === null || value === undefined ? '' : String(value));

const buildGameResultFormState = (gameResult = {}) => ({
  summary: String(gameResult?.summary || ''),
  notes: String(gameResult?.notes || ''),
  map: String(gameResult?.map || ''),
  roundLabel: String(gameResult?.roundLabel || ''),
  mode: String(gameResult?.mode || ''),
  stage: String(gameResult?.stage || ''),
  sideACharacter: String(gameResult?.sideACharacter || ''),
  sideBCharacter: String(gameResult?.sideBCharacter || ''),
  sideAPlacement: toInputValue(gameResult?.sideA?.placement),
  sideAKills: toInputValue(gameResult?.sideA?.kills),
  sideAPoints: toInputValue(gameResult?.sideA?.points),
  sideBPlacement: toInputValue(gameResult?.sideB?.placement),
  sideBKills: toInputValue(gameResult?.sideB?.kills),
  sideBPoints: toInputValue(gameResult?.sideB?.points),
});

const buildGameResultPayload = (formState = {}, config = {}) => {
  const payload = {};

  if (config.supportsSummary) payload.summary = formState.summary;
  if (config.supportsNotes) payload.notes = formState.notes;
  if (config.supportsMap) payload.map = formState.map;
  if (config.supportsRoundLabel) payload.roundLabel = formState.roundLabel;
  if (config.supportsMode) payload.mode = formState.mode;
  if (config.supportsStage) payload.stage = formState.stage;
  if (config.supportsCharacters) {
    payload.sideACharacter = formState.sideACharacter;
    payload.sideBCharacter = formState.sideBCharacter;
  }

  if (config.supportsBattleRoyaleStats) {
    payload.sideA = {
      placement: formState.sideAPlacement,
      kills: formState.sideAKills,
      points: formState.sideAPoints,
    };
    payload.sideB = {
      placement: formState.sideBPlacement,
      kills: formState.sideBKills,
      points: formState.sideBPoints,
    };
  }

  return payload;
};

const winningScoreCandidate = (value, shouldWin = false) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed;
  return shouldWin ? 1 : 0;
};

const pickResolutionCandidate = (match, winnerRefId = '') => {
  const targetWinner = String(winnerRefId || '').trim();
  const submissions = Array.isArray(match?.resultSubmissions) ? [...match.resultSubmissions] : [];
  const matchingSubmission = submissions.reverse().find((item) => String(item?.winnerRefId || '') === targetWinner);

  const fallbackScoreA = winningScoreCandidate(match?.scoreA, targetWinner === teamRef(match?.teamA));
  const fallbackScoreB = winningScoreCandidate(match?.scoreB, targetWinner === teamRef(match?.teamB));

  return {
    scoreA: matchingSubmission?.scoreA ?? fallbackScoreA,
    scoreB: matchingSubmission?.scoreB ?? fallbackScoreB,
    gameResult: matchingSubmission?.gameResult ?? match?.gameResult ?? null,
  };
};

/* ── component ── */

const TournamentMatchCenter = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const { loading, tournament, bracket, setBracket } = useTournamentAdminData(code);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : undefined),
    [token]
  );

  const [filter, setFilter] = useState('all');
  const [activeKey, setActiveKey] = useState(null);

  // Editor state
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');
  const [editStatus, setEditStatus] = useState('pending');
  const [saving, setSaving] = useState(false);
  const [gameResultForm, setGameResultForm] = useState(() => buildGameResultFormState());

  // Proof
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofUploading, setProofUploading] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [liveTeamLogoMap, setLiveTeamLogoMap] = useState(() => new Map());
  const fileInputRef = useRef(null);
  const matchResultConfig = useMemo(
    () => getGameMatchResultConfig(tournament?.game, tournament?.matchConfig?.seriesType),
    [tournament?.game, tournament?.matchConfig?.seriesType]
  );

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

  const registrationLogoMap = useMemo(() => {
    const map = new Map();
    const registrations = Array.isArray(tournament?.registrations) ? tournament.registrations : [];

    const addLogo = (key, logoUrl) => {
      const normalizedKey = String(key || '').trim().toLowerCase();
      const normalizedLogo = String(logoUrl || '').trim();
      if (!normalizedKey || !normalizedLogo || map.has(normalizedKey)) return;
      map.set(normalizedKey, normalizedLogo);
    };

    registrations.forEach((registration) => {
      addLogo(registration?._id, registration?.logoUrl);
      addLogo(registration?.teamId, registration?.logoUrl);
      addLogo(registration?.teamName, registration?.logoUrl);
    });

    return map;
  }, [tournament?.registrations]);

  useEffect(() => {
    let cancelled = false;

    const loadLiveTeamLogos = async () => {
      const registrations = Array.isArray(tournament?.registrations) ? tournament.registrations : [];
      const teamIds = registrations.map((registration) => String(registration?.teamId || '').trim()).filter(Boolean);

      if (!teamIds.length) {
        setLiveTeamLogoMap(new Map());
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/teams`, { headers: authHeaders });
        if (cancelled) return;

        const nextMap = new Map();
        (Array.isArray(response.data) ? response.data : []).forEach((team) => {
          const normalizedLogo = String(team?.logo || '').trim();
          if (!normalizedLogo) return;

          const keys = [
            team?._id,
            team?.teamCode,
            team?.name,
          ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean);

          keys.forEach((key) => {
            if (!nextMap.has(key)) {
              nextMap.set(key, normalizedLogo);
            }
          });
        });

        setLiveTeamLogoMap(nextMap);
      } catch (_) {
        if (!cancelled) {
          setLiveTeamLogoMap(new Map());
        }
      }
    };

    loadLiveTeamLogos();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, tournament?.registrations]);

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

  const resolveTeamLogo = (team, fallbackName = '') => {
    if (!team || typeof team === 'string') return '';

    const directLogo = resolveMediaUrl(team.logoUrl);
    if (directLogo) return directLogo;

    const candidateKeys = [
      team.refId,
      team.teamId,
      team.teamName,
      fallbackName,
    ]
      .map((value) => String(value || '').trim().toLowerCase())
      .filter(Boolean);

    for (const key of candidateKeys) {
      const registrationLogo = registrationLogoMap.get(key);
      if (registrationLogo) {
        return resolveMediaUrl(registrationLogo);
      }

      const liveTeamLogo = liveTeamLogoMap.get(key);
      if (liveTeamLogo) {
        return resolveMediaUrl(liveTeamLogo);
      }
    }

    return '';
  };

  /* ── actions ── */

  const selectMatch = (match) => {
    setActiveKey(match.key);
    setEditScoreA(match.scoreA ?? '');
    setEditScoreB(match.scoreB ?? '');
    setEditStatus(match.status || 'pending');
    setGameResultForm(buildGameResultFormState(match.gameResult));
    setProofFile(null);
    setProofPreview('');
    setProofUrl(match.proofUrl || '');
  };

  const closeEditor = () => {
    setActiveKey(null);
    setGameResultForm(buildGameResultFormState());
    setProofFile(null);
    setProofPreview('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const updateGameResultField = (field, value) => {
    setGameResultForm((current) => ({ ...current, [field]: value }));
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
      addToast('No se pudo subir la captura.', 'error');
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
    const shouldResolve = finalStatus === 'finished';
    let finalProofUrl = proofUrl || selectedMatch.proofUrl || '';

    const rawScoreA = editScoreA === '' ? null : Number(editScoreA);
    const rawScoreB = editScoreB === '' ? null : Number(editScoreB);
    const rawGameResult = buildGameResultPayload(gameResultForm, matchResultConfig);

    let normalizedResult;
    try {
      normalizedResult = normalizeGameMatchResultPayload({
        game: tournament?.game,
        seriesType: tournament?.matchConfig?.seriesType,
        scoreA: rawScoreA,
        scoreB: rawScoreB,
        gameResult: rawGameResult,
        status: finalStatus,
      });
    } catch (error) {
      addToast(error.message || 'No se pudo validar el resultado del match.', 'warning');
      return;
    }

    if (shouldResolve) {
      if (proofFile && !proofUrl) finalProofUrl = await uploadProof();
      if (!finalProofUrl && !selectedMatch.proofUrl) {
        addToast('Sube una captura de resultado antes de finalizar.', 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      if (shouldResolve) {
        let winnerRefId = selectedMatch.winnerRefId || '';
        if (normalizedResult.scoreA > normalizedResult.scoreB) winnerRefId = teamRef(selectedMatch.teamA);
        if (normalizedResult.scoreB > normalizedResult.scoreA) winnerRefId = teamRef(selectedMatch.teamB);

        const response = await axios.patch(
          `${API_URL}/api/tournaments/${code}/bracket/matches/${selectedMatch.matchId}/resolve`,
          {
            winnerRefId,
            scoreA: normalizedResult.scoreA,
            scoreB: normalizedResult.scoreB,
            proofUrl: finalProofUrl,
            gameResult: normalizedResult.gameResult,
          },
          { headers: authHeaders }
        );
        setBracket(response.data.bracket);
      } else {
        const updated = updateMatchInBracket(selectedMatch.ri, selectedMatch.mi, (m) => ({
          ...m,
          scoreA: normalizedResult.scoreA,
          scoreB: normalizedResult.scoreB,
          status: finalStatus,
          proofUrl: proofUrl || m.proofUrl || '',
          gameResult: normalizedResult.gameResult,
        }));
        await patchBracket(updated);
      }
      closeEditor();
    } catch (err) {
      addToast(err.response?.data?.message || 'No se pudo guardar el resultado.', 'error');
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
      addToast('No se pudo actualizar el estado.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const resolveDispute = async (match, winningSide) => {
    setSaving(true);
    try {
      const winnerRefId = winningSide === 'A' ? teamRef(match.teamA) : teamRef(match.teamB);
      const candidate = pickResolutionCandidate(match, winnerRefId);

      const response = await axios.patch(
        `${API_URL}/api/tournaments/${code}/bracket/matches/${match.matchId}/resolve`,
        {
          winnerRefId,
          scoreA: candidate.scoreA,
          scoreB: candidate.scoreB,
          proofUrl: match.proofUrl || '',
          gameResult: candidate.gameResult,
        },
        { headers: authHeaders }
      );

      setBracket(response.data.bracket);
    } catch (error) {
      addToast(error.response?.data?.message || 'No se pudo resolver la disputa.', 'error');
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
          {/* Intro */}
          <div className="ta-section-intro">
            <h3><i className="bx bx-joystick" style={{ marginRight: 8, color: 'var(--primary)' }} />Centro de partidas</h3>
            <p>
              Aqui gestionas todas las partidas del torneo. Puedes cambiar el estado de cada
              partida, registrar resultados, subir capturas de prueba y resolver disputas.
              Haz clic en cualquier tarjeta de partida para abrir el panel de edicion.
            </p>
          </div>

          {/* Admin guide banner */}
          <div className="mc-admin-guide">
            <div className="mc-admin-guide__icon"><i className="bx bx-info-circle" /></div>
            <div className="mc-admin-guide__content">
              <strong>Guia rapida para el organizador</strong>
              <p>
                <b>Poner en vivo</b> — Marca la partida como activa cuando los equipos esten jugando.{' '}
                <b>Reportar resultado</b> — Abre el editor lateral para ingresar scores y subir prueba.{' '}
                <b>Finalizar match</b> — Cierra la partida, define el ganador y avanza el bracket.{' '}
                Haz clic en cualquier tarjeta para ver todas las opciones.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mc-stats-bar">
            <div className="mc-stat" title="Cantidad total de partidas en el bracket">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
            <div className="mc-stat mc-stat--live" title="Partidas que estan jugandose en este momento">
              <strong>{stats.live}</strong>
              <span>En vivo</span>
            </div>
            <div className="mc-stat mc-stat--done" title="Partidas con resultado confirmado">
              <strong>{stats.finished}</strong>
              <span>Finalizadas</span>
            </div>
            <div className="mc-stat" title="Partidas que aun no han comenzado">
              <strong>{stats.pending}</strong>
              <span>Pendientes</span>
            </div>
            {stats.disputed > 0 && (
              <div className="mc-stat mc-stat--warn" title="Partidas donde los equipos reportaron resultados diferentes">
                <strong>{stats.disputed}</strong>
                <span>Disputadas</span>
              </div>
            )}
            <div className="mc-stat mc-stat--pct" title="Porcentaje de partidas finalizadas sobre el total">
              <strong>{stats.total > 0 ? Math.round((stats.finished / stats.total) * 100) : 0}%</strong>
              <span>Completado</span>
            </div>
          </div>

          {/* Filters */}
          <div className="mc-filters">
            {[
              { key: 'all', label: 'Todas', tip: 'Ver todas las partidas' },
              { key: 'active', label: 'En vivo / Listas', tip: 'Partidas en curso o listas para comenzar' },
              { key: 'pending', label: 'Pendientes', tip: 'Partidas que aun no tienen equipos o no han comenzado' },
              { key: 'finished', label: 'Finalizadas', tip: 'Partidas con resultado registrado' },
              { key: 'disputed', label: 'Disputadas', tip: 'Partidas donde hay conflicto de resultados' },
            ].map((f) => (
              <button
                key={f.key}
                className={`ta-filter-btn ${filter === f.key ? 'is-active' : ''}`}
                onClick={() => setFilter(f.key)}
                title={f.tip}
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
                        const logoA = resolveTeamLogo(match.teamA, match.nameA);
                        const logoB = resolveTeamLogo(match.teamB, match.nameB);

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
                                <div className="mc-team__avatar">
                                  {logoA ? (
                                    <img
                                      src={logoA}
                                      alt={match.nameA || 'Equipo A'}
                                      onError={(event) => applyImageFallback(event, getTeamFallback(match.nameA || 'Team A'))}
                                    />
                                  ) : (
                                    (match.nameA || '?').charAt(0)
                                  )}
                                </div>
                                <span className="mc-team__name">{match.nameA || 'Por definir'}</span>
                                <span className="mc-team__score">{match.scoreA ?? '-'}</span>
                              </div>
                              <div className="mc-card__vs"><span>VS</span></div>
                              <div className={`mc-team ${winB ? 'mc-team--winner' : ''}`}>
                                <div className="mc-team__avatar">
                                  {logoB ? (
                                    <img
                                      src={logoB}
                                      alt={match.nameB || 'Equipo B'}
                                      onError={(event) => applyImageFallback(event, getTeamFallback(match.nameB || 'Team B'))}
                                    />
                                  ) : (
                                    (match.nameB || '?').charAt(0)
                                  )}
                                </div>
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
                                    title="Cambia el estado a En vivo para indicar que la partida esta en curso"
                                  >
                                    Poner en vivo
                                  </button>
                                )}
                                {match.status === 'live' && (
                                  <button
                                    className="ta-btn-sm ta-btn-sm--secondary"
                                    onClick={(e) => { e.stopPropagation(); selectMatch(match); }}
                                    title="Abre el panel lateral para registrar scores, subir prueba y finalizar"
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
                                  title={`Resolver la disputa a favor de ${match.nameA} y finalizar la partida`}
                                >
                                  Victoria {match.nameA}
                                </button>
                                <button
                                  className="ta-btn-sm ta-btn-sm--secondary"
                                  onClick={(e) => { e.stopPropagation(); resolveDispute(match, 'B'); }}
                                  disabled={saving}
                                  title={`Resolver la disputa a favor de ${match.nameB} y finalizar la partida`}
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
                  <button className="ghost" onClick={closeEditor} title="Cerrar el panel de edicion">Cerrar</button>
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
                <p className="ta-hint">{matchResultConfig.scoreHint}</p>

                {(matchResultConfig.supportsBattleRoyaleStats
                  || matchResultConfig.supportsStage
                  || matchResultConfig.supportsCharacters
                  || matchResultConfig.supportsMap
                  || matchResultConfig.supportsMode
                  || matchResultConfig.supportsRoundLabel
                  || matchResultConfig.supportsSummary
                  || matchResultConfig.supportsNotes) && (
                  <div className="mc-editor__result-meta">
                    <div className="mc-editor__proof-head">
                      <span className="mc-editor__label">Detalles del resultado</span>
                      <small>{matchResultConfig.kind === 'battle_royale' ? 'Campos especiales para BR y mobile.' : 'Contexto competitivo opcional para este match.'}</small>
                    </div>

                    {matchResultConfig.supportsBattleRoyaleStats && (
                      <div className="mc-editor__result-grid mc-editor__result-grid--triple">
                        <label>
                          <span>{selectedMatch.nameA} placement</span>
                          <input
                            type="number"
                            min="1"
                            value={gameResultForm.sideAPlacement}
                            onChange={(e) => updateGameResultField('sideAPlacement', e.target.value)}
                            placeholder="1"
                          />
                        </label>
                        <label>
                          <span>{selectedMatch.nameA} kills</span>
                          <input
                            type="number"
                            min="0"
                            value={gameResultForm.sideAKills}
                            onChange={(e) => updateGameResultField('sideAKills', e.target.value)}
                            placeholder="0"
                          />
                        </label>
                        <label>
                          <span>{selectedMatch.nameA} puntos</span>
                          <input
                            type="number"
                            min="0"
                            value={gameResultForm.sideAPoints}
                            onChange={(e) => updateGameResultField('sideAPoints', e.target.value)}
                            placeholder="0"
                          />
                        </label>
                        <label>
                          <span>{selectedMatch.nameB} placement</span>
                          <input
                            type="number"
                            min="1"
                            value={gameResultForm.sideBPlacement}
                            onChange={(e) => updateGameResultField('sideBPlacement', e.target.value)}
                            placeholder="1"
                          />
                        </label>
                        <label>
                          <span>{selectedMatch.nameB} kills</span>
                          <input
                            type="number"
                            min="0"
                            value={gameResultForm.sideBKills}
                            onChange={(e) => updateGameResultField('sideBKills', e.target.value)}
                            placeholder="0"
                          />
                        </label>
                        <label>
                          <span>{selectedMatch.nameB} puntos</span>
                          <input
                            type="number"
                            min="0"
                            value={gameResultForm.sideBPoints}
                            onChange={(e) => updateGameResultField('sideBPoints', e.target.value)}
                            placeholder="0"
                          />
                        </label>
                      </div>
                    )}

                    {(matchResultConfig.supportsStage
                      || matchResultConfig.supportsCharacters
                      || matchResultConfig.supportsMap
                      || matchResultConfig.supportsMode
                      || matchResultConfig.supportsRoundLabel) && (
                      <div className="mc-editor__result-grid">
                        {matchResultConfig.supportsStage && (
                          <label>
                            <span>Stage / escenario</span>
                            <input
                              type="text"
                              value={gameResultForm.stage}
                              onChange={(e) => updateGameResultField('stage', e.target.value)}
                              placeholder="Ej: Battlefield"
                            />
                          </label>
                        )}
                        {matchResultConfig.supportsCharacters && (
                          <>
                            <label>
                              <span>{selectedMatch.nameA} personaje</span>
                              <input
                                type="text"
                                value={gameResultForm.sideACharacter}
                                onChange={(e) => updateGameResultField('sideACharacter', e.target.value)}
                                placeholder="Main / pick"
                              />
                            </label>
                            <label>
                              <span>{selectedMatch.nameB} personaje</span>
                              <input
                                type="text"
                                value={gameResultForm.sideBCharacter}
                                onChange={(e) => updateGameResultField('sideBCharacter', e.target.value)}
                                placeholder="Main / pick"
                              />
                            </label>
                          </>
                        )}
                        {matchResultConfig.supportsMap && (
                          <label>
                            <span>Mapa / playlist</span>
                            <input
                              type="text"
                              value={gameResultForm.map}
                              onChange={(e) => updateGameResultField('map', e.target.value)}
                              placeholder="Ej: Erangel / Haven"
                            />
                          </label>
                        )}
                        {matchResultConfig.supportsMode && (
                          <label>
                            <span>Modo</span>
                            <input
                              type="text"
                              value={gameResultForm.mode}
                              onChange={(e) => updateGameResultField('mode', e.target.value)}
                              placeholder="Ej: Hardpoint"
                            />
                          </label>
                        )}
                        {matchResultConfig.supportsRoundLabel && (
                          <label>
                            <span>Lobby / ronda</span>
                            <input
                              type="text"
                              value={gameResultForm.roundLabel}
                              onChange={(e) => updateGameResultField('roundLabel', e.target.value)}
                              placeholder="Ej: Lobby 2"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {(matchResultConfig.supportsSummary || matchResultConfig.supportsNotes) && (
                      <div className="mc-editor__result-grid">
                        {matchResultConfig.supportsSummary && (
                          <label className="mc-editor__result-span">
                            <span>Resumen competitivo</span>
                            <input
                              type="text"
                              value={gameResultForm.summary}
                              onChange={(e) => updateGameResultField('summary', e.target.value)}
                              placeholder="Resumen corto del set o lobby"
                            />
                          </label>
                        )}
                        {matchResultConfig.supportsNotes && (
                          <label className="mc-editor__result-span">
                            <span>Notas del staff</span>
                            <textarea
                              rows="3"
                              value={gameResultForm.notes}
                              onChange={(e) => updateGameResultField('notes', e.target.value)}
                              placeholder="Detalles de disputa, side pick, scoring o contexto extra"
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <label className="mc-editor__status">
                  <span>Estado</span>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="pending">Pendiente — Aun no comienza</option>
                    <option value="ready">Listo — Equipos confirmados, por iniciar</option>
                    <option value="live">En vivo — Partida en curso</option>
                    <option value="finished">Finalizado — Resultado registrado</option>
                    <option value="walkover">Walkover — Victoria por ausencia</option>
                  </select>
                </label>
                <p className="ta-hint">El estado controla como se muestra la partida. Usa &quot;Finalizado&quot; cuando ya tengas el resultado.</p>

                {/* Proof section */}
                <div className="mc-editor__proof">
                  <div className="mc-editor__proof-head">
                    <span className="mc-editor__label">Captura de resultado</span>
                    <small>Obligatoria para finalizar la partida</small>
                  </div>

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
                      title="Selecciona una imagen (JPG, PNG o WebP) como evidencia del resultado"
                    >
                      {proofFile ? 'Cambiar captura' : 'Subir captura'}
                    </button>
                    {proofFile && !proofUrl && (
                      <button className="ghost" onClick={uploadProof} disabled={proofUploading} title="Sube la imagen al servidor">
                        {proofUploading ? 'Subiendo...' : 'Confirmar subida'}
                      </button>
                    )}
                  </div>
                  <p className="ta-hint">Sube un screenshot del resultado final como evidencia. Necesaria antes de finalizar.</p>
                </div>

                {/* Save actions */}
                <div className="mc-editor__actions">
                  <button
                    className="mc-editor__btn mc-editor__btn--save"
                    onClick={() => saveMatchResult(false)}
                    disabled={saving}
                    title="Guarda los scores y el estado sin finalizar la partida"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    className="mc-editor__btn mc-editor__btn--finish"
                    onClick={() => saveMatchResult(true)}
                    disabled={saving}
                    title="Marca la partida como finalizada, registra el ganador y guarda todo"
                  >
                    Finalizar match
                  </button>
                </div>
                <p className="ta-hint">
                  <strong>Guardar:</strong> guarda scores y estado sin cerrar la partida.{' '}
                  <strong>Finalizar:</strong> cierra la partida, determina el ganador por score y requiere captura de prueba.
                </p>
              </aside>
            )}
          </div>
        </>
      )}
    </TournamentAdminShell>
  );
};

export default TournamentMatchCenter;
