import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../../config/api';
import { useTheme } from '../../context/ThemeContext';
import { STATUS_LIST } from '../../data/defaultAvatars';
import './Navbar.css';

/* ── Route → readable breadcrumb map ── */
const ROUTE_NAMES = {
  '/': 'Inicio',
  '/dashboard': 'Dashboard',
  '/torneos': 'Torneos',
  '/tournaments': 'Torneos',
  '/equipos': 'Equipos',
  '/comunidad': 'Comunidad',
  '/rankings': 'Rankings',
  '/chats': 'Mensajes',
  '/tv': 'Esportefy TV',
  '/settings': 'Configuración',
  '/notifications': 'Notificaciones',
  '/profile': 'Mi Perfil',
  '/edit-profile': 'Editar Perfil',
  '/create-team': 'Crear Equipo',
  '/create-tournament': 'Crear Torneo',
  '/CalendarPage': 'Calendario',
  '/university': 'Universidad',
  '/support': 'Soporte',
};

/* ── Quick Actions (only for logged-in users) ── */
const QUICK_ACTIONS = [
  { label: 'Crear Torneo', to: '/create-tournament', icon: 'bx-plus-circle', color: '#FFD700' },
  { label: 'Crear Equipo', to: '/create-team', icon: 'bx-group', color: '#4FACFE' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeUser, setActiveUser] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const actionsRef = useRef(null);
  const searchInputRef = useRef(null);

  /* ── Breadcrumb from current route ── */
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    // Check exact match first
    if (ROUTE_NAMES[path]) return ROUTE_NAMES[path];
    // Check /game/:id pattern
    if (path.startsWith('/game/')) {
      const game = path.split('/game/')[1];
      return game ? game.charAt(0).toUpperCase() + game.slice(1) : 'Juego';
    }
    // Check /legal/ pattern
    if (path.startsWith('/legal/')) return 'Legal';
    return null;
  }, [location.pathname]);

  /* ── Read user from storage ── */
  const checkUser = useCallback(() => {
    const storedUser = localStorage.getItem('esportefyUser');
    if (storedUser) {
      try { setActiveUser(JSON.parse(storedUser)); }
      catch { setActiveUser(null); }
    } else {
      setActiveUser(null);
    }
  }, []);

  /* ── Check notifications ── */
  const checkNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { setHasUnread(false); setUnreadCount(0); return; }
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        const unreads = data.filter((n) => n.status === 'unread');
        setHasUnread(unreads.length > 0);
        setUnreadCount(unreads.length);
      }
    } catch {
      /* silently fail */
    }
  }, []);

  /* ── Clock tick ── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ── Bootstrap ── */
  useEffect(() => {
    checkUser();
    checkNotifications();

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('user-update', checkUser);
    window.addEventListener('user-update', checkNotifications);
    const notifTimer = setInterval(checkNotifications, 60000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('user-update', checkUser);
      window.removeEventListener('user-update', checkNotifications);
      clearInterval(notifTimer);
    };
  }, [checkUser, checkNotifications]);

  /* ── Close popovers on outside click ── */
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (actionsRef.current && !actionsRef.current.contains(e.target)) setActionsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* ── Close on route change ── */
  useEffect(() => {
    setProfileOpen(false);
    setSearchFocused(false);
    setActionsOpen(false);
  }, [location.pathname]);

  /* ── Keyboard shortcut Ctrl+K ── */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setProfileOpen(false);
        setActionsOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('esportefyUser');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('user-update'));
    setProfileOpen(false);
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/comunidad?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      setSearchQuery('');
    }
  };

  const timeString = currentTime.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

  return (
    <nav className={`nb ${scrolled ? 'nb--scrolled' : ''}`}>
      <div className="nb__inner">

        {/* ═══ LEFT: Logo + Breadcrumb ═══ */}
        <div className="nb__left">
          <Link to={activeUser ? '/dashboard' : '/'} className="nb__logo">
            <span className="nb__logo-text">
              ESPORTE<span className="nb__logo-accent">FY</span>
            </span>
          </Link>

          {breadcrumb && (
            <div className="nb__breadcrumb">
              <span className="nb__breadcrumb-sep">/</span>
              <span className="nb__breadcrumb-page">{breadcrumb}</span>
            </div>
          )}
        </div>

        {/* ═══ CENTER: Command-bar Search ═══ */}
        <div ref={searchRef} className={`nb__cmdbar ${searchFocused ? 'nb__cmdbar--focused' : ''}`}>
          <form onSubmit={handleSearch} className="nb__cmdbar-form">
            <i className="bx bx-search nb__cmdbar-icon"></i>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar en Esportefy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              className="nb__cmdbar-input"
            />
            <div className="nb__cmdbar-kbd">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          </form>

          {/* Expanded search results overlay */}
          {searchFocused && (
            <div className="nb__cmdbar-overlay">
              <div className="nb__cmdbar-section">
                <span className="nb__cmdbar-section-label">Acceso rápido</span>
                <Link to="/torneos" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-trophy"></i>
                  <span>Torneos activos</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                <Link to="/rankings" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-bar-chart-alt-2"></i>
                  <span>Rankings globales</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                <Link to="/comunidad" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-world"></i>
                  <span>Explorar comunidades</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                {activeUser && (
                  <Link to="/chats" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                    <i className="bx bx-message-rounded-dots"></i>
                    <span>Ir a mensajes</span>
                    <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Actions ═══ */}
        <div className="nb__actions">

          {/* ── Quick Actions (logged in) ── */}
          {activeUser && (
            <div ref={actionsRef} className="nb__quick-wrap">
              <button
                className={`nb__action-btn ${actionsOpen ? 'nb__action-btn--open' : ''}`}
                onClick={() => setActionsOpen(!actionsOpen)}
                title="Acciones rápidas"
              >
                <i className="bx bx-plus"></i>
              </button>

              {actionsOpen && (
                <div className="nb__quick-dropdown">
                  <span className="nb__quick-label">Crear nuevo</span>
                  {QUICK_ACTIONS.map((action) => (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="nb__quick-item"
                      onClick={() => setActionsOpen(false)}
                    >
                      <div className="nb__quick-item-icon" style={{ '--qa-color': action.color }}>
                        <i className={`bx ${action.icon}`}></i>
                      </div>
                      <span>{action.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Chat ── */}
          {activeUser && (
            <button
              className="nb__icon-btn"
              onClick={() => navigate('/chats')}
              title="Mensajes"
            >
              <i className="bx bx-message-rounded-dots"></i>
            </button>
          )}

          {/* ── Notifications ── */}
          <button
            className="nb__icon-btn"
            onClick={() => navigate('/notifications')}
            title="Notificaciones"
          >
            <i className="bx bx-bell"></i>
            {activeUser && hasUnread && (
              <span className="nb__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {/* ── Clock HUD (desktop only) ── */}
          <div className="nb__clock">
            <i className="bx bx-time-five"></i>
            <span>{timeString}</span>
          </div>

          {/* ── Divider ── */}
          <div className="nb__divider" />

          {/* ── Profile / Auth ── */}
          {activeUser ? (
            <div ref={profileRef} className="nb__profile-wrap">
              <button
                className={`nb__avatar-btn ${profileOpen ? 'nb__avatar-btn--open' : ''}`}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className={`nb__avatar-ring nb__status--${activeUser.status || 'online'}`}>
                  <img
                    src={activeUser.avatar || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=warrior&backgroundColor=1a1a2e'}
                    alt="Avatar"
                    className="nb__avatar"
                  />
                  <span className={`nb__avatar-status nb__si--${activeUser.status || 'online'}`}>
                    {(() => {
                      const st = STATUS_LIST.find(s => s.id === (activeUser.status || 'online'));
                      return st?.icon ? <i className={`bx ${st.icon}`}></i> : null;
                    })()}
                  </span>
                </div>
                <div className="nb__avatar-info">
                  <span className="nb__avatar-name">{activeUser.username || activeUser.name}</span>
                  <span className={`nb__avatar-role nb__role--${activeUser.status || 'online'}`}>
                    <span className={`nb__avatar-role-dot nb__rd--${activeUser.status || 'online'}`} />
                    {STATUS_LIST.find(s => s.id === (activeUser.status || 'online'))?.label || 'En Línea'}
                  </span>
                </div>
                <i className={`bx bx-chevron-down nb__avatar-arrow ${profileOpen ? 'nb__avatar-arrow--open' : ''}`}></i>
              </button>

              {/* Profile Dropdown */}
              {profileOpen && (
                <div className="nb__dropdown">
                  <div className="nb__dropdown-header">
                    <img
                      src={activeUser.avatar || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=warrior&backgroundColor=1a1a2e'}
                      alt=""
                      className="nb__dropdown-avatar"
                    />
                    <div>
                      <div className="nb__dropdown-name">{activeUser.username || activeUser.name}</div>
                      <div className="nb__dropdown-email">{activeUser.email || 'Jugador'}</div>
                    </div>
                  </div>

                  <div className="nb__dropdown-sep" />

                  <Link to="/profile" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-user"></i> Mi Perfil
                  </Link>
                  <Link to="/edit-profile" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-edit-alt"></i> Editar Perfil
                  </Link>
                  <Link to="/settings" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-cog"></i> Configuración
                  </Link>
                  <Link to="/CalendarPage" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-calendar"></i> Calendario
                  </Link>

                  <div className="nb__dropdown-sep" />

                  <button className="nb__dropdown-item nb__dropdown-item--danger" onClick={handleLogout}>
                    <i className="bx bx-log-out"></i> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nb__auth">
              <Link to="/login" className="nb__auth-login">Ingresar</Link>
              <Link to="/register" className="nb__auth-register">
                <i className="bx bx-rocket"></i> Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;