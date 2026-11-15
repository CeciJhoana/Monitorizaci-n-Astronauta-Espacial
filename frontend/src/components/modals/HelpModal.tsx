import { Icon } from "@/components/ui";
import { useUi } from "@/store/UiContext";
import { ModalShell } from "./ModalShell";

const HELP_ITEMS = [
  {
    icon: "pulse" as const,
    title: "Observa tendencias, no solo números",
    text: "Explora signos vitales y compáralos con la línea base simulada de cada tripulante.",
  },
  {
    icon: "bell" as const,
    title: "Comprende las señales",
    text: "Cada alerta explica su origen y una acción de revisión, sin emitir diagnósticos.",
  },
  {
    icon: "shield" as const,
    title: "Conoce los límites",
    text: "Todos los datos son simulados. No hay conexión a sensores, análisis clínico ni sincronización real con Tierra.",
  },
];

/** Modal de bienvenida y orientación general. */
export function HelpModal() {
  const { closeModal, navigate } = useUi();

  return (
    <ModalShell ariaLabel="Centro de ayuda" onClose={closeModal}>
      <span className="eyebrow">ORIENTACIÓN DE MISIÓN</span>
      <h2>Bienvenido a Órbita</h2>
      <p className="modal-description">
        Un prototipo de monitorización centrado en las necesidades de las tripulaciones espaciales,
        basado en la guía proporcionada para NASA Space Apps.
      </p>
      {HELP_ITEMS.map((item) => (
        <div className="context-item" key={item.title}>
          <Icon name={item.icon} />
          <div>
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </div>
        </div>
      ))}
      <button
        className="button primary full-width"
        onClick={() => {
          closeModal();
          navigate("protocols");
        }}
      >
        Explorar protocolos
        <Icon name="arrow" size={17} />
      </button>
    </ModalShell>
  );
}
