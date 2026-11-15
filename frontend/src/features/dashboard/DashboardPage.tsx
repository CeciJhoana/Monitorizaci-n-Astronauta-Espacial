import { SHOW_EXTRAS } from "@/config/features";
import { AlertsPanel, CrewPanel, EnvironmentPanel, TrendPanel } from "@/components/panels";
import { Icon } from "@/components/ui";
import { SectionHeading } from "@/components/layout/PageHeading";
import { useUi } from "@/store/UiContext";
import { TelemetrySourceControl } from "@/components/telemetry/TelemetrySourceControl";
import { MissionBanner } from "./MissionBanner";
import { StatCards } from "./StatCards";

/**
 * Página inicial: resumen ejecutivo enfocado en la salud de la misión.
 * Muestra exclusivamente: Semáforo ASTRA, los 5 signos vitales del reto,
 * alertas activas y telemetría de entorno.
 */
export function DashboardPage() {
  const { navigate } = useUi();

  return (
    <>
      <MissionBanner />
      <TelemetrySourceControl />
      <SectionHeading title="Monitoreo biomédico y ambiental">
        ASTRA v1.0 <span className="small-divider">|</span> Sensores en línea
      </SectionHeading>
      <StatCards />

      {SHOW_EXTRAS ? (
        <>
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
              <span>Próxima sesión de ejercicio programada a las 16:00 UTC.</span>
            </div>
            <button className="text-link" onClick={() => navigate("wellness")}>
              Ver rutina de hoy
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </>
      ) : (
        <div className="dashboard-middle" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "18px" }}>
          <AlertsPanel />
          <EnvironmentPanel />
        </div>
      )}
    </>
  );
}
