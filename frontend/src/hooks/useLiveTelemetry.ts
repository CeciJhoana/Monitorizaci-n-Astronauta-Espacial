import { useEffect, useState } from "react";
import { mapStationReading } from "@/services/telemetryMapper";
import { telemetryApi } from "@/services";
import type { LiveTelemetry, TelemetryStatus } from "@/types";

/**
 * Frecuencia de sondeo de la estación. El contrato de telemetría
 * recomienda 1 mensaje cada 1-2 segundos vía REST.
 */
const POLL_INTERVAL_MS = 2000;

export interface LiveTelemetryState {
  status: TelemetryStatus;
  /** Última lectura válida; se conserva aunque la estación se desconecte. */
  latest: LiveTelemetry | null;
}

/**
 * Sondea `GET /clima` del servidor Flask cada 2 segundos y expone el
 * estado del enlace. Si el backend no responde, la app degrada con
 * elegancia a datos simulados sin interrumpir la interfaz.
 */
export function useLiveTelemetry(): LiveTelemetryState {
  const [status, setStatus] = useState<TelemetryStatus>("connecting");
  const [latest, setLatest] = useState<LiveTelemetry | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const rows = await telemetryApi.getStationReadings();
        if (cancelled) return;
        if (rows.length > 0) {
          setLatest(mapStationReading(rows[0]));
          setStatus("live");
        } else {
          setStatus("offline");
        }
      } catch {
        // Estación sin señal: se reintenta en el siguiente ciclo.
        if (!cancelled) setStatus("offline");
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return { status, latest };
}
