"use client";

import { Spinner } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import { IconTools } from "@tabler/icons-react";

import { CATEGORIES } from "@/app/tenant/maintenance/data/maintenance-data";
import type { ApartmentMaintenanceHistoryItem } from "@/service/apartmentMaintenanceHistoryService";

// Same tones as mobile's useMaintenanceRequestUrgencyStyles.
const URGENCY_STYLE: Record<string, { tone: StatusTone }> = {
  low: { tone: "neutral" },
  medium: { tone: "warning" },
  high: { tone: "danger" },
};

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.id === value)?.label ?? value;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

type ApartmentMaintenanceHistoryProps = {
  items: ApartmentMaintenanceHistoryItem[];
  total: number;
  loading: boolean;
  error: string | null;
};

export default function ApartmentMaintenanceHistory({
  items,
  total,
  loading,
  error,
}: ApartmentMaintenanceHistoryProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <IconTools size={20} className="text-primary" />
        <h2 className="text-lg font-medium text-foreground">Maintenance history</h2>
      </div>
      <p className="text-sm text-foreground mb-4">
        {total === 0
          ? "Resolved repairs for this apartment will appear here."
          : `${total} resolved ${total === 1 ? "repair" : "repairs"} for this apartment.`}
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner color="accent" aria-label="Loading maintenance history" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-foreground text-center py-6">
          No resolved maintenance yet.
        </p>
      ) : (
        <div className="flex flex-col gap-3 max-h-[580px] overflow-y-auto pr-1">
          {items.map((item) => {
            const urgencyStyle = URGENCY_STYLE[item.urgency] ?? URGENCY_STYLE.medium;
            return (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-foreground mt-0.5">
                    {categoryLabel(item.category)} · Reported {formatDate(item.created_at)}
                    {item.resolved_at ? ` · Resolved ${formatDate(item.resolved_at)}` : ""}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusChip
                    size="sm"
                    tone={urgencyStyle.tone}
                  >
                    {item.urgency}
                  </StatusChip>
                  <StatusChip size="sm" tone="success">
                    Resolved
                  </StatusChip>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
