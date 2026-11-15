import { Avatar, Icon, Sparkline } from "@/components/ui";
import { computeCrewMetrics } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";

/** Cuatro tarjetas con el pulso agregado de la tripulación. */
export function StatCards() {
  const { crew } = useMissionData();
  const metrics = computeCrewMetrics(crew);

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-top">
          <span>Salud de la tripulación</span>
          <span className="stat-icon purple">
            <Icon name="heart" size={18} />
          </span>
        </div>
        <div className="stat-main">
          <strong>
            {metrics.averageWellnessScore}
            <small>/100</small>
          </strong>
          <div className="mini-ring">
            {metrics.averageWellnessScore}
            <span>%</span>
          </div>
        </div>
        <div className="stat-bottom">
          <span className="positive">↑ 3 puntos</span>
          <span>vs. ayer</span>
          <span className="stat-tag">Estable</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Tripulantes en rango</span>
          <span className="stat-icon green">
            <Icon name="crew" size={18} />
          </span>
        </div>
        <div className="stat-main">
          <strong>
            {metrics.membersInRange}
            <small>/{crew.length}</small>
          </strong>
          <div className="tiny-avatars">
            {crew.map((member) => (
              <Avatar key={member.id} member={member} small />
            ))}
          </div>
        </div>
        <div className="stat-bottom">
          <span className="status-dot" />
          <span>
            {metrics.membersUnderReview} tripulante{metrics.membersUnderReview === 1 ? "" : "s"} en
            observación
          </span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Frecuencia cardíaca media</span>
          <span className="stat-icon rose">
            <Icon name="pulse" size={18} />
          </span>
        </div>
        <div className="stat-main">
          <strong>
            {metrics.averageHeartRate}
            <small>lpm</small>
          </strong>
          <Sparkline color="#cd8c9a" />
        </div>
        <div className="stat-bottom">
          <span className="positive">En línea base</span>
          <span>60–80 lpm</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Descanso de la tripulación</span>
          <span className="stat-icon blue">
            <Icon name="moon" size={18} />
          </span>
        </div>
        <div className="stat-main">
          <strong>
            {metrics.averageSleepHours}
            <small>h</small>
          </strong>
          <Sparkline color="#88a4c9" variant={1} />
        </div>
        <div className="stat-bottom">
          <span className="positive">↑ 0.4 h</span>
          <span>vs. noche anterior</span>
        </div>
      </div>
    </div>
  );
}
