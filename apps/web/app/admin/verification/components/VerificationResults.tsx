"use client";

import { useState } from "react";
import { Pagination } from "@heroui/react";
import VerificationTable from "./VerificationTable";
import VerificationCardList from "./VerificationCardList";
import type { VerificationRow } from "../lib/verification-display";

const PAGE_SIZE = 10;

interface VerificationResultsProps {
  rows: VerificationRow[];
  selected: "users" | "apartments" | "documents";
}

export default function VerificationResults({
  rows,
  selected,
}: VerificationResultsProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const firstVisiblePage = Math.max(1, Math.min(safePage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );
  return (
    <>
      <VerificationTable rows={visibleRows} selected={selected} />
      <VerificationCardList rows={visibleRows} selected={selected} />
      {totalPages > 1 ? (
        <nav
          aria-label="Verification pagination"
          className="flex justify-center"
        >
          <Pagination>
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={safePage <= 1}
                  onPress={() => setPage(safePage - 1)}
                  className="font-nunito text-primary"
                >
                  <Pagination.PreviousIcon />
                  <span>Previous</span>
                </Pagination.Previous>
              </Pagination.Item>
              {visiblePages.map((number) => (
                <Pagination.Item key={number}>
                  <Pagination.Link
                    isActive={number === safePage}
                    onPress={() => setPage(number)}
                  >
                    {number}
                  </Pagination.Link>
                </Pagination.Item>
              ))}
              <Pagination.Item>
                <Pagination.Next
                  isDisabled={safePage >= totalPages}
                  onPress={() => setPage(safePage + 1)}
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
  );
}
