import { useState } from "react";
import { Avatar, Icon } from "@/components/ui";
import { MISSION, NAV_ITEMS } from "@/config/mission";
import { useUtcClock } from "@/hooks/useUtcClock";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

function pageLabel(pageId: string): string {
  return NAV_ITEMS.find((item) => item.id === pageId)?.label ?? pageId;
}

/** Cabecera con ruta actual, estado del enlace, reloj UTC y notificaciones. */
export function Topbar() {
  const { page, openModal } = useUi();
  const { activeAlerts, offline, crew } = useMissionData();
  const utcTime = useUtcClock();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const commander = crew[0];

  return (
    <>
      <header className="topbar">
        <div className="breadcrumb">
          Control de misión <Icon name="chevron" size={13} />
          <span>{pageLabel(page)}</span>
        </div>
        <div className="topbar-right">
          <span className="connection">
            <span className="status-dot" />
            {offline ? "Modo local" : "Enlace con Tierra estable"}
          </span>
          <span className="utc-time">
            {utcTime} <span>UTC</span>
          </span>
          <button
            className={`notification-button ${notificationsOpen ? "selected" : ""}`}
            aria-label="Notificaciones"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Icon name="bell" size={19} />
            {activeAlerts.length > 0 && <i />}
          </button>
          {commander && (
            <button
              className="profile-button"
              aria-label="Abrir perfil"
              onClick={() => openModal({ type: "profile", crewMember: commander })}
            >
              <Avatar member={commander} small />
            </button>
          )}
        </div>
      </header>

      {notificationsOpen && (
        <div className="notification-popover">
          <div className="panel-title">
            <div>
              <h3>Notificaciones</h3>
            </div>
            <button
              className="icon-button"
              aria-label="Cerrar notificaciones"
              onClick={() => setNotificationsOpen(false)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
          {activeAlerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => {
                openModal({ type: "alert-detail", alert });
                setNotificationsOpen(false);
              }}
            >
              <span className="status-dot" />
              <div>
                <strong>{alert.title}</strong>
                <small>
                  {alert.subject} · {alert.relativeTime}
                </small>
              </div>
            </button>
          ))}
          {!activeAlerts.length && <p>No hay notificaciones pendientes.</p>}
          <div className="notification-note">
            Datos de demostración · Día de misión {MISSION.day}
          </div>
        </div>
      )}
    </>
  );
}
