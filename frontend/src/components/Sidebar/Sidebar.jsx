import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getStoredUser } from '../../utils/authSession';
import { resolveMediaUrl } from '../../utils/media';
import { STATUS_LIST } from '../../data/defaultAvatars';


import logoWhite from '../../assets/Logo/logo-white.png';
import logoBlack from '../../assets/Logo/logo-black.png';

/* ─── Definición de rutas del menú ─── */
const MAIN_LINKS = [
  { to: '/dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
  { to: '/torneos', icon: 'bx-trophy', label: 'Torneos' },
  { to: '/equipos', icon: 'bx-group', label: 'Equipos' },
  { to: '/tv', icon: 'bx-movie-play', label: 'GLITCH GANG TV' },
];

const MOBILE_EXTRA_LINKS = [
  { to: '/profile', icon: 'bx-user', label: 'Mi Perfil' },
  { to: '/notifications', icon: 'bx-bell', label: 'Notificaciones' },
];

const EXTRA_LINKS = [
  { to: '/comunidad', icon: 'bx-world', label: 'Comunidad', section: 'SOCIAL' },
  { to: '/friends', icon: 'bx-user-plus', label: 'Amigos' },
  { to: '/chats', icon: 'bx-chat', label: 'Chats' },
  { to: '/noticias', icon: 'bx-news', label: 'Noticias' },
  { to: '/profile', icon: 'bx-user', label: 'Mi Perfil', section: 'PERSONAL' },
  { to: '/notifications', icon: 'bx-bell', label: 'Notificaciones' },
  { to: '/settings', icon: 'bx-cog', label: 'Ajustes', section: 'CONFIG' },
  { to: '/glitchgang', icon: 'bx-info-circle', label: 'GLITCH GANG', section: 'MARCA' },
];

const SOCIALS = [
  { href: 'https://twitch.tv/glitchgang', icon: 'bxl-twitch', cls: 'twitch' },
  { href: 'https://youtube.com/@glitchgang', icon: 'bxl-youtube', cls: 'youtube' },
  { href: 'https://facebook.com/glitchgang', icon: 'bxl-facebook', cls: 'facebook' },
  { href: 'https://discord.gg/glitchgang', icon: 'bxl-discord-alt', cls: 'discord' },
];

const Sidebar = ({ isClosed, setIsClosed }) => {
  const { theme, setTheme, isDarkMode } = useTheme();
  const { logout } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [user, setUser] = useState(null);
  const sidebarRef = useRef(null);

  /* Leer usuario de localStorage */
  useEffect(() => {
    const loadUser = () => {
      try {
        setUser(getStoredUser());
      } catch { setUser(null); }
    };
    loadUser();
    window.addEventListener('user-update', loadUser);
    return () => window.removeEventListener('user-update', loadUser);
  }, []);

  /* Cerrar al hacer clic fuera */
  useEffect(() => {
    const handler = (e) => {
      if (!isClosed && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setIsClosed(true);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isClosed, setIsClosed]);

  const openIfClosed = () => { if (isClosed) setIsClosed(false); };
  const handleLogout = async (event) => {
    event.stopPropagation();
    await logout();
  };

  /* Helper: ¿esta ruta está activa? */
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  /* ─── Render de un link individual ─── */
  const renderLink = ({ to, icon, label }) => (
    <li key={to} className={`sb-item ${isActive(to) ? 'sb-active' : ''}`}>
      <Link to={to} data-tooltip={label}>
        <div className="sb-icon-wrap">
          <i className={`bx ${icon}`} />
          {isActive(to) && <span className="sb-active-dot" />}
        </div>
        <span className="sb-label">{label}</span>
      </Link>
    </li>
  );


  return (
    <>
      <nav
        className={`sidebar ${isClosed ? 'close' : ''}`}
        ref={sidebarRef}
        onClick={openIfClosed}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <header className="sb-header">
          <div className="sb-logo-row">
            <div className="sb-logo-frame">
              <img
                src={isDarkMode ? logoWhite : logoBlack}
                alt="GLITCH GANG"
                className="sb-logo-img"
              />
            </div>
            {!isClosed && (
              <div className="sb-brand-text">
                <span className="sb-brand-name">GLITCH{' '}<span className="sb-brand-accent">GANG</span></span>
                <span className="sb-brand-sub">Pro Gaming</span>
              </div>
            )}
          </div>
          {/* Línea decorativa under header */}
          <div className="sb-header-line" />
        </header>

        {/* ═══════════ MENÚ PRINCIPAL ═══════════ */}
        <div className="sb-scroll-area">
          <div className="sb-section">
            {!isClosed && <p className="sb-section-title">MENÚ</p>}
            <ul className="sb-list">
              {MAIN_LINKS.map(renderLink)}
              {user?.isAdmin && renderLink({ to: '/admin', icon: 'bx-shield-quarter', label: 'Admin' })}
            </ul>
            <ul className="sb-list sb-mobile-only">
              {MOBILE_EXTRA_LINKS.map(renderLink)}
            </ul>
          </div>

          {/* ═══════════ EXPAND TOGGLE ═══════════ */}
          <button
            className="sb-expand-btn"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <i className={`bx bx-chevron-${expanded ? 'up' : 'down'} sb-expand-icon`} />
            {!isClosed && (
              <span className="sb-expand-text">
                {expanded ? 'Menos' : 'Más'}
              </span>
            )}
          </button>

          {/* ═══════════ SECCIONES EXPANDIBLES ═══════════ */}
          {expanded && (
            <div className="sb-expanded">
              {(() => {
                let currentSection = '';
                return EXTRA_LINKS.map((link) => {
                  const showHeader = link.section && link.section !== currentSection;
                  if (link.section) currentSection = link.section;
                  return (
                    <React.Fragment key={link.to}>
                      {showHeader && !isClosed && (
                        <p className="sb-section-title">{link.section}</p>
                      )}
                      <ul className="sb-list">{renderLink(link)}</ul>
                    </React.Fragment>
                  );
                });
              })()}

              {/* Redes sociales */}
              {!isClosed && (
                <div className="sb-socials">
                  <p className="sb-section-title">SÍGUENOS</p>
                  <div className="sb-socials-row">
                    {SOCIALS.map((s) => (
                      <a
                        key={s.cls}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`sb-social-icon ${s.cls}`}
                      >
                        <i className={`bx ${s.icon}`} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════ FOOTER ═══════════ */}
        <div className="sb-footer">
          <div className="sb-footer-line" />

          {/* Perfil del usuario */}
          {user && (
            <Link to="/profile" className="sb-profile" data-tooltip={user.username || user.name}>
              <div className="sb-profile__avatar-wrap">
                <img
                  src={resolveMediaUrl(user.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=1a1a2e&color=8EDB15`}
                  alt=""
                  className="sb-profile__avatar"
                />
                <span className={`sb-profile__status sb-profile__status--${user.status || 'online'}`} />
              </div>
              {!isClosed && (
                <div className="sb-profile__info">
                  <span className="sb-profile__name">{user.username || user.name || 'Jugador'}</span>
                  <span className={`sb-profile__role sb-profile__role--${user.status || 'online'}`}>
                    {STATUS_LIST.find(s => s.id === (user.status || 'online'))?.label || 'En Línea'}
                  </span>
                </div>
              )}
            </Link>
          )}

          {/* Cerrar sesión */}
          {user && (
            <button type="button" className="sb-logout" onClick={handleLogout}>
              <i className="bx bx-log-out" />
              <span className="sb-label">Cerrar Sesión</span>
            </button>
          )}

          {/* ─── THEME PICKER (2 grupos × 2 opciones) ─── */}
          {!isClosed ? (
            <div className="sb-theme-picker">
              {/* Grupo oscuro: Dark ↔ AMOLED */}
              <div className="sb-theme-group">
                <button
                  className={`sb-theme-btn ${theme === THEMES.DARK ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme(THEMES.DARK); }}
                  title="Dark"
                >
                  <span className="sb-swatch sb-swatch-dark" />
                  <span className="sb-theme-name">Dark</span>
                </button>
                <button
                  className={`sb-theme-btn ${theme === THEMES.AMOLED ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme(THEMES.AMOLED); }}
                  title="AMOLED"
                >
                  <span className="sb-swatch sb-swatch-amoled" />
                  <span className="sb-theme-name">AMOLED</span>
                </button>
              </div>

              {/* Separador vertical */}
              <div className="sb-theme-divider" />

              {/* Grupo claro: Light ↔ Gray */}
              <div className="sb-theme-group">
                <button
                  className={`sb-theme-btn ${theme === THEMES.LIGHT ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme(THEMES.LIGHT); }}
                  title="Light"
                >
                  <span className="sb-swatch sb-swatch-light" />
                  <span className="sb-theme-name">Light</span>
                </button>
                <button
                  className={`sb-theme-btn ${theme === THEMES.GRAY ? 'active' : ''}`}
                  onClick={(e) => { e.stopPropagation(); setTheme(THEMES.GRAY); }}
                  title="Gray"
                >
                  <span className="sb-swatch sb-swatch-gray" />
                  <span className="sb-theme-name">Gray</span>
                </button>
              </div>
            </div>
          ) : (
            /* Colapsado: solo un icono de paleta */
            <button
              className="sb-theme-icon-only"
              onClick={(e) => { e.stopPropagation(); setIsClosed(false); }}
              title="Cambiar tema"
            >
              <i className="bx bx-palette" />
            </button>
          )}

          {/* Crédito */}
          {!isClosed && (
            <div className="sb-credit">
              By <strong>Steliant</strong>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Sidebar;
