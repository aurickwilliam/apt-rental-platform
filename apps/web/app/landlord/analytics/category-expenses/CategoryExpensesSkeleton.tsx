import { Skeleton } from "@/components/ui/skeleton";

/** List-shaped placeholder for the category drill-down while its rows load. */
export default function CategoryExpensesSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          className="rounded-2xl border border-border bg-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-2 h-4 w-40" />
          <Skeleton className="mt-1 h-4 w-52" />
        </div>
      ))}
    </div>
  );
}
