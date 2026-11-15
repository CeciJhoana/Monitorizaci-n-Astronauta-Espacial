# Guía de Arquitectura, Pruebas y Presentación · Asistente ASTRA

> **NASA Space Apps Challenge · Cochabamba**  
> **Reto**: *Create Health Monitoring Software for Astronauts on Space Missions*  
> **Aviso de seguridad**: Prototipo conceptual · No es un dispositivo médico · Por validar con fuentes oficiales de la NASA.

---

## 1. Diagrama de Arquitectura del Sistema

```
                  ┌──────────────────────────────────────────────────────────┐
                  │                 INTERFAZ DE USUARIO (WEB)                │
                  │   AssistantPage · Brand Book ASTRA (Colores & Tipos)     │
                  └──────────────┬────────────────────────────▲──────────────┘
                                 │                            │
                 Texto / Clics / │              Subtítulos /  │  Voz Sintetizada
                 Push-to-Talk    ▼              Estados Orbe  │  Web Speech API
              ┌───────────────────────────┐         ┌─────────┴──────────────┐
              │     useSpeechRecognition  │         │       useSpeech        │
              │  (es-419 / en-US / M key) │         │ (Calma, Clara, Enérgica│
              └──────────────┬────────────┘         └─────────▲──────────────┘
                             │                                │
                             ▼                                │
              ┌───────────────────────────────────────────────┴──────────────┐
              │           INTENT ENGINE (Sin IA · Determinista)              │
              │  Normalización · Tolerancia Levenshtein · Memoria Contextual │
              │  PRIORIDAD ABSOLUTA: Emergencias -> Disparo HAB-01           │
              └──────────────┬────────────────────────────────▲──────────────┘
                             │                                │
                   Consulta  ▼                                │ Recomendación
              ┌───────────────────────────┐         ┌─────────┴──────────────┐
              │     KNOWLEDGE BASE        │         │    COMPANION ENGINE    │
              │     (knowledge.json)      │         │   (companionEngine.ts) │
              │ Fuentes HRP / BHP / SANS  │         │  Semáforo 0-3 (2 vars) │
              │ (Trazabilidad estricta)   │         │  Avisos Vitales Agudos │
              └───────────────────────────┘         └─────────▲──────────────┘
                                                              │
                                                              │
                                            CompanionData     │
                                            Desacoplado       │
                                                    ┌─────────┴──────────────┐
                                                    │     ADAPTADOR DATOS    │
                                                    │   (companionData.ts)   │
                                                    └─────────▲──────────────┘
                                                              │
                                            ┌─────────────────┴──────────────┐
                                            │                                │
                                  MODO ACTUAL (MOCK_DB)              FUTURO HARDWARE
                                  23 Tablas Relacionales            Raspberry Pi 5
                                  Saúl In-Memory DB              (WebSocket / REST)
```

---

## 2. Inventario de Archivos Creados y Modificados

### Estilos y Fuentes (Offline 100%)
- `frontend/src/styles/astra.css`: Variables CSS del Brand Book v3 (Cosmic `#1E1035`, Violet `#7C3AED`, Plomo `#5A5668`, etc.).
- `frontend/src/index.css`: Importación de fuentes locales empaquetadas (`@fontsource/instrument-serif`, `instrument-sans`, `jetbrains-mono`), eliminando dependencias de Google Fonts / CDNs.

### Orbe y Voz
- `frontend/src/components/companion/Orb.tsx`: Orbe SVG animado con `requestAnimationFrame`, reactivo a energía (0-1), estados (`idle`, `listening`, `speaking`, `thinking`), semáforo (0-3), y soporte `prefers-reduced-motion`.
- `frontend/src/components/companion/AstraMark.tsx`: Isotipo oficial de la marca (anillo, 5 estrellas y halo translúcido al 15%).
- `frontend/src/components/companion/MiniOrbLauncher.tsx`: Lanzador flotante persistente en todas las páginas no-asistente con contador de avisos pendientes.
- `frontend/src/hooks/useSpeech.ts`: Síntesis de voz offline basada en `speechSynthesis`, perfiles (Calma, Clara, Enérgica) y decaimiento exponencial (~120 ms).
- `frontend/src/hooks/useSpeechRecognition.ts`: Reconocimiento por voz Web Speech API, push-to-talk, atajo `M`, y degradación elegante sin red o en navegadores no soportados.

### Motor de Reglas, Semáforo y Datos
- `frontend/src/data/companion/companionData.ts`: Adaptador desacoplado que lee `MOCK_DB` y resuelve sueño, HRV vs línea base personal, actividad, luz, ánimo y vitales agudos.
- `frontend/src/data/companion/companionRules.json`: Umbrales del semáforo conductual (0: Óptimo, 1: Fatiga leve, 2: Estrés por aislamiento, 3: Crítico) según la propuesta del equipo.
- `frontend/src/lib/companion/companionEngine.ts`: Motor determinista de salud con regla de combinación del peor nivel por al menos 2 variables y capa independiente de vitales agudos.
- `frontend/src/lib/companion/reminderEngine.ts`: Reloj de misión MET acelerable (1x, 60x, 600x), salto de eventos y cola de recordatorios de rutina con persistencia.
- `frontend/src/data/companion/knowledge.json`: 17 pautas de bienestar bilingües con trazabilidad estricta a NASA HRP / BHP / SANS.
- `docs/pendientes-fuentes.md`: Registro de consejos operativos marcados con `fuente: null` para validación con manuales oficiales NASA.
- `frontend/src/lib/companion/intentEngine.ts`: Intérprete determinista con normalización, Levenshtein $\le 1$, contexto conversacional y prioridad absoluta para emergencias.

### Módulos Especializados
- `frontend/src/features/assistant/components/FamilyCommsModal.tsx`: Enlace familiar con cálculo de retardo según hábitat (orbital: directo, lunar: 1.3 s, marte: 14 min ida / 28 min RTT asíncrono).
- `frontend/src/features/assistant/components/QuickJournalModal.tsx`: Registro rápido de bitácora con 4 botones calibrados (+0.6, +0.35, +0.1, -0.4).
- `frontend/src/features/assistant/components/BreathingGuideModal.tsx`: Sesión de respiración cuadrada 4-4-4-4 de 1 minuto con sincronización visual en el orbe.
- `frontend/src/features/assistant/AssistantPage.tsx`: Pantalla principal integral del acompañante ASTRA.

---

## 3. Guía de Prueba Paso a Paso para el Jurado

### Tarea 1 & 2 · Orbe e Identidad
1. Abre la aplicación y navega al ícono de **ASTRA** en la barra lateral o haz clic en el mini orbe flotante abajo a la derecha.
2. Observa el orbe central animado en color violeta cósmico y la tipografía *Instrument Serif* e *Instrument Sans*.
3. Activa el botón **MODO DEMO** en la esquina superior derecha y mueve el control deslizante de energía: el halo y las partículas reaccionan suavemente.

### Tarea 3 & 7 · Voz y Micrófono
1. Pulsa el botón **🔊 VOZ ACTIVA** en la cabecera para habilitar la síntesis hablada.
2. Elige el perfil de voz (Calma, Clara o Enérgica) en el panel demo.
3. Si estás en Chrome/Edge, pulsa el botón del micrófono 🎙️ o presiona la tecla **M**: el orbe pasará a estado de escucha ("listening") y podrás dictar tu consulta. Si estás en Firefox o sin conexión de voz del sistema, el sistema degrada de forma segura mostrando la indicación de uso de teclado.

### Tarea 4 · Semáforo Conductual y Escenarios
1. En el panel **MODO DEMO**, selecciona a **Elena Martínez**: el semáforo marcará **Nivel 0 (Óptimo)** en color verde menta.
2. Cambia a **James Miller**: el semáforo pasará automáticamente a **Nivel 1 (Fatiga leve)** en color ámbar por su déficit de descanso registrado en la base.
3. Prueba el escenario **"Sueño bajo"**: el semáforo escalará a **Nivel 2 (Estrés por aislamiento / fatiga)** en violeta.
4. Prueba el escenario **"Radiación solar"**: observa cómo el semáforo conductual permanece nominal, pero la capa independiente de **Avisos de Vitales y Entorno** dispara una alerta crítica roja de 450 mSv/h.

### Tarea 5 & 6 · Chat e Intérprete Inteligente
1. Escribe en la caja de texto: `¿cuándo me toca comer?` -> ASTRA responderá con las pautas de nutrición de la NASA y recordatorio de electrolitos.
2. Escribe una errata como: `ejersicio para la espalda` -> El motor con tolerancia Levenshtein detecta la intención y responde sobre descompresión espinal.
3. Escribe: `dame otro` -> El motor utiliza la memoria de contexto y ofrece una recomendación alternativa de entrenamiento (ARED vs T2).
4. Prueba la prioridad de seguridad: escribe `tengo hambre pero hay humo en la cabina` -> ASTRA ignora la comida y activa de inmediato la alerta de emergencia y el protocolo HAB-01.

### Tarea 8 · Reloj de Misión y Recordatorios
1. En la barra superior, pulsa el botón **60x** o **600x** para acelerar el tiempo de misión.
2. Pulsa **⏭️ Próximo aviso**: el reloj saltará instantáneamente al siguiente hito (ej: 12:30 Almuerzo e hidratación).
3. Aparecerá la tarjeta de notificación proactiva y ASTRA anunciará el aviso con voz.
4. Prueba los botones: **✓ Hecho**, **⏱️ Posponer 10 min** u **✕ Omitir**.

### Tarea 9 · Módulos Específicos
1. Pulsa el atajo **Familia**: observa cómo en entorno orbital permite enlace de voz, mientras que si el hábitat es Marte, informa del retardo bidireccional de 28 minutos y habilita el buffer de transmisión asíncrono.
2. Pulsa el atajo **Bitácora**: selecciona el estado de ánimo (ej: "Con dificultad" -0.4), escribe una nota y guarda; el semáforo se recalcula al instante.
3. Pulsa el atajo **Soledad**: se abrirá la guía de respiración 4-4-4-4 donde el orbe se expande al inhalar y se contrae al exhalar durante 4 ciclos.

---

## 4. Guión de Demostración de 2 Minutos (Pitch Presentation)

| Tiempo | Pantalla / Acción | Diálogo para el Jurado |
|---|---|---|
| **0:00 - 0:25** | Portada / Inicio de ASTRA | *"Estimado jurado: en una misión de larga duración a la Luna o Marte, la mayor amenaza silenciosa no es solo la falla mecánica, sino el desgaste cognitivo, el aislamiento y la fatiga acumulada. Presentamos a **ASTRA**: el primer asistente de salud y acompañamiento para astronautas diseñado según estándares del NASA Human Research Program, capaz de operar al 100% sin internet."* |
| **0:25 - 0:55** | Semáforo y Orbe reactivo | *"A diferencia de un LLM comercial que alucina diagnósticos o requiere conexión a la nube, ASTRA utiliza un motor determinista y transparente. Aquí vemos a la comandante Elena en Nivel 0 óptimo. Pero si seleccionamos al ingeniero James Miller, el semáforo detecta fatiga leve nivel 1 combinando sueño y variabilidad de frecuencia cardíaca (HRV) contra su línea base personal."* |
| **0:55 - 1:25** | Módulos: Familia y Retardo | *"El aislamiento no se soluciona con una llamada común: en Marte, la señal tarda hasta 22 minutos en llegar a la Tierra. ASTRA adapta la interfaz familiar calculando la latencia orbital exacta. Si la distancia impide una llamada real, habilita notas de voz asíncronas con buffer de telemetría y mensajes de aliento familiar."* |
| **1:25 - 1:45** | Respiración y Bitácora | *"Cuando el estrés aumenta, ASTRA no receta fármacos: ofrece contramedidas no invasivas validadas por la NASA, como box breathing 4-4-4-4 sincronizado visualmente con el pulso del orbe, y una bitácora emocional que recalcula el semáforo de riesgo al instante."* |
| **1:45 - 2:00** | Cierre y Hardware | *"Todo lo que ven corre en local en esta Raspberry Pi, listo para conectarse a nuestros sensores biomédicos. ASTRA no es solo un monitor: es el compañero silencioso que mantiene sana y unida a la tripulación camino a Marte. Muchas gracias."* |

---

## 5. Integración con el Hardware Real (Raspberry Pi)

Cuando el equipo de sensores y hardware entregue el servidor local en la Raspberry Pi, **no es necesario modificar ningún componente visual ni la lógica del semáforo**:

1. Abrir `frontend/src/data/companion/companionData.ts`.
2. Reemplazar la lectura de `MOCK_DB` por una suscripción WebSocket o llamada REST al endpoint local de la Raspberry Pi:
   ```ts
   // Ejemplo de conexión en vivo:
   const socket = new WebSocket("ws://192.168.4.1:8080/api/v1/telemetry/stream");
   socket.onmessage = (event) => {
     const payload = JSON.parse(event.data);
     // Mapear campos según el CONTRATO_DATOS_HARDWARE.md:
     // payload.vitals.heart_rate_bpm -> frecuencia_cardiaca_bpm
     // payload.vitals.spo2_percent   -> spo2_pct
     // payload.environment.radiation_msv_h -> radiacion_mSv_h
   };
   ```
3. El formato de datos exacto, campos opcionales y tolerancias están detallados en [CONTRATO_DATOS_HARDWARE.md](file:///c:/Users/Lenovo/Documents/IA/Monitorizaci-n-Astronauta-Espacial/CONTRATO_DATOS_HARDWARE.md).
