import { Avatar, Badge, Icon } from "@/components/ui";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import { ModalShell } from "./ModalShell";

interface ProfileModalProps {
  memberId: string;
}

/** Modal con el perfil y línea base de un tripulante. */
export function ProfileModal({ memberId }: ProfileModalProps) {
  const { crew } = useMissionData();
  const { openModal, closeModal } = useUi();
  const member = crew.find((candidate) => candidate.id === memberId);
  if (!member) return null;

  return (
    <ModalShell ariaLabel={member.name} onClose={closeModal} className="profile-modal">
      <div className="profile-modal-heading">
        <Avatar member={member} />
        <span className="eyebrow">ARES–01 / TRIPULANTE {member.id}</span>
        <h2>{member.name}</h2>
        <p>{member.role}</p>
        <Badge tone={member.requiresReview ? "amber" : "green"}>{member.status}</Badge>
      </div>
      <div className="profile-stats">
        <div>
          <Icon name="pulse" />
          <strong>
            {member.heartRate}
            <small>lpm</small>
          </strong>
          <span>Frecuencia cardíaca</span>
        </div>
        <div>
          <Icon name="wind" />
          <strong>
            {member.oxygenSaturation}
            <small>%</small>
          </strong>
          <span>Saturación de O₂</span>
        </div>
        <div>
          <Icon name="moon" />
          <strong>
            {member.sleepHours}
            <small>h</small>
          </strong>
          <span>Último descanso</span>
        </div>
      </div>
      <h3>Una referencia propia</h3>
      <p className="modal-description">
        Línea base simulada: 64–74 lpm · SpO₂ 97–99% · Temperatura 36.4–37.0 °C. Referencia de los
        primeros 14 días.
      </p>
      {member.requiresReview && (
        <div className="profile-warning">
          <Icon name="moon" />
          <p>
            HRV 21% por debajo de la línea base. Revisar descanso y evolución con el oficial médico.
          </p>
        </div>
      )}
      <button
        className="button primary full-width"
        onClick={() => {
          closeModal();
          openModal({ type: "measurement" });
        }}
      >
        Registrar nueva medición
        <Icon name="plus" size={17} />
      </button>
    </ModalShell>
  );
}
