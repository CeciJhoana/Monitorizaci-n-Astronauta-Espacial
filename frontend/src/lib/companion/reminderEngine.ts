/**
 * reminderEngine.ts — Reloj de Misión y Cola de Recordatorios Proactivos para ASTRA.
 *
 * Incluye:
 * - Reloj de misión simulado con velocidades 1x, 60x, 600x y salto al próximo aviso.
 * - Cola de recordatorios basada en rutina_diaria, horarios de bienestar y reglas del semáforo.
 * - Acciones sobre recordatorios: Hecho, Posponer (10 min), Omitir.
 * - Persistencia en localStorage (`astra.recordatorios`).
 */

import type { SemaphoreLevel } from "./companionEngine";

export type ReminderCategory =
  | "comer"
  | "ejercicio"
  | "presion"
  | "familia"
  | "dormir"
  | "respiracion"
  | "rutina";

export type ReminderAction =
  | "abrir_ejercicio"
  | "abrir_bitacora"
  | "iniciar_respiracion"
  | "abrir_presion"
  | "abrir_familia";

export type ReminderStatus = "pendiente" | "mostrado" | "hecho" | "pospuesto" | "omitido";

export interface ReminderItem {
  id: string;
  hora_programada: string; // "HH:MM"
  minutos_dia: number; // minutos desde las 00:00 (0 a 1439)
  titulo: { es: string; en: string };
  descripcion: { es: string; en: string };
  categoria: ReminderCategory;
  accion?: ReminderAction;
  estado: ReminderStatus;
  pospuesto_hasta_min?: number;
  esDinamicoNivel?: boolean;
}

export const STORAGE_KEY_RECORDATORIOS = "astra.recordatorios";

/**
 * Convierte "HH:MM" a minutos transcurridos en el día (0 a 1439).
 */
export function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Convierte minutos del día a formato "HH:MM:SS" o "HH:MM".
 */
export function minutosAHora(minutos: number, conSegundos: boolean = false): string {
  const mTotal = Math.floor(minutos) % 1440;
  const h = Math.floor(mTotal / 60);
  const m = mTotal % 60;
  const s = Math.floor((minutos - Math.floor(minutos)) * 60);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  if (conSegundos) {
    const ss = String(s).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
}

/**
 * Lista de recordatorios fijos y reglamentarios de la misión.
 */
export function generarRecordatoriosBase(nivelSemaforo: SemaphoreLevel = 0): ReminderItem[] {
  const base: ReminderItem[] = [
    {
      id: "rec-desayuno",
      hora_programada: "07:30",
      minutos_dia: horaAMinutos("07:30"),
      titulo: { es: "Desayuno y nutrientes", en: "Breakfast & nutrients" },
      descripcion: {
        es: "Ración balanceada de 650 kcal y 250 ml de líquido con electrolitos.",
        en: "Balanced 650 kcal ration and 250 ml electrolyte hydration.",
      },
      categoria: "comer",
      accion: "abrir_bitacora",
      estado: "pendiente",
    },
    {
      id: "rec-presion",
      hora_programada: "08:30",
      minutos_dia: horaAMinutos("08:30"),
      titulo: { es: "Medición de presión (MED-01)", en: "BP Check (MED-01)" },
      descripcion: {
        es: "Reposo de 5 min y 2 tomas con manguito en brazo izquierdo a nivel del corazón.",
        en: "5 min rest and 2 readings with left-arm cuff at heart level.",
      },
      categoria: "presion",
      accion: "abrir_presion",
      estado: "pendiente",
    },
    {
      id: "rec-estiramiento-manana",
      hora_programada: "10:00",
      minutos_dia: horaAMinutos("10:00"),
      titulo: { es: "Pausa activa y estiramientos", en: "Active pause & stretching" },
      descripcion: {
        es: "10 min de descompresión lumbar para contrarrestar elongación vertebral.",
        en: "10 min lumbar decompression to counter spinal elongation.",
      },
      categoria: "ejercicio",
      accion: "abrir_ejercicio",
      estado: "pendiente",
    },
    {
      id: "rec-almuerzo",
      hora_programada: "12:30",
      minutos_dia: horaAMinutos("12:30"),
      titulo: { es: "Almuerzo e hidratación", en: "Lunch & hydration" },
      descripcion: {
        es: "Comida principal del turno. Asegura reposición de sodio moderado (<3000 mg/d).",
        en: "Primary meal of the shift. Maintain moderate sodium (<3000 mg/d).",
      },
      categoria: "comer",
      accion: "abrir_bitacora",
      estado: "pendiente",
    },
    {
      id: "rec-estiramiento-tarde",
      hora_programada: "14:00",
      minutos_dia: horaAMinutos("14:00"),
      titulo: { es: "Pausa circadiana y respiración", en: "Circadian pause & breathing" },
      descripcion: {
        es: "Pausa visual de cabina y 1 minuto de respiración 4-4-4-4.",
        en: "Visual cabin break and 1-minute 4-4-4-4 box breathing.",
      },
      categoria: "ejercicio",
      accion: "iniciar_respiracion",
      estado: "pendiente",
    },
    {
      id: "rec-ared",
      hora_programada: "18:00",
      minutos_dia: horaAMinutos("18:00"),
      titulo: { es: "Contramedidas ARED / T2", en: "ARED / T2 Countermeasures" },
      descripcion: {
        es: "45 min de fuerza y 30 min de cardio para protección osteomuscular.",
        en: "45 min resistance and 30 min cardio for musculoskeletal protection.",
      },
      categoria: "ejercicio",
      accion: "abrir_ejercicio",
      estado: "pendiente",
    },
    {
      id: "rec-familia",
      hora_programada: "18:30",
      minutos_dia: horaAMinutos("18:30"),
      titulo: { es: "Ventana de enlace familiar", en: "Family comms window" },
      descripcion: {
        es: "Canal familiar abierto. Envía un saludo asíncrono o nota de voz a Tierra.",
        en: "Family channel available. Send an asynchronous greeting or voice memo.",
      },
      categoria: "familia",
      accion: "abrir_familia",
      estado: "pendiente",
    },
    {
      id: "rec-cena",
      hora_programada: "19:00",
      minutos_dia: horaAMinutos("19:00"),
      titulo: { es: "Cena ligera de tripulación", en: "Light crew dinner" },
      descripcion: {
        es: "Ración nocturna ligera en el módulo común.",
        en: "Light evening ration in the habitat wardroom.",
      },
      categoria: "comer",
      accion: "abrir_bitacora",
      estado: "pendiente",
    },
    {
      id: "rec-descanso",
      hora_programada: "22:00",
      minutos_dia: horaAMinutos("22:00"),
      titulo: { es: "Preparación para el descanso", en: "Sleep preparation" },
      descripcion: {
        es: "Atenúa la iluminación de cabina y ajusta el antifaz orbital.",
        en: "Dim cabin illumination and secure orbital eye mask.",
      },
      categoria: "dormir",
      accion: "abrir_bitacora",
      estado: "pendiente",
    },
  ];

  // Si el semáforo está en nivel 2 o 3: agrega recordatorio de respiración guiada cada 3 horas
  if (nivelSemaforo >= 2) {
    const horasRespiracion = ["09:00", "12:00", "15:00", "18:00", "21:00"];
    for (const h of horasRespiracion) {
      base.push({
        id: `rec-respiracion-${h}`,
        hora_programada: h,
        minutos_dia: horaAMinutos(h),
        titulo: { es: "Respiración 4-4-4-4 (Soporte)", en: "4-4-4-4 Box Breathing (Support)" },
        descripcion: {
          es: "Tu semáforo indica fatiga o estrés. Tómate 1 minuto para modular tu tono vagal.",
          en: "Your semaphore indicates strain or fatigue. Take 1 min to stabilize vagal tone.",
        },
        categoria: "respiracion",
        accion: "iniciar_respiracion",
        estado: "pendiente",
        esDinamicoNivel: true,
      });
    }
  }

  // Ordenar cronológicamente por minutos del día
  return base.sort((a, b) => a.minutos_dia - b.minutos_dia);
}

/* -------------------------------------------------------------------------- */
/* Reloj de Misión Simulado                                                   */
/* -------------------------------------------------------------------------- */

export class MissionClock {
  private minutosActuales: number; // Minutos desde 00:00 (ej: 08:00 = 480)
  private velocidad: 1 | 60 | 600 = 1;
  private diaMision: number = 42;

  constructor(horaInicial: string = "08:00", diaMision: number = 42) {
    this.minutosActuales = horaAMinutos(horaInicial);
    this.diaMision = diaMision;
  }

  public getMinutosActuales(): number {
    return this.minutosActuales;
  }

  public setMinutosActuales(min: number) {
    this.minutosActuales = ((min % 1440) + 1440) % 1440;
  }

  public getVelocidad(): 1 | 60 | 600 {
    return this.velocidad;
  }

  public setVelocidad(vel: 1 | 60 | 600) {
    this.velocidad = vel;
  }

  public getDiaMision(): number {
    return this.diaMision;
  }

  /**
   * Avanza el reloj según los segundos reales transcurridos y la velocidad activa.
   * deltaSegundos: segundos de tiempo real (ej: 1 s en un setInterval).
   */
  public tick(deltaSegundos: number): number {
    // A velocidad 1x: 60 s reales = 1 min simulado -> deltaMin = deltaSeg / 60
    // A velocidad 60x: 1 s real = 1 min simulado -> deltaMin = deltaSeg
    // A velocidad 600x: 1 s real = 10 min simulados -> deltaMin = deltaSeg * 10
    const factorMinutosPorSegundo = this.velocidad / 60;
    const avanceMinutos = deltaSegundos * factorMinutosPorSegundo;

    this.minutosActuales += avanceMinutos;
    if (this.minutosActuales >= 1440) {
      this.diaMision += Math.floor(this.minutosActuales / 1440);
      this.minutosActuales = this.minutosActuales % 1440;
    }

    return this.minutosActuales;
  }

  /**
   * Salta inmediatamente el reloj al horario del próximo aviso pendiente.
   */
  public saltarAlProximoAviso(recordatorios: ReminderItem[]): ReminderItem | null {
    const ahoraMin = this.minutosActuales;

    // Buscar el primer aviso que esté después de la hora actual y pendiente
    const siguiente = recordatorios.find((r) => {
      if (r.estado === "hecho" || r.estado === "omitido") return false;
      const horaEfectiva = r.estado === "pospuesto" ? (r.pospuesto_hasta_min ?? r.minutos_dia) : r.minutos_dia;
      return horaEfectiva > ahoraMin;
    });

    if (siguiente) {
      const horaEfectiva = siguiente.estado === "pospuesto" ? (siguiente.pospuesto_hasta_min ?? siguiente.minutos_dia) : siguiente.minutos_dia;
      this.minutosActuales = horaEfectiva;
      return siguiente;
    }

    // Si no hay ninguno posterior hoy, buscar el primero de mañana
    const primeroDia = recordatorios.find((r) => r.estado !== "hecho" && r.estado !== "omitido");
    if (primeroDia) {
      this.diaMision += 1;
      this.minutosActuales = primeroDia.minutos_dia;
      return primeroDia;
    }

    return null;
  }

  public obtenerTextoHora(conSegundos: boolean = false): string {
    return minutosAHora(this.minutosActuales, conSegundos);
  }

  public obtenerCabeceraMet(): string {
    return `MET Día ${this.diaMision} · ${minutosAHora(this.minutosActuales)} UTC`;
  }
}

/* -------------------------------------------------------------------------- */
/* Administrador de la Cola de Recordatorios                                  */
/* -------------------------------------------------------------------------- */

export class ReminderManager {
  private recordatorios: ReminderItem[] = [];

  constructor(nivelSemaforo: SemaphoreLevel = 0) {
    this.cargar(nivelSemaforo);
  }

  public getRecordatorios(): ReminderItem[] {
    return this.recordatorios;
  }

  public cargar(nivelSemaforo: SemaphoreLevel = 0) {
    let guardados: ReminderItem[] | null = null;

    if (typeof window !== "undefined") {
      try {
        const serializado = localStorage.getItem(STORAGE_KEY_RECORDATORIOS);
        if (serializado) {
          guardados = JSON.parse(serializado);
        }
      } catch {
        guardados = null;
      }
    }

    const base = generarRecordatoriosBase(nivelSemaforo);

    if (guardados && Array.isArray(guardados) && guardados.length > 0) {
      // Reconciliar estados guardados con los items base
      this.recordatorios = base.map((item) => {
        const hallado = guardados!.find((g) => g.id === item.id);
        return hallado ? { ...item, estado: hallado.estado, pospuesto_hasta_min: hallado.pospuesto_hasta_min } : item;
      });
    } else {
      this.recordatorios = base;
    }
  }

  public guardar() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_RECORDATORIOS, JSON.stringify(this.recordatorios));
      } catch {
        // noop
      }
    }
  }

  /**
   * Comprueba si algún recordatorio debe dispararse según el minuto actual del reloj.
   */
  public evaluarDisparo(minutosActuales: number): ReminderItem[] {
    const disparados: ReminderItem[] = [];

    for (const r of this.recordatorios) {
      if (r.estado === "pendiente" && minutosActuales >= r.minutos_dia) {
        r.estado = "mostrado";
        disparados.push(r);
      } else if (r.estado === "pospuesto" && r.pospuesto_hasta_min !== undefined && minutosActuales >= r.pospuesto_hasta_min) {
        r.estado = "mostrado";
        disparados.push(r);
      }
    }

    if (disparados.length > 0) {
      this.guardar();
    }

    return disparados;
  }

  public marcarHecho(id: string): boolean {
    const item = this.recordatorios.find((r) => r.id === id);
    if (item) {
      item.estado = "hecho";
      this.guardar();
      return true;
    }
    return false;
  }

  public posponer(id: string, minutosActuales: number, minutosPosponer: number = 10): boolean {
    const item = this.recordatorios.find((r) => r.id === id);
    if (item) {
      item.estado = "pospuesto";
      item.pospuesto_hasta_min = (Math.floor(minutosActuales) + minutosPosponer) % 1440;
      this.guardar();
      return true;
    }
    return false;
  }

  public omitir(id: string): boolean {
    const item = this.recordatorios.find((r) => r.id === id);
    if (item) {
      item.estado = "omitido";
      this.guardar();
      return true;
    }
    return false;
  }

  public contarPendientes(): number {
    return this.recordatorios.filter((r) => r.estado === "pendiente" || r.estado === "mostrado").length;
  }
}
