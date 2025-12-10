import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import sideImage from '../../assets/images/login-bg.jpg';

// --- IMPORTACIÓN CON NOMBRES LIMPIOS (CORREGIDO) ---
import imgLol from '../../assets/gameImages/lol.png';
import imgMlbb from '../../assets/gameImages/mlbb.png';
import imgHok from '../../assets/gameImages/hok.png';
import imgMoco from '../../assets/gameImages/moco.png';
import imgMarvel from '../../assets/gameImages/marvel.png';
import imgFreeFire from '../../assets/gameImages/freefire.png';
import imgFortnite from '../../assets/gameImages/fortnite.png';
import imgCodm from '../../assets/gameImages/codm.png';
import imgMk from '../../assets/gameImages/mk11.png';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '', phone: '', discord: '', country: '', city: '', birthDate: '',
    selectedGames: [], platforms: [],
    experience: '', goals: [],
    username: '', email: '', password: '', confirmPassword: '',
    checkTerms: false, checkNews: false
  });

  // Lista de 9 juegos usando las variables importadas
  const mobaGames = [
    { id: 'lol', name: 'League of Legends', img: imgLol },
    { id: 'mlbb', name: 'Mobile Legends', img: imgMlbb },
    { id: 'hok', name: 'Honor of Kings', img: imgHok },
    { id: 'marvel', name: 'Marvel Rivals', img: imgMarvel },
    { id: 'moco', name: 'Mo.co', img: imgMoco },
    { id: 'freefire', name: 'Free Fire', img: imgFreeFire },
    { id: 'fortnite', name: 'Fortnite', img: imgFortnite },
    { id: 'codm', name: 'CoD Mobile', img: imgCodm },
    { id: 'mk11', name: 'Mortal Kombat', img: imgMk }
  ];

  const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
  ];

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

  return (
    <div className="auth-container-split">
      <div className="auth-left">
        <div className="auth-nav">
            <span className="brand">ESPORTEFY<span className="dot">.</span></span>
            <div className="nav-links">
                <Link to="/login">Ya tengo cuenta</Link>
            </div>
        </div>

        <div className="auth-content register-content">
            <div className="header-text">
                <span className="badge-pro">NUEVO JUGADOR</span>
                <h1>Crea tu Perfil<span className="dot">.</span></h1>
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
                
                {/* --- PASO 1: DATOS PERSONALES (Formato 2 líneas) --- */}
{step === 1 && (
    <div className="step-fade-in">
        <h3 className="step-title">Información Real</h3>

        {/* LÍNEA 1: Nombre y Teléfono */}
        <div className="input-row split">
            <div className="input-wrapper">
                <label>Nombre Completo</label>
                <input 
                    type="text" 
                    name="fullName" 
                    placeholder="Ej: Juan Pérez" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                />
                <i className='bx bx-id-card'></i>
            </div>
            
            <div className="input-wrapper">
                <label>Teléfono</label>
                <input 
                    type="tel" 
                    name="phone" 
                    placeholder="+57 ..." 
                    value={formData.phone} 
                    onChange={handleChange} 
                />
                <i className='bx bxl-whatsapp'></i>
            </div>
        </div>

        {/* LÍNEA 2: País y Fecha de Nacimiento */}
        <div className="input-row split">
            <div className="input-wrapper">
                <label>País</label>
                <input 
                    type="text" 
                    name="country" 
                    placeholder="Tu país" 
                    value={formData.country} 
                    onChange={handleChange} 
                />
                <i className='bx bx-globe'></i>
            </div>

            <div className="input-wrapper">
                <label>Fecha Nacimiento</label>
                <input 
                    type="date" 
                    name="birthDate" 
                    value={formData.birthDate} 
                    onChange={handleChange} 
                />
            </div>
        </div>

        <button className="btn-primary mt-4" onClick={() => setStep(2)}>Siguiente: Tus Juegos</button>
    </div>
)}
                {/* --- PASO 2: SELECCIÓN DE JUEGOS --- */}
                {step === 2 && (
                    <div className="step-fade-in">
                        <h3 className="step-title">Elige tu Campo de Batalla</h3>
                        
                        <div className="games-grid">
                            {mobaGames.map(game => (
                                <div 
                                    key={game.id} 
                                    className={`game-card-pro ${formData.selectedGames.includes(game.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection('selectedGames', game.id)}
                                >
                                    <div className="game-img-wrapper">
                                        <img src={game.img} alt={game.name} />
                                    </div>
                                    <span>{game.name}</span>
                                </div>
                            ))}
                        </div>
                        

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setStep(1)}>Atrás</button>
                            <button className="btn-primary" onClick={() => setStep(3)}>Siguiente</button>
                        </div>
                    </div>
                )}

{/* --- PASO 3: PERFIL GAMER (CORREGIDO HORIZONTAL) --- */}
{step === 3 && (
    <div className="step-fade-in">
        
        {/* BLOQUE NIVEL (HORIZONTAL) */}
        <h3 className="step-title">Tu Nivel de Experiencia</h3>
        <div className="levels-row">
            {[
                { id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' },
                { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' },
                { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }
            ].map((lvl) => (
                <div 
                    key={lvl.id} 
                    className={`level-card ${formData.experience === lvl.id ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, experience: lvl.id})}
                >
                    <i className={`bx ${lvl.icon} level-icon`}></i>
                    <div className="level-info">
                        <span className="lvl-label">{lvl.label}</span>
                        <span className="lvl-desc">{lvl.desc}</span>
                    </div>
                </div>
            ))}
        </div>
           <h3 className="step-title mt-4">Plataforma Principal</h3>

                        <div className="platforms-row">

                            {platformsList.map(p => (

                                <div

                                    key={p.id}

                                    className={`platform-chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`}

                                    onClick={() => toggleSelection('platforms', p.id)}

                                >

                                    <i className={`bx ${p.icon}`}></i> {p.name}

                                </div>

                            ))}

                        </div>

        {/* BLOQUE OBJETIVOS (HORIZONTAL COMPACTO) */}
        <h3 className="step-title mt-4">¿Qué buscas en Esportefy?</h3>
        <div className="goals-row">
            {[
                { id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' },
                { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' },
                { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }
            ].map((goal) => (
                <div 
                    key={goal.id} 
                    className={`goal-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`}
                    onClick={() => toggleSelection('goals', goal.id)}
                >
                    <i className={`bx ${goal.icon}`}></i>
                    <span>{goal.label}</span>
                </div>
            ))}
        </div>

        <div className="form-actions space-between">
            <button className="btn-secondary" onClick={() => setStep(2)}>Atrás</button>
            <button className="btn-primary" onClick={() => setStep(4)}>Siguiente</button>
        </div>
    </div>
)}
                {/* --- PASO 4: CUENTA --- */}
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
                            <div className="input-wrapper">
                                <label>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} />
                                <i className='bx bx-envelope'></i>
                            </div>
                        </div>
                        <div className="input-row">
                            <div className="input-wrapper">
                                <label>Contraseña</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} />
                                <i className='bx bx-lock-alt'></i>
                            </div>
                        </div>

                        <label className="remember-me mt-2">
                            <input type="checkbox" name="checkTerms" checked={formData.checkTerms} onChange={handleChange} />
                            <span>Acepto Términos y Condiciones</span>
                        </label>

                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setStep(3)}>Atrás</button>
                            <button className="btn-primary" onClick={() => navigate('/')}>FINALIZAR</button>
                        </div>
                    </div>
                )}

            </form>
        </div>
      </div>

      <div className="auth-right">
        <div className="image-overlay"></div>
        <img src={sideImage} alt="Setup Gamer" />
      </div>
    </div>
  );
};

export default Register;