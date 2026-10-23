import type { ComponentType } from "react";
import { IconChartBar } from "@tabler/icons-react";

type Props = {
  title: string;
  description: string;
  /** Defaults to a bar chart; pass another Tabler icon for non-chart empty states. */
  icon?: ComponentType<{ size?: number; className?: string }>;
  className?: string;
};

export default function ChartEmptyState({
  title,
  description,
  icon: Icon = IconChartBar,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 py-16 text-center ${className}`}
    >
      <div className="rounded-full bg-muted p-5">
        <Icon size={36} className="text-muted-foreground" />
      </div>
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
