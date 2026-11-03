"use client";

import type { CSSProperties } from "react";
import { Button, Card, Skeleton } from "@heroui/react";
import { IconChartBar, IconReceipt, IconTool } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import type { MaintenanceOverview as Overview } from "@/service/tenantMaintenanceService";
import ErrorBanner from "@/app/components/display/ErrorBanner";

interface MaintenanceOverviewProps {
  data: Overview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const STAT_CARD_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) fit-content(50%)",
  gap: "4px 12px",
  background: "color-mix(in srgb, var(--primary) 3%, var(--card))",
  boxShadow: "none",
};

export default function MaintenanceOverview({ data, loading, error, onRetry }: MaintenanceOverviewProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content style={{ padding: 4 }}>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconChartBar size={24} aria-hidden="true" /></span>
          <h2 className="font-nunito text-xl font-bold text-card-foreground">Overview</h2>
        </div>
        <div className="space-y-4">
          <dl>
          <Card className="rounded-xl border border-border" style={{ ...STAT_CARD_STYLE, borderColor: "color-mix(in srgb, var(--primary) 25%, var(--border))" }}>
            <dt className="flex items-center gap-3 font-nunito text-base font-bold text-card-foreground"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconTool size={24} aria-hidden="true" /></span>Active requests</dt>
            <dd className="min-w-12 self-start break-words rounded-xl bg-primary/10 px-3 py-2 text-center font-nunito text-3xl font-bold text-primary">
              {loading ? <Skeleton className="h-9 w-16 rounded-lg bg-skeleton!" aria-label="Loading active request count" /> : data ? data.activeCount : "—"}
            </dd>
            <dd className="col-span-2 pl-14 text-sm text-muted-foreground">Pending and in progress</dd>
          </Card>
          </dl>
          <dl>
          <Card className="rounded-xl border border-border" style={STAT_CARD_STYLE}>
            <dt className="flex items-center gap-3 font-nunito text-base font-bold text-card-foreground"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><IconReceipt size={24} aria-hidden="true" /></span>Unpaid maintenance fees</dt>
            <dd className="min-w-12 self-start break-words rounded-xl bg-primary/10 px-3 py-2 text-center font-nunito text-2xl font-bold text-primary sm:text-3xl">
              {loading ? <Skeleton className="h-9 w-32 rounded-lg bg-skeleton!" aria-label="Loading unpaid maintenance fees" /> : data ? formatPesoDisplay(data.unpaidFees) : "—"}
            </dd>
            <dd className="col-span-2 mt-1 text-sm text-muted-foreground">All outstanding fees for your current tenancy, including previous months. Paid and waived fees are excluded.</dd>
          </Card>
          </dl>
        </div>
        {error ? <div className="space-y-3"><ErrorBanner message={error} /><Button variant="outline" size="sm" onPress={onRetry}>Retry overview</Button></div> : null}
      </Card.Content>
    </Card>
  );
}
