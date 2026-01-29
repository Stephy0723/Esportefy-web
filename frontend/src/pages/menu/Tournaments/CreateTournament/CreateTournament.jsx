import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../../../components/Navbar/Navbar';
import Sidebar from '../../../../components/Sidebar/Sidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios'; // Importamos Axios
import { 
    FaPlus, FaGamepad, FaUsers, FaMicrophone, FaAward, 
    FaCalendarAlt, FaSitemap, FaTicketAlt, FaFileUpload, FaFilePdf,
    FaServer, FaTrash, FaCheckCircle, FaStar, FaGift, FaTag, FaLink, FaImage, FaCheck
} from 'react-icons/fa';
import './CreateTournament.css';

const GAME_CONFIG = {
  "All": { color: "#ffffff", icon: "bx-grid-alt" },
  "Valorant": { color: "#ff4655", icon: "bx-crosshair" },
  "CS:GO 2": { color: "#de9b35", icon: "bx-target-lock" },
  "Call of Duty": { color: "#54b946", icon: "bx-run" },
  "Warzone": { color: "#54b946", icon: "bx-radar" },
  "Fortnite": { color: "#a349a4", icon: "bx-building" },
  "Free Fire": { color: "#f39c12", icon: "bx-flame" },
  "PUBG": { color: "#f1c40f", icon: "bx-target-lock" },
  "Apex Legends": { color: "#e74c3c", icon: "bx-shield-quarter" },
  "Overwatch 2": { color: "#f39c12", icon: "bx-shield" },
  "Rainbow Six Siege": { color: "#3498db", icon: "bx-window" },
  "League of Legends": { color: "#c1a05e", icon: "bx-world" },
  "Dota 2": { color: "#e74c3c", icon: "bx-map-alt" },
  "Mobile Legends": { color: "#ffbf00", icon: "bx-mobile-landscape" },
  "Honor of Kings": { color: "#e6b333", icon: "bx-crown" },
  "Smite": { color: "#f1c40f", icon: "bx-bolt-circle" },
  "Wild Rift": { color: "#00a8ff", icon: "bx-mobile" },
  "FIFA 24": { color: "#2ecc71", icon: "bx-football" },
  "NBA 2K24": { color: "#e67e22", icon: "bx-basketball" },
  "Rocket League": { color: "#0088ff", icon: "bx-car" },
  "Street Fighter 6": { color: "#f39c12", icon: "bx-walk" },
  "Tekken 8": { color: "#c0392b", icon: "bx-angry" },
  "Clash Royale": { color: "#3498db", icon: "bx-crown" },
  "Teamfight Tactics": { color: "#f1c40f", icon: "bx-grid" },
  "Hearthstone": { color: "#f39c12", icon: "bx-book" },
  "Legends of Runeterra": { color: "#3498db", icon: "bx-book-open" },
  "StarCraft II": { color: "#00a8ff", icon: "bx-planet" }
};

const CreateTournament = () => {
  // --- 1. HOOKS (Navegación y Autenticación) ---
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // --- 2. ESTADOS (States) ---
  const [isPublished, setIsPublished] = useState(false);
  const [tournament, setTournament] = useState({
    title: '',
    description: '',
    game: '',
    gender: '',
    modality: '',
    date: '',
    time: '',
    prizePool: '',
    currency: 'USD',
    prizesByRank: { first: '', second: '', third: '' },
    entryFee: 'Gratis',
    maxSlots: '',
    format: 'Eliminación Directa',
    server: '',
    platform: 'PC',
    bannerFile: null,
    rulesPdf: null,
    organizerName: user?.username || 'Organizador Oficial',
    sponsors: [{ name: '', link: '', tier: 'Partner', logoFile: null }],
    staff: { moderators: [''], casters: [''] },
    incentives: [] 
  });
  const editTournament = location.state?.editTournament;
  const isEditMode = Boolean(editTournament?.tournamentId);

  useEffect(() => {
    if (!isEditMode) return;
    const dateValue = editTournament?.dateRaw ? new Date(editTournament.dateRaw) : null;
    const dateIso = dateValue ? dateValue.toISOString().slice(0, 10) : '';

    setTournament((prev) => ({
      ...prev,
      title: editTournament.title || '',
      description: editTournament.desc || editTournament.description || '',
      game: editTournament.game || '',
      gender: editTournament.gender || '',
      modality: editTournament.modality || '',
      date: dateIso || '',
      time: editTournament.time || '',
      prizePool: editTournament.prize || editTournament.prizePool || '',
      currency: editTournament.currency || prev.currency,
      prizesByRank: editTournament.prizesByRank || prev.prizesByRank,
      entryFee: editTournament.entry || editTournament.entryFee || prev.entryFee,
      maxSlots: editTournament.maxSlots || prev.maxSlots,
      format: editTournament.format || prev.format,
      server: editTournament.server || '',
      platform: editTournament.platform || prev.platform,
      organizerName: editTournament.organizer || prev.organizerName,
      sponsors: Array.isArray(editTournament.sponsors) && editTournament.sponsors.length
        ? editTournament.sponsors.map((s) => ({ name: s.name || '', link: s.link || '', tier: s.tier || 'Partner', logoFile: null }))
        : prev.sponsors,
      staff: editTournament.staff || prev.staff
    }));
  }, [isEditMode, editTournament]);

  // --- 3. HANDLERS DE FORMULARIO Y ARCHIVOS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Preparar FormData para Multer
    const data = new FormData();
    const token = localStorage.getItem('token');

    // Campos básicos
    data.append('title', tournament.title);
    data.append('description', tournament.description);
    data.append('game', tournament.game);
    data.append('modality', tournament.modality);
    data.append('date', tournament.date);
    data.append('time', tournament.time);
    data.append('prizePool', tournament.prizePool);
    data.append('currency', tournament.currency);
    data.append('entryFee', tournament.entryFee);
    data.append('maxSlots', tournament.maxSlots);
    data.append('format', tournament.format);
    data.append('server', tournament.server);
    data.append('platform', tournament.platform);
    data.append('gender', tournament.gender);

    // Objetos complejos (se envían como JSON string para parsear en el backend)
    data.append('prizesByRank', JSON.stringify(tournament.prizesByRank));
    data.append('staff', JSON.stringify(tournament.staff));

    const sponsorsPayload = [];
    let logoIndex = 0;
    tournament.sponsors.forEach((s) => {
        const payload = { name: s.name, link: s.link, tier: s.tier };
        if (s.logoFile) {
            payload.logoIndex = logoIndex;
            data.append('sponsorLogos', s.logoFile);
            logoIndex += 1;
        }
        sponsorsPayload.push(payload);
    });
    data.append('sponsors', JSON.stringify(sponsorsPayload));

    // Archivos principales
    if (tournament.bannerFile) data.append('bannerFile', tournament.bannerFile);
    if (tournament.rulesPdf) data.append('rulesPdf', tournament.rulesPdf);

    // Archivos de Sponsors (Logos individuales)
    // sponsorLogos ya agregados en el bloque de sponsors

    try {
        const url = isEditMode
          ? `http://localhost:4000/api/tournaments/${editTournament.tournamentId}`
          : 'http://localhost:4000/api/tournaments';
        const method = isEditMode ? 'put' : 'post';

        await axios({
            url,
            method,
            data,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }
        });

        setIsPublished(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error("Error al publicar:", err.response?.data || err.message);
        alert("Hubo un error al publicar el torneo. Revisa la consola.");
    }
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
  const addSponsor = () => setTournament({ 
    ...tournament, 
    sponsors: [...tournament.sponsors, { name: '', link: '', tier: 'Partner', logoFile: null }] 
  });

  const addStaffField = (type) => setTournament({ 
    ...tournament, 
    staff: { ...tournament.staff, [type]: [...tournament.staff[type], ''] } 
  });

  const addIncentive = () => {
    setTournament({
      ...tournament,
      incentives: [...(tournament.incentives || []), { title: '', prize: '' }]
    });
  };

  const goToDashboard = () => {
    try {
      navigate('/dashboard', { replace: true });
    } finally {
      // Fallback duro por si el router no navega por algún motivo
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          window.location.assign('/dashboard');
        }
      }, 0);
    }
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
            <h1>{isEditMode ? 'Editar' : 'Configurar'} <span className="highlight">Torneo Profesional</span></h1>
            <p>Panel de Administración de: <strong>{tournament.organizerName}</strong></p>
          </header>

          <div className="profile-grid">
            
            {/* 1. IDENTIDAD Y REGLAS */}
            <div className="profile-card full-span-card">
  <div className="card-title"><FaAward /> <h3>Información General</h3></div>
  
  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Título del Torneo</label>
        <input 
            type="text" 
            placeholder="Nombre oficial del evento" 
            required 
            value={tournament.title}
            onChange={(e) => setTournament({...tournament, title: e.target.value})}
        />
      </div>
    </div>
    <div className="form-column">
  <div className="custom-input-box">
    <label>Seleccionar Juego</label>
    <select 
      required 
      value={tournament.game}
      onChange={(e) => setTournament({...tournament, game: e.target.value})}
    >
      <option value="">-- Elige un juego --</option>
      {/* Generamos las opciones dinámicamente desde GAME_CONFIG */}
      {Object.keys(GAME_CONFIG).map((game) => (
        game !== "All" && (
          <option key={game} value={game}>
            {game}
          </option>
        )
      ))}
    </select>
    <p className="file-help-text">
      <FaGamepad /> 
      {tournament.game ? `Compitiendo en ${tournament.game}` : "Título competitivo"}
    </p>
  </div>
</div>

  </div>

  <div className="input-row-group" style={{marginTop: '20px'}}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Plataforma</label>
        <select value={tournament.platform} onChange={(e) => setTournament({...tournament, platform: e.target.value})}>
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
        <input 
            type="text" 
            placeholder="Ej: Latam Norte / NA / EUW" 
            value={tournament.server}
            onChange={(e) => setTournament({...tournament, server: e.target.value})}
        />
        <p className="file-help-text"><FaServer /> Ubicación del servidor</p>
      </div>
    </div>
  </div>

  <div className="input-row-group" style={{marginTop: '20px'}}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Descripción Breve</label>
        <textarea 
            placeholder="Resumen rápido del torneo..." 
            rows="5"
            value={tournament.description}
            onChange={(e) => setTournament({...tournament, description: e.target.value})}
        ></textarea>
      </div>
    </div>

    <div className="form-column">
      <div className="custom-input-box">
        <label>Subir Banner del Torneo</label>
        <div className="file-upload-wrapper">
          <input type="file" id="banner" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerFile')} />
          <label htmlFor="banner" className={`file-label ${tournament.bannerFile ? 'active-file' : ''}`}>
             {tournament.bannerFile ? tournament.bannerFile.name : 'ELEGIR ARCHIVO'}
          </label>
        </div>
        <p className="file-help-text"><FaFileUpload /> Seleccionar Imagen</p>
      </div>
      <div className="custom-input-box" style={{marginTop: '15px'}}>
        <label>Reglamento Oficial (PDF)</label>
        <div className="file-upload-wrapper pdf-style">
          <input type="file" id="rules" accept=".pdf" onChange={(e) => handleFileChange(e, 'rulesPdf')} />
          <label htmlFor="rules" className={`file-label ${tournament.rulesPdf ? 'active-file' : ''}`}>
             {tournament.rulesPdf ? tournament.rulesPdf.name : 'ELEGIR ARCHIVO'}
          </label>
        </div>
        <p className="file-help-text"><FaFilePdf /> Subir Normas en PDF</p>
      </div>
    </div>
  </div>
</div>

            {/* 2. FORMATO Y CUPOS */}
<div className="profile-card full-span-card" style={{ marginTop: '20px' }}>
  <div className="card-title"><FaSitemap /> <h3>Formato y Cupos</h3></div>

  <div className="input-row-group">
    <div className="form-column">
      <div className="custom-input-box">
        <label>Cupos Máximos</label>
        <input 
            type="number" 
            placeholder="Ej: 32" 
            required 
            value={tournament.maxSlots}
            onChange={(e) => setTournament({...tournament, maxSlots: e.target.value})}
        />
        <p className="file-help-text"><FaUsers /> Capacidad total de equipos</p>
      </div>
      {/* COLUMNA DE GÉNERO */}
    <div className="form-column">
        <div className="custom-input-box">
            <label>Categoría de Género</label>
            <select 
                required 
                value={tournament.gender}
                onChange={(e) => setTournament({...tournament, gender: e.target.value})}
            >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Mixto">Mixto</option>
            </select>
            <p className="file-help-text"><FaUsers /> Restricción de participantes</p>
        </div>
    </div>

      <div className="custom-input-box" style={{ marginTop: '20px' }}>
        <label>Tamaño del Equipo</label>
        <select value={tournament.modality} onChange={(e) => setTournament({...tournament, modality: e.target.value})}>
          <option value="">Seleccionar</option>
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
        <select value={tournament.entryFee} onChange={(e) => setTournament({...tournament, entryFee: e.target.value})}>
          <option value="Gratis">Abierto (Todo público)</option>
          <option value="Invitación">Por Invitación</option>
          <option value="Password">Con Contraseña</option>
          <option value="Pago">Premium / Pago</option>
        </select>
        <p className="file-help-text"><FaTicketAlt /> Método de inscripción</p>
      </div>

      <div className="custom-input-box" style={{ marginTop: '20px' }}>
        <label>Fecha y Hora de Inicio</label>
        <div style={{display: 'flex', gap: '10px'}}>
             <input type="date" value={tournament.date} onChange={(e) => setTournament({...tournament, date: e.target.value})} />
            <input type="time" required value={tournament.time} onChange={(e) => setTournament({...tournament, time: e.target.value})} />
        </div>
      </div>
    </div>
  </div>

  <div className="input-row-group" style={{ marginTop: '20px' }}>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Formato de Eliminación</label>
        <select value={tournament.format} onChange={(e) => setTournament({...tournament, format: e.target.value})}>
          <option>Eliminación Directa</option>
          <option>Doble Eliminación</option>
          <option>Suizo (Swiss)</option>
          <option>Round Robin</option>
        </select>
        <p className="file-help-text"><FaSitemap /> Estructura de las llaves</p>
      </div>
    </div>
  </div>
</div>

            {/* 3. MARCAS */}
            <div className="profile-card">
  <div className="card-title">
    <h3>Marcas / Sponsors</h3> 
    <button type="button" className="add-btn-circle" onClick={addSponsor}><FaPlus /></button>
  </div>
  
  <div className="sponsors-list">
    {tournament.sponsors.map((s, i) => (
      <div key={i} className="sponsor-upload-row-premium">
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

        <input 
          type="url" 
          placeholder="Link Web" 
          className="mini-input"
          value={s.link || ''}
          onChange={(e) => {
            const newSponsors = [...tournament.sponsors];
            newSponsors[i].link = e.target.value;
            setTournament({ ...tournament, sponsors: newSponsors });
          }}
        />

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

        <div className="file-upload-wrapper small">
            <input 
              type="file" 
              id={`logo-${i}`} 
              hidden 
              onChange={(e) => handleFileChange(e, 'logoFile', i)} 
            />
            <label htmlFor={`logo-${i}`} className={`file-label-small ${s.logoFile ? 'active' : ''}`}>
                {s.logoFile ? <FaCheck /> : <FaFileUpload />}
            </label>
        </div>

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

            {/* 4. PREMIOS */}
            <div className="profile-card full-span-card premium-prize-card">
  <div className="card-title">
    <div className="title-with-icon">
      <FaTicketAlt className="title-icon-gold" />
      <h3>Premios Desglosados</h3>
    </div>
    <div className="prize-pool-badge">
        Prize Pool: <span>{tournament.prizePool || '0.00'}</span>
    </div>
  </div>

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
      </div>
    </div>
    <div className="form-column">
      <div className="custom-input-box">
        <label>Divisa / Moneda</label>
        <select 
          value={tournament.currency}
          onChange={(e) => setTournament({...tournament, currency: e.target.value})}
        >
          <option value="DO">DO - Peso Dominicano</option>
          <option value="USD">USD - Dólares</option>
          <option value="EUR">EUR - Euros</option>
        </select>
      </div>
    </div>
  </div>

  <div className="prize-distribution-grid">
    <div className="prize-item gold">
      <label>🥇 1er Lugar</label>
      <input 
        type="text" 
        placeholder="Monto" 
        value={tournament.prizesByRank.first}
        onChange={(e) => setTournament({
            ...tournament, 
            prizesByRank: {...tournament.prizesByRank, first: e.target.value}
        })}
      />
    </div>
    <div className="prize-item silver">
      <label>🥈 2do Lugar</label>
      <input 
        type="text" 
        placeholder="Monto" 
        value={tournament.prizesByRank.second}
        onChange={(e) => setTournament({
            ...tournament, 
            prizesByRank: {...tournament.prizesByRank, second: e.target.value}
        })}
      />
    </div>
    <div className="prize-item bronze">
      <label>🥉 3er Lugar</label>
      <input 
        type="text" 
        placeholder="Monto" 
        value={tournament.prizesByRank.third}
        onChange={(e) => setTournament({
            ...tournament, 
            prizesByRank: {...tournament.prizesByRank, third: e.target.value}
        })}
      />
    </div>
  </div>  
</div>
</div>

         <div className="submit-container">
          {isEditMode && (
            <button type="button" className="btn-success-outline" onClick={() => navigate('/tournaments')}>
              Cancelar edición
            </button>
          )}
          <button type="submit" className="btn-main-publish">
            {isEditMode ? ' GUARDAR CAMBIOS' : ' PUBLICAR TORNEO'}
          </button>
        </div>
      </form>
    ) : (
      <div className="success-overlay animate-in">
    <div className="success-glass-card">
      <div className="success-check-wrapper">
        <FaCheckCircle className="success-pulse-icon" />
      </div>
      
      <h2 className="success-title">{isEditMode ? '¡Torneo Actualizado!' : '¡Torneo Registrado!'}</h2>
      <p className="success-text">
        El torneo <span className="highlight-text">"{tournament.title}"</span> {isEditMode ? 'ha sido actualizado con éxito.' : 'ha sido publicado con éxito.'}
      </p>

      <div className="success-button-group">
        {!isEditMode && (
          <button className="btn-success-outline" onClick={() => setIsPublished(false)}>
            <FaPlus /> Crear otro torneo
          </button>
        )}
        {isEditMode && (
          <button className="btn-success-outline" onClick={() => navigate('/tournaments')}>
            <FaPlus /> Volver a torneos
          </button>
        )}
        <button type="button" className="btn-success-solid" onClick={goToDashboard}>
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
