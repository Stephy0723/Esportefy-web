import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// Imagen lateral (Asegúrate de que la ruta sea correcta)
import sideImage from '../../assets/images/login-bg.jpg'; 

const Login = () => {
  const navigate = useNavigate();
  
  // ESTADOS PARA LA LÓGICA DE UI
  const [showPassword, setShowPassword] = useState(false); // Ver/Ocultar pass
  const [rememberMe, setRememberMe] = useState(false);     // Checkbox
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
            // 3. Petición POST al endpoint del backend
            const response = await axios.post('http://localhost:4000/api/auth/login', {
                email,
                password
            });

            // 4. Si el login es exitoso, guardamos el token
            const { token, user } = response.data;
            
            if (rememberMe) {
                localStorage.setItem('token', token);
                localStorage.setItem('esportefyUser', JSON.stringify(user));
            } else {
                sessionStorage.setItem('token', token);
                sessionStorage.setItem('esportefyUser', JSON.stringify(user));
            }

            // 5. Redirigir al inicio o dashboard
            navigate('/');
            
        } catch (err) {
            // Capturar errores del backend (ej: "Usuario no encontrado")
            const message = err.response?.data?.message || 'Error al conectar con el servidor';
            setError(message);
        }
    };

  return (
    <div className="auth-container-split">
      
      {/* SECCIÓN IZQUIERDA: FORMULARIO */}
      <div className="auth-left">
        <div className="auth-nav">
            <span className="brand">ESPORTEFY<span className="dot">.</span></span>
            <div className="nav-links">
                <Link to="/">Inicio</Link>
                <Link to="/register" className="active">Unirse</Link>
            </div>
        </div>

        <div className="auth-content">
            {/* TEXTOS PROFESIONALES GAMING */}
            <div className="header-text">
                <span className="badge-pro">PRO ACCESS</span>
                <h1>Bienvenido<br/>de nuevo<span className="dot">.</span></h1>
                <p className="subtitle">Gestiona tus torneos. Domina la arena.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="input-row">
                    <div className="input-wrapper">
                        <label>Email Profesional</label>
                        <input 
                            type="email" 
                            placeholder="usuario@team.com" 
                            value={email}                       
                            onChange={(e) => setEmail(e.target.value)}
                            autocomplete="email"
                            required 
                        />
                        <i className='bx bx-envelope'></i>

                    </div>
                </div>

                <div className="input-row">
                    <div className="input-wrapper">
                        <label>Contraseña</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            value={password}                  
                            onChange={(e) => setPassword(e.target.value)} 
                            autocomplete="current-password"
                            required 
                        />
                        {/* ICONO DEL OJO FUNCIONAL */}
                        <i 
                            className={`bx ${showPassword ? 'bx-show' : 'bx-hide'} toggle-pass`}
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? "Ocultar" : "Mostrar"}
                        ></i>
                    </div>
                </div>

                {/* FILA DE OPCIONES (CHECKBOX Y OLVIDÉ CONTRASEÑA) */}
                <div className="options-row">
                    <label className="remember-me">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Mantener sesión iniciada</span>
                    </label>
                    <Link to="/forgot" className="forgot-link">¿Recuperar cuenta?</Link>
                </div>

                <div className="form-actions">
                    {/* BOTÓN ÚNICO Y POTENTE */}
                    <button type="submit" className="btn-primary">ACCEDER A LA PLATAFORMA</button>
                </div>
                
                <p className="footer-text">
                    ¿Aún no tienes equipo? <Link to="/register">Crea tu cuenta de jugador</Link>
                </p>
            </form>
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div className="auth-right">
        <div className="image-overlay"></div>
        <img src={sideImage} alt="Esports Arena" />
      </div>

    </div>
  );
};

export default Login;