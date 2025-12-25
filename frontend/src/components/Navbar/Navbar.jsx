import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

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
        
        {/* 1. LOGO A LA IZQUIERDA */}
        <Link to="/" className="navbar-logo">
          <i className='bx bx-joystick'></i>
          <span>ESPORTE<span className="highlight">FY</span></span>
        </Link>

        {/* 2. BUSCADOR EN EL CENTRO (Movido aquí para poder centrarlo) */}
        <div className="search-box">
           <i className='bx bx-search'></i>
           <input type="text" placeholder="Buscar..." />
        </div>
        
        {/* 3. ACCIONES A LA DERECHA */}
        <div className="navbar-actions">
          <button className="notify-btn" onClick={() => navigate('/notifications')}>
            <i className='bx bx-bell'></i>
            {activeUser && <span className="dot"></span>}
          </button>

          {activeUser ? (
            <div className="user-profile container-unified">
              <Link to="/profile" className="profile-link-part">
                <img 
                  src={activeUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  alt="Avatar" 
                  className="user-avatar" 
                />
                <span className="username">{activeUser.username || activeUser.name}</span>
              </Link>
              <div className="separator-vertical"></div>
              <button onClick={handleLogout} className="logout-btn-integrated">
                <i className='bx bx-log-out'></i>
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">INGRESAR</Link>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;