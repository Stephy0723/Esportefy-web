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

const CasterPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('Ningun archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        languages: '',
        games: '',
        experience: '',
        castingStyle: '',
        sampleUrl: '',
        platform: '',
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
            data.append('role', 'caster');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Caster fue enviada al correo de Steliant y quedo pendiente de confirmacion por administracion.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

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
                                documentInputId="caster-doc-upload"
                            />

                            <h4 className="section-title">Perfil de Casting</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="languages" required placeholder=" " value={formData.languages} onChange={handleInputChange} />
                                    <label>Idiomas que narras (Ej: Espanol, Ingles)</label>
                                    <i className='bx bx-globe input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <input type="text" name="games" required placeholder=" " value={formData.games} onChange={handleInputChange} />
                                    <label>Juegos que narras</label>
                                    <i className='bx bx-game input-icon'></i>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="experience" required value={formData.experience} onChange={handleInputChange}>
                                        <option value="" disabled>Experiencia en Casting</option>
                                        <option value="beginner">Principiante (primeros eventos)</option>
                                        <option value="intermediate">Intermedio (10+ eventos)</option>
                                        <option value="advanced">Avanzado (50+ eventos)</option>
                                        <option value="professional">Profesional (ligas oficiales)</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <select name="castingStyle" required value={formData.castingStyle} onChange={handleInputChange}>
                                        <option value="" disabled>Estilo de Casting</option>
                                        <option value="play-by-play">Play-by-Play (Narrador)</option>
                                        <option value="analyst">Analista de Color</option>
                                        <option value="host">Host / Presentador</option>
                                        <option value="duo">Duo (Narrador + Analista)</option>
                                        <option value="versatile">Versatil</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="url" name="sampleUrl" required placeholder=" " value={formData.sampleUrl} onChange={handleInputChange} />
                                    <label>Link a un VOD / clip de tu casting</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <select name="platform" required value={formData.platform} onChange={handleInputChange}>
                                        <option value="" disabled>Plataforma de Streaming</option>
                                        <option value="twitch">Twitch</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="kick">Kick</option>
                                        <option value="discord">Discord (solo voz)</option>
                                        <option value="other">Otra</option>
                                    </select>
                                </div>
                            </div>

                            <div className="input-group">
                                <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                <label>Cuentanos sobre tu experiencia como caster...</label>
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
                        description="Presenta tu perfil como caster con una imagen mas fuerte para torneos, transmisiones y colaboraciones con organizadores."
                        features={[
                            'Badge de Caster en tu perfil',
                            'Acceso a torneos para castear',
                            'Agenda de casting integrada',
                            'Conexion con organizadores'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default CasterPage;
