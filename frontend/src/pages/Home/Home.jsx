import React from 'react';

// IMPORTA TUS COMPONENTES
import Navbar from '../../components/Navbar/Navbar';
import Sidebar from '../../components/Sidebar/Sidebar';
import ImmersiveSection from '../../components/ImmersiveSection/ImmersiveSection';

// IMPORTA TUS VIDEOS
import videoInicio from '../../assets/video/inicio.mp4';
import videoQuienes from '../../assets/video/quienes.mp4';
import videoVision from '../../assets/video/vision.mp4';
import videoMision from '../../assets/video/.vision.mp4';

const Home = () => {
  return (
    <div className="home-container bg-[#121212]">
      
      <Navbar />
      <Sidebar /> 

      {/* --- 1. INICIO --- */}
      {/* Botón bajará a "quienes" */}
      <ImmersiveSection 
        id="inicio"
        videoSrc={videoInicio}
        title="ESPORTEFY"
        subtitle="Tu potencial, nuestra pasión"
        text="Bienvenido a la revolución del entrenamiento deportivo. Aquí comienza tu viaje hacia la excelencia."
        nextSection="quienes" 
      />

      {/* --- 2. QUIÉNES SOMOS --- */}
      {/* Botón bajará a "vision" */}
      <ImmersiveSection 
        id="quienes"
        videoSrc={videoQuienes}
        title="Quiénes Somos"
        subtitle="Nuestra Identidad"
        text="Somos una organización dedicada al deporte y al desarrollo integral. Nacimos con la idea de transformar el entrenamiento en una experiencia de vida única."
        nextSection="vision"
        align="right" // Alineamos a la derecha para variar
      />

      {/* --- 3. VISIÓN --- */}
      {/* Botón bajará a "mision" */}
      <ImmersiveSection 
        id="vision"
        videoSrc={videoVision}
        title="Nuestra Visión"
        subtitle="El Futuro"
        text="Ser reconocidos globalmente como la plataforma líder en innovación deportiva, inspirando a millones a superar sus propios límites cada día."
        nextSection="mision"
      />

      {/* --- 4. MISIÓN --- */}
      {/* Sin botón nextSection porque es el final */}
      <ImmersiveSection 
        id="mision"
        videoSrc={videoMision}
        title="Nuestra Misión"
        subtitle="El Propósito"
        text="Proveer herramientas y conocimientos de vanguardia para atletas y entusiastas, fomentando una comunidad basada en la disciplina y el respeto."
        align="right"
      />

    </div>
  );
};

export default Home;