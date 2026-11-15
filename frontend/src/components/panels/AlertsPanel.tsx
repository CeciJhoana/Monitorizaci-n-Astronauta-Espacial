import { Badge, EmptyState, Icon, Panel, PanelTitle } from "@/components/ui";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import { useToast } from "@/store/ToastContext";

interface AlertsPanelProps {
  /** `full` muestra el detalle completo y el restablecimiento de la demo. */
  variant?: "compact" | "full";
}

/** Panel de alertas activas de la misión. */
export function AlertsPanel({ variant = "compact" }: AlertsPanelProps) {
  const { activeAlerts, restoreDemoAlerts } = useMissionData();
  const { navigate, openModal } = useUi();
  const { notify } = useToast();
  const full = variant === "full";

  return (
    <Panel className={`alerts-panel ${full ? "full-alerts" : ""}`}>
      <PanelTitle title="Atención de la misión">
        <span className="count-badge">{activeAlerts.length} activas</span>
      </PanelTitle>
      {activeAlerts.length ? (
        activeAlerts.map((alert) => (
          <button
            key={alert.id}
            className={`alert-card ${alert.tone === "purple" ? "alert-violet" : ""}`}
            onClick={() => openModal({ type: "alert-detail", alert })}
          >
            <span className="alert-symbol">
              <Icon name={alert.icon} size={18} />
            </span>
            <div>
              <div className="alert-meta">
                {alert.level}
                <span>{alert.relativeTime}</span>
              </div>
              <h4>{alert.title}</h4>
              <p>
                {alert.subject}
                {full && ` · ${alert.detail}`}
              </p>
              <span className="alert-link">
                Revisar {alert.category === "Entorno" ? "entorno" : "indicadores"}{" "}
                <Icon name="arrow" size={14} />
              </span>
            </div>
          </button>
        ))
      ) : (
        <EmptyState title="Todo revisado">No hay alertas pendientes en esta sesión.</EmptyState>
      )}
      <button
        className="text-link all-alerts"
        onClick={() =>
          full
            ? (restoreDemoAlerts(), notify("Alertas de demostración restablecidas"))
            : navigate("alerts")
        }
      >
        {full ? "Restablecer demostración" : "Ver todas las alertas"}
        <Icon name="arrow" size={15} />
      </button>
    </Panel>
  );
}
