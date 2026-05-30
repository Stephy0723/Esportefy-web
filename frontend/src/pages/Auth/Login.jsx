import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { persistAuthSession } from '../../utils/authSession';
import { getGameIdFromRoutePath, joinGameHub } from '../menu/Community/gameHub.service';
import './Login.css';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LanguageContext';
import bgWhite from '../../assets/images/login-black.png';
import bgBlack from '../../assets/images/login-white.png';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { t } = useLang();

  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const redirectTarget = location.state?.from || null;
  const redirectPath = typeof redirectTarget?.pathname === 'string' ? redirectTarget.pathname : '';
  const pendingGameJoinId = getGameIdFromRoutePath(redirectPath);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (requiresTwoFactor) {
        const response = await axios.post(`${API_URL}/api/security/2fa/verify-login`, {
          userId: twoFactorUserId,
          token: twoFactorToken,
        });

        if (response.data.verified) {
          const { user, token } = response.data;
          persistAuthSession({ user, token: token || 'cookie-session', rememberMe });
          window.dispatchEvent(new Event('user-update'));
          if (pendingGameJoinId) { try { await joinGameHub(pendingGameJoinId); } catch (_) {} }
          navigate(redirectPath || '/dashboard', { replace: !!redirectPath });
          return;
        } else {
          setError(t('loginErrorCode'));
          setSubmitting(false);
          return;
        }
      }

      const endpointCandidates = [
        `${API_URL}/api/auth/login`,
        `${API_URL}/auth/login`,
        `${API_URL}/login`,
      ];

      let response = null;
      let lastError = null;
      for (const endpoint of endpointCandidates) {
        try {
          response = await axios.post(endpoint, { email, password, rememberMe, twoFactorCode: twoFactorToken }, { timeout: 15000 });
          break;
        } catch (candidateError) {
          const status = Number(candidateError?.response?.status || 0);
          lastError = candidateError;
          if (status === 404) continue;
          throw candidateError;
        }
      }

      if (!response) throw lastError || new Error(t('loginErrorNotFound'));

      if (response.data.requiresTwoFactor) {
        setRequiresTwoFactor(true);
        setTwoFactorUserId(response.data.userId);
        setSubmitting(false);
        setError(t('loginError2faRequired'));
        return;
      }

      const { user, token, session } = response.data || {};
      const hasSession = Boolean(token) || Boolean(session);
      if (!user || !hasSession) throw new Error(t('loginErrorInvalid'));

      persistAuthSession({ user, token: token || 'cookie-session', rememberMe });
      window.dispatchEvent(new Event('user-update'));

      if (pendingGameJoinId) { try { await joinGameHub(pendingGameJoinId); } catch (_) {} }
      if (redirectPath) { navigate(redirectPath, { replace: true }); return; }
      navigate('/dashboard');
    } catch (err) {
      const isTimeout = err.code === 'ECONNABORTED';
      const message = err.response?.data?.message
        || (isTimeout ? t('loginErrorTimeout') : '')
        || err.message
        || 'Error al conectar con el servidor';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`auth-container-split auth-container-split--login ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="auth-left">
        <div className="auth-nav">
          <span className="brand">GLITCH GANG<span className="brand-dot">.</span></span>
          <div className="nav-links">
            <Link to="/">{t('home')}</Link>
            <Link to="/register" state={location.state} className="active">{t('register')}</Link>
          </div>
        </div>

        <div className="auth-content">
          <div className="header-text" />
        </div>

        <div className="auth-content">
          <div className="header-text">
            <span className="badge-pro">PRO ACCESS</span>
            <h1>{t('loginWelcomeBack')}</h1>
            <p className="subtitle">{t('loginManageTournaments')}</p>
          </div>

          {error && <div className="auth-error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!requiresTwoFactor ? (
              <>
                <div className="input-row">
                  <label>{t('loginEmailLabel')}</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      placeholder="usuario@team.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                    <i className='bx bx-envelope'></i>
                  </div>
                </div>

                <div className="input-row">
                  <label>{t('loginPasswordLabel')}</label>
                  <div className="input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                    <i
                      className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} toggle-pass`}
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? t('loginHidePassword') : t('loginShowPassword')}
                    />
                  </div>
                </div>

                <div className="options-row">
                  <label className="remember-me">
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>{t('loginRememberMe')}</span>
                  </label>
                  <Link to="/reset-password" className="forgot-link">{t('loginForgotPassword')}</Link>
                </div>
              </>
            ) : (
              <>
                <div className="input-row">
                  <label>{t('login2faCodeLabel')}</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFactorToken}
                      onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoComplete="one-time-code"
                      required
                    />
                    <i className='bx bx-shield-quarter'></i>
                  </div>
                  <p className="auth-hint">{t('login2faHint')}</p>
                </div>

                <button
                  type="button"
                  className="auth-back-link"
                  onClick={() => { setRequiresTwoFactor(false); setTwoFactorToken(''); setError(''); }}
                >
                  {t('login2faBack')}
                </button>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? t('loginSubmitting') : (requiresTwoFactor ? t('login2faVerify') : t('loginSubmit'))}
              </button>
            </div>

            <p className="footer-text">
              {t('loginNoAccount')} <Link to="/register" state={location.state}></Link>
            </p>
          </form>

          <div className="sidebar-credit">
            <span className="text">Dev by <strong>Steliant</strong></span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="image-overlay"></div>
        <img src={isDarkMode ? bgBlack : bgWhite} alt="Esports Arena Background" className="dynamic-bg" />
      </div>
    </div>
  );
};

export default Login;
