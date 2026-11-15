# Monitorización de Astronauta Espacial — órbita

Prototipo para el reto **NASA Space Apps 2026**: *Create Health Monitoring Software for
Astronauts on Space Missions*.

Los astronautas están lejos de la Tierra, con comunicación retrasada y sin médico cerca.
**órbita** es un panel que reúne sus indicadores de salud (signos vitales, sueño, hábitos y
entorno de a bordo), los compara con su línea base personal y presenta alertas explicables
con acciones sugeridas, diseñado para tripulantes que no son médicos.

> ⚠️ Prototipo. No es un dispositivo médico ni ofrece diagnóstico.

## Estructura del repositorio

```
frontend/   # aplicación React + TypeScript + Vite (ver frontend/README.md)
backend/    # estación ESP32 + servidor Flask + PostgreSQL (ver backend/README.md)
CONTRATO_DATOS_HARDWARE.md  # contrato de telemetría hardware ➔ frontend
```

## Arquitectura

```
┌───────────┐  WiFi   ┌─────────────┐        ┌─────────────┐   HTTP    ┌──────────────┐
│   ESP32   │ ─POST──▶│ Flask :5000 │ ─────▶ │ PostgreSQL  │ ◀──/api── │  Frontend    │
│ sensores  │  /clima │  servidor_  │        │  base 'ble' │  proxy    │  React :5173 │
│ AHT · UV  │         │  ble_pg.py  │        │ tabla clima │  Vite     │  (polling 2s)│
└───────────┘         └─────────────┘        └─────────────┘           └──────────────┘
```

El frontend sondea `GET /api/clima` cada 2 segundos (el proxy de Vite reenvía al Flask sin
CORS) y **fusiona los datos reales con los simulados**: pulso, SpO₂, temperatura corporal,
salud, temperatura de cabina, humedad y UV vienen de la BD; el resto (CO₂, sueño, alertas,
bitácora, tendencias) permanece con datos predefinidos hasta que exista sensor o backend
para ello. Si el servidor está apagado, la app sigue funcionando en modo demostración.

## Puesta en marcha completa

**1. Backend (Flask + PostgreSQL)** — ver `backend/README.md` para la instalación completa:

```bash
cd backend/servidor
./setup_db.sh    # crea usuario + base + esquema (pide tu contraseña sudo)
./run.sh         # crea el venv, instala dependencias y levanta el Flask :5000
```

> Los scripts usan un entorno virtual (`servidor/.venv`), evitando el error
> `externally-managed-environment` de pip en Ubuntu 24.04+.

Sin hardware conectado, puedes generar lecturas de prueba manualmente:

```bash
curl -X POST http://localhost:5000/clima -H "Content-Type: application/json" \
  -d '{"detector":"demo","temperatura":22.5,"humedad":48,"uv":1.3,"pulso":74,"spo2":98,"temp_corp":36.7,"sim":true,"salud":94}'
```

**2. Frontend:**

```bash
cd frontend
pnpm install
pnpm dev                               # http://localhost:5173
```

Si no tienes pnpm: `corepack enable pnpm` (o `npm i -g pnpm`).

El Topbar mostrará **"Estación de vitales en vivo"** al recibir datos del backend, y el
panel de entorno/vitales reflejarán los valores de la BD. Sin backend, todo funciona con
datos de demostración.

## Funcionalidades

- **Resumen de misión**: estado agregado de la tripulación, tendencias y alertas.
- **Tripulación**: líneas base personales y estado por astronauta.
- **Signos vitales**: modelo corporal interactivo con cinco sensores, registro manual y
  telemetría en vivo de la estación hardware.
- **Bienestar y hábitos**: sueño, HRV, ejercicio, hidratación y rutina diaria.
- **Alertas explicables**: qué disparó la señal y qué revisar, sin diagnósticos.
- **Entorno espacial**: CO₂, radiación UV, temperatura y humedad (reales cuando hay estación).
- **Protocolos**: listas de comprobación orientativas y guía ante emergencias.
- **Bitácora**: registro de estado de ánimo con persistencia local.
- **Operación sin conexión**: exportación CSV y procesamiento local.

## Backend de misión (pendiente)

El frontend separa dos puertos de datos (`frontend/src/services/`): `TelemetryApi` ya
conectado al Flask real, y `HealthApi` preparado para un futuro backend de misión
(`VITE_API_BASE_URL`). Contratos documentados en `frontend/README.md`.
