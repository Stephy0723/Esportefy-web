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
    languages: 'Idiomas',
    games: 'Juegos que narras',
    experience: 'Experiencia',
    castingStyle: 'Estilo de Casting',
    sampleUrl: 'Link a VOD / clip',
    platform: 'Plataforma de Streaming',
    description: 'Descripción',
};

const CasterPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', idNumber: '', languages: '', games: '',
        experience: '', castingStyle: '', sampleUrl: '', platform: '', description: ''
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
            data.append('role', 'caster');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Caster fue enviada y quedó pendiente de confirmación.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

    const fe = (f) => formErrors[f];

    return (
        <div className="reg-page">
            <PageHud page="CASTER" />
            <div className="main-content-wrapper">
                <div className="split-layout">
                    <div className="form-side">
                        <div className="form-header">
                            <div className="badge-wrapper">
                                <span className="step-badge verify"><i className='bx bx-microphone'></i> SOLICITUD DE ROL</span>
                            </div>
                            <h1>Caster / <span className="highlight-green">Comentarista</span></h1>
                            <p>Muestra tu experiencia narrando partidas para acceder a torneos y herramientas de casting.</p>
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
                                documentInputId="caster-doc-upload"
                                errors={formErrors}
                            />

                            <h4 className="section-title">Perfil de Casting</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="languages" placeholder=" " value={formData.languages} onChange={handleInputChange} className={fe('languages') ? 'input-error' : ''} />
                                    <label>Idiomas que narras (Ej: Español, Inglés)</label>
                                    <i className='bx bx-globe input-icon'></i>
                                    {fe('languages') && <small className="field-error">{fe('languages')}</small>}
                                </div>
                                <div className="input-group">
                                    <input type="text" name="games" placeholder=" " value={formData.games} onChange={handleInputChange} className={fe('games') ? 'input-error' : ''} />
                                    <label>Juegos que narras</label>
                                    <i className='bx bx-game input-icon'></i>
                                    {fe('games') && <small className="field-error">{fe('games')}</small>}
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="experience" value={formData.experience} onChange={handleInputChange} className={fe('experience') ? 'input-error' : ''}>
                                        <option value="" disabled>Experiencia en Casting</option>
                                        <option value="beginner">Principiante (primeros eventos)</option>
                                        <option value="intermediate">Intermedio (10+ eventos)</option>
                                        <option value="advanced">Avanzado (50+ eventos)</option>
                                        <option value="professional">Profesional (ligas oficiales)</option>
                                    </select>
                                    {fe('experience') && <small className="field-error">{fe('experience')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="castingStyle" value={formData.castingStyle} onChange={handleInputChange} className={fe('castingStyle') ? 'input-error' : ''}>
                                        <option value="" disabled>Estilo de Casting</option>
                                        <option value="play-by-play">Play-by-Play (Narrador)</option>
                                        <option value="analyst">Analista de Color</option>
                                        <option value="host">Host / Presentador</option>
                                        <option value="duo">Duo (Narrador + Analista)</option>
                                        <option value="versatile">Versátil</option>
                                    </select>
                                    {fe('castingStyle') && <small className="field-error">{fe('castingStyle')}</small>}
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="url" name="sampleUrl" placeholder=" " value={formData.sampleUrl} onChange={handleInputChange} className={fe('sampleUrl') ? 'input-error' : ''} />
                                    <label>Link a un VOD / clip de tu casting</label>
                                    <i className='bx bx-link input-icon'></i>
                                    {fe('sampleUrl') && <small className="field-error">{fe('sampleUrl')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="platform" value={formData.platform} onChange={handleInputChange} className={fe('platform') ? 'input-error' : ''}>
                                        <option value="" disabled>Plataforma de Streaming</option>
                                        <option value="twitch">Twitch</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="kick">Kick</option>
                                        <option value="discord">Discord (solo voz)</option>
                                        <option value="other">Otra</option>
                                    </select>
                                    {fe('platform') && <small className="field-error">{fe('platform')}</small>}
                                </div>
                            </div>

                            <div className="input-group">
                                <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                                <label>Cuéntanos sobre tu experiencia como caster...</label>
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
                        iconClass="bx bx-microphone"
                        title="Dale voz a cada partida"
                        description="Presenta tu perfil como caster con una imagen más fuerte para torneos, transmisiones y colaboraciones con organizadores."
                        features={[
                            'Badge de Caster en tu perfil',
                            'Acceso a torneos para castear',
                            'Agenda de casting integrada',
                            'Conexión con organizadores'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default CasterPage;
