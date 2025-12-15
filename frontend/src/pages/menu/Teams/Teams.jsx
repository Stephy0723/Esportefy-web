import React from 'react';
import './Teams.css';

const Teams = () => {
  return (
    // Usamos una clase para el contenedor principal en lugar de style inline
    <div className="teams-page-wrapper">
        
        <div className="teams-container">
            <h1>👥 Teams & Clans</h1>
            <p>Find a team or create your own.</p>

            <input type="text" className="search-team-bar" placeholder="Search team by name or game..." />

            <div className="team-list">
                
                {/* Team 1 (Red Dragons) */}
                <div className="team-row">
                    <div className="team-profile">
                        {/* Clase 'logo-red' maneja el color */}
                        <div className="team-logo logo-red">
                            <i className='bx bxs-skull'></i>
                        </div>
                        <div>
                            <h3>Red Dragons</h3>
                            {/* Clase 'text-red' maneja el color */}
                            <span className="team-division text-red">Elite Division</span>
                        </div>
                    </div>
                    <div className="members-count">
                        <i className='bx bx-user'></i> 5/6 Members
                    </div>
                    <button className="view-team-btn">View Profile</button>
                </div>

                {/* Team 2 (Blue Ice) */}
                <div className="team-row">
                    <div className="team-profile">
                        <div className="team-logo logo-blue">
                            <i className='bx bxs-invader'></i>
                        </div>
                        <div>
                            <h3>Blue Ice Gaming</h3>
                            <span className="team-division text-blue">Amateur League</span>
                        </div>
                    </div>
                    <div className="members-count">
                        <i className='bx bx-user'></i> 4/5 Members
                    </div>
                    <button className="view-team-btn">View Profile</button>
                </div>

                {/* Team 3 (Golden Kings) */}
                <div className="team-row">
                    <div className="team-profile">
                        <div className="team-logo logo-gold">
                            <i className='bx bxs-crown'></i>
                        </div>
                        <div>
                            <h3>Golden Kings</h3>
                            <span className="team-division text-gold">Pro League</span>
                        </div>
                    </div>
                    <div className="members-count">
                        <i className='bx bx-user'></i> 6/6 Members (Full)
                    </div>
                    <button className="view-team-btn">View Profile</button>
                </div>

            </div>
        </div>
    </div>
  );
};

export default Teams;