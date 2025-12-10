import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

// Imagen lateral (Asegúrate de que la ruta sea correcta)
import sideImage from '../../assets/images/login-bg.jpg'; 

const Login = () => {
  const navigate = useNavigate();
  
  // ESTADOS PARA LA LÓGICA DE UI
  const [showPassword, setShowPassword] = useState(false); // Ver/Ocultar pass
  const [rememberMe, setRememberMe] = useState(false);     // Checkbox

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulación de login
    const fakeUser = { id: 1, name: "GamerPro", avatar: "..." };
    
    if(rememberMe) {
        localStorage.setItem('esportefyUser', JSON.stringify(fakeUser));
    } else {
        sessionStorage.setItem('esportefyUser', JSON.stringify(fakeUser));
    }
    
    navigate('/');
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
                        <input type="email" placeholder="usuario@team.com" required />
                        <i className='bx bx-envelope'></i>
                    </div>
                </div>

                <div className="input-row">
                    <div className="input-wrapper">
                        <label>Contraseña</label>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
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