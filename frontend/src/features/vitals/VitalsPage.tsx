import { TrendPanel } from "@/components/panels";
import { Badge, EmptyState, Icon, Panel, PanelTitle, Sparkline } from "@/components/ui";
import { computeCrewMetrics } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import { AstronautModel } from "./AstronautModel";

/** Tarjetas resumen con los promedios simulados de la tripulación. */
function VitalSummaryCards() {
  const { crew } = useMissionData();
  const metrics = computeCrewMetrics(crew);
  const reference = crew[0];

  const cards = [
    {
      name: "Frecuencia cardíaca",
      value: String(metrics.averageHeartRate),
      unit: "lpm",
      icon: "pulse" as const,
    },
    { name: "Saturación de oxígeno", value: "98", unit: "%", icon: "wind" as const },
    {
      name: "Temperatura corporal",
      value: reference.temperatureCelsius.toFixed(1),
      unit: "°C",
      icon: "temp" as const,
    },
    {
      name: "Presión arterial",
      value: reference.bloodPressure,
      unit: "mmHg",
      icon: "heart" as const,
    },
    {
      name: "Frecuencia respiratoria",
      value: String(reference.respiratoryRate),
      unit: "rpm",
      icon: "activity" as const,
    },
  ];

  return (
    <div className="vitals-cards">
      {cards.map((card, index) => (
        <div className="panel vital-card" key={card.name}>
          <span className="stat-icon purple">
            <Icon name={card.icon} />
          </span>
          <p>{card.name}</p>
          <strong>
            {card.value}
            <small>{card.unit}</small>
          </strong>
          <Sparkline variant={index} />
          <Badge>Promedio simulado</Badge>
        </div>
      ))}
    </div>
  );
}

/** Tabla de mediciones registradas durante la sesión. */
function SessionMeasurements() {
  const { crew, measurements } = useMissionData();
  const { openModal } = useUi();

  const memberName = (astronautId: string) =>
    crew.find((member) => member.id === astronautId)?.name ?? astronautId;

  return (
    <Panel className="readings-panel">
      <PanelTitle title="Mediciones de esta sesión">
        <button className="text-link" onClick={() => openModal({ type: "measurement" })}>
          Nueva medición
          <Icon name="plus" size={16} />
        </button>
      </PanelTitle>
      {measurements.length ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TRIPULANTE</th>
                <th>FRECUENCIA CARDÍACA</th>
                <th>SpO₂</th>
                <th>HORA LOCAL</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((measurement) => (
                <tr key={measurement.id}>
                  <td>{memberName(measurement.astronautId)}</td>
                  <td>{measurement.heartRate} lpm</td>
                  <td>{measurement.oxygenSaturation}%</td>
                  <td>{measurement.recordedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="pulse" title="Listos para la siguiente lectura">
          Registra una medición manual. Los registros se conservan en este dispositivo.
        </EmptyState>
      )}
    </Panel>
  );
}

/** Página de signos vitales: modelo corporal, promedios y registros. */
export function VitalsPage() {
  return (
    <>
      <AstronautModel />
      <VitalSummaryCards />
      <TrendPanel />
      <SessionMeasurements />
    </>
  );
}
