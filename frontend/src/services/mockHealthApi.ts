import type { JournalEntry, Measurement, MissionSnapshot } from "@/types";
import { MISSION } from "@/config/mission";
import { MOCK_SNAPSHOT } from "@/data/mockData";
import type { HealthApi, JournalEntryInput, MeasurementInput } from "./healthApi";

const SIMULATED_LATENCY_MS = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let measurementSequence = 0;
let journalSequence = 0;

/**
 * Implementación en memoria para el modo demostración (sin backend).
 * Respeta la misma interfaz que la implementación HTTP.
 */
export const mockHealthApi: HealthApi = {
  async getMissionSnapshot(): Promise<MissionSnapshot> {
    await delay(SIMULATED_LATENCY_MS);
    return MOCK_SNAPSHOT;
  },

  async createMeasurement(input: MeasurementInput): Promise<Measurement> {
    await delay(SIMULATED_LATENCY_MS);
    measurementSequence += 1;
    return {
      id: `measurement-${measurementSequence}`,
      ...input,
      recordedAt: new Date().toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
    };
  },

  async createJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
    await delay(SIMULATED_LATENCY_MS);
    journalSequence += 1;
    return {
      id: `journal-${journalSequence}`,
      missionDay: MISSION.day,
      ...input,
    };
  },
};
