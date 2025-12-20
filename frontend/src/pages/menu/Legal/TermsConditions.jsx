import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LegalPages.css';

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page-wrapper">
      <div className="legal-card">
        
      

        <div className="legal-header">
            <h1>Términos y <span className="highlight">Condiciones</span></h1>
            <p className="legal-meta">Última actualización: 19 de Diciembre, 2025</p>
        </div>

        <div className="legal-content">
            <p>Bienvenido a Esportefy. Al registrar tu equipo y participar en nuestros torneos, aceptas cumplir con las siguientes reglas.</p>

            <h2>1. Elegibilidad del Jugador</h2>
            <p>Todos los jugadores registrados en el equipo deben ser los propietarios legítimos de las cuentas de juego proporcionadas. El "smurfing" o uso de cuentas de terceros para manipular el nivel de habilidad resultará en la descalificación inmediata.</p>

            <h2>2. Conducta Deportiva</h2>
            <p>Se espera que todos los participantes mantengan un comportamiento respetuoso. El acoso, discurso de odio, o comportamiento tóxico hacia otros equipos o administradores no será tolerado.</p>

            <h2>3. Trampas y Hacks</h2>
            <p>El uso de software de terceros para obtener ventaja injusta (aimbots, wallhacks, scripts) está estrictamente prohibido. Utilizamos sistemas anti-cheat y reportes manuales. Cualquier evidencia de trampas resultará en un ban permanente de la plataforma.</p>

            <h2>4. Premios y Pagos</h2>
            <p>Los premios se distribuirán únicamente al Capitán del equipo o a través de la plataforma segura de Esportefy. Es responsabilidad del equipo repartir el premio internamente.</p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;