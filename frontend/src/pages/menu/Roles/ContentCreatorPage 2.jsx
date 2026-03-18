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

const ContentCreatorPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('Ningun archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        mainPlatform: '',
        channelUrl: '',
        followers: '',
        contentType: '',
        games: '',
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
            data.append('role', 'content-creator');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Creador de Contenido fue enviada al correo de Steliant y quedo pendiente de confirmacion por administracion.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

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
                            <p>Cuentanos sobre tu trabajo como creador para verificar tu perfil y desbloquear herramientas exclusivas.</p>
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
                                documentInputId="content-creator-doc-upload"
                            />

                            <h4 className="section-title">Plataforma Principal</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="mainPlatform" required value={formData.mainPlatform} onChange={handleInputChange}>
                                        <option value="" disabled>Plataforma Principal</option>
                                        <option value="twitch">Twitch</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="kick">Kick</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="other">Otra</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <input type="url" name="channelUrl" required placeholder=" " value={formData.channelUrl} onChange={handleInputChange} />
                                    <label>URL de tu Canal / Perfil</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                            </div>

                            <h4 className="section-title">Detalles del Contenido</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="followers" required value={formData.followers} onChange={handleInputChange}>
                                        <option value="" disabled>Seguidores / Suscriptores</option>
                                        <option value="0-500">Menos de 500</option>
                                        <option value="500-5000">500 - 5,000</option>
                                        <option value="5000-50000">5,000 - 50,000</option>
                                        <option value="50000+">Mas de 50,000</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <select name="contentType" required value={formData.contentType} onChange={handleInputChange}>
                                        <option value="" disabled>Tipo de Contenido</option>
                                        <option value="streaming">Streaming en Vivo</option>
                                        <option value="videos">Videos / Ediciones</option>
                                        <option value="guides">Guias / Tutoriales</option>
                                        <option value="highlights">Highlights / Clips</option>
                                        <option value="mixed">Mixto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <input type="text" name="games" required placeholder=" " value={formData.games} onChange={handleInputChange} />
                                <label>Juegos principales que cubres</label>
                                <i className='bx bx-game input-icon'></i>
                            </div>

                            <div className="input-group">
                                <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                <label>Cuentanos sobre tu contenido y tu comunidad...</label>
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
                            'Panel de analiticas',
                            'Promocion en la comunidad',
                            'Herramientas de streaming'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default ContentCreatorPage;
