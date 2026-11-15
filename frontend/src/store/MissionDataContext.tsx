import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_SNAPSHOT } from "@/data/mockData";
import { usePersistentState } from "@/hooks/usePersistentState";
import { healthApi, type JournalEntryInput, type MeasurementInput } from "@/services";
import type {
  CrewMember,
  EnvironmentId,
  EnvironmentReading,
  JournalEntry,
  Measurement,
  MissionAlert,
  TrendMetric,
  TrendPeriod,
  TrendSeries,
} from "@/types";
import { useToast } from "./ToastContext";

interface MissionDataValue {
  crew: CrewMember[];
  alerts: MissionAlert[];
  /** Alertas aún no revisadas en esta sesión. */
  activeAlerts: MissionAlert[];
  measurements: Measurement[];
  journal: JournalEntry[];
  environmentReadings: EnvironmentReading[];
  trends: Record<TrendMetric, Record<TrendPeriod, TrendSeries>>;
  environment: EnvironmentId;
  offline: boolean;
  isLoading: boolean;
  setEnvironment: (id: EnvironmentId) => void;
  setOffline: (offline: boolean) => void;
  addMeasurement: (input: MeasurementInput) => Promise<void>;
  addJournalEntry: (input: JournalEntryInput) => Promise<void>;
  acknowledgeAlert: (id: number) => void;
  restoreDemoAlerts: () => void;
}

const MissionDataContext = createContext<MissionDataValue | null>(null);

export function useMissionData(): MissionDataValue {
  const context = useContext(MissionDataContext);
  if (!context) throw new Error("useMissionData debe usarse dentro de <MissionDataProvider>.");
  return context;
}

/**
 * Datos de la misión: tripulación, alertas, mediciones y bitácora.
 *
 * Las lecturas iniciales pasan por `healthApi` (mock o HTTP según haya
 * backend configurado). Los registros de la sesión se persisten en
 * `localStorage` para que la app siga siendo útil sin conexión.
 */
export function MissionDataProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();

  const [snapshot, setSnapshot] = useState(MOCK_SNAPSHOT);
  const [isLoading, setIsLoading] = useState(true);
  const [measurements, setMeasurements] = usePersistentState<Measurement[]>(
    "orbita.measurements",
    [],
  );
  const [journal, setJournal] = usePersistentState<JournalEntry[]>("orbita.journal", []);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = usePersistentState<number[]>(
    "orbita.acknowledged-alerts",
    [],
  );
  const [environment, setEnvironmentState] = usePersistentState<EnvironmentId>(
    "orbita.environment",
    "orbital-station",
  );
  const [offline, setOfflineState] = usePersistentState<boolean>("orbita.offline", false);

  useEffect(() => {
    let cancelled = false;
    healthApi
      .getMissionSnapshot()
      .then((nextSnapshot) => {
        if (!cancelled) setSnapshot(nextSnapshot);
      })
      .catch(() => {
        if (!cancelled) notify("Sin enlace con la Tierra: mostrando datos locales.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notify]);

  const setEnvironment = useCallback(
    (id: EnvironmentId) => setEnvironmentState(id),
    [setEnvironmentState],
  );
  const setOffline = useCallback((value: boolean) => setOfflineState(value), [setOfflineState]);

  const addMeasurement = useCallback(
    async (input: MeasurementInput) => {
      try {
        const created = await healthApi.createMeasurement(input);
        setMeasurements((current) => [...current, created]);
      } catch {
        notify("No se pudo registrar la medición. Inténtalo de nuevo.");
      }
    },
    [notify, setMeasurements],
  );

  const addJournalEntry = useCallback(
    async (input: JournalEntryInput) => {
      try {
        const created = await healthApi.createJournalEntry(input);
        setJournal((current) => [created, ...current]);
      } catch {
        notify("No se pudo guardar la entrada. Inténtalo de nuevo.");
      }
    },
    [notify, setJournal],
  );

  const acknowledgeAlert = useCallback(
    (id: number) => setAcknowledgedAlertIds((current) => [...current, id]),
    [setAcknowledgedAlertIds],
  );

  const restoreDemoAlerts = useCallback(
    () => setAcknowledgedAlertIds([]),
    [setAcknowledgedAlertIds],
  );

  const value = useMemo<MissionDataValue>(
    () => ({
      crew: snapshot.crew,
      alerts: snapshot.alerts,
      activeAlerts: snapshot.alerts.filter((alert) => !acknowledgedAlertIds.includes(alert.id)),
      measurements,
      journal,
      environmentReadings: snapshot.environmentReadings,
      trends: snapshot.trends,
      environment,
      offline,
      isLoading,
      setEnvironment,
      setOffline,
      addMeasurement,
      addJournalEntry,
      acknowledgeAlert,
      restoreDemoAlerts,
    }),
    [
      snapshot,
      acknowledgedAlertIds,
      measurements,
      journal,
      environment,
      offline,
      isLoading,
      setEnvironment,
      setOffline,
      addMeasurement,
      addJournalEntry,
      acknowledgeAlert,
      restoreDemoAlerts,
    ],
  );

  return <MissionDataContext.Provider value={value}>{children}</MissionDataContext.Provider>;
}
