import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";

interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: string;
  /** Optional small button (HeroUI `Button size="sm"`). */
  action?: ReactNode;
  /** Wraps the state in the dashed card some pages use. */
  framed?: boolean;
  className?: string;
}

export default function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  framed = false,
  className,
}: EmptyStateProps) {
  const padding = /(^|\s)py-/.test(className ?? "") ? "" : "py-16";
  const frame = framed
    ? "rounded-2xl border border-dashed border-border bg-card"
    : "";

  return (
    <div
      className={`flex flex-col items-center gap-4 px-6 text-center ${padding} ${frame} ${className ?? ""}`}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
        <IconComponent size={28} aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-nunito text-lg font-bold text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
