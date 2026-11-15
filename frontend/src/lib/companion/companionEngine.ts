/**
 * Motor del Asistente ASTRA: Evaluación de Semáforo Conductual y Avisos Agudos.
 *
 * Funciona de forma 100% determinista basada en reglas (`companionRules.json`).
 * No utiliza modelos de lenguaje ni conexiones externas.
 *
 * AVISO: Propuesta conceptual del equipo para NASA Space Apps Cochabamba.
 * No constituye un dispositivo médico ni diagnóstico clínico.
 */

import rulesData from "@/data/companion/companionRules.json";
import type { CompanionData } from "@/data/companion/companionData";

export type SemaphoreLevel = 0 | 1 | 2 | 3;
export type DemoScenario =
  | "normal"
  | "sueno_bajo"
  | "sleep_low"
  | "aislamiento"
  | "isolation"
  | "fatiga_critica"
  | "burnout_critical"
  | "radiacion_solar"
  | "solar_radiation";

export interface VariableEvaluation {
  id: string;
  nombre: string;
  valorTexto: string;
  valorNumerico?: number;
  nivel: SemaphoreLevel;
  disponible: boolean;
  motivo?: string;
}

export interface AcuteAlert {
  metrica: string;
  titulo: string;
  detalle: string;
  nivel: "revision" | "critica";
}

export interface CompanionEvaluation {
  nivel: SemaphoreLevel;
  etiqueta: string;
  por_que: string[];
  que_hacer: string;
  escalado: string;
  avisos_agudos: AcuteAlert[];
  datos_parciales: boolean;
  variables: Record<string, VariableEvaluation>;
  timestamp: string;
}

/**
 * Evalúa las variables conductuales y fisiológicas de un tripulante
 * aplicando la regla del equipo:
 * El nivel del semáforo es el peor nivel alcanzado por al menos 2 variables.
 */
export function evaluateBehavior(
  data: CompanionData,
  lang: "es" | "en" = "es",
): CompanionEvaluation {
  const vars: Record<string, VariableEvaluation> = {};

  // 1. Sueño (horas)
  if (data.sueno_horas !== undefined) {
    const val = data.sueno_horas;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= 7.5) {
      nivel = 0;
    } else if (val >= 5.5) {
      nivel = 1;
      motivo = lang === "es" ? `Sueño levemente reducido (${val} h)` : `Slightly reduced sleep (${val} h)`;
    } else if (val >= 4.5) {
      nivel = 2;
      motivo = lang === "es" ? `Déficit moderado de descanso (${val} h)` : `Moderate sleep deficit (${val} h)`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Privación severa de sueño (${val} h)` : `Severe sleep deprivation (${val} h)`;
    }

    vars.sueno = {
      id: "sueno_horas",
      nombre: lang === "es" ? "Sueño" : "Sleep",
      valorTexto: `${val} h`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.sueno = {
      id: "sueno_horas",
      nombre: lang === "es" ? "Sueño" : "Sleep",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 2. Eficiencia de sueño (%)
  if (data.eficiencia_sueno_pct !== undefined) {
    const val = data.eficiencia_sueno_pct;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= 85) {
      nivel = 0;
    } else if (val >= 70) {
      nivel = 1;
      motivo = lang === "es" ? `Eficiencia de sueño al ${val}% (óptimo >= 85%)` : `Sleep efficiency at ${val}% (optimal >= 85%)`;
    } else if (val >= 55) {
      nivel = 2;
      motivo = lang === "es" ? `Fragmentación del descanso (${val}%)` : `Rest fragmentation (${val}%)`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Eficiencia crítica de descanso (${val}%)` : `Critical rest efficiency (${val}%)`;
    }

    vars.eficiencia = {
      id: "eficiencia_sueno_pct",
      nombre: lang === "es" ? "Eficiencia de descanso" : "Sleep efficiency",
      valorTexto: `${val}%`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.eficiencia = {
      id: "eficiencia_sueno_pct",
      nombre: lang === "es" ? "Eficiencia de descanso" : "Sleep efficiency",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 3. HRV (% desviación vs línea base)
  if (data.hrv_desviacion_pct !== undefined) {
    const val = data.hrv_desviacion_pct;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= -15) {
      // Nivel 0 cubre +-10% y el hueco de -10% a -15% según especificación
      nivel = 0;
    } else if (val >= -25) {
      nivel = 1;
      motivo = lang === "es" ? `HRV ${val}% vs base (fatiga incipiente)` : `HRV ${val}% vs baseline (early fatigue)`;
    } else if (val >= -40) {
      nivel = 2;
      motivo = lang === "es" ? `Recuperación autonómica baja: HRV ${val}% vs base` : `Low autonomic recovery: HRV ${val}% vs baseline`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Desregulación autonómica severa: HRV ${val}% vs base` : `Severe autonomic drop: HRV ${val}% vs baseline`;
    }

    vars.hrv = {
      id: "hrv_desviacion_pct",
      nombre: lang === "es" ? "Recuperación HRV" : "HRV Recovery",
      valorTexto: `${val > 0 ? "+" : ""}${val}%`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.hrv = {
      id: "hrv_desviacion_pct",
      nombre: lang === "es" ? "Recuperación HRV" : "HRV Recovery",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 4. Actividad física (minutos)
  if (data.actividad_min !== undefined) {
    const val = data.actividad_min;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= 60) {
      nivel = 0;
    } else if (val >= 30) {
      nivel = 1;
      motivo = lang === "es" ? `Actividad física subóptima (${val} min / obj. 60 min)` : `Suboptimal exercise (${val} min / obj. 60 min)`;
    } else if (val >= 10) {
      nivel = 2;
      motivo = lang === "es" ? `Baja actividad física (${val} min)` : `Low physical activity (${val} min)`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Sedentarismo crítico (< 10 min)` : `Critical physical inactivity (< 10 min)`;
    }

    vars.actividad = {
      id: "actividad_min",
      nombre: lang === "es" ? "Actividad física" : "Physical activity",
      valorTexto: `${val} min`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.actividad = {
      id: "actividad_min",
      nombre: lang === "es" ? "Actividad física" : "Physical activity",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 5. Exposición a luz (lux)
  if (data.luz_lux !== undefined) {
    const val = data.luz_lux;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= 250) {
      nivel = 0;
    } else if (val >= 150) {
      nivel = 1;
      motivo = lang === "es" ? `Luz ambiental tenue (${val} lux / óptimo >= 250)` : `Dim ambient light (${val} lux / optimal >= 250)`;
    } else {
      nivel = 2;
      motivo = lang === "es" ? `Iluminación insuficiente para sincronización circadiana (${val} lux)` : `Insufficient circadian lighting (${val} lux)`;
    }

    vars.luz = {
      id: "luz_lux",
      nombre: lang === "es" ? "Luz circadiana" : "Circadian light",
      valorTexto: `${val} lux`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.luz = {
      id: "luz_lux",
      nombre: lang === "es" ? "Luz circadiana" : "Circadian light",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 6. Vida social (%)
  if (data.social_pct !== undefined) {
    const val = data.social_pct;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val >= 35) {
      nivel = 0;
    } else if (val >= 20) {
      nivel = 1;
      motivo = lang === "es" ? `Menor tiempo en áreas comunes (${val}%)` : `Decreased common area time (${val}%)`;
    } else if (val >= 10) {
      nivel = 2;
      motivo = lang === "es" ? `Aislamiento social moderado (${val}%)` : `Moderate social isolation (${val}%)`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Aislamiento social severo (${val}%)` : `Severe social withdrawal (${val}%)`;
    }

    vars.social = {
      id: "social_pct",
      nombre: lang === "es" ? "Interacción social" : "Social interaction",
      valorTexto: `${val}%`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.social = {
      id: "social_pct",
      nombre: lang === "es" ? "Interacción social" : "Social interaction",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // 7. Estado de ánimo (escala [-1.0, +1.0])
  if (data.animo !== undefined) {
    const val = data.animo;
    let nivel: SemaphoreLevel = 0;
    let motivo: string | undefined;

    if (val > 0.3) {
      nivel = 0;
    } else if (val >= -0.1) {
      nivel = 1;
      motivo = lang === "es" ? `Ánimo neutral o neutro en bitácora (${data.animo_texto ?? val})` : `Neutral mood in journal (${data.animo_texto ?? val})`;
    } else if (val > -0.6) {
      nivel = 2;
      motivo = lang === "es" ? `Ánimo decaído o dificultad reportada (${data.animo_texto ?? val})` : `Low mood or difficulty reported (${data.animo_texto ?? val})`;
    } else {
      nivel = 3;
      motivo = lang === "es" ? `Malestar anímico severo en bitácora (${data.animo_texto ?? val})` : `Severe mood distress in journal (${data.animo_texto ?? val})`;
    }

    vars.animo = {
      id: "animo",
      nombre: lang === "es" ? "Estado de ánimo" : "Logged mood",
      valorTexto: data.animo_texto ?? `${val}`,
      valorNumerico: val,
      nivel,
      disponible: true,
      motivo,
    };
  } else {
    vars.animo = {
      id: "animo",
      nombre: lang === "es" ? "Estado de ánimo" : "Logged mood",
      valorTexto: "N/D",
      nivel: 0,
      disponible: false,
    };
  }

  // REGLA DE COMBINACIÓN:
  // "el nivel del semáforo es el peor nivel alcanzado por al menos 2 variables.
  //  Si solo 1 variable está mal, no escala a ese nivel para evitar falsos positivos
  //  (salvo que sea la única disponible, en cuyo caso avisa 'datos parciales')."
  const variablesDisponibles = Object.values(vars).filter((v) => v.disponible);
  const totalDisponibles = variablesDisponibles.length;
  const datos_parciales = totalDisponibles < 5; // Faltan variables clave como social o eficiencia

  let nivelFinal: SemaphoreLevel = 0;

  if (totalDisponibles === 0) {
    nivelFinal = 0;
  } else if (totalDisponibles === 1) {
    nivelFinal = variablesDisponibles[0].nivel;
  } else {
    const cuentaNivel3 = variablesDisponibles.filter((v) => v.nivel >= 3).length;
    const cuentaNivel2 = variablesDisponibles.filter((v) => v.nivel >= 2).length;
    const cuentaNivel1 = variablesDisponibles.filter((v) => v.nivel >= 1).length;

    if (cuentaNivel3 >= 2) {
      nivelFinal = 3;
    } else if (cuentaNivel2 >= 2) {
      nivelFinal = 2;
    } else if (cuentaNivel1 >= 2) {
      nivelFinal = 1;
    } else {
      nivelFinal = 0;
    }
  }

  // Lista de razones: qué variables fallaron y su valor actual
  const por_que: string[] = [];
  const variablesAlteradas = variablesDisponibles.filter((v) => v.nivel > 0);

  if (variablesAlteradas.length === 0) {
    por_que.push(
      lang === "es"
        ? "Todas las variables analizadas se encuentran dentro de sus rangos nominales."
        : "All monitored physiological and behavioral variables are within nominal bounds.",
    );
  } else {
    for (const v of variablesAlteradas) {
      if (v.motivo) por_que.push(v.motivo);
    }
  }

  // Recomendación concreta según la variable más crítica
  let que_hacer = "";
  if (nivelFinal === 0) {
    que_hacer =
      lang === "es"
        ? "Mantén tu pauta actual de descanso, hidratación y 60 min de contramedidas ARED."
        : "Maintain your scheduled rest regimen, hydration, and 60 min ARED countermeasure routine.";
  } else {
    // Buscar la variable con mayor nivel de gravedad
    const peorVar = [...variablesDisponibles].sort((a, b) => b.nivel - a.nivel)[0];

    switch (peorVar?.id) {
      case "sueno_horas":
      case "eficiencia_sueno_pct":
        que_hacer =
          lang === "es"
            ? "Prioriza un descanso extendido o una siesta recuperadora de 30 minutos antes del próximo turno de tareas críticas."
            : "Prioritize an extended rest cycle or a 30-minute restorative nap prior to high-demand shift tasks.";
        break;
      case "hrv_desviacion_pct":
        que_hacer =
          lang === "es"
            ? "Tu sistema cardiovascular muestra menor recuperación; modera el esfuerzo en la sesión de hoy y realiza una pausa de respiración guiada."
            : "Autonomic recovery indicates accumulated strain; moderate exercise intensity today and take a conscious breathing break.";
        break;
      case "social_pct":
      case "animo":
        que_hacer =
          lang === "es"
            ? "Conecta con la tripulación en la zona común, inicia una comunicación familiar o activa 1 minuto de respiración 4-4-4-4."
            : "Connect with crewmates in the wardroom, schedule a family comms window, or engage in 1-minute box breathing.";
        break;
      case "actividad_min":
        que_hacer =
          lang === "es"
            ? "Completa tu rutina de ejercicio programado en la estación para mitigar el desacondicionamiento osteomuscular."
            : "Complete scheduled station exercise protocols to mitigate musculoskeletal deconditioning.";
        break;
      case "luz_lux":
        que_hacer =
          lang === "es"
            ? "Aumenta la exposición lumínica de cabina a más de 250 lux durante la ventana matutina para estabilizar el ciclo circadiano."
            : "Increase cabin light exposure to >250 lux during the morning window to reinforce circadian alignment.";
        break;
      default:
        que_hacer =
          lang === "es"
            ? "Revisa tus hábitos de hidratación y consulta al oficial médico en la próxima ronda de bienestar."
            : "Review hydration protocols and consult with the flight medical officer during the next health briefing.";
    }
  }

  // CAPA INDEPENDIENTE DE AVISOS AGUDOS (Vitales y Entorno)
  const avisos_agudos: AcuteAlert[] = [];
  const { vitales } = data;

  if (vitales.spo2_pct !== undefined && vitales.spo2_pct < 90) {
    avisos_agudos.push({
      metrica: "spo2",
      titulo: lang === "es" ? "Saturación de O₂ crítica" : "Critical O₂ saturation",
      detalle:
        lang === "es"
          ? `SpO₂ en ${vitales.spo2_pct}% (< 90%). Comprueba ajuste del sensor y flujo de soporte vital.`
          : `SpO₂ at ${vitales.spo2_pct}% (< 90%). Verify sensor placement and life-support O₂ flow.`,
      nivel: "critica",
    });
  }

  if (vitales.frecuencia_cardiaca_bpm !== undefined) {
    if (vitales.frecuencia_cardiaca_bpm > 120) {
      avisos_agudos.push({
        metrica: "fc",
        titulo: lang === "es" ? "Taquicardia en reposo" : "Resting tachycardia",
        detalle:
          lang === "es"
            ? `Pulso en ${vitales.frecuencia_cardiaca_bpm} lpm (> 120 lpm). Guarda reposo y verifica sensor.`
            : `Heart rate at ${vitales.frecuencia_cardiaca_bpm} bpm (> 120 bpm). Cease exertion and verify sensor.`,
        nivel: "critica",
      });
    } else if (vitales.frecuencia_cardiaca_bpm < 45) {
      avisos_agudos.push({
        metrica: "fc",
        titulo: lang === "es" ? "Bradicardia severa" : "Severe bradycardia",
        detalle:
          lang === "es"
            ? `Pulso en ${vitales.frecuencia_cardiaca_bpm} lpm (< 45 lpm). Consulta al oficial médico.`
            : `Heart rate at ${vitales.frecuencia_cardiaca_bpm} bpm (< 45 bpm). Consult flight medical officer.`,
        nivel: "critica",
      });
    }
  }

  if (vitales.temperatura_corporal_c !== undefined) {
    if (vitales.temperatura_corporal_c > 38.0) {
      avisos_agudos.push({
        metrica: "temp",
        titulo: lang === "es" ? "Temperatura corporal elevada" : "Elevated core body temperature",
        detalle:
          lang === "es"
            ? `Temperatura en ${vitales.temperatura_corporal_c} °C (> 38.0 °C). Posible cuadro febril.`
            : `Temperature at ${vitales.temperatura_corporal_c} °C (> 38.0 °C). Possible febrile state.`,
        nivel: "revision",
      });
    } else if (vitales.temperatura_corporal_c < 35.0) {
      avisos_agudos.push({
        metrica: "temp",
        titulo: lang === "es" ? "Temperatura corporal baja" : "Low core body temperature",
        detalle:
          lang === "es"
            ? `Temperatura en ${vitales.temperatura_corporal_c} °C (< 35.0 °C). Riesgo de hipotermia.`
            : `Temperature at ${vitales.temperatura_corporal_c} °C (< 35.0 °C). Hypothermia warning.`,
        nivel: "revision",
      });
    }
  }

  if (vitales.radiacion_mSv_h !== undefined && vitales.radiacion_mSv_h > 20.0) {
    avisos_agudos.push({
      metrica: "radiacion",
      titulo: lang === "es" ? "Alerta de radiación ambiental" : "Environmental radiation warning",
      detalle:
        lang === "es"
          ? `Tasa de radiación en ${vitales.radiacion_mSv_h} mSv/h (> 20 mSv/h). Evento de tormenta solar o incremento anómalo en cabina.`
          : `Radiation rate at ${vitales.radiacion_mSv_h} mSv/h (> 20 mSv/h). Solar particle event or cabin anomaly detected.`,
      nivel: "critica",
    });
  }

  const etiqueta = (rulesData.etiquetas as Record<string, { es: string; en: string }>)[String(nivelFinal)][lang];
  const escalado = (rulesData.escalado as Record<string, { es: string; en: string }>)[String(nivelFinal)][lang];

  return {
    nivel: nivelFinal,
    etiqueta,
    por_que,
    que_hacer,
    escalado,
    avisos_agudos,
    datos_parciales,
    variables: vars,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Aplica un escenario de demostración en memoria para pruebas del jurado.
 * Nunca persiste ni modifica la base de datos real.
 */
export function aplicarEscenario(
  dataBase: CompanionData,
  escenario: DemoScenario,
): CompanionData {
  switch (escenario) {
    case "sueno_bajo":
    case "sleep_low":
      return {
        ...dataBase,
        sueno_horas: 4.8, // Nivel 2
        eficiencia_sueno_pct: 62, // Nivel 2
        hrv_desviacion_pct: -28, // Nivel 2
      };

    case "aislamiento":
    case "isolation":
      return {
        ...dataBase,
        social_pct: 8, // Nivel 3
        animo: -0.7, // Nivel 3
        animo_texto: "Con dificultad",
        sueno_horas: 5.0, // Nivel 2
      };

    case "fatiga_critica":
    case "burnout_critical":
      return {
        ...dataBase,
        sueno_horas: 3.8, // Nivel 3
        hrv_desviacion_pct: -45, // Nivel 3
        actividad_min: 5, // Nivel 3
        animo: -0.8, // Nivel 3
        animo_texto: "Con dificultad",
      };

    case "radiacion_solar":
    case "solar_radiation":
      return {
        ...dataBase,
        vitales: {
          ...dataBase.vitales,
          radiacion_mSv_h: 450, // Dispara aviso agudo de radiación
        },
      };

    case "normal":
    default:
      return dataBase;
  }
}
