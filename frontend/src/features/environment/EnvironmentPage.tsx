import { EnvironmentPanel } from "@/components/panels";
import { Icon, Sparkline } from "@/components/ui";
import { getEnvironmentOption } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import { TelemetrySourceControl } from "@/components/telemetry/TelemetrySourceControl";

/** Página de entorno: hábitat, radiación y soporte vital. */
export function EnvironmentPage() {
  const { environment, dataSource, rr1RadData } = useMissionData();
  const { openModal } = useUi();
  const option = getEnvironmentOption(environment);

  const isRr1 = dataSource === "rr1";
  const lastRadDay = rr1RadData?.series[rr1RadData.series.length - 1];

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

      <TelemetrySourceControl />

      <EnvironmentPanel variant="full" />

      <div className="two-columns">
        {/* Panel de Radiación: rigurosa separación de mGy vs mSv */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Exposición a radiación</h3>
              <p>
                {isRr1
                  ? "Dosis absorbida · NASA RR-1 Dosimetría ISS"
                  : "Acumulada en hábitat · Dosis equivalente"}
              </p>
            </div>
            {isRr1 && <span className="astra-sim-badge">NASA RR-1 · ISS</span>}
          </div>

          <div className="radiation-number">
            {isRr1 ? (
              <>
                {lastRadDay?.acumulada_mgy ?? 7.96} <span>mGy</span>
              </>
            ) : (
              <>
                52.8 <span>mSv</span>
              </>
            )}
            <Sparkline color="#ae92d5" />
          </div>

          <div className="exposure-bars">
            {Array.from({ length: 28 }, (_, index) => (
              <span key={index} style={{ height: `${25 + ((index * 17) % 65)}%` }} />
            ))}
          </div>

          <p className="muted">
            {isRr1 ? "Día 01 (2014-09-21)" : "Día 101"}{" "}
            <span className="float-right">{isRr1 ? "Día 39 (2014-10-29)" : "Día 128"}</span>
          </p>

          <details className="astra-details">
            <summary>¿Por qué?</summary>
            <div className="astra-details-content">
              {isRr1 ? (
                <>
                  Datos del dosímetro en el experimento Rodent Research 1 (ISS). Registra dosis
                  absorbida en <strong>mGy</strong> (GCR + Anomalía del Atlántico Sur).{" "}
                  <em>No se debe convertir ni sumar con mSv (dosis equivalente).</em>
                </>
              ) : (
                <>
                  La radiación espacial proviene de rayos cósmicos galácticos (GCR) y eventos solares. Se
                  registra en mSv para evaluar el riesgo biológico acumulado en misiones prolongadas.
                </>
              )}
            </div>
          </details>
        </section>

        {/* Calidad ambiental */}
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
