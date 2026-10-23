import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "../apartments/[id]/components/DetailPrimitives";
import AdminDestinationLoading from "./AdminDestinationLoading";

export default function AdminApartmentReviewLoading() {
  return (
    <AdminDestinationLoading title="Apartment Verification" backHref="/admin/verification?tab=apartments" backLabel="Back to verification">
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Section title="Apartment overview">
          <Skeleton className="h-64 w-full rounded-3xl sm:h-96" />
          <Skeleton className="mt-4 h-8 w-2/3" />
          <Skeleton className="mt-3 h-16 w-full" />
        </Section>
        <Section title="Verification review">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-28 w-full rounded-xl" />
          <Skeleton className="mt-4 h-10 w-full rounded-xl" />
        </Section>
      </div>
    </AdminDestinationLoading>
  );
}
