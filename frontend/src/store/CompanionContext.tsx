/**
 * CompanionContext.tsx — Contexto global para el Asistente ASTRA.
 *
 * NASA Space Apps Cochabamba — Reto "Create Health Monitoring Software for Astronauts"
 *
 * Gobierna:
 * - Idioma (ES / EN)
 * - Astronauta atendido (Elena por defecto, conmutable a James, Yuki, Alex en demo)
 * - Escenario activo de prueba (Normal, Sueño bajo, Aislamiento, Fatiga crítica, Radiación)
 * - Estado del Orbe (idle, listening, speaking, thinking) y energía (0 a 1)
 * - Preferencias de voz y subtítulos
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePersistentState } from "@/hooks/usePersistentState";

export type CompanionLanguage = "es" | "en";
export type OrbState = "idle" | "listening" | "speaking" | "thinking";
export type VoiceProfileId = "calma" | "clara" | "energique";
export type ScenarioId =
  | "normal"
  | "sleep_low"
  | "isolation"
  | "burnout_critical"
  | "solar_radiation";

export interface VoiceProfileConfig {
  id: VoiceProfileId;
  name: { es: string; en: string };
  rate: number;
  pitch: number;
  orbFrequency: number;
  orbAmplitude: number;
  decayMs: number;
}

export const VOICE_PROFILES: Record<VoiceProfileId, VoiceProfileConfig> = {
  calma: {
    id: "calma",
    name: { es: "Calma", en: "Calm" },
    rate: 0.9,
    pitch: 0.95,
    orbFrequency: 1.2,
    orbAmplitude: 0.8,
    decayMs: 140,
  },
  clara: {
    id: "clara",
    name: { es: "Clara", en: "Clear" },
    rate: 1.0,
    pitch: 1.05,
    orbFrequency: 1.8,
    orbAmplitude: 1.0,
    decayMs: 120,
  },
  energique: {
    id: "energique",
    name: { es: "Enérgica", en: "Energetic" },
    rate: 1.15,
    pitch: 1.15,
    orbFrequency: 2.4,
    orbAmplitude: 1.2,
    decayMs: 90,
  },
};

interface CompanionContextValue {
  language: CompanionLanguage;
  setLanguage: (lang: CompanionLanguage) => void;
  activeAstronautId: string;
  setActiveAstronautId: (id: string) => void;
  scenario: ScenarioId;
  setScenario: (sc: ScenarioId) => void;
  orbState: OrbState;
  setOrbState: (state: OrbState) => void;
  orbEnergy: number;
  setOrbEnergy: (energy: number) => void;
  voiceProfile: VoiceProfileId;
  setVoiceProfile: (profile: VoiceProfileId) => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  subtitles: string;
  setSubtitles: (text: string) => void;
  isDevMode: boolean;
  setIsDevMode: (dev: boolean) => void;
}

const CompanionContext = createContext<CompanionContextValue | null>(null);

export function useCompanion(): CompanionContextValue {
  const context = useContext(CompanionContext);
  if (!context) {
    throw new Error("useCompanion debe usarse dentro de <CompanionProvider>.");
  }
  return context;
}

export function CompanionProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = usePersistentState<CompanionLanguage>("astra.lang", "es");
  const [activeAstronautId, setActiveAstronautId] = usePersistentState<string>(
    "astra.activeAstronaut",
    "tripulante-01",
  );
  const [scenario, setScenario] = useState<ScenarioId>("normal");
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [orbEnergy, setOrbEnergy] = useState<number>(0);
  const [voiceProfile, setVoiceProfile] = usePersistentState<VoiceProfileId>(
    "astra.voiceProfile",
    "calma",
  );
  const [voiceEnabled, setVoiceEnabled] = usePersistentState<boolean>("astra.voiceEnabled", false);
  const [subtitles, setSubtitles] = useState<string>(
    language === "es"
      ? "Hola. Soy ASTRA, tu acompañante de misión. ¿En qué te puedo ayudar hoy?"
      : "Hello. I am ASTRA, your mission companion. How can I assist you today?",
  );

  // Detección de ?dev=1 en URL
  const [isDevMode, setIsDevMode] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("dev") === "1";
    }
    return false;
  });

  const value = useMemo<CompanionContextValue>(
    () => ({
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
      voiceEnabled,
      setVoiceEnabled,
      subtitles,
      setSubtitles,
      isDevMode,
      setIsDevMode,
    }),
    [
      language,
      setLanguage,
      activeAstronautId,
      setActiveAstronautId,
      scenario,
      orbState,
      orbEnergy,
      voiceProfile,
      setVoiceProfile,
      voiceEnabled,
      setVoiceEnabled,
      subtitles,
      isDevMode,
    ],
  );

  return <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>;
}
