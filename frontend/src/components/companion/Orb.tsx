/**
 * Orb.tsx — Orbe animado ASTRA con SVG y requestAnimationFrame.
 *
 * Manual de Identidad Visual: Brand Book ASTRA (propuesta 3).
 * Motivo: Carta estelar (anillo graduado con cinco estrellas unidas por una línea fina).
 * El orbe es esa marca viva. Sin librerías externas.
 *
 * Expresión según nivel del semáforo:
 * - Nivel 0: sereno (respiración suave y armónica).
 * - Nivel 1: atento (frecuencia ligeramente más ágil).
 * - Nivel 2: preocupado con cariño (halo más ancho y envolvente, ritmo pausado).
 * - Nivel 3: alerta (anillo exterior con pulso marcado).
 *
 * Respeta `prefers-reduced-motion`.
 */

import { useEffect, useRef } from "react";
import { VOICE_PROFILES, type OrbState, type VoiceProfileId } from "@/store/CompanionContext";

export interface OrbProps {
  energy?: number; // 0 a 1
  state?: OrbState;
  voiceProfile?: VoiceProfileId;
  level?: 0 | 1 | 2 | 3;
  size?: number;
  className?: string;
  onClick?: () => void;
}

export function Orb({
  energy = 0,
  state = "idle",
  voiceProfile = "calma",
  level = 0,
  size = 200,
  className = "",
  onClick,
}: OrbProps) {
  const containerRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeRef = useRef<number>(0);

  // Parámetros derivados del perfil de voz
  const profileConfig = VOICE_PROFILES[voiceProfile] ?? VOICE_PROFILES.calma;

  useEffect(() => {
    // Comprobar si el usuario prefiere movimiento reducido
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReducedMotion = mediaQuery.matches;

    let lastTimestamp = performance.now();

    const animate = (currentTimestamp: number) => {
      const delta = (currentTimestamp - lastTimestamp) / 1000;
      lastTimestamp = currentTimestamp;

      // Velocidad base según estado y nivel
      let speed = profileConfig.orbFrequency;
      if (level === 1) speed *= 1.25;
      if (level === 2) speed *= 0.75; // ritmo más pausado
      if (level === 3) speed *= 1.5;

      if (state === "thinking") speed *= 1.6;
      if (state === "speaking") speed *= 1.0 + energy * 1.2;

      if (!prefersReducedMotion) {
        timeRef.current += delta * speed;
      }

      const t = timeRef.current;
      const svg = containerRef.current;

      if (svg) {
        // 1. Halo de la estrella guía (cx: 44, cy: 18)
        const halo = svg.querySelector<SVGCircleElement>("#astra-orb-halo");
        if (halo) {
          let baseR = level === 2 ? 10.5 : 7.5;
          let pulse = Math.sin(t * 2) * (1.2 + energy * 3.5);
          if (level === 3) {
            pulse = Math.sin(t * 5) * 2.5;
          }
          halo.setAttribute("r", String(Math.max(4, baseR + pulse)));
          halo.setAttribute("opacity", String(0.15 + (level === 2 ? 0.08 : 0) + energy * 0.15));
        }

        // 2. Anillo exterior graduado (r: 27)
        const ring = svg.querySelector<SVGCircleElement>("#astra-orb-ring");
        if (ring) {
          if (level === 3) {
            const ringPulse = 27 + Math.sin(t * 4) * 1.5;
            ring.setAttribute("r", String(ringPulse));
            ring.setAttribute("stroke-width", "1.8");
            ring.setAttribute("stroke", "#e11d48"); // Alerta roja
          } else {
            ring.setAttribute("r", "27");
            ring.setAttribute("stroke-width", "1.2");
            ring.setAttribute(
              "stroke",
              level === 1 ? "#f59e0b" : level === 2 ? "#d97706" : "#C4B5FD",
            );
          }
        }

        // 3. Destellos de las 5 estrellas con energía
        const stars = svg.querySelectorAll<SVGCircleElement>(".astra-orb-star");
        stars.forEach((star, idx) => {
          const defaultR = parseFloat(star.getAttribute("data-base-r") || "2.6");
          const wave = Math.sin(t * 3 + idx * 1.2) * (0.3 + energy * 1.2);
          star.setAttribute("r", String(Math.max(1.8, defaultR + wave)));
        });

        // 4. Rotación sutil en estado 'thinking'
        const innerGroup = svg.querySelector<SVGGElement>("#astra-orb-constellation");
        if (innerGroup) {
          if (state === "thinking" && !prefersReducedMotion) {
            const rot = (t * 25) % 360;
            innerGroup.setAttribute("transform", `rotate(${rot} 30 30)`);
          } else {
            innerGroup.removeAttribute("transform");
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, level, energy, profileConfig]);

  // Colores de acento según nivel de semáforo
  const ringColor =
    level === 3 ? "#e11d48" : level === 2 ? "#d97706" : level === 1 ? "#f59e0b" : "#C4B5FD";

  const haloColor = level === 3 ? "#fda4af" : level === 2 ? "#fde68a" : "#C4B5FD";

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={`astra-orb ${className}`}
      onClick={onClick}
      style={{
        display: "block",
        margin: "0 auto",
        cursor: onClick ? "pointer" : "default",
        filter: "drop-shadow(0 0 1px rgba(124, 58, 237, 0.1))",
        overflow: "visible",
      }}
      role="img"
      aria-label={`Orbe ASTRA en estado ${state}, semáforo nivel ${level}`}
    >
      <defs>
        {/* Fondo sutil del orbe */}
        <radialGradient id="orb-bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.14" />
          <stop offset="70%" stopColor="#1E1035" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#1E1035" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo de fondo amplio */}
      <circle cx="30" cy="30" r="29" fill="url(#orb-bg-glow)" />

      {/* Anillo graduado de la Carta Estelar */}
      <circle
        id="astra-orb-ring"
        cx="30"
        cy="30"
        r="27"
        fill="none"
        stroke={ringColor}
        strokeWidth="1.2"
      />

      {/* Marcas de coordenadas del anillo (4 puntos cardinales) */}
      <g stroke={ringColor} strokeWidth="0.8" opacity="0.6">
        <line x1="30" y1="2" x2="30" y2="4.5" />
        <line x1="30" y1="55.5" x2="30" y2="58" />
        <line x1="2" y1="30" x2="4.5" y2="30" />
        <line x1="55.5" y1="30" x2="58" y2="30" />
      </g>

      {/* Grupo móvil de constelación */}
      <g id="astra-orb-constellation">
        {/* Halo de la estrella principal (Arriba a la derecha: 44, 18) */}
        <circle id="astra-orb-halo" cx="44" cy="18" r="7.5" fill={haloColor} opacity="0.15" />

        {/* Línea conectora fina de la constelación */}
        <polyline
          points="14,42 23,28 33,36 44,18"
          fill="none"
          stroke="#C4B5FD"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Las 5 Estrellas Guía de ASTRA */}
        <circle
          className="astra-orb-star"
          data-base-r="2.6"
          cx="14"
          cy="42"
          r="2.6"
          fill="#FFFFFF"
        />
        <circle
          className="astra-orb-star"
          data-base-r="2.8"
          cx="23"
          cy="28"
          r="2.8"
          fill="#FFFFFF"
        />
        <circle
          className="astra-orb-star"
          data-base-r="2.6"
          cx="33"
          cy="36"
          r="2.6"
          fill="#FFFFFF"
        />
        {/* Estrella mayor con halo */}
        <circle
          className="astra-orb-star"
          data-base-r="4.0"
          cx="44"
          cy="18"
          r="4.0"
          fill="#FFFFFF"
        />
        <circle
          className="astra-orb-star"
          data-base-r="2.6"
          cx="52.1"
          cy="45.5"
          r="2.6"
          fill="#FFFFFF"
        />
      </g>
    </svg>
  );
}
