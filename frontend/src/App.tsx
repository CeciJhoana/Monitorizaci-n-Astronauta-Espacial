import { Footer } from "@/components/layout/Footer";
import { PageHeading } from "@/components/layout/PageHeading";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ModalRoot } from "@/components/modals/ModalRoot";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { CrewPage } from "@/features/crew/CrewPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { EnvironmentPage } from "@/features/environment/EnvironmentPage";
import { JournalPage } from "@/features/journal/JournalPage";
import { ProtocolsPage } from "@/features/protocols/ProtocolsPage";
import { VitalsPage } from "@/features/vitals/VitalsPage";
import { WellnessPage } from "@/features/wellness/WellnessPage";
import { MissionDataProvider } from "@/store/MissionDataContext";
import { ToastProvider } from "@/store/ToastContext";
import { UiProvider, useUi } from "@/store/UiContext";
import type { PageId } from "@/types";

/** Registro de páginas; la navegación solo cambia el id activo. */
const PAGES: Record<PageId, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  crew: CrewPage,
  vitals: VitalsPage,
  wellness: WellnessPage,
  alerts: AlertsPage,
  environment: EnvironmentPage,
  protocols: ProtocolsPage,
  journal: JournalPage,
};

function CurrentPage() {
  const { page } = useUi();
  const Page = PAGES[page];
  return <Page />;
}

function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Topbar />
        <main>
          <PageHeading />
          <CurrentPage />
          <Footer />
        </main>
      </div>
      <ModalRoot />
    </div>
  );
}

/**
 * Composición de la aplicación.
 *
 * Jerarquía de providers (de fuera hacia dentro): avisos (Toast) →
 * datos de misión (MissionData) → interfaz (navegación y modales).
 */
export default function App() {
  return (
    <ToastProvider>
      <MissionDataProvider>
        <UiProvider>
          <AppShell />
        </UiProvider>
      </MissionDataProvider>
    </ToastProvider>
  );
}
