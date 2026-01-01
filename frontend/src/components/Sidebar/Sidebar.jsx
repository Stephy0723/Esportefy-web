import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

// 1. IMPORTANTE: Importamos el hook del contexto
import { useTheme } from '../../context/ThemeContext'; 

import logoWhite from '../../assets/Logo/logo-black.png';
import logoBlack from '../../assets/Logo/logo-white.png';

const Sidebar = ({ isClosed, setIsClosed }) => {
  // 2. USAMOS EL CONTEXTO GLOBAL
  // En lugar de crear un estado local que se resetea, usamos el global
  const { isDarkMode, toggleTheme } = useTheme();
  
  const sidebarRef = useRef(null);

  // Efecto: Cerrar al hacer clic fuera (Solo para móviles)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isClosed && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsClosed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isClosed, setIsClosed]);

  const handleSidebarClick = () => {
     if(isClosed) setIsClosed(false);
  }

  return (
    <nav 
        className={`sidebar ${isClosed ? 'close' : ''}`} 
        ref={sidebarRef}
        onClick={handleSidebarClick}
    >
      <header>
        <div className="image-text">
          <span className="image">
            {logoWhite && logoBlack ? (
                <img 
                    // El logo cambia según el estado GLOBAL
                    src={isDarkMode ? logoWhite : logoBlack} 
                    alt="Logo" 
                    className="sidebar-logo" 
                />
            ) : (
                <i className='bx bx-game logo-icon'></i>
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
              e.stopPropagation();
              setIsClosed(!isClosed);
          }}
        ></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
          <ul className="menu-links">
            <li className="nav-link"><Link to="/dashboard"><i className='bx bx-grid-alt icon'></i><span className="text nav-text">Dashboard</span></Link></li>
            <li className="nav-link"><Link to="/torneos"><i className='bx bx-trophy icon'></i><span className="text nav-text">Torneos</span></Link></li>
            <li className="nav-link"><Link to="/comunidad"><i className='bx bx-world icon'></i><span className="text nav-text">Comunidad</span></Link></li>
            <li className="nav-link"><Link to="/chats"><i className='bx bx-chat icon'></i><span className="text nav-text">Chats</span></Link></li>
            <li className="nav-link"><Link to="/equipos"><i className='bx bx-group icon'></i><span className="text nav-text">Equipos</span></Link></li>
            <li className="nav-link"><Link to="/tv"><i className='bx bx-movie-play icon'></i><span className="text nav-text">Esportefy TV</span></Link></li>
            <li className="nav-link"><Link to="/settings"><i className='bx bx-cog icon'></i><span className="text nav-text">Ajustes</span></Link></li>
          </ul>
        </div>

        <div className="bottom-content">
    <div className="social-media">
        {/* El Trigger puede ser decorativo o un botón para desplegar en móvil */}
        <div className="social-trigger">
            <i className='bx bx-share-alt icon'></i>
            <span className="text">Social</span>
        </div>

        <div className="social-icons">
            {/* Twitch (Enlace Real) */}
            <a href="https://www.twitch.tv/esportefy" target="_blank" rel="noopener noreferrer" className="social-link twitch">
                <i className='bx bxl-twitch'></i>
            </a>

            {/* YouTube (Enlace Real) */}
            <a href="https://www.youtube.com/channel/UCAwKJv2zibYYEKJOgWW6F9w" target="_blank" rel="noopener noreferrer" className="social-link youtube">
                <i className='bx bxl-youtube'></i>
            </a>

            {/* Facebook (Enlace Real - Añadido) */}
            <a href="https://www.facebook.com/profile.php?id=61585628084470" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                <i className='bx bxl-facebook'></i>
            </a>

            {/* Discord (Placeholder) */}
            <a href="#" className="social-link discord">
                <i className='bx bxl-discord-alt'></i>
            </a>
         
        </div>
    </div>
          <li className="">
            {/* Nota: Es mejor usar Link para evitar recarga completa, pero href funciona */}
            <Link to="/login"><i className='bx bx-log-out icon'></i><span className="text nav-text">Cerrar Sesión</span></Link>
          </li>

          {/* 3. CLICK EN EL SWITCH: Llamamos a toggleTheme del contexto */}
          <li className="mode" onClick={(e) => {
              e.stopPropagation(); 
              toggleTheme(); // <--- ESTO GUARDA Y CAMBIA EL TEMA GLOBALMENTE
          }}>
            <div className="sun-moon">
              <i className='bx bx-moon icon moon'></i>
              <i className='bx bx-sun icon sun'></i>
            </div>
            <span className="mode-text text">{isDarkMode ? 'Oscuro' : 'Claro'}</span>
            <div className="toggle-switch"><span className="switch"></span></div>
          </li>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;