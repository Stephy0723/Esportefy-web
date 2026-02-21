import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import './Login.css'; 

// 1. IMPORTAR CONTEXTO DE TEMA
import { useTheme } from '../../context/ThemeContext'; 

// 2. IMPORTAR AMBAS IMÁGENES
import bgWhite from '../../assets/images/login-black.png'; 
import bgBlack from '../../assets/images/login-white.png';


const Login = () => {
  const navigate = useNavigate();
  
  // 3. OBTENER EL VALOR DEL TEMA (isDarkMode)
  const { isDarkMode } = useTheme(); 

  // ESTADOS
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(false);     
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                email,
                password
            });

            const { user } = response.data;
            
            // Guardar datos iniciales en localStorage para carga rápida
            // AuthContext sincronizará los datos completos desde /profile vía cookies
            localStorage.setItem('esportefyUser', JSON.stringify(user));
            // Flag de sesión — la auth real va por HttpOnly cookies
            localStorage.setItem('token', 'cookie-session');
            
            window.dispatchEvent(new Event('user-update'));

            navigate('/dashboard');
            
        } catch (err) {
            const message = err.response?.data?.message || 'Error al conectar con el servidor';
            setError(message);
        }
    };

  return (
    // 4. AGREGAR CLASE 'light-mode' SI NO ES MODO OSCURO (Para el formulario)
    <div className={`auth-container-split ${!isDarkMode ? 'light-mode' : ''}`}>
      
      {/* SECCIÓN IZQUIERDA: FORMULARIO */}
      <div className="auth-left">
        <div className="auth-nav">
      <span className="brand">
          ESPORTEFY<span className="brand-dot">.</span>
            </span>            
            <div className="nav-links">
                <Link to="/">Inicio</Link>
                <Link to="/register" className="active">Unirse</Link>
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

                {/* BOTÓN Y FOOTER */}
                <div className="form-actions">
                    <button type="submit" className="btn-primary">ACCEDER A LA PLATAFORMA</button>
                </div>
                
                <p className="footer-text">
                    ¿Aún no tienes equipo? <Link to="/register">Crea tu cuenta de jugador</Link>
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
