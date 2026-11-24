"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Drawer, Popover, Separator } from "@heroui/react";
import { IconAdjustmentsHorizontal, IconX } from "@tabler/icons-react";

import { getApplicationStatusStyle, type ApplicationStatus } from "@/app/tenant/applications/lib/statusStyles";
import type { TenantApplication } from "@/hooks/use-tenant-applications";
import {
  APPLICATION_STATUSES,
  applicationListHref,
  DEFAULT_APPLICATION_FILTERS,
  DEFAULT_APPLICATION_SORT,
  filterApplicationList,
  type ApplicationListFilters,
  type ApplicationSort,
} from "@/lib/application-navigation";

import ApplicationHistoryRow from "./ApplicationHistoryRow";

const SORT_OPTIONS: { label: string; value: ApplicationSort }[] = [
  { label: "Pending first", value: "pending_first" },
  { label: "Newest first", value: "newest" },
  { label: "Oldest first", value: "oldest" },
];

const HEADER_ICON_BUTTON_CLASS = "size-10 shrink-0 cursor-pointer";
const FILTER_BUTTON_CLASS = "min-h-11 cursor-pointer";
const SELECTED_FILTER_CLASS = `${FILTER_BUTTON_CLASS} bg-[#2F5FE0]! text-white! dark:bg-[#5B8BF7]!`;

interface ApplicationHistoryDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  applications: TenantApplication[];
}

/**
 * Right-hand panel listing the tenant's applications while a lease is active.
 * The status filter and sort sit in a popover behind one filter icon; they are
 * local to the panel, start over each time it opens and never touch the page URL.
 */
export default function ApplicationHistoryDrawer({ isOpen, onOpenChange, applications }: ApplicationHistoryDrawerProps) {
  return (
    <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="flex h-full w-[calc(100vw-1rem)] max-w-md flex-col rounded-l-3xl p-0">
            <ApplicationHistoryPanel applications={applications} onClose={() => onOpenChange(false)} />
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

/** Mounted only while the drawer is open, so its filters reset on close. */
function ApplicationHistoryPanel({ applications, onClose }: { applications: TenantApplication[]; onClose: () => void }) {
  const [filters, setFilters] = useState<ApplicationListFilters>(DEFAULT_APPLICATION_FILTERS);
  const visible = useMemo(() => filterApplicationList(applications, filters), [applications, filters]);
  // Only statuses the tenant actually has, each with how many.
  const statusCounts = useMemo(
    () =>
      APPLICATION_STATUSES
        .map((status) => ({ status, count: applications.filter((application) => application.status === status).length }))
        .filter(({ count }) => count > 0),
    [applications],
  );
  const returnHref = applicationListHref(DEFAULT_APPLICATION_FILTERS);

  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilterCount = filters.statuses.length + Number(filters.sort !== DEFAULT_APPLICATION_SORT);
  const filterLabel = activeFilterCount
    ? `Filter and sort applications, ${activeFilterCount} applied`
    : "Filter and sort applications";

  const toggleStatus = (status: ApplicationStatus) =>
    setFilters((current) => ({
      ...current,
      statuses: current.statuses.includes(status)
        ? current.statuses.filter((value) => value !== status)
        : [...current.statuses, status],
    }));
  const clearStatuses = () => setFilters((current) => ({ ...current, statuses: [] }));

  return (
    <>
      <Drawer.Header className="flex flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <Drawer.Heading className="font-nunito text-xl font-bold">Application history</Drawer.Heading>
          <p className="mt-1 font-inter text-sm text-muted-foreground" aria-live="polite">
            {visible.length === applications.length
              ? `${applications.length} application${applications.length === 1 ? "" : "s"}`
              : `Showing ${visible.length} of ${applications.length}`}
          </p>
        </div>

        {/* Filter & sort, then Close: both in the header's flow so they never overlap. */}
        <div className="flex shrink-0 items-center gap-3">
          <Popover isOpen={filterOpen} onOpenChange={setFilterOpen}>
            <Badge.Anchor>
              <Button isIconOnly variant="tertiary" aria-label={filterLabel} className={HEADER_ICON_BUTTON_CLASS}>
                <IconAdjustmentsHorizontal size={20} aria-hidden="true" />
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
                  <Popover.Heading className="font-nunito text-lg font-semibold">Filter & sort</Popover.Heading>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setFilters(DEFAULT_APPLICATION_FILTERS)}
                      className="cursor-pointer text-danger"
                    >
                      Reset
                    </Button>
                  )}
                </div>

                <div>
                  <p className="mb-3 font-inter text-sm text-muted-foreground">Status</p>
                  <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
                    {statusCounts.map(({ status, count }) => {
                      const selected = filters.statuses.includes(status);
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={selected ? "primary" : "secondary"}
                          aria-pressed={selected}
                          onPress={() => toggleStatus(status)}
                          className={selected ? SELECTED_FILTER_CLASS : FILTER_BUTTON_CLASS}
                        >
                          {getApplicationStatusStyle(status).label} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-3 font-inter text-sm text-muted-foreground">Sort by</p>
                  <div role="group" aria-label="Sort applications" className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((option) => {
                      const selected = filters.sort === option.value;
                      return (
                        <Button
                          key={option.value}
                          size="sm"
                          variant={selected ? "primary" : "secondary"}
                          aria-pressed={selected}
                          onPress={() => setFilters((current) => ({ ...current, sort: option.value }))}
                          className={selected ? SELECTED_FILTER_CLASS : FILTER_BUTTON_CLASS}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <Button className="w-full cursor-pointer" onPress={() => setFilterOpen(false)}>
                  Done
                </Button>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
          <Button
            isIconOnly
            variant="tertiary"
            aria-label="Close application history"
            onPress={onClose}
            className={HEADER_ICON_BUTTON_CLASS}
          >
            <IconX size={20} aria-hidden="true" />
          </Button>
        </div>
      </Drawer.Header>

      <Drawer.Body className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-5 py-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center">
            <p className="font-nunito text-base font-semibold text-card-foreground">No matching applications</p>
            <p className="font-inter text-sm text-muted-foreground">Try another status to see your applications.</p>
            <Button variant="secondary" size="sm" onPress={clearStatuses} className="cursor-pointer">
              Clear filter
            </Button>
          </div>
        ) : (
          visible.map((application) => (
            <ApplicationHistoryRow key={application.id} application={application} returnHref={returnHref} />
          ))
        )}
      </Drawer.Body>
    </>
  );
}
