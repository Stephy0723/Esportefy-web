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

const CoachPage = () => {
    const navigate = useNavigate();
    const { notify } = useNotification();
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState('Ningun archivo seleccionado');
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        idNumber: '',
        game: '',
        experienceYears: '',
        rank: '',
        coachingType: '',
        availability: '',
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
            data.append('role', 'coach');
            data.append('document', file);
            Object.keys(formData).forEach(key => data.append(key, formData[key]));

            await axios.post(`${API_URL}/api/auth/apply-role`, data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            notify('success', 'Solicitud enviada', 'Tu solicitud de Coach fue enviada al correo de Steliant y quedo pendiente de confirmacion por administracion.');
            navigate('/profile');
        } catch (err) {
            notify('error', 'Error', err.response?.data?.message || 'No se pudo enviar la solicitud.');
        } finally { setLoading(false); }
    };

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
                            <p>Demuestra tu experiencia como coach para acceder a herramientas de entrenamiento y gestion de equipos.</p>
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
                                documentInputId="coach-doc-upload"
                            />

                            <h4 className="section-title">Experiencia de Coaching</h4>
                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="game" required placeholder=" " value={formData.game} onChange={handleInputChange} />
                                    <label>Juego Principal que Entrenas</label>
                                    <i className='bx bx-game input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <select name="experienceYears" required value={formData.experienceYears} onChange={handleInputChange}>
                                        <option value="" disabled>Anos de Experiencia</option>
                                        <option value="0-1">Menos de 1 ano</option>
                                        <option value="1-3">1 - 3 anos</option>
                                        <option value="3-5">3 - 5 anos</option>
                                        <option value="5+">Mas de 5 anos</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <input type="text" name="rank" required placeholder=" " value={formData.rank} onChange={handleInputChange} />
                                    <label>Tu Rango / Elo mas alto</label>
                                    <i className='bx bx-trophy input-icon'></i>
                                </div>
                                <div className="input-group">
                                    <select name="coachingType" required value={formData.coachingType} onChange={handleInputChange}>
                                        <option value="" disabled>Tipo de Coaching</option>
                                        <option value="individual">Individual (1 a 1)</option>
                                        <option value="team">Equipos Completos</option>
                                        <option value="group">Clases Grupales</option>
                                        <option value="vod">VOD Review</option>
                                        <option value="mixed">Mixto</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid-inputs">
                                <div className="input-group">
                                    <select name="availability" required value={formData.availability} onChange={handleInputChange}>
                                        <option value="" disabled>Disponibilidad</option>
                                        <option value="full-time">Tiempo Completo</option>
                                        <option value="part-time">Medio Tiempo</option>
                                        <option value="weekends">Solo Fines de Semana</option>
                                        <option value="flexible">Horario Flexible</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <input type="url" name="portfolio" placeholder=" " value={formData.portfolio} onChange={handleInputChange} />
                                    <label>Portfolio / Web (Opcional)</label>
                                    <i className='bx bx-link input-icon'></i>
                                </div>
                            </div>

                            <div className="input-group">
                                <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                                <label>Describe tu experiencia entrenando equipos o jugadores...</label>
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
                        iconClass="bx bx-chalkboard"
                        title="Forma talento competitivo"
                        description="Muestra tu experiencia como coach con el mismo look premium del perfil de organizador, adaptado a entrenamiento y mejora de equipos."
                        features={[
                            'Badge de Coach en tu perfil',
                            'Gestion de sesiones',
                            'Analisis de partidas',
                            'Visibilidad para equipos'
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
