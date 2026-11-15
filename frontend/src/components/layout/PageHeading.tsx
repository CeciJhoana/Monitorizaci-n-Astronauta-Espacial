import { Icon } from "@/components/ui";
import { PAGE_HEADINGS } from "@/config/mission";
import { exportMissionReport } from "@/lib/exportReport";
import { useMissionData } from "@/store/MissionDataContext";
import { useToast } from "@/store/ToastContext";
import { useUi } from "@/store/UiContext";

/** Encabezado de página con título, subtítulo y acciones globales. */
export function PageHeading() {
  const { page, openModal } = useUi();
  const { crew, measurements } = useMissionData();
  const { notify } = useToast();
  const heading = PAGE_HEADINGS[page];

  function handleExport() {
    exportMissionReport(crew, measurements);
    notify("Informe de datos simulados exportado");
  }

  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          <span />
          CENTRO DE OPERACIONES BIOMÉDICAS
        </div>
        <h1>{heading.title}</h1>
        <p>{heading.subtitle}</p>
      </div>
      <div className="heading-actions">
        <button className="button secondary" onClick={handleExport}>
          <Icon name="download" size={16} />
          Exportar informe
        </button>
        <button className="button primary" onClick={() => openModal({ type: "measurement" })}>
          <Icon name="plus" size={17} />
          Registrar medición
        </button>
      </div>
    </div>
  );
}

/** Título de sección interno (usado dentro de páginas). */
export function SectionHeading({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <span>
        <span className="status-dot" />
        {children}
      </span>
    </div>
  );
}
