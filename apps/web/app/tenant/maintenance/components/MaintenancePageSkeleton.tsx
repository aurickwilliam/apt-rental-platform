import { Skeleton } from "@heroui/react";

// Loading state that mirrors the request maintenance page layout, so
// nothing moves when the data arrives. Same logic as the Passport, Browse,
// and My Rental skeletons.
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Sk className="h-4 w-32 rounded-lg" />
      <Sk className="h-10 w-full rounded-xl" />
    </div>
  );
}

export default function MaintenancePageSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  return (
    <div
      className="space-y-4"
      aria-busy="true"
      aria-label="Loading maintenance page"
    >
      {showHeader ? <div className="flex items-center gap-3">
        <Sk className="size-11 shrink-0 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Sk className="h-8 w-56 max-w-full rounded-lg" />
          <Sk className="h-4 w-full max-w-md rounded-lg" />
        </div>
      </div> : null}

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Sk className="h-20 w-24 shrink-0 rounded-xl sm:h-28 sm:w-36" />
          <div className="min-w-0 flex-1 space-y-2">
            <Sk className="h-6 w-48 max-w-full rounded-lg" />
            <Sk className="h-4 w-64 max-w-full rounded-lg" />
            <Sk className="h-3 w-32 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <Sk className="h-6 w-48 rounded-lg" />
            <Sk className="h-4 w-full max-w-md rounded-lg" />
          </div>

          <FieldSkeleton />
          <FieldSkeleton />

          <div className="space-y-1.5">
            <Sk className="h-4 w-32 rounded-lg" />
            <Sk className="h-24 w-full rounded-xl" />
          </div>

          <div className="space-y-2">
            <Sk className="h-4 w-40 rounded-lg" />
            <div className="flex flex-wrap gap-2">
              <Sk className="h-8 w-20 rounded-full" />
              <Sk className="h-8 w-20 rounded-full" />
              <Sk className="h-8 w-20 rounded-full" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Sk className="h-4 w-24 rounded-lg" />
            <Sk className="h-24 w-full rounded-xl" />
          </div>

          <Sk className="h-12 w-full rounded-full" />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        <div className="space-y-2">
          <Sk className="h-5 w-36 rounded-lg" />
          <Sk className="h-4 w-64 max-w-full rounded-lg" />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <Sk className="h-16 w-full rounded-xl" />
          <Sk className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
