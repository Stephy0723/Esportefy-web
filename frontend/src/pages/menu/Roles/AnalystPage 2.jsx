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

const AnalystPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('Ningun archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        games: '',
        experienceYears: '',
        specialization: '',
        tools: '',
        portfolio: '',
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
            data.append('role', 'analyst');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Analista fue enviada al correo de Steliant y quedo pendiente de confirmacion por administracion.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

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
                            <p>Demuestra tu capacidad analitica para acceder a datos avanzados y herramientas de scouting.</p>
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
                                documentInputId="analyst-doc-upload"
                            />

                            <h4 className="section-title">Perfil de Analista</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="games" required placeholder=" " value={formData.games} onChange={handleInputChange} />
                                    <label>Juegos que analizas</label>
                                    <i className='bx bx-game input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <select name="experienceYears" required value={formData.experienceYears} onChange={handleInputChange}>
                                        <option value="" disabled>Experiencia en Analisis</option>
                                        <option value="0-1">Menos de 1 ano</option>
                                        <option value="1-3">1 - 3 anos</option>
                                        <option value="3-5">3 - 5 anos</option>
                                        <option value="5+">Mas de 5 anos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="specialization" required value={formData.specialization} onChange={handleInputChange}>
                                        <option value="" disabled>Especializacion</option>
                                        <option value="stats">Estadisticas y Metricas</option>
                                        <option value="strategy">Estrategia / Meta</option>
                                        <option value="scouting">Scouting de Talento</option>
                                        <option value="vod">VOD Review / Replay</option>
                                        <option value="drafts">Drafts / Pick & Ban</option>
                                        <option value="mixed">General / Mixto</option>
                                    </select>
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
                                <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                <label>Describe tu experiencia como analista esports...</label>
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
                        description="Accede a una presentacion mas profesional para mostrar tu experiencia en scouting, estrategia y lectura de juego."
                        features={[
                            'Badge de Analista en tu perfil',
                            'Datos avanzados de partidas',
                            'Herramientas de scouting',
                            'Generacion de reportes'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default AnalystPage;
