import { Skeleton } from "@/components/ui/skeleton";
import AdminDestinationLoading from "./AdminDestinationLoading";

export default function AdminAnalyticsLoading() {
  return (
    <AdminDestinationLoading title="Analytics">
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => <Skeleton key={index} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    </AdminDestinationLoading>
  );
}
