"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { FinanceTab } from "@/lib/landlord-finance-params";

/** Body-shaped placeholder matching the final Profit & planning layout:
 *  summary strip, tab bar, and the scoped report surface. The body follows
 *  the selected tab so the placeholder never misrepresents the content the
 *  landlord is about to see. */
export default function AnalyticsSkeleton({
  tab = "overview",
}: {
  tab?: FinanceTab;
}) {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="overflow-hidden rounded-xl border border-border">
        <Skeleton className="h-36 rounded-none bg-secondary" />
        <div className="space-y-3 p-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-8 w-64 max-w-full rounded-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      {tab === "expenses" ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : tab === "budget" ? (
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      )}
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
