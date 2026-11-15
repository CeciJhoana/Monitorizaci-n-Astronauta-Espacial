import { useEffect, useState } from "react";

function formatUtcNow(): string {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });
}

/** Reloj UTC vivo, actualizado cada segundo. */
export function useUtcClock(): string {
  const [time, setTime] = useState(formatUtcNow);

  useEffect(() => {
    const interval = window.setInterval(() => setTime(formatUtcNow()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return time;
}
