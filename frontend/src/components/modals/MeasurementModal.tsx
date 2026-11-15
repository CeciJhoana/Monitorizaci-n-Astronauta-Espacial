import { Icon } from "@/components/ui";
import { InfoNote } from "@/components/ui/EmptyState";
import { useMissionData } from "@/store/MissionDataContext";
import { useToast } from "@/store/ToastContext";
import { useUi } from "@/store/UiContext";
import { ModalShell } from "./ModalShell";

const HEART_RATE_RANGE = { min: 20, max: 250 } as const;
const OXYGEN_RANGE = { min: 50, max: 100 } as const;

/** Modal de registro manual de medición (FC y SpO₂). */
export function MeasurementModal() {
  const { crew, addMeasurement } = useMissionData();
  const { closeModal, navigate } = useUi();
  const { notify } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const astronautId = String(data.get("astronautId"));
    await addMeasurement({
      astronautId,
      heartRate: Number(data.get("heartRate")),
      oxygenSaturation: Number(data.get("oxygenSaturation")),
    });
    closeModal();
    notify("Medición registrada. Consúltala en Signos vitales.");
    navigate("vitals");
  }

  return (
    <ModalShell ariaLabel="Registrar medición" onClose={closeModal}>
      <span className="eyebrow">CAPTURA MANUAL · DEMOSTRACIÓN</span>
      <h2>Registrar medición</h2>
      <p className="modal-description">
        Verifica el ajuste del sensor y espera una lectura estable. Los valores registrados no
        generan una evaluación médica.
      </p>
      <form onSubmit={handleSubmit}>
        <label className="field-label">
          Tripulante
          <select name="astronautId">
            {crew.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label className="field-label">
            Frecuencia cardíaca · lpm
            <input
              required
              type="number"
              name="heartRate"
              min={HEART_RATE_RANGE.min}
              max={HEART_RATE_RANGE.max}
              placeholder="Ej. 68"
            />
          </label>
          <label className="field-label">
            SpO₂ · %
            <input
              required
              type="number"
              name="oxygenSaturation"
              min={OXYGEN_RANGE.min}
              max={OXYGEN_RANGE.max}
              placeholder="Ej. 98"
            />
          </label>
        </div>
        <InfoNote>
          Los registros se conservan localmente en este dispositivo; no se sincronizan con un
          sistema clínico real.
        </InfoNote>
        <button className="button primary full-width" type="submit">
          <Icon name="check" size={17} />
          Guardar medición
        </button>
      </form>
    </ModalShell>
  );
}
