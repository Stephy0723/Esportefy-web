import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaGamepad, FaLock, FaSave, FaArrowLeft, FaCamera } from 'react-icons/fa';
import './EditProfile.css';

const EditProfile = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');

    // Estado local para los datos del usuario
    const [user, setUser] = useState(null);

    // Estado del formulario
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        country: '',
        avatar: '',
        selectedGames: '',
        platforms: '',
        experience: '',
        goals: '', 
        isProfileHidden: false
    });

    // 1. CARGAR DATOS DESDE LOCALSTORAGE AL INICIAR
    useEffect(() => {
        const storedUser = localStorage.getItem('esportefyUser');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser); // Guardamos el usuario original

                // Rellenamos el formulario con los datos existentes
                setFormData({
                    ...parsedUser,
                    // Convertimos Arrays a Texto para poder editar
                    selectedGames: parsedUser.selectedGames ? parsedUser.selectedGames.join(', ') : '',
                    platforms: parsedUser.platforms ? parsedUser.platforms.join(', ') : '',
                    experience: parsedUser.experience ? parsedUser.experience.join(', ') : '',
                    goals: parsedUser.goals ? parsedUser.goals.join(', ') : '',
                    isProfileHidden: parsedUser.isProfileHidden || false
                });
            } catch (e) {
                console.error("Error al cargar usuario", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSave = (e) => {
        e.preventDefault();

        // 2. PROCESAR DATOS (Texto -> Arrays)
        const updatedUser = {
            ...user, // Mantenemos ID, token, etc.
            ...formData,
            selectedGames: formData.selectedGames.split(',').map(s => s.trim()).filter(Boolean),
            platforms: formData.platforms.split(',').map(s => s.trim()).filter(Boolean),
            experience: formData.experience.split(',').map(s => s.trim()).filter(Boolean),
            goals: formData.goals.split(',').map(s => s.trim()).filter(Boolean),
        };

        // 3. GUARDAR DIRECTAMENTE EN LOCALSTORAGE
        localStorage.setItem('esportefyUser', JSON.stringify(updatedUser));

        alert('¡Perfil actualizado con éxito!');
        navigate('/profile'); // Volver al perfil
    };

    if (!formData.username && !user) return <div className="loading">Cargando...</div>;

    return (
        <div className="edit-profile-page fade-in">
            <button className="btn-back" onClick={() => navigate('/profile')}>
                <FaArrowLeft /> Volver al Perfil
            </button>

            <div className="settings-container">
                {/* --- BARRA LATERAL (MENÚ) --- */}
                <aside className="settings-sidebar">
                    <h2>Configuración</h2>
                    <nav>
                        <button 
                            className={activeTab === 'general' ? 'active' : ''} 
                            onClick={() => setActiveTab('general')}
                            type="button"
                        >
                            <FaUser /> General
                        </button>
                        <button 
                            className={activeTab === 'gamer' ? 'active' : ''} 
                            onClick={() => setActiveTab('gamer')}
                            type="button"
                        >
                            <FaGamepad /> Perfil Gamer
                        </button>
                        <button 
                            className={activeTab === 'privacy' ? 'active' : ''} 
                            onClick={() => setActiveTab('privacy')}
                            type="button"
                        >
                            <FaLock /> Privacidad
                        </button>
                    </nav>
                </aside>

                {/* --- CONTENIDO DEL FORMULARIO --- */}
                <main className="settings-content">
                    <form onSubmit={handleSave}>
                        
                        {/* PESTAÑA: GENERAL */}
                        {activeTab === 'general' && (
                            <div className="tab-content fade-in">
                                <h3>Información Personal</h3>
                                
                                <div className="avatar-edit-section">
                                    <img 
                                        src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}`} 
                                        alt="Avatar Preview" 
                                    />
                                    <div className="avatar-inputs">
                                        <label>URL del Avatar (Foto)</label>
                                        <div className="input-icon-wrapper">
                                            <FaCamera className="icon-input"/>
                                            <input 
                                                type="text" 
                                                name="avatar" 
                                                value={formData.avatar} 
                                                onChange={handleChange} 
                                                placeholder="Pega el link de tu imagen aquí..." 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Nickname (Usuario)</label>
                                    <input type="text" name="username" value={formData.username} onChange={handleChange} />
                                </div>

                                <div className="form-group">
                                    <label>Nombre Completo</label>
                                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} />
                                </div>

                                <div className="form-group">
                                    <label>País</label>
                                    <input type="text" name="country" value={formData.country} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA: GAMER */}
                        {activeTab === 'gamer' && (
                            <div className="tab-content fade-in">
                                <h3>Perfil de Jugador</h3>
                                
                                <div className="form-group">
                                    <label>Biografía / Metas</label>
                                    <textarea 
                                        rows="4" 
                                        name="goals" 
                                        value={formData.goals} 
                                        onChange={handleChange}
                                        placeholder="Ej: Jugador de Valorant, busco equipo serio..."
                                    ></textarea>
                                </div>

                                <div className="form-group">
                                    <label>Juegos (Separa con comas)</label>
                                    <input 
                                        type="text" 
                                        name="selectedGames" 
                                        value={formData.selectedGames} 
                                        onChange={handleChange} 
                                        placeholder="Valorant, CSGO, LoL" 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Plataformas (Separa con comas)</label>
                                    <input 
                                        type="text" 
                                        name="platforms" 
                                        value={formData.platforms} 
                                        onChange={handleChange} 
                                        placeholder="PC, PS5, Xbox" 
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Experiencia / Logros</label>
                                    <input 
                                        type="text" 
                                        name="experience" 
                                        value={formData.experience} 
                                        onChange={handleChange} 
                                        placeholder="Campeón Regional 2023..." 
                                    />
                                </div>
                            </div>
                        )}

                        {/* PESTAÑA: PRIVACIDAD */}
                        {activeTab === 'privacy' && (
                            <div className="tab-content fade-in">
                                <h3>Privacidad y Seguridad</h3>
                                
                                <div className="privacy-option">
                                    <div className="privacy-text">
                                        <h4>Ocultar Perfil</h4>
                                        <p>Si activas esto, nadie podrá ver tu perfil en las búsquedas.</p>
                                    </div>
                                    <label className="switch">
                                        <input 
                                            type="checkbox" 
                                            name="isProfileHidden" 
                                            checked={formData.isProfileHidden} 
                                            onChange={handleChange} 
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>

                                <div className="privacy-alert">
                                    <h4>Zona de Peligro</h4>
                                    <p>Cambiar contraseña o eliminar cuenta requiere confirmación por email.</p>
                                    <button type="button" className="btn-danger" disabled>Cambiar Contraseña (Pronto)</button>
                                </div>
                            </div>
                        )}

                        {/* BOTÓN DE GUARDAR FLOTANTE */}
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