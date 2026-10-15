"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Chip, Popover, Separator } from "@heroui/react";
import { IconClipboardList as ClipboardList, IconFilter as Filter } from "@tabler/icons-react";

import { useTenantApplications } from "@/hooks/use-tenant-applications";
import type { ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";

import ApplicationStatusCard from "./ApplicationStatusCard";
import ApplicationStatusCardSkeleton from "./ApplicationStatusCardSkeleton";
import ApplicationsEmptyState from "./ApplicationsEmptyState";

type ApplicationSort = "pending_first" | "newest" | "oldest";

interface ApplicationFilters {
  statuses: ApplicationStatus[];
  sort: ApplicationSort;
}

const DEFAULT_FILTERS: ApplicationFilters = {
  statuses: [],
  sort: "pending_first",
};

const STATUS_OPTIONS: { label: string; value: ApplicationStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Closed", value: "closed" },
];

const SORT_OPTIONS: { label: string; value: ApplicationSort }[] = [
  { label: "Pending first", value: "pending_first" },
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
];

function applicationDate(createdAt: string): number {
  const timestamp = new Date(createdAt).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function ApplicationsList({ className = "", showHeader = true }: { className?: string; showHeader?: boolean }) {
  const { applications, loading, error } = useTenantApplications();
  const [filters, setFilters] = useState<ApplicationFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const filteredApplications = useMemo(() => {
    const filtered = filters.statuses.length > 0
      ? applications.filter((application) => filters.statuses.includes(application.status))
      : [...applications];

    return filtered.sort((first, second) => {
      if (filters.sort === "pending_first") {
        const pendingDifference = Number(second.status === "pending") - Number(first.status === "pending");
        if (pendingDifference !== 0) return pendingDifference;
      }

      const dateDifference = applicationDate(second.created_at) - applicationDate(first.created_at);
      return filters.sort === "oldest" ? -dateDifference : dateDifference;
    });
  }, [applications, filters]);
  const activeFilterCount = filters.statuses.length + Number(filters.sort !== DEFAULT_FILTERS.sort);
  const isDefaultFilter = activeFilterCount === 0;

  const toggleStatus = (status: ApplicationStatus) => {
    const statuses = filters.statuses.includes(status)
      ? filters.statuses.filter((value) => value !== status)
      : [...filters.statuses, status];
    setFilters({ ...filters, statuses });
  };

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
      <Button variant="secondary" size="sm" onPress={() => setFilters(DEFAULT_FILTERS)}>
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
            <Popover isOpen={filterOpen} onOpenChange={setFilterOpen}>
              <Badge.Anchor>
                <Button
                  variant="tertiary"
                  size="sm"
                  aria-label={activeFilterCount ? `Filter and sort applications, ${activeFilterCount} applied` : "Filter and sort applications"}
                >
                  <Filter size={16} aria-hidden="true" />
                  Filter & sort
                </Button>
                {activeFilterCount > 0 && (
                  <Badge size="sm" placement="top-right" className="bg-primary! text-white!">
                    {activeFilterCount}
                  </Badge>
                )}
              </Badge.Anchor>
              <Popover.Content placement="bottom end" className="w-[min(22rem,calc(100vw-2rem))]">
                <Popover.Dialog className="space-y-5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Popover.Heading className="font-nunito text-lg font-semibold">
                      Filter & sort
                    </Popover.Heading>
                    {!isDefaultFilter && (
                      <Button variant="ghost" size="sm" onPress={() => setFilters(DEFAULT_FILTERS)} className="text-danger">
                        Reset
                      </Button>
                    )}
                  </div>

                  <div>
                    <p className="mb-3 text-sm font-inter text-muted-foreground">Status</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((option) => {
                        const selected = filters.statuses.includes(option.value);
                        return (
                          <Chip
                            key={option.value}
                            variant="soft"
                            color={selected ? "accent" : "default"}
                            onClick={() => toggleStatus(option.value)}
                            className="cursor-pointer"
                          >
                            {option.label}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="mb-3 text-sm font-inter text-muted-foreground">Sort by</p>
                    <div className="flex flex-wrap gap-2">
                      {SORT_OPTIONS.map((option) => {
                        const selected = filters.sort === option.value;
                        return (
                          <Chip
                            key={option.value}
                            variant="soft"
                            color={selected ? "accent" : "default"}
                            onClick={() => setFilters({ ...filters, sort: option.value })}
                            className="cursor-pointer"
                          >
                            {option.label}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>

                  <Button className="w-full" onPress={() => setFilterOpen(false)}>
                    Done
                  </Button>
                </Popover.Dialog>
              </Popover.Content>
            </Popover>
          </div>
        </div>
      )}

      {content}
    </div>
  );
}
