import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';

const PaymentPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-container">
        
       
        <div className="legal-header">
            <h1>Política de <span className="highlight-green">Pagos</span></h1>
            <p className="subtitle">Transparencia en premios y comisiones.</p>
            <p className="subtitle">Última actualización: 24 de Octubre, 2024</p>
        </div>
        

        <div className="legal-content">
            <p>En Esportefy, nos tomamos muy en serio la seguridad financiera de nuestros jugadores y organizadores. Esta política detalla cómo manejamos el dinero en la plataforma.</p>

            <h2><i className='bx bx-wallet'></i> 1. Sistema de Depósito (Escrow)</h2>
            <p>Para torneos con premio monetario garantizado:</p>
            <ul>
                <li>El Organizador debe depositar el monto total del premio en la billetera de Esportefy antes de publicar el torneo.</li>
                <li>Los fondos quedan bloqueados y seguros hasta que finaliza el evento.</li>
                <li>Esto garantiza a los jugadores que el premio existe y será pagado.</li>
            </ul>

            <h2><i className='bx bx-chart'></i> 2. Comisiones de Servicio</h2>
            <p>Esportefy cobra una comisión sobre el pozo de premios o las entradas para mantener la plataforma:</p>
            <ul>
                <li><strong>Torneos Gratuitos:</strong> 0% comisión.</li>
                <li><strong>Torneos de Pago:</strong> 5% del total recaudado por inscripciones.</li>
                <li><strong>Retiros:</strong> Pueden aplicar tarifas bancarias estándar según tu país.</li>
            </ul>

            <h2><i className='bx bx-time-five'></i> 3. Distribución de Premios</h2>
            <p>Una vez finalizado el torneo y validados los resultados:</p>
            <p>Los premios se liberan automáticamente a las billeteras de los ganadores en un plazo de <strong>24 a 48 horas</strong>. Esto permite un periodo de gracia para resolver disputas de última hora.</p>

            <h2><i className='bx bx-receipt'></i> 4. Impuestos y Facturación</h2>
            <p>Los organizadores y jugadores son responsables de declarar sus ganancias según las leyes fiscales de su país de residencia. Esportefy no retiene impuestos a menos que la ley local lo exija explícitamente.</p>

            <h2><i className='bx bx-revision'></i> 5. Reembolsos</h2>
            <p>Si un torneo se cancela:</p>
            <ul>
                <li>Se reembolsará el 100% de la entrada a los jugadores automáticamente.</li>
                <li>Si el organizador cancela por negligencia repetida, se le podrá aplicar una penalización en su cuenta.</li>
            </ul>
        </div>

      </div>
    </div>
  );
};

export default PaymentPolicy;