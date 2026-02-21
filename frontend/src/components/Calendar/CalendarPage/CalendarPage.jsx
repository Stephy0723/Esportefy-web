import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';

/* ── Game images for event thumbnails ── */
import valorantImg from '../../../assets/games/valorant.jpg';
import lolImg from '../../../assets/games/lol.jpg';
import cs2Img from '../../../assets/games/cs2.jpg';
import fortniteImg from '../../../assets/games/fornite.jpg';
import apexImg from '../../../assets/games/Apex.jpg';

const GAME_BANNERS = {
  valorant: valorantImg,
  lol: lolImg,
  cs2: cs2Img,
  fortnite: fortniteImg,
  apex: apexImg,
};

/* ── Event category config ── */
const CATEGORIES = {
  TORNEO:  { name: 'Torneo',  color: '#8EDB15', icon: 'bx-trophy',         gradient: 'linear-gradient(135deg, #8EDB15, #5fa30d)' },
  VS:      { name: 'VS',      color: '#4facfe', icon: 'bx-target-lock',    gradient: 'linear-gradient(135deg, #4facfe, #0078d4)' },
  EVENTO:  { name: 'Evento',  color: '#f093fb', icon: 'bx-calendar-star',  gradient: 'linear-gradient(135deg, #f093fb, #c850c0)' },
  SCRIM:   { name: 'Scrim',   color: '#ffd700', icon: 'bx-shield-quarter', gradient: 'linear-gradient(135deg, #ffd700, #ff9800)' },
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/* ── Initial mock events with images ── */
const INITIAL_EVENTS = [
  {
    id: 1, date: '2026-02-17', title: 'Gran Final Valorant', category: 'TORNEO',
    desc: 'La final de temporada más esperada. Equipos de toda la región compiten por el título supremo en un evento presencial lleno de acción.',
    org: 'Esportefy', loc: 'Estadio Central', game: 'valorant',
    time: '19:00', price: '1500 DOP', type: 'Entrada General', isHighlight: true,
    teams: ['Team Alpha', 'Team Omega'], prize: '$50,000 DOP'
  },
  {
    id: 2, date: '2026-02-20', title: 'T1 vs G2 Esports', category: 'VS',
    desc: 'Showmatch amistoso entre dos de los equipos más reconocidos de la escena competitiva internacional.',
    org: 'Riot Games', loc: 'Online', game: 'lol',
    time: '21:00', price: 'Gratis', type: 'Stream',
    teams: ['T1', 'G2 Esports'], prize: 'Exhibición'
  },
  {
    id: 3, date: '2026-02-22', title: 'Community Night', category: 'EVENTO',
    desc: 'Noche de juegos con la comunidad. Únete a partidas casuales, sorteos y mucha diversión.',
    org: 'Esportefy', loc: 'Discord', game: 'fortnite',
    time: '20:00', price: 'Gratis', type: 'Online',
    teams: [], prize: 'Sorteos'
  },
  {
    id: 4, date: '2026-02-25', title: 'Ranked Scrims', category: 'SCRIM',
    desc: 'Scrims competitivos semanales para equipos que buscan mejorar su nivel antes de la temporada.',
    org: 'Team Alpha', loc: 'LAN', game: 'cs2',
    time: '18:00', price: 'N/A', type: 'Privado',
    teams: ['Team Alpha', 'Team Beta'], prize: 'N/A'
  },
  {
    id: 5, date: '2026-02-28', title: 'Apex Showdown', category: 'TORNEO',
    desc: 'Torneo abierto de Apex Legends con premios para los mejores equipos.',
    org: 'Esportefy', loc: 'Online', game: 'apex',
    time: '17:00', price: '500 DOP', type: 'Inscripción',
    teams: [], prize: '$20,000 DOP'
  },
];

const EsportefyCalendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [panelMode, setPanelMode] = useState('empty');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '', category: 'TORNEO', time: '12:00', desc: '', price: '', type: '', org: '', loc: '', game: 'valorant'
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  /* ── Build calendar grid ── */
  useEffect(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = [];
    for (let i = adjustedStart; i > 0; i--) {
      grid.push({ day: prevMonthDays - i + 1, isCurrent: false, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let dayEvents = events.filter(e => e.date === fullDate);
      if (activeFilter) dayEvents = dayEvents.filter(e => e.category === activeFilter);
      dayEvents = dayEvents.map(e => ({ ...e, color: CATEGORIES[e.category]?.color || '#8EDB15' }));
      grid.push({ day: d, isCurrent: true, events: dayEvents, fullDate });
    }

    while (grid.length < 42) {
      grid.push({ day: grid.length - daysInMonth - adjustedStart + 1, isCurrent: false, events: [] });
    }
    setCalendarGrid(grid);
  }, [currentDate, events, activeFilter]);

  const isToday = (cell) => {
    if (!cell.isCurrent) return false;
    return cell.fullDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleDayClick = (cell) => {
    if (!cell.isCurrent) return;
    if (cell.events.length > 0) {
      setSelectedEvent(cell.events[0]);
      setPanelMode('view');
    } else {
      setSelectedDateStr(cell.fullDate);
      setNewEvent({ title: '', category: 'TORNEO', time: '12:00', desc: '', price: '', type: '', org: '', loc: '', game: 'valorant' });
      setPanelMode('create');
    }
  };

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title) return;
    const saved = { id: Date.now(), date: selectedDateStr, ...newEvent, isHighlight: true, teams: [], prize: '' };
    setEvents([...events, saved]);
    setSelectedEvent(saved);
    setPanelMode('view');
  };

  const changeMonth = (val) => setCurrentDate(new Date(year, month + val, 1));
  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const categoryCounts = useMemo(() => {
    const counts = {};
    Object.keys(CATEGORIES).forEach(k => counts[k] = 0);
    events.forEach(ev => {
      const [ey, em] = ev.date.split('-').map(Number);
      if (ey === year && em === month + 1) counts[ev.category] = (counts[ev.category] || 0) + 1;
    });
    return counts;
  }, [events, year, month]);

  const totalMonthEvents = useMemo(() => {
    return events.filter(ev => {
      const [ey, em] = ev.date.split('-').map(Number);
      return ey === year && em === month + 1;
    }).length;
  }, [events, year, month]);

  const showTickets = selectedEvent && (selectedEvent.category === 'TORNEO' || selectedEvent.category === 'EVENTO');
  const evBanner = selectedEvent?.game ? GAME_BANNERS[selectedEvent.game] : null;

  return (
    <div className="ecal">
      {/* ═══ TOP BAR ═══ */}
      <div className="ecal__topbar">
        <div className="ecal__topbar-left">
          <button className="ecal__back-btn" onClick={() => navigate(-1)} title="Volver">
            <i className="bx bx-arrow-back"></i>
          </button>
          <div className="ecal__brand-wrap">
            <span className="ecal__brand">ESPORTE<span>FY</span></span>
            <span className="ecal__brand-tag">CALENDAR</span>
          </div>
        </div>
        <div className="ecal__topbar-center">
          <div className="ecal__stat-chips">
            <div className="ecal__stat-chip">
              <i className="bx bx-calendar-event"></i>
              <span className="ecal__stat-val">{totalMonthEvents}</span>
              <span className="ecal__stat-lbl">Eventos</span>
            </div>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              categoryCounts[key] > 0 && (
                <div key={key} className="ecal__stat-chip" style={{ '--sc-color': cat.color }}>
                  <i className={`bx ${cat.icon}`}></i>
                  <span className="ecal__stat-val">{categoryCounts[key]}</span>
                </div>
              )
            ))}
          </div>
        </div>
        <div className="ecal__topbar-right">
          <button className="ecal__today-btn" onClick={goToday}>
            <i className="bx bx-current-location"></i>
            <span>Hoy</span>
          </button>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="ecal__filters">
        <button
          className={`ecal__filter-pill ${!activeFilter ? 'ecal__filter-pill--active' : ''}`}
          onClick={() => setActiveFilter(null)}
        >
          <i className="bx bx-grid-alt"></i>
          <span>Todos</span>
        </button>
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <button
            key={key}
            className={`ecal__filter-pill ${activeFilter === key ? 'ecal__filter-pill--active' : ''}`}
            style={{ '--pill-color': cat.color }}
            onClick={() => setActiveFilter(activeFilter === key ? null : key)}
          >
            <i className={`bx ${cat.icon}`}></i>
            <span>{cat.name}</span>
            {categoryCounts[key] > 0 && (
              <span className="ecal__filter-count">{categoryCounts[key]}</span>
            )}
          </button>
        ))}
      </div>

      <div className="ecal__layout">
        {/* ═══ LEFT: CALENDAR ═══ */}
        <div className="ecal__main">
          {/* ── Month nav ── */}
          <div className="ecal__month-nav">
            <button className="ecal__nav-btn" onClick={() => changeMonth(-1)}>
              <i className="bx bx-chevron-left"></i>
            </button>
            <div className="ecal__month-center">
              <h2 className="ecal__month-title">
                {MONTH_NAMES[month]}
              </h2>
              <span className="ecal__month-year">{year}</span>
            </div>
            <button className="ecal__nav-btn" onClick={() => changeMonth(1)}>
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>

          {/* ── Weekday headers ── */}
          <div className="ecal__weekdays">
            {WEEKDAYS.map((d, i) => (
              <span key={d} className={i >= 5 ? 'ecal__wd-weekend' : ''}>{d}</span>
            ))}
          </div>

          {/* ── Calendar grid ── */}
          <div className="ecal__grid">
            {calendarGrid.map((cell, idx) => {
              const isTd = isToday(cell);
              const isSel = selectedDateStr === cell.fullDate || selectedEvent?.date === cell.fullDate;
              const isHovered = hoveredCell === idx;
              const hasEvents = cell.events.length > 0;
              const firstEvt = cell.events[0];
              const banner = firstEvt?.game ? GAME_BANNERS[firstEvt.game] : null;

              return (
                <div
                  key={idx}
                  className={`ecal__cell${!cell.isCurrent ? ' ecal__cell--faded' : ''}${isTd ? ' ecal__cell--today' : ''}${isSel ? ' ecal__cell--selected' : ''}${hasEvents ? ' ecal__cell--has-event' : ''}`}
                  onClick={() => handleDayClick(cell)}
                  onMouseEnter={() => setHoveredCell(idx)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {/* Background image for event cells */}
                  {banner && (
                    <div className="ecal__cell-bg" style={{ backgroundImage: `url(${banner})` }}>
                      <div className="ecal__cell-overlay" style={{ '--ov-color': firstEvt.color }} />
                    </div>
                  )}

                  <div className="ecal__cell-content">
                    <div className="ecal__cell-top">
                      <span className="ecal__cell-num">{cell.day}</span>
                      {hasEvents && (
                        <div className="ecal__cell-dots">
                          {cell.events.map((evt, i) => (
                            <span key={i} className="ecal__cell-dot" style={{ background: evt.color }} />
                          ))}
                        </div>
                      )}
                    </div>

                    {hasEvents && (
                      <div className="ecal__cell-events">
                        {cell.events.slice(0, 2).map((evt, i) => {
                          const cat = CATEGORIES[evt.category];
                          return (
                            <div key={i} className="ecal__cell-pill" style={{ '--pill-color': evt.color }}>
                              <i className={`bx ${cat?.icon || 'bx-calendar'}`}></i>
                              <span>{evt.title}</span>
                            </div>
                          );
                        })}
                        {cell.events.length > 2 && (
                          <span className="ecal__cell-more">+{cell.events.length - 2}</span>
                        )}
                      </div>
                    )}

                    {/* Hover tooltip */}
                    {isHovered && hasEvents && firstEvt && (
                      <div className="ecal__cell-tooltip">
                        <div className="ecal__tooltip-header" style={{ '--tt-color': firstEvt.color }}>
                          <i className={`bx ${CATEGORIES[firstEvt.category]?.icon}`}></i>
                          <span>{CATEGORIES[firstEvt.category]?.name}</span>
                        </div>
                        <span className="ecal__tooltip-title">{firstEvt.title}</span>
                        <div className="ecal__tooltip-meta">
                          <span><i className="bx bx-time-five"></i>{firstEvt.time}</span>
                          <span><i className="bx bx-map"></i>{firstEvt.loc}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT: DETAIL PANEL ═══ */}
        <div className={`ecal__panel ${panelMode !== 'empty' ? 'ecal__panel--open' : ''}`}>

          {/* ── Empty state ── */}
          {panelMode === 'empty' && (
            <div className="ecal__empty">
              <div className="ecal__empty-glow" />
              <div className="ecal__empty-icon">
                <i className="bx bx-calendar-event"></i>
              </div>
              <h3>Selecciona un día</h3>
              <p>Clic en un día vacío para crear un evento, o en un evento existente para ver detalles.</p>
              <div className="ecal__empty-hint">
                <i className="bx bx-mouse"></i>
                <span>Hover sobre eventos para previsualizar</span>
              </div>
            </div>
          )}

          {/* ── View event details ── */}
          {panelMode === 'view' && selectedEvent && (
            <div className="ecal__view" key={selectedEvent.id}>
              {/* Banner with game image */}
              {evBanner && (
                <div className="ecal__view-banner">
                  <img src={evBanner} alt="" />
                  <div className="ecal__view-banner-overlay" />
                  <button className="ecal__panel-close" onClick={() => { setPanelMode('empty'); setSelectedEvent(null); }}>
                    <i className="bx bx-x"></i>
                  </button>
                  <div className="ecal__view-banner-info">
                    <div className="ecal__view-badge" style={{ '--badge-color': CATEGORIES[selectedEvent.category]?.color }}>
                      <i className={`bx ${CATEGORIES[selectedEvent.category]?.icon}`}></i>
                      <span>{CATEGORIES[selectedEvent.category]?.name}</span>
                    </div>
                  </div>
                </div>
              )}

              {!evBanner && (
                <div className="ecal__view-header-simple">
                  <div className="ecal__view-badge" style={{ '--badge-color': CATEGORIES[selectedEvent.category]?.color }}>
                    <i className={`bx ${CATEGORIES[selectedEvent.category]?.icon}`}></i>
                    <span>{CATEGORIES[selectedEvent.category]?.name}</span>
                  </div>
                  <button className="ecal__panel-close ecal__panel-close--inline" onClick={() => { setPanelMode('empty'); setSelectedEvent(null); }}>
                    <i className="bx bx-x"></i>
                  </button>
                </div>
              )}

              <div className="ecal__view-body">
                <h2 className="ecal__view-title">{selectedEvent.title}</h2>
                <p className="ecal__view-desc">{selectedEvent.desc}</p>

                {/* Teams VS display */}
                {selectedEvent.teams && selectedEvent.teams.length === 2 && (
                  <div className="ecal__vs-display">
                    <div className="ecal__vs-team">
                      <div className="ecal__vs-avatar"><i className="bx bx-group"></i></div>
                      <span>{selectedEvent.teams[0]}</span>
                    </div>
                    <div className="ecal__vs-separator">
                      <span>VS</span>
                    </div>
                    <div className="ecal__vs-team">
                      <div className="ecal__vs-avatar"><i className="bx bx-group"></i></div>
                      <span>{selectedEvent.teams[1]}</span>
                    </div>
                  </div>
                )}

                {/* Info grid */}
                <div className="ecal__info-grid">
                  <div className="ecal__info-card">
                    <i className="bx bx-calendar"></i>
                    <div>
                      <strong>{selectedEvent.date}</strong>
                      <span>Fecha</span>
                    </div>
                  </div>
                  <div className="ecal__info-card">
                    <i className="bx bx-time"></i>
                    <div>
                      <strong>{selectedEvent.time}</strong>
                      <span>Hora</span>
                    </div>
                  </div>
                  {selectedEvent.loc && (
                    <div className="ecal__info-card">
                      <i className="bx bx-map"></i>
                      <div>
                        <strong>{selectedEvent.loc}</strong>
                        <span>Ubicación</span>
                      </div>
                    </div>
                  )}
                  {selectedEvent.prize && (
                    <div className="ecal__info-card ecal__info-card--prize">
                      <i className="bx bx-dollar-circle"></i>
                      <div>
                        <strong>{selectedEvent.prize}</strong>
                        <span>Premio</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Organizer */}
                {selectedEvent.org && (
                  <div className="ecal__view-org">
                    <div className="ecal__view-org-avatar">
                      <i className="bx bx-buildings"></i>
                    </div>
                    <div className="ecal__view-org-info">
                      <strong>{selectedEvent.org}</strong>
                      <span>Organizador</span>
                    </div>
                    <i className="bx bx-chevron-right ecal__view-org-arrow"></i>
                  </div>
                )}

                {/* Tickets box */}
                {showTickets && selectedEvent.price && (
                  <div className="ecal__ticket">
                    <div className="ecal__ticket-glow" />
                    <div className="ecal__ticket-row">
                      <div className="ecal__ticket-left">
                        <span className="ecal__ticket-label">Entrada</span>
                        <span className="ecal__ticket-amount">{selectedEvent.price}</span>
                        <span className="ecal__ticket-type">{selectedEvent.type}</span>
                      </div>
                      <button className="ecal__ticket-btn">
                        <i className="bx bx-purchase-tag-alt"></i>
                        <span>COMPRAR</span>
                      </button>
                    </div>
                  </div>
                )}

                {!showTickets && (
                  <div className="ecal__comp-info">
                    <div className="ecal__comp-icon">
                      <i className="bx bx-shield-quarter"></i>
                    </div>
                    <div>
                      <strong>Evento Competitivo</strong>
                      <span>No requiere venta de entradas</span>
                    </div>
                  </div>
                )}

                <button className="ecal__close-btn" onClick={() => { setPanelMode('empty'); setSelectedEvent(null); }}>
                  <i className="bx bx-x"></i>
                  CERRAR
                </button>
              </div>
            </div>
          )}

          {/* ── Create event form ── */}
          {panelMode === 'create' && (
            <div className="ecal__create-wrap">
              <div className="ecal__create-header">
                <h2 className="ecal__form-title">
                  <i className="bx bx-plus-circle"></i>
                  Nuevo Evento
                </h2>
                <button className="ecal__panel-close ecal__panel-close--inline" onClick={() => setPanelMode('empty')}>
                  <i className="bx bx-x"></i>
                </button>
              </div>
              <p className="ecal__form-date">
                <i className="bx bx-calendar"></i> {selectedDateStr}
              </p>

              <form className="ecal__form" onSubmit={handleSaveEvent}>
                <div className="ecal__field">
                  <label>Título</label>
                  <input required type="text" placeholder="Nombre del evento..."
                    value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
                </div>

                <div className="ecal__field-row">
                  <div className="ecal__field">
                    <label>Categoría</label>
                    <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})}>
                      {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <option key={key} value={key}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ecal__field">
                    <label>Hora</label>
                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                  </div>
                </div>

                <div className="ecal__field-row">
                  <div className="ecal__field">
                    <label>Juego</label>
                    <select value={newEvent.game} onChange={e => setNewEvent({...newEvent, game: e.target.value})}>
                      {Object.keys(GAME_BANNERS).map(g => (
                        <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="ecal__field">
                    <label>Ubicación</label>
                    <input type="text" placeholder="Online / LAN..."
                      value={newEvent.loc} onChange={e => setNewEvent({...newEvent, loc: e.target.value})} />
                  </div>
                </div>

                <div className="ecal__field">
                  <label>Organizador</label>
                  <input type="text" placeholder="Nombre..."
                    value={newEvent.org} onChange={e => setNewEvent({...newEvent, org: e.target.value})} />
                </div>

                {(newEvent.category === 'TORNEO' || newEvent.category === 'EVENTO') && (
                  <div className="ecal__field-row">
                    <div className="ecal__field">
                      <label>Precio</label>
                      <input type="text" placeholder="$0.00"
                        value={newEvent.price} onChange={e => setNewEvent({...newEvent, price: e.target.value})} />
                    </div>
                    <div className="ecal__field">
                      <label>Tipo</label>
                      <input type="text" placeholder="Entrada General..."
                        value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})} />
                    </div>
                  </div>
                )}

                <div className="ecal__field">
                  <label>Descripción</label>
                  <textarea placeholder="Detalles del evento..."
                    value={newEvent.desc} onChange={e => setNewEvent({...newEvent, desc: e.target.value})} />
                </div>

                <button type="submit" className="ecal__submit-btn">
                  <i className="bx bx-plus-circle"></i>
                  CREAR EVENTO
                </button>

                <button type="button" className="ecal__close-btn" onClick={() => setPanelMode('empty')}>
                  <i className="bx bx-x"></i>
                  CANCELAR
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM LEGEND ═══ */}
      <div className="ecal__bottom-legend">
        {Object.entries(CATEGORIES).map(([key, cat]) => (
          <div key={key} className="ecal__legend-chip" style={{ '--lg-color': cat.color }}>
            <span className="ecal__legend-dot" />
            <i className={`bx ${cat.icon}`}></i>
            <span>{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EsportefyCalendar;
