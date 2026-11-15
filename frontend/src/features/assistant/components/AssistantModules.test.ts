import { describe, it, expect } from "vitest";
import { calcularRetardoHabitat } from "./FamilyCommsModal";
import { MOOD_VALUES } from "./QuickJournalModal";
import { FASES_RESPIRACION } from "./BreathingGuideModal";

describe("Módulos del Asistente ASTRA (AssistantModules)", () => {
  describe("FamilyCommsModal · Retardo por Entorno", () => {
    it("calcula enlace orbital casi instantáneo con voz dúplex habilitada", () => {
      const info = calcularRetardoHabitat("orbital");
      expect(info.entorno).toBe("orbital");
      expect(info.retardoIdaSegundos).toBeLessThan(1);
      expect(info.permiteTiempoReal).toBe(true);
    });

    it("calcula retardo lunar de 1.3 s ida y 2.6 s bidireccional", () => {
      const info = calcularRetardoHabitat("lunar");
      expect(info.entorno).toBe("lunar");
      expect(info.retardoIdaSegundos).toBe(1.3);
      expect(info.retardoRttSegundos).toBe(2.6);
      expect(info.permiteTiempoReal).toBe(true);
    });

    it("calcula retardo marciano de 14 min ida e inhabilita llamadas en tiempo real", () => {
      const info = calcularRetardoHabitat("marte");
      expect(info.entorno).toBe("marte");
      expect(info.retardoIdaSegundos).toBe(840); // 14 min
      expect(info.retardoRttSegundos).toBe(1680); // 28 min
      expect(info.permiteTiempoReal).toBe(false);
    });
  });

  describe("QuickJournalModal · Calibración de Estados de Ánimo", () => {
    it("contiene los 4 valores de ánimo exactamente con los pesos del semáforo", () => {
      expect(MOOD_VALUES["Muy bien"].valor).toBe(0.6);
      expect(MOOD_VALUES["Bien"].valor).toBe(0.35);
      expect(MOOD_VALUES["Regular"].valor).toBe(0.1);
      expect(MOOD_VALUES["Con dificultad"].valor).toBe(-0.4);
    });

    it("provee etiquetas bilingües e iconos para cada estado de ánimo", () => {
      for (const key of Object.keys(MOOD_VALUES) as Array<keyof typeof MOOD_VALUES>) {
        const item = MOOD_VALUES[key];
        expect(item.es).toBeDefined();
        expect(item.en).toBeDefined();
        expect(item.icon).toBeDefined();
      }
    });
  });

  describe("BreathingGuideModal · Ciclo 4-4-4-4 de Respiración", () => {
    it("posee exactamente las 4 fases de respiración cuadrada de 4 segundos", () => {
      expect(FASES_RESPIRACION).toHaveLength(4);

      const nombresFases = FASES_RESPIRACION.map((f) => f.fase);
      expect(nombresFases).toEqual(["inhala", "sosten", "exhala", "pausa"]);

      for (const fase of FASES_RESPIRACION) {
        expect(fase.segundos).toBe(4);
        expect(fase.label.es).toBeDefined();
        expect(fase.label.en).toBeDefined();
        expect(fase.indicacion.es).toBeDefined();
        expect(fase.indicacion.en).toBeDefined();
        expect(fase.escalaOrbe).toBeGreaterThan(0);
      }
    });

    it("un ciclo completo dura 16 segundos y 4 ciclos equivalen a ~1 minuto (64 s)", () => {
      const duracionCiclo = FASES_RESPIRACION.reduce((acc, f) => acc + f.segundos, 0);
      expect(duracionCiclo).toBe(16);

      const duracionTotal = duracionCiclo * 4;
      expect(duracionTotal).toBe(64);
    });
  });
});
