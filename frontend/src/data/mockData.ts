import type {
  EnvironmentReading,
  JournalEntry,
  Measurement,
  MissionAlert,
  MissionSnapshot,
  Mood,
  Protocol,
  RoutineItem,
  TrendMetric,
  TrendPeriod,
  TrendSeries,
  CrewMember,
  IconName,
} from "@/types";
import { MISSION } from "@/config/mission";
import {
  MOCK_DB,
  buildMissionSnapshot,
  selectActiveAlerts,
  selectCrewMembers,
  selectEnvironmentReadings,
  selectProtocols,
  selectRoutine,
  selectTrends,
  selectWellnessHints,
  type WellnessHints,
} from "@/data/db";

/**
 * Datos simulados de la misión ARES–01.
 *
 * Esta capa es un **adaptador**: no contiene datos propios, sino que lee la
 * base de datos simulada (`src/data/db`, reflejo de
 * `docs/esquema-base-datos.sql`) y la traduce a las formas que consume la
 * interfaz.
 *
 * Es también el ejemplo del contrato que debe cumplir la API: las mismas
 * formas, devueltas en JSON por `GET /api/mission/snapshot`.
 */

/* -------------------------------------------------------------------------- */
/* Tripulación, alertas, entorno y tendencias                                    */
/* -------------------------------------------------------------------------- */

export const MOCK_CREW: CrewMember[] = selectCrewMembers(MOCK_DB);

export const MOCK_ALERTS: MissionAlert[] = selectActiveAlerts(MOCK_DB);

export const MOCK_ENVIRONMENT_READINGS: EnvironmentReading[] = selectEnvironmentReadings(MOCK_DB);

export const MOCK_TRENDS: Record<TrendMetric, Record<TrendPeriod, TrendSeries>> = selectTrends(
  MOCK_DB,
);

/* -------------------------------------------------------------------------- */
/* Protocolos y rutina                                                          */
/* -------------------------------------------------------------------------- */

export const MOCK_PROTOCOLS: Protocol[] = selectProtocols(MOCK_DB);

export const MOCK_ROUTINE: RoutineItem[] = selectRoutine(MOCK_DB);

/* -------------------------------------------------------------------------- */
/* Bitácora                                                                    */
/* -------------------------------------------------------------------------- */

export const MOOD_OPTIONS: { value: Mood; icon: IconName }[] = [
  { value: "Con dificultad", icon: "moon" },
  { value: "Regular", icon: "moon" },
  { value: "Bien", icon: "sun" },
  { value: "Muy bien", icon: "sun" },
];

/**
 * Hábitos de bienestar mostrados por tripulante: proceden de
 * `resumen_bienestar_diario` (el caso de revisión es el de James Miller).
 */
export const WELLNESS_HINTS: Record<"review" | "nominal", WellnessHints> = {
  review: selectWellnessHints(MOCK_DB, "tripulante-02"),
  nominal: selectWellnessHints(MOCK_DB, "tripulante-01"),
};

export function getWellnessHints(requiresReview: boolean) {
  return requiresReview ? WELLNESS_HINTS.review : WELLNESS_HINTS.nominal;
}

/** Estado inicial de los registros de la sesión (persistidos localmente). */
export const INITIAL_MEASUREMENTS: Measurement[] = [];
export const INITIAL_JOURNAL: JournalEntry[] = [];

export const MOCK_SNAPSHOT: MissionSnapshot = buildMissionSnapshot(MOCK_DB);

/* -------------------------------------------------------------------------- */
/* Textos de la misión                                                          */
/* -------------------------------------------------------------------------- */

/** Textos de la misión usados en varias vistas. */
export const MISSION_NOTES = {
  baselineInfo:
    "La referencia es personal. Las líneas base de esta demostración se simulan a partir de los primeros 14 días de misión. Un estado nominal no certifica aptitud para una EVA.",
  alertsDisclaimer:
    "Estas alertas son ejemplos explicables, no diagnósticos. Los umbrales y las recomendaciones requieren validación por el equipo médico de la misión.",
  missionDayLabel: `Día de misión ${MISSION.day}`,
} as const;
