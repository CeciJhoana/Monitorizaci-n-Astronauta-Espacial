/**
 * Variables de entorno de la aplicación.
 *
 * - `VITE_API_BASE_URL`: backend de misión (crew, alertas...). Vacío →
 *   modo demostración con datos simulados.
 * - `VITE_TELEMETRY_API_URL`: estación ESP32 + Flask. Por defecto `/api`
 *   (el proxy de Vite la reenvía al servidor Flask en desarrollo).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const isApiConfigured = API_BASE_URL.length > 0;

export const TELEMETRY_API_URL = import.meta.env.VITE_TELEMETRY_API_URL ?? "/api";
