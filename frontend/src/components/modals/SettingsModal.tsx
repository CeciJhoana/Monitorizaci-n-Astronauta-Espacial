import { Icon, Toggle } from "@/components/ui";
import { InfoNote } from "@/components/ui/EmptyState";
import { ENVIRONMENT_OPTIONS } from "@/config/mission";
import { useMissionData } from "@/store/MissionDataContext";
import { useToast } from "@/store/ToastContext";
import { useUi } from "@/store/UiContext";
import type { EnvironmentId } from "@/types";
import { ModalShell } from "./ModalShell";

/** Modal de preferencias de demostración: entorno y modo local. */
export function SettingsModal() {
  const { environment, setEnvironment, offline, setOffline } = useMissionData();
  const { closeModal } = useUi();
  const { notify } = useToast();

  return (
    <ModalShell ariaLabel="Configuración de misión" onClose={closeModal}>
      <span className="eyebrow">PREFERENCIAS DE DEMOSTRACIÓN</span>
      <h2>Configuración de misión</h2>
      <p className="modal-description">Personaliza el contexto operativo de esta sesión.</p>
      <label className="field-label">
        Entorno de misión
        <select
          value={environment}
          onChange={(event) => setEnvironment(event.target.value as EnvironmentId)}
        >
          {ENVIRONMENT_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <p className="field-hint">
        Ajusta el entorno y la gravedad mostrados. Los protocolos médicos no están validados para
        estos entornos.
      </p>
      <div className="setting-row">
        <div>
          <strong>Simular pérdida de enlace</strong>
          <p>La interfaz sigue disponible en modo local.</p>
        </div>
        <Toggle checked={offline} onChange={setOffline} label="Simular pérdida de enlace" />
      </div>
      <InfoNote icon="radio">
        Esta demo no realiza sincronización real con Tierra. Los registros de la sesión se guardan
        localmente en este dispositivo.
      </InfoNote>
      <button
        className="button primary full-width"
        onClick={() => {
          closeModal();
          notify("Preferencias aplicadas");
        }}
      >
        Aplicar preferencias
        <Icon name="check" size={17} />
      </button>
    </ModalShell>
  );
}
