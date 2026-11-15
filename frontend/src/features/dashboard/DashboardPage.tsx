import { AlertsPanel, CrewPanel, EnvironmentPanel, TrendPanel } from "@/components/panels";
import { Icon } from "@/components/ui";
import { SectionHeading } from "@/components/layout/PageHeading";
import { useUi } from "@/store/UiContext";
import { MissionBanner } from "./MissionBanner";
import { StatCards } from "./StatCards";

/** Página inicial: resumen ejecutivo de la salud de la misión. */
export function DashboardPage() {
  const { navigate } = useUi();

  return (
    <>
      <MissionBanner />
      <SectionHeading title="El pulso de la misión">
        Última actualización: hace 8 s <span className="small-divider">|</span> Datos simulados
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
