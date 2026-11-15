import type { ReactNode } from "react";
import type { ColorTone } from "@/types";

const BADGE_TONES: Record<ColorTone, string> = {
  purple: "purple",
  green: "green",
  rose: "rose",
  blue: "blue",
  sand: "sand",
  amber: "amber",
};

interface BadgeProps {
  children: ReactNode;
  tone?: ColorTone;
}

export function Badge({ children, tone = "green" }: BadgeProps) {
  return (
    <span className={`badge ${BADGE_TONES[tone]}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
