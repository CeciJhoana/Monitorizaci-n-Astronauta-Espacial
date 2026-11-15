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
  ejercicio: [
    "ejercicio", "entrenar", "entrenamiento", "rutina", "ared", "t2",
    "cevis", "cardio", "pesas", "estirar", "estiramiento", "elongar",
    "actividad fisica", "musculo", "muscular", "fuerza",
    "exercise", "workout", "training", "stretching", "stretch",
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
    "bajon", "aislar", "aislado", "aislamiento", "encerrado", "deprimido",
    "sin ganas", "nostalgia", "angustia", "confinamiento",
    "lonely", "alone", "isolation", "isolated", "sad", "down", "depressed",
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
  const textoLimpio = removerWakeWord(textoOriginal);
  if (!textoLimpio) {
    return {
      intent: "desconocido",
      confidence: 0,
      tokensDetectados: [],
      esEmergencia: false,
    };
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
      confidence: Math.min(1.0, 0.5 + maxCoincidencias * 0.25),
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

  public getUltimaIntencion(): CompanionIntent | undefined {
    return this.ultimaIntencion;
  }

  public responder(
    textoUsuario: string,
    data: CompanionData,
    lang: "es" | "en" = "es",
  ): CompanionResponse {
    let resolucion = detectarIntencion(textoUsuario, this.ultimaIntencion);

    let intencionFinal = resolucion.intent;
    if (intencionFinal === "seguimiento" && this.ultimaIntencion) {
      intencionFinal = this.ultimaIntencion;
    }

    if (intencionFinal !== "desconocido" && intencionFinal !== "seguimiento") {
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
 * Genera una respuesta concisa (máximo 3 oraciones), cálida y determinista,
 * combinando la base de conocimiento y los datos en vivo.
 */
export function generarRespuesta(
  intent: CompanionIntent,
  data: CompanionData,
  lang: "es" | "en",
  varianteIndice: number = 0,
): CompanionResponse {
  const entradas = knowledgeData.entradas;

  switch (intent) {
    case "emergencia": {
      const textoEs =
        "Avisa ahora a la tripulación por el canal de emergencia y activa el protocolo HAB-01. No uses este asistente para emergencias críticas ni intentes resolver contingencias solo.";
      const textoEn =
        "Alert the crew immediately on the emergency channel and initiate protocol HAB-01. Do not rely on this companion for critical emergencies or attempt solo intervention.";

      return {
        intent: "emergencia",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
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
      let textoEn = `Your semaphore is currently at Level ${evaluacion.nivel} (${evaluacion.etiqueta}). ${evaluacion.que_hacer} You have logged ${sueno} h of sleep and ${minutosHoy} min of exercise today.`;

      if (evaluacion.avisos_agudos.length > 0) {
        const aviso = evaluacion.avisos_agudos[0];
        textoEs += ` ¡Atención: ${aviso.titulo}!`;
        textoEn += ` Warning: ${aviso.titulo}!`;
      }

      return {
        intent: "estado",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        accionSugerida: "view_vitals",
      };
    }

    case "ejercicio": {
      const candidatos = entradas.filter((e) => e.categoria === "ejercicio");
      const seleccionada = candidatos[varianteIndice % candidatos.length];
      const minutos = data.actividad_min ?? 0;

      const textoEs = `Llevas ${minutos} minutos de actividad hoy. ${seleccionada.texto.es} ¿Te gustaría que preparemos el cronómetro de sesión?`;
      const textoEn = `You have logged ${minutos} minutes of activity today. ${seleccionada.texto.en} Would you like me to set the workout timer?`;

      return {
        intent: "ejercicio",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "comer": {
      const entradaComida = entradas.find((e) => e.id === "nutricion-horarios") ?? entradas[3];
      const textoEs = `${entradaComida.texto.es} Si vas a realizar tareas de exigencia física, acompáñala con 250 ml de sales.`;
      const textoEn = `${entradaComida.texto.en} If you have high-demand tasks ahead, pair it with 250 ml electrolyte hydration.`;

      return {
        intent: "comer",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: entradaComida.fuente?.nombre ?? null,
        fuenteUrl: entradaComida.fuente?.url ?? null,
      };
    }

    case "hidratacion": {
      const entradaHidratacion = entradas.find((e) => e.id === "nutricion-hidratacion") ?? entradas[4];
      const textoEs = `${entradaHidratacion.texto.es} Mantén la botella a mano en tu área de trabajo para evitar deshidratación inadvertida.`;
      const textoEn = `${entradaHidratacion.texto.en} Keep your bottle accessible in your work bay to prevent unnoticed dehydration.`;

      return {
        intent: "hidratacion",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: entradaHidratacion.fuente?.nombre ?? null,
        fuenteUrl: entradaHidratacion.fuente?.url ?? null,
      };
    }

    case "presion": {
      const entradaPresion = entradas.find((e) => e.id === "presion-protocolo-med01") ?? entradas[6];
      const frecuenciaPresion = entradas.find((e) => e.id === "presion-frecuencia") ?? entradas[7];

      const textoEs = `${entradaPresion.texto.es} ${frecuenciaPresion.texto.es}`;
      const textoEn = `${entradaPresion.texto.en} ${frecuenciaPresion.texto.en}`;

      return {
        intent: "presion",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: entradaPresion.fuente?.nombre ?? null,
        fuenteUrl: entradaPresion.fuente?.url ?? null,
      };
    }

    case "soledad": {
      const candidatos = entradas.filter((e) => e.categoria === "soledad");
      const seleccionada = candidatos[varianteIndice % candidatos.length];

      const textoEs = `Estar lejos de casa es un reto natural de la misión. ${seleccionada.texto.es} Respira hondo, estoy aquí para acompañarte.`;
      const textoEn = `Being far from home is an expected challenge of spaceflight. ${seleccionada.texto.en} Take a deep breath, I am here with you.`;

      return {
        intent: "soledad",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "familia": {
      const candidatos = entradas.filter((e) => e.categoria === "familia");
      const seleccionada = candidatos[varianteIndice % candidatos.length];
      const habitat = data.entorno.nombre;

      const textoEs = `Tu entorno actual es ${habitat}. ${seleccionada.texto.es} ¿Deseas redactar una nota de voz para transmitir a Tierra?`;
      const textoEn = `Your current habitat is ${habitat}. ${seleccionada.texto.en} Would you like to draft an audio memo for Earth transmission?`;

      return {
        intent: "familia",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "dormir": {
      const candidatos = entradas.filter((e) => e.categoria === "descanso");
      const seleccionada = candidatos[varianteIndice % candidatos.length];

      const textoEs = `${seleccionada.texto.es} Programa la cabina en modo noche 30 minutos antes para optimizar tu descanso.`;
      const textoEn = `${seleccionada.texto.en} Switch the cabin to night mode 30 minutes prior to optimize recovery.`;

      return {
        intent: "dormir",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        fuenteNombre: seleccionada.fuente?.nombre ?? null,
        fuenteUrl: seleccionada.fuente?.url ?? null,
      };
    }

    case "bitacora": {
      const textoEs =
        "He abierto el acceso a tu bitácora personal. Puedes registrar cómo te sientes hoy, tu estado de ánimo y cualquier dificultad en cabina.";
      const textoEn =
        "I have prepared your personal journal. You can log how you feel today, your mood, and any difficulties experienced in cabin.";

      return {
        intent: "bitacora",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
        accionSugerida: "open_journal",
      };
    }

    case "ayuda": {
      const textoEs =
        "Soy ASTRA, tu acompañante de bienestar. Puedo ayudarte con: 1) revisar tu semáforo de salud, 2) rutinas de ejercicio y descanso, y 3) enlace familiar o bitácora.";
      const textoEn =
        "I am ASTRA, your wellness companion. I can help you with: 1) reviewing your health semaphore, 2) exercise and rest regimens, and 3) family links or journal logs.";

      return {
        intent: "ayuda",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
      };
    }

    case "desconocido":
    default: {
      const textoEs =
        "No logré comprender esa consulta con certeza. Puedo ayudarte a: revisar tu semáforo de salud, planificar tu ejercicio diario o registrar tu bitácora.";
      const textoEn =
        "I did not fully grasp that query. I can assist you with: checking your health status, scheduling workouts, or logging your daily journal.";

      return {
        intent: "desconocido",
        text: lang === "es" ? textoEs : textoEn,
        speechText: lang === "es" ? textoEs : textoEn,
        esEmergencia: false,
      };
    }
  }
}
