import Link from "next/link";
import { ProgressBar } from "@heroui/react";
import type { ComponentType } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Shows the value in the destructive color (e.g. overdue rent). */
  isAlert?: boolean;
  /** Omit for informational tiles. */
  href?: string;
  /** Percent filled (0-100); renders a brand-colored meter under the value. */
  progress?: number;
  /** Accessible name for the meter. */
  progressLabel?: string;
};

export default function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  isAlert = false,
  href,
  progress,
  progressLabel = label,
}: Props) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon size={20} className="shrink-0 text-muted-foreground" />
        <h2 className="flex-1 text-base font-medium text-foreground">{label}</h2>
        {href ? <IconArrowUpRight size={16} className="text-muted-foreground" /> : null}
      </div>
      <div className="space-y-1">
        <p
          className={`text-3xl font-semibold ${isAlert ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </p>
        {progress !== undefined ? (
          <ProgressBar aria-label={progressLabel} value={progress} className="occupancy-meter">
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        ) : null}
        {caption ? <p className="text-sm text-muted-foreground">{caption}</p> : null}
      </div>
    </>
  );

  const className = "flex flex-col gap-3 rounded-xl border border-border bg-card p-5";

  if (!href) return <div className={className}>{content}</div>;

  return (
    <Link
      href={href}
      className={`${className} cursor-pointer transition-colors hover:border-primary`}
    >
      {content}
    </Link>
  );
}
