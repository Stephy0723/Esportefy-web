import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const TermsConditions = () => {
  return (
    <section className="legal-page terms-page">
        <div className="legal-wrap">
          <nav className="legal-topbar" aria-label="Paginas legales">
            <Link className="legal-link is-active" to="/legal/terms">Terminos y Condiciones</Link>
            <Link className="legal-link" to="/legal/privacy">Privacidad</Link>
            <Link className="legal-link" to="/legal/payment-policy">Pagos</Link>
            <Link className="legal-link" to="/legal/organizer-terms">Organizadores</Link>
          </nav>

        <header className="legal-box terms-hero">
          <div className="legal-hero-row">
            <div>
              <p className="legal-mini">Marco general de uso de plataforma</p>
              <h1 className="legal-hero-title">Terminos y <span className="legal-accent">Condiciones</span></h1>
              <p className="legal-hero-lead">
                Define tus derechos, deberes, reglas de uso y mecanismo de solucion de disputas en Esportefy.
              </p>
              <p className="legal-mini">Ultima actualizacion: 23 de febrero de 2026</p>
              <p className="legal-mini">Version legal RD: v1.0 | Fecha efectiva: 23 de febrero de 2026</p>
            </div>
            <div className="legal-hero-icon" aria-hidden="true">
              <i className="bx bx-file"></i>
            </div>
          </div>
        </header>

          <div className="terms-grid">
            <article className="legal-box terms-article">
            <h2 className="legal-h"><i className="bx bx-check-shield"></i>1. Aceptacion contractual</h2>
            <p className="legal-section-mini">Cuando usas Esportefy, existe un acuerdo legal activo.</p>
            <p>
              Al crear una cuenta, iniciar sesion o participar en funcionalidades de Esportefy,
              aceptas estos <span className="legal-key">terminos</span> y las politicas vinculadas.
              Si no estas de acuerdo con el contenido vigente, debes dejar de utilizar el servicio.
            </p>
            <p>
              Este documento se interpreta conforme a la <span className="legal-key">Constitucion de la Republica Dominicana</span>,
              en especial el derecho a la tutela judicial efectiva y seguridad juridica.
            </p>

            <h2 className="legal-h"><i className="bx bx-lock-alt"></i>2. Cuenta, seguridad y uso permitido</h2>
            <p className="legal-section-mini">Tu cuenta es personal y su seguridad es tu responsabilidad directa.</p>
            <p>
              Debes mantener informacion exacta y proteger tus credenciales. Esta prohibido
              compartir cuentas, <span className="legal-key">suplantar identidad</span>, usar bots
              no autorizados o manipular resultados de partidas y torneos.
            </p>

            <h2 className="legal-h"><i className="bx bx-gavel"></i>3. Conducta y enforcement</h2>
            <p className="legal-section-mini">Las faltas se investigan y se sancionan segun gravedad.</p>
            <ul>
              <li>No se permite acoso, discurso discriminatorio, amenazas ni <span className="legal-key">fraude</span>.</li>
              <li>Esportefy puede investigar reportes y aplicar suspensiones, bloqueos o bajas.</li>
              <li>Las decisiones disciplinarias pueden incluir retencion temporal de beneficios.</li>
              <li>Las conductas informaticas ilicitas se evaluan segun la <span className="legal-key">Ley 53-07</span>.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-trophy"></i>4. Torneos y disputas competitivas</h2>
            <p className="legal-section-mini">Las reglas del torneo prevalecen durante toda la competencia.</p>
            <p>
              Las reglas de cada torneo son obligatorias para equipos y organizadores.
              En caso de disputa, Esportefy puede solicitar evidencia y establecer una resolucion
              final para preservar <span className="legal-key">integridad competitiva</span>.
            </p>

            <h2 className="legal-h"><i className="bx bx-mobile-alt"></i>4.1 Mobile Legends (alcance beta)</h2>
            <p className="legal-section-mini">Las verificaciones MLBB se basan en datos declarados por el usuario y control interno.</p>
            <ul>
              <li>Esportefy no declara afiliacion, partnership ni respaldo oficial de Moonton.</li>
              <li>Se valida identidad con User ID + Zone ID y controles anti-duplicado.</li>
              <li>Se prohibe contenido o dinamicas de apuestas, cuotas o gambling en torneos MLBB.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-server"></i>5. Disponibilidad del servicio</h2>
            <p className="legal-section-mini">Mantenimientos y terceros pueden afectar el acceso de forma temporal.</p>
            <p>
              El servicio se presta sobre base de disponibilidad razonable. Podran existir
              mantenimientos, incidentes o limitaciones de terceros que afecten temporalmente
              funciones, pagos o comunicaciones.
            </p>

            <h2 className="legal-h"><i className="bx bx-refresh"></i>6. Jurisdiccion y cambios de terminos</h2>
            <p className="legal-section-mini">Los cambios entran en vigor al publicarse en su version vigente.</p>
            <p>
              Podemos modificar estos terminos por motivos operativos, regulatorios o de seguridad.
              Los cambios relevantes se informaran por medios razonables. El uso continuado del
              servicio implica aceptacion de la <span className="legal-key">version vigente</span>.
            </p>
            <p>
              Para controversias, las partes se someten a jurisdiccion de tribunales competentes
              de la <span className="legal-key">Republica Dominicana</span>, salvo norma imperativa distinta.
            </p>
            </article>

            <aside className="legal-box terms-aside">
            <h2 className="legal-h"><i className="bx bx-bulb"></i>Resumen rapido</h2>
            <ul>
              <li>Edad minima sugerida: 13+ con autorizacion legal cuando aplique.</li>
              <li>Actividades ilegales o de fraude generan cierre de cuenta.</li>
              <li>La marca y logos de terceros mantienen sus propietarios originales.</li>
              <li>No existe cesion de derechos de Esportefy por tolerancia de conductas previas.</li>
              <li>Consumidores mantienen proteccion bajo <span className="legal-key">Ley 358-05</span>.</li>
              <li>Tambien se reconoce la tutela del consumidor del <span className="legal-key">Articulo 53 constitucional</span>.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-envelope"></i>Canal formal</h2>
            <p>Para notificaciones legales y solicitudes formales: soporte@esportefy.com.</p>
            </aside>
          </div>
        </div>
      </section>
  );
};

export default TermsConditions;
