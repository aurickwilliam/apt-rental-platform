import { Skeleton } from "@/components/ui/skeleton";

/** List-shaped placeholder for the budget drill-down while its rows load. */
export default function BudgetCategorySkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="rounded-2xl border border-border bg-card p-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="mt-2 h-2 w-full rounded-full" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
      ))}
    </div>
  );
}
