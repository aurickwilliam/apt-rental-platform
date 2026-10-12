import { Skeleton } from "@/components/ui/skeleton";

export function AdminLoadingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6" role="status" aria-label="Loading admin page">
      <span className="sr-only">Loading admin page</span>
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 bg-muted" />
        <Skeleton className="h-4 w-80 max-w-full bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-4 w-28 bg-muted" />
            <Skeleton className="mt-4 h-8 w-20 bg-muted" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-5 w-44 bg-muted" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-full bg-muted" />
          ))}
        </div>
      </div>
    </div>
  );
}
