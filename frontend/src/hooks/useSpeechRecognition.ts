/**
 * useSpeechRecognition.ts — Reconocimiento de voz para ASTRA con Web Speech API.
 *
 * Incluye:
 * - SpeechRecognitionController: Controlador determinista de eventos de reconocimiento.
 * - useSpeechRecognition: Hook React para integración con componentes de UI.
 * - Soporte para push-to-talk, idiomas es-419 / en-US, feedback visual provisional y
 *   degradación elegante cuando el entorno no dispone de SpeechRecognition.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { CompanionLanguage, OrbState } from "@/store/CompanionContext";

export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: Array<{
    0: { transcript: string };
    isFinal?: boolean;
    length: number;
  }>;
}

export interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

export interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
  onend: (() => void) | null;
}

export interface SpeechRecognitionCallbacks {
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onOrbStateChange?: (state: OrbState) => void;
  onCancelSpeech?: () => void;
  onError?: (error: string) => void;
}

/**
 * Controlador de Reconocimiento de Voz:
 * Encapsula el ciclo de vida de Web Speech Recognition.
 */
export class SpeechRecognitionController {
  private recognition: ISpeechRecognitionInstance | null = null;
  private isListening: boolean = false;
  private language: CompanionLanguage = "es";
  private callbacks: SpeechRecognitionCallbacks;
  private isManuallyStopped: boolean = false;

  constructor(
    callbacks: SpeechRecognitionCallbacks,
    customRecognitionConstructor?: new () => ISpeechRecognitionInstance,
  ) {
    this.callbacks = callbacks;

    const RecognitionAPI =
      customRecognitionConstructor ||
      (typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null);

    if (RecognitionAPI) {
      try {
        const rec = new RecognitionAPI();
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        rec.lang = "es-419";

        rec.onstart = () => {
          this.isListening = true;
          this.callbacks.onListeningChange?.(true);
          this.callbacks.onOrbStateChange?.("listening");
        };

        rec.onresult = (event: SpeechRecognitionEventLike) => {
          let interino = "";
          let final = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const item = event.results[i];
            const texto = item[0]?.transcript || "";
            if (item.isFinal) {
              final += texto;
            } else {
              interino += texto;
            }
          }

          if (interino) {
            this.callbacks.onInterimTranscript?.(interino);
          }

          if (final.trim()) {
            const finalLimpio = final.trim();
            this.callbacks.onFinalTranscript(finalLimpio);
          }
        };

        rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
          if (event.error !== "no-speech" && event.error !== "aborted") {
            this.callbacks.onError?.(event.error);
          }
          this.isListening = false;
          this.callbacks.onListeningChange?.(false);
          this.callbacks.onOrbStateChange?.("idle");
        };

        rec.onend = () => {
          this.isListening = false;
          this.callbacks.onListeningChange?.(false);
          if (!this.isManuallyStopped) {
            this.callbacks.onOrbStateChange?.("idle");
          }
        };

        this.recognition = rec;
      } catch (e) {
        this.recognition = null;
      }
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setLanguage(lang: CompanionLanguage) {
    this.language = lang;
    if (this.recognition) {
      this.recognition.lang = lang === "es" ? "es-419" : "en-US";
    }
  }

  public startListening(): boolean {
    if (!this.recognition) {
      this.callbacks.onError?.("Speech recognition not supported in this browser");
      return false;
    }

    this.isManuallyStopped = false;
    this.callbacks.onCancelSpeech?.();

    try {
      this.recognition.start();
      return true;
    } catch {
      return false;
    }
  }

  public stopListening() {
    if (!this.recognition) return;
    this.isManuallyStopped = true;
    try {
      this.recognition.stop();
    } catch {
      // noop
    }
    this.isListening = false;
    this.callbacks.onListeningChange?.(false);
  }

  public abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // noop
      }
    }
    this.isListening = false;
  }
}

/* -------------------------------------------------------------------------- */
/* Hook de React                                                              */
/* -------------------------------------------------------------------------- */

export interface UseSpeechRecognitionOptions {
  language: CompanionLanguage;
  onFinalTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onOrbStateChange?: (state: OrbState) => void;
  onCancelSpeech?: () => void;
}

export function useSpeechRecognition({
  language,
  onFinalTranscript,
  onInterimTranscript,
  onListeningChange,
  onOrbStateChange,
  onCancelSpeech,
}: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    const ctrl = new SpeechRecognitionController({
      onFinalTranscript: (txt) => {
        setTranscript(txt);
        setInterimTranscript("");
        onFinalTranscript(txt);
      },
      onInterimTranscript: (txt) => {
        setInterimTranscript(txt);
        onInterimTranscript?.(txt);
      },
      onListeningChange: (listening) => {
        setIsListening(listening);
        onListeningChange?.(listening);
      },
      onOrbStateChange,
      onCancelSpeech,
      onError: (err) => setError(err),
    });

    ctrl.setLanguage(language);
    controllerRef.current = ctrl;

    return () => {
      ctrl.abort();
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setLanguage(language);
  }, [language]);

  const isSupported = controllerRef.current?.isSupported() ?? false;

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    controllerRef.current?.startListening();
  }, []);

  const stopListening = useCallback(() => {
    controllerRef.current?.stopListening();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
