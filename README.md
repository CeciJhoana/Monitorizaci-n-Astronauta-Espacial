# Monitorización de Astronauta Espacial — órbita

Prototipo para el reto **NASA Space Apps 2026**: *Create Health Monitoring Software for
Astronauts on Space Missions*.

Los astronautas están lejos de la Tierra, con comunicación retrasada y sin médico cerca.
**órbita** es un panel que reúne sus indicadores de salud (signos vitales, sueño, hábitos y
entorno de a bordo), los compara con su línea base personal y presenta alertas explicables
con acciones sugeridas, diseñado para tripulantes que no son médicos.

> ⚠️ Prototipo con datos simulados. No es un dispositivo médico ni ofrece diagnóstico.

## Estructura del repositorio

```
frontend/   # aplicación React + TypeScript + Vite (ver frontend/AGENTS.md)
```

## Puesta en marcha rápida

```bash
cd frontend
pnpm install
pnpm dev
```

Abre `http://localhost:5173`. En modo demostración, todos los datos son simulados y los
registros de la sesión se guardan localmente en el navegador.

Si no tienes pnpm: `corepack enable pnpm` (o `npm i -g pnpm`).

## Funcionalidades

- **Resumen de misión**: estado agregado de la tripulación, tendencias y alertas.
- **Tripulación**: líneas base personales y estado por astronauta.
- **Signos vitales**: modelo corporal interactivo con cinco sensores y registro manual.
- **Bienestar y hábitos**: sueño, HRV, ejercicio, hidratación y rutina diaria.
- **Alertas explicables**: qué disparó la señal y qué revisar, sin diagnósticos.
- **Entorno espacial**: CO₂, radiación y temperatura de cabina; entornos orbital/lunar/marciano.
- **Protocolos**: listas de comprobación orientativas y guía ante emergencias.
- **Bitácora**: registro de estado de ánimo con persistencia local.
- **Operación sin conexión**: exportación CSV y procesamiento local.

## Backend (pendiente)

El frontend está preparado para conectar a un backend: define `VITE_API_BASE_URL` en
`frontend/.env` y las mismas vistas consumirán la API real. El contrato de endpoints y tipos
está documentado en `frontend/AGENTS.md` y en `frontend/src/services/healthApi.ts`.
