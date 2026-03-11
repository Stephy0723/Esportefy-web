import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import {
  TournamentAdminShell,
  STATUS_LABELS,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const STATUS_FLOW = {
  draft: ['open'],
  open: ['ongoing', 'cancelled'],
  ongoing: ['finished', 'cancelled'],
  finished: [],
  cancelled: [],
};

const STATUS_ACTION_LABELS = {
  open: 'Abrir inscripciones',
  ongoing: 'Iniciar torneo',
  finished: 'Finalizar torneo',
  cancelled: 'Cancelar torneo',
};

const STATUS_TO_ACTION = {
  open: 'open',
  ongoing: 'start',
  finished: 'finish',
  cancelled: 'cancel',
};

const GUIDE_STEPS = [
  {
    key: 'teams',
    num: 1,
    title: 'Equipos inscritos',
    desc: 'Revisa, aprueba o rechaza los equipos. Puedes llenar con ficticios para probar.',
    icon: 'bx-group',
    needs: (t) => (t.registrations || []).filter((r) => r.status === 'approved').length >= 2,
    statusLabel: (t) => {
      const approved = (t.registrations || []).filter((r) => r.status === 'approved').length;
      return `${approved} aprobados de ${t.maxSlots || 0}`;
    },
  },
  {
    key: 'bracket',
    num: 2,
    title: 'Generar bracket',
    desc: 'Elige el formato y genera el cuadro de enfrentamientos con los equipos aprobados.',
    icon: 'bx-sitemap',
    needs: (t) => t.bracket?.rounds?.length > 0,
    statusLabel: (t) => t.bracket?.rounds?.length > 0 ? 'Bracket generado' : 'Sin bracket',
    navTo: (code) => `/tournaments/manage/${code}/bracket`,
  },
  {
    key: 'start',
    num: 3,
    title: 'Iniciar torneo',
    desc: 'Cambia el estado a "En curso". Cierra inscripciones y habilita las partidas.',
    icon: 'bx-play-circle',
    needs: (t) => t.status === 'ongoing' || t.status === 'finished',
    statusLabel: (t) => t.status === 'ongoing' || t.status === 'finished' ? 'Torneo iniciado' : 'Pendiente de iniciar',
  },
  {
    key: 'matches',
    num: 4,
    title: 'Gestionar partidas',
    desc: 'Reporta resultados con captura de pantalla obligatoria. Aprueba o disputa resultados.',
    icon: 'bx-trophy',
    needs: () => false,
    statusLabel: () => 'Ver centro de partidas',
    navTo: (code) => `/tournaments/manage/${code}/matches`,
  },
  {
    key: 'finish',
    num: 5,
    title: 'Finalizar torneo',
    desc: 'Marca el torneo como finalizado cuando todas las partidas esten completas.',
    icon: 'bx-check-circle',
    needs: (t) => t.status === 'finished',
    statusLabel: (t) => t.status === 'finished' ? 'Torneo finalizado' : 'Pendiente',
  },
];

const TournamentManagePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const {
    loading,
    tournament,
    settings,
    setSettings,
    compliance,
    complianceLoading,
    registrations,
    isMlbbTournament,
    hasValidMlbbRoster,
    refreshCompliance,
    savePublicSettings,
    updateRegistration,
    removeRegistration,
  } = useTournamentAdminData(code);

  const [statusLoading, setStatusLoading] = useState(false);
  const [expandedRoster, setExpandedRoster] = useState(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const seedTeams = async () => {
    setSeedLoading(true);
    try {
      const maxSlots = tournament?.maxSlots || 8;
      const current = tournament?.currentSlots || 0;
      const count = maxSlots - current;
      if (count <= 0) return alert('No hay cupos disponibles.');
      await axios.post(
        `${API_URL}/api/tournaments/${code}/seed-teams`,
        { count },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudieron agregar equipos ficticios.');
    } finally {
      setSeedLoading(false);
    }
  };

  const changeStatus = async (newStatus) => {
    if (newStatus === 'cancelled' && !window.confirm('Estas seguro de cancelar el torneo? Esta accion no se puede deshacer.')) return;
    if (newStatus === 'finished' && !window.confirm('Deseas finalizar el torneo? Asegurate de que todos los matches esten completados.')) return;

    setStatusLoading(true);
    try {
      await axios.patch(
        `${API_URL}/api/tournaments/${code}/status`,
        { action: STATUS_TO_ACTION[newStatus] || newStatus },
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo cambiar el estado del torneo.');
    } finally {
      setStatusLoading(false);
    }
  };

  const approvedCount = useMemo(
    () => registrations.filter((r) => r.status === 'approved').length,
    [registrations]
  );

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  const currentStatus = tournament.status || 'draft';
  const nextStatuses = STATUS_FLOW[currentStatus] || [];
  const hasBracket = tournament.bracket?.rounds?.length > 0;

  return (
    <TournamentAdminShell tournament={tournament} currentTab="overview">
      {/* Guide steps */}
      <section className="ta-panel" style={{ marginBottom: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Guia del organizador</span>
            <h2>Pasos para ejecutar tu torneo</h2>
          </div>
        </div>

        <div className="ta-guide-steps">
          {GUIDE_STEPS.map((step) => {
            const done = step.needs(tournament);
            return (
              <article
                key={step.key}
                className={`ta-guide-step ${done ? 'is-done' : ''}`}
                onClick={() => step.navTo ? navigate(step.navTo(tournament.tournamentId)) : null}
                style={step.navTo ? { cursor: 'pointer' } : undefined}
              >
                <div className="ta-guide-step__num">
                  {done ? <i className="bx bx-check" /> : step.num}
                </div>
                <div className="ta-guide-step__body">
                  <div className="ta-guide-step__header">
                    <i className={`bx ${step.icon}`} />
                    <strong>{step.title}</strong>
                  </div>
                  <p>{step.desc}</p>
                  <small className={done ? 'ta-guide-ok' : 'ta-guide-pending'}>
                    {step.statusLabel(tournament)}
                  </small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Quick info + Status */}
      <div className="ta-manage-layout">
        <section className="ta-panel">
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">Resumen</span>
              <h2>Estado del torneo</h2>
            </div>
          </div>

          <div className="ta-summary-grid" style={{ marginBottom: 16 }}>
            <div>
              <span>Juego</span>
              <strong>{tournament.game}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong className={`ta-lifecycle__status ta-lifecycle__status--${currentStatus}`}>
                {STATUS_LABELS[currentStatus] || currentStatus}
              </strong>
            </div>
            <div>
              <span>Equipos</span>
              <strong>{approvedCount}/{tournament.maxSlots || 0} aprobados</strong>
            </div>
            <div>
              <span>Bracket</span>
              <strong>{hasBracket ? `${tournament.bracket.rounds.length} rondas` : 'No generado'}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{tournament.date ? new Date(tournament.date).toLocaleDateString('es-DO') : '-'}</strong>
            </div>
            <div>
              <span>Formato</span>
              <strong>{tournament.format || tournament.bracket?.format || '-'}</strong>
            </div>
          </div>

          {/* Status control */}
          <div className="ta-lifecycle">
            <div className="ta-lifecycle__current">
              <span>Estado actual</span>
              <strong className={`ta-lifecycle__status ta-lifecycle__status--${currentStatus}`}>
                {STATUS_LABELS[currentStatus] || currentStatus}
              </strong>
            </div>
            {nextStatuses.length > 0 && (
              <div className="ta-shortcuts">
                {nextStatuses.map((next) => (
                  <button
                    key={next}
                    className={next === 'cancelled' ? 'ta-btn-danger' : ''}
                    onClick={() => changeStatus(next)}
                    disabled={statusLoading}
                  >
                    {statusLoading ? 'Procesando...' : STATUS_ACTION_LABELS[next] || next}
                  </button>
                ))}
              </div>
            )}
            {nextStatuses.length === 0 && (
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                Estado final. No se pueden realizar mas cambios.
              </p>
            )}
          </div>
        </section>

        <section className="ta-side-stack">
          {/* Quick actions */}
          <article className="ta-panel ta-panel--compact">
            <span className="ta-kicker">Acciones rapidas</span>
            <h3>Herramientas</h3>
            <div className="ta-shortcuts">
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/bracket`)}>
                <i className="bx bx-sitemap" /> Bracket
              </button>
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/matches`)}>
                <i className="bx bx-trophy" /> Partidas
              </button>
              <button onClick={() => navigate(`/tournaments/manage/${tournament.tournamentId}/roulette`)}>
                <i className="bx bx-dice-5" /> Ruleta
              </button>
              <button className="ghost" onClick={() => navigate(`/torneos/publicos/${tournament.tournamentId}`)}>
                <i className="bx bx-link-external" /> Vista publica
              </button>
              <button className="ghost" onClick={seedTeams} disabled={seedLoading}>
                <i className="bx bx-bot" /> {seedLoading ? 'Llenando...' : 'Equipos ficticios'}
              </button>
            </div>
          </article>

          {/* Public settings */}
          <article className="ta-panel ta-panel--compact">
            <div className="ta-panel__head">
              <div>
                <span className="ta-kicker">Publicacion</span>
                <h3>Pagina publica</h3>
              </div>
              <div className="ta-actions">
                <button onClick={savePublicSettings}>Guardar</button>
              </div>
            </div>

            <div className="ta-form-grid">
              <label>
                <span>Visibilidad</span>
                <select value={settings.visibility} onChange={(e) => setSettings((prev) => ({ ...prev, visibility: e.target.value }))}>
                  <option value="public">Publico</option>
                  <option value="unlisted">No listado</option>
                  <option value="private">Privado</option>
                </select>
              </label>
              <label>
                <span>Mensaje de portada</span>
                <input
                  value={settings.customMessage || ''}
                  onChange={(e) => setSettings((prev) => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="Mensaje visible en la pagina"
                />
              </label>
            </div>

            <div className="ta-toggles">
              {[
                ['showPrize', 'Premios'],
                ['showSponsors', 'Sponsors'],
                ['showRules', 'Reglamento'],
                ['showSchedule', 'Horario'],
                ['showContact', 'Contacto'],
                ['showTeams', 'Equipos'],
                ['showBracket', 'Bracket'],
              ].map(([key, label]) => (
                <label key={key} className="ta-toggle">
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key])}
                    onChange={(e) => setSettings((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </article>

          {/* Compliance */}
          <article className="ta-panel ta-panel--compact">
            <div className="ta-panel__head">
              <div>
                <span className="ta-kicker">Compliance</span>
                <h3>Verificacion</h3>
              </div>
              <div className="ta-actions">
                <button className="ghost" onClick={refreshCompliance} disabled={complianceLoading}>
                  {complianceLoading ? 'Verificando...' : 'Revisar'}
                </button>
              </div>
            </div>
            {!compliance ? (
              <div className="ta-empty">No se pudo cargar.</div>
            ) : (
              <div className="ta-compliance-list">
                {compliance.checks?.map((check) => (
                  <article key={check.id} className={`ta-compliance-card ${check.ok ? 'ok' : 'warn'}`}>
                    <strong>{check.label}</strong>
                    <p>{check.detail}</p>
                  </article>
                ))}
              </div>
            )}
          </article>
        </section>
      </div>

      {/* Teams */}
      <section className="ta-panel ta-panel--teams" style={{ marginTop: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Paso 1</span>
            <h2>Equipos inscritos ({approvedCount}/{tournament.maxSlots || 0})</h2>
          </div>
          <div className="ta-actions">
            <button className="ghost" onClick={seedTeams} disabled={seedLoading}>
              {seedLoading ? 'Llenando...' : 'Llenar ficticios'}
            </button>
          </div>
        </div>

        {registrations.length === 0 ? (
          <div className="ta-empty">No hay equipos inscritos. Usa "Llenar ficticios" para probar el flujo.</div>
        ) : (
          <div className="ta-list">
            {registrations.map((item) => {
              const starters = Array.isArray(item?.roster?.starters) ? item.roster.starters.filter(Boolean) : [];
              const subs = Array.isArray(item?.roster?.subs) ? item.roster.subs.filter(Boolean) : [];
              const isExpanded = expandedRoster === item._id;

              return (
                <article key={item._id} className="ta-row ta-row--expandable">
                  <div className="ta-row__main">
                    <div>
                      <strong>{item.teamName}</strong>
                      <div className="ta-row-meta">
                        <span className={`ta-pill ${item.status === 'approved' ? 'ok' : item.status === 'rejected' ? 'warn' : ''}`}>
                          {item.status === 'approved' ? 'Aprobado' : item.status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                        </span>
                        {item?.teamMeta?.teamCountry ? <span className="ta-pill">{item.teamMeta.teamCountry}</span> : null}
                        <span className="ta-pill">{starters.length} titulares</span>
                        {subs.length > 0 && <span className="ta-pill">{subs.length} suplentes</span>}
                        {isMlbbTournament ? (
                          <span className={`ta-pill ${hasValidMlbbRoster(item) ? 'ok' : 'warn'}`}>
                            {hasValidMlbbRoster(item) ? 'MLBB listo' : 'MLBB incompleto'}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="ta-row-actions">
                      <button
                        className="ghost"
                        onClick={() => setExpandedRoster(isExpanded ? null : item._id)}
                        style={{ padding: '8px 12px' }}
                      >
                        {isExpanded ? 'Ocultar' : 'Roster'}
                      </button>
                      <button
                        onClick={() => updateRegistration(item._id, 'approved')}
                        disabled={isMlbbTournament && !hasValidMlbbRoster(item)}
                      >
                        Aprobar
                      </button>
                      <button className="warn" onClick={() => updateRegistration(item._id, 'rejected')}>Rechazar</button>
                      <button className="danger" onClick={() => removeRegistration(item._id)}>Quitar</button>
                    </div>
                  </div>

                  {isExpanded && (starters.length > 0 || subs.length > 0) && (
                    <div className="ta-roster-detail">
                      {starters.length > 0 && (
                        <div>
                          <span className="ta-editor-label">Titulares</span>
                          <div className="ta-roster-grid">
                            {starters.map((player, idx) => (
                              <div key={idx} className="ta-roster-player">
                                <strong>{player.nickname || player.gameId || `Jugador ${idx + 1}`}</strong>
                                <div className="ta-row-meta">
                                  {player.role && <span className="ta-pill">{player.role}</span>}
                                  {player.gameId && <span className="ta-pill">{player.gameId}</span>}
                                  {player.region && <span className="ta-pill">{player.region}</span>}
                                  {player.riotId && <span className="ta-pill">Riot: {player.riotId}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {subs.length > 0 && (
                        <div>
                          <span className="ta-editor-label">Suplentes</span>
                          <div className="ta-roster-grid">
                            {subs.map((player, idx) => (
                              <div key={idx} className="ta-roster-player">
                                <strong>{player.nickname || player.gameId || `Suplente ${idx + 1}`}</strong>
                                <div className="ta-row-meta">
                                  {player.role && <span className="ta-pill">{player.role}</span>}
                                  {player.gameId && <span className="ta-pill">{player.gameId}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </TournamentAdminShell>
  );
};

export default TournamentManagePage;
