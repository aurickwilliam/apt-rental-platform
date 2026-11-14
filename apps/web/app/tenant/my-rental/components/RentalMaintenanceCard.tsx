"use client";

import Link from "next/link";
import { Spinner, buttonVariants } from "@heroui/react";
import { IconPlus, IconTool } from "@tabler/icons-react";
import { MAINTENANCE_URGENCY } from "@repo/constants";

import EmptyState from "@/app/components/display/EmptyState";
import StatusChip from "@/app/components/display/StatusChip";
import type { MaintenanceRequest } from "@/hooks/use-maintenance-request-history";
import type { StatusTone } from "@/lib/status-tone";

import { CATEGORIES } from "../../maintenance/data/maintenance-data";
import { selectMaintenancePreview } from "../maintenance-preview";
import { formatShortDate } from "../utils";
import DashboardCard from "./DashboardCard";

const MAINTENANCE_HREF = "/tenant/maintenance";
const CHIP_CLASS = "font-nunito text-[11px] font-semibold";

const URGENCY_TONE: Record<string, StatusTone> = { low: "neutral", medium: "warning", high: "danger" };

function statusTone(status: MaintenanceRequest["status"]): StatusTone {
  if (status === "Resolved") return "success";
  if (status === "Cancelled") return "danger";
  return "warning";
}

const categoryLabel = (value: string) => CATEGORIES.find((category) => category.id === value)?.label ?? value;
const urgencyLabel = (value: string) => MAINTENANCE_URGENCY.find((urgency) => urgency.value === value)?.label ?? value;

interface RentalMaintenanceCardProps {
  requests: MaintenanceRequest[];
  loading: boolean;
  error: string | null;
}

/** Mobile's Maintenance section: active repairs as cards, then View all and Request Maintenance. */
export default function RentalMaintenanceCard({ requests, loading, error }: RentalMaintenanceCardProps) {
  const { visible, activeCount } = selectMaintenancePreview(requests);

  return (
    <DashboardCard>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-nunito text-lg font-semibold text-card-foreground">Maintenance</h2>
          <span className="rounded-full bg-muted px-3 py-1 font-nunito text-sm font-semibold text-card-foreground">
            {activeCount} Active
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Spinner color="accent" /></div>
        ) : error ? (
          <p role="alert" className="py-4 text-center font-inter text-sm text-danger">{error}</p>
        ) : visible.length === 0 ? (
          <EmptyState
            className="py-4"
            icon={IconTool}
            title="No active maintenance requests"
            description="Report an issue with your rental."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((request) => (
              <li key={request.id}>
                <Link
                  href={MAINTENANCE_HREF}
                  className="block cursor-pointer rounded-2xl border border-border bg-background p-3 no-underline transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-words font-nunito text-base font-semibold text-card-foreground">{request.title}</span>
                    <StatusChip className={`shrink-0 ${CHIP_CLASS}`} tone={statusTone(request.status)}>{request.status}</StatusChip>
                  </span>
                  <span className="mt-1 block font-inter text-sm text-muted-foreground">
                    Category: {categoryLabel(request.category)}
                  </span>
                  <span className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="font-inter text-xs text-muted-foreground">Reported {formatShortDate(request.created_at)}</span>
                    <StatusChip className={CHIP_CLASS} tone={URGENCY_TONE[request.urgency] ?? "warning"}>
                      {urgencyLabel(request.urgency)} Urgency
                    </StatusChip>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {requests.length > 0 && (
          <Link href={MAINTENANCE_HREF} className="cursor-pointer self-end font-inter text-sm font-medium text-primary no-underline hover:underline">
            View all
          </Link>
        )}
        <Link href={MAINTENANCE_HREF} className={`${buttonVariants({ size: "sm", fullWidth: true })} cursor-pointer justify-center no-underline`}>
          <IconPlus size={18} aria-hidden="true" />
          Request Maintenance
        </Link>
      </div>
    </DashboardCard>
  );
}
