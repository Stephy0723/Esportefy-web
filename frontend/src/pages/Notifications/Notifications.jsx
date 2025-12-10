import React from 'react';
import './Notifications.css';

export default function Notifications() {
  return (
    <div className="notifications-page">
      <header className="notifications-header">
        <h2>Notificaciones</h2>
      </header>

      <ul className="notifications-list">
        <li className="notification-item">Tienes 3 mensajes nuevos</li>
        <li className="notification-item">Tu suscripción vence en 5 días</li>
        <li className="notification-item">Actualización disponible</li>
      </ul>
    </div>
  );
}
