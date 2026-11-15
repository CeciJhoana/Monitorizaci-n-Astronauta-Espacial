import { Badge, Icon } from "@/components/ui";
import { MISSION } from "@/config/mission";
import { MOCK_ROUTINE, getWellnessHints } from "@/data/mockData";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

/** Página de bienestar: hábitos por tripulante y rutina del día. */
export function WellnessPage() {
  const { crew } = useMissionData();
  const { navigate, openModal } = useUi();

  return (
    <>
      <div className="wellness-banner">
        <span className="large-moon">
          <Icon name="moon" size={55} />
        </span>
        <div>
          <span className="eyebrow">EL LADO HUMANO DE LA EXPLORACIÓN</span>
          <h2>El descanso también te lleva más lejos.</h2>
          <p>Observa las tendencias de recuperación, movimiento y conexión de tu tripulación.</p>
        </div>
        <button className="button secondary" onClick={() => navigate("journal")}>
          Mi bitácora
          <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="wellness-grid">
        {crew.map((member) => {
          const hints = getWellnessHints(member.requiresReview);
          return (
            <section className="panel wellness-card" key={member.id}>
              <div className="person-cell">
                <span className={`avatar ${member.color}`}>{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <span>{member.role}</span>
                </div>
              </div>
              <div className="sleep-score">
                <Icon name="moon" size={19} />
                <strong>
                  {member.sleepHours}
                  <small> h de sueño</small>
                </strong>
                <Badge tone={member.requiresReview ? "amber" : "green"}>
                  {member.requiresReview ? "Revisar" : "Habitual"}
                </Badge>
              </div>
              <div className="habit-line">
                <span>Recuperación HRV</span>
                <strong>{hints.hrv}</strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${member.wellnessScore - 10}%` }} />
              </div>
              <div className="habit-line">
                <span>Ejercicio diario</span>
                <strong>{hints.exercise}</strong>
              </div>
              <div className="progress-track">
                <i style={{ width: `${hints.exercisePercent}%` }} />
              </div>
              <div className="habit-line">
                <span>Hidratación registrada</span>
                <strong>{hints.hydration}</strong>
              </div>
              <div className="habit-line">
                <span>Exposición a luz</span>
                <strong>{hints.light}</strong>
              </div>
              <button
                className="text-link"
                onClick={() => openModal({ type: "profile", crewMember: member })}
              >
                Ver perfil de bienestar
                <Icon name="arrow" size={15} />
              </button>
            </section>
          );
        })}
      </div>

      <section className="panel">
        <div className="panel-title">
          <div>
            <h3>Rutina de hoy</h3>
            <p>Día de misión {MISSION.day} · Horario UTC</p>
          </div>
        </div>
        <div className="routine-list">
          {MOCK_ROUTINE.map((item) => (
            <div className="routine-item" key={item.time}>
              <span>{item.time}</span>
              <div>
                <strong>{item.name}</strong>
                <p>{item.note}</p>
              </div>
              <Badge tone={item.done ? "green" : "purple"}>
                {item.done ? "Completado" : "Programado"}
              </Badge>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
