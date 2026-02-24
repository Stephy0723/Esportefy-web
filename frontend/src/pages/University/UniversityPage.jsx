import React, { useState } from 'react';
import './UniversityPage.scss'; 

const UniversityPage = () => {
  const [activeTab, setActiveTab] = useState('torneos');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState(null);
  const [step, setStep] = useState(1); // 1: Selección | 2: Formulario
  const [formData, setFormData] = useState({ matricula: '', carrera: '', seccion: '' });

  const handleUniSelect = (uni) => {
    setSelectedUni(uni);
    setStep(2); // Pasamos al formulario de datos
  };
  const handleSubmitDraft = (e) => {
    e.preventDefault();
    console.log("Postulación enviada:", { university: selectedUni, ...formData });
    // Aquí cerrarías el modal y mostrarías un éxito
    setIsSelectorOpen(false);
    setStep(1);
  };
  // Universidades Top de RD
  const universities = [
    { id: 1, name: 'Autónoma de Santo Domingo', tag: 'UASD', points: 1540, logo: '🎓' },
    { id: 2, name: 'Pontificia Univ. Católica Madre y Maestra', tag: 'PUCMM', points: 1420, logo: '⛪' },
    { id: 3, name: 'Iberoamericana', tag: 'UNIBE', points: 1280, logo: '🔴' },
    { id: 4, name: 'Inst. Tecnológico de Sto. Dgo.', tag: 'INTEC', points: 1150, logo: '🐝' },
  ];
  // Listado oficial para el Dominican Draft 2026/27
const uniList = [
  { id: 'uasd', name: 'Autónoma de Santo Domingo', tag: 'UASD', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UASD&backgroundColor=0033a0' },
  { id: 'pucmm', name: 'Madre y Maestra', tag: 'PUCMM', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=PUCMM&backgroundColor=0033a0' },
  { id: 'intec', name: 'Inst. Tecnológico de Sto. Dgo.', tag: 'INTEC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=INTEC&backgroundColor=d31145' },
  { id: 'unibe', name: 'Univ. Iberoamericana', tag: 'UNIBE', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNIBE&backgroundColor=cc0000' },
  { id: 'itla', name: 'Inst. Tech. de Las Américas', tag: 'ITLA', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITLA&backgroundColor=0052FF' },
  { id: 'unapec', name: 'Univ. APEC', tag: 'UNAPEC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=APEC&backgroundColor=002d62' },
  { id: 'unphu', name: 'Pedro Henríquez Ureña', tag: 'UNPHU', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UNPHU&backgroundColor=006837' },
  { id: 'utesa', name: 'Univ. Tecnológica de Santiago', tag: 'UTESA', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UTESA&backgroundColor=009b3a' },
  { id: 'uapa', name: 'Abierta para Adultos', tag: 'UAPA', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UAPA&backgroundColor=fdb813' },
  { id: 'ucne', name: 'Católica Nordestana', tag: 'UCNE', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCNE&backgroundColor=0033a0' },
  { id: 'isvodosu', name: 'Salomé Ureña', tag: 'ISFODOSU', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ISFO&backgroundColor=0033a0' },
  { id: 'itsc', name: 'Tech. Superior Comunitario', tag: 'ITSC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=ITSC&backgroundColor=0052FF' },
  { id: 'ucateci', name: 'Católica del Cibao', tag: 'UCATECI', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCATECI&backgroundColor=0033a0' },
  { id: 'uniremhos', name: 'Univ. Eugenio M. de Hostos', tag: 'UNIREMHOS', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=REMHOS&backgroundColor=0033a0' },
  { id: 'unicaribe', name: 'Univ. del Caribe', tag: 'UNICARIBE', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UC&backgroundColor=0033a0' },
  { id: 'ojm', name: 'O&M University', tag: 'O&M', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=OM&backgroundColor=000000' },
  { id: 'uce', name: 'Univ. Central del Este', tag: 'UCE', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCE&backgroundColor=009b3a' },
  { id: 'ufhec', name: 'Federico Henríquez y Carvajal', tag: 'UFHEC', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UFHEC&backgroundColor=0033a0' },
  { id: 'ucsd', name: 'Católica Santo Domingo', tag: 'UCSD', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=UCSD&backgroundColor=0033a0' },
  { id: 'ispsa', name: 'Politécnico Loyola', tag: 'LOYOLA', logo: 'https://api.dicebear.com/7.x/initials/svg?seed=IPL&backgroundColor=0033a0' }
];

  // Torneos con sabor dominicano
  const tournaments = [
    { id: 1, game: 'Valorant', title: 'Copa Quisqueya', date: '27 Feb', color: 'blue' }, 
    { id: 2, game: 'League of Legends', title: 'Battle of the Gods RD', date: '15 Mar', color: 'gold' }, 
    { id: 3, game: 'NBA 2K / FIFA', title: 'Clásico Universitario', date: 'Hoy', color: 'red' }, 
  ];

  return (
    <div className="university-page">
      
{/* HEADER ELITE UNIVERSITARIO RD */}
<header className="uni-header-elite">
    <div className="header-grid-wrapper">
        <div className="elite-content-left">
            <div className="status-indicator-pro">
                
            </div>
            
            <h1 className="main-title">
                DOMINICAN <span className="blue-gradient-text">DRAFT</span>
                <small className="sub-title-elite">UNIVERSITY SERIES</small>
            </h1>
            
            <p className="elite-description">
                El ecosistema de scouting universitario más grande del Caribe. 
                Vincula tu cuenta, sube tu MMR y consigue tu <strong>Beca de Élite</strong>.
            </p>
        </div>

        <div className="elite-actions-right">
            <div className="stats-mini-panel">
                <div className="stat-item">
                    <span className="stat-val">+RD$ 2M</span>
                    <span className="stat-label">EN BECAS</span>
                </div>
                <div className="stat-sep"></div>
                <div className="stat-item">
                    <span className="stat-val">14</span>
                    <span className="stat-label">UNIS ACTIVAS</span>
                </div>
            </div>

            <button className="btn-join-draft" onClick={() => setIsSelectorOpen(true)}>
          <span>{selectedUni ? `POSTULANDO EN ${selectedUni.tag}` : 'POSTULAR MI UNIVERSIDAD'}</span>
          <i className='bx bx-right-top-arrow-circle'></i>
      </button>

      {/* SELECTOR DE UNIVERSIDADES (MODAL) */}
     {isSelectorOpen && (
        <div className="uni-modal-overlay" onClick={() => setIsSelectorOpen(false)}>
          <div className="uni-selector-card" onClick={e => e.stopPropagation()}>
            
            {/* PASO 1: SELECCIÓN DE UNIVERSIDAD */}
            {step === 1 && (
              <>
                <div className="selector-header">
                  <h3>DRAFT UNIVERSITARIO RD</h3>
                  <p>Selecciona tu institución para validar tu rango</p>
                </div>
                <div className="uni-list-container">
                  {uniList.map(uni => (
                    <div key={uni.id} className="uni-option-item" onClick={() => handleUniSelect(uni)}>
                      <div className="uni-logo-frame">
                        <img src={uni.logo} alt={uni.tag} />
                      </div>
                      <div className="uni-text">
                        <strong>{uni.tag}</strong>
                        <span>{uni.name}</span>
                      </div>
                      <i className='bx bx-right-arrow-alt'></i>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* PASO 2: FORMULARIO DE DATOS IMPORTANTES */}
            {step === 2 && (
              <form className="uni-form-step" onSubmit={handleSubmitDraft}>
                <div className="form-header">
                  <button className="btn-back" onClick={() => setStep(1)}>
                    <i className='bx bx-left-arrow-alt'></i> Volver
                  </button>
                  <div className="selected-badge">
                    <img src={selectedUni.logo} alt="" />
                    <span>{selectedUni.tag}</span>
                  </div>
                </div>

                <h3>DATOS DE ESTUDIANTE</h3>
                <div className="input-group-draft">
                  <label>Matrícula (ID Estudiantil)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 2023-0145" 
                    required 
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                  />
                </div>

                <div className="input-row">
                  <div className="input-group-draft">
                    <label>Carrera</label>
                    <input 
                      type="text" 
                      placeholder="Ingeniería, Diseño..." 
                      required 
                      onChange={(e) => setFormData({...formData, carrera: e.target.value})}
                    />
                  </div>
<div className="uni-form-body">
  {/* SELECTOR DE CIUDAD / RECINTO */}
  <div className="input-group-draft">
    <label className="label-elite">UBICACIÓN DEL RECINTO</label>
    <div className="custom-select-container">
      <select 
        className="select-pro-elite"
        required
        onChange={(e) => setFormData({...formData, campus: e.target.value})}
        defaultValue=""
      >
        <option value="" disabled>Selecciona la ciudad del campus</option>
        <option value="sd">Santo Domingo (D.N. / Prov.)</option>
        <option value="sti">Santiago de los Caballeros</option>
        <option value="sfm">San Francisco de Macorís</option>
        <option value="lr">La Romana</option>
        <option value="puj">Punta Cana / Higüey</option>
        <option value="spm">San Pedro de Macorís</option>
        <option value="lv">La Vega</option>
        <option value="puerto-plata">Puerto Plata</option>
        <option value="moca">Moca</option>
        <option value="ban">Baní</option>
        <option value="otro">Otro (Especificar en carrera)</option>
      </select>
    </div>
  </div>

  {/* SELECTOR DE NIVEL ACADÉMICO */}
  <div className="input-group-draft">
    <label className="label-elite">ESTADO ACADÉMICO ACTUAL</label>
    <div className="custom-select-container">
      <select 
        className="select-pro-elite"
        required
        onChange={(e) => setFormData({...formData, nivel: e.target.value})}
        defaultValue=""
      >
        <option value="" disabled>Seleccionar Nivel</option>
        <option value="1">1er Año (Freshman)</option>
        <option value="2">2do Año (Sophomore)</option>
        <option value="3">3er Año (Junior)</option>
        <option value="4">4to Año o Superior (Senior)</option>
        <option value="egresado">Egresado / Graduado</option>
        <option value="maestria">Postgrado / Maestría</option>
      </select>
    </div>
  </div>
</div>
                </div>

                <button type="submit" className="btn-submit-draft">
                  CONFIRMAR POSTULACIÓN
                </button>
              </form>
            )}

            <button className="btn-close-x" onClick={() => setIsSelectorOpen(false)}>×</button>
          </div>
        </div>
      )}
    </div>
    </div>
    {/* Decoración tecnológica de fondo */}
    <div className="tech-pattern-overlay"></div>
</header>

      {/* NAVEGACIÓN TABS */}
      <div className="uni-tabs">
        <button 
            className={`tab-btn ${activeTab === 'torneos' ? 'active' : ''}`} 
            onClick={() => setActiveTab('torneos')}
        >
            Eventos en el Patio
        </button>
        <button 
            className={`tab-btn ${activeTab === 'rankings' ? 'active' : ''}`} 
            onClick={() => setActiveTab('rankings')}
        >
            Tabla Nacional RD
        </button>
      </div>

      <div className="uni-grid">
        
 <div className="main-column">
  {activeTab === 'torneos' && (
    <div className="cards-container">
      {tournaments.map((t) => (
        <div key={t.id} className={`elite-tournament-card border-${t.color}`}>
          {/* Indicador de Estado Flotante */}
          <div className="card-badge-status">
            <span className="dot-pulse"></span>
            INSCRIPCIONES ABIERTAS
          </div>

          <div className="card-main-content">
            <div className="uni-icon-box">
              <i className='bx bxs-zap'></i> {/* Icono más agresivo/competitivo */}
            </div>
            
            <div className="card-info-group">
              <span className="game-tag">{t.game}</span>
              <h4>{t.title}</h4>
              <div className="card-extra-data">
                <span><i className='bx bx-calendar-event'></i> {t.date}</span>
                <span><i className='bx bx-group'></i> 5vs5</span>
              </div>
            </div>
          </div>

          <div className="card-actions-zone">
            <div className="prize-pool-mini">
              <small>PRIZE POOL</small>
              <strong>RD$ 50,000</strong>
            </div>
            <button className="btn-elite-arrow">
              <i className='bx bx-chevron-right'></i>
            </button>
          </div>
        </div>
      ))}
    </div>
  )}


          {activeTab === 'rankings' && (
  <div className="ranking-list-elite">
    {/* Encabezado de la tabla para mayor profesionalismo */}
    <div className="ranking-header-labels">
      <span className="label-rank">POS</span>
      <span className="label-uni">INSTITUCIÓN</span>
      <span className="label-pts">PUNTUACIÓN</span>
    </div>

    {universities.map((uni, idx) => (
      <div key={uni.id} className="ranking-row-pro">
        {/* Número con estilo de medalla */}
        <div className={`rank-number-v2 pos-${idx + 1}`}>
          {idx + 1}
        </div>

        {/* CONTENEDOR DE LOGO CIRCULAR */}
        <div className="uni-logo-shield">
           <img src={uni.logo_url} alt={uni.tag} />
        </div>

        <div className="uni-info-pro">
          <strong className="uni-tag-main">{uni.tag}</strong>
          <small className="uni-full-name">{uni.name}</small>
        </div>

        <div className="uni-points-badge">
          <span>{uni.points.toLocaleString()}</span>
          <small>PTS</small>
        </div>
      </div>
    ))}
  </div>
)}
        </div>
       <aside className="side-column">
  {/* WIDGET DE ENCUESTA - ESTILO FLAT BLUE */}
  <div className="clean-widget">
    <div className="widget-header">
      <span className="blue-accent-line"></span>
      <h3>ENCUESTA DE COMUNIDAD</h3>
    </div>
    
    <p className="poll-question">¿Dónde debería ser la próxima gran Final LAN?</p>
    
    <div className="poll-container">
      <div className="poll-item">
        <div className="poll-label">
          <span>Pabellón de la Fama</span>
          <span className="poll-pct">70%</span>
        </div>
        <div className="poll-track">
          <div className="poll-fill" style={{ width: '70%' }}></div>
        </div>
      </div>

      <div className="poll-item">
        <div className="poll-label">
          <span>Gran Arena del Cibao</span>
          <span className="poll-pct">30%</span>
        </div>
        <div className="poll-track">
          <div className="poll-fill" style={{ width: '30%' }}></div>
        </div>
      </div>
    </div>
  </div>

  {/* WIDGET DE BENEFICIOS - ESTILO CORPORATIVO */}
  <div className="benefit-widget">
    <h3>BENEFICIOS ELITE</h3>
    <ul className="benefit-list">
      <li>
        <i className='bx bx-right-arrow-alt'></i>
        <span>Becas de Alto Rendimiento</span>
      </li>
      <li>
        <i className='bx bx-right-arrow-alt'></i>
        <span>Centros de Alto Rendimiento</span>
      </li>
      <li>
        <i className='bx bx-right-arrow-alt'></i>
        <span>Prácticas Profesionales Tech</span>
      </li>
    </ul>
    <button className="btn-details-flat">VER TODOS LOS BENEFICIOS</button>
  </div>
</aside>

      </div>
    </div>
  );
};

export default UniversityPage;