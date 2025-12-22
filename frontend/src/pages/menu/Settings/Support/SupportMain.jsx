import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaChevronDown, FaChevronUp, FaSearch, FaQuestionCircle, 
    FaArrowLeft, FaTimes, FaPen, FaHeadset 
} from 'react-icons/fa';
import './SupportPage.css';

const SupportPage = () => {
    const navigate = useNavigate();
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Estado del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inquiry, setInquiry] = useState('');

    // --- 20 PREGUNTAS FRECUENTES ---
    const faqs = [
        { id: 1, question: "¿Cómo creo un equipo competitivo?", answer: "Ve al menú 'Equipos' > 'Crear Equipo'. Necesitarás definir un nombre, subir un logo y elegir el juego principal. Recibirás un link para invitar a tus jugadores." },
        { id: 2, question: "¿Cómo funcionan los premios?", answer: "Los premios se depositan automáticamente en la 'Wallet' del capitán una vez validado el resultado. El capitán es responsable de repartirlo." },
        { id: 3, question: "¿Puedo estar en varios equipos?", answer: "Sí, puedes pertenecer a múltiples equipos siempre que sean de juegos diferentes (ej: uno de LoL y otro de Valorant)." },
        { id: 4, question: "¿Qué es el Nivel de Verificación?", answer: "Es nuestro sistema anti-smurf. Vinculamos tu ID real del juego para asegurar que tu rango coincida con la categoría del torneo." },
        { id: 5, question: "¿Cómo me inscribo a un torneo?", answer: "Busca el torneo en la pestaña 'Torneos', asegúrate de que tu equipo cumpla los requisitos y haz clic en 'Inscribirse'. El capitán debe realizar esta acción." },
        { id: 6, question: "¿Qué hago si mi rival no se presenta?", answer: "Debes esperar 15 minutos en el lobby. Si no aparecen, toma una captura de pantalla y súbela en el chat del partido para reclamar victoria por W.O." },
        { id: 7, question: "¿Cómo reportar una conducta tóxica?", answer: "Usa el botón de 'Reportar' en el perfil del jugador o al finalizar la partida. Adjunta pruebas visuales para agilizar el proceso." },
        { id: 8, question: "¿Cuáles son los métodos de retiro?", answer: "Actualmente soportamos PayPal, transferencias bancarias locales y criptomonedas (USDT). El mínimo de retiro es de $10 USD." },
        { id: 9, question: "¿Puedo cambiar mi nombre de usuario?", answer: "Sí, puedes cambiarlo una vez cada 30 días desde la configuración de tu perfil." },
        { id: 10, question: "¿Qué pasa si se cae mi conexión?", answer: "Cada equipo tiene derecho a 10 minutos de pausa técnica. Si no logras reconectar, tu equipo deberá jugar con un suplente o en desventaja." },
        { id: 11, question: "¿Cómo subo los resultados?", answer: "Al terminar la partida, el sistema intentará detectarlo automáticamente. Si falla, ambos capitanes deben subir una captura del marcador final." },
        { id: 12, question: "¿Hay límite de edad?", answer: "Debes tener al menos 13 años para registrarte. Para torneos con premios en efectivo, se requiere ser mayor de 18 años o tener consentimiento parental." },
        { id: 13, question: "¿Cómo invito amigos a mi equipo?", answer: "Desde el panel de gestión de tu equipo, copia el 'Link de Invitación' y envíalo. El enlace expira en 24 horas por seguridad." },
        { id: 14, question: "¿Olvidé mi contraseña, cómo la recupero?", answer: "En la pantalla de Login, pulsa 'Olvidé mi contraseña'. Te enviaremos un correo para restablecerla." },
        { id: 15, question: "¿Puedo ser organizador de torneos?", answer: "Sí, puedes aplicar para ser Organizador Verificado desde el menú 'Crear Torneo'. Revisaremos tu solicitud en 48 horas." },
        { id: 16, question: "¿Qué es el Modo Streamer?", answer: "Es una función en Ajustes que oculta información sensible (emails, códigos de lobby) de tu pantalla para evitar stream sniping." },
        { id: 17, question: "¿Cómo elimino mi cuenta?", answer: "Debes solicitarlo en Ajustes > Seguridad > Eliminar Cuenta. Este proceso es irreversible y perderás tus estadísticas." },
        { id: 18, question: "¿Los torneos son para todas las regiones?", answer: "Depende del torneo. Cada evento especifica su servidor (ej: NA, LAN, LAS, EUW). Revisa las reglas antes de inscribirte." },
        { id: 19, question: "¿Cobran comisión por participar?", answer: "La inscripción suele ser gratuita o de pago según el torneo. Esportefy retiene una pequeña comisión (10%) solo sobre los premios generados para mantenimiento." },
        { id: 20, question: "¿Tienen aplicación móvil?", answer: "Actualmente estamos desarrollando la App para iOS y Android. Por ahora, nuestra web es 100% responsiva en navegadores móviles." },
    ];

    // Filtrar preguntas según búsqueda
    const filteredFaqs = faqs.filter(f => 
        f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleFaq = (id) => {
        setActiveQuestion(activeQuestion === id ? null : id);
    };

    const handleSubmitInquiry = (e) => {
        e.preventDefault();
        alert("¡Tu inquietud ha sido recibida! Te responderemos pronto.");
        setInquiry('');
        setIsModalOpen(false);
    };

    // Función segura para abrir el modal
    const handleOpenModal = (e) => {
        e.preventDefault(); // Detiene recargas
        e.stopPropagation(); // Detiene clicks fantasmas
        setIsModalOpen(true);
    };

    return (
        <div className="support-page fade-in">
            {/* --- BOTÓN VOLVER ATRÁS --- */}
            <button className="btn-back-support" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Volver
            </button>

            <header className="support-header">
                <h1>Centro de Soporte</h1>
                <p>Encuentra respuestas rápidas o escríbenos directamente.</p>
            </header>

            <div className="support-grid">
                
                {/* SECCIÓN IZQUIERDA: FAQ */}
                <section className="faq-section full-height">
                    <div className="section-title">
                        <FaQuestionCircle className="icon-title" />
                        <h2>Base de Conocimiento</h2>
                    </div>
                    
                    <div className="search-faq">
                        <FaSearch className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Buscar pregunta..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="faq-list scrollable-list">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => (
                                <div 
                                    key={faq.id} 
                                    className={`faq-item ${activeQuestion === faq.id ? 'active' : ''}`}
                                    onClick={() => toggleFaq(faq.id)}
                                >
                                    <div className="faq-question">
                                        <span>{faq.question}</span>
                                        {activeQuestion === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                    <div className="faq-answer">
                                        <p>{faq.answer}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-results">No encontramos coincidencias.</p>
                        )}
                    </div>
                </section>

                {/* SECCIÓN DERECHA: TARJETA DE CONTACTO */}
                <section className="inquiry-section">
                    <div className="inquiry-card sticky-card">
                        <div className="inquiry-icon-wrapper">
                            <FaHeadset />
                        </div>
                        <h2>¿No encuentras tu respuesta?</h2>
                        <p>Si tu duda no está en la lista, cuéntanos tu caso.</p>
                        
                        <button 
                            type="button" 
                            className="btn-open-modal"
                            onClick={handleOpenModal}
                        >
                            <FaPen /> Escribir Inquietud
                        </button>
                    </div>
                </section>
            </div>

            {/* --- MODAL DE INQUIETUDES (VERSIÓN SEGURA: SIN CIERRE AUTOMÁTICO) --- */}
            {isModalOpen && (
                // Quitamos el onClick del overlay para que NO se cierre solo
                <div className="modal-overlay fade-in">
                    <div className="modal-content">
                        
                        <button 
                            type="button" 
                            className="btn-close-modal" 
                            onClick={() => setIsModalOpen(false)}
                        >
                            <FaTimes />
                        </button>
                        
                        <div className="modal-header">
                            <h3>Escribe tu Inquietud</h3>
                            <p>Sé lo más detallado posible para ayudarte mejor.</p>
                        </div>

                        <form onSubmit={handleSubmitInquiry}>
                            <textarea 
                                rows="6" 
                                placeholder="Hola, tengo un problema con..."
                                value={inquiry}
                                onChange={(e) => setInquiry(e.target.value)}
                                required
                                // Quitamos autoFocus para evitar conflictos de renderizado
                            ></textarea>
                            
                            <button type="submit" className="btn-submit-inquiry">
                                Enviar Consulta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportPage;