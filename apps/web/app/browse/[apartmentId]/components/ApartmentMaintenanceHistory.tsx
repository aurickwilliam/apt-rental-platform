"use client";

import { Spinner } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import { IconTools } from "@tabler/icons-react";

import { formatDate, MAINTENANCE_CATEGORY_KEYS, MAINTENANCE_URGENCY_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { CATEGORIES } from "@/app/tenant/maintenance/data/maintenance-data";
import type { ApartmentMaintenanceHistoryItem } from "@/service/apartmentMaintenanceHistoryService";

// Same tones as mobile's useMaintenanceRequestUrgencyStyles.
const URGENCY_STYLE: Record<string, { tone: StatusTone }> = {
  low: { tone: "neutral" },
  medium: { tone: "warning" },
  high: { tone: "danger" },
};

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
  const { language, t } = useTranslation();

  const categoryLabel = (value: string) => {
    if (MAINTENANCE_CATEGORY_KEYS[value]) {
      return enumLabel(language, MAINTENANCE_CATEGORY_KEYS, value);
    }
    return CATEGORIES.find((c) => c.id === value)?.label ?? value;
  };

  const formatHistoryDate = (value: string | null) => {
    if (!value) return "—";
    return formatDate(value, "short", language);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <IconTools size={20} className="text-primary" />
        <h2 className="font-nunito text-lg font-semibold text-foreground">{t("apartment.maintenance.title")}</h2>
      </div>
      <p className="text-sm text-foreground mb-4">
        {total === 0
          ? t("apartment.maintenance.emptyHint")
          : total === 1
            ? t("apartment.maintenance.count", { count: total })
            : t("apartment.maintenance.countPlural", { count: total })}
      </p>

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner color="accent" aria-label={t("apartment.maintenance.loadingAria")} />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-foreground text-center py-6">
          {t("apartment.maintenance.empty")}
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
                    {categoryLabel(item.category)} · {t("apartment.maintenance.reported", { date: formatHistoryDate(item.created_at) })}
                    {item.resolved_at ? ` · ${t("apartment.maintenance.resolved", { date: formatHistoryDate(item.resolved_at) })}` : ""}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusChip
                    size="sm"
                    tone={urgencyStyle.tone}
                  >
                    {enumLabel(language, MAINTENANCE_URGENCY_KEYS, item.urgency)}
                  </StatusChip>
                  <StatusChip size="sm" tone="success">
                    {t("apartment.maintenance.resolvedStatus")}
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
