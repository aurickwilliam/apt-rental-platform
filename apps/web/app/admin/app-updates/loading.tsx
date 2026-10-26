import { Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="w-full space-y-5 p-4" aria-busy="true">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Skeleton className="h-11 w-56 rounded-lg bg-skeleton!" />
        <Skeleton className="h-10 w-40 rounded-full bg-skeleton!" />
      </div>
      <Skeleton className="h-72 w-full rounded-3xl bg-skeleton!" />
    </div>
  );
}
