import { Icon } from "@/components/ui";
import { useUi } from "@/store/UiContext";
import { ModalShell } from "./ModalShell";

const EMERGENCY_STEPS = [
  {
    title: "Activa el procedimiento oficial",
    text: "Utiliza el protocolo de emergencia aprobado para tu misión y entorno.",
  },
  {
    title: "Avisa al equipo responsable",
    text: "Contacta al oficial médico o al responsable alterno designado si este no está disponible.",
  },
  {
    title: "Usa el canal de misión",
    text: "Notifica a control por el sistema autorizado, considerando la latencia del enlace con Tierra.",
  },
];

/** Modal de emergencia: orienta sin simular una canal de ayuda real. */
export function EmergencyModal() {
  const { closeModal } = useUi();

  return (
    <ModalShell ariaLabel="Asistencia urgente" onClose={closeModal}>
      <span className="emergency-symbol">
        <Icon name="shield" size={32} />
      </span>
      <h2>Ante una emergencia real</h2>
      <p className="modal-description">
        Este prototipo no puede evaluar ni tratar una emergencia médica.
      </p>
      {EMERGENCY_STEPS.map((step, index) => (
        <div className="emergency-step" key={step.title}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        </div>
      ))}
      <div className="profile-warning">
        <p>
          Órbita no está conectado a un canal de emergencia. No se ha enviado ninguna solicitud de
          ayuda.
        </p>
      </div>
      <button className="button secondary full-width" onClick={closeModal}>
        Entendido
      </button>
    </ModalShell>
  );
}
