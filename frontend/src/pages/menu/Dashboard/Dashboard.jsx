import React, { useState, useEffect } from 'react';

// 1. IMPORTACIONES CORREGIDAS (3 niveles hacia atrás por la carpeta 'menu')
import Navbar from '../../../components/Navbar/Navbar';
import Sidebar from '../../../components/Sidebar/Sidebar';

// 2. SOLO IMPORTAMOS EL CSS DE ESTA PÁGINA (No el del Sidebar)
import './Dashboard.css'; 

const Dashboard = () => {
  // Estado para controlar si el menú está abierto o cerrado
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  
  // Estado para el usuario
  const [user, setUser] = useState({ name: "Gamer", avatar: "" });

  // Simulamos cargar datos del usuario desde la memoria
  useEffect(() => {
    const storedUser = localStorage.getItem('esportefyUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser({ name: "Invitado", avatar: "https://i.pravatar.cc/150?img=11" });
    }
  }, []);

  // Cálculo para empujar el contenido cuando el menú se abre
  const sidebarWidth = isSidebarClosed ? '88px' : '250px';

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
      
      {/* SIDEBAR (Controlado) */}
      <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      
      {/* CONTENEDOR PRINCIPAL */}
      <div 
        style={{ 
          marginLeft: sidebarWidth, 
          transition: 'all 0.5s ease', 
          width: `calc(100% - ${sidebarWidth})` 
        }}
      >
        {/* Navbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 90 }}>
           <Navbar />
        </div>

        {/* CONTENIDO DEL DASHBOARD */}
        <div className="dashboard-container">
            
            {/* BIENVENIDA */}
            <div className="welcome-banner">
                <div>
                    <h1>Bienvenido, <span>{user.name}</span></h1>
                    <p style={{color: '#aaa', marginTop: '5px'}}>Resumen de tu actividad en Esportefy.</p>
                </div>
                <div className="date-badge">
                    <i className='bx bx-calendar'></i>
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* ESTADÍSTICAS RÁPIDAS */}
            <div className="stats-grid">
                <div className="stat-box">
                    <h2 style={{color: '#695CFE'}}>12</h2>
                    <p>Torneos</p>
                </div>
                <div className="stat-box">
                    <h2 style={{color: '#2ecc71'}}>85%</h2>
                    <p>Win Rate</p>
                </div>
                <div className="stat-box">
                    <h2 style={{color: '#f1c40f'}}>5</h2>
                    <p>MVP</p>
                </div>
                <div className="stat-box">
                    <h2>3</h2>
                    <p>Equipos</p>
                </div>
            </div>

            {/* GRID DE CONTENIDO */}
            <div className="dashboard-grid">

                {/* TARJETA 1: TORNEOS */}
                <div className="dash-card">
                    <div className="card-header">
                        <h3><i className='bx bx-trophy'></i> Torneos Activos</h3>
                        <a href="#" className="view-all">Ver todos</a>
                    </div>
                    
                    <div className="list-item">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/f/fc/Valorant_logo_-_pink_color_version.svg" className="item-img" alt="game"/>
                        <div className="item-info">
                            <h4>Valorant Regional</h4>
                            <p>Fase de Grupos</p>
                        </div>
                        <span className="status active">En curso</span>
                    </div>

                    <div className="list-item">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/d/d8/League_of_Legends_2019_vector.svg" className="item-img" alt="game"/>
                        <div className="item-info">
                            <h4>LoL Winter Cup</h4>
                            <p>Inicia pronto</p>
                        </div>
                        <span className="status pending">Pendiente</span>
                    </div>
                </div>

                {/* TARJETA 2: EQUIPOS */}
                <div className="dash-card">
                    <div className="card-header">
                        <h3><i className='bx bx-group'></i> Mis Equipos</h3>
                        <a href="#" className="view-all">Gestionar</a>
                    </div>

                    <div className="list-item">
                        <div className="item-img" style={{backgroundColor: '#FF5733', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <i className='bx bxs-skull' style={{fontSize:'24px'}}></i>
                        </div>
                        <div className="item-info">
                            <h4>Red Dragons</h4>
                            <p>Capitán</p>
                        </div>
                    </div>
                </div>

                {/* TARJETA 3: COMUNIDADES */}
                <div className="dash-card">
                    <div className="card-header">
                        <h3><i className='bx bx-world'></i> Comunidades</h3>
                        <a href="#" className="view-all">Explorar</a>
                    </div>

                    <div className="list-item">
                        <div className="item-img" style={{backgroundColor: '#9b59b6', display:'flex', alignItems:'center', justifyContent:'center'}}>
                            <i className='bx bx-joystick' style={{fontSize:'24px'}}></i>
                        </div>
                        <div className="item-info">
                            <h4>FPS Latam</h4>
                            <p>12k Miembros</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;