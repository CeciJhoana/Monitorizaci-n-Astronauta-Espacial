import type { IconName } from "@/types";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon?: IconName;
  title?: string;
  children: React.ReactNode;
}

export function EmptyState({ icon = "check", title, children }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <Icon name={icon} size={28} />
      {title && <h3>{title}</h3>}
      <p>{children}</p>
    </div>
  );
}

interface InfoNoteProps {
  icon?: IconName;
  children: React.ReactNode;
}

/** Nota informativa y discreta, usada para aclarar límites del prototipo. */
export function InfoNote({ icon = "help", children }: InfoNoteProps) {
  return (
    <div className="info-note">
      <Icon name={icon} size={20} />
      <p>{children}</p>
    </div>
  );
}
