import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  // Estado para guardar los datos del usuario activo (si existe)
  const [activeUser, setActiveUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Lógica del scroll (ya la tenías)
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // 2. --- NUEVO: Revisar si hay un usuario guardado en memoria ---
    const storedUser = localStorage.getItem('esportefyUser');
    if (storedUser) {
      // Si existe, lo convertimos de texto a objeto y lo guardamos en el estado
      setActiveUser(JSON.parse(storedUser));
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Se ejecuta una vez al cargar el Navbar

  // Función para Cerrar Sesión (Simulada)
  const handleLogout = () => {
    // Borramos los datos de la memoria
    localStorage.removeItem('esportefyUser');
    setActiveUser(null); // Reseteamos el estado
    navigate('/'); // Volvemos al inicio
    // window.location.reload(); // A veces necesario para limpiar todo
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        
        <div className="navbar-logo">
          <i className='bx bx-joystick'></i>
          <span className="logo-text">ESPORTE<span className="highlight">FY</span></span>
        </div>

        <div className="navbar-actions">
          <div className="search-box">
            <i className='bx bx-search'></i>
            <input type="text" placeholder="Buscar torneo, equipo..." />
          </div>

          <button className="notify-btn">
            <i className='bx bx-bell'></i>
            <span className="dot"></span>
          </button>

          <div className="auth-section">
            {/* CONDICIONAL: ¿Existe un usuario activo? */}
            {activeUser ? (
              // SI: Muestra el Perfil (Nombre y Foto)
              // Al hacer clic, cerramos sesión (como ejemplo)
              <div className="user-profile" onClick={handleLogout} title="Clic para cerrar sesión">
                <div className="user-info">
                  <span className="welcome">Hola,</span>
                  {/* Mostramos el nombre guardado */}
                  <span className="username">{activeUser.name}</span>
                </div>
                {/* Mostramos la foto guardada */}
                <img src={activeUser.avatar} alt="Perfil" className="user-avatar" />
              </div>
            ) : (
              // NO: Muestra el botón de Iniciar Sesión
              <Link to="/login" className="login-btn">
                Iniciar Sesión
              </Link>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;