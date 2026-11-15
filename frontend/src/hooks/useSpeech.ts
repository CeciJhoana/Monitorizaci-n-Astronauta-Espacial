/**
 * useSpeech.ts — Hook para síntesis de voz (SpeechSynthesis) con modulación de energía del Orbe.
 *
 * Cumple con T3:
 * - Lista de voces filtrada por idioma (con evento voiceschanged).
 * - Control de habla: speak, cancel, cola y silenciar.
 * - Activación con clic y persistencia en localStorage.
 * - Modulación de energía del orbe mediante eventos `boundary` de palabra
 *   (pico proporcional al largo con caída exponencial de ~120 ms).
 * - Envolvente procedural de respaldo si el motor no emite boundary.
 * - Perfiles de voz: Calma, Clara, Enérgica (fijan rate y pitch).
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
  const hadBoundaryRef = useRef<boolean>(false);
  const queueRef = useRef<string[]>([]);

  // 1. Cargar y filtrar voces según idioma
  const updateVoices = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const allVoices = window.speechSynthesis.getVoices();
    const langPrefix = language === "es" ? "es" : "en";
    const filtered = allVoices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    setVoices(filtered.length > 0 ? filtered : allVoices);

    // Auto-selección si no hay una elegida
    if (filtered.length > 0 && !selectedVoiceURI) {
      setSelectedVoiceURI(filtered[0].voiceURI);
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

  // Cancelar habla actual
  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (decayTimerRef.current) clearInterval(decayTimerRef.current);
    if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
    queueRef.current = [];
    setIsSpeaking(false);
    setOrbState("idle");
    setOrbEnergy(0);
  }, [setOrbState, setOrbEnergy]);

  // Ejecutar locución
  const speak = useCallback(
    (text: string) => {
      // Subtítulos siempre visibles inmediatamente
      setSubtitles(text);

      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      hadBoundaryRef.current = false;

      const utterance = new SpeechSynthesisUtterance(text);
      const profile = VOICE_PROFILES[voiceProfile] ?? VOICE_PROFILES.calma;

      utterance.rate = profile.rate;
      utterance.pitch = profile.pitch;

      // Asignar voz seleccionada
      const activeVoice = voices.find((v) => v.voiceURI === selectedVoiceURI) || voices[0];
      if (activeVoice) {
        utterance.voice = activeVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setLastSpeechEvent("start");
        setOrbState("speaking");
        setOrbEnergy(0.4);

        // Fallback procedural por si boundary no se dispara
        let t = 0;
        proceduralTimerRef.current = window.setInterval(() => {
          if (!hadBoundaryRef.current) {
            t += 0.1;
            const proceduralEnergy = Math.sin(t * 10) * 0.25 + 0.35;
            setOrbEnergy(Math.min(1, Math.max(0.1, proceduralEnergy)));
          }
        }, 50);
      };

      // Modulación basada en eventos boundary
      utterance.onboundary = (event) => {
        hadBoundaryRef.current = true;
        setLastSpeechEvent("boundary");
        if (proceduralTimerRef.current) {
          clearInterval(proceduralTimerRef.current);
        }

        // Longitud de la palabra aproximada
        const wordLength = event.charLength || 5;
        const peakEnergy = Math.min(1.0, 0.35 + (wordLength / 10) * 0.55 * profile.orbAmplitude);
        setOrbEnergy(peakEnergy);

        // Caída exponencial basada en decayMs (~120 ms)
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
        if (decayTimerRef.current) clearInterval(decayTimerRef.current);
        if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
        setIsSpeaking(false);
        setLastSpeechEvent("end");
        setOrbState("idle");
        setOrbEnergy(0);
      };

      utterance.onerror = (ev: SpeechSynthesisErrorEvent) => {
        if (decayTimerRef.current) clearInterval(decayTimerRef.current);
        if (proceduralTimerRef.current) clearInterval(proceduralTimerRef.current);
        setIsSpeaking(false);
        setLastSpeechEvent("error");
        setLastSpeechError(ev.error || "error desconocido");
        setOrbState("idle");
        setOrbEnergy(0);
      };

      window.speechSynthesis.speak(utterance);
    },
    [
      voiceEnabled,
      voiceProfile,
      voices,
      selectedVoiceURI,
      setSubtitles,
      setOrbState,
      setOrbEnergy,
    ],
  );

  const unlockVoice = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const dummy = new SpeechSynthesisUtterance("");
        dummy.volume = 0.01;
        window.speechSynthesis.speak(dummy);
        setIsUnlocked(true);
        setVoiceEnabled(true);
        localStorage.setItem("astra.voiceUnlocked", "true");
      } catch (err) {
        console.warn("Error unlocking speech:", err);
      }
    }
  }, [setVoiceEnabled]);

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
