import PerformanceSkeleton from "./PerformanceSkeleton";

export default function PerformanceLoading() {
  return (
    <div
      className="p-4 md:p-6"
      role="status"
      aria-label="Loading property comparison"
    >
      <PerformanceSkeleton />
    </div>
  );
}
