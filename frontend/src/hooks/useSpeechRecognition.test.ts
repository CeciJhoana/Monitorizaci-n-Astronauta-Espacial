import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  SpeechRecognitionController,
  type ISpeechRecognitionInstance,
} from "./useSpeechRecognition";

describe("SpeechRecognitionController (useSpeechRecognition)", () => {
  let activeInstance: MockSpeechRecognition;

  class MockSpeechRecognition implements ISpeechRecognitionInstance {
    continuous = false;
    interimResults = true;
    lang = "es-419";
    maxAlternatives = 1;
    start = vi.fn();
    stop = vi.fn();
    abort = vi.fn();
    onstart: (() => void) | null = null;
    onresult: ((ev: any) => void) | null = null;
    onerror: ((ev: any) => void) | null = null;
    onend: (() => void) | null = null;

    constructor() {
      activeInstance = this;
    }
  }

  it("detecta soporte cuando existe el constructor", () => {
    const controller = new SpeechRecognitionController(
      { onFinalTranscript: vi.fn() },
      MockSpeechRecognition,
    );
    expect(controller.isSupported()).toBe(true);
    expect(controller.getIsListening()).toBe(false);
  });

  it("inicia escucha, ejecuta onCancelSpeech y cambia el orbe a 'listening'", () => {
    const onCancelSpeech = vi.fn();
    const onListeningChange = vi.fn();
    const onOrbStateChange = vi.fn();

    const controller = new SpeechRecognitionController(
      {
        onCancelSpeech,
        onListeningChange,
        onOrbStateChange,
        onFinalTranscript: vi.fn(),
      },
      MockSpeechRecognition,
    );

    const iniciado = controller.startListening();
    expect(iniciado).toBe(true);
    expect(onCancelSpeech).toHaveBeenCalledTimes(1);
    expect(activeInstance.start).toHaveBeenCalledTimes(1);

    // Disparar onstart
    activeInstance.onstart?.();
    expect(onListeningChange).toHaveBeenCalledWith(true);
    expect(onOrbStateChange).toHaveBeenCalledWith("listening");
  });

  it("detiene la escucha y actualiza el estado", () => {
    const onListeningChange = vi.fn();

    const controller = new SpeechRecognitionController(
      {
        onListeningChange,
        onFinalTranscript: vi.fn(),
      },
      MockSpeechRecognition,
    );

    controller.startListening();
    activeInstance.onstart?.();

    controller.stopListening();
    expect(activeInstance.stop).toHaveBeenCalledTimes(1);
    expect(onListeningChange).toHaveBeenCalledWith(false);
  });

  it("procesa transcripción provisional e interactiva (interim)", () => {
    const onInterimTranscript = vi.fn();
    const onFinalTranscript = vi.fn();

    const controller = new SpeechRecognitionController(
      {
        onInterimTranscript,
        onFinalTranscript,
      },
      MockSpeechRecognition,
    );

    controller.startListening();

    // Evento interim
    activeInstance.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: "como estoy" }, isFinal: false, length: 1 }],
    });

    expect(onInterimTranscript).toHaveBeenCalledWith("como estoy");
    expect(onFinalTranscript).not.toHaveBeenCalled();

    // Evento final
    activeInstance.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: "como estoy de salud" }, isFinal: true, length: 1 }],
    });

    expect(onFinalTranscript).toHaveBeenCalledWith("como estoy de salud");
  });

  it("degrada limpiamente cuando no hay soporte de SpeechRecognition", () => {
    const onError = vi.fn();
    const controller = new SpeechRecognitionController(
      {
        onError,
        onFinalTranscript: vi.fn(),
      },
      null as any,
    );

    expect(controller.isSupported()).toBe(false);
    const iniciado = controller.startListening();
    expect(iniciado).toBe(false);
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("not supported"));
  });

  it("ajusta el idioma dinámicamente entre es-419 y en-US", () => {
    const controller = new SpeechRecognitionController(
      { onFinalTranscript: vi.fn() },
      MockSpeechRecognition,
    );

    controller.setLanguage("es");
    expect(activeInstance.lang).toBe("es-419");

    controller.setLanguage("en");
    expect(activeInstance.lang).toBe("en-US");
  });
});
