import React from 'react';
import './Settings.css';

export default function Settings() {
  return (
    <div className="settings-page">
      <header className="settings-header">
        <h2>Configuración</h2>
      </header>

      <section className="settings-grid">
        <div className="settings-card">Perfil</div>
        <div className="settings-card">Cuenta</div>
        <div className="settings-card">Notificaciones</div>
      </section>
    </div>
  );
}
