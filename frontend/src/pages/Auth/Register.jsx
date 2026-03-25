import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import './Register.css';
// 1. IMPORTAR EL CEREBRO DEL TEMA (IGUAL QUE EN SIDEBAR)
import { useTheme } from '../../context/ThemeContext'; 

// 2. IMPORTAR TUS DOS IMÁGENES DE FONDO
import bgWhite from '../../assets/images/login-black.png'; // Imagen Oscura
import bgBlack from '../../assets/images/login-white.png'; // Imagen Clara (Asegúrate que exista con este nombre)

import { GAME_IMAGES } from '../../data/gameImages';
import { getGameIdFromRoutePath } from '../menu/Community/gameHub.service';

const normalizeForCompare = (value = '') =>
  String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const REGISTER_GAMES = [
  {
    id: 'valorant',
    name: 'Valorant',
    image: GAME_IMAGES.Valorant
  },
  {
    id: 'lol',
    name: 'League of Legends',
    image: GAME_IMAGES['League of Legends']
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    image: GAME_IMAGES['Mobile Legends']
  }
];

const normalizePhone = (value = '') => String(value).replace(/[^\d]/g, '');
const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
const isValidNonNegativeNumberString = (value = '') => /^\d+$/.test(String(value)) && Number(value) >= 0;
const WEAK_PASSWORDS = new Set([
  '12345678',
  '123456789',
  '123123123',
  '11111111',
  'password',
  'password123',
  'qwerty123',
  'qwertyui',
  'admin123',
  'abc12345',
  'letmein',
  'glitchgang',
  'contrasena',
  'contraseña'
].map(normalizeForCompare));

const hasNumericSequence = (value = '') => {
  const lower = String(value).toLowerCase();
  const patterns = [
    '0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890',
    '9876', '8765', '7654', '6543', '5432', '4321', '3210'
  ];
  return patterns.some((p) => lower.includes(p));
};

const getPasswordError = ({ password, username, fullName, email }) => {
  if (!password) return '';
  if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/\s/.test(password)) return 'La contraseña no puede contener espacios.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'La contraseña debe incluir letras y números.';

  const personalTerms = new Set();
  const addTerm = (raw) => {
    const term = normalizeForCompare(raw);
    if (term.length >= 3) personalTerms.add(term);
  };

  addTerm(username);
  String(fullName || '')
    .split(/\s+/)
    .filter(Boolean)
    .forEach(addTerm);
  String(email || '')
    .split('@')[0]
    ?.split(/[._-]+/)
    .filter(Boolean)
    .forEach(addTerm);

  const normalizedPassword = normalizeForCompare(password);
  const containsPersonalTerm = [...personalTerms].some((term) => normalizedPassword.includes(term));
  if (containsPersonalTerm) {
    return 'La contraseña no puede incluir tu nombre, usuario o partes del correo.';
  }
  if (WEAK_PASSWORDS.has(normalizedPassword)) {
    return 'Esa contraseña es demasiado común o insegura.';
  }
  if (/(.)\1{3,}/.test(password)) {
    return 'La contraseña no puede tener 4 caracteres repetidos seguidos.';
  }
  if (hasNumericSequence(password)) {
    return 'La contraseña no puede contener secuencias numéricas (ej: 1234).';
  }

  return '';
};

const getSubmitError = (formData, passwordError) => {
  if (!String(formData.fullName || '').trim()) return 'El nombre completo es obligatorio.';
  if (!String(formData.phone || '').trim()) return 'El teléfono es obligatorio.';
  if (!isValidNonNegativeNumberString(formData.phone)) return 'El teléfono debe contener solo números y no puede ser negativo.';
  if (!String(formData.country || '').trim() || (formData.country === 'Otro' && !String(formData.customCountry || '').trim())) return 'El país es obligatorio.';
  if (!String(formData.birthDate || '').trim()) return 'La fecha de nacimiento es obligatoria.';
  if (!Array.isArray(formData.selectedGames) || formData.selectedGames.length === 0) return 'Debes seleccionar al menos un juego.';
  if (!String(formData.experience || '').trim()) return 'Selecciona tu nivel de experiencia.';
  if (!Array.isArray(formData.platforms) || formData.platforms.length === 0) return 'Selecciona al menos una plataforma.';
  if (!Array.isArray(formData.goals) || formData.goals.length === 0) return 'Selecciona al menos un objetivo.';
  if (!String(formData.username || '').trim()) return 'El GamerTag es obligatorio.';
  if (!String(formData.email || '').trim()) return 'El email es obligatorio.';
  if (!isValidEmail(formData.email)) return 'El formato del email no es válido.';
  if (!String(formData.password || '').trim()) return 'La contraseña es obligatoria.';
  if (passwordError) return passwordError;
  if (formData.password !== formData.confirmPassword) return 'Las contraseñas no coinciden.';
  if (!formData.checkTerms) return 'Debes aceptar los términos para continuar.';
  return '';
};

const getStep1Error = (formData) => {
  if (!String(formData.fullName || '').trim()) return 'El nombre completo es obligatorio.';
  if (!String(formData.phone || '').trim()) return 'El teléfono es obligatorio.';
  if (!isValidNonNegativeNumberString(formData.phone)) return 'El teléfono debe tener solo números (sin +, espacios ni guiones).';
  if (!String(formData.country || '').trim() || (formData.country === 'Otro' && !String(formData.customCountry || '').trim())) return 'Selecciona tu país.';
  if (!String(formData.birthDate || '').trim()) return 'La fecha de nacimiento es obligatoria.';
  return '';
};

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 3. OBTENER SI ESTÁ EN MODO OSCURO (IGUAL QUE EN SIDEBAR)
  const { isDarkMode } = useTheme();
  const { addToast } = useNotification();
  const redirectTarget = location.state?.from || null;
  const redirectPath = typeof redirectTarget?.pathname === 'string' ? redirectTarget.pathname : '';
  const pendingGameJoinId = getGameIdFromRoutePath(redirectPath);

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); 
  const [step1Attempted, setStep1Attempted] = useState(false);
  const [phoneAvailability, setPhoneAvailability] = useState({
    loading: false,
    checked: false,
    available: true,
    warning: false,
    message: ''
  });
  const [usernameAvailability, setUsernameAvailability] = useState({
    loading: false,
    checked: false,
    available: true,
    warning: false,
    message: ''
  });

  const [formData, setFormData] = useState({
    fullName: '', phone: '', gender: 'Otro', country: '', customCountry: '', birthDate: '',
    selectedGames: [], platforms: [],
    experience: '', goals: [],
    username: '', email: '', password: '', confirmPassword: '',
    checkTerms: false
  });

  // --- FUNCIÓN PARA ENVIAR AL BACKEND ---
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const usernameResult = await checkUsernameAvailability(formData.username);
    if (!usernameResult.available) {
      setError(usernameResult.message || 'Este GamerTag ya está en uso.');
      return;
    }

    const validationError = getSubmitError(formData, passwordError);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = { ...formData, country: formData.country === 'Otro' ? formData.customCountry : formData.country };
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        ...payload,
        ...(pendingGameJoinId ? { pendingGameJoinId } : {})
      });
      addToast('¡Cuenta creada con éxito! Ahora puedes iniciar sesión.', 'success');
      navigate('/login', { state: location.state });
    } catch (err) {
      const message = err.response?.data?.message || 'Error al procesar el registro';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const nextValue = name === 'phone' && type !== 'checkbox' ? normalizePhone(value) : value;
    if (name === 'phone') {
      setPhoneAvailability({ loading: false, checked: false, available: true, warning: false, message: '' });
    }
    if (name === 'username') {
      setUsernameAvailability({ loading: false, checked: false, available: true, warning: false, message: '' });
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : nextValue }));
  };

  const toggleSelection = (field, id) => {
    setFormData(prev => {
      const list = prev[field];
      return { ...prev, [field]: list.includes(id) ? list.filter(x => x !== id) : [...list, id] };
    });
  };

  const checkPhoneAvailability = async (phoneValue) => {
    const normalized = normalizePhone(phoneValue);
    if (!normalized || !isValidNonNegativeNumberString(normalized)) {
      setPhoneAvailability({ loading: false, checked: false, available: true, warning: false, message: '' });
      return { available: true, checked: false };
    }

    setPhoneAvailability({ loading: true, checked: false, available: true, warning: false, message: '' });
    try {
      const endpointCandidates = [
        `${API_URL}/api/auth/check-phone`,
        `${API_URL}/auth/check-phone`,
        `${API_URL}/check-phone`
      ];

      let response = null;
      let lastError = null;
      for (const endpoint of endpointCandidates) {
        try {
          response = await axios.get(endpoint, { params: { phone: normalized } });
          break;
        } catch (candidateError) {
          const status = Number(candidateError?.response?.status || 0);
          lastError = candidateError;
          if (status === 404) continue;
          throw candidateError;
        }
      }

      if (!response) throw lastError || new Error('No se encontró endpoint de verificación de teléfono');

      const available = Boolean(response?.data?.available);
      const message = available ? '' : 'Este teléfono ya está registrado.';
      setPhoneAvailability({ loading: false, checked: true, available, warning: false, message });
      return { available, checked: true, message };
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      const message = status === 429
        ? 'Demasiadas verificaciones seguidas. Intenta de nuevo en unos minutos.'
        : 'No se pudo verificar el teléfono ahora. Puedes continuar y se validará al registrar.';
      // Fail-open: solo bloqueamos cuando sabemos que está repetido.
      setPhoneAvailability({ loading: false, checked: false, available: true, warning: true, message });
      return { available: true, checked: false, warning: true, message };
    }
  };

  const checkUsernameAvailability = async (usernameValue) => {
    const normalized = String(usernameValue || '').trim();
    if (!normalized) {
      setUsernameAvailability({ loading: false, checked: false, available: true, warning: false, message: '' });
      return { available: true, checked: false };
    }

    setUsernameAvailability({ loading: true, checked: false, available: true, warning: false, message: '' });
    try {
      const endpointCandidates = [
        `${API_URL}/api/auth/check-username`,
        `${API_URL}/auth/check-username`,
        `${API_URL}/check-username`
      ];

      let response = null;
      let lastError = null;
      for (const endpoint of endpointCandidates) {
        try {
          response = await axios.get(endpoint, { params: { username: normalized } });
          break;
        } catch (candidateError) {
          const status = Number(candidateError?.response?.status || 0);
          lastError = candidateError;
          if (status === 404) continue;
          throw candidateError;
        }
      }

      if (!response) throw lastError || new Error('No se encontró endpoint de verificación de usuario');

      const available = Boolean(response?.data?.available);
      const message = available ? '' : 'Este GamerTag ya está en uso.';
      setUsernameAvailability({ loading: false, checked: true, available, warning: false, message });
      return { available, checked: true, message };
    } catch (err) {
      const status = Number(err?.response?.status || 0);
      const backendMessage = String(err?.response?.data?.message || '').trim();
      if (status === 400 && backendMessage) {
        setUsernameAvailability({ loading: false, checked: true, available: false, warning: false, message: backendMessage });
        return { available: false, checked: true, message: backendMessage };
      }

      const message = status === 429
        ? 'Demasiadas verificaciones seguidas. Intenta de nuevo en unos minutos.'
        : 'No se pudo verificar el GamerTag ahora. Puedes continuar y se validará al registrar.';
      setUsernameAvailability({ loading: false, checked: false, available: true, warning: true, message });
      return { available: true, checked: false, warning: true, message };
    }
  };

  const handleStep1Next = async () => {
    setError('');
    setStep1Attempted(true);

    if (!step1Valid) {
      setError('Completa nombre, teléfono, país y fecha de nacimiento con datos válidos.');
      return;
    }

    const result = await checkPhoneAvailability(formData.phone);
    if (!result.available) {
      setError(result.message || 'El teléfono ya está registrado.');
      return;
    }

    setStep1Attempted(false);
    setStep(2);
  };

  const passwordError = getPasswordError(formData);
  const step1Valid = Boolean(
    String(formData.fullName || '').trim() &&
    String(formData.phone || '').trim() &&
    isValidNonNegativeNumberString(formData.phone) &&
    (String(formData.country || '').trim() && (formData.country !== 'Otro' || String(formData.customCountry || '').trim())) &&
    String(formData.birthDate || '').trim()
  );
  const step1ErrorHint = getStep1Error(formData);
  const step2Valid = Array.isArray(formData.selectedGames) && formData.selectedGames.length > 0;
  const step3Valid = Boolean(
    String(formData.experience || '').trim() &&
    Array.isArray(formData.platforms) &&
    formData.platforms.length > 0 &&
    Array.isArray(formData.goals) &&
    formData.goals.length > 0
  );
  const canSubmit = Boolean(
    !loading &&
    !usernameAvailability.loading &&
    !getSubmitError(formData, passwordError) &&
    !(usernameAvailability.checked && !usernameAvailability.available)
  );
  const submitErrorHint = usernameAvailability.checked && !usernameAvailability.available
    ? (usernameAvailability.message || 'Este GamerTag ya está en uso.')
    : getSubmitError(formData, passwordError);

  const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
  ];

  const countries = [
    'Antigua y Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belice', 'Bolivia', 'Brasil',
    'Canadá', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Dominica',
    'Ecuador', 'El Salvador', 'Estados Unidos', 'Granada', 'Guatemala', 'Guyana',
    'Haití', 'Honduras', 'Jamaica', 'México', 'Nicaragua', 'Panamá', 'Paraguay',
    'Perú', 'Puerto Rico', 'República Dominicana', 'San Cristóbal y Nieves',
    'San Vicente y las Granadinas', 'Santa Lucía', 'Surinam',
    'Trinidad y Tobago', 'Uruguay', 'Venezuela'
  ];

  const COUNTRY_CALLING_CODES = {
    'Antigua y Barbuda': '1268', 'Argentina': '54', 'Bahamas': '1242', 'Barbados': '1246',
    'Belice': '501', 'Bolivia': '591', 'Brasil': '55', 'Canadá': '1',
    'Chile': '56', 'Colombia': '57', 'Costa Rica': '506', 'Cuba': '53',
    'Dominica': '1767', 'Ecuador': '593', 'El Salvador': '503', 'Estados Unidos': '1',
    'Granada': '1473', 'Guatemala': '502', 'Guyana': '592', 'Haití': '509',
    'Honduras': '504', 'Jamaica': '1876', 'México': '52', 'Nicaragua': '505',
    'Panamá': '507', 'Paraguay': '595', 'Perú': '51', 'Puerto Rico': '1',
    'República Dominicana': '1', 'San Cristóbal y Nieves': '1869', 
    'San Vicente y las Granadinas': '1784', 'Santa Lucía': '1758', 'Surinam': '597', 
    'Trinidad y Tobago': '1868', 'Uruguay': '598', 'Venezuela': '58'
  };

  const selectedPrefix = COUNTRY_CALLING_CODES[formData.country];

  return (
    // 4. USAR isDarkMode PARA LA CLASE CSS DEL COLOR DE FONDO
    <div className={`auth-container-split ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="auth-left">
        <div className="auth-nav">
          <span className="brand">GLITCH GANG</span>
          <div className="nav-links">
            <Link to="/login" state={location.state}>Ya tengo cuenta</Link>
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
                  <div className={`input-wrapper ${phoneAvailability.checked && !phoneAvailability.available ? 'input-error' : ''}`}>
                    <label>Nombre Completo</label>
                    <input type="text" name="fullName" placeholder="Ej: Juan Pérez" value={formData.fullName} onChange={handleChange} />
                    <i className='bx bx-id-card'></i>
                  </div>
                  <div className={`input-wrapper ${selectedPrefix ? 'has-prefix' : ''}`}>
                    <label>Teléfono</label>
                    {selectedPrefix && <span className="input-prefix">+{selectedPrefix}</span>}
                    <input
                      type="tel"
                      name="phone"
                      placeholder={selectedPrefix ? "Ej: 8095551234" : "Ej: +34 600123456"}
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={() => checkPhoneAvailability(formData.phone)}
                      style={selectedPrefix ? { paddingLeft: `${40 + (selectedPrefix.length * 8)}px` } : {}}
                    />
                    <i className='bx bxl-whatsapp'></i>
                  </div>
                </div>
                {formData.country === 'Otro' ? (
                  <span className="helper-text"><i className='bx bx-info-circle'></i> Por favor incluye tu prefijo regional (ej: +34 para España).</span>
                ) : (
                  <span className="helper-text"><i className='bx bx-info-circle'></i> Escribe solo los números, sin espacios ni símbolos.</span>
                )}
                
                {phoneAvailability.loading && (
                  <span className="helper-text"><i className='bx bx-loader-alt bx-spin'></i> Verificando teléfono...</span>
                )}
                {phoneAvailability.checked && !phoneAvailability.available && (
                  <span className="error-text"><i className='bx bx-error-circle'></i> {phoneAvailability.message}</span>
                )}
                {phoneAvailability.warning && (
                  <span className="helper-text"><i className='bx bx-info-circle'></i> {phoneAvailability.message}</span>
                )}
                <div className="input-row split">
                  <div className="input-wrapper">
                    <label>País</label>
                    <select name="country" value={formData.country} onChange={handleChange}>
                      <option value="">Selecciona tu país</option>
                      {countries.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="Otro">Otro (Especificar)</option>
                    </select>
                    <i className='bx bx-globe'></i>
                  </div>
                  <div className="input-wrapper">
                    <label>Género</label>
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                    <i className='bx bx-user'></i>
                  </div>
                </div>
                {formData.country === 'Otro' && (
                  <div className="input-row split step-fade-in">
                    <div className="input-wrapper">
                      <label>Especifica tu país</label>
                      <input type="text" name="customCountry" placeholder="Ej: Japón" value={formData.customCountry} onChange={handleChange} />
                      <i className='bx bx-map-pin'></i>
                    </div>
                  </div>
                )}
                <div className="input-row split">
                  <div className="input-wrapper">
                    <label>Fecha Nacimiento</label>
                    <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-4"
                  onClick={handleStep1Next}
                  disabled={!step1Valid || phoneAvailability.loading || (phoneAvailability.checked && !phoneAvailability.available)}
                  title={!step1Valid ? 'Completa nombre, teléfono, país y fecha de nacimiento con datos válidos.' : ''}
                >
                  Siguiente
                </button>
                {step1Attempted && !step1Valid && (
                  <span className="error-text"><i className='bx bx-error-circle'></i> {step1ErrorHint}</span>
                )}
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <div className="step-fade-in">
                <h3 className="step-title">Elige tu Campo de Batalla</h3>
                <div className="games-grid">
                  {REGISTER_GAMES.map(game => (
                    <div
                      key={game.id}
                      className={`game-card-pro ${formData.selectedGames.includes(game.name) ? 'selected' : ''}`}
                      onClick={() => toggleSelection('selectedGames', game.name)}
                    >
                      {formData.selectedGames.includes(game.name) && <span className="selection-check" aria-hidden="true" />}
                      <div className="game-img-wrapper"><img src={game.image || GAME_IMAGES.Default} alt={game.name} /></div>
                      <span className="game-card-pro__name">{game.name}</span>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(1)}>Atrás</button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setStep(3)}
                    disabled={!step2Valid}
                    title={!step2Valid ? 'Debes seleccionar al menos un juego.' : ''}
                  >
                    Siguiente
                  </button>
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
                      {formData.experience === lvl.id && <span className="selection-check" aria-hidden="true" />}
                      <i className={`bx ${lvl.icon} level-icon`}></i>
                      <div className="level-info"><span className="lvl-label">{lvl.label}</span><span className="lvl-desc">{lvl.desc}</span></div>
                    </div>
                  ))}
                </div>
                <h3 className="step-title mt-4">Plataforma Principal</h3>
                <div className="platforms-row">
                  {platformsList.map(p => (
                    <div key={p.id} className={`platform-chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`} onClick={() => toggleSelection('platforms', p.id)}>
                      {formData.platforms.includes(p.id) && <span className="selection-check selection-check--inline" aria-hidden="true" />}
                      <i className={`bx ${p.icon}`}></i> {p.name}
                    </div>
                  ))}
                </div>
                <h3 className="step-title mt-4">¿Qué buscas?</h3>
                <div className="goals-row">
                  {[{ id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' }, { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' }, { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }].map((goal) => (
                    <div key={goal.id} className={`goal-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`} onClick={() => toggleSelection('goals', goal.id)}>
                      {formData.goals.includes(goal.id) && <span className="selection-check" aria-hidden="true" />}
                      <i className={`bx ${goal.icon}`}></i><span>{goal.label}</span>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(2)}>Atrás</button>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setStep(4)}
                    disabled={!step3Valid}
                    title={!step3Valid ? 'Selecciona experiencia, al menos una plataforma y un objetivo.' : ''}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}

            {/* PASO 4 */}
            {step === 4 && (
              <div className="step-fade-in">
                <h3 className="step-title">Credenciales</h3>
                <div className="input-row">
                  <div className={`input-wrapper ${usernameAvailability.checked && !usernameAvailability.available ? 'input-error' : ''}`}>
                    <label>GamerTag</label>
                    <input
                      type="text"
                      name="username"
                      placeholder="ProGamer123"
                      value={formData.username}
                      onChange={handleChange}
                      onBlur={() => checkUsernameAvailability(formData.username)}
                    />
                    <i className='bx bx-joystick'></i>
                  </div>
                </div>
                {usernameAvailability.loading && (
                  <span className="helper-text"><i className='bx bx-loader-alt bx-spin'></i> Verificando GamerTag...</span>
                )}
                {usernameAvailability.checked && !usernameAvailability.available && (
                  <span className="error-text"><i className='bx bx-error-circle'></i> {usernameAvailability.message}</span>
                )}
                {usernameAvailability.warning && (
                  <span className="helper-text"><i className='bx bx-info-circle'></i> {usernameAvailability.message}</span>
                )}
                <div className="input-row">
                  <div className="input-wrapper"><label>Correo electrónico</label><input type="email" name="email" value={formData.email} onChange={handleChange} autoComplete="email" placeholder='correo@ejemplo.com'/><i className='bx bx-envelope'></i></div>
                </div>
                <div className="input-row">
                  <div className={`input-wrapper ${formData.password && passwordError ? 'input-error' : ''}`}>
                    <label>Contraseña</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} autoComplete="new-password" placeholder="Contraseña" />
                    <i className='bx bx-lock-alt'></i>
                  </div>
                  {formData.password && passwordError && (
                    <span className="error-text"><i className='bx bx-error-circle'></i> {passwordError}</span>
                  )}
                </div>
                <div className="input-row">
                  <div className={`input-wrapper ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'input-error' : ''}`}>
                    <label>Confirmar Contraseña</label>
                    <input type="password" name="confirmPassword" placeholder="Repite tu contraseña" value={formData.confirmPassword} autoComplete="new-password" onChange={handleChange} />
                    <i className='bx bx-shield-quarter'></i>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <span className="error-text"><i className='bx bx-error-circle'></i> No coinciden</span>
                  )}
                </div>
                <label className={`terms-row mt-2 ${submitErrorHint === 'Debes aceptar los términos para continuar.' ? 'input-error' : ''}`}>
                  <input className="terms-checkbox" type="checkbox" name="checkTerms" checked={formData.checkTerms} onChange={handleChange} />
                  <span className="terms-text">
                    He leído y acepto los <a href="/legal/terms" target="_blank" rel="noreferrer"> Términos de Servicio </a> y la <a href="/legal/privacy" target="_blank" rel="noreferrer"> Política de Privacidad</a>.
                  </span>
                </label>

                {!canSubmit && submitErrorHint && (
                  <div className="auth-error-msg" style={{ marginTop: '10px' }}>
                    {submitErrorHint}
                  </div>
                )}

                {error && <div className="auth-error-msg" style={{ marginTop: '10px' }}>{error}</div>}

                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setStep(3)}>Atrás</button>
                  <button 
                    type="button" 
                    className="btn-primary" 
                    disabled={!canSubmit}
                    title={submitErrorHint || ''}
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
