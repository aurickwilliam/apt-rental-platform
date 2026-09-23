"use client";

export function MaintenanceCardSkeleton() {
  return (
    <div className="rounded-3xl border border-border bg-card p-4 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="size-8 rounded-full bg-muted shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-3.5 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted mt-2" />
          </div>
        </div>
        <div className="h-6 w-20 rounded-full bg-muted shrink-0" />
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-3 w-20 rounded bg-muted" />
      </div>
    </div>
  );
}

export function MaintenanceTableSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-pulse">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
          <div className="size-9 rounded-full bg-muted shrink-0" />
          <div className="flex-1">
            <div className="h-3.5 w-1/3 rounded bg-muted" />
            <div className="h-3 w-1/4 rounded bg-muted mt-2" />
          </div>
          <div className="h-6 w-24 rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}
