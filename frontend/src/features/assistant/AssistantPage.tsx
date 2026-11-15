/**
 * AssistantPage.tsx — Página principal del asistente ASTRA.
 *
 * Manual de Identidad Visual: Brand Book ASTRA (propuesta 3).
 * Incluye: Orbe central reactivo, zona de subtítulos, semáforo conductual,
 * bloque independiente de avisos agudos, caja de texto,
 * fila de 9 atajos de bienestar, selector de idioma (ES/EN) y panel de modo demo.
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Icon } from "@/components/ui";
import { Orb } from "@/components/companion/Orb";
import { useSpeech } from "@/hooks/useSpeech";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { MOCK_DB } from "@/data/db";
import { selectCompanionData } from "@/data/companion/companionData";
import { evaluateBehavior, aplicarEscenario, type SemaphoreLevel } from "@/lib/companion/companionEngine";
import { CompanionSession, normalizarTexto } from "@/lib/companion/intentEngine";
import { FamilyCommsModal } from "./components/FamilyCommsModal";
import { QuickJournalModal, type MoodRating } from "./components/QuickJournalModal";
import { BreathingGuideModal } from "./components/BreathingGuideModal";
import {
  useCompanion,
  VOICE_PROFILES,
  type OrbState,
  type VoiceProfileId,
  type ScenarioId,
} from "@/store/CompanionContext";
import { useUi } from "@/store/UiContext";

export function AssistantPage() {
  const {
    language,
    setLanguage,
    activeAstronautId,
    setActiveAstronautId,
    scenario,
    setScenario,
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
    clockTime,
    missionDay,
    clockSpeed,
    setClockSpeed,
    saltarAlProximoAviso,
    activeNotification,
    handleReminderAction,
    recordatorios,
    pendingRemindersCount,
  } = useCompanion();

  const {
    voices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    speak,
    cancel,
    isSpeaking,
    isUnlocked,
    unlockVoice,
    speechState,
    lastSpeechEvent,
    lastSpeechError,
    voiceEnabled,
    setVoiceEnabled,
  } = useSpeech();

  const { openModal, navigate } = useUi();
  const [inputText, setInputText] = useState("");
  const [activeModal, setActiveModal] = useState<"family" | "journal" | "breathing" | null>(null);
  const sessionRef = useRef(new CompanionSession());

  // Estado de diagnóstico en vivo para depuración (?dev=1)
  const [lastDiagnostic, setLastDiagnostic] = useState<{
    rawText: string;
    normalizedText: string;
    language: "es" | "en";
    intent: string;
    confidence: number;
    threshold: number;
    source: "micrófono" | "teclado" | "atajo" | "inicio";
  }>({
    rawText: "(esperando primera consulta)",
    normalizedText: "-",
    language,
    intent: "ninguna",
    confidence: 0,
    threshold: 0.5,
    source: "inicio",
  });

  // Evaluación dinámica del semáforo conductual
  const rawData = useMemo(
    () => selectCompanionData(MOCK_DB, activeAstronautId),
    [activeAstronautId],
  );

  const activeData = useMemo(
    () => aplicarEscenario(rawData, scenario),
    [rawData, scenario],
  );

  const evaluation = useMemo(
    () => evaluateBehavior(activeData, language),
    [activeData, language],
  );

  // Reconocimiento de voz con push-to-talk
  const {
    isListening,
    transcript: micTranscript,
    interimTranscript: micInterim,
    error: micError,
    isSupported: isMicSupported,
    toggleListening,
  } = useSpeechRecognition({
    language,
    onFinalTranscript: (txt) => {
      unlockVoice();
      const resp = sessionRef.current.responder(txt, activeData, language);
      setLastDiagnostic({
        rawText: txt,
        normalizedText: normalizarTexto(txt),
        language,
        intent: resp.intent,
        confidence: resp.confidence ?? (resp.intent === "desconocido" ? 0 : 0.8),
        threshold: 0.5,
        source: "micrófono",
      });
      if (resp.esEmergencia || resp.accionSugerida === "open_emergency_modal") {
        openModal({ type: "emergency" });
      } else if (resp.accionSugerida === "open_journal") {
        setActiveModal("journal");
      }
      setSubtitles(resp.text);
      // Si el usuario habló por micrófono, responder SIEMPRE con voz
      speak(resp.speechText, { force: true });
    },
    onInterimTranscript: (interim) => {
      setSubtitles(`🎙️ "${interim}..."`);
    },
    onOrbStateChange: (st) => setOrbState(st),
    onCancelSpeech: cancel,
  });

  // Atajo de teclado: presionar 'm' o 'M' para alternar micrófono
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleListening]);

  // Anunciar de forma proactiva cuando salta un recordatorio
  const lastSpokenNotificationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeNotification && activeNotification.id !== lastSpokenNotificationIdRef.current) {
      lastSpokenNotificationIdRef.current = activeNotification.id;
      const titulo = activeNotification.titulo[language];
      const hora = activeNotification.hora_programada;
      const texto =
        language === "es"
          ? `${activeData.nombreTripulante}, son las ${hora}. Recordatorio de rutina: ${titulo}.`
          : `${activeData.nombreTripulante}, it is ${hora}. Routine reminder: ${titulo}.`;

      setSubtitles(`⏰ ${texto}`);
      speak(texto);
    }
  }, [activeNotification, language, activeData.nombreTripulante, speak, setSubtitles]);

  // Lista de tripulantes disponibles para el modo demo
  const CREW_OPTIONS = [
    { id: "01", name: "Elena Martínez", role: "Comandante" },
    { id: "02", name: "James Miller", role: "Ing. Vuelo" },
    { id: "03", name: "Yuki Tanaka", role: "Oficial Médico" },
    { id: "04", name: "Alex Chen", role: "Especialista" },
  ];

  // Escenarios de prueba interactiva
  const SCENARIO_OPTIONS: Array<{ id: ScenarioId; label: { es: string; en: string } }> = [
    { id: "normal", label: { es: "Normal (datos reales)", en: "Normal (real DB data)" } },
    { id: "sleep_low", label: { es: "Sueño bajo (Nivel 2)", en: "Low sleep (Level 2)" } },
    { id: "isolation", label: { es: "Aislamiento (Nivel 2-3)", en: "Isolation (Level 2-3)" } },
    { id: "burnout_critical", label: { es: "Fatiga crítica (Nivel 3)", en: "Critical burnout (Level 3)" } },
    { id: "solar_radiation", label: { es: "Radiación solar (Aviso agudo)", en: "Solar event (Acute alert)" } },
  ];

  // Colores por nivel de semáforo
  const LEVEL_COLORS: Record<SemaphoreLevel, { bg: string; border: string; text: string; badge: string }> = {
    0: { bg: "#ECFDF5", border: "#A7F3D0", text: "#065F46", badge: "#10B981" },
    1: { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", badge: "#F59E0B" },
    2: { bg: "#F5F3FF", border: "#DDD6FE", text: "#5B21B6", badge: "#8B5CF6" },
    3: { bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", badge: "#EF4444" },
  };

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
    unlockVoice();
    if (id === "familia") {
      setLastDiagnostic({
        rawText: "familia",
        normalizedText: "familia",
        language,
        intent: "familia",
        confidence: 1.0,
        threshold: 0.5,
        source: "atajo",
      });
      setActiveModal("family");
      return;
    }
    if (id === "bitacora") {
      setLastDiagnostic({
        rawText: "bitacora",
        normalizedText: "bitacora",
        language,
        intent: "bitacora",
        confidence: 1.0,
        threshold: 0.5,
        source: "atajo",
      });
      setActiveModal("journal");
      return;
    }
    if (id === "soledad") {
      setLastDiagnostic({
        rawText: "soledad",
        normalizedText: "soledad",
        language,
        intent: "soledad",
        confidence: 1.0,
        threshold: 0.5,
        source: "atajo",
      });
      setActiveModal("breathing");
      return;
    }

    const resp = sessionRef.current.responder(id, activeData, language);
    setLastDiagnostic({
      rawText: id,
      normalizedText: normalizarTexto(id),
      language,
      intent: resp.intent,
      confidence: resp.confidence ?? 1.0,
      threshold: 0.5,
      source: "atajo",
    });

    if (resp.esEmergencia || resp.accionSugerida === "open_emergency_modal" || id === "emergencia") {
      openModal({ type: "emergency" });
    } else if (resp.accionSugerida === "open_journal") {
      setActiveModal("journal");
    } else if (resp.accionSugerida === "iniciar_respiracion") {
      setActiveModal("breathing");
    } else if (resp.accionSugerida === "abrir_familia") {
      setActiveModal("family");
    }
    setSubtitles(resp.text);
    speak(resp.speechText);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    unlockVoice();

    const resp = sessionRef.current.responder(inputText, activeData, language);
    setLastDiagnostic({
      rawText: inputText,
      normalizedText: normalizarTexto(inputText),
      language,
      intent: resp.intent,
      confidence: resp.confidence ?? (resp.intent === "desconocido" ? 0 : 0.8),
      threshold: 0.5,
      source: "teclado",
    });

    if (resp.esEmergencia || resp.accionSugerida === "open_emergency_modal") {
      openModal({ type: "emergency" });
    } else if (resp.accionSugerida === "open_journal") {
      setActiveModal("journal");
    } else if (resp.accionSugerida === "iniciar_respiracion") {
      setActiveModal("breathing");
    } else if (resp.accionSugerida === "abrir_familia") {
      setActiveModal("family");
    }
    setSubtitles(resp.text);
    speak(resp.speechText);
    setInputText("");
  };

  const currentLevelStyle = LEVEL_COLORS[evaluation.nivel];

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

          {/* Astronauta activo */}
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#5A5668",
              background: "rgba(90, 86, 104, 0.08)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            👤 {activeData.nombreTripulante} ({activeData.entorno.nombre})
          </span>

          {/* Etiqueta SIMULADO si el escenario no es normal */}
          {scenario !== "normal" && (
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                fontWeight: 700,
                color: "#991B1B",
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                padding: "2px 8px",
                borderRadius: 999,
                letterSpacing: "0.08em",
              }}
            >
              SIMULADO
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Botón Probar Voz */}
          <button
            type="button"
            onClick={() => {
              unlockVoice();
              const testPhrase =
                language === "es"
                  ? "Hola, soy Astra, tu acompañante de misión."
                  : "Hello, I am Astra, your mission companion.";
              setSubtitles(testPhrase);
              speak(testPhrase, { force: true });
            }}
            style={{
              background: "#7C3AED",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "Instrument Sans, sans-serif",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
            title="Probar voz de Astra"
          >
            <span>🔊</span>
            <span>{language === "es" ? "Probar voz" : "Test voice"}</span>
          </button>

          {/* Indicador / Desbloqueo de voz */}
          <button
            type="button"
            onClick={unlockVoice}
            style={{
              background: isUnlocked ? "#ECFDF5" : "#FFFBEB",
              border: `1px solid ${isUnlocked ? "#A7F3D0" : "#FDE68A"}`,
              color: isUnlocked ? "#065F46" : "#92400E",
              borderRadius: 999,
              padding: "4px 12px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            title={
              isUnlocked
                ? "Voz desbloqueada y lista para hablar"
                : "Pulsa para desbloquear la salida de audio"
            }
          >
            <span>{isUnlocked ? "●" : "○"}</span>
            <span>
              {isUnlocked
                ? language === "es"
                  ? "Voz activada"
                  : "Voice active"
                : language === "es"
                ? "Pulsa para activar la voz"
                : "Click to enable voice"}
            </span>
          </button>

          {/* Interruptor Responder con voz */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#1E1035",
              background: "rgba(90, 86, 104, 0.08)",
              padding: "4px 10px",
              borderRadius: 999,
            }}
            title="Activar/desactivar locución de voz para respuestas de texto"
          >
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => {
                unlockVoice();
                setVoiceEnabled(e.target.checked);
              }}
              style={{ accentColor: "#7C3AED", cursor: "pointer" }}
            />
            <span>{language === "es" ? "Responder con voz" : "Voice reply"}</span>
          </label>

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

          {/* Botón para alternar panel dev / demo */}
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
            title="Modo demo / pruebas"
          >
            {isDevMode ? "MODO DEMO ✓" : "MODO DEMO"}
          </button>
        </div>
      </header>

      {/* Aviso si el navegador no tiene voces disponibles */}
      {voices.length === 0 && (
        <div
          style={{
            background: "#FFFBEB",
            border: "1px solid #FDE68A",
            color: "#92400E",
            padding: "8px 14px",
            borderRadius: 8,
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>⚠️</span>
          <span>
            {language === "es"
              ? "No se detectaron voces locales en este navegador. Las respuestas se mostrarán en texto."
              : "No speech synthesis voices detected in browser. Subtitles will remain visible."}
          </span>
        </div>
      )}

      {/* Reloj de Misión Simulado con Control de Velocidad */}
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(90, 86, 104, 0.2)",
          borderRadius: 12,
          padding: "10px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
        aria-label="Reloj de misión y control de velocidad"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>⏱️</span>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 12,
              fontWeight: 700,
              color: "#1E1035",
            }}
          >
            MET Día {missionDay} · {clockTime} UTC
          </span>
          {pendingRemindersCount > 0 && (
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9,
                background: "#EDE9FE",
                color: "#7C3AED",
                padding: "2px 8px",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {pendingRemindersCount} {language === "es" ? "avisos hoy" : "alerts today"}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              color: "#5A5668",
            }}
          >
            {language === "es" ? "Velocidad:" : "Speed:"}
          </span>
          {([1, 60, 600] as const).map((vel) => (
            <button
              key={vel}
              onClick={() => setClockSpeed(vel)}
              style={{
                background: clockSpeed === vel ? "#7C3AED" : "transparent",
                color: clockSpeed === vel ? "#FFFFFF" : "#1E1035",
                border: "1px solid #7C3AED",
                borderRadius: 6,
                padding: "2px 8px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {vel}x
            </button>
          ))}

          <button
            onClick={() => saltarAlProximoAviso()}
            style={{
              background: "#F5F3FF",
              color: "#7C3AED",
              border: "1px solid #C4B5FD",
              borderRadius: 6,
              padding: "2px 10px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            title="Avanzar reloj directamente al próximo recordatorio"
          >
            <span>⏭️</span>
            <span>{language === "es" ? "Próximo aviso" : "Next alert"}</span>
          </button>
        </div>
      </section>

      {/* Tarjeta de Notificación Activa de Recordatorio */}
      {activeNotification && (
        <section
          style={{
            background: "#EFF6FF",
            border: "1px solid #93C5FD",
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 4px 14px rgba(59, 130, 246, 0.15)",
          }}
          aria-label="Aviso de rutina activo"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⏰</span>
              <strong
                style={{
                  fontFamily: "Instrument Sans, sans-serif",
                  fontSize: 14,
                  color: "#1E3A8A",
                }}
              >
                {activeNotification.hora_programada} · {activeNotification.titulo[language]}
              </strong>
            </div>
            <p
              style={{
                margin: 0,
                paddingLeft: 24,
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                color: "#1E40AF",
              }}
            >
              {activeNotification.descripcion[language]}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => handleReminderAction(activeNotification.id, "hecho")}
              style={{
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✓ {language === "es" ? "Hecho" : "Done"}
            </button>
            <button
              onClick={() => handleReminderAction(activeNotification.id, "posponer")}
              style={{
                background: "#FFFFFF",
                color: "#1E40AF",
                border: "1px solid #93C5FD",
                borderRadius: 8,
                padding: "6px 12px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ⏱️ {language === "es" ? "Posponer 10 min" : "Snooze 10m"}
            </button>
            <button
              onClick={() => handleReminderAction(activeNotification.id, "omitir")}
              style={{
                background: "transparent",
                color: "#6B7280",
                border: "none",
                padding: "6px 8px",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              ✕ {language === "es" ? "Omitir" : "Dismiss"}
            </button>
          </div>
        </section>
      )}

      {/* CAPA SEPARADA: Avisos de Vitales y Entorno (Agudos) */}
      {evaluation.avisos_agudos.length > 0 && (
        <section
          style={{
            background: "#FEF2F2",
            border: "1px solid #F87171",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          aria-label="Avisos agudos de vitales y entorno"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🚨</span>
            <strong
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 11,
                color: "#991B1B",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {language === "es" ? "AVISOS DE VITALES Y ENTORNO" : "ACUTE VITALS & ENVIRONMENT ALERTS"}
            </strong>
          </div>
          {evaluation.avisos_agudos.map((a, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                fontFamily: "Instrument Sans, sans-serif",
                fontSize: 12,
                color: "#7F1D1D",
                paddingLeft: 24,
              }}
            >
              <strong>{a.titulo}</strong>
              <span>{a.detalle}</span>
            </div>
          ))}
        </section>
      )}

      {/* Escenario central del Orbe ASTRA */}
      <section
        style={{
          background: "#F5F3FF",
          border: "1px solid rgba(90, 86, 104, 0.25)",
          borderRadius: 14,
          padding: "32px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 280,
          position: "relative",
        }}
        aria-label="Orbe interactivo ASTRA"
      >
        <Orb
          size={190}
          energy={orbEnergy}
          state={orbState}
          voiceProfile={voiceProfile}
          level={evaluation.nivel}
        />

        <div style={{ marginTop: 20, textAlign: "center" }}>
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
          minHeight: 64,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <p
          style={{
            fontFamily: "Instrument Serif, serif",
            fontSize: 20,
            lineHeight: 1.35,
            color: "#1E1035",
            margin: 0,
          }}
        >
          {subtitles}
        </p>

        {/* Opciones interactivas contextuales para Soledad */}
        {lastDiagnostic.intent === "soledad" && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                setActiveModal("journal");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              📝 {language === "es" ? "Registrar bitácora" : "Log journal"}
            </button>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                setActiveModal("breathing");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              🫁 {language === "es" ? "Respiración guiada" : "Guided breathing"}
            </button>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                setActiveModal("family");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              📡 {language === "es" ? "Canal familiar" : "Family comms"}
            </button>
          </div>
        )}

        {/* Opciones interactivas contextuales para Desconocido (Fallback) */}
        {lastDiagnostic.intent === "desconocido" && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                handleShortcutClick("estado");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              📊 {language === "es" ? "Revisar mi estado" : "Check status"}
            </button>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                handleShortcutClick("ejercicio");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              🏃 {language === "es" ? "Planear ejercicio" : "Plan workout"}
            </button>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                handleShortcutClick("bitacora");
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              📝 {language === "es" ? "Registrar bitácora" : "Log journal"}
            </button>
          </div>
        )}

        {/* Opciones interactivas contextuales para Dolor */}
        {lastDiagnostic.intent === "dolor" && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 4 }}>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                openModal({ type: "emergency" });
              }}
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#991B1B",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              🚨 {language === "es" ? "Pecho / Falta de aire (Emergencia)" : "Chest / Short of breath (Emergency)"}
            </button>
            <button
              type="button"
              onClick={() => {
                unlockVoice();
                const r = sessionRef.current.responder("cabeza", activeData, language);
                setLastDiagnostic({
                  rawText: "cabeza",
                  normalizedText: "cabeza",
                  language,
                  intent: r.intent,
                  confidence: r.confidence ?? 0.9,
                  threshold: 0.5,
                  source: "teclado",
                });
                setSubtitles(r.text);
                speak(r.speechText);
              }}
              style={{
                background: "#F5F3FF",
                border: "1px solid #C4B5FD",
                color: "#7C3AED",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 11,
                fontFamily: "Instrument Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              🩺 {language === "es" ? "Cabeza / Espalda (Médico de vuelo)" : "Head / Back (Flight surgeon)"}
            </button>
          </div>
        )}
      </section>

      {/* SEMÁFORO CONDUCTUAL Y EVALUACIÓN DETERMINISTA */}
      <section
        style={{
          background: currentLevelStyle.bg,
          border: `1px solid ${currentLevelStyle.border}`,
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
        aria-label="Semáforo de salud y bienestar"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: currentLevelStyle.badge,
                display: "inline-block",
                boxShadow: `0 0 10px ${currentLevelStyle.badge}`,
              }}
            />
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 12,
                fontWeight: 700,
                color: currentLevelStyle.text,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {language === "es" ? `SEMÁFORO: NIVEL ${evaluation.nivel} · ${evaluation.etiqueta}` : `SEMAPHORE: LEVEL ${evaluation.nivel} · ${evaluation.etiqueta}`}
            </span>
          </div>

          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 10,
              background: "rgba(255, 255, 255, 0.8)",
              border: `1px solid ${currentLevelStyle.border}`,
              color: currentLevelStyle.text,
              padding: "3px 10px",
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {evaluation.escalado}
          </span>
        </div>

        {/* Recomendación "Qué hacer" */}
        <div style={{ fontFamily: "Instrument Sans, sans-serif", fontSize: 13, color: currentLevelStyle.text }}>
          <strong>{language === "es" ? "Acción sugerida: " : "Suggested action: "}</strong>
          <span>{evaluation.que_hacer}</span>
        </div>

        {/* Razones "Por qué" */}
        {evaluation.por_que.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 9.5,
                color: "#5A5668",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {language === "es" ? "MOTIVOS DE EVALUACIÓN:" : "EVALUATION DRIVERS:"}
            </span>
            <ul style={{ margin: 0, paddingLeft: 18, fontFamily: "Instrument Sans, sans-serif", fontSize: 12, color: "#1E1035" }}>
              {evaluation.por_que.map((razon, idx) => (
                <li key={idx}>{razon}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Desglose de variables */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 8,
            paddingTop: 8,
            borderTop: `1px dashed ${currentLevelStyle.border}`,
          }}
        >
          {Object.values(evaluation.variables).map((v) => (
            <div
              key={v.id}
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: 8,
                padding: "6px 10px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
              }}
            >
              <div style={{ color: "#5A5668" }}>{v.nombre}</div>
              <div style={{ fontWeight: 700, color: v.nivel > 0 ? LEVEL_COLORS[v.nivel].text : "#1E1035" }}>
                {v.valorTexto} {v.disponible ? `(N${v.nivel})` : ""}
              </div>
            </div>
          ))}
        </div>

        {evaluation.datos_parciales && (
          <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 9, color: "#5A5668" }}>
            ℹ️ {language === "es" ? "Datos parciales: eficiencia o vida social sin sensor directo en cabina." : "Partial data: social or efficiency metrics uninstrumented."}
          </span>
        )}
      </section>

      {/* Caja de Texto con Botón Enviar y Micrófono */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        <form
          onSubmit={handleSend}
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Botón de micrófono */}
          <button
            type="button"
            onClick={toggleListening}
            disabled={!isMicSupported}
            style={{
              background: isListening ? "#EF4444" : isMicSupported ? "#FFFFFF" : "#F3F4F6",
              color: isListening ? "#FFFFFF" : isMicSupported ? "#7C3AED" : "#9CA3AF",
              border: isListening ? "2px solid #DC2626" : "1px solid rgba(90, 86, 104, 0.3)",
              borderRadius: "50%",
              width: 44,
              height: 44,
              minWidth: 44,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: isMicSupported ? "pointer" : "not-allowed",
              boxShadow: isListening ? "0 0 14px rgba(239, 68, 68, 0.6)" : "none",
              transition: "all 0.2s ease",
            }}
            title={
              !isMicSupported
                ? language === "es"
                  ? "Micrófono no disponible, usa el teclado o los atajos. El reconocimiento suele requerir Chrome o Edge con internet."
                  : "Microphone not supported, use keyboard or shortcuts. Recognition typically requires Chrome or Edge with internet."
                : isListening
                ? language === "es"
                  ? "Escuchando... pulsa para enviar (o presiona M)"
                  : "Listening... click to send (or press M)"
                : language === "es"
                ? "Hablar a ASTRA (M o pulsar)"
                : "Speak to ASTRA (M or click)"
            }
          >
            <span style={{ fontSize: 18 }}>{isListening ? "🔴" : "🎙️"}</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              language === "es"
                ? "Habla o escribe a ASTRA (ej: ¿cuándo me toca comer? ¿cómo está mi salud?)..."
                : "Speak or type to ASTRA (e.g. When do I eat? How is my health?)..."
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
              height: 44,
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

        {/* Mensaje de fallback si el navegador no tiene soporte de voz */}
        {!isMicSupported && (
          <span
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              color: "#5A5668",
              paddingLeft: 8,
            }}
          >
            ℹ️{" "}
            {language === "es"
              ? "Micrófono no disponible, usa el teclado o los atajos. El reconocimiento suele requerir Chrome o Edge con internet."
              : "Microphone unavailable, use keyboard or shortcuts. Recognition typically requires Chrome or Edge with internet."}
          </span>
        )}
      </div>

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

      {/* Panel de pruebas / Modo Demo (visible si ?dev=1 o botón DEV activo) */}
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
          aria-label="Panel de depuración y modo demo"
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
            PANEL DE MODO DEMO Y PRUEBAS (?dev=1)
          </strong>

          {/* Selector de Astronauta */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                marginRight: 6,
                width: 100,
              }}
            >
              Astronauta:
            </span>
            {CREW_OPTIONS.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveAstronautId(c.id)}
                style={{
                  background: activeAstronautId === c.id ? "#7C3AED" : "#FFFFFF",
                  color: activeAstronautId === c.id ? "#fff" : "#1E1035",
                  border: "1px solid #7C3AED",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                }}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Selector de Escenario */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                marginRight: 6,
                width: 100,
              }}
            >
              Escenario:
            </span>
            {SCENARIO_OPTIONS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                style={{
                  background: scenario === sc.id ? "#1E1035" : "#FFFFFF",
                  color: scenario === sc.id ? "#fff" : "#1E1035",
                  border: "1px solid #1E1035",
                  borderRadius: 999,
                  padding: "3px 10px",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono, monospace",
                  cursor: "pointer",
                }}
              >
                {sc.label[language]}
              </button>
            ))}
          </div>

          {/* Deslizador de Energía */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <label
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                color: "#1E1035",
                width: 100,
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
                width: 100,
              }}
            >
              Estado Orbe:
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
                width: 100,
              }}
            >
              Perfil Voz:
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
                  width: 100,
                }}
              >
                Voz Sistema:
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

          {/* DIAGNÓSTICO EN VIVO PASO 1 (?dev=1) */}
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "#FFFFFF",
              borderRadius: 10,
              border: "1px solid #C4B5FD",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 10,
              fontFamily: "JetBrains Mono, monospace",
              color: "#1E1035",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 700, color: "#7C3AED" }}>
                🔍 DIAGNÓSTICO EN VIVO (INTÉRPRETE Y SPEECH SYNTHESIS)
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={unlockVoice}
                  style={{
                    background: isUnlocked ? "#ECFDF5" : "#FEF3C7",
                    border: `1px solid ${isUnlocked ? "#10B981" : "#F59E0B"}`,
                    color: isUnlocked ? "#065F46" : "#92400E",
                    borderRadius: 6,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontSize: 9,
                  }}
                >
                  {isUnlocked ? "✓ Voz Desbloqueada" : "⚡ Pulsa para Desbloquear Voz"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    unlockVoice();
                    speak(language === "es" ? "Hola, soy Astra" : "Hello, I am Astra");
                  }}
                  style={{
                    background: "#7C3AED",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontSize: 9,
                  }}
                >
                  🔊 Probar Voz
                </button>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 8,
                background: "#F9FAFB",
                padding: 8,
                borderRadius: 6,
              }}
            >
              <div>
                <strong>Flujo de Entrada / Intérprete:</strong>
                <div>• Texto crudo: <span style={{ color: "#7C3AED" }}>"{lastDiagnostic.rawText}"</span></div>
                <div>• Texto normalizado: <span style={{ color: "#5A5668" }}>"{lastDiagnostic.normalizedText}"</span></div>
                <div>• Idioma activo: <strong>{lastDiagnostic.language.toUpperCase()}</strong></div>
                <div>
                  • Intención elegida: <strong style={{ color: "#047857" }}>{lastDiagnostic.intent}</strong> (confianza: {lastDiagnostic.confidence.toFixed(2)} | umbral: {lastDiagnostic.threshold.toFixed(2)})
                </div>
                <div>• Origen del flujo: <span style={{ textTransform: "capitalize" }}>{lastDiagnostic.source}</span></div>
              </div>

              <div>
                <strong>Motor de Voz (SpeechSynthesis):</strong>
                <div>• Voces disponibles: <strong>{voices.length}</strong></div>
                <div>• Voz activa: <span>{voices.find((v) => v.voiceURI === selectedVoiceURI)?.name || "Voz del sistema"}</span></div>
                <div>• Perfil de voz: <strong>{VOICE_PROFILES[voiceProfile].name[language]}</strong></div>
                <div>
                  • Estado síntesis: speaking=<strong>{String(speechState.speaking)}</strong>, pending=<strong>{String(speechState.pending)}</strong>, paused=<strong>{String(speechState.paused)}</strong>
                </div>
                <div>• Desbloqueo audio: <strong>{isUnlocked ? "Desbloqueado" : "Bloqueado"}</strong></div>
                <div>• Último evento: <span style={{ color: "#2563EB" }}>{lastSpeechEvent}</span></div>
                <div>• Error onerror: <span style={{ color: lastSpeechError ? "#DC2626" : "#059669" }}>{lastSpeechError || "ninguno"}</span></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Modales Especializados del Asistente */}
      {activeModal === "family" && (
        <FamilyCommsModal
          entornoCodigo={activeData.entorno.codigo}
          nombreTripulante={activeData.nombreTripulante}
          language={language}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "journal" && (
        <QuickJournalModal
          tripulanteId={activeData.tripulanteId}
          language={language}
          onSave={(_animo, _nota, msgAgradecimiento) => {
            setSubtitles(msgAgradecimiento);
            speak(msgAgradecimiento);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "breathing" && (
        <BreathingGuideModal
          language={language}
          voiceEnabled={voiceEnabled}
          speak={speak}
          onFinish={(msgFinal) => {
            setSubtitles(msgFinal);
            speak(msgFinal);
          }}
          onClose={() => setActiveModal(null)}
        />
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
