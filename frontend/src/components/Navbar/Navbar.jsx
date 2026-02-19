import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { withCsrfHeaders } from '../../utils/csrf';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const navigate = useNavigate();

  // Función para leer el usuario del almacenamiento
  const checkUser = () => {
    const storedUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
    if (storedUser) {
      try {
        setActiveUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user", e);
        setActiveUser(null);
      }
    } else {
      setActiveUser(null);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    const checkNotifications = async () => {
      const storedUser = localStorage.getItem('esportefyUser') || sessionStorage.getItem('esportefyUser');
      if (!storedUser) {
        setHasUnread(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:4000/api/notifications', {
          credentials: 'include'
        });
        if (!res.ok) return;
        const data = await res.json();
        const unread = Array.isArray(data) && data.some(n => n.status === 'unread');
        setHasUnread(unread);
      } catch (_) {
        // no bloquear UI
      }
    };

    // 1. Chequeo inicial al cargar
    checkUser();
    checkNotifications();

    // 2. Escuchar evento de scroll
    window.addEventListener('scroll', handleScroll);
    
    // 3. AGREGADO: Escuchar evento personalizado cuando alguien inicia sesión o se registra
    window.addEventListener('user-update', checkUser);
    window.addEventListener('user-update', checkNotifications);

    const notifTimer = setInterval(checkNotifications, 60000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('user-update', checkUser); // Limpiar evento
      window.removeEventListener('user-update', checkNotifications);
      clearInterval(notifTimer);
    };
  }, []);

  const handleLogout = () => {
    fetch('http://localhost:4000/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: withCsrfHeaders()
    }).catch(() => {});

    localStorage.removeItem('esportefyUser');
    sessionStorage.removeItem('esportefyUser');
    // Despachar el evento para que el Navbar sepa que se cerró sesión
    window.dispatchEvent(new Event('user-update'));
    navigate('/');
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        
        {/* LOGO */}
        <Link to={activeUser ? "/dashboard" : "/"} className="navbar-logo">
          <i className='bx bx-joystick'></i>
          <span>ESPORTE<span className="highlight">FY</span></span>
        </Link>

        {/* BUSCADOR */}
        <div className="search-box">
           <i className='bx bx-search'></i>
           <input type="text" placeholder="Buscar..." />
        </div>
        
        {/* ACCIONES */}
        <div className="navbar-actions">
          <button className="notify-btn" onClick={() => navigate('/notifications')}>
            <i className='bx bx-bell'></i>
            {activeUser && hasUnread && <span className="dot"></span>}
          </button>

          {activeUser ? (
            /* ESTO SE MOSTRARÁ CUANDO HAYA USUARIO */
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
              <button onClick={handleLogout} className="logout-btn-integrated" title="Salir">
                <i className='bx bx-log-out'></i>
              </button>
            </div>
          ) : (
            /* ESTO SE MOSTRARÁ CUANDO NO HAYA USUARIO */
            <div className="auth-buttons">
                <Link to="/login" className="login-btn">INGRESAR</Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
