/**
 * AssistantPage.tsx — Página principal del asistente ASTRA.
 *
 * Manual de Identidad Visual: Brand Book ASTRA (propuesta 3).
 * Incluye: Orbe central reactivo, zona de subtítulos, caja de texto,
 * fila de atajos (Estado, Ejercicio, Comer, Presión, Soledad, Familia, Dormir, Bitácora, Emergencia),
 * selector de idioma (ES/EN) y panel de pruebas dev (?dev=1).
 */

import { useState } from "react";
import { Icon } from "@/components/ui";
import { Orb } from "@/components/companion/Orb";
import { useSpeech } from "@/hooks/useSpeech";
import {
  useCompanion,
  VOICE_PROFILES,
  type OrbState,
  type VoiceProfileId,
} from "@/store/CompanionContext";
import { useUi } from "@/store/UiContext";

export function AssistantPage() {
  const {
    language,
    setLanguage,
    orbState,
    setOrbState,
    orbEnergy,
    setOrbEnergy,
    voiceProfile,
    setVoiceProfile,
    subtitles,
    setSubtitles,
    isDevMode,
    setIsDevMode,
  } = useCompanion();

  const {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speak,
    cancel,
    isSpeaking,
    voiceEnabled,
    setVoiceEnabled,
  } = useSpeech();

  const { openModal, navigate } = useUi();
  const [inputText, setInputText] = useState("");
  const [testLevel, setTestLevel] = useState<0 | 1 | 2 | 3>(0);

  // Lista de 9 atajos requeridos
  const SHORTCUTS = [
    { id: "estado", label: { es: "Estado", en: "Status" }, icon: "pulse" as const },
    { id: "ejercicio", label: { es: "Ejercicio", en: "Exercise" }, icon: "activity" as const },
    { id: "comer", label: { es: "Comer", en: "Nutrition" }, icon: "sun" as const },
    { id: "presion", label: { es: "Presión", en: "BP Check" }, icon: "heart" as const },
    { id: "soledad", label: { es: "Soledad", en: "Isolation" }, icon: "moon" as const },
    { id: "familia", label: { es: "Familia", en: "Family" }, icon: "radio" as const },
    { id: "dormir", label: { es: "Dormir", en: "Sleep" }, icon: "moon" as const },
    { id: "bitacora", label: { es: "Bitácora", en: "Journal" }, icon: "book" as const },
    { id: "emergencia", label: { es: "Emergencia", en: "Emergency" }, icon: "shield" as const },
  ];

  const handleShortcutClick = (id: string) => {
    switch (id) {
      case "emergencia":
        openModal({ type: "emergency" });
        speak(
          language === "es"
            ? "Protocolo de emergencia activado. Avisa de inmediato a la tripulación."
            : "Emergency protocol initiated. Alert the crew immediately.",
        );
        break;
      case "bitacora":
        navigate("journal");
        break;
      case "estado":
        speak(
          language === "es"
            ? "Evaluando signos y descanso... Todos los sistemas de acompañamiento en línea."
            : "Evaluating vitals and rest... All companion systems online.",
        );
        break;
      case "ejercicio":
        speak(
          language === "es"
            ? "Para mitigar la pérdida ósea y muscular, se recomienda la rutina ARED de 40 min."
            : "To mitigate bone and muscle deconditioning, 40 min ARED protocol is advised.",
        );
        break;
      case "comer":
        speak(
          language === "es"
            ? "Próxima colación en 45 min. Recuerda hidratarte con 250 ml de sales."
            : "Next nutrition window in 45 min. Remember to hydrate with 250 ml electrolytes.",
        );
        break;
      case "presion":
        speak(
          language === "es"
            ? "Coloca el manguito en el brazo izquierdo en reposo siguiendo el protocolo MED-01."
            : "Place the cuff on left arm at rest following protocol MED-01.",
        );
        break;
      case "soledad":
        speak(
          language === "es"
            ? "Estar lejos no significa estar solo. Tomemos 1 minuto de respiración 4-4-4-4."
            : "Distance does not mean being alone. Let us take 1 minute for 4-4-4-4 breathing.",
        );
        break;
      case "familia":
        speak(
          language === "es"
            ? "Calculando retardo de enlace según tu entorno... Canal familiar disponible."
            : "Calculating uplink delay for your habitat... Family channel ready.",
        );
        break;
      case "dormir":
        speak(
          language === "es"
            ? "Atenúa la iluminación de cabina 30 minutos antes del ciclo de descanso."
            : "Dim cabin illumination 30 minutes before your scheduled sleep cycle.",
        );
        break;
      default:
        break;
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    speak(
      language === "es"
        ? `Recibido: "${inputText}". Procesando intención...`
        : `Received: "${inputText}". Processing query...`,
    );
    setInputText("");
  };

  return (
    <div
      className="astra-assistant-view"
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: "16px 12px 64px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Barra superior de estado y controles */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(90, 86, 104, 0.2)",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "Instrument Serif, serif",
              fontSize: 28,
              color: "#1E1035",
              fontWeight: 400,
            }}
          >
            astra
          </span>
          <span
            style={{
              backgroundColor: "#F5F3FF",
              border: "1px solid #C4B5FD",
              color: "#7C3AED",
              borderRadius: 999,
              padding: "2px 10px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {language === "es" ? "Acompañante de Misión" : "Mission Companion"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Conmutador de voz */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            style={{
              background: voiceEnabled ? "#7C3AED" : "transparent",
              color: voiceEnabled ? "#FFFFFF" : "#5A5668",
              border: "1px solid #C4B5FD",
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              cursor: "pointer",
            }}
            title={voiceEnabled ? "Desactivar voz hablada" : "Activar voz hablada"}
          >
            {voiceEnabled ? "🔊 VOZ ACTIVA" : "🔇 VOZ MUTE"}
          </button>

          {/* Selector de idioma */}
          <button
            onClick={() => setLanguage(language === "es" ? "en" : "es")}
            style={{
              background: "#1E1035",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              cursor: "pointer",
            }}
            title="Cambiar idioma"
          >
            {language.toUpperCase()}
          </button>

          {/* Botón para alternar panel dev */}
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            style={{
              background: isDevMode ? "#5A5668" : "transparent",
              color: isDevMode ? "#fff" : "#5A5668",
              border: "1px dashed #5A5668",
              borderRadius: 999,
              padding: "4px 10px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              cursor: "pointer",
            }}
            title="Modo pruebas visuales"
          >
            DEV
          </button>
        </div>
      </header>

      {/* Escenario central del Orbe ASTRA */}
      <section
        style={{
          background: "#F5F3FF",
          border: "1px solid rgba(90, 86, 104, 0.25)",
          borderRadius: 14,
          padding: "36px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 300,
          position: "relative",
        }}
        aria-label="Orbe interactivo ASTRA"
      >
        <Orb
          size={190}
          energy={orbEnergy}
          state={orbState}
          voiceProfile={voiceProfile}
          level={testLevel}
        />

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#5A5668",
              display: "block",
              marginBottom: 4,
            }}
          >
            {orbState === "idle" && (language === "es" ? "EN REPOSO · ATENTO" : "IDLE · LISTENING")}
            {orbState === "listening" && (language === "es" ? "ESCÚCHANDO..." : "LISTENING...")}
            {orbState === "speaking" && (language === "es" ? "HABLANDO" : "SPEAKING")}
            {orbState === "thinking" && (language === "es" ? "PENSANDO..." : "THINKING...")}
          </span>
        </div>
      </section>

      {/* Zona de Subtítulos (Siempre visible) */}
      <section
        aria-live="polite"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(90, 86, 104, 0.2)",
          borderRadius: 14,
          padding: "16px 20px",
          textAlign: "center",
          minHeight: 70,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontFamily: "Instrument Serif, serif",
            fontSize: 21,
            lineHeight: 1.35,
            color: "#1E1035",
            margin: 0,
          }}
        >
          {subtitles}
        </p>
      </section>

      {/* Caja de Texto con Botón Enviar */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: 10,
          width: "100%",
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            language === "es"
              ? "Habla o escribe a ASTRA (ej: ¿cuándo me toca comer? ¿cómo está mi ánimo?)..."
              : "Speak or type to ASTRA (e.g. When do I eat? How is my rest?)..."
          }
          style={{
            flex: 1,
            background: "#FFFFFF",
            border: "1px solid rgba(90, 86, 104, 0.3)",
            borderRadius: 999,
            padding: "12px 20px",
            fontFamily: "Instrument Sans, sans-serif",
            fontSize: 13,
            color: "#1E1035",
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            background: "#7C3AED",
            color: "#FFFFFF",
            border: "none",
            borderRadius: 999,
            padding: "0 22px",
            fontFamily: "Instrument Sans, sans-serif",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>{language === "es" ? "Enviar" : "Send"}</span>
          <Icon name="arrow" size={15} />
        </button>
      </form>

      {/* Fila de Atajos (9 requeridos) */}
      <section aria-label="Atajos de consulta rápida">
        <span
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#5A5668",
            display: "block",
            marginBottom: 8,
          }}
        >
          {language === "es" ? "ATAJOS DE BIENESTAR Y RUTINA" : "WELLNESS & ROUTINE SHORTCUTS"}
        </span>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {SHORTCUTS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleShortcutClick(s.id)}
              style={{
                background: s.id === "emergencia" ? "#ffe4e6" : "#FFFFFF",
                border:
                  s.id === "emergencia"
                    ? "1px solid #fda4af"
                    : "1px solid rgba(90, 86, 104, 0.25)",
                color: s.id === "emergencia" ? "#9f1239" : "#1E1035",
                borderRadius: 999,
                padding: "8px 14px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                fontWeight: s.id === "emergencia" ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
            >
              <Icon name={s.icon} size={14} />
              <span>{s.label[language]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Panel de pruebas Dev (visible si ?dev=1 o botón DEV activo) */}
      {isDevMode && (
        <section
          style={{
            background: "#EDE9FE",
            border: "1px dashed #7C3AED",
            borderRadius: 14,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
          aria-label="Panel de depuración del orbe"
        >
          <strong
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#7C3AED",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            PANEL DE PRUEBAS · ORBE ANIMADO (?dev=1)
          </strong>

          {/* Deslizador de Energía */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                width: 120,
              }}
            >
              Energía: {Math.round(orbEnergy * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={orbEnergy}
              onChange={(e) => setOrbEnergy(parseFloat(e.target.value))}
              style={{ flex: 1 }}
            />
          </div>

          {/* Selector de Estado */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                marginRight: 6,
              }}
            >
              Estado:
            </span>
            {(["idle", "listening", "speaking", "thinking"] as OrbState[]).map((st) => (
              <button
                key={st}
                onClick={() => setOrbState(st)}
                style={{
                  background: orbState === st ? "#7C3AED" : "#FFFFFF",
                  color: orbState === st ? "#fff" : "#1E1035",
                  border: "1px solid #7C3AED",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Selector de Perfil de Voz */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                marginRight: 6,
              }}
            >
              Perfil:
            </span>
            {(["calma", "clara", "energique"] as VoiceProfileId[]).map((vp) => (
              <button
                key={vp}
                onClick={() => setVoiceProfile(vp)}
                style={{
                  background: voiceProfile === vp ? "#1E1035" : "#FFFFFF",
                  color: voiceProfile === vp ? "#fff" : "#1E1035",
                  border: "1px solid #1E1035",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                }}
              >
                {VOICE_PROFILES[vp].name[language]}
              </button>
            ))}
          </div>

          {/* Selector de Voz del Sistema */}
          {voices.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  color: "#1E1035",
                  width: 120,
                }}
              >
                Voz ({language.toUpperCase()}):
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                style={{
                  flex: 1,
                  padding: "4px 8px",
                  borderRadius: 8,
                  border: "1px solid #7C3AED",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: 10,
                  background: "#fff",
                }}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Selector de Nivel de Semáforo */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                marginRight: 6,
              }}
            >
              Semáforo:
            </span>
            {([0, 1, 2, 3] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setTestLevel(lvl)}
                style={{
                  background: testLevel === lvl ? "#7C3AED" : "#FFFFFF",
                  color: testLevel === lvl ? "#fff" : "#1E1035",
                  border: "1px solid #7C3AED",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                }}
              >
                Nivel {lvl}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Aviso de Prototipo Obligatorio */}
      <footer
        style={{
          borderTop: "1px solid rgba(90, 86, 104, 0.2)",
          paddingTop: 14,
          textAlign: "center",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 9,
          color: "#5A5668",
          lineHeight: 1.5,
        }}
      >
        ⚠️{" "}
        {language === "es"
          ? "Prototipo conceptual · No es un dispositivo médico · Por validar con fuentes oficiales de la NASA"
          : "Conceptual prototype · Not a medical device · To be validated with official NASA sources"}
      </footer>
    </div>
  );
}
