import { useState } from "react";
import "./WidgetCalendar.css";

const MOCK_EVENTS = {
  "2026-01-05": [{ type: "tournament", title: "Copa Esportefy" }],
  "2026-01-08": [
    { type: "vs", title: "Team Alpha vs Team Omega" },
    { type: "event", title: "Scrim Night" }
  ],
  "2026-01-15": [{ type: "tournament", title: "Liga Pro" }]
};

export default function WidgetCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  return (
    <div className="widget-calendar">
      {/* HEADER */}
      <div className="calendar-header">
        <button className="nav-btn" onClick={prevMonth}>‹</button>
        <span className="month-title">
          {currentDate.toLocaleString("default", {
            month: "long",
            year: "numeric"
          })}
        </span>
        <button className="nav-btn" onClick={nextMonth}>›</button>
      </div>

      {/* WEEKDAYS */}
      <div className="calendar-weekdays">
        {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      {/* DAYS GRID */}
      <div className="calendar-grid">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const events = MOCK_EVENTS[dateKey] || [];

          return (
            <div
              key={day}
              className={`calendar-day ${isToday(day) ? "today" : ""}`}
            >
              <span className="day-number">{day}</span>

              {events.length > 0 && (
                <div className="event-dots">
                  {events.map((ev, idx) => (
                    <span key={idx} className={`dot ${ev.type}`} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER */}
      <a href="/CalendarPage" className="view-more">
        Ver más →
      </a>
    </div>
  );
}
