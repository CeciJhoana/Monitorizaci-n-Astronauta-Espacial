# órbita — Frontend

Monitorización de salud para astronautas en misiones espaciales.
Prototipo para NASA Space Apps 2026 · Datos simulados · No es un dispositivo médico.

## Stack

- React 19 + TypeScript 5.7 (modo estricto)
- Vite 8 + Tailwind CSS v4 (plugin de Vite)
- pnpm como gestor de paquetes (`.mise.toml` fija Node 22 y pnpm 10)
- Formato de código con oxfmt

## Comandos

```bash
pnpm install        # instalar dependencias
pnpm dev            # servidor de desarrollo (http://localhost:5173)
pnpm build          # build de producción en dist/
pnpm preview        # previsualizar el build
pnpm typecheck      # comprobación de tipos (tsc --noEmit)
pnpm test           # pruebas unitarias (vitest)
pnpm format         # formatear con oxfmt
```

## Estructura

```
src/
├── config/          # entorno (VITE_API_BASE_URL) y constantes de misión
├── types/           # tipos del dominio (contrato con el backend)
├── data/            # datos simulados (mock) de la misión ARES–01
├── services/        # HealthApi: interfaz + impl. mock + impl. HTTP
├── store/           # contextos: Toast, Ui (navegación/modales), MissionData
├── hooks/           # usePersistentState, useUtcClock, useDialogAccessibility
├── lib/             # funciones puras (métricas, exportación CSV)
├── components/
│   ├── ui/          # primitivas (Icon, Badge, Panel, TrendChart...)
│   ├── panels/      # paneles compartidos (tendencias, alertas, tripulación, entorno)
│   ├── layout/      # Sidebar, Topbar, Footer, PageHeading
│   └── modals/      # ModalRoot + un archivo por modal
├── features/        # una carpeta por página (dashboard, crew, vitals, ...)
├── styles/          # CSS organizado: base, pages, responsive, astronaut-vitals
└── App.tsx          # composición: providers + shell + página activa
```

### Principios aplicados

- **SRP/SOLID**: cada componente, hook y servicio tiene una sola responsabilidad; la capa de
  dominio (`types`) no depende de React.
- **Inversión de dependencias**: la UI consume las interfaces `HealthApi` y `TelemetryApi`,
  nunca implementaciones concretas. `services/index.ts` es el único punto de cableado.
- **KISS**: sin librerías extra; navegación por estado, gráficas SVG propias.

## Integración con la estación de telemetría (Flask + PostgreSQL)

El hardware (ESP32 con sensores AHT10/AHT20, ML8511 y estación de vitales) envía lecturas al
servidor Flask (`backend/servidor/servidor_ble_postgres.py`, puerto 5000), que las guarda en
PostgreSQL (tabla `clima`). El frontend las consume automáticamente:

1. `hooks/useLiveTelemetry.ts` sondea `GET /api/clima` **cada 2 s** (el proxy de Vite
   reescribe `/api/clima` ➜ `:5000/clima`, sin CORS).
2. `services/telemetryMapper.ts` (funciones puras, con tests) traduce la fila de la BD al
   dominio y fusiona los datos reales sobre los simulados:
   - `pulso` ➜ frecuencia cardíaca · `spo2` ➜ SpO₂ · `temp_corp` ➜ temperatura corporal
     del tripulante en vivo (`LIVE_ASTRONAUT_ID = "01"`).
   - `salud` ➜ puntaje de bienestar · `temperatura` ➜ temperatura de cabina ·
     `humedad` ➜ humedad · `uv` ➜ radiación UV (sustituye la radiación simulada).
   - Los campos `null` no sobrescriben: la UI conserva el último valor válido.
   - CO₂, sueño, alertas, bitácora y tendencias siguen con datos predefinidos (no hay
     sensor para ellos todavía).
3. Si el backend no responde, el estado pasa a `offline` y la app sigue en modo
   demostración sin errores; el Topbar y el panel muestran el origen de los datos
   ("Estación de vitales en vivo" / "EN VIVO · SIM" / "Datos de demostración").

Para apuntar a otra IP (p. ej. Raspberry en red local) define `VITE_TELEMETRY_API_URL`
en `.env` (ver `.env.example`).

## Backend de misión (pendiente)

El puerto `HealthApi` (`src/services/healthApi.ts`) queda listo para un futuro backend de
misión. Se activa definiendo `VITE_API_BASE_URL`:

| Método | Ruta                | Respuesta                                                     |
| ------ | ------------------- | ------------------------------------------------------------- |
| GET    | `/mission/snapshot` | `MissionSnapshot` (crew, alerts, environmentReadings, trends) |
| POST   | `/vitals`           | `Measurement`                                                 |
| POST   | `/journal`          | `JournalEntry`                                                |

Las formas exactas están en `src/types/index.ts`.
