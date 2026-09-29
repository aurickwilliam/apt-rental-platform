import { IconTools } from "@tabler/icons-react";
import { Card, Chip, Separator } from "@heroui/react";
import { submittedFormatter } from "../../../verification/lib/verification-display";
import { DetailEmptyState, MetricItem } from "./UserDetailPrimitives";

export interface UserMaintenanceItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  apartment_name: string;
}

export interface MaintenanceBreakdown {
  total: number;
  pending: number;
  active: number;
  resolved: number;
}

interface UserMaintenanceProps {
  items: UserMaintenanceItem[];
  breakdown: MaintenanceBreakdown;
}

export default function UserMaintenance({
  items,
  breakdown,
}: UserMaintenanceProps) {
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
      <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
        <IconTools size={20} className="shrink-0 text-primary" aria-hidden="true" />
        Maintenance
      </h2>
      <div className="mt-3 grid grid-cols-4 gap-4">
        <MetricItem value={String(breakdown.total)} label="Total" />
        <MetricItem value={String(breakdown.pending)} label="Pending" />
        <MetricItem value={String(breakdown.active)} label="Active" />
        <MetricItem value={String(breakdown.resolved)} label="Resolved" />
      </div>
      {items.length ? (
        <>
          <Separator className="my-3" />
          <ul className="space-y-2 text-sm">
          {items.slice(0, 3).map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="min-w-0">
                <span className="font-medium wrap-break-word">{item.title}</span>{" "}
                <span className="text-muted-foreground">
                  · {item.apartment_name} ·{" "}
                  {submittedFormatter.format(new Date(item.created_at))}
                </span>
              </span>
              <Chip size="sm" variant="soft" className="shrink-0 capitalize">
                {item.status.replaceAll("_", " ")}
              </Chip>
            </li>
          ))}
          </ul>
        </>
      ) : (
        <DetailEmptyState>No maintenance requests</DetailEmptyState>
      )}
      </Card.Content>
    </Card>
  );
}
