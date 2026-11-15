/**
 * MiniOrbLauncher.tsx — Lanzador flotante con mini orbe visible en las demás páginas.
 *
 * Permite acceder al asistente ASTRA desde cualquier pantalla de la misión.
 */

import { useCompanion } from "@/store/CompanionContext";
import { useUi } from "@/store/UiContext";
import { Orb } from "./Orb";

export function MiniOrbLauncher() {
  const { page, navigate } = useUi();
  const { orbState, orbEnergy, voiceProfile } = useCompanion();

  // No se muestra si ya estamos en la página del asistente
  if (page === "assistant") return null;

  return (
    <aside
      className="astra-mini-launcher-wrap"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 900,
      }}
      aria-label="Acceso al asistente ASTRA"
    >
      <button
        onClick={() => navigate("assistant")}
        className="astra-mini-launcher-btn"
        style={{
          background: "#1E1035",
          border: "1px solid #C4B5FD",
          borderRadius: 999,
          padding: "6px 14px 6px 8px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          boxShadow: "0 6px 20px rgba(30, 16, 53, 0.35)",
          color: "#FFFFFF",
          transition: "transform 0.2s ease, background 0.2s ease",
        }}
        title="Abrir Asistente ASTRA"
        aria-label="Abrir Asistente ASTRA"
      >
        <div style={{ width: 34, height: 34 }}>
          <Orb
            size={34}
            state={orbState}
            energy={orbEnergy}
            voiceProfile={voiceProfile}
            level={0}
          />
        </div>
        <div style={{ textAlign: "left" }}>
          <span
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: 18,
              lineHeight: 1,
              color: "#FFFFFF",
              display: "block",
            }}
          >
            astra
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 8,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#C4B5FD",
            }}
          >
            EN LÍNEA
          </span>
        </div>
      </button>
    </aside>
  );
}
