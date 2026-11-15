import { describe, it, expect } from "vitest";
import esp32CaptureData from "./esp32_capture.json";
import rr1RadiationData from "./nasa_rr1_radiation.json";
import rr1EnvironmentData from "./nasa_rr1_environment.json";
import {
  DATA_SOURCES_META,
  applyDataSourceToCrew,
  buildEnvironmentReadingsForSource,
  getCompanionDataForSource,
} from "./dataSources";
import { evaluateConsecutiveAcuteAlerts, evaluateBehavior } from "@/lib/companion/companionEngine";
import { MOCK_CREW } from "@/data/mockData";

describe("Fuentes de Telemetría y Reglas de Honestidad", () => {
  /* ------------------------------------------------------------------------ */
  /* 1. Conteos exactos de filas                                              */
  /* ------------------------------------------------------------------------ */
  it("contiene exactamente 50 lecturas en esp32_capture.json ordenadas cronológicamente", () => {
    const lecturas = esp32CaptureData.lecturas;
    expect(lecturas).toHaveLength(50);

    // Verificar orden temporal ascendente
    expect(lecturas[0].time).toBe("09:07:00");
    expect(lecturas[lecturas.length - 1].time).toBe("09:10:50");

    // Verificar que todas tienen intervalo >= 0
    lecturas.forEach((l) => {
      expect(l.interval_seconds).toBeGreaterThanOrEqual(0);
      expect(l.pulso_bpm).toBeGreaterThan(0);
      expect(l.spo2_pct).toBeGreaterThan(0);
      expect(l.temperatura_corporal_c).toBeGreaterThan(0);
    });
  });

  it("contiene exactamente 39 días de dosimetría en nasa_rr1_radiation.json", () => {
    const series = rr1RadiationData.series;
    expect(series).toHaveLength(39);
    expect(series[0].fecha_utc).toBe("2014-09-21");
    expect(series[series.length - 1].fecha_utc).toBe("2014-10-29");
    expect(series[series.length - 1].acumulada_mgy).toBe(7.96);
  });

  it("contiene la ventana de 48h con el pico máximo de CO2 de ISS en nasa_rr1_environment.json", () => {
    const env = rr1EnvironmentData;
    expect(env.ventana_48h.length).toBeGreaterThanOrEqual(500);
    expect(env._meta.pico_co2_iss.co2).toBe(4667);
    expect(env._meta.pico_co2_iss.timestamp).toBe("2014-10-07T15:31:00Z");

    // Estadísticas globales completas
    expect(env.estadisticas_globales.iss.total_lecturas).toBe(12087);
    expect(env.estadisticas_globales.ground.total_lecturas).toBe(12087);
  });

  /* ------------------------------------------------------------------------ */
  /* 2. Regla estricta: NUNCA mezclar mGy y mSv                               */
  /* ------------------------------------------------------------------------ */
  it("mantiene estrictamente mGy para RR-1 y no lo confunde con mSv", () => {
    expect(rr1RadiationData._meta.unidad).toContain("mGy");
    expect(rr1RadiationData._meta.unidad).not.toContain("mSv");
    expect(rr1RadiationData._meta.nota).toContain("No convertir ni sumar con mSv");
  });

  /* ------------------------------------------------------------------------ */
  /* 3. Etiquetas de fuente y notas de honestidad                             */
  /* ------------------------------------------------------------------------ */
  it("presenta las etiquetas de fuente y notas de honestidad obligatorias", () => {
    expect(DATA_SOURCES_META.simulado.name).toBe("Simulado ARES-01");
    expect(DATA_SOURCES_META.rr1.sourceNote.toLowerCase()).toContain("experimento con roedores");
    expect(DATA_SOURCES_META.rr1.sourceNote).toContain("NO salud humana");
    expect(DATA_SOURCES_META.esp32.sourceBadge).toBe("Captura ESP32 · reproducción");
    expect(DATA_SOURCES_META.esp32.sourceNote).toContain("No es transmisión en tiempo real");
  });

  /* ------------------------------------------------------------------------ */
  /* 4. Reproducción ESP32: Recorrido por los 4 estados identificados        */
  /* ------------------------------------------------------------------------ */
  it("recorre los 4 estados fisiológicos en la captura ESP32", () => {
    const lecturas = esp32CaptureData.lecturas;

    // Estado 1: Crisis aguda inicial (filas 1-4)
    const crisis = lecturas.slice(0, 4);
    expect(crisis.every((l) => l.pulso_bpm >= 130 && l.spo2_pct < 90 && l.temperatura_corporal_c >= 38.0)).toBe(true);

    // Estado 2: Reposo nominal (filas 5-12)
    const nominal = lecturas.slice(4, 12);
    expect(nominal.every((l) => l.pulso_bpm <= 80 && l.spo2_pct >= 98 && l.temperatura_corporal_c < 37.0)).toBe(true);

    // Estado 3: Desaturación / hipoxia aislada (filas 13-16)
    const desaturacion = lecturas.slice(12, 16);
    expect(desaturacion.every((l) => l.spo2_pct < 95 && l.pulso_bpm < 90)).toBe(true);

    // Estado 4: Esfuerzo físico (filas 17-20)
    const esfuerzo = lecturas.slice(16, 20);
    expect(esfuerzo.every((l) => l.pulso_bpm >= 97 && l.pulso_bpm <= 126 && l.spo2_pct >= 95)).toBe(true);
  });

  /* ------------------------------------------------------------------------ */
  /* 5. Alertas agudas consecutivas vs. estado de esfuerzo                    */
  /* ------------------------------------------------------------------------ */
  it("dispara aviso agudo en 3 lecturas consecutivas críticas", () => {
    const lecturas = esp32CaptureData.lecturas;
    // Filas 1 a 3 son críticas (SpO2 < 95% y pulso >= 130)
    const tresCriticas = lecturas.slice(0, 3);
    const resultado = evaluateConsecutiveAcuteAlerts(tresCriticas, 3);

    expect(resultado.hasAcuteAlert).toBe(true);
    expect(resultado.message).toContain("Veo que tu oxígeno está bajo");
  });

  it("NO dispara aviso agudo en el estado de esfuerzo (pulso 97-126 lpm, SpO2 >= 95%)", () => {
    const lecturas = esp32CaptureData.lecturas;
    // Filas 17 a 20 son de esfuerzo (pulso 124-126 lpm, SpO2 96-97%, Temp 37.0-37.2°C)
    const cuatroEsfuerzo = lecturas.slice(16, 20);
    const resultado = evaluateConsecutiveAcuteAlerts(cuatroEsfuerzo, 3);

    expect(resultado.hasAcuteAlert).toBe(false);
    expect(resultado.message).toBe("");
  });

  /* ------------------------------------------------------------------------ */
  /* 6. Aislamiento de capas: El semáforo conductual no se mezcla con agudo   */
  /* ------------------------------------------------------------------------ */
  it("mantiene el semáforo conductual desacoplado de los avisos agudos", () => {
    const readingCrisis = esp32CaptureData.lecturas[0];
    const dataElena = getCompanionDataForSource("tripulante-01", "esp32", readingCrisis);

    const evaluacion = evaluateBehavior(dataElena, "es");

    // Tiene aviso agudo crítico
    expect(evaluacion.avisos_agudos.length).toBeGreaterThan(0);
    const avisoSpo2 = evaluacion.avisos_agudos.find((a) => a.metrica === "spo2");
    expect(avisoSpo2).toBeDefined();
    expect(avisoSpo2?.nivel).toBe("critica");

    // Pero el semáforo conductual (basado en sueño, HRV, actividad, luz, social y bitácora) se mantiene según sus reglas
    expect(evaluacion.nivel).toBeLessThanOrEqual(1); // Elena tiene sueño y hábitos normales en base de datos
  });

  /* ------------------------------------------------------------------------ */
  /* 7. Alimenta solo a la tripulante activa (Elena)                          */
  /* ------------------------------------------------------------------------ */
  it("alimenta a Elena con los datos del ESP32 y deja a los demás tripulantes simulados", () => {
    const reading = esp32CaptureData.lecturas[0]; // FC 131, SpO2 84
    const crewModificada = applyDataSourceToCrew(MOCK_CREW, "esp32", "tripulante-01", reading);

    const elena = crewModificada.find((m) => m.id === "01" || m.id === "tripulante-01");
    const james = crewModificada.find((m) => m.id === "02" || m.id === "tripulante-02");

    expect(elena?.heartRate).toBe(131);
    expect(elena?.oxygenSaturation).toBe(84);

    // James sigue con su valor nominal simulado
    expect(james?.heartRate).toBe(MOCK_CREW[1].heartRate);
    expect(james?.oxygenSaturation).toBe(MOCK_CREW[1].oxygenSaturation);
  });
});
