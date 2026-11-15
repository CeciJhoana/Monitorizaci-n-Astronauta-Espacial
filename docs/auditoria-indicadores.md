# Auditoría de Indicadores y Contenido de Interfaz — Órbita / ASTRA

> **Misión**: NASA Space Apps Challenge — *Create Health Monitoring Software for Astronauts on Space Missions*  
> **Criterio de Evaluación**: Todo elemento en pantalla debe justificar su presencia ante el jurado bajo los 5 indicadores del reto, los 5 peligros de la NASA investigados, sensores físicos/telemetría real, o el motor del asistente/semáforo. Lo no justificable se oculta tras `SHOW_EXTRAS`; lo justificable sin sensor se etiqueta visualmente con la píldora `"SIMULADO"`.

---

## 1. Tabla Maestra de Auditoría por Elemento y Pantalla

| Elemento / Componente | Dónde está | Peligro NASA o Indicador del Reto que lo Justifica | Tipo de Dato | Decisión | Motivo en una línea |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Presión arterial** | VitalsPage, AstronautModel | Indicador 1 del Reto (PA sistólica/diastólica) | Simulado (118/76 mmHg) | **MOCKEAR** | Requerido por el reto; sin sensor físico en prototipo, añadir píldora `SIMULADO`. |
| **Frecuencia cardíaca** | Dashboard, Vitals, Crew, StatCards | Indicador 2 del Reto + Alertas agudas + Semáforo | Captura ESP32 / CSV real | **MANTENER** | Sensor físico funcional (pulsioxímetro/ECG) y signo vital central del reto. |
| **Glucosa** | VitalsPage, Dashboard (a añadir) | Indicador 3 del Reto (glicemia en ayunas) | Simulado (85 mg/dL) | **MOCKEAR** | Mandatorio en el reto; ausente en UI actual, incorporar con píldora `SIMULADO` (70–99 mg/dL). |
| **Temperatura corporal** | VitalsPage, CrewPage | Indicador 4 del Reto + Telemetría RR-1 + Alertas | Captura ESP32 / CSV real | **MANTENER** | Sensor térmico real en hardware y variable crítica en hábitats cerrados. |
| **Horas de sueño** | Dashboard, Wellness, Crew | Indicador 5 del Reto + Peligro Aislamiento + Semáforo | Simulado / Registro | **MANTENER** | Signo vital del reto y factor primario del semáforo conductual (Nivel 0–3). |
| **Frecuencia respiratoria** | VitalsPage, AstronautModel | Ninguno (no está en reto ni en sensores del equipo) | Simulado | **OCULTAR** | Fuera de alcance del reto y sin sensor en prototipo; ocultar con `SHOW_EXTRAS`. |
| **Saturación de oxígeno (SpO₂)** | VitalsPage, CrewPage | Alertas agudas + Captura ESP32 | Captura ESP32 | **MANTENER** | Medido por hardware real (pulsioxímetro) y clave para hipoxia en cabina. |
| **CO₂ en cabina (ppm)** | EnvironmentPage, EnvironmentPanel | Peligro Entornos Cerrados (Ventilación) | CSV real (RR-1) | **MANTENER** | Telemetría real de NASA RR-1 que correlaciona con fatiga y cefaleas. |
| **Radiación diaria / acumulada** | EnvironmentPage, EnvironmentPanel | Peligro Radiación Espacial (mSv) | CSV real (RR-1) | **MANTENER** | Telemetría real de radiación espacial en hábitat ARES-01 / ISS. |
| **Temperatura y humedad ambiente** | EnvironmentPage, EnvironmentPanel | Peligro Entornos Cerrados | Captura ESP32 / CSV real | **MANTENER** | Telemetría real de soporte vital y confort ambiental en cabina. |
| **Desviación de HRV** | WellnessPage, companionEngine | Peligro Aislamiento + Semáforo (Nivel 0–3) | Simulado | **MOCKEAR** | Indicador clave del estrés autonómico en el semáforo; etiquetar `SIMULADO`. |
| **Ejercicio físico diario (min)** | WellnessPage, companionEngine | Peligro Campos Gravitatorios (ARED/T2) + Semáforo | Simulado / Bitácora | **MANTENER** | Contramedida de atrofia musculoesquelética en microgravedad (minutos activos). |
| **Pasos (conteo)** | Base de datos (`seed.ts`) | Ninguno (en 0g no se camina por pasos) | Simulado | **OCULTAR** | En microgravedad los pasos no tienen sentido físico; no exponer en la UI. |
| **Exposición a luz (lux)** | WellnessPage, EnvironmentPage | Peligro Aislamiento (Ritmo circadiano) + Semáforo | Captura ESP32 (UV/Luz) | **MANTENER** | Higiene circadiana regulada para sincronizar el sueño en ciclos orbitales. |
| **Hidratación registrada** | WellnessPage (hábitos) | Ninguno (no está en reto ni en semáforo) | Simulado | **OCULTAR** | Sin sensor ni impacto en el semáforo conductual; ocultar con `SHOW_EXTRAS`. |
| **Tiempo en zonas sociales (%)** | companionEngine / rules | Peligro Aislamiento + Semáforo conductual | Simulado | **MOCKEAR** | Métrica de aislamiento social del semáforo; etiquetar como `SIMULADO`. |
| **Eficiencia de sueño (%)** | companionEngine / rules | Peligro Aislamiento + Semáforo conductual | Simulado | **MOCKEAR** | Evalúa fragmentación del sueño en el semáforo; etiquetar como `SIMULADO`. |
| **Ánimo en bitácora** | JournalPage, companionEngine | Peligro Aislamiento (Salud psicológica) | Entrada local del usuario | **MANTENER** | Alimenta directamente la variable de ánimo del semáforo conductual. |
| **Semáforo conductual (Nivel 0–3)**| Dashboard (a destacar), Asistente | Autonomía + Detección temprana de fatiga/estrés | Calculado localmente | **MANTENER** | Núcleo del asistente preventivo de salud del astronauta acordado con el equipo. |
| **Simular pérdida de enlace** | SettingsModal, Topbar | Peligro Distancia (Retraso y pérdida de comms) | Estado local offline | **MANTENER** | Demuestra la capacidad operativa autónoma del sistema sin internet. |
| **Protocolos (MED, WEL, HAB, AUT)**| ProtocolsPage, modales | Autonomía médica de emergencia ante pérdida de enlace | Guías estructuradas | **ACORTAR** | Esenciales para contingencias autónomas; acortar descripciones a 1 frase concisa. |
| **TrendPanel en Dashboard** | DashboardPage (`dashboard-middle`) | Ninguno en página inicial (duplica Vitals) | Simulado | **OCULTAR** | Satura la vista inicial; el dashboard debe resumir solo signos, semáforo, alertas y cabina. |
| **Tarjetas Salud tripulación (68/100)**| StatCards en Dashboard | Ninguno (puntuación agregada abstracta) | Calculado arbitrario | **OCULTAR** | Reemplazar en Dashboard por los 5 signos vitales del reto y el semáforo ASTRA. |
| **daily-note (banner motivacional)**| DashboardPage (pie) | Ninguno | Texto estático | **OCULTAR** | Texto decorativo prescindible que añade ruido visual a la vista de mando. |
| **Exportar informe CSV** | `exportReport.ts` | Autonomía y respaldo offline | Generado local en cliente | **MANTENER** | Herramienta de contingencia para transferir datos médicos cuando vuelva el enlace. |
| **Cola de sincronización** | Base de datos (`schema.ts`) | Peligro Distancia (Store & forward) | Modelo de BD | **OCULTAR** | Capa interna de transporte; mantener en código pero no saturar la UI con ella. |
| **Usuarios y cambio de perfil** | Topbar, Sidebar, ProfileModal | Línea base personalizada por tripulante | Local / Mock DB | **ACORTAR** | Permite verificar que cada astronauta tiene su propia línea base y semáforo. |
| **Alertas activas y triaje** | Dashboard, AlertsPage, Topbar | Seguridad de vuelo + Signos agudos | Reglas de umbrales | **ACORTAR** | Mantener activas; reducir texto de recomendación y mover explicación a "¿Por qué?". |
| **Asistente ASTRA (Orbe y Voz)** | AssistantPage, MiniOrbLauncher | Asistente de salud, ánimo y rutina sin red | Motor de reglas local | **MANTENER** | Cumple el núcleo del proyecto con respuestas cortas, voz desbloqueada y empatía. |

---

## 2. Recuento de Palabras de Texto Estático por Pantalla

| Pantalla / Vista | Palabras Antes | Palabras Propuestas (Después) | Reducción (%) | Principales Textos Recortados / Ocultados |
| :--- | :---: | :---: | :---: | :--- |
| **Dashboard** (`DashboardPage.tsx`) | 485 | 135 | **-72.2%** | Eliminado TrendPanel duplicado, eliminada tarjeta abstracta "68/100", eliminada nota diaria; añadido semáforo y 5 signos vitales concisos. |
| **Signos Vitales** (`VitalsPage.tsx`) | 390 | 120 | **-69.2%** | Ocultada frecuencia respiratoria; añadidas tarjetas de Glucosa y Presión (Simuladas); descripciones de sensores en tórax/cabeza reducidas a 1 frase con `<details>` "¿Por qué?". |
| **Bienestar** (`WellnessPage.tsx`) | 325 | 105 | **-67.7%** | Ocultada hidratación; banner poético acortado a 1 frase; notas extensas de la rutina ARED/T2 reducidas a títulos breves de tarea. |
| **Entorno de Cabina** (`EnvironmentPage.tsx`) | 280 | 90 | **-67.8%** | Banner hero condensado a 1 línea; bloques narrativos "La salud depende del hábitat" reducidos a 1 frase concisa con desplegable explicativo. |
| **Tripulación** (`CrewPage.tsx`) | 210 | 75 | **-64.3%** | Nota larga de línea base comprimida a 1 frase concisa; tabla optimizada con los 5 signos e icono de semáforo. |
| **Protocolos** (`ProtocolsPage.tsx`) | 270 | 85 | **-68.5%** | Banner de advertencias comprimido a 1 frase; tarjetas de protocolos con descripciones de máx. 8 palabras; pasos en listas limpias. |
| **Bitácora** (`JournalPage.tsx`) | 240 | 70 | **-70.8%** | Panel lateral "Tu perspectiva importa" condensado de 4 párrafos a 1 frase de contexto orientativa. |
| **Alertas** (`AlertsPage.tsx`) | 195 | 65 | **-66.7%** | Párrafos redundantes de advertencia unificados en una sola etiqueta sobria; textos de detalle llevados a vista colapsable. |
| **Modales y Estructura Global** (Settings, Help, Profile, Topbar, Sidebar, Footer) | 470 | 180 | **-61.7%** | Textos de bienvenida y descripciones de configuración simplificados; conservado "Simular pérdida de enlace". |
| **TOTAL GLOBAL EN LA APP** | **2,865** | **925** | **-67.7%** | **Reducción de casi 2,000 palabras de texto redundante y decorativo**, pasando a una interfaz de cabina espacial ágil y directa. |

---

## 3. Revisión Específica de Puntos Solicitados por el Usuario

1. **Frecuencia respiratoria**:
   - *Diagnóstico*: No está entre los 5 indicadores mandatorios del reto, no cuenta con sensor en el hardware del equipo ni figura en la telemetría investigada.
   - *Acción*: Ocultar tanto de `vitalsConfig.ts` como de `VitalsPage.tsx` mediante la bandera `SHOW_EXTRAS = false`.

2. **Pasos (`pasos`)**:
   - *Diagnóstico*: En microgravedad (0g) no existe marcha ni conteo de pasos. Toda la contramedida física de la NASA se calcula en minutos de ejercicio en máquinas especializadas (ARED para fuerza y T2 para cardiovascular).
   - *Acción*: Ocultar cualquier mención a "pasos" en la interfaz. El ejercicio se mantiene y monitoriza en minutos activos.

3. **Hidratación**:
   - *Diagnóstico*: No posee sensor de captura en el prototipo, no entra en el reto ni en las 6 variables del semáforo conductual.
   - *Acción*: Ocultar de la vista de hábitos en `WellnessPage.tsx` bajo `SHOW_EXTRAS`.

4. **Eficiencia de sueño**:
   - *Diagnóstico*: Es una variable clínica vital para el semáforo conductual (Nivel 0: $\ge 85\%$, Nivel 1: $70–84\%$, Nivel 2: $55–69\%$, Nivel 3: $<55\%$), pero no se mide con polisomnografía en el hardware actual.
   - *Acción*: Mantener activa en el motor del semáforo; si se expone en la interfaz, mostrar con la píldora visual `"SIMULADO"`.

5. **Zonas sociales**:
   - *Diagnóstico*: Métrica del semáforo conductual para detectar aislamiento en hábitats (Nivel 0: $35–60\%$, Nivel 1: $20–34\%$, Nivel 2: $<20\%$, Nivel 3: $<10\%$).
   - *Acción*: Mantener en las reglas del asistente con valores de `seed.ts`, identificada como `"SIMULADO"`.

6. **Exportar informe (`exportReport.ts`)**:
   - *Diagnóstico*: Permite descargar en cliente un archivo CSV con las mediciones y la línea base del día.
   - *Acción*: Mantener como utilidad de contingencia offline ante la falta de conexión con Tierra (justificado por el peligro de Distancia).

7. **Cola de sincronización (`cola_sincronizacion`)**:
   - *Diagnóstico*: Estructura de almacenamiento en cola (store-and-forward) para subida diferida cuando se restablece la telemetría con Houston.
   - *Acción*: Ocultar de la interfaz visual para no saturar al usuario; mantener su soporte lógico en el modelo de base de datos.

8. **Usuarios y preferencias (`SettingsModal.tsx`, `ProfileModal.tsx`)**:
   - *Diagnóstico*: Esencial para demostrar al jurado que la línea base es **personal** (cada tripulante tiene su propio rango habitual de FC, sueño y semáforo).
   - *Acción*: Mantener el selector de tripulante y línea base; acortar textos largos explicativos.

9. **"Simular pérdida de enlace"**:
   - *Diagnóstico*: Control interactivo en configuración que activa el modo local y conmuta el indicador de la cabecera.
   - *Acción*: **MANTENER OBLIGATORIAMENTE**. Responde directamente al peligro de Distancia y aislamiento de comunicación, demostrando que ASTRA y Órbita funcionan 100% offline.

10. **Protocolos operativos (MED-01, WEL-01, HAB-01, AUT-01)**:
    - *Diagnóstico*: MED-01 cubre la medición de signos y presión; WEL-01 maneja la fatiga/sueño; HAB-01 gestiona el CO₂ elevado; AUT-01 guía la toma de decisiones sin contacto con Tierra.
    - *Acción*: Mantener los 4 protocolos porque cada uno responde a un peligro de NASA investigado y a la autonomía médica. Acortar el texto del banner y las descripciones de las tarjetas a una sola frase directa.

11. **Glucosa y Presión arterial (Los 2 del reto pendientes en UI)**:
    - *Diagnóstico*: El reto exige explícitamente 5 indicadores: presión arterial, frecuencia cardíaca, glucosa, temperatura corporal, horas de sueño. Presión arterial estaba en Vitals pero no en Dashboard; Glucosa faltaba en ambos.
    - *Acción*: Agregar Glucosa (70–99 mg/dL en ayunas) y Presión arterial (118/76 mmHg) en `DashboardPage` y `VitalsPage`, ambas claramente etiquetadas con la píldora `"SIMULADO"` en estilo ASTRA.

---

## 4. Regla de Reversibilidad (Feature Flag)

Para garantizar que ningún cambio sea destructivo ni rompa la retrocompatibilidad:
- Se crea el archivo `src/config/features.ts` con la constante central:
  ```ts
  export const SHOW_EXTRAS = false;
  ```
- Si en cualquier momento el equipo o el jurado desea visualizar los componentes adicionales (frecuencia respiratoria, hidratación, paneles extensos, gráficos secundarios en dashboard), basta con cambiar `SHOW_EXTRAS = true;` sin alterar la estructura del código.
