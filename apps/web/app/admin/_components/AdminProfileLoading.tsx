import { Card } from "@heroui/react";
import { Skeleton } from "@/components/ui/skeleton";
import AdminDestinationLoading from "./AdminDestinationLoading";

interface AdminProfileLoadingProps {
  title: string;
  backHref?: string;
  backLabel?: string;
}

/** Shared geometry of own profile, user detail and user/document review pages. */
export default function AdminProfileLoading(props: AdminProfileLoadingProps) {
  return (
    <AdminDestinationLoading {...props}>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden rounded-3xl border border-border bg-card shadow-none">
            <Skeleton className="h-28 w-full rounded-none sm:h-32" />
            <div className="flex items-start gap-4 p-4">
              <Skeleton className="-mt-12 size-24 shrink-0 rounded-full border-4 border-background" />
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-8 w-48 max-w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </Card>
          <Card className="space-y-4 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
            <Skeleton className="h-6 w-44" />
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
            </div>
          </Card>
        </div>
        <Card className="min-w-0 space-y-4 rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </Card>
      </div>
    </AdminDestinationLoading>
  );
}
