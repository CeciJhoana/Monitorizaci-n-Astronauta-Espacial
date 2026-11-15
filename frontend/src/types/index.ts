/**
 * Tipos del dominio de la aplicación.
 *
 * Este módulo es la fuente de verdad del contrato de datos entre el
 * frontend y el backend. El backend debe devolver (y aceptar) objetos
 * con estas formas.
 */

export type IconName =
  | "grid"
  | "crew"
  | "pulse"
  | "heart"
  | "bell"
  | "shield"
  | "planet"
  | "book"
  | "settings"
  | "help"
  | "arrow"
  | "chevron"
  | "plus"
  | "download"
  | "clock"
  | "check"
  | "link"
  | "moon"
  | "wind"
  | "temp"
  | "activity"
  | "close"
  | "sun"
  | "radio"
  | "logout";

/** Tono de color usado por avatares, badges e iconos decorativos. */
export type ColorTone = "purple" | "green" | "rose" | "blue" | "sand" | "amber";

export type CrewStatus = "Nominal" | "En observación";

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: ColorTone;
  /** Frecuencia cardíaca actual, en latidos por minuto (lpm). */
  heartRate: number;
  /** Saturación de oxígeno (SpO₂), en porcentaje. */
  oxygenSaturation: number;
  /** Temperatura corporal, en grados Celsius. */
  temperatureCelsius: number;
  /** Presión arterial sistólica/diastólica, en mmHg. */
  bloodPressure: string;
  /** Frecuencia respiratoria, en respiraciones por minuto. */
  respiratoryRate: number;
  /** Horas de sueño de la última noche. */
  sleepHours: number;
  /** Puntaje global de bienestar (0-100). */
  wellnessScore: number;
  status: CrewStatus;
  /**
   * Indica si el tripulante requiere revisión por desviarse de su
   * línea base personal. Reemplaza los chequeos por id hardcodeados.
   */
  requiresReview: boolean;
}

export type AlertLevel = "Preventiva" | "Revisión";

export interface MissionAlert {
  id: number;
  title: string;
  /** Tripulante o módulo al que apunta la alerta. */
  subject: string;
  category: "Bienestar" | "Entorno";
  relativeTime: string;
  /** Explicación del motivo de la señal. */
  detail: string;
  /** Acción recomendada, en lenguaje claro para no médicos. */
  recommendedAction: string;
  level: AlertLevel;
  tone: ColorTone;
  icon: IconName;
}

export interface Measurement {
  id: string;
  astronautId: string;
  heartRate: number;
  oxygenSaturation: number;
  /** Hora local de registro, formato HH:MM. */
  recordedAt: string;
}

export type Mood = "Con dificultad" | "Regular" | "Bien" | "Muy bien";

export interface JournalEntry {
  id: string;
  astronautId: string;
  mood: Mood;
  text: string;
  /** Día de misión en el que se registró la entrada. */
  missionDay: number;
}

export type EnvironmentId = "orbital-station" | "lunar-base" | "mars-base";

export interface EnvironmentOption {
  id: EnvironmentId;
  label: string;
  gravityLabel: string;
}

export interface EnvironmentReading {
  id: string;
  icon: IconName;
  name: string;
  value: string;
  unit: string;
  status: string;
  /** Porcentaje de la barra de progreso (0-100). */
  percent: number;
  warning: boolean;
}

export type TrendMetric = "heartRate" | "oxygenSaturation";
export type TrendPeriod = "24h" | "7d";

export interface TrendSeries {
  values: number[];
  unit: string;
  /** Extremo inferior del eje Y (etiqueta inferior). */
  min: number;
  /** Extremo superior del eje Y (etiqueta superior). */
  max: number;
  /** Rango habitual de referencia que se sombrea en la gráfica. */
  normalRange: [number, number];
  xLabels: string[];
}

export type VitalKey = "heart" | "oxygen" | "temperature" | "pressure" | "breathing";

export interface VitalReading {
  key: VitalKey;
  label: string;
  value: string;
  unit: string;
  location: string;
  baseline: string;
  description: string;
  color: string;
}

export type ProtocolId = "measurement" | "fatigue" | "environment" | "offline";

export interface Protocol {
  id: ProtocolId;
  title: string;
  icon: IconName;
  description: string;
  tag: string;
  steps: string[];
}

export interface RoutineItem {
  time: string;
  name: string;
  note: string;
  done: boolean;
}

/** Instantánea completa de datos de misión que sirve el backend. */
export interface MissionSnapshot {
  crew: CrewMember[];
  alerts: MissionAlert[];
  environmentReadings: EnvironmentReading[];
  trends: Record<TrendMetric, Record<TrendPeriod, TrendSeries>>;
}

export type PageId =
  | "dashboard"
  | "crew"
  | "vitals"
  | "wellness"
  | "alerts"
  | "environment"
  | "protocols"
  | "journal";

export type ModalType =
  | "measurement"
  | "settings"
  | "help"
  | "emergency"
  | "profile"
  | "alert-detail"
  | "protocol";

export interface ModalRequest {
  type: ModalType;
  crewMember?: CrewMember;
  alert?: MissionAlert;
  protocolId?: ProtocolId;
}
