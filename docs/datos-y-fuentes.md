# Datos y Fuentes de Telemetría — Órbita / ASTRA

> **NASA Space Apps Challenge 2026** — *Create Health Monitoring Software for Astronauts on Space Missions*  
> **Directriz de Transparencia y Honestidad**: La integridad científica del software exige distinguir con claridad entre datos históricos de contexto, reproducciones de hardware grabado y simulaciones operativas. Este documento detalla la procedencia, el tratamiento y las limitaciones de cada fuente.

---

## 1. NASA Rodent Research 1 (RR-1) · Telemetría Ambiental

### Información General
- **Nombre del conjunto**: `RR1_telemetria_limpia.csv` / `nasa_rr1_environment.json`.
- **Misión de origen**: Experimento Rodent Research 1 (RR-1), llevado a cabo a bordo de la Estación Espacial Internacional (ISS) y comparado con controles en Tierra (Ground).
- **Procedencia**: *Origen por confirmar* (dataset de archivo histórico EDA / NASA Life Sciences Data Archive; URL exacta, versión y fecha de descarga pendientes de confirmación).
- **Filas en CSV original**: 24,174 lecturas (12,087 para el grupo `iss` y 12,087 para el grupo `ground`).
- **Filas preparadas en aplicación**: Ventana continua de 48 horas con **577 puntos** de muestreo (intervalo cada 5 minutos) centrada alrededor del pico máximo de $\text{CO}_2$ en ISS.

### Variables y Unidades
| Campo | Unidad | Descripción |
| :--- | :--- | :--- |
| `timestamp` | ISO 8601 UTC | Marca temporal de la lectura |
| `co2_ppm` | ppm (partes por millón) | Concentración de dióxido de carbono |
| `temperatura_c` | °C (grados Celsius) | Temperatura ambiental en el hábitat |
| `humedad_pct` | % | Porcentaje de humedad relativa |

### Estadísticas Globales del Experimento Completo
- **Grupo ISS**:
  - $\text{CO}_2$: Mínimo: 1,862 ppm · Máximo: **4,667 ppm** (2014-10-07T15:31:00Z) · Media: **3,197.3 ppm**.
  - Temperatura: Mínimo: 18.5 °C · Máximo: 26.8 °C · Media: 22.8 °C.
  - Humedad: Mínimo: 31 % · Máximo: 76 % · Media: 44.0 %.
- **Grupo Ground**:
  - $\text{CO}_2$: Mínimo: 438 ppm · Máximo: 4,690 ppm · Media: 2,853.7 ppm.
  - Temperatura: Mínimo: 18.3 °C · Máximo: 27.1 °C · Media: 22.8 °C.
  - Humedad: Mínimo: 32 % · Máximo: 75 % · Media: 44.1 %.

### Qué Usamos
- La ventana de 48 horas que incluye el pico de $\text{CO}_2$ de 4,667 ppm para visualizar tendencias ambientales y comparativa hábitat espacial vs. terrestre.
- Estadísticas globales completas en las tarjetas de contexto ambiental.

### Qué NO Hicimos (Reglas de Honestidad)
- **NO representa salud humana**: RR-1 es un experimento biológico con roedores. Sus métricas se utilizan estrictamente como **contexto ambiental de cabina**, nunca como indicadores clínicos de astronautas.
- **NO formulamos diagnósticos médicos nuevos**: El $\text{CO}_2$ elevado se trata como *"tendencia de revisión, no umbral clínico validado"*, sin vincularlo especulativamente a afecciones oculares (SANS) ni patologías agudas.

### Limitaciones
- Los sensores miden el módulo de habitación de roedores en la ISS; la ventilación local puede diferir de los módulos humanos de la estación.

---

## 2. NASA Rodent Research 1 (RR-1) · Dosimetría de Radiación

### Información General
- **Nombre del conjunto**: `RR1_radiacion_limpia.csv` / `nasa_rr1_radiation.json`.
- **Misión de origen**: Dosimetría pasiva/activa durante los 39 días del experimento RR-1 en la ISS.
- **Procedencia**: *Origen por confirmar* (NASA EDA historical; URL y fecha de extracción pendientes de confirmación).
- **Filas**: **39 días completos** (del 2014-09-21 al 2014-10-29).

### Variables y Unidades
| Campo | Unidad | Descripción |
| :--- | :--- | :--- |
| `fecha_utc` | AAAA-MM-DD | Fecha de la medición diaria |
| `gcr_mgy_dia` | mGy/día | Dosis absorbida diaria por rayos cósmicos galácticos |
| `saa_mgy_dia` | mGy/día | Dosis absorbida diaria por paso por la Anomalía del Atlántico Sur |
| `total_mgy_dia` | mGy/día | Tasa total de dosis absorbida en el hábitat |
| `acumulada_mgy` | mGy | Dosis acumulada reportada (alcanza 7.96 mGy el día 39) |

### Qué Usamos
- La serie completa de los 39 días para representar la exposición real a radiación espacial en órbita baja terrestre.

### Qué NO Hicimos (Regla Estricta de Dosimetría)
- **NUNCA convertir ni sumar mGy con mSv**: El miligray ($\text{mGy}$) mide **dosis física absorbida** por la materia, mientras que el milisievert ($\text{mSv}$) mide **dosis equivalente biológica** (afectada por factores de ponderación de radiación $W_R$ según partículas alfa, neutrones o iones pesados que no están desglosados en este sensor). Por tanto, la telemetría de RR-1 se presenta de forma aislada en $\text{mGy}$ con su propia etiqueta identificadora, sin mezclarse ni acumularse con los indicadores en $\text{mSv}$ de la simulación.

### Limitaciones
- La órbita baja (LEO) de la ISS cuenta con el apantallamiento geomagnético terrestre; no es representativa de la radiación en espacio profundo (misiones a Marte o Luna).

---

## 3. Hardware ESP32 · Captura Física de Sensores

### Información General
- **Nombre del conjunto**: `ASTRA_esp32_captura.csv` / `esp32_capture.json`.
- **Dispositivo**: Prototipo físico basado en microcontrolador ESP32 con sensores MAX30102 (pulsioximetría/frecuencia cardíaca), sensor térmico (temperatura corporal/ambiente), índice UV y sensor de humedad DHT22.
- **Procedencia**: *Origen por confirmar* (captura de prueba grabada en sesión de hardware; fecha y firmware exacto por confirmar).
- **Filas**: **50 lecturas secuenciales** (de 09:07:00 a 09:10:50).
- **Modo de operación**: **"Captura ESP32 · reproducción"**.

### Variables y Unidades
| Campo | Unidad | Descripción | Destino en Interfaz |
| :--- | :--- | :--- | :--- |
| `hora` | HH:MM:SS | Hora local registrada de la captura | Indicador temporal |
| `interval_seconds` | s | Intervalo entre lecturas consecutivas (4 a 6 s) | Temporizador del reproductor |
| `pulso_bpm` | lpm | Frecuencia cardíaca | Signo vital Elena (tripulante activa) |
| `spo2_pct` | % | Saturación de oxígeno periférico | Signo vital Elena |
| `temperatura_corporal_c` | °C | Temperatura del usuario/astronauta | Signo vital Elena |
| `uv` | Índice UV | Radiación ultravioleta en cabina | Tarjeta de entorno |
| `temperatura_ambiente_c`| °C | Temperatura ambiente | Tarjeta de entorno |
| `humedad_pct` | % | Humedad relativa | Tarjeta de entorno |
| `salud_pct` | % | Estimación heurística de firmware | **No utilizado en motor** |

### Estados Presentes en la Captura
1. **Crisis aguda inicial** (lecturas 1 a 4): Pulso 131–134 lpm, $\text{SpO}_2$ 84–86 %, Temperatura 38.7 °C $\rightarrow$ Dispara alerta aguda sostenida tras 3 lecturas consecutivas.
2. **Reposo nominal** (lecturas 5 a 12 y 38 a 45): Pulso 70–77 lpm, $\text{SpO}_2$ 98–100 %, Temperatura 36.7–36.8 °C $\rightarrow$ Estado óptimo.
3. **Desaturación aislada** (lecturas 13 a 16): Pulso 80–82 lpm, $\text{SpO}_2$ 88–90 %, Temperatura 36.9 °C.
4. **Estado de esfuerzo físico** (lecturas 17 a 20): Pulso 124–126 lpm (rango 97–126 lpm), $\text{SpO}_2$ 96–97 %, Temperatura 37.0–37.2 °C $\rightarrow$ **NO dispara alerta** al no superar 130 lpm y tener $\text{SpO}_2 \ge 95\%$.

### Qué Usamos
- Reproducción paso a paso con controles (reproducir, pausar, reiniciar, velocidades 1×, 2×, 5×) que alimenta únicamente a la tripulante activa (Elena Vega), dejando a los demás astronautas en estado nominal simulado.
- Adaptación para la demo: sustitución de la ventana clínica de 15 minutos por **3 lecturas consecutivas** para la detección de avisos agudos en capturas con muestreo de 4 a 6 s.
- Cuando hay 3 lecturas críticas consecutivas: el orbe pasa al estado `alert` y el asistente verbaliza: *"Veo que tu oxígeno está bajo. Repite la medición y avisa a la tripulación."*

### Qué NO Hicimos (Reglas de Honestidad)
- **NUNCA escribir "en vivo" ni "tiempo real"**: Es una **reproducción grabada de datos almacenados**, no telemetría en directo.
- **NO afirmamos validación clínica**: La captura demostró conectividad de hardware y calibración preliminar, pero no constituye un dispositivo médico certificado.
- **El campo `salud_pct` no se usa en el motor**: Al carecer de fórmula clínica documentada y validada, se excluye del semáforo conductual para evitar puntuaciones opacas o engañosas.

---

## 4. Datos Simulados ARES-01

- **Propósito**: Línea base operativa para demostrar la funcionalidad completa del software en ausencia de sensores físicos conectados.
- **Métricas del Reto**:
  - Presión arterial: 118/76 mmHg (marcada con píldora `SIMULADO`).
  - Glucosa en ayunas: 85 mg/dL (rango 70–99 mg/dL, marcada con píldora `SIMULADO`).
  - Horas de sueño: 7.5 h nominales.
- **Semáforo conductual ASTRA**: Basado en reglas deterministas (Nivel 0: Óptimo; Nivel 1: Fatiga leve; Nivel 2: Estrés por aislamiento; Nivel 3: Crítico). Opera de forma totalmente desacoplada de las alertas agudas de signos vitales.
