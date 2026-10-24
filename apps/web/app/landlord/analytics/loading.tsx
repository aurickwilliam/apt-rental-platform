import { Suspense } from "react";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";
import AnalyticsLoadingContent from "./components/AnalyticsLoadingContent";

export default function ProfitPlanningLoading() {
  return (
    <div className="p-4 md:p-6">
      <Suspense fallback={<RouteLoadingStatus>Loading finance report…</RouteLoadingStatus>}>
        <AnalyticsLoadingContent />
      </Suspense>
    </div>
  );
}
