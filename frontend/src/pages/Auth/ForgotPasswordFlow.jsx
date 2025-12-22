import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

// Imagen lateral (Asegúrate de que la ruta sea correcta)
import sideImage from '../../assets/images/login-bg.jpg';

const ForgotPasswordFlow = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // Paso 1: Email, Paso 2: Código + Clave
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState(''); // Guardamos el email para el mensaje de ayuda
    
    const [formData, setFormData] = useState({
        token: '',
        password: '',
        confirmPassword: ''
    });

    // --- ETAPA 1: ENVIAR CÓDIGO ---
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post('http://localhost:4000/api/auth/forgot-password', { email });
            setStep(2); // Pasamos a la siguiente etapa
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar el correo.');
        } finally {
            setLoading(false);
        }
    };

    // --- ETAPA 2: VALIDAR CÓDIGO Y CAMBIAR CLAVE ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Las contraseñas no coinciden.');
        }

        setLoading(true);
        try {
            await axios.post(`http://localhost:4000/api/auth/reset-password/${formData.token}`, {
                password: formData.password
            });
            
            alert("¡Contraseña actualizada con éxito!");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Código incorrecto o expirado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container-split">
            <div className="auth-left">
                <div className="auth-nav">
                    <span className="brand">ESPORTEFY</span>
                </div>

                <div className="auth-content">
                    
                    {/* --- HEADER DINÁMICO --- */}
                    <div className="header-text">
                        <span className="badge-pro">SEGURIDAD</span>
                        <h1>
                            {step === 1 ? 'Recuperar Cuenta' : 'Verifica tu Identidad'}
                        </h1>
                        <p className="subtitle">
                            {step === 1 
                                ? 'Introduce tu correo para recibir un código de acceso.' 
                                : `Introduce el código de 6 dígitos enviado a ${email}`}
                        </p>
                    </div>

                    {error && <div className="error-alert">{error}</div>}

                    {/* --- ETAPA 1: FORMULARIO DE EMAIL --- */}
                    {step === 1 && (
                        <form onSubmit={handleSendCode} className="step-fade-in">
                            <div className="input-row">
                                <div className="input-wrapper">
                                    <label>Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        placeholder="tu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required 
                                    />
                                    <i className='bx bx-envelope'></i>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- ETAPA 2: FORMULARIO DE CÓDIGO Y CLAVE --- */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="step-fade-in">
                            <div className="input-row">
                                <div className="input-wrapper">
                                    <label>Código de 6 dígitos</label>
                                    <input 
                                        type="text" 
                                        placeholder="000000"
                                        maxLength="6"
                                        value={formData.token}
                                        onChange={(e) => setFormData({...formData, token: e.target.value})}
                                        required 
                                    />
                                    <i className='bx bx-key'></i>
                                </div>
                            </div>

                            <div className="input-row split">
                                <div className="input-wrapper">
                                    <label>Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required 
                                    />
                                    <i className='bx bx-lock-alt'></i>
                                </div>
                                <div className="input-wrapper">
                                    <label>Confirmar</label>
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        required 
                                    />
                                    <i className='bx bx-shield-quarter'></i>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                                    ATRÁS
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'ACTUALIZANDO...' : 'RESETEAR CONTRASEÑA'}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="footer-text mt-4">
                        <Link to="/login">Volver al inicio de sesión</Link>
                    </p>
                </div>
            </div>

            <div className="auth-right">
                <div className="image-overlay"></div>
               <img src={sideImage} alt="Setup Gamer" />
            </div>
        </div>
    );
};

export default ForgotPasswordFlow;