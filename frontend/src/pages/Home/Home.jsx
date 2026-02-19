import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

// COMPONENTES
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import ImmersiveSection from '../../components/ImmersiveSection/ImmersiveSection';

// VIDEOS (Asegúrate de que tus rutas estén bien)
import videoInicio from '../../assets/video/inicio.mp4';
import videoQuienes from '../../assets/video/quienes.mp4';
import videoVision from '../../assets/video/vision.mp4'; 
import videoMision from '../../assets/video/.vision.mp4';

const Home = () => {
  const [isSidebarClosed, setIsSidebarClosed] = useState(true);
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  
  // Cálculo para empujar el contenido cuando el menú se abre
  const sidebarWidth = isAuthenticated ? (isSidebarClosed ? '88px' : '250px') : '0px';

  return (
    <div className="home-container bg-[#121212]">
      
      {/* 1. SIDEBAR (Solo para sesión activa) */}
      {isAuthenticated && (
        <Sidebar isClosed={isSidebarClosed} setIsClosed={setIsSidebarClosed} />
      )}

      {/* 2. CONTENIDO PRINCIPAL (Se mueve al abrir el menú) */}
      <div 
        className="main-content"
        style={{ 
          marginLeft: sidebarWidth, 
          transition: 'all 0.5s ease', 
          width: `calc(100% - ${sidebarWidth})` 
        }}
      >
        {/* NAVBAR SUPERIOR */}
        <div style={{ position: 'sticky', top: 0, zIndex: 90 }}>
           <Navbar />
        </div>

        {/* --- SECCIÓN 1: BIENVENIDA (CON BOTONES) --- */}
        <ImmersiveSection 
          id="inicio"
          videoSrc={videoInicio}
          title="ESPORTEFY"
          subtitle="Bienvenido a la Revolución"
          text="La plataforma definitiva para gestionar tu carrera eSports. Únete a torneos, encuentra equipos y demuestra tu nivel."
          showAuthButtons={true} // <--- ¡ESTO ES LO QUE HACE QUE SALGAN LOS BOTONES!
          nextSection="quienes"
        />

        {/* --- SECCIÓN 2: QUIÉNES SOMOS --- */}
        <ImmersiveSection 
          id="quienes"
          videoSrc={videoQuienes}
          title="Quiénes Somos"
          subtitle="Nuestra Identidad"
          text="Somos una organización nacida de la pasión por el gaming competitivo. Transformamos jugadores casuales en leyendas profesionales."
          align="right" // Texto a la derecha para variar
          nextSection="valores"
        />

        {/* --- SECCIÓN 3: VALORES (Nueva sección que pediste) --- */}
        <ImmersiveSection 
          id="valores"
          videoSrc={videoVision} 
          title="Nuestros Valores"
          subtitle="Lo que nos define"
          text="Disciplina, Respeto y Competitividad. Creemos en el juego limpio y en construir una comunidad sana donde el talento brille."
          nextSection="mision"
        />

        {/* --- SECCIÓN 4: MISIÓN --- */}
        <ImmersiveSection 
          id="mision"
          videoSrc={videoMision}
          title="Nuestra Misión"
          subtitle="El Objetivo"
          text="Proveer la infraestructura tecnológica necesaria para que cualquier gamer, en cualquier lugar, pueda alcanzar el profesionalismo."
          align="right"
        />

      </div>
    </div>
  );
};

export default Home;
