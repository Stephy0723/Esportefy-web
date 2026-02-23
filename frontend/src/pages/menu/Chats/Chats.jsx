import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext'; 
import { 
  FaHashtag, FaUserFriends, FaChevronDown, 
  FaPlus, FaSearch, FaEllipsisV, FaPaperPlane,
  FaSmile, FaPaperclip, FaMicrophone, FaComments
} from 'react-icons/fa';
import { io } from 'socket.io-client';
import axios from 'axios';
import './Chats.css';
import PageHud from '../../../components/PageHud/PageHud';
import { CHAT_URL } from '../../../config/api';

const CHAT_SERVER_URL = CHAT_URL;

export default function Chats() {
  const { isDarkMode } = useTheme();
  const [conversations, setConversations] = useState({ teams: [], directs: [] });
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  const myUserId = localStorage.getItem('userId'); 
  const myUserName = localStorage.getItem('userName');

  useEffect(() => {
    const socket = io(CHAT_SERVER_URL, {
      reconnectionAttempts: 3,
      timeout: 5000
    });

    socketRef.current = socket;

    socket.on('connect_error', (error) => {
      console.error('No se pudo conectar al chat-service:', error?.message || error);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // 1. Cargar lista de chats
  useEffect(() => {
    const loadSidebarChats = async () => {
      try {
        const res = await axios.get(`${CHAT_SERVER_URL}/conversations/${myUserId}`);
        const teams = res.data.filter(c => c.type === 'team');
        const directs = res.data.filter(c => c.type === 'individual');
        setConversations({ teams, directs });
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (myUserId) loadSidebarChats();
  }, [myUserId]);

  // 2. Manejo de mensajes y socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!activeChat || !socket) return;

    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${CHAT_SERVER_URL}/messages/${activeChat._id}`);
        setMessages(response.data.map(msg => ({
          id: msg._id,
          sender: msg.senderName,
          text: msg.content,
          time: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          own: msg.senderId === myUserId
        })));
      } catch (error) { setMessages([]); }
    };

    fetchHistory();
    socket.emit('join_chat', activeChat._id);
    const onReceiveMessage = (data) => {
      setMessages((prev) => [...prev, { ...data, own: data.ownId === myUserId }]);
    };
    socket.on('receive_message', onReceiveMessage);

    return () => socket.off('receive_message', onReceiveMessage);
  }, [activeChat, myUserId]);

  // 3. Envío
  const handleSend = (e) => {
    e.preventDefault();
    const socket = socketRef.current;
    if (!input.trim() || !activeChat || !socket) return;
    socket.emit('send_message', {
      conversationId: activeChat._id,
      senderId: myUserId,
      senderName: myUserName,
      content: input
    });
    setInput("");
  };

  return (
    <div className={`hybrid-chat-container ${isDarkMode ? 'dark' : 'light'}`}>
      <PageHud page="CHATS" />
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <div className="search-bar"><FaSearch /><input type="text" placeholder="Buscar..." /></div>
        </div>

        <div className="chat-scroller">
          {/* Equipos */}
          <div className="chat-section">
            <div className="section-title"><FaChevronDown /> <span>EQUIPOS</span> <FaPlus className="add-btn" /></div>
            {conversations.teams.map(team => (
              <div key={team._id} className={`chat-item ${activeChat?._id === team._id ? 'active' : ''}`} onClick={() => setActiveChat(team)}>
                <div className="chat-icon team">#</div>
                <span className="chat-name">{team.name}</span>
              </div>
            ))}
          </div>

          {/* Directos */}
          <div className="chat-section">
            <div className="section-title"><FaUserFriends /> <span>DIRECTOS</span></div>
            {conversations.directs.map(user => (
              <div key={user._id} className={`chat-item ${activeChat?._id === user._id ? 'active' : ''}`} onClick={() => setActiveChat(user)}>
                <div className="avatar-wrapper">
                  <img src={user.avatar || '/default.png'} className="img-chat" alt="" />
                  <span className={`status-dot ${user.status}`}></span>
                </div>
                <div className="chat-info"><span className="chat-name">{user.name}</span></div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="chat-window">
        {activeChat ? (
          <>
            <header className="window-header">
                <div className="header-left">
                    <h3>{activeChat.name}</h3>
                </div>
                <FaEllipsisV />
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
              <form className="input-form" onSubmit={handleSend}>
                <input type="text" placeholder="Escribe algo..." value={input} onChange={(e) => setInput(e.target.value)} />
                <button type="submit"><FaPaperPlane /></button>
              </form>
            </footer>
          </>
        ) : (
          /* MENSAJE BONITO CUANDO NO HAY CHAT SELECCIONADO */
          <div className="empty-chat-state">
            <div className="empty-content">
              <div className="icon-circle">
                <FaComments className="floating-icon" />
              </div>
              <h2>Tus conversaciones</h2>
              <p>Selecciona un equipo o un compañero para empezar a planear tu próxima victoria.</p>
              <button className="start-chat-btn">Explorar Comunidad</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
