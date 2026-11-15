import { Footer } from "@/components/layout/Footer";
import { PageHeading } from "@/components/layout/PageHeading";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MiniOrbLauncher } from "@/components/companion/MiniOrbLauncher";
import { ModalRoot } from "@/components/modals/ModalRoot";
import { AlertsPage } from "@/features/alerts/AlertsPage";
import { AssistantPage } from "@/features/assistant/AssistantPage";
import { CrewPage } from "@/features/crew/CrewPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { EnvironmentPage } from "@/features/environment/EnvironmentPage";
import { JournalPage } from "@/features/journal/JournalPage";
import { ProtocolsPage } from "@/features/protocols/ProtocolsPage";
import { VitalsPage } from "@/features/vitals/VitalsPage";
import { WellnessPage } from "@/features/wellness/WellnessPage";
import { CompanionProvider } from "@/store/CompanionContext";
import { MissionDataProvider } from "@/store/MissionDataContext";
import { ToastProvider } from "@/store/ToastContext";
import { UiProvider, useUi } from "@/store/UiContext";
import type { PageId } from "@/types";

/** Registro de páginas; la navegación solo cambia el id activo. */
const PAGES: Record<PageId, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  assistant: AssistantPage,
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
      <MiniOrbLauncher />
      <ModalRoot />
    </div>
  );
}

/**
 * Composición de la aplicación.
 *
 * Jerarquía de providers: avisos (Toast) → datos de misión (MissionData) →
 * asistente ASTRA (Companion) → interfaz (navegación y modales).
 */
export default function App() {
  return (
    <ToastProvider>
      <MissionDataProvider>
        <CompanionProvider>
          <UiProvider>
            <AppShell />
          </UiProvider>
        </CompanionProvider>
      </MissionDataProvider>
    </ToastProvider>
  );
}
