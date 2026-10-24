"use client";

import { Skeleton } from "@heroui/react";

import PaymentsHeader from "./PaymentsHeader";

const TILE_COUNT = 4;
const ROW_COUNT = 4;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-skeleton! ${className}`} />;
}

// Stands in for the Needs attention button in the title row, at its height.
export function NeedsAttentionSkeleton() {
  return (
    <div aria-hidden="true">
      <Sk className="h-[3.75rem] w-72 rounded-2xl" />
    </div>
  );
}

// Mirrors the loaded body: summary tiles, then the tabs and table.
export function PaymentsBodySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading payments" className="space-y-4">
      <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: TILE_COUNT }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-5">
            <Sk className="h-5 w-28 rounded-lg" />
            <Sk className="h-9 w-32 rounded-lg" />
            <Sk className="h-4 w-36 rounded-lg" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Sk className="h-9 w-72 rounded-xl" />
          <Sk className="h-9 w-32 rounded-xl" />
        </div>
        <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <Sk key={index} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4" aria-busy="true" aria-label="Loading payments">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PaymentsHeader />
        <NeedsAttentionSkeleton />
      </div>
      <div aria-hidden="true" className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <Sk className="h-10 w-full rounded-xl" />
        </div>
        <Sk className="size-10 rounded-xl" />
      </div>
      <PaymentsBodySkeleton />
    </div>
  );
}
