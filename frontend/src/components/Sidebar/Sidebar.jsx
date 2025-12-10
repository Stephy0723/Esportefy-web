import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

// --- IMPORTA TUS LOGOS ---
import logoWhite from '../../assets/Logo/logo-white.png';
import logoBlack from '../../assets/Logo/logo-black.png';

const Sidebar = ({ isClosed, setIsClosed }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Referencia para detectar clics fuera del menú
  const sidebarRef = useRef(null);

  // Efecto: Modo Oscuro
  useEffect(() => {
    const body = document.querySelector('body');
    if (isDarkMode) body.classList.add('dark');
    else body.classList.remove('dark');
  }, [isDarkMode]);

  // Efecto: Clic Fuera para Cerrar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el menú está abierto Y el clic NO fue dentro del sidebar
      if (!isClosed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsClosed(true); // Cierra el menú
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClosed, setIsClosed]);

  // Función para abrir si haces clic dentro (y está cerrado)
  const handleSidebarClick = () => {
    if (isClosed) setIsClosed(false);
  };

  return (
    <nav 
        className={`sidebar ${isClosed ? 'close' : ''}`} 
        ref={sidebarRef}
        onClick={handleSidebarClick} // CLIC DENTRO ABRE EL MENÚ
    >
      <header>
        <div className="image-text">
          <span className="image">
            {logoWhite && logoBlack ? (
                <img 
                    src={isDarkMode ? logoWhite : logoBlack} 
                    alt="Logo" 
                    className="sidebar-logo" 
                />
            ) : (
                <i className='bx bx-joystick' style={{ fontSize: '30px', color: '#8EDB15' }}></i>
            )}
          </span>

          <div className="header-info logo-text">
            <span className="name">ESPORTEFY</span>
            <span className="profession">Pro Gaming</span>
          </div>
        </div>

        <i 
          className='bx bx-chevron-right toggle' 
          onClick={(e) => {
              e.stopPropagation(); // Evita conflicto con el clic del nav
              setIsClosed(!isClosed);
          }}
        ></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
          <ul className="menu-links">
            <li className="nav-link"><Link to="/"><i className='bx bx-grid-alt icon'></i><span className="text nav-text">Dashboard</span></Link></li>
            <li className="nav-link"><Link to="/torneos"><i className='bx bx-trophy icon'></i><span className="text nav-text">Torneos</span></Link></li>
            <li className="nav-link"><Link to="/comunidad"><i className='bx bx-world icon'></i><span className="text nav-text">Comunidad</span></Link></li>
            <li className="nav-link"><Link to="/chats"><i className='bx bx-chat icon'></i><span className="text nav-text">Chats</span></Link></li>
            <li className="nav-link"><Link to="/equipos"><i className='bx bx-group icon'></i><span className="text nav-text">Equipos</span></Link></li>
            <li className="nav-link"><Link to="/tv"><i className='bx bx-movie-play icon'></i><span className="text nav-text">Esportefy TV</span></Link></li>
            <li className="nav-link"><Link to="/settings"><i className='bx bx-cog icon'></i><span className="text nav-text">Ajustes</span></Link></li>
          </ul>
        </div>

        <div className="bottom-content">
          
          {/* --- REDES SOCIALES --- */}
          <div className="social-media">
             {/* Icono visible al cerrar */}
             <div className="social-trigger">
                <i className='bx bx-share-alt icon'></i>
             </div>
             {/* Iconos visibles al abrir */}
             <div className="social-icons">
                <a href="#" className="discord"><i className='bx bxl-discord-alt'></i></a>
                <a href="#" className="twitch"><i className='bx bxl-twitch'></i></a>
                <a href="#" className="twitter"><i className='bx bxl-twitter'></i></a>
                <a href="#" className="youtube"><i className='bx bxl-youtube'></i></a>
             </div>
          </div>

          <li className="">
            <a href="#"><i className='bx bx-log-out icon'></i><span className="text nav-text">Cerrar Sesión</span></a>
          </li>

          <li className="mode" onClick={(e) => {
              e.stopPropagation(); // Importante para que no abra/cierre al cambiar modo
              setIsDarkMode(!isDarkMode);
          }}>
            <div className="sun-moon">
              <i className='bx bx-moon icon moon'></i>
              <i className='bx bx-sun icon sun'></i>
            </div>
            <span className="mode-text text">{isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}</span>
            <div className="toggle-switch"><span className="switch"></span></div>
          </li>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;