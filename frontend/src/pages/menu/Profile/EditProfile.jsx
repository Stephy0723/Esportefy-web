import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
// AÑADIDO: FaPaintBrush para el icono de personalización
import { FaUser, FaGamepad, FaLock, FaSave, FaArrowLeft, FaCamera, FaPaintBrush } from 'react-icons/fa';
import './EditProfile.css';

// --- NUEVAS IMPORTACIONES PARA PERSONALIZACIÓN ---
import { FRAMES, BACKGROUNDS } from '../../../data/profileOptions'; 
import AvatarCircle from '../../../components/AvatarCircle/AvatarCircle'; 

// --- ACTIVOS DE JUEGOS ---
import imgLol from '../../../assets/gameImages/lol.png';
import imgMlbb from '../../../assets/gameImages/mlbb.png';
import imgHok from '../../../assets/gameImages/hok.png';
import imgMoco from '../../../assets/gameImages/moco.png';
import imgMarvel from '../../../assets/gameImages/marvel.png';
import imgFreeFire from '../../../assets/gameImages/freefire.png';
import imgFortnite from '../../../assets/gameImages/fortnite.png';
import imgCodm from '../../../assets/gameImages/codm.png';
import imgMk11 from '../../../assets/gameImages/mk11.png';
import imgMarioKart from '../../../assets/gameImages/mariokart.png';

const mobaGames = [
    { id: 'lol', name: 'League of Legends', img: imgLol },
    { id: 'mlbb', name: 'Mobile Legends', img: imgMlbb },
    { id: 'hok', name: 'Honor of Kings', img: imgHok },
    { id: 'marvel', name: 'Marvel Rivals', img: imgMarvel },
    { id: 'moco', name: 'Mo.co', img: imgMoco },
    { id: 'freefire', name: 'Free Fire', img: imgFreeFire },
    { id: 'fortnite', name: 'Fortnite', img: imgFortnite },
    { id: 'codm', name: 'CoD Mobile', img: imgCodm },
    { id: 'mk11', name: 'Mortal Kombat', img: imgMk11 },
    { id: 'mariokart', name: 'Mario Kart', img: imgMarioKart }
];

const platformsList = [
    { id: 'pc', name: 'PC', icon: 'bx-laptop' },
    { id: 'mobile', name: 'Mobile', icon: 'bx-mobile' },
    { id: 'console', name: 'Consola', icon: 'bx-joystick' }
];

const goalsList = [
    { id: 'Torneos', label: 'Torneos', icon: 'bx-joystick' },
    { id: 'Equipo', label: 'Equipo / Duo', icon: 'bx-group' },
    { id: 'Fun', label: 'Diversión', icon: 'bx-smile' }
];

const experienceLevels = [
    { id: 'Rookie', label: 'ROOKIE', desc: 'Principiante', icon: 'bx-user' },
    { id: 'Mid', label: 'MID', desc: 'Intermedio', icon: 'bx-medal' },
    { id: 'Pro', label: 'PRO', desc: 'Avanzado', icon: 'bx-trophy' }
];

const EditProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [user, setUser] = useState(null);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        country: '',
        avatar: '',
        selectedGames: [],
        platforms: [],
        goals: [],
        experience: '',
        goalsDescription: '',
        isProfileHidden: false,
        // NUEVOS CAMPOS DE ESTADO
        selectedFrameId: 'none',
        selectedBgId: 'bg-1'
    });

    // Helpers para la vista previa
    const currentFrame = FRAMES.find(f => f.id === formData.selectedFrameId) || FRAMES[0];
    const currentBg = BACKGROUNDS.find(b => b.id === formData.selectedBgId) || BACKGROUNDS[0];

    useEffect(() => {
        const storedUser = localStorage.getItem('esportefyUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            setFormData({
                ...parsedUser,
                selectedGames: Array.isArray(parsedUser.selectedGames) ? parsedUser.selectedGames : [],
                platforms: Array.isArray(parsedUser.platforms) ? parsedUser.platforms : [],
                goals: Array.isArray(parsedUser.goals) ? parsedUser.goals : [],
                goalsDescription: parsedUser.goalsDescription || parsedUser.goals || "",
                isProfileHidden: parsedUser.isProfileHidden || false,
                // Cargar personalización guardada o defaults
                selectedFrameId: parsedUser.selectedFrameId || 'none',
                selectedBgId: parsedUser.selectedBgId || 'bg-1'
            });
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const toggleSelection = (field, id) => {
        setFormData(prev => {
            const list = prev[field] || [];
            const newList = list.includes(id)
                ? list.filter(x => x !== id)
                : [...list, id];
            return { ...prev, [field]: newList };
        });
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'teams') return;
            if (Array.isArray(formData[key])) {
                formData[key].forEach(val => data.append(`${key}[]`, val));
            } else {
                data.append(key, formData[key]);
            }
        });
        
        if (file) {
            data.append('avatarFile', file);
        }

        try {
            const response = await axios.put(
                'http://76.13.97.163:4000/api/auth/update-profile', 
                data,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data' 
                    } 
                }
            );

            localStorage.setItem('esportefyUser', JSON.stringify(response.data));
            alert('¡Perfil actualizado con éxito!');
            navigate('/profile'); 
        } catch (err) {
            alert(err.response?.data?.message || 'Error al guardar');
        }
    };

    if (!user) return <div className="loading">Cargando la arena...</div>;

    return (
        <div className="edit-profile-page fade-in">
            <button className="btn-back" onClick={() => navigate('/profile')}>
                <FaArrowLeft /> Volver al Perfil
            </button>

            <div className="settings-container">
                <aside className="settings-sidebar">
                    <h2>Configuración</h2>
                    <nav>
                        <button className={activeTab === 'general' ? 'active' : ''} onClick={() => setActiveTab('general')} type="button"><FaUser /> General</button>
                        
                        {/* NUEVA PESTAÑA PERSONALIZACIÓN */}
                        <button className={activeTab === 'customization' ? 'active' : ''} onClick={() => setActiveTab('customization')} type="button"><FaPaintBrush /> Personalización</button>
                        
                        <button className={activeTab === 'gamer' ? 'active' : ''} onClick={() => setActiveTab('gamer')} type="button"><FaGamepad /> Perfil Gamer</button>
                        <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')} type="button"><FaLock /> Privacidad</button>
                    </nav>
                </aside>

                <main className="settings-content">
                    <form onSubmit={handleSave}>
                        
                        {/* PESTAÑA 1: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="tab-content fade-in">
                                <h3>Información Personal</h3>
                                <div className="avatar-edit-section">
                                    {/* Muestra avatar normal aquí, la previsualización "gamer" está en la otra pestaña */}
                                    <img src={preview || formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}`} alt="Preview" className="simple-avatar-preview"/>
                                    <div className="avatar-inputs">
                                        <label className="btn-upload-custom">
                                            <FaCamera /> Subir Foto
                                            <input type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
                                        </label>
                                        <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="O pega una URL..." className="mt-2" />
                                    </div>
                                </div>
                                <div className="form-group"><label>Nickname</label><input type="text" name="username" value={formData.username} onChange={handleChange} /></div>
                                <div className="form-group"><label>Nombre Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} /></div>
                                <div className="form-group"><label>País</label><input type="text" name="country" value={formData.country} onChange={handleChange} /></div>
                            </div>
                        )}

                        {/* PESTAÑA NUEVA: PERSONALIZACIÓN */}
                        {activeTab === 'customization' && (
                            <div className="tab-content fade-in">
                                <h3>Estilo Visual</h3>
                                
                                {/* PREVISUALIZACIÓN EN VIVO */}
                                <div className="live-preview-box" style={{ backgroundImage: `url(${currentBg.src})` }}>
                                    <div className="preview-overlay-dark"></div>
                                    <div className="preview-center-content">
                                        <AvatarCircle 
                                            src={preview || formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}`}
                                            frameConfig={currentFrame}
                                            size="120px"
                                            status={formData.status} />
                                        <span className="preview-name-label">{formData.username}</span>
                                    </div>
                                </div>
                                {/* --- NUEVO: SELECTOR DE ESTADO --- */}
        <div className="status-selector-container mt-4">
            <label className="section-label">Tu Estado</label>
            <div className="status-options-grid">
                {[
                    { id: 'online', label: 'En Línea', color: '#10b981' },
                    { id: 'dnd', label: 'No Molestar', color: '#ef4444' },
                    { id: 'tournament', label: 'En Torneo', color: '#fbbf24' },
                    { id: 'offline', label: 'Invisible', color: '#6b7280' }
                ].map(status => (
                    <button
                        key={status.id}
                        type="button"
                        className={`status-option-btn ${formData.status === status.id ? 'active' : ''}`}
                        onClick={() => setFormData({...formData, status: status.id})}
                        style={{ '--status-color': status.color }}
                    >
                        <span className="status-dot" style={{ backgroundColor: status.color }}></span>
                        {status.label}
                    </button>
                ))}
            </div>
        </div>
        {/* -------------------------------- */}
                                {/* SELECTOR DE MARCOS */}
                                <label className="section-label mt-4">Elige tu Marco</label>
                                <div className="frames-selection-grid">
                                    {FRAMES.map(frame => (
                                        <div 
                                            key={frame.id} 
                                            className={`frame-option-card ${formData.selectedFrameId === frame.id ? 'active' : ''}`}
                                            onClick={() => setFormData({...formData, selectedFrameId: frame.id})}
                                        >
                                            <div className="mini-frame-view">
                                                {frame.type === 'image' ? (
                                                    <img src={frame.src} alt={frame.name} />
                                                ) : (
                                                    <div className="css-dot-preview" style={{borderColor: frame.color || '#555'}}></div>
                                                )}
                                            </div>
                                            <span>{frame.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* SELECTOR DE FONDOS */}
                                <label className="section-label mt-4">Fondo de Perfil</label>
                                <div className="backgrounds-selection-grid">
                                    {BACKGROUNDS.map(bg => (
                                        <div 
                                            key={bg.id} 
                                            className={`bg-option-card ${formData.selectedBgId === bg.id ? 'active' : ''}`}
                                            onClick={() => setFormData({...formData, selectedBgId: bg.id})}
                                        >
                                            <img src={bg.src} alt={bg.name} loading="lazy" />
                                            {formData.selectedBgId === bg.id && <div className="check-mark">✔</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA 2: PERFIL GAMER (Sin cambios mayores) */}
                        {activeTab === 'gamer' && (
                            <div className="tab-content fade-in">
                                <h3>Perfil de Jugador</h3>
                                <label className="section-label">Nivel de Experiencia</label>
                                <div className="levels-row mb-4">
                                    {experienceLevels.map((lvl) => (
                                        <div key={lvl.id} className={`level-card ${formData.experience === lvl.id ? 'selected' : ''}`} onClick={() => setFormData({...formData, experience: lvl.id})}>
                                            <i className={`bx ${lvl.icon} level-icon`}></i>
                                            <div className="level-info">
                                                <span className="lvl-label">{lvl.label}</span>
                                                <span className="lvl-desc">{lvl.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <label className="section-label">Tus Juegos</label>
                                <div className="games-grid mb-4">
                                    {mobaGames.map(game => (
                                        <div key={game.id} className={`game-card-pro ${formData.selectedGames.includes(game.id) ? 'selected' : ''}`} onClick={() => toggleSelection('selectedGames', game.id)}>
                                            <div className="game-img-wrapper"><img src={game.img} alt={game.name} /></div>
                                            <span>{game.name}</span>
                                        </div>
                                    ))}
                                </div>

                                <label className="section-label">Plataformas</label>
                                <div className="platforms-row mb-4">
                                    {platformsList.map(p => (
                                        <div key={p.id} className={`platform-chip ${formData.platforms.includes(p.id) ? 'selected' : ''}`} onClick={() => toggleSelection('platforms', p.id)}>
                                            <i className={`bx ${p.icon}`}></i> {p.name}
                                        </div>
                                    ))}
                                </div>

                                <label className="section-label">¿Qué buscas?</label>
                                <div className="goals-row mb-4">
                                    {goalsList.map((goal) => (
                                        <div key={goal.id} className={`goal-card ${formData.goals.includes(goal.id) ? 'selected' : ''}`} onClick={() => toggleSelection('goals', goal.id)}>
                                            <i className={`bx ${goal.icon}`}></i>
                                            <span>{goal.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="form-group">
                                    <label>Biografía / Metas</label>
                                    <textarea rows="4" name="goalsDescription" value={formData.goalsDescription} onChange={handleChange} placeholder="Escribe tus objetivos..."></textarea>
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA 3: PRIVACIDAD */}
                        {activeTab === 'privacy' && (
                            <div className="tab-content fade-in">
                                <h3>Privacidad y Seguridad</h3>
                                <div className="privacy-option">
                                    <div className="privacy-text">
                                        <h4>Ocultar Perfil</h4>
                                        <p>Si activas esto, nadie podrá ver tu perfil en las búsquedas globales.</p>
                                    </div>
                                    <label className="switch">
                                        <input type="checkbox" name="isProfileHidden" checked={formData.isProfileHidden} onChange={handleChange} />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                                <div className="privacy-alert">
                                    <h4>Zona de Seguridad</h4>
                                    <p>Para cambiar contraseña, contacta a soporte o usa el flujo de recuperación.</p>
                                    <button type="button" className="btn-danger" disabled>Eliminar Cuenta</button>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="submit" className="btn-save-primary">
                                <FaSave /> Guardar Cambios
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </div>
    );
};

export default EditProfile;