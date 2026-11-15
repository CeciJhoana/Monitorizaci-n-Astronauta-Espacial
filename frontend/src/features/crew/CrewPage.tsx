import { CrewPanel } from "@/components/panels";
import { Icon } from "@/components/ui";
import { InfoNote } from "@/components/ui/EmptyState";
import { MISSION } from "@/config/mission";
import { MISSION_NOTES } from "@/data/mockData";
import { computeCrewMetrics } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";

/** Página de tripulación: resumen numérico y tabla completa. */
export function CrewPage() {
  const { crew } = useMissionData();
  const metrics = computeCrewMetrics(crew);

  return (
    <>
      <div className="crew-summary">
        <div>
          <Icon name="crew" size={25} />
          <strong>{String(crew.length).padStart(2, "0")}</strong>
          <span>Tripulantes a bordo</span>
        </div>
        <div>
          <Icon name="shield" size={25} />
          <strong>{String(metrics.membersInRange).padStart(2, "0")}</strong>
          <span>En rango habitual</span>
        </div>
        <div>
          <Icon name="clock" size={25} />
          <strong>{MISSION.day}</strong>
          <span>Días de seguimiento</span>
        </div>
      </div>
      <CrewPanel variant="full" />
      <InfoNote icon="help">{MISSION_NOTES.baselineInfo}</InfoNote>
    </>
  );
}
