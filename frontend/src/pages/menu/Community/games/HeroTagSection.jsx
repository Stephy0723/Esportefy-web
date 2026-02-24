import React from 'react';

const HeroTagSection = ({ context, backgroundImage, accent, onCompanyClick, transitionKey }) => {
  const companies = Array.isArray(context?.relatedCompanies) ? context.relatedCompanies : [];
  const chips = Array.isArray(context?.chips) ? context.chips : [];
  const facts = Array.isArray(context?.facts) ? context.facts : [];

  return (
    <section key={transitionKey} className="gft-hero-tag" style={{ '--hero-accent': accent }}>
      <div className="gft-hero-tag__bg" style={{ backgroundImage: `url("${backgroundImage}")` }} />
      <div className="gft-hero-tag__overlay" />

      <div className="gft-hero-tag__content">
        <div className="gft-hero-tag__col-main">
          <p className="gft-hero-tag__kicker">{context?.type || 'Tag'}</p>
          <h2>{context?.title || 'Discover'}</h2>
          <p className="gft-hero-tag__desc">{context?.description || 'Explore related games inside this category.'}</p>

          <div className="gft-hero-tag__chips">
            {chips.map((chip) => (
              <span className="gft-hero-tag__chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="gft-hero-tag__col-side">
          {facts.length > 0 && (
            <div className="gft-hero-tag__facts">
              {facts.map((fact) => (
                <div className="gft-hero-tag__fact" key={`${fact.label}-${fact.value}`}>
                  <span>{fact.label}</span>
                  <strong>{fact.value}</strong>
                </div>
              ))}
            </div>
          )}

          {companies.length > 0 && (
            <div className="gft-hero-tag__companies">
              <p>Related companies</p>
              <div className="gft-hero-tag__companies-row">
                {companies.map((company) => (
                  <button
                    key={company}
                    type="button"
                    className="gft-hero-tag__company"
                    onClick={() => onCompanyClick(company)}
                  >
                    {company}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroTagSection;
