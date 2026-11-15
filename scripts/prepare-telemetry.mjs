import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Rutas de entrada (preferir data/raw y fallback a Downloads)
function resolveInputPath(filename) {
  const localPath = path.join(rootDir, 'data', 'raw', filename);
  if (fs.existsSync(localPath)) return localPath;
  const downloadsPath = path.join('C:', 'Users', 'Lenovo', 'Downloads', filename);
  if (fs.existsSync(downloadsPath)) return downloadsPath;
  throw new Error(`Archivo no encontrado: ${filename} (buscado en ${localPath} y ${downloadsPath})`);
}

const outDir = path.join(rootDir, 'frontend', 'src', 'data', 'telemetry');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('--- Iniciando preparación de telemetría ---');

/* ========================================================================== */
/* 1. ESP32 Capture: 50 lecturas ordenadas cronológicamente                   */
/* ========================================================================== */
function parseEsp32Capture() {
  const inputPath = resolveInputPath('ASTRA_esp32_captura.csv');
  console.log(`Leyendo ESP32 desde: ${inputPath}`);
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',').map((c) => c.trim());

  // El archivo original tiene las lecturas en orden descendente (09:10:50 -> 09:07:00).
  // Se invierten para orden cronológico ascendente (09:07:00 -> 09:10:50).
  const rawRows = lines.slice(1).map((l) => l.split(',').map((c) => c.trim()));
  const chronologicalRows = [...rawRows].reverse();

  function timeToSeconds(timeStr) {
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  }

  const readings = chronologicalRows.map((cols, index) => {
    const time = cols[0];
    const prevTime = index > 0 ? chronologicalRows[index - 1][0] : time;
    const intervalSeconds = timeToSeconds(time) - timeToSeconds(prevTime);

    return {
      index: index + 1,
      time,
      interval_seconds: Math.max(0, intervalSeconds),
      pulso_bpm: parseFloat(cols[2]),
      spo2_pct: parseFloat(cols[3]),
      temperatura_corporal_c: parseFloat(cols[4]),
      uv: parseFloat(cols[5]),
      temperatura_ambiente_c: parseFloat(cols[6]),
      humedad_pct: parseFloat(cols[7]),
      salud_pct: parseFloat(cols[1]),
    };
  });

  const esp32Data = {
    _meta: {
      fuente: 'Captura ESP32 · reproducción',
      origen: 'Hardware ESP32 con sensores MAX30102, DS18B20/TMP, UV y DHT22',
      procedencia: 'Captura local de prueba (origen por confirmar)',
      nota: 'Reproducción de datos grabados. No es transmisión en tiempo real.',
      total_lecturas: readings.length,
      unidades: {
        time: 'HH:MM:SS (hora local de captura)',
        interval_seconds: 'segundos respecto a la lectura previa',
        pulso_bpm: 'latidos por minuto (lpm)',
        spo2_pct: 'porcentaje de saturación de oxígeno (%)',
        temperatura_corporal_c: 'grados Celsius (°C)',
        uv: 'índice ultravioleta (adimensional)',
        temperatura_ambiente_c: 'grados Celsius (°C)',
        humedad_pct: 'porcentaje de humedad relativa (%)',
        salud_pct: 'estimación en firmware (sin validación clínica documentada; no usado en motor)',
      },
    },
    lecturas: readings,
  };

  const outFile = path.join(outDir, 'esp32_capture.json');
  fs.writeFileSync(outFile, JSON.stringify(esp32Data, null, 2), 'utf8');
  console.log(`✓ esp32_capture.json generado (${readings.length} lecturas, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
  return esp32Data;
}

/* ========================================================================== */
/* 2. NASA RR-1 Radiación: 39 días en mGy                                      */
/* ========================================================================== */
function parseNasaRadiation() {
  const inputPath = resolveInputPath('RR1_radiacion_limpia.csv');
  console.log(`Leyendo Radiación RR-1 desde: ${inputPath}`);
  const content = fs.readFileSync(inputPath, 'utf8');
  const lines = content.trim().split(/\r?\n/).filter(Boolean);

  const series = lines.slice(1).map((line, index) => {
    const cols = line.split(',').map((c) => c.trim());
    return {
      dia_mision: index + 1,
      fecha_utc: cols[3],
      gcr_mgy_dia: parseFloat(cols[4]),
      saa_mgy_dia: parseFloat(cols[5]),
      total_mgy_dia: parseFloat(cols[6]),
      acumulada_mgy: parseFloat(cols[7]),
    };
  });

  const radiationData = {
    _meta: {
      fuente: 'NASA RR-1 · Dosimetría ISS',
      origen: 'Experimento Rodent Research 1 (NASA Life Sciences Data Archive)',
      procedencia: 'Dataset EDA histórico NASA (origen por confirmar)',
      unidad: 'mGy (dosis absorbida en miligray)',
      nota: 'Los datos están en mGy (dosis absorbida). No convertir ni sumar con mSv (dosis equivalente).',
      total_dias: series.length,
      columnas: {
        dia_mision: 'Día relativo de misión (1 a 39)',
        fecha_utc: 'Fecha UTC de la medición (AAAA-MM-DD)',
        gcr_mgy_dia: 'Dosis por radiación cósmica galáctica (mGy/día)',
        saa_mgy_dia: 'Dosis por Anomalía del Atlántico Sur (mGy/día)',
        total_mgy_dia: 'Tasa de dosis total diaria absorbida (mGy/día)',
        acumulada_mgy: 'Dosis acumulada absorbida reportada (mGy)',
      },
    },
    series,
  };

  const outFile = path.join(outDir, 'nasa_rr1_radiation.json');
  fs.writeFileSync(outFile, JSON.stringify(radiationData, null, 2), 'utf8');
  console.log(`✓ nasa_rr1_radiation.json generado (${series.length} días, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`);
  return radiationData;
}

/* ========================================================================== */
/* 3. NASA RR-1 Ambiente: Ventana 48h con pico CO2 ISS + Estadísticas globales */
/* ========================================================================== */
async function parseNasaEnvironment() {
  const inputPath = resolveInputPath('RR1_telemetria_limpia.csv');
  console.log(`Leyendo Ambiente RR-1 desde: ${inputPath}`);

  const fileStream = fs.createReadStream(inputPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let isHeader = true;
  let countIss = 0;
  let countGround = 0;
  let sumCo2Iss = 0, minCo2Iss = Infinity, maxCo2Iss = -Infinity;
  let sumTempIss = 0, minTempIss = Infinity, maxTempIss = -Infinity;
  let sumHumIss = 0, minHumIss = Infinity, maxHumIss = -Infinity;

  let sumCo2Gnd = 0, minCo2Gnd = Infinity, maxCo2Gnd = -Infinity;
  let sumTempGnd = 0, minTempGnd = Infinity, maxTempGnd = -Infinity;
  let sumHumGnd = 0, minHumGnd = Infinity, maxHumGnd = -Infinity;

  let peakCo2Record = null;
  const allRows = [];

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }
    const cols = line.split(',');
    const group = cols[3];
    const timestamp = cols[4];
    const temp = parseFloat(cols[5]);
    const hum = parseFloat(cols[6]);
    const co2 = parseFloat(cols[7]);

    if (group === 'iss') {
      countIss++;
      sumCo2Iss += co2;
      minCo2Iss = Math.min(minCo2Iss, co2);
      maxCo2Iss = Math.max(maxCo2Iss, co2);
      sumTempIss += temp;
      minTempIss = Math.min(minTempIss, temp);
      maxTempIss = Math.max(maxTempIss, temp);
      sumHumIss += hum;
      minHumIss = Math.min(minHumIss, hum);
      maxHumIss = Math.max(maxHumIss, hum);

      if (co2 > (peakCo2Record?.co2 ?? -Infinity)) {
        peakCo2Record = { timestamp, co2, temp, hum };
      }
    } else if (group === 'ground') {
      countGround++;
      sumCo2Gnd += co2;
      minCo2Gnd = Math.min(minCo2Gnd, co2);
      maxCo2Gnd = Math.max(maxCo2Gnd, co2);
      sumTempGnd += temp;
      minTempGnd = Math.min(minTempGnd, temp);
      maxTempGnd = Math.max(maxTempGnd, temp);
      sumHumGnd += hum;
      minHumGnd = Math.min(minHumGnd, hum);
      maxHumGnd = Math.max(maxHumGnd, hum);
    }

    allRows.push({ group, timestamp, temp, hum, co2 });
  }

  // Pico máximo identificado: 2014-10-07T15:31:00Z con 4667 ppm
  // Ventana de 48 horas centrada en el pico: de 2014-10-06T15:30:00Z a 2014-10-08T15:30:00Z
  const peakTimeMs = new Date(peakCo2Record.timestamp).getTime();
  const windowStartMs = peakTimeMs - 24 * 60 * 60 * 1000;
  const windowEndMs = peakTimeMs + 24 * 60 * 60 * 1000;

  // Filtrar lecturas de la ventana de 48 horas
  const windowMap = new Map();
  for (const row of allRows) {
    const t = new Date(row.timestamp).getTime();
    if (t >= windowStartMs && t <= windowEndMs) {
      if (!windowMap.has(row.timestamp)) {
        windowMap.set(row.timestamp, { timestamp: row.timestamp });
      }
      const entry = windowMap.get(row.timestamp);
      if (row.group === 'iss') {
        entry.iss = {
          temperatura_c: row.temp,
          humedad_pct: row.hum,
          co2_ppm: row.co2,
        };
      } else if (row.group === 'ground') {
        entry.ground = {
          temperatura_c: row.temp,
          humedad_pct: row.hum,
          co2_ppm: row.co2,
        };
      }
    }
  }

  const windowPoints = Array.from(windowMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const envData = {
    _meta: {
      fuente: 'NASA RR-1 · ISS vs Ground (histórico)',
      origen: 'Experimento Rodent Research 1 (NASA Life Sciences Data Archive)',
      procedencia: 'Dataset EDA histórico NASA (origen por confirmar)',
      nota: 'Experimento con roedores: sus datos de ambiente son contexto de cabina, NO salud humana.',
      regla_co2: 'Tendencia de revisión, no umbral clínico validado.',
      ventana_horas: 48,
      pico_co2_iss: peakCo2Record,
      unidades: {
        temperatura_c: 'grados Celsius (°C)',
        humedad_pct: 'porcentaje de humedad relativa (%)',
        co2_ppm: 'partes por millón de dióxido de carbono (ppm)',
      },
    },
    estadisticas_globales: {
      iss: {
        total_lecturas: countIss,
        co2_ppm: { min: minCo2Iss, max: maxCo2Iss, media: Math.round((sumCo2Iss / countIss) * 10) / 10 },
        temperatura_c: { min: minTempIss, max: maxTempIss, media: Math.round((sumTempIss / countIss) * 10) / 10 },
        humedad_pct: { min: minHumIss, max: maxHumIss, media: Math.round((sumHumIss / countIss) * 10) / 10 },
      },
      ground: {
        total_lecturas: countGround,
        co2_ppm: { min: minCo2Gnd, max: maxCo2Gnd, media: Math.round((sumCo2Gnd / countGround) * 10) / 10 },
        temperatura_c: { min: minTempGnd, max: maxTempGnd, media: Math.round((sumTempGnd / countGround) * 10) / 10 },
        humedad_pct: { min: minHumGnd, max: maxHumGnd, media: Math.round((sumHumGnd / countGround) * 10) / 10 },
      },
    },
    ventana_48h: windowPoints,
  };

  const outFile = path.join(outDir, 'nasa_rr1_environment.json');
  fs.writeFileSync(outFile, JSON.stringify(envData, null, 2), 'utf8');
  console.log(
    `✓ nasa_rr1_environment.json generado (${windowPoints.length} puntos de 48h, ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB)`
  );
  return envData;
}

async function main() {
  parseEsp32Capture();
  parseNasaRadiation();
  await parseNasaEnvironment();
  console.log('--- Proceso completado exitosamente ---');
}

main().catch((err) => {
  console.error('Error procesando telemetría:', err);
  process.exit(1);
});
