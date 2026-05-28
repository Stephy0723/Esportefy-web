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
    companyName: 'Nombre de la Empresa / Marca',
    industry: 'Industria',
    sponsorType: 'Tipo de Patrocinio',
    budget: 'Presupuesto Estimado',
    description: 'Descripción',
};

const SponsorPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [fileName, setFileName] = useState('Ningún archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', idNumber: '', companyName: '', website: '',
        industry: '', sponsorType: '', budget: '', interests: '', description: ''
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
            data.append('role', 'sponsor');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));
            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Sponsor fue enviada y quedó pendiente de confirmación.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

    const fe = (f) => formErrors[f];

    return (
        <div className="reg-page">
            <PageHud page="SPONSOR" />
            <div className="main-content-wrapper">
                <div className="split-layout">
                    <div className="form-side">
                        <div className="form-header">
                            <div className="badge-wrapper">
                                <span className="step-badge verify"><i className='bx bx-dollar-circle'></i> SOLICITUD DE ROL</span>
                            </div>
                            <h1>Sponsor / <span className="highlight-green">Patrocinador</span></h1>
                            <p>Conecta tu marca con la comunidad esports. Verificamos sponsors para garantizar la seguridad de los jugadores.</p>
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
                                documentInputId="sponsor-doc-upload"
                                errors={formErrors}
                            />

                            <h4 className="section-title">Datos de la Empresa / Marca</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="companyName" placeholder=" " value={formData.companyName} onChange={handleInputChange} className={fe('companyName') ? 'input-error' : ''} />
                                    <label>Nombre de la Empresa / Marca</label>
                                    <i className='bx bx-building input-icon'></i>
                                    {fe('companyName') && <small className="field-error">{fe('companyName')}</small>}
                                </div>
                                <div className="input-group">
                                    <input type="url" name="website" placeholder=" " value={formData.website} onChange={handleInputChange} />
                                    <label>Sitio Web (Opcional)</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="industry" value={formData.industry} onChange={handleInputChange} className={fe('industry') ? 'input-error' : ''}>
                                        <option value="" disabled>Industria</option>
                                        <option value="gaming-peripherals">Periféricos Gaming</option>
                                        <option value="food-beverage">Alimentos / Bebidas</option>
                                        <option value="tech">Tecnología</option>
                                        <option value="apparel">Ropa / Moda</option>
                                        <option value="entertainment">Entretenimiento</option>
                                        <option value="education">Educación</option>
                                        <option value="crypto-fintech">Crypto / Fintech</option>
                                        <option value="other">Otra</option>
                                    </select>
                                    {fe('industry') && <small className="field-error">{fe('industry')}</small>}
                                </div>
                                <div className="input-group">
                                    <select name="sponsorType" value={formData.sponsorType} onChange={handleInputChange} className={fe('sponsorType') ? 'input-error' : ''}>
                                        <option value="" disabled>Tipo de Patrocinio</option>
                                        <option value="tournaments">Torneos</option>
                                        <option value="teams">Equipos</option>
                                        <option value="players">Jugadores Individuales</option>
                                        <option value="events">Eventos / LANs</option>
                                        <option value="communities">Comunidades</option>
                                        <option value="all">Todo lo anterior</option>
                                    </select>
                                    {fe('sponsorType') && <small className="field-error">{fe('sponsorType')}</small>}
                                </div>
                            </div>

                            <h4 className="section-title">Intereses de Patrocinio</h4>
                            <div className="input-group">
                                <select name="budget" value={formData.budget} onChange={handleInputChange} className={fe('budget') ? 'input-error' : ''}>
                                    <option value="" disabled>Presupuesto Estimado</option>
                                    <option value="micro">Micro (Premios / Items)</option>
                                    <option value="small">Pequeño ($100 - $1,000)</option>
                                    <option value="medium">Mediano ($1,000 - $10,000)</option>
                                    <option value="large">Grande ($10,000+)</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                                {fe('budget') && <small className="field-error">{fe('budget')}</small>}
                            </div>

                            <div className="input-group">
                                <input type="text" name="interests" placeholder=" " value={formData.interests} onChange={handleInputChange} />
                                <label>Juegos o comunidades de interés (Opcional)</label>
                                <i className='bx bx-game input-icon'></i>
                            </div>

                            <div className="input-group">
                                <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                                <label>Cuéntanos sobre tu marca y qué buscas en el esports...</label>
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
                        iconClass="bx bx-dollar-circle"
                        title="Impulsa marcas dentro del esports"
                        description="Presenta tu marca con una vista más sólida y corporativa para conectar con torneos, comunidades y equipos."
                        features={[
                            'Badge de Sponsor verificado',
                            'Dashboard de patrocinios',
                            'Visibilidad en torneos',
                            'Conexión directa con equipos'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default SponsorPage;
