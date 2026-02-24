import React, { useState, useEffect } from 'react';
// 1. CORRECCIÓN: AQUI AGREGUÉ 'Search' y 'PlusCircle' QUE FALTABAN EN TU CÓDIGO
import { 
  Trophy, Swords, Calendar, MapPin, Clock, Ticket, 
  X, ChevronLeft, ChevronRight, User, Globe, Shield, 
  PlusCircle, Search 
} from 'lucide-react';

// 2. CORRECCIÓN: Asegúrate de que tu archivo CSS se llame así
import './CalendarPage.css';

const EsportefyCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 1)); // Abril 2026

  // --- CONFIGURACIÓN DE CATEGORÍAS ---
  const categories = {
    TORNEO: { name: 'Torneos', color: '#00c853', icon: <Trophy size={14} /> }, 
    VS: { name: 'Versus (VS)', color: '#ff3d00', icon: <Swords size={14} /> }, 
    EVENTO: { name: 'Eventos', color: '#2962ff', icon: <Globe size={14} /> },  
    SCRIM: { name: 'Scrims', color: '#aa00ff', icon: <Shield size={14} /> } 
  };

  // Base de datos simulada para auto-completar
  const mockDB = [
    { id: "T-100", title: "Copa Mundial LoL", category: "TORNEO", time: "18:00", desc: "Gran final internacional.", price: "Gratis", type: "Stream" },
    { id: "VS-200", title: "T1 vs G2 Esports", category: "VS", time: "21:00", desc: "Showmatch amistoso.", price: "N/A", type: "Showmatch" }
  ];

  // Eventos iniciales
  const [events, setEvents] = useState([
    { 
      id: 1, date: '2026-04-17', title: "Gran Final", category: "TORNEO", isHighlight: true, 
      desc: "Final de temporada presencial.", org: "Esportefy", loc: "Estadio Central", time: "19:00", price: "1500 DOP", type: "Entrada General", link: ""
    }
  ]);

  const [calendarGrid, setCalendarGrid] = useState([]);
  
  // ESTADOS DEL PANEL
  const [panelMode, setPanelMode] = useState('empty'); // 'empty', 'view', 'create'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState("");

  // ESTADOS DEL FORMULARIO
  const [searchId, setSearchId] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', category: 'TORNEO', time: '12:00', desc: '', link: '', price: '', type: '' });

  // Lógica de Boletas (Solo Torneos/Eventos)
  const showTickets = selectedEvent && (selectedEvent.category === 'TORNEO' || selectedEvent.category === 'EVENTO');

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let grid = [];
    for (let i = adjustedStart; i > 0; i--) grid.push({ day: prevMonthDays - i + 1, isCurrent: false, events: [] });
    
    for (let i = 1; i <= daysInMonth; i++) {
      const fullDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
      const dayEvents = events.filter(e => e.date === fullDate).map(e => ({
        ...e, color: categories[e.category]?.color || '#999'
      }));
      grid.push({ day: i, isCurrent: true, events: dayEvents, fullDate });
    }
    while (grid.length < 42) grid.push({ day: grid.length - daysInMonth - adjustedStart + 1, isCurrent: false, events: [] });
    setCalendarGrid(grid);
  }, [currentDate, events]);

  // MANEJO DE CLIC EN DÍA
  const handleDayClick = (dayCell) => {
    if (!dayCell.isCurrent) return;

    if (dayCell.events.length > 0) {
      setSelectedEvent(dayCell.events[0]);
      setPanelMode('view');
    } else {
      setSelectedDateStr(dayCell.fullDate);
      // Resetear form al abrir
      setNewEvent({ title: '', category: 'TORNEO', time: '12:00', desc: '', link: '', price: '', type: '' }); 
      setSearchId('');
      setPanelMode('create');
    }
  };

  const handleIdSearch = (e) => {
    e.preventDefault();
    const found = mockDB.find(item => item.id === searchId);
    if (found) {
      setNewEvent({ ...newEvent, ...found });
    } else {
      alert("ID no encontrado (Prueba: T-100, VS-200)");
    }
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title) return alert("Escribe un título");
    
    const eventToSave = { 
      id: Date.now(), 
      date: selectedDateStr, 
      ...newEvent, 
      org: "Admin", 
      loc: "Online/LAN", 
      isHighlight: true 
    };
    
    setEvents([...events, eventToSave]);
    setPanelMode('view');
    setSelectedEvent(eventToSave);
  };

  const changeMonth = (val) => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + val)));
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  return (
    <div className="esportefy-wrapper">
      <div className="dashboard-card">
        
        {/* IZQUIERDA: CALENDARIO */}
        <div className="calendar-panel">
          <div className="cal-header">
            <div className="brand">ESPORTE<span className="green-text">FY</span></div>
            <div className="nav-controls">
              <button onClick={() => changeMonth(-1)}><ChevronLeft size={24} /></button>
              <h2 className="month-title">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
              <button onClick={() => changeMonth(1)}><ChevronRight size={24} /></button>
            </div>
          </div>
          
          <div className="weekdays"><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span><span>Dom</span></div>
          
          <div className="cal-grid">
            {calendarGrid.map((cell, idx) => (
              <div 
                key={idx} 
                className={`day-cell ${!cell.isCurrent ? 'faded' : ''} ${selectedDateStr === cell.fullDate ? 'selected-day' : ''}`} 
                onClick={() => handleDayClick(cell)}
              >
                <span className="day-num">{cell.day}</span>
                <div className="events-list">
                  {cell.events.map((evt, i) => (
                    <div key={i} className="event-pill" style={{ borderLeftColor: evt.color }}>
                      <span style={{color: evt.color, display: 'flex'}}>{categories[evt.category]?.icon}</span>
                      {evt.title}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DERECHA: PANEL DINÁMICO */}
        <div className="details-panel">
          <button className="close-btn" onClick={() => setPanelMode('empty')}>
            <X size={24} />
          </button>

          {/* MODO 1: ESTADO VACÍO */}
          {panelMode === 'empty' && (
            <div className="empty-state-msg">
              <Calendar size={48} color="#ddd" />
              <h3>Selecciona un día</h3>
              <p>Haz clic en un día vacío para crear evento, o en un evento para ver detalles.</p>
            </div>
          )}

          {/* MODO 2: VER DETALLES */}
          {panelMode === 'view' && selectedEvent && (
            <>
              <div className="category-badge" style={{background: categories[selectedEvent.category]?.color}}>
                {categories[selectedEvent.category]?.icon}
                <span>{categories[selectedEvent.category]?.name}</span>
              </div>
              
              <h2 className="evt-title">{selectedEvent.title}</h2>
              <p className="evt-desc">{selectedEvent.desc}</p>
              
              <div className="organizer-row">
                 <div className="avatar-icon"><User size={20} /></div>
                 <div><strong>{selectedEvent.org}</strong><span>Organizador</span></div>
              </div>

              <div className="info-grid">
                <div className="info-item"><Calendar size={20} className="icon-style" /><div><strong>{selectedEvent.date}</strong><span>Fecha</span></div></div>
                <div className="info-item"><Clock size={20} className="icon-style" /><div><strong>{selectedEvent.time}</strong><span>Hora</span></div></div>
                <div className="info-item"><MapPin size={20} className="icon-style" /><div><strong>{selectedEvent.loc}</strong><span>Ubicación</span></div></div>
              </div>

              {/* LÓGICA DE BOLETAS (SOLO TORNEOS/EVENTOS) */}
              {showTickets ? (
                <div className="ticket-box">
                  <div className="ticket-icon-bg"><Ticket size={40} opacity={0.2} /></div>
                  <div className="price-tag"><h3>{selectedEvent.price}</h3><span>{selectedEvent.type}</span></div>
                  <button className="btn-action"><Ticket size={18} style={{marginRight:8}} />COMPRAR ENTRADA</button>
                </div>
              ) : (
                <div className="vs-info-box">
                  <Swords size={20} style={{marginBottom: 5}}/>
                  <div>Evento Competitivo (VS/Scrim).<br/>No requiere venta de entradas.</div>
                </div>
              )}

              {/* BOTÓN SALIR */}
              <button className="btn-close-panel" onClick={() => setPanelMode('empty')}>
                CERRAR PANEL
              </button>
            </>
          )}

          {/* MODO 3: CREAR EVENTO (FORMULARIO) */}
          {panelMode === 'create' && (
            <form onSubmit={handleSaveEvent} className="create-form">
              <h2 className="evt-title">Nuevo Evento</h2>
              <p className="evt-desc">Para el día: <strong>{selectedDateStr}</strong></p>

              {/* Buscador ID */}
              <div className="id-search-box">
                <label>Auto-completar por ID</label>
                <div className="search-row">
                  <input type="text" placeholder="Ej: T-100, VS-200" value={searchId} onChange={e => setSearchId(e.target.value)} />
                  <button type="button" onClick={handleIdSearch}><Search size={18} /></button>
                </div>
              </div>

              <div className="form-group">
                <label>Título</label>
                <input required type="text" className="form-input" placeholder="Nombre..." value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select className="form-select" value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                  {Object.keys(categories).map(key => <option key={key} value={key}>{categories[key].name}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group half"><label>Hora</label><input type="time" className="form-input" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} /></div>
                
                {/* PRECIO SOLO SI ES TORNEO/EVENTO */}
                {(newEvent.category === 'TORNEO' || newEvent.category === 'EVENTO') && (
                  <div className="form-group half"><label>Precio</label><input type="text" className="form-input" placeholder="$0.00" value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} /></div>
                )}
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea className="form-textarea" placeholder="Detalles..." value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})} />
              </div>

              <button type="submit" className="btn-action"><PlusCircle size={18} style={{marginRight:8}} /> CREAR</button>
              
              <button type="button" className="btn-close-panel" onClick={() => setPanelMode('empty')}>
                CANCELAR
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default EsportefyCalendar;