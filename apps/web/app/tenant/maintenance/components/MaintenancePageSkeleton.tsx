import { Skeleton } from "@heroui/react";

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

function RequestListSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
      <Sk className="h-5 w-56 max-w-full rounded-lg" />
      <Sk className="h-4 w-72 max-w-full rounded-lg" />
      <Sk className={`${compact ? "h-16" : "h-32"} w-full rounded-xl`} />
      <Sk className={`${compact ? "h-16" : "h-32"} w-full rounded-xl`} />
    </div>
  );
}

export default function MaintenancePageSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading maintenance page">
      {showHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Sk className="size-11 shrink-0 rounded-lg" />
              <Sk className="h-9 w-52 max-w-full rounded-lg" />
            </div>
            <Sk className="h-4 w-full max-w-xl rounded-lg" />
          </div>
          <Sk className="h-10 w-52 rounded-full" />
        </div>
      ) : null}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2"><RequestListSkeleton /></div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <Sk className="h-5 w-24 rounded-lg" />
          <Sk className="h-4 w-32 rounded-lg" />
          <Sk className="h-9 w-16 rounded-lg" />
          <div className="space-y-3 border-t border-border pt-3">
            <Sk className="h-4 w-48 max-w-full rounded-lg" />
            <Sk className="h-9 w-32 rounded-lg" />
            <Sk className="h-12 w-full rounded-lg" />
          </div>
        </div>
      </div>
      <RequestListSkeleton compact />
    </div>
  );
}
