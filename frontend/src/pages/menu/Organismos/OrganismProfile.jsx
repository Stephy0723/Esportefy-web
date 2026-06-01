import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHud from '../../../components/PageHud/PageHud';
import { ESPORTS_ORGANISMS } from '../../../data/esportsOrganismsData';
import { useLang } from '../../../context/LanguageContext';
import './OrganismProfile.css';

const RELATED_LABELS = {
  iesf: 'IESF',
  gef: 'GEF',
  geg: 'Global Esports Games',
  fifae: 'FIFAe',
  'pan-american-esports': 'Pan American Esports',
  'game-changers': 'Game Changers'
};

export default function OrganismProfile() {
  const { slug } = useParams();
  const { t } = useLang();
  const organism = ESPORTS_ORGANISMS[slug || ''];

  if (!organism) {
    return (
      <section className="organism-page organism-empty">
        <PageHud page="ORGANISMOS" />
        <div className="organism-empty-card">
          <h1>{t('opNotFoundTitle')}</h1>
          <p>{t('opNotFoundDesc')}</p>
          <Link to="/noticias" className="organism-back-link">{t('opBackToNews')}</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="organism-page">
      <PageHud page="ORGANISMOS" />

      <header className="organism-hero">
        <img src={organism.logo} alt={organism.fullName} className="organism-logo" />
        <div className="organism-hero-content">
          <p className="organism-kicker">{t('opKicker')}</p>
          <h1>{organism.fullName}</h1>
          <div className="organism-facts">
            <span>{t('opFounded')}: {organism.founded}</span>
            <span>{t('opHeadquarters')}: {organism.headquarters}</span>
          </div>
          <a href={organism.officialSite} target="_blank" rel="noreferrer" className="organism-site-link">
            {t('opOfficialSite')}
          </a>
        </div>
      </header>

      <div className="organism-layout">
        <article className="organism-main">
          <section className="organism-section">
            <h2>{t('opWhatIsTitle')}</h2>
            <p>{organism.whatIs}</p>
            <p><strong>{t('opObjective')}:</strong> {organism.objective}</p>
            <p><strong>{t('opRoleInAmerica')}:</strong> {organism.roleInAmerica}</p>
          </section>

          <section className="organism-section">
            <h2>{t('opStructureTitle')}</h2>
            <div className="organism-grid-cards">
              <div className="organism-card">
                <h3>{t('opAffiliates')}</h3>
                <p>{organism.structure.affiliates}</p>
              </div>
              <div className="organism-card">
                <h3>{t('opCompetitionType')}</h3>
                <p>{organism.structure.competitionType}</p>
              </div>
              <div className="organism-card">
                <h3>{t('opDivisions')}</h3>
                <p>{organism.structure.divisions}</p>
              </div>
            </div>
          </section>

          <section className="organism-section">
            <h2>{t('opTournamentsTitle')}</h2>
            <div className="organism-timeline">
              {organism.tournaments.map((event) => (
                <div className="timeline-item" key={`${event.year}-${event.city}`}>
                  <div className="timeline-year">{event.year}</div>
                  <div className="timeline-content">
                    <h3>{event.city}</h3>
                    <p><strong>{t('opTournGames')}:</strong> {event.games}</p>
                    <p><strong>{t('opTournChampion')}:</strong> {event.champion}</p>
                    <p><strong>{t('opTournCountries')}:</strong> {event.countries}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="organism-section">
            <h2>{t('opImpactTitle')}</h2>
            <p><strong>{t('opImpactParticipation')}:</strong> {organism.impactAmerica.participation}</p>
            <p><strong>{t('opImpactBestResults')}:</strong> {organism.impactAmerica.bestResults}</p>
            <p><strong>{t('opImpactQualifiers')}:</strong> {organism.impactAmerica.qualifiers}</p>
          </section>
        </article>

        <aside className="organism-side">
          <div className="organism-side-card">
            <h3>{t('opRelatedEvents')}</h3>
            <div className="organism-related-list">
              {organism.related.map((item) => {
                const label = RELATED_LABELS[item] || item;
                if (ESPORTS_ORGANISMS[item]) {
                  return (
                    <Link key={item} to={`/organismos/${item}`} className="related-link">
                      {label}
                    </Link>
                  );
                }

                return (
                  <span key={item} className="related-static">
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
