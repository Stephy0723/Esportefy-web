import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const PrivacyPolicy = () => {
  return (
    <section className="legal-page privacy-page">
        <div className="legal-wrap">
          <nav className="legal-topbar" aria-label="Paginas legales">
            <Link className="legal-link" to="/legal/terms">Terminos y Condiciones</Link>
            <Link className="legal-link is-active" to="/legal/privacy">Politica de Privacidad</Link>
            <Link className="legal-link" to="/legal/payment-policy">Pagos</Link>
            <Link className="legal-link" to="/legal/organizer-terms">Organizadores</Link>
          </nav>

        <header className="legal-box privacy-hero">
          <div className="legal-hero-row">
            <div>
              <p className="legal-mini">Tratamiento de datos personales</p>
              <h1 className="legal-hero-title">Politica de <span className="legal-accent">Privacidad</span></h1>
              <p className="legal-hero-lead">
                Explica que datos usamos, por que los tratamos y como puedes ejercer tus derechos en Republica Dominicana.
              </p>
              <p className="legal-mini">Ultima actualizacion: 23 de febrero de 2026</p>
              <p className="legal-mini">Version legal RD: v1.0 | Fecha efectiva: 23 de febrero de 2026</p>
            </div>
            <div className="legal-hero-icon" aria-hidden="true">
              <i className="bx bx-shield"></i>
            </div>
          </div>
        </header>

          <div className="privacy-layout">
            <div className="privacy-stack">
            <section className="legal-box privacy-card">
              <h2 className="legal-h"><i className="bx bx-data"></i>1. Que informacion tratamos</h2>
              <p className="legal-section-mini">Solo solicitamos datos necesarios para operar y proteger la plataforma.</p>
              <ul>
                <li>Datos de registro: usuario, correo, pais y datos de perfil.</li>
                <li>Datos de actividad: torneos, interacciones y reportes moderados.</li>
                <li>Datos tecnicos: IP, tipo de dispositivo, logs de seguridad y diagnostico.</li>
              </ul>
              <p>
                Respetamos el derecho fundamental a la intimidad y proteccion de datos reconocido en el
                <span className="legal-key"> Articulo 44 de la Constitucion dominicana</span>.
              </p>
            </section>

            <section className="legal-box privacy-card">
              <h2 className="legal-h"><i className="bx bx-file-find"></i>2. Finalidades y base legal</h2>
              <p className="legal-section-mini">El tratamiento se apoya en contrato, cumplimiento legal y seguridad.</p>
              <p>
                Tratamos datos para ejecutar la relacion contractual de la plataforma, cumplir
                obligaciones legales, prevenir fraude y mantener seguridad operativa. Para acciones
                no esenciales, como comunicaciones promocionales, usamos <span className="legal-key">consentimiento</span> cuando aplica.
              </p>
              <p>
                El tratamiento se ajusta a principios de calidad, finalidad y proporcionalidad de la
                <span className="legal-key"> Ley 172-13</span>.
              </p>
            </section>

            <section className="legal-box privacy-card">
              <h2 className="legal-h"><i className="bx bx-transfer-alt"></i>3. Retencion, transferencias y terceros</h2>
              <p className="legal-section-mini">Aplicamos controles de seguridad en proveedores y almacenamiento.</p>
              <p>
                Conservamos informacion durante el tiempo necesario para operacion, auditoria,
                defensa legal y cumplimiento fiscal/regulatorio. Podemos usar proveedores de
                infraestructura y pagos bajo clausulas de <span className="legal-key">confidencialidad</span> y seguridad razonables.
              </p>
              <p>
                Si hay transferencias internacionales de datos, aplicamos salvaguardas contractuales
                y controles tecnicos acordes a la normativa dominicana aplicable.
              </p>
            </section>

            <section className="legal-box privacy-card">
              <h2 className="legal-h"><i className="bx bx-cookie"></i>4. Cookies y tecnologias similares</h2>
              <p className="legal-section-mini">Puedes gestionar cookies en navegador, con impacto funcional parcial.</p>
              <p>
                Utilizamos cookies tecnicas y de sesion para autenticacion, seguridad y mejora de
                experiencia. Puedes gestionar cookies desde tu navegador, aunque algunas funciones
                podrian quedar limitadas.
              </p>
            </section>
            </div>

            <aside className="legal-box privacy-rights">
            <h2 className="legal-h"><i className="bx bx-user-check"></i>Derechos de titulares</h2>
            <p className="legal-section-mini">Puedes ejercer tus derechos en cualquier momento por canal oficial.</p>
            <ul>
              <li><span className="legal-key">Acceso</span> a datos personales y origen del tratamiento.</li>
              <li><span className="legal-key">Rectificacion</span> o actualizacion de datos inexactos.</li>
              <li><span className="legal-key">Eliminacion</span> cuando no exista obligacion de conservacion.</li>
              <li>Oposicion a usos no esenciales o marketing.</li>
              <li>Portabilidad cuando la ley local lo habilite.</li>
            </ul>
            <p>
              Tambien puedes ejercer acciones de defensa de derechos fundamentales como
              <span className="legal-key"> habeas data</span> conforme a la legislacion vigente.
            </p>

            <h2 className="legal-h"><i className="bx bx-child"></i>Menores de edad</h2>
            <p>
              Si la normativa de tu pais exige autorizacion parental para usuarios menores,
              debes contar con ella antes de crear cuenta y participar en servicios de pago.
            </p>

            <h2 className="legal-h"><i className="bx bx-envelope"></i>Contacto de privacidad</h2>
            <p>Solicitudes de privacidad: privacidad@glitchgang.net.</p>
            </aside>
          </div>
        </div>
      </section>
  );
};

export default PrivacyPolicy;
