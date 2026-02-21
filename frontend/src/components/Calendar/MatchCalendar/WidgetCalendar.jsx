import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./WidgetCalendar.css";

/* ── Event type config ── */
const EVENT_TYPES = {
  tournament: { label: 'Torneo', color: '#8EDB15', icon: 'bx-trophy' },
  vs:         { label: 'VS',     color: '#4facfe', icon: 'bx-target-lock' },
  event:      { label: 'Evento', color: '#f093fb', icon: 'bx-calendar-star' },
  scrim:      { label: 'Scrim',  color: '#ffd700', icon: 'bx-shield-quarter' },
};

/* ── Mock events (will be replaced with API data) ── */
const MOCK_EVENTS = {
  "2026-02-05": [{ type: "tournament", title: "Copa Esportefy", time: "18:00" }],
  "2026-02-08": [
    { type: "vs", title: "Alpha vs Omega", time: "20:00" },
    { type: "event", title: "Scrim Night", time: "22:00" }
  ],
  "2026-02-14": [{ type: "scrim", title: "Ranked Scrims", time: "19:00" }],
  "2026-02-20": [{ type: "tournament", title: "Liga Pro S2", time: "21:00" }],
  "2026-02-25": [{ type: "event", title: "Community Night", time: "20:00" }],
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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rawStart = new Date(year, month, 1).getDay();
  const startDay = rawStart === 0 ? 6 : rawStart - 1;

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

  /* ── Count events this month ── */
  const monthEventCount = useMemo(() => {
    let count = 0;
    for (const [date, evts] of Object.entries(MOCK_EVENTS)) {
      const [ey, em] = date.split('-').map(Number);
      if (ey === year && em === month + 1) count += evts.length;
    }
    return count;
  }, [year, month]);

  /* ── Upcoming events for the panel ── */
  const upcomingEvents = useMemo(() => {
    const all = [];
    for (const [date, evts] of Object.entries(MOCK_EVENTS)) {
      const [ey, em] = date.split('-').map(Number);
      if (ey === year && em === month + 1) {
        evts.forEach(ev => all.push({ ...ev, date, day: Number(date.split('-')[2]) }));
      }
    }
    return all.sort((a, b) => a.day - b.day);
  }, [year, month]);

  /* ── Selected day's events ── */
  const selectedEvents = selectedDay
    ? (MOCK_EVENTS[getDateKey(selectedDay)] || [])
    : [];

  return (
    <div className="wc">
      {/* ── HEADER ── */}
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

        {/* ── Mini stat bar ── */}
        <div className="wc__stats">
          <div className="wc__stat">
            <span className="wc__stat-num">{monthEventCount}</span>
            <span className="wc__stat-label">Eventos</span>
          </div>
          <div className="wc__stat-divider" />
          {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
            <div key={key} className="wc__stat-dot" title={cfg.label}>
              <span style={{ background: cfg.color }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── WEEKDAY LABELS ── */}
      <div className="wc__weekdays">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={i >= 5 ? 'wc__wd-weekend' : ''}>{d}</span>
        ))}
      </div>

      {/* ── DAYS GRID ── */}
      <div className="wc__grid">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`pad-${i}`} className="wc__day wc__day--pad" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = getDateKey(day);
          const events = MOCK_EVENTS[dateKey] || [];
          const isTd = isToday(day);
          const isSel = selectedDay === day;

          return (
            <button
              key={day}
              className={`wc__day${isTd ? ' wc__day--today' : ''}${isSel ? ' wc__day--selected' : ''}${events.length ? ' wc__day--has-event' : ''}`}
              onClick={() => setSelectedDay(isSel ? null : day)}
            >
              <span className="wc__day-num">{day}</span>
              {events.length > 0 && (
                <div className="wc__dots">
                  {events.map((ev, idx) => (
                    <span
                      key={idx}
                      className="wc__dot"
                      style={{ '--dot-color': EVENT_TYPES[ev.type]?.color || '#8EDB15' }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SELECTED DAY DETAIL ── */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="wc__detail">
          <div className="wc__detail-heading">
            <div className="wc__detail-left">
              <span className="wc__detail-day">{selectedDay}</span>
              <div className="wc__detail-meta">
                <span className="wc__detail-month">{MONTH_NAMES[month].slice(0, 3)}</span>
                <span className="wc__detail-count">{selectedEvents.length} evento{selectedEvents.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            <button className="wc__detail-close" onClick={() => setSelectedDay(null)}>
              <i className="bx bx-x"></i>
            </button>
          </div>
          {selectedEvents.map((ev, idx) => {
            const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
            return (
              <div key={idx} className="wc__event" style={{ '--ev-color': cfg.color }}>
                <div className="wc__event-accent" />
                <div className="wc__event-icon-wrap" style={{ '--ev-color': cfg.color }}>
                  <i className={`bx ${cfg.icon}`}></i>
                </div>
                <div className="wc__event-info">
                  <span className="wc__event-title">{ev.title}</span>
                  <div className="wc__event-sub">
                    <span className="wc__event-badge" style={{ '--ev-color': cfg.color }}>{cfg.label}</span>
                    {ev.time && <span className="wc__event-time"><i className="bx bx-time-five"></i>{ev.time}</span>}
                  </div>
                </div>
                <i className="bx bx-chevron-right wc__event-arrow"></i>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SELECTED DAY (no events) ── */}
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
            <span>Sin eventos</span>
          </div>
        </div>
      )}

      {/* ── UPCOMING EVENTS (when no day selected) ── */}
      {!selectedDay && upcomingEvents.length > 0 && (
        <div className="wc__upcoming">
          <div className="wc__upcoming-header">
            <span className="wc__upcoming-label">
              <i className="bx bx-pulse"></i>
              Próximos
            </span>
            <span className="wc__upcoming-count">{upcomingEvents.length}</span>
          </div>
          {upcomingEvents.slice(0, 3).map((ev, idx) => {
            const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.event;
            return (
              <div key={idx} className="wc__upcoming-item" style={{ '--ev-color': cfg.color }}>
                <div className="wc__upcoming-date">
                  <span className="wc__upcoming-day">{ev.day}</span>
                  <span className="wc__upcoming-monthAbbr">{MONTH_NAMES[month].slice(0, 3)}</span>
                </div>
                <div className="wc__upcoming-line" style={{ '--ev-color': cfg.color }} />
                <i className={`bx ${cfg.icon} wc__upcoming-icon`} style={{ color: cfg.color }}></i>
                <div className="wc__upcoming-info">
                  <span className="wc__upcoming-title">{ev.title}</span>
                  {ev.time && <span className="wc__upcoming-time">{ev.time}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── FOOTER LINK ── */}
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
