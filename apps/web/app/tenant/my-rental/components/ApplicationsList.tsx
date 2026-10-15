"use client";

import { useState } from "react";
import { Button, Dropdown, Label } from "@heroui/react";
import { IconClipboardList as ClipboardList, IconFilter as Filter } from "@tabler/icons-react";

import { useTenantApplications } from "@/hooks/use-tenant-applications";
import type { ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";

import ApplicationStatusCard from "./ApplicationStatusCard";
import ApplicationStatusCardSkeleton from "./ApplicationStatusCardSkeleton";
import ApplicationsEmptyState from "./ApplicationsEmptyState";

const FILTER_OPTIONS: { id: "all" | ApplicationStatus; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "cancelled", label: "Cancelled" },
  { id: "closed", label: "Closed" },
];

export default function ApplicationsList({ className = "", showHeader = true }: { className?: string; showHeader?: boolean }) {
  const { applications, loading, error } = useTenantApplications();
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const filteredApplications = statusFilter === "all"
    ? applications
    : applications.filter((application) => application.status === statusFilter);

  const content = loading ? (
    <div className="flex flex-col gap-3">
      <ApplicationStatusCardSkeleton />
      <ApplicationStatusCardSkeleton />
      <ApplicationStatusCardSkeleton />
    </div>
  ) : error ? (
    <p className="text-sm text-red-600">{error}</p>
  ) : applications.length === 0 ? (
    <ApplicationsEmptyState />
  ) : filteredApplications.length === 0 ? (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
      <p className="text-lg font-nunito font-semibold text-card-foreground">No matching applications</p>
      <p className="text-sm font-inter text-muted-foreground">
        Try another status to see your applications.
      </p>
      <Button variant="secondary" size="sm" onPress={() => setStatusFilter("all")}>
        Clear filter
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-3">
      {filteredApplications.map((a) => (
        <ApplicationStatusCard
          key={a.id}
          id={a.id}
          status={a.status}
          apartmentName={a.apartments?.name ?? null}
          apartmentId={a.apartment_id}
          createdAt={a.created_at}
          location={[
            a.apartments?.street_address,
            a.apartments?.barangay,
            a.apartments?.city,
            a.apartments?.province,
            a.apartments?.zip_code?.toString(),
          ]
            .filter(Boolean)
            .join(", ")}
          thumbnailUrl={
            a.apartments?.apartment_images?.find((image) => image.is_cover)?.url ??
            a.apartments?.apartment_images?.[0]?.url ??
            null
          }
        />
      ))}
    </div>
  );

  return (
    <div className={`flex flex-col ${showHeader ? "gap-6 pt-4" : "gap-3"} ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-card-foreground">My Applications</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-sm font-inter text-muted-foreground">
              {loading
                ? "Loading Applications..."
                : `${filteredApplications.length} Application${filteredApplications.length === 1 ? "" : "s"}`}
            </p>
            <Dropdown>
              <Button variant="tertiary" size="sm" aria-label="Filter applications by status">
                <Filter size={16} aria-hidden="true" />
                Filter
              </Button>
              <Dropdown.Popover placement="bottom end" className="min-w-44">
                <Dropdown.Menu
                  aria-label="Filter applications by status"
                  selectionMode="single"
                  disallowEmptySelection
                  selectedKeys={new Set([statusFilter])}
                  onSelectionChange={(keys) => {
                    if (keys === "all") return;
                    const [next] = Array.from(keys);
                    if (next !== undefined) setStatusFilter(next as "all" | ApplicationStatus);
                  }}
                >
                  {FILTER_OPTIONS.map((option) => (
                    <Dropdown.Item key={option.id} id={option.id} textValue={option.label} className="cursor-pointer">
                      <Dropdown.ItemIndicator className="text-primary!" />
                      <Label>{option.label}</Label>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      )}

      {content}
    </div>
  );
}
