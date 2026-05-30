import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { API_URL } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { STATUS_LIST } from '../../data/defaultAvatars';
import { applyImageFallback, getBotAvatarFallback, resolveMediaUrl } from '../../utils/media';
import './Navbar.css';

/* ── Route → translation key map ── */
const ROUTE_KEYS = {
  '/': 'home',
  '/dashboard': 'dashboard',
  '/torneos': 'tournaments',
  '/tournaments': 'tournaments',
  '/equipos': 'teams',
  '/comunidad': 'community',
  '/friends': 'friends',
  '/amigos': 'friends',
  '/rankings': 'rankings',
  '/noticias': 'news',
  '/chats': 'messages',
  '/tv': 'tv',
  '/settings': 'settings',
  '/notifications': 'notifications',
  '/profile': 'profile',
  '/edit-profile': 'editProfile',
  '/create-team': 'createTeam',
  '/create-tournament': 'createTournament',
  '/CalendarPage': 'calendar',
  '/university': 'university',
  '/docs': 'docs',
  '/support': 'support',
  '/glitchgang': 'glitchgang',
};

/* ── Quick Actions (keys resolved at render) ── */
const QUICK_ACTIONS = [
  { key: 'createTournament', to: '/create-tournament', icon: 'bx-plus-circle', color: '#FFD700' },
  { key: 'createTeam', to: '/create-team', icon: 'bx-group', color: '#4FACFE' },
];

const Navbar = ({ onMenuToggle, isSidebarOpen }) => {
  const [scrolled, setScrolled] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const navigate = useNavigate();
  const location = useLocation();
  const { user: activeUser, logout } = useAuth();
  const { lang, toggleLang, t } = useLang();
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const actionsRef = useRef(null);
  const searchInputRef = useRef(null);
  const avatarFallback = getBotAvatarFallback(activeUser?.username || activeUser?.name || 'player');

  /* ── Breadcrumb from current route ── */
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    const key = ROUTE_KEYS[path];
    if (key) return t(key);
    if (path.startsWith('/game/')) {
      const game = path.split('/game/')[1];
      return game ? game.charAt(0).toUpperCase() + game.slice(1) : t('game');
    }
    if (path.startsWith('/legal/')) return 'Legal';
    return null;
  }, [location.pathname, t]);

  /* ── Check notifications ── */
  const checkNotifications = useCallback(async () => {
    if (!activeUser) { setHasUnread(false); setUnreadCount(0); return; }
    try {
      const res = await fetch(`${API_URL}/api/notifications`, { credentials: 'include' });
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
  }, [activeUser]);

  /* ── Clock tick ── */
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  /* ── Bootstrap ── */
  useEffect(() => {
    const bootstrapId = window.setTimeout(() => { void checkNotifications(); }, 0);
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('user-update', checkNotifications);
    const notifTimer = setInterval(checkNotifications, 60000);
    return () => {
      window.clearTimeout(bootstrapId);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('user-update', checkNotifications);
      clearInterval(notifTimer);
    };
  }, [checkNotifications]);

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
    const frameId = window.requestAnimationFrame(() => {
      setProfileOpen(false);
      setSearchFocused(false);
      setActionsOpen(false);
    });
    return () => window.cancelAnimationFrame(frameId);
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

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/comunidad?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      setSearchQuery('');
    }
  };

  const userStatusLabel = t(`status_${activeUser?.status || 'online'}`);
  const timeString = currentTime.toLocaleTimeString(lang === 'en' ? 'en' : 'es', { hour: '2-digit', minute: '2-digit' });

  return (
    <nav className={`nb ${scrolled ? 'nb--scrolled' : ''} ${activeUser ? 'nb--authed' : 'nb--guest'}`}>
      <div className="nb__inner">

        {/* ═══ LEFT: Menu + Logo + Breadcrumb ═══ */}
        <div className="nb__left">
          {onMenuToggle && (
            <button
              className={`nb__menu-btn ${isSidebarOpen ? 'nb__menu-btn--open' : ''}`}
              onClick={onMenuToggle}
              aria-label="Menu"
            >
              <i className={`bx ${isSidebarOpen ? 'bx-x' : 'bx-menu'}`}></i>
            </button>
          )}
          <Link to={activeUser ? '/dashboard' : '/'} className="nb__logo">
            <span className="nb__logo-text">
              GLITCH{' '}<span className="nb__logo-accent">GANG</span>
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
              placeholder={t('searchPlaceholder')}
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

          {searchFocused && (
            <div className="nb__cmdbar-overlay">
              <div className="nb__cmdbar-section">
                <span className="nb__cmdbar-section-label">{t('quickAccess')}</span>
                <Link to="/torneos" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-trophy"></i>
                  <span>{t('activeTournaments')}</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                <Link to="/rankings" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-bar-chart-alt-2"></i>
                  <span>{t('globalRankings')}</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                <Link to="/noticias" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-news"></i>
                  <span>{t('esportsNews')}</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                <Link to="/comunidad" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                  <i className="bx bx-world"></i>
                  <span>{t('exploreCommunities')}</span>
                  <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                </Link>
                {activeUser && (
                  <Link to="/friends" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                    <i className="bx bx-user-plus"></i>
                    <span>{t('friendsCenter')}</span>
                    <i className="bx bx-right-arrow-alt nb__cmdbar-link-arrow"></i>
                  </Link>
                )}
                {activeUser && (
                  <Link to="/chats" className="nb__cmdbar-link" onClick={() => setSearchFocused(false)}>
                    <i className="bx bx-message-rounded-dots"></i>
                    <span>{t('goToMessages')}</span>
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
                title={t('createNew')}
              >
                <i className="bx bx-plus"></i>
              </button>

              {actionsOpen && (
                <div className="nb__quick-dropdown">
                  <span className="nb__quick-label">{t('createNew')}</span>
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
                      <span>{t(action.key)}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Rankings ── */}
          <button
            className="nb__icon-btn nb__icon-btn--secondary"
            onClick={() => navigate('/rankings')}
            title={t('rankings')}
          >
            <i className="bx bx-trophy"></i>
          </button>

          {/* ── Noticias ── */}
          <button
            className="nb__icon-btn nb__icon-btn--secondary"
            onClick={() => navigate('/noticias')}
            title={t('news')}
          >
            <i className="bx bx-news"></i>
          </button>

          {/* ── Notifications ── */}
          {activeUser && (
            <button
              className="nb__icon-btn"
              onClick={() => navigate('/notifications')}
              title={t('notifications')}
            >
              <i className="bx bx-bell"></i>
              {hasUnread && (
                <span className="nb__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          )}

          {/* ── Language toggle ── */}
          <button
            className="nb__lang-btn"
            onClick={toggleLang}
            title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
          >
            <i className="bx bx-globe"></i>
            <span>{lang === 'es' ? 'ES' : 'EN'}</span>
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
                    src={resolveMediaUrl(activeUser.avatar) || avatarFallback}
                    alt="Avatar"
                    className="nb__avatar"
                    onError={(e) => applyImageFallback(e, avatarFallback)}
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
                    {userStatusLabel}
                  </span>
                </div>
                <i className={`bx bx-chevron-down nb__avatar-arrow ${profileOpen ? 'nb__avatar-arrow--open' : ''}`}></i>
              </button>

              {profileOpen && (
                <div className="nb__dropdown">
                  <div className="nb__dropdown-header">
                    <img
                      src={resolveMediaUrl(activeUser.avatar) || avatarFallback}
                      alt=""
                      className="nb__dropdown-avatar"
                      onError={(e) => applyImageFallback(e, avatarFallback)}
                    />
                    <div>
                      <div className="nb__dropdown-name">{activeUser.username || activeUser.name}</div>
                      <div className="nb__dropdown-email">{activeUser.email || t('player')}</div>
                    </div>
                  </div>

                  <div className="nb__dropdown-sep" />

                  <Link to="/profile" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-user"></i> {t('profile')}
                  </Link>
                  <Link to="/edit-profile" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-edit-alt"></i> {t('editProfile')}
                  </Link>
                  <Link to="/settings" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-cog"></i> {t('configuration')}
                  </Link>
                  <Link to="/CalendarPage" className="nb__dropdown-item" onClick={() => setProfileOpen(false)}>
                    <i className="bx bx-calendar"></i> {t('calendar')}
                  </Link>

                  {activeUser?.isAdmin && (
                    <>
                      <div className="nb__dropdown-sep" />
                      <Link to="/admin" className="nb__dropdown-item nb__dropdown-item--admin" onClick={() => setProfileOpen(false)}>
                        <i className="bx bx-shield-quarter"></i> {t('adminPanel')}
                      </Link>
                    </>
                  )}

                  <div className="nb__dropdown-sep" />

                  <button className="nb__dropdown-item nb__dropdown-item--danger" onClick={handleLogout}>
                    <i className="bx bx-log-out"></i> {t('logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="nb__auth">
              <Link to="/login" className="nb__auth-login">{t('login')}</Link>
              <Link to="/register" className="nb__auth-register">
                <i className="bx bx-rocket"></i> {t('register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
