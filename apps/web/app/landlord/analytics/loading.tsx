import { Skeleton } from "@/components/ui/skeleton";

import AnalyticsSkeleton from "./components/AnalyticsSkeleton";

export default function ProfitPlanningLoading() {
  return (
    <div className="p-4 md:p-6" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-11 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
        <Skeleton className="h-9 w-72 rounded-full" />
      </div>
      <div className="mt-4">
        <AnalyticsSkeleton />
      </div>
    </div>
  );
}
