import type { ReactNode } from "react";
import { useDialogAccessibility } from "@/hooks/useDialogAccessibility";
import { Icon } from "@/components/ui";

interface ModalShellProps {
  ariaLabel: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/** Contenedor accesible de ventana modal: backdrop, cierre y trampa de foco. */
export function ModalShell({ ariaLabel, onClose, className, children }: ModalShellProps) {
  useDialogAccessibility(true, onClose);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className={`modal ${className ?? ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close icon-button" aria-label="Cerrar ventana" onClick={onClose}>
          <Icon name="close" size={21} />
        </button>
        {children}
      </section>
    </div>
  );
}
