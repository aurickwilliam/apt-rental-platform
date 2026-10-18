"use client";

import { Skeleton } from "@heroui/react";

// Mirrors ApplicationStatusCard: thumbnail, name + status chip, location,
// date, and the details button.
export default function ApplicationStatusCardSkeleton() {
  return (
    <div className="flex min-h-40 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
      <Skeleton className="h-40 w-full shrink-0 rounded-none bg-grey-300! sm:h-auto sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Skeleton className="h-6 w-44 rounded-lg bg-grey-300!" />
          <Skeleton className="h-8 w-24 rounded-full bg-grey-300!" />
        </div>
        <Skeleton className="h-4 w-full max-w-md rounded-lg bg-grey-300!" />
        <Skeleton className="h-4 w-32 rounded-lg bg-grey-300!" />
        <Skeleton className="mt-auto h-8 w-28 self-end rounded-full bg-grey-300!" />
      </div>
    </div>
  );
}
