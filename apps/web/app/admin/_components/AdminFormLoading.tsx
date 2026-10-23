import { Card } from "@heroui/react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDestinationLoading from "./AdminDestinationLoading";

export default function AdminFormLoading() {
  return (
    <AdminDestinationLoading title="Edit Profile" backHref="/admin/profile" backLabel="Back to profile">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Card className="space-y-5 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="mx-auto -mt-12 size-24 rounded-full border-4 border-background" />
          <Skeleton className="h-6 w-44" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => <Skeleton key={index} className="h-14 w-full" />)}
          </div>
        </Card>
      </div>
    </AdminDestinationLoading>
  );
}
