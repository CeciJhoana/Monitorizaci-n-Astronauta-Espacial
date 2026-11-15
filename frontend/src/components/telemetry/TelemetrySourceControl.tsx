/**
 * TelemetrySourceControl.tsx — Selector de Fuentes de Telemetría y Reproductor ESP32
 *
 * MODO DEMO:
 * - "Simulado ARES-01" (por defecto)
 * - "NASA RR-1 · ISS (histórico)"
 * - "Captura ESP32"
 */

import { Icon } from "@/components/ui";
import { useMissionData } from "@/store/MissionDataContext";
import { DATA_SOURCES_META, type DataSourceId } from "@/data/telemetry/dataSources";

export function TelemetrySourceControl() {
  const {
    dataSource,
    setDataSource,
    esp32Readings,
    esp32Index,
    setEsp32Index,
    isPlayingEsp32,
    setIsPlayingEsp32,
    playbackSpeed,
    setPlaybackSpeed,
  } = useMissionData();

  const currentMeta = DATA_SOURCES_META[dataSource];
  const currentReading = esp32Readings[esp32Index];

  return (
    <div className="panel" style={{ padding: "14px 18px", marginBottom: "16px", borderRadius: "14px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        {/* Selector de Fuentes de Datos */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 600, color: "var(--astra-plomo, #5A5668)" }}>
            MODO DEMO:
          </span>
          {(["simulado", "rr1", "esp32"] as DataSourceId[]).map((src) => {
            const meta = DATA_SOURCES_META[src];
            const isSelected = dataSource === src;
            return (
              <button
                key={src}
                className={`button ${isSelected ? "primary" : "secondary"}`}
                style={{
                  padding: "5px 12px",
                  fontSize: "11px",
                  borderRadius: "999px",
                  height: "auto",
                }}
                onClick={() => setDataSource(src)}
              >
                {meta.name}
              </button>
            );
          })}
        </div>

        {/* Píldora de Fuente Activa */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="astra-sim-badge">{currentMeta.sourceBadge}</span>
        </div>
      </div>

      {/* Nota de Honestidad */}
      <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--astra-plomo, #5A5668)", fontStyle: "italic" }}>
        {currentMeta.sourceNote}
      </div>

      {/* Controles de Reproducción de ESP32 (solo en modo esp32) */}
      {dataSource === "esp32" && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--astra-rule, rgba(90, 86, 104, 0.2))",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          {/* Botones de Reproducción */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              className="button secondary"
              style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
              onClick={() => setIsPlayingEsp32(!isPlayingEsp32)}
            >
              {isPlayingEsp32 ? "Pausar" : "Reproducir"}
            </button>
            <button
              className="button secondary"
              style={{ padding: "4px 10px", fontSize: "11px", height: "auto" }}
              onClick={() => {
                setIsPlayingEsp32(false);
                setEsp32Index(0);
              }}
            >
              Reiniciar
            </button>

            {/* Velocidad */}
            <span style={{ fontSize: "11px", marginLeft: "8px", color: "var(--astra-plomo, #5A5668)" }}>Velocidad:</span>
            {([1, 2, 5] as const).map((spd) => (
              <button
                key={spd}
                className={`button ${playbackSpeed === spd ? "primary" : "secondary"}`}
                style={{ padding: "3px 8px", fontSize: "10px", height: "auto", borderRadius: "4px" }}
                onClick={() => setPlaybackSpeed(spd)}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Información de la lectura actual */}
          {currentReading && (
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "var(--astra-cosmic, #1E1035)" }}>
              Lectura <strong>{esp32Index + 1}</strong>/50 · Hora: <strong>{currentReading.time}</strong>
              {currentReading.interval_seconds > 0 && ` (Δ ${currentReading.interval_seconds}s)`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
