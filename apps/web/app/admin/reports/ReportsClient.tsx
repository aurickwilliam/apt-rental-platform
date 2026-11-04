"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination, Spinner } from "@heroui/react";
import ActiveFilterTags from "../_components/filters/ActiveFilterTags";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import FilterPopover from "../_components/filters/FilterPopover";
import type { ActiveFilterTag, FilterOption } from "../_components/filters/types";
import type { UserReportStatusFilter, UserReportTargetTypeFilter } from "@/lib/user-reports";
import ReportsTable from "./components/ReportsTable";
import ReportCardList from "./components/ReportCardList";
import type { AdminUserReport } from "./lib/report-types";
import EmptyState from "@/app/components/display/EmptyState";
import { IconFlag } from "@tabler/icons-react";

const STATUS_OPTIONS: readonly FilterOption<UserReportStatusFilter>[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

const TYPE_OPTIONS: readonly FilterOption<UserReportTargetTypeFilter>[] = [
  { id: "all", label: "All" },
  { id: "apartment", label: "Apartments" },
  { id: "landlord", label: "Landlords" },
  { id: "tenant", label: "Tenants" },
  { id: "user", label: "Chats" },
];

// Open reports of every kind are what the page shows with no filter applied.
const DEFAULT_FILTERS: { status: UserReportStatusFilter; type: UserReportTargetTypeFilter } = {
  status: "open",
  type: "all",
};

interface ReportsClientProps {
  reports: AdminUserReport[];
  error: boolean;
  status: UserReportStatusFilter;
  type: UserReportTargetTypeFilter;
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function ReportsClient({
  reports,
  error,
  status,
  type,
  page,
  totalCount,
  pageSize,
}: ReportsClientProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [draft, setDraft] = useState({ status, type });

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

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function navigate(nextStatus: UserReportStatusFilter, nextType: UserReportTargetTypeFilter, nextPage: number) {
    startTransition(() => {
      router.push(`/admin/reports?status=${nextStatus}&type=${nextType}&page=${nextPage}`);
    });
  }

  function removeTags(ids: string[]) {
    navigate(
      ids.includes("status") ? DEFAULT_FILTERS.status : status,
      ids.includes("type") ? DEFAULT_FILTERS.type : type,
      1,
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex justify-end">
          <FilterPopover
            activeCount={activeTags.length}
            onOpen={() => setDraft({ status, type })}
            onReset={() => setDraft(DEFAULT_FILTERS)}
            onApply={() => navigate(draft.status, draft.type, 1)}
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
        </div>
        <ActiveFilterTags
          tags={activeTags}
          onRemove={removeTags}
          onClearAll={() => navigate(DEFAULT_FILTERS.status, DEFAULT_FILTERS.type, 1)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load reports. Refresh and try again.
        </p>
      ) : (
        <>
          <div aria-busy={isNavigating} className="relative">
            {isNavigating ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
                <Spinner
                  size="lg"
                  color="current"
                  className="text-primary"
                  aria-label="Loading reports"
                />
              </div>
            ) : null}
            {reports.length ? (
              <>
                <ReportsTable reports={reports} />
                <ReportCardList reports={reports} />
              </>
            ) : (
              <EmptyState
                icon={IconFlag}
                title={status === "open" ? "No open reports" : "No reports here"}
                description="Reports about apartments, landlords, tenants and chats will appear here for review."
              />
            )}
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Reports pagination" className="flex justify-center">
              <Pagination>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 1}
                      onPress={() => navigate(status, type, page - 1)}
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
                        onPress={() => navigate(status, type, number)}
                      >
                        {number}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages}
                      onPress={() => navigate(status, type, page + 1)}
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
    </div>
  );
}
