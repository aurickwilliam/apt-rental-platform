import { Skeleton } from "@/components/ui/skeleton";

import AnalyticsSkeleton from "./components/AnalyticsSkeleton";

export default function ProfitPlanningLoading() {
  return (
    <div className="p-4 md:p-6" aria-hidden="true">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="mt-6">
        <AnalyticsSkeleton />
      </div>
    </div>
  );
}
