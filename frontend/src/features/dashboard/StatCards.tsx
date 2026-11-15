import { SHOW_EXTRAS } from "@/config/features";
import { Avatar, Icon, Sparkline } from "@/components/ui";
import { computeCrewMetrics } from "@/lib/metrics";
import { useMissionData } from "@/store/MissionDataContext";
import { useCompanion } from "@/store/CompanionContext";
import { useUi } from "@/store/UiContext";
import { selectCompanionData } from "@/data/companion/companionData";
import { evaluateBehavior, type SemaphoreLevel } from "@/lib/companion/companionEngine";
import { MOCK_DB } from "@/data/db";

/** Cinco tarjetas con los indicadores mandatorios del reto NASA + Semáforo ASTRA. */
export function StatCards() {
  const { crew } = useMissionData();
  const { activeAstronautId, language } = useCompanion();
  const { navigate } = useUi();
  const metrics = computeCrewMetrics(crew);
  const reference = crew.find((c) => c.id === activeAstronautId) ?? crew[0];

  // Evaluación en tiempo real del semáforo conductual ASTRA
  const companionData = selectCompanionData(MOCK_DB, activeAstronautId);
  const evaluation = evaluateBehavior(companionData, language);

  const levelClass = `level-${evaluation.nivel}`;
  const levelLabels: Record<SemaphoreLevel, string> = {
    0: language === "es" ? "Nivel 0 · Óptimo" : "Level 0 · Optimal",
    1: language === "es" ? "Nivel 1 · Fatiga leve" : "Level 1 · Mild fatigue",
    2: language === "es" ? "Nivel 2 · Estrés por aislamiento" : "Level 2 · Isolation stress",
    3: language === "es" ? "Nivel 3 · Crítico" : "Level 3 · Critical",
  };

  return (
    <div className="dashboard-vital-section">
      {/* Semáforo conductual del Asistente ASTRA */}
      <div className="astra-semaphore-banner">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span className={`astra-semaphore-pill ${levelClass}`}>
            <span className="status-dot" />
            {levelLabels[evaluation.nivel]}
          </span>
          <span style={{ fontSize: "13px", color: "var(--astra-plomo, #5A5668)" }}>
            {reference.name}: {evaluation.que_hacer}
          </span>
        </div>
        <button className="text-link" onClick={() => navigate("assistant")}>
          Hablar con ASTRA
          <Icon name="arrow" size={15} />
        </button>
      </div>

      {/* Los 5 indicadores oficiales del reto NASA Space Apps */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
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
              {metrics.averageHeartRate}
              <small>lpm</small>
            </strong>
            <Sparkline color="#cd8c9a" />
          </div>
          <div className="stat-bottom">
            <span className="positive">En rango habitual</span>
            <span>60–80 lpm</span>
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
            <Sparkline color="#78a898" variant={2} />
          </div>
          <div className="stat-bottom">
            <span className="positive">Nominal</span>
            <span>36.4–37.2 °C</span>
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
              {metrics.averageSleepHours}
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

      {/* Opcional bajo SHOW_EXTRAS: Tarjetas adicionales abstractas */}
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
