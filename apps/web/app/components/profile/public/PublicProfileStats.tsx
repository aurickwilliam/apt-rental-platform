import type { ReactNode } from "react";

export interface PublicProfileStat {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  /** Small muted line under the value. */
  hint?: string;
  /** When set, the hint becomes a link (e.g. the reviews section). */
  hintHref?: string;
}

// One card of label / value rows for the side column (mobile ProfileStatsCard).
export default function PublicProfileStats({ stats }: { stats: PublicProfileStat[] }) {
  return (
    <dl className="divide-y divide-border rounded-3xl border border-border bg-card px-4 sm:px-5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center justify-between gap-3 py-3.5">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            {stat.icon}
            {stat.label}
          </dt>
          <dd className="flex flex-col items-end text-right">
            <div className="font-nunito text-lg font-bold text-primary">{stat.value}</div>
            {stat.hint ? (
              stat.hintHref ? (
                <a
                  href={stat.hintHref}
                  className="text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {stat.hint}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{stat.hint}</span>
              )
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
