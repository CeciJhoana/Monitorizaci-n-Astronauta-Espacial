import { SHOW_EXTRAS } from "@/config/features";
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
 * Construye las lecturas visibles para un tripulante.
 * Frecuencia respiratoria se oculta si `SHOW_EXTRAS` es falso.
 */
export function buildVitalReadings(member: CrewMember, latest?: Measurement): VitalReading[] {
  const heartRate = latest?.heartRate ?? member.heartRate;
  const oxygenSaturation = latest?.oxygenSaturation ?? member.oxygenSaturation;
  const underReview = member.requiresReview;

  const readings: VitalReading[] = [
    {
      key: "heart",
      label: "Frecuencia cardíaca",
      value: String(heartRate),
      unit: "lpm",
      location: "Tórax · Sensor cardíaco",
      baseline: underReview ? "66–76 lpm" : "60–74 lpm",
      description: "Pulsación orientativa según la frecuencia cardíaca registrada.",
      color: "#bd839c",
    },
    {
      key: "oxygen",
      label: "Saturación de oxígeno",
      value: String(oxygenSaturation),
      unit: "%",
      location: "Mano · Pulsioxímetro",
      baseline: "97–99 %",
      description: "Oxígeno en sangre estimado mediante pulsioxímetro periférico.",
      color: "#789dbb",
    },
    {
      key: "temperature",
      label: "Temperatura corporal",
      value: String(member.temperatureCelsius),
      unit: "°C",
      location: "Cabeza · Referencia térmica",
      baseline: "36.4–37.0 °C",
      description: "Referencia térmica del tripulante en hábitat.",
      color: "#c6a16f",
    },
    {
      key: "pressure",
      label: "Presión arterial",
      value: member.bloodPressure,
      unit: "mmHg",
      location: "Brazo · Manguito",
      baseline: "118/76 mmHg",
      description: "Presión sistólica/diastólica de referencia personal.",
      color: "#9b83c6",
    },
  ];

  if (SHOW_EXTRAS) {
    readings.push({
      key: "breathing",
      label: "Frecuencia respiratoria",
      value: String(member.respiratoryRate),
      unit: "rpm",
      location: "Pulmones · Ciclo respiratorio",
      baseline: "12–18 rpm",
      description: "Ciclo respiratorio orientativo sin evaluación diagnóstica.",
      color: "#78a898",
    });
  }

  return readings;
}
