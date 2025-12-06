import React, { useState, useEffect } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isClosed, setIsClosed] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Efecto: Modo Oscuro
  useEffect(() => {
    const body = document.querySelector('body');
    if (isDarkMode) {
      body.classList.add('dark');
    } else {
      body.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Función Scroll
  const handleScroll = (e, id) => {
    e.preventDefault();
    // Si el ID es '#' no hacemos nada (para botones sin sección aún)
    if (id === '#') return;
    
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    } else {
      console.warn(`No se encontró la sección: #${id}`);
    }
  };

  return (
    <nav className={`sidebar ${isClosed ? 'close' : ''}`}>
      <header>
        <div className="image-text">
          <span className="image">
            <i className='bx bx-joystick bx-flashing' style={{ color: '#695CFE' }}></i>
          </span>
          <div className="text logo-text">
            <span className="name">ESPORTEFY</span>
            <span className="profession">Pro Gaming</span>
          </div>
        </div>

        <i 
          className='bx bx-chevron-right toggle' 
          onClick={() => setIsClosed(!isClosed)}
        ></i>
      </header>

      <div className="menu-bar">
        <div className="menu">
          <ul className="menu-links">
            
            {/* 1. Dashboard -> Inicio */}
            <li className="nav-link">
              <a href="#inicio" onClick={(e) => handleScroll(e, 'inicio')}>
                <i className='bx bx-grid-alt icon'></i>
                <span className="text nav-text">Dashboard</span>
              </a>
            </li>

            {/* 2. Torneos */}
            <li className="nav-link">
              <a href="#torneos" onClick={(e) => handleScroll(e, 'torneos')}>
                <i className='bx bx-trophy icon'></i>
                <span className="text nav-text">Torneos</span>
              </a>
            </li>

            {/* 4. Comunidad */}
            <li className="nav-link">
              <a href="#comunidad" onClick={(e) => handleScroll(e, 'comunidad')}>
                <i className='bx bx-world icon'></i>
                <span className="text nav-text">Comunidad</span>
              </a>
            </li>

            {/* 5. Chats */}
            <li className="nav-link">
              <a href="#">
                <i className='bx bx-chat icon'></i>
                <span className="text nav-text">Chats</span>
              </a>
            </li>

            {/* 6. Equipos */}
            <li className="nav-link">
              <a href="#equipos" onClick={(e) => handleScroll(e, 'equipos')}>
                <i className='bx bx-group icon'></i>
                <span className="text nav-text">Equipos</span>
              </a>
            </li>

            {/* 7. Esportefy TV */}
            <li className="nav-link">
              <a href="#tv" onClick={(e) => handleScroll(e, 'tv')}>
                <i className='bx bx-movie-play icon'></i>
                <span className="text nav-text">Esportefy TV</span>
              </a>
            </li>

            {/* 8. Ajustes */}
            <li className="nav-link">
              <a href="#">
                <i className='bx bx-cog icon'></i>
                <span className="text nav-text">Ajustes</span>
              </a>
            </li>

          </ul>
        </div>

        <div className="bottom-content">
          
          {/* REDES SOCIALES */}
          <div className="social-media">
             <div className="social-trigger">{/*Logo de compartir que  quiere que se vea la maniosa*/}
                <i className='bx bx-share-alt'></i>
              </div>

             <div className="social-icons">
                <a href="#" className="discord"><i className='bx bxl-discord-alt'></i></a>
                <a href="#" className="twitch"><i className='bx bxl-twitch'></i></a>
                <a href="#" className="twitter"><i className='bx bxl-twitter'></i></a>
                <a href="#" className="youtube"><i className='bx bxl-youtube'></i></a>
             </div>
          </div>

          <li className="">
            <a href="#">
              <i className='bx bx-log-out icon'></i>
              <span className="text nav-text">Cerrar Sesión</span>
            </a>
          </li>

          {/* MODO OSCURO (CORREGIDO) */}
          <li className="mode" onClick={() => setIsDarkMode(!isDarkMode)}>
            <div className="sun-moon">
              <i className='bx bx-moon icon moon'></i>
              <i className='bx bx-sun icon sun'></i>
            </div>
            
            <span className="mode-text text">
              {isDarkMode ? 'Oscuro' : 'Claro'}
            </span>

            <div className="toggle-switch">
              <span className="switch"></span>
            </div>
          </li>
          
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;