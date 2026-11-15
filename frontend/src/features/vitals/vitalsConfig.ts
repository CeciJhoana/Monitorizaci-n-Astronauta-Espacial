import type { CrewMember, Measurement, VitalKey, VitalReading } from "@/types";

/** Posición de cada sensor sobre el modelo SVG del astronauta. */
export const SENSOR_POSITIONS: Record<VitalKey, [number, number]> = {
  heart: [214, 184],
  oxygen: [300, 269],
  temperature: [200, 77],
  pressure: [118, 202],
  breathing: [176, 183],
};

/**
 * Construye las cinco lecturas visibles para un tripulante.
 * Si hay una medición manual reciente, prioriza sus valores de FC y SpO₂.
 */
export function buildVitalReadings(member: CrewMember, latest?: Measurement): VitalReading[] {
  const heartRate = latest?.heartRate ?? member.heartRate;
  const oxygenSaturation = latest?.oxygenSaturation ?? member.oxygenSaturation;
  const underReview = member.requiresReview;

  return [
    {
      key: "heart",
      label: "Frecuencia cardíaca",
      value: String(heartRate),
      unit: "lpm",
      location: "Tórax · Sensor cardíaco",
      baseline: underReview ? "66–76 lpm" : "60–74 lpm",
      description:
        "La pulsación del modelo representa la frecuencia seleccionada. Es una animación ilustrativa, no una señal ECG ni una medición en tiempo real.",
      color: "#bd839c",
    },
    {
      key: "oxygen",
      label: "Saturación de oxígeno",
      value: String(oxygenSaturation),
      unit: "%",
      location: "Mano · Pulsioxímetro",
      baseline: "97–99 %",
      description:
        "Representa el oxígeno transportado en la sangre. El punto de la mano identifica la ubicación ilustrativa de un pulsioxímetro.",
      color: "#789dbb",
    },
    {
      key: "temperature",
      label: "Temperatura corporal",
      value: String(member.temperatureCelsius),
      unit: "°C",
      location: "Cabeza · Referencia térmica",
      baseline: "36.4–37.0 °C",
      description:
        "Referencia de temperatura del tripulante. La posición del marcador es orientativa: la ubicación real depende del sensor utilizado.",
      color: "#c6a16f",
    },
    {
      key: "pressure",
      label: "Presión arterial",
      value: member.bloodPressure,
      unit: "mmHg",
      location: "Brazo · Manguito",
      baseline: "118/76 mmHg",
      description:
        "Muestra las presiones sistólica y diastólica de ejemplo. Para una lectura real, sigue el procedimiento aprobado para el equipo de la misión.",
      color: "#9b83c6",
    },
    {
      key: "breathing",
      label: "Frecuencia respiratoria",
      value: String(member.respiratoryRate),
      unit: "rpm",
      location: "Pulmones · Ciclo respiratorio",
      baseline: "12–18 rpm",
      description:
        "La expansión torácica ilustra el ciclo respiratorio mostrado. No representa una evaluación pulmonar ni un diagnóstico.",
      color: "#78a898",
    },
  ];
}
