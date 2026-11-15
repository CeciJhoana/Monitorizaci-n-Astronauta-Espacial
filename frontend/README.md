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
- **Inversión de dependencias**: la UI consume la interfaz `HealthApi`, nunca una implementación.
  `services/index.ts` elige mock o HTTP según `VITE_API_BASE_URL`.
- **KISS**: sin librerías extra; navegación por estado, gráficas SVG propias.

## Conexión con el backend (pendiente)

1. Copia `.env.example` a `.env` y define `VITE_API_BASE_URL` (o deja el proxy de Vite:
   `API_PROXY_TARGET` apunta a `http://localhost:8000` y `/api/*` se reenvía automáticamente).
2. El backend debe implementar el contrato de `src/services/healthApi.ts`:

| Método | Ruta                | Respuesta                                                     |
| ------ | ------------------- | ------------------------------------------------------------- |
| GET    | `/mission/snapshot` | `MissionSnapshot` (crew, alerts, environmentReadings, trends) |
| POST   | `/vitals`           | `Measurement`                                                 |
| POST   | `/journal`          | `JournalEntry`                                                |

Las formas exactas están en `src/types/index.ts`.
