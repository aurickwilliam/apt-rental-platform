import { Card, Separator, Skeleton } from "@heroui/react";
import MaintenanceDetailShell from "./MaintenanceDetailShell";

const DETAIL_FIELD_COUNT = 4;
const PHOTO_COUNT = 3;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function MaintenanceDetailFieldSkeleton() {
  return (
    <div className="min-w-0 space-y-1">
      <Sk className="h-5 w-28 max-w-full rounded-lg" />
      <Sk className="h-5 w-40 max-w-full rounded-lg" />
    </div>
  );
}

function MaintenanceDetailSectionTitle({ children }: { children: string }) {
  return <p className="text-sm font-nunito font-bold text-primary uppercase tracking-wide">{children}</p>;
}

export default function MaintenanceDetailSkeleton() {
  return (
    <MaintenanceDetailShell>
      <div role="status" aria-busy="true" aria-label="Loading maintenance request details">
      <div aria-hidden="true">
        <Card className="shadow-none bg-card rounded-2xl border border-border p-4 md:p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Sk className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">Maintenance Information</p>
              <Sk className="h-7 w-64 max-w-full rounded-lg" />
            </div>
            <div className="flex gap-1.5 shrink-0"><Sk className="h-5 w-12 rounded-full" /><Sk className="h-5 w-20 rounded-full" /></div>
          </div>
          <Separator className="bg-border" />

          <div>
            <MaintenanceDetailSectionTitle>Property &amp; Tenant</MaintenanceDetailSectionTitle>
            <div className="mt-2 flex items-start gap-3">
              <Sk className="size-12 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <MaintenanceDetailFieldSkeleton />
                <MaintenanceDetailFieldSkeleton />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Array.from({ length: DETAIL_FIELD_COUNT }, (_, index) => <MaintenanceDetailFieldSkeleton key={index} />)}
            </div>
          </div>
          <Separator className="bg-border" />

          <div>
            <MaintenanceDetailSectionTitle>Issue Description</MaintenanceDetailSectionTitle>
            <div className="mt-2 rounded-2xl bg-muted px-4 py-3 space-y-2"><Sk className="h-5 w-full rounded-lg" /><Sk className="h-5 w-2/3 rounded-lg" /></div>
          </div>
          <div>
            <MaintenanceDetailSectionTitle>Issue Photos</MaintenanceDetailSectionTitle>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: PHOTO_COUNT }, (_, index) => <Sk key={index} className="size-24 rounded-2xl" />)}
            </div>
          </div>
          <div>
            <MaintenanceDetailSectionTitle>Resolution Notes</MaintenanceDetailSectionTitle>
            <div className="mt-2 rounded-2xl bg-muted px-4 py-3"><Sk className="h-5 w-3/4 rounded-lg" /></div>
          </div>
          <div>
            <MaintenanceDetailSectionTitle>Maintenance Fee</MaintenanceDetailSectionTitle>
            <div className="mt-2 rounded-2xl bg-muted px-4 py-3 flex items-center justify-between gap-3"><Sk className="h-6 w-20 rounded-lg" /><Sk className="h-5 w-28 rounded-full" /></div>
          </div>
          <Sk className="mt-2 h-10 w-36 rounded-full" />
        </Card>
      </div>
      </div>
    </MaintenanceDetailShell>
  );
}
