import { Skeleton } from "@/components/ui/skeleton";
import AdminDestinationLoading from "./AdminDestinationLoading";

/** loading.tsx has no params: do not invent the verification id for a back URL. */
export default function AdminLeaseLoading() {
  return (
    <AdminDestinationLoading title="Lease Agreement" backHref="/admin/verification?tab=apartments" backLabel="Back to verification">
      <div className="rounded-3xl border border-border bg-card p-4">
        <Skeleton className="h-[60vh] w-full rounded-xl" />
      </div>
    </AdminDestinationLoading>
  );
}
