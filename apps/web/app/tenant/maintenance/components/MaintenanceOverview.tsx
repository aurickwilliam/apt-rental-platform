"use client";

import { Button, Card, Skeleton } from "@heroui/react";
import { IconReceipt, IconTool } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import type { MaintenanceOverview as Overview } from "@/service/tenantMaintenanceService";
import ErrorBanner from "@/app/components/display/ErrorBanner";

interface MaintenanceOverviewProps {
  data: Overview | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function MaintenanceOverview({ data, loading, error, onRetry }: MaintenanceOverviewProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <Card.Content className="space-y-5 p-6">
        <h2 className="font-nunito text-base font-semibold text-card-foreground">Overview</h2>
        <dl className="space-y-5">
          <div>
            <dt className="flex items-center gap-2 text-sm text-muted-foreground"><IconTool size={18} aria-hidden="true" />Active requests</dt>
            <dd className="mt-2 font-nunito text-3xl font-bold text-primary">
              {loading ? <Skeleton className="h-9 w-16 rounded-lg bg-skeleton!" aria-label="Loading active request count" /> : data ? data.activeCount : "—"}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">Pending and in progress</dd>
          </div>
          <div className="border-t border-border pt-5">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground"><IconReceipt size={18} aria-hidden="true" />Unpaid maintenance fees</dt>
            <dd className="mt-2 break-words font-nunito text-3xl font-bold text-primary">
              {loading ? <Skeleton className="h-9 w-32 rounded-lg bg-skeleton!" aria-label="Loading unpaid maintenance fees" /> : data ? formatPesoDisplay(data.unpaidFees) : "—"}
            </dd>
            <dd className="mt-1 text-xs text-muted-foreground">All outstanding fees for your current tenancy, including previous months. Paid and waived fees are excluded.</dd>
          </div>
        </dl>
        {error ? <div className="space-y-3"><ErrorBanner message={error} /><Button variant="outline" size="sm" onPress={onRetry}>Retry overview</Button></div> : null}
      </Card.Content>
    </Card>
  );
}
