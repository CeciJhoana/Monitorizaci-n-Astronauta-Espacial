import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import knowledgeData from "./knowledge.json";

describe("Base de Conocimiento ASTRA (knowledge.json)", () => {
  const entradas = knowledgeData.entradas;

  it("contiene todas las categorías principales requeridas", () => {
    const categorias = new Set(entradas.map((e) => e.categoria));
    expect(categorias.has("ejercicio")).toBe(true);
    expect(categorias.has("nutricion")).toBe(true);
    expect(categorias.has("presion")).toBe(true);
    expect(categorias.has("soledad")).toBe(true);
    expect(categorias.has("familia")).toBe(true);
    expect(categorias.has("descanso")).toBe(true);
    expect(categorias.has("emergencias")).toBe(true);
  });

  it("verifica que todas las entradas tienen texto completo en español e inglés", () => {
    for (const entrada of entradas) {
      expect(entrada.texto).toBeDefined();
      expect(entrada.texto.es).toBeDefined();
      expect(typeof entrada.texto.es).toBe("string");
      expect(entrada.texto.es.trim().length).toBeGreaterThan(10);

      expect(entrada.texto.en).toBeDefined();
      expect(typeof entrada.texto.en).toBe("string");
      expect(entrada.texto.en.trim().length).toBeGreaterThan(10);
    }
  });

  it("verifica que no hay URLs inventadas (solo lista blanca oficial NASA o null)", () => {
    const DOMINIOS_PERMITIDOS = [
      "https://www.nasa.gov",
      "http://www.nasa.gov",
    ];

    for (const entrada of entradas) {
      if (entrada.fuente !== null) {
        expect(entrada.fuente).toHaveProperty("nombre");
        expect(entrada.fuente).toHaveProperty("url");
        expect(typeof entrada.fuente.url).toBe("string");

        const esUrlPermitida = DOMINIOS_PERMITIDOS.some((dominio) =>
          entrada.fuente!.url.startsWith(dominio),
        );
        expect(esUrlPermitida).toBe(true);
      }
    }
  });

  it("verifica que las entradas con fuente: null están listadas en docs/pendientes-fuentes.md", () => {
    // Ruta al archivo de pendientes en la raíz del repositorio
    const rutaPendientes = path.resolve(__dirname, "../../../../docs/pendientes-fuentes.md");
    expect(fs.existsSync(rutaPendientes)).toBe(true);

    const contenidoPendientes = fs.readFileSync(rutaPendientes, "utf-8");

    const entradasSinFuente = entradas.filter((e) => e.fuente === null);
    expect(entradasSinFuente.length).toBeGreaterThanOrEqual(4);

    for (const sinFuente of entradasSinFuente) {
      expect(
        contenidoPendientes.includes(sinFuente.id),
        `La entrada sin fuente ${sinFuente.id} debe estar documentada en docs/pendientes-fuentes.md`,
      ).toBe(true);
    }
  });
});
