/**
 * BreathingGuideModal.tsx — Respiración guiada cuadrada (Box Breathing 4-4-4-4).
 *
 * Duración: 1 minuto (4 ciclos completos de 16 s = 64 s).
 * Fases:
 * 1. Inhala (4 s): el orbe se expande suavemente.
 * 2. Sostén (4 s): el orbe pulsa en su tamaño máximo.
 * 3. Exhala (4 s): el orbe se contrae suavemente.
 * 4. Pausa en vacío (4 s): el orbe queda en reposo.
 */

import { useState, useEffect, useRef } from "react";
import { Orb } from "@/components/companion/Orb";

export type BreathingPhase = "inhala" | "sosten" | "exhala" | "pausa";

export interface PhaseInfo {
  fase: BreathingPhase;
  segundos: number;
  label: { es: string; en: string };
  indicacion: { es: string; en: string };
  escalaOrbe: number;
  energia: number;
}

export const FASES_RESPIRACION: PhaseInfo[] = [
  {
    fase: "inhala",
    segundos: 4,
    label: { es: "Inhala profundamente", en: "Inhale deeply" },
    indicacion: { es: "Llena tus pulmones con calma...", en: "Fill your lungs calmly..." },
    escalaOrbe: 1.25,
    energia: 0.9,
  },
  {
    fase: "sosten",
    segundos: 4,
    label: { es: "Sostén el aire", en: "Hold breath" },
    indicacion: { es: "Mantén sin forzar la respiración...", en: "Hold without straining..." },
    escalaOrbe: 1.25,
    energia: 0.7,
  },
  {
    fase: "exhala",
    segundos: 4,
    label: { es: "Exhala suavemente", en: "Exhale gently" },
    indicacion: { es: "Libera todo el aire por la boca...", en: "Release all air through mouth..." },
    escalaOrbe: 0.8,
    energia: 0.4,
  },
  {
    fase: "pausa",
    segundos: 4,
    label: { es: "Pausa en vacío", en: "Rest empty" },
    indicacion: { es: "Permanece en calma antes de inhalar...", en: "Stay calm before inhaling..." },
    escalaOrbe: 0.8,
    energia: 0.1,
  },
];

interface BreathingGuideModalProps {
  language: "es" | "en";
  voiceEnabled: boolean;
  speak: (text: string) => void;
  onFinish: (mensajeFinal: string) => void;
  onClose: () => void;
}

export function BreathingGuideModal({
  language,
  voiceEnabled,
  speak,
  onFinish,
  onClose,
}: BreathingGuideModalProps) {
  const [cicloActual, setCicloActual] = useState(1);
  const TOTAL_CICLOS = 4;
  const [faseIndex, setFaseIndex] = useState(0);
  const [segundoEnFase, setSegundoEnFase] = useState(1);
  const [completado, setCompletado] = useState(false);

  const faseActual = FASES_RESPIRACION[faseIndex];

  useEffect(() => {
    if (completado) return;

    const timer = setInterval(() => {
      setSegundoEnFase((prevSeg) => {
        if (prevSeg >= faseActual.segundos) {
          // Pasar a la siguiente fase
          setFaseIndex((prevFase) => {
            const nextFase = prevFase + 1;
            if (nextFase >= FASES_RESPIRACION.length) {
              // Fin de un ciclo
              setCicloActual((prevCiclo: number) => {
                const nextCiclo = prevCiclo + 1;
                if (nextCiclo > TOTAL_CICLOS) {
                  setCompletado(true);
                  const msgFinal =
                    language === "es"
                      ? "Excelente. Has completado tu pausa de regulación autonómica."
                      : "Excellent. You have completed your autonomic regulation break.";
                  if (voiceEnabled) speak(msgFinal);
                  onFinish(msgFinal);
                  return prevCiclo;
                }
                return nextCiclo;
              });
              return 0; // Vuelve a inhalar
            }
            return nextFase;
          });
          return 1;
        }
        return prevSeg + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [faseActual.segundos, completado, language, voiceEnabled, speak, onFinish]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(30, 16, 53, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 20,
          maxWidth: 480,
          width: "100%",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
          boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        <header style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontFamily: "Instrument Serif, serif", fontSize: 22, color: "#1E1035" }}>
              {language === "es" ? "Respiración 4-4-4-4" : "Box Breathing 4-4-4-4"}
            </strong>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#7C3AED", display: "block" }}>
              {language === "es"
                ? `Ciclo ${cicloActual} de ${TOTAL_CICLOS} (60 s)`
                : `Cycle ${cicloActual} of ${TOTAL_CICLOS} (60 s)`}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#5A5668",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </header>

        {/* Orbe animado como guía visual de respiración */}
        <div
          style={{
            transform: `scale(${faseActual.escalaOrbe})`,
            transition: "transform 3.8s ease-in-out",
            padding: 20,
          }}
        >
          <Orb
            size={160}
            state="thinking"
            energy={faseActual.energia}
            level={0}
          />
        </div>

        {/* Textos de la fase actual */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <strong
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: 28,
              color: "#1E1035",
              fontWeight: 400,
            }}
          >
            {faseActual.label[language]}
          </strong>
          <span style={{ fontFamily: "Instrument Sans, sans-serif", fontSize: 13, color: "#5A5668" }}>
            {faseActual.indicacion[language]}
          </span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 16,
              fontWeight: 700,
              color: "#7C3AED",
              marginTop: 4,
            }}
          >
            {segundoEnFase} / {faseActual.segundos} s
          </span>
        </div>

        {/* Botón de cierre */}
        <button
          onClick={onClose}
          style={{
            background: completado ? "#7C3AED" : "transparent",
            color: completado ? "#FFFFFF" : "#5A5668",
            border: completado ? "none" : "1px solid rgba(90, 86, 104, 0.3)",
            borderRadius: 999,
            padding: "8px 24px",
            fontFamily: "Instrument Sans, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {completado
            ? language === "es"
              ? "Finalizar"
              : "Complete"
            : language === "es"
            ? "Salir de la pausa"
            : "Exit session"}
        </button>
      </div>
    </div>
  );
}
