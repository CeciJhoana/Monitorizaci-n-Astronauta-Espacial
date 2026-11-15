/**
 * Puerto de acceso a la estación de telemetría (hardware ESP32 ➜ Flask ➜
 * PostgreSQL). Sirve de contrato con el backend Flask real
 * (`backend/servidor/servidor_ble_postgres.py`).
 */

import { TELEMETRY_API_URL } from "@/config/env";
import { apiClient } from "./apiClient";

/** Fila cruda de la tabla `clima` tal como la devuelve `GET /clima`. */
export interface StationReadingRaw {
  id: number;
  /** Marca de tiempo ISO generada por PostgreSQL. */
  fecha: string;
  detector: string;
  /** Temperatura ambiente de cabina (°C), sensor AHT10/AHT20. */
  temperatura: number | null;
  /** Humedad relativa (%). */
  humedad: number | null;
  /** Radiación UV, sensor ML8511. */
  uv: number | null;
  /** Pulso (bpm). */
  pulso: number | null;
  /** Saturación de oxígeno (%). */
  spo2: number | null;
  /** Temperatura corporal (°C). */
  temp_corp: number | null;
  /** `true` si el firmware simula los signos vitales (demo). */
  sim: boolean;
  /** Puntaje de salud (0-100) calculado por el firmware. */
  salud: number | null;
}

/**
 * Fuente de telemetría de la estación. El frontend solo depende de esta
 * interfaz (inversión de dependencias); la implementación HTTP habla con
 * el servidor Flask real.
 */
export interface TelemetryApi {
  /**
   * Últimas lecturas de la estación, la más reciente primero.
   * Puede devolver una lista vacía si la base de datos aún no tiene datos.
   */
  getStationReadings(): Promise<StationReadingRaw[]>;
}

/** Implementación HTTP contra `GET /clima` del servidor Flask. */
export const httpTelemetryApi: TelemetryApi = {
  getStationReadings: async () => {
    const rows = await apiClient.get<StationReadingRaw[]>("/clima", TELEMETRY_API_URL);
    return Array.isArray(rows) ? rows : [];
  },
};
