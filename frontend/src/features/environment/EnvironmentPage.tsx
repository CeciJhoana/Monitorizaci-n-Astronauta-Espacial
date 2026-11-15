import { EnvironmentPanel } from "@/components/panels";
import { Icon, Sparkline } from "@/components/ui";
import { getEnvironmentOption } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

/** Página de entorno: hábitat, radiación y soporte vital. */
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
          <p>Telemetría ambiental del módulo habitable</p>
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
              <p>Acumulada en hábitat · Dosis equivalente</p>
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
          <details className="astra-details">
            <summary>¿Por qué?</summary>
            <div className="astra-details-content">
              La radiación espacial proviene de rayos cósmicos galácticos (GCR) y eventos solares. Se
              registra en mSv para evaluar el riesgo biológico acumulado en misiones prolongadas.
            </div>
          </details>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Calidad ambiental del hábitat</h3>
            </div>
          </div>
          <div className="context-item">
            <Icon name="wind" />
            <div>
              <h4>Ventilación y CO₂</h4>
              <p>Tendencia de revisión, no umbral clínico validado.</p>
              <details className="astra-details">
                <summary>¿Por qué?</summary>
                <div className="astra-details-content">
                  En microgravedad el CO₂ tiende a acumularse en bolsas sin flujo forzado, lo que
                  puede provocar sensación de fatiga y cefaleas transitorias.
                </div>
              </details>
            </div>
          </div>
          <div className="context-item">
            <Icon name="sun" />
            <div>
              <h4>Ciclo de iluminación</h4>
              <p>Ventana circadiana adaptada al hábitat.</p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
