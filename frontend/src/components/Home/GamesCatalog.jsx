import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// Importar imÃ¡genes de juegos locales
import lolImg from '../../assets/games/lol.jpg';
import valorantImg from '../../assets/games/valorant.jpg';
import cs2Img from '../../assets/games/cs2.jpg';
import mlbbImg from '../../assets/games/mlbb.jpg';
import fortniteImg from '../../assets/games/fornite.jpg';
import freeFireImg from '../../assets/games/freefire.jpg';
import hokImg from '../../assets/games/hok.jpg';
import dota2Img from '../../assets/games/dota2.jpg';
import apexImg from '../../assets/games/Apex.jpg';
import overwatchImg from '../../assets/games/Overwhat2.jpg';
import rocketImg from '../../assets/games/rocket.jpg';
import tekkenImg from '../../assets/games/tekken8.jpg';

const FEATURED_GAMES = [
  { id: 'lol', name: 'League of Legends', img: lolImg, color: '#C1A058', tag: 'MOBA' },
  { id: 'valorant', name: 'Valorant', img: valorantImg, color: '#FF4655', tag: 'FPS' },
  { id: 'cs2', name: 'CS:GO 2', img: cs2Img, color: '#F39C12', tag: 'FPS' },
  { id: 'mlbb', name: 'Mobile Legends', img: mlbbImg, color: '#2980B9', tag: 'MOBA' },
  { id: 'fortnite', name: 'Fortnite', img: fortniteImg, color: '#A94DE3', tag: 'Battle Royale' },
  { id: 'freefire', name: 'Free Fire', img: freeFireImg, color: '#FFA500', tag: 'Battle Royale' },
  { id: 'hok', name: 'Honor of Kings', img: hokImg, color: '#E67E22', tag: 'MOBA' },
  { id: 'dota2', name: 'Dota 2', img: dota2Img, color: '#C0392B', tag: 'MOBA' },
  { id: 'apex', name: 'Apex Legends', img: apexImg, color: '#DA292A', tag: 'Battle Royale' },
  { id: 'overwatch', name: 'Overwatch 2', img: overwatchImg, color: '#FA9C1E', tag: 'FPS' },
  { id: 'rocket', name: 'Rocket League', img: rocketImg, color: '#3498DB', tag: 'Deportes' },
  { id: 'tekken8', name: 'Tekken 8', img: tekkenImg, color: '#C0392B', tag: 'Fighting' },
];

const GamesCatalog = () => {
  return (
    <section className="relative py-24 px-6 md:px-16 bg-[var(--bg-page)] overflow-hidden">
      {/* DecoraciÃ³n de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--primary)] rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[var(--primary)] uppercase tracking-[0.3em] text-sm font-bold">
            Ecosistema competitivo
          </span>
          <h2 className="text-4xl md:text-6xl font-bold text-[var(--text-main)] mt-4 mb-6">
            +25 Juegos Soportados
          </h2>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Desde MOBAs hasta shooters tÃ¡cticos. Encuentra tu comunidad, 
            compite en torneos y escala en el ranking de tu juego favorito.
          </p>
        </motion.div>

        {/* Grid de juegos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {FEATURED_GAMES.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link
                to={`/game/${game.id}`}
                className="group relative block rounded-xl overflow-hidden aspect-[3/4] cursor-pointer"
              >
                {/* Imagen */}
                <img
                  src={game.img}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                
                {/* Borde hover */}
                <div 
                  className="absolute inset-0 border-2 border-transparent rounded-xl transition-all duration-300 group-hover:border-[var(--primary)] group-hover:shadow-[inset_0_0_30px_rgba(142,219,21,0.1)]"
                />

                {/* Tag */}
                <span 
                  className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm"
                  style={{ color: game.color }}
                >
                  {game.tag}
                </span>

                {/* Nombre */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="text-[var(--text-main)] text-sm font-bold leading-tight group-hover:text-[var(--primary)] transition-colors">
                    {game.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-12"
        >
          <Link
            to="/comunidad"
            className="inline-flex items-center gap-3 px-8 py-3 border border-[var(--primary)] text-[var(--primary)] rounded-full hover:bg-[var(--primary-dim)] transition-all duration-300 font-bold text-sm uppercase tracking-wider opacity-80 hover:opacity-100"
          >
            Ver todos los juegos
            <i className="bx bx-right-arrow-alt text-xl"></i>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default GamesCatalog;
