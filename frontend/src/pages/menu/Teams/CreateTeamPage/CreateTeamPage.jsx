import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { esportsCatalog } from '../../../../data/esportsCatalog.jsx'; 
import { 
    FaCamera, FaUser, FaUserAstronaut, FaCheckCircle, FaPlus, FaWhatsapp, 
    FaArrowLeft, FaIdCard, FaGlobe, FaTrophy, FaVenusMars, FaLanguage, 
    FaMapMarkerAlt, FaCheck, FaCopy, FaSearch, FaDiscord, FaTwitter, 
    FaFacebook, FaPaperPlane, FaGamepad, FaUpload, FaEye, FaUsers 
} from 'react-icons/fa';
import './CreateTeamPage.css';

// Configuración de Roles Visuales
const ROLE_NAMES = {
    "Mobile Legends": ["EXP", "Gold", "Mid", "Jungla", "Roam"],
    "League of Legends": ["Top", "Jungle", "Mid", "ADC", "Supp"],
    "Valorant": ["Duelist", "Sentinel", "Controller", "Initiator", "Flex"],
    "Overwatch 2": ["Tank", "DPS", "DPS", "Support", "Support"],
    "TFT": ["Tactician"],
    "FIFA / EA FC": ["Player"],
    "Free Fire": ["Rusher", "Support", "Sniper", "IGL"]
};

const CreateTeamPage = () => {
    const navigate = useNavigate();
    
    // --- ESTADOS Y DATOS ---
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : { name: "Usuario" };
    
    const [step, setStep] = useState(1);
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [inviteLink, setInviteLink] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Datos del formulario COMPLETO
    const [formData, setFormData] = useState({
        // Identidad
        name: '', 
        slogan: '', 
        category: '',
        game: '',
        // Perfil de Escuadra
        teamGender: 'Mixto',      
        teamCountry: '',          
        teamLevel: 'Amateur',     
        teamLanguage: 'Español',  
        // Lógica interna
        maxMembers: 0, 
        maxSubstitutes: 0, 
        // Datos Capitán
        leaderRealName: '', 
        leaderIgn: '',      
        leaderGameId: '',   
        leaderRegion: '',   
        leaderRole: '' 
    });

    // Roster
    const [roster, setRoster] = useState({ starters: [], subs: [], coach: null });

    // Modal - Datos del Slot (AHORA CON FOTO)
    const [modalOpen, setModalOpen] = useState(false);
    const [currentSlot, setCurrentSlot] = useState(null); 
    const [slotData, setSlotData] = useState({ 
        nickname: '', 
        gameId: '', 
        region: '', 
        email: '', 
        role: '',
        photo: null // Nuevo campo para la foto del jugador/coach
    });

    // Mockup para buscador
    const mockPlayers = [
        { id: 1, name: "S1mple", tag: "#GOAT", status: "online", avatar: "S" },
        { id: 2, name: "TenZ", tag: "#NA1", status: "busy", avatar: "T" },
        { id: 3, name: "Faker", tag: "#T1", status: "online", avatar: "F" },
    ];

    // --- FUNCIONES ---

    const getThemeClass = () => {
        if (!formData.game) return 'theme-default';
        const cat = Object.keys(esportsCatalog).find(c => esportsCatalog[c][formData.game]);
        if (cat === 'FPS (Shooters)') return 'theme-fps';
        if (cat === 'MOBA') return 'theme-moba';
        if (cat === 'Fighting') return 'theme-fighting';
        return 'theme-default';
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // Función para subir foto del jugador en el modal
    const handlePlayerPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSlotData({ ...slotData, photo: reader.result });
            reader.readAsDataURL(file);
        }
    };

    const handleGameChange = (e) => {
        const gameName = e.target.value;
        if (!gameName) {
            setFormData(prev => ({ ...prev, game: '', maxMembers: 0 }));
            return;
        }
        
        const rules = esportsCatalog[selectedCategory][gameName];
        setFormData(prev => ({
            ...prev, game: gameName, 
            maxMembers: rules.maxPlayers, 
            maxSubstitutes: rules.maxSubs
        }));

        setRoster({
            starters: Array(rules.maxPlayers).fill(null),
            subs: Array(rules.maxSubs).fill(null),
            coach: null
        });
    };

    const handleSlotClick = (type, index) => {
        setCurrentSlot({ type, index });
        const existingData = type === 'coach' ? roster.coach : roster[type][index];
        
        let suggestedRole = '';
        if (type === 'starters' && !existingData) {
            const roles = ROLE_NAMES[formData.game];
            if (roles && roles[index]) suggestedRole = roles[index];
        }

        setSlotData(existingData || { 
            nickname: '', 
            gameId: '', 
            region: formData.leaderRegion, 
            email: '', 
            role: suggestedRole,
            photo: null 
        });
        setModalOpen(true);
    };

    const saveSlot = () => {
        if (!slotData.nickname) return alert("Nickname requerido.");
        if (currentSlot.type === 'coach') {
            setRoster({ ...roster, coach: slotData });
        } else {
            const newList = [...roster[currentSlot.type]];
            newList[currentSlot.index] = slotData;
            setRoster({ ...roster, [currentSlot.type]: newList });
        }
        setModalOpen(false);
    };

    const finalizeCreation = async () => {
    setSubmitting(true);
    
    try {
        const token = localStorage.getItem('token');
        const data = new FormData();

        // 1. Convertimos el logoPreview (base64) a un archivo real si existe
        if (logoPreview && logoPreview.startsWith('data:image')) {
            const response = await fetch(logoPreview);
            const blob = await response.blob();
            data.append('logo', blob, `logo-${Date.now()}.png`);
        }

        // 2. Adjuntamos los datos del formulario
        // Los enviamos como string para que el backend los parsee (JSON.parse)
        data.append('formData', JSON.stringify(formData));
        data.append('roster', JSON.stringify(roster));

        // 3. Petición al servidor
        const res = await fetch('http://localhost:4000/api/teams/create', {
            method: 'POST',
            headers: {
                // NOTA: Al usar FormData NO debes poner 'Content-Type': 'application/json'
                // El navegador pondrá automáticamente 'multipart/form-data' con el boundary correcto
                'Authorization': `Bearer ${token}` 
            },
            body: data
        });

        const result = await res.json();

        if (res.ok) {
            setInviteLink(result.inviteLink); 
            setStep(3);
        } else {
            alert(result.message || "Error al guardar equipo");
        }
    } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
    } finally {
        setSubmitting(false);
    }
};

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        const btn = document.getElementById('copy-btn');
        if(btn) btn.classList.add('copied');
        setTimeout(() => { if(btn) btn.classList.remove('copied'); }, 2000);
    };

    const getRoleLabel = (index) => {
        const roles = ROLE_NAMES[formData.game];
        return roles ? roles[index] : `Player ${index + 1}`;
    };

    const safeStarters = Array.isArray(roster?.starters) ? roster.starters : [];
    const safeSubs = Array.isArray(roster?.subs) ? roster.subs : [];

    // --- RENDERIZADO ---
    return (
        <div className={`create-team-layout ${getThemeClass()}`}>
            <div className="form-wrapper">
                
                <div className="form-header-modern">
                    <h1>{step === 3 ? "¡Misión Cumplida!" : "Registro de Escuadra"}</h1>
                </div>

                {/* PASO 1: DATOS GENERALES Y CAPITÁN */}
                {step === 1 && (
                    <div className="fade-in">
                        {/* 1. IDENTIDAD VISUAL */}
                        <div className="section-card branding-section">
                            <div className="logo-upload-container">
                                <label htmlFor="logo-upload" className="logo-placeholder">
                                    {logoPreview ? <img src={logoPreview} alt="Logo" className="logo-preview-img" /> : <FaCamera />}
                                </label>
                                <input id="logo-upload" type="file" onChange={handleLogoChange} hidden />
                            </div>

                            <div className="branding-inputs">
                                <input 
                                    type="text" 
                                    className="input-hero" 
                                    placeholder="Nombre Oficial del Equipo" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                />
                                <input 
                                    type="text" 
                                    className="input-modern" 
                                    placeholder="Eslogan / Grito de Guerra" 
                                    value={formData.slogan} 
                                    onChange={e => setFormData({...formData, slogan: e.target.value})} 
                                />
                            </div>
                        </div>

                        {/* 2. PERFIL DE ESCUADRA (ACTUALIZADO CON UNIVERSITARIO) */}
                        <div className="section-card">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaGlobe style={{marginRight: '8px'}}/> Perfil de la Escuadra
                            </h3>
                            
                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label"><FaVenusMars/> Composición (Género)</label>
                                    <select className="select-modern" value={formData.teamGender} onChange={e => setFormData({...formData, teamGender: e.target.value})}>
                                        <option value="Mixto">Mixto (Cualquiera)</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="section-label"><FaMapMarkerAlt/> País / Región Base</label>
                                    <input 
                                        type="text" 
                                        className="input-modern" 
                                        placeholder="Ej: Argentina / Global" 
                                        value={formData.teamCountry} 
                                        onChange={e => setFormData({...formData, teamCountry: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label"><FaTrophy/> Nivel / Tipo de Equipo</label>
                                    <select className="select-modern" value={formData.teamLevel} onChange={e => setFormData({...formData, teamLevel: e.target.value})}>
                                        <option value="Casual">Casual / Fun</option>
                                        <option value="Amateur">Amateur (Torneos Menores)</option>
                                        <option value="Universitario">Universitario (Institucional)</option> {/* AQUÍ ESTÁ */}
                                        <option value="Semi-Pro">Semi-Pro (Ligas)</option>
                                        <option value="Profesional">Profesional (Tier 1)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="section-label"><FaLanguage/> Idioma Principal</label>
                                    <input 
                                        type="text" 
                                        className="input-modern" 
                                        placeholder="Ej: Español / Inglés" 
                                        value={formData.teamLanguage} 
                                        onChange={e => setFormData({...formData, teamLanguage: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. CONFIGURACIÓN DE JUEGO */}
                        <div className="section-card game-section">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaGamepad style={{marginRight: '8px'}}/> Disciplina
                            </h3>
                            <div className="split-row">
                                <div className="form-group">
                                    <label className="section-label">Categoría</label>
                                    <select
                                        className="select-modern"
                                        onChange={e => {
                                            const cat = e.target.value;
                                            setSelectedCategory(cat);
                                            setFormData(prev => ({ ...prev, category: cat }));
                                        }}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {Object.keys(esportsCatalog).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="section-label">Juego</label>
                                    <select className="select-modern" onChange={handleGameChange} disabled={!selectedCategory} value={formData.game}>
                                        <option value="">{selectedCategory ? 'Selecciona Título' : '---'}</option>
                                        {selectedCategory && Object.keys(esportsCatalog[selectedCategory]).map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3.5 VISTA PREVIA DEL EQUIPO */}
                        <div className="section-card team-preview-card">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaEye style={{marginRight: '8px'}}/> Vista previa
                            </h3>
                            <div className="preview-header">
                                <div className="preview-logo">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" />
                                    ) : (
                                        <FaUsers />
                                    )}
                                </div>
                                <div className="preview-meta">
                                    <h4>{formData.name || 'Nombre del equipo'}</h4>
                                    <span>{formData.category || 'Categoría'} • {formData.game || 'Juego'}</span>
                                    <p>{formData.slogan || 'Eslogan del equipo'}</p>
                                </div>
                            </div>
                            <div className="preview-list">
                                {safeStarters.map((slot, i) => (
                                    <div key={`starter-${i}`} className="preview-item">
                                        <span className="preview-role">{getRoleLabel(i)}</span>
                                        <span className="preview-name">{slot?.nickname || 'Vacante'}</span>
                                    </div>
                                ))}
                                {safeSubs.map((slot, i) => (
                                    <div key={`sub-${i}`} className="preview-item">
                                        <span className="preview-role">Suplente {i + 1}</span>
                                        <span className="preview-name">{slot?.nickname || 'Vacante'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. DATOS DEL CAPITÁN */}
                        <div className="section-card">
                            <h3 style={{marginBottom: '1rem', color: 'var(--theme-color)', fontSize: '1.2rem'}}>
                                <FaIdCard style={{marginRight: '8px'}}/> Capitán (Verificación)
                            </h3>
                            
                            <label className="section-label">Nombre Completo (Verificación Interna)</label>
                            <input 
                                type="text" 
                                placeholder="Ej: Juan Pérez" 
                                value={formData.leaderRealName} 
                                onChange={e => setFormData({...formData, leaderRealName: e.target.value})} 
                            />

                            <div className="split-row">
                                <div>
                                    <label className="section-label">Nick In-Game</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: Faker" 
                                        value={formData.leaderIgn} 
                                        onChange={e => setFormData({...formData, leaderIgn: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="section-label">ID / Tag Único</label>
                                    <input 
                                        type="text" 
                                        placeholder="#TAG / UID" 
                                        value={formData.leaderGameId} 
                                        onChange={e => setFormData({...formData, leaderGameId: e.target.value})} 
                                    />
                                </div>
                            </div>

                            <div className="split-row">
                                <div>
                                    <label className="section-label">Región / Servidor</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: LAS / NA" 
                                        value={formData.leaderRegion} 
                                        onChange={e => setFormData({...formData, leaderRegion: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="section-label">Tu Rol Principal</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ej: IGL / Mid" 
                                        value={formData.leaderRole} 
                                        onChange={e => setFormData({...formData, leaderRole: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-footer-sticky">
                            <button className="btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
                            <button 
                                className="btn-primary-glow" 
                                disabled={!formData.game || !formData.name || !formData.leaderIgn} 
                                onClick={() => setStep(2)}
                            >
                                Siguiente: Roster
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 2: ROSTER (DISEÑO CÍRCULOS CON FOTOS) */}
                {step === 2 && (
                    <div className="roster-container fade-in">
                        <div className="roster-header-row">
                            <h3>Alineación ({formData.teamLevel})</h3>
                            <span className="game-badge">{formData.game}</span>
                        </div>

                        {/* Titulares */}
                        <div className="roles-section">
                            <label className="section-label">Titulares</label>
                            <div className="circles-grid">
                                {safeStarters.map((slot, idx) => (
                                    <div key={idx} className="role-item" onClick={() => handleSlotClick('starters', idx)}>
                                        <div className={`role-circle ${slot ? 'filled' : 'empty'}`}>
                                            {/* AQUÍ SE MUESTRA LA FOTO SI EXISTE */}
                                            {slot ? (
                                                slot.photo ? (
                                                    <img src={slot.photo} alt="Player" className="player-circle-img" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                                ) : (
                                                    <span className="initials">{slot.nickname.substring(0,2).toUpperCase()}</span>
                                                )
                                            ) : (
                                                <FaUser className="user-icon" />
                                            )}
                                        </div>
                                        <span className="role-label-text">
                                            {slot ? slot.nickname : getRoleLabel(idx)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suplentes */}
                        {formData.maxSubstitutes > 0 && (
                            <div className="roles-section">
                                <label className="section-label">Suplentes</label>
                                <div className="circles-grid">
                                {safeSubs.map((slot, idx) => (
                                    <div key={idx} className="role-item" onClick={() => handleSlotClick('subs', idx)}>
                                            <div className={`role-circle small ${slot ? 'filled' : 'empty'}`}>
                                                {slot ? (
                                                    slot.photo ? (
                                                        <img src={slot.photo} alt="Sub" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                                    ) : (
                                                        <span className="initials">{slot.nickname.substring(0,2)}</span>
                                                    )
                                                ) : (
                                                    <FaPlus />
                                                )}
                                            </div>
                                            <span className="role-label-text">Suplente {idx+1}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Coach */}
                        <div className="roles-section">
                            <label className="section-label">Staff / Coach</label>
                            <div className="role-item" onClick={() => handleSlotClick('coach', 0)}>
                                <div className={`role-circle ${roster.coach ? 'filled' : 'empty'}`}>
                                    {roster.coach ? (
                                        roster.coach.photo ? (
                                            <img src={roster.coach.photo} alt="Coach" style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}} />
                                        ) : (
                                            <span className="initials">{roster.coach.nickname.substring(0,2)}</span>
                                        )
                                    ) : (
                                        <FaUserAstronaut />
                                    )}
                                </div>
                                <span className="role-label-text">{roster.coach ? roster.coach.nickname : "Coach"}</span>
                            </div>
                        </div>

                        <div className="form-footer-sticky">
                            <button className="btn-ghost" onClick={() => setStep(1)}><FaArrowLeft /> Datos</button>
                            <button className="btn-primary-glow" onClick={finalizeCreation} disabled={submitting}>
                                {submitting ? "Registrando..." : "Confirmar Equipo"}
                            </button>
                        </div>
                    </div>
                )}

                {/* PASO 3: RECLUTAMIENTO PRO */}
                {step === 3 && (
                    <div className="share-screen fade-in">
                        <div className="success-header-hero">
                            <div className="success-icon-glow">
                                <FaCheckCircle />
                            </div>
                            <div>
                                <h2>¡Equipo Validado!</h2>
                                <p className="subtitle-glow">Tu escuadra está lista para competir.</p>
                            </div>
                        </div>

                        <div className="recruit-grid">
                            {/* COLUMNA IZQUIERDA */}
                            <div className="share-column left glass-panel">
                                <label className="column-header-label">Centro de Invitación</label>
                                
                                <div className="qr-section-styled">
                                    <div className="qr-glow-container">
                                        <QRCodeCanvas value={inviteLink} size={150} level="H" bgColor="#FFFFFF" fgColor="#000000"/>
                                    </div>
                                    <span className="qr-label">Escanear QR</span>
                                </div>
                                
                                <div className="link-section-styled">
                                    <label className="sub-label">Link Único</label>
                                    <div className="link-action-box-pro">
                                        <div className="link-text-mask">{inviteLink}</div>
                                        <button id="copy-btn" onClick={copyLink} title="Copiar">
                                            <FaCopy />
                                        </button>
                                    </div>
                                </div>

                                <div className="social-section-styled">
                                    <label className="sub-label">Redes</label>
                                    <div className="social-grid-pro">
                                        <button className="social-btn-pro whatsapp" onClick={() => window.open(`https://wa.me/?text=${inviteLink}`)}><FaWhatsapp /></button>
                                        <button className="social-btn-pro discord" onClick={() => window.open(`https://discord.com`)}><FaDiscord /></button>
                                        <button className="social-btn-pro twitter" onClick={() => window.open(`https://twitter.com`)}><FaTwitter /></button>
                                        <button className="social-btn-pro facebook" onClick={() => window.open(`https://facebook.com`)}><FaFacebook /></button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA DERECHA */}
                            <div className="share-column right glass-panel">
                                <label className="column-header-label">Buscador Global</label>
                                
                                <div className="search-box-pro">
                                    <FaSearch className="search-icon-pro" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar Nickname o ID..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="players-list-pro custom-scrollbar">
                                    {mockPlayers
                                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(player => (
                                        <div key={player.id} className="player-row-pro fade-in-item">
                                            <div className="player-info-pro">
                                                <div className={`avatar-mini-pro ${player.status}`}>
                                                    {player.avatar}
                                                    <span className="status-indicator"></span>
                                                </div>
                                                <div className="player-texts">
                                                    <span className="p-name-pro">{player.name}</span>
                                                    <span className="p-tag-pro">{player.tag}</span>
                                                </div>
                                            </div>
                                            <button className="btn-invite-pro">Invitar</button>
                                        </div>
                                    ))}
                                </div>

                                <label className="column-header-label" style={{marginTop: '2rem'}}>Comunidades</label>
                                <div className="community-actions-pro">
                                    <button className="btn-community-pro">
                                        <div className="icon-box"><FaPaperPlane /></div>
                                        <span>Publicar en "Hub General"</span>
                                    </button>
                                    <button className="btn-community-pro">
                                        <div className="icon-box"><FaGamepad /></div>
                                        <span>Publicar en "Torneos {formData.game}"</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* BOTÓN FINAL */}
                        <div className="footer-actions-pro">
                            <button className="btn-primary-glow finish-btn-mega" onClick={() => navigate('/equipos')}>
                                <FaCheck /> MISIÓN CUMPLIDA (IR AL DASHBOARD)
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL CON SUBIDA DE FOTO */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="mini-form">
                        <h3 style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                            <span>Registro: <span className="highlight">{slotData.role || "Jugador"}</span></span>
                            {/* CAMPO DE FOTO DEL JUGADOR */}
                            <label className="player-photo-upload" style={{cursor:'pointer'}}>
                                <input type="file" hidden accept="image/*" onChange={handlePlayerPhotoChange} />
                                {slotData.photo ? (
                                    <img src={slotData.photo} alt="preview" style={{width:'50px', height:'50px', borderRadius:'50%', objectFit:'cover', border:'2px solid var(--theme-color)'}} />
                                ) : (
                                    <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#333', display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed #666'}}>
                                        <FaUpload style={{color:'#aaa', fontSize:'1.2rem'}}/>
                                    </div>
                                )}
                            </label>
                        </h3>
                        
                        <label className="section-label">Nickname</label>
                        <input 
                            type="text" 
                            placeholder="Ej: S1mple"
                            value={slotData.nickname} 
                            onChange={(e) => setSlotData({...slotData, nickname: e.target.value})} 
                            autoFocus 
                        />

                        <div className="split-row">
                            <div>
                                <label className="section-label">Game ID / Tag</label>
                                <input 
                                    type="text" 
                                    placeholder="#TAG / UID"
                                    value={slotData.gameId} 
                                    onChange={(e) => setSlotData({...slotData, gameId: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="section-label">Región</label>
                                <input 
                                    type="text" 
                                    placeholder="Ej: LAS"
                                    value={slotData.region} 
                                    onChange={(e) => setSlotData({...slotData, region: e.target.value})} 
                                />
                            </div>
                        </div>
                        
                        <label className="section-label">Email (Notificación)</label>
                        <input 
                            type="email" 
                            placeholder="correo@ejemplo.com"
                            value={slotData.email} 
                            onChange={(e) => setSlotData({...slotData, email: e.target.value})} 
                        />

                        <div className="modal-buttons">
                            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
                            <button className="btn-primary-glow" onClick={saveSlot}>Guardar Slot</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateTeamPage;
