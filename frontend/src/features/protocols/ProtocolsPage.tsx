import { Icon } from "@/components/ui";
import { MOCK_PROTOCOLS } from "@/data/mockData";
import { useUi } from "@/store/UiContext";

/** Página de protocolos: procedimientos operativos para contingencias autónomas. */
export function ProtocolsPage() {
  const { openModal } = useUi();

  return (
    <>
      <div className="safety-banner">
        <Icon name="shield" size={30} />
        <div>
          <h3>Protocolos de contingencia médica</h3>
          <p>Guías estandarizadas para soporte autónomo sin enlace con Tierra.</p>
        </div>
        <button className="button danger" onClick={() => openModal({ type: "emergency" })}>
          Asistencia urgente
          <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="protocol-grid">
        {MOCK_PROTOCOLS.map((protocol) => (
          <button
            className="panel protocol-card"
            key={protocol.id}
            onClick={() => openModal({ type: "protocol", protocolId: protocol.id })}
          >
            <span className="stat-icon purple">
              <Icon name={protocol.icon} size={24} />
            </span>
            <span className="eyebrow">{protocol.tag}</span>
            <h3>{protocol.title}</h3>
            <p>{protocol.description}</p>
            <span className="text-link">
              Abrir protocolo
              <Icon name="arrow" size={17} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
