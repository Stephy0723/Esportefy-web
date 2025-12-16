import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Notifications from '../../pages/Notifications/Notifications';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. DETECCIÓN DE SCROLL
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10; 
      setScrolled(isScrolled);
    };

    // 2. RECUPERAR USUARIO
    const storedUser = localStorage.getItem('esportefyUser');
    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('esportefyUser');
    setActiveUser(null);
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        
        {/* LOGO ORIGINAL RESTAURADO */}
        <Link to="/" className="navbar-logo">
          <i className='bx bx-joystick'></i>
          <span>ESPORTE<span className="highlight">FY</span></span>
        </Link>

        {/* ACCIONES */}
        <div className="navbar-actions">
          
          <div className="search-box">
            <i className='bx bx-search'></i>
            <input type="text" placeholder="Buscar..." />
          </div>

          <button className="notify-btn" onClick={() => navigate('/notifications')}>
            <i className='bx bx-bell'></i>
            {/* El punto rojo sigue apareciendo si hay usuario activo */}
            {activeUser && <span className="dot"></span>}
        </button>

          {activeUser ? (
            <div className="user-profile" onClick={handleLogout} title="Cerrar Sesión">
              <div className="user-info">
                <span className="username">{activeUser.name}</span>
              </div>
              <img 
                src={activeUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                alt="Avatar" 
                className="user-avatar" 
              />
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              INGRESAR
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;