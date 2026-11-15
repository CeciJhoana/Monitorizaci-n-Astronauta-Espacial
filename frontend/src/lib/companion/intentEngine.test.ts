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
    // Saludos (bilingüe, con y sin acento, mayúsculas, signos)
    { frase: "hola", intentEsperado: "saludo" },
    { frase: "hello", intentEsperado: "saludo" },
    { frase: "hi", intentEsperado: "saludo" },
    { frase: "ola", intentEsperado: "saludo" },
    { frase: "buenas", intentEsperado: "saludo" },
    { frase: "buenos dias", intentEsperado: "saludo" },
    { frase: "¡buenos días!", intentEsperado: "saludo" },
    { frase: "buenas tardes", intentEsperado: "saludo" },
    { frase: "buenas noches", intentEsperado: "saludo" },
    { frase: "hey", intentEsperado: "saludo" },
    { frase: "good morning", intentEsperado: "saludo" },
    { frase: "astra", intentEsperado: "saludo" },
    { frase: "oye astra", intentEsperado: "saludo" },
    { frase: "¡Hola ASTRA!", intentEsperado: "saludo" },
    { frase: "HELLO", intentEsperado: "saludo" },

    // Dolor (bilingüe, palabra suelta, mayúsculas, signos)
    { frase: "me duele", intentEsperado: "dolor" },
    { frase: "dolor", intentEsperado: "dolor" },
    { frase: "duele", intentEsperado: "dolor" },
    { frase: "pain", intentEsperado: "dolor" },
    { frase: "hurts", intentEsperado: "dolor" },
    { frase: "ache", intentEsperado: "dolor" },
    { frase: "¡ME DUELE!", intentEsperado: "dolor" },
    { frase: "siento mucho dolor", intentEsperado: "dolor" },

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
    { frase: "ejercicio", intentEsperado: "ejercicio" },
    { frase: "astra que ejercicio me toca hoy", intentEsperado: "ejercicio" },
    { frase: "quiero entrenar un rato", intentEsperado: "ejercicio" },
    { frase: "toca la rutina ared", intentEsperado: "ejercicio" },
    { frase: "como uso la cinta t2 o el cevis", intentEsperado: "ejercicio" },
    { frase: "necesito estirar la espalda", intentEsperado: "ejercicio" },
    { frase: "ejersicio para descompresion", intentEsperado: "ejercicio" }, // errata Levenshtein
    { frase: "oye astra que pesas puedo levantar", intentEsperado: "ejercicio" },
    { frase: "actividad fisica recomendada", intentEsperado: "ejercicio" },

    // Comer y Nutrición
    { frase: "comer", intentEsperado: "comer" },
    { frase: "¿a que hora debo comer?", intentEsperado: "comer" },
    { frase: "tengo mucha hambre astra", intentEsperado: "comer" },
    { frase: "cual es mi racion de almuerzo", intentEsperado: "comer" },
    { frase: "cuando es la proxima colacion", intentEsperado: "comer" },
    { frase: "cuantas calorias debo ingerir", intentEsperado: "comer" },
    { frase: "comida espacial disponible", intentEsperado: "comer" },

    // Hidratación
    { frase: "agua", intentEsperado: "hidratacion" },
    { frase: "tengo sed necesito agua", intentEsperado: "hidratacion" },
    { frase: "cuantos electrolitos debo beber", intentEsperado: "hidratacion" },
    { frase: "tengo que hidratar el cuerpo", intentEsperado: "hidratacion" },
    { frase: "cuanto liquido he tomado hoy", intentEsperado: "hidratacion" },

    // Presión arterial
    { frase: "presion", intentEsperado: "presion" },
    { frase: "¿como me tomo la presion?", intentEsperado: "presion" },
    { frase: "donde pongo el manguito del tensiometro", intentEsperado: "presion" },
    { frase: "protocolo med-01 para tension", intentEsperado: "presion" },
    { frase: "presionn sistolica muy alta", intentEsperado: "presion" }, // errata Levenshtein
    { frase: "astra cuando medir mi presion arterial", intentEsperado: "presion" },

    // Soledad y Estado de Ánimo
    { frase: "soledad", intentEsperado: "soledad" },
    { frase: "me siento solo", intentEsperado: "soledad" },
    { frase: "me siento sola", intentEsperado: "soledad" },
    { frase: "estoy triste", intentEsperado: "soledad" },
    { frase: "extraño", intentEsperado: "soledad" },
    { frase: "lonely", intentEsperado: "soledad" },
    { frase: "homesick", intentEsperado: "soledad" },
    { frase: "me siento muy solo en la estacion", intentEsperado: "soledad" },
    { frase: "tengo un bajon animico hoy", intentEsperado: "soledad" },
    { frase: "estoy triste y extrano la tierra", intentEsperado: "soledad" },
    { frase: "el aislamiento me esta pesando", intentEsperado: "soledad" },
    { frase: "estoy desanimado sin ganas de nada", intentEsperado: "soledad" },

    // Familia
    { frase: "familia", intentEsperado: "familia" },
    { frase: "quiero llamar a mi familia", intentEsperado: "familia" },
    { frase: "como hablar a casa con mis hijos", intentEsperado: "familia" },
    { frase: "cuanto tarda el mensaje a tierra", intentEsperado: "familia" },
    { frase: "videoconferencia con mi pareja", intentEsperado: "familia" },

    // Dormir y Descanso
    { frase: "dormir", intentEsperado: "dormir" },
    { frase: "no puedo dormir tengo insomnio", intentEsperado: "dormir" },
    { frase: "estoy muy cansado astra", intentEsperado: "dormir" },
    { frase: "¿puedo tomar una siesta corta?", intentEsperado: "dormir" },
    { frase: "como apago la luz azul de cabina", intentEsperado: "dormir" },
    { frase: "donde deje mi antifaz para descansar", intentEsperado: "dormir" },

    // Bitácora
    { frase: "bitacora", intentEsperado: "bitacora" },
    { frase: "quiero registrar en la bitacora", intentEsperado: "bitacora" },
    { frase: "abrir mi diario de viaje", intentEsperado: "bitacora" },
    { frase: "anotar como me siento hoy", intentEsperado: "bitacora" },

    // Estado / Semáforo
    { frase: "estado", intentEsperado: "estado" },
    { frase: "como estoy de salud", intentEsperado: "estado" },
    { frase: "dame el reporte de mi semaforo", intentEsperado: "estado" },
    { frase: "resumen de signos vitales astra", intentEsperado: "estado" },
    { frase: "como voy hoy", intentEsperado: "estado" },

    // Ayuda
    { frase: "ayuda", intentEsperado: "ayuda" },
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

  it("reconoce saludos (hola, hello, astra) y responde con el nombre activo y '¿Cómo te sientes hoy?'", () => {
    const session = new CompanionSession();

    const rEs = session.responder("hola", dataElena, "es");
    expect(rEs.intent).toBe("saludo");
    expect(rEs.text).toContain(dataElena.nombreTripulante);
    expect(rEs.text).toContain("¿Cómo te sientes hoy?");
    expect(rEs.speechText).toContain("¿Cómo te sientes hoy?");

    const rEn = session.responder("hello", dataElena, "en");
    expect(rEn.intent).toBe("saludo");
    expect(rEn.text).toContain(dataElena.nombreTripulante);
    expect(rEn.text).toContain("How are you feeling today?");

    const rAstra = session.responder("astra", dataElena, "es");
    expect(rAstra.intent).toBe("saludo");
  });

  it("maneja el flujo de dolor en 2 pasos: pregunta severidad y zona, escalando a emergencia si es pecho/aire", () => {
    const session = new CompanionSession();

    // Paso 1: Usuario dice "me duele"
    const r1 = session.responder("me duele", dataElena, "es");
    expect(r1.intent).toBe("dolor");
    expect(r1.text).toContain("¿Dónde te duele y qué tan fuerte es del 1 al 10?");
    expect(r1.text).toContain("pecho");

    // Paso 2: Usuario responde "el pecho"
    const r2 = session.responder("el pecho", dataElena, "es");
    expect(r2.intent).toBe("emergencia");
    expect(r2.esEmergencia).toBe(true);
    expect(r2.accionSugerida).toBe("open_emergency_modal");
    expect(r2.speechText).toBe("Avisa ahora a la tripulación por el canal de emergencia.");
  });

  it("maneja el flujo de dolor en 2 pasos: aconseja al médico de vuelo y bitácora si es cabeza/espalda", () => {
    const session = new CompanionSession();

    // Paso 1: Usuario dice "me duele"
    const r1 = session.responder("me duele", dataElena, "es");
    expect(r1.intent).toBe("dolor");

    // Paso 2: Usuario responde "la cabeza"
    const r2 = session.responder("la cabeza", dataElena, "es");
    expect(r2.intent).toBe("dolor");
    expect(r2.esEmergencia).toBe(false);
    expect(r2.accionSugerida).toBe("open_journal");
    expect(r2.text).toContain("oficial médico de vuelo");
    expect(r2.text).toContain("Por validar con fuentes oficiales de la NASA");
    expect(r2.speechText).toContain("oficial médico de vuelo");
  });

  it("detecta dolor agudo en pecho desde la primera frase como emergencia directa", () => {
    const session = new CompanionSession();
    const r = session.responder("me duele el pecho y me cuesta respirar", dataElena, "es");
    expect(r.intent).toBe("emergencia");
    expect(r.esEmergencia).toBe(true);
    expect(r.accionSugerida).toBe("open_emergency_modal");
  });

  it("detecta dolor de cabeza desde la primera frase aconsejando médico de vuelo y bitácora", () => {
    const session = new CompanionSession();
    const r = session.responder("me duele la cabeza", dataElena, "es");
    expect(r.intent).toBe("dolor");
    expect(r.esEmergencia).toBe(false);
    expect(r.accionSugerida).toBe("open_journal");
    expect(r.text).toContain("oficial médico de vuelo");
  });

  it("ofrece apoyo emocional con 3 opciones empáticas ante soledad sin tecnicismos", () => {
    const session = new CompanionSession();
    const r = session.responder("me siento solo", dataElena, "es");
    expect(r.intent).toBe("soledad");
    expect(r.text).toContain("Estoy aquí contigo");
    expect(r.text).toContain("bitácora");
    expect(r.text).toContain("respiración guiada");
    expect(r.text).toContain("canal de comunicación familiar");
    expect(r.speechText).not.toContain("tono vagal");
    expect(r.text).not.toContain("tono vagal");
  });

  it("fallback amigable para intenciones desconocidas con 3 opciones claras", () => {
    const session = new CompanionSession();
    const r = session.responder("blabla xkcd 999", dataElena, "es");
    expect(r.intent).toBe("desconocido");
    expect(r.text).toContain("Estoy aquí para acompañarte");
    expect(r.text).toContain("revisar tu estado");
    expect(r.text).toContain("planear tu ejercicio");
    expect(r.text).toContain("registrar tu bitácora");
    expect(r.text).not.toContain("no pude comprender");
  });

  it("reconoce palabras clave sueltas exactas (comer, dormir, bitacora, dolor, hola) con confianza alta", () => {
    const palabras = ["comer", "dormir", "bitacora", "dolor", "hola", "presion", "ejercicio"];
    for (const p of palabras) {
      const res = detectarIntencion(p);
      expect(res.intent).not.toBe("desconocido");
      expect(res.confidence).toBeGreaterThanOrEqual(0.75);
    }
  });
});
