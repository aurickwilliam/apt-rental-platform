"use client";

import { useState } from "react";
import { Pagination } from "@heroui/react";
import ActiveFilterTags from "../_components/filters/ActiveFilterTags";
import AdminFilterToolbar from "../_components/filters/AdminFilterToolbar";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import FilterPopover from "../_components/filters/FilterPopover";
import type { ActiveFilterTag, FilterOption } from "../_components/filters/types";
import { useListFilters } from "../_components/filters/use-list-filters";
import {
  reportFilterParams,
  type ReportFilters,
  type UserReportStatusFilter,
  type UserReportTargetTypeFilter,
} from "@/lib/user-reports";
import ReportsTable from "./components/ReportsTable";
import ReportCardList from "./components/ReportCardList";
import ReportReviewModal from "./components/ReportReviewModal";
import ReportsListSkeleton from "./components/ReportsListSkeleton";
import type { AdminUserReport } from "./lib/report-types";
import EmptyState from "@/app/components/display/EmptyState";
import { IconFlag } from "@tabler/icons-react";

const STATUS_OPTIONS: readonly FilterOption<UserReportStatusFilter>[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
];

const TYPE_OPTIONS: readonly FilterOption<UserReportTargetTypeFilter>[] = [
  { id: "all", label: "All" },
  { id: "apartment", label: "Apartments" },
  { id: "landlord", label: "Landlords" },
  { id: "tenant", label: "Tenants" },
  { id: "user", label: "Chats" },
  { id: "review_request", label: "Review requests" },
];

// Every report, open or closed, is shown with no filter applied, so a report stays listed after it is handled.
const DEFAULT_FILTERS = { status: "all", type: "all" } as const;

interface ReportsClientProps {
  reports: AdminUserReport[];
  error: boolean;
  filters: ReportFilters;
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function ReportsClient({
  reports,
  error,
  filters: appliedFilters,
  page: appliedPage,
  totalCount,
  pageSize,
}: ReportsClientProps) {
  const list = useListFilters({
    pathname: "/admin/reports",
    filters: appliedFilters,
    page: appliedPage,
    toParams: reportFilterParams,
  });
  const { filters, page } = list;
  const { status, type } = filters;
  const isNavigating = list.isPending;
  const [draft, setDraft] = useState({ status: filters.status, type: filters.type });
  // The open report is looked up by id so it reflects the refreshed list.
  const [openId, setOpenId] = useState<string | null>(null);
  const openReport = reports.find((report) => report.id === openId) ?? null;

  const activeTags: ActiveFilterTag[] = [];
  if (status !== DEFAULT_FILTERS.status) {
    activeTags.push({
      id: "status",
      label: `Status: ${STATUS_OPTIONS.find((option) => option.id === status)?.label ?? status}`,
    });
  }
  if (type !== DEFAULT_FILTERS.type) {
    activeTags.push({
      id: "type",
      label: `Type: ${TYPE_OPTIONS.find((option) => option.id === type)?.label ?? type}`,
    });
  }

  function removeTags(ids: string[]) {
    list.apply({
      ...(ids.includes("status") ? { status: DEFAULT_FILTERS.status } : {}),
      ...(ids.includes("type") ? { type: DEFAULT_FILTERS.type } : {}),
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <AdminFilterToolbar
          searchLabel="Search reports"
          searchPlaceholder="Search by name or apartment"
          searchValue={list.search}
          onSearchChange={list.changeSearch}
          onSearchSubmit={list.submitSearch}
          onSearchClear={list.clearSearch}
          refreshLabel="Refresh reports"
          onRefresh={list.refresh}
        >
          <FilterPopover
            activeCount={activeTags.length}
            onOpen={() => setDraft({ status, type })}
            onReset={() => setDraft({ ...DEFAULT_FILTERS })}
            onApply={() => list.apply({ status: draft.status, type: draft.type })}
          >
            <FilterPillGroup
              label="Status"
              selectionMode="single"
              options={STATUS_OPTIONS}
              value={draft.status}
              onChange={(nextStatus) => setDraft((current) => ({ ...current, status: nextStatus }))}
            />
            <FilterPillGroup
              label="Type"
              selectionMode="single"
              options={TYPE_OPTIONS}
              value={draft.type}
              onChange={(nextType) => setDraft((current) => ({ ...current, type: nextType }))}
            />
          </FilterPopover>
        </AdminFilterToolbar>
        <ActiveFilterTags
          tags={activeTags}
          onRemove={removeTags}
          onClearAll={() => list.apply({ ...DEFAULT_FILTERS })}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load reports. Refresh and try again.
        </p>
      ) : (
        <>
          {isNavigating ? (
            <ReportsListSkeleton />
          ) : reports.length ? (
            <>
              <ReportsTable reports={reports} onOpen={(report) => setOpenId(report.id)} />
              <ReportCardList reports={reports} onOpen={(report) => setOpenId(report.id)} />
            </>
          ) : (
            <EmptyState
              icon={IconFlag}
              title={filters.q ? "No matching reports" : status === "open" ? "No open reports" : "No reports here"}
              description="Reports about apartments, landlords, tenants and chats will appear here for review."
            />
          )}

          {totalPages > 1 ? (
            <nav aria-label="Reports pagination" className="flex justify-center">
              <Pagination>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 1}
                      onPress={() => list.goToPage(page - 1)}
                      className="font-nunito text-primary"
                    >
                      <Pagination.PreviousIcon />
                      <span>Previous</span>
                    </Pagination.Previous>
                  </Pagination.Item>
                  {visiblePages.map((number) => (
                    <Pagination.Item key={number}>
                      <Pagination.Link
                        isActive={number === page}
                        onPress={() => list.goToPage(number)}
                      >
                        {number}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages}
                      onPress={() => list.goToPage(page + 1)}
                      className="font-nunito text-primary"
                    >
                      <span>Next</span>
                      <Pagination.NextIcon />
                    </Pagination.Next>
                  </Pagination.Item>
                </Pagination.Content>
              </Pagination>
            </nav>
          ) : null}
        </>
      )}
      <ReportReviewModal report={openReport} onClose={() => setOpenId(null)} />
    </div>
  );
}
