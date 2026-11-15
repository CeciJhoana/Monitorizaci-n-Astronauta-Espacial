/**
 * intentEngine.ts — Analizador de intenciones determinista para ASTRA.
 *
 * Sin dependencias de red ni modelos de lenguaje.
 * Basado en normalización de texto, palabras clave, tolerancia Levenshtein <= 1,
 * memoria de contexto y prioridad absoluta para emergencias.
 */

import knowledgeData from "@/data/companion/knowledge.json";
import type { CompanionData } from "@/data/companion/companionData";
import { evaluateBehavior } from "@/lib/companion/companionEngine";

export type CompanionIntent =
  | "emergencia"
  | "saludo"
  | "dolor"
  | "ejercicio"
  | "comer"
  | "hidratacion"
  | "presion"
  | "soledad"
  | "familia"
  | "dormir"
  | "bitacora"
  | "estado"
  | "ayuda"
  | "seguimiento"
  | "desconocido";

export interface IntentResolution {
  intent: CompanionIntent;
  confidence: number;
  tokensDetectados: string[];
  esEmergencia: boolean;
}

export interface CompanionResponse {
  intent: CompanionIntent;
  confidence?: number;
  tokensDetectados?: string[];
  text: string;
  speechText: string;
  esEmergencia: boolean;
  accionSugerida?: string;
  fuenteNombre?: string | null;
  fuenteUrl?: string | null;
}

/* -------------------------------------------------------------------------- */
/* Normalización y Distancia Levenshtein                                      */
/* -------------------------------------------------------------------------- */

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes y diacríticos
    .replace(/[^a-z0-9\s]/g, " ") // Quitar signos de puntuación
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Quita palabras de activación como "astra", "oye astra", "hey astra".
 */
export function removerWakeWord(texto: string): string {
  const norm = normalizarTexto(texto);
  return norm
    .replace(/\b(oye astra|hey astra|ok astra|astra)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos cadenas cortas.
 */
export function distanciaLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 1) return 2; // Optimización rápida

  const la = a.length;
  const lb = b.length;
  const matriz: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));

  for (let i = 0; i <= la; i++) matriz[i][0] = i;
  for (let j = 0; j <= lb; j++) matriz[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const coste = a[i - 1] === b[j - 1] ? 0 : 1;
      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1, // eliminación
        matriz[i][j - 1] + 1, // inserción
        matriz[i - 1][j - 1] + coste, // sustitución
      );
    }
  }

  return matriz[la][lb];
}

/* -------------------------------------------------------------------------- */
/* Diccionario de Palabras Clave y Sinónimos                                   */
/* -------------------------------------------------------------------------- */

const DICCIONARIO_INTENCIONES: Record<Exclude<CompanionIntent, "desconocido">, string[]> = {
  emergencia: [
    "fuego", "humo", "despresurizacion", "fuga", "toxico", "auxilio",
    "socorro", "me ahogo", "no puedo respirar", "emergencia", "alarma",
    "incendio", "asfixia", "brecha", "critico", "peligro", "evacuar",
    "fire", "smoke", "depressurization", "leak", "toxic", "mayday",
    "suffocating", "emergency", "alarm", "breach",
  ],
  saludo: [
    "hola", "ola", "buenas", "buenos dias", "buenas tardes", "buenas noches",
    "hey", "hello", "hi", "good morning", "good afternoon", "good evening",
    "astra", "saludos", "que tal", "buen dia", "saludo",
  ],
  dolor: [
    "me duele", "dolor", "duele", "pain", "hurts", "ache", "lastima",
    "molestia", "dolencia", "me lastima", "tengo dolor", "siento dolor",
    "doloroso", "sore", "hurting",
  ],
  ejercicio: [
    "ejercicio", "entrenar", "entrenamiento", "rutina", "ared", "t2",
    "cevis", "cardio", "pesas", "estirar", "estiramiento", "elongar",
    "actividad fisica", "musculo", "muscular", "fuerza",
    "huesos", "densidad osea", "ley de wolff", "calistenia", "wolff",
    "gamificacion", "puntos", "xp", "flexibilidad", "descompresion", "columna",
    "exercise", "workout", "training", "stretching", "stretch", "bones", "bone density", "spine",
  ],
  comer: [
    "comer", "comida", "hambre", "almuerzo", "cena", "desayuno",
    "racion", "colacion", "calorias", "nutricion", "merendar", "alimento",
    "eat", "food", "hungry", "lunch", "dinner", "breakfast", "meal", "snack",
  ],
  hidratacion: [
    "agua", "sed", "beber", "hidratar", "hidratacion", "electrolitos",
    "liquido", "tomar agua",
    "water", "thirst", "drink", "hydrate", "hydration", "electrolytes",
  ],
  presion: [
    "presion", "tension", "tensiometro", "med 01", "med01", "sistolica",
    "diastolica", "manguito", "arterial", "tomar presion",
    "pressure", "blood pressure", "bp", "cuff", "systolic", "diastolic",
  ],
  soledad: [
    "solo", "sola", "soledad", "extrano", "triste", "desanimado",
    "bajon", "aislar", "aislado", "aislada", "aislamiento", "encerrado", "deprimido",
    "sin ganas", "nostalgia", "angustia", "confinamiento",
    "me siento solo", "me siento sola", "estoy triste", "estoy solo", "estoy sola",
    "lonely", "alone", "isolation", "isolated", "sad", "down", "depressed",
    "homesick", "feeling down", "feeling alone",
  ],
  familia: [
    "familia", "llamada", "hablar a casa", "tierra", "mensaje",
    "hijos", "pareja", "casa", "videoconferencia", "comunicar con casa",
    "llamar a casa", "contacto familiar",
    "family", "call home", "earth", "message", "kids", "partner", "home",
  ],
  dormir: [
    "dormir", "sueno", "insomnio", "descansar", "descanso", "cansado",
    "cansada", "siesta", "luz azul", "despertar", "antifaz", "reloj biologico",
    "sleep", "rest", "insomnia", "tired", "nap", "blue light", "eyemask",
  ],
  bitacora: [
    "bitacora", "diario", "registrar animo", "como me siento",
    "anotar", "escribir", "journal", "registro personal",
    "diary", "log", "write", "record mood",
  ],
  estado: [
    "estado", "como estoy", "salud", "semaforo", "reporte",
    "resumen", "como voy", "signos", "vitales", "evaluacion",
    "status", "how am i", "health", "semaphore", "vitals",
  ],
  ayuda: [
    "ayuda", "que puedes hacer", "opciones", "comandos", "funciones",
    "que sabes hacer", "menu", "instrucciones",
    "help", "what can you do", "commands", "options", "features",
  ],
  seguimiento: [
    "otro", "otra", "mas", "que mas", "repite", "repetir",
    "no me gusta esa", "siguiente", "dame otra", "cambia",
    "another", "more", "repeat", "next", "different",
  ],
};

/**
 * Comprueba si una palabra objetivo o una variante con Levenshtein <= 1 existe en los tokens.
 */
function coincidePalabra(token: string, palabraClave: string): boolean {
  if (token === palabraClave) return true;
  // Solo aplicar Levenshtein si la palabra tiene 5 o más letras
  if (palabraClave.length >= 5 && token.length >= 4) {
    return distanciaLevenshtein(token, palabraClave) <= 1;
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Reconocimiento de Intención                                                */
/* -------------------------------------------------------------------------- */

export function detectarIntencion(
  textoOriginal: string,
  ultimaIntencionValida?: CompanionIntent,
): IntentResolution {
  const textoNorm = normalizarTexto(textoOriginal);
  if (!textoNorm) {
    return {
      intent: "desconocido",
      confidence: 0,
      tokensDetectados: [],
      esEmergencia: false,
    };
  }

  // Detección directa de saludo si solo nombró a ASTRA o un saludo directo
  if (
    textoNorm === "astra" ||
    textoNorm === "oye astra" ||
    textoNorm === "hey astra" ||
    textoNorm === "ok astra" ||
    textoNorm === "hola astra" ||
    textoNorm === "hello astra"
  ) {
    return {
      intent: "saludo",
      confidence: 1.0,
      tokensDetectados: [textoNorm],
      esEmergencia: false,
    };
  }

  let textoLimpio = removerWakeWord(textoOriginal);
  if (!textoLimpio) {
    textoLimpio = textoNorm;
  }

  const tokens = textoLimpio.split(" ");

  // 1. PRIORIDAD ABSOLUTA: Emergencia
  const tokensEmergenciaDetectados: string[] = [];
  for (const palabraEmergencia of DICCIONARIO_INTENCIONES.emergencia) {
    if (palabraEmergencia.includes(" ")) {
      // Frase multipalabra (ej: "no puedo respirar", "me ahogo")
      if (textoLimpio.includes(palabraEmergencia)) {
        tokensEmergenciaDetectados.push(palabraEmergencia);
      }
    } else {
      for (const tok of tokens) {
        if (coincidePalabra(tok, palabraEmergencia)) {
          tokensEmergenciaDetectados.push(tok);
        }
      }
    }
  }

  if (tokensEmergenciaDetectados.length > 0) {
    return {
      intent: "emergencia",
      confidence: 1.0,
      tokensDetectados: Array.from(new Set(tokensEmergenciaDetectados)),
      esEmergencia: true,
    };
  }

  // 2. Comprobar seguimiento / repetición con contexto
  const tokensSeguimiento = DICCIONARIO_INTENCIONES.seguimiento;
  const esSeguimiento = tokens.some((tok) =>
    tokensSeguimiento.some((kw) => coincidePalabra(tok, kw)),
  ) || textoLimpio.includes("que mas") || textoLimpio.includes("no me gusta");

  if (esSeguimiento && ultimaIntencionValida && ultimaIntencionValida !== "desconocido" && ultimaIntencionValida !== "emergencia") {
    return {
      intent: "seguimiento",
      confidence: 0.9,
      tokensDetectados: ["seguimiento"],
      esEmergencia: false,
    };
  }

  // 3. Evaluar el resto de intenciones
  const intencionesRestantes: Array<Exclude<CompanionIntent, "emergencia" | "desconocido" | "seguimiento">> = [
    "saludo",
    "dolor",
    "ejercicio",
    "comer",
    "hidratacion",
    "presion",
    "soledad",
    "familia",
    "dormir",
    "bitacora",
    "estado",
    "ayuda",
  ];

  let mejorIntencion: CompanionIntent = "desconocido";
  let maxCoincidencias = 0;
  let tokensGanadores: string[] = [];

  for (const intentKey of intencionesRestantes) {
    const palabrasClave = DICCIONARIO_INTENCIONES[intentKey];
    const coincidencias: string[] = [];

    for (const kw of palabrasClave) {
      if (kw.includes(" ")) {
        if (textoLimpio.includes(kw)) {
          coincidencias.push(kw);
        }
      } else {
        for (const tok of tokens) {
          if (coincidePalabra(tok, kw)) {
            coincidencias.push(tok);
          }
        }
      }
    }

    if (coincidencias.length > maxCoincidencias) {
      maxCoincidencias = coincidencias.length;
      mejorIntencion = intentKey;
      tokensGanadores = coincidencias;
    }
  }

  if (maxCoincidencias > 0) {
    return {
      intent: mejorIntencion,
      confidence: Math.min(1.0, 0.75 + maxCoincidencias * 0.15),
      tokensDetectados: Array.from(new Set(tokensGanadores)),
      esEmergencia: false,
    };
  }

  return {
    intent: "desconocido",
    confidence: 0,
    tokensDetectados: [],
    esEmergencia: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Memoria de Contexto y Generador de Respuestas                              */
/* -------------------------------------------------------------------------- */

export class CompanionSession {
  private ultimaIntencion?: CompanionIntent;
  private indicesRecomendacion: Record<string, number> = {};
  private esperandoDetalleDolor: boolean = false;

  public getUltimaIntencion(): CompanionIntent | undefined {
    return this.ultimaIntencion;
  }

  public responder(
    textoUsuario: string,
    data: CompanionData,
    lang: "es" | "en" = "es",
  ): CompanionResponse {
    const norm = normalizarTexto(textoUsuario);

    // 1. Contexto de dolor: si en el turno previo preguntamos dónde le duele
    if (this.esperandoDetalleDolor) {
      this.esperandoDetalleDolor = false;

      // Síntomas agudos: pecho, respiración, corazón, desmayo
      const esPechoRespiracion =
        /\b(pecho|corazon|respirar|no puedo respirar|asfixia|ahogo|desmayo|mareo fuerte|chest|heart|breathe|cannot breathe|faint|dizzy)\b/i.test(
          norm,
        ) ||
        norm.includes("no puedo respirar") ||
        norm.includes("cannot breathe");

      if (esPechoRespiracion) {
        this.ultimaIntencion = "emergencia";
        const speechEs = "Avisa ahora a la tripulación por el canal de emergencia.";
        const speechEn = "Alert the crew immediately on the emergency channel.";
        const txtEs =
          "Avisa ahora a la tripulación por el canal de emergencia y activa el protocolo HAB-01. El dolor en el pecho o la dificultad respiratoria requiere asistencia médica prioritaria.";
        const txtEn =
          "Alert the crew immediately on the emergency channel and initiate protocol HAB-01. Chest pain or breathing difficulty requires immediate medical attention.";

        return {
          intent: "emergencia",
          confidence: 1.0,
          tokensDetectados: ["pecho/respiracion"],
          text: lang === "es" ? txtEs : txtEn,
          speechText: lang === "es" ? speechEs : speechEn,
          esEmergencia: true,
          accionSugerida: "open_emergency_modal",
        };
      }

      // Dolor común / muscular / cefalea / abdominal
      const esDolorComun =
        /\b(cabeza|espalda|musculo|muscular|estomago|cuello|brazo|pierna|hombro|articulacion|head|headache|back|muscle|stomach|neck|arm|leg)\b/i.test(
          norm,
        );

      if (esDolorComun) {
        this.ultimaIntencion = "dolor";
        const speechEs =
          "Te aconsejo informar al oficial médico de vuelo. ¿Deseas que registremos este síntoma en tu bitácora personal?";
        const speechEn =
          "I advise informing the flight medical officer. Would you like to log this symptom in your personal journal?";
        const txtEs =
          "Te aconsejo informar al oficial médico de vuelo para una revisión preventiva. ¿Deseas que registremos este síntoma en tu bitácora personal? · Por validar con fuentes oficiales de la NASA · No es un diagnóstico médico ni prescripción.";
        const txtEn =
          "I advise informing the flight medical officer for a preventive check. Would you like to log this symptom in your personal journal? · To be validated with official NASA sources · Not a medical diagnosis or prescription.";

        return {
          intent: "dolor",
          confidence: 0.95,
          tokensDetectados: ["dolor-comun"],
          text: lang === "es" ? txtEs : txtEn,
          speechText: lang === "es" ? speechEs : speechEn,
          esEmergencia: false,
          accionSugerida: "open_journal",
        };
      }
    }

    let resolucion = detectarIntencion(textoUsuario, this.ultimaIntencion);

    let intencionFinal = resolucion.intent;
    if (intencionFinal === "seguimiento" && this.ultimaIntencion) {
      intencionFinal = this.ultimaIntencion;
    }

    // 2. Manejo de intención "dolor" reportada de inicio
    if (intencionFinal === "dolor") {
      // ¿El usuario ya especificó dolor en el pecho o ahogo en la misma frase?
      const esPechoRespiracionDirecto =
        /\b(pecho|corazon|respirar|no puedo respirar|asfixia|chest|heart|breathe)\b/i.test(norm) ||
        norm.includes("no puedo respirar") ||
        norm.includes("cannot breathe");

      if (esPechoRespiracionDirecto) {
        this.ultimaIntencion = "emergencia";
        const speechEs = "Avisa ahora a la tripulación por el canal de emergencia.";
        const speechEn = "Alert the crew immediately on the emergency channel.";
        const txtEs =
          "Avisa ahora a la tripulación por el canal de emergencia y activa el protocolo HAB-01. El dolor en el pecho o la falta de aire requiere asistencia médica prioritaria.";
        const txtEn =
          "Alert the crew immediately on the emergency channel and initiate protocol HAB-01. Chest pain or shortness of breath requires immediate medical assistance.";

        return {
          intent: "emergencia",
          confidence: 1.0,
          tokensDetectados: ["pecho", "dolor"],
          text: lang === "es" ? txtEs : txtEn,
          speechText: lang === "es" ? speechEs : speechEn,
          esEmergencia: true,
          accionSugerida: "open_emergency_modal",
        };
      }

      // ¿El usuario ya especificó zona común (ej: "me duele la cabeza")?
      const esDolorComunDirecto =
        /\b(cabeza|espalda|musculo|muscular|estomago|cuello|brazo|pierna|head|headache|back|muscle|stomach)\b/i.test(
          norm,
        );

      if (esDolorComunDirecto) {
        this.ultimaIntencion = "dolor";
        const speechEs =
          "Te aconsejo informar al oficial médico de vuelo. ¿Deseas que registremos este síntoma en tu bitácora personal?";
        const speechEn =
          "I advise informing the flight medical officer. Would you like to log this symptom in your personal journal?";
        const txtEs =
          "Te aconsejo informar al oficial médico de vuelo para una revisión preventiva. ¿Deseas que registremos este síntoma en tu bitácora personal? · Por validar con fuentes oficiales de la NASA · No es un diagnóstico médico ni prescripción.";
        const txtEn =
          "I advise informing the flight medical officer for a preventive check. Would you like to log this symptom in your personal journal? · To be validated with official NASA sources · Not a medical diagnosis or prescription.";

        return {
          intent: "dolor",
          confidence: 0.95,
          tokensDetectados: ["dolor"],
          text: lang === "es" ? txtEs : txtEn,
          speechText: lang === "es" ? speechEs : speechEn,
          esEmergencia: false,
          accionSugerida: "open_journal",
        };
      }

      // Dolor general sin especificar zona: preguntar y esperar detalle en la siguiente frase
      this.esperandoDetalleDolor = true;
      this.ultimaIntencion = "dolor";
    } else if (intencionFinal !== "desconocido" && intencionFinal !== "seguimiento") {
      this.ultimaIntencion = intencionFinal;
    }

    const indiceActual = this.indicesRecomendacion[intencionFinal] ?? 0;
    this.indicesRecomendacion[intencionFinal] = indiceActual + 1;

    const resp = generarRespuesta(intencionFinal, data, lang, indiceActual);
    return {
      ...resp,
      confidence: resolucion.confidence,
      tokensDetectados: resolucion.tokensDetectados,
    };
  }
}

/**
 * Genera una respuesta concisa, cálida y determinista,
 * separando la locución hablada breve (máximo 2 oraciones cotidianas)
 * del texto visual con detalles completos y fuentes.
 */
export function generarRespuesta(
  intent: CompanionIntent,
  data: CompanionData,
  lang: "es" | "en",
  varianteIndice: number = 0,
): CompanionResponse {
  const entradas = knowledgeData.entradas as Array<{
    id: string;
    categoria: string;
    subcategoria: string;
    texto: { es: string; en: string };
    texto_hablado?: { es: string; en: string };
    duracion_min: number | null;
    fuente: { nombre: string; url: string } | null;
  }>;

  switch (intent) {
    case "saludo": {
      const nombre = data.nombreTripulante || "Astronauta";
      const textoEs = `¡Hola ${nombre}! ¿Cómo te sientes hoy?`;
      const speechEs = `Hola ${nombre}. ¿Cómo te sientes hoy?`;
      const textoEn = `Hello ${nombre}! How are you feeling today?`;
      const speechEn = `Hello ${nombre}. How are you feeling today?`;

      return {
        intent: "saludo",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
      };
    }

    case "dolor": {
      const textoEs =
        "¿Dónde te duele y qué tan fuerte es del 1 al 10? Recuerda que si el dolor es en el pecho o sientes falta de aire, debes avisar de inmediato a la tripulación.";
      const speechEs =
        "¿Dónde te duele y qué tan fuerte es del 1 al 10? Recuerda que si es en el pecho o falta de aire, debes avisar ya a la tripulación.";
      const textoEn =
        "Where does it hurt and how strong is it from 1 to 10? Remember that if the pain is in your chest or you feel short of breath, alert the crew immediately.";
      const speechEn =
        "Where does it hurt and how strong is it from 1 to 10? If the pain is in your chest or shortness of breath, alert the crew immediately.";

      return {
        intent: "dolor",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
      };
    }

    case "emergencia": {
      const textoEs =
        "Avisa ahora a la tripulación por el canal de emergencia y activa el protocolo HAB-01. No uses este asistente para emergencias críticas ni intentes resolver contingencias solo.";
      const speechEs = "Avisa ahora a la tripulación por el canal de emergencia.";
      const textoEn =
        "Alert the crew immediately on the emergency channel and initiate protocol HAB-01. Do not rely on this companion for critical emergencies or attempt solo intervention.";
      const speechEn = "Alert the crew immediately on the emergency channel.";

      return {
        intent: "emergencia",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: true,
        accionSugerida: "open_emergency_modal",
        fuenteNombre: "NASA ISS Emergency Operations Procedures",
        fuenteUrl: "https://www.nasa.gov/hrp",
      };
    }

    case "estado": {
      const evaluacion = evaluateBehavior(data, lang);
      const minutosHoy = data.actividad_min ?? 0;
      const sueno = data.sueno_horas ?? 0;

      let textoEs = `Tu semáforo actual está en Nivel ${evaluacion.nivel} (${evaluacion.etiqueta}). ${evaluacion.que_hacer} Registras ${sueno} h de descanso y ${minutosHoy} min de ejercicio hoy.`;
      let speechEs = `Tu semáforo está en Nivel ${evaluacion.nivel}, ${evaluacion.etiqueta}. ${evaluacion.que_hacer}`;
      let textoEn = `Your semaphore is currently at Level ${evaluacion.nivel} (${evaluacion.etiqueta}). ${evaluacion.que_hacer} You have logged ${sueno} h of sleep and ${minutosHoy} min of exercise today.`;
      let speechEn = `Your semaphore is currently at Level ${evaluacion.nivel}, ${evaluacion.etiqueta}. ${evaluacion.que_hacer}`;

      if (evaluacion.avisos_agudos.length > 0) {
        const aviso = evaluacion.avisos_agudos[0];
        textoEs += ` ¡Atención: ${aviso.titulo}!`;
        speechEs += ` Atención: ${aviso.titulo}.`;
        textoEn += ` Warning: ${aviso.titulo}!`;
        speechEn += ` Warning: ${aviso.titulo}.`;
      }

      return {
        intent: "estado",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        accionSugerida: "view_vitals",
      };
    }

    case "ejercicio": {
      const candidatos = entradas.filter((e) => e.categoria === "ejercicio");
      const seleccionada = candidatos[varianteIndice % candidatos.length];
      const minutos = data.actividad_min ?? 0;

      const textoEs = `Llevas ${minutos} minutos de actividad hoy. ${seleccionada.texto.es} Accede a tu centro de gamificación de contramedidas (Ley de Wolff) para sumar puntos y registrar estiramientos.`;
      const speechEs =
        seleccionada.texto_hablado?.es ??
        `Abriendo tu centro de entrenamiento y gamificación. El ejercicio con carga estimula tus huesos según la Ley de Wolff. ¡Vamos a ganar puntos de misión!`;

      const textoEn = `You have logged ${minutos} minutes of activity today. ${seleccionada.texto.en} Access your countermeasures gamification hub (Wolff's Law) to earn points and log stretches.`;
      const speechEn =
        seleccionada.texto_hablado?.en ??
        `Opening your workout and gamification hub. Resistive load stimulates bone density via Wolff's Law. Let's earn mission points!`;

      return {
        intent: "ejercicio",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        accionSugerida: "abrir_ejercicio",
        fuenteNombre:
          seleccionada.fuente?.nombre ??
          "Dr. Alberto Sanagustín · Cómo los astronautas fortalecen sus huesos (Ley de Wolff)",
        fuenteUrl: seleccionada.fuente?.url ?? "https://www.youtube.com/watch?v=g8w1DbU6owU",
      };
    }

    case "comer": {
      const entradaComida = entradas.find((e) => e.id === "nutricion-horarios") ?? entradas[3];
      const textoEs = `${entradaComida.texto.es} Si vas a realizar tareas de exigencia física, acompáñala con 250 ml de sales.`;
      const speechEs = entradaComida.texto_hablado?.es ?? "Recuerda mantener tus comidas regulares y añadir una colación antes de entrenar.";
      const textoEn = `${entradaComida.texto.en} If you have high-demand tasks ahead, pair it with 250 ml electrolyte hydration.`;
      const speechEn = entradaComida.texto_hablado?.en ?? "Remember to keep regular meal hours and take a light snack before workouts.";

      return {
        intent: "comer",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        fuenteNombre: entradaComida.fuente?.nombre ?? null,
        fuenteUrl: entradaComida.fuente?.url ?? null,
      };
    }

    case "hidratacion": {
      const entradaHidratacion = entradas.find((e) => e.id === "nutricion-hidratacion") ?? entradas[4];
      const textoEs = `${entradaHidratacion.texto.es} Mantén la botella a mano en tu área de trabajo para evitar deshidratación inadvertida.`;
      const speechEs = entradaHidratacion.texto_hablado?.es ?? "Recuerda beber al menos dos litros de agua y reponer electrolitos tras el ejercicio.";
      const textoEn = `${entradaHidratacion.texto.en} Keep your bottle accessible in your work bay to prevent unnoticed dehydration.`;
      const speechEn = entradaHidratacion.texto_hablado?.en ?? "Remember to drink at least two liters of water daily and replenish electrolytes.";

      return {
        intent: "hidratacion",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        fuenteNombre: entradaHidratacion.fuente?.nombre ?? null,
        fuenteUrl: entradaHidratacion.fuente?.url ?? null,
      };
    }

    case "presion": {
      const entradaPresion = entradas.find((e) => e.id === "presion-protocolo-med01") ?? entradas[6];
      const frecuenciaPresion = entradas.find((e) => e.id === "presion-frecuencia") ?? entradas[7];

      const textoEs = `${entradaPresion.texto.es} ${frecuenciaPresion.texto.es}`;
      const speechEs = entradaPresion.texto_hablado?.es ?? "Para medir tu presión, descansa cinco minutos y coloca el manguito a la altura del corazón.";
      const textoEn = `${entradaPresion.texto.en} ${frecuenciaPresion.texto.en}`;
      const speechEn = entradaPresion.texto_hablado?.en ?? "To check your blood pressure, rest five minutes and place cuff at heart level.";

      return {
        intent: "presion",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        fuenteNombre: entradaPresion.fuente?.nombre ?? null,
        fuenteUrl: entradaPresion.fuente?.url ?? null,
      };
    }

    case "soledad": {
      const textoEs =
        "Estoy aquí contigo. El aislamiento espacial es un desafío compartido. ¿Quieres que registremos una nota en tu bitácora, hagamos una pausa de respiración guiada o revisemos el canal de comunicación familiar?";
      const speechEs =
        "Estoy aquí contigo. ¿Quieres que registremos una nota en tu bitácora, hagamos una pausa de respiración guiada o revisemos el canal familiar?";
      const textoEn =
        "I am here with you. Spaceflight isolation is a shared challenge. Would you like to log a note in your journal, practice guided breathing, or open the family communication channel?";
      const speechEn =
        "I am here with you. Would you like to log a note in your journal, do a guided breathing pause, or check the family channel?";

      return {
        intent: "soledad",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
      };
    }

    case "familia": {
      const candidatos = entradas.filter((e) => e.categoria === "familia");
      const seleccionada = candidatos[varianteIndice % candidatos.length];
      const habitat = data.entorno.nombre;

      const textoEs = `Tu entorno actual es ${habitat}. ${seleccionada.texto.es} ¿Deseas redactar una nota de voz para transmitir a Tierra?`;
      const speechEs = seleccionada.texto_hablado?.es ?? "¿Deseas enviar una nota de voz o video a tu familia?";
      const textoEn = `Your current habitat is ${habitat}. ${seleccionada.texto.en} Would you like to draft an audio memo for Earth transmission?`;
      const speechEn = seleccionada.texto_hablado?.en ?? "Would you like to send a voice or video memo to your family?";

      return {
        intent: "familia",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "dormir": {
      const candidatos = entradas.filter((e) => e.categoria === "descanso");
      const seleccionada = candidatos[varianteIndice % candidatos.length];

      const textoEs = `${seleccionada.texto.es} Programa la cabina en modo noche 30 minutos antes para optimizar tu descanso.`;
      const speechEs = seleccionada.texto_hablado?.es ?? "Atenúa las luces media hora antes de dormir y usa tu antifaz para descansar.";
      const textoEn = `${seleccionada.texto.en} Switch the cabin to night mode 30 minutes prior to optimize recovery.`;
      const speechEn = seleccionada.texto_hablado?.en ?? "Dim cabin lights thirty minutes before bed and use your eye mask to sleep.";

      return {
        intent: "dormir",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "bitacora": {
      const textoEs =
        "He abierto el acceso a tu bitácora personal. Puedes registrar cómo te sientes hoy, tu estado de ánimo y cualquier dificultad en cabina.";
      const speechEs = "He abierto tu bitácora personal. Puedes registrar cómo te sientes hoy.";
      const textoEn =
        "I have prepared your personal journal. You can log how you feel today, your mood, and any difficulties experienced in cabin.";
      const speechEn = "I have opened your personal journal. You can log how you feel today.";

      return {
        intent: "bitacora",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
        accionSugerida: "open_journal",
      };
    }

    case "ayuda": {
      const textoEs =
        "Soy ASTRA, tu acompañante de bienestar. Puedo ayudarte con: 1) revisar tu semáforo de salud, 2) rutinas de ejercicio y descanso, y 3) enlace familiar o bitácora.";
      const speechEs =
        "Soy Astra. Puedo ayudarte a revisar tu estado de salud, tus rutinas de ejercicio, tu descanso y tu bitácora.";
      const textoEn =
        "I am ASTRA, your wellness companion. I can help you with: 1) reviewing your health semaphore, 2) exercise and rest regimens, and 3) family links or journal logs.";
      const speechEn =
        "I am Astra. I can assist with health status, workouts, rest, journal, and family connection.";

      return {
        intent: "ayuda",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
      };
    }

    case "desconocido":
    default: {
      const textoEs =
        "Estoy aquí para acompañarte. Puedo ayudarte a revisar tu estado, planear tu ejercicio o registrar tu bitácora. ¿Cuál prefieres?";
      const speechEs =
        "Estoy aquí para acompañarte. Puedo ayudarte a revisar tu estado, planear tu ejercicio o registrar tu bitácora. ¿Cuál prefieres?";
      const textoEn =
        "I am here with you. I can help check your status, plan your exercise, or log your journal. Which do you prefer?";
      const speechEn =
        "I am here with you. I can help check your status, plan your exercise, or log your journal. Which do you prefer?";

      return {
        intent: "desconocido",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? speechEs : speechEn,
        esEmergencia: false,
      };
    }
  }
}
