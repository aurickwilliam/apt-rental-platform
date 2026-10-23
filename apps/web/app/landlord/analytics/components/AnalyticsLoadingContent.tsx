"use client";

import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { financeTabParam } from "@/lib/landlord-finance-params";
import AnalyticsSkeleton from "./AnalyticsSkeleton";

/** loading.tsx gets no searchParams props. Its own Suspense confines this URL read. */
export default function AnalyticsLoadingContent() {
  const searchParams = useSearchParams();
  const tab = financeTabParam(searchParams.get("tab") ?? undefined);

  return (
    <div role="status" aria-busy="true" aria-label={`Loading ${tab} finance report`}>
      <span className="sr-only">Loading {tab} finance report…</span>
      <div aria-hidden="true">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-11 w-64 max-w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-8 w-52 rounded-lg" />
            <Skeleton className="h-8 w-36 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-72 max-w-full rounded-full" />
        </div>
        <div className="mt-4"><AnalyticsSkeleton tab={tab} /></div>
      </div>
    </div>
  );
}
