import type { EnvironmentOption, PageId } from "@/types";

/** Datos estáticos de la misión simulada. */
export const MISSION = {
  code: "ARES–01",
  name: "Misión de exploración",
  expedition: "EXPEDICIÓN 07",
  day: 128,
  totalDays: 210,
  crewSize: 4,
  commander: "Elena Martínez",
} as const;

/**
 * Tripulante monitorizado por la estación de telemetría real (ESP32).
 * Coincide con `astronaut_id: "01"` del contrato de hardware.
 */
export const LIVE_ASTRONAUT_ID = "01";

export const NAV_ITEMS: { id: PageId; label: string }[] = [
  { id: "dashboard", label: "Resumen de misión" },
  { id: "assistant", label: "Asistente ASTRA" },
  { id: "crew", label: "Tripulación" },
  { id: "vitals", label: "Signos vitales" },
  { id: "wellness", label: "Bienestar y hábitos" },
  { id: "alerts", label: "Alertas" },
  { id: "environment", label: "Entorno espacial" },
  { id: "protocols", label: "Protocolos" },
  { id: "journal", label: "Bitácora" },
];

export const PAGE_HEADINGS: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Cada latido cuenta. Incluso aquí.",
    subtitle: "Una misión extraordinaria empieza con una tripulación saludable.",
  },
  assistant: {
    title: "ASTRA · Acompañamiento en órbita",
    subtitle: "Voz, bienestar, recordatorios y calma para misiones de larga duración.",
  },
  crew: {
    title: "Tripulación",
    subtitle: "Cuatro personas. Cuatro líneas base. Una misma misión.",
  },
  vitals: {
    title: "Signos vitales",
    subtitle: "Detecta cambios a tiempo, más allá de una lectura aislada.",
  },
  wellness: {
    title: "Bienestar y hábitos",
    subtitle: "Cuidar la mente también es parte del viaje.",
  },
  alerts: {
    title: "Alertas",
    subtitle: "Entiende cada señal. Prioriza la siguiente acción.",
  },
  environment: {
    title: "Entorno espacial",
    subtitle: "Lo que ocurre en la nave también se refleja en la salud.",
  },
  protocols: {
    title: "Protocolos",
    subtitle: "Orientación clara cuando estás lejos de casa.",
  },
  journal: {
    title: "Bitácora",
    subtitle: "Un espacio para observar, registrar y tomar perspectiva.",
  },
};

export const ENVIRONMENT_OPTIONS: EnvironmentOption[] = [
  { id: "orbital-station", label: "Estación orbital", gravityLabel: "Microgravedad" },
  { id: "lunar-base", label: "Base lunar", gravityLabel: "Lunar · 0.16 g" },
  { id: "mars-base", label: "Base marciana", gravityLabel: "Marte · 0.38 g" },
];

export function getEnvironmentOption(id: EnvironmentOption["id"]): EnvironmentOption {
  return ENVIRONMENT_OPTIONS.find((option) => option.id === id) ?? ENVIRONMENT_OPTIONS[0];
}
