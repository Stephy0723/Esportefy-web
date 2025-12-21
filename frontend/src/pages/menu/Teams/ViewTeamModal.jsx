import React from 'react';

const ViewTeamModal = ({ isOpen, onClose, team }) => {
    if (!isOpen || !team) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content-dark" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header-text">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2>{team.name}</h2>
                        <button className="btn-close-x" onClick={onClose}>&times;</button>
                    </div>
                    <p className="team-game-tag">{team.game.toUpperCase()}</p>
                </div>

                <div className="team-info-body">
                    <div className="info-section">
                        <label>Descripción</label>
                        <p>{team.description || "Este equipo aún no tiene una descripción."}</p>
                    </div>

                    <div className="info-section">
                        <label>Miembros de la escuadra ({team.members.length} / {team.maxMembers})</label>
                        <div className="members-scroll-list">
                            {team.members.map((member) => (
                                <div key={member._id} className="member-row-item">
                                    <div className="member-avatar">
                                        <i className='bx bxs-user-circle'></i>
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{member.fullName}</span>
                                        {team.captain._id === member._id && (
                                            <span className="captain-badge">CAPITÁN</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-primary-small" onClick={onClose}>CERRAR</button>
                </div>
            </div>
        </div>
    );
};

export default ViewTeamModal;