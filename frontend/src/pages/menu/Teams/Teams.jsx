import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Teams.css';
import CreateTeamModal from './CreateTeamModal';
import ViewTeamModal from './ViewTeamModal'; 

const Team = () => {
    const [teams, setTeams] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState(null);

    

    // Buscamos en ambos almacenamientos para asegurar que detecte al usuario
    const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const currentUserId = currentUser?.id || currentUser?._id;

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:4000/api/teams');
            setTeams(response.data);
        } catch (error) {
            console.error("Error al cargar equipos", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeaveTeam = async (teamId) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!window.confirm("¿Estás seguro de que quieres abandonar este equipo?")) return;

        try {
            await axios.post(`http://localhost:4000/api/teams/leave/${teamId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTeams(); 
        } catch (error) {
            alert(error.response?.data?.message || "Error al abandonar el equipo");
        }
    };

    const handleJoinTeam = async (team) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) return alert("Debes iniciar sesión para unirte.");

        try {
            await axios.post('http://localhost:4000/api/teams/join', 
                { teamId: team._id }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTeams();
        } catch (error) {
            alert(error.response?.data?.message || "Error al unirse");
        }
    };

    const handleOpenView = (team) => {
        setSelectedTeam(team);
        setIsViewModalOpen(true);
    };

    const filteredTeams = teams.filter(team => 
        team.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="teams-page-wrapper">
            <div className="teams-container">
                <div className="teams-header">
                    <div className="header-inline">
                        <h1>Explorar Equipos</h1>
                        <button className="btn-create-team-inline" onClick={() => setIsModalOpen(true)}>
                            <i className='bx bx-plus'></i> CREAR EQUIPO
                        </button>
                    </div>
                    <p>Encuentra tu escuadra ideal o crea una nueva.</p>
                </div>

                <input 
                    type="text" 
                    className="search-team-bar" 
                    placeholder="Buscar equipo por nombre..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="team-list">
                    {loading ? (
                        <p>Cargando equipos...</p>
                    ) : filteredTeams.map((team, index) => {
                        const isMember = team.members.some(memberId =>(memberId._id || memberId).toString() === currentUserId?.toString());

                        return (
                            <div className="team-row" key={team._id}>
                                <div className="team-profile">
                                    <div className={`team-logo ${index % 3 === 0 ? 'logo-blue' : index % 3 === 1 ? 'logo-red' : 'logo-gold'}`}>
                                        <i className='bx bx-shield-quarter'></i>
                                    </div>
                                    <div>
                                        <h3>{team.name}</h3>
                                        <span className={`team-division ${index % 3 === 0 ? 'text-blue' : index % 3 === 1 ? 'text-red' : 'text-gold'}`}>
                                            {team.game.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="members-count">
                                    <i className='bx bx-group'></i>
                                    {team.members.length} / {team.maxMembers} Miembros
                                </div>

                                <div className="team-actions">
                                    {/* El botón VER EQUIPO siempre está presente */}
                                    <button 
                                    className="view-team-btn secondary"
                                    onClick={() => handleOpenView(team)}>
                                        VER EQUIPO
                                    </button>

                                    {isMember ? (
                                        <button className="btn-leave-team" onClick={() => handleLeaveTeam(team._id)}>
                                            <i className='bx bx-log-out'></i> SALIR
                                        </button>
                                    ) : (
                                        <button className="view-team-btn join" onClick={() => handleJoinTeam(team)}>
                                            <i className='bx bx-user-plus'></i> UNIRSE
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CreateTeamModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                refreshTeams={fetchTeams} 
            />
            <ViewTeamModal 
                isOpen={isViewModalOpen} 
                onClose={() => setIsViewModalOpen(false)} 
                team={selectedTeam} 
            />
        </div>
    );
};

export default Team;