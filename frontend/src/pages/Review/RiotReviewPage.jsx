import React from 'react';
import { Link } from 'react-router-dom';
import {
  RIOT_INTEGRATION_ENABLED,
  RIOT_PENDING_APPROVAL_MESSAGE
} from '../../../../shared/riotFeatureFlags.js';
import { useLang } from '../../context/LanguageContext';
import './RiotReviewPage.css';

const reviewModeEnabled = String(import.meta.env.VITE_RIOT_REVIEW_MODE || '').trim().toLowerCase() === 'true';
const minActiveParticipants = String(import.meta.env.VITE_RIOT_MIN_ACTIVE_PARTICIPANTS || '20').trim() || '20';

const PUBLIC_REVIEW_LINKS = (t) => [
  { to: '/torneos/publicos', label: t('riotLinkTournaments') },
  { to: '/docs', label: t('riotLinkDocs') },
  { to: '/legal/terms', label: t('riotLinkTerms') },
  { to: '/legal/privacy', label: t('riotLinkPrivacy') },
  { to: '/legal/payment-policy', label: t('riotLinkPayment') },
  { to: '/legal/organizer-terms', label: t('riotLinkOrgTerms') },
];

const RiotReviewPage = () => {
  const { t } = useLang();
  const reviewLinks = PUBLIC_REVIEW_LINKS(t);

  return (
    <div className="riot-review-page">
      <section className="riot-review-page__hero">
        <span className="riot-review-page__eyebrow">Riot Review Build</span>
        <h1>{RIOT_INTEGRATION_ENABLED ? t('riotHeroTitleActive') : t('riotHeroTitlePaused')}</h1>
        <p>
          {RIOT_INTEGRATION_ENABLED
            ? t('riotHeroDescActive')
            : `${RIOT_PENDING_APPROVAL_MESSAGE} ${t('riotHeroDescPaused')}`}
        </p>

        <div className="riot-review-page__chips">
          <span className={`riot-review-page__chip ${reviewModeEnabled ? 'is-active' : ''}`}>
            Review mode: {reviewModeEnabled ? t('riotModeActive') : t('riotModeInactive')}
          </span>
          <span className="riot-review-page__chip">{t('riotMinParticipants').replace('{{n}}', minActiveParticipants)}</span>
          <span className="riot-review-page__chip">
            {RIOT_INTEGRATION_ENABLED ? t('riotValorantConsent') : t('riotValorantManual')}
          </span>
        </div>
      </section>

      <section className="riot-review-page__card">
        <h2>{t('riotAccessTitle')}</h2>
        <div className="riot-review-page__review-grid">
          <article className="riot-review-page__mini-card">
            <strong>{t('riotWithoutLogin')}</strong>
            <p>{t('riotWithoutLoginDesc')}</p>
          </article>
          <article className="riot-review-page__mini-card">
            <strong>{t('riotWithDemo')}</strong>
            <p>{t('riotWithDemoDesc')}</p>
          </article>
        </div>
        <div className="riot-review-page__links" style={{ marginTop: '1rem' }}>
          {reviewLinks.map((item) => (
            <Link key={item.to} to={item.to}>{item.label}</Link>
          ))}
        </div>
      </section>

      {!RIOT_INTEGRATION_ENABLED ? (
        <>
          <section className="riot-review-page__card">
            <h2>{t('riotCurrentStatus')}</h2>
            <ul>
              <li>{t('riotStatus1')}</li>
              <li>{t('riotStatus2')}</li>
              <li>{t('riotStatus3')}</li>
              <li>{t('riotStatus4')}</li>
            </ul>
          </section>

          <section className="riot-review-page__grid">
            <article className="riot-review-page__card">
              <h2>{t('riotStillActive')}</h2>
              <ul>
                <li>{t('riotActive1')}</li>
                <li>{t('riotActive2')}</li>
                <li>{t('riotActive3')}</li>
              </ul>
            </article>

            <article className="riot-review-page__card">
              <h2>{t('riotPublicDocs')}</h2>
              <div className="riot-review-page__links">
                {reviewLinks.map((item) => (
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
          <h2>{t('riotWhatItDoes')}</h2>
          <ul>
            <li>{t('riotDoes1')}</li>
            <li>{t('riotDoes2')}</li>
            <li>{t('riotDoes3')}</li>
            <li>{t('riotDoes4')}</li>
          </ul>
        </article>

        <article className="riot-review-page__card">
          <h2>{t('riotWhatItDoesNot')}</h2>
          <ul>
            <li>{t('riotDoesNot1')}</li>
            <li>{t('riotDoesNot2')}</li>
            <li>{t('riotDoesNot3')}</li>
            <li>{t('riotDoesNot4')}</li>
          </ul>
        </article>
      </section>

      <section className="riot-review-page__card">
        <h2>{t('riotReviewFlow')}</h2>
        <ol>
          <li>{t('riotFlow1')}</li>
          <li>{t('riotFlow2')}</li>
          <li>{t('riotFlow3')}</li>
          <li>{t('riotFlow4')}</li>
          <li>{t('riotFlow5')}</li>
        </ol>
      </section>

      <section className="riot-review-page__grid">
        <article className="riot-review-page__card">
          <h2>{t('riotCheckInTournaments')}</h2>
          <ul>
            <li>{t('riotCheck1')}</li>
            <li>{t('riotCheck2')}</li>
            <li>{t('riotCheck3')}</li>
            <li>{t('riotCheck4')}</li>
          </ul>
        </article>

        <article className="riot-review-page__card">
          <h2>{t('riotPublicDocs')}</h2>
          <div className="riot-review-page__links">
            {reviewLinks.map((item) => (
              <Link key={item.to} to={item.to}>{item.label}</Link>
            ))}
          </div>
        </article>
      </section>

      <section className="riot-review-page__card">
        <h2>{t('riotVisualFlow')}</h2>
        <ol>
          <li>{t('riotVisual1')}</li>
          <li>{t('riotVisual2')}</li>
          <li>{t('riotVisual3')}</li>
          <li>{t('riotVisual4')}</li>
        </ol>
      </section>

      <section className="riot-review-page__note">
        <strong>{t('riotNoteLabel')}</strong> {t('riotNoteText')}
      </section>
        </>
      )}
    </div>
  );
};

export default RiotReviewPage;
