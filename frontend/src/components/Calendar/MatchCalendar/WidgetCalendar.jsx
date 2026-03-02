import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./WidgetCalendar.css";
import { loadTournamentCalendarEntries } from "../../../utils/tournamentCalendar";

const EVENT_TYPES = {
  tournament: { label: 'Torneo', icon: 'bx-trophy' }
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function WidgetCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDay, setSelectedDay] = useState(null);
  const [events, setEvents] = useState([]);

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawStart = new Date(year, month, 1).getDay();
  const startDay = rawStart === 0 ? 6 : rawStart - 1;

  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach((event) => {
      if (!event?.dateKey) return;
      grouped[event.dateKey] = grouped[event.dateKey] || [];
      grouped[event.dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };
  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today.getDate());
  };

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const getDateKey = (day) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const monthEventCount = useMemo(
    () => events.filter((event) => {
      if (!event?.dateKey) return false;
      const [eventYear, eventMonth] = event.dateKey.split('-').map(Number);
      return eventYear === year && eventMonth === month + 1;
    }).length,
    [events, year, month]
  );

  const monthGames = useMemo(() => {
    const unique = new Map();
    events.forEach((event) => {
      if (!event?.dateKey) return;
      const [eventYear, eventMonth] = event.dateKey.split('-').map(Number);
      if (eventYear === year && eventMonth === month + 1 && !unique.has(event.game)) {
        unique.set(event.game, { game: event.game, color: event.color });
      }
    });
    return Array.from(unique.values()).slice(0, 6);
  }, [events, year, month]);

  const upcomingEvents = useMemo(
    () => events.filter((event) => {
      if (!event?.dateKey) return false;
      const [eventYear, eventMonth] = event.dateKey.split('-').map(Number);
      return eventYear === year && eventMonth === month + 1;
    }),
    [events, year, month]
  );

  const selectedEvents = selectedDay
    ? (eventsByDate[getDateKey(selectedDay)] || [])
    : [];

  return (
    <div className="wc">
      <div className="wc__header">
        <div className="wc__header-top">
          <div className="wc__brand">
            <i className="bx bx-calendar-event wc__brand-icon"></i>
            <span className="wc__brand-text">CALENDARIO</span>
          </div>
          <button className="wc__today-btn" onClick={goToday} title="Ir a hoy">
            <i className="bx bx-current-location"></i>
          </button>
        </div>

        <div className="wc__month-bar">
          <button className="wc__nav" onClick={prevMonth} title="Mes anterior">
            <i className="bx bx-chevron-left"></i>
          </button>
          <div className="wc__month-wrap">
            <span className="wc__month">{MONTH_NAMES[month]}</span>
            <span className="wc__year">{year}</span>
          </div>
          <button className="wc__nav" onClick={nextMonth} title="Mes siguiente">
            <i className="bx bx-chevron-right"></i>
          </button>
        </div>

        <div className="wc__stats">
          <div className="wc__stat">
            <span className="wc__stat-num">{monthEventCount}</span>
            <span className="wc__stat-label">Torneos</span>
          </div>
          <div className="wc__stat-divider" />
          {monthGames.map((item) => (
            <div key={item.game} className="wc__stat-dot" title={item.game}>
              <span style={{ background: item.color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="wc__weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={`${d}-${i}`} className={i >= 5 ? 'wc__wd-weekend' : ''}>{d}</span>
        ))}
      </div>

      <div className="wc__grid">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`pad-${i}`} className="wc__day wc__day--pad" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = getDateKey(day);
          const dayEvents = eventsByDate[dateKey] || [];
          const isTd = isToday(day);
          const isSel = selectedDay === day;

          return (
            <button
              key={day}
              className={`wc__day${isTd ? ' wc__day--today' : ''}${isSel ? ' wc__day--selected' : ''}${dayEvents.length ? ' wc__day--has-event' : ''}`}
              onClick={() => setSelectedDay(isSel ? null : day)}
            >
              <span className="wc__day-num">{day}</span>
              {dayEvents.length > 0 && (
                <div className="wc__dots">
                  {dayEvents.map((event, idx) => (
                    <span
                      key={`${event.tournamentId}-${idx}`}
                      className="wc__dot"
                      style={{ '--dot-color': event.color }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selectedDay && selectedEvents.length > 0 && (
        <div className="wc__detail">
          <div className="wc__detail-heading">
            <div className="wc__detail-left">
              <span className="wc__detail-day">{selectedDay}</span>
              <div className="wc__detail-meta">
                <span className="wc__detail-month">{MONTH_NAMES[month].slice(0, 3)}</span>
                <span className="wc__detail-count">{selectedEvents.length} torneo{selectedEvents.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button className="wc__detail-close" onClick={() => setSelectedDay(null)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
          {selectedEvents.map((event, idx) => {
            const cfg = EVENT_TYPES.tournament;
            return (
              <div key={`${event.tournamentId}-${idx}`} className="wc__event" style={{ '--ev-color': event.color }}>
                <div className="wc__event-accent" />
                <div className="wc__event-icon-wrap" style={{ '--ev-color': event.color }}>
                  <i className={`bx ${event.icon || cfg.icon}`}></i>
                </div>
                <div className="wc__event-info">
                  <span className="wc__event-code">{event.codeLabel}</span>
                  <span className="wc__event-title">{event.title}</span>
                  <div className="wc__event-sub">
                    <span className="wc__event-badge" style={{ '--ev-color': event.color }}>{event.game}</span>
                    {event.time && <span className="wc__event-time"><i className="bx bx-time-five"></i>{event.time}</span>}
                  </div>
                </div>
                <i className="bx bx-chevron-right wc__event-arrow"></i>
              </div>
            );
          })}
        </div>
      )}

      {selectedDay && selectedEvents.length === 0 && (
        <div className="wc__detail wc__detail--empty">
          <div className="wc__detail-heading">
            <div className="wc__detail-left">
              <span className="wc__detail-day">{selectedDay}</span>
              <div className="wc__detail-meta">
                <span className="wc__detail-month">{MONTH_NAMES[month].slice(0, 3)}</span>
              </div>
            </div>
            <button className="wc__detail-close" onClick={() => setSelectedDay(null)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="wc__empty-day">
            <i className="bx bx-calendar-check"></i>
            <span>Sin torneos</span>
          </div>
        </div>
      )}

      {!selectedDay && upcomingEvents.length > 0 && (
        <div className="wc__upcoming">
          <div className="wc__upcoming-header">
            <span className="wc__upcoming-label">
              <i className="bx bx-pulse"></i>
              Próximos torneos
            </span>
            <span className="wc__upcoming-count">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.slice(0, 3).map((event, idx) => (
            <div key={`${event.tournamentId}-${idx}`} className="wc__upcoming-item" style={{ '--ev-color': event.color }}>
              <div className="wc__upcoming-date">
                <span className="wc__upcoming-day">{Number(event.dateKey.split('-')[2])}</span>
                <span className="wc__upcoming-monthAbbr">{MONTH_NAMES[month].slice(0, 3)}</span>
              </div>
              <div className="wc__upcoming-line" style={{ '--ev-color': event.color }} />
              <i className={`bx ${event.icon || EVENT_TYPES.tournament.icon} wc__upcoming-icon`} style={{ color: event.color }}></i>
              <div className="wc__upcoming-info">
                <span className="wc__upcoming-code">{event.codeLabel}</span>
                <span className="wc__upcoming-title">{event.title}</span>
                {event.time && <span className="wc__upcoming-time">{event.time}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Link to="/CalendarPage" className="wc__link">
        <div className="wc__link-content">
          <i className="bx bx-calendar wc__link-icon"></i>
          <span>Ver calendario completo</span>
        </div>
        <i className="bx bx-right-arrow-alt wc__link-arrow"></i>
      </Link>
    </div>
  );
}
