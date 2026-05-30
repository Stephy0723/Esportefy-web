import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { useLang } from '../../../context/LanguageContext';
import axios from 'axios';
import PageHud from '../../../components/PageHud/PageHud';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import { SUPPORTED_GAME_NAMES } from '../../../../../shared/supportedGames.js';
import RoleApplicationVisual from './RoleApplicationVisual';
import RoleApplicantIdentitySection from './RoleApplicantIdentitySection';
import '../Tournaments/OrganizerApplication/OrganizerApplication.css';

const REQUIRED = {
    fullName: 'Nombre Legal Completo',
    idNumber: 'Cédula / DNI',
    game: 'Juego Principal',
    experienceYears: 'Años de Experiencia',
    rank: 'Rango / Elo',
    coachingType: 'Tipo de Coaching',
    availability: 'Disponibilidad',
    description: 'Descripción',
};

const CoachPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const { user } = useAuth();
    const { t } = useLang();
    const prefilled = useRef(false);
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', idNumber: '', game: '', experienceYears: '',
        rank: '', coachingType: '', availability: '', portfolio: '', description: ''
    });

    useEffect(() => {
        if (user && !prefilled.current) {
            prefilled.current = true;
            setFormData(prev => ({ ...prev, fullName: prev.fullName || user.fullName || '' }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setFileName(e.target.files[0].name);
            if (formErrors.document) setFormErrors(prev => ({ ...prev, document: '' }));
        }
    };

    const validate = () => {
        const errors = {};
        Object.entries(REQUIRED).forEach(([key, label]) => {
            if (!String(formData[key] || '').trim()) errors[key] = `${label} es obligatorio.`;
        });
        if (!file) errors.document = 'Debes subir una foto de tu documento de identidad.';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            setSubmitError('Completa todos los campos obligatorios antes de enviar.');
            return;
        }
        const token = getAuthToken();
        if (!token) return notify('error', 'Sesión requerida', 'Debes iniciar sesión.');
        setLoading(true);
        try {
            const data = new FormData();
            data.append('role', 'coach');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('success', t('roleApplySuccess'), 'Tu solicitud de Coach fue enviada y quedó pendiente de confirmación.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

    const fe = (f) => formErrors[f];

    return (
        <div className="reg-page">
            <PageHud page="COACH" />
            <div className="main-content-wrapper">
                <div className="split-layout">
                    <div className="form-side">
                        <div className="form-header">
                            <div className="badge-wrapper">
                                <span className="step-badge verify"><i className='bx bx-chalkboard'></i> SOLICITUD DE ROL</span>
                            </div>
                            <h1>Coach / <span className="highlight-green">Entrenador</span></h1>
                            <p>Demuestra tu experiencia como coach para acceder a herramientas de entrenamiento y gestión de equipos.</p>
                            <div className="application-review-note">
                                <i className='bx bx-envelope'></i>
                                <div>
                                    <strong>Revisión por administración</strong>
                                    <p>Completa este formulario y enviaremos tu solicitud al correo de Steliant para su confirmación administrativa.</p>
                                </div>
                            </div>
                        </div>

                        <form className="gamer-form" onSubmit={handleSubmit} noValidate>
                            {submitError && (
                                <div className="form-submit-error">
                                    <i className='bx bx-error-circle'></i>
                                    <span>{submitError}</span>
                                </div>
                            )}

                            <RoleApplicantIdentitySection
                                formData={formData}
                                onInputChange={handleInputChange}
                                onFileChange={handleFileChange}
                                fileName={fileName}
                                documentInputId="coach-doc-upload"
                                errors={formErrors}
                                prefilledFullName={!!(user?.fullName)}
                            />

                            <h4 className="section-title">{t('roleCoachExperienceSection')}</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="game" value={formData.game} onChange={handleInputChange} className={fe('game') ? 'input-error' : ''}>
                                        <option value="" disabled>Juego Principal que Entrenas</option>
                                        {SUPPORTED_GAME_NAMES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                    {fe('game') && <small className="field-error">{fe('game')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} className={fe('experienceYears') ? 'input-error' : ''}>
                                        <option value="" disabled>{t('roleApplyExperience')}</option>
                                        <option value="0-1">Menos de 1 año</option>
                                        <option value="1-3">1 - 3 años</option>
                                        <option value="3-5">3 - 5 años</option>
                                        <option value="5+">Más de 5 años</option>
                                    </select>
                                    {fe('experienceYears') && <small className="field-error">{fe('experienceYears')}</small>}
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="rank" placeholder=" " value={formData.rank} onChange={handleInputChange} className={fe('rank') ? 'input-error' : ''} />
                                    <label>Tu Rango / Elo más alto</label>
                                    <i className='bx bx-trophy input-icon'></i>
                                    {fe('rank') && <small className="field-error">{fe('rank')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="coachingType" value={formData.coachingType} onChange={handleInputChange} className={fe('coachingType') ? 'input-error' : ''}>
                                        <option value="" disabled>Tipo de Coaching</option>
                                        <option value="individual">Individual (1 a 1)</option>
                                        <option value="team">Equipos Completos</option>
                                        <option value="group">Clases Grupales</option>
                                        <option value="vod">VOD Review</option>
                                        <option value="mixed">Mixto</option>
                                    </select>
                                    {fe('coachingType') && <small className="field-error">{fe('coachingType')}</small>}
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="availability" value={formData.availability} onChange={handleInputChange} className={fe('availability') ? 'input-error' : ''}>
                                        <option value="" disabled>Disponibilidad</option>
                                        <option value="full-time">Tiempo Completo</option>
                                        <option value="part-time">Medio Tiempo</option>
                                        <option value="weekends">Solo Fines de Semana</option>
                                        <option value="flexible">Horario Flexible</option>
                                    </select>
                                    {fe('availability') && <small className="field-error">{fe('availability')}</small>}
                                </div>
                                <div className="input-group">
                                    <input type="url" name="portfolio" placeholder=" " value={formData.portfolio} onChange={handleInputChange} />
                                    <label>Portfolio / Web (Opcional)</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                            </div>

                            <div className="input-group">
                                <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                                <label>Describe tu experiencia entrenando equipos o jugadores...</label>
                                {fe('description') && <small className="field-error">{fe('description')}</small>}
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>{t('cancel')}</button>
                                <button type="submit" className="btn-neon green" disabled={loading}>
                                    {loading ? <i className='bx bx-loader-alt bx-spin'></i> : t('roleApplySubmit')}
                                </button>
                            </div>
                        </form>
                    </div>

                    <RoleApplicationVisual
                        iconClass="bx bx-chalkboard"
                        title="Forma talento competitivo"
                        description="Muestra tu experiencia como coach con el mismo look premium del perfil de organizador, adaptado a entrenamiento y mejora de equipos."
                        features={[
                            'Badge de Coach en tu perfil',
                            'Gestión de sesiones',
                            'Análisis de partidas',
                            'Visibilidad para equipos'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
