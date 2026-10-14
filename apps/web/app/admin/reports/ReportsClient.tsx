"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination, Spinner } from "@heroui/react";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import type { FilterOption } from "../_components/filters/types";
import type { UserReportStatusFilter } from "@/lib/user-reports";
import ReportsTable from "./components/ReportsTable";
import ReportCardList from "./components/ReportCardList";
import ReportsEmptyState from "./components/ReportsEmptyState";
import type { AdminUserReport } from "./lib/report-types";

const STATUS_OPTIONS: readonly FilterOption<UserReportStatusFilter>[] = [
  { id: "open", label: "Open" },
  { id: "resolved", label: "Resolved" },
  { id: "dismissed", label: "Dismissed" },
  { id: "all", label: "All" },
];

interface ReportsClientProps {
  reports: AdminUserReport[];
  error: boolean;
  status: UserReportStatusFilter;
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function ReportsClient({
  reports,
  error,
  status,
  page,
  totalCount,
  pageSize,
}: ReportsClientProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function navigate(nextStatus: UserReportStatusFilter, nextPage: number) {
    startTransition(() => {
      router.push(`/admin/reports?status=${nextStatus}&page=${nextPage}`);
    });
  }

  return (
    <div className="space-y-5">
      <FilterPillGroup
        label="Status"
        selectionMode="single"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(nextStatus) => navigate(nextStatus, 1)}
      />

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
              <ReportsEmptyState status={status} />
            )}
          </div>

          {totalPages > 1 ? (
            <nav aria-label="Reports pagination" className="flex justify-center">
              <Pagination>
                <Pagination.Content>
                  <Pagination.Item>
                    <Pagination.Previous
                      isDisabled={page <= 1}
                      onPress={() => navigate(status, page - 1)}
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
                        onPress={() => navigate(status, number)}
                      >
                        {number}
                      </Pagination.Link>
                    </Pagination.Item>
                  ))}
                  <Pagination.Item>
                    <Pagination.Next
                      isDisabled={page >= totalPages}
                      onPress={() => navigate(status, page + 1)}
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
