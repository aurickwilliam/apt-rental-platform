import { Skeleton } from "@/components/ui/skeleton";

import CategoryExpensesSkeleton from "./CategoryExpensesSkeleton";

export default function CategoryExpensesLoading() {
  return (
    <div className="p-4 md:p-6" role="status" aria-busy="true" aria-label="Loading category expenses">
      <span className="sr-only">Loading category expenses…</span>
      <div className="space-y-4" aria-hidden="true">
        <Skeleton className="h-5 w-32 bg-muted" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-11 w-72 bg-muted" />
          <Skeleton className="h-8 w-28 rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-[2.375rem] w-52 rounded-[0.875rem] bg-muted" />
          <Skeleton className="h-[2.375rem] w-40 rounded-[0.875rem] bg-muted" />
          <Skeleton className="size-[2.375rem] rounded-[0.875rem] bg-muted" />
        </div>
        <CategoryExpensesSkeleton />
      </div>
    </div>
  );
}
