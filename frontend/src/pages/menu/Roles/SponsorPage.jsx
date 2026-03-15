import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext';
import axios from 'axios';
import PageHud from '../../../components/PageHud/PageHud';
import { API_URL } from '../../../config/api';
import { getAuthToken } from '../../../utils/authSession';
import RoleApplicationVisual from './RoleApplicationVisual';
import RoleApplicantIdentitySection from './RoleApplicantIdentitySection';
import '../Tournaments/OrganizerApplication/OrganizerApplication.css';

const SponsorPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('Ningun archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        companyName: '',
        website: '',
        industry: '',
        sponsorType: '',
        budget: '',
        interests: '',
        description: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return notify('error', 'Archivo faltante', 'Por favor sube una foto de tu cedula o documento de identidad.');
        const token = getAuthToken();
        if (!token) return notify('error', 'Sesion requerida', 'Debes iniciar sesion.');
        setLoading(true);
        try {
            const data = new FormData();
            data.append('role', 'sponsor');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Sponsor fue enviada al correo de Steliant y quedo pendiente de confirmacion por administracion.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

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
                                    <strong>Revision por administracion</strong>
                                    <p>Completa este formulario y enviaremos tu solicitud al correo de Steliant para su confirmacion administrativa.</p>
                                </div>
                            </div>
                        </div>

                        <form className="gamer-form" onSubmit={handleSubmit}>
                            <RoleApplicantIdentitySection
                                formData={formData}
                                onInputChange={handleInputChange}
                                onFileChange={handleFileChange}
                                fileName={fileName}
                                documentInputId="sponsor-doc-upload"
                            />

                            <h4 className="section-title">Datos de la Empresa / Marca</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="companyName" required placeholder=" " value={formData.companyName} onChange={handleInputChange} />
                                    <label>Nombre de la Empresa / Marca</label>
                                    <i className='bx bx-building input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <input type="url" name="website" placeholder=" " value={formData.website} onChange={handleInputChange} />
                                    <label>Sitio Web (Opcional)</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="industry" required value={formData.industry} onChange={handleInputChange}>
                                        <option value="" disabled>Industria</option>
                                        <option value="gaming-peripherals">Perifericos Gaming</option>
                                        <option value="food-beverage">Alimentos / Bebidas</option>
                                        <option value="tech">Tecnologia</option>
                                        <option value="apparel">Ropa / Moda</option>
                                        <option value="entertainment">Entretenimiento</option>
                                        <option value="education">Educacion</option>
                                        <option value="crypto-fintech">Crypto / Fintech</option>
                                        <option value="other">Otra</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <select name="sponsorType" required value={formData.sponsorType} onChange={handleInputChange}>
                                        <option value="" disabled>Tipo de Patrocinio</option>
                                        <option value="tournaments">Torneos</option>
                                        <option value="teams">Equipos</option>
                                        <option value="players">Jugadores Individuales</option>
                                        <option value="events">Eventos / LANs</option>
                                        <option value="communities">Comunidades</option>
                                        <option value="all">Todo lo anterior</option>
                                    </select>
                                </div>
                            </div>

                            <h4 className="section-title">Intereses de Patrocinio</h4>
                            <div className="input-group">
                                <select name="budget" required value={formData.budget} onChange={handleInputChange}>
                                    <option value="" disabled>Presupuesto Estimado</option>
                                    <option value="micro">Micro (Premios / Items)</option>
                                    <option value="small">Pequeno ($100 - $1,000)</option>
                                    <option value="medium">Mediano ($1,000 - $10,000)</option>
                                    <option value="large">Grande ($10,000+)</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <input type="text" name="interests" placeholder=" " value={formData.interests} onChange={handleInputChange} />
                                <label>Juegos o comunidades de interes</label>
                                <i className='bx bx-game input-icon'></i>
                            </div>

                            <div className="input-group">
                                <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                <label>Cuentanos sobre tu marca y que buscas en el esports...</label>
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
                        description="Presenta tu marca con una vista mas sólida y corporativa para conectar con torneos, comunidades y equipos."
                        features={[
                            'Badge de Sponsor verificado',
                            'Dashboard de patrocinios',
                            'Visibilidad en torneos',
                            'Conexion directa con equipos'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default SponsorPage;
