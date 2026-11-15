import { AlertsPanel, CrewPanel, EnvironmentPanel, TrendPanel } from "@/components/panels";
import { Icon } from "@/components/ui";
import { SectionHeading } from "@/components/layout/PageHeading";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import { MissionBanner } from "./MissionBanner";
import { StatCards } from "./StatCards";

function formatTelemetryTime(isoDate: string): string {
  return new Date(isoDate).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Etiqueta de frescura de datos según el enlace con la estación. */
function useDataFreshnessLabel(): string {
  const { telemetryStatus, liveTelemetry } = useMissionData();
  if (telemetryStatus === "live" && liveTelemetry) {
    const simulated = liveTelemetry.simulatedVitals ? " · signos SIM" : "";
    return `Última lectura: ${formatTelemetryTime(liveTelemetry.receivedAt)} · Estación ${liveTelemetry.detector}${simulated}`;
  }
  if (telemetryStatus === "connecting") return "Conectando con la estación de vitales…";
  return "Última actualización: hace 8 s · Datos simulados";
}

/** Página inicial: resumen ejecutivo de la salud de la misión. */
export function DashboardPage() {
  const { navigate } = useUi();
  const freshnessLabel = useDataFreshnessLabel();

  return (
    <>
      <MissionBanner />
      <SectionHeading title="El pulso de la misión">
        {freshnessLabel} <span className="small-divider">|</span> Órbita
      </SectionHeading>
      <StatCards />
      <div className="dashboard-middle">
        <TrendPanel />
        <AlertsPanel />
      </div>
      <div className="dashboard-bottom">
        <CrewPanel />
        <EnvironmentPanel />
      </div>
      <div className="daily-note">
        <span className="note-icon">
          <Icon name="sun" size={21} />
        </span>
        <div>
          <strong>Pequeños hábitos. Grandes misiones.</strong>
          <span>
            La próxima sesión de ejercicio de la tripulación está programada para las 16:00 UTC.
          </span>
        </div>
        <button className="text-link" onClick={() => navigate("wellness")}>
          Ver rutina de hoy
          <Icon name="arrow" size={15} />
        </button>
      </div>
    </>
  );
}
