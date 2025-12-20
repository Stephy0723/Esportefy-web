import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';

const OrganizerTerms = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        
     

        <div className="legal-header">
            <h1>Términos de <span className="highlight-green">Servicio</span></h1>
            <p className="subtitle">Última actualización: 24 de Octubre, 2024</p>
        </div>

        <div className="legal-content">
            <p>Bienvenido a Esportefy. Estos términos rigen el uso de nuestra plataforma para la creación, gestión y administración de torneos de deportes electrónicos.</p>

            <h2><i className='bx bx-shield-quarter'></i> 1. Elegibilidad y Verificación</h2>
            <p>Para convertirte en un Organizador Verificado, debes completar nuestro proceso de KYC (Know Your Customer). Nos reservamos el derecho de rechazar cualquier solicitud que no cumpla con nuestros estándares de seguridad o reputación.</p>
            
            <h2><i className='bx bx-trophy'></i> 2. Responsabilidad del Torneo</h2>
            <p>Como organizador, eres el único responsable de:</p>
            <ul>
                <li>La configuración correcta de las reglas, formatos y fechas del torneo.</li>
                <li>La moderación de las disputas entre jugadores durante el evento.</li>
                <li>Garantizar que la descripción de los premios coincida con lo entregado.</li>
            </ul>

            <h2><i className='bx bx-money'></i> 3. Gestión de Premios</h2>
            <p>Esportefy actúa como custodio (escrow) de los premios monetarios cuando se utiliza nuestra pasarela de pago. Los organizadores <strong>no deben</strong> solicitar pagos directos fuera de la plataforma para inscripciones, a menos que sea un evento presencial autorizado.</p>

            <h2><i className='bx bx-block'></i> 4. Conducta Prohibida</h2>
            <p>Se revocará inmediatamente el estado de organizador si se detecta:</p>
            <ul>
                <li>Fraude en la distribución de premios.</li>
                <li>Manipulación de brackets o resultados (Match-fixing).</li>
                <li>Comportamiento abusivo hacia los participantes.</li>
            </ul>

            <h2><i className='bx bx-copyright'></i> 5. Propiedad Intelectual</h2>
            <p>Tú mantienes los derechos sobre tu marca y torneo. Sin embargo, otorgas a Esportefy una licencia para transmitir, promocionar y mostrar tu torneo en nuestra sección "En Vivo" y materiales de marketing.</p>
        </div>

      </div>
    </div>
  );
};

export default OrganizerTerms;
