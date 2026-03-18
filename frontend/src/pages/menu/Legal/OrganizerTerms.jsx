import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const OrganizerTerms = () => {
  return (
    <section className="legal-page organizer-page">
        <div className="legal-wrap">
          <nav className="legal-topbar" aria-label="Paginas legales">
            <Link className="legal-link" to="/legal/terms">Terminos y Condiciones</Link>
            <Link className="legal-link" to="/legal/privacy">Privacidad</Link>
            <Link className="legal-link" to="/legal/payment-policy">Pagos</Link>
            <Link className="legal-link is-active" to="/legal/organizer-terms">Terminos de Organizador</Link>
          </nav>

        <header className="legal-box organizer-hero">
          <div className="legal-hero-row">
            <div>
              <p className="legal-mini">Gobierno y cumplimiento para operadores de torneos</p>
              <h1 className="legal-hero-title">Terminos de <span className="legal-accent">Organizador</span></h1>
              <p className="legal-hero-lead">
                Establece requisitos KYC, obligaciones de operacion y escala de sanciones para organizadores verificados.
              </p>
              <p className="legal-mini">Ultima actualizacion: 23 de febrero de 2026</p>
              <p className="legal-mini">Version legal RD: v1.0 | Fecha efectiva: 23 de febrero de 2026</p>
            </div>
            <div className="legal-hero-icon" aria-hidden="true">
              <i className="bx bx-shield-quarter"></i>
            </div>
          </div>
        </header>

          <div className="organizer-layout">
            <section className="legal-box organizer-matrix">
            <h2 className="legal-h"><i className="bx bx-id-card"></i>1. Requisitos de alta</h2>
            <p className="legal-section-mini">Verificacion previa obligatoria para operar torneos con confianza.</p>
            <ul>
              <li>Completar verificaciones de identidad y titularidad (<span className="legal-key">KYC</span>).</li>
              <li>Presentar informacion de contacto y soporte de incidencias.</li>
              <li>Aceptar auditorias operativas y financieras cuando correspondan.</li>
            </ul>
            <p>
              Las validaciones de identidad y origen de fondos pueden reforzarse en escenarios de
              riesgo conforme a la <span className="legal-key">Ley 155-17</span>.
            </p>

            <h2 className="legal-h"><i className="bx bx-task"></i>2. Deberes de operacion</h2>
            <p className="legal-section-mini">Debes gestionar reglas, tiempos y disputas de forma verificable.</p>
            <ul>
              <li>Publicar reglas completas, criterios de desempate y cronograma realista.</li>
              <li>Gestionar disputas con evidencia trazable y decisiones consistentes.</li>
              <li>Respetar politica de pagos y no desviar flujo financiero autorizado.</li>
              <li>En torneos Riot: usar formatos tradicionales, evitar apuestas y cumplir las reglas de prize pool aplicables si hay inscripcion paga.</li>
              <li>En torneos MLBB beta: no afirmar afiliacion oficial con Moonton y operar sin apuestas.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-shield-quarter"></i>3. Integridad y anticorrupcion</h2>
            <p className="legal-section-mini">La manipulacion de resultados se considera falta grave.</p>
            <p>
              Cualquier indicio de colusion, match-fixing, manipulacion de brackets,
              favoritismo oculto o fraude de premios habilita suspension inmediata y
              <span className="legal-key">retencion preventiva de fondos</span> hasta cierre de auditoria.
            </p>
            <p>
              Si la conducta involucra hechos tipificados como delitos tecnologicos, se aplicara
              el protocolo interno y, de ser necesario, se remitira a autoridades bajo la
              <span className="legal-key"> Ley 53-07</span>.
            </p>

            <h2 className="legal-h"><i className="bx bx-lock"></i>4. Datos y confidencialidad</h2>
            <p className="legal-section-mini">Solo puedes usar datos personales para operacion del torneo.</p>
            <p>
              El organizador solo puede tratar datos de participantes para fines del torneo.
              Queda prohibido compartir listados, correos o identificadores con terceros no
              autorizados por GLITCH GANG by Steliant o por la normativa aplicable.
            </p>
            </section>

            <aside className="legal-box organizer-panel">
            <h2 className="legal-h"><i className="bx bx-error-circle"></i>Escala de sanciones</h2>
            <p className="legal-section-mini">Se aplica gradualidad, salvo fraude comprobado o riesgo severo.</p>
            <ul>
              <li>Falta leve: advertencia formal y plan correctivo.</li>
              <li>Falta media: suspension temporal y restricciones de publicacion.</li>
              <li>Falta grave: baja de organizador, retencion de fondos y bloqueo de cuenta.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-image"></i>Licencia de contenido</h2>
            <p>
              Conservas derechos sobre tu marca, pero otorgas licencia no exclusiva a GLITCH GANG by Steliant
              para mostrar nombre, arte y clips del torneo en promocion de la plataforma.
            </p>

            <h2 className="legal-h"><i className="bx bx-check-double"></i>Debida diligencia financiera</h2>
            <p>
              Podemos solicitar documentacion para controles AML/CTF, origen de fondos y
              cumplimiento normativo antes de liberar operaciones de <span className="legal-key">alto riesgo</span>.
            </p>

            <div className="organizer-warning">
              Incumplimientos reiterados o fraude probado pueden escalar a reporte legal
              ante autoridades competentes segun jurisdiccion aplicable.
            </div>

            <p style={{ marginTop: 12 }}>Contacto de organizadores: organizers@esportefy.com.</p>
            </aside>
          </div>
        </div>
      </section>
  );
};

export default OrganizerTerms;
