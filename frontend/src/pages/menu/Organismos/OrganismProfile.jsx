import React from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHud from '../../../components/PageHud/PageHud';
import { ESPORTS_ORGANISMS } from '../../../data/esportsOrganismsData';
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
  const organism = ESPORTS_ORGANISMS[slug || ''];

  if (!organism) {
    return (
      <section className="organism-page organism-empty">
        <PageHud page="ORGANISMOS" />
        <div className="organism-empty-card">
          <h1>Organismo no encontrado</h1>
          <p>Revisa el enlace o vuelve al modulo de noticias para explorar organismos oficiales.</p>
          <Link to="/noticias" className="organism-back-link">Volver a Noticias</Link>
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
          <p className="organism-kicker">Base Institucional de Esports</p>
          <h1>{organism.fullName}</h1>
          <div className="organism-facts">
            <span>Fundado: {organism.founded}</span>
            <span>Sede: {organism.headquarters}</span>
          </div>
          <a href={organism.officialSite} target="_blank" rel="noreferrer" className="organism-site-link">
            Sitio oficial
          </a>
        </div>
      </header>

      <div className="organism-layout">
        <article className="organism-main">
          <section className="organism-section">
            <h2>Que es</h2>
            <p>{organism.whatIs}</p>
            <p><strong>Objetivo institucional:</strong> {organism.objective}</p>
            <p><strong>Rol en America:</strong> {organism.roleInAmerica}</p>
          </section>

          <section className="organism-section">
            <h2>Estructura</h2>
            <div className="organism-grid-cards">
              <div className="organism-card">
                <h3>Paises afiliados</h3>
                <p>{organism.structure.affiliates}</p>
              </div>
              <div className="organism-card">
                <h3>Tipo de competencias</h3>
                <p>{organism.structure.competitionType}</p>
              </div>
              <div className="organism-card">
                <h3>Division competitiva</h3>
                <p>{organism.structure.divisions}</p>
              </div>
            </div>
          </section>

          <section className="organism-section">
            <h2>Torneos mas importantes realizados</h2>
            <div className="organism-timeline">
              {organism.tournaments.map((event) => (
                <div className="timeline-item" key={`${event.year}-${event.city}`}>
                  <div className="timeline-year">{event.year}</div>
                  <div className="timeline-content">
                    <h3>{event.city}</h3>
                    <p><strong>Juegos:</strong> {event.games}</p>
                    <p><strong>Pais campeon:</strong> {event.champion}</p>
                    <p><strong>Paises participantes:</strong> {event.countries}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="organism-section">
            <h2>Impacto en America</h2>
            <p><strong>Participacion latinoamericana:</strong> {organism.impactAmerica.participation}</p>
            <p><strong>Mejores resultados:</strong> {organism.impactAmerica.bestResults}</p>
            <p><strong>Clasificatorias regionales:</strong> {organism.impactAmerica.qualifiers}</p>
          </section>
        </article>

        <aside className="organism-side">
          <div className="organism-side-card">
            <h3>Eventos relacionados</h3>
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
