// calendar.service.js

export async function getCalendarEvents(year, month) {
  // 🔴 MOCK REALISTA
  return [
    {
      id: "1",
      date: `${year}-${String(month).padStart(2, "0")}-05`,
      title: "Torneo Valorant",
      type: "tournament",
      color: "#22c55e",
    },
    {
      id: "2",
      date: `${year}-${String(month).padStart(2, "0")}-12`,
      title: "Team Alpha vs Team Beta",
      type: "vs",
      color: "#ef4444",
    },
    {
      id: "3",
      date: `${year}-${String(month).padStart(2, "0")}-12`,
      title: "Scrim nocturno",
      type: "event",
      color: "#3b82f6",
    },
  ];
}
