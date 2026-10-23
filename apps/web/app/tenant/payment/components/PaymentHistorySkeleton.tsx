"use client";

import { Skeleton } from "@heroui/react";

// Loading state that mirrors the payment history page layout, so nothing
// moves when the data arrives. Same logic as the other page skeletons.
function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

function RowCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Sk className="h-4 w-32 rounded-lg" />
          <Sk className="h-3 w-40 max-w-full rounded-lg" />
          <Sk className="h-3 w-20 rounded-lg" />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Sk className="h-4 w-20 rounded-lg" />
          <Sk className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function PaymentHistorySkeleton() {
  return (
    <div
      className="min-h-screen bg-background"
      aria-busy="true"
      aria-label="Loading payment history"
    >
      <div className="px-4 py-6 sm:py-8">
        <div className="mb-4 flex flex-col gap-1">
          <Sk className="h-8 w-20 rounded-full" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Sk className="h-8 w-64 max-w-full rounded-lg" />
              <Sk className="h-4 w-80 max-w-full rounded-lg" />
            </div>
            <Sk className="h-8 w-24 shrink-0 rounded-full" />
          </div>
        </div>

        <Sk className="h-8 w-24 rounded-xl" />

        <div className="mt-4 grid gap-3">
          <RowCardSkeleton />
          <RowCardSkeleton />
          <RowCardSkeleton />
        </div>
      </div>
    </div>
  );
}
