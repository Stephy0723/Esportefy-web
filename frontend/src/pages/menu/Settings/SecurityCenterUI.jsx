import React, { useMemo, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import { useNotification } from '../../../context/NotificationContext';
import {
  FaUserCircle,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaShieldAlt,
  FaDesktop,
  FaHeadset,
  FaExclamationTriangle,
  FaLock,
  FaUnlock,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaTrash,
  FaSignOutAlt,
  FaMobileAlt,
  FaCopy,
  FaDownload,
  FaClock,
  FaMapMarkerAlt,
} from 'react-icons/fa';

import './SecurityCenterUI.css';

const authHeaders = () => ({ headers: { Authorization: `Bearer ${getAuthToken()}` } });

const maskEmail = (email) => {
  const value = String(email || '').trim();
  if (!value.includes('@')) return 'us***@gmail.com';
  const [local, domain] = value.split('@');
  const safeLocal = local.length <= 2 ? `${local[0] || 'u'}***` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

const formatRelTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

const EVENT_LABELS = {
  login: 'Inicio de sesión',
  login_failed: 'Intento de login fallido',
  logout: 'Cierre de sesión',
  password_change: 'Contraseña actualizada',
  email_change: 'Email actualizado',
  '2fa_enabled': '2FA activado',
  '2fa_disabled': '2FA desactivado',
  backup_code_used: 'Código de respaldo usado',
  session_revoked: 'Sesión cerrada remotamente',
  sessions_revoked_all: 'Todas las sesiones cerradas',
  account_deleted: 'Cuenta eliminada',
};

const SecurityCenterUI = ({ email = 'usuario@esportefy.com', isVerified = false }) => {
  const { addToast } = useNotification();
  const [showEmail, setShowEmail] = useState(false);
  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  // Password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [loadingPassword, setLoadingPassword] = useState(false);

  // 2FA
  const [twoFA, setTwoFA] = useState({ enabled: false, enabledAt: null, backupCodesRemaining: 0 });
  const [qrData, setQrData] = useState(null);
  const [totpCode, setTotpCode] = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Activity Log
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Delete
  const [showDeleteZone, setShowDeleteZone] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  // ── Fetch on mount ──
  useEffect(() => {
    const load = async () => {
      try {
        const [faRes, sessRes, actRes] = await Promise.all([
          axios.get(`${API_URL}/api/security/2fa/status`, authHeaders()),
          axios.get(`${API_URL}/api/security/sessions`, authHeaders()),
          axios.get(`${API_URL}/api/security/activity-log?limit=10`, authHeaders()),
        ]);
        setTwoFA(faRes.data);
        setSessions(sessRes.data.sessions || []);
        setActivityLog(actRes.data.logs || []);
      } catch (_) { /* silently fail on load */ }
    };
    load();
  }, []);

  // ── Change Password ──
  const handleChangePassword = useCallback(async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      return addToast('Completa todos los campos.', 'error');
    }
    if (passwordData.new !== passwordData.confirm) {
      return addToast('Las contraseñas no coinciden.', 'error');
    }
    if (passwordData.new.length < 8) {
      return addToast('La contraseña debe tener al menos 8 caracteres.', 'error');
    }
    setLoadingPassword(true);
    try {
      await axios.post(`${API_URL}/api/security/change-password`, {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      }, authHeaders());
      addToast('Contraseña actualizada correctamente.', 'success');
      setShowPasswordForm(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cambiar contraseña.', 'error');
    } finally {
      setLoadingPassword(false);
    }
  }, [addToast, passwordData]);

  // ── 2FA: Generate ──
  const handleGenerate2FA = useCallback(async () => {
    setLoading2FA(true);
    try {
      const res = await axios.post(`${API_URL}/api/security/2fa/generate`, {}, authHeaders());
      setQrData(res.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al generar 2FA.', 'error');
    } finally {
      setLoading2FA(false);
    }
  }, [addToast]);

  // ── 2FA: Verify Setup ──
  const handleVerify2FA = useCallback(async () => {
    if (!totpCode || totpCode.length !== 6) {
      return addToast('Introduce un código de 6 dígitos.', 'error');
    }
    setLoading2FA(true);
    try {
      const res = await axios.post(`${API_URL}/api/security/2fa/verify-setup`, { token: totpCode }, authHeaders());
      setTwoFA({ enabled: true, enabledAt: new Date().toISOString(), backupCodesRemaining: res.data.backupCodes?.length || 10 });
      setBackupCodes(res.data.backupCodes);
      setQrData(null);
      setTotpCode('');
      addToast('2FA activado correctamente.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Código incorrecto.', 'error');
    } finally {
      setLoading2FA(false);
    }
  }, [addToast, totpCode]);

  // ── 2FA: Disable ──
  const handleDisable2FA = useCallback(async () => {
    if (!disablePassword) {
      return addToast('Introduce tu contraseña.', 'error');
    }
    setLoading2FA(true);
    try {
      await axios.post(`${API_URL}/api/security/2fa/disable`, { password: disablePassword }, authHeaders());
      setTwoFA({ enabled: false, enabledAt: null, backupCodesRemaining: 0 });
      setShowDisable2FA(false);
      setDisablePassword('');
      setBackupCodes(null);
      addToast('2FA desactivado correctamente.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al desactivar 2FA.', 'error');
    } finally {
      setLoading2FA(false);
    }
  }, [addToast, disablePassword]);

  // ── Cancel Disable 2FA ──
  const handleCancelDisable = useCallback(() => {
    setShowDisable2FA(false);
    setDisablePassword('');
  }, []);

  // ── Sessions ──
  const handleRevokeSession = useCallback(async (sessionId) => {
    try {
      await axios.delete(`${API_URL}/api/security/sessions/${sessionId}`, authHeaders());
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      addToast('Sesión cerrada.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cerrar sesión.', 'error');
    }
  }, [addToast]);

  const handleRevokeAllOther = useCallback(async () => {
    setLoadingSessions(true);
    try {
      await axios.delete(`${API_URL}/api/security/sessions`, authHeaders());
      setSessions(prev => prev.filter(s => s.isCurrent));
      addToast('Todas las demás sesiones cerradas.', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al cerrar sesiones.', 'error');
    } finally {
      setLoadingSessions(false);
    }
  }, [addToast]);

  // ── Delete Account ──
  const handleDeleteAccount = useCallback(async () => {
    if (!deletePassword) {
      return addToast('Introduce tu contraseña.', 'error');
    }
    setLoadingDelete(true);
    try {
      await axios.delete(`${API_URL}/api/security/account`, { ...authHeaders(), data: { password: deletePassword } });
      addToast('Cuenta eliminada.', 'success');
      window.location.href = '/login';
    } catch (err) {
      addToast(err.response?.data?.message || 'Error al eliminar cuenta.', 'error');
    } finally {
      setLoadingDelete(false);
    }
  }, [addToast, deletePassword]);

  return (
    <section className="sc">
      {/* Header */}
      <header className="sc-header">
        <div className="sc-header__icon"><FaShieldAlt /></div>
        <div className="sc-header__content">
          <span className="sc-eyebrow">Configuración de Cuenta</span>
          <h2>Centro de Seguridad</h2>
          <p>Gestiona identidad, credenciales, sesiones activas y protecciones avanzadas.</p>
        </div>
      </header>

      {/* ═══ Account & Password ═══ */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaUserCircle className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Cuenta y Contraseña</h3>
            <p className="sc-card__desc">Gestiona tu correo electrónico y contraseña</p>
          </div>
        </div>
        <div className="sc-grid sc-grid--2">
          {/* Email */}
          <div className="sc-item">
            <div className="sc-item__header">
              <FaEnvelope className="sc-item__icon" />
              <span className="sc-item__label">Email</span>
              <button className="sc-item__toggle" onClick={() => setShowEmail(p => !p)}
                aria-label={showEmail ? 'Ocultar email' : 'Mostrar email'}>
                {showEmail ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="sc-item__value">
              <strong>{showEmail ? email : maskedEmail}</strong>
              <span className={`sc-badge ${isVerified ? 'sc-badge--success' : 'sc-badge--danger'}`}>
                {isVerified ? <><FaCheckCircle /> Verificado</> : <><FaTimesCircle /> Sin verificar</>}
              </span>
            </div>
          </div>

          {/* Password */}
          <div className="sc-item">
            <div className="sc-item__header">
              <FaKey className="sc-item__icon" />
              <span className="sc-item__label">Contraseña</span>
            </div>
            {showPasswordForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <input type="password" placeholder="Contraseña actual" value={passwordData.current}
                  onChange={e => setPasswordData(p => ({ ...p, current: e.target.value }))}
                  className="sc-input" />
                <input type="password" placeholder="Nueva contraseña" value={passwordData.new}
                  onChange={e => setPasswordData(p => ({ ...p, new: e.target.value }))}
                  className="sc-input" />
                <input type="password" placeholder="Confirmar nueva contraseña" value={passwordData.confirm}
                  onChange={e => setPasswordData(p => ({ ...p, confirm: e.target.value }))}
                  className="sc-input" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="sc-btn sc-btn--primary sc-btn--sm" onClick={handleChangePassword} disabled={loadingPassword}>
                    {loadingPassword ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button className="sc-btn sc-btn--ghost sc-btn--sm"
                    onClick={() => { setShowPasswordForm(false); setPasswordData({ current: '', new: '', confirm: '' }); }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button className="sc-btn sc-btn--outline" onClick={() => setShowPasswordForm(true)}>
                Cambiar Contraseña
              </button>
            )}
          </div>
        </div>
      </article>

      {/* ═══ Two Factor Authentication ═══ */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaShieldAlt className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Autenticación de Dos Factores</h3>
            <p className="sc-card__desc">Añade una capa adicional de seguridad con tu app de autenticación</p>
          </div>
        </div>

        <div className="sc-2fa-notice">
          <FaExclamationTriangle className="sc-2fa-notice__icon" />
          <div>
            <strong>Importante antes de activar 2FA</strong>
            <p>
              Al activar la autenticación de dos factores, cada vez que inicies sesión necesitarás tu contraseña
              <strong> y </strong> un código temporal de 6 dígitos generado por tu app de autenticación
              (Google Authenticator, Authy, etc.). Si pierdes acceso a tu app, solo podrás entrar con los
              <strong> códigos de respaldo</strong> — guárdalos en un lugar seguro. Sin ellos, podrías perder
              acceso permanente a tu cuenta.
            </p>
          </div>
        </div>

        <div className="sc-grid sc-grid--3">
          <div className="sc-stat">
            <span className="sc-stat__label">Estado</span>
            <span className={`sc-badge sc-badge--lg ${twoFA.enabled ? 'sc-badge--success' : 'sc-badge--danger'}`}>
              {twoFA.enabled ? <><FaLock /> Activo</> : <><FaUnlock /> Inactivo</>}
            </span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat__label">Método</span>
            <span className="sc-stat__value"><FaMobileAlt /> Authenticator App</span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat__label">Códigos de Respaldo</span>
            <span className={`sc-badge sc-badge--lg ${twoFA.backupCodesRemaining > 0 ? 'sc-badge--success' : 'sc-badge--warning'}`}>
              {twoFA.backupCodesRemaining > 0 ? `${twoFA.backupCodesRemaining} restantes` : 'No generados'}
            </span>
          </div>
        </div>

        {/* QR Setup Flow */}
        {qrData && (
          <div style={{ margin: '16px 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              Escanea este QR con Google Authenticator, Authy u otra app compatible:
            </p>
            <img src={qrData.qrCodeDataUrl} alt="QR 2FA" style={{ maxWidth: 200, borderRadius: 8 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
              Clave manual: <code style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 4 }}>{qrData.manualEntryKey}</code>
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              <input type="text" placeholder="Código de 6 dígitos" value={totpCode} maxLength={6}
                inputMode="numeric" onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                style={{ ...inputStyle, width: 160, textAlign: 'center', fontSize: '1.1rem', letterSpacing: 4 }} />
              <button className="sc-btn sc-btn--primary sc-btn--sm" onClick={handleVerify2FA} disabled={loading2FA}>
                {loading2FA ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        )}

        {/* Backup Codes Display (one-time) */}
        {backupCodes && (
          <div style={{ margin: '16px 0', padding: 16, background: 'rgba(142,219,21,0.08)', borderRadius: 8, border: '1px solid rgba(142,219,21,0.2)' }}>
            <p style={{ color: 'var(--text-main)', fontWeight: 600, marginBottom: 8 }}>
              <FaDownload style={{ marginRight: 6 }} /> Guarda estos códigos de respaldo en un lugar seguro:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, fontFamily: 'monospace', fontSize: '0.9rem' }}>
              {backupCodes.map((code, i) => (
                <span key={i} style={{ color: 'var(--text-main)', padding: '4px 8px', background: 'var(--bg-card)', borderRadius: 4 }}>{code}</span>
              ))}
            </div>
            <button className="sc-btn sc-btn--ghost sc-btn--sm" style={{ marginTop: 12 }}
              onClick={() => { navigator.clipboard.writeText(backupCodes.join('\n')); addToast('Códigos copiados', 'success'); }}>
              <FaCopy /> Copiar todos
            </button>
          </div>
        )}

        {/* Disable 2FA */}
        {showDisable2FA && (
          <div style={{ margin: '16px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="password" placeholder="Tu contraseña" value={disablePassword}
              onChange={e => setDisablePassword(e.target.value)} style={inputStyle} />
            <button className="sc-btn sc-btn--danger sc-btn--sm" onClick={handleDisable2FA} disabled={loading2FA}>
              {loading2FA ? 'Procesando...' : 'Confirmar Desactivar'}
            </button>
            <button className="sc-btn sc-btn--ghost sc-btn--sm" onClick={handleCancelDisable}>Cancelar</button>
          </div>
        )}

        <div className="sc-actions">
          {!twoFA.enabled ? (
            <button className="sc-btn sc-btn--primary" onClick={handleGenerate2FA} disabled={loading2FA || !!qrData}>
              {loading2FA ? 'Generando...' : 'Activar 2FA'}
            </button>
          ) : (
            <>
              <button className="sc-btn sc-btn--danger" onClick={() => setShowDisable2FA(true)} disabled={showDisable2FA}>
                Desactivar 2FA
              </button>
            </>
          )}
        </div>
      </article>

      {/* ═══ Sessions & Devices ═══ */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaDesktop className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Sesiones Activas</h3>
            <p className="sc-card__desc">Controla dónde has iniciado sesión</p>
          </div>
        </div>
        <div className="sc-list">
          {sessions.length > 0 ? sessions.map(session => (
            <div key={session.id} className={`sc-list__item ${session.isCurrent ? 'sc-list__item--current' : ''}`}>
              <div className="sc-list__content">
                <strong>{session.deviceLabel} {session.isCurrent && <span className="sc-tag">Actual</span>}</strong>
                <span><FaMapMarkerAlt /> {session.ip || 'IP desconocida'}</span>
                <span><FaClock /> {formatRelTime(session.lastActiveAt)}</span>
              </div>
              {!session.isCurrent && (
                <button className="sc-btn sc-btn--ghost sc-btn--xs" onClick={() => handleRevokeSession(session.id)}>
                  Cerrar
                </button>
              )}
            </div>
          )) : (
            <p className="sc-empty">No hay sesiones activas registradas.</p>
          )}
        </div>
        {sessions.filter(s => !s.isCurrent).length > 0 && (
          <button className="sc-btn sc-btn--danger sc-btn--sm" onClick={handleRevokeAllOther}
            disabled={loadingSessions} style={{ marginTop: 12 }}>
            <FaSignOutAlt /> {loadingSessions ? 'Cerrando...' : 'Cerrar todas las demás sesiones'}
          </button>
        )}
      </article>

      {/* ═══ Activity Log ═══ */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaHistory className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Registro de Actividad</h3>
            <p className="sc-card__desc">Historial reciente de seguridad</p>
          </div>
        </div>
        <div className="sc-activity">
          {activityLog.length > 0 ? activityLog.map(item => (
            <div key={item._id} className="sc-activity__item sc-activity__item--info">
              <div className="sc-activity__dot" />
              <div className="sc-activity__content">
                <strong>{EVENT_LABELS[item.event] || item.event}</strong>
                <span>{item.ip ? `${item.ip}` : ''}</span>
              </div>
              <span className="sc-activity__time">{formatRelTime(item.createdAt)}</span>
            </div>
          )) : (
            <p className="sc-empty">No hay actividad reciente.</p>
          )}
        </div>
      </article>

      {/* ═══ Support ═══ */}
      <article className="sc-card sc-card--support">
        <div className="sc-card__header">
          <FaHeadset className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Soporte de Seguridad</h3>
            <p className="sc-card__desc">Si detectas actividad sospechosa, contacta soporte inmediatamente</p>
          </div>
        </div>
        <a href="/settings" className="sc-btn sc-btn--primary" style={{ textDecoration: 'none' }}>
          <FaHeadset /> Ir a Soporte
        </a>
      </article>

      {/* ═══ Danger Zone ═══ */}
      <article className="sc-card sc-card--danger">
        <div className="sc-card__header">
          <FaExclamationTriangle className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Zona de Peligro</h3>
            <p className="sc-card__desc">Esta acción es irreversible y eliminará tu cuenta permanentemente</p>
          </div>
        </div>
        {!showDeleteZone ? (
          <button className="sc-btn sc-btn--danger sc-btn--sm" onClick={() => setShowDeleteZone(true)}>
            <FaTrash /> Quiero eliminar mi cuenta
          </button>
        ) : (
          <div className="sc-danger">
            <p style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Ingresa tu contraseña para confirmar la eliminación permanente de tu cuenta.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="password" placeholder="Tu contraseña" value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button className="sc-btn sc-btn--danger" onClick={handleDeleteAccount} disabled={!deletePassword || loadingDelete}>
                <FaTrash /> {loadingDelete ? 'Eliminando...' : 'Eliminar Cuenta'}
              </button>
              <button className="sc-btn sc-btn--ghost sc-btn--sm"
                onClick={() => { setShowDeleteZone(false); setDeletePassword(''); }}>Cancelar</button>
            </div>
          </div>
        )}
      </article>
    </section>
  );
};

const inputStyle = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.9rem',
};

export default SecurityCenterUI;
