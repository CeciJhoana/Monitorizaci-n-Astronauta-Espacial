import { useState } from "react";
import { Icon } from "@/components/ui";
import { getEnvironmentOption } from "@/config/mission";
import { MOCK_PROTOCOLS } from "@/data/mockData";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import type { ProtocolId } from "@/types";
import { ModalShell } from "./ModalShell";

interface ProtocolModalProps {
  protocolId: ProtocolId;
}

/** Modal con la lista de comprobación de un protocolo. */
export function ProtocolModal({ protocolId }: ProtocolModalProps) {
  const { environment } = useMissionData();
  const { closeModal } = useUi();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const protocol = MOCK_PROTOCOLS.find((candidate) => candidate.id === protocolId);
  if (!protocol) return null;

  const environmentLabel = getEnvironmentOption(environment).label;
  const isComplete = completedSteps.length === protocol.steps.length;

  function toggleStep(index: number) {
    setCompletedSteps((current) =>
      current.includes(index) ? current.filter((step) => step !== index) : [...current, index],
    );
  }

  return (
    <ModalShell ariaLabel={protocol.title} onClose={closeModal}>
      <span className="eyebrow">LISTA ORIENTATIVA · {environmentLabel.toUpperCase()}</span>
      <h2>{protocol.title}</h2>
      <p className="modal-description">
        Marca las comprobaciones realizadas. Lista de demostración, no un protocolo médico oficial.
      </p>
      <div className="checklist">
        {protocol.steps.map((step, index) => (
          <label key={step} className={completedSteps.includes(index) ? "complete" : ""}>
            <input
              type="checkbox"
              checked={completedSteps.includes(index)}
              onChange={() => toggleStep(index)}
            />
            <span>{step}</span>
          </label>
        ))}
      </div>
      <div className="checklist-progress">
        {completedSteps.length} de {protocol.steps.length} comprobaciones
      </div>
      <button className="button primary full-width" onClick={closeModal}>
        {isComplete ? "Finalizar revisión" : "Cerrar lista"}
        <Icon name="check" size={17} />
      </button>
    </ModalShell>
  );
}
