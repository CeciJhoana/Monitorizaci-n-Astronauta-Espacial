import { Icon } from "@/components/ui";
import { InfoNote } from "@/components/ui/EmptyState";
import { useMissionData } from "@/store/MissionDataContext";
import { useToast } from "@/store/ToastContext";
import { useUi } from "@/store/UiContext";
import { ModalShell } from "./ModalShell";

interface AlertDetailModalProps {
  alertId: number;
}

/** Modal explicativo de una alerta: por qué salta y qué hacer. */
export function AlertDetailModal({ alertId }: AlertDetailModalProps) {
  const { alerts, acknowledgeAlert } = useMissionData();
  const { closeModal } = useUi();
  const { notify } = useToast();
  const alert = alerts.find((candidate) => candidate.id === alertId);
  if (!alert) return null;

  const selectedAlert = alert;

  function handleAcknowledge() {
    acknowledgeAlert(selectedAlert.id);
    closeModal();
    notify("Alerta marcada como revisada");
  }

  return (
    <ModalShell ariaLabel={alert.title} onClose={closeModal}>
      <span className="eyebrow">
        ALERTA {alert.level.toUpperCase()} · {alert.category.toUpperCase()}
      </span>
      <h2>{alert.title}</h2>
      <p className="modal-description">
        {alert.subject} · {alert.relativeTime}
      </p>
      <div className="alert-explanation">
        <h3>¿Por qué aparece esta señal?</h3>
        <p>{alert.detail}</p>
      </div>
      <h3>Qué puedes hacer</h3>
      <p className="modal-description">{alert.recommendedAction}</p>
      <InfoNote>
        Ejemplo orientativo no validado clínicamente. No es un diagnóstico ni una autorización
        operativa.
      </InfoNote>
      <button className="button primary full-width" onClick={handleAcknowledge}>
        <Icon name="check" size={17} />
        Marcar como revisada
      </button>
    </ModalShell>
  );
}
