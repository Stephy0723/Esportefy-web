import React, { useState } from 'react';
import Navbar from '../../../components/Navbar/Navbar';
import Sidebar from '../../../components/Sidebar/Sidebar';
import './Community.css';

const Community = () => {
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const sidebarWidth = isSidebarClosed ? '88px' : '250px';

  return (
    <div style={{ background: '#121212', minHeight: '100vh' }}>
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      
      <div style={{ marginLeft: sidebarWidth, transition: '0.5s', width: `calc(100% - ${sidebarWidth})` }}>
        <Navbar />
        
        <div className="community-container">
            <h1 style={{marginBottom: 30}}>🌍 Global Community</h1>
            
            <div className="feed-grid">
                <div className="posts-feed">
                    <div className="post-card">
                        <div className="post-header">
                            <img src="https://i.pravatar.cc/150?img=15" className="user-avatar-small" alt="user"/>
                            <div>
                                <h4>AlexGamer</h4>
                                <span style={{fontSize:12, color:'#888'}}>2 hours ago</span>
                            </div>
                        </div>
                        <p>Looking for a duo partner for Valorant tonight. Platinum rank or higher. 🎮</p>
                        <div className="post-actions">
                            <span><i className='bx bx-heart'></i> 24</span>
                            <span><i className='bx bx-comment'></i> 5</span>
                            <span><i className='bx bx-share'></i> Share</span>
                        </div>
                    </div>

                    <div className="post-card">
                        <div className="post-header">
                            <img src="https://i.pravatar.cc/150?img=60" className="user-avatar-small" alt="user"/>
                            <div>
                                <h4>ProTips_Official</h4>
                                <span style={{fontSize:12, color:'#888'}}>5 hours ago</span>
                            </div>
                        </div>
                        <p>New balance patch announced. What do you think about the duelist changes?</p>
                        <div className="post-actions">
                            <span><i className='bx bx-heart'></i> 156</span>
                            <span><i className='bx bx-comment'></i> 42</span>
                        </div>
                    </div>
                </div>

                <div className="trends-box">
                    <h3 style={{marginBottom: 20, color: '#695CFE'}}>Trending</h3>
                    <div className="trend-item">
                        <h4>#Worlds2024</h4>
                        <p style={{fontSize:12, color:'#888'}}>120k posts</p>
                    </div>
                    <div className="trend-item">
                        <h4>#ValorantUpdate</h4>
                        <p style={{fontSize:12, color:'#888'}}>45k posts</p>
                    </div>
                    <div className="trend-item">
                        <h4>#EsportefyCup</h4>
                        <p style={{fontSize:12, color:'#888'}}>12k posts</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Community;
