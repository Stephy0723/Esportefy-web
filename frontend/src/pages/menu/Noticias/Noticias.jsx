import React from 'react';
import './Noticias.css';

// Ejemplo de estructura de noticias
const noticias = [
  {
    titulo: 'Nuevo juego: Wuthering Waves',
    descripcion: 'WuWa llega a la plataforma como uno de los RPG de mundo abierto más esperados.',
    fecha: '20 Feb 2026',
    categoria: 'Juegos',
  },
  {
    titulo: 'Mejor jugador: JuanProGamer',
    descripcion: 'JuanProGamer alcanza el top 1 en rankings de Valorant y LoL.',
    fecha: '18 Feb 2026',
    categoria: 'Jugadores',
  },
  {
    titulo: 'Evento de la comunidad',
    descripcion: 'Se realizó el torneo benéfico de Fortnite con récord de participantes.',
    fecha: '15 Feb 2026',
    categoria: 'Comunidad',
  },
];

export default function Noticias() {
  return (
    <div className="noticias-page">
      <h1>Noticias</h1>
      <div className="noticias-list">
        {noticias.map((n, idx) => (
          <div className="noticia-card" key={idx}>
            <h2>{n.titulo}</h2>
            <p>{n.descripcion}</p>
            <span className="noticia-fecha">{n.fecha}</span>
            <span className="noticia-categoria">{n.categoria}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
