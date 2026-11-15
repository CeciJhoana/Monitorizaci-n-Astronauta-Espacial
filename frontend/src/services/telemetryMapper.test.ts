import { describe, expect, it } from "vitest";
import { MOCK_CREW, MOCK_ENVIRONMENT_READINGS } from "@/data/mockData";
import type { StationReadingRaw } from "@/services/telemetryApi";
import {
  applyLiveEnvironment,
  applyLiveVitals,
  mapStationReading,
} from "@/services/telemetryMapper";

function rawRow(overrides: Partial<StationReadingRaw> = {}): StationReadingRaw {
  return {
    id: 42,
    fecha: "2026-11-15T12:00:00",
    detector: "esp32_aht",
    temperatura: 22.4,
    humedad: 48,
    uv: 1.25,
    pulso: 72,
    spo2: 98,
    temp_corp: 36.6,
    sim: false,
    salud: 95,
    ...overrides,
  };
}

describe("mapStationReading", () => {
  it("mapea todos los campos válidos de la estación", () => {
    const telemetry = mapStationReading(rawRow());
    expect(telemetry.detector).toBe("esp32_aht");
    expect(telemetry.simulatedVitals).toBe(false);
    expect(telemetry.vitals).toEqual({
      heartRate: 72,
      oxygenSaturation: 98,
      bodyTemperatureCelsius: 36.6,
      healthScore: 95,
    });
    expect(telemetry.environment).toEqual({
      cabinTemperatureCelsius: 22.4,
      humidityPercent: 48,
      uvIndex: 1.25,
    });
  });

  it("omite los campos null (sensor desconectado) sin inventar valores", () => {
    const telemetry = mapStationReading(
      rawRow({ pulso: null, spo2: null, temp_corp: null, salud: null, uv: null }),
    );
    expect(telemetry.vitals.heartRate).toBeUndefined();
    expect(telemetry.vitals.oxygenSaturation).toBeUndefined();
    expect(telemetry.environment.uvIndex).toBeUndefined();
  });

  it("marca los signos simulados del firmware", () => {
    expect(mapStationReading(rawRow({ sim: true })).simulatedVitals).toBe(true);
  });
});

describe("applyLiveVitals", () => {
  it("parcha solo al tripulante monitorizado por la estación (01)", () => {
    const crew = applyLiveVitals(MOCK_CREW, mapStationReading(rawRow()));
    const live = crew.find((member) => member.id === "01");
    const others = crew.filter((member) => member.id !== "01");

    expect(live?.heartRate).toBe(72);
    expect(live?.oxygenSaturation).toBe(98);
    expect(live?.temperatureCelsius).toBe(36.6);
    expect(live?.wellnessScore).toBe(95);
    // Los demás conservan sus datos simulados.
    expect(others.map((member) => member.heartRate)).not.toContain(72);
  });

  it("conserva el último valor cuando el campo llega null", () => {
    const baselineHeartRate = MOCK_CREW[0].heartRate;
    const crew = applyLiveVitals(MOCK_CREW, mapStationReading(rawRow({ pulso: null, spo2: 96 })));
    expect(crew[0].heartRate).toBe(baselineHeartRate);
    expect(crew[0].oxygenSaturation).toBe(96);
  });

  it("no altera nada sin telemetría", () => {
    expect(applyLiveVitals(MOCK_CREW, null)).toEqual(MOCK_CREW);
  });
});

describe("applyLiveEnvironment", () => {
  it("sustituye la radiación simulada por UV real y añade humedad", () => {
    const readings = applyLiveEnvironment(MOCK_ENVIRONMENT_READINGS, mapStationReading(rawRow()));
    const ids = readings.map((reading) => reading.id);

    expect(ids).toContain("radiation-uv");
    expect(ids).toContain("humidity");
    expect(ids).toContain("cabin-temp");
    expect(ids).toContain("co2"); // sin sensor: se conserva la demo
    expect(ids).not.toContain("radiation"); // sustituida por UV real

    const uv = readings.find((reading) => reading.id === "radiation-uv");
    expect(uv?.value).toBe("1.3");
    expect(uv?.unit).toBe("UV");
    expect(uv?.status).toBe("En vivo");
  });

  it("devuelve la base intacta si la estación no reporta ambiente", () => {
    const telemetry = mapStationReading(rawRow({ temperatura: null, humedad: null, uv: null }));
    expect(applyLiveEnvironment(MOCK_ENVIRONMENT_READINGS, telemetry)).toEqual(
      MOCK_ENVIRONMENT_READINGS,
    );
  });
});
