import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

const ImmersiveSection = ({ 
  id, 
  title, 
  subtitle, 
  text, 
  videoSrc, 
  nextSection, 
  align = 'left',
  showAuthButtons = false // Propiedad para activar los botones en el inicio
}) => {
  
  const scrollToNext = () => {
    if(nextSection) {
      const section = document.getElementById(nextSection);
      if(section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section 
      id={id} 
      className="relative w-full h-screen overflow-hidden flex items-center snap-center" 
    >
      
      {/* 1. FONDO DE VIDEO */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div 
          initial={{ scale: 1 }}
          whileInView={{ scale: 1.1 }} 
          transition={{ duration: 10, ease: "linear" }} 
          className="w-full h-full"
        >
          <video 
            src={videoSrc}
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover" 
          />
        </motion.div>
        {/* Capa oscura */}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* 2. CONTENIDO */}
      <div className={`relative z-10 w-full px-8 md:px-32 ${align === 'right' ? 'text-right flex flex-col items-end' : 'text-left'}`}>
        
        {subtitle && (
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[#695CFE] uppercase tracking-[0.3em] text-sm md:text-base font-bold mb-4"
          >
            {subtitle}
          </motion.h3>
        )}

        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-5xl md:text-[80px] font-bold text-white leading-none mb-6 drop-shadow-2xl font-sans"
        >
          {title}
        </motion.h2>

        {text && (
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-xl text-gray-200 text-lg leading-relaxed mb-8 drop-shadow-md"
          >
            {text}
          </motion.p>
        )}

        {/* --- 3. BOTONES DE LOGIN / REGISTRO (Solo si showAuthButtons es true) --- */}
        {showAuthButtons && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="flex flex-wrap gap-5 mb-12" // Flex para alinear botones
          >
            {/* Botón Iniciar Sesión (Borde Blanco) */}
            <Link 
              to="/login" 
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-full uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all duration-300 hover:-translate-y-1 shadow-lg"
            >
              Iniciar Sesión
            </Link>
            
            {/* Botón Registrarse (Morado Neón) */}
            <Link 
              to="/register" 
              className="px-8 py-3 bg-[#695CFE] border-2 border-[#695CFE] text-white font-bold rounded-full uppercase tracking-widest text-xs hover:bg-[#584cf4] hover:border-[#584cf4] transition-all duration-300 hover:-translate-y-1 shadow-[0_0_15px_rgba(105,92,254,0.5)] hover:shadow-[0_0_25px_rgba(105,92,254,0.8)]"
            >
              Registrarse
            </Link>
          </motion.div>
        )}

        {/* 4. BOTÓN "VER MÁS" (Flecha hacia abajo) */}
        {nextSection && (
          <motion.button 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={scrollToNext}
            className="group flex items-center gap-3 text-white border border-white/30 px-8 py-3 rounded-full hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-sm cursor-pointer"
          >
            <span className="uppercase text-xs font-bold tracking-widest">
              {showAuthButtons ? "Conócenos más" : "Siguiente Sección"}
            </span>
            <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform animate-bounce" />
          </motion.button>
        )}

      </div>
    </section>
  );
};

export default ImmersiveSection;