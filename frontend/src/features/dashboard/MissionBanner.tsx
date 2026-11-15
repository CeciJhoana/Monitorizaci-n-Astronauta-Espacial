import { Icon } from "@/components/ui";
import { MISSION, getEnvironmentOption } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";

/** Banner principal con el estado de la misión y el entorno activo. */
export function MissionBanner() {
  const { environment } = useMissionData();
  const option = getEnvironmentOption(environment);

  return (
    <section className="mission-banner">
      <div className="banner-grid" />
      <div className="banner-copy">
        <div className="banner-eyebrow">
          <span className="live-dot" />
          {MISSION.code} <span className="banner-divider" /> {MISSION.expedition}
        </div>
        <h2>
          Lejos de la Tierra.
          <br />
          Cerca de lo que importa.
        </h2>
        <div className="mission-facts">
          <div>
            <span>DÍA DE MISIÓN</span>
            <strong>
              {MISSION.day} <small>/ {MISSION.totalDays}</small>
            </strong>
          </div>
          <div>
            <span>TRIPULACIÓN</span>
            <strong>
              {String(MISSION.crewSize).padStart(2, "0")} <small>astronautas</small>
            </strong>
          </div>
          <div>
            <span>ENTORNO</span>
            <strong>{option.gravityLabel}</strong>
          </div>
        </div>
      </div>
      <div className="orbit-graphic">
        <div className="orbit-ring ring-one" />
        <div className="orbit-ring ring-two" />
        <span className="orbital-marker">
          <Icon name="plus" size={19} />
        </span>
        <div className="earth-coordinates">
          28° 36′ 12.4″ N
          <br />
          <span>ÓRBITA TERRESTRE · 408 KM</span>
        </div>
      </div>
      <div className="banner-status">
        <span className="live-dot" />
        SISTEMAS OPERATIVOS
      </div>
    </section>
  );
}
