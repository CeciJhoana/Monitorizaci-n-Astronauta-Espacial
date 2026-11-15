import { useState } from "react";
import { Panel, PanelTitle, TrendChart } from "@/components/ui";
import { useMissionData } from "@/store/MissionDataContext";
import type { TrendMetric, TrendPeriod } from "@/types";

const METRIC_OPTIONS: { id: TrendMetric; label: string; unitLabel: string }[] = [
  { id: "heartRate", label: "Frecuencia cardíaca", unitLabel: "Promedio · lpm" },
  { id: "oxygenSaturation", label: "SpO₂", unitLabel: "Saturación · %" },
];

const PERIOD_OPTIONS: { id: TrendPeriod; label: string }[] = [
  { id: "24h", label: "24 horas" },
  { id: "7d", label: "7 días" },
];

/** Panel de tendencias de salud con selección de métrica y periodo. */
export function TrendPanel() {
  const { trends } = useMissionData();
  const [metric, setMetric] = useState<TrendMetric>("heartRate");
  const [period, setPeriod] = useState<TrendPeriod>("24h");

  const selectedMetric = METRIC_OPTIONS.find((option) => option.id === metric) ?? METRIC_OPTIONS[0];

  return (
    <Panel className="trend-panel">
      <PanelTitle
        title="Tendencias de salud"
        subtitle="Una visión continua del bienestar de la tripulación"
      >
        <select
          aria-label="Periodo de tendencias"
          value={period}
          onChange={(event) => setPeriod(event.target.value as TrendPeriod)}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </PanelTitle>
      <div className="chart-toolbar">
        <div className="chart-tabs">
          {METRIC_OPTIONS.map((option) => (
            <button
              key={option.id}
              className={metric === option.id ? "active" : ""}
              onClick={() => setMetric(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <span className="chart-unit">{selectedMetric.unitLabel}</span>
      </div>
      <TrendChart series={trends[metric][period]} />
      <div className="chart-legend">
        <span>
          <i className="legend-line purple-line" />
          Promedio de tripulación
        </span>
        <span>
          <i className="legend-line dashed" />
          Línea base individual
        </span>
        <span>
          <i className="legend-box" />
          Rango habitual
        </span>
      </div>
    </Panel>
  );
}
