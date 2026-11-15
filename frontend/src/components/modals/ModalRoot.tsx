import { useUi } from "@/store/UiContext";
import { AlertDetailModal } from "./AlertDetailModal";
import { EmergencyModal } from "./EmergencyModal";
import { HelpModal } from "./HelpModal";
import { MeasurementModal } from "./MeasurementModal";
import { ProfileModal } from "./ProfileModal";
import { ProtocolModal } from "./ProtocolModal";
import { SettingsModal } from "./SettingsModal";

/**
 * Punto único de montaje de modales: decide qué ventana mostrar según el
 * estado global de UI. Las páginas solo piden `openModal(...)`.
 */
export function ModalRoot() {
  const { activeModal } = useUi();
  if (!activeModal) return null;

  switch (activeModal.type) {
    case "measurement":
      return <MeasurementModal />;
    case "settings":
      return <SettingsModal />;
    case "help":
      return <HelpModal />;
    case "emergency":
      return <EmergencyModal />;
    case "profile":
      return activeModal.crewMember ? <ProfileModal memberId={activeModal.crewMember.id} /> : null;
    case "alert-detail":
      return activeModal.alert ? <AlertDetailModal alertId={activeModal.alert.id} /> : null;
    case "protocol":
      return activeModal.protocolId ? <ProtocolModal protocolId={activeModal.protocolId} /> : null;
    default:
      return null;
  }
}
