import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';
// 1. IMPORTAR EL CEREBRO DEL TEMA (IGUAL QUE EN SIDEBAR)
import { useTheme } from '../../context/ThemeContext'; 

// 2. IMPORTAR TUS DOS IMÁGENES DE FONDO
import bgWhite from '../../assets/images/login-black.png'; // Imagen Oscura
import bgBlack from '../../assets/images/login-white.png'; // Imagen Clara (Asegúrate que exista con este nombre)

// --- IMPORTACIONES DE JUEGOS ---
import imgLol from '../../assets/gameImages/lol.png';
import imgMlbb from '../../assets/gameImages/mlbb.png';
import imgHok from '../../assets/gameImages/hok.png';
import imgMoco from '../../assets/gameImages/moco.png';
import imgMarvel from '../../assets/gameImages/marvel.png';
import imgFreeFire from '../../assets/gameImages/freefire.png';
import imgFortnite from '../../assets/gameImages/fortnite.png';
import imgCodm from '../../assets/gameImages/codm.png';
import imgMk from '../../assets/gameImages/mk11.png';
import imgMarioKart from '../../assets/gameImages/mariokart.png';

const Register = () => {
  const navigate = useNavigate();
  
  // 3. OBTENER SI ESTÁ EN MODO OSCURO (IGUAL QUE EN SIDEBAR)
  const { isDarkMode } = useTheme();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 

  const [formData, setFormData] = useState({
    fullName: '', phone: '', country: '', birthDate: '',
    selectedGames: [], platforms: [],
    experience: '', goals: [],
    username: '', email: '', password: '', confirmPassword: '',
    checkTerms: false
  });

  // --- FUNCIÓN PARA ENVIAR AL BACKEND ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://76.13.97.163:4000/api/auth/register', formData);
      console.log("Usuario registrado:", response.data);
      alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al procesar el registro';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const list = prev[field];
      return { ...prev, [field]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] };
    });
  };

  const mobaGames = [
    { id: 'lol', name: 'League of Legends', img: imgLol },
    { id: 'mlbb', name: 'Mobile Legends', img: imgMlbb },
    { id: 'Honor of Kings', name: 'Honor of Kings', img: imgHok },
    { id: 'marvel', name: 'Marvel Rivals', img: imgMarvel },
    { id: 'moco', name: 'Mo.co', img: imgMoco },
    { id: 'free fire', name: 'Free Fire', img: imgFreeFire },
    { id: 'fortnite', name: 'Fortnite', img: imgFortnite },
    { id: 'codm', name: 'CoD Mobile', img: imgCodm },
    { id: 'mk11', name: 'Mortal Kombat', img: imgMk },
    { id: 'mariokart', name: 'Mario Kart', img: imgMarioKart }
  ];

  const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
  ];

  return (
    // 4. USAR isDarkMode PARA LA CLASE CSS DEL COLOR DE FONDO
    <div className={`auth-container-split ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="auth-left">
        <div className="auth-nav">
          <span className="brand">ESPORTEFY</span>
          <div className="nav-links">
            <Link to="/login">Ya tengo cuenta</Link>
          </div>
        </div>

        <div className="auth-content register-content">
          <div className="header-text">
            <span className="badge-pro">NUEVO JUGADOR</span>
            <h1>Crea tu Perfil</h1>
          </div>

          <div className="step-indicator">
            {[1, 2, 3, 4].map(num => (
              <div key={num} className={`step-item ${step >= num ? 'active' : ''}`}>
                <div className="step-circle">{num}</div>
                {num < 4 && <div className="step-line"></div>}
              </div>
            ))}
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            
            {/* PASO 1 */}
            {step === 1 && (
              <div className="step-fade-in">
                <h3 className="step-title">Información Real</h3>
                <div className="input-row split">
                  <div className="input-wrapper">
                    <label>Nombre Completo</label>
                    <input type="text" name="fullName" placeholder="Ej: Juan Pérez" value={formData.fullName} onChange={handleChange} />
                    <i className='bx bx-id-card'></i>
                  </div>
                  <div className="input-wrapper">
                    <label>Teléfono</label>
                    <input type="tel" name="phone" placeholder="+57 ..." value={formData.phone} onChange={handleChange} />
                    <i className='bx bxl-whatsapp'></i>
                  </div>
                </div>
                <div className="input-row split">
                  <div className="input-wrapper">
                    <label>País</label>
                    <input type="text" name="country" placeholder="Tu país" value={formData.country} onChange={handleChange} />
                    <i className='bx bx-globe'></i>
                  </div>
                  <div className="input-wrapper">
                    <label>Fecha Nacimiento</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                  </div>
                </div>
                <button type="button" className="btn-primary mt-4" onClick={() => setStep(2)}>Siguiente</button>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <div className="step-fade-in">
                <h3 className="step-title">Elige tu Campo de Batalla</h3>
                <div className="games-grid">
                  {mobaGames.map(game => (
                    <div key={game.id} className={`game-card-pro ${formData.selectedGames.includes(game.id) ? 'selected' : ''}`} onClick={() => toggleSelection('selectedGames', game.id)}>
                      <div className="game-img-wrapper"><img src={game.img} alt={game.name} /></div>
                      <span>{game.name}</span>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Atrás</button>
                  <button type="button" className="btn-primary" onClick={() => setStep(3)}>Siguiente</button>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <div className="step-fade-in">
                <h3 className="step-title">Tu Nivel de Experiencia</h3>
                <div className="levels-row">
                  {[{ id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' }, { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' }, { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }].map((lvl) => (
                    <div key={lvl.id} className={`level-card ${formData.experience === lvl.id ? 'selected' : ''}`} onClick={() => setFormData({...formData, experience: lvl.id})}>
                      <i className={`bx ${lvl.icon} level-icon`}></i>
                      <div className="level-info"><span className="lvl-label">{lvl.label}</span><span className="lvl-desc">{lvl.desc}</span></div>
                    </div>
                  ))}
                </div>
                <h3 className="step-title mt-4">Plataforma Principal</h3>
                <div className="platforms-row">
                  {platformsList.map(p => (
                    <div key={p.id} className={`platform-chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`} onClick={() => toggleSelection('platforms', p.id)}>
                      <i className={`bx ${p.icon}`}></i> {p.name}
                    </div>
                  ))}
                </div>
                <h3 className="step-title mt-4">¿Qué buscas?</h3>
                <div className="goals-row">
                  {[{ id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' }, { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' }, { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }].map((goal) => (
                    <div key={goal.id} className={`goal-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`} onClick={() => toggleSelection('goals', goal.id)}>
                      <i className={`bx ${goal.icon}`}></i><span>{goal.label}</span>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Atrás</button>
                  <button type="button" className="btn-primary" onClick={() => setStep(4)}>Siguiente</button>
                </div>
              </div>
            )}

            {/* PASO 4 */}
            {step === 4 && (
              <div className="step-fade-in">
                <h3 className="step-title">Credenciales</h3>
                <div className="input-row">
                  <div className="input-wrapper">
                    <label>GamerTag</label>
                    <input type="text" name="username" placeholder="ProGamer123" value={formData.username} onChange={handleChange} />
                    <i className='bx bx-joystick'></i>
                  </div>
                </div>
                <div className="input-row">
                  <div className="input-wrapper"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} autocomplete="email" placeholder='Email'/><i className='bx bx-envelope'></i></div>
                </div>
                <div className="input-row">
                  <div className="input-wrapper"><label>Contraseña</label><input type="password" name="password" value={formData.password} onChange={handleChange} autocomplete="new-password" placeholder="Contraseña" /><i className='bx bx-lock-alt'></i></div>
                </div>
                <div className="input-row">
                  <div className={`input-wrapper ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'input-error' : ''}`}>
                    <label>Confirmar Contraseña</label>
                    <input type="password" name="confirmPassword" placeholder="Repite tu contraseña" value={formData.confirmPassword} autocomplete="new-password"onChange={handleChange} />
                    <i className='bx bx-shield-quarter'></i>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <span className="error-text"><i className='bx bx-error-circle'></i> No coinciden</span>
                  )}
                </div>
                <label className="remember-me mt-2">
                  <input type="checkbox" name="checkTerms" checked={formData.checkTerms} onChange={handleChange} />
                  <span className="terms-text">
                    He leído y acepto los <a href="/legal/terms" target="_blank" rel="noreferrer"> Términos de Servicio </a> y la <a href="/legal/privacy" target="_blank" rel="noreferrer"> Política de Privacidad</a>.
                  </span>
                </label>

                {error && <div className="error-alert" style={{color: '#ff4d4d', marginTop: '10px'}}>{error}</div>}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(3)}>Atrás</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    disabled={loading || !formData.password || formData.password !== formData.confirmPassword || !formData.checkTerms}
                    onClick={handleSubmit}
                  >
                    {loading ? 'PROCESANDO...' : 'FINALIZAR'}
                  </button>
                </div>
                <div className="sidebar-credit">
                    <span className="text">Dev by <strong>Steliant</strong></span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* 5. SECCIÓN DERECHA CON CAMBIO DE IMAGEN */}
      <div className="auth-right">
        <div className="image-overlay"></div>
        {/* Aquí está la lógica EXACTA de tu Sidebar: Si isDarkMode es true, usa bgBlack, si no bgWhite */}
        <img 
            src={isDarkMode ? bgBlack : bgWhite} 
            alt="Setup Gamer" 
            className="dynamic-bg"
        />
      </div>
      
    </div>
  );
};

export default Register;