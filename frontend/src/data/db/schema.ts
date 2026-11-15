/**
 * Tipos de fila de la base de datos de Órbita.
 *
 * Reflejo 1:1 de `docs/esquema-base-datos.sql` (PostgreSQL). Cada tabla del
 * esquema tiene aquí su tipo de fila, con los mismos nombres de columna.
 *
 * Cuando exista el backend real, estas formas son las que devolverá el ORM
 * (Prisma, Drizzle, SQL directo…) y los `selectors` de este módulo dejarán de
 * ser necesarios: la API ya hablado shapes de `src/types/index.ts`.
 */

/** Identificador de fila. En PostgreSQL es un `uuid`. */
export type UUID = string;

/** Marca de tiempo ISO 8601 en UTC. */
export type Timestamp = string;

/** Fecha ISO 8601 (AAAA-MM-DD). */
export type DateOnly = string;

/* -------------------------------------------------------------------------- */
/* Enumeraciones del esquema                                                    */
/* -------------------------------------------------------------------------- */

export type EntornoCodigo = "orbital" | "lunar" | "marte";
export type EstadoMision = "planificada" | "activa" | "completada" | "cancelada";
export type RolTripulante =
  | "comandante"
  | "ingeniero_vuelo"
  | "oficial_medico"
  | "especialista_mision";
export type EstadoPersona = "nominal" | "en_observacion" | "retirado";
export type RolUsuario = "comandante" | "oficial_medico" | "control_mision" | "admin";
export type TipoSensor =
  | "frecuencia_cardiaca"
  | "pulsoximetro"
  | "termometro"
  | "manguito_presion"
  | "sensor_respiratorio"
  | "co2"
  | "radiacion"
  | "temperatura_ambiente"
  | "luz"
  | "otro";
export type EstadoSensor = "en_linea" | "sin_linea" | "averiado" | "calibrando";
export type OrigenDato = "sensor" | "manual" | "importado" | "derivado";
export type EstadoBienestar = "nominal" | "revision" | "alerta";
export type EstadoAlerta = "activa" | "revisada" | "resuelta" | "descartada";
export type NivelAlerta = "preventiva" | "revision" | "critica";
export type TipoAlerta = "bienestar" | "entorno" | "vitales" | "habitat" | "sistema";
export type EstadoRutina = "programado" | "completado" | "omitido";

/* -------------------------------------------------------------------------- */
/* Tablas                                                                      */
/* -------------------------------------------------------------------------- */

/** `entorno` — contexto de gravedad y ventana circadiana. */
export interface EntornoRow {
  id: UUID;
  codigo: EntornoCodigo;
  nombre: string;
  factor_gravedad: number;
  descripcion: string;
  ventana_luz_inicio: string | null;
  ventana_luz_fin: string | null;
  activo: boolean;
  created_at: Timestamp;
}

/** `mision` — ARES-01. */
export interface MisionRow {
  id: UUID;
  codigo: string;
  expedicion: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: DateOnly;
  fecha_fin_prevista: DateOnly;
  duracion_dias: number;
  entorno_id: UUID;
  altitud_orbita_km: number;
  estado: EstadoMision;
  creado_por: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** `tripulante` — perfil del astronauta. */
export interface TripulanteRow {
  id: UUID;
  codigo: string;
  nombre_completo: string;
  iniciales: string;
  rol: RolTripulante;
  color_avatar: string;
  nacionalidad: string;
  fecha_nacimiento: DateOnly;
  genero: string;
  estado: EstadoPersona;
  is_simulated: boolean;
  created_at: Timestamp;
}

/** `tripulacion_mision` — membresía y rol dentro de la misión. */
export interface TripulacionMisionRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID;
  rol_en_mision: RolTripulante;
  es_comandante: boolean;
  puesto: string;
  dia_ingreso: number;
  dia_salida: number | null;
}

/** `usuario` — acceso a la aplicación. */
export interface UsuarioRow {
  id: UUID;
  tripulante_id: UUID | null;
  email: string;
  nombre_mostrado: string;
  rol: RolUsuario;
  password_hash: string | null;
  ultimo_acceso: Timestamp | null;
  activo: boolean;
  created_at: Timestamp;
}

/** `sensor` — dispositivo de la nave o del traje. */
export interface SensorRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID | null;
  nombre: string;
  tipo: TipoSensor;
  modelo: string;
  numero_serie: string;
  ubicacion: string;
  estado: EstadoSensor;
  ultima_conexion: Timestamp | null;
  calibracion_caduca: DateOnly | null;
  is_simulated: boolean;
}

/** `medicion_signos_vitales` — serie temporal de signos vitales. */
export interface MedicionSignosVitalesRow {
  id: number;
  mision_id: UUID;
  tripulante_id: UUID;
  sensor_id: UUID | null;
  registrado_por: UUID | null;
  medido_en: Timestamp;
  dia_mision: number;
  frecuencia_cardiaca_bpm: number | null;
  spo2_pct: number | null;
  temperatura_corporal_c: number | null;
  presion_sistolica_mmhg: number | null;
  presion_diastolica_mmhg: number | null;
  frecuencia_respiratoria_rpm: number | null;
  hrv_rmssd_ms: number | null;
  variacion_fc_pct: number | null;
  origen: OrigenDato;
  contexto: string | null;
  es_simulado: boolean;
  created_at: Timestamp;
}

/** `linea_base` — rango de referencia personal por métrica. */
export interface LineaBaseRow {
  id: UUID;
  tripulante_id: UUID;
  mision_id: UUID;
  metrica: string;
  valor_min: number;
  valor_max: number;
  unidad: string;
  ventana_dias: number;
  referencia: string;
  calculado_desde: Timestamp | null;
  vigente_desde: DateOnly;
  vigente_hasta: DateOnly | null;
  notas: string | null;
}

/** `resumen_bienestar_diario` — un resumen por tripulante y día. */
export interface ResumenBienestarDiarioRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID;
  fecha: DateOnly;
  horas_sueno: number | null;
  hrv_ms: number | null;
  minutos_ejercicio: number | null;
  minutos_ejercicio_obj: number | null;
  hidratacion_litros: number | null;
  exposicion_luz_lux: number | null;
  pasos: number | null;
  puntaje_bienestar: number | null;
  estado: EstadoBienestar;
  es_simulado: boolean;
  created_at: Timestamp;
}

/** `rutina_diaria` — agenda compartida de la tripulación. */
export interface RutinaDiariaRow {
  id: UUID;
  mision_id: UUID;
  fecha: DateOnly;
  hora_inicio_utc: string;
  titulo: string;
  nota: string;
  categoria: string;
  duracion_min: number | null;
  asignado_a: UUID | null;
  estado: EstadoRutina;
  completado_en: Timestamp | null;
  created_at: Timestamp;
}

/** `entrada_bitacora` — registro subjetivo de bienestar. */
export interface EntradaBitacoraRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID;
  fecha: DateOnly;
  estado_animo: string;
  cuerpo: string;
  pregunta_id: UUID | null;
  es_privada: boolean;
  es_simulated: boolean;
  created_at: Timestamp;
}

/** `pregunta_bitacora` — pregunta diaria. */
export interface PreguntaBitacoraRow {
  id: UUID;
  mision_id: UUID | null;
  texto: string;
  fecha: DateOnly | null;
  activa: boolean;
}

/** `lectura_entorno` — telemetría de la cabina. */
export interface LecturaEntornoRow {
  id: number;
  mision_id: UUID;
  sensor_id: UUID | null;
  modulo: string;
  metrica: string;
  valor: number;
  unidad: string;
  leido_en: Timestamp;
  dia_mision: number;
  estado_etiqueta: string;
  porcentaje_escala: number;
  dentro_de_umbral: boolean;
  es_simulado: boolean;
}

/** `exposicion_radiacion_diaria` — dosis acumulada de radiación. */
export interface ExposicionRadiacionDiariaRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID | null;
  fecha: DateOnly;
  dosis_dia_msv: number;
  dosis_acumulada_msv: number;
  origen: string;
  es_simulado: boolean;
}

/** `alerta` — señal explicable, nunca diagnóstico. */
export interface AlertaRow {
  id: UUID;
  mision_id: UUID;
  tripulante_id: UUID | null;
  sensor_id: UUID | null;
  titulo: string;
  tipo: TipoAlerta;
  nivel: NivelAlerta;
  detalle: string;
  accion_recomendada: string;
  destinatario_texto: string;
  metrica: string | null;
  valor_observado: number | null;
  valor_linea_base: number | null;
  desviacion_pct: number | null;
  ventana_minutos: number | null;
  disparada_en: Timestamp;
  estado: EstadoAlerta;
  revisada_por: UUID | null;
  revisada_en: Timestamp | null;
  notas_resolucion: string | null;
  es_simulated: boolean;
}

/** `regla_alerta` — umbral configurable y explicable. */
export interface ReglaAlertaRow {
  id: UUID;
  mision_id: UUID | null;
  nombre: string;
  metrica: string;
  comparador: "<" | ">" | "<=" | ">=" | "entre";
  valor_umbral: number;
  valor_umbral_alt: number | null;
  unidad: string | null;
  ventana_minutos: number;
  desviacion_pct_min: number | null;
  nivel: NivelAlerta;
  tipo_alerta: TipoAlerta;
  plantilla_titulo: string;
  plantilla_detalle: string;
  plantilla_accion: string;
  activa: boolean;
  requiere_validacion_medica: boolean;
  created_at: Timestamp;
}

/** `protocolo` — plantilla de lista de comprobación. */
export interface ProtocoloRow {
  id: UUID;
  codigo: string;
  titulo: string;
  categoria: string;
  descripcion: string;
  ambito_entornos: EntornoCodigo[];
  version: string;
  sustituye_a: UUID | null;
  activo: boolean;
  creado_por: UUID | null;
  created_at: Timestamp;
}

/** `paso_protocolo` — un paso de la plantilla. */
export interface PasoProtocoloRow {
  id: UUID;
  protocolo_id: UUID;
  orden: number;
  instruccion: string;
  requiere_nota: boolean;
}

/** `ejecucion_protocolo` — una apertura concreta de la plantilla. */
export interface EjecucionProtocoloRow {
  id: UUID;
  protocolo_id: UUID;
  tripulante_id: UUID | null;
  mision_id: UUID | null;
  iniciado_en: Timestamp;
  completado_en: Timestamp | null;
  estado: "en_curso" | "completado" | "abandonado";
  entorno_snapshot: EntornoCodigo | null;
  notas: string | null;
}

/** `resultado_paso` — marca de cada paso de una ejecución. */
export interface ResultadoPasoRow {
  id: UUID;
  ejecucion_id: UUID;
  paso_id: UUID;
  marcado: boolean;
  marcado_en: Timestamp | null;
  nota: string | null;
}

/** `preferencia_usuario` — "Configuración de misión". */
export interface PreferenciaUsuarioRow {
  id: UUID;
  usuario_id: UUID;
  mision_id: UUID | null;
  entorno_id: UUID | null;
  modo_local: boolean;
  timezone: string;
  ventana_grafico: "24 horas" | "7 días";
  metrica_grafico: string;
  extras: Record<string, unknown>;
  actualizado_en: Timestamp;
}

/** `cola_sincronizacion` — operaciones pendientes de subir a Tierra. */
export interface ColaSincronizacionRow {
  id: number;
  dispositivo_id: string;
  entidad_tipo: string;
  entidad_id: string | null;
  operacion: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  creado_en: Timestamp;
  sincronizado_en: Timestamp | null;
}

/** `reporte_exportado` — historial de exportaciones CSV. */
export interface ReporteExportadoRow {
  id: UUID;
  mision_id: UUID;
  solicitado_por: UUID | null;
  formato: string;
  nombre_archivo: string;
  parametros: Record<string, unknown>;
  generado_en: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* Conjunto completo de tablas                                                  */
/* -------------------------------------------------------------------------- */

/** Réplica en memoria del esquema `docs/esquema-base-datos.sql`. */
export interface MockDatabase {
  entorno: EntornoRow[];
  mision: MisionRow[];
  tripulante: TripulanteRow[];
  tripulacion_mision: TripulacionMisionRow[];
  usuario: UsuarioRow[];
  sensor: SensorRow[];
  medicion_signos_vitales: MedicionSignosVitalesRow[];
  linea_base: LineaBaseRow[];
  resumen_bienestar_diario: ResumenBienestarDiarioRow[];
  rutina_diaria: RutinaDiariaRow[];
  entrada_bitacora: EntradaBitacoraRow[];
  pregunta_bitacora: PreguntaBitacoraRow[];
  lectura_entorno: LecturaEntornoRow[];
  exposicion_radiacion_diaria: ExposicionRadiacionDiariaRow[];
  alerta: AlertaRow[];
  regla_alerta: ReglaAlertaRow[];
  protocolo: ProtocoloRow[];
  paso_protocolo: PasoProtocoloRow[];
  ejecucion_protocolo: EjecucionProtocoloRow[];
  resultado_paso: ResultadoPasoRow[];
  preferencia_usuario: PreferenciaUsuarioRow[];
  cola_sincronizacion: ColaSincronizacionRow[];
  reporte_exportado: ReporteExportadoRow[];
}
