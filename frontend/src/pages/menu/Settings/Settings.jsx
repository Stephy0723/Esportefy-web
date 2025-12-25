import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { 
    FaShieldAlt, FaGamepad, FaCreditCard, FaUserSecret, 
    FaPaintBrush, FaHeadset, FaSave, FaTrash, FaDiscord, 
    FaSteam, FaCheckCircle, FaLock, FaEyeSlash, FaBug, FaExternalLinkAlt,
    FaExclamationTriangle, FaFlag, FaEnvelope, FaKey, FaMobileAlt, 
    FaApple, FaAndroid, FaWindows, FaLinux 
} from 'react-icons/fa';
import './Settings.css';


export default function Settings() {
    const [activeTab, setActiveTab] = useState('security');
    const navigate = useNavigate();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const renderContent = () => {
        switch(activeTab) {
           case 'security':
    return (
        <div className="settings-panel fade-in">
            <div className="panel-header">
                <h2>Seguridad de la Cuenta</h2>
                <p>Protege tu acceso y gestiona tus credenciales de jugador profesional.</p>
            </div>

            <div className="settings-form">
                {/* --- CAMBIO DE CORREO --- */}
                <div className="security-section">
                    <div className="section-title-box">
                        <FaEnvelope className="section-icon" />
                        <h3>ID Principal y Contacto</h3>
                    </div>
                    <div className="form-group">
                        <label>Correo Electrónico Actual</label>
                        <div className="input-with-action">
                            <input type="email" defaultValue="usuario@esportefy.com" disabled className="input-disabled"/>
                            <button type="button" className="btn-small-neon" onClick={() => alert("Iniciando proceso de cambio de correo...")}>
                                Cambiar Correo
                            </button>
                        </div>
                        <p className="input-helper">Usa esta opción en caso de pérdida de acceso o para actualizar tu identidad principal.</p>
                    </div>
                </div>

                <div className="divider"></div>

                {/* --- CONTRASEÑA ESTILO FORGOT PASSWORD --- */}
                <div className="security-section">
                    <div className="section-title-box">
                        <FaKey className="section-icon" />
                        <h3>Credenciales de Acceso</h3>
                    </div>
                    <div className="info-box-status">
                        <div className="info-text">
                            <strong>Cambiar Contraseña</strong>
                            <p>Te enviaremos un código de seguridad al correo para validar que eres tú antes de permitir el cambio.</p>
                        </div>
                        <button type="button" className="btn-save" onClick={() => alert("Código enviado al correo vinculado.")}>
                            Enviar Código
                        </button>
                    </div>
                </div>

                <div className="divider"></div>

                {/* --- 2FA MULTIPLATAFORMA --- */}
                <div className="security-section">
                    <div className="section-title-box">
                        <FaShieldAlt className="section-icon" />
                        <h3>Autenticación en Dos Pasos (2FA)</h3>
                    </div>
                    <p className="section-desc">Vincula tus dispositivos para una protección total:</p>
                    
                    <div className="platform-auth-grid">
                        <div className="platform-card">
                            <div className="plat-info">
                                <FaAndroid /> <FaApple />
                                <span>Móvil (Android / iOS)</span>
                            </div>
                            <button type="button" className="btn-status-toggle">Vincular</button>
                        </div>
                        <div className="platform-card">
                            <div className="plat-info">
                                <FaWindows /> <FaLinux />
                                <span>Desktop (PC)</span>
                            </div>
                            <button type="button" className="btn-status-toggle">Vincular</button>
                        </div>
                    </div>
                </div>

                {/* --- ELIMINAR CUENTA CON DESPEDIDA --- */}
                <div className="danger-zone-v2">
                    {!showDeleteConfirm ? (
                        <div className="danger-flex">
                            <div className="danger-content">
                                <h4>Zona de Peligro</h4>
                                <p>Esta acción es definitiva. Tu cuenta y estadísticas desaparecerán.</p>
                            </div>
                            <button type="button" className="btn-danger-minimal" onClick={() => setShowDeleteConfirm(true)}>
                                <FaTrash /> Eliminar Cuenta
                            </button>
                        </div>
                    ) : (
                        <div className="delete-confirmation-box fade-in">
                            <FaExclamationTriangle className="warning-icon-big" />
                            <h3>¿Es este el final de la partida?</h3>
                            <p className="farewell-text">
                                Nos duele verte partir. Tu legado en Esportefy, tus victorias acumuladas y tus equipos 
                                se desvanecerán en el vacío digital para siempre. Ha sido un honor tenerte en nuestra comunidad. <br/>
                                <strong>¿Confirmas que deseas eliminar tu cuenta permanentemente?</strong>
                            </p>
                            <div className="confirm-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Me quedo a jugar</button>
                                <button type="button" className="btn-delete-final" onClick={() => {
                                    localStorage.removeItem('esportefyUser');
                                    navigate('/');
                                }}>Adiós, Esportefy</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
            case 'connections':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Conexiones (Game ID)</h2>
                            <p>Vincula tus cuentas para verificar estadísticas en torneos.</p>
                        </div>

                        <div className="integrations-grid">
                            <div className="integration-card connected">
                                <div className="int-status"><FaCheckCircle /> Conectado</div>
                                <div className="int-icon discord"><FaDiscord /></div>
                                <div className="int-details">
                                    <h4>Discord</h4>
                                    <span>Salyl#1234</span>
                                </div>
                                <button className="btn-disconnect">Desvincular</button>
                            </div>

                            <div className="integration-card">
                                <div className="int-status pending">No Conectado</div>
                                <div className="int-icon riot"><FaGamepad /></div>
                                <div className="int-details">
                                    <h4>Riot Games</h4>
                                    <span>LoL / Valorant</span>
                                </div>
                                <button className="btn-connect">Conectar</button>
                            </div>

                            <div className="integration-card">
                                <div className="int-status pending">No Conectado</div>
                                <div className="int-icon steam"><FaSteam /></div>
                                <div className="int-details">
                                    <h4>Steam</h4>
                                    <span>CS:GO / Dota 2</span>
                                </div>
                                <button className="btn-connect">Conectar</button>
                            </div>
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Apariencia e Interfaz</h2>
                            <p>Personaliza tu experiencia visual y privacidad.</p>
                        </div>

                        <div className="toggles-list">
                            {/* MODO STREAMER (Vital para gamers) */}
                            <div className="toggle-item streamer-mode-box">
                                <div className="toggle-info">
                                    <div className="icon-title">
                                        <FaEyeSlash style={{color: '#a55eea'}} /> 
                                        <h4>Modo Streamer</h4>
                                    </div>
                                    <p>Oculta correos electrónicos, IDs de invitación y notificaciones sensibles mientras transmites.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round purple-slider"></span>
                                </label>
                            </div>

                            <div className="divider"></div>

                            <h3>Tema de Interfaz</h3>
                            <div className="theme-selector">
                                <div className="theme-option active">
                                    <div className="theme-preview dark"></div>
                                    <span>Esportefy Dark</span>
                                </div>
                                <div className="theme-option">
                                    <div className="theme-preview midnight"></div>
                                    <span>OLED Black</span>
                                </div>
                                <div className="theme-option">
                                    <div className="theme-preview contrast"></div>
                                    <span>Alto Contraste</span>
                                </div>
                            </div>
                            
                            <div className="divider"></div>
                            
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Reducir Movimiento</h4>
                                    <p>Desactiva animaciones complejas (Mejora rendimiento).</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

            case 'preferences':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Privacidad</h2>
                            <p>Configura quién puede interactuar contigo.</p>
                        </div>

                        <div className="toggles-list">
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Invitaciones de Equipos</h4>
                                    <p>Permitir ofertas de fichaje de cualquier capitán.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Estado "En Línea"</h4>
                                    <p>Visible para amigos y compañeros.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                );

case 'billing':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Suscripción y Pagos</h2>
                            <p>Elige cómo quieres competir. Todos los planes incluyen estadísticas profesionales.</p>
                        </div>

                        {/* 1. PLAN ACTUAL (GRATUITO) */}
                        <div className="current-plan-section">
                            <h4>TU PLAN ACTUAL</h4>
                            <div className="plan-card rookie-wide">
                                <div className="rookie-info">
                                    <h3>Rookie (Gratis)</h3>
                                    <p>Perfecto para comenzar tu carrera.</p>
                                </div>
                                <div className="rookie-features">
                                    <span><FaCheckCircle /> Stats Avanzados (KDA, Heatmaps)</span>
                                    <span><FaCheckCircle /> 1 Equipo por Juego</span>
                                    <span><FaCheckCircle /> Torneos Públicos</span>
                                </div>
                                <div className="rookie-status">
                                    ACTIVO
                                </div>
                            </div>
                        </div>

                        <div className="divider" style={{margin: '3rem 0'}}></div>

                        {/* 2. OPCIONES DE PAGO (MENSUAL vs ANUAL) */}
                        <div className="upgrade-title">
                            <h3>MEJORA TU NIVEL</h3>
                            <p>Desbloquea multigestión y prioridad.</p>
                        </div>

                        <div className="billing-grid-comparison">
                            
                            {/* MENSUAL */}
                            <div className="plan-card monthly">
                                <div className="plan-header">
                                    <h3>Elite Mensual</h3>
                                    <div className="price">RD$ 250 <span className="period">/mes</span></div>
                                    <p>Flexibilidad total.</p>
                                </div>
                                <ul className="plan-features">
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Multi-Equipos:</strong> Crea varios equipos del mismo juego (Ej: 2 rosters de Valorant).*</li>
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Priority Pass:</strong> Entra primero en torneos llenos.</li>
                                    <li><FaCheckCircle className="icon-check neon" /> <strong>Comisiones Reducidas</strong> al organizar.</li>
                                    <li><FaCheckCircle className="icon-check neon" /> Insignia de Perfil Elite.</li>
                                </ul>
                                <small className="disclaimer">*No puedes inscribir dos equipos propios en el mismo torneo.</small>
                                <button className="btn-upgrade-outline">
                                    SUSCRIBIRSE
                                </button>
                            </div>

                            {/* ANUAL (BEST VALUE) */}
                            <div className="plan-card annual">
                                <div className="glow-effect"></div>
                                <div className="best-value-badge">MEJOR VALOR</div>
                                <div className="plan-header">
                                    <h3>Legend Anual</h3>
                                    <div className="price">RD$ 2,500 <span className="period">/año</span></div>
                                    <p>Ahorras RD$ 500 (2 meses gratis).</p>
                                </div>
                                <ul className="plan-features">
                                    <li><FaCheckCircle className="icon-check gold" /> <strong>Todos los beneficios Elite.</strong></li>
                                    <li><FaCheckCircle className="icon-check gold" /> <strong>2 Meses GRATIS</strong> incluidos.</li>
                                    <li><FaCheckCircle className="icon-check gold" /> Borde de perfil <strong>Dorado Exclusivo</strong>.</li>
                                    <li><FaCheckCircle className="icon-check gold" /> Soporte directo por WhatsApp.</li>
                                </ul>
                                <button className="btn-upgrade-full">
                                    AHORRAR Y SUSCRIBIRSE
                                </button>
                            </div>

                        </div>
                    </div>
                );

            // --- NUEVA PESTAÑA: REPORTAR ---
            case 'report':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Centro de Reportes</h2>
                            <p>Denuncia conductas inapropiadas, errores o problemas.</p>
                        </div>

                        {/* BANNER HERO DE REPORTE */}
                        <div className="support-hero-banner">
                            <div className="banner-content">
                                <div className="banner-icon">
                                    <FaExclamationTriangle />
                                </div>
                                <div className="banner-text">
                                    <h3>REPORTAR</h3>
                                    <p>Selecciona la categoría y describe la situación. Tu reporte es anónimo.</p>
                                    
                                    <div className="report-actions">
                                        <select className="select-banner">
                                            <option>Error / Bug de la Web</option>
                                            <option>Un Equipo (Trampas/Conducta)</option>
                                            <option>Una Organización</option>
                                            <option>Un Jugador (Toxicidad)</option>
                                            <option>Problema de Pagos</option>
                                        </select>
                                        <button className="btn-banner-action">
                                            HACER REPORTE
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="info-box" style={{marginTop: '2rem'}}>
                            <FaFlag className="info-icon" />
                            <div>
                                <strong>Historial de Reportes</strong>
                                <p>No tienes reportes activos pendientes de revisión.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'support':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Soporte y Ayuda</h2>
                            <p>¿Encontraste un bug o necesitas ayuda?</p>
                        </div>

                        <div className="support-grid">
                           <div className="support-card">
    <FaHeadset className="support-icon" />
    <h4>Centro de Ayuda</h4>
    <p>Preguntas frecuentes y tutoriales.</p>
    
    {/* AQUÍ ESTÁ EL CAMBIO: onClick */}
    <button 
        className="btn-ghost small" 
        onClick={() => navigate('/support')}
    >
        Ver FAQ <FaExternalLinkAlt style={{fontSize:'0.7rem', marginLeft:'5px'}}/>
    </button>
</div>
                            
                            <div className="support-card">
                                <FaDiscord className="support-icon" style={{color: '#5865F2'}} />
                                <h4>Comunidad Discord</h4>
                                <p>Ayuda en tiempo real con moderadores.</p>
                                <button className="btn-ghost small">Unirse al Server</button>
                            </div>
                        </div>

                        <div className="app-version">
                            <span>Esportefy Web v1.0.4 (Beta)</span>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-layout">
                {/* SIDEBAR DE NAVEGACIÓN */}
                <aside className="settings-sidebar">
                    <div className="sidebar-header">
                        <h3>Ajustes</h3>
                    </div>
                    <nav className="settings-nav">
                        <button className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                            <FaShieldAlt /> Seguridad
                        </button>
                        <button className={`nav-item ${activeTab === 'connections' ? 'active' : ''}`} onClick={() => setActiveTab('connections')}>
                            <FaGamepad /> Conexiones
                        </button>
                        <button className={`nav-item ${activeTab === 'appearance' ? 'active' : ''}`} onClick={() => setActiveTab('appearance')}>
                            <FaPaintBrush /> Apariencia
                        </button>
                        <button className={`nav-item ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
                            <FaUserSecret /> Privacidad
                        </button>
                        <button className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>
                            <FaCreditCard /> Suscripción
                        </button>
                        
                        <div className="divider" style={{margin: '0.5rem 0'}}></div>
                        
                        {/* PESTAÑA REPORTAR */}
                        <button className={`nav-item ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>
                            <FaExclamationTriangle /> Reportar
                        </button>
                        
                        {/* PESTAÑA SOPORTE */}
                        <button className={`nav-item ${activeTab === 'support' ? 'active' : ''}`} onClick={() => setActiveTab('support')}>
                            <FaHeadset /> Soporte
                        </button>
                    </nav>
                </aside>

                {/* ÁREA DE CONTENIDO */}
                <main className="settings-content">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
}