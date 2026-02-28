import React from 'react';
import { Link } from 'react-router-dom';
import './LegalPages.css';

const PaymentPolicy = () => {
  return (
    <section className="legal-page payment-page">
        <div className="legal-wrap">
          <nav className="legal-topbar" aria-label="Paginas legales">
            <Link className="legal-link" to="/legal/terms">Terminos y Condiciones</Link>
            <Link className="legal-link" to="/legal/privacy">Privacidad</Link>
            <Link className="legal-link is-active" to="/legal/payment-policy">Politica de Pagos</Link>
            <Link className="legal-link" to="/legal/organizer-terms">Organizadores</Link>
          </nav>

        <header className="legal-box payment-hero">
          <div className="legal-hero-row">
            <div>
              <p className="legal-mini">Reglas de cobros, premios y reembolsos</p>
              <h1 className="legal-hero-title">Politica de <span className="legal-accent">Pagos</span></h1>
              <p className="legal-hero-lead">
                Resume flujo de custodia, liquidacion, comisiones y controles antifraude para eventos con dinero real.
              </p>
              <p className="legal-mini">Ultima actualizacion: 23 de febrero de 2026</p>
              <p className="legal-mini">Version legal RD: v1.0 | Fecha efectiva: 23 de febrero de 2026</p>
            </div>
            <div className="legal-hero-icon" aria-hidden="true">
              <i className="bx bx-wallet"></i>
            </div>
          </div>
        </header>

          <section className="payment-flow">
            <article className="legal-box payment-step">
            <strong><i className="bx bx-list-check" style={{ marginRight: 6 }}></i>1. Alta de torneo</strong>
            <p>El organizador define reglas, premio y metodos permitidos.</p>
            </article>
            <article className="legal-box payment-step">
            <strong><i className="bx bx-lock" style={{ marginRight: 6 }}></i>2. Custodia</strong>
            <p>Fondos de premios pueden quedar retenidos hasta validacion final.</p>
            </article>
            <article className="legal-box payment-step">
            <strong><i className="bx bx-search-alt-2" style={{ marginRight: 6 }}></i>3. Revision</strong>
            <p>Se revisan resultados, incidencias y posibles alertas antifraude.</p>
            </article>
            <article className="legal-box payment-step">
            <strong><i className="bx bx-wallet-alt" style={{ marginRight: 6 }}></i>4. Liquidacion</strong>
            <p>Se liberan pagos o reembolsos segun estado y reglas del torneo.</p>
            </article>
          </section>

          <div className="payment-layout">
            <section className="legal-box payment-card">
            <h2 className="legal-h"><i className="bx bx-receipt"></i>Comisiones, tarifas y costos externos</h2>
            <p className="legal-section-mini">La tarifa aplicable se fija al publicar el torneo y puede variar por metodo.</p>
            <ul>
              <li>Torneos gratuitos: <span className="legal-key">comision de plataforma 0%</span>.</li>
              <li>Torneos pagos: comision vigente al momento de publicacion del evento.</li>
              <li>Retiros: pueden incluir costos de pasarela, banco o conversion de moneda.</li>
            </ul>
            <p>
              La informacion de precios y condiciones se comunica bajo criterios de transparencia y
              proteccion al consumidor de la <span className="legal-key">Ley 358-05</span>.
            </p>

            <h2 className="legal-h"><i className="bx bx-rotate-left"></i>Chargebacks y pagos disputados</h2>
            <p className="legal-section-mini">Las reversiones bancarias activan controles extra y conciliacion manual.</p>
            <p>
              Si una transaccion es revertida por emisor financiero o proveedor de pagos,
              Esportefy puede retener saldos, pausar funcionalidades de cuenta o requerir
              <span className="legal-key">documentacion adicional</span> para conciliacion.
            </p>

            <h2 className="legal-h"><i className="bx bx-buildings"></i>Impuestos</h2>
            <p className="legal-section-mini">Cada usuario declara y paga tributos de su jurisdiccion.</p>
            <p>
              Cada usuario es responsable de sus obligaciones fiscales. La plataforma puede
              solicitar datos de facturacion para cumplir reportes regulatorios.
            </p>
            <p>
              Cuando aplique, el soporte documental y validez de registros electronicos se gestiona
              conforme a la <span className="legal-key">Ley 126-02</span> sobre comercio y firma digital.
            </p>
            </section>

            <aside className="legal-box payment-card">
            <h2 className="legal-h"><i className="bx bx-credit-card-front"></i>Reembolsos y cancelaciones</h2>
            <p className="legal-section-mini">Se evalua estado del torneo y costos ya consumidos antes de reembolsar.</p>
            <ul>
              <li>Cancelacion previa al inicio: reembolso total salvo costos ya ejecutados.</li>
              <li>Cancelacion con torneo iniciado: reembolso parcial segun etapa alcanzada.</li>
              <li>Fraude o incumplimiento grave: bloqueo preventivo y revision interna.</li>
            </ul>

            <h2 className="legal-h"><i className="bx bx-shield-x"></i>Pagos fuera de plataforma</h2>
            <p>
              No permitimos solicitar pagos externos cuando el torneo se publica bajo flujo
              financiero interno de Esportefy. Este control protege a jugadores y organizadores.
            </p>
            <p>
              En la beta de Mobile Legends se priorizan torneos gratuitos y se bloquean
              referencias a apuestas o gambling para reducir riesgo legal y operativo.
            </p>
            <p>
              Para prevencion de fraude y riesgos financieros, podemos aplicar verificaciones
              adicionales alineadas con obligaciones de cumplimiento de la
              <span className="legal-key"> Ley 155-17</span> cuando corresponda.
            </p>

            <h2 className="legal-h"><i className="bx bx-envelope"></i>Contacto de facturacion</h2>
            <p>Soporte de pagos: pagos@esportefy.com.</p>
            </aside>
          </div>
        </div>
      </section>
  );
};

export default PaymentPolicy;
