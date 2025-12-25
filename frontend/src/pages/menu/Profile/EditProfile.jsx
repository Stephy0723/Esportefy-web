import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaGamepad, FaLock, FaSave, FaArrowLeft, FaCamera } from 'react-icons/fa';
import './EditProfile.css';

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
        selectedGames: '',
        platforms: '',
        experience: '',
        goals: '', 
        isProfileHidden: false
    });

    useEffect(() => {
        const storedUser = localStorage.getItem('esportefyUser');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setFormData({
                ...parsedUser,
                selectedGames: Array.isArray(parsedUser.selectedGames) ? parsedUser.selectedGames.join(', ') : parsedUser.selectedGames,
                platforms: Array.isArray(parsedUser.platforms) ? parsedUser.platforms.join(', ') : parsedUser.platforms,
                experience: Array.isArray(parsedUser.experience) ? parsedUser.experience.join(', ') : parsedUser.experience,
                goals: Array.isArray(parsedUser.goals) ? parsedUser.goals.join(', ') : parsedUser.goals,
                isProfileHidden: parsedUser.isProfileHidden || false
            });
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
        
        // Usamos FormData para enviar el archivo binario
        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'teams') return;
            data.append(key, formData[key]);
        });
        
        if (file) {
            data.append('avatarFile', file);
        }

        try {
            const response = await axios.put(
                'http://localhost:4000/api/auth/update-profile', 
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

    if (!user) return <div className="loading">Cargando...</div>;

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
                        <button className={activeTab === 'gamer' ? 'active' : ''} onClick={() => setActiveTab('gamer')} type="button"><FaGamepad /> Perfil Gamer</button>
                        <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')} type="button"><FaLock /> Privacidad</button>
                    </nav>
                </aside>

                <main className="settings-content">
                    <form onSubmit={handleSave}>
                        {activeTab === 'general' && (
                            <div className="tab-content fade-in">
                                <h3>Información Personal</h3>
                                <div className="avatar-edit-section">
                                    <img src={preview || formData.avatar || `https://ui-avatars.com/api/?name=${formData.username}`} alt="Preview" />
                                    <div className="avatar-inputs">
                                        <label className="btn-upload-custom">
                                            <FaCamera /> Subir desde PC
                                            <input type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
                                        </label>
                                        <input type="text" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="O pega una URL de imagen..." className="mt-2" />
                                    </div>
                                </div>
                                <div className="form-group"><label>Nickname</label><input type="text" name="username" value={formData.username} onChange={handleChange} /></div>
                                <div className="form-group"><label>Nombre Completo</label><input type="text" name="fullName" value={formData.fullName} onChange={handleChange} /></div>
                                <div className="form-group"><label>País</label><input type="text" name="country" value={formData.country} onChange={handleChange} /></div>
                            </div>
                        )}

                        {activeTab === 'gamer' && (
                            <div className="tab-content fade-in">
                                <h3>Perfil de Jugador</h3>
                                <div className="form-group"><label>Biografía / Metas</label><textarea rows="4" name="goals" value={formData.goals} onChange={handleChange} placeholder="Escribe tus objetivos..."></textarea></div>
                                <div className="form-group"><label>Juegos (Comas)</label><input type="text" name="selectedGames" value={formData.selectedGames} onChange={handleChange} /></div>
                                <div className="form-group"><label>Plataformas (Comas)</label><input type="text" name="platforms" value={formData.platforms} onChange={handleChange} /></div>
                                <div className="form-group"><label>Experiencia</label><input type="text" name="experience" value={formData.experience} onChange={handleChange} /></div>
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