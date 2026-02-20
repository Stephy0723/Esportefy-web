import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import logoWhite from '../../assets/Logo/logo-white.png';
import logoBlack from '../../assets/Logo/logo-black.png';

const LINKS = {
  plataforma: [
    { label: 'Torneos', to: '/torneos' },
    { label: 'Equipos', to: '/equipos' },
    { label: 'Comunidad', to: '/comunidad' },
    { label: 'Rankings', to: '/rankings' },
    { label: 'Universidad', to: '/university' },
  ],
  soporte: [
    { label: 'Centro de Ayuda', to: '/support' },
    { label: 'Reportar un Bug', to: '/settings' },
    { label: 'Contacto', href: 'mailto:soporte@esportefy.com' },
  ],
  legal: [
    { label: 'T\u00e9rminos y Condiciones', to: '/legal/terms' },
    { label: 'Pol\u00edtica de Privacidad', to: '/legal/privacy' },
    { label: 'Pol\u00edtica de Pagos', to: '/legal/payment-policy' },
    { label: 'T\u00e9rminos de Organizador', to: '/legal/organizer-terms' },
  ],
};

const SOCIALS = [
  { icon: 'bxl-discord-alt', href: '#', label: 'Discord' },
  { icon: 'bxl-twitch', href: 'https://twitch.tv', label: 'Twitch' },
  { icon: 'bxl-youtube', href: 'https://youtube.com', label: 'YouTube' },
  { icon: 'bxl-twitter', href: '#', label: 'Twitter / X' },
  { icon: 'bxl-instagram', href: '#', label: 'Instagram' },
];

const Footer = () => {
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();
  const logo = isDarkMode ? logoWhite : logoBlack;

  return (
    <footer className="relative bg-[var(--bg-card)] border-t border-[var(--border-color)] pt-16 pb-8 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Esportefy" className="h-10 w-auto" />
              <span className="text-[var(--text-main)] text-xl font-bold tracking-wider">
                ESPORTEFY
              </span>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 max-w-xs">
              La plataforma definitiva para gestionar tu carrera en los eSports.
              Torneos, equipos y comunidad en un solo lugar.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] hover:bg-[var(--primary-dim)] transition-all duration-300"
                >
                  <i className={`bx ${social.icon} text-lg`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Plataforma column */}
          <div>
            <h4 className="text-[var(--text-main)] font-bold text-sm uppercase tracking-wider mb-5">
              Plataforma
            </h4>
            <ul className="space-y-3">
              {LINKS.plataforma.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[var(--text-muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Soporte column */}
          <div>
            <h4 className="text-[var(--text-main)] font-bold text-sm uppercase tracking-wider mb-5">
              Soporte
            </h4>
            <ul className="space-y-3">
              {LINKS.soporte.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-[var(--text-muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-[var(--text-muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal column */}
          <div>
            <h4 className="text-[var(--text-main)] font-bold text-sm uppercase tracking-wider mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {LINKS.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-[var(--text-muted)] text-sm hover:text-[var(--primary)] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--text-muted)] text-xs">
            &copy; {currentYear} Esportefy. Todos los derechos reservados.
            Desarrollado por <span className="font-semibold text-[var(--text-main)]">Steliant</span>.
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            Hecho con <span className="text-[var(--primary)]">&hearts;</span> para la comunidad gamer latinos
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
