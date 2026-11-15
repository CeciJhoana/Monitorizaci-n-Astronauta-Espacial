/**
 * Datos semilla de la base de datos simulada de Órbita.
 *
 * Genera las 23 tablas del esquema `docs/esquema-base-datos.sql` con los
 * mismos valores que usa hoy el prototipo (Elena Martínez, James Miller,
 * Yuki Tanaka y Alex Petrov en la misión ARES–01, día 128).
 *
 * Todo es determinista: un PRNG con semilla fija y las fechas ancladas al
 * momento de carga, de modo que dos ejecuciones producen la misma misión.
 */

import type {
  AlertaRow,
  DateOnly,
  EntornoRow,
  EstadoRutina,
  LecturaEntornoRow,
  MedicionSignosVitalesRow,
  MockDatabase,
  ResumenBienestarDiarioRow,
  RolTripulante,
  Timestamp,
  UUID,
} from "./schema";

/* -------------------------------------------------------------------------- */
/* Utilidades de fecha y aleatoriedad reproducible                             */
/* -------------------------------------------------------------------------- */

const NOW = new Date();

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * HOUR_MS);
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

function iso(date: Date): Timestamp {
  return date.toISOString();
}

function dateOnly(date: Date): DateOnly {
  return date.toISOString().slice(0, 10);
}

/** PRNG determinista (mulberry32) para series simuladas estables. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = createRandom(20261128);

/** Ruido aleatorio redondeado, centrado en 0. */
function noise(spread: number): number {
  return Math.round((random() * 2 - 1) * spread);
}

/* -------------------------------------------------------------------------- */
/* Identificadores y constantes de la misión                                   */
/* -------------------------------------------------------------------------- */

export const MISSION_DAY = 128;
export const MISSION_TOTAL_DAYS = 210;

export const ID = {
  entornoOrbital: "entorno-orbital",
  entornoLunar: "entorno-lunar",
  entornoMarte: "entorno-marte",
  mision: "mision-ares-01",
  tripulante01: "tripulante-01",
  tripulante02: "tripulante-02",
  tripulante03: "tripulante-03",
  tripulante04: "tripulante-04",
  usuario01: "usuario-01",
  usuario02: "usuario-02",
  usuario03: "usuario-03",
  usuario04: "usuario-04",
  sensorHabitacion: "sensor-habitacion-co2",
  sensorRadiacion: "sensor-habitacion-radiacion",
  sensorTemperatura: "sensor-habitacion-temperatura",
  sensorLuz: "sensor-habitacion-luz",
  preguntaBitacora: "pregunta-bitacora-128",
  reglaHrv: "regla-hrv",
  reglaCo2: "regla-co2",
  reglaSpo2: "regla-spo2",
} as const;

/** Definición canónica de cada tripulante (base de la simulación). */
interface CrewProfile {
  id: UUID;
  codigo: string;
  nombre: string;
  iniciales: string;
  rol: RolTripulante;
  color: string;
  estado: "nominal" | "en_observacion";
  hr: number;
  spo2: number;
  temp: number;
  sistolica: number;
  diastolica: number;
  respiratoria: number;
  hrv: number;
  sueno: number;
  ejercicio: number;
  ejercicioObjetivo: number;
  hidratacion: number;
  lux: number;
  puntaje: number;
  fcMin: number;
  fcMax: number;
}

const PERFILES: CrewProfile[] = [
  {
    id: ID.tripulante01,
    codigo: "01",
    nombre: "Elena Martínez",
    iniciales: "EM",
    rol: "comandante",
    color: "purple",
    estado: "nominal",
    hr: 68,
    spo2: 98,
    temp: 36.6,
    sistolica: 118,
    diastolica: 76,
    respiratoria: 15,
    hrv: 56,
    sueno: 7.8,
    ejercicio: 65,
    ejercicioObjetivo: 60,
    hidratacion: 2.2,
    lux: 540,
    puntaje: 96,
    fcMin: 64,
    fcMax: 74,
  },
  {
    id: ID.tripulante02,
    codigo: "02",
    nombre: "James Miller",
    iniciales: "JM",
    rol: "ingeniero_vuelo",
    color: "blue",
    estado: "en_observacion",
    hr: 82,
    spo2: 97,
    temp: 36.8,
    sistolica: 124,
    diastolica: 80,
    respiratoria: 18,
    hrv: 43,
    sueno: 5.9,
    ejercicio: 35,
    ejercicioObjetivo: 60,
    hidratacion: 1.6,
    lux: 220,
    puntaje: 78,
    fcMin: 66,
    fcMax: 76,
  },
  {
    id: ID.tripulante03,
    codigo: "03",
    nombre: "Yuki Tanaka",
    iniciales: "YT",
    rol: "oficial_medico",
    color: "rose",
    estado: "nominal",
    hr: 65,
    spo2: 99,
    temp: 36.5,
    sistolica: 112,
    diastolica: 72,
    respiratoria: 14,
    hrv: 56,
    sueno: 8.1,
    ejercicio: 65,
    ejercicioObjetivo: 60,
    hidratacion: 2.2,
    lux: 540,
    puntaje: 98,
    fcMin: 60,
    fcMax: 74,
  },
  {
    id: ID.tripulante04,
    codigo: "04",
    nombre: "Alex Petrov",
    iniciales: "AP",
    rol: "especialista_mision",
    color: "sand",
    estado: "nominal",
    hr: 71,
    spo2: 98,
    temp: 36.7,
    sistolica: 120,
    diastolica: 78,
    respiratoria: 15,
    hrv: 56,
    sueno: 7.5,
    ejercicio: 65,
    ejercicioObjetivo: 60,
    hidratacion: 2.2,
    lux: 540,
    puntaje: 94,
    fcMin: 60,
    fcMax: 74,
  },
];

/* -------------------------------------------------------------------------- */
/* Construcción de las tablas                                                   */
/* -------------------------------------------------------------------------- */

function construirEntornos(): EntornoRow[] {
  const comun = {
    ventana_luz_inicio: "06:30:00",
    ventana_luz_fin: "08:00:00",
    activo: true,
    created_at: iso(daysAgo(200)),
  };
  return [
    {
      id: ID.entornoOrbital,
      codigo: "orbital",
      nombre: "Estación orbital",
      factor_gravedad: 0,
      descripcion: "Microgravedad en órbita terrestre a 408 km",
      ...comun,
    },
    {
      id: ID.entornoLunar,
      codigo: "lunar",
      nombre: "Base lunar",
      factor_gravedad: 0.16,
      descripcion: "Gravedad lunar",
      ...comun,
    },
    {
      id: ID.entornoMarte,
      codigo: "marte",
      nombre: "Base marciana",
      factor_gravedad: 0.38,
      descripcion: "Gravedad marciana",
      ...comun,
    },
  ];
}

function construirMision(): MockDatabase["mision"] {
  return [
    {
      id: ID.mision,
      codigo: "ARES-01",
      expedicion: "EXPEDICIÓN 07",
      nombre: "Misión de exploración",
      descripcion: "Misión de exploración ARES-01",
      fecha_inicio: dateOnly(daysAgo(MISSION_DAY - 1)),
      fecha_fin_prevista: dateOnly(daysAgo(MISSION_TOTAL_DAYS - MISSION_DAY)),
      duracion_dias: MISSION_TOTAL_DAYS,
      entorno_id: ID.entornoOrbital,
      altitud_orbita_km: 408,
      estado: "activa",
      creado_por: ID.usuario01,
      created_at: iso(daysAgo(MISSION_DAY - 1)),
      updated_at: iso(NOW),
    },
  ];
}

function construirTripulantes(): MockDatabase["tripulante"] {
  return PERFILES.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre_completo: p.nombre,
    iniciales: p.iniciales,
    rol: p.rol,
    color_avatar: p.color,
    nacionalidad: "ES",
    fecha_nacimiento: "1990-04-12",
    genero: "no_especificado",
    estado: p.estado,
    is_simulated: true,
    created_at: iso(daysAgo(MISSION_DAY - 1)),
  }));
}

function construirTripulacion(): MockDatabase["tripulacion_mision"] {
  return PERFILES.map((p) => ({
    id: `tripulacion-${p.codigo}`,
    mision_id: ID.mision,
    tripulante_id: p.id,
    rol_en_mision: p.rol,
    es_comandante: p.codigo === "01",
    puesto: `Sillón ${p.codigo}`,
    dia_ingreso: 1,
    dia_salida: null,
  }));
}

function construirUsuarios(): MockDatabase["usuario"] {
  const roles = {
    comandante: "comandante",
    ingeniero_vuelo: "oficial_medico",
    oficial_medico: "oficial_medico",
    especialista_mision: "control_mision",
  } as const;
  return PERFILES.map((p) => ({
    id: `usuario-${p.codigo}`,
    tripulante_id: p.id,
    email: `${p.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, ".")}@orbita.space`,
    nombre_mostrado: p.nombre,
    rol: roles[p.rol],
    password_hash: null,
    ultimo_acceso: iso(hoursAgo(3)),
    activo: true,
    created_at: iso(daysAgo(MISSION_DAY - 1)),
  }));
}

function construirSensores(): MockDatabase["sensor"] {
  const sensores: MockDatabase["sensor"] = [];
  const plantillas = [
    { tipo: "frecuencia_cardiaca", ubicacion: "Tórax", nombre: "Sensor cardíaco" },
    { tipo: "pulsoximetro", ubicacion: "Mano", nombre: "Pulsioxímetro" },
    { tipo: "termometro", ubicacion: "Cabeza", nombre: "Referencia térmica" },
    { tipo: "manguito_presion", ubicacion: "Brazo", nombre: "Manguito de presión" },
    { tipo: "sensor_respiratorio", ubicacion: "Pulmones", nombre: "Sensor respiratorio" },
  ] as const;

  for (const p of PERFILES) {
    plantillas.forEach((plantilla, indice) => {
      sensores.push({
        id: `sensor-${p.codigo}-${plantilla.tipo}`,
        mision_id: ID.mision,
        tripulante_id: p.id,
        nombre: `${plantilla.nombre} · ${p.iniciales}`,
        tipo: plantilla.tipo,
        modelo: `Orbita-S${indice + 1}`,
        numero_serie: `ORB-${p.codigo}-${String(indice + 1).padStart(3, "0")}`,
        ubicacion: plantilla.ubicacion,
        estado: "en_linea",
        ultima_conexion: iso(hoursAgo(0.01)),
        calibracion_caduca: dateOnly(daysAgo(-45)),
        is_simulated: true,
      });
    });
  }

  const modulo: Array<{
    id: UUID;
    tipo: MockDatabase["sensor"][number]["tipo"];
    nombre: string;
    ubicacion: string;
  }> = [
    {
      id: ID.sensorHabitacion,
      tipo: "co2",
      nombre: "Sensor de CO₂ · módulo de habitación",
      ubicacion: "Módulo de habitación",
    },
    {
      id: ID.sensorRadiacion,
      tipo: "radiacion",
      nombre: "Dosímetro · módulo de habitación",
      ubicacion: "Módulo de habitación",
    },
    {
      id: ID.sensorTemperatura,
      tipo: "temperatura_ambiente",
      nombre: "Sensor de temperatura · cabina",
      ubicacion: "Cabina principal",
    },
    {
      id: ID.sensorLuz,
      tipo: "luz",
      nombre: "Sensor de luz · zona de descanso",
      ubicacion: "Zona de descanso",
    },
  ];

  for (const sensor of modulo) {
    sensores.push({
      id: sensor.id,
      mision_id: ID.mision,
      tripulante_id: null,
      nombre: sensor.nombre,
      tipo: sensor.tipo,
      modelo: "Hab-1",
      numero_serie: `ORB-HAB-${sensor.tipo.toUpperCase().slice(0, 3)}`,
      ubicacion: sensor.ubicacion,
      estado: "en_linea",
      ultima_conexion: iso(hoursAgo(0.02)),
      calibracion_caduca: dateOnly(daysAgo(-30)),
      is_simulated: true,
    });
  }

  return sensores;
}

/**
 * Serie de signos vitales: una lectura cada 2 horas durante los últimos
 * 7 días por tripulante. El último punto es exactamente el valor "en vivo"
 * que muestra el prototipo.
 */
function construirMediciones(): MedicionSignosVitalesRow[] {
  const filas: MedicionSignosVitalesRow[] = [];
  const PASOS = 84; // 7 días × 12 lecturas de 2 horas
  const PASO_HORAS = 2;

  for (const p of PERFILES) {
    for (let i = PASOS - 1; i >= 0; i--) {
      const fecha = hoursAgo(i * PASO_HORAS);
      const esUltimo = i === 0;
      const hora = fecha.getHours();
      // Ritmo circadiano: la frecuencia sube por la tarde y cae de madrugada.
      const circadiano = 3 * Math.sin(((hora - 6) / 24) * 2 * Math.PI);
      // James Miller lleva dos días por encima de su línea base.
      const enAlerta = p.codigo === "02" && i <= 24;
      const hr = esUltimo ? p.hr : Math.round(p.hr + circadiano + noise(2) + (enAlerta ? 6 : 0));
      const spo2 = esUltimo ? p.spo2 : Math.min(100, Math.round(p.spo2 + noise(1)));
      const temp = esUltimo ? p.temp : Math.round((p.temp + noise(2) / 10) * 10) / 10;
      const sistolica = esUltimo
        ? p.sistolica
        : Math.round(p.sistolica + circadiano / 2 + noise(3));
      const diastolica = esUltimo ? p.diastolica : Math.round(p.diastolica + noise(2));
      const respiratoria = esUltimo ? p.respiratoria : Math.round(p.respiratoria + noise(1));
      const hrv = esUltimo ? p.hrv : Math.round((p.hrv + noise(6) + (enAlerta ? -8 : 0)) * 10) / 10;

      filas.push({
        id: filas.length + 1,
        mision_id: ID.mision,
        tripulante_id: p.id,
        sensor_id: `sensor-${p.codigo}-frecuencia_cardiaca`,
        registrado_por: null,
        medido_en: iso(fecha),
        dia_mision: MISSION_DAY,
        frecuencia_cardiaca_bpm: hr,
        spo2_pct: spo2,
        temperatura_corporal_c: temp,
        presion_sistolica_mmhg: sistolica,
        presion_diastolica_mmhg: diastolica,
        frecuencia_respiratoria_rpm: respiratoria,
        hrv_rmssd_ms: hrv,
        variacion_fc_pct: Math.round(((hr - p.hr) / p.hr) * 1000) / 10,
        origen: "sensor",
        contexto: hora >= 6 && hora < 8 ? "post-ejercicio" : null,
        es_simulado: true,
        created_at: iso(fecha),
      });
    }
  }

  return filas;
}

function construirLineasBase(): MockDatabase["linea_base"] {
  const metricas: Array<{
    metrica: string;
    unidad: string;
    min: number;
    max: number;
  }> = [
    { metrica: "frecuencia_cardiaca_bpm", unidad: "lpm", min: 60, max: 74 },
    { metrica: "spo2_pct", unidad: "%", min: 97, max: 99 },
    { metrica: "temperatura_corporal_c", unidad: "°C", min: 36.4, max: 37 },
    { metrica: "hrv_rmssd_ms", unidad: "ms", min: 43, max: 56 },
  ];

  const filas: MockDatabase["linea_base"] = [];
  for (const p of PERFILES) {
    for (const metrica of metricas) {
      const esHr = metrica.metrica === "frecuencia_cardiaca_bpm";
      filas.push({
        id: `linea-base-${p.codigo}-${metrica.metrica}`,
        tripulante_id: p.id,
        mision_id: ID.mision,
        metrica: metrica.metrica,
        valor_min: esHr ? p.fcMin : metrica.min,
        valor_max: esHr ? p.fcMax : metrica.max,
        unidad: metrica.unidad,
        ventana_dias: 14,
        referencia:
          "64–74 lpm · SpO₂ 97–99% · Temperatura 36.4–37.0 °C. Referencia de los primeros 14 días de misión.",
        calculado_desde: iso(daysAgo(MISSION_DAY - 1)),
        vigente_desde: dateOnly(daysAgo(MISSION_DAY - 1)),
        vigente_hasta: null,
        notas: null,
      });
    }
  }
  return filas;
}

function construirBienestar(): ResumenBienestarDiarioRow[] {
  const filas: ResumenBienestarDiarioRow[] = [];
  for (let dia = 6; dia >= 0; dia--) {
    const fecha = dateOnly(daysAgo(dia));
    for (const p of PERFILES) {
      const esHoy = dia === 0;
      const enAlerta = p.codigo === "02" && dia <= 1;
      filas.push({
        id: `bienestar-${p.codigo}-${dia}`,
        mision_id: ID.mision,
        tripulante_id: p.id,
        fecha,
        horas_sueno: esHoy ? p.sueno : Math.round((p.sueno + (random() * 2 - 1)) * 10) / 10,
        hrv_ms: esHoy ? p.hrv : Math.round((p.hrv + (random() * 14 - 7)) * 10) / 10,
        minutos_ejercicio: esHoy ? p.ejercicio : Math.round(p.ejercicio + (random() * 20 - 10)),
        minutos_ejercicio_obj: p.ejercicioObjetivo,
        hidratacion_litros: esHoy
          ? p.hidratacion
          : Math.round((p.hidratacion + (random() * 0.6 - 0.3)) * 10) / 10,
        exposicion_luz_lux: esHoy ? p.lux : Math.round(p.lux + (random() * 160 - 80)),
        pasos: Math.round(4200 + random() * 5200),
        puntaje_bienestar: esHoy
          ? p.puntaje
          : Math.max(40, Math.min(100, p.puntaje + Math.round(random() * 14 - 7))),
        estado: enAlerta ? "revision" : "nominal",
        es_simulado: true,
        created_at: iso(daysAgo(dia)),
      });
    }
  }
  return filas;
}

function construirRutinas(): MockDatabase["rutina_diaria"] {
  const items: Array<{
    hora: string;
    titulo: string;
    nota: string;
    duracion: number;
    estado: EstadoRutina;
  }> = [
    {
      hora: "06:30:00",
      titulo: "Exposición a luz y activación",
      nota: "Ventana circadiana · 30 min",
      duracion: 30,
      estado: "completado",
    },
    {
      hora: "12:00:00",
      titulo: "Pausa de hidratación",
      nota: "Revisión individual de hábitos",
      duracion: 10,
      estado: "completado",
    },
    {
      hora: "16:00:00",
      titulo: "Ejercicio de la tripulación",
      nota: "Resistencia y movilidad · 60 min",
      duracion: 60,
      estado: "programado",
    },
    {
      hora: "20:30:00",
      titulo: "Bitácora y desconexión",
      nota: "Registro de bienestar · 10 min",
      duracion: 10,
      estado: "programado",
    },
  ];

  return items.map((item, indice) => ({
    id: `rutina-${indice + 1}`,
    mision_id: ID.mision,
    fecha: dateOnly(NOW),
    hora_inicio_utc: item.hora,
    titulo: item.titulo,
    nota: item.nota,
    categoria: "BIENESTAR",
    duracion_min: item.duracion,
    asignado_a: null,
    estado: item.estado,
    completado_en: item.estado === "completado" ? iso(hoursAgo(1)) : null,
    created_at: iso(daysAgo(1)),
  }));
}

/** CO₂ sube de 1.800 a 2.450 ppm en las últimas 3 horas (texto de la alerta). */
function construirLecturasEntorno(): LecturaEntornoRow[] {
  const filas: LecturaEntornoRow[] = [];
  const PASOS = 7; // una lectura cada 30 minutos durante 3 horas

  for (let i = PASOS - 1; i >= 0; i--) {
    const fecha = hoursAgo(i * 0.5);
    const progreso = (PASOS - 1 - i) / (PASOS - 1);
    const co2 = Math.round(1800 + (2450 - 1800) * progreso);
    filas.push({
      id: filas.length + 1,
      mision_id: ID.mision,
      sensor_id: ID.sensorHabitacion,
      modulo: "Módulo de habitación",
      metrica: "co2_ppm",
      valor: co2,
      unidad: "ppm",
      leido_en: iso(fecha),
      dia_mision: MISSION_DAY,
      estado_etiqueta: co2 >= 2000 ? "En revisión" : "Habitual",
      porcentaje_escala: Math.min(100, Math.round((co2 / 3650) * 100)),
      dentro_de_umbral: co2 < 2000,
      es_simulado: true,
    });
  }

  const metricas: Array<{
    metrica: string;
    sensor: UUID;
    valor: number;
    unidad: string;
    estado: string;
    percent: number;
  }> = [
    {
      metrica: "radiacion_msv",
      sensor: ID.sensorRadiacion,
      valor: 0.42,
      unidad: "mSv",
      estado: "Habitual",
      percent: 34,
    },
    {
      metrica: "temperatura_c",
      sensor: ID.sensorTemperatura,
      valor: 22.4,
      unidad: "°C",
      estado: "Estable",
      percent: 49,
    },
  ];

  for (const metrica of metricas) {
    filas.push({
      id: filas.length + 1,
      mision_id: ID.mision,
      sensor_id: metrica.sensor,
      modulo: "Módulo de habitación",
      metrica: metrica.metrica,
      valor: metrica.valor,
      unidad: metrica.unidad,
      leido_en: iso(hoursAgo(0.05)),
      dia_mision: MISSION_DAY,
      estado_etiqueta: metrica.estado,
      porcentaje_escala: metrica.percent,
      dentro_de_umbral: true,
      es_simulado: true,
    });
  }

  return filas;
}

function construirAlertas(): AlertaRow[] {
  const alertas: AlertaRow[] = [
    {
      id: "alerta-hrv-james",
      mision_id: ID.mision,
      tripulante_id: ID.tripulante02,
      sensor_id: null,
      titulo: "Recuperación por debajo de la línea base",
      tipo: "bienestar",
      nivel: "preventiva",
      detalle:
        "HRV un 21% menor que su línea base de 54 ms, junto con 5.9 h de sueño. Tendencia sostenida durante los últimos 2 días.",
      accion_recomendada:
        "Revisar el descanso, registrar cómo se siente y consultar al oficial médico antes de tareas de alta exigencia.",
      destinatario_texto: "James Miller",
      metrica: "hrv_rmssd_ms",
      valor_observado: 43,
      valor_linea_base: 54,
      desviacion_pct: -21,
      ventana_minutos: 2880,
      disparada_en: iso(hoursAgo(0.2)),
      estado: "activa",
      revisada_por: null,
      revisada_en: null,
      notas_resolucion: null,
      es_simulated: true,
    },
    {
      id: "alerta-co2-cabina",
      mision_id: ID.mision,
      tripulante_id: null,
      sensor_id: ID.sensorHabitacion,
      titulo: "Exposición a CO₂ en aumento",
      tipo: "entorno",
      nivel: "revision",
      detalle:
        "La lectura simulada de CO₂ aumentó de 1,800 a 2,450 ppm en las últimas 3 horas. Se muestra como tendencia de revisión, no como umbral clínico validado.",
      accion_recomendada:
        "Verificar el sensor y consultar la lista de comprobación del sistema de ventilación de la misión.",
      destinatario_texto: "Módulo de habitación",
      metrica: "co2_ppm",
      valor_observado: 2450,
      valor_linea_base: 1800,
      desviacion_pct: 36.1,
      ventana_minutos: 180,
      disparada_en: iso(hoursAgo(0.57)),
      estado: "activa",
      revisada_por: null,
      revisada_en: null,
      notas_resolucion: null,
      es_simulated: true,
    },
    {
      id: "alerta-spo2-resuelta",
      mision_id: ID.mision,
      tripulante_id: ID.tripulante03,
      sensor_id: null,
      titulo: "Saturación de oxígeno por debajo de lo habitual",
      tipo: "vitales",
      nivel: "revision",
      detalle:
        "SpO₂ de 96% durante 12 minutos, por debajo del rango de referencia personal de 97–99%.",
      accion_recomendada: "Repetir la medición en reposo y verificar el ajuste del pulsioxímetro.",
      destinatario_texto: "Yuki Tanaka",
      metrica: "spo2_pct",
      valor_observado: 96,
      valor_linea_base: 98,
      desviacion_pct: -2,
      ventana_minutos: 15,
      disparada_en: iso(hoursAgo(19)),
      estado: "resuelta",
      revisada_por: "usuario-03",
      revisada_en: iso(hoursAgo(18.4)),
      notas_resolucion: "Lectura repetida en reposo: 99%. Sin acción adicional.",
      es_simulated: true,
    },
  ];

  return alertas;
}

function construirReglas(): MockDatabase["regla_alerta"] {
  return [
    {
      id: ID.reglaHrv,
      mision_id: ID.mision,
      nombre: "Recuperación bajo línea base",
      metrica: "hrv_rmssd_ms",
      comparador: "<",
      valor_umbral: 54,
      valor_umbral_alt: null,
      unidad: "ms",
      ventana_minutos: 2880,
      desviacion_pct_min: -21,
      nivel: "preventiva",
      tipo_alerta: "bienestar",
      plantilla_titulo: "Recuperación por debajo de la línea base",
      plantilla_detalle:
        "HRV un 21% menor que su línea base de 54 ms. Tendencia sostenida durante los últimos 2 días.",
      plantilla_accion:
        "Revisar el descanso y consultar al oficial médico antes de tareas de alta exigencia.",
      activa: true,
      requiere_validacion_medica: true,
      created_at: iso(daysAgo(MISSION_DAY - 1)),
    },
    {
      id: ID.reglaCo2,
      mision_id: ID.mision,
      nombre: "CO₂ en aumento",
      metrica: "co2_ppm",
      comparador: ">",
      valor_umbral: 2000,
      valor_umbral_alt: null,
      unidad: "ppm",
      ventana_minutos: 180,
      desviacion_pct_min: null,
      nivel: "revision",
      tipo_alerta: "entorno",
      plantilla_titulo: "Exposición a CO₂ en aumento",
      plantilla_detalle:
        "La lectura de CO₂ aumentó de 1,800 a 2,450 ppm en las últimas 3 horas. Tendencia de revisión, no umbral clínico validado.",
      plantilla_accion:
        "Verificar el sensor y consultar la lista de comprobación del sistema de ventilación.",
      activa: true,
      requiere_validacion_medica: true,
      created_at: iso(daysAgo(MISSION_DAY - 1)),
    },
    {
      id: ID.reglaSpo2,
      mision_id: ID.mision,
      nombre: "Saturación de oxígeno baja",
      metrica: "spo2_pct",
      comparador: "<",
      valor_umbral: 95,
      valor_umbral_alt: null,
      unidad: "%",
      ventana_minutos: 15,
      desviacion_pct_min: null,
      nivel: "critica",
      tipo_alerta: "vitales",
      plantilla_titulo: "Saturación de oxígeno por debajo de lo habitual",
      plantilla_detalle: "SpO₂ fuera del rango de referencia personal durante más de 15 minutos.",
      plantilla_accion: "Repetir la medición y avisar al oficial médico de la misión.",
      activa: true,
      requiere_validacion_medica: true,
      created_at: iso(daysAgo(MISSION_DAY - 1)),
    },
  ];
}

function construirProtocolos(): {
  protocolos: MockDatabase["protocolo"];
  pasos: MockDatabase["paso_protocolo"];
} {
  const definiciones: Array<{
    codigo: string;
    titulo: string;
    categoria: string;
    descripcion: string;
    pasos: string[];
  }> = [
    {
      codigo: "MED-01",
      titulo: "Tomar una medición",
      categoria: "MONITOREO RUTINARIO",
      descripcion: "Preparación del sensor, captura y verificación de lecturas.",
      pasos: [
        "Identificar al tripulante y el sensor autorizado.",
        "Comprobar el ajuste y seguir el manual del fabricante.",
        "Esperar una lectura estable y anotar el contexto.",
        "Registrar el valor; si hay dudas, consultar al oficial médico.",
      ],
    },
    {
      codigo: "WEL-01",
      titulo: "Revisar fatiga y descanso",
      categoria: "BIENESTAR",
      descripcion: "Contextualizar sueño, recuperación y cambios de bienestar.",
      pasos: [
        "Consultar el registro de sueño y la línea base individual.",
        "Preguntar por fatiga, malestar y estado de ánimo.",
        "Revisar la rutina con el responsable de salud de la misión.",
        "Registrar la observación y acordar una nueva revisión.",
      ],
    },
    {
      codigo: "HAB-01",
      titulo: "Comprobar el entorno",
      categoria: "SEGURIDAD DEL HÁBITAT",
      descripcion: "Verificar sensores de cabina y escalar incidencias.",
      pasos: [
        "Verificar la lectura y el estado del sensor de cabina.",
        "Comparar con sensores redundantes si están disponibles.",
        "Consultar la lista oficial de control ambiental de la nave.",
        "Escalar la incidencia al responsable de sistemas.",
      ],
    },
    {
      codigo: "AUT-01",
      titulo: "Operar sin conexión",
      categoria: "AUTONOMÍA DE MISIÓN",
      descripcion: "Continuidad local y preparación de información para Tierra.",
      pasos: [
        "Confirmar el estado del enlace mediante el sistema de misión.",
        "Mantener los registros mediante el procedimiento local autorizado.",
        "Preparar el resumen de observaciones para control de misión.",
        "Al restablecer el enlace, verificar la recepción por el canal oficial.",
      ],
    },
  ];

  const protocolos: MockDatabase["protocolo"] = [];
  const pasos: MockDatabase["paso_protocolo"] = [];

  for (const definicion of definiciones) {
    const protocoloId = `protocolo-${definicion.codigo}`;
    protocolos.push({
      id: protocoloId,
      codigo: definicion.codigo,
      titulo: definicion.titulo,
      categoria: definicion.categoria,
      descripcion: definicion.descripcion,
      ambito_entornos: ["orbital", "lunar", "marte"],
      version: "1.0",
      sustituye_a: null,
      activo: true,
      creado_por: ID.usuario03,
      created_at: iso(daysAgo(MISSION_DAY - 1)),
    });
    definicion.pasos.forEach((instruccion, indice) => {
      pasos.push({
        id: `paso-${definicion.codigo}-${indice + 1}`,
        protocolo_id: protocoloId,
        orden: indice + 1,
        instruccion,
        requiere_nota: false,
      });
    });
  }

  return { protocolos, pasos };
}

/* -------------------------------------------------------------------------- */
/* Base de datos completa                                                       */
/* -------------------------------------------------------------------------- */

export function createMockDatabase(): MockDatabase {
  const { protocolos, pasos } = construirProtocolos();

  const base: MockDatabase = {
    entorno: construirEntornos(),
    mision: construirMision(),
    tripulante: construirTripulantes(),
    tripulacion_mision: construirTripulacion(),
    usuario: construirUsuarios(),
    sensor: construirSensores(),
    medicion_signos_vitales: construirMediciones(),
    linea_base: construirLineasBase(),
    resumen_bienestar_diario: construirBienestar(),
    rutina_diaria: construirRutinas(),
    entrada_bitacora: [
      {
        id: "bitacora-01",
        mision_id: ID.mision,
        tripulante_id: ID.tripulante01,
        fecha: dateOnly(daysAgo(1)),
        estado_animo: "Muy bien",
        cuerpo:
          "El ejercicio de la tarde me dejó con más energía que en días anteriores. Buena jornada de experimentos.",
        pregunta_id: null,
        es_privada: true,
        es_simulated: true,
        created_at: iso(hoursAgo(22)),
      },
      {
        id: "bitacora-02",
        mision_id: ID.mision,
        tripulante_id: ID.tripulante01,
        fecha: dateOnly(daysAgo(0)),
        estado_animo: "Bien",
        cuerpo:
          "La ventana de luz de esta mañana me ayudó a despertar. Me preocupa el cansancio de James, lo comento en la ronda de hoy.",
        pregunta_id: ID.preguntaBitacora,
        es_privada: true,
        es_simulated: true,
        created_at: iso(hoursAgo(2)),
      },
    ],
    pregunta_bitacora: [
      {
        id: ID.preguntaBitacora,
        mision_id: ID.mision,
        texto: "¿Qué te ha hecho sentir conectado con tu tripulación?",
        fecha: dateOnly(NOW),
        activa: true,
      },
    ],
    lectura_entorno: construirLecturasEntorno(),
    exposicion_radiacion_diaria: construirRadiacion(),
    alerta: construirAlertas(),
    regla_alerta: construirReglas(),
    protocolo: protocolos,
    paso_protocolo: pasos,
    ejecucion_protocolo: [
      {
        id: "ejecucion-wel-james",
        protocolo_id: "protocolo-WEL-01",
        tripulante_id: ID.tripulante02,
        mision_id: ID.mision,
        iniciado_en: iso(hoursAgo(6)),
        completado_en: null,
        estado: "en_curso",
        entorno_snapshot: "orbital",
        notas: "Revisión abierta por la alerta de recuperación.",
      },
      {
        id: "ejecucion-med-elena",
        protocolo_id: "protocolo-MED-01",
        tripulante_id: ID.tripulante01,
        mision_id: ID.mision,
        iniciado_en: iso(hoursAgo(4)),
        completado_en: iso(hoursAgo(3.8)),
        estado: "completado",
        entorno_snapshot: "orbital",
        notas: null,
      },
    ],
    resultado_paso: [
      {
        id: "resultado-1",
        ejecucion_id: "ejecucion-wel-james",
        paso_id: "paso-WEL-01-1",
        marcado: true,
        marcado_en: iso(hoursAgo(5.8)),
        nota: null,
      },
      {
        id: "resultado-2",
        ejecucion_id: "ejecucion-wel-james",
        paso_id: "paso-WEL-01-2",
        marcado: true,
        marcado_en: iso(hoursAgo(5.5)),
        nota: null,
      },
      {
        id: "resultado-3",
        ejecucion_id: "ejecucion-med-elena",
        paso_id: "paso-MED-01-1",
        marcado: true,
        marcado_en: iso(hoursAgo(3.9)),
        nota: null,
      },
      {
        id: "resultado-4",
        ejecucion_id: "ejecucion-med-elena",
        paso_id: "paso-MED-01-2",
        marcado: true,
        marcado_en: iso(hoursAgo(3.9)),
        nota: null,
      },
      {
        id: "resultado-5",
        ejecucion_id: "ejecucion-med-elena",
        paso_id: "paso-MED-01-3",
        marcado: true,
        marcado_en: iso(hoursAgo(3.85)),
        nota: null,
      },
      {
        id: "resultado-6",
        ejecucion_id: "ejecucion-med-elena",
        paso_id: "paso-MED-01-4",
        marcado: true,
        marcado_en: iso(hoursAgo(3.8)),
        nota: null,
      },
    ],
    preferencia_usuario: [
      {
        id: "preferencia-usuario-01",
        usuario_id: ID.usuario01,
        mision_id: ID.mision,
        entorno_id: ID.entornoOrbital,
        modo_local: false,
        timezone: "UTC",
        ventana_grafico: "24 horas",
        metrica_grafico: "frecuencia_cardiaca",
        extras: {},
        actualizado_en: iso(daysAgo(1)),
      },
    ],
    cola_sincronizacion: [
      {
        id: 1,
        dispositivo_id: "terminal-habitat-01",
        entidad_tipo: "medicion_signos_vitales",
        entidad_id: null,
        operacion: "insert",
        payload: { tripulante_id: ID.tripulante02, origen: "manual" },
        creado_en: iso(hoursAgo(0.5)),
        sincronizado_en: null,
      },
    ],
    reporte_exportado: [
      {
        id: "reporte-1",
        mision_id: ID.mision,
        solicitado_por: ID.usuario01,
        formato: "csv",
        nombre_archivo: "orbita-informe-dia-128.csv",
        parametros: { dia_mision: MISSION_DAY, secciones: ["tripulacion", "mediciones"] },
        generado_en: iso(hoursAgo(5)),
      },
    ],
  };

  return base;
}

/**
 * Radiación acumulada: 28 días de exposición hasta 52.8 mSv el día 128.
 * La dosis diaria se genera primero y luego se acumula hacia atrás, de modo
 * que el último día cierre siempre en 52.8 mSv.
 */
function construirRadiacion(): MockDatabase["exposicion_radiacion_diaria"] {
  const filas: MockDatabase["exposicion_radiacion_diaria"] = [];
  const DIAS = 28;
  const DOSIS_ACUMULADA_HOY = 52.8;

  // Dosis diaria indexada por días transcurridos (0 = hoy).
  const dosisPorDia: number[] = [];
  for (let dia = 0; dia < DIAS; dia++) {
    dosisPorDia[dia] = Math.round((0.36 + random() * 0.14) * 1000) / 1000;
  }

  for (let dia = DIAS - 1; dia >= 0; dia--) {
    const fecha = dateOnly(daysAgo(dia));
    const dosis = dosisPorDia[dia];
    // Suma de las dosis de los días posteriores (día 0 … día−1).
    const acumulacionPrevia = dosisPorDia.slice(0, dia).reduce((total, valor) => total + valor, 0);
    const acumulado = Math.max(
      0,
      Math.round((DOSIS_ACUMULADA_HOY - acumulacionPrevia) * 100) / 100,
    );
    for (const p of PERFILES) {
      filas.push({
        id: `radiacion-${p.codigo}-${dia}`,
        mision_id: ID.mision,
        tripulante_id: p.id,
        fecha,
        dosis_dia_msv: dosis,
        dosis_acumulada_msv: acumulado,
        origen: "dosimetría personal",
        es_simulado: true,
      });
    }
  }
  return filas;
}
