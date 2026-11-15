/**
 * Adaptador de datos para el asistente ASTRA.
 *
 * Lee la base de datos en memoria (MOCK_DB de Saúl) y devuelve una estructura
 * desacoplada (`CompanionData`) para que el motor del asistente funcione
 * independientemente del origen de datos (en el futuro: Raspberry Pi en vivo).
 */

import type { MockDatabase, TripulanteRow } from "@/data/db/schema";

export interface CompanionData {
  tripulanteId: string;
  codigoTripulante: string;
  nombreTripulante: string;
  rolTripulante: string;
  sueno_horas?: number;
  eficiencia_sueno_pct?: number; // Saúl no lo incluyó en la DB -> undefined
  hrv_rmssd_ms?: number;
  hrv_linea_base_ms?: number;
  hrv_desviacion_pct?: number;
  actividad_min?: number;
  luz_lux?: number;
  social_pct?: number; // Saúl no lo incluyó en la DB -> undefined
  animo?: number; // Escala [-1.0, +1.0] calculada de la última bitácora
  animo_texto?: string;
  vitales: {
    frecuencia_cardiaca_bpm?: number;
    spo2_pct?: number;
    temperatura_corporal_c?: number;
    presion_sistolica_mmhg?: number;
    presion_diastolica_mmhg?: number;
    radiacion_mSv_h?: number;
  };
  entorno: {
    codigo: string;
    nombre: string;
    factor_gravedad: number;
    descripcion: string;
  };
}

/**
 * Mapeo de estado de ánimo de la bitácora a valor numérico según la especificación:
 * Muy bien = +0.6, Bien = +0.35, Regular = +0.1, Con dificultad = -0.4
 */
export function mapearAnimo(texto: string | null | undefined): { valor?: number; texto?: string } {
  if (!texto) return {};
  const t = texto.toLowerCase().trim();
  if (t.includes("muy bien")) return { valor: 0.6, texto: "Muy bien" };
  if (t.includes("bien")) return { valor: 0.35, texto: "Bien" };
  if (t.includes("regular")) return { valor: 0.1, texto: "Regular" };
  if (t.includes("dificultad") || t.includes("mal"))
    return { valor: -0.4, texto: "Con dificultad" };
  return { valor: 0.1, texto };
}

/**
 * Obtiene o calcula la línea base de HRV para un tripulante:
 * 1. Si existe una alerta previa con `valor_linea_base`, la reutiliza.
 * 2. Si no, calcula el promedio de las primeras mediciones (primeros 3 días) del historial.
 */
function resolverLineaBaseHrv(db: MockDatabase, tripulanteId: string): number {
  const alertaPrevia = db.alerta.find(
    (a) => a.tripulante_id === tripulanteId && a.metrica === "hrv_rmssd_ms" && a.valor_linea_base,
  );
  if (alertaPrevia?.valor_linea_base) {
    return alertaPrevia.valor_linea_base;
  }

  const mediciones = db.medicion_signos_vitales
    .filter((m) => m.tripulante_id === tripulanteId && m.hrv_rmssd_ms !== null)
    .sort((a, b) => a.medido_en.localeCompare(b.medido_en));

  if (mediciones.length === 0) return 54; // Valor estándar de referencia

  // Primeras 36 lecturas (~3 días) o la mitad inicial
  const muestra = mediciones.slice(0, Math.max(1, Math.min(36, Math.floor(mediciones.length / 2))));
  const suma = muestra.reduce((acc, m) => acc + (m.hrv_rmssd_ms ?? 0), 0);
  return Math.round((suma / muestra.length) * 10) / 10;
}

/**
 * Selecciona los datos relevantes para ASTRA desde la base de datos simulada.
 */
export function selectCompanionData(db: MockDatabase, tripulanteIdOrCode: string): CompanionData {
  const tripulante =
    db.tripulante.find(
      (t: TripulanteRow) => t.id === tripulanteIdOrCode || t.codigo === tripulanteIdOrCode,
    ) ?? db.tripulante[0];

  const tid = tripulante.id;

  // Última medición de signos vitales
  const ultimasMediciones = db.medicion_signos_vitales
    .filter((m) => m.tripulante_id === tid)
    .sort((a, b) => b.medido_en.localeCompare(a.medido_en));
  const ultimaMed = ultimasMediciones[0];

  // Último resumen de bienestar diario
  const ultimosResumenes = db.resumen_bienestar_diario
    .filter((r) => r.tripulante_id === tid)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ultimoResumen = ultimosResumenes[0];

  // Última entrada de bitácora
  const ultimasBitacoras = db.entrada_bitacora
    .filter((b) => b.tripulante_id === tid)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const ultimaBitacora = ultimasBitacoras[0];
  const { valor: animoValor, texto: animoTexto } = mapearAnimo(ultimaBitacora?.estado_animo);

  // Cálculo de HRV y desviación porcentual respecto a línea base
  const hrvObservado = ultimaMed?.hrv_rmssd_ms ?? ultimoResumen?.hrv_ms ?? undefined;
  let hrvLineaBase: number | undefined = undefined;
  let hrvDesviacionPct: number | undefined = undefined;

  if (hrvObservado !== undefined) {
    hrvLineaBase = resolverLineaBaseHrv(db, tid);
    if (hrvLineaBase > 0) {
      hrvDesviacionPct = Math.round(((hrvObservado - hrvLineaBase) / hrvLineaBase) * 1000) / 10;
    }
  }

  // Radiación actual de cabina
  const lecturaRad = db.lectura_entorno.find((l) => l.metrica === "radiacion_msv");
  const radiacionActual = lecturaRad?.valor ?? 0.42;

  // Entorno activo actual
  const entornoActivo = db.entorno.find((e) => e.activo) ?? db.entorno[0];

  return {
    tripulanteId: tripulante.id,
    codigoTripulante: tripulante.codigo,
    nombreTripulante: tripulante.nombre_completo,
    rolTripulante: tripulante.rol,
    sueno_horas: ultimoResumen?.horas_sueno ?? undefined,
    eficiencia_sueno_pct: undefined, // No existe en MOCK_DB de Saúl
    hrv_rmssd_ms: hrvObservado,
    hrv_linea_base_ms: hrvLineaBase,
    hrv_desviacion_pct: hrvDesviacionPct,
    actividad_min: ultimoResumen?.minutos_ejercicio ?? undefined,
    luz_lux: ultimoResumen?.exposicion_luz_lux ?? undefined,
    social_pct: undefined, // No existe en MOCK_DB de Saúl
    animo: animoValor,
    animo_texto: animoTexto,
    vitales: {
      frecuencia_cardiaca_bpm: ultimaMed?.frecuencia_cardiaca_bpm ?? undefined,
      spo2_pct: ultimaMed?.spo2_pct ?? undefined,
      temperatura_corporal_c: ultimaMed?.temperatura_corporal_c ?? undefined,
      presion_sistolica_mmhg: ultimaMed?.presion_sistolica_mmhg ?? undefined,
      presion_diastolica_mmhg: ultimaMed?.presion_diastolica_mmhg ?? undefined,
      radiacion_mSv_h: radiacionActual,
    },
    entorno: {
      codigo: entornoActivo.codigo,
      nombre: entornoActivo.nombre,
      factor_gravedad: entornoActivo.factor_gravedad,
      descripcion: entornoActivo.descripcion,
    },
  };
}
