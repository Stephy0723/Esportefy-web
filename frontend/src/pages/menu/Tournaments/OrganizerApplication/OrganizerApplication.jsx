import React, { useState } from 'react';
import Navbar from '../../../components/Navbar/Navbar';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../context/NotificationContext'; // Importar notificaciones
import './OrganizerApplication.css';

const OrganizerApplication = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);

  // Estados para simular carga de archivo
  const [fileName, setFileName] = useState("Ningún archivo seleccionado");

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulamos una petición al servidor
    setTimeout(() => {
        setLoading(false);
        // Notificación profesional en lugar de alert
        notify('success', 'Solicitud Enviada', 'Tu perfil está bajo revisión. Te notificaremos en 24-48 horas.');
        navigate('/tournaments');
    }, 2000);
  };

  return (
    <div className="reg-page">
      <Sidebar />
      <div className="main-content-wrapper">
        <Navbar />
        
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
                            <input type="text" required placeholder=" " />
                            <label>Nombre Legal Completo</label>
                            <i className='bx bx-user input-icon'></i>
                        </div>
                        <div className="input-group">
                            <input type="text" required placeholder=" " />
                            <label>DNI / Pasaporte / ID</label>
                            <i className='bx bx-id-card input-icon'></i>
                        </div>
                    </div>

                    <div className="input-group file-upload-group">
                        <label className="static-label">Documento de Identidad (Foto/Scan)</label>
                        <div className="file-box">
                            <input type="file" id="doc-upload" className="hidden-input" onChange={handleFileChange} />
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
                            <input type="text" required placeholder=" " />
                            <label>Nombre de la Organización / Marca</label>
                            <i className='bx bx-building input-icon'></i>
                        </div>
                        <div className="input-group">
                            <select required>
                                <option value="" disabled selected>Tipo de Eventos</option>
                                <option value="amateur">Torneos Amateur / Comunitarios</option>
                                <option value="pro">Ligas Profesionales</option>
                                <option value="lan">Eventos Presenciales (LAN)</option>
                                <option value="mixed">Híbrido</option>
                            </select>
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="url" placeholder=" " />
                        <label>Sitio Web o Portafolio (Opcional)</label>
                        <i className='bx bx-link input-icon'></i>
                    </div>

                    <div className="input-group">
                        <textarea required placeholder=" " rows="3"></textarea>
                        <label>Breve descripción de tu experiencia organizando eventos...</label>
                    </div>

                    {/* ACTIONS */}
                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate('/tournaments')}>Cancelar</button>
                        <button type="submit" className="btn-neon green" disabled={loading}>
                            {loading ? <i className='bx bx-loader-alt bx-spin'></i> : 'Enviar Solicitud'}
                        </button>
                    </div>

                    <p className="legal-text">
                        Al enviar esta solicitud, aceptas nuestros <a href="#">Términos de Servicio para Organizadores</a> y la <a href="#">Política de Pagos</a>.
                    </p>
                </form>
            </div>

            {/* COLUMNA DERECHA: VISUAL */}
            <div className="visual-side organizer-visual">
                <div className="image-overlay green-overlay"></div>
                {/* Imagen profesional de un evento de Esports / Producción */}
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