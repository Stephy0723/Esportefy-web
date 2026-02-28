import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CalendarPage.css';
import { loadTournamentCalendarEntries } from '../../../utils/tournamentCalendar';
import { GAME_IMAGES } from '../../../data/gameImages';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const EsportefyCalendar = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState([]);
  const [calendarGrid, setCalendarGrid] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [activeGame, setActiveGame] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      const loaded = await loadTournamentCalendarEntries();
      if (!cancelled) setEvents(loaded);
    };
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const grid = [];
    for (let i = adjustedStart; i > 0; i -= 1) {
      grid.push({ day: prevMonthDays - i + 1, isCurrent: false, events: [] });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      let dayEvents = events.filter((event) => event.dateKey === fullDate);
      if (activeGame) dayEvents = dayEvents.filter((event) => event.game === activeGame);
      grid.push({ day, isCurrent: true, events: dayEvents, fullDate });
    }

    while (grid.length < 42) {
      grid.push({ day: grid.length - daysInMonth - adjustedStart + 1, isCurrent: false, events: [] });
    }
    setCalendarGrid(grid);
  }, [activeGame, currentDate, events, month, year]);

  const isToday = (cell) => {
    if (!cell.isCurrent) return false;
    return cell.fullDate === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const handleDayClick = (cell) => {
    if (!cell.isCurrent) return;
    setSelectedDateStr(cell.fullDate);
    setSelectedEvent(cell.events[0] || null);
  };

  const changeMonth = (value) => setCurrentDate(new Date(year, month + value, 1));
  const goToday = () => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));

  const visibleMonthEvents = useMemo(
    () => events.filter((event) => {
      const [eventYear, eventMonth] = event.dateKey.split('-').map(Number);
      return eventYear === year && eventMonth === month + 1;
    }),
    [events, month, year]
  );

  const gameCounts = useMemo(() => {
    const counts = new Map();
    visibleMonthEvents.forEach((event) => {
      const current = counts.get(event.game) || { count: 0, color: event.color };
      current.count += 1;
      counts.set(event.game, current);
    });
    return Array.from(counts.entries()).map(([game, value]) => ({ game, ...value }));
  }, [visibleMonthEvents]);

  return (
    <div className="ecal">
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
              <span className="ecal__stat-val">{visibleMonthEvents.length}</span>
              <span className="ecal__stat-lbl">Torneos</span>
            </div>
            {gameCounts.slice(0, 5).map((item) => (
              <div key={item.game} className="ecal__stat-chip" style={{ '--sc-color': item.color }}>
                <i className="bx bx-trophy"></i>
                <span className="ecal__stat-val">{item.count}</span>
                <span>{item.game}</span>
              </div>
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

      <div className="ecal__filters">
        <button
          className={`ecal__filter-pill ${!activeGame ? 'ecal__filter-pill--active' : ''}`}
          onClick={() => setActiveGame(null)}
        >
          <i className="bx bx-grid-alt"></i>
          <span>Todos</span>
        </button>
        {gameCounts.map((item) => (
          <button
            key={item.game}
            className={`ecal__filter-pill ${activeGame === item.game ? 'ecal__filter-pill--active' : ''}`}
            style={{ '--pill-color': item.color }}
            onClick={() => setActiveGame(activeGame === item.game ? null : item.game)}
          >
            <i className="bx bx-trophy"></i>
            <span>{item.game}</span>
            <span className="ecal__filter-count">{item.count}</span>
          </button>
        ))}
      </div>

      <div className="ecal__layout">
        <div className="ecal__main">
          <div className="ecal__month-nav">
            <button className="ecal__nav-btn" onClick={() => changeMonth(-1)}>
              <i className="bx bx-chevron-left"></i>
            </button>
            <div className="ecal__month-center">
              <h2 className="ecal__month-title">{MONTH_NAMES[month]}</h2>
              <span className="ecal__month-year">{year}</span>
            </div>
            <button className="ecal__nav-btn" onClick={() => changeMonth(1)}>
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>

          <div className="ecal__weekdays">
            {WEEKDAYS.map((day, index) => (
              <span key={day} className={index >= 5 ? 'ecal__wd-weekend' : ''}>{day}</span>
            ))}
          </div>

          <div className="ecal__grid">
            {calendarGrid.map((cell, idx) => {
              const isTd = isToday(cell);
              const isSel = selectedDateStr === cell.fullDate || selectedEvent?.dateKey === cell.fullDate;
              const isHovered = hoveredCell === idx;
              const hasEvents = cell.events.length > 0;
              const firstEvent = cell.events[0];
              const banner = firstEvent?.bannerImage || null;

              return (
                <div
                  key={`${cell.fullDate || 'pad'}-${idx}`}
                  className={`ecal__cell${!cell.isCurrent ? ' ecal__cell--faded' : ''}${isTd ? ' ecal__cell--today' : ''}${isSel ? ' ecal__cell--selected' : ''}${hasEvents ? ' ecal__cell--has-event' : ''}`}
                  onClick={() => handleDayClick(cell)}
                  onMouseEnter={() => setHoveredCell(idx)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {banner && (
                    <div className="ecal__cell-bg" style={{ backgroundImage: `url(${banner})` }}>
                      <div className="ecal__cell-overlay" style={{ '--ov-color': firstEvent.color }} />
                    </div>
                  )}

                  <div className="ecal__cell-content">
                    <div className="ecal__cell-top">
                      <span className="ecal__cell-num">{cell.day}</span>
                      {hasEvents && (
                        <div className="ecal__cell-dots">
                          {cell.events.map((event, index) => (
                            <span key={`${event.tournamentId}-${index}`} className="ecal__cell-dot" style={{ background: event.color }} />
                          ))}
                        </div>
                      )}
                    </div>

                    {hasEvents && (
                      <div className="ecal__cell-events">
                        {cell.events.slice(0, 2).map((event, index) => (
                          <div key={`${event.tournamentId}-${index}`} className="ecal__cell-pill" style={{ '--pill-color': event.color }}>
                            <i className={`bx ${event.icon}`}></i>
                            <div className="ecal__cell-pill-text">
                              <span className="ecal__cell-pill-code">{event.codeLabel}</span>
                              <span className="ecal__cell-pill-title">{event.title}</span>
                            </div>
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <span className="ecal__cell-more">+{cell.events.length - 2}</span>
                        )}
                      </div>
                    )}

                    {isHovered && hasEvents && firstEvent && (
                      <div className="ecal__cell-tooltip">
                        <div className="ecal__tooltip-header" style={{ '--tt-color': firstEvent.color }}>
                          <i className={`bx ${firstEvent.icon}`}></i>
                          <span>{firstEvent.game}</span>
                        </div>
                        <span className="ecal__tooltip-code">{firstEvent.codeLabel}</span>
                        <span className="ecal__tooltip-title">{firstEvent.title}</span>
                        <div className="ecal__tooltip-meta">
                          <span><i className="bx bx-time-five"></i>{firstEvent.time || 'Por definir'}</span>
                          <span><i className="bx bx-buildings"></i>{firstEvent.org}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ecal__panel ecal__panel--open">
          {selectedEvent ? (
            <div className="ecal__view" key={selectedEvent.id}>
              {selectedEvent.bannerImage ? (
                <div className="ecal__view-banner">
                  <img
                    src={selectedEvent.bannerImage}
                    alt={selectedEvent.game || selectedEvent.title}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = GAME_IMAGES[selectedEvent.game] || GAME_IMAGES.Default;
                    }}
                  />
                  <div className="ecal__view-banner-overlay" />
                  <button className="ecal__panel-close" onClick={() => { setSelectedEvent(null); setSelectedDateStr(''); }}>
                    <i className="bx bx-x"></i>
                  </button>
                  <div className="ecal__view-banner-info">
                    <div className="ecal__view-badge" style={{ '--badge-color': selectedEvent.color }}>
                      <i className={`bx ${selectedEvent.icon}`}></i>
                      <span>{selectedEvent.game}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ecal__view-header-simple">
                  <div className="ecal__view-badge" style={{ '--badge-color': selectedEvent.color }}>
                    <i className={`bx ${selectedEvent.icon}`}></i>
                    <span>{selectedEvent.game}</span>
                  </div>
                  <button className="ecal__panel-close ecal__panel-close--inline" onClick={() => { setSelectedEvent(null); setSelectedDateStr(''); }}>
                    <i className="bx bx-x"></i>
                  </button>
                </div>
              )}

              <div className="ecal__view-body">
                <span className="ecal__view-code" style={{ '--code-color': selectedEvent.color }}>{selectedEvent.codeLabel}</span>
                <h2 className="ecal__view-title">{selectedEvent.title}</h2>
                <p className="ecal__view-desc">{selectedEvent.desc}</p>

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
                      <strong>{selectedEvent.time || 'Por definir'}</strong>
                      <span>Hora</span>
                    </div>
                  </div>
                  <div className="ecal__info-card">
                    <i className={`bx ${selectedEvent.icon}`}></i>
                    <div>
                      <strong>{selectedEvent.game}</strong>
                      <span>Juego</span>
                    </div>
                  </div>
                  <div className="ecal__info-card">
                    <i className="bx bx-shield-quarter"></i>
                    <div>
                      <strong>{selectedEvent.format || 'Por definir'}</strong>
                      <span>Formato</span>
                    </div>
                  </div>
                </div>

                <div className="ecal__view-org">
                  <div className="ecal__view-org-avatar">
                    <i className="bx bx-buildings"></i>
                  </div>
                  <div className="ecal__view-org-info">
                    <strong>{selectedEvent.org}</strong>
                    <span>Organizador</span>
                  </div>
                  <span className="ecal__view-org-side">{selectedEvent.loc}</span>
                </div>

                <button
                  type="button"
                  className="ecal__open-btn"
                  onClick={() => {
                    if (!selectedEvent?.tournamentId) return;
                    navigate(`/torneos/publicos/${selectedEvent.tournamentId}`);
                  }}
                >
                  <i className="bx bx-search-alt"></i>
                  Ver torneo
                </button>

                <button type="button" className="ecal__close-btn" onClick={() => { setSelectedEvent(null); setSelectedDateStr(''); }}>
                  <i className="bx bx-x"></i>
                  CERRAR
                </button>
              </div>
            </div>
          ) : (
            <div className="ecal__empty">
              <div className="ecal__empty-glow" />
              <div className="ecal__empty-icon">
                <i className="bx bx-calendar-event"></i>
              </div>
              <h3>Selecciona un día con torneos</h3>
              <p>El calendario muestra los torneos reales con su color por juego y su TOR-ID para que los usuarios puedan buscarlos.</p>
              {selectedDateStr && (
                <div className="ecal__empty-hint">
                  <i className="bx bx-calendar-x"></i>
                  <span>Sin torneos programados para {selectedDateStr}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="ecal__bottom-legend">
        {gameCounts.map((item) => (
          <div key={item.game} className="ecal__legend-chip" style={{ '--lg-color': item.color }}>
            <span className="ecal__legend-dot" />
            <i className="bx bx-trophy"></i>
            <span>{item.game}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EsportefyCalendar;
