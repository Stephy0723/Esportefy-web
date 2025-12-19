import React, { useState } from 'react';
import axios from 'axios';

const CreateTeamModal = ({ isOpen, onClose, refreshTeams }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        game: '',
        maxMembers: 5,
        isPrivate: false
    });
    const [submitting, setSubmitting] = useState(false);

    // Si el modal no está abierto, no renderiza nada
    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('token');

        try {
            // Petición al backend con el token de autorización
            await axios.post('http://localhost:4000/api/teams/create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            refreshTeams(); // Recarga la lista de equipos en la vista principal
            onClose();      // Cierra el modal tras el éxito
            setFormData({ name: '', description: '', game: '', maxMembers: 5, isPrivate: false });
        } catch (error) {
            alert(error.response?.data?.message || "Error al crear equipo. Verifica los datos.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* El stopPropagation evita que el modal se cierre al hacer clic dentro del formulario */}
            <div className="modal-content-dark" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-text">
                    <h2>Nuevo Equipo</h2>
                    <p>Configura los detalles de tu escuadra</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre del Equipo</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Alpha Warriors"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required 
                        />
                    </div>

                    <div className="input-row-split">
                        <div className="input-group">
                            <label>Juego Principal</label>
                            <select 
                                value={formData.game} 
                                onChange={(e) => setFormData({...formData, game: e.target.value})}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                <option value="league of legends">League of Legends</option>
                                <option value="valorant">Valorant</option>
                                <option value="free fire">Free Fire</option>
                                <option value="cs-go">CS:GO</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Máx. Jugadores</label>
                            <input 
                                type="number" 
                                min="2" max="12"
                                value={formData.maxMembers}
                                onChange={(e) => setFormData({...formData, maxMembers: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Descripción (Opcional)</label>
                        <textarea 
                            placeholder="Breve descripción del equipo..."
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            CANCELAR
                        </button>
                        <button type="submit" className="btn-submit-team" disabled={submitting}>
                            {submitting ? 'PROCESANDO...' : 'CREAR EQUIPO'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeamModal;