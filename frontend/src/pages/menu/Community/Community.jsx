import React from 'react';
import './Community.css';

const Community = () => {
  return (
    // CONTENEDOR LIMPIO: Sin background fijo para que funcione el modo claro/oscuro
    <div className="community-page-wrapper" style={{ minHeight: '100vh', width: '100%' }}>
        
        <div className="community-container">
            {/* Título controlado por CSS */}
            <h1 style={{marginBottom: 30}}>🌍 Global Community</h1>
            
            <div className="feed-grid">
                {/* --- POSTS FEED --- */}
                <div className="posts-feed">
                    
                    {/* Post 1 */}
                    <div className="post-card">
                        <div className="post-header">
                            <img src="https://i.pravatar.cc/150?img=15" className="user-avatar-small" alt="user"/>
                            <div>
                                <h4>AlexGamer</h4>
                                <span className="post-time">2 hours ago</span>
                            </div>
                        </div>
                        <div className="post-content">
                            Looking for a duo partner for Valorant tonight. Platinum rank or higher. 🎮
                        </div>
                        <div className="post-actions">
                            <span><i className='bx bx-heart'></i> 24</span>
                            <span><i className='bx bx-comment'></i> 5</span>
                            <span><i className='bx bx-share'></i> Share</span>
                        </div>
                    </div>

                    {/* Post 2 */}
                    <div className="post-card">
                        <div className="post-header">
                            <img src="https://i.pravatar.cc/150?img=60" className="user-avatar-small" alt="user"/>
                            <div>
                                <h4>ProTips_Official</h4>
                                <span className="post-time">5 hours ago</span>
                            </div>
                        </div>
                        <div className="post-content">
                            New balance patch announced. What do you think about the duelist changes?
                        </div>
                        <div className="post-actions">
                            <span><i className='bx bx-heart'></i> 156</span>
                            <span><i className='bx bx-comment'></i> 42</span>
                            <span><i className='bx bx-share'></i> Share</span>
                        </div>
                    </div>

                </div>

                {/* --- TRENDS SIDEBAR --- */}
                <div className="trends-box">
                    <h3>Trending</h3>
                    
                    <div className="trend-item">
                        <span className="trend-category">Esports • LIVE</span>
                        <span className="trend-title">#Worlds2024</span>
                        <span className="trend-posts-count">120k posts</span>
                    </div>

                    <div className="trend-item">
                        <span className="trend-category">Gaming • FPS</span>
                        <span className="trend-title">#ValorantUpdate</span>
                        <span className="trend-posts-count">45k posts</span>
                    </div>

                    <div className="trend-item">
                        <span className="trend-category">Tournament</span>
                        <span className="trend-title">#EsportefyCup</span>
                        <span className="trend-posts-count">12k posts</span>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};

export default Community;