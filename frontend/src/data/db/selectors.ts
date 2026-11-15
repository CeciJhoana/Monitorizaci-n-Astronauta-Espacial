/**
 * Selectores: leen la base de datos simulada y devuelven las formas que
 * consume la interfaz.
 *
 * Cada selector replica una vista del esquema SQL (`docs/esquema-base-datos.sql`):
 * `v_estado_tripulacion`, `v_tendencia_tripulacion`, `v_alertas_activas` y
 * `v_entorno_actual`. Cuando exista el backend, estas funciones dejan de
 * ser necesarias: la API devolverá directamente los tipos de `src/types`.
 */

import type {
  AlertLevel,
  ColorTone,
  CrewMember,
  CrewStatus,
  EnvironmentReading,
  IconName,
  MissionAlert,
  MissionSnapshot,
  Mood,
  Protocol,
  ProtocolId,
  RoutineItem,
  TrendMetric,
  TrendPeriod,
  TrendSeries,
} from "@/types";
import type { AlertaRow, MockDatabase, ResumenBienestarDiarioRow } from "./schema";

/* -------------------------------------------------------------------------- */
/* Utilidades                                                                   */
/* -------------------------------------------------------------------------- */

const HOUR_MS = 3_600_000;

const ROL_LABELS: Record<string, string> = {
  comandante: "Comandante de misión",
  ingeniero_vuelo: "Ingeniero de vuelo",
  oficial_medico: "Oficial médico",
  especialista_mision: "Especialista de misión",
};

const NIVEL_LABELS: Record<string, AlertLevel> = {
  preventiva: "Preventiva",
  revision: "Revisión",
  critica: "Crítica",
};

const NIVEL_TONES: Record<string, ColorTone> = {
  preventiva: "amber",
  revision: "purple",
  critica: "rose",
};

const CATEGORIAS: Record<string, MissionAlert["category"]> = {
  bienestar: "Bienestar",
  entorno: "Entorno",
  vitales: "Vitales",
  habitat: "Hábitat",
  sistema: "Sistema",
};

const ALERT_ICONS: Record<string, IconName> = {
  bienestar: "moon",
  entorno: "wind",
  vitales: "pulse",
  habitat: "planet",
  sistema: "shield",
};

/** `2,450` → "2,450" (formato del prototipo), `0.42` → "0.42". */
function formatValue(valor: number): string {
  if (!Number.isInteger(valor)) return String(valor);
  const [entero, decimales] = String(valor).split(".");
  const conSeparadores = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimales ? `${conSeparadores}.${decimales}` : conSeparadores;
}

/** "Hace 12 min", "Hace 2 h", "Ayer". */
export function formatRelativeTime(timestamp: string, now: Date = new Date()): string {
  const minutos = Math.max(0, Math.round((now.getTime() - new Date(timestamp).getTime()) / 60_000));
  if (minutos < 1) return "Ahora mismo";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "Ayer" : `Hace ${dias} días`;
}

/* -------------------------------------------------------------------------- */
/* v_estado_tripulacion                                                         */
/* -------------------------------------------------------------------------- */

interface EstadoTripulacion {
  tripulanteId: string;
  codigo: string;
  nombre: string;
  rol: string;
  iniciales: string;
  color: ColorTone;
  estado: CrewStatus;
  heartRate: number;
  oxygenSaturation: number;
  temperatureCelsius: number;
  bloodPressure: string;
  respiratoryRate: number;
  sleepHours: number;
  wellnessScore: number;
  requiresReview: boolean;
}

function ultimaMedicion(db: MockDatabase, tripulanteId: string) {
  return db.medicion_signos_vitales
    .filter((m) => m.tripulante_id === tripulanteId)
    .sort((a, b) => b.medido_en.localeCompare(a.medido_en))[0];
}

function ultimoResumen(db: MockDatabase, tripulanteId: string) {
  return db.resumen_bienestar_diario
    .filter((r) => r.tripulante_id === tripulanteId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
}

/**
 * `SELECT ... FROM tripulante LEFT JOIN medicion_signos_vitales ...`
 * Latest reading and latest daily wellness summary per crew member.
 */
export function selectEstadoTripulacion(db: MockDatabase): EstadoTripulacion[] {
  return db.tripulante.map((tripulante) => {
    const medicion = ultimaMedicion(db, tripulante.id);
    const resumen = ultimoResumen(db, tripulante.id);
    const requiereRevision = tripulante.estado === "en_observacion";

    return {
      tripulanteId: tripulante.id,
      codigo: tripulante.codigo,
      nombre: tripulante.nombre_completo,
      rol: ROL_LABELS[tripulante.rol] ?? tripulante.rol,
      iniciales: tripulante.iniciales,
      color: tripulante.color_avatar as ColorTone,
      estado: requiereRevision ? "En observación" : "Nominal",
      heartRate: medicion?.frecuencia_cardiaca_bpm ?? 0,
      oxygenSaturation: medicion?.spo2_pct ?? 0,
      temperatureCelsius: medicion?.temperatura_corporal_c ?? 0,
      bloodPressure: `${medicion?.presion_sistolica_mmhg ?? 0}/${medicion?.presion_diastolica_mmhg ?? 0}`,
      respiratoryRate: medicion?.frecuencia_respiratoria_rpm ?? 0,
      sleepHours: resumen?.horas_sueno ?? 0,
      wellnessScore: resumen?.puntaje_bienestar ?? 0,
      requiresReview: requiereRevision,
    };
  });
}

/** Convierte el estado de la vista en el tipo público `CrewMember`. */
export function selectCrewMembers(db: MockDatabase): CrewMember[] {
  return selectEstadoTripulacion(db).map((estado) => ({
    id: estado.codigo,
    name: estado.nombre,
    role: estado.rol,
    initials: estado.iniciales,
    color: estado.color,
    heartRate: estado.heartRate,
    oxygenSaturation: estado.oxygenSaturation,
    temperatureCelsius: estado.temperatureCelsius,
    bloodPressure: estado.bloodPressure,
    respiratoryRate: estado.respiratoryRate,
    sleepHours: estado.sleepHours,
    wellnessScore: estado.wellnessScore,
    status: estado.estado,
    requiresReview: estado.requiresReview,
  }));
}

/* -------------------------------------------------------------------------- */
/* v_tendencia_tripulacion                                                      */
/* -------------------------------------------------------------------------- */

const HOURLY_X_LABELS = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "23:59"];
const WEEKLY_X_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/**
 * Agrega las lecturas de los últimos días en 12 tramos y promedia por
 * tripulante. Reproduce el gráfico de tendencias: 12 puntos por serie.
 */
function agregarTendencia(
  db: MockDatabase,
  metrica: "frecuencia_cardiaca_bpm" | "spo2_pct",
  duracionTramo: number,
  ahora: number,
  decimales: number,
): number[] {
  const desde = ahora - duracionTramo * 12;
  const tramos: number[][] = Array.from({ length: 12 }, () => []);

  for (const medicion of db.medicion_signos_vitales) {
    const valor = medicion[metrica];
    if (valor === null || valor === undefined) continue;
    const tiempo = new Date(medicion.medido_en).getTime();
    if (tiempo < desde || tiempo > ahora) continue;
    const tramo = Math.min(11, Math.floor((ahora - tiempo) / duracionTramo));
    tramos[tramo].push(valor);
  }

  // El tramo 0 es el más reciente: se invierte para que la serie vaya de
  // izquierda (más antiguo) a derecha (más reciente), como en la gráfica.
  const factor = 10 ** decimales;
  return tramos
    .reverse()
    .map((valores) =>
      valores.length
        ? Math.round(
            (valores.reduce((total, valor) => total + valor, 0) / valores.length) * factor,
          ) / factor
        : 0,
    );
}

export function selectTrends(
  db: MockDatabase,
): Record<TrendMetric, Record<TrendPeriod, TrendSeries>> {
  const ahora = Date.now();

  const fc24h = agregarTendencia(db, "frecuencia_cardiaca_bpm", 2 * HOUR_MS, ahora, 0);
  const fc7d = agregarTendencia(db, "frecuencia_cardiaca_bpm", 14 * HOUR_MS, ahora, 0);
  const spo224h = agregarTendencia(db, "spo2_pct", 2 * HOUR_MS, ahora, 1);
  const spo27d = agregarTendencia(db, "spo2_pct", 14 * HOUR_MS, ahora, 1);

  return {
    heartRate: {
      "24h": {
        values: fc24h,
        unit: "lpm",
        min: 50,
        max: 90,
        normalRange: [60, 80],
        xLabels: HOURLY_X_LABELS,
      },
      "7d": {
        values: fc7d,
        unit: "lpm",
        min: 50,
        max: 90,
        normalRange: [60, 80],
        xLabels: WEEKLY_X_LABELS,
      },
    },
    oxygenSaturation: {
      "24h": {
        values: spo224h,
        unit: "%",
        min: 96,
        max: 100,
        normalRange: [97, 99],
        xLabels: HOURLY_X_LABELS,
      },
      "7d": {
        values: spo27d,
        unit: "%",
        min: 96,
        max: 100,
        normalRange: [97, 99],
        xLabels: WEEKLY_X_LABELS,
      },
    },
  };
}

/* -------------------------------------------------------------------------- */
/* v_alertas_activas                                                            */
/* -------------------------------------------------------------------------- */

export function selectActiveAlerts(db: MockDatabase): MissionAlert[] {
  return db.alerta
    .filter((alerta) => alerta.estado === "activa")
    .sort((a, b) => b.disparada_en.localeCompare(a.disparada_en))
    .map((alerta: AlertaRow, index) => ({
      id: index + 1,
      title: alerta.titulo,
      subject: alerta.destinatario_texto,
      category: CATEGORIAS[alerta.tipo] ?? "Bienestar",
      relativeTime: formatRelativeTime(alerta.disparada_en),
      detail: alerta.detalle,
      recommendedAction: alerta.accion_recomendada,
      level: NIVEL_LABELS[alerta.nivel] ?? "Revisión",
      tone: NIVEL_TONES[alerta.nivel] ?? "purple",
      icon: ALERT_ICONS[alerta.tipo] ?? "bell",
    }));
}

/* -------------------------------------------------------------------------- */
/* v_entorno_actual                                                             */
/* -------------------------------------------------------------------------- */

const ENTORNO_METRICAS: Record<string, { id: string; icon: IconName; name: string }> = {
  co2_ppm: { id: "co2", icon: "wind", name: "CO₂ en cabina" },
  radiacion_msv: { id: "radiation", icon: "sun", name: "Radiación diaria" },
  temperatura_c: { id: "cabin-temp", icon: "temp", name: "Temperatura" },
};

export function selectEnvironmentReadings(db: MockDatabase): EnvironmentReading[] {
  const ultimas = new Map<string, (typeof db.lectura_entorno)[number]>();
  for (const lectura of db.lectura_entorno) {
    const actual = ultimas.get(lectura.metrica);
    if (!actual || lectura.leido_en > actual.leido_en) ultimas.set(lectura.metrica, lectura);
  }

  return [...ultimas.entries()]
    .filter(([metrica]) => metrica in ENTORNO_METRICAS)
    .map(([metrica, lectura]) => {
      const definicion = ENTORNO_METRICAS[metrica];
      return {
        id: definicion.id,
        icon: definicion.icon,
        name: definicion.name,
        value: formatValue(lectura.valor),
        unit: lectura.unidad,
        status: lectura.estado_etiqueta,
        percent: lectura.porcentaje_escala,
        warning: lectura.estado_etiqueta === "En revisión",
      };
    });
}

/* -------------------------------------------------------------------------- */
/* Protocolos y rutina                                                          */
/* -------------------------------------------------------------------------- */

const PROTOCOL_IDS: Record<string, { id: ProtocolId; icon: IconName }> = {
  "MED-01": { id: "measurement", icon: "pulse" },
  "WEL-01": { id: "fatigue", icon: "moon" },
  "HAB-01": { id: "environment", icon: "planet" },
  "AUT-01": { id: "offline", icon: "radio" },
};

export function selectProtocols(db: MockDatabase): Protocol[] {
  return db.protocolo
    .filter((protocolo) => protocolo.activo)
    .map((protocolo) => {
      const definicion = PROTOCOL_IDS[protocolo.codigo];
      const pasos = db.paso_protocolo
        .filter((paso) => paso.protocolo_id === protocolo.id)
        .sort((a, b) => a.orden - b.orden);
      return {
        id: definicion?.id ?? (protocolo.codigo as ProtocolId),
        title: protocolo.titulo,
        icon: definicion?.icon ?? "shield",
        description: protocolo.descripcion,
        tag: protocolo.categoria,
        steps: pasos.map((paso) => paso.instruccion),
      };
    });
}

export function selectRoutine(db: MockDatabase, fecha?: string): RoutineItem[] {
  const hoy = fecha ?? new Date().toISOString().slice(0, 10);
  return db.rutina_diaria
    .filter((rutina) => rutina.fecha === hoy)
    .sort((a, b) => a.hora_inicio_utc.localeCompare(b.hora_inicio_utc))
    .map((rutina) => ({
      time: rutina.hora_inicio_utc.slice(0, 5),
      name: rutina.titulo,
      note: rutina.nota,
      done: rutina.estado === "completado",
    }));
}

/* -------------------------------------------------------------------------- */
/* Bienestar                                                                    */
/* -------------------------------------------------------------------------- */

export interface WellnessHints {
  hrv: string;
  exercise: string;
  exercisePercent: number;
  hydration: string;
  light: string;
}

function resumenDe(hints: ResumenBienestarDiarioRow): WellnessHints {
  const objetivo = hints.minutos_ejercicio_obj ?? 60;
  const hecho = hints.minutos_ejercicio ?? 0;
  return {
    hrv: `${hints.hrv_ms ?? 0} ms`,
    exercise: `${hecho} / ${objetivo} min`,
    exercisePercent: Math.min(100, Math.round((hecho / objetivo) * 100)),
    hydration: `${hints.hidratacion_litros ?? 0} L`,
    light: `${hints.exposicion_luz_lux ?? 0} lux`,
  };
}

/** Hábitos del último resumen diario del tripulante. */
export function selectWellnessHints(db: MockDatabase, tripulanteId: string): WellnessHints {
  const resumen = ultimoResumen(db, tripulanteId);
  return resumen
    ? resumenDe(resumen)
    : { hrv: "0 ms", exercise: "0 / 60 min", exercisePercent: 0, hydration: "0 L", light: "0 lux" };
}

/* -------------------------------------------------------------------------- */
/* Bitácora                                                                     */
/* -------------------------------------------------------------------------- */

export interface JournalEntryRow {
  id: string;
  astronautId: string;
  mood: Mood;
  text: string;
  missionDay: number;
}

export function selectJournalEntries(db: MockDatabase, tripulanteId: string): JournalEntryRow[] {
  const entradas = db.entrada_bitacora
    .filter((entrada) => entrada.tripulante_id === tripulanteId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return entradas.map((entrada) => {
    const tripulante = db.tripulante.find((t) => t.id === entrada.tripulante_id);
    return {
      id: entrada.id,
      astronautId: tripulante?.codigo ?? entrada.tripulante_id,
      mood: entrada.estado_animo as Mood,
      text: entrada.cuerpo,
      missionDay: 128,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Instantánea completa                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Equivalente a `GET /mission/snapshot`: la instantánea que consume la
 * interfaz, construida a partir de las tablas simuladas.
 */
export function buildMissionSnapshot(db: MockDatabase): MissionSnapshot {
  return {
    crew: selectCrewMembers(db),
    alerts: selectActiveAlerts(db),
    environmentReadings: selectEnvironmentReadings(db),
    trends: selectTrends(db),
  };
}
