import type { ReactNode } from "react";

import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";

interface PublicProfileTagsCardProps {
  title: string;
  items: ReadonlyArray<{ key: string; label: string; icon?: ReactNode }>;
  tone?: StatusTone;
  /** Shown instead of the chips when there is nothing to list. */
  emptyText: string;
}

// Titled card of status chips for the side column (areas covered, verified documents).
export default function PublicProfileTagsCard({ title, items, tone = "neutral", emptyText }: PublicProfileTagsCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5" aria-label={title}>
      <h2 className="font-nunito text-base font-bold">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.key}>
              <StatusChip size="md" tone={tone}>
                <span className="flex items-center gap-1">
                  {item.icon}
                  {item.label}
                </span>
              </StatusChip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
