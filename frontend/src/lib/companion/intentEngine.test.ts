import { describe, it, expect } from "vitest";
import {
  detectarIntencion,
  CompanionSession,
  normalizarTexto,
  removerWakeWord,
  type CompanionIntent,
} from "./intentEngine";
import { createMockDatabase } from "@/data/db/seed";
import { selectCompanionData } from "@/data/companion/companionData";

describe("Analizador de Intenciones ASTRA (intentEngine)", () => {
  const db = createMockDatabase();
  const dataElena = selectCompanionData(db, "01");

  // 1. Tabla de pruebas con al menos 40 frases reales
  const CASOS_PRUEBA: Array<{ frase: string; intentEsperado: CompanionIntent }> = [
    // Emergencia (prioridad y variantes)
    { frase: "¡hay fuego en el modulo de habitacion!", intentEsperado: "emergencia" },
    { frase: "veo humo saliendo del panel electrico", intentEsperado: "emergencia" },
    { frase: "alarma de despresurizacion activada", intentEsperado: "emergencia" },
    { frase: "tenemos una fuga en la esclusa", intentEsperado: "emergencia" },
    { frase: "auxilio no puedo respirar bien", intentEsperado: "emergencia" },
    { frase: "socorro se rompio la escotilla", intentEsperado: "emergencia" },
    { frase: "astra me ahogo", intentEsperado: "emergencia" },
    { frase: "hay fuego en la cabina y quiero comer", intentEsperado: "emergencia" }, // PRIORIDAD ABSOLUTA

    // Ejercicio (con erratas y wake words)
    { frase: "astra que ejercicio me toca hoy", intentEsperado: "ejercicio" },
    { frase: "quiero entrenar un rato", intentEsperado: "ejercicio" },
    { frase: "toca la rutina ared", intentEsperado: "ejercicio" },
    { frase: "como uso la cinta t2 o el cevis", intentEsperado: "ejercicio" },
    { frase: "necesito estirar la espalda", intentEsperado: "ejercicio" },
    { frase: "ejersicio para descompresion", intentEsperado: "ejercicio" }, // errata Levenshtein
    { frase: "oye astra que pesas puedo levantar", intentEsperado: "ejercicio" },
    { frase: "actividad fisica recomendada", intentEsperado: "ejercicio" },

    // Comer y Nutrición
    { frase: "¿a que hora debo comer?", intentEsperado: "comer" },
    { frase: "tengo mucha hambre astra", intentEsperado: "comer" },
    { frase: "cual es mi racion de almuerzo", intentEsperado: "comer" },
    { frase: "cuando es la proxima colacion", intentEsperado: "comer" },
    { frase: "cuantas calorias debo ingerir", intentEsperado: "comer" },
    { frase: "comida espacial disponible", intentEsperado: "comer" },

    // Hidratación
    { frase: "tengo sed necesito agua", intentEsperado: "hidratacion" },
    { frase: "cuantos electrolitos debo beber", intentEsperado: "hidratacion" },
    { frase: "tengo que hidratar el cuerpo", intentEsperado: "hidratacion" },
    { frase: "cuanto liquido he tomado hoy", intentEsperado: "hidratacion" },

    // Presión arterial
    { frase: "¿como me tomo la presion?", intentEsperado: "presion" },
    { frase: "donde pongo el manguito del tensiometro", intentEsperado: "presion" },
    { frase: "protocolo med-01 para tension", intentEsperado: "presion" },
    { frase: "presionn sistolica muy alta", intentEsperado: "presion" }, // errata Levenshtein
    { frase: "astra cuando medir mi presion arterial", intentEsperado: "presion" },

    // Soledad y Estado de Ánimo
    { frase: "me siento muy solo en la estacion", intentEsperado: "soledad" },
    { frase: "tengo un bajon animico hoy", intentEsperado: "soledad" },
    { frase: "estoy triste y extrano la tierra", intentEsperado: "soledad" },
    { frase: "el aislamiento me esta pesando", intentEsperado: "soledad" },
    { frase: "estoy desanimado sin ganas de nada", intentEsperado: "soledad" },

    // Familia
    { frase: "quiero llamar a mi familia", intentEsperado: "familia" },
    { frase: "como hablar a casa con mis hijos", intentEsperado: "familia" },
    { frase: "cuanto tarda el mensaje a tierra", intentEsperado: "familia" },
    { frase: "videoconferencia con mi pareja", intentEsperado: "familia" },

    // Dormir y Descanso
    { frase: "no puedo dormir tengo insomnio", intentEsperado: "dormir" },
    { frase: "estoy muy cansado astra", intentEsperado: "dormir" },
    { frase: "¿puedo tomar una siesta corta?", intentEsperado: "dormir" },
    { frase: "como apago la luz azul de cabina", intentEsperado: "dormir" },
    { frase: "donde deje mi antifaz para descansar", intentEsperado: "dormir" },

    // Bitácora
    { frase: "quiero registrar en la bitacora", intentEsperado: "bitacora" },
    { frase: "abrir mi diario de viaje", intentEsperado: "bitacora" },
    { frase: "anotar como me siento hoy", intentEsperado: "bitacora" },

    // Estado / Semáforo
    { frase: "como estoy de salud", intentEsperado: "estado" },
    { frase: "dame el reporte de mi semaforo", intentEsperado: "estado" },
    { frase: "resumen de signos vitales astra", intentEsperado: "estado" },
    { frase: "como voy hoy", intentEsperado: "estado" },

    // Ayuda
    { frase: "que puedes hacer astra", intentEsperado: "ayuda" },
    { frase: "cuales son tus comandos de ayuda", intentEsperado: "ayuda" },
  ];

  it("evalúa correctamente las 40+ frases de la tabla de pruebas", () => {
    expect(CASOS_PRUEBA.length).toBeGreaterThanOrEqual(40);

    for (const caso of CASOS_PRUEBA) {
      const resolucion = detectarIntencion(caso.frase);
      expect(
        resolucion.intent,
        `Frase fallida: "${caso.frase}" -> se esperaba ${caso.intentEsperado}, se obtuvo ${resolucion.intent}`,
      ).toBe(caso.intentEsperado);
    }
  });

  it("prioridad absoluta: detecta emergencia aunque haya palabras de comida u otras intenciones", () => {
    const frase = "hay fuego en la cabina y quiero comer";
    const resolucion = detectarIntencion(frase);
    expect(resolucion.intent).toBe("emergencia");
    expect(resolucion.esEmergencia).toBe(true);

    const session = new CompanionSession();
    const respuesta = session.responder(frase, dataElena, "es");
    expect(respuesta.intent).toBe("emergencia");
    expect(respuesta.esEmergencia).toBe(true);
    expect(respuesta.text).toContain("Avisa ahora a la tripulación");
    expect(respuesta.accionSugerida).toBe("open_emergency_modal");
  });

  it("gestiona la memoria de contexto para preguntas de seguimiento ('otro', 'más')", () => {
    const session = new CompanionSession();

    // 1. Primera pregunta: Ejercicio
    const r1 = session.responder("que ejercicio hago", dataElena, "es");
    expect(r1.intent).toBe("ejercicio");

    // 2. Seguimiento: "otro"
    const r2 = session.responder("dame otro", dataElena, "es");
    expect(r2.intent).toBe("ejercicio"); // Recuerda la intención previa
    expect(r2.text).not.toBe(r1.text); // Ofrece una variante distinta

    // 3. Seguimiento: "más"
    const r3 = session.responder("que mas", dataElena, "es");
    expect(r3.intent).toBe("ejercicio");
  });

  it("genera respuestas en el idioma seleccionado (es / en)", () => {
    const session = new CompanionSession();

    const respEs = session.responder("como estoy de salud", dataElena, "es");
    expect(respEs.text).toContain("semáforo");
    expect(respEs.text).toContain("Nivel");

    const respEn = session.responder("how is my health", dataElena, "en");
    expect(respEn.text).toContain("semaphore");
    expect(respEn.text).toContain("Level");
  });

  it("normaliza texto y quita wake words correctamente", () => {
    expect(normalizarTexto("¡Hola, ASTRA! ¿CÓMO ESTÁS?")).toBe("hola astra como estas");
    expect(removerWakeWord("oye astra quiero comer")).toBe("quiero comer");
    expect(removerWakeWord("que ejercicio hago astra")).toBe("que ejercicio hago");
  });
});
