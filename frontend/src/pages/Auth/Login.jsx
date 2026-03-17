import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { persistAuthSession } from '../../utils/authSession';
import { getGameIdFromRoutePath, joinGameHub } from '../menu/Community/gameHub.service';
import './Login.css'; 

// 1. IMPORTAR CONTEXTO DE TEMA
import { useTheme } from '../../context/ThemeContext'; 

// 2. IMPORTAR AMBAS IMÁGENES
import bgWhite from '../../assets/images/login-black.png'; 
import bgBlack from '../../assets/images/login-white.png';





const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 3. OBTENER EL VALOR DEL TEMA (isDarkMode)
  const { isDarkMode } = useTheme(); 
  // 2FA STATES
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState(null);

  // ESTADOS
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
                token: twoFactorToken
            });

            if (response.data.verified) {
                const { user, token } = response.data;
                
                persistAuthSession({
                    user,
                    token: token || 'cookie-session',
                    rememberMe
                });
                
                window.dispatchEvent(new Event('user-update'));
                
                if (pendingGameJoinId) {
                    try { await joinGameHub(pendingGameJoinId); } catch (_) {}
                }

                if (redirectPath) {
                    navigate(redirectPath, { replace: true });
                } else {
                    navigate('/dashboard');
                }
                return;
            } else {
                setError('Código de verificación incorrecto.');
                setSubmitting(false);
                return;
            }
        }

        const endpointCandidates = [
            `${API_URL}/api/auth/login`,
            `${API_URL}/auth/login`,
            `${API_URL}/login`
        ];

        let response = null;
        let lastError = null;
        for (const endpoint of endpointCandidates) {
            try {
                response = await axios.post(endpoint, {
                    email,
                    password,
                    rememberMe,
                    twoFactorCode: twoFactorToken // Enviar código si ya lo tiene
                }, {
                    timeout: 15000
                });
                break;
            } catch (candidateError) {
                const status = Number(candidateError?.response?.status || 0);
                lastError = candidateError;
                if (status === 404) continue;
                throw candidateError;
            }
        }

        if (!response) throw lastError || new Error('No se encontró endpoint de login');

        // Handle 2FA Requirement
        if (response.data.requiresTwoFactor) {
            setRequiresTwoFactor(true);
            setTwoFactorUserId(response.data.userId);
            setSubmitting(false);
            setError('Se requiere autenticación de dos factores. Por favor, introduce el código.');
            return;
        }

        const { user, token, session } = response.data || {};
        const hasSession = Boolean(token) || Boolean(session);
        if (!user || !hasSession) {
            throw new Error('Respuesta de login inválida');
        }
        
        // Persistencia unificada de sesión (remember me => localStorage, caso contrario => sessionStorage)
        persistAuthSession({
            user,
            token: token || 'cookie-session',
            rememberMe
        });
        
        window.dispatchEvent(new Event('user-update'));

        if (pendingGameJoinId) {
            try {
                await joinGameHub(pendingGameJoinId);
            } catch (_) {
                // If the join fails, we still allow login to complete.
            }
        }

        if (redirectPath) {
            navigate(redirectPath, { replace: true });
            return;
        }

        navigate('/dashboard');

    } catch (err) {
        const isTimeout = err.code === 'ECONNABORTED';
        const message = err.response?.data?.message
            || (isTimeout ? 'El servidor tardó demasiado en responder. Revisa backend y MongoDB.' : '')
            || err.message
            || 'Error al conectar con el servidor';
        setError(message);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    // 4. AGREGAR CLASE 'light-mode' SI NO ES MODO OSCURO (Para el formulario)
    <div className={`auth-container-split auth-container-split--login ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="auth-left">
        <div className="auth-nav">
      <span className="brand">
          GLITCH GANG<span className="brand-dot">.</span>
            </span>            
            <div className="nav-links">
                <Link to="/">Inicio</Link>
                <Link to="/register" state={location.state} className="active">Unirse</Link>
            </div>
        </div>

        <div className="auth-content">
            {/* TEXTOS */}
            <div className="header-text">
            </div>
        </div>

        <div className="auth-content">
            {/* TEXTOS */}
            <div className="header-text">
                <span className="badge-pro">PRO ACCESS</span>
                <h1>Bienvenido<br/>de nuevo</h1>
                <p className="subtitle">Gestiona tus torneos.</p>
            </div>

            {/* MENSAJE DE ERROR */}
            {error && <div style={{color: '#ff4d4d', marginBottom: '15px', fontSize: '0.9rem'}}>{error}</div>}

            <form onSubmit={handleSubmit}>
                {!requiresTwoFactor ? (
                    <>
                        {/* CAMPO EMAIL */}
                        <div className="input-row">
                            <label>Email Profesional</label>
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

                        {/* CAMPO CONTRASEÑA */}
                        <div className="input-row">
                            <label>Contraseña</label>
                            <div className="input-wrapper">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    value={password}                  
                                    onChange={(e) => setPassword(e.target.value)} 
                                    autoComplete="current-password"
                                    required 
                                />
                                <i 
                                    className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} toggle-pass`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? "Ocultar" : "Mostrar"}
                                ></i>
                            </div>
                        </div>

                        {/* OPCIONES */}
                        <div className="options-row">
                            <label className="remember-me">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span>Mantener sesión iniciada</span>
                            </label>
                            <Link to="/reset-password" className="forgot-link">¿Recuperar cuenta?</Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* CAMPO 2FA */}
                        <div className="input-row">
                            <label>Código de Verificación (2FA)</label>
                            <div className="input-wrapper">
                                <input 
                                    type="text" 
                                    placeholder="000000" 
                                    value={twoFactorToken}                       
                                    onChange={(e) => setTwoFactorToken(e.target.value)}
                                    autoComplete="one-time-code"
                                    required 
                                />
                                <i className='bx bx-shield-quarter'></i>
                            </div>
                            <p style={{fontSize: '0.8rem', color: '#888', marginTop: '5px'}}>
                                Abre tu aplicación de autenticación para obtener el código.
                            </p>
                        </div>
                        
                        <div onClick={() => setRequiresTwoFactor(false)} style={{cursor: 'pointer', color: '#8EDB15', fontSize: '0.9rem', marginBottom: '15px'}}>
                            ← Volver al login normal
                        </div>
                    </>
                )}

                {/* BOTÓN Y FOOTER */}
                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'ACCEDIENDO...' : (requiresTwoFactor ? 'VERIFICAR Y ENTRAR' : 'ACCEDER A LA PLATAFORMA')}
                    </button>
                </div>
                
                <p className="footer-text">
                    ¿Aún no tienes equipo? <Link to="/register" state={location.state}>Crea tu cuenta de jugador</Link>
                </p>
            </form>
             <div className="sidebar-credit">
                    <span className="text">Dev by <strong>Steliant</strong></span>
                </div>
        </div>
      </div>

      {/* SECCIÓN DERECHA: IMAGEN DINÁMICA */}
      <div className="auth-right">
        <div className="image-overlay"></div>
        
        {/* 5. AQUÍ SE CAMBIA LA IMAGEN USANDO LA VARIABLE isDarkMode */}
        <img 
            src={isDarkMode ? bgBlack : bgWhite} 
            alt="Esports Arena Background" 
            className="dynamic-bg"
        />
      </div>
      

    </div>
  );
};

export default Login;
