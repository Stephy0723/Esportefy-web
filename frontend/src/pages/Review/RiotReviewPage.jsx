import React from 'react';
import { Link } from 'react-router-dom';
import './RiotReviewPage.css';

const reviewModeEnabled = String(import.meta.env.VITE_RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true';
const minActiveParticipants = String(import.meta.env.VITE_RIOT_MIN_ACTIVE_PARTICIPANTS || '20').trim() || '20';

const RiotReviewPage = () => {
  return (
    <div className="riot-review-page">
      <section className="riot-review-page__hero">
        <span className="riot-review-page__eyebrow">Riot Review Build</span>
        <h1>Review publica para Riot</h1>
        <p>
          Esta ruta resume el alcance real del prototipo que se enviara a Riot para revision. El objetivo es
          mostrar una build funcional, auditable y alineada con integridad competitiva.
        </p>

        <div className="riot-review-page__chips">
          <span className={`riot-review-page__chip ${reviewModeEnabled ? 'is-active' : ''}`}>
            Review mode: {reviewModeEnabled ? 'activo' : 'inactivo'}
          </span>
          <span className="riot-review-page__chip">Minimo Riot: {minActiveParticipants} participantes</span>
          <span className="riot-review-page__chip">VALORANT: consentimiento via Riot Sign On</span>
        </div>
      </section>

      <section className="riot-review-page__grid">
        <article className="riot-review-page__card">
          <h2>Que hace esta build</h2>
          <ul>
            <li>Vincula una identidad Riot para League of Legends mediante OTP por correo.</li>
            <li>Aplica controles de elegibilidad e integridad para torneos Riot.</li>
            <li>Usa un flujo separado de consentimiento para VALORANT cuando el entorno lo tiene habilitado.</li>
            <li>Mantiene la API key Riot en backend y evita contextos publicos con una dev key.</li>
          </ul>
        </article>

        <article className="riot-review-page__card">
          <h2>Que no hace</h2>
          <ul>
            <li>No usa endpoints no documentados ni scraping.</li>
            <li>No afirma partnership ni aprobacion oficial de Riot Games.</li>
            <li>No crea ladders alternos de MMR o ELO.</li>
            <li>No expone funciones de shaming publico sobre rendimiento individual.</li>
          </ul>
        </article>
      </section>

      <section className="riot-review-page__card">
        <h2>Flujo recomendado para review</h2>
        <ol>
          <li>Inicia sesion con una cuenta de review entregada por el equipo.</li>
          <li>Abre <strong>Settings &gt; Conexiones &gt; Centro Riot</strong>.</li>
          <li>Vincula tu identidad Riot para LoL usando OTP por correo.</li>
          <li>Si VALORANT esta habilitado en este entorno, completa Riot Sign On para otorgar consentimiento.</li>
          <li>Crea o revisa un torneo Riot y confirma que las reglas de integridad se apliquen.</li>
        </ol>
      </section>

      <section className="riot-review-page__grid">
        <article className="riot-review-page__card">
          <h2>Que revisar en torneos Riot</h2>
          <ul>
            <li>Formatos tradicionales solamente.</li>
            <li>Minimo de participantes activos antes de iniciar.</li>
            <li>Bloqueo de betting o gambling.</li>
            <li>Controles de duplicado para identidades Riot dentro de rosters y registros.</li>
          </ul>
        </article>

        <article className="riot-review-page__card">
          <h2>Documentos publicos</h2>
          <div className="riot-review-page__links">
            <Link to="/legal/terms">Terminos y condiciones</Link>
            <Link to="/legal/privacy">Politica de privacidad</Link>
            <Link to="/legal/payment-policy">Politica de pagos</Link>
            <Link to="/legal/organizer-terms">Terminos de organizador</Link>
            <Link to="/docs">Documentacion</Link>
          </div>
        </article>
      </section>

      <section className="riot-review-page__note">
        <strong>Nota:</strong> la experiencia completa de VALORANT depende de la aprobacion de Riot para Production Key
        y del posterior setup de Riot Sign On. Esta build deja el flujo y el consentimiento visibles desde ya.
      </section>
    </div>
  );
};

export default RiotReviewPage;
