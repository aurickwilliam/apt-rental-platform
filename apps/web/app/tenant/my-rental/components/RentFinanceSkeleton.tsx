import { Skeleton } from "@heroui/react";

/** Shared geometry for the route fallback and the unresolved finance region. */
export default function RentFinanceSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading rent details" className="flex h-full min-h-56 min-w-0 flex-col gap-3 rounded-3xl bg-primary p-5 text-white">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-6 w-32 rounded-lg bg-white/25!" />
        <Skeleton className="h-6 w-24 rounded-full bg-white/20!" />
      </div>
      <Skeleton className="h-10 w-48 max-w-full rounded-lg bg-white/25!" />
      <Skeleton className="h-4 w-56 max-w-full rounded-md bg-white/20!" />
      <div className="mt-auto flex items-center gap-3 pt-4">
        <Skeleton className="h-11 flex-1 rounded-full bg-white/25!" />
        <Skeleton className="size-11 shrink-0 rounded-full bg-white/20!" />
      </div>
    </div>
  );
}
