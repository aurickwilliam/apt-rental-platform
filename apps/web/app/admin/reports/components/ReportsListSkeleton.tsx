import { Skeleton } from "@/components/ui/skeleton";

const ROW_COUNT = 5;

/**
 * Stands in for the report rows while a search, filter, page or refresh loads.
 * Same four columns as `ReportsTable` (and the card layout below `md`), so the
 * page doesn't jump when the results arrive.
 */
export default function ReportsListSkeleton() {
  return (
    <div role="status" aria-label="Loading reports" aria-busy="true">
      <div className="hidden rounded-2xl bg-muted/60 p-2 md:block">
        <div className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] gap-4 px-4 py-3">
          {["Report", "Reported", "Reported by", "Status"].map((column) => (
            <Skeleton key={column} className="h-4 w-20 bg-muted" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.6fr_1.2fr_1fr_1fr] items-center gap-4 rounded-xl bg-card px-4 py-4"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-44 max-w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 max-w-full" />
                <Skeleton className="h-3 w-28 max-w-full" />
              </div>
              <Skeleton className="h-4 w-28 max-w-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-3 w-32 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <ul className="space-y-2 md:hidden">
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <li key={index} className="space-y-3 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-48 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-44 max-w-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
