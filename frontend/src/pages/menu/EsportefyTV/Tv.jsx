import React, { useState } from 'react';
import { 
  MdHomeFilled, MdExplore, MdSubscriptions, MdVideoLibrary, 
  MdDarkMode, MdLightMode, MdDashboard, MdEmojiEvents 
} from 'react-icons/md';
import { FaBroadcastTower } from 'react-icons/fa';
import './Tv.css';
import PageHud from '../../../components/PageHud/PageHud';

export default function Tv() {
  // ESTADO DEL TEMA: 'light' (blanco) o 'dark' (negro)
  const [theme, setTheme] = useState('light'); 
  const [activeCategory, setActiveCategory] = useState('Todos');

  // FUNCIÓN PARA CAMBIAR EL TEMA
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const categories = ["Todos", "En Vivo", "Torneos", "Shooters", "MOBA", "Estrategia"];

  return (
    // APLICAMOS EL ATRIBUTO DATA-THEME AQUÍ PARA QUE EL CSS SEPA QUÉ COLORES USAR
    <div className="yt-layout" data-theme={theme}>
      <PageHud page="ESPORTEFY TV" />
      
      {/* --- BARRA IZQUIERDA (Navegación + BOTÓN DE TEMA) --- */}
      <aside className="left-icon-bar">
        <div className="icon-btn">
          <MdHomeFilled />
          <span>Inicio</span>
        </div>
        <div className="icon-btn">
          <MdExplore />
          <span>Explorar</span>
        </div>
        <div className="icon-btn">
          <MdSubscriptions />
          <span>Subs</span>
        </div>
        
        {/* --- AQUÍ ESTÁ EL BOTÓN QUE CAMBIA TODO --- */}
        <button className="icon-btn theme-toggle-btn" onClick={toggleTheme}>
          {theme === 'light' ? <MdDarkMode /> : <MdLightMode />}
          <span>{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
        </button>
      </aside>

      {/* --- SIDEBAR DERECHA (Menú grande) --- */}
      <aside className="yt-sidebar-right">
        <button className="btn-broadcast">
           <FaBroadcastTower /> TRANSMITIR
        </button>
        <div className="divider"></div>
        <div className="sidebar-item active"><MdDashboard /> Dashboard</div>
        <div className="sidebar-item"><MdEmojiEvents /> Mis Torneos</div>
        {/* Más items... */}
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="yt-main">
        
        {/* Tags */}
        <div className="categories-bar-wrapper">
          <div className="categories-bar">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`category-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Hero Banner */}
        <div className="hero-tournament">
           <div className="hero-content">
             <h1>CHAMPIONSHIP 2025</h1>
             <p>El torneo más esperado del año.</p>
           </div>
        </div>

        {/* Videos */}
        <div className="video-grid">
           {[1,2,3,4,5,6].map(n => (
             <div className="video-card" key={n}>
                <div className="thumbnail-container">
                   <img src={`https://picsum.photos/seed/${n}/400/225`} className="thumbnail" alt="video"/>
                </div>
                <div className="video-title">Gran Final Torneo #{n}</div>
                <div className="channel-name">Esportefy Official</div>
             </div>
           ))}
        </div>

      </main>
    </div>
  );
}