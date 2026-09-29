"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pagination, Spinner } from "@heroui/react";
import ActivityTable from "./components/ActivityTable";
import ActivityCardList from "./components/ActivityCardList";
import ActivityEmptyState from "./components/ActivityEmptyState";
import type { AdminActivityEvent } from "./lib/activity-display";

interface ActivityClientProps {
  events: AdminActivityEvent[];
  error: boolean;
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function ActivityClient({
  events,
  error,
  page,
  totalCount,
  pageSize,
}: ActivityClientProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function changePage(nextPage: number) {
    startTransition(() => {
      router.push(`/admin/activity?page=${nextPage}`);
    });
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load activity. Refresh and try again.
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
                  aria-label="Loading activity"
                />
              </div>
            ) : null}
            {events.length ? (
              <>
                <ActivityTable events={events} />
                <ActivityCardList events={events} />
              </>
            ) : (
              <ActivityEmptyState />
            )}
          </div>

          <nav
            aria-label="Activity pagination"
            className="flex justify-center"
          >
            <Pagination>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => changePage(page - 1)}
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
                      onPress={() => changePage(number)}
                    >
                      {number}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => changePage(page + 1)}
                    className="font-nunito text-primary"
                  >
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </nav>
        </>
      )}
    </div>
  );
}
