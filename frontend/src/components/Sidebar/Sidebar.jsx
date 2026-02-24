import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import { useTheme, THEMES } from '../../context/ThemeContext';

import logoWhite from '../../assets/Logo/logo-black.png';
import logoBlack from '../../assets/Logo/logo-white.png';

/* ─── Definición de rutas del menú ─── */
const MAIN_LINKS = [
  { to: '/dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
  { to: '/torneos', icon: 'bx-trophy', label: 'Torneos' },
  { to: '/equipos', icon: 'bx-group', label: 'Equipos' },
  { to: '/tv', icon: 'bx-movie-play', label: 'Esportefy TV' },
];

const EXTRA_LINKS = [
  { to: '/comunidad', icon: 'bx-world', label: 'Comunidad', section: 'SOCIAL' },
  { to: '/chats', icon: 'bx-chat', label: 'Chats' },
  { to: '/settings', icon: 'bx-cog', label: 'Ajustes', section: 'CONFIG' },
  { to: '/perfil', icon: 'bx-user', label: 'Mi Perfil' },
];

const SOCIALS = [
  { href: 'https://twitch.tv', icon: 'bxl-twitch', cls: 'twitch' },
  { href: 'https://youtube.com', icon: 'bxl-youtube', cls: 'youtube' },
  { href: 'https://facebook.com', icon: 'bxl-facebook', cls: 'facebook' },
  { href: '#', icon: 'bxl-discord-alt', cls: 'discord' },
];

const Sidebar = ({ isClosed, setIsClosed }) => {
  const { theme, setTheme, isDarkMode } = useTheme();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const sidebarRef = useRef(null);

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

  /* Helper: ¿esta ruta está activa? */
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  /* ─── Render de un link individual ─── */
  const renderLink = ({ to, icon, label }) => (
    <li key={to} className={`sb-item ${isActive(to) ? 'sb-active' : ''}`}>
      <Link to={to}>
        <div className="sb-icon-wrap">
          <i className={`bx ${icon}`} />
          {isActive(to) && <span className="sb-active-dot" />}
        </div>
        <span className="sb-label">{label}</span>
      </Link>
    </li>
  );

  return (
    <nav
      className={`sidebar ${isClosed ? 'close' : ''}`}
      ref={sidebarRef}
      onClick={openIfClosed}
    >
      {/* ═══════════ HEADER ═══════════ */}
      <header className="sb-header">
        <div className="sb-logo-row">
          <img
            src={isDarkMode ? logoWhite : logoBlack}
            alt="Esportefy"
            className="sb-logo-img"
          />
          {!isClosed && (
            <div className="sb-brand-text">
              <span className="sb-brand-name">ESPORTE<span className="sb-brand-accent">FY</span></span>
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

        {/* Cerrar sesión */}
        <Link to="/login" className="sb-logout">
          <i className="bx bx-log-out" />
          <span className="sb-label">Cerrar Sesión</span>
        </Link>

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
            Dev by <strong>Steliant</strong>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
