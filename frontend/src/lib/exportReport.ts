import type { CrewMember, Measurement } from "@/types";
import { MISSION } from "@/config/mission";

/**
 * Genera el contenido CSV del informe de misión con los datos
 * simulados y las mediciones registradas en la sesión.
 */
export function buildMissionReportCsv(crew: CrewMember[], measurements: Measurement[]): string {
  const rows = [
    "ÓRBITA — Informe de misión ARES-01",
    `Prototipo · Datos simulados · Día ${MISSION.day}`,
    "Tripulante,Frecuencia cardiaca,SpO2,Temperatura,Sueño,Estado",
    ...crew.map(
      (member) =>
        `${member.name},${member.heartRate},${member.oxygenSaturation},${member.temperatureCelsius},${member.sleepHours},${member.status}`,
    ),
    "",
    "Mediciones registradas en esta sesión",
    ...measurements.map(
      (measurement) =>
        `${measurement.astronautId},${measurement.heartRate},${measurement.oxygenSaturation},${measurement.recordedAt}`,
    ),
  ];
  // BOM para que Excel respete los acentos al abrir el archivo.
  return "\uFEFF" + rows.join("\n");
}

/** Descarga un archivo CSV en el navegador. */
export function downloadCsv(filename: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: "text/csv;charset=utf-8;" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportMissionReport(crew: CrewMember[], measurements: Measurement[]): void {
  downloadCsv(`orbita-informe-dia-${MISSION.day}.csv`, buildMissionReportCsv(crew, measurements));
}
