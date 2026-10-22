import { ProgressBar } from "@heroui/react";

interface FinanceMeterProps {
  /** What the bar measures, announced with its value. */
  label: string;
  /** Percent filled, 0–100. */
  value: number;
  /** Over-limit and negative figures switch to the destructive color. */
  over?: boolean;
  className?: string;
}

/** HeroUI progress bar recolored to APT's brand and destructive roles. */
export default function FinanceMeter({
  label,
  value,
  over = false,
  className = "",
}: FinanceMeterProps) {
  return (
    <ProgressBar
      aria-label={label}
      value={Math.min(100, Math.max(0, value))}
      className={`finance-meter ${over ? "finance-meter--over" : ""} ${className}`}
    >
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}
