import { Badge, Icon, Panel, PanelTitle } from "@/components/ui";
import { getEnvironmentOption } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

interface EnvironmentPanelProps {
  variant?: "compact" | "full";
}

/** Panel de telemetría ambiental de a bordo. */
export function EnvironmentPanel({ variant = "compact" }: EnvironmentPanelProps) {
  const { environmentReadings, environment } = useMissionData();
  const { navigate } = useUi();
  const full = variant === "full";
  const option = getEnvironmentOption(environment);

  return (
    <Panel className="environment-panel">
      <PanelTitle title="Entorno de a bordo">
        {full ? (
          <Badge>Sensores en línea</Badge>
        ) : (
          <button
            className="subtle-icon"
            aria-label="Ver entorno espacial"
            onClick={() => navigate("environment")}
          >
            <Icon name="arrow" size={17} />
          </button>
        )}
      </PanelTitle>
      <div className={full ? "environment-grid" : "environment-list"}>
        {environmentReadings.map((reading) => (
          <div className={`env-item ${reading.warning ? "warning" : ""}`} key={reading.id}>
            <span className="env-icon">
              <Icon name={reading.icon} size={19} />
            </span>
            <div className="env-data">
              <div className="env-label">
                {reading.name}
                <span>{reading.status}</span>
              </div>
              <div className="env-value">
                {reading.value} <small>{reading.unit}</small>
              </div>
              <div className="progress-track">
                <i style={{ width: `${reading.percent}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="environment-foot">
        <span className="status-dot" />
        {option.label} · {option.gravityLabel}
      </div>
    </Panel>
  );
}
