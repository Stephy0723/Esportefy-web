// src/data/profileOptions.js

export const FRAMES = [
  // 0. DEFAULT
  { 
    id: 'none', 
    name: 'Sin Marco', 
    type: 'none', 
    color: '#cccccc',
    desc: 'Estilo clásico y limpio.'
  },

  // 1. NEON STORM (Para Banner 1/2) - Energía Eléctrica
  { 
    id: 'neon-storm', 
    name: 'Neon Storm', 
    type: 'css', 
    color: '#00f2ff',
    desc: 'Energía eléctrica vibrante.'
  },

  // 2. CELESTIAL (Para Banner 4/13) - Nubes Suaves
  { 
    id: 'celestial-dream', 
    name: 'Celestial', 
    type: 'css', 
    color: '#ffc3a0',
    desc: 'Suavidad etérea y nubes.'
  },

  // 3. MIDNIGHT GOLD (Para Banner 7/10) - Lujo Oscuro
  { 
    id: 'midnight-gold', 
    name: 'Midnight Gold', 
    type: 'css', 
    color: '#ffd700',
    desc: 'Elegancia dorada nocturna.'
  },

  // 4. NATURE BLOOM (Para Banner 8/16) - Orgánico
  { 
    id: 'nature-bloom', 
    name: 'Nature Bloom', 
    type: 'css', 
    color: '#50c878',
    desc: 'Hojas y naturaleza viva.'
  },

  // 5. PRISM TECH (Para Banner 11/12) - Geometría
  { 
    id: 'prism-tech', 
    name: 'Prism Tech', 
    type: 'css', 
    color: '#ff0055',
    desc: 'Formas geométricas afiladas.'
  },
  // 6. GALACTIC ORBIT (Espacial/Planetas)
  { 
    id: 'galactic-orbit', 
    name: 'Galactic', 
    type: 'css', 
    color: '#9400d3', 
    desc: 'Anillos orbitales giratorios.' 
  },

  // 7. GLITCH HAZARD (Cyberpunk/Error)
  { 
    id: 'glitch-hazard', 
    name: 'Glitch', 
    type: 'css', 
    color: '#39ff14', 
    desc: 'Distorsión digital y ruido.' 
  },

  // 8. FROZEN SHARD (Hielo/Cristal)
  { 
    id: 'frozen-shard', 
    name: 'Frozen', 
    type: 'css', 
    color: '#a5f2f3', 
    desc: 'Fragmentos de hielo afilados.' 
  },

  // 9. INFERNO RAGE (Fuego Realista)
  { 
    id: 'inferno-rage', 
    name: 'Inferno', 
    type: 'css', 
    color: '#ff4500', 
    desc: 'Llamas vivas y humo.' 
  },

  // 10. RETRO ARCADE (Pixel Art/8-Bit)
  { 
    id: 'retro-arcade', 
    name: '8-Bit', 
    type: 'css', 
    color: '#ff00ff', 
    desc: 'Estilo pixelado nostálgico.' 
  },
  // 11. SNOW ANGEL (Efecto Nieve)
  { 
    id: 'snow-angel', 
    name: 'Snow Angel', 
    type: 'css', 
    color: '#a5f2f3', 
    desc: 'Copos de nieve cayendo suavemente.' 
  },

  // 12. PETAL CASCADE (Lluvia de Pétalos)
  { 
    id: 'petal-cascade', 
    name: 'Rose Rain', 
    type: 'css', 
    color: '#ffb7c5', 
    desc: 'Pétalos de rosa bailando al caer.' 
  },

  // 13. CLOUD NINE (Nubes/Cielo)
  { 
    id: 'cloud-nine', 
    name: 'Cielo', 
    type: 'css', 
    color: '#89cff0', 
    desc: 'Esponjoso como una nube.' 
  },

  // 14. FAIRY DUST (Hadas/Brillos)
  { 
    id: 'fairy-dust-glam', 
    name: 'Fairy', 
    type: 'css', 
    color: '#e6e6fa', 
    desc: 'Polvo de hadas lavanda.' 
  },

  // 15. PORCELAIN DOLL (Elegante/Floral)
  { 
    id: 'porcelain-doll', 
    name: 'Porcelana', 
    type: 'css', 
    color: '#fff0f5', 
    desc: 'Delicado patrón floral blanco.' 
  },
  // 16. IRON GUARDIAN (Acero/Caballero)
  { 
    id: 'iron-guardian', 
    name: 'Guardian', 
    type: 'css', 
    color: '#b0c4de', 
    desc: 'Armadura de acero forjado.' 
  },

  // 17. DRAGON SCALE (Escamas/Fuego)
  { 
    id: 'dragon-scale', 
    name: 'Dragon', 
    type: 'css', 
    color: '#dc143c', 
    desc: 'Escamas de dragón legendario.' 
  },

  // 18. ROYAL CROWN (Realeza/Oro)
  { 
    id: 'royal-crown', 
    name: 'King', 
    type: 'css', 
    color: '#ffd700', 
    desc: 'Oro real y terciopelo azul.' 
  },

  // 19. BERSERKER RAGE (Sangre/Guerra)
  { 
    id: 'berserker-rage', 
    name: 'Berserker', 
    type: 'css', 
    color: '#8b0000', 
    desc: 'Furia de batalla incontenible.' 
  },

  // 20. ANCIENT RUNE (Piedra/Magia)
  { 
    id: 'ancient-rune', 
    name: 'Runic', 
    type: 'css', 
    color: '#00ffff', 
    desc: 'Piedra antigua con runas brillantes.' 
  }

];



// ... (El código de BACKGROUNDS déjalo como estaba arreglado) ...
const bannersGlob = import.meta.glob('../assets/bannerGamer/*.jpg', { eager: true, import: 'default' });

export const BACKGROUNDS = Object.entries(bannersGlob)
  .map(([path, src]) => {
    const fileName = path.split('/').pop().replace('.jpg', '');
    return {
      id: `bg-${fileName}`,
      name: `Fondo ${fileName}`,
      src: src
    };
  })
  .sort((a, b) => {
    const numA = parseInt(a.id.replace('bg-', '') || 0);
    const numB = parseInt(b.id.replace('bg-', '') || 0);
    return numA - numB;
  });