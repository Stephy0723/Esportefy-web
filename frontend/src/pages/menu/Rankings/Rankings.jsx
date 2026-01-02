import React, { useState } from 'react';
import './Rankings.css';

const Rankings = () => {
  const [game, setGame] = useState('lol');
  const [mode, setMode] = useState('solo'); 

  // Datos extendidos para pruebas
  const data = [
    { id: 1, name: 'MenaRD', sub: 'Bandits', points: '2500', type: 'solo', game: 'sf6' },
    { id: 2, name: 'Bandits Gaming', sub: 'Pro Team', points: '8900', type: 'equipo', game: 'lol' },
    { id: 3, name: 'Juandisimo', sub: 'Independiente', points: '1200', type: 'solo', game: 'lol' },
    { id: 4, name: 'Vamo Arriba', sub: 'RD Team', points: '3400', type: 'equipo', game: 'valorant' },
    { id: 5, name: 'SantoD_Viper', sub: 'Independiente', points: '550', type: 'solo', game: 'hok' },
    { id: 6, name: 'Mangu Killer', sub: 'Dominican Team', points: '1150', type: 'solo', game: 'lol' },
  ];

  const filteredData = data.filter(item => item.game === game && item.type === mode);

  // Lista de juegos para el sidebar
  const gameList = [
    { id: 'lol', name: 'League of Legends', icon: 'bx-shield-quarter' },
    { id: 'hok', name: 'Honor of Kings', icon: 'bx-crown' },
    { id: 'mlbb', name: 'Mobile Legends', icon: 'bx-mobile-alt' },
    { id: 'valorant', name: 'Valorant', icon: 'bx-target-lock' },
    { id: 'cod', name: 'Call of Duty', icon: 'bx-crosshair' },
    { id: 'sf6', name: 'Street Fighter 6', icon: 'bx-bolt-circle' },
    { id: 'fc25', name: 'EA Sports FC 25', icon: 'bx-football' },
    { id: 'smash', name: 'Smash Bros Ultimate', icon: 'bx-star' },
  ];

  return (
    <div className="rankings-layout">
      
      <div className="main-content">
        <div className="rank-header">
          <h2>Ranking Nacional</h2>
          
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${mode === 'solo' ? 'active' : ''}`}
              onClick={() => setMode('solo')}
            >
              SOLITARIOS
            </button>
            <button 
              className={`mode-btn ${mode === 'equipo' ? 'active' : ''}`}
              onClick={() => setMode('equipo')}
            >
              EQUIPOS
            </button>
          </div>
        </div>

        <table className="rank-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{mode === 'solo' ? 'Jugador' : 'Equipo'}</th>
              <th>Puntos Esportefy</th>
              <th style={{textAlign: 'right'}}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <tr key={item.id} className={`rank-row ${index < 3 ? 'top-3' : ''}`}>
                  <td className="pos-col">{index + 1}</td>
                  <td>
                    <div style={{fontWeight: '600'}}>{item.name}</div>
                    <div style={{fontSize: '11px', color: '#555'}}>{item.sub}</div>
                  </td>
                  <td className="points-col">{item.points}</td>
                  <td style={{textAlign: 'right'}}>
                     <button className="btn-text" style={{color: '#8EDB15'}}>VER MÁS</button>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan="4">
                        <div className="empty-feed">
                            <i className='bx bx-search'></i>
                            <p>No hay rankings registrados para esta categoría.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SIDEBAR DE JUEGOS EXPANDIDO */}
      <div className="notif-sidebar">
        <div className="sidebar-section">
          <h4>Disciplinas E-Sports</h4>
          <ul>
            {gameList.map((g) => (
              <li 
                key={g.id} 
                className={game === g.id ? 'active' : ''} 
                onClick={() => setGame(g.id)}
              >
                <i className={`bx ${g.icon}`}></i> {g.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-section">
          <h4>Acerca de</h4>
          <p style={{fontSize: '11px', color: '#666', padding: '0 15px', lineHeight: '1.6'}}>
            Los puntos se calculan en base a victorias en torneos locales y posición en el servidor regional.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Rankings;