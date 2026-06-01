import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../../config/api';
import { useNotification } from '../../../../context/NotificationContext';
import { useLang } from '../../../../context/LanguageContext';
import {
  TournamentAdminShell,
  useTournamentAdminData,
} from './TournamentAdminShared';
import './TournamentAdmin.css';

const REPORT_TYPE_KEYS = [
  { value: 'cheating', labelKey: 'reportTypeCheating', icon: 'bx-shield-x' },
  { value: 'unsportsmanlike', labelKey: 'reportTypeUnsportsmanlike', icon: 'bx-angry' },
  { value: 'impersonation', labelKey: 'reportTypeImpersonation', icon: 'bx-user-x' },
  { value: 'match_fixing', labelKey: 'reportTypeMatchFixing', icon: 'bx-lock-alt' },
  { value: 'exploit', labelKey: 'reportTypeExploit', icon: 'bx-bug' },
  { value: 'staff_misconduct', labelKey: 'reportTypeStaffMisconduct', icon: 'bx-group' },
  { value: 'other', labelKey: 'reportTypeOther', icon: 'bx-dots-horizontal-rounded' },
];

const SEVERITY_OPTION_KEYS = [
  { value: 'low', labelKey: 'severityLow', color: '#22c55e' },
  { value: 'medium', labelKey: 'severityMedium', color: '#f59e0b' },
  { value: 'high', labelKey: 'severityHigh', color: '#ef4444' },
  { value: 'critical', labelKey: 'severityCritical', color: '#dc2626' },
];

const SANCTION_OPTION_KEYS = [
  { value: 'warning', labelKey: 'sanctionWarning', icon: 'bx-error' },
  { value: 'match_loss', labelKey: 'sanctionMatchLoss', icon: 'bx-x' },
  { value: 'disqualification', labelKey: 'sanctionDisqualification', icon: 'bx-block' },
  { value: 'ban', labelKey: 'sanctionBan', icon: 'bx-shield-x' },
  { value: 'staff_removal', labelKey: 'sanctionStaffRemoval', icon: 'bx-user-minus' },
];

const REPORT_STATUS_LABEL_KEYS = {
  open: 'reportStatusOpen',
  investigating: 'reportStatusInvestigating',
  resolved: 'reportStatusResolved',
  dismissed: 'reportStatusDismissed',
};

const TournamentReportsPage = () => {
  const { code } = useParams();
  const { addToast } = useNotification();
  const { t } = useLang();
  const { loading, tournament, registrations, bracket, setBracket } = useTournamentAdminData(code);

  const REPORT_TYPES = REPORT_TYPE_KEYS.map((rt) => ({ ...rt, label: t(rt.labelKey) }));
  const SEVERITY_OPTIONS = SEVERITY_OPTION_KEYS.map((s) => ({ ...s, label: t(s.labelKey) }));
  const SANCTION_OPTIONS = SANCTION_OPTION_KEYS.map((s) => ({ ...s, label: t(s.labelKey) }));
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
  const [confirmModal, setConfirmModal] = useState(null);

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
    (bracket?.rounds || []).forEach((round) => {
      (round.matches || []).forEach((match) => {
        const matchId = String(match?.matchId || '').trim();
        if (matchId) ids.push(matchId);
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
      addToast(t('toastReportsLoadError'), 'error');
    } finally {
      setReportsLoading(false);
    }
  }, [code, token, authConfig, t]);

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
      return addToast(t('toastReportNeedsTarget'), 'error');
    }
    if (!description.trim()) return addToast(t('toastReportNeedsDescription'), 'error');

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
      addToast(err.response?.data?.message || t('toastReportCreateError'), 'error');
    }
  };

  const updateReportStatus = async (reportId, updates) => {
    try {
      const res = await axios.patch(
        `${API_URL}/api/tournaments/${code}/reports/${reportId}`,
        updates,
        authConfig
      );
      const nextReport = res.data?.report || null;
      if (nextReport) {
        setReports((prev) => prev.map((r) => r.reportId === reportId ? { ...r, ...nextReport } : r));
      }
      if (res.data?.bracket) {
        setBracket(res.data.bracket);
      }
      setSelectedReport(null);
      setSanctionNote('');
      addToast(res.data?.message || t('toastReportUpdated'), 'success');
    } catch (err) {
      addToast(err.response?.data?.message || t('toastReportUpdateError'), 'error');
    }
  };

  const triggerRemoveReport = (reportId) => {
    setConfirmModal({
      message: t('confirmDeleteReport'),
      onConfirm: () => { setConfirmModal(null); executeRemoveReport(reportId); }
    });
  };

  const executeRemoveReport = async (reportId) => {
    try {
      await axios.delete(`${API_URL}/api/tournaments/${code}/reports/${reportId}`, authConfig);
      setReports((prev) => prev.filter((r) => r.reportId !== reportId));
    } catch (err) {
      addToast(err.response?.data?.message || t('toastReportDeleteError'), 'error');
    }
  };

  if (loading) return <div className="ta-page"><div className="ta-empty">{t('loading')}</div></div>;
  if (!tournament) return <div className="ta-page"><div className="ta-empty">{t('tournamentNotFound')}</div></div>;

  const isStaffReport = reportType === 'staff_misconduct';

  return (
    <TournamentAdminShell tournament={tournament} currentTab="reports">
      {/* Metrics */}
      <div className="ta-hero__metrics" style={{ marginBottom: 18 }}>
        {[
          { label: t('metricTotalReports'), value: stats.total },
          { label: t('metricOpenReports'), value: stats.open },
          { label: t('metricResolvedReports'), value: stats.resolved },
          { label: t('metricSanctionedReports'), value: stats.sanctioned },
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
            { key: 'all', label: t('filterAll') },
            { key: 'open', label: t('filterOpen') },
            { key: 'resolved', label: t('filterResolved') },
            { key: 'sanctioned', label: t('filterSanctioned') },
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
          {showForm ? t('cancel') : t('newReport')}
        </button>
      </div>

      {/* New report form */}
      {showForm && (
        <section className="ta-panel ta-report-form" style={{ marginTop: 16 }}>
          <div className="ta-panel__head">
            <div>
              <span className="ta-kicker">{t('newReport')}</span>
              <h2>{t('registerIncident')}</h2>
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
                <span>{t('reportedStaffMember')}</span>
                <select value={reportedStaff} onChange={(e) => setReportedStaff(e.target.value)}>
                  <option value="">{t('selectMember')}</option>
                  {staffNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            ) : (
              <>
                <label>
                  <span>{t('reportedTeam')}</span>
                  <select value={reportedTeam} onChange={(e) => setReportedTeam(e.target.value)}>
                    <option value="">{t('selectTeam')}</option>
                    {approvedTeams.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>{t('reportedPlayerOptional')}</span>
                  <input
                    value={reportedPlayer}
                    onChange={(e) => setReportedPlayer(e.target.value)}
                    placeholder={t('playerNicknamePlaceholder')}
                  />
                </label>
              </>
            )}
            <label>
              <span>{t('relatedMatch')}</span>
              <select value={matchId} onChange={(e) => setMatchId(e.target.value)}>
                <option value="">{t('none')}</option>
                {allMatchIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('severity')}</span>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
            <label className="ta-form-grid__full">
              <span>{t('evidenceLabel')}</span>
              <input
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder={t('evidencePlaceholder')}
              />
            </label>
            <label className="ta-form-grid__full">
              <span>{t('detailedDescription')}</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('descriptionPlaceholder')}
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
            <button onClick={submitReport}>{t('submitReport')}</button>
          </div>
        </section>
      )}

      {/* Reports list */}
      <section className="ta-panel" style={{ marginTop: 16 }}>
        <div className="ta-panel__head">
          <div>
            <span className="ta-kicker">{t('reportsHistoryKicker')}</span>
            <h2>{t('reportsHistoryTitle')}</h2>
          </div>
        </div>

        {reportsLoading ? (
          <div className="ta-empty">{t('loadingReports')}</div>
        ) : filteredReports.length === 0 ? (
          <div className="ta-empty">{t('noReportsFound')}</div>
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
                        {t(REPORT_STATUS_LABEL_KEYS[report.status]) || report.status}
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
                      {report.reportedTeam && <span><strong>{t('labelTeam')}:</strong> {report.reportedTeam}</span>}
                      {report.reportedPlayer && <span><strong>{t('labelPlayer')}:</strong> {report.reportedPlayer}</span>}
                      {report.reportedStaff && <span><strong>{t('labelStaff')}:</strong> {report.reportedStaff}</span>}
                      {report.matchId && <span><strong>{t('labelMatch')}:</strong> {report.matchId}</span>}
                    </div>
                    <p>{report.description}</p>
                    {report.evidence && (
                      <div className="ta-report-card__evidence">
                        <small>{t('evidenceLabel')}:</small>
                        <span>{report.evidence}</span>
                      </div>
                    )}
                    {report.sanctionNote && (
                      <div className="ta-report-card__evidence">
                        <small>{t('sanctionNoteLabel')}:</small>
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
                              {t('investigate')}
                            </button>
                          )}
                          <button
                            className="ta-btn-sm"
                            onClick={() => setSelectedReport(report.reportId)}
                          >
                            {t('applySanction')}
                          </button>
                          <button
                            className="ta-btn-sm ta-btn-sm--secondary"
                            onClick={() => updateReportStatus(report.reportId, { status: 'dismissed' })}
                          >
                            {t('dismiss')}
                          </button>
                        </>
                      ) : (
                        <div className="ta-sanction-panel">
                          <span className="ta-editor-label">{t('selectSanction')}</span>
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
                            placeholder={t('sanctionNotePlaceholder')}
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
                            {t('cancel')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="ta-report-card__footer">
                    <small>{new Date(report.createdAt).toLocaleString('es-DO')}</small>
                    {report.resolvedAt && <small>{t('resolvedAt')}: {new Date(report.resolvedAt).toLocaleString('es-DO')}</small>}
                    {isOpen && (
                      <button
                        className="ta-btn-sm ta-btn-sm--danger"
                        style={{ marginLeft: 'auto', fontSize: '0.72rem', padding: '4px 10px' }}
                        onClick={() => triggerRemoveReport(report.reportId)}
                      >
                        {t('delete')}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      {confirmModal && (
        <div className="ta-confirm-overlay" onClick={() => setConfirmModal(null)}>
          <div className="ta-confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="ta-confirm-icon"><i className='bx bx-error-circle'></i></div>
            <p className="ta-confirm-msg">{confirmModal.message}</p>
            <div className="ta-confirm-actions">
              <button className="ta-confirm-btn ta-confirm-btn--cancel" onClick={() => setConfirmModal(null)}>{t('cancel')}</button>
              <button className="ta-confirm-btn ta-confirm-btn--confirm" onClick={confirmModal.onConfirm}>{t('confirm')}</button>
            </div>
          </div>
        </div>
      )}
    </TournamentAdminShell>
  );
};

export default TournamentReportsPage;
