import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. DETECTAR SCROLL (Para efecto vidrio)
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // 2. DETECTAR USUARIO (Login persistente)
    const storedUser = localStorage.getItem('esportefyUser');
    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error al leer usuario", error);
        localStorage.removeItem('esportefyUser'); // Limpiar si está corrupto
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FUNCIÓN CERRAR SESIÓN
  const handleLogout = () => {
    localStorage.removeItem('esportefyUser');
    setActiveUser(null);
    navigate('/');
    window.location.reload(); // Recarga para limpiar estados de memoria
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        
        {/* LOGO (Texto con Highlight Verde) */}
        <div className="navbar-logo">
          <i className='bx bx-joystick'></i>
          <span className="logo-text">ESPORTE<span className="highlight">FY</span></span>
        </div>

        {/* ACCIONES DERECHA */}
        <div className="navbar-actions">
          
          {/* BUSCADOR */}
          <div className="search-box">
            <i className='bx bx-search'></i>
            <input type="text" placeholder="Buscar torneo, equipo..." />
          </div>

          {/* NOTIFICACIONES */}
          <button className="notify-btn">
            <i className='bx bx-bell'></i>
            <span className="dot"></span>
          </button>

          {/* PERFIL / LOGIN */}
          <div className="auth-section">
            {activeUser ? (
              // SI ESTÁ LOGUEADO
              <div className="user-profile" onClick={handleLogout} title="Cerrar Sesión">
                <div className="user-info">
                  <span className="welcome">Hola,</span>
                  <span className="username">{activeUser.name || "Gamer"}</span>
                </div>
                {/* Avatar o imagen por defecto */}
                <img 
                    src={activeUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                    alt="Perfil" 
                    className="user-avatar" 
                />
              </div>
            ) : (
              // SI NO ESTÁ LOGUEADO
              <Link to="/login" className="login-btn">
                Ingresar
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;