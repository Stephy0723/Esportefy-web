import React from 'react';
import './Chats.css';

export default function Chats() {
  return (
    <div className="chats-page">
      <header className="chats-header">
        <h2>Chats</h2>
      </header>

      <section className="chats-list">
        <div className="chat-item">Usuario 1 - Hola</div>
        <div className="chat-item">Usuario 2 - ¿Cómo estás?</div>
        <div className="chat-item">Usuario 3 - En línea</div>
      </section>

      <footer className="chats-footer">Escribe un mensaje...</footer>
    </div>
  );
}
