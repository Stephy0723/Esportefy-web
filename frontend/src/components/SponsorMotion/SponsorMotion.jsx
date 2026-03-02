import React, { useEffect, useMemo, useState } from 'react';
import './SponsorMotion.css';

import banner1 from '../../assets/bannerGamer/1.jpg';
import banner3 from '../../assets/bannerGamer/3.jpg';
import banner7 from '../../assets/bannerGamer/7.jpg';
import banner10 from '../../assets/bannerGamer/10.jpg';
import banner14 from '../../assets/bannerGamer/14.jpg';
import banner19 from '../../assets/bannerGamer/19.jpg';
import banner23 from '../../assets/bannerGamer/23.jpg';
import banner28 from '../../assets/bannerGamer/28.jpg';

const DISMISS_KEY = 'sponsor-motion-hidden-until';
const DISMISS_MS = 2 * 60 * 60 * 1000;

const SponsorMotion = () => {
  const sponsors = useMemo(
    () => [
      { name: 'Red Bull Gaming', image: banner1, msg: 'Nuevo boost para torneos relampago de fin de semana.', sector: 'Bebidas energeticas', focus: 'Eventos express', reach: 'Global' },
      { name: 'Mastercard Esports', image: banner3, msg: 'Activa beneficios para eventos premium de la comunidad.', sector: 'Fintech', focus: 'Activaciones premium', reach: 'Global' },
      { name: 'Alienware Arena', image: banner7, msg: 'Patrocinio abierto para hubs competitivos de alto nivel.', sector: 'Hardware', focus: 'Gaming competitivo', reach: 'Americas' },
      { name: 'HyperX', image: banner10, msg: 'Campana de branding disponible para clubes universitarios.', sector: 'Perifericos', focus: 'Campus y academias', reach: 'Latam' },
      { name: 'Razer', image: banner14, msg: 'Becas de periféricos para capitanes y organizadores activos.', sector: 'Perifericos', focus: 'Talento emergente', reach: 'Global' },
      { name: 'Secretlab', image: banner19, msg: 'Nuevos apoyos para streamers y creadoras emergentes.', sector: 'Mobiliario gamer', focus: 'Creators', reach: 'NA y Latam' },
      { name: 'Intel Gaming', image: banner23, msg: 'Convocatoria para series regionales de clasificatorios.', sector: 'Tecnologia', focus: 'Ligas regionales', reach: 'Global' },
      { name: 'Prime Gaming', image: banner28, msg: 'Drops y recompensas para comunidades con mayor actividad.', sector: 'Plataforma digital', focus: 'Rewards y drops', reach: 'Global' },
    ],
    []
  );

  const [hoveredSponsor, setHoveredSponsor] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const hiddenUntil = Number(window.localStorage.getItem(DISMISS_KEY) || 0);

    if (!hiddenUntil || hiddenUntil <= Date.now()) {
      window.localStorage.removeItem(DISMISS_KEY);
      return undefined;
    }

    setIsVisible(false);

    const timeoutId = window.setTimeout(() => {
      window.localStorage.removeItem(DISMISS_KEY);
      setIsVisible(true);
    }, hiddenUntil - Date.now());

    return () => window.clearTimeout(timeoutId);
  }, []);

  const handleDismiss = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const hiddenUntil = Date.now() + DISMISS_MS;
    window.localStorage.setItem(DISMISS_KEY, String(hiddenUntil));
    setIsClosing(true);

    window.setTimeout(() => {
      setHoveredSponsor(null);
      setIsVisible(false);
      setIsClosing(false);
    }, 220);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className={`spx-snake-wrap${isClosing ? ' is-closing' : ''}`} aria-label="Patrocinadores destacados">
        <button
          type="button"
          className="spx-snake-wrap__close"
          onClick={handleDismiss}
          aria-label="Ocultar patrocinadores por 2 horas"
        >
          x
        </button>
        {hoveredSponsor && (
          <div className="spx-info-modal">
            <h4>{hoveredSponsor.name}</h4>
            <p>{hoveredSponsor.msg}</p>
            <div className="spx-info-modal__meta">
              <span><strong>Sector:</strong> {hoveredSponsor.sector}</span>
              <span><strong>Enfoque:</strong> {hoveredSponsor.focus}</span>
              <span><strong>Alcance:</strong> {hoveredSponsor.reach}</span>
            </div>
          </div>
        )}

        <div className="spx-snake spx-snake--a">
          {sponsors.map((s) => (
            <article
              key={`a-${s.name}`}
              className="spx-card"
              onMouseEnter={() => setHoveredSponsor(s)}
              onMouseLeave={() => setHoveredSponsor(null)}
              onFocus={() => setHoveredSponsor(s)}
              onBlur={() => setHoveredSponsor(null)}
              tabIndex={0}
            >
              <img src={s.image} alt={s.name} loading="lazy" />
              <div className="spx-card__overlay" />
              <strong>{s.name}</strong>
            </article>
          ))}
        </div>
        <div className="spx-snake spx-snake--b">
          {sponsors.map((s) => (
            <article
              key={`b-${s.name}`}
              className="spx-card"
              onMouseEnter={() => setHoveredSponsor(s)}
              onMouseLeave={() => setHoveredSponsor(null)}
              onFocus={() => setHoveredSponsor(s)}
              onBlur={() => setHoveredSponsor(null)}
              tabIndex={0}
            >
              <img src={s.image} alt={s.name} loading="lazy" />
              <div className="spx-card__overlay" />
              <strong>{s.name}</strong>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default SponsorMotion;
