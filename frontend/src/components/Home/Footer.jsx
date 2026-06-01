import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import { RIOT_INTEGRATION_ENABLED } from '../../../../shared/riotFeatureFlags.js';
import logoWhite from '../../assets/Logo/logo-white.png';
import logoBlack from '../../assets/Logo/logo-black.png';

const LINKS = (t) => ({
  plataforma: [
    { label: t('footerLinkTournaments'), to: '/torneos' },
    { label: t('footerLinkTeams'), to: '/equipos' },
    { label: t('footerLinkCommunity'), to: '/comunidad' },
    { label: t('footerLinkRankings'), to: '/rankings' },
    { label: t('footerLinkUniversity'), to: '/university' },
  ],
  soporte: [
    { label: t('footerLinkDocs'), to: '/docs' },
    { label: t('footerLinkHelp'), to: '/support' },
    { label: t('footerLinkBug'), to: '/settings' },
    { label: t('footerLinkContact'), href: 'mailto:soporte@glitchgang.net' },
  ],
  legal: [
    { label: t('footerLinkTerms'), to: '/legal/terms' },
    { label: t('footerLinkPrivacy'), to: '/legal/privacy' },
    { label: t('footerLinkPayment'), to: '/legal/payment-policy' },
    { label: t('footerLinkOrganizerTerms'), to: '/legal/organizer-terms' },
  ],
});

const SOCIALS = [
  { icon: 'bxl-discord-alt', href: 'https://discord.gg/ExCguE8e', label: 'Discord' },
  { icon: 'bxl-twitch', href: 'https://www.twitch.tv/glitchgang', label: 'Twitch' },
  { icon: 'bxl-youtube', href: 'https://www.youtube.com/channel/UCAwKJv2zibYYEKJOgWW6F9w', label: 'YouTube' },
  { icon: 'bxl-facebook-circle', href: 'https://www.facebook.com/profile.php?id=61585628084470', label: 'Facebook' },
];

const Footer = () => {
  const { isDarkMode } = useTheme();
  const { t } = useLang();
  const currentYear = new Date().getFullYear();
  const logo = isDarkMode ? logoWhite : logoBlack;
  const links = LINKS(t);
  const supportLinks = RIOT_INTEGRATION_ENABLED
    ? [...links.soporte.slice(0, 1), { label: 'Riot Review', to: '/review/riot' }, ...links.soporte.slice(1)]
    : links.soporte;

  return (
    <footer className="relative bg-[var(--bg-card)] border-t border-[var(--border-color)] pt-16 pb-8 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">

        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center gap-1 md:gap-2">
              <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden md:h-[76px] md:w-[76px]">
                <img
                  src={logo}
                  alt="GLITCH GANG"
                  className="block w-[116px] max-w-none shrink-0 translate-y-[4px] md:w-[128px] md:translate-y-[5px]"
                  width="1536"
                  height="1024"
                  decoding="async"
                />
              </div>
              <div className="flex min-w-0 flex-col justify-center gap-[3px] pb-[1px]">
                <span className="text-[var(--text-main)] text-[1.7rem] md:text-[1.95rem] font-extrabold tracking-[0.1em] leading-none">
                  GLITCH <span className="text-[var(--primary)]">GANG</span>
                </span>
                <span className="text-[var(--text-muted)] text-[11px] uppercase tracking-[0.28em] leading-none">
                  By Steliant
                </span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed mb-6 max-w-xs">
              {t('footerBrandDesc')}
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
              {t('footerColPlatform')}
            </h4>
            <ul className="space-y-3">
              {links.plataforma.map((link) => (
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
              {t('footerColSupport')}
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
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
              {t('footerColLegal')}
            </h4>
            <ul className="space-y-3">
              {links.legal.map((link) => (
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

        <div className="border-t border-[var(--border-color)] pt-6 pb-2">
          <div className="flex flex-col gap-2">
            <p className="text-[var(--text-muted)] text-xs leading-relaxed max-w-5xl">
              {t('footerRiotDisclaimer')}
            </p>
            <p className="text-[var(--text-muted)] text-xs">
              {t('footerLegalNote')}{' '}
              <Link to="/legal/terms" className="text-[var(--primary)] hover:underline">
                {t('footerLinkTerms')}
              </Link>
              {' '}{t('footerLegalAnd')}{' '}
              <Link to="/legal/privacy" className="text-[var(--primary)] hover:underline">
                {t('footerLinkPrivacy')}
              </Link>.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-color)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[var(--text-muted)] text-xs">
            &copy; {currentYear} GLITCH GANG by Steliant. {t('footerAllRights')}
            {t('footerDevelopedBy')} <span className="font-semibold text-[var(--text-main)]">Steliant</span>.
          </p>
          <p className="text-[var(--text-muted)] text-xs">
            {t('footerMadeWith')} <span className="text-[var(--primary)]">&hearts;</span> {t('footerForCommunity')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
