import React from 'react';
import './Chats.css';
import PageHud from '../../../components/PageHud/PageHud';

export default function Chats() {
  return (
    <div className="chats-coming">
      <PageHud page="CHATS" />
      <div className="chats-coming__content">
        <div className="chats-coming__ghost">
          <i className='bx bx-ghost'></i>
        </div>
        <h2 className="chats-coming__title">Chat en Desarrollo</h2>
        <p className="chats-coming__text">
          Estamos construyendo el sistema de mensajería.
          <br />Podrás chatear con tu equipo y amigos muy pronto.
        </p>
        <span className="chats-coming__badge">
          <i className='bx bx-rocket'></i> Próxima Versión
        </span>
      </div>
    </div>
  );
}