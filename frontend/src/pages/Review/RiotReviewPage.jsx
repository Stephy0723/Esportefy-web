import React from 'react';
import { Link } from 'react-router-dom';
import {
  RIOT_INTEGRATION_ENABLED,
  RIOT_PENDING_APPROVAL_MESSAGE
} from '../../../../shared/riotFeatureFlags.js';
import './RiotReviewPage.css';

const reviewModeEnabled = String(import.meta.env.VITE_RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true';
const minActiveParticipants = String(import.meta.env.VITE_RIOT_MIN_ACTIVE_PARTICIPANTS || '20').trim() || '20';
const PUBLIC_REVIEW_LINKS = [
  { to: '/torneos/publicos', label: 'Explorador publico de torneos' },
  { to: '/docs', label: 'Documentacion publica' },
  { to: '/legal/terms', label: 'Terminos y condiciones' },
  { to: '/legal/privacy', label: 'Politica de privacidad' },
  { to: '/legal/payment-policy', label: 'Politica de pagos' },
  { to: '/legal/organizer-terms', label: 'Terminos de organizador' },
];

const RiotReviewPage = () => {
  return (
    <div className="riot-review-page">
      <section className="riot-review-page__hero">
        <span className="riot-review-page__eyebrow">Riot Review Build</span>
        <h1>{RIOT_INTEGRATION_ENABLED ? 'Review publica para Riot' : 'Review Riot en pausa'}</h1>
        <p>
          {RIOT_INTEGRATION_ENABLED
            ? 'Esta ruta resume el alcance real del prototipo que se enviara a Riot para revision. El objetivo es mostrar una build funcional, auditable y alineada con integridad competitiva.'
            : `${RIOT_PENDING_APPROVAL_MESSAGE} Esta ruta queda como referencia técnica mientras el flujo oficial sigue desactivado.`}
        </p>

        <div className="riot-review-page__chips">
          <span className={`riot-review-page__chip ${reviewModeEnabled ? 'is-active' : ''}`}>
            Review mode: {reviewModeEnabled ? 'activo' : 'inactivo'}
          </span>
          <span className="riot-review-page__chip">Minimo Riot: {minActiveParticipants} participantes</span>
          <span className="riot-review-page__chip">
            {RIOT_INTEGRATION_ENABLED ? 'VALORANT: consentimiento via Riot Sign On' : 'VALORANT: validacion manual temporal'}
          </span>
        </div>
      </section>

      <section className="riot-review-page__card">
        <h2>Acceso para review</h2>
        <div className="riot-review-page__review-grid">
          <article className="riot-review-page__mini-card">
            <strong>Sin login</strong>
            <p>
              Esta build expone rutas publicas para que el equipo de review pueda validar
              la navegacion base, documentos legales y vitrina publica de torneos sin crear cuentas.
            </p>
          </article>
          <article className="riot-review-page__mini-card">
            <strong>Con credenciales de demo</strong>
            <p>
              El flujo protegido debe revisarse con una cuenta de demo entregada por el equipo.
              No requiere Discord, descarga externa ni revision de source code.
            </p>
          </article>
        </div>
        <div className="riot-review-page__links" style={{ marginTop: '1rem' }}>
          {PUBLIC_REVIEW_LINKS.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </div>
      </section>

      {!RIOT_INTEGRATION_ENABLED ? (
        <>
          <section className="riot-review-page__card">
            <h2>Estado actual</h2>
            <ul>
              <li>La integración oficial de Riot está desactivada por flag.</li>
              <li>Los torneos de LoL y VALORANT deben operar en modo manual.</li>
              <li>La validación temporal se hace por Riot ID y revisión administrativa.</li>
              <li>Cuando Riot responda, esta build se reactiva sin rehacer el flujo completo.</li>
            </ul>
          </section>

          <section className="riot-review-page__grid">
            <article className="riot-review-page__card">
              <h2>Qué sigue activo</h2>
              <ul>
                <li>Registro de torneos multi-juego.</li>
                <li>Equipos, rosters, check-in y resultados.</li>
                <li>Modo manual para juegos Riot.</li>
              </ul>
            </article>

            <article className="riot-review-page__card">
              <h2>Documentos públicos</h2>
              <div className="riot-review-page__links">
                {PUBLIC_REVIEW_LINKS.map((item) => (
                  <Link key={item.to} to={item.to}>{item.label}</Link>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : (
        <>
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
            {PUBLIC_REVIEW_LINKS.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </div>
        </article>
      </section>

      <section className="riot-review-page__card">
        <h2>Flujo visual que debe abrirse correctamente</h2>
        <ol>
          <li>Ruta publica de review y documentos legales.</li>
          <li>Explorador publico de torneos y detalle publico del evento.</li>
          <li>Cuenta demo con Settings, conexiones y centro de torneos.</li>
          <li>Creacion de torneo, registro de equipo, check-in, bracket y resultados.</li>
        </ol>
      </section>

      <section className="riot-review-page__note">
        <strong>Nota:</strong> la experiencia completa de VALORANT depende de la aprobacion de Riot para Production Key
        y del posterior setup de Riot Sign On. Esta build deja el flujo y el consentimiento visibles desde ya.
      </section>
        </>
      )}
    </div>
  );
};

export default RiotReviewPage;
