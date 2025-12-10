import React from 'react';
import './Tv.css';

export default function Tv() {
  return (
    <div className="tv-page">
      <header className="tv-header">
        <h2>Esportefy TV</h2>
      </header>

      <div className="tv-player">
        <div className="tv-placeholder">Video/Stream placeholder</div>
      </div>

      <aside className="tv-schedule">Próximos streams / programación</aside>
    </div>
  );
}
