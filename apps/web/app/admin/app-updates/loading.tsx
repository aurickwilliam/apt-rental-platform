import { Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="w-full space-y-5 p-4" aria-busy="true">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Skeleton className="h-11 w-56 rounded-lg bg-skeleton!" />
        <Skeleton className="h-10 w-40 rounded-full bg-skeleton!" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <Skeleton className="h-72 w-full rounded-3xl bg-skeleton!" />
        <div className="space-y-5">
          <Skeleton className="h-48 w-full rounded-3xl bg-skeleton!" />
          <Skeleton className="h-64 w-full rounded-3xl bg-skeleton!" />
          <Skeleton className="h-56 w-full rounded-3xl bg-skeleton!" />
        </div>
      </div>
    </div>
  );
}
