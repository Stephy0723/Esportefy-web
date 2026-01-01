import React, { useState } from 'react';
import './UniversityPage.scss'; // El CSS Black & White

const UniversityPage = () => {
  const [activeTab, setActiveTab] = useState('torneos'); // torneos | rankings

  const universities = [
    { id: 1, name: 'Tecnológico de Monterrey', tag: 'ITESM', points: 1250, logo: '🦁' },
    { id: 2, name: 'Universidad Nacional', tag: 'UNAM', points: 1100, logo: '🐆' },
    { id: 3, name: 'Politécnico', tag: 'IPN', points: 980, logo: '🦅' },
  ];

  const tournaments = [
    { id: 1, game: 'Valorant', title: 'Copa Inter-Campus', date: '15 Oct', color: 'blue' }, // blue = neon-blue
    { id: 2, game: 'League of Legends', title: 'Liga Apertura', date: '20 Oct', color: 'gold' }, // gold = neon-gold
    { id: 3, game: 'Rocket League', title: 'Torneo Relámpago', date: 'Hoy', color: 'red' }, // red = neon-red
  ];

  return (
    <div className="university-page">
      
      {/* HEADER TIPO "CLEAN" */}
      <header className="uni-header">
        <div className="header-content">
          <span className="subtitle">SEASON 2024</span>
          <h1>ZONA <span className="highlight">UNIVERSITARIA</span></h1>
          <p>Compite por tu alma mater. Estilo y prestigio.</p>
        </div>
        <div className="header-actions">
           <button className="btn-bw">Inscribir Universidad</button>
        </div>
      </header>

      {/* NAVEGACIÓN TABS (Estilo minimalista) */}
      <div className="uni-tabs">
        <button 
            className={`tab-btn ${activeTab === 'torneos' ? 'active' : ''}`} 
            onClick={() => setActiveTab('torneos')}
        >
            Torneos Activos
        </button>
        <button 
            className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rankings')}
        >
            Ranking Nacional
        </button>
      </div>

      <div className="uni-grid">
        
        {/* SECCIÓN PRINCIPAL */}
        <div className="main-column">
           {activeTab === 'torneos' && (
             <div className="cards-container">
               {tournaments.map((t) => (
                 <div key={t.id} className={`bw-card neon-${t.color}`}>
                    <div className="card-icon">
                        <i className="ri-trophy-line"></i>
                    </div>
                    <div className="card-details">
                        <h4>{t.title}</h4>
                        <span className="game-name">{t.game}</span>
                    </div>
                    <div className="card-meta">
                        <span>{t.date}</span>
                        <button className="btn-arrow"><i className="ri-arrow-right-line"></i></button>
                    </div>
                 </div>
               ))}
             </div>
           )}

           {activeTab === 'rankings' && (
             <div className="ranking-list">
               {universities.map((uni, idx) => (
                 <div key={uni.id} className="ranking-row">
                    <span className="rank-num">#{idx + 1}</span>
                    <span className="uni-logo">{uni.logo}</span>
                    <div className="uni-info">
                        <strong>{uni.tag}</strong>
                        <small>{uni.name}</small>
                    </div>
                    <span className="uni-points">{uni.points} pts</span>
                 </div>
               ))}
             </div>
           )}
        </div>

        {/* SIDEBAR DERECHO (INFO EXTRA) */}
        <aside className="side-column">
            <div className="bw-widget">
                <h3>Encuesta Semanal</h3>
                <p>¿Final presencial en CDMX o Monterrey?</p>
                <div className="poll-options">
                    <div className="poll-option">
                        <span>CDMX</span>
                        <div className="bar" style={{width: '60%'}}></div>
                    </div>
                    <div className="poll-option">
                        <span>MTY</span>
                        <div className="bar" style={{width: '40%'}}></div>
                    </div>
                </div>
            </div>

            <div className="bw-widget highlight">
                <h3><i className="ri-vip-crown-line"></i> Beneficios</h3>
                <ul>
                    <li>Becas del 50%</li>
                    <li>Merch Exclusiva</li>
                    <li>Scouting Profesional</li>
                </ul>
            </div>
        </aside>

      </div>
    </div>
  );
};

export default UniversityPage;