import React from 'react';
import './Tv.css';
import PageHud from '../../../components/PageHud/PageHud';

export default function Tv() {
  return (
    <div className="tv-coming">
      <PageHud page="ESPORTEFY TV" />
      <div className="tv-coming__content">
        <div className="tv-coming__ghost">
          <i className='bx bx-ghost'></i>
        </div>
        <h2 className="tv-coming__title">Esportefy TV en Desarrollo</h2>
        <p className="tv-coming__text">
          Estamos preparando la plataforma de streaming y VODs.
          <br />Torneos en vivo, highlights y más — muy pronto.
        </p>
        <span className="tv-coming__badge">
          <i className='bx bx-rocket'></i> Próxima Versión
        </span>
      </div>
    </div>
  );
}