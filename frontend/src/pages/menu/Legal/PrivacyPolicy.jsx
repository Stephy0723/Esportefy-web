import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <div className="legal-card">
        
     

        <div className="legal-header">
            <h1>Política de <span className="highlight">Privacidad</span></h1>
            <p className="legal-meta">Protegiendo tus datos y tu juego.</p>
        </div>

        <div className="legal-content">
            <p>En Esportefy, tu privacidad es tan importante como tu rendimiento en el juego. Esta política explica qué datos recopilamos.</p>

            <h2>1. Datos que Recopilamos</h2>
            <p>Recopilamos información necesaria para la gestión de torneos: Nombre de usuario, ID de juego (Riot ID, Steam ID, etc.), correo electrónico y registros de partidas.</p>

            <h2>2. Uso de la Información</h2>
            <p>Utilizamos tus datos para:</p>
            <ul>
                <li>Verificar tu identidad y propiedad de la cuenta de juego.</li>
                <li>Procesar los pagos de premios y entradas.</li>
                <li>Contactarte en caso de disputas de partidas.</li>
            </ul>

            <h2>3. Terceros</h2>
            <p>No vendemos tus datos a terceros. Compartimos información mínima necesaria con procesadores de pago (como PayPal) únicamente para ejecutar transacciones financieras.</p>

            <h2>4. Seguridad</h2>
            <p>Tus datos están encriptados y almacenados en servidores seguros. Mantenemos copias de seguridad para prevenir pérdida de información crítica del torneo.</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;