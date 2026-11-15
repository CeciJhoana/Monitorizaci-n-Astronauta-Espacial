import { useState } from "react";
import type { TrendSeries } from "@/types";

const VIEW_WIDTH = 690;
const VIEW_HEIGHT = 234;
const PLOT_LEFT = 45;
const PLOT_RIGHT = 650;
const PLOT_BOTTOM = 208;
const PLOT_TOP = 20;
const TICK_COUNT = 5;

interface TrendChartProps {
  series: TrendSeries;
}

/**
 * Gráfica de tendencia accesible y genérica: recibe la serie y dibuja
 * línea, banda de rango habitual, cuadrícula y tooltips por punto.
 */
export function TrendChart({ series }: TrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { values, unit, min, max, normalRange, xLabels } = series;

  const toY = (value: number) =>
    PLOT_BOTTOM - ((value - min) / (max - min)) * (PLOT_BOTTOM - PLOT_TOP);
  const step = values.length > 1 ? (PLOT_RIGHT - PLOT_LEFT) / (values.length - 1) : 0;
  const points = values
    .map((value, index) => `${PLOT_LEFT + index * step},${toY(value)}`)
    .join(" ");
  const ticks = Array.from(
    { length: TICK_COUNT },
    (_, index) => max - ((max - min) / (TICK_COUNT - 1)) * index,
  );
  const labelStep = xLabels.length > 1 ? (PLOT_RIGHT - PLOT_LEFT) / (xLabels.length - 1) : 0;

  return (
    <div className="trend-chart">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        role="img"
        aria-label={`Tendencia simulada en ${unit} de ${xLabels[0]} a ${xLabels[xLabels.length - 1]}`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9070d7" stopOpacity=".18" />
            <stop offset="100%" stopColor="#9070d7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Banda de rango habitual */}
        <rect
          x={PLOT_LEFT}
          y={toY(normalRange[1])}
          width={PLOT_RIGHT - PLOT_LEFT}
          height={toY(normalRange[0]) - toY(normalRange[1])}
          fill="#f1f7f4"
          rx="3"
        />

        {/* Cuadrícula y etiquetas del eje Y */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PLOT_LEFT}
              x2={PLOT_RIGHT}
              y1={toY(tick)}
              y2={toY(tick)}
              stroke="#eaeaf0"
              strokeDasharray="3 5"
            />
            <text x="24" y={toY(tick) + 4} textAnchor="end" className="chart-label">
              {tick}
            </text>
          </g>
        ))}

        {/* Línea base individual (centro del rango habitual) */}
        <line
          x1={PLOT_LEFT}
          x2={PLOT_RIGHT}
          y1={toY((normalRange[0] + normalRange[1]) / 2)}
          y2={toY((normalRange[0] + normalRange[1]) / 2)}
          stroke="#9ebaaa"
          strokeDasharray="5 5"
        />

        {/* Serie */}
        <polygon
          points={`${PLOT_LEFT},${PLOT_BOTTOM} ${points} ${PLOT_RIGHT},${PLOT_BOTTOM}`}
          fill="url(#chart-fill)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#8a6bce"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Puntos interactivos */}
        {values.map((value, index) => {
          const cx = PLOT_LEFT + index * step;
          const cy = toY(value);
          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={hoveredIndex === index ? 6 : 3.4}
                fill="white"
                stroke="#8a6bce"
                strokeWidth="2"
              />
              <rect
                x={cx - step / 2}
                y="0"
                width={step}
                height={PLOT_BOTTOM + 4}
                fill="transparent"
              />
              {hoveredIndex === index && (
                <g>
                  <rect x={cx - 26} y="0" width="53" height="24" fill="#3c3354" rx="5" />
                  <text x={cx} y="16" fill="white" fontSize="10" textAnchor="middle">
                    {value} {unit}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Etiquetas del eje X */}
        {xLabels.map((label, index) => (
          <text
            key={label}
            x={PLOT_LEFT + index * labelStep}
            y={VIEW_HEIGHT - 3}
            className="chart-label"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}
