import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- IMPORTANTE
import { 
    FaPlusCircle, FaTimes, FaCamera, FaImage, FaUserShield, 
    FaLock, FaGamepad, FaFilePdf, FaGlobeAmericas, FaInfoCircle, 
    FaCheck, FaBullhorn, FaGavel, FaUsers, FaShieldAlt, FaRocket, FaChevronRight 
} from 'react-icons/fa';

const CURRENT_USER_ROLE = 'organizer'; 

const CreateCommunityModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate(); // <--- ACTIVAMOS NAVEGACIÓN
    const [activeTab, setActiveTab] = useState('identity'); 

    // --- ESTADOS ---
    const [formData, setFormData] = useState({
        name: '', shortUrl: '', description: '', type: 'Mixta', 
        targetAudience: 'Mixto', language: 'Español', region: 'LATAM', launchDate: '',
        mainGames: [], allowAllGames: false,
        contentCategories: { noticias: true, memes: true, opinion: true, clips: true, fanart: true, guias: true },
        contentProhibited: '',
        postTypes: { texto: true, imagen: true, video: true, enlace: true, encuestas: true },
        whoCanPost: 'all', allowComments: true, preModeration: false, allowReactions: true, allowShare: true,
        roles: { owner: true, admin: true, moderator: true, user: true, visitor: true },
        rulesText: '', toxicityFilter: true, spoilerTag: true, nsfwAllowed: false,
        reportReasons: { spam: true, hate: true, nsfw: true, spoiler: true },
        emailVerification: true, antiSpamControl: true,
        discordIntegration: false, welcomeEmail: true,
        futureEvents: false, futureTournaments: false
    });

    const [media, setMedia] = useState({
        banner: { file: null, preview: null },
        avatar: { file: null, preview: null },
        rulesPdf: { file: null, name: '' }
    });

    const [adminInput, setAdminInput] = useState('');
    const [admins, setAdmins] = useState([]);
    const bannerRef = useRef(null);
    const avatarRef = useRef(null);
    const pdfRef = useRef(null);

    // --- LÓGICA DE ENVÍO Y REDIRECCIÓN ---
    const handleLaunch = () => {
        // 1. Preparar los datos para enviar
        const communityData = {
            name: formData.name,
            tagline: formData.description,
            // Usamos las imágenes previsualizadas. En una app real, aquí subirías a un servidor.
            banner: media.banner.preview, 
            avatar: media.avatar.preview,
            stats: { members: 1, online: 1 },
            created_at: new Date().toLocaleDateString()
        };

        // 2. Definir la URL (Slug)
        const slug = formData.shortUrl || formData.name.toLowerCase().replace(/ /g, '-');

        // 3. Cerrar Modal
        onClose();

        // 4. Navegar y pasar los datos
        navigate(`/community/${slug}`, { state: communityData });
    };

    if (!isOpen) return null;
    if (CURRENT_USER_ROLE !== 'organizer') return null; // Simplificado para brevedad

    // --- HANDLERS ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleCheck = (e) => setFormData({ ...formData, [e.target.name]: e.target.checked });
    const handleNestedCheck = (category, key) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [key]: !prev[category][key] }
        }));
    };
    const handleImage = (e, type) => {
        const file = e.target.files[0];
        if (file) setMedia(prev => ({ ...prev, [type]: { file, preview: URL.createObjectURL(file) } }));
    };
    const handlePdf = (e) => {
        const file = e.target.files[0];
        if (file) setMedia(prev => ({ ...prev, rulesPdf: { file, name: file.name } }));
    };
    const toggleGame = (game) => {
        const current = formData.mainGames;
        if (current.includes(game)) setFormData({ ...formData, mainGames: current.filter(g => g !== game) });
        else if (current.length < 5) setFormData({ ...formData, mainGames: [...current, game] });
    };
    const addAdmin = (e) => {
        if (e.key === 'Enter' && adminInput.trim()) {
            if (!admins.includes(adminInput.trim())) setAdmins([...admins, adminInput.trim()]);
            setAdminInput('');
        }
    };
    const AVAILABLE_GAMES = ["Valorant", "LoL", "CS2", "Fortnite", "CoD", "FIFA", "Minecraft", "Overwatch 2", "Rocket League", "GTA V"];

    return (
        <div className="modal-overlay">
            <div className="modal-content fade-in-up modal-xl-pro"> 
                {/* HEADER */}
                <div className="modal-header-complex">
                    <div className="header-top">
                        <div className="header-brand">
                            <h3>Crear Comunidad Profesional</h3>
                            <small>Panel de Control de Organizador</small>
                        </div>
                        <button className="close-btn" onClick={onClose}><FaTimes /></button>
                    </div>
                    <div className="modal-tabs-pro">
                        {[{ id: 'identity', icon: FaInfoCircle, label: 'Identidad' }, { id: 'content', icon: FaGamepad, label: 'Contenido' }, { id: 'rules', icon: FaGavel, label: 'Reglas' }, { id: 'team', icon: FaUsers, label: 'Equipo' }, { id: 'settings', icon: FaShieldAlt, label: 'Avanzado' }].map(tab => (
                            <button key={tab.id} className={`tab-btn-pro ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                <tab.icon /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* BODY */}
                <div className="modal-body scrollable-body pro-body">
                    {activeTab === 'identity' && (
                        <div className="tab-content fade-in">
                            <div className="media-upload-section">
                                <div className="banner-upload-area" onClick={() => bannerRef.current.click()} style={{backgroundImage: media.banner.preview ? `url(${media.banner.preview})` : 'none'}}>
                                    {!media.banner.preview && <div className="placeholder-content"><FaImage size={24}/> <span>Subir Banner (1200x300)</span></div>}
                                    <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'banner')} />
                                </div>
                                <div className="avatar-upload-circle" onClick={() => avatarRef.current.click()} style={{backgroundImage: media.avatar.preview ? `url(${media.avatar.preview})` : 'none'}}>
                                    {!media.avatar.preview && <FaCamera />}
                                    <input type="file" ref={avatarRef} hidden accept="image/*" onChange={(e) => handleImage(e, 'avatar')} />
                                </div>
                            </div>
                            <div className="form-grid">
                                <div className="form-group-v3">
                                    <label>Nombre Público</label>
                                    <input type="text" name="name" className="modal-input-v3" placeholder="Ej: Valorant LATAM Oficial" value={formData.name} onChange={handleChange} />
                                </div>
                                <div className="form-group-v3">
                                    <label>URL Corta / Slug</label>
                                    <div className="input-prefix-group">
                                        <span>esportefy.com/c/</span>
                                        <input type="text" name="shortUrl" placeholder="valorant-latam" value={formData.shortUrl} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group-v3">
                                <label>Descripción Pública (Misión)</label>
                                <textarea name="description" className="modal-input-v3" rows="2" placeholder="¿Qué es esta comunidad y para quién?" value={formData.description} onChange={handleChange}></textarea>
                            </div>
                        </div>
                    )}
                    
                    {/* ... (TUS OTRAS PESTAÑAS: CONTENT, RULES, TEAM, SETTINGS VAN AQUÍ IGUAL QUE ANTES) ... */}
                    {/* He omitido repetirlas para que el código entre, pero asume que están aquí. */}
                    {/* Si necesitas que las repita todas, dímelo, pero la lógica clave está en el handleLaunch */}

                </div>

                {/* FOOTER - AQUÍ ESTÁ LA MAGIA */}
                <div className="modal-footer">
                    <button className="btn-cancel-v3" onClick={onClose}>Cancelar</button>
                    {activeTab !== 'settings' ? (
                        <button className="btn-next-v3" onClick={() => {
                            const tabs = ['identity', 'content', 'rules', 'team', 'settings'];
                            const nextIndex = tabs.indexOf(activeTab) + 1;
                            if (nextIndex < tabs.length) setActiveTab(tabs[nextIndex]);
                        }}>
                            Siguiente <FaChevronRight />
                        </button>
                    ) : (
                        // BOTÓN LANZAR QUE LLAMA A LA FUNCIÓN DE NAVEGACIÓN
                        <button className="btn-confirm-v3" onClick={handleLaunch} disabled={!formData.name}>
                            Lanzar Comunidad <FaRocket />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateCommunityModal;