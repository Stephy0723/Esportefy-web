import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const REPORT_TYPES = [
  { value: 'cheating', label: 'Trampa / Hack', icon: 'bx-shield-x' },
  { value: 'unsportsmanlike', label: 'Conducta antideportiva', icon: 'bx-angry' },
  { value: 'impersonation', label: 'Suplantacion de identidad', icon: 'bx-user-x' },
  { value: 'match_fixing', label: 'Amanamiento de partido', icon: 'bx-lock-alt' },
  { value: 'exploit', label: 'Uso de exploit / bug', icon: 'bx-bug' },
  { value: 'staff_misconduct', label: 'Conducta de staff', icon: 'bx-group' },
  { value: 'other', label: 'Otro', icon: 'bx-dots-horizontal-rounded' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Baja', color: '#22c55e' },
  { value: 'medium', label: 'Media', color: '#f59e0b' },
  { value: 'high', label: 'Alta', color: '#ef4444' },
  { value: 'critical', label: 'Critica', color: '#dc2626' },
];

const SANCTION_OPTIONS = [
  { value: 'warning', label: 'Advertencia', icon: 'bx-error' },
  { value: 'match_loss', label: 'Perdida del match', icon: 'bx-x' },
  { value: 'disqualification', label: 'Descalificacion', icon: 'bx-block' },
  { value: 'ban', label: 'Ban del torneo', icon: 'bx-shield-x' },
  { value: 'staff_removal', label: 'Remocion de staff', icon: 'bx-user-minus' },
];

const STATUS_LABELS = {
  open: 'Abierto',
  investigating: 'En investigacion',
  resolved: 'Resuelto',
  dismissed: 'Desestimado',
};

const TournamentReportsPage = () => {
  const { code } = useParams();
  const { loading, tournament, registrations, bracket, setBracket } = useTournamentAdminData(code);
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const authConfig = useMemo(() => ({
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  }), [token]);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [sanctionNote, setSanctionNote] = useState('');

  // Form state
  const [reportType, setReportType] = useState('cheating');
  const [reportedTeam, setReportedTeam] = useState('');
  const [reportedPlayer, setReportedPlayer] = useState('');
  const [reportedStaff, setReportedStaff] = useState('');
  const [matchId, setMatchId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');

  const approvedTeams = useMemo(
    () => (registrations || []).filter((r) => r.status === 'approved').map((r) => r.teamName),
    [registrations]
  );

  const staffNames = useMemo(() => {
    const mods = tournament?.staff?.moderators || [];
    return Array.isArray(mods) ? mods.map(m => typeof m === 'string' ? m : m.username).filter(Boolean) : [];
  }, [tournament]);

  const allMatchIds = useMemo(() => {
    const ids = [];
    (bracket?.rounds || []).forEach((round, ri) => {
      (round.matches || []).forEach((_, mi) => {
        ids.push(`R${ri + 1}-M${mi + 1}`);
      });
    });
    return ids;
  }, [bracket]);

  // Load reports from API
  const fetchReports = useCallback(async () => {
    if (!code || !token) return;
    try {
      setReportsLoading(true);
      const res = await axios.get(`${API_URL}/api/tournaments/${code}/reports`, authConfig);
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setReportsLoading(false);
    }
  }, [code, token, authConfig]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const filteredReports = useMemo(() => {
    if (filter === 'all') return reports;
    if (filter === 'open') return reports.filter((r) => r.status === 'open' || r.status === 'investigating');
    if (filter === 'resolved') return reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed');
    if (filter === 'sanctioned') return reports.filter((r) => r.sanction);
    return reports;
  }, [reports, filter]);

  const stats = useMemo(() => ({
    total: reports.length,
    open: reports.filter((r) => r.status === 'open' || r.status === 'investigating').length,
    resolved: reports.filter((r) => r.status === 'resolved' || r.status === 'dismissed').length,
    sanctioned: reports.filter((r) => r.sanction).length,
  }), [reports]);

  const resetForm = () => {
    setReportType('cheating');
    setReportedTeam('');
    setReportedPlayer('');
    setReportedStaff('');
    setMatchId('');
    setEvidence('');
    setDescription('');
    setSeverity('medium');
  };

  const submitReport = async () => {
    if (!reportedTeam && !reportedPlayer && !reportedStaff) {
      return alert('Indica el equipo, jugador o miembro de staff reportado.');
    }
    if (!description.trim()) return alert('Agrega una descripcion del reporte.');

    try {
      const res = await axios.post(`${API_URL}/api/tournaments/${code}/reports`, {
        type: reportType,
        reportedTeam,
        reportedPlayer,
        reportedStaff,
        matchId,
        severity,
        evidence,
        description,
      }, authConfig);
      setReports((prev) => [res.data, ...prev]);
      setShowForm(false);
      resetForm();
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo crear el reporte.');
    }
  };

  const updateReportStatus = async (reportId, updates) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/tournaments/${code}/reports/${reportId}`,
        updates,
        authConfig
      );
      setReports((prev) => prev.map((r) => r.reportId === reportId ? { ...r, ...res.data } : r));
      setSelectedReport(null);
      setSanctionNote('');
      // Refresh bracket if DQ was applied
      if (updates.sanction === 'disqualification') {
        window.location.reload();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo actualizar el reporte.');
    }
  };

  const removeReport = async (reportId) => {
    if (!window.confirm('Eliminar este reporte permanentemente?')) return;
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/reports/${reportId}`, authConfig);
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
    } catch (err) {
      alert(err.response?.data?.message || 'No se pudo eliminar el reporte.');
    }
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">Cargando...</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">No se encontro el torneo.</div></div>;

  const isStaffReport = reportType === 'staff_misconduct';

  return (
    <TournamentAdminShell tournament={tournament} currentTab="reports">
      {/* Metrics */}
      <div className="ta-hero__metrics" style={{ marginBottom: 18 }}>
        {[
          { label: 'Total reportes', value: stats.total },
          { label: 'Abiertos', value: stats.open },
          { label: 'Resueltos', value: stats.resolved },
          { label: 'Sancionados', value: stats.sanctioned },
        ].map((m) => (
          <div key={m.label} className="ta-metric">
            <strong>{m.value}</strong>
            <span>{m.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="ta-toolbar" style={{ marginTop: 0 }}>
        <div className="ta-match-filters">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'open', label: 'Abiertos' },
            { key: 'resolved', label: 'Resueltos' },
            { key: 'sanctioned', label: 'Sancionados' },
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
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : 'Nuevo reporte'}
        </button>
      </div>

      {/* New report form */}
      {showForm && (
        <section className="ta-panel ta-report-form" style={{ marginTop: 16 }}>
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">Nuevo reporte</span>
              <h2>Registrar incidencia</h2>
            </div>
          </div>

          <div className="ta-report-types">
            {REPORT_TYPES.map((rt) => (
              <button
                key={rt.value}
                className={`ta-report-type-btn ${reportType === rt.value ? 'is-active' : ''}`}
                onClick={() => setReportType(rt.value)}
              >
                <i className={`bx ${rt.icon}`} />
                <span>{rt.label}</span>
              </button>
            ))}
          </div>

          <div className="ta-form-grid">
            {isStaffReport ? (
              <label>
                <span>Miembro de staff reportado</span>
                <select value={reportedStaff} onChange={(e) => setReportedStaff(e.target.value)}>
                  <option value="">Seleccionar miembro</option>
                  {staffNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  <span>Equipo reportado</span>
                  <select value={reportedTeam} onChange={(e) => setReportedTeam(e.target.value)}>
                    <option value="">Seleccionar equipo</option>
                    {approvedTeams.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Jugador (opcional)</span>
                  <input
                    value={reportedPlayer}
                    onChange={(e) => setReportedPlayer(e.target.value)}
                    placeholder="Nickname del jugador"
                  />
                </label>
              </>
            )}
            <label>
              <span>Match relacionado</span>
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                <option value="">Ninguno</option>
                {allMatchIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Severidad</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="ta-form-grid__full">
              <span>Evidencia (URLs, screenshots, clips)</span>
              <input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Links de evidencia separados por coma"
              />
            </label>
            <label className="ta-form-grid__full">
              <span>Descripcion detallada</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe lo ocurrido con el mayor detalle posible..."
                rows={4}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  borderRadius: 12,
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  padding: '12px 14px',
                  font: 'inherit',
                }}
              />
            </label>
          </div>

          <div className="ta-shortcuts">
            <button onClick={submitReport}>Enviar reporte</button>
          </div>
        </section>
      )}

      {/* Reports list */}
      <section className="ta-panel" style={{ marginTop: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">Historial</span>
            <h2>Reportes e incidencias</h2>
          </div>
        </div>

        {reportsLoading ? (
          <div className="ta-empty">Cargando reportes...</div>
        ) : filteredReports.length === 0 ? (
          <div className="ta-empty">No hay reportes registrados. El torneo esta limpio.</div>
        ) : (
          <div className="ta-reports-list">
            {filteredReports.map((report) => {
              const typeMeta = REPORT_TYPES.find((rt) => rt.value === report.type) || REPORT_TYPES[6];
              const sevMeta = SEVERITY_OPTIONS.find((s) => s.value === report.severity) || SEVERITY_OPTIONS[1];
              const isOpen = report.status === 'open' || report.status === 'investigating';
              const isSelected = selectedReport === report.reportId;

              return (
                <article key={report.reportId} className={`ta-report-card ${!isOpen ? 'is-resolved' : ''}`}>
                  <div className="ta-report-card__header">
                    <div className="ta-report-card__type">
                      <i className={`bx ${typeMeta.icon}`} />
                      <span>{typeMeta.label}</span>
                    </div>
                    <div className="ta-report-card__badges">
                      <span className="ta-pill" style={{ borderColor: sevMeta.color, color: sevMeta.color }}>
                        {sevMeta.label}
                      </span>
                      <span className={`ta-status ta-status--${isOpen ? 'ongoing' : 'finished'}`}>
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                      {report.sanction && (
                        <span className="ta-status ta-status--cancelled">
                          {SANCTION_OPTIONS.find((s) => s.value === report.sanction)?.label || report.sanction}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ta-report-card__body">
                    <div className="ta-report-card__meta">
                      {report.reportedTeam && <span><strong>Equipo:</strong> {report.reportedTeam}</span>}
                      {report.reportedPlayer && <span><strong>Jugador:</strong> {report.reportedPlayer}</span>}
                      {report.reportedStaff && <span><strong>Staff:</strong> {report.reportedStaff}</span>}
                      {report.matchId && <span><strong>Match:</strong> {report.matchId}</span>}
                    </div>
                    <p>{report.description}</p>
                    {report.evidence && (
                      <div className="ta-report-card__evidence">
                        <small>Evidencia:</small>
                        <span>{report.evidence}</span>
                      </div>
                    )}
                    {report.sanctionNote && (
                      <div className="ta-report-card__evidence">
                        <small>Nota de sancion:</small>
                        <span>{report.sanctionNote}</span>
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="ta-report-card__actions">
                      {!isSelected ? (
                        <>
                          {report.status === 'open' && (
                            <button
                              className="ta-btn-sm ta-btn-sm--secondary"
                              onClick={() => updateReportStatus(report.reportId, { status: 'investigating' })}
                            >
                              Investigar
                            </button>
                          )}
                          <button
                            className="ta-btn-sm"
                            onClick={() => setSelectedReport(report.reportId)}
                          >
                            Aplicar sancion
                          </button>
                          <button
                            className="ta-btn-sm ta-btn-sm--secondary"
                            onClick={() => updateReportStatus(report.reportId, { status: 'dismissed' })}
                          >
                            Desestimar
                          </button>
                        </>
                      ) : (
                        <div className="ta-sanction-panel">
                          <span className="ta-editor-label">Seleccionar sancion</span>
                          <div className="ta-sanction-options">
                            {SANCTION_OPTIONS
                              .filter(s => report.type === 'staff_misconduct' ? s.value === 'staff_removal' || s.value === 'warning' : s.value !== 'staff_removal')
                              .map((s) => (
                                <button
                                  key={s.value}
                                  className={`ta-btn-sm ${s.value === 'disqualification' || s.value === 'ban' || s.value === 'staff_removal' ? 'ta-btn-sm--danger' : 'ta-btn-sm--secondary'}`}
                                  onClick={() => updateReportStatus(report.reportId, {
                                    sanction: s.value,
                                    sanctionNote,
                                    status: 'resolved',
                                  })}
                                >
                                  <i className={`bx ${s.icon}`} /> {s.label}
                                </button>
                              ))}
                          </div>
                          <input
                            value={sanctionNote}
                            onChange={(e) => setSanctionNote(e.target.value)}
                            placeholder="Nota justificativa de la sancion (opcional)"
                            style={{
                              width: '100%',
                              marginTop: 8,
                              borderRadius: 10,
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-main)',
                              padding: '10px 14px',
                              font: 'inherit',
                              fontSize: '0.85rem',
                            }}
                          />
                          <button
                            className="ta-btn-sm ta-btn-sm--secondary"
                            onClick={() => { setSelectedReport(null); setSanctionNote(''); }}
                            style={{ marginTop: 6 }}
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ta-report-card__footer">
                    <small>{new Date(report.createdAt).toLocaleString('es-DO')}</small>
                    {report.resolvedAt && <small>Resuelto: {new Date(report.resolvedAt).toLocaleString('es-DO')}</small>}
                    {isOpen && (
                      <button
                        className="ta-btn-sm ta-btn-sm--danger"
                        style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '4px 10px' }}
                        onClick={() => removeReport(report.reportId)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </TournamentAdminShell>
  );
};

export default TournamentReportsPage;
