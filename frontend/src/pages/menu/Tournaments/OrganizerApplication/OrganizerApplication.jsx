import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../../context/NotificationContext'; 
import axios from 'axios';
import './OrganizerApplication.css';

const OrganizerApplication = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);

  // Estados para datos y archivo
  const [fileName, setFileName] = useState("Ningún archivo seleccionado");
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    orgName: '',
    eventType: '',
    website: '',
    experienceYears: '',
    maxSize: '',
    tools: '',
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
    if (!file) {
        return notify('error', 'Archivo faltante', 'Por favor sube una foto de tu documento de identidad.');
    }

    setLoading(true);

    const data = new FormData();
    data.append('document', file);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      await axios.post('http://localhost:4000/api/auth/apply-organizer', data, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      notify('success', 'Tu solicitud ha sido recibida.', 'Tu perfil está bajo revisión. Te notificaremos en 24-48 horas.');
      navigate('/tournaments');
    } catch (err) {
      notify('error', 'Error en el envío', err.response?.data?.message || 'No se pudo procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="main-content-wrapper">
        <div className="split-layout">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <div className="form-side">
                <div className="form-header">
                    <div className="badge-wrapper">
                        <span className="step-badge verify"><i className='bx bx-shield-quarter'></i> VERIFICACIÓN OFICIAL</span>
                    </div>
                    <h1>Solicitud de <span className="highlight-green">Organizador</span></h1>
                    <p>Para garantizar la seguridad de la comunidad, requerimos validar tu identidad antes de permitirte gestionar eventos y premios.</p>
                </div>

                <form className="gamer-form" onSubmit={handleSubmit}>
                    
                    {/* SECCIÓN 1: IDENTIDAD */}
                    <h4 className="section-title">Datos del Representante</h4>
                    <div className="grid-inputs">
                        <div className="input-group">
                            <input type="text" name="fullName" required placeholder=" " value={formData.fullName} onChange={handleInputChange} />
                            <label>Nombre Legal Completo</label>
                            <i className='bx bx-user input-icon'></i>
                        </div>
                        <div className="input-group">
                            <input type="text" name="idNumber" required placeholder=" " value={formData.idNumber} onChange={handleInputChange} />
                            <label>DNI / Pasaporte / ID</label>
                            <i className='bx bx-id-card input-icon'></i>
                        </div>
                    </div>

                    <div className="input-group file-upload-group">
                        <label className="static-label">Documento de Identidad (Foto/Scan)</label>
                        <div className="file-box">
                            <input type="file" id="doc-upload" className="hidden-input" accept="image/*,.pdf" onChange={handleFileChange} />
                            <label htmlFor="doc-upload" className="upload-btn">
                                <i className='bx bx-cloud-upload'></i> Subir Archivo
                            </label>
                            <span className="file-name">{fileName}</span>
                        </div>
                        <small>Formatos: PDF, JPG, PNG. Máx 5MB. (Tus datos están encriptados)</small>
                    </div>

                    {/* SECCIÓN 2: PERFIL DE ORGANIZACIÓN */}
                    <h4 className="section-title">Perfil de Organización</h4>
                    
                    <div className="grid-inputs">
                         <div className="input-group">
                            <input type="text" name="orgName" required placeholder=" " value={formData.orgName} onChange={handleInputChange} />
                            <label>Nombre de la Organización / Marca</label>
                            <i className='bx bx-building input-icon'></i>
                        </div>
                        <div className="input-group">
                            <select name="eventType" required value={formData.eventType} onChange={handleInputChange}>
                                <option value="" disabled>Tipo de Eventos</option>
                                <option value="amateur">Torneos Amateur / Comunitarios</option>
                                <option value="pro">Ligas Profesionales</option>
                                <option value="lan">Eventos Presenciales (LAN)</option>
                                <option value="mixed">Híbrido</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="url" name="website" placeholder=" " value={formData.website} onChange={handleInputChange} />
                        <label>Sitio Web o Portafolio (Opcional)</label>
                        <i className='bx bx-link input-icon'></i>
                    </div>

                    {/* --- NUEVA SECCIÓN: PREGUNTAS DE EXPERIENCIA E-SPORTS --- */}
                    <h4 className="section-title">Experiencia en eSports</h4>

                    <div className="grid-inputs">
                        <div className="input-group">
                            <select name="experienceYears" required value={formData.experienceYears} onChange={handleInputChange}>
                                <option value="" disabled>Años de Experiencia</option>
                                <option value="0-1">Menos de 1 año (Novato)</option>
                                <option value="1-3">1 - 3 años (Intermedio)</option>
                                <option value="3-5">3 - 5 años (Avanzado)</option>
                                <option value="5+">Más de 5 años (Veterano)</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <select name="maxSize" required value={formData.maxSize} onChange={handleInputChange}>
                                <option value="" disabled>Tamaño Máximo Gestionado</option>
                                <option value="small">Pequeño (Hasta 16 equipos)</option>
                                <option value="medium">Mediano (Hasta 64 equipos)</option>
                                <option value="large">Grande (Más de 64 equipos)</option>
                                <option value="massive">Masivo (Más de 500 jugadores)</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="text" name="tools" placeholder=" " value={formData.tools} onChange={handleInputChange} />
                        <label>Herramientas de Brackets que has usado (Ej: Challonge, Toornament)</label>
                        <i className='bx bx-laptop input-icon'></i>
                    </div>

                    <div className="input-group">
                        <textarea name="description" required placeholder=" " rows="3" value={formData.description} onChange={handleInputChange}></textarea>
                        <label>Cuéntanos sobre el torneo más complejo que has organizado...</label>
                    </div>

                    {/* ACTIONS */}
                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate('/tournaments')}>Cancelar</button>
                        <button type="submit" className="btn-neon green" disabled={loading}>
                            {loading ? <i className='bx bx-loader-alt bx-spin'></i> : 'Enviar Solicitud'}
                        </button>
                    </div>

                   <p className="legal-text">
    Al enviar esta solicitud, aceptas nuestros 
    <a href="/legal/organizer-terms" target="_blank" rel="noopener noreferrer"> Términos de Servicio para Organizadores </a> 
    y la 
    <a href="/legal/payment-policy" target="_blank" rel="noopener noreferrer"> Política de Pagos</a>.</p>
                </form>
            </div>

            {/* COLUMNA DERECHA: VISUAL */}
            <div className="visual-side organizer-visual">
                <div className="image-overlay green-overlay"></div>
                <img src="https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=2070&auto=format&fit=crop" alt="Esports Production" className="moving-bg" />
                
                <div className="visual-content">
                    <div className="icon-large">
                        <i className='bx bx-trophy'></i>
                    </div>
                    <h2>Lidera el Juego</h2>
                    <p>Únete a la élite de organizadores. Crea torneos, gestiona brackets y distribuye premios con herramientas profesionales.</p>
                    
                    <div className="features-list">
                        <span><i className='bx bx-check-circle'></i> Gestión de Brackets</span>
                        <span><i className='bx bx-check-circle'></i> Pagos Automatizados</span>
                        <span><i className='bx bx-check-circle'></i> Soporte 24/7</span>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default OrganizerApplication;
