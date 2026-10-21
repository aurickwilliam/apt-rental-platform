import MaintenancePageSkeleton from "./components/MaintenancePageSkeleton";

export default function MaintenanceLoading() {
  return (
    <div className="min-h-screen">
      <div className="px-4 py-6 sm:py-8">
        <MaintenancePageSkeleton />
      </div>
    </div>
  );
}
