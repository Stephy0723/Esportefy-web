import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { 
    FaShieldAlt, FaGamepad, FaCreditCard, FaUserSecret, 
    FaPaintBrush, FaHeadset, FaSave, FaTrash, FaDiscord, 
    FaSteam, FaCheckCircle, FaLock, FaEyeSlash, FaBug, FaExternalLinkAlt,
    FaExclamationTriangle, FaFlag 
} from 'react-icons/fa';
import './Settings.css';


export default function Settings() {
    const [activeTab, setActiveTab] = useState('security');
    const navigate = useNavigate();
    const renderContent = () => {
        switch(activeTab) {
            case 'security':
                return (
                    <div className="settings-panel fade-in">
                        <div className="panel-header">
                            <h2>Seguridad de la Cuenta</h2>
                            <p>Protege tu acceso y gestiona tus credenciales.</p>
                        </div>

                        <form className="settings-form">
                            <div className="form-group">
                                <label>Correo Electrónico (ID Principal)</label>
                                <div className="input-with-icon">
                                    <input type="email" defaultValue="usuario@esportefy.com" disabled className="input-disabled"/>
                                    <FaLock className="input-icon-lock" />
                                </div>
                                <small>Para cambiar tu correo contacta a soporte.</small>
                            </div>

                            <div className="divider"></div>

                            <h3>Cambiar Contraseña</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Contraseña Actual</label>
                                    <input type="password" placeholder="••••••••" />
                                </div>
                                <div className="form-group">
                                    <label>Nueva Contraseña</label>
                                    <input type="password" />
                                </div>
                            </div>

                            <div className="divider"></div>

                            <h3>Autenticación en Dos Pasos (2FA)</h3>
                            <div className="info-box">
                                <FaShieldAlt className="info-icon" />
                                <div>
                                    <strong>Protección Extra Desactivada</strong>
                                    <p>Recomendamos activar 2FA para evitar robos de cuentas.</p>
                                </div>
                                <button type="button" className="btn-outline">Activar</button>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-save"><FaSave /> Guardar Cambios</button>
                            </div>

                            <div className="danger-zone">
                                <div className="danger-text">
                                    <h4>Eliminar Cuenta</h4>
                                    <p>Esta acción borrará tus equipos permanentemente.</p>
                                </div>
                                <button type="button" className="btn-danger"><FaTrash /> Eliminar Cuenta</button>
                            </div>
                        </form>
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