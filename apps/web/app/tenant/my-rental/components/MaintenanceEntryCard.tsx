import Link from "next/link";
import { IconTool } from "@tabler/icons-react";
import { canRequestMaintenance, maintenanceHref } from "@/lib/tenant-maintenance";
import type { ActiveTenancy } from "@/service/tenancy-context";

export default function MaintenanceEntryCard({ tenancy }: { tenancy: ActiveTenancy | null }) {
  if (!canRequestMaintenance(tenancy) || !tenancy) return null;
  return (
    <section aria-labelledby="maintenance-entry-heading" className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><IconTool size={20} aria-hidden="true" /></span>
        <div className="min-w-0">
          <h2 id="maintenance-entry-heading" className="font-nunito text-lg font-semibold">Need a repair?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Report an issue with your apartment or track an existing maintenance request.</p>
          <p className="mt-1 break-words text-xs text-muted-foreground">For {tenancy.apartment.name}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link href={maintenanceHref(tenancy.id)} className="button button--primary min-h-11">Request maintenance</Link>
        <Link href={maintenanceHref(tenancy.id, "requests")} className="button button--outline min-h-11">View requests</Link>
      </div>
    </section>
  );
}
