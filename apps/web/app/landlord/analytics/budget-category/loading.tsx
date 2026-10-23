import { Skeleton } from "@/components/ui/skeleton";

import BudgetCategorySkeleton from "./BudgetCategorySkeleton";

export default function BudgetCategoryLoading() {
  return (
    <div className="p-4 md:p-6" role="status" aria-busy="true" aria-label="Loading budget category">
      <span className="sr-only">Loading budget category…</span>
      <div aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="mt-6 space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="mt-6">
          <BudgetCategorySkeleton />
        </div>
      </div>
    </div>
  );
}
