import React, { useMemo, useState } from 'react';
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
  FaFingerprint,
  FaApple,
  FaWindows,
  FaDiscord,
  FaSteam,
  FaGoogle,
  FaHeadset,
  FaExclamationTriangle,
  FaTrash,
} from 'react-icons/fa';

import './SecurityCenterUI.css';

const maskEmail = (email) => {
  const value = String(email || '').trim();
  if (!value.includes('@')) return 'us***@gmail.com';
  const [local, domain] = value.split('@');
  const safeLocal = local.length <= 2 ? `${local[0] || 'u'}***` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

const initialConnections = [
  { id: 'discord', name: 'Discord', icon: FaDiscord, state: 'linked' },
  { id: 'google', name: 'Google', icon: FaGoogle, state: 'link' },
  { id: 'steam', name: 'Steam', icon: FaSteam, state: 'relink' },
];

const sessions = [
  { id: 's1', device: 'Windows Desktop', browser: 'Chrome', location: 'Santo Domingo, DO', activity: 'Hace 2 min' },
  { id: 's2', device: 'iPhone 15', browser: 'Safari', location: 'Santiago, DO', activity: 'Hace 1 hora' },
  { id: 's3', device: 'MacBook Pro', browser: 'Firefox', location: 'Bogota, CO', activity: 'Ayer' },
];

const trustedDevices = [
  { id: 'd1', name: 'Gaming PC', lastUsed: 'Hoy' },
  { id: 'd2', name: 'iPad Pro', lastUsed: 'Hace 3 dias' },
];

const passkeys = [
  { id: 'p1', name: 'FaceID', icon: FaApple, status: 'Disponible' },
  { id: 'p2', name: 'Windows Hello', icon: FaWindows, status: 'Disponible' },
];

const activityLog = [
  { id: 'a1', title: 'Inicio de sesion exitoso', meta: 'Chrome · Santo Domingo', when: 'Hace 2 min' },
  { id: 'a2', title: 'Cambio de correo solicitado', meta: 'Validacion pendiente', when: 'Ayer' },
  { id: 'a3', title: 'Dispositivo agregado', meta: 'Gaming PC', when: 'Hace 3 dias' },
];

const SecurityCenterUI = ({ email = 'usuario@esportefy.com' }) => {
  const [isVerified] = useState(true);
  const [twoFactorActive] = useState(true);
  const [backupCodesReady] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [connectionState, setConnectionState] = useState(initialConnections);

  const maskedEmail = useMemo(() => maskEmail(email), [email]);

  const connectionLabel = (state) => {
    if (state === 'linked') return 'Linked';
    if (state === 'relink') return 'Relink';
    return 'Link';
  };

  const cycleState = (id) => {
    setConnectionState((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (item.state === 'link') return { ...item, state: 'linked' };
        if (item.state === 'linked') return { ...item, state: 'relink' };
        return { ...item, state: 'link' };
      })
    );
  };

  return (
    <section className="sc">
      <header className="sc-header">
        <div className="sc-header__icon">
          <FaUserCircle />
        </div>
        <div className="sc-header__content">
          <p className="sc-eyebrow">Account Settings</p>
          <h2>Security Center</h2>
          <p>Gestiona identidad, credenciales, sesiones activas y protecciones avanzadas.</p>
        </div>
      </header>

      <article className="sc-surface">
        <div className="sc-surface__title"><FaUserCircle /> Profile, Account & Password</div>
        <div className="sc-unified">
          <p className="sc-muted">Centro principal de seguridad de tu cuenta profesional.</p>
          <div className="sc-unified__grid">
            <div className="sc-field">
              <p className="sc-label"><FaEnvelope /> Email</p>
              <div className="sc-row">
                <strong>{maskedEmail}</strong>
                <span className={`sc-badge ${isVerified ? 'is-ok' : 'is-off'}`}>
                  {isVerified ? <FaCheckCircle /> : <FaTimesCircle />}
                  {isVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="sc-actions">
                <button className="sc-btn">Change Email</button>
              </div>
            </div>

            <div className="sc-field">
              <p className="sc-label"><FaKey /> Password</p>
              <strong>Hace 41 dias</strong>
              <p className="sc-muted">Usa una contraseña unica con al menos 12 caracteres.</p>
              <div className="sc-actions">
                <button className="sc-btn sc-btn--ghost">Change Password</button>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className="sc-surface">
        <div className="sc-surface__title"><FaShieldAlt /> Two Factor Authentication</div>
        <div className="sc-split">
          <div className="sc-field">
            <p className="sc-label">Status</p>
            <span className={`sc-badge ${twoFactorActive ? 'is-ok' : 'is-off'}`}>
              {twoFactorActive ? <FaCheckCircle /> : <FaTimesCircle />}
              {twoFactorActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="sc-field">
            <p className="sc-label">Method</p>
            <strong><FaMobileAlt /> Authenticator App</strong>
          </div>
          <div className="sc-field">
            <p className="sc-label">Backup Codes</p>
            <span className={`sc-badge ${backupCodesReady ? 'is-ok' : 'is-off'}`}>
              {backupCodesReady ? 'Ready' : 'Not generated'}
            </span>
          </div>
        </div>
        <div className="sc-actions">
          <button className="sc-btn"><FaCopy /> Generate codes</button>
          <button className="sc-btn sc-btn--ghost"><FaDownload /> Download codes</button>
        </div>
      </article>

      <article className="sc-surface">
        <div className="sc-surface__title"><FaDesktop /> Devices, Activity & Connections</div>
        <div className="sc-matrix">
          <section className="sc-block">
            <h3 className="sc-subtitle">Active Sessions</h3>
            <div className="sc-stack">
              {sessions.map((session) => (
                <div className="sc-list-item" key={session.id}>
                  <strong>{session.device}</strong>
                  <span>{session.browser}</span>
                  <span><FaMapMarkerAlt /> {session.location}</span>
                  <span><FaClock /> {session.activity}</span>
                </div>
              ))}
            </div>
            <div className="sc-actions">
              <button className="sc-btn sc-btn--danger"><FaSignOutAlt /> Sign out other devices</button>
            </div>
          </section>

          <section className="sc-block">
            <h3 className="sc-subtitle">Trusted Devices</h3>
            <div className="sc-stack">
              {trustedDevices.map((device) => (
                <div className="sc-list-item sc-list-item--inline" key={device.id}>
                  <div>
                    <strong>{device.name}</strong>
                    <span>Ultimo uso: {device.lastUsed}</span>
                  </div>
                  <button className="sc-mini-btn">Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className="sc-block">
            <h3 className="sc-subtitle">Passkeys</h3>
            <div className="sc-stack">
              {passkeys.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="sc-list-item sc-list-item--inline">
                    <div>
                      <strong><Icon /> {item.name}</strong>
                      <span>{item.status}</span>
                    </div>
                    <button className="sc-mini-btn">Manage</button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="sc-block">
            <h3 className="sc-subtitle">Activity Log</h3>
            <div className="sc-stack">
              {activityLog.map((item) => (
                <div className="sc-list-item" key={item.id}>
                  <strong>{item.title}</strong>
                  <span>{item.meta}</span>
                  <span>{item.when}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="sc-block">
            <h3 className="sc-subtitle">Connections</h3>
            <div className="sc-stack">
              {connectionState.map((connection) => {
                const Icon = connection.icon;
                return (
                  <div key={connection.id} className="sc-list-item sc-list-item--inline">
                    <div>
                      <strong><Icon /> {connection.name}</strong>
                      <span>{connectionLabel(connection.state)}</span>
                    </div>
                    <button
                      className={`sc-mini-btn sc-mini-btn--${connection.state}`}
                      onClick={() => cycleState(connection.id)}
                    >
                      {connectionLabel(connection.state)}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="sc-block">
            <h3 className="sc-subtitle"><FaHeadset /> Support</h3>
            <p className="sc-muted">Si detectas actividad sospechosa, contacta soporte inmediatamente.</p>
            <div className="sc-actions">
              <button className="sc-btn">Contact Security Support</button>
            </div>
          </section>
        </div>
      </article>

      <article className="sc-surface sc-surface--danger">
        <div className="sc-surface__title"><FaExclamationTriangle /> Danger Zone</div>
        <p className="sc-muted">Esta acción es irreversible y eliminará tu cuenta, historial y estadísticas.</p>
        <div className="sc-danger-steps">
          <span>1. Confirmación de contraseña</span>
          <span>2. Escribe DELETE para confirmar</span>
          <span>3. Periodo de gracia: 14 dias</span>
        </div>
        <div className="sc-confirm">
          <div className="sc-confirm__status">
            <span>Password confirmation</span>
            <b>Pending</b>
          </div>
          <input
            type="text"
            placeholder="Type DELETE to confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
        <button className="sc-btn sc-btn--danger"><FaTrash /> Delete Account</button>
      </article>
    </section>
  );
};

export default SecurityCenterUI;
