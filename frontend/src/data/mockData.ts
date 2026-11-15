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

/**
 * Datos simulados de la misión ARES–01.
 *
 * Son la fuente de datos en modo demostración (sin backend) y el ejemplo
 * del contrato que debe cumplir la API: las mismas formas, devueltas en
 * JSON por `GET /api/mission/snapshot`.
 */

export const MOCK_CREW: CrewMember[] = [
  {
    id: "01",
    name: "Elena Martínez",
    role: "Comandante de misión",
    initials: "EM",
    color: "purple",
    heartRate: 68,
    oxygenSaturation: 98,
    temperatureCelsius: 36.6,
    bloodPressure: "118/76",
    respiratoryRate: 15,
    sleepHours: 7.8,
    wellnessScore: 96,
    status: "Nominal",
    requiresReview: false,
  },
  {
    id: "02",
    name: "James Miller",
    role: "Ingeniero de vuelo",
    initials: "JM",
    color: "blue",
    heartRate: 82,
    oxygenSaturation: 97,
    temperatureCelsius: 36.8,
    bloodPressure: "124/80",
    respiratoryRate: 18,
    sleepHours: 5.9,
    wellnessScore: 78,
    status: "En observación",
    requiresReview: true,
  },
  {
    id: "03",
    name: "Yuki Tanaka",
    role: "Oficial médico",
    initials: "YT",
    color: "rose",
    heartRate: 65,
    oxygenSaturation: 99,
    temperatureCelsius: 36.5,
    bloodPressure: "112/72",
    respiratoryRate: 14,
    sleepHours: 8.1,
    wellnessScore: 98,
    status: "Nominal",
    requiresReview: false,
  },
  {
    id: "04",
    name: "Alex Petrov",
    role: "Especialista de misión",
    initials: "AP",
    color: "sand",
    heartRate: 71,
    oxygenSaturation: 98,
    temperatureCelsius: 36.7,
    bloodPressure: "120/78",
    respiratoryRate: 15,
    sleepHours: 7.5,
    wellnessScore: 94,
    status: "Nominal",
    requiresReview: false,
  },
];

export const MOCK_ALERTS: MissionAlert[] = [
  {
    id: 1,
    title: "Recuperación por debajo de la línea base",
    subject: "James Miller",
    category: "Bienestar",
    relativeTime: "Hace 12 min",
    detail:
      "HRV un 21% menor que su línea base de 54 ms, junto con 5.9 h de sueño. Tendencia sostenida durante los últimos 2 días.",
    recommendedAction:
      "Revisar el descanso, registrar cómo se siente y consultar al oficial médico antes de tareas de alta exigencia.",
    level: "Preventiva",
    tone: "amber",
    icon: "moon",
  },
  {
    id: 2,
    title: "Exposición a CO₂ en aumento",
    subject: "Módulo de habitación",
    category: "Entorno",
    relativeTime: "Hace 34 min",
    detail:
      "La lectura simulada de CO₂ aumentó de 1,800 a 2,450 ppm en las últimas 3 horas. Se muestra como tendencia de revisión, no como umbral clínico validado.",
    recommendedAction:
      "Verificar el sensor y consultar la lista de comprobación del sistema de ventilación de la misión.",
    level: "Revisión",
    tone: "purple",
    icon: "wind",
  },
];

export const MOCK_ENVIRONMENT_READINGS: EnvironmentReading[] = [
  {
    id: "co2",
    icon: "wind",
    name: "CO₂ en cabina",
    value: "2,450",
    unit: "ppm",
    status: "En revisión",
    percent: 67,
    warning: true,
  },
  {
    id: "radiation",
    icon: "sun",
    name: "Radiación diaria",
    value: "0.42",
    unit: "mSv",
    status: "Habitual",
    percent: 34,
    warning: false,
  },
  {
    id: "cabin-temp",
    icon: "temp",
    name: "Temperatura",
    value: "22.4",
    unit: "°C",
    status: "Estable",
    percent: 49,
    warning: false,
  },
];

const HOURLY_X_LABELS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
const WEEKLY_X_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const MOCK_TRENDS: Record<TrendMetric, Record<TrendPeriod, TrendSeries>> = {
  heartRate: {
    "24h": {
      values: [68, 67, 70, 65, 68, 67, 71, 78, 70, 68, 71, 69],
      unit: "lpm",
      min: 50,
      max: 90,
      normalRange: [60, 80],
      xLabels: HOURLY_X_LABELS,
    },
    "7d": {
      values: [65, 68, 64, 70, 67, 69, 72, 68, 66, 69, 68, 70],
      unit: "lpm",
      min: 50,
      max: 90,
      normalRange: [60, 80],
      xLabels: WEEKLY_X_LABELS,
    },
  },
  oxygenSaturation: {
    "24h": {
      values: [98, 98, 99, 98, 97, 98, 98, 99, 98, 98, 99, 98],
      unit: "%",
      min: 96,
      max: 100,
      normalRange: [97, 99],
      xLabels: HOURLY_X_LABELS,
    },
    "7d": {
      values: [98, 99, 98, 97, 98, 99, 98, 97, 99, 98, 98, 99],
      unit: "%",
      min: 96,
      max: 100,
      normalRange: [97, 99],
      xLabels: WEEKLY_X_LABELS,
    },
  },
};

export const MOCK_PROTOCOLS: Protocol[] = [
  {
    id: "measurement",
    title: "Tomar una medición",
    icon: "pulse",
    description: "Preparación del sensor, captura y verificación de lecturas.",
    tag: "MONITOREO RUTINARIO",
    steps: [
      "Identificar al tripulante y el sensor autorizado.",
      "Comprobar el ajuste y seguir el manual del fabricante.",
      "Esperar una lectura estable y anotar el contexto.",
      "Registrar el valor; si hay dudas, consultar al oficial médico.",
    ],
  },
  {
    id: "fatigue",
    title: "Revisar fatiga y descanso",
    icon: "moon",
    description: "Contextualizar sueño, recuperación y cambios de bienestar.",
    tag: "BIENESTAR",
    steps: [
      "Consultar el registro de sueño y la línea base individual.",
      "Preguntar por fatiga, malestar y estado de ánimo.",
      "Revisar la rutina con el responsable de salud de la misión.",
      "Registrar la observación y acordar una nueva revisión.",
    ],
  },
  {
    id: "environment",
    title: "Comprobar el entorno",
    icon: "planet",
    description: "Verificar sensores de cabina y escalar incidencias.",
    tag: "SEGURIDAD DEL HÁBITAT",
    steps: [
      "Verificar la lectura y el estado del sensor de cabina.",
      "Comparar con sensores redundantes si están disponibles.",
      "Consultar la lista oficial de control ambiental de la nave.",
      "Escalar la incidencia al responsable de sistemas.",
    ],
  },
  {
    id: "offline",
    title: "Operar sin conexión",
    icon: "radio",
    description: "Continuidad local y preparación de información para Tierra.",
    tag: "AUTONOMÍA DE MISIÓN",
    steps: [
      "Confirmar el estado del enlace mediante el sistema de misión.",
      "Mantener los registros mediante el procedimiento local autorizado.",
      "Preparar el resumen de observaciones para control de misión.",
      "Al restablecer el enlace, verificar la recepción por el canal oficial.",
    ],
  },
];

export const MOCK_ROUTINE: RoutineItem[] = [
  {
    time: "06:30",
    name: "Exposición a luz y activación",
    note: "Ventana circadiana · 30 min",
    done: true,
  },
  {
    time: "12:00",
    name: "Pausa de hidratación",
    note: "Revisión individual de hábitos",
    done: true,
  },
  {
    time: "16:00",
    name: "Ejercicio de la tripulación",
    note: "Resistencia y movilidad · 60 min",
    done: false,
  },
  {
    time: "20:30",
    name: "Bitácora y desconexión",
    note: "Registro de bienestar · 10 min",
    done: false,
  },
];

export const MOOD_OPTIONS: { value: Mood; icon: IconName }[] = [
  { value: "Con dificultad", icon: "moon" },
  { value: "Regular", icon: "moon" },
  { value: "Bien", icon: "sun" },
  { value: "Muy bien", icon: "sun" },
];

export interface WellnessHints {
  hrv: string;
  exercise: string;
  exercisePercent: number;
  hydration: string;
  light: string;
}

/** Hábitos de bienestar mostrados por tripulante en modo demostración. */
export const WELLNESS_HINTS: Record<"review" | "nominal", WellnessHints> = {
  review: {
    hrv: "43 ms",
    exercise: "35 / 60 min",
    exercisePercent: 58,
    hydration: "1.6 L",
    light: "220 lux",
  },
  nominal: {
    hrv: "56 ms",
    exercise: "65 / 60 min",
    exercisePercent: 100,
    hydration: "2.2 L",
    light: "540 lux",
  },
};

export function getWellnessHints(requiresReview: boolean) {
  return requiresReview ? WELLNESS_HINTS.review : WELLNESS_HINTS.nominal;
}

/** Estado inicial de los registros de la sesión (persistidos localmente). */
export const INITIAL_MEASUREMENTS: Measurement[] = [];
export const INITIAL_JOURNAL: JournalEntry[] = [];

export const MOCK_SNAPSHOT: MissionSnapshot = {
  crew: MOCK_CREW,
  alerts: MOCK_ALERTS,
  environmentReadings: MOCK_ENVIRONMENT_READINGS,
  trends: MOCK_TRENDS,
};

/** Textos de la misión usados en varias vistas. */
export const MISSION_NOTES = {
  baselineInfo:
    "La referencia es personal. Las líneas base de esta demostración se simulan a partir de los primeros 14 días de misión. Un estado nominal no certifica aptitud para una EVA.",
  alertsDisclaimer:
    "Estas alertas son ejemplos explicables, no diagnósticos. Los umbrales y las recomendaciones requieren validación por el equipo médico de la misión.",
  missionDayLabel: `Día de misión ${MISSION.day}`,
} as const;
