import { useState } from "react";
import { Avatar, Badge, EmptyState, Icon, Panel, PanelTitle } from "@/components/ui";
import { useMissionData } from "@/store/MissionDataContext";
import { useUi } from "@/store/UiContext";

interface CrewPanelProps {
  /** `full` muestra columnas extra y buscador; `compact` un enlace al panel. */
  variant?: "compact" | "full";
}

/** Tabla de estado de la tripulación con sus signos vitales actuales. */
export function CrewPanel({ variant = "compact" }: CrewPanelProps) {
  const { crew } = useMissionData();
  const { navigate, openModal } = useUi();
  const [filter, setFilter] = useState("");
  const full = variant === "full";

  const visibleMembers = crew.filter((member) =>
    member.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <Panel className="crew-panel">
      <PanelTitle
        title={full ? "Estado de la tripulación" : "Tu tripulación"}
        subtitle={full ? "Líneas base personales · 4 tripulantes activos" : undefined}
      >
        {full ? (
          <input
            className="search-input"
            placeholder="Buscar tripulante..."
            aria-label="Buscar tripulante"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        ) : (
          <button className="text-link" onClick={() => navigate("crew")}>
            Ver tripulación
            <Icon name="arrow" size={15} />
          </button>
        )}
      </PanelTitle>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TRIPULANTE</th>
              <th>FREC. CARDÍACA</th>
              <th>SpO₂</th>
              {full && (
                <>
                  <th>TEMP.</th>
                  <th>SUEÑO</th>
                </>
              )}
              <th>ESTADO</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((member) => (
              <tr
                key={member.id}
                onClick={() => openModal({ type: "profile", crewMember: member })}
              >
                <td>
                  <div className="person-cell">
                    <Avatar member={member} />
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="table-value">{member.heartRate}</span>{" "}
                  <span className="unit">lpm</span>
                </td>
                <td>
                  <span className="table-value">{member.oxygenSaturation}</span>
                  <span className="unit"> %</span>
                </td>
                {full && (
                  <>
                    <td>{member.temperatureCelsius} °C</td>
                    <td>{member.sleepHours} h</td>
                  </>
                )}
                <td>
                  <Badge tone={member.requiresReview ? "amber" : "green"}>{member.status}</Badge>
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={`Ver a ${member.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      openModal({ type: "profile", crewMember: member });
                    }}
                  >
                    <Icon name="chevron" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {full && visibleMembers.length === 0 && (
        <EmptyState>No se encontraron tripulantes.</EmptyState>
      )}
    </Panel>
  );
}
