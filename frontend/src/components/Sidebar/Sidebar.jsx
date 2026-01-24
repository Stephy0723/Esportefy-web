import React, { useEffect, useRef, useState } from 'react'; // <--- Agregamos useState
import { Link } from 'react-router-dom';
import './Sidebar.css';
import { useTheme } from '../../context/ThemeContext'; 

import logoWhite from '../../assets/Logo/logo-black.png';
import logoBlack from '../../assets/Logo/logo-white.png';

const Sidebar = ({ isClosed, setIsClosed }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  // ESTADO PARA "VER MÁS"
  const [isMenuExpanded, setIsMenuExpanded] = useState(false); // false = colapsado

  const sidebarRef = useRef(null);

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
                <img src={isDarkMode ? logoWhite : logoBlack} alt="Logo" className="sidebar-logo" />
            ) : (
                <i className='bx bx-game logo-icon'></i>
            )}
          </span>
          <div className="header-info logo-text">
            <span className="name">ESPORTEFY</span>
            <span className="profession">Pro Gaming</span>
          </div>
        </div>

        <i className='bx bx-chevron-right toggle' onClick={(e) => {
              e.stopPropagation();
              setIsClosed(!isClosed);
        }}></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
          
          {/* ===================================== */}
          {/* 1. SECCIÓN PRINCIPAL (SIEMPRE VISIBLE)*/}
          {/* ===================================== */}
          <div className="menu-header"><span className="text section-title">PRINCIPAL</span></div>
          <ul className="menu-links">
            <li className="nav-link">
                <Link to="/dashboard"><i className='bx bx-grid-alt icon'></i><span className="text nav-text">Dashboard</span></Link>
            </li>
            <li className="nav-link">
                <Link to="/torneos"><i className='bx bx-trophy icon'></i><span className="text nav-text">Torneos</span></Link>
            </li>
             <li className="nav-link">
                <Link to="/equipos"><i className='bx bx-group icon'></i><span className="text nav-text">Equipos</span></Link>
            </li>
             <li className="nav-link">
                <Link to="/tv"><i className='bx bx-movie-play icon'></i><span className="text nav-text">Esportefy TV</span></Link>
            </li>
          </ul>

          {/* ===================================== */}
          {/* BOTÓN "VER MÁS / VER MENOS"           */}
          {/* ===================================== */}
          <ul className="menu-links">
            <li className="nav-link toggle-more-btn" onClick={() => setIsMenuExpanded(!isMenuExpanded)}>
                {/* Cambiamos el icono según el estado */}
                <i className={`bx bx-chevron-${isMenuExpanded ? 'up' : 'down'} icon`} style={{color: 'var(--brand-green)'}}></i>
                <span className="text nav-text" style={{fontWeight: 'bold', color: 'var(--brand-green)'}}>
                    {isMenuExpanded ? 'Menos Opciones' : 'Ver Más...'}
                </span>
            </li>
          </ul>

          {/* ===================================== */}
          {/* SECCIONES OCULTAS (EXPANDIBLES)       */}
          {/* ===================================== */}
          {isMenuExpanded && (
            <div className="expanded-menu-animation">
                {/* --- SOCIAL --- */}
                <div className="menu-header"><span className="text section-title">SOCIAL</span></div>
                <ul className="menu-links">
                    <li className="nav-link">
                        <Link to="/comunidad"><i className='bx bx-world icon'></i><span className="text nav-text">Comunidad</span></Link>
                    </li>
                    <li className="nav-link">
                        <Link to="/chats"><i className='bx bx-chat icon'></i><span className="text nav-text">Chats</span></Link>
                    </li>
                    
                </ul>

                {/* --- REDES SOCIALES (Fila) --- */}
                {!isClosed && (
                    <div className="social-row">
                        <span className="text section-title" style={{marginBottom: '8px', display:'block'}}>SÍGUENOS</span>
                        <div className="icons-container">
                            <a href="https://twitch.tv" target="_blank" className="social-mini twitch"><i className='bx bxl-twitch'></i></a>
                            <a href="https://youtube.com" target="_blank" className="social-mini youtube"><i className='bx bxl-youtube'></i></a>
                            <a href="https://facebook.com" target="_blank" className="social-mini facebook"><i className='bx bxl-facebook'></i></a>
                            <a href="#" target="_blank" className="social-mini discord"><i className='bx bxl-discord-alt'></i></a>
                        </div>
                    </div>
                )}

                {/* --- CONFIGURACIÓN --- */}
                <div className="menu-header"><span className="text section-title">CONFIGURACIÓN</span></div>
                <ul className="menu-links">
                    <li className="nav-link">
                        <Link to="/settings"><i className='bx bx-cog icon'></i><span className="text nav-text">Ajustes</span></Link>
                    </li>
                    <li className="nav-link">
                        <Link to="/perfil"><i className='bx bx-user icon'></i><span className="text nav-text">Mi Perfil</span></Link>
                    </li>
                </ul>
            </div>
          )}
          {/* FIN SECCIONES OCULTAS */}


          {/* ICONO COMPARTIR CUANDO ESTÁ CERRADO (SIEMPRE VISIBLE) */}
          <div className="social-trigger-closed">
             <i className='bx bx-share-alt icon'></i>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="bottom-content">
          <li className="">
            <Link to="/login"><i className='bx bx-log-out icon'></i><span className="text nav-text">Cerrar Sesión</span></Link>
          </li>
          <li className="mode" onClick={(e) => { e.stopPropagation(); toggleTheme(); }}>
            <div className="sun-moon"><i className='bx bx-moon icon moon'></i><i className='bx bx-sun icon sun'></i></div>
            <span className="mode-text text">{isDarkMode ? 'Oscuro' : 'Claro'}</span>
            <div className="toggle-switch"><span className="switch"></span></div>
          </li>
          
          <div className="sidebar-credit">
             <span className="text">Dev by <strong>Steliant</strong></span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;