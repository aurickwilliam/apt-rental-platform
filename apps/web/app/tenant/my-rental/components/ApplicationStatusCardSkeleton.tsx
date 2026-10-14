"use client";

export default function ApplicationStatusCardSkeleton() {
  return (
    <div className="flex min-h-24 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="w-28 shrink-0 animate-pulse bg-muted sm:w-40" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-3.5 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-3.5 w-36 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
