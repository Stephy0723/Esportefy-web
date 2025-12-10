import React, { useState } from 'react';
import Navbar from '../../../components/Navbar/Navbar';
import Sidebar from '../../../components/Sidebar/Sidebar';
import './Teams.css';

const Teams = () => {
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const sidebarWidth = isSidebarClosed ? '88px' : '250px';

  return (
    <div style={{ background: '#121212', minHeight: '100vh' }}>
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      
      <div style={{ marginLeft: sidebarWidth, transition: '0.5s', width: `calc(100% - ${sidebarWidth})` }}>
        <Navbar />
        
        <div className="teams-container">
            <h1 style={{marginBottom: 10}}>👥 Teams & Clans</h1>
            <p style={{marginBottom: 30, color: '#aaa'}}>Find a team or create your own.</p>

            <input type="text" className="search-team-bar" placeholder="Search team by name or game..." />

            <div className="team-list">
                {/* Team 1 */}
                <div className="team-row">
                    <div className="team-profile">
                        <div className="team-logo" style={{background: '#e74c3c'}}><i className='bx bxs-skull'></i></div>
                        <div>
                            <h3>Red Dragons</h3>
                            <span style={{fontSize: 12, color: '#e74c3c'}}>Elite Division</span>
                        </div>
                    </div>
                    <div className="members-count"><i className='bx bx-user'></i> 5/6 Members</div>
                    <button className="view-team-btn">View Profile</button>
                </div>

                {/* Team 2 */}
                <div className="team-row">
                    <div className="team-profile">
                        <div className="team-logo" style={{background: '#3498db'}}><i className='bx bxs-invader'></i></div>
                        <div>
                            <h3>Blue Ice Gaming</h3>
                            <span style={{fontSize: 12, color: '#3498db'}}>Amateur League</span>
                        </div>
                    </div>
                    <div className="members-count"><i className='bx bx-user'></i> 4/5 Members</div>
                    <button className="view-team-btn">View Profile</button>
                </div>

                {/* Team 3 */}
                <div className="team-row">
                    <div className="team-profile">
                        <div className="team-logo" style={{background: '#f1c40f', color: '#000'}}><i className='bx bxs-crown'></i></div>
                        <div>
                            <h3>Golden Kings</h3>
                            <span style={{fontSize: 12, color: '#f1c40f'}}>Pro League</span>
                        </div>
                    </div>
                    <div className="members-count"><i className='bx bx-user'></i> 6/6 Members (Full)</div>
                    <button className="view-team-btn">View Profile</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Teams;
