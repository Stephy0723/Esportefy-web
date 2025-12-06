import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import videoBg from '../../assets/video/inicio.mp4'; 

const Login = () => {
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // --- SIMULACIÓN DE LOGIN EXITOSO ---
    console.log("Iniciando sesión...");

    // 1. Creamos un usuario falso (esto vendría de tu base de datos real)
    const fakeUser = {
      id: 1,
      name: "GamerPro_99",
      avatar: "https://i.pravatar.cc/150?img=52" // Una foto de robot/gamer aleatoria
    };

    // 2. Guardamos este usuario en la memoria del navegador (localStorage)
    // Esto funciona como una "cookie" para recordar que está logueado.
    localStorage.setItem('esportefyUser', JSON.stringify(fakeUser));

    // 3. Redirigimos al Home
    navigate('/');
    // Opcional: Recargar la página para que el Navbar detecte el cambio inmediatamente si es necesario
    // window.location.reload(); 
  };

  return (
    <div className="auth-container">
      <video src={videoBg} autoPlay muted loop className="auth-bg-video" />
      <div className="auth-box">
        <Link to="/" className="close-btn"><i className='bx bx-x'></i></Link>
        <div className="auth-header">
          <i className='bx bx-joystick bx-tada'></i>
          <h2>Bienvenido</h2>
          <p>Inicia sesión para continuar tu legado.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Correo Electrónico</label>
            <i className='bx bx-envelope'></i>
            <input type="email" placeholder="usuario@ejemplo.com" className="input-field" required />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <i className='bx bx-lock-alt'></i>
            <input type="password" placeholder="••••••••" className="input-field" required />
          </div>
          <div className="options-row">
            <div className="remember-me">
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Recordar contraseña</label>
            </div>
            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>
          <button type="submit" className="auth-btn">Entrar</button>
        </form>
        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;