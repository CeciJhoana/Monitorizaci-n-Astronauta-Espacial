import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return <section className={`panel ${className ?? ""}`}>{children}</section>;
}

interface PanelTitleProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

export function PanelTitle({ title, subtitle, children }: PanelTitleProps) {
  return (
    <div className="panel-title">
      <div>
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
