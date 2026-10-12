"use client";

import { Description, Pagination } from "@heroui/react";

const MAX_VISIBLE_PAGES = 5;

interface AdminListFooterProps {
  ariaLabel: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Result summary, e.g. "Showing 1–30 of 124 users". */
  summary: string;
}

export default function AdminListFooter({
  ariaLabel,
  page,
  totalPages,
  onPageChange,
  summary,
}: AdminListFooterProps) {
  const firstVisiblePage = Math.max(
    1,
    Math.min(page - 2, totalPages - (MAX_VISIBLE_PAGES - 1)),
  );
  const visiblePages = Array.from(
    { length: Math.min(MAX_VISIBLE_PAGES, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    // Three columns keep the pagination centered under the table while the
    // summary sits at the right edge; on phones they stack.
    <div className="flex flex-col items-center gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
      <nav aria-label={ariaLabel} className="sm:col-start-2">
        <Pagination>
          <Pagination.Content>
            <Pagination.Item>
              <Pagination.Previous
                isDisabled={page <= 1}
                onPress={() => onPageChange(page - 1)}
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
                  onPress={() => onPageChange(number)}
                >
                  {number}
                </Pagination.Link>
              </Pagination.Item>
            ))}
            <Pagination.Item>
              <Pagination.Next
                isDisabled={page >= totalPages}
                onPress={() => onPageChange(page + 1)}
                className="font-nunito text-primary"
              >
                <span>Next</span>
                <Pagination.NextIcon />
              </Pagination.Next>
            </Pagination.Item>
          </Pagination.Content>
        </Pagination>
      </nav>
      <Description
        aria-live="polite"
        className="text-sm text-muted-foreground sm:justify-self-end"
      >
        {summary}
      </Description>
    </div>
  );
}
