import { SHOW_EXTRAS } from "@/config/features";
import { Avatar, Icon, Sparkline } from "@/components/ui";
import { computeCrewMetrics } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";
import { useCompanion } from "@/store/CompanionContext";
import { useUi } from "@/store/UiContext";
import { getCompanionDataForSource } from "@/data/telemetry/dataSources";
import { evaluateBehavior, type SemaphoreLevel } from "@/lib/companion/companionEngine";

/** Cinco tarjetas con los indicadores mandatorios del reto NASA + Semáforo ASTRA. */
export function StatCards() {
  const { crew, dataSource, esp32Readings, esp32Index } = useMissionData();
  const { activeAstronautId, language } = useCompanion();
  const { navigate } = useUi();
  const metrics = computeCrewMetrics(crew);
  const currentEsp32 = esp32Readings[esp32Index];

  // Referencia de la astronauta activa (Elena Vega)
  const reference =
    crew.find((c) => c.id === activeAstronautId || c.id === "01" || c.id === "tripulante-01") ??
    crew[0];

  // Evaluación en tiempo real del semáforo y avisos agudos según la fuente de datos activa
  const companionData = getCompanionDataForSource(activeAstronautId, dataSource, currentEsp32);
  const evaluation = evaluateBehavior(companionData, language);

  const levelClass = `level-${evaluation.nivel}`;
  const levelLabels: Record<SemaphoreLevel, string> = {
    0: language === "es" ? "Nivel 0 · Óptimo" : "Level 0 · Optimal",
    1: language === "es" ? "Nivel 1 · Fatiga leve" : "Level 1 · Mild fatigue",
    2: language === "es" ? "Nivel 2 · Estrés por aislamiento" : "Level 2 · Isolation stress",
    3: language === "es" ? "Nivel 3 · Crítico" : "Level 3 · Critical",
  };

  const isEsp32 = dataSource === "esp32";
  const isRr1 = dataSource === "rr1";
  const tieneAvisoAgudo = evaluation.avisos_agudos.length > 0;
  const avisoPrincipal = evaluation.avisos_agudos[0];

  return (
    <div className="dashboard-vital-section">
      {/* Banner de Semáforo o Aviso Agudo Prioritario */}
      {tieneAvisoAgudo ? (
        <div
          className="astra-semaphore-banner"
          style={{
            borderLeft: "4px solid #dc2626",
            background: "#fef2f2",
            borderColor: "rgba(220, 38, 38, 0.4)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span
              className="astra-semaphore-pill level-2"
              style={{
                background: "rgba(220, 38, 38, 0.15)",
                color: "#dc2626",
                borderColor: "rgba(220, 38, 38, 0.4)",
              }}
            >
              <span className="status-dot" style={{ background: "#dc2626" }} />
              AVISO AGUDO CRÍTICO
            </span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#991b1b" }}>
              {reference.name}: {avisoPrincipal.titulo} — {avisoPrincipal.detalle}
            </span>
          </div>
          <button
            className="button danger"
            style={{ padding: "4px 12px", fontSize: "11px", height: "auto" }}
            onClick={() => navigate("assistant")}
          >
            Hablar con ASTRA
            <Icon name="arrow" size={14} />
          </button>
        </div>
      ) : (
        <div className="astra-semaphore-banner">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span className={`astra-semaphore-pill ${levelClass}`}>
              <span className="status-dot" />
              {levelLabels[evaluation.nivel]}
            </span>
            <span style={{ fontSize: "13px", color: "var(--astra-plomo, #5A5668)" }}>
              {reference.name}: {evaluation.que_hacer}
            </span>
            {isRr1 && (
              <span className="astra-sim-badge" style={{ fontSize: "9px" }}>
                Contexto cabina ISS · Vitales en línea base
              </span>
            )}
          </div>
          <button className="text-link" onClick={() => navigate("assistant")}>
            Hablar con ASTRA
            <Icon name="arrow" size={15} />
          </button>
        </div>
      )}

      {/* Los 5 indicadores oficiales del reto NASA Space Apps */}
      <div
        className="stats-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        {/* 1. Presión arterial (Reto - Simulado) */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Presión arterial</span>
            <span className="stat-icon purple">
              <Icon name="heart" size={18} />
            </span>
          </div>
          <div className="stat-main">
            <strong>
              {reference.bloodPressure}
              <small>mmHg</small>
            </strong>
            <span className="astra-sim-badge">SIMULADO</span>
          </div>
          <div className="stat-bottom">
            <span className="positive">Línea base</span>
            <span>112–124 / 72–80</span>
          </div>
        </div>

        {/* 2. Frecuencia cardíaca (Reto - Sensor real / ESP32) */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Frecuencia cardíaca</span>
            <span className="stat-icon rose">
              <Icon name="pulse" size={18} />
            </span>
          </div>
          <div className="stat-main">
            <strong>
              {reference.heartRate}
              <small>lpm</small>
            </strong>
            {isEsp32 ? (
              <span className="astra-sim-badge">Captura ESP32</span>
            ) : (
              <Sparkline color="#cd8c9a" />
            )}
          </div>
          <div className="stat-bottom">
            {reference.heartRate >= 130 ? (
              <>
                <span className="status-dot" style={{ background: "#dc2626" }} />
                <span style={{ color: "#dc2626", fontWeight: 600 }}>Elevada (≥ 130)</span>
                <span style={{ marginLeft: "auto", fontSize: "11px", color: reference.oxygenSaturation < 95 ? "#dc2626" : "inherit" }}>
                  SpO₂: <strong>{reference.oxygenSaturation}%</strong>
                </span>
              </>
            ) : reference.heartRate >= 97 ? (
              <>
                <span className="status-dot" style={{ background: "#d97706" }} />
                <span style={{ color: "#d97706" }}>Esfuerzo físico</span>
                <span style={{ marginLeft: "auto", fontSize: "11px" }}>
                  SpO₂: <strong>{reference.oxygenSaturation}%</strong>
                </span>
              </>
            ) : (
              <>
                <span className="positive">En rango habitual</span>
                <span>60–80 lpm</span>
                <span style={{ marginLeft: "auto", fontSize: "11px" }}>
                  SpO₂: <strong>{reference.oxygenSaturation}%</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* 3. Glucosa (Reto - Simulado) */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Glucosa en ayunas</span>
            <span className="stat-icon sand">
              <Icon name="activity" size={18} />
            </span>
          </div>
          <div className="stat-main">
            <strong>
              85
              <small>mg/dL</small>
            </strong>
            <span className="astra-sim-badge">SIMULADO</span>
          </div>
          <div className="stat-bottom">
            <span className="positive">En ayunas</span>
            <span>70–99 mg/dL</span>
          </div>
        </div>

        {/* 4. Temperatura corporal (Reto - Sensor real / ESP32) */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Temperatura corporal</span>
            <span className="stat-icon green">
              <Icon name="temp" size={18} />
            </span>
          </div>
          <div className="stat-main">
            <strong>
              {reference.temperatureCelsius.toFixed(1)}
              <small>°C</small>
            </strong>
            {isEsp32 ? (
              <span className="astra-sim-badge">Captura ESP32</span>
            ) : (
              <Sparkline color="#78a898" variant={2} />
            )}
          </div>
          <div className="stat-bottom">
            {reference.temperatureCelsius >= 38.0 ? (
              <>
                <span className="status-dot" style={{ background: "#dc2626" }} />
                <span style={{ color: "#dc2626", fontWeight: 600 }}>Elevada (≥ 38.0 °C)</span>
              </>
            ) : (
              <>
                <span className="positive">Nominal</span>
                <span>36.4–37.2 °C</span>
              </>
            )}
          </div>
        </div>

        {/* 5. Horas de sueño (Reto - Hábitos) */}
        <div className="stat-card">
          <div className="stat-top">
            <span>Horas de sueño</span>
            <span className="stat-icon blue">
              <Icon name="moon" size={18} />
            </span>
          </div>
          <div className="stat-main">
            <strong>
              {reference.sleepHours}
              <small>h</small>
            </strong>
            <Sparkline color="#88a4c9" variant={1} />
          </div>
          <div className="stat-bottom">
            <span className="positive">Descanso registrado</span>
            <span>Línea base &ge; 7.5 h</span>
          </div>
        </div>
      </div>

      {/* Opcional bajo SHOW_EXTRAS */}
      {SHOW_EXTRAS && (
        <div className="stats-grid" style={{ marginTop: "14px" }}>
          <div className="stat-card">
            <div className="stat-top">
              <span>Salud global tripulación</span>
              <span className="stat-icon purple">
                <Icon name="heart" size={18} />
              </span>
            </div>
            <div className="stat-main">
              <strong>
                {metrics.averageWellnessScore}
                <small>/100</small>
              </strong>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-top">
              <span>Tripulantes en rango</span>
              <span className="stat-icon green">
                <Icon name="crew" size={18} />
              </span>
            </div>
            <div className="stat-main">
              <strong>
                {metrics.membersInRange}
                <small>/{crew.length}</small>
              </strong>
              <div className="tiny-avatars">
                {crew.map((member) => (
                  <Avatar key={member.id} member={member} small />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
