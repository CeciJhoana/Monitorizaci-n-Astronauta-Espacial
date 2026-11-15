import type { JournalEntry, Measurement, MissionSnapshot, Mood } from "@/types";
import { apiClient } from "./apiClient";

/** Datos que el frontend envía al registrar una medición manual. */
export interface MeasurementInput {
  astronautId: string;
  heartRate: number;
  oxygenSaturation: number;
}

/** Datos que el frontend envía al guardar una entrada de bitácora. */
export interface JournalEntryInput {
  astronautId: string;
  mood: Mood;
  text: string;
}

/**
 * Puerto de acceso a los datos de salud de la misión.
 *
 * El frontend solo depende de esta interfaz (inversión de dependencias):
 * hoy la implementa `mockHealthApi` y, cuando exista el backend, la
 * implementación HTTP sin cambiar ningún componente.
 */
export interface HealthApi {
  /** Instantánea completa: tripulación, alertas, entorno y tendencias. */
  getMissionSnapshot(): Promise<MissionSnapshot>;
  createMeasurement(input: MeasurementInput): Promise<Measurement>;
  createJournalEntry(input: JournalEntryInput): Promise<JournalEntry>;
}

/**
 * Implementación HTTP. Contrato esperado del backend:
 *
 * - GET  /mission/snapshot  → MissionSnapshot
 * - POST /vitals            → Measurement   (body: MeasurementInput)
 * - POST /journal           → JournalEntry  (body: JournalEntryInput)
 */
export const httpHealthApi: HealthApi = {
  getMissionSnapshot: () => apiClient.get<MissionSnapshot>("/mission/snapshot"),
  createMeasurement: (input) => apiClient.post<Measurement>("/vitals", input),
  createJournalEntry: (input) => apiClient.post<JournalEntry>("/journal", input),
};
