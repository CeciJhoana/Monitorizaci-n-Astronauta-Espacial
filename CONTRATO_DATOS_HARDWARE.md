# Contrato de Telemetría: Raspberry Pi ➔ Frontend (ASTRA / órbita)
**NASA Space Apps Cochabamba**  
*Documento técnico de integración para el equipo de Hardware / Servidor Local*  
> ⚠️ **Aviso:** Prototipo de telemetría biométrica y ambiental. No es un dispositivo médico. Valores y frecuencias de muestreo por validar con fuentes oficiales de la NASA.

---

## 1. Métodos de Conexión Disponibles

El servidor local en la Raspberry Pi puede alimentar al frontend mediante cualquiera de estas dos vías:

### Vía A: WebSocket en tiempo real (Recomendada)
* **URL:** `ws://<IP_RASPBERRY>:8000/ws/telemetry` (o puerto configurado).
* **Dirección:** Raspberry Pi ➔ Frontend (Push unidireccional periódico).
* **Frecuencia recomendada:** 
  * Signos vitales y ambiente: 1 mensaje cada **1 a 2 segundos** (1 Hz).
  * Si hay ráfagas de alta tasa, consolidar el promedio del último segundo.

### Vía B: Endpoint HTTP REST (Alternativa / Fallback)
* **GET `/api/telemetry/live`**: Devuelve la última lectura instantánea (el frontend hace polling cada 2s).
* **POST `/api/telemetry`**: Si los sensores envían por microcontrolador HTTP.

---

## 2. Formato del Payload JSON

Cada mensaje de telemetría debe ser un objeto JSON plano o estructurado con los siguientes campos y unidades estándar:

```json
{
  "timestamp": "2026-11-15T12:00:00Z",
  "astronaut_id": "01",
  "vitals": {
    "heart_rate": 72,
    "oxygen_saturation": 98.5,
    "temperature_celsius": 36.6,
    "hrv_rmssd": 52.0,
    "respiratory_rate": 15,
    "blood_pressure": {
      "systolic": 118,
      "diastolic": 76
    },
    "glucose_mg_dl": 95
  },
  "environment": {
    "radiation_rate_usv_h": 1.25,
    "radiation_accumulated_msv": 52.8,
    "co2_ppm": 2100,
    "cabin_temperature_celsius": 22.4,
    "cabin_pressure_kpa": 101.3
  },
  "behavioral": {
    "sleep_hours_last_night": 7.8,
    "sleep_efficiency_percent": 88,
    "active_minutes_today": 65,
    "social_zone_percent": 42
  }
}
```

---

## 3. Diccionario de Campos, Tipos y Unidades

### Metadatos
| Campo | Tipo | Obligatorio | Descripción |
| :--- | :---: | :---: | :--- |
| `timestamp` | string (ISO 8601) | Sí | Momento de la lectura en tiempo UTC. Ej: `"2026-11-15T12:00:00Z"` |
| `astronaut_id` | string | Sí | Identificador del tripulante monitoreado (por defecto `"01"` para el astronauta en vivo). |

### Signos Vitales (`vitals`)
| Campo | Tipo | Unidad | Rango Típico | Obligatorio |
| :--- | :---: | :---: | :---: | :---: |
| `heart_rate` | number (int/float) | lpm (latidos/min) | 50 – 160 | **Sí** |
| `oxygen_saturation` | number (float) | % SpO₂ | 85.0 – 100.0 | **Sí** |
| `temperature_celsius` | number (float) | °C | 35.0 – 40.0 | **Sí** |
| `hrv_rmssd` | number (float) | ms (RMSSD) | 20.0 – 120.0 | Recomendado |
| `respiratory_rate` | number (int) | rpm (resp/min) | 10 – 30 | Opcional |
| `blood_pressure` | object `{systolic, diastolic}` | mmHg | 90/60 – 140/90 | Opcional |
| `glucose_mg_dl` | number (float) | mg/dL | 70 – 180 | Opcional |

### Entorno y Radiación (`environment`)
| Campo | Tipo | Unidad | Rango Típico | Obligatorio |
| :--- | :---: | :---: | :---: | :---: |
| `radiation_rate_usv_h` | number (float) | µSv/h (tasa instantánea) | 0.5 – 50.0 | **Sí** |
| `radiation_accumulated_msv` | number (float) | mSv (acumulado misión) | 0.0 – 500.0 | Opcional |
| `co2_ppm` | number (float) | ppm | 400 – 5000 | Opcional |
| `cabin_temperature_celsius` | number (float) | °C | 18.0 – 26.0 | Opcional |

### Conductual y Sueño (`behavioral`)
*(Proveniente de acelerómetro, pulsera o tracker de descanso durante la noche)*
| Campo | Tipo | Unidad | Rango Típico | Obligatorio |
| :--- | :---: | :---: | :---: | :---: |
| `sleep_hours_last_night` | number (float) | Horas | 0.0 – 12.0 | **Sí** (diario) |
| `sleep_efficiency_percent` | number (float) | % | 40 – 100 | Recomendado |
| `active_minutes_today` | number (float) | Minutos | 0 – 180 | Recomendado |
| `social_zone_percent` | number (float) | % del tiempo despierto | 0 – 100 | Recomendado |

---

## 4. Manejo de Errores y Tolerancia
1. **Campos nulos:** Si un sensor se desconecta temporalmente, enviar el campo como `null` (ej: `"oxygen_saturation": null`). El frontend mantendrá el último valor válido con advertencia de sensor.
2. **Reconexión:** Si el WebSocket se desconecta, el frontend reintentará la conexión automáticamente cada 3 segundos sin colapsar la pantalla.
