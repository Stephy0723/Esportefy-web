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
    mainPlatform: 'Plataforma Principal',
    channelUrl: 'URL del Canal',
    followers: 'Seguidores / Suscriptores',
    contentType: 'Tipo de Contenido',
    games: 'Juegos principales',
    description: 'Descripción',
};

const ContentCreatorPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', idNumber: '', mainPlatform: '', channelUrl: '',
        followers: '', contentType: '', games: '', description: ''
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
            data.append('role', 'content-creator');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Creador de Contenido fue enviada y quedó pendiente de confirmación.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

    const fe = (f) => formErrors[f];

    return (
        <div className="reg-page">
            <PageHud page="CREADOR DE CONTENIDO" />
            <div className="main-content-wrapper">
                <div className="split-layout">
                    <div className="form-side">
                        <div className="form-header">
                            <div className="badge-wrapper">
                                <span className="step-badge verify"><i className='bx bx-video'></i> SOLICITUD DE ROL</span>
                            </div>
                            <h1>Creador de <span className="highlight-green">Contenido</span></h1>
                            <p>Cuéntanos sobre tu trabajo como creador para verificar tu perfil y desbloquear herramientas exclusivas.</p>
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
                                documentInputId="content-creator-doc-upload"
                                errors={formErrors}
                            />

                            <h4 className="section-title">Plataforma Principal</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="mainPlatform" value={formData.mainPlatform} onChange={handleInputChange} className={fe('mainPlatform') ? 'input-error' : ''}>
                                        <option value="" disabled>Plataforma Principal</option>
                                        <option value="twitch">Twitch</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="kick">Kick</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="other">Otra</option>
                                    </select>
                                    {fe('mainPlatform') && <small className="field-error">{fe('mainPlatform')}</small>}
                                </div>
                                <div className="input-group">
                                    <input type="url" name="channelUrl" placeholder=" " value={formData.channelUrl} onChange={handleInputChange} className={fe('channelUrl') ? 'input-error' : ''} />
                                    <label>URL de tu Canal / Perfil</label>
                                    <i className='bx bx-link input-icon'></i>
                                    {fe('channelUrl') && <small className="field-error">{fe('channelUrl')}</small>}
                                </div>
                            </div>

                            <h4 className="section-title">Detalles del Contenido</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="followers" value={formData.followers} onChange={handleInputChange} className={fe('followers') ? 'input-error' : ''}>
                                        <option value="" disabled>Seguidores / Suscriptores</option>
                                        <option value="0-500">Menos de 500</option>
                                        <option value="500-5000">500 - 5,000</option>
                                        <option value="5000-50000">5,000 - 50,000</option>
                                        <option value="50000+">Más de 50,000</option>
                                    </select>
                                    {fe('followers') && <small className="field-error">{fe('followers')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="contentType" value={formData.contentType} onChange={handleInputChange} className={fe('contentType') ? 'input-error' : ''}>
                                        <option value="" disabled>Tipo de Contenido</option>
                                        <option value="streaming">Streaming en Vivo</option>
                                        <option value="videos">Videos / Ediciones</option>
                                        <option value="guides">Guías / Tutoriales</option>
                                        <option value="highlights">Highlights / Clips</option>
                                        <option value="mixed">Mixto</option>
                                    </select>
                                    {fe('contentType') && <small className="field-error">{fe('contentType')}</small>}
                                </div>
                            </div>

                            <div className="input-group">
                                <input type="text" name="games" placeholder=" " value={formData.games} onChange={handleInputChange} className={fe('games') ? 'input-error' : ''} />
                                <label>Juegos principales que cubres</label>
                                <i className='bx bx-game input-icon'></i>
                                {fe('games') && <small className="field-error">{fe('games')}</small>}
                            </div>

                            <div className="input-group">
                                <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                                <label>Cuéntanos sobre tu contenido y tu comunidad...</label>
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
                        iconClass="bx bx-video"
                        title="Haz crecer tu alcance"
                        description="Convierte tu perfil en una vitrina profesional para streams, videos y cobertura de la escena competitiva."
                        features={[
                            'Badge exclusivo en tu perfil',
                            'Panel de analíticas',
                            'Promoción en la comunidad',
                            'Herramientas de streaming'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContentCreatorPage;
