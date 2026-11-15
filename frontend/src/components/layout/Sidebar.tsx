import { Avatar, Icon } from "@/components/ui";
import { MISSION, NAV_ITEMS } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";
import type { PageId } from "@/types";

const PAGE_ICONS: Record<PageId, Parameters<typeof Icon>[0]["name"]> = {
  dashboard: "grid",
  crew: "crew",
  vitals: "pulse",
  wellness: "heart",
  alerts: "bell",
  environment: "planet",
  protocols: "shield",
  journal: "book",
};

/** Barra lateral de navegación con identidad de misión. */
export function Sidebar() {
  const { page, navigate, openModal } = useUi();
  const { activeAlerts, crew } = useMissionData();
  const commander = crew[0];

  return (
    <aside className="sidebar">
      <a
        href="#"
        className="brand"
        onClick={(event) => {
          event.preventDefault();
          navigate("dashboard");
        }}
      >
        <span className="brand-symbol">
          <Icon name="planet" size={32} />
        </span>
        <span>
          órbita<span className="brand-period">.</span>
          <small>HUMAN HEALTH IN SPACE</small>
        </span>
      </a>

      <div className="mission-switch">
        <span className="mission-emblem">
          <Icon name="planet" size={23} />
        </span>
        <div>
          <strong>{MISSION.code}</strong>
          <span>{MISSION.name}</span>
        </div>
        <span className="live-dot" />
      </div>

      <div className="nav-caption">CONTROL DE SALUD</div>
      <nav>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            aria-label={item.label}
            aria-current={page === item.id ? "page" : undefined}
            title={item.label}
            onClick={() => navigate(item.id)}
            className={`nav-item ${page === item.id ? "active" : ""}`}
          >
            <Icon name={PAGE_ICONS[item.id]} size={19} />
            <span>{item.label}</span>
            {item.id === "alerts" && activeAlerts.length > 0 && (
              <span className="nav-count">{activeAlerts.length}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="local-card">
          <span className="local-icon">
            <Icon name="shield" size={19} />
          </span>
          <div>
            <strong>Contigo, incluso sin señal.</strong>
            <p>Procesamiento local activo</p>
          </div>
          <span className="status-dot" />
        </div>
        <button
          className="nav-item"
          aria-label="Configuración"
          title="Configuración"
          onClick={() => openModal({ type: "settings" })}
        >
          <Icon name="settings" size={19} />
          Configuración
        </button>
        <button className="nav-item" onClick={() => openModal({ type: "help" })}>
          <Icon name="help" size={19} />
          Centro de ayuda
          <Icon name="arrow" size={15} />
        </button>
        {commander && (
          <div className="sidebar-profile">
            <Avatar member={commander} small />
            <div>
              <strong>{commander.name}</strong>
              <span>
                {commander.role} · {MISSION.code}
              </span>
            </div>
            <button
              className="subtle-icon"
              aria-label={`Ver perfil de ${commander.name}`}
              onClick={() => openModal({ type: "profile", crewMember: commander })}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
