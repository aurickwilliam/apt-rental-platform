"use client";

import type { ReactNode } from "react";

import { formatPesoDisplay } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";

import { describeLeaseProgress, formatRentDueDay } from "../lease-progress";
import { formatShortDate } from "../utils";
import DashboardCard from "./DashboardCard";

interface LeaseOverviewCardProps {
  leaseStart: string;
  /** Null for an open-ended lease. */
  leaseEnd: string | null;
  /** The agreed rent from the tenancy; null hides the figure. */
  monthlyRent: number | null;
  rentDueDay: number;
  today: Date;
  /** The signed-lease section, drawn under the lease facts. */
  children?: ReactNode;
}

function LeaseFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/50 px-3 py-2.5">
      <p className="font-inter text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-nunito text-sm font-semibold text-card-foreground">{value}</p>
    </div>
  );
}

/** Everything about the lease in one place: how far along it is, its terms and the signed contract. */
export default function LeaseOverviewCard({ leaseStart, leaseEnd, monthlyRent, rentDueDay, today, children }: LeaseOverviewCardProps) {
  const progress = describeLeaseProgress(leaseStart, leaseEnd, today);

  return (
    <DashboardCard>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-nunito text-lg font-semibold text-card-foreground">Your lease</h2>
        <StatusChip className="font-nunito text-[11px] font-semibold" tone={progress.ended ? "danger" : "neutral"}>
          {progress.remainingLabel}
        </StatusChip>
      </div>

      {progress.percent !== null && (
        <div
          role="progressbar"
          aria-label="Lease progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
        </div>
      )}
      <div className="mt-2 flex flex-wrap justify-between gap-x-3 font-inter text-xs text-muted-foreground">
        <span>Started {formatShortDate(leaseStart)}</span>
        <span>{leaseEnd ? `Ends ${formatShortDate(leaseEnd)}` : "No end date"}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {monthlyRent !== null && <LeaseFact label="Monthly rent" value={formatPesoDisplay(monthlyRent)} />}
        <LeaseFact label="Due every" value={formatRentDueDay(rentDueDay)} />
      </div>

      {children}
    </DashboardCard>
  );
}
