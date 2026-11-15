import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import {
  loadEsp32Capture,
  loadRr1Environment,
  loadRr1Radiation,
  applyDataSourceToCrew,
  buildEnvironmentReadingsForSource,
  type DataSourceId,
  type Esp32Reading,
  type Rr1EnvironmentData,
  type Rr1RadiationData,
} from "@/data/telemetry/dataSources";
import { evaluateConsecutiveAcuteAlerts } from "@/lib/companion/companionEngine";
import { useToast } from "./ToastContext";

interface MissionDataValue {
  crew: CrewMember[];
  alerts: MissionAlert[];
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

  // Control de Fuentes de Telemetría (MODO DEMO)
  dataSource: DataSourceId;
  setDataSource: (source: DataSourceId) => void;
  esp32Readings: Esp32Reading[];
  esp32Index: number;
  setEsp32Index: (index: number) => void;
  isPlayingEsp32: boolean;
  setIsPlayingEsp32: (playing: boolean) => void;
  playbackSpeed: 1 | 2 | 5;
  setPlaybackSpeed: (speed: 1 | 2 | 5) => void;
  rr1EnvData: Rr1EnvironmentData | null;
  rr1RadData: Rr1RadiationData | null;
}

const MissionDataContext = createContext<MissionDataValue | null>(null);

export function useMissionData(): MissionDataValue {
  const context = useContext(MissionDataContext);
  if (!context) throw new Error("useMissionData debe usarse dentro de <MissionDataProvider>.");
  return context;
}

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

  // Estado de Fuentes de Telemetría
  const [dataSource, setDataSourceState] = usePersistentState<DataSourceId>(
    "orbita.dataSource",
    "simulado",
  );
  const [esp32Readings, setEsp32Readings] = useState<Esp32Reading[]>([]);
  const [esp32Index, setEsp32Index] = useState<number>(0);
  const [isPlayingEsp32, setIsPlayingEsp32] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);

  const [rr1EnvData, setRr1EnvData] = useState<Rr1EnvironmentData | null>(null);
  const [rr1RadData, setRr1RadData] = useState<Rr1RadiationData | null>(null);

  // Carga inicial de snapshot
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

  // Carga diferida de datos según la fuente activa
  useEffect(() => {
    if (dataSource === "esp32" && esp32Readings.length === 0) {
      loadEsp32Capture().then((readings) => {
        setEsp32Readings(readings);
      });
    } else if (dataSource === "rr1") {
      if (!rr1EnvData) {
        loadRr1Environment().then(setRr1EnvData);
      }
      if (!rr1RadData) {
        loadRr1Radiation().then(setRr1RadData);
      }
    }
  }, [dataSource, esp32Readings.length, rr1EnvData, rr1RadData]);

  // Timer de reproducción para ESP32
  useEffect(() => {
    if (!isPlayingEsp32 || dataSource !== "esp32" || esp32Readings.length === 0) {
      return;
    }

    const currentReading = esp32Readings[esp32Index];
    // Duración simulada basada en el intervalo del archivo (por defecto 4s, escalada por velocidad)
    const baseIntervalMs = (currentReading?.interval_seconds && currentReading.interval_seconds > 0)
      ? currentReading.interval_seconds * 1000
      : 4000;
    const intervalMs = Math.max(500, Math.round(baseIntervalMs / playbackSpeed));

    const timer = setTimeout(() => {
      setEsp32Index((prev) => (prev + 1) % esp32Readings.length);
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isPlayingEsp32, dataSource, esp32Index, esp32Readings, playbackSpeed]);

  const setDataSource = useCallback(
    (source: DataSourceId) => {
      setDataSourceState(source);
      if (source === "esp32") {
        setIsPlayingEsp32(true);
      } else {
        setIsPlayingEsp32(false);
      }
    },
    [setDataSourceState],
  );

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

  // Lectura activa actual de ESP32
  const currentEsp32Reading = esp32Readings[esp32Index];

  // Tripulación adaptada según la fuente (alimenta a Elena en ESP32)
  const crew = useMemo(() => {
    return applyDataSourceToCrew(snapshot.crew, dataSource, "tripulante-01", currentEsp32Reading);
  }, [snapshot.crew, dataSource, currentEsp32Reading]);

  // Lecturas ambientales adaptadas según la fuente
  const environmentReadings = useMemo(() => {
    return buildEnvironmentReadingsForSource(
      dataSource,
      snapshot.environmentReadings,
      currentEsp32Reading,
      rr1EnvData ?? undefined,
    );
  }, [dataSource, snapshot.environmentReadings, currentEsp32Reading, rr1EnvData]);

  const value = useMemo<MissionDataValue>(
    () => ({
      crew,
      alerts: snapshot.alerts,
      activeAlerts: snapshot.alerts.filter((alert) => !acknowledgedAlertIds.includes(alert.id)),
      measurements,
      journal,
      environmentReadings,
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

      dataSource,
      setDataSource,
      esp32Readings,
      esp32Index,
      setEsp32Index,
      isPlayingEsp32,
      setIsPlayingEsp32,
      playbackSpeed,
      setPlaybackSpeed,
      rr1EnvData,
      rr1RadData,
    }),
    [
      crew,
      snapshot.alerts,
      snapshot.trends,
      acknowledgedAlertIds,
      measurements,
      journal,
      environmentReadings,
      environment,
      offline,
      isLoading,
      setEnvironment,
      setOffline,
      addMeasurement,
      addJournalEntry,
      acknowledgeAlert,
      restoreDemoAlerts,

      dataSource,
      setDataSource,
      esp32Readings,
      esp32Index,
      isPlayingEsp32,
      playbackSpeed,
      rr1EnvData,
      rr1RadData,
    ],
  );

  return <MissionDataContext.Provider value={value}>{children}</MissionDataContext.Provider>;
}
