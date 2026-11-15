import { describe, it, expect } from "vitest";
import { createMockDatabase } from "@/data/db/seed";
import { selectCompanionData } from "@/data/companion/companionData";
import { evaluateBehavior, aplicarEscenario } from "./companionEngine";

describe("Motor del Asistente ASTRA (companionEngine)", () => {
  const db = createMockDatabase();

  it("evalúa a Elena Martínez (datos de la base) como Nivel 0 (Óptimo)", () => {
    const dataElena = selectCompanionData(db, "01");
    expect(dataElena.nombreTripulante).toBe("Elena Martínez");
    expect(dataElena.sueno_horas).toBeGreaterThanOrEqual(7.5);

    const evaluacion = evaluateBehavior(dataElena, "es");
    expect(evaluacion.nivel).toBe(0);
    expect(evaluacion.etiqueta).toBe("Óptimo");
    expect(evaluacion.escalado).toBe("Recomendación personal");
    expect(evaluacion.avisos_agudos).toHaveLength(0);
  });

  it("evalúa a James Miller (datos de la base) como Nivel 1 (Fatiga leve)", () => {
    const dataJames = selectCompanionData(db, "02");
    expect(dataJames.nombreTripulante).toBe("James Miller");
    expect(dataJames.sueno_horas).toBe(5.9); // En rango N1 [5.5, 7.4]

    const evaluacion = evaluateBehavior(dataJames, "es");
    expect(evaluacion.nivel).toBe(1);
    expect(evaluacion.etiqueta).toBe("Fatiga leve");
    expect(evaluacion.escalado).toBe("Recomendación personal");
    expect(evaluacion.por_que.length).toBeGreaterThan(0);
  });

  it("escenario 'sueno_bajo' produce Nivel 2 (Estrés por aislamiento / déficit)", () => {
    const dataBase = selectCompanionData(db, "01");
    const dataEscenario = aplicarEscenario(dataBase, "sueno_bajo");
    const evaluacion = evaluateBehavior(dataEscenario, "es");

    expect(evaluacion.nivel).toBe(2);
    expect(evaluacion.etiqueta).toBe("Estrés por aislamiento");
    expect(evaluacion.escalado).toBe("Alerta a la tripulación sugerida");
  });

  it("escenario 'aislamiento' produce Nivel 2 o 3", () => {
    const dataBase = selectCompanionData(db, "01");
    const dataEscenario = aplicarEscenario(dataBase, "aislamiento");
    const evaluacion = evaluateBehavior(dataEscenario, "es");

    expect([2, 3]).toContain(evaluacion.nivel);
  });

  it("escenario 'fatiga_critica' produce Nivel 3 (Crítico)", () => {
    const dataBase = selectCompanionData(db, "01");
    const dataEscenario = aplicarEscenario(dataBase, "fatiga_critica");
    const evaluacion = evaluateBehavior(dataEscenario, "es");

    expect(evaluacion.nivel).toBe(3);
    expect(evaluacion.etiqueta).toBe("Crítico");
    expect(evaluacion.escalado).toBe("Aviso a médicos de Tierra recomendado");
  });

  it("escenario 'radiacion_solar' dispara aviso agudo sin alterar el semáforo conductual", () => {
    const dataBase = selectCompanionData(db, "01");
    const dataEscenario = aplicarEscenario(dataBase, "radiacion_solar");
    const evaluacion = evaluateBehavior(dataEscenario, "es");

    // Semáforo conductual permanece en 0 si los otros valores son normales
    expect(evaluacion.nivel).toBe(0);
    // Pero la capa independiente de avisos agudos contiene la radiación crítica
    expect(evaluacion.avisos_agudos.length).toBeGreaterThanOrEqual(1);
    const avisoRad = evaluacion.avisos_agudos.find((a) => a.metrica === "radiacion");
    expect(avisoRad).toBeDefined();
    expect(avisoRad?.nivel).toBe("critica");
    expect(avisoRad?.detalle).toContain("450 mSv/h");
  });

  it("soporta salida en inglés", () => {
    const dataBase = selectCompanionData(db, "01");
    const dataEscenario = aplicarEscenario(dataBase, "fatiga_critica");
    const evaluacion = evaluateBehavior(dataEscenario, "en");

    expect(evaluacion.nivel).toBe(3);
    expect(evaluacion.etiqueta).toBe("Critical");
    expect(evaluacion.escalado).toBe("Ground medical alert recommended");
  });
});
