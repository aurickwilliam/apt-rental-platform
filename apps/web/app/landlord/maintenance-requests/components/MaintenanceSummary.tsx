import { Skeleton } from "@heroui/react";
import { IconClipboardList, IconCircleCheck, IconClock, IconX } from "@tabler/icons-react";

interface MaintenanceSummaryProps {
  summary?: { total: number; resolved: number; inProgress: number; cancelled: number } | null;
  loading?: boolean;
}

export default function MaintenanceSummary({ summary, loading = false }: MaintenanceSummaryProps) {
  const stats = [
    { label: "Total Requests", value: summary?.total, icon: IconClipboardList, tone: "total" },
    { label: "Resolved", value: summary?.resolved, icon: IconCircleCheck, tone: "approved" },
    { label: "In Progress", value: summary?.inProgress, icon: IconClock, tone: "pending" },
    { label: "Cancelled", value: summary?.cancelled, icon: IconX, tone: "rejected" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-hidden={loading ? "true" : undefined}>
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={`maintenance-summary-card maintenance-summary-${tone}`}>
          {loading ? <Skeleton className="size-14 shrink-0 rounded-2xl bg-skeleton!" /> : <span className="maintenance-summary-icon"><Icon size={26} aria-hidden="true" /></span>}
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? <Skeleton className="mt-1 h-9 w-12 rounded-lg bg-skeleton!" /> : <p className="mt-1 text-3xl font-nunito font-bold text-card-foreground">{value ?? "—"}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
