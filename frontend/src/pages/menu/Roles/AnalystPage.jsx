import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import PageHud from '../../../components/PageHud/PageHud';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import RoleApplicationVisual from './RoleApplicationVisual';
import RoleApplicantIdentitySection from './RoleApplicantIdentitySection';
import '../Tournaments/OrganizerApplication/OrganizerApplication.css';

const REQUIRED = {
    fullName: 'Nombre Legal Completo',
    idNumber: 'Cédula / DNI',
    games: 'Juegos que analizas',
    experienceYears: 'Experiencia en Análisis',
    specialization: 'Especialización',
    description: 'Descripción',
};

const AnalystPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', idNumber: '', games: '', experienceYears: '',
        specialization: '', tools: '', portfolio: '', description: ''
    });

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
            data.append('role', 'analyst');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Analista fue enviada y quedó pendiente de confirmación.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

    const fe = (f) => formErrors[f];

    return (
        <div className="reg-page">
            <PageHud page="ANALISTA" />
            <div className="main-content-wrapper">
                <div className="split-layout">
                    <div className="form-side">
                        <div className="form-header">
                            <div className="badge-wrapper">
                                <span className="step-badge verify"><i className='bx bx-line-chart'></i> SOLICITUD DE ROL</span>
                            </div>
                            <h1>Analista <span className="highlight-green">Esports</span></h1>
                            <p>Demuestra tu capacidad analítica para acceder a datos avanzados y herramientas de scouting.</p>
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
                                documentInputId="analyst-doc-upload"
                                errors={formErrors}
                            />

                            <h4 className="section-title">Perfil de Analista</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="games" placeholder=" " value={formData.games} onChange={handleInputChange} className={fe('games') ? 'input-error' : ''} />
                                    <label>Juegos que analizas</label>
                                    <i className='bx bx-game input-icon'></i>
                                    {fe('games') && <small className="field-error">{fe('games')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} className={fe('experienceYears') ? 'input-error' : ''}>
                                        <option value="" disabled>Experiencia en Análisis</option>
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
                                    <select name="specialization" value={formData.specialization} onChange={handleInputChange} className={fe('specialization') ? 'input-error' : ''}>
                                        <option value="" disabled>Especialización</option>
                                        <option value="stats">Estadísticas y Métricas</option>
                                        <option value="strategy">Estrategia / Meta</option>
                                        <option value="scouting">Scouting de Talento</option>
                                        <option value="vod">VOD Review / Replay</option>
                                        <option value="drafts">Drafts / Pick &amp; Ban</option>
                                        <option value="mixed">General / Mixto</option>
                                    </select>
                                    {fe('specialization') && <small className="field-error">{fe('specialization')}</small>}
                                </div>
                                <div className="input-group">
                                    <input type="text" name="tools" placeholder=" " value={formData.tools} onChange={handleInputChange} />
                                    <label>Herramientas que usas (Ej: op.gg, Mobalytics)</label>
                                    <i className='bx bx-wrench input-icon'></i>
                                </div>
                            </div>

                            <div className="input-group">
                                <input type="url" name="portfolio" placeholder=" " value={formData.portfolio} onChange={handleInputChange} />
                                <label>Portfolio / Trabajos anteriores (Opcional)</label>
                                <i className='bx bx-link input-icon'></i>
                            </div>

                            <div className="input-group">
                                <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                                <label>Describe tu experiencia como analista esports...</label>
                                {fe('description') && <small className="field-error">{fe('description')}</small>}
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                                <button type="submit" className="btn-neon green" disabled={loading}>
                                    {loading ? <i className='bx bx-loader-alt bx-spin'></i> : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>

                    <RoleApplicationVisual
                        iconClass="bx bx-line-chart"
                        title="Lee el meta antes que nadie"
                        description="Accede a una presentación más profesional para mostrar tu experiencia en scouting, estrategia y lectura de juego."
                        features={[
                            'Badge de Analista en tu perfil',
                            'Datos avanzados de partidas',
                            'Herramientas de scouting',
                            'Generación de reportes'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalystPage;
