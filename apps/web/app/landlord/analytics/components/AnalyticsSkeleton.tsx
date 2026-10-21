"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { FinanceTab } from "@/lib/landlord-finance-params";

/** Body-shaped placeholder matching the final two-column Profit & planning
 *  layout: the earnings summary and Needs attention at the top, then the
 *  selected tab's cards. The body follows the selected tab so the placeholder
 *  never misrepresents the content the landlord is about to see. */
export default function AnalyticsSkeleton({
  tab = "overview",
}: {
  tab?: FinanceTab;
}) {
  return (
    <div
      className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]"
      aria-hidden="true"
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-border">
          <Skeleton className="h-32 rounded-none bg-secondary" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-9 w-56 rounded-full" />
          </div>
        </div>
        {tab === "expenses" ? (
          <>
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </>
        ) : tab === "budget" ? (
          <>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </>
        ) : (
          <>
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </>
        )}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-xl bg-secondary" />
        {tab === "budget" ? (
          <Skeleton className="h-96 rounded-xl" />
        ) : tab === "expenses" ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </>
        )}
      </div>
    </div>
  );
}
