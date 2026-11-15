import { EnvironmentPanel } from "@/components/panels";
import { Icon, Sparkline } from "@/components/ui";
import { getEnvironmentOption } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

/** Página de entorno: hábitat, radiación acumulada y contexto ambiental. */
export function EnvironmentPage() {
  const { environment } = useMissionData();
  const { openModal } = useUi();
  const option = getEnvironmentOption(environment);

  return (
    <>
      <div className="environment-hero">
        <Icon name="planet" size={66} />
        <div>
          <span className="eyebrow">
            HÁBITAT {option.id === "orbital-station" ? "ARES–01" : option.label.toUpperCase()}
          </span>
          <h2>{option.label}</h2>
          <p>Telemetría de demostración · Módulo de habitación</p>
        </div>
        <button className="button secondary" onClick={() => openModal({ type: "settings" })}>
          Cambiar entorno
          <Icon name="settings" size={16} />
        </button>
      </div>

      <EnvironmentPanel variant="full" />

      <div className="two-columns">
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Exposición a radiación</h3>
              <p>Acumulada durante la misión · Datos simulados</p>
            </div>
          </div>
          <div className="radiation-number">
            52.8 <span>mSv</span>
            <Sparkline color="#ae92d5" />
          </div>
          <div className="exposure-bars">
            {Array.from({ length: 28 }, (_, index) => (
              <span key={index} style={{ height: `${25 + ((index * 17) % 65)}%` }} />
            ))}
          </div>
          <p className="muted">
            Día 101 <span className="float-right">Día 128</span>
          </p>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>La salud también depende del hábitat</h3>
            </div>
          </div>
          <div className="context-item">
            <Icon name="wind" />
            <div>
              <h4>Ventilación y calidad del aire</h4>
              <p>Relaciona cambios de CO₂ con dolor de cabeza, descanso y percepción de fatiga.</p>
            </div>
          </div>
          <div className="context-item">
            <Icon name="sun" />
            <div>
              <h4>Luz y ritmo circadiano</h4>
              <p>
                Ventana de luz de la tripulación: 06:30–08:00 UTC. Perfil adaptado al entorno
                seleccionado.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
