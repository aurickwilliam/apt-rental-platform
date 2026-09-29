"use client";

import { COLORS } from "@repo/constants";
import type { ChartConfig } from "@/components/ui/chart";
import type { ApplicationStatusCounts } from "../types";
import Panel from "./Panel";
import StatusDonut from "./StatusDonut";

const applicationStatusConfig = {
  pending: { label: "Pending", color: COLORS.light.warning },
  approved: { label: "Approved", color: COLORS.light.success },
  rejected: { label: "Rejected", color: "var(--destructive)" },
  cancelled: { label: "Cancelled", color: "var(--muted-foreground)" },
  closed: { label: "Closed", color: "var(--foreground)" },
} satisfies ChartConfig;

interface ApplicationStatusPanelProps {
  applicationStatus: ApplicationStatusCounts | null;
}

export default function ApplicationStatusPanel({
  applicationStatus,
}: ApplicationStatusPanelProps) {
  const applicationSlices = applicationStatus
    ? [
        { name: "pending", value: applicationStatus.pending },
        { name: "approved", value: applicationStatus.approved },
        { name: "rejected", value: applicationStatus.rejected },
        { name: "cancelled", value: applicationStatus.cancelled },
        ...(applicationStatus.closed
          ? [{ name: "closed", value: applicationStatus.closed }]
          : []),
      ]
    : [];
  return (
    <Panel
      title="Application Status"
      description="Current status of all rental applications · not limited to the selected reporting period."
    >
      {applicationStatus === null ? (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          Application status is unavailable. Refresh and try again.
        </p>
      ) : applicationStatus.total ? (
        <StatusDonut
          data={applicationSlices}
          config={applicationStatusConfig}
          total={applicationStatus.total}
          centerLabel="Applications"
          showPercent
        />
      ) : (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          No rental applications yet.
        </p>
      )}
    </Panel>
  );
}
