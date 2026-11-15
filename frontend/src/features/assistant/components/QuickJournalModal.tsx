/**
 * QuickJournalModal.tsx — Registro rápido en bitácora para el astronauta.
 *
 * Permite registrar estado de ánimo con 4 botones calibrados:
 * - Muy bien (+0.6)
 * - Bien (+0.35)
 * - Regular (+0.1)
 * - Con dificultad (-0.4)
 *
 * Persiste en localStorage (`orbita.journal`) y actualiza la entrada_bitacora
 * de la base en memoria para que el semáforo conductual lo refleje al instante.
 */

import { useState } from "react";
import { MOCK_DB } from "@/data/db";
import type { EntradaBitacoraRow } from "@/data/db/schema";

export type MoodRating = "Muy bien" | "Bien" | "Regular" | "Con dificultad";

export const MOOD_VALUES: Record<MoodRating, { valor: number; es: string; en: string; icon: string }> = {
  "Muy bien": { valor: 0.6, es: "Muy bien", en: "Great", icon: "✨" },
  "Bien": { valor: 0.35, es: "Bien", en: "Good", icon: "🙂" },
  "Regular": { valor: 0.1, es: "Regular", en: "Fair", icon: "😐" },
  "Con dificultad": { valor: -0.4, es: "Con dificultad", en: "Struggling", icon: "🌧️" },
};

interface QuickJournalModalProps {
  tripulanteId: string;
  language: "es" | "en";
  onSave: (animoTexto: MoodRating, nota: string, mensajeAgradecimiento: string) => void;
  onClose: () => void;
}

export function QuickJournalModal({
  tripulanteId,
  language,
  onSave,
  onClose,
}: QuickJournalModalProps) {
  const [selectedMood, setSelectedMood] = useState<MoodRating>("Bien");
  const [cuerpo, setCuerpo] = useState("");

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();

    const nuevaEntrada: EntradaBitacoraRow = {
      id: `bitacora-${Date.now()}`,
      mision_id: MOCK_DB.mision[0]?.id ?? "mision-ares-01",
      tripulante_id: tripulanteId,
      fecha: new Date().toISOString().slice(0, 10),
      estado_animo: selectedMood,
      cuerpo: cuerpo.trim() || (language === "es" ? "Registro diario de bienestar." : "Daily wellness check-in."),
      pregunta_id: null,
      es_privada: true,
      es_simulated: true,
      created_at: new Date().toISOString(),
    };

    // 1. Insertar al inicio de la tabla en memoria
    MOCK_DB.entrada_bitacora.unshift(nuevaEntrada);

    // 2. Persistir en localStorage bajo la clave orbita.journal
    if (typeof window !== "undefined") {
      try {
        const prev = JSON.parse(localStorage.getItem("orbita.journal") || "[]");
        prev.unshift(nuevaEntrada);
        localStorage.setItem("orbita.journal", JSON.stringify(prev));
      } catch {
        // noop
      }
    }

    // Frase de agradecimiento y validación emocional de ASTRA
    let mensaje = "";
    if (selectedMood === "Muy bien" || selectedMood === "Bien") {
      mensaje =
        language === "es"
          ? "Gracias por registrar tu día. Me alegra que te sientas con buena energía en la misión."
          : "Thank you for logging your day. Glad to hear you are feeling energized in the habitat.";
    } else {
      mensaje =
        language === "es"
          ? "Gracias por tu sinceridad. Anotar lo que sientes es clave para cuidar tu bienestar. Te acompañaré de cerca."
          : "Thank you for your honesty. Writing down your feelings is vital for mission wellness. I am here with you.";
    }

    onSave(selectedMood, cuerpo.trim(), mensaje);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(30, 16, 53, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 16,
          maxWidth: 500,
          width: "100%",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
        }}
      >
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontFamily: "Instrument Serif, serif", fontSize: 24, color: "#1E1035" }}>
              {language === "es" ? "Registro Rápido de Bitácora" : "Quick Journal Check-in"}
            </strong>
            <p style={{ margin: 0, fontFamily: "Instrument Sans, sans-serif", fontSize: 12, color: "#5A5668" }}>
              {language === "es"
                ? "¿Cómo te sientes en este momento de la misión?"
                : "How do you feel at this moment of the mission?"}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#5A5668",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleGuardar} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* 4 Botones de Estado de Ánimo */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {(Object.keys(MOOD_VALUES) as MoodRating[]).map((m) => {
              const info = MOOD_VALUES[m];
              const esActivo = selectedMood === m;
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: esActivo ? "2px solid #7C3AED" : "1px solid rgba(90, 86, 104, 0.25)",
                    background: esActivo ? "#F5F3FF" : "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 18 }}>{info.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "Instrument Sans, sans-serif", fontSize: 13, fontWeight: esActivo ? 700 : 500, color: "#1E1035" }}>
                      {info[language]}
                    </div>
                    <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#7C3AED" }}>
                      {info.valor > 0 ? `+${info.valor}` : info.valor}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Campo de notas libres */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5A5668" }}>
              {language === "es" ? "NOTAS DEL DÍA (OPCIONAL):" : "DAILY OBSERVATIONS (OPTIONAL):"}
            </label>
            <textarea
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              rows={3}
              placeholder={
                language === "es"
                  ? "Escribe aquí cualquier sensación, cansancio o logro..."
                  : "Record any sensations, fatigue, or milestones..."
              }
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(90, 86, 104, 0.3)",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12.5,
                outline: "none",
                resize: "none",
              }}
            />
          </div>

          {/* Botones de acción */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid rgba(90, 86, 104, 0.3)",
                borderRadius: 999,
                padding: "8px 16px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {language === "es" ? "Cancelar" : "Cancel"}
            </button>
            <button
              type="submit"
              style={{
                background: "#7C3AED",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 999,
                padding: "8px 20px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {language === "es" ? "Guardar en Bitácora" : "Save to Journal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
