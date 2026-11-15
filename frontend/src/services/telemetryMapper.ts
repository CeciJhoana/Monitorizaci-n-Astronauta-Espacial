import { LIVE_ASTRONAUT_ID } from "@/config/mission";
import type {
  CrewMember,
  EnvironmentReading,
  LiveTelemetry,
  LiveVitals,
  LiveEnvironment,
} from "@/types";
import type { StationReadingRaw } from "./telemetryApi";

/**
 * Funciones puras de traducción entre la telemetría cruda de la estación
 * Flask y el dominio del frontend. No tienen dependencias de React ni de
 * red, por lo que son triviales de probar.
 */

function toFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/**
 * Convierte una fila cruda de `GET /clima` en telemetría de dominio.
 * Los campos `null` (sensor desconectado) se omiten: la UI mantendrá el
 * último valor válido, como pide el contrato de telemetría.
 */
export function mapStationReading(raw: StationReadingRaw): LiveTelemetry {
  const vitals: LiveVitals = {
    heartRate: toFiniteNumber(raw.pulso),
    oxygenSaturation: toFiniteNumber(raw.spo2),
    bodyTemperatureCelsius: toFiniteNumber(raw.temp_corp),
    healthScore: toFiniteNumber(raw.salud),
  };
  const environment: LiveEnvironment = {
    cabinTemperatureCelsius: toFiniteNumber(raw.temperatura),
    humidityPercent: toFiniteNumber(raw.humedad),
    uvIndex: toFiniteNumber(raw.uv),
  };
  return {
    receivedAt: raw.fecha,
    detector: raw.detector,
    simulatedVitals: Boolean(raw.sim),
    vitals,
    environment,
  };
}

function hasAnyValue(record: LiveVitals | LiveEnvironment): boolean {
  return Object.values(record).some((value) => value !== undefined);
}

/**
 * Aplica los signos vitales en vivo al tripulante monitorizado por la
 * estación (LIVE_ASTRONAUT_ID). El resto de la tripulación mantiene sus
 * datos simulados. Los campos ausentes conservan el último valor.
 */
export function applyLiveVitals(crew: CrewMember[], telemetry: LiveTelemetry | null): CrewMember[] {
  if (!telemetry || !hasAnyValue(telemetry.vitals)) return crew;

  return crew.map((member) => {
    if (member.id !== LIVE_ASTRONAUT_ID) return member;
    return {
      ...member,
      heartRate: telemetry.vitals.heartRate ?? member.heartRate,
      oxygenSaturation: telemetry.vitals.oxygenSaturation ?? member.oxygenSaturation,
      temperatureCelsius: telemetry.vitals.bodyTemperatureCelsius ?? member.temperatureCelsius,
      wellnessScore: telemetry.vitals.healthScore ?? member.wellnessScore,
    };
  });
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatReading(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Porcentaje de la barra visual para cada tipo de lectura en vivo. */
function liveReadingPercent(id: string, value: number): number {
  switch (id) {
    case "radiation-uv":
      return clampPercent((value / 11) * 100); // índice UV 0–11+
    case "cabin-temp":
      return clampPercent(((value - 15) / (30 - 15)) * 100); // rango visual 15–30 °C
    case "humidity":
      return clampPercent(value); // humedad relativa ya es 0–100 %
    default:
      return 50;
  }
}

const LIVE_READING_META: Record<
  string,
  { icon: EnvironmentReading["icon"]; name: string; unit: string }
> = {
  "radiation-uv": { icon: "sun", name: "Radiación UV", unit: "UV" },
  "cabin-temp": { icon: "temp", name: "Temperatura de cabina", unit: "°C" },
  humidity: { icon: "wind", name: "Humedad relativa", unit: "%" },
};

function buildLiveReading(id: string, value: number): EnvironmentReading {
  const meta = LIVE_READING_META[id];
  return {
    id,
    icon: meta.icon,
    name: meta.name,
    value: formatReading(value),
    unit: meta.unit,
    status: "En vivo",
    percent: liveReadingPercent(id, value),
    warning: false,
  };
}

/** Orden en que las lecturas en vivo sustituyen o se agregan al panel. */
const LIVE_ENVIRONMENT_ORDER = ["radiation-uv", "cabin-temp", "humidity"] as const;

/** Valor en vivo asociado a cada lectura ambiental soportada. */
function liveEnvironmentValue(
  id: (typeof LIVE_ENVIRONMENT_ORDER)[number],
  environment: LiveEnvironment,
): number | undefined {
  switch (id) {
    case "radiation-uv":
      return environment.uvIndex;
    case "cabin-temp":
      return environment.cabinTemperatureCelsius;
    case "humidity":
      return environment.humidityPercent;
  }
}

/**
 * Fusiona las lecturas ambientales en vivo con las simuladas:
 * sustituye la radiación simulada por el índice UV real, actualiza la
 * temperatura de cabina y añade la humedad. CO₂ y radiación acumulada
 * siguen siendo datos de demostración (no hay sensor en el hardware).
 */
export function applyLiveEnvironment(
  base: EnvironmentReading[],
  telemetry: LiveTelemetry | null,
): EnvironmentReading[] {
  if (!telemetry) return base;

  const liveReadings = LIVE_ENVIRONMENT_ORDER.flatMap((id) => {
    const value = liveEnvironmentValue(id, telemetry.environment);
    return value === undefined ? [] : [buildLiveReading(id, value)];
  });

  if (!liveReadings.length) return base;

  // Las lecturas en vivo van primero y sustituyen la radiación simulada;
  // CO₂ (sin sensor en el hardware) se conserva como dato de demostración.
  const remainingMock = base.filter((reading) => reading.id === "co2");
  return [...liveReadings, ...remainingMock];
}
