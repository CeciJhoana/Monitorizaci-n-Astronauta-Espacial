# Registro de Fuentes Clínicas y Operativas Pendientes de Validación

> **Aviso**: Prototipo conceptual para NASA Space Apps Cochabamba · No es un dispositivo médico · Todo consejo operativo o de bienestar sin cita primaria verificada se documenta en este registro con estado "pendiente de revisión con el equipo" y se marca con `fuente: null` en la base de conocimiento (`knowledge.json`).

---

## 1. Consejos con Fuente Pendiente de Validación

| ID de Entrada | Categoría | Consejo / Procedimiento | Fuente Oficial de la NASA Propuesta para Consulta | Estado |
|---|---|---|---|---|
| `ejercicio-estiramientos` | Ejercicio · Flexibilidad | Estiramientos en microgravedad (10 min, descompresión espinal para aliviar tensión lumbar por elongación vertebral). | **NASA SP-2010-3407** *Human Integration Design Handbook (HIDH)*, Sección 5: "Musculoskeletal Architecture & Countermeasures". | Pendiente de revisión con el equipo |
| `presion-protocolo-med01` | Presión arterial · Medición | Protocolo MED-01: reposo sentado 5 min, brazo a la altura del corazón, manguito ajustado, 2 tomas separadas 2 min. | **NASA-STD-3001** *Space Flight Human-System Standard*, Volumen 1: "Crew Health & Medical Monitoring Procedures". | Pendiente de revisión con el equipo |
| `presion-frecuencia` | Presión arterial · Monitoreo | Frecuencia de toma: cada 48 h durante fase de adaptación (primeros 14 días), semanal en crucero estable. | **NASA Flight Medical Operations Handbook** / *ISS Medical Operations Requirements Documents (MORD)*. | Pendiente de revisión con el equipo |
| `soledad-respiracion` | Soledad · Regulación autónoma | Respiración cuadrada 4-4-4-4 (box breathing) de 1 minuto para modular el tono vagal y estabilizar el ritmo cardíaco. | **NASA Behavioral Health and Performance (BHP)**: *Stress Management & Resiliency Training Protocols*. | Pendiente de revisión con el equipo |
| `soledad-bitacora` | Soledad · Desahogo cognitivo | Registro subjetivo en la bitácora privada como desahogo afectivo y mitigador de estrés por confinamiento prolongado. | **NASA Behavioral Health and Performance (BHP)**: *Journals Flight Experiment (ISS behavioral monitoring through crew diaries)*. | Pendiente de revisión con el equipo |

---

## 2. Criterios de Inclusión en la Base de Conocimiento
- No inventar citas, URLs ni valores de corte clínicos.
- Toda recomendación médica o de rutina sin confirmación oficial de un manual de vuelo de la NASA debe permanecer con `"fuente": null` y `"validado": false`.
- En caso de contingencias mayores (despresurización, incendio, toxicidad), el sistema debe derivar de inmediato a la tripulación y a los procedimientos de emergencia de la nave (`HAB-01`), advirtiendo expresamente que el asistente **no debe utilizarse como sistema de soporte vital ni diagnóstico clínico**.
