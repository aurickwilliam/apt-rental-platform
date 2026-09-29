"use client";

import { COLORS } from "@repo/constants";
import type { ChartConfig } from "@/components/ui/chart";
import type { AnalyticsMetrics } from "../types";
import Panel from "./Panel";
import StatusDonut from "./StatusDonut";

const maintenanceConfig = {
  pending: { label: "Pending", color: COLORS.light.warning },
  inProgress: { label: "In progress", color: "var(--primary)" },
  resolved: { label: "Resolved", color: COLORS.light.success },
  cancelled: { label: "Cancelled", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

interface MaintenanceRequestsPanelProps {
  maintenance: AnalyticsMetrics["maintenance"];
}

export default function MaintenanceRequestsPanel({
  maintenance: counts,
}: MaintenanceRequestsPanelProps) {
  const maintenance = [
    { name: "pending", value: counts.pending },
    { name: "inProgress", value: counts.inProgress },
    { name: "resolved", value: counts.resolved },
    { name: "cancelled", value: counts.cancelled },
  ];
  return (
    <Panel
      title="Maintenance Requests"
      description="Requests created within the selected reporting period, grouped by current status."
    >
      {counts.total ? (
        <StatusDonut
          data={maintenance}
          config={maintenanceConfig}
          total={counts.total}
          centerLabel="Requests"
          className="lg:flex-col"
          chartClassName="xl:size-40 2xl:size-52"
        />
      ) : (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          No maintenance requests were created in this period.
        </p>
      )}
    </Panel>
  );
}
