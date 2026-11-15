/**
 * useSpeech.ts — Hook para síntesis de voz (SpeechSynthesis) con modulación de energía del Orbe.
 *
 * Cumple con T3 y Paso 4 (Robustez de Voz):
 * - Preferencia de voces locales (localService: true) filtradas por idioma activo.
 * - Auto-desbloqueo de audio persistido en localStorage (astra.voiceUnlocked).
 * - Parámetro forceVoice: si el usuario habló por micrófono, habla siempre aunque voiceEnabled esté apagado.
 * - Robustez Chromium:
 *   * Pausa breve (~50ms) tras cancel() antes de emitir un nuevo utterance.
 *   * Verificación periódica y llamada a resume() si speechSynthesis queda pausado.
 *   * Segmentación por oraciones si la locución es larga para evitar congelamiento de Chrome (>15s).
 * - Sincronización precisa con el estado del Orbe (speaking <-> idle).
 * - Modulación de energía reactiva por eventos `boundary` de palabra.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePersistentState } from "./usePersistentState";
import {
  useCompanion,
  VOICE_PROFILES,
  type CompanionLanguage,
} from "@/store/CompanionContext";

export function useSpeech() {
  const {
    language,
    voiceProfile,
    voiceEnabled,
    setVoiceEnabled,
    setOrbState,
    setOrbEnergy,
    setSubtitles,
  } = useCompanion();

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = usePersistentState<string>(
    "astra.selectedVoiceURI",
    "",
  );
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("astra.voiceUnlocked") === "true";
    }
    return false;
  });
  const [lastSpeechEvent, setLastSpeechEvent] = useState<string>("ninguno");
  const [lastSpeechError, setLastSpeechError] = useState<string | null>(null);

  const decayTimerRef = useRef<number | null>(null);
  const proceduralTimerRef = useRef<number | null>(null);
  const resumeTickerRef = useRef<number | null>(null);
  const speakTimeoutRef = useRef<number | null>(null);
  const hadBoundaryRef = useRef<boolean>(false);

  // 1. Cargar y ordenar voces según idioma (priorizando locales)
  const updateVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    const langPrefix = language === "es" ? "es" : "en";
    const langVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));

    // Priorizar voces locales del sistema sobre voces de red
    const sorted = [...langVoices].sort((a, b) => {
      if (a.localService && !b.localService) return -1;
      if (!a.localService && b.localService) return 1;
      return 0;
    });

    const finalVoices = sorted.length > 0 ? sorted : allVoices;
    setVoices(finalVoices);

    // Auto-seleccionar la mejor voz si la actual no coincide o no existe
    const hasCurrent = sorted.some((v) => v.voiceURI === selectedVoiceURI);
    if (!hasCurrent && sorted.length > 0) {
      setSelectedVoiceURI(sorted[0].voiceURI);
    }
  }, [language, selectedVoiceURI, setSelectedVoiceURI]);

  useEffect(() => {
    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [updateVoices]);

  // Cancelar habla actual y limpiar temporizadores
  const cancel = useCallback(() => {
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
    if (resumeTickerRef.current) clearInterval(resumeTickerRef.current);

    setIsSpeaking(false);
    setOrbState("idle");
    setOrbEnergy(0);
  }, [setOrbState, setOrbEnergy]);

  // Desbloqueo de audio explícito por interacción del usuario
  const unlockVoice = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        const dummy = new SpeechSynthesisUtterance("");
        dummy.volume = 0.01;
        window.speechSynthesis.speak(dummy);

        setIsUnlocked(true);
        setVoiceEnabled(true);
        localStorage.setItem("astra.voiceUnlocked", "true");
        localStorage.setItem("astra.voiceEnabled", "true");
      } catch (err) {
        console.warn("Error desbloqueando speech synthesis:", err);
      }
    }
  }, [setVoiceEnabled]);

  // Ejecutar locución con robustez para Chromium
  const speak = useCallback(
    (text: string, options?: { force?: boolean }) => {
      // Subtítulos siempre se proyectan de inmediato
      setSubtitles(text);

      const canSpeak = options?.force || voiceEnabled;
      if (!canSpeak || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // 1. Cancelar cualquier locución anterior
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
      window.speechSynthesis.cancel();
      if (decayTimerRef.current) clearInterval(decayTimerRef.current);
      if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
      if (resumeTickerRef.current) clearInterval(resumeTickerRef.current);

      // Reanudar si el motor de síntesis de Chromium quedó pausado
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Ticker para mantener despierto a Chromium durante locuciones largas
      resumeTickerRef.current = window.setInterval(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        }
      }, 4000);

      // 2. Pausa obligatoria de 50ms antes de speak() para evitar colisión de cola en Chrome
      speakTimeoutRef.current = window.setTimeout(() => {
        hadBoundaryRef.current = false;

        // Dividir texto largo en oraciones si supera 120 caracteres para mayor fluidez
        const oraciones =
          text.length > 120
            ? text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
            : [text];

        const profile = VOICE_PROFILES[voiceProfile] ?? VOICE_PROFILES.calma;
        const activeVoice =
          voices.find((v) => v.voiceURI === selectedVoiceURI) ||
          voices.find((v) => v.lang.toLowerCase().startsWith(language === "es" ? "es" : "en")) ||
          voices[0];

        const emitirOracion = (index: number) => {
          if (index >= oraciones.length) {
            if (decayTimerRef.current) clearInterval(decayTimerRef.current);
            if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
            if (resumeTickerRef.current) clearInterval(resumeTickerRef.current);
            setIsSpeaking(false);
            setLastSpeechEvent("end");
            setOrbState("idle");
            setOrbEnergy(0);
            return;
          }

          const utterance = new SpeechSynthesisUtterance(oraciones[index]);
          utterance.rate = profile.rate;
          utterance.pitch = profile.pitch;
          if (activeVoice) {
            utterance.voice = activeVoice;
          }

          utterance.onstart = () => {
            setIsSpeaking(true);
            setLastSpeechEvent("start");
            setOrbState("speaking");
            setOrbEnergy(0.4);

            // Modulación procedural de respaldo si no emite boundary
            let t = 0;
            if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
            proceduralTimerRef.current = window.setInterval(() => {
              if (!hadBoundaryRef.current) {
                t += 0.1;
                const proceduralEnergy = Math.sin(t * 10) * 0.25 + 0.35;
                setOrbEnergy(Math.min(1, Math.max(0.1, proceduralEnergy)));
              }
            }, 50);
          };

          utterance.onboundary = (event) => {
            hadBoundaryRef.current = true;
            setLastSpeechEvent("boundary");
            if (proceduralTimerRef.current) {
              clearInterval(proceduralTimerRef.current);
            }

            const wordLength = event.charLength || 5;
            const peakEnergy = Math.min(1.0, 0.35 + (wordLength / 10) * 0.55 * profile.orbAmplitude);
            setOrbEnergy(peakEnergy);

            if (decayTimerRef.current) clearInterval(decayTimerRef.current);
            let currentEnergy = peakEnergy;
            const stepMs = 20;
            const decayFactor = Math.exp(-stepMs / profile.decayMs);

            decayTimerRef.current = window.setInterval(() => {
              currentEnergy *= decayFactor;
              if (currentEnergy <= 0.08) {
                currentEnergy = 0.05;
                if (decayTimerRef.current) clearInterval(decayTimerRef.current);
              }
              setOrbEnergy(currentEnergy);
            }, stepMs);
          };

          utterance.onend = () => {
            setLastSpeechEvent("end");
            // Encadenar siguiente oración o finalizar
            emitirOracion(index + 1);
          };

          utterance.onerror = (ev: SpeechSynthesisErrorEvent) => {
            if (decayTimerRef.current) clearInterval(decayTimerRef.current);
            if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
            if (resumeTickerRef.current) clearInterval(resumeTickerRef.current);
            setIsSpeaking(false);
            setLastSpeechEvent("error");
            setLastSpeechError(ev.error || "error desconocido");
            setOrbState("idle");
            setOrbEnergy(0);
          };

          window.speechSynthesis.speak(utterance);
        };

        // Iniciar primera oración
        emitirOracion(0);
      }, 50);
    },
    [
      voiceEnabled,
      voiceProfile,
      voices,
      selectedVoiceURI,
      language,
      setSubtitles,
      setOrbState,
      setOrbEnergy,
    ],
  );

  const speechState = {
    speaking: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.speaking : false,
    pending: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.pending : false,
    paused: typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis.paused : false,
  };

  return {
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
  };
}
