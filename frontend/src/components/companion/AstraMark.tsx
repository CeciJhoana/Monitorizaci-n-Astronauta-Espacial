/**
 * AstraMark.tsx — Símbolo y logotipo oficial de ASTRA según el Manual de Identidad Visual (propuesta 3).
 *
 * Anillo de línea fina con 5 estrellas unidas; la mayor, arriba a la derecha, lleva un halo reactivo.
 * Colores y trazos idénticos al brand-book-astra-v3.html.
 */

interface AstraMarkProps {
  size?: number;
  variant?: "v-dark" | "v-light" | "v-accent" | "v-white";
  className?: string;
  showWordmark?: boolean;
}

export function AstraMark({
  size = 40,
  variant = "v-dark",
  className = "",
  showWordmark = false,
}: AstraMarkProps) {
  // Paletas según la variante del brand book
  const colors = {
    "v-dark": {
      line: "#C4B5FD",
      halo: "#C4B5FD",
      star: "#FFFFFF",
      word: "#FFFFFF",
    },
    "v-light": {
      line: "#7C3AED",
      halo: "#7C3AED",
      star: "#1E1035",
      word: "#1E1035",
    },
    "v-accent": {
      line: "#F5F3FF",
      halo: "#FFFFFF",
      star: "#FFFFFF",
      word: "#FFFFFF",
    },
    "v-white": {
      line: "#FFFFFF",
      halo: "#FFFFFF",
      star: "#FFFFFF",
      word: "#FFFFFF",
    },
  }[variant];

  if (showWordmark) {
    const width = size * 3.16; // ratio 190 / 60
    return (
      <svg
        viewBox="0 0 190 60"
        width={width}
        height={size}
        className={className}
        aria-label="ASTRA · Sistema de monitoreo de salud"
      >
        <circle cx="30" cy="30" r="27" fill="none" stroke={colors.line} strokeWidth="1.2" />
        <circle
          cx="44"
          cy="18"
          r="7.5"
          fill={colors.halo}
          opacity=".18"
          className="astra-constellation-halo"
        />
        <polyline
          points="14,42 23,28 33,36 44,18"
          fill="none"
          stroke={colors.line}
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx="14" cy="42" r="2.6" fill={colors.star} />
        <circle cx="23" cy="28" r="2.8" fill={colors.star} />
        <circle cx="33" cy="36" r="2.6" fill={colors.star} />
        <circle cx="44" cy="18" r="4" fill={colors.star} />
        <circle cx="52.1" cy="45.5" r="2.6" fill={colors.star} />
        <text
          x="74"
          y="44"
          fontFamily="'Instrument Serif', serif"
          fontSize="46"
          letterSpacing="1"
          fill={colors.word}
        >
          astra
        </text>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={className}
      aria-label="Símbolo ASTRA"
    >
      <circle cx="30" cy="30" r="27" fill="none" stroke={colors.line} strokeWidth="1.2" />
      <circle
        cx="44"
        cy="18"
        r="7.5"
        fill={colors.halo}
        opacity=".18"
        className="astra-constellation-halo"
      />
      <polyline
        points="14,42 23,28 33,36 44,18"
        fill="none"
        stroke={colors.line}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="14" cy="42" r="2.6" fill={colors.star} />
      <circle cx="23" cy="28" r="2.8" fill={colors.star} />
      <circle cx="33" cy="36" r="2.6" fill={colors.star} />
      <circle cx="44" cy="18" r="4" fill={colors.star} />
      <circle cx="52.1" cy="45.5" r="2.6" fill={colors.star} />
    </svg>
  );
}
