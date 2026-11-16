"use client";

import { use } from "react";
import { useOverlayState } from "@heroui/react";
import {
  IconChevronRight as ChevronRight,
  IconClipboardText as ClipboardText,
  IconHome as House,
} from "@tabler/icons-react";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import type { InitialRentalContext } from "@/service/tenancy-context";
import ApplicationHistoryDrawer from "./ApplicationHistoryDrawer";
import ApplicationsList from "./ApplicationsList";
import TenancyEmptyState from "./TenancyEmptyState";

interface RentalApplicationsProps {
  tenantId?: string;
  initial?: InitialRentalContext["applications"];
  activeLease?: boolean;
}

/** Only this region suspends for the request-owned applications promise. */
export default function RentalApplications({ tenantId, initial, activeLease = false }: RentalApplicationsProps) {
  const seed = initial ? use(initial) : undefined;
  const { applications, loading, error } = useTenantApplications(tenantId, undefined, false, seed);
  const historyDialog = useOverlayState();
  const hasApplications = !loading && applications.length > 0;

  if (!activeLease) {
    return loading || hasApplications || error ? <ApplicationsList applications={applications} loading={loading} error={error} /> : (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <House size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">My Rental</h2>
        </div>
        <TenancyEmptyState />
      </div>
    );
  }

  if (!hasApplications) return null;
  const pendingCount = applications.filter((application) => application.status === "pending").length;
  const title = pendingCount > 0
    ? `${pendingCount} pending application${pendingCount === 1 ? "" : "s"}`
    : "Application history";
  const subtitle = pendingCount > 0 ? "Waiting for the landlord’s review" : "Review your past applications";
  return (
    <>
      <button
        type="button"
        onClick={() => historyDialog.setOpen(true)}
        aria-label={`${title}. View applications`}
        className="flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-3xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${pendingCount > 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>
          <ClipboardText size={20} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-nunito text-base font-semibold text-card-foreground">{title}</span>
          <span className="block truncate font-inter text-xs text-muted-foreground">{subtitle}</span>
        </span>
        <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
      <ApplicationHistoryDrawer isOpen={historyDialog.isOpen} onOpenChange={historyDialog.setOpen} applications={applications} />
    </>
  );
}
