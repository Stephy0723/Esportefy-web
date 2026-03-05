import React, { useMemo, useState, useCallback } from 'react';
import {
  FaUserCircle,
  FaEnvelope,
  FaCheckCircle,
  FaTimesCircle,
  FaKey,
  FaShieldAlt,
  FaMobileAlt,
  FaDownload,
  FaCopy,
  FaDesktop,
  FaMapMarkerAlt,
  FaClock,
  FaSignOutAlt,
  FaApple,
  FaWindows,
  FaHeadset,
  FaExclamationTriangle,
  FaTrash,
  FaLock,
  FaUnlock,
  FaHistory,
  FaPlus,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

import './SecurityCenterUI.css';

const maskEmail = (email) => {
  const value = String(email || '').trim();
  if (!value.includes('@')) return 'us***@gmail.com';
  const [local, domain] = value.split('@');
  const safeLocal = local.length <= 2 ? `${local[0] || 'u'}***` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

const SecurityCenterUI = ({ email = 'usuario@esportefy.com' }) => {
  // Core States
  const [isVerified] = useState(true);
  const [twoFactorActive, setTwoFactorActive] = useState(true);
  const [backupCodesReady, setBackupCodesReady] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [passwordConfirmed, setPasswordConfirmed] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  
  // Sessions & Devices
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'Windows Desktop', browser: 'Chrome', location: 'Santo Domingo, DO', activity: 'Hace 2 min', current: true },
    { id: 's2', device: 'iPhone 15', browser: 'Safari', location: 'Santiago, DO', activity: 'Hace 1 hora', current: false },
    { id: 's3', device: 'MacBook Pro', browser: 'Firefox', location: 'Bogotá, CO', activity: 'Ayer', current: false },
  ]);
  
  const [trustedDevices, setTrustedDevices] = useState([
    { id: 'd1', name: 'Gaming PC', lastUsed: 'Hoy' },
    { id: 'd2', name: 'iPad Pro', lastUsed: 'Hace 3 días' },
  ]);
  
  const [passkeys, setPasskeys] = useState([
    { id: 'p1', name: 'FaceID', icon: FaApple, status: 'Activo' },
    { id: 'p2', name: 'Windows Hello', icon: FaWindows, status: 'Activo' },
  ]);
  
  // Activity Log
  const [activityLog] = useState([
    { id: 'a1', title: 'Inicio de sesión exitoso', meta: 'Chrome · Santo Domingo', when: 'Hace 2 min', type: 'success' },
    { id: 'a2', title: 'Cambio de correo solicitado', meta: 'Validación pendiente', when: 'Ayer', type: 'warning' },
    { id: 'a3', title: 'Dispositivo agregado', meta: 'Gaming PC', when: 'Hace 3 días', type: 'info' },
  ]);
  
  // Loading states
  const [loading, setLoading] = useState({
    email: false,
    password: false,
    twoFactor: false,
    backupCodes: false,
    sessions: false,
    deleteAccount: false,
  });

  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  // Handlers
  const handleChangeEmail = useCallback(async () => {
    setLoading(prev => ({ ...prev, email: true }));
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(prev => ({ ...prev, email: false }));
    alert('Se ha enviado un correo de verificación');
  }, []);

  const handleChangePassword = useCallback(async () => {
    setLoading(prev => ({ ...prev, password: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLoading(prev => ({ ...prev, password: false }));
    alert('Enlace de cambio de contraseña enviado');
  }, []);

  const handleToggle2FA = useCallback(async () => {
    setLoading(prev => ({ ...prev, twoFactor: true }));
    await new Promise(resolve => setTimeout(resolve, 800));
    setTwoFactorActive(prev => !prev);
    setLoading(prev => ({ ...prev, twoFactor: false }));
  }, []);

  const handleGenerateBackupCodes = useCallback(async () => {
    setLoading(prev => ({ ...prev, backupCodes: true }));
    await new Promise(resolve => setTimeout(resolve, 1200));
    setBackupCodesReady(true);
    setLoading(prev => ({ ...prev, backupCodes: false }));
    alert('Códigos de respaldo generados. Guárdalos en un lugar seguro.');
  }, []);

  const handleSignOutOtherDevices = useCallback(async () => {
    setLoading(prev => ({ ...prev, sessions: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSessions(prev => prev.filter(s => s.current));
    setLoading(prev => ({ ...prev, sessions: false }));
  }, []);

  const handleRemoveDevice = useCallback((deviceId) => {
    setTrustedDevices(prev => prev.filter(d => d.id !== deviceId));
  }, []);

  const handleRemovePasskey = useCallback((passkeyId) => {
    setPasskeys(prev => prev.filter(p => p.id !== passkeyId));
  }, []);

  const handleConfirmPassword = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setPasswordConfirmed(true);
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (confirmText !== 'DELETE' || !passwordConfirmed) return;
    setLoading(prev => ({ ...prev, deleteAccount: true }));
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(prev => ({ ...prev, deleteAccount: false }));
    alert('Cuenta programada para eliminación. Período de gracia: 14 días.');
  }, [confirmText, passwordConfirmed]);

  const canDelete = confirmText === 'DELETE' && passwordConfirmed;

  return (
    <section className="sc">
      {/* Header */}
      <header className="sc-header">
        <div className="sc-header__icon">
          <FaShieldAlt />
        </div>
        <div className="sc-header__content">
          <span className="sc-eyebrow">Account Settings</span>
          <h2>Security Center</h2>
          <p>Gestiona identidad, credenciales, sesiones activas y protecciones avanzadas.</p>
        </div>
      </header>

      {/* Account & Password Section */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaUserCircle className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Account & Password</h3>
            <p className="sc-card__desc">Gestiona tu correo electrónico y contraseña</p>
          </div>
        </div>
        
        <div className="sc-grid sc-grid--2">
          <div className="sc-item">
            <div className="sc-item__header">
              <FaEnvelope className="sc-item__icon" />
              <span className="sc-item__label">Email</span>
              <button 
                className="sc-item__toggle" 
                onClick={() => setShowEmail(prev => !prev)}
                title={showEmail ? 'Ocultar' : 'Mostrar'}
              >
                {showEmail ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            <div className="sc-item__value">
              <strong>{showEmail ? email : maskedEmail}</strong>
              <span className={`sc-badge ${isVerified ? 'sc-badge--success' : 'sc-badge--danger'}`}>
                {isVerified ? <><FaCheckCircle /> Verificado</> : <><FaTimesCircle /> Sin verificar</>}
              </span>
            </div>
            <button 
              className="sc-btn sc-btn--outline" 
              onClick={handleChangeEmail}
              disabled={loading.email}
            >
              {loading.email ? 'Enviando...' : 'Cambiar Email'}
            </button>
          </div>

          <div className="sc-item">
            <div className="sc-item__header">
              <FaKey className="sc-item__icon" />
              <span className="sc-item__label">Contraseña</span>
            </div>
            <div className="sc-item__value">
              <strong>Última actualización: hace 41 días</strong>
              <span className="sc-hint">Usa al menos 12 caracteres</span>
            </div>
            <button 
              className="sc-btn sc-btn--outline" 
              onClick={handleChangePassword}
              disabled={loading.password}
            >
              {loading.password ? 'Enviando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </div>
      </article>

      {/* Two Factor Authentication */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaShieldAlt className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Autenticación de Dos Factores</h3>
            <p className="sc-card__desc">Añade una capa adicional de seguridad</p>
          </div>
        </div>
        
        <div className="sc-grid sc-grid--3">
          <div className="sc-stat">
            <span className="sc-stat__label">Estado</span>
            <span className={`sc-badge sc-badge--lg ${twoFactorActive ? 'sc-badge--success' : 'sc-badge--danger'}`}>
              {twoFactorActive ? <><FaLock /> Activo</> : <><FaUnlock /> Inactivo</>}
            </span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat__label">Método</span>
            <span className="sc-stat__value"><FaMobileAlt /> Authenticator App</span>
          </div>
          <div className="sc-stat">
            <span className="sc-stat__label">Códigos de Respaldo</span>
            <span className={`sc-badge sc-badge--lg ${backupCodesReady ? 'sc-badge--success' : 'sc-badge--warning'}`}>
              {backupCodesReady ? 'Listos' : 'No generados'}
            </span>
          </div>
        </div>
        
        <div className="sc-actions">
          <button 
            className={`sc-btn ${twoFactorActive ? 'sc-btn--danger' : 'sc-btn--primary'}`}
            onClick={handleToggle2FA}
            disabled={loading.twoFactor}
          >
            {loading.twoFactor ? 'Procesando...' : (twoFactorActive ? 'Desactivar 2FA' : 'Activar 2FA')}
          </button>
          <button 
            className="sc-btn sc-btn--outline"
            onClick={handleGenerateBackupCodes}
            disabled={loading.backupCodes || !twoFactorActive}
          >
            <FaCopy /> {loading.backupCodes ? 'Generando...' : 'Generar Códigos'}
          </button>
          <button className="sc-btn sc-btn--ghost" disabled={!backupCodesReady}>
            <FaDownload /> Descargar
          </button>
        </div>
      </article>

      {/* Sessions & Devices */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaDesktop className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Sesiones y Dispositivos</h3>
            <p className="sc-card__desc">Controla dónde has iniciado sesión</p>
          </div>
        </div>
        
        <div className="sc-grid sc-grid--2">
          {/* Active Sessions */}
          <div className="sc-block">
            <h4 className="sc-block__title">Sesiones Activas</h4>
            <div className="sc-list">
              {sessions.map((session) => (
                <div key={session.id} className={`sc-list__item ${session.current ? 'sc-list__item--current' : ''}`}>
                  <div className="sc-list__content">
                    <strong>{session.device} {session.current && <span className="sc-tag">Actual</span>}</strong>
                    <span>{session.browser}</span>
                    <span><FaMapMarkerAlt /> {session.location}</span>
                    <span><FaClock /> {session.activity}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              className="sc-btn sc-btn--danger sc-btn--sm"
              onClick={handleSignOutOtherDevices}
              disabled={loading.sessions || sessions.length <= 1}
            >
              <FaSignOutAlt /> {loading.sessions ? 'Cerrando...' : 'Cerrar otras sesiones'}
            </button>
          </div>

          {/* Trusted Devices */}
          <div className="sc-block">
            <h4 className="sc-block__title">Dispositivos de Confianza</h4>
            <div className="sc-list">
              {trustedDevices.length > 0 ? trustedDevices.map((device) => (
                <div key={device.id} className="sc-list__item sc-list__item--row">
                  <div className="sc-list__content">
                    <strong>{device.name}</strong>
                    <span>Último uso: {device.lastUsed}</span>
                  </div>
                  <button 
                    className="sc-btn sc-btn--ghost sc-btn--xs"
                    onClick={() => handleRemoveDevice(device.id)}
                  >
                    Eliminar
                  </button>
                </div>
              )) : (
                <p className="sc-empty">No hay dispositivos de confianza</p>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Passkeys */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaKey className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Passkeys</h3>
            <p className="sc-card__desc">Métodos de autenticación sin contraseña</p>
          </div>
        </div>
        
        <div className="sc-list">
          {passkeys.length > 0 ? passkeys.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="sc-list__item sc-list__item--row">
                <div className="sc-list__content">
                  <strong><Icon /> {item.name}</strong>
                  <span className="sc-badge sc-badge--success sc-badge--sm">{item.status}</span>
                </div>
                <button 
                  className="sc-btn sc-btn--ghost sc-btn--xs"
                  onClick={() => handleRemovePasskey(item.id)}
                >
                  Eliminar
                </button>
              </div>
            );
          }) : (
            <p className="sc-empty">No hay passkeys configurados</p>
          )}
        </div>
        <div className="sc-actions">
          <button className="sc-btn sc-btn--outline sc-btn--sm">
            <FaPlus /> Añadir Passkey
          </button>
        </div>
      </article>

      {/* Activity Log */}
      <article className="sc-card">
        <div className="sc-card__header">
          <FaHistory className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Registro de Actividad</h3>
            <p className="sc-card__desc">Historial reciente de seguridad</p>
          </div>
        </div>
        
        <div className="sc-activity">
          {activityLog.map((item) => (
            <div key={item.id} className={`sc-activity__item sc-activity__item--${item.type}`}>
              <div className="sc-activity__dot" />
              <div className="sc-activity__content">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
              <span className="sc-activity__time">{item.when}</span>
            </div>
          ))}
        </div>
      </article>

      {/* Support */}
      <article className="sc-card sc-card--support">
        <div className="sc-card__header">
          <FaHeadset className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Soporte de Seguridad</h3>
            <p className="sc-card__desc">Si detectas actividad sospechosa, contacta soporte inmediatamente</p>
          </div>
        </div>
        <button className="sc-btn sc-btn--primary">
          <FaHeadset /> Contactar Soporte
        </button>
      </article>

      {/* Danger Zone */}
      <article className="sc-card sc-card--danger">
        <div className="sc-card__header">
          <FaExclamationTriangle className="sc-card__icon" />
          <div>
            <h3 className="sc-card__title">Zona de Peligro</h3>
            <p className="sc-card__desc">Esta acción es irreversible y eliminará tu cuenta permanentemente</p>
          </div>
        </div>
        
        <div className="sc-danger">
          <div className="sc-danger__steps">
            <div className={`sc-danger__step ${passwordConfirmed ? 'sc-danger__step--done' : ''}`}>
              <span className="sc-danger__num">1</span>
              <span>Confirmar contraseña</span>
            </div>
            <div className={`sc-danger__step ${confirmText === 'DELETE' ? 'sc-danger__step--done' : ''}`}>
              <span className="sc-danger__num">2</span>
              <span>Escribir DELETE</span>
            </div>
            <div className="sc-danger__step">
              <span className="sc-danger__num">3</span>
              <span>Gracia: 14 días</span>
            </div>
          </div>
          
          <div className="sc-danger__form">
            <div className="sc-danger__row">
              <label>Confirmación de contraseña</label>
              <div className="sc-danger__input-group">
                <input 
                  type="password" 
                  placeholder="Tu contraseña actual"
                  disabled={passwordConfirmed}
                />
                <button 
                  className="sc-btn sc-btn--ghost sc-btn--sm"
                  onClick={handleConfirmPassword}
                  disabled={passwordConfirmed}
                >
                  {passwordConfirmed ? <FaCheckCircle /> : 'Confirmar'}
                </button>
              </div>
            </div>
            
            <div className="sc-danger__row">
              <label>Escribe DELETE para confirmar</label>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                disabled={!passwordConfirmed}
              />
            </div>
          </div>
          
          <button 
            className="sc-btn sc-btn--danger"
            onClick={handleDeleteAccount}
            disabled={!canDelete || loading.deleteAccount}
          >
            <FaTrash /> {loading.deleteAccount ? 'Eliminando...' : 'Eliminar Cuenta'}
          </button>
        </div>
      </article>
    </section>
  );
};

export default SecurityCenterUI;
