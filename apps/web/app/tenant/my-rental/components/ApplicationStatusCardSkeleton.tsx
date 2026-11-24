"use client";

import { Skeleton } from "@heroui/react";

// Mirrors ApplicationStatusCard: thumbnail, inline name + status chip,
// location, applied date, status summary and the details button.
export default function ApplicationStatusCardSkeleton() {
  return (
    <div className="flex min-h-40 flex-col overflow-hidden rounded-2xl border border-border bg-card sm:flex-row">
      <Skeleton className="h-36 w-full shrink-0 rounded-none bg-skeleton! sm:h-auto sm:w-32" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Skeleton className="h-6 w-full max-w-44 rounded-lg bg-skeleton!" />
          <Skeleton className="h-8 w-24 shrink-0 rounded-full bg-skeleton!" />
        </div>
        <Skeleton className="h-4 w-full max-w-md rounded-lg bg-skeleton!" />
        <Skeleton className="h-4 w-32 rounded-lg bg-skeleton!" />
        <Skeleton className="h-4 w-40 max-w-full rounded-lg bg-skeleton!" />
        <Skeleton className="mt-auto h-11 w-36 self-start rounded-full bg-skeleton!" />
      </div>
    </div>
  );
}
