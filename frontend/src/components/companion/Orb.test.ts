/**
 * Orb.test.ts — Pruebas unitarias para perfiles y parámetros del orbe ASTRA.
 */

import { describe, expect, it } from "vitest";
import { VOICE_PROFILES } from "@/store/CompanionContext";

describe("Orbe ASTRA - Parámetros de animación y perfiles", () => {
  it("contiene los tres perfiles de voz definidos con ratios válidos", () => {
    expect(VOICE_PROFILES.calma).toBeDefined();
    expect(VOICE_PROFILES.clara).toBeDefined();
    expect(VOICE_PROFILES.energique).toBeDefined();

    expect(VOICE_PROFILES.calma.rate).toBeLessThan(VOICE_PROFILES.clara.rate);
    expect(VOICE_PROFILES.clara.rate).toBeLessThan(VOICE_PROFILES.energique.rate);

    expect(VOICE_PROFILES.calma.orbFrequency).toBeLessThan(VOICE_PROFILES.energique.orbFrequency);
  });

  it("garantiza decayMs positivo para amortiguación exponencial", () => {
    Object.values(VOICE_PROFILES).forEach((profile) => {
      expect(profile.decayMs).toBeGreaterThan(0);
      expect(profile.orbAmplitude).toBeGreaterThan(0);
    });
  });
});
