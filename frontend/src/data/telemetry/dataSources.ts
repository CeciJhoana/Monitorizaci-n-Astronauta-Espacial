/**
 * dataSources.ts — Abstracción de Fuentes de Datos para Órbita / ASTRA
 *
 * NASA Space Apps Cochabamba — Reto "Create Health Monitoring Software for Astronauts"
 *
 * Permite conmutar transparentemente entre:
 * 1. "simulado": Misión ARES-01 estándar simulada en memoria.
 * 2. "rr1": Datos ambientales reales del experimento Rodent Research 1 de la NASA en ISS (mGy).
 * 3. "esp32": Reproducción secuencial de la captura física realizada con hardware ESP32.
 */

import type { EnvironmentReading, CrewMember } from "@/types";
import type { CompanionData } from "@/data/companion/companionData";
import { selectCompanionData } from "@/data/companion/companionData";
import { MOCK_DB } from "@/data/db";

export type DataSourceId = "simulado" | "rr1" | "esp32";

export interface DataSourceMeta {
  id: DataSourceId;
  name: string;
  sourceBadge: string;
  sourceNote: string;
  isPlayback: boolean;
}

export interface Esp32Reading {
  index: number;
  time: string;
  interval_seconds: number;
  pulso_bpm: number;
  spo2_pct: number;
  temperatura_corporal_c: number;
  uv: number;
  temperatura_ambiente_c: number;
  humedad_pct: number;
  salud_pct: number;
}

export interface Rr1EnvironmentData {
  _meta: {
    fuente: string;
    nota: string;
    regla_co2: string;
    ventana_horas: number;
    pico_co2_iss: { timestamp: string; co2: number; temp: number; hum: number };
  };
  estadisticas_globales: {
    iss: {
      total_lecturas: number;
      co2_ppm: { min: number; max: number; media: number };
      temperatura_c: { min: number; max: number; media: number };
      humedad_pct: { min: number; max: number; media: number };
    };
    ground: {
      total_lecturas: number;
      co2_ppm: { min: number; max: number; media: number };
      temperatura_c: { min: number; max: number; media: number };
      humedad_pct: { min: number; max: number; media: number };
    };
  };
  ventana_48h: Array<{
    timestamp: string;
    iss?: { temperatura_c: number; humedad_pct: number; co2_ppm: number };
    ground?: { temperatura_c: number; humedad_pct: number; co2_ppm: number };
  }>;
}

export interface Rr1RadiationData {
  _meta: {
    fuente: string;
    unidad: string;
    nota: string;
    total_dias: number;
  };
  series: Array<{
    dia_mision: number;
    fecha_utc: string;
    gcr_mgy_dia: number;
    saa_mgy_dia: number;
    total_mgy_dia: number;
    acumulada_mgy: number;
  }>;
}

/* ========================================================================== */
/* Carga perezosa de los conjuntos de datos JSON (carga diferida)              */
/* ========================================================================== */

let esp32Cache: Esp32Reading[] | null = null;
let rr1EnvCache: Rr1EnvironmentData | null = null;
let rr1RadCache: Rr1RadiationData | null = null;

export async function loadEsp32Capture(): Promise<Esp32Reading[]> {
  if (!esp32Cache) {
    const module = await import("./esp32_capture.json");
    esp32Cache = module.default.lecturas as Esp32Reading[];
  }
  return esp32Cache;
}

export async function loadRr1Environment(): Promise<Rr1EnvironmentData> {
  if (!rr1EnvCache) {
    const module = await import("./nasa_rr1_environment.json");
    rr1EnvCache = module.default as unknown as Rr1EnvironmentData;
  }
  return rr1EnvCache;
}

export async function loadRr1Radiation(): Promise<Rr1RadiationData> {
  if (!rr1RadCache) {
    const module = await import("./nasa_rr1_radiation.json");
    rr1RadCache = module.default as unknown as Rr1RadiationData;
  }
  return rr1RadCache;
}

export const DATA_SOURCES_META: Record<DataSourceId, DataSourceMeta> = {
  simulado: {
    id: "simulado",
    name: "Simulado ARES-01",
    sourceBadge: "Simulación de misión",
    sourceNote: "Valores nominales simulados de la misión ARES-01.",
    isPlayback: false,
  },
  rr1: {
    id: "rr1",
    name: "NASA RR-1 · ISS (histórico)",
    sourceBadge: "NASA RR-1 · ISS",
    sourceNote: "Experimento con roedores: sus datos de ambiente son contexto de cabina, NO salud humana.",
    isPlayback: false,
  },
  esp32: {
    id: "esp32",
    name: "Captura ESP32",
    sourceBadge: "Captura ESP32 · reproducción",
    sourceNote: "Reproducción de datos grabados con hardware ESP32. No es transmisión en tiempo real.",
    isPlayback: true,
  },
};

/**
 * Aplica la telemetría del DataSource sobre la lista de tripulantes.
 * En modo ESP32, alimenta al tripulante activo (Elena) y mantiene a los demás simulados.
 */
export function applyDataSourceToCrew(
  baseCrew: CrewMember[],
  sourceId: DataSourceId,
  activeAstronautId: string,
  esp32Reading?: Esp32Reading,
): CrewMember[] {
  if (sourceId !== "esp32" || !esp32Reading) {
    return baseCrew;
  }

  return baseCrew.map((member) => {
    // Alimenta únicamente al tripulante activo (Elena Vega)
    if (member.id === activeAstronautId || member.id === "tripulante-01") {
      return {
        ...member,
        heartRate: Math.round(esp32Reading.pulso_bpm),
        oxygenSaturation: Math.round(esp32Reading.spo2_pct),
        temperatureCelsius: esp32Reading.temperatura_corporal_c,
      };
    }
    return member;
  });
}

/**
 * Construye las lecturas de cabina/entorno según la fuente seleccionada.
 */
export function buildEnvironmentReadingsForSource(
  sourceId: DataSourceId,
  baseReadings: EnvironmentReading[],
  esp32Reading?: Esp32Reading,
  rr1Env?: Rr1EnvironmentData,
): EnvironmentReading[] {
  if (sourceId === "esp32" && esp32Reading) {
    return [
      {
        id: "esp32-temp",
        icon: "temp",
        name: "Temperatura de cabina",
        value: esp32Reading.temperatura_ambiente_c.toFixed(1),
        unit: "°C",
        status: "Captura ESP32",
        percent: Math.min(100, Math.round((esp32Reading.temperatura_ambiente_c / 40) * 100)),
        warning: esp32Reading.temperatura_ambiente_c > 28,
      },
      {
        id: "esp32-hum",
        icon: "wind",
        name: "Humedad de cabina",
        value: esp32Reading.humedad_pct.toFixed(1),
        unit: "%",
        status: "Captura ESP32",
        percent: Math.min(100, Math.round(esp32Reading.humedad_pct)),
        warning: esp32Reading.humedad_pct > 80,
      },
      {
        id: "esp32-uv",
        icon: "sun",
        name: "Índice ultravioleta (UV)",
        value: esp32Reading.uv.toFixed(2),
        unit: "UV",
        status: "Captura ESP32",
        percent: Math.min(100, Math.round((esp32Reading.uv / 3) * 100)),
        warning: esp32Reading.uv > 1.0,
      },
      {
        id: "esp32-co2-ref",
        icon: "wind",
        name: "CO₂ de referencia",
        value: "2050",
        unit: "ppm",
        status: "Habitual",
        percent: 56,
        warning: false,
      },
    ];
  }

  if (sourceId === "rr1" && rr1Env) {
    const peak = rr1Env._meta.pico_co2_iss;
    const mediaIss = rr1Env.estadisticas_globales.iss;
    return [
      {
        id: "rr1-co2",
        icon: "wind",
        name: "CO₂ cabina (ISS pico)",
        value: String(peak.co2),
        unit: "ppm",
        status: "Máximo 48h",
        percent: Math.min(100, Math.round((peak.co2 / 5000) * 100)),
        warning: peak.co2 >= 4000,
      },
      {
        id: "rr1-temp",
        icon: "temp",
        name: "Temperatura hábitat ISS",
        value: peak.temp.toFixed(1),
        unit: "°C",
        status: `Media: ${mediaIss.temperatura_c.media}°C`,
        percent: Math.min(100, Math.round((peak.temp / 35) * 100)),
        warning: false,
      },
      {
        id: "rr1-hum",
        icon: "wind",
        name: "Humedad hábitat ISS",
        value: String(peak.hum),
        unit: "%",
        status: `Media: ${mediaIss.humedad_pct.media}%`,
        percent: peak.hum,
        warning: false,
      },
      {
        id: "rr1-co2-media",
        icon: "wind",
        name: "CO₂ promedio ISS",
        value: String(mediaIss.co2_ppm.media),
        unit: "ppm",
        status: "Tendencia de revisión",
        percent: Math.min(100, Math.round((mediaIss.co2_ppm.media / 5000) * 100)),
        warning: false,
      },
    ];
  }

  return baseReadings;
}

/**
 * Adaptador que obtiene CompanionData para el tripulante según la fuente activa.
 * El resto de la app (motor del semáforo, avisos agudos, orbe) lee exclusivamente por aquí.
 */
export function getCompanionDataForSource(
  tripulanteId: string,
  sourceId: DataSourceId,
  esp32Reading?: Esp32Reading,
): CompanionData {
  const baseData = selectCompanionData(MOCK_DB, tripulanteId);

  if (sourceId === "esp32" && esp32Reading && (tripulanteId === "tripulante-01" || tripulanteId === baseData.tripulanteId)) {
    return {
      ...baseData,
      vitales: {
        ...baseData.vitales,
        frecuencia_cardiaca_bpm: Math.round(esp32Reading.pulso_bpm),
        spo2_pct: Math.round(esp32Reading.spo2_pct),
        temperatura_corporal_c: esp32Reading.temperatura_corporal_c,
      },
    };
  }

  return baseData;
}
