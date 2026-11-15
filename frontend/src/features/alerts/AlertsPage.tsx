import { AlertsPanel } from "@/components/panels";
import { Badge, Icon } from "@/components/ui";
import { InfoNote } from "@/components/ui/EmptyState";
import { MISSION_NOTES } from "@/data/mockData";
import { useMissionData } from "@/store/MissionDataContext";

/** Página de alertas: resumen, listado completo y aviso de límites. */
export function AlertsPage() {
  const { activeAlerts } = useMissionData();

  return (
    <>
      <div className="alert-summary">
        <span className="stat-icon amber">
          <Icon name="bell" size={24} />
        </span>
        <div>
          <h2>{activeAlerts.length} señales necesitan tu atención</h2>
          <p>Sin alertas críticas simuladas. Revisa la tendencia, el contexto y la línea base.</p>
        </div>
        <Badge>Evaluación local</Badge>
      </div>
      <AlertsPanel variant="full" />
      <InfoNote icon="shield">{MISSION_NOTES.alertsDisclaimer}</InfoNote>
    </>
  );
}
