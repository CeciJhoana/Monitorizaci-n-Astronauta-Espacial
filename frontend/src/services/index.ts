import { isApiConfigured } from "@/config/env";
import { httpHealthApi, type HealthApi } from "./healthApi";
import { mockHealthApi } from "./mockHealthApi";
import { httpTelemetryApi, type TelemetryApi } from "./telemetryApi";

/**
 * Puntos únicos de acceso a los datos. Los componentes nunca importan
 * implementaciones concretas: solo estos objetos.
 *
 * - `healthApi`: backend de misión (crew, alertas, bitácora). Sin
 *   `VITE_API_BASE_URL` usa datos simulados en memoria.
 * - `telemetryApi`: estación de telemetría real (Flask + PostgreSQL).
 *   Por defecto apunta a `/api` (proxy de Vite ➜ Flask :5000).
 */
export const healthApi: HealthApi = isApiConfigured ? httpHealthApi : mockHealthApi;

export const telemetryApi: TelemetryApi = httpTelemetryApi;

export type { HealthApi, MeasurementInput, JournalEntryInput } from "./healthApi";
export type { TelemetryApi, StationReadingRaw } from "./telemetryApi";
