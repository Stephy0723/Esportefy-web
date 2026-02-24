import React, { useEffect, useMemo, useState } from 'react';
import { FaBullhorn } from 'react-icons/fa';
import './SponsorMotion.css';

import banner1 from '../../assets/bannerGamer/1.jpg';
import banner3 from '../../assets/bannerGamer/3.jpg';
import banner7 from '../../assets/bannerGamer/7.jpg';
import banner10 from '../../assets/bannerGamer/10.jpg';
import banner14 from '../../assets/bannerGamer/14.jpg';
import banner19 from '../../assets/bannerGamer/19.jpg';
import banner23 from '../../assets/bannerGamer/23.jpg';
import banner28 from '../../assets/bannerGamer/28.jpg';

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

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredSponsor, setHoveredSponsor] = useState(null);

  return (
    <>
      <div className="spx-snake-wrap" aria-label="Patrocinadores destacados">
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
