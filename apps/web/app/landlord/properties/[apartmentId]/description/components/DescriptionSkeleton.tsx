import { Skeleton } from "@heroui/react";
import { IconHome, IconFileText, IconBed, IconSparkles } from "@tabler/icons-react";
import DescriptionSection from "./DescriptionSection";

const SUMMARY_FIELD_COUNT = 5;
const SPEC_FIELD_COUNT = 8;
const PERK_COUNT = 12;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function DescriptionFieldSkeleton() {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-muted/40 px-3 py-3">
      <Sk className="size-10 shrink-0 rounded-xl" />
      <div className="min-w-0 space-y-1">
        <Sk className="h-4 w-20 max-w-full rounded-lg" />
        <Sk className="h-5 w-24 max-w-full rounded-lg" />
      </div>
    </div>
  );
}

export default function DescriptionSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0" aria-busy="true" aria-label="Loading apartment description">
      <div>
        <Sk className="h-8 w-36 rounded-lg" />
        <h1 className="mt-2 text-2xl font-bold font-nunito text-card-foreground">Apartment Description</h1>
        <div aria-hidden="true"><Sk className="mt-1 h-5 w-80 max-w-full rounded-lg" /></div>
      </div>

      <div className="flex flex-col gap-4" aria-hidden="true">
        <DescriptionSection title="Main Information" subtitle="Basic details and pricing information for this property." icon={IconHome} action={<Sk className="h-8 w-20 shrink-0 rounded-full" />}>
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
            <Sk className="min-h-40 w-full rounded-xl" />
            <div className="flex min-w-0 flex-col justify-between gap-4">
              <div>
                <Sk className="h-7 w-52 max-w-full rounded-lg" />
                <Sk className="mt-1 h-5 w-80 max-w-full rounded-lg" />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-5">
                {Array.from({ length: SUMMARY_FIELD_COUNT }, (_, index) => <DescriptionFieldSkeleton key={index} />)}
              </div>
            </div>
          </div>
        </DescriptionSection>

        <DescriptionSection title="Full Description" subtitle="Detailed information about the property and its features." icon={IconFileText} action={<Sk className="h-8 w-20 shrink-0 rounded-full" />}>
          <div className="rounded-2xl bg-muted px-4 py-3 space-y-2">
            <Sk className="h-5 w-full rounded-lg" />
            <Sk className="h-5 w-5/6 rounded-lg" />
            <Sk className="h-5 w-2/3 rounded-lg sm:hidden" />
          </div>
        </DescriptionSection>

        <DescriptionSection title="Room / Unit Details" subtitle="Key information about the unit specifications." icon={IconBed} action={<Sk className="h-8 w-20 shrink-0 rounded-full" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {Array.from({ length: SPEC_FIELD_COUNT }, (_, index) => <DescriptionFieldSkeleton key={index} />)}
          </div>
        </DescriptionSection>

        <DescriptionSection title="Included Perks" subtitle="Amenities and features included in this unit." icon={IconSparkles} action={<Sk className="h-8 w-20 shrink-0 rounded-full" />}>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: PERK_COUNT }, (_, index) => <Sk key={index} className="h-6 w-24 rounded-full" />)}
          </div>
        </DescriptionSection>

        <DescriptionSection title="Lease Agreement" subtitle="View or upload this property's lease agreement." icon={IconFileText} inline>
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2">
            <Sk className="h-8 w-full rounded-full" />
            <Sk className="h-8 w-full rounded-full" />
          </div>
        </DescriptionSection>
      </div>
    </div>
  );
}
