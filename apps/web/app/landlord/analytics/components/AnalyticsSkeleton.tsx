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
        <div className="overflow-hidden rounded-3xl border border-border">
          <Skeleton className="h-32 rounded-none bg-primary/10" />
          <div className="space-y-3 p-4">
            <Skeleton className="bg-muted h-5 w-full" />
            <Skeleton className="bg-muted h-5 w-full" />
            <Skeleton className="bg-muted h-9 w-56 rounded-full" />
          </div>
        </div>
        {tab === "expenses" ? (
          <>
            <Skeleton className="bg-muted h-28 rounded-3xl" />
            <Skeleton className="bg-muted h-72 rounded-3xl" />
          </>
        ) : tab === "budget" ? (
          <>
            <Skeleton className="bg-muted h-64 rounded-3xl" />
            <Skeleton className="bg-muted h-40 rounded-3xl" />
          </>
        ) : (
          <>
            <Skeleton className="bg-muted h-80 rounded-3xl" />
            <Skeleton className="bg-muted h-56 rounded-3xl" />
          </>
        )}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-3xl bg-primary/30" />
        {tab === "budget" ? (
          <Skeleton className="bg-muted h-96 rounded-3xl" />
        ) : tab === "expenses" ? (
          <Skeleton className="bg-muted h-64 rounded-3xl" />
        ) : (
          <>
            <Skeleton className="bg-muted h-40 rounded-3xl" />
            <Skeleton className="bg-muted h-56 rounded-3xl" />
          </>
        )}
      </div>
    </div>
  );
}
