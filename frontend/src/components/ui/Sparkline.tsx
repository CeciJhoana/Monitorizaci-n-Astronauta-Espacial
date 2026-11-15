const SPARKLINE_VARIANTS = [
  "0,32 8,30 13,34 20,23 27,26 34,12 41,21 48,18 55,25 62,15 70,18 77,6 84,10 92,7 100,11",
  "0,25 8,20 16,23 24,12 32,17 40,13 48,20 56,15 64,17 72,10 80,14 88,8 100,10",
  "0,14 8,19 16,12 24,21 32,17 40,28 48,21 56,26 64,19 72,27 80,23 88,30 100,25",
];

interface SparklineProps {
  color?: string;
  variant?: number;
}

/** Mini-gráfica decorativa. No representa datos reales. */
export function Sparkline({ color = "#8b72dc", variant = 0 }: SparklineProps) {
  return (
    <svg className="sparkline" viewBox="0 0 102 40" aria-hidden="true">
      <polyline
        points={SPARKLINE_VARIANTS[variant % SPARKLINE_VARIANTS.length]}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
