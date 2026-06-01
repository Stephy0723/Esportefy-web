import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../config/api';
import { useNotification } from '../../context/NotificationContext';
import { useLang } from '../../context/LanguageContext';
import './Forgot.css';

// SOLO importamos la imagen blanca, ya que será el único modo
import bgWhite from '../../assets/images/login-white.png';

const ForgotPasswordFlow = () => {
    const navigate = useNavigate();
    const { addToast } = useNotification();
    const { t } = useLang();
    // NOTA: Ya no necesitamos usar el hook useTheme aquí porque forzaremos el blanco.

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    
    const [formData, setFormData] = useState({
        token: '',
        password: '',
        confirmPassword: ''
    });

    const [showPass, setShowPass] = useState(false);

    // --- ETAPA 1: ENVIAR CÓDIGO ---
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
            setStep(2); 
        } catch (err) {
            setError(err.response?.data?.message || t('forgotErrorSend'));
        } finally {
            setLoading(false);
        }
    };

    // --- ETAPA 2: VALIDAR Y CAMBIAR ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError(t('forgotErrorMismatch'));
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/reset-password/${formData.token}`, {
                password: formData.password,
                confirmPassword: formData.confirmPassword
            });
            addToast(t('forgotSuccessMsg'), "success");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || t('forgotErrorCode'));
        } finally {
            setLoading(false);
        }
    };

    return (
        // CORRECCIÓN AQUÍ:
        // Forzamos la clase 'light-mode' siempre. Esto hará que el CSS use las variables de fondo blanco.
        <div className="auth-container-split light-mode">
            
            {/* --- IZQUIERDA --- */}
            <div className="auth-left">
                <div className="auth-nav">
                    <span className="brand">GLITCH GANG</span>
                </div>

                <div className="auth-content">
                    <div className="header-text">
                        <span className="badge-pro" style={{background: 'rgba(255, 165, 0, 0.1)', color: 'orange', borderColor: 'rgba(255, 165, 0, 0.3)'}}>
                            {t('forgotBadge')}
                        </span>
                        <h1>
                            {step === 1 ? t('forgotStep1Title') : t('forgotStep2Title')}
                        </h1>
                        <p className="subtitle">
                            {step === 1
                                ? t('forgotStep1Desc')
                                : `${t('forgotStep2DescPrefix')}${email}`}
                        </p>
                    </div>

                    {error && <div className="error-alert">{error}</div>}

                    {/* --- STEP 1 --- */}
                    {step === 1 && (
                        <form onSubmit={handleSendCode} className="step-fade-in">
                            <div className="input-row">
                                <label>{t('forgotEmailLabel')}</label>
                                <div className="input-wrapper">
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
                                    {loading ? t('forgotSending') : t('forgotSendCode')}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* --- STEP 2 --- */}
                    {step === 2 && (
                        <form onSubmit={handleResetPassword} className="step-fade-in">
                            <div className="input-row">
                                <label>{t('forgotCodeLabel')}</label>
                                <div className="input-wrapper">
                                    <input 
                                        type="text" 
                                        placeholder="000000"
                                        maxLength="6"
                                        value={formData.token}
                                        onChange={(e) => setFormData({...formData, token: e.target.value})}
                                        required 
                                        style={{letterSpacing: '5px', fontWeight: 'bold'}}
                                    />
                                    <i className='bx bx-key'></i>
                                </div>
                            </div>
                            <div className="input-row">
                                <label>{t('forgotNewPassLabel')}</label>
                                <div className="input-wrapper">
                                    <input 
                                        type={showPass ? "text" : "password"} 
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required 
                                    />
                                    <i className={`bx ${showPass ? 'bx-show' : 'bx-hide'} toggle-pass`} onClick={() => setShowPass(!showPass)} style={{cursor: 'pointer', pointerEvents: 'auto'}}></i>
                                </div>
                            </div>
                            <div className="input-row">
                                <label>{t('forgotConfirmLabel')}</label>
                                <div className="input-wrapper">
                                    <input 
                                        type={showPass ? "text" : "password"} 
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
                                    {t('forgotBack')}
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading} >
                                    {loading ? t('forgotChanging') : t('forgotChangePassword')}
                                </button>
                            </div>
                        </form>
                    )}
                    <p className="footer-text mt-4">
                        <Link to="/login">{t('forgotBackToLogin')}</Link>
                    </p>
                </div>
            </div>

            {/* --- DERECHA --- */}
            <div className="auth-right">
                <div className="image-overlay"></div>
                {/* CORRECCIÓN AQUÍ: Usamos siempre la imagen blanca */}
                <img 
                    src={bgWhite} 
                    alt="Esports Arena" 
                    className="dynamic-bg"
                />
            </div>
        </div>
    );
};

export default ForgotPasswordFlow;



