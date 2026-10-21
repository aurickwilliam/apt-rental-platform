import { Skeleton } from "@/components/ui/skeleton";

/** Two-column placeholder for the category page while its report loads. */
export default function CategoryExpensesSkeleton() {
  return (
    <div
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]"
      aria-hidden="true"
    >
      <div className="space-y-3 rounded-3xl border border-border p-4">
        <Skeleton className="h-6 w-40 bg-muted" />
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-12 w-full rounded-lg bg-muted" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-3xl bg-muted" />
        <Skeleton className="h-40 rounded-3xl bg-muted" />
      </div>
    </div>
  );
}
