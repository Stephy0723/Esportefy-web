import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../../context/NotificationContext';
import { useLang } from '../../../../context/LanguageContext';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios';
import PageHud from '../../../../components/PageHud/PageHud';
import { API_URL } from '../../../../config/api';
import { getAuthToken } from '../../../../utils/authSession';
import './OrganizerApplication.css';

const REQUIRED_FIELDS = {
  fullName: 'Nombre Legal Completo',
  idNumber: 'Cédula / Pasaporte / ID',
  orgName: 'Nombre de la Organización',
  eventType: 'Tipo de Eventos',
  experienceYears: 'Años de Experiencia',
  maxSize: 'Tamaño Máximo Gestionado',
  description: 'Descripción',
};

const OrganizerApplication = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { user } = useAuth();
  const { t } = useLang();
  const prefilled = useRef(false);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

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

  useEffect(() => {
    if (user && !prefilled.current) {
      prefilled.current = true;
      setFormData(prev => ({ ...prev, fullName: prev.fullName || user.fullName || '' }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      if (formErrors.document) setFormErrors(prev => ({ ...prev, document: '' }));
    }
  };

  const validate = () => {
    const errors = {};
    Object.entries(REQUIRED_FIELDS).forEach(([key, label]) => {
      if (!String(formData[key] || '').trim()) {
        errors[key] = `${label} es obligatorio.`;
      }
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
    if (!token) {
      return notify('error', 'Sesion requerida', 'Debes iniciar sesion para enviar la solicitud.');
    }

    setLoading(true);
    const data = new FormData();
    data.append('document', file);
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      await axios.post(`${API_URL}/api/auth/apply-organizer`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      notify('success', 'Solicitud enviada', 'Tu solicitud fue enviada al correo de Steliant y quedó pendiente de confirmación por administración.');
      navigate('/profile');
    } catch (err) {
      notify('error', 'Error en el envío', err.response?.data?.message || 'No se pudo procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const fe = (field) => formErrors[field];

  return (
    <div className="reg-page">
      <PageHud page="ORGANIZADOR" />
      <div className="main-content-wrapper">
        <div className="split-layout">

            <div className="form-side">
                <div className="form-header">
                    <div className="badge-wrapper">
                        <span className="step-badge verify"><i className='bx bx-shield-quarter'></i> VERIFICACIÓN OFICIAL</span>
                    </div>
                    <h1>Solicitud de <span className="highlight-green">Organizador</span></h1>
                    <p>{t('organizerAppDesc')}</p>
                    <div className="application-review-note">
                        <i className='bx bx-envelope'></i>
                        <div>
                            <strong>{t('organizerAppAdminReview')}</strong>
                            <p>{t('organizerAppAdminReviewDesc')}</p>
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

                    <h4 className="section-title">Datos del Representante</h4>
                    <div className="grid-inputs">
                        <div className="input-group">
                            <input type="text" name="fullName" placeholder=" " value={formData.fullName} onChange={handleInputChange} className={fe('fullName') ? 'input-error' : ''} />
                            <label>{t('organizerLegalName')}</label>
                            <i className='bx bx-user input-icon'></i>
                            {fe('fullName') && <small className="field-error">{fe('fullName')}</small>}
                            {user?.fullName && !fe('fullName') && <span className="prefilled-hint"><i className='bx bx-check-circle'></i>Completado desde tu perfil</span>}
                        </div>
                        <div className="input-group">
                            <input type="text" name="idNumber" placeholder=" " value={formData.idNumber} onChange={handleInputChange} className={fe('idNumber') ? 'input-error' : ''} />
                            <label>{t('organizerIdDoc')}</label>
                            <i className='bx bx-id-card input-icon'></i>
                            {fe('idNumber') && <small className="field-error">{fe('idNumber')}</small>}
                        </div>
                    </div>

                    <div className="input-group file-upload-group">
                        <label className="static-label">Documento de Identidad (Foto/Scan)</label>
                        <div className="file-box">
                            <input type="file" id="doc-upload" className="hidden-input" accept="image/*,.pdf" onChange={handleFileChange} />
                            <label htmlFor="doc-upload" className={`upload-btn${fe('document') ? ' input-error' : ''}`}>
                                <i className='bx bx-cloud-upload'></i> Subir Archivo
                            </label>
                            <span className="file-name">{fileName}</span>
                        </div>
                        <small>{t('organizerIdFormats')}</small>
                        {fe('document') && <small className="field-error">{fe('document')}</small>}
                    </div>

                    <h4 className="section-title">Perfil de Organización</h4>

                    <div className="grid-inputs">
                         <div className="input-group">
                            <input type="text" name="orgName" placeholder=" " value={formData.orgName} onChange={handleInputChange} className={fe('orgName') ? 'input-error' : ''} />
                            <label>{t('organizerOrgName')}</label>
                            <i className='bx bx-building input-icon'></i>
                            {fe('orgName') && <small className="field-error">{fe('orgName')}</small>}
                        </div>
                        <div className="input-group">
                            <select name="eventType" value={formData.eventType} onChange={handleInputChange} className={fe('eventType') ? 'input-error' : ''}>
                                <option value="" disabled>{t('organizerEventType')}</option>
                                <option value="amateur">{t('organizerEventAmateur')}</option>
                                <option value="pro">{t('organizerEventPro')}</option>
                                <option value="lan">{t('organizerEventLan')}</option>
                                <option value="mixed">{t('organizerEventMixed')}</option>
                            </select>
                            {fe('eventType') && <small className="field-error">{fe('eventType')}</small>}
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="url" name="website" placeholder=" " value={formData.website} onChange={handleInputChange} />
                        <label>{t('organizerWebsite')}</label>
                        <i className='bx bx-link input-icon'></i>
                    </div>

                    <h4 className="section-title">Experiencia en eSports</h4>

                    <div className="grid-inputs">
                        <div className="input-group">
                            <select name="experienceYears" value={formData.experienceYears} onChange={handleInputChange} className={fe('experienceYears') ? 'input-error' : ''}>
                                <option value="" disabled>{t('organizerExperienceYears')}</option>
                                <option value="0-1">{t('organizerExperienceNovice')}</option>
                                <option value="1-3">1 - 3 años (Intermedio)</option>
                                <option value="3-5">3 - 5 años (Avanzado)</option>
                                <option value="5+">{t('organizerExperienceVeteran')}</option>
                            </select>
                            {fe('experienceYears') && <small className="field-error">{fe('experienceYears')}</small>}
                        </div>
                        <div className="input-group">
                            <select name="maxSize" value={formData.maxSize} onChange={handleInputChange} className={fe('maxSize') ? 'input-error' : ''}>
                                <option value="" disabled>{t('organizerScale')}</option>
                                <option value="small">{t('organizerScaleSmall')}</option>
                                <option value="medium">{t('organizerScaleMedium')}</option>
                                <option value="large">{t('organizerScaleLarge')}</option>
                                <option value="massive">{t('organizerScaleMassive')}</option>
                            </select>
                            {fe('maxSize') && <small className="field-error">{fe('maxSize')}</small>}
                        </div>
                    </div>

                    <div className="input-group">
                        <input type="text" name="tools" placeholder=" " value={formData.tools} onChange={handleInputChange} />
                        <label>{t('organizerTools')}</label>
                        <i className='bx bx-laptop input-icon'></i>
                    </div>

                    <div className="input-group">
                        <textarea name="description" placeholder=" " rows="3" value={formData.description} onChange={handleInputChange} className={fe('description') ? 'input-error' : ''}></textarea>
                        <label>{t('organizerBioLabel')}</label>
                        {fe('description') && <small className="field-error">{fe('description')}</small>}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-ghost" onClick={() => navigate('/tournaments')}>Cancelar</button>
                        <button type="submit" className="btn-neon green" disabled={loading}>
                            {loading ? <><i className='bx bx-loader-alt bx-spin'></i>{t('organizerSubmitting')}</> : t('organizerSubmit')}
                        </button>
                    </div>

                   <p className="legal-text">
    Al enviar esta solicitud, aceptas nuestros
    <a href="/legal/organizer-terms" target="_blank" rel="noopener noreferrer"> Términos de Servicio para Organizadores </a>
    y la
    <a href="/legal/payment-policy" target="_blank" rel="noopener noreferrer"> Política de Pagos</a>.</p>
                </form>
            </div>

            <div className="visual-side organizer-visual">
                <div className="image-overlay green-overlay"></div>
                <img src="https://images.unsplash.com/photo-1560252829-804f1aedf1be?q=80&w=2070&auto=format&fit=crop" alt="Esports Production" className="moving-bg" />

                <div className="visual-content">
                    <div className="icon-large">
                        <i className='bx bx-trophy'></i>
                    </div>
                    <h2>{t('organizerHeroTitle')}</h2>
                    <p>{t('organizerHeroDesc')}</p>

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
