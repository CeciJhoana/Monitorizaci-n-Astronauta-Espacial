import { isApiConfigured } from "@/config/env";
import { httpHealthApi, type HealthApi } from "./healthApi";
import { mockHealthApi } from "./mockHealthApi";

/**
 * Punto único de acceso a los datos. Los componentes nunca importan una
 * implementación concreta: solo este objeto.
 *
 * - Sin `VITE_API_BASE_URL` → datos simulados en memoria.
 * - Con `VITE_API_BASE_URL` → backend real.
 */
export const healthApi: HealthApi = isApiConfigured ? httpHealthApi : mockHealthApi;

export type { HealthApi, MeasurementInput, JournalEntryInput } from "./healthApi";
