"use client";

import { Chip, Pagination, Spinner } from "@heroui/react";
import { Wrench } from "lucide-react";

import { CATEGORIES } from "@/app/tenant/maintenance/data/maintenance-data";
import type { ApartmentMaintenanceHistoryItem } from "@/service/apartmentMaintenanceHistoryService";

const URGENCY_STYLE: Record<string, { bg: string; text: string }> = {
  low: { bg: "#E5E7EB", text: "#6C757D" },
  medium: { bg: "#FFF8E1", text: "#FACC15" },
  high: { bg: "#FDA4AF", text: "#E50914" },
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
  page: number;
  pageSize: number;
  showPagination: boolean;
  onPageChange: (page: number) => void;
};

export default function ApartmentMaintenanceHistory({
  items,
  total,
  loading,
  error,
  page,
  pageSize,
  showPagination,
  onPageChange,
}: ApartmentMaintenanceHistoryProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Wrench size={20} className="text-primary" />
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
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const urgencyStyle = URGENCY_STYLE[item.urgency] ?? URGENCY_STYLE.medium;
            return (
              <div key={item.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-foreground mt-0.5">
                      {categoryLabel(item.category)} · Reported {formatDate(item.created_at)}
                      {item.resolved_at ? ` · Resolved ${formatDate(item.resolved_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Chip
                      variant="soft"
                      size="sm"
                      style={{ backgroundColor: urgencyStyle.bg, color: urgencyStyle.text }}
                    >
                      {item.urgency}
                    </Chip>
                    <Chip variant="soft" size="sm" color="success">
                      Resolved
                    </Chip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showPagination && !loading && !error && totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination className="justify-center">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page === 1}
                  onPress={() => onPageChange(page - 1)}
                >
                  <Pagination.PreviousIcon />
                  <span>Previous</span>
                </Pagination.Previous>
              </Pagination.Item>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Pagination.Item key={p}>
                  <Pagination.Link isActive={p === page} onPress={() => onPageChange(p)}>
                    {p}
                  </Pagination.Link>
                </Pagination.Item>
              ))}

              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page === totalPages}
                  onPress={() => onPageChange(page + 1)}
                >
                  <span>Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
        </div>
      )}
    </div>
  );
}
