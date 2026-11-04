"use client";

import { COLORS } from "@repo/constants";
import type { ChartConfig } from "@/components/ui/chart";
import type { AnalyticsMetrics } from "../types";
import Panel from "./Panel";
import StatusDonut from "./StatusDonut";
import EmptyState from "@/app/components/display/EmptyState";
import { IconTools } from "@tabler/icons-react";

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
        <EmptyState
          framed
          className="mt-5 py-8"
          icon={IconTools}
          title="No maintenance requests"
          description="None were created in this period."
        />
      )}
    </Panel>
  );
}
