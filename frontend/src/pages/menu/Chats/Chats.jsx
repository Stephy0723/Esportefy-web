import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext'; 
import { 
  FaHashtag, FaUserFriends, FaChevronDown, 
  FaPlus, FaSearch, FaEllipsisV, FaPaperPlane,
  FaSmile, FaPaperclip, FaMicrophone 
} from 'react-icons/fa';
import './Chats.css';

const MOCK_DATA = {
  teams: [
    { id: 't1', name: 'Esportefy Staff', type: 'team', unread: 2 },
    { id: 't2', name: 'Alpha Squad (LoL)', type: 'team', unread: 0 },
  ],
  directs: [
    { id: 'd1', name: 'AlexGamer', status: 'online', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 'd2', name: 'Steliant', status: 'offline', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 'd3', name: 'Sofia_Support', status: 'online', avatar: 'https://i.pravatar.cc/150?u=3' },
  ]
};

export default function Chats() {
  const { isDarkMode } = useTheme();
  const [activeChat, setActiveChat] = useState(MOCK_DATA.teams[0]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: 'Tú',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      own: true
    };
    setMessages([...messages, newMsg]);
    setInput("");
  };

  return (
    <div className={`hybrid-chat-container ${isDarkMode ? 'dark' : 'light'}`}>
      
      {/* PANEL LATERAL: EXPLORADOR */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="search-bar">
            <FaSearch />
            <input type="text" placeholder="Buscar chat o equipo..." />
          </div>
        </div>

        <div className="chat-scroller">
          {/* SECCIÓN EQUIPOS */}
          <div className="chat-section">
            <div className="section-title">
              <FaChevronDown className="arrow" /> <span>EQUIPOS</span>
              <FaPlus className="add-btn" />
            </div>
            {MOCK_DATA.teams.map(team => (
              <div 
                key={team.id} 
                className={`chat-item ${activeChat.id === team.id ? 'active' : ''}`}
                onClick={() => setActiveChat(team)}
              >
                <div className="chat-icon team">#</div>
                <span className="chat-name">{team.name}</span>
                {team.unread > 0 && <span className="badge">{team.unread}</span>}
              </div>
            ))}
          </div>

          {/* SECCIÓN DIRECTOS */}
          <div className="chat-section">
            <div className="section-title">
              <FaUserFriends /> <span>MENSAJES DIRECTOS</span>
            </div>
            {MOCK_DATA.directs.map(user => (
              <div 
                key={user.id} 
                className={`chat-item ${activeChat.id === user.id ? 'active' : ''}`}
                onClick={() => setActiveChat(user)}
              >
                <div className="avatar-wrapper">
                  <img src={user.avatar} alt={user.name} className="img-chat" />
                  <span className={`status-dot ${user.status}`}></span>
                </div>
                <div className="chat-info">
                  <span className="chat-name">{user.name}</span>
                  <span className="chat-status">{user.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* PANEL PRINCIPAL: VENTANA DE CHAT */}
      <main className="chat-window">
        <header className="window-header">
          <div className="header-left">
            {activeChat.type === 'team' ? (
              <div className="chat-icon team mini">#</div>
            ) : (
              <div className="avatar-wrapper mini">
                 <img src={activeChat.avatar} className="img-chat" alt="active" />
              </div>
            )}
            <h3>{activeChat.name}</h3>
          </div>
          <div className="header-right">
            <FaEllipsisV />
          </div>
        </header>

        <div className="messages-area" ref={scrollRef}>
          {messages.map(msg => (
            <div key={msg.id} className={`msg-bubble-wrapper ${msg.own ? 'own' : ''}`}>
              <div className="msg-bubble">
                {!msg.own && <span className="sender-name">{msg.sender}</span>}
                <p>{msg.text}</p>
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="input-area">
          <div className="input-actions">
            <FaPaperclip />
            <FaSmile />
          </div>
          <form className="input-form" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Escribe un mensaje..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit">
              {input.trim() ? <FaPaperPlane /> : <FaMicrophone />}
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}