import React, { useState, useRef } from 'react';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { 
    FaPlus, FaGamepad, FaUsers, FaMicrophone, FaAward, 
    FaCalendarAlt, FaSitemap, FaTicketAlt, FaFileUpload, FaFilePdf,
    FaServer, FaTrash, FaCheckCircle, FaStar, FaGift, FaTag, FaLink, FaImage
} from 'react-icons/fa';
import './CreateTournament.css';

const CreateTournament = () => {
  // --- 1. HOOKS (Navegación y Autenticación) ---
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- 2. ESTADOS (States) ---
  const [isPublished, setIsPublished] = useState(false);
  const [tournament, setTournament] = useState({
    title: '',
    description: '',
    game: '',
    modality: '',
    date: '',
    time: '',
    prizePool: '',
    prizesByRank: { first: '', second: '', third: '' },
    entryFee: 'Gratis',
    maxSlots: '',
    format: 'Eliminación Directa',
    server: '',
    platform: 'PC',
    bannerFile: null,
    rulesPdf: null,
    organizerName: user?.username || 'Organizador Oficial',
    sponsors: [{ name: '', logoFile: null }],
    staff: { moderators: [''], casters: [''] },
    incentives: [] // Aseguramos que inicie como array
  });

  // --- 3. HANDLERS DE FORMULARIO Y ARCHIVOS ---
  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí iría tu lógica de guardado (fetch/axios)
    setIsPublished(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e, field, index = null) => {
    const file = e.target.files[0];
    if (index !== null) {
      const newSponsors = [...tournament.sponsors];
      newSponsors[index].logoFile = file;
      setTournament({ ...tournament, sponsors: newSponsors });
    } else {
      setTournament({ ...tournament, [field]: file });
    }
  };

  // --- 4. FUNCIONES DE GESTIÓN (Añadir/Eliminar/Actualizar) ---

  // Sponsors
  const addSponsor = () => setTournament({ 
    ...tournament, 
    sponsors: [...tournament.sponsors, { name: '', logoFile: null }] 
  });

  // Staff
  const addStaffField = (type) => setTournament({ 
    ...tournament, 
    staff: { ...tournament.staff, [type]: [...tournament.staff[type], ''] } 
  });

  // Incentivos
  const addIncentive = () => {
    setTournament({
      ...tournament,
      incentives: [...(tournament.incentives || []), { title: '', prize: '' }]
    });
  };

  const updateIncentive = (index, field, value) => {
    const newIncentives = [...tournament.incentives];
    newIncentives[index][field] = value;
    setTournament({ ...tournament, incentives: newIncentives });
  };

  const removeIncentive = (index) => {
    const newIncentives = tournament.incentives.filter((_, i) => i !== index);
    setTournament({ ...tournament, incentives: newIncentives });
  };


  return (
    <div className="profile-page">
    {!isPublished ? (        
        <form className="create-tournament-form" onSubmit={handleSubmit}>
          <header className="form-header-premium">
            <h1>Configurar <span className="highlight">Torneo Profesional</span></h1>
            <p>Panel de Administración de: <strong>{tournament.organizerName}</strong></p>
          </header>

          <div className="profile-grid">
            
            {/* 1. IDENTIDAD Y REGLAS (SUBIR ARCHIVOS) */}
            <div className="profile-card full-span-card">
  <div className="card-title"><FaAward /> <h3>Información General</h3></div>
  
  {/* FILA 1: IDENTIFICACIÓN BÁSICA */}
  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Título del Torneo</label>
        <input type="text" placeholder="Nombre oficial del evento" required />
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Seleccionar Juego</label>
        <select required>
          <option value="">-- Elige un juego --</option>
          <option value="valorant">Valorant</option>
          <option value="lol">League of Legends</option>
          <option value="freefire">Free Fire</option>
        </select>
        <p className="file-help-text"><FaGamepad /> Título competitivo</p>
      </div>
    </div>
  </div>

  {/* FILA 2: DATOS TÉCNICOS IMPORTANTES */}
  <div className="input-row-group" style={{marginTop: '20px'}}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Plataforma</label>
        <select>
          <option value="pc">PC</option>
          <option value="mobile">Mobile</option>
          <option value="console">Consola</option>
          <option value="crossplay">Crossplay</option>
        </select>
        <p className="file-help-text"><FaServer /> Hardware requerido</p>
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Región / Servidor</label>
        <input type="text" placeholder="Ej: Latam Norte / NA / EUW" />
        <p className="file-help-text"><FaServer /> Ubicación del servidor</p>
      </div>
    </div>
  </div>

  {/* FILA 3: ARCHIVOS Y DESCRIPCIÓN */}
  <div className="input-row-group" style={{marginTop: '20px'}}>
    {/* IZQUIERDA: DESCRIPCIÓN */}
    <div className="form-column">
      <div className="custom-input-box">
        <label>Descripción Breve</label>
        <textarea placeholder="Resumen rápido del torneo..." rows="5"></textarea>
      </div>
    </div>

    {/* DERECHA: ARCHIVOS APILADOS */}
    <div className="form-column">
      <div className="custom-input-box">
        <label>Subir Banner del Torneo</label>
        <div className="file-upload-wrapper">
          <input type="file" id="banner" accept="image/*" />
          <label htmlFor="banner" className="file-label">ELEGIR ARCHIVO</label>
        </div>
        <p className="file-help-text"><FaFileUpload /> Seleccionar Imagen</p>
      </div>

      <div className="custom-input-box" style={{marginTop: '15px'}}>
        <label>Reglamento Oficial (PDF)</label>
        <div className="file-upload-wrapper pdf-style">
          <input type="file" id="rules" accept=".pdf" />
          <label htmlFor="rules" className="file-label">ELEGIR ARCHIVO</label>
        </div>
        <p className="file-help-text"><FaFilePdf /> Subir Normas en PDF</p>
      </div>
    </div>
  </div>
</div>

            {/* 2. FORMATO Y CUPOS */}
<div className="profile-card full-span-card" style={{ marginTop: '20px' }}>
  <div className="card-title"><FaSitemap /> <h3>Formato y Cupos</h3></div>

  {/* FILA 1: CAPACIDAD Y EQUIPO */}
  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Cupos Máximos</label>
        <input type="number" placeholder="Ej: 32" required />
        <p className="file-help-text"><FaUsers /> Capacidad total de equipos</p>
      </div>

      <div className="custom-input-box" style={{ marginTop: '20px' }}>
        <label>Tamaño del Equipo</label>
        <select>
          <option value="1v1">1v1 (Solo)</option>
          <option value="2v2">2v2 (Duos)</option>
          <option value="4v4">4v4 (Squad)</option>
          <option value="5v5">5v5 (Full Team)</option>
        </select>
        <p className="file-help-text"><FaUsers /> Jugadores por escuadra</p>
      </div>
    </div>

    <div className="form-column">
      <div className="custom-input-box">
        <label>Tipo de Registro</label>
        <select>
          <option>Abierto (Todo público)</option>
          <option>Por Invitación</option>
          <option>Con Contraseña</option>
          <option>Premium / Pago</option>
        </select>
        <p className="file-help-text"><FaTicketAlt /> Método de inscripción</p>
      </div>

      <div className="custom-input-box" style={{ marginTop: '20px' }}>
        <label>Tiempo de Check-in (Minutos)</label>
        <input type="number" placeholder="Ej: 30" />
        <p className="file-help-text"><FaCalendarAlt /> Antes de iniciar el match</p>
      </div>
    </div>
  </div>

  {/* FILA 2: ESTRUCTURA Y COMPETENCIA */}
  <div className="input-row-group" style={{ marginTop: '20px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Formato de Eliminación</label>
        <select>
          <option>Eliminación Directa</option>
          <option>Doble Eliminación</option>
          <option>Suizo (Swiss)</option>
          <option>Round Robin</option>
        </select>
        <p className="file-help-text"><FaSitemap /> Estructura de las llaves</p>
      </div>
    </div>

    <div className="form-column">
      <div className="custom-input-box">
        <label>Sistema de Partida (Match)</label>
        <select>
          <option>Best of 1 (Bo1)</option>
          <option>Best of 3 (Bo3)</option>
          <option>Best of 5 (Bo5)</option>
          <option>Puntaje por kills</option>
        </select>
        <p className="file-help-text"><FaGamepad /> Rondas para ganar</p>
      </div>
    </div>
  </div>

  {/* FILA 3: RESTRICCIONES Y SEGURIDAD */}
  <div className="input-row-group" style={{ marginTop: '20px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Restricción de Rango / Nivel</label>
        <input type="text" placeholder="Ej: Oro a Diamante" />
        <p className="file-help-text"><FaAward /> Filtro de habilidad</p>
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Software Anti-Cheat</label>
        <select>
          <option>No Requerido</option>
          <option>Vanguard (Valorant)</option>
          <option>Easy Anti-Cheat</option>
          <option>Grabación de Pantalla Obligatoria</option>
        </select>
        <p className="file-help-text"><FaAward /> Medidas de seguridad</p>
      </div>
    </div>
  </div>
</div>
            {/* 3. MARCAS (SUBIR LOGOS + BOTÓN MÁS) */}
            <div className="profile-card">
  <div className="card-title">
    <h3>Marcas / Sponsors</h3> 
    <button type="button" className="add-btn-circle" onClick={addSponsor}><FaPlus /></button>
  </div>
  
  <div className="sponsors-list">
    {tournament.sponsors.map((s, i) => (
      <div key={i} className="sponsor-upload-row-premium">
        {/* NOMBRE DE LA MARCA */}
        <input 
          type="text" 
          placeholder="Nombre Marca" 
          className="mini-input"
          value={s.name || ''}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].name = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        />

        {/* NUEVO: ENLACE WEB (IMPORTANTE PARA REDES) */}
        <input 
          type="url" 
          placeholder="Link Web (https://...)" 
          className="mini-input"
          value={s.link || ''}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].link = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        />

        {/* NUEVO: NIVEL DE SPONSOR */}
        <select 
          className="mini-select"
          value={s.tier || 'Partner'}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].tier = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        >
          <option value="Principal">Principal</option>
          <option value="Partner">Partner</option>
          <option value="Colaborador">Colaborador</option>
        </select>

        {/* SUBIDA DE LOGO */}
        <div className="file-upload-wrapper small">
            <input 
              type="file" 
              id={`logo-${i}`} 
              hidden 
              onChange={(e) => handleFileChange(e, 'logoFile', i)} 
            />
            <label htmlFor={`logo-${i}`} className={`file-label-small ${s.logoFile ? 'active' : ''}`}>
                {s.logoFile ? <><FaCheck /> Listo</> : <><FaFileUpload /> Logo</>}
            </label>
        </div>

        {/* BOTÓN ELIMINAR (FUNDAMENTAL) */}
        <button 
          type="button" 
          className="btn-del-mini"
          onClick={() => {
            const newSponsors = tournament.sponsors.filter((_, index) => index !== i);
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        >
          <FaTrash />
        </button>
      </div>
    ))}
  </div>
</div>

            {/* 4. PREMIOS Y STAFF (Igual que antes pero estilizado) */}
            <div className="profile-card full-span-card premium-prize-card">
  <div className="card-title">
    <div className="title-with-icon">
      <FaTicketAlt className="title-icon-gold" />
      <h3>Premios Desglosados</h3>
    </div>
    {/* Resumen dinámico del pozo total */}
    <div className="prize-pool-badge">
       Prize Pool: <span>{tournament.prizePool || '0.00'}</span>
    </div>
  </div>

  {/* FILA GLOBAL: TOTAL Y MONEDA */}
  <div className="input-row-group" style={{ marginBottom: '25px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Monto Total del Torneo</label>
        <input 
          type="text" 
          placeholder="Ej: 1000" 
          value={tournament.prizePool}
          onChange={(e) => setTournament({...tournament, prizePool: e.target.value})}
        />
        <p className="file-help-text"><FaAward /> Suma de todos los premios</p>
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Divisa / Moneda</label>
        <select 
          value={tournament.currency}
          onChange={(e) => setTournament({...tournament, currency: e.target.value})}
        >
          <option value="USD">USD - Dólares</option>
          <option value="EUR">EUR - Euros</option>
          <option value="CLP">CLP - Pesos Chilenos</option>
          <option value="ARS">ARS - Pesos Argentinos</option>
          <option value="MXN">MXN - Pesos Mexicanos</option>
        </select>
        <p className="file-help-text"><FaTicketAlt /> Tipo de cambio oficial</p>
      </div>
    </div>
  </div>

  {/* GRID DE PODIO: 1ro, 2do, 3ro */}
  <div className="prize-distribution-grid">
    <div className="prize-item gold">
      <label>🥇 1er Lugar</label>
      <input type="text" placeholder="Monto o Regalo" />
      <span className="percentage-tag">60% del pozo</span>
    </div>
    <div className="prize-item silver">
      <label>🥈 2do Lugar</label>
      <input type="text" placeholder="Monto o Regalo" />
      <span className="percentage-tag">30% del pozo</span>
    </div>
    <div className="prize-item bronze">
      <label>🥉 3er Lugar</label>
      <input type="text" placeholder="Monto o Regalo" />
      <span className="percentage-tag">10% del pozo</span>
    </div>
  </div>  
</div>
</div>

         <div className="submit-container">
          <button type="submit" className="btn-main-publish">PUBLICAR TORNEO</button>
        </div>
      </form>
    ) : (
      /* --- VISTA DE ÉXITO --- */
      <div className="success-overlay animate-in">
    <div className="success-glass-card">
      <div className="success-check-wrapper">
        <FaCheckCircle className="success-pulse-icon" />
      </div>
      
      <h2 className="success-title">¡Torneo Registrado!</h2>
      <p className="success-text">
        El torneo <span className="highlight-text">"{tournament.title}"</span> ha sido publicado con éxito.
      </p>

      <div className="success-button-group">
        <button className="btn-success-outline" onClick={() => setIsPublished(false)}>
          <FaPlus /> Crear otro torneo
        </button>
        <button className="btn-success-solid" onClick={() => navigate('/dashboard')}>
          <FaSitemap /> Ir al Dashboard
        </button>
      </div>
        </div>
      </div>
    )}
  </div>
);
     
  
};

export default CreateTournament;